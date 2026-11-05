import "server-only";

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & { dbPool?: mysql.Pool };
const pool = globalForDb.dbPool ?? mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 10, charset: "utf8mb4" });
if (process.env.NODE_ENV !== "production") globalForDb.dbPool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
