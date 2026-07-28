import "server-only";

import { after } from "next/server";
import { evaluateAchievements } from "@/lib/achievements";
import { createSingleFlightTask } from "@/lib/single-flight";

const evaluateAchievementsSingleFlight =
  createSingleFlightTask(evaluateAchievements);

export function scheduleAchievementEvaluation() {
  after(async () => {
    try {
      await evaluateAchievementsSingleFlight();
    } catch (error) {
      console.error(
        "Post-response achievement evaluation failed:",
        error
      );
    }
  });
}
