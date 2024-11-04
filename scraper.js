import { launch } from 'puppeteer';
import CSSKey from './CSSKey.json' with { type: "json"};// elemento CSS en cada pagina para poder encontrar el ultimo cap 

const url1 = 'https://zonatmo.com/library/manhwa/71354/jugador-que-regreso-10000-anos-despues';
const url2 = 'https://zonaolympus.com/series/comic-sabueso13424'

async function comprobarUltimoCapitulo(url, pagina) {
    let browser;
    try{
        browser = await launch();
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        //obtiene el ultimo capitulo
        const ultimoCap = await page.$eval(CSSKey[pagina], el => el.textContent);
        console.log(ultimoCap)
        
    }catch (error){
        console.log(error);
    }finally{
        await browser.close();
    }
}

function obtenerPagina(url) {
    let nombrePagina = url.trim().split('/')[2];
    comprobarUltimoCapitulo(url,nombrePagina);
}

obtenerPagina(url2);