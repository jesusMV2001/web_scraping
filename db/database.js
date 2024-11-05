import sqlite3 from "sqlite3";
import { execute } from "./sql.js";

export const crearTablas = async () => {
  const db = new sqlite3.Database("my.db");
  try {
    await execute(
      db,
      `CREATE TABLE IF NOT EXISTS manga (
        id INTEGER PRIMARY KEY,
        url TEXT NOT NULL,
        ultimoCap DECIMAL(10, 2))`
    );
  } catch (error) {
    console.log(error);
  } finally {
    db.close();
  }
};

