import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;

let override: DB | null = null;
export function __setDbForTests(d: DB) {
  override = d;
}
export function getDb(): DB {
  return override ?? db;
}
