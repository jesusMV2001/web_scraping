import sqlite3 from "sqlite3";
import { execute } from "./sql.js";

const db = new sqlite3.Database("my.db");

export const crearTablas = async () => {
  try {
    await execute(
      db,
      `CREATE TABLE IF NOT EXISTS manga (
        url TEXT PRIMARY KEY,
        ultimoCap DECIMAL(10, 2)
      )`
    );
    await execute(
      db, 
      `CREATE TABLE IF NOT EXISTS usuario(
        id TEXT PRIMARY KEY
      )`
    );
    await execute(
      db,
      `CREATE TABLE IF NOT EXISTS manga_usuario (
        manga_url TEXT,
        usuario_id TEXT,
        PRIMARY KEY (manga_url, usuario_id),
        FOREIGN KEY (manga_url) REFERENCES manga(url),
        FOREIGN KEY (usuario_id) REFERENCES usuario(id)
      )`
    );
  } catch (error) {
    console.log(error);
  }
};

export const fetchData = async (sql, params) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
};

export const executeQuery = async (sql, params) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes); // Devuelve el número de filas afectadas
      }
    });
  });
};
