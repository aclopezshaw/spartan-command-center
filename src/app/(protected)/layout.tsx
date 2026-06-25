import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAuthorized = cookieStore.get("scp_auth")?.value === "authorized";

  if (!isAuthorized) {
    redirect("/");
  }

  return <>{children}</>;
}