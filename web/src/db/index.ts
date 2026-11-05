import "server-only";

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & { dbPool?: mysql.Pool };

function createPool() {
  // Drizzle writes timestamps as UTC strings, while columns with DEFAULT now() take the
  // session time zone. Pin every connection to UTC so both agree whatever the server's
  // TZ is (session expiry and the 15-minute login lockout depend on it).
  const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 10, charset: "utf8mb4", timezone: "Z" });
  pool.pool.on("connection", (connection) => {
    connection.query("SET time_zone = '+00:00'");
  });
  return pool;
}

const pool = globalForDb.dbPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.dbPool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
