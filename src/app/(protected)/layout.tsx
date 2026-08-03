import { redirect } from "next/navigation";
import { hasAuthorizedSession } from "@/lib/auth";
import { NavigationAvailabilityProvider } from "@/app/components/NavigationAvailability";
import { isFireteamNavigationUnlocked } from "@/lib/notion";

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

  let fireteamUnlocked = false;

  try {
    fireteamUnlocked = await isFireteamNavigationUnlocked();
  } catch (error) {
    console.error("Unable to resolve Fireteam navigation access", error);
  }

  return (
    <NavigationAvailabilityProvider fireteamUnlocked={fireteamUnlocked}>
      {children}
    </NavigationAvailabilityProvider>
  );
}
