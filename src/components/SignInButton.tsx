// src/components/SignInButton.tsx
"use client";

import React from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInButton({
    provider = "google",
    children,
    className = "",
}: {
    provider?: string;
    children?: React.ReactNode;
    className?: string;
}) {
    const { data: session } = useSession();
    const router = useRouter();

    if (session?.user) {
        return (
            <button
                onClick={() => router.push("/dashboard")}
                className={`px-6 py-3 rounded bg-slate-800 text-white ${className}`}
            >
                Continue to dashboard
            </button>
        );
    }

    return (
        <button
            onClick={() => signIn(provider, { callbackUrl: "/dashboard" })}
            className={className}
        >
            {children ?? "Sign in with Google"}
        </button>
    );
}
