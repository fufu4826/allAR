import { randomBytes } from "node:crypto";
import { Algorithm, hash } from "@node-rs/argon2";
import mysql from "mysql2/promise";
const [username, displayName] = process.argv.slice(2);
if (!username || username.length > 64 || !displayName || displayName.length > 120) throw new Error("Usage: node scripts/create-admin.mjs <username> <display name>");
let password = process.env.ADMIN_PASSWORD;
if (password === undefined) {
  if (!process.stdin.isTTY) throw new Error("Set ADMIN_PASSWORD for non-interactive use");
  process.stdout.write("Password: ");
  process.stdin.setRawMode(true);
  password = await new Promise((resolve, reject) => {
    let value = "";
    process.stdin.on("data", function read(chunk) {
      for (const ch of chunk.toString()) {
        if (ch === "\u0003") { process.stdin.off("data", read); reject(new Error("Cancelled")); return; }
        if (ch === "\r" || ch === "\n") { process.stdin.off("data", read); resolve(value); return; }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1); else value += ch;
      }
    });
  }).finally(() => { process.stdin.setRawMode(false); process.stdout.write("\n"); });
}
if (password.length < 12 || password.length > 128) throw new Error("Invalid password length");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute("SELECT id FROM admins WHERE username = ? LIMIT 1", [username]);
  if (rows.length) throw new Error("Username already exists");
  const passwordHash = await hash(password, { algorithm: Algorithm.Argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  await connection.execute("INSERT INTO admins (id, username, display_name, password_hash) VALUES (?, ?, ?, ?)", [randomBytes(16).toString("hex"), username, displayName, passwordHash]);
  console.log(`admin created: ${username}`);
} finally { await connection.end(); }
