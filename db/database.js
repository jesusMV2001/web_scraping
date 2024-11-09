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
  } catch (error) {
    console.log(error);
  }
};

// Función generica para realizar queries y devolver una promesa
export const fetchData = async (sql) => {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
};

export const insertData = async (sql, params) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      resolve(this.lastID);
    });
  });
};
