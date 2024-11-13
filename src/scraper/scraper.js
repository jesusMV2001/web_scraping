import CSSKey from './CSSKey.json' with { type: "json"};// elemento CSS en cada pagina para poder encontrar el ultimo cap

export async function comprobarUltimoCapitulo(page, url) {
    try {
        const nombrePag = url.trim().split('/')[2];
        await page.goto(url, { waitUntil: CSSKey[nombrePag].waitUntil });
        const ultimoCap = await page.$eval(CSSKey[nombrePag].css, el => el.textContent);
        return ultimoCap.match(/\d+(\.\d+)?/)[0];
    } catch (error) {
        console.log(error);
        return "-1";
    }
}

