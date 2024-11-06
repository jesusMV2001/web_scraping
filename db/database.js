import sqlite3 from "sqlite3";
import { execute } from "./sql.js";

const db = new sqlite3.Database("my.db");

export const crearTablas = async () => {
  try {
    await execute(
      db,
      `CREATE TABLE IF NOT EXISTS manga (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        ultimoCap DECIMAL(10, 2))`
    );
  } catch (error) {
    console.log(error);
  }
};

export const fetchData = async ( res, sql) => {
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
};

export const insertData = async ( res, sql, params) => {
  db.run(sql, params ,
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(201).json({ id: this.lastID });
      }
    }
  );
}