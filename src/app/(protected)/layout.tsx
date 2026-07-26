import { redirect } from "next/navigation";
import { hasAuthorizedSession } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await hasAuthorizedSession())) {
    redirect("/");
  }

  return <>{children}</>;
}
