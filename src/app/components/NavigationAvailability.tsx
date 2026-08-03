"use client";

import { createContext, useContext } from "react";

type NavigationAvailability = {
  fireteamUnlocked: boolean;
};

const NavigationAvailabilityContext = createContext<NavigationAvailability>({
  fireteamUnlocked: false,
});

export function NavigationAvailabilityProvider({
  children,
  fireteamUnlocked,
}: NavigationAvailability & { children: React.ReactNode }) {
  return (
    <NavigationAvailabilityContext.Provider value={{ fireteamUnlocked }}>
      {children}
    </NavigationAvailabilityContext.Provider>
  );
}

export function useNavigationAvailability() {
  return useContext(NavigationAvailabilityContext);
}
