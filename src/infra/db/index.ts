// ─── Database connection singleton ─────────────────────────────────────────

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DB_PATH =
  process.env.DATABASE_URL ?? "file:./data/padel.db";

// Strip file: prefix for better-sqlite3
const filePath = DB_PATH.replace(/^file:/, "");

const sqlite = new Database(filePath);

// Enable WAL mode for better concurrent reads
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { schema };
