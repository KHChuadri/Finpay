import { describe, it, expect } from "vitest";
import { getTestDb } from "./pgTestDb";
import { users } from "../../src/db/schema";

describe("PGlite harness", () => {
  it("migrates and round-trips a row", async () => {
    const db = getTestDb();
    const [u] = await db
      .insert(users)
      .values({ firstName: "A", lastName: "B", email: "smoke@x.com", password: "h" })
      .returning();
    expect(u.id).toBeTruthy();
    expect(u.rank).toBe("bronze");
  });
});
