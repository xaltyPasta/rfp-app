// app/dashboard/layout.tsx
import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DashboardShell from "../../src/components/DasboardShell";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions as any);

  if (!session) {
    // server-side redirect to sign-in
    // using Next.js app router redirect
    const { redirect } = await import("next/navigation");
    return redirect("/auth/signin");
  }

  return (
    <DashboardShell session={session}>
      {children}
    </DashboardShell>
  );
}

