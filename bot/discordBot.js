import { Client, GatewayIntentBits } from 'discord.js';
import CREDENCIALES from './credencialesBot.json' with {type: "json"}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const TOKEN = CREDENCIALES.TOKEN;
const CHANNEL_ID = CREDENCIALES.CHANNEL_ID; // ID del canal de Discord donde se enviarán las notificaciones

client.once('ready', () => {
  console.log(`Bot de Discord conectado como ${client.user.tag}`);
});

export async function enviarNotificacion(url, ultimoCap) {
    try {
      const channel = await client.channels.fetch(CHANNEL_ID);
      await channel.send(`¡Nuevo capítulo disponible! **${url}**: Capítulo ${ultimoCap}`);
    } catch (error) {
      console.error("Error al enviar la notificación de Discord:", error);
    }
}
  
client.login(TOKEN);