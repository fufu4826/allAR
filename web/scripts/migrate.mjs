import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

let connection;
try {
  connection = await mysql.createConnection(process.env.DATABASE_URL);
  await migrate(drizzle(connection), { migrationsFolder: "./drizzle" });
  console.log("migrations applied");
} catch (error) {
  // Message only: never print DATABASE_URL.
  console.error(`migration failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  if (connection) await connection.end();
}
