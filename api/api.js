import express from "express";
import { deleteData, fetchData, executeQuery } from "../db/database.js";

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
    const id = await executeQuery(sql, [url, ultimoCap]);
    res.status(201).json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// actualizar manga
app.patch('/mangas/:url', async (req, res) => {
  const { url } = req.params;
  const { ultimoCap } = req.body;
  const sql = `UPDATE manga SET ultimoCap = ? WHERE url = ?`;

  try {
    const changes = await executeQuery(sql, [ultimoCap, url]);
    if (changes > 0) {
      res.status(200).json({ message: "Capítulo actualizado correctamente" });
    } else {
      res.status(404).json({ message: "Manga no encontrado o no actualizado" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/mangas/:url', async (req, res) => {
  const { url } = req.params;

  try {
    const cambios = await deleteData(url);
    if (cambios > 0) {
      res.status(200).json({ message: "Manga eliminado correctamente" });
    } else {
      res.status(404).json({ message: "Manga no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



export function iniciarServidor() {
  app.listen(PORT, () => {
    console.log(`Servidor esperando en el puerto ${PORT}`);
  });
}
