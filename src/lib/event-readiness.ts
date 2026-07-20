import {
  EventReadinessRequirements,
  ReadinessKey,
  ReadinessScores,
  SpartanEvent,
} from "@/data/events";

const readinessLabels: Record<ReadinessKey, string> = {
  physical: "Physical Readiness",
  recovery: "Recovery Readiness",
  intelligence: "Intelligence Readiness",
  professional: "Professional Readiness",
};

export type EventReadinessEvaluation = {
  eligible: boolean;
  unmetRequirements: string[];
};

function labelForKeys(keys: ReadinessKey[]) {
  return keys.map((key) => readinessLabels[key]).join(", ");
}

export function evaluateEventReadiness(
  requirements: EventReadinessRequirements | undefined,
  scores: ReadinessScores
): EventReadinessEvaluation {
  if (!requirements) return { eligible: true, unmetRequirements: [] };

  const unmetRequirements: string[] = [];

  for (const [key, minimum] of Object.entries(requirements.minimums ?? {}) as [
    ReadinessKey,
    number,
  ][]) {
    if (scores[key] < minimum) {
      unmetRequirements.push(`${readinessLabels[key]} must be at least ${minimum}`);
    }
  }

  if (
    requirements.atLeastOne &&
    !requirements.atLeastOne.keys.some(
      (key) => scores[key] >= requirements.atLeastOne!.minimum
    )
  ) {
    unmetRequirements.push(
      `At least one of ${labelForKeys(requirements.atLeastOne.keys)} must be at least ${requirements.atLeastOne.minimum}`
    );
  }

  return { eligible: unmetRequirements.length === 0, unmetRequirements };
}

export function getEventReadinessCopy(event: SpartanEvent) {
  const requirements = event.readinessRequirements;
  if (!requirements) return "No readiness requirement.";

  const requirementsCopy = Object.entries(requirements.minimums ?? {}).map(
    ([key, minimum]) => `${readinessLabels[key as ReadinessKey]} ≥ ${minimum}`
  );

  if (requirements.atLeastOne) {
    requirementsCopy.push(
      `At least one of ${labelForKeys(requirements.atLeastOne.keys)} ≥ ${requirements.atLeastOne.minimum}`
    );
  }

  return requirementsCopy.join(". ");
}
