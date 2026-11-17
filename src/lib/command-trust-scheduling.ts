import "server-only";
import { after } from "next/server";
export function scheduleCommandTrustReconciliation() {
  after(async () => {
    try {
      const { reconcileCommandTrust } = await import("@/lib/command-trust-store");
      await reconcileCommandTrust();
    } catch (error) { console.error("Command Trust reconciliation pending retry", error); }
  });
}
