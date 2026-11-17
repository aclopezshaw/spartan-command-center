import type { BattalionStandingId } from "./battalion-rankings";
import { ATHENA_COMMAND } from "./command-assignment.ts";

/** Unit presentation identities, not earned personnel insignia or awards. */
export const BATTALION_INSIGNIA: Record<BattalionStandingId, {
  path: string; accent: string; origin: string;
}> = {
  athena: { path: ATHENA_COMMAND.patchPath, accent: "#3B82F6", origin: "epsilon" },
  ares: { path: "/images/command/rivals/ares-command-patch.png", accent: "#8F3F48", origin: "sigma" },
  apollo: { path: "/images/command/rivals/apollo-command-patch.png", accent: "#28B8BD", origin: "theta" },
  artemis: { path: "/images/command/rivals/artemis-command-patch.png", accent: "#D59A3A", origin: "delta" },
  hephaestus: { path: "/images/command/rivals/hephaestus-command-patch.png", accent: "#A5B56A", origin: "alpha" },
};
