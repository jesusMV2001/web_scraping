import { crearTablas, fetchData, executeQuery } from "./db/database.js"
import { iniciarServidor } from "./api/api.js";
import { comprobarUltimoCapitulo } from "./scraper/scraper.js"
import { enviarNotificacion } from "./bot/discordBot.js";

// Metodos de iniciación
crearTablas();
iniciarServidor();


async function verificarNuevosCapitulos() {
    //obtener todos los mangas de la bd
    const mangas = await fetchData(`SELECT * FROM manga`);

    //comprobar si hay un nuevo capitulo en cada manga
    for (let manga of mangas){
        let ultimo = await comprobarUltimoCapitulo(manga.url);
        if (manga.ultimoCap < ultimo){
            console.log("hay nuevo cap");
            await enviarNotificacion(manga.url,ultimo);
            try{
                await executeQuery(
                    `UPDATE manga SET ultimoCap = ? WHERE url = ?`, // sentencia sql
                    [ultimo, manga.url] // Parametros marcados con ?
                );
            }catch(error){
                console.error(error)
            }
            
        }else
            console.log("no hay nuevo cap");
    }
}

// llama a la funcion cada hora
verificarNuevosCapitulos();
setInterval(verificarNuevosCapitulos, 1000 * 60 * 60);