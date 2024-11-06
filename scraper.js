import { launch } from 'puppeteer';
import CSSKey from './CSSKey.json' with { type: "json"};// elemento CSS en cada pagina para poder encontrar el ultimo cap 

async function comprobarUltimoCapitulo(url) {
    let browser, ultimoCap;
    try{
        browser = await launch();
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        //obtiene el ultimo capitulo
        let nombrePag = url.trim().split('/')[2];
        ultimoCap = await page.$eval(CSSKey[nombrePag], el => el.textContent);
        
    }catch (error){
        console.log(error);
        ultimoCap = -1;
    }finally{
        await browser.close();
    }
    return ultimoCap;
}

export default comprobarUltimoCapitulo;