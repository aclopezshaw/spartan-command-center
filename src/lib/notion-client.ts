import "server-only";

import { Client } from "@notionhq/client";

let notionClient: Client | null = null;

export function getNotionClient() {
  if (notionClient) {
    return notionClient;
  }

  const auth = process.env.NOTION_TOKEN;

  if (!auth) {
    throw new Error("Missing NOTION_TOKEN");
  }

  notionClient = new Client({ auth });
  return notionClient;
}

export function getRequiredNotionId(environmentVariable: string) {
  const value = process.env[environmentVariable];

  if (!value) {
    throw new Error(`Missing ${environmentVariable}`);
  }

  return value;
}
