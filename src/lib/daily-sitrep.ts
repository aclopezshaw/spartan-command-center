export type DailySitrepKey = { date: string; serviceRecordId: string };

/** Coalesce same-day creation in one process; persisted duplicate detection stays authoritative. */
export function createDailySitrepResolver<T>({
  find,
  create,
}: {
  find: (key: DailySitrepKey) => Promise<T | null>;
  create: (key: DailySitrepKey) => Promise<unknown>;
}) {
  const active = new Map<string, Promise<T>>();
  return function resolve(key: DailySitrepKey): Promise<T> {
    const identity = JSON.stringify([key.serviceRecordId, key.date]);
    const existing = active.get(identity);
    if (existing) return existing;
    const task = (async () => {
      const found = await find(key);
      if (found) return found;
      // A second persisted read narrows the window against another server instance.
      const rechecked = await find(key);
      if (rechecked) return rechecked;
      try {
        await create(key);
      } catch (error) {
        // A create timeout may have committed. Never blindly repeat that write.
        const committed = await find(key);
        if (committed) return committed;
        throw error;
      }
      const verified = await find(key);
      if (!verified) throw new Error("Daily SITREP creation did not verify; refresh before retrying");
      return verified;
    })();
    const tracked = task.finally(() => {
      if (active.get(identity) === tracked) active.delete(identity);
    });
    active.set(identity, tracked);
    return tracked;
  };
}

/** Never choose a page silently when multiple owned records exist for a date. */
export function selectDailySitrep<T>(pages: T[]): T | null {
  if (pages.length > 1) throw new Error("Duplicate Daily SITREP records require reconciliation");
  return pages[0] ?? null;
}
