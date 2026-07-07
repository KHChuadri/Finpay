import { describe, it, expect, beforeEach } from "vitest";
import { requestRepository as repo } from "../../../src/modules/request/request.repository";
import { createTestUser } from "../../helpers/testFactories";
import { UserType } from "../../../model/User";
import RequestModel from "../../../model/Request";
import TransactionHistory from "../../../model/TransactionHistory";

// Characterization tests locking the exact legacy response shape for the two
// list endpoints migrated from src/transactions/getRequestList.ts and
// src/savedRecipient.ts. Neither legacy handler returns a raw Mongoose doc
// (both hand-flatten fields), but the migration must not further rename or
// drop any of those hand-picked fields.
describe("requestRepository list shapes", () => {
  let user: UserType;

  beforeEach(async () => {
    user = await createTestUser({ email: "requester@test.com" });
  });

  describe("findRequestsByIds", () => {
    it("returns the legacy flat shape: requestId/senderEmail/requestDate/amount/currency/notes", async () => {
      const date = new Date();
      const doc = await RequestModel.create({
        userId: user._id,
        senderEmail: "sender@test.com",
        currency: "AUD",
        amount: 50,
        notes: "lunch",
        date,
      });

      const list = await repo.findRequestsByIds([doc._id.toString()]);

      expect(list).toEqual([
        {
          requestId: doc._id.toString(),
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
        amountSrc: 10,
        currencySource: "AUD",
        amountDest: 10,
        currencyDest: "AUD",
        fromAccount: user._id,
        toAccount: recipient._id,
        fromAccountEmail: user.email,
        toAccountEmail: recipient.email,
        fromAccountId: user._id.toString(),
        toAccountId: recipient._id.toString(),
        description: "P2P Transfer",
      };

      // Two transactions to the same recipient to verify de-duplication.
      await TransactionHistory.create(baseTx);
      await TransactionHistory.create({ ...baseTx, amountSrc: 20, amountDest: 20 });

      const recipients = await repo.findSavedRecipients(user._id.toString());

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
