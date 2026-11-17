/** The repository's read callback must reject duplicate or malformed rows. */
export async function ensureCommandTrustSnapshot({ read, create }: {
  read: () => Promise<boolean>;
  create: () => Promise<unknown>;
}) {
  if (await read()) return;
  try { await create(); }
  catch (error) {
    // A timeout may arrive after Notion committed the record.
    if (await read()) return;
    throw error;
  }
  if (!(await read())) throw new Error("Command Trust snapshot write did not verify");
}
