import { afterAll, afterEach, beforeAll } from "vitest";
import { initTestDb, resetDb, closeTestDb } from "./pgTestDb";

beforeAll(async () => {
  await initTestDb();
});

afterEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeTestDb();
});
