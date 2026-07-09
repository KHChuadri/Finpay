import { describe, it, expect, beforeEach } from "vitest";
import { requestRepository as repo } from "../../../src/modules/request/request.repository";
import { createTestUser } from "../../helpers/testFactories";
import { getDb } from "../../../lib/db";
import { requests, transactions } from "../../../src/db/schema";

// Characterization tests locking the exact legacy response shape for the two
// list endpoints migrated from src/transactions/getRequestList.ts and
// src/savedRecipient.ts.
describe("requestRepository list shapes", () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;

  beforeEach(async () => {
    user = await createTestUser({ email: "requester@test.com" });
  });

  describe("findRequestsByIds", () => {
    it("returns the legacy flat shape: requestId/senderEmail/requestDate/amount/currency/notes", async () => {
      const date = new Date();
      const [doc] = await getDb()
        .insert(requests)
        .values({
          userId: user.id,
          senderEmail: "sender@test.com",
          currency: "AUD",
          amount: "50",
          notes: "lunch",
          date,
        })
        .returning();

      const list = await repo.findRequestsByIds([doc.id]);

      expect(list).toEqual([
        {
          requestId: doc.id,
          senderEmail: "sender@test.com",
          requestDate: date,
          amount: 50,
          currency: "AUD",
          notes: "lunch",
        },
      ]);
    });
  });

  describe("findSavedRecipients", () => {
    it("returns the legacy flat shape: email/firstName/lastName, deduped by email", async () => {
      const recipient = await createTestUser({
        email: "recipient@test.com",
        firstName: "Wesly",
        lastName: "Yang",
      });

      const baseTx = {
        amountSrc: "10",
        currencySource: "AUD",
        amountDest: "10",
        currencyDest: "AUD",
        fromAccount: user.id,
        toAccount: recipient.id,
        fromAccountEmail: user.email,
        toAccountEmail: recipient.email,
        fromAccountId: user.id,
        toAccountId: recipient.id,
        description: "P2P Transfer",
      };

      // Two transactions to the same recipient to verify de-duplication.
      await getDb().insert(transactions).values(baseTx);
      await getDb().insert(transactions).values({ ...baseTx, amountSrc: "20", amountDest: "20" });

      const recipients = await repo.findSavedRecipients(user.id);

      expect(recipients).toEqual([
        {
          email: "recipient@test.com",
          firstName: "Wesly",
          lastName: "Yang",
        },
      ]);
    });
  });
});
