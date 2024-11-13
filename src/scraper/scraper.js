import { launch } from 'puppeteer';
import CSSKey from './CSSKey.json' with { type: "json"};// elemento CSS en cada pagina para poder encontrar el ultimo cap 

export async function comprobarUltimoCapitulo(page, url) {
    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        const nombrePag = url.trim().split('/')[2];
        const ultimoCap = await page.$eval(CSSKey[nombrePag], el => el.textContent);
        return ultimoCap.match(/\d+(\.\d+)?/)[0];
    } catch (error) {
        console.log(error);
        return "-1";
    }
}

