import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder  } from 'discord.js';
import CREDENCIALES from './credencialesBot.json' with {type: "json"}
import { executeQuery, deleteData, fetchData } from '../db/database.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const TOKEN = CREDENCIALES.TOKEN;
const CHANNEL_ID = CREDENCIALES.CHANNEL_ID; // ID del canal de Discord donde se enviarán las notificaciones

client.once('ready', () => {
  console.log(`Bot de Discord conectado como ${client.user.tag}`);
});

export async function enviarNotificacion(url, ultimoCap) {
    try {
      const userId = '395587954212601856';
      const channel = await client.channels.fetch(CHANNEL_ID);
      await channel.send(`<@${userId}> ¡Nuevo capítulo disponible! **${url}**: Capítulo ${ultimoCap}`);
    } catch (error) {
      console.error("Error al enviar la notificación de Discord:", error);
    }
}

const commands = [
  new SlashCommandBuilder()
    .setName('añadir')
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
    .setName('borrar')
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

  switch (commandName) {
    case 'añadir':
      const url = interaction.options.getString('url');
      const ultimoCap = interaction.options.getNumber('ultimocap');
      
      try {
        // Llama a la función de base de datos para añadir el manga
        const cambios = await executeQuery(`INSERT INTO manga (url, ultimoCap) VALUES (?, ?)`, [url, ultimoCap]);
        if (cambios > 0) 
          await interaction.reply(`Manga añadido: ${url} con capítulo ${ultimoCap}`);
      } catch (error) {
        console.error(error);
        await interaction.reply('Hubo un error al añadir el manga. Probablemente ya este añadido, usa el comando verMangas para comprobarlo.');
      }
      break;

    case 'borrar':
      const urlBorrar = interaction.options.getString('url');

      try {
        const cambios = await deleteData(urlBorrar);
        if (cambios > 0) {
          await interaction.reply(`Manga borrado: ${urlBorrar}`);
        } else {
          await interaction.reply('No existe un manga con esa url.');
        }
      } catch (error) {
        await interaction.reply('Hubo un error al borrar el manga.');
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