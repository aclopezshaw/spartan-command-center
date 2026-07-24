export type EventStatus = "upcoming" | "active" | "completed";

export type ReadinessKey =
  | "physical"
  | "recovery"
  | "intelligence"
  | "professional";

export type ReadinessScores = Record<ReadinessKey, number>;

export type EventReadinessRequirements = {
  minimums?: Partial<ReadinessScores>;
  atLeastOne?: {
    keys: ReadinessKey[];
    minimum: number;
  };
};

export type SpartanEvent = {
  id: string;
  title: string;
  type: "Minor Event" | "Major Event";
  unlockDay: number;
  location: string;
  prompt: string;
  buttonText: string;
  backgroundImage?: string;
  xpReward?: number;
  readinessRequirements?: EventReadinessRequirements;
};

/**
 * An Event record resolved from Notion. Scheduling and readiness requirements
 * come from the Events database; the catalog below supplies legacy display
 * copy and artwork only while those presentation fields are not stored there.
 */
export type CampaignEvent = SpartanEvent & {
  pageId: string;
  phaseId: string | null;
  persistedStatus: "Locked" | "Active" | "Failed" | "Defeated" | "Unknown";
  completedAt: string | null;
};

export const eventCatalog: SpartanEvent[] = [
  {
    id: "candidate-inspection",
    title: "Candidate Inspection",
    type: "Minor Event",
    unlockDay: 10,
    location: "Barracks",
    prompt: "I hope you shined your boots, Spartan.",
    buttonText: "Conduct Inspection",
    backgroundImage: "/images/events/candidate-inspection.png",
    xpReward: 250,
  },
  {
    id: "physical-readiness-test",
    title: "Physical Readiness Test",
    type: "Minor Event",
    unlockDay: 15,
    location: "Training Yard",
    prompt:
      "Candidate physical readiness evaluation initialized. Requirement: Physical Readiness score of at least 1.",
    buttonText: "Begin PRT",
    backgroundImage: "/images/events/prt.png",
    xpReward: 250,
    readinessRequirements: {
      minimums: { physical: 1 },
    },
  },
  {
    id: "academic-aptitude-examination",
    title: "Academic Aptitude Examination",
    type: "Minor Event",
    unlockDay: 25,
    location: "Testing Center",
    prompt:
      "Academic aptitude evaluation initialized. Requirement: Intelligence Readiness score of at least 1.",
    buttonText: "Take Exam",
    backgroundImage: "/images/events/academic-aptitude-examination.png",
    xpReward: 250,
    readinessRequirements: {
      minimums: { intelligence: 1 },
    },
  },

  {
    id: "final-field-training-exercise",
    title: "Final Field Training Exercise",
    type: "Major Event",
    unlockDay: 30,
    location: "Training Grounds",
    prompt:
      "Final field training exercise initialized. Requirement: All scores of at least 1. One Readiness score of at least 2.",
    buttonText: "Begin Exercise",
    backgroundImage: "/images/events/final-field-training-exercise.png",
    xpReward: 500,
    readinessRequirements: {
      minimums: {
        physical: 1,
        recovery: 1,
        intelligence: 1,
        professional: 1,
      },
      atLeastOne: {
        keys: ["physical", "recovery", "intelligence", "professional"],
        minimum: 2,
      },
    },
  }
];
