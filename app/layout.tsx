// app/layout.tsx (server component)
import "./globals.css";
import type { ReactNode } from "react";
import Providers from "@/src/components/Providers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // adjust path if needed

export const metadata = {
  title: "RFP App",
  description: "RFP App",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // getServerSession runs on server and returns the current session (or null)
  const session = await getServerSession(authOptions as any);

  return (
    <html lang="en">
      <body>
        {/* Providers is a client component receiving session */}
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
