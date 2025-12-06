// src/components/Providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

type Props = {
  children: React.ReactNode;
  session?: any; // server session object, can be typed if desired
};

export default function Providers({ children, session }: Props) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}

