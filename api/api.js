import express from "express";
import { fetchData, insertData } from "../db/database.js";

const app = express();
const PORT = 3000;
app.use(express.json());

app.get('/mangas', async (req, res) => {
  try {
    const mangas = await fetchData(`SELECT * FROM manga`);
    res.json(mangas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/mangas', async (req, res) => {
  const { url, ultimoCap } = req.body;
  const sql = `INSERT INTO manga (url, ultimoCap) VALUES (?, ?)`;

  try {
    const id = await insertData(sql, [url, ultimoCap]);
    res.status(201).json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// actualizar manga
app.patch('/mangas/:url', (req, res) =>{
  const { url } = req.params;
  const { ultimoCap } = req.body;
  const sql = `UPDATE manga SET ultimoCap = ? WHERE url = ?`

  try{
    insertData(sql, [ultimoCap, url]);
  }catch (error){
    res.status(500).json({ error: error.message });
  }
});

/*
app.delete('/mangas/:id', (req, res) => {

});
*/

export function iniciarServidor() {
  app.listen(PORT, () => {
    console.log(`Servidor esperando en el puerto ${PORT}`);
  });
}
