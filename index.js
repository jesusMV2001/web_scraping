import { crearTablas, fetchData } from "./db/database.js"
import { iniciarServidor } from "./api/api.js";
import { comprobarUltimoCapitulo } from "./scraper.js"

// Metodos de iniciación
crearTablas();
iniciarServidor();


async function verificarNuevosCapitulos() {
    //obtener todos los mangas de la bd
    const mangas = await fetchData(`SELECT * FROM manga`);

    //comprobar si hay un nuevo capitulo en cada manga
    for (let manga of mangas){
        console.log(manga);
        if (manga.ultimoCap < await comprobarUltimoCapitulo(manga.url))
            console.log("hay nuevo cap");
        else
            console.log("no hay nuevo cap");
    }
}

// llama a la funcion cada hora
setInterval(verificarNuevosCapitulos, 1000 * 60 * 60);