import { redirect } from "next/navigation";
import { hasAuthorizedSession } from "@/lib/auth";
import { NavigationAvailabilityProvider } from "@/app/components/NavigationAvailability";
import { getPersonnelShellState } from "@/lib/notion";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await hasAuthorizedSession())) {
    redirect("/");
  }

  let personnelShellState = {
    fireteamUnlocked: false,
    currentRank: "Recruit",
  };

  try {
    personnelShellState = await getPersonnelShellState();
  } catch (error) {
    console.error("Unable to resolve personnel shell state", error);
  }

  return (
    <NavigationAvailabilityProvider {...personnelShellState}>
      {children}
    </NavigationAvailabilityProvider>
  );
}
