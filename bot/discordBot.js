import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder  } from 'discord.js';
import CREDENCIALES from '../etc/secrets/credencialesBot.json' with {type: "json"}
import { executeQuery, fetchData } from '../db/database.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const TOKEN = CREDENCIALES.TOKEN;
const CHANNEL_ID = CREDENCIALES.CHANNEL_ID; // ID del canal de Discord donde se enviarán las notificaciones

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
    .setDescription('ver todos los mangas disponibles'),
];

const rest = new REST({ version: '10' }).setToken(CREDENCIALES.TOKEN);
(async () => {
  try {
    console.log('Actualizando comandos de aplicación (/)');
    await rest.put(
      Routes.applicationCommands(CREDENCIALES.ID_CLIENTE),
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
        // Llama a la función de base de datos para añadir el manga
        let cambios = await executeQuery(`INSERT INTO manga (url, ultimoCap) VALUES (?, ?)`, [url, ultimoCap]);
        // si se añade lo indica al usuario, sino es porque ya existia ese manga
        if (cambios > 0) 
          mensaje += `Manga añadido: ${url} con capítulo ${ultimoCap}\n` ;

        // ahora hay que suscribir al usuario para las notificaiones
        //primero comprobar si ese usuario esta en la tabla usuario
        let existeUsuario = await fetchData(`SELECT id FROM usuario WHERE id=${userId}`);
        if(existeUsuario.length === 0){
          await executeQuery(`INSERT INTO usuario (id) VALUES (?)`, [userId]);
          mensaje += `Se te ha añadido a la base de usuarios\n`;
        }
        //ahora crear la relacion
        cambios = await executeQuery(`INSERT INTO manga_usuario (manga_url, usuario_id) VALUES (?, ?)`, [url, userId]);
        if(cambios > 0) mensaje += `<@${userId}> se te notificará cuando haya un nuevo capítulo`;
        await interaction.reply(mensaje)

      } catch (error) {
        console.error(error);
        await interaction.reply('Hubo un error al añadir el manga. Probablemente ya este añadido, usa el comando verMangas para comprobarlo.');
      }
      break;

    case 'borrarmanga':
      const urlBorrar = interaction.options.getString('url');
      mensaje = '';

      try {
        let sql = `DELETE FROM manga WHERE url=?`
        let cambios = await executeQuery(sql, [urlBorrar]);
        if (cambios > 0) 
          mensaje += `Manga borrado: ${urlBorrar}\n`;
        
        sql = `DELETE FROM manga_usuario WHERE manga_url=?`
        cambios = await executeQuery(sql, [urlBorrar]);
        if (cambios > 0) 
          await interaction.reply(mensaje);
      } catch (error) {
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
        await interaction.reply('Hubo un error al mostrar los mangas.');
      }
      break;
  }
});

client.login(TOKEN);