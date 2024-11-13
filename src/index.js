import { crearTablas, fetchData, executeQuery } from "./db/database.js"
import { iniciarServidor } from "./api/api.js";
import { comprobarUltimoCapitulo } from "./scraper/scraper.js"
import { enviarNotificacion } from "./bot/discordBot.js";
import {launch} from "puppeteer";

// Metodos de iniciación
crearTablas();
iniciarServidor();


export async function verificarManga(browser, manga) {
    const page = await browser.newPage();
    const ultimo = await comprobarUltimoCapitulo(page, manga.url);
    await page.close();

    if (manga.ultimoCap < ultimo) {
        console.log("hay nuevo cap");
        const listaUsuarios = await fetchData(`SELECT usuario_id FROM manga_usuario WHERE manga_url=?`, [manga.url]);
        await enviarNotificacion(manga.url, ultimo, listaUsuarios);
        await executeQuery(`UPDATE manga SET ultimoCap = ? WHERE url = ?`, [ultimo, manga.url]);
    } else {
        console.log("no hay nuevo cap");
    }
}

export async function verificarNuevosCapitulos() {
    const mangas = await fetchData(`SELECT * FROM manga`);
    let browser;

    try {
        browser = await launch()
        for (const manga of mangas) {
            await verificarManga(browser, manga);
        }
    }catch (error) {
        console.log(error);
    }finally {
        await browser.close();
    }
}


// llama a la funcion cada hora
setInterval(verificarNuevosCapitulos, 1000 * 60 * 60);