export type NotionPageResult<T> = {
  results: T[];
  has_more: boolean;
  next_cursor: string | null;
};

export async function collectNotionPages<T>(
  queryPage: (
    startCursor?: string
  ) => Promise<NotionPageResult<T>>
) {
  const results: T[] = [];
  const seenCursors = new Set<string>();
  let startCursor: string | undefined;

  do {
    const response = await queryPage(startCursor);
    results.push(...response.results);

    if (!response.has_more) break;

    const nextCursor = response.next_cursor;

    if (!nextCursor) {
      throw new Error(
        "Notion pagination reported more results without a next cursor"
      );
    }

    if (seenCursors.has(nextCursor)) {
      throw new Error(
        `Notion pagination repeated cursor ${nextCursor}`
      );
    }

    seenCursors.add(nextCursor);
    startCursor = nextCursor;
  } while (startCursor);

  return results;
}
