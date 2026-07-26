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
  retryDelayDays?: number;
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
  retryAvailableDay: number | null;
  retrySlotsUsed: number;
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
  },
  {
    id: "fireteam-coordination-drill",
    title: "Fireteam Coordination Drill",
    type: "Minor Event",
    unlockDay: 5,
    location: "Fireteam Training Complex",
    prompt:
      "Fireteam coordination evaluation initialized. Requirement: Professional Readiness score of at least 3.",
    buttonText: "Begin Coordination Drill",
    backgroundImage: "/images/events/fireteam-coordination-drill.png",
    xpReward: 250,
    readinessRequirements: { minimums: { professional: 3 } },
  },
  {
    id: "casualty-evacuation-simulation",
    title: "Casualty Evacuation Simulation",
    type: "Minor Event",
    unlockDay: 10,
    location: "Combat Medical Training Site",
    prompt:
      "Casualty evacuation simulation initialized. Requirement: Recovery Readiness score of at least 3.",
    buttonText: "Begin Evacuation",
    backgroundImage: "/images/events/casualty-evacuation-simulation.png",
    xpReward: 250,
    readinessRequirements: { minimums: { recovery: 3 } },
  },
  {
    id: "tactical-obstacle-course-trial",
    title: "Tactical Obstacle Course Trial",
    type: "Minor Event",
    unlockDay: 15,
    location: "Mobility Training Grounds",
    prompt:
      "Tactical obstacle course trial initialized. Requirement: Physical Readiness score of at least 3.",
    buttonText: "Enter the Course",
    backgroundImage: "/images/events/tactical-obstacle-course-trial.png",
    xpReward: 250,
    readinessRequirements: { minimums: { physical: 3 } },
  },
  {
    id: "squad-navigation-challenge",
    title: "Squad Navigation Challenge",
    type: "Minor Event",
    unlockDay: 20,
    location: "Wilderness Navigation Range",
    prompt:
      "Squad navigation challenge initialized. Requirement: Intelligence Readiness score of at least 3.",
    buttonText: "Plot the Route",
    backgroundImage: "/images/events/squad-navigation-challenge.png",
    xpReward: 250,
    readinessRequirements: { minimums: { intelligence: 3 } },
  },
  {
    id: "fireteam-battle-assessment",
    title: "Fireteam Battle Assessment",
    type: "Major Event",
    unlockDay: 25,
    location: "SCP Battle Assessment Arena",
    prompt:
      "Fireteams are assembling for the Phase II competitive assessment. Requirement: at least one Readiness score of 4 or higher.",
    buttonText: "Enter the Assessment",
    backgroundImage: "/images/events/fireteam-battle-assessment.png",
    xpReward: 500,
    readinessRequirements: {
      atLeastOne: {
        keys: ["physical", "recovery", "intelligence", "professional"],
        minimum: 4,
      },
    },
  },
];
