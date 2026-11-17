import "server-only";
import { getActiveCampaignEventState, getAlexReadinessScores, getCommandAssignmentStatus } from "@/lib/notion";
import { getCommandTrustStatus } from "@/lib/command-trust-store";
import { getBattalionCohesionStatus } from "@/lib/battalion-cohesion-store";
import { getBattalionRankingsStatus } from "@/lib/battalion-rankings-store";
import { getOperationalDateKey } from "@/lib/date";
import { buildLeadershipDashboard } from "@/lib/leadership-dashboard";

function value<T>(result: PromiseSettledResult<T>): T | null { return result.status === "fulfilled" ? result.value : null; }

/** All dependencies are read-only. A page load cannot reconcile or initialize state. */
export async function getLeadershipDashboard() {
  const [assignmentResult, readinessResult] = await Promise.allSettled([getCommandAssignmentStatus(), getAlexReadinessScores()]);
  const assignment = value(assignmentResult);
  const base = { assignmentState: assignment?.state ?? null, targetPhaseId: assignment?.eligibility.evidence.targetPhaseId ?? null, launchHeld: assignment?.eligibility.evidence.targetPhaseStatus === "Upcoming", today: getOperationalDateKey(), readiness: value(readinessResult) };
  if (assignment?.state !== "completed" || base.launchHeld) return buildLeadershipDashboard({ ...base, phase: null, trust: null, cohesion: null, rankings: null });
  const [phase, trust, cohesion, rankings] = await Promise.allSettled([getActiveCampaignEventState(), getCommandTrustStatus(), getBattalionCohesionStatus(), getBattalionRankingsStatus()]);
  return buildLeadershipDashboard({ ...base, phase: value(phase), trust: value(trust), cohesion: value(cohesion), rankings: value(rankings) });
}
