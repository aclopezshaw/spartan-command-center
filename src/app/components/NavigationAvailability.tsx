"use client";

import { createContext, useContext } from "react";

type NavigationAvailability = {
  fireteamUnlocked: boolean;
  commandUnlocked: boolean;
  currentRank: string;
};

const NavigationAvailabilityContext = createContext<NavigationAvailability>({
  fireteamUnlocked: false,
  commandUnlocked: false,
  currentRank: "Recruit",
});

export function NavigationAvailabilityProvider({
  children,
  fireteamUnlocked,
  commandUnlocked,
  currentRank,
}: NavigationAvailability & { children: React.ReactNode }) {
  return (
    <NavigationAvailabilityContext.Provider
      value={{ fireteamUnlocked, commandUnlocked, currentRank }}
    >
      {children}
    </NavigationAvailabilityContext.Provider>
  );
}

export function useNavigationAvailability() {
  return useContext(NavigationAvailabilityContext);
}
