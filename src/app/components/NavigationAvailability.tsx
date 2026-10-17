"use client";

import { createContext, useContext } from "react";

type NavigationAvailability = {
  fireteamUnlocked: boolean;
  currentRank: string;
};

const NavigationAvailabilityContext = createContext<NavigationAvailability>({
  fireteamUnlocked: false,
  currentRank: "Recruit",
});

export function NavigationAvailabilityProvider({
  children,
  fireteamUnlocked,
  currentRank,
}: NavigationAvailability & { children: React.ReactNode }) {
  return (
    <NavigationAvailabilityContext.Provider
      value={{ fireteamUnlocked, currentRank }}
    >
      {children}
    </NavigationAvailabilityContext.Provider>
  );
}

export function useNavigationAvailability() {
  return useContext(NavigationAvailabilityContext);
}
