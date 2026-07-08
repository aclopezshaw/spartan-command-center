export type EventStatus = "locked" | "upcoming" | "active" | "completed";

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
  },
  {
    id: "academic-aptitude-examination",
    title: "Academic Aptitude Examination",
    type: "Minor Event",
    unlockDay: 20,
    location: "Testing Center",
    prompt:
      "Academic aptitude evaluation initialized. Requirement: Intelligence Readiness score of at least 1.",
    buttonText: "Take Exam",
    backgroundImage: "/images/events/academic-aptitude-examination.png",
    xpReward: 250,
  },
];