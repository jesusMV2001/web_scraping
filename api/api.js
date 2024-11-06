import express from "express"
import { fetchData, insertData } from "../db/database.js";

const app = express();
const PORT = 3000;
app.use(express.json());

export function iniciarServidor(){
    app.listen(PORT, () => {
        console.log(`Servidor esperando en el puerto ${PORT}`);
    });
}

app.get('/mangas', async (req, res) =>{
    await fetchData(res, `SELECT * FROM manga`);
});

app.post('/mangas', async (req, res) => {
    const { url, ultimoCap} = req.body;
    const sql = `INSERT INTO manga (url, ultimoCap) VALUES (?, ?)`;

    await insertData(res, sql, [url, ultimoCap]);
});