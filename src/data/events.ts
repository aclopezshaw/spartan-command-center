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
];