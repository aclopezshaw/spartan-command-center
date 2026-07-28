import type {
  EventReadinessRequirements,
  ReadinessKey,
  ReadinessScores,
  SpartanEvent,
} from "../data/events";

const readinessLabels: Record<ReadinessKey, string> = {
  physical: "Physical Readiness",
  recovery: "Recovery Readiness",
  intelligence: "Intelligence Readiness",
  professional: "Professional Readiness",
};

export type EventReadinessFailure =
  | {
      code: "minimum";
      key: ReadinessKey;
      actual: number;
      minimum: number;
      message: string;
    }
  | {
      code: "at-least-one";
      keys: ReadinessKey[];
      highestScore: number | null;
      minimum: number;
      message: string;
    };

export type EventReadinessEvaluation = {
  eligible: boolean;
  failures: EventReadinessFailure[];
  unmetRequirements: string[];
};

function labelForKeys(keys: ReadinessKey[]) {
  return keys.map((key) => readinessLabels[key]).join(", ");
}

export function evaluateEventReadiness(
  requirements: EventReadinessRequirements | undefined,
  scores: ReadinessScores
): EventReadinessEvaluation {
  if (!requirements) {
    return { eligible: true, failures: [], unmetRequirements: [] };
  }

  const failures: EventReadinessFailure[] = [];

  for (const [key, minimum] of Object.entries(requirements.minimums ?? {}) as [
    ReadinessKey,
    number,
  ][]) {
    if (scores[key] < minimum) {
      failures.push({
        code: "minimum",
        key,
        actual: scores[key],
        minimum,
        message: `${readinessLabels[key]} must be at least ${minimum}`,
      });
    }
  }

  if (
    requirements.atLeastOne &&
    !requirements.atLeastOne.keys.some(
      (key) => scores[key] >= requirements.atLeastOne!.minimum
    )
  ) {
    const { keys, minimum } = requirements.atLeastOne;
    failures.push({
      code: "at-least-one",
      keys,
      highestScore:
        keys.length > 0
          ? Math.max(...keys.map((key) => scores[key]))
          : null,
      minimum,
      message: `At least one of ${labelForKeys(keys)} must be at least ${minimum}`,
    });
  }

  return {
    eligible: failures.length === 0,
    failures,
    unmetRequirements: failures.map(({ message }) => message),
  };
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
