import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder  } from 'discord.js';
import { executeQuery, fetchData } from '../db/database.js';
import {verificarManga} from "../index.js";
import {launch} from "puppeteer";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const TOKEN = process.env.TOKEN
const CHANNEL_ID = process.env.CHANNEL_ID // ID del canal de Discord donde se enviarán las notificaciones

client.once('ready', () => {
  console.log(`Bot de Discord conectado como ${client.user.tag}`);
});

export async function enviarNotificacion(url, ultimoCap, usuarios) {
  let mensaje = '';
    try {
      const channel = await client.channels.fetch(CHANNEL_ID);
      mensaje += `¡Nuevo capítulo disponible! **${url}**: Capítulo ${ultimoCap}\n`;
      for (let user of usuarios){
        mensaje += `<@${user.usuario_id}>`;
      }
      await channel.send(mensaje);
    } catch (error) {
      console.error("Error al enviar la notificación de Discord:", error);
    }
}

const commands = [
  new SlashCommandBuilder()
      .setName('comandos')
      .setDescription('Muestra todos los comandos del bot.'),
  new SlashCommandBuilder()
    .setName('añadirmanga')
    .setDescription('Añadir un nuevo manga a la base de datos')
    .addStringOption(option => 
      option.setName('url')
        .setDescription('URL del manga')
        .setRequired(true))
    .addNumberOption(option => 
      option.setName('ultimocap')
        .setDescription('Número del último capítulo')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('borrarmanga')
    .setDescription('Borrar un manga de la base de datos')
    .addStringOption(option => 
      option.setName('url')
        .setDescription('URL del manga a borrar')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('vermangas')
    .setDescription('Ver todos los mangas disponibles en la base de datos'),
  new SlashCommandBuilder()
      .setName('verseguidos')
      .setDescription('Ver todos los mangas que sigue el usuario'),
  new SlashCommandBuilder()
      .setName('comprobar')
      .setDescription('Comprueba si ha salido algun episodio nuevo'),
  new SlashCommandBuilder()
    .setName("follow")
    .setDescription('Seguir un manga para recibir notificaciones')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('URL del manga a seguir')
        .setRequired(true)),
  new SlashCommandBuilder()
      .setName("unfollow")
      .setDescription('Dejar de seguir un manga, para dejar de recibir notificaciones')
      .addStringOption(option =>
          option.setName('url')
              .setDescription('URL del manga')
              .setRequired(true)),
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
  try {
    console.log('Actualizando comandos de aplicación (/)');
    await rest.put(
      Routes.applicationCommands(process.env.ID_CLIENTE),
      { body: commands }
    );
    console.log('Comandos registrados con éxito.');
  } catch (error) {
    console.error(error);
  }
})();
  
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  const userId = interaction.user.id;
  let mensaje = '';

  switch (commandName) {
    case 'añadirmanga':
      const url = interaction.options.getString('url');
      const ultimoCap = interaction.options.getNumber('ultimocap');
      mensaje = '';

      try {
        // Primero comprobar si es un url valido
        if(!isValidUrl(url)) return await interaction.reply("Introduce un url válido.");
        // Llama a la función de base de datos para añadir el manga
        let cambios = await executeQuery(`INSERT INTO manga (url, ultimoCap) VALUES (?, ?)`, [url, ultimoCap]);
        // si se añade lo indica al usuario, sino es porque ya existia ese manga
        if (cambios > 0) 
          mensaje += `Manga añadido: ${url} con capítulo ${ultimoCap}\n` ;

        // ahora hay que suscribir al usuario para las notificaiones
        //primero comprobar si ese usuario esta en la tabla usuario
        mensaje += await comprobarUsuario(userId);

        //ahora crear la relacion
        cambios = await executeQuery(`INSERT INTO manga_usuario (manga_url, usuario_id) VALUES (?, ?)`, [url, userId]);
        if(cambios > 0) mensaje += `<@${userId}> se te notificará cuando haya un nuevo capítulo`;
        await interaction.reply(mensaje)

      }catch (error) {
        if (error.message.includes("UNIQUE constraint failed")) {
          return interaction.reply("Ya existe ese manga.");
        } else {
          console.error(error);
          return interaction.reply('Hubo un error al añadir el manga. '+error);
        }
      }

      break;

    case 'borrarmanga':
      const urlBorrar = interaction.options.getString('url');
      mensaje = '';

      try {
        // Primero comprobar si existe el manga en la bd
        if(  ! await comprobarManga(urlBorrar, interaction)) break;

        // Despues borrar el manga de la bd
        let sql = `DELETE FROM manga WHERE url=?`
        let cambios = await executeQuery(sql, [urlBorrar]);
        if (cambios > 0) 
          mensaje += `Manga borrado: ${urlBorrar}\n`;

        // Por último borrar todas las relaciones de ese manga con usuarios
        sql = `DELETE FROM manga_usuario WHERE manga_url=?`
        executeQuery(sql, [urlBorrar]).then(interaction.reply(mensaje));
      }catch (error) {
        await interaction.reply('Hubo un error al borrar el manga.'+error);
      }
      break;

    case 'vermangas':
      try {
        // Llama a la función para obtener todos los mangas de la base de datos
        const mangas = await fetchData(`SELECT * FROM manga`);
  
        // Formatea los resultados en un solo mensaje
        const mensaje = mangas.map(manga => `URL: ${manga.url}, Último capítulo: ${manga.ultimoCap}`).join('\n');
        
        // Envía el mensaje en Discord
        await interaction.reply(mensaje || 'No hay mangas en la base de datos.');
      } catch (error) {
        console.error(error);
        await interaction.reply('Hubo un error al mostrar los mangas. '+error);
      }
      break;

    case 'follow':
      try {
        const url = interaction.options.getString('url');
        mensaje = '';

        // Primero comprueba si el usuario esta en la base de datos
        mensaje += await comprobarUsuario(userId);

        // Ahora hay que comprobar si el manga existe
        if(  ! await comprobarManga(url, interaction)) break;

        //después se añade a la tabla de manga_usuario
        await executeQuery(`INSERT INTO manga_usuario (manga_url, usuario_id) VALUES (?, ?)`, [url, userId]);
        await interaction.reply(mensaje+`<@${userId}> se te notificará cuando haya un episodio.`);
      }catch (error) {
        if (error.message.includes("UNIQUE constraint failed")) {
          return interaction.reply("Ya seguías ese manga, no puedes volver a seguirlo.");
        } else {
          console.error(error);
          return interaction.reply('Hubo un error al seguir el manga.');
        }
      }
      break;

    case 'unfollow':
      try {
        const url = interaction.options.getString('url');
        mensaje = '';

        // Primero comprueba si el usuario esta en la base de datos
        mensaje += await comprobarUsuario(userId);

        // Ahora hay que comprobar si el manga existe
        if(  ! await comprobarManga(url, interaction)) break;

        // Despues de asegurarse que existe borrar la relacion
        let sql = `DELETE FROM manga_usuario WHERE manga_url=?`
        executeQuery(sql, [url]).then(value => {
          if(value === 0)
            interaction.reply(mensaje+ 'No seguias este manga.');
          else
            interaction.reply(mensaje+ `Has dejado de seguir el manga: ${url}`);
        });
      }catch(error){
        console.error(error);
        await interaction.reply('Hubo un error al dejar de seguir el manga. '+error);
      }
      break;

    case 'verseguidos':
      try {
        // Llama a la función para obtener todos los mangas de la base de datos
        const mangas = await fetchData(`SELECT * FROM manga_usuario WHERE usuario_id=?`,[userId]);

        // Formatea los resultados en un solo mensaje
        const mensaje = mangas.map(manga => `URL: ${manga.url}`).join('\n');

        // Envía el mensaje en Discord
        await interaction.reply(mensaje || 'No sigues ningún manga.');
      } catch (error) {
        console.error(error);
        await interaction.reply('Hubo un error al mostrar los mangas. '+error);
      }
      break;

    case 'comprobar':
      let browser;
      try {
        await interaction.reply("Iniciando la comprobación de mangas...");
        const mangas = await fetchData(`SELECT * FROM manga`);
        let mangasComprobados=0;
        const totalMangas = mangas.length;
        browser = await launch({headless:true});

        const promesas = mangas.map(async (manga) =>{
          await verificarManga(browser, manga);

          mangasComprobados++;

          // Calcular el porcentaje y la barra de progreso
          const porcentaje = Math.round((mangasComprobados / totalMangas) * 100);
          const progreso = Math.floor(porcentaje / 10); // Cada 10% un bloque
          const barra = "█".repeat(progreso) + "░".repeat(10 - progreso); // Lleno vs vacío

          // Actualizar el mensaje de progreso cada ciertos mangas para no sobrecargar
          if (mangasComprobados % 2 === 0 || mangasComprobados === totalMangas) {
            await interaction.editReply(`Comprobando... [${barra}] ${porcentaje}% (${mangasComprobados}/${totalMangas})`);
          }
        });

        await Promise.all(promesas);
      }catch(error){
        console.error(error);
        await interaction.reply('Hubo un error al comprobar el manga. '+error);
      }finally {
        await browser.close();
      }
      break;

    case 'comandos':
      mensaje='';
      try {
        commands.forEach((command) => {
          mensaje+=`/${command.name}: ${command.description}\n`;
        })
        await interaction.reply(mensaje);
      }catch (error) {
        console.error(error);
        await interaction.reply('Hubo un error al mostrar los comandos: '+error);
      }
      break;
  }
});

/**
 * Comprueba si existe en la base y sino lo añade
 *
 * @return {Promise<string>} devuelve el mensaje indicando si se a añadido el usuario
 */
async function comprobarUsuario(userId) {
  let existeUsuario = await fetchData(`SELECT id FROM usuario WHERE id=${userId}`);
  if (existeUsuario.length === 0) {
    await executeQuery(`INSERT INTO usuario (id) VALUES (?)`, [userId]);
    return `Se te ha añadido a la base de usuarios\n`;
  }
  return '';
}

/**
 * Comprueba si existe el manga en la bd
 *
 * @returns {Promise<boolean>} true si existe sino false
 */
async function comprobarManga(url, interaction){
  let existeManga = await fetchData(`SELECT url FROM manga WHERE url=?`,[url]);
  if(existeManga.length === 0) {
    await interaction.reply("No existe ese manga en la base de datos");
    return false;
  }
  return true;
}

const isValidUrl = urlString=> {
  const urlPattern = new RegExp('^(https?:\\/\\/)?' + // validate protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator
  return !!urlPattern.test(urlString);
}

client.login(TOKEN);