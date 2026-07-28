type NotionDataSourceResolverClient = {
  dataSources: {
    retrieve: (input: {
      data_source_id: string;
    }) => Promise<unknown>;
  };
  databases: {
    retrieve: (input: {
      database_id: string;
    }) => Promise<unknown>;
  };
};

export async function resolveNotionDataSourceId(
  notion: NotionDataSourceResolverClient,
  configuredId: string
) {
  try {
    await notion.dataSources.retrieve({
      data_source_id: configuredId,
    });
    return configuredId;
  } catch {
    const database = await notion.databases.retrieve({
      database_id: configuredId,
    });
    const dataSourceId = (
      database as {
        data_sources?: Array<{ id?: string }>;
      }
    ).data_sources?.[0]?.id;

    if (!dataSourceId) {
      throw new Error("Notion data source not found");
    }

    return dataSourceId;
  }
}
