import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { sql } from "drizzle-orm";
import * as schema from "../../src/db/schema";
import { __setDbForTests, type DB } from "../../lib/db";

const ALL_TABLES = [
  "users", "wallets", "transactions", "transaction_items", "bank_info",
  "addresses", "bio_data", "groups", "group_members", "invitations",
  "notifications", "requests", "scheduled_payments", "challenges",
  "user_challenge_progress", "otps",
];

let client: PGlite;
let testDb: ReturnType<typeof drizzle<typeof schema>>;

export async function initTestDb() {
  client = new PGlite();
  testDb = drizzle(client, { schema });
  await migrate(testDb, { migrationsFolder: "./src/db/migrations" });
  __setDbForTests(testDb as unknown as DB);
  return testDb;
}

export function getTestDb() {
  return testDb;
}

export async function resetDb() {
  await testDb.execute(
    sql.raw(`TRUNCATE ${ALL_TABLES.join(", ")} RESTART IDENTITY CASCADE`)
  );
}

export async function closeTestDb() {
  await client.close();
}
