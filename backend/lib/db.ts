import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;

/** A Drizzle transaction handle (the arg passed to `db.transaction(cb)`). */
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
/** Either the root db or an in-flight transaction — repo methods accept this. */
export type DbOrTx = DB | Tx;

let override: DB | null = null;
export function __setDbForTests(d: DB) {
  override = d;
}
export function getDb(): DB {
  return override ?? db;
}
