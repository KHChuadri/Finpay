// Composition root for the bank-integration slice: wires the real repository
// and the Zai (assemblypay/promisepay) external API calls once.
import axios from "axios";
import { createBankService } from "./bank.service";
import { bankRepository } from "./bank.repository";
import type { CreateItemPayload } from "./bank.types";

const ZAI_ITEMS_URL = "https://test.api.promisepay.com/items";

/** Mirrors legacy src/bankIntegration/getTransactionToken.ts. */
export const fetchTransactionToken = async (): Promise<string> => {
  try {
    const response = await axios.post(
      "https://au-0000.sandbox.auth.assemblypay.com/tokens",
      {
        grant_type: "client_credentials",
        client_id: "7vvlud4rqu286ikt8c519nj3jq",
        client_secret: "1aanj7qpnvg79jv8bn24v03noile9qgm35ril2dj48ia8888dgc2",
        scope:
          "im-au-10/20b9a510-3df0-013e-9a3a-0a58a9feac03:cb76605a-5134-46fc-8c42-71027d922701:3",
      },
      {
        headers: {
          accept: "application/json",
          authorization: "Basic YnVyYWthYmEwN0BnbWFpbC5jb206NEBaJS9jbVFZNw==",
          "content-type": "application/json",
        },
        maxBodyLength: Infinity,
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error("Error fetching Assembly token:", error);
    throw error;
  }
};

/** Mirrors the axios.post call inside legacy src/bankIntegration/createItem.ts. */
const fetchCreateItem = async (
  payload: CreateItemPayload,
  transactionToken: string
) => {
  const response = await axios.post(ZAI_ITEMS_URL, payload, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${transactionToken}`,
      "content-type": "application/json",
    },
    maxBodyLength: Infinity,
  });
  return response.data;
};

/** Mirrors the axios.patch call inside legacy src/bankIntegration/doWithdraw.ts. */
const fetchDoWithdraw = async (
  transactionToken: string,
  transactionId: string
) => {
  const response = await axios.patch(
    `${ZAI_ITEMS_URL}/${transactionId}/make_payment`,
    {
      account_id: "b877e330-4846-013e-03af-0a58a9feac03",
    },
    {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${transactionToken}`,
        "content-type": "application/json",
      },
      maxBodyLength: Infinity,
    }
  );
  return response.data;
};

export const bankService = createBankService({
  repo: bankRepository,
  fetchTransactionToken,
  fetchCreateItem,
  fetchDoWithdraw,
});
