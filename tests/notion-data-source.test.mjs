import assert from "node:assert/strict";
import test from "node:test";

import { resolveNotionDataSourceId } from "../src/lib/notion-data-source.ts";

test("uses an already configured Notion data source ID directly", async () => {
  let databaseRetrieveCount = 0;
  const notion = {
    dataSources: {
      async retrieve({ data_source_id }) {
        assert.equal(data_source_id, "configured-source");
        return { id: data_source_id };
      },
    },
    databases: {
      async retrieve() {
        databaseRetrieveCount += 1;
        return {};
      },
    },
  };

  assert.equal(
    await resolveNotionDataSourceId(notion, "configured-source"),
    "configured-source"
  );
  assert.equal(databaseRetrieveCount, 0);
});

test("resolves a configured Notion database ID to its first data source", async () => {
  const notion = {
    dataSources: {
      async retrieve() {
        throw new Error("not a data source");
      },
    },
    databases: {
      async retrieve({ database_id }) {
        assert.equal(database_id, "configured-database");
        return {
          data_sources: [{ id: "resolved-source" }],
        };
      },
    },
  };

  assert.equal(
    await resolveNotionDataSourceId(notion, "configured-database"),
    "resolved-source"
  );
});

test("rejects a Notion database with no available data source", async () => {
  const notion = {
    dataSources: {
      async retrieve() {
        throw new Error("not a data source");
      },
    },
    databases: {
      async retrieve() {
        return { data_sources: [] };
      },
    },
  };

  await assert.rejects(
    resolveNotionDataSourceId(notion, "empty-database"),
    /Notion data source not found/
  );
});
