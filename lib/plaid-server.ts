import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";

let plaidClient: PlaidApi | null = null;

export function getPlaidClient(): PlaidApi {
  if (plaidClient) return plaidClient;

  const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || "production"] as string,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "",
        "PLAID-SECRET": process.env.PLAID_SECRET || "",
      },
    },
  });

  plaidClient = new PlaidApi(configuration);
  return plaidClient;
}

export { Products, CountryCode };
