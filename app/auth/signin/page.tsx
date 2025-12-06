// app/auth/signin/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SignInPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const callbackUrl = (process?.env?.NEXT_PUBLIC_BASE_URL ?? "") + "/dashboard";
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const error = searchParams.get("error");

  useEffect(() => {
    if (session?.user && !loadingProvider) {
      router.replace("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleSignIn = useCallback(
    async (providerId: string) => {
      try {
        setLoadingProvider(providerId);
        await signIn(providerId, { callbackUrl: callbackUrl || "/dashboard" });
      } catch (err) {
        console.error("signIn error", err);
        setLoadingProvider(null);
      }
    },
    [callbackUrl]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 font-sans">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-sm border border-slate-100">
        <header className="mb-6 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white text-lg font-bold mx-auto mb-3">
            RFP
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Sign in</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in with your Google account to continue to the RFP dashboard.
          </p>
        </header>

        {error && (
          <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handleSignIn("google")}
            disabled={!!loadingProvider && loadingProvider !== "google"}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 rounded-md bg-white border border-slate-200 hover:shadow transition disabled:opacity-60"
          >
            {loadingProvider === "google" ? (
              <span className="inline-block text-sm font-medium text-slate-700">Signing in…</span>
            ) : (
              <>
                <svg
                  aria-hidden
                  width="18"
                  height="18"
                  viewBox="0 0 48 48"
                  className="inline-block"
                >
                  <path fill="#EA4335" d="M24 9.5c3.9 0 7 1.4 9.2 3.3l6.8-6.6C34.7 2.9 29.6 0 24 0 14.7 0 6.9 5.6 3.2 13.7l7.9 6.1C12.9 14 17.8 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.6H24v9.2h12.6c-.5 2.8-2 5.2-4.2 6.8l6.8 5.3C43.8 38.3 46.5 31.8 46.5 24.5z" />
                  <path fill="#FBBC05" d="M10.9 29.8A14.9 14.9 0 0110 24c0-1.8.3-3.5.9-5.1L3 12.9C1.1 15.6 0 18.7 0 24c0 5.4 1.8 9.8 5 13.6l5.9-7.8z" />
                  <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-6.4C30.6 36.1 27.5 37 24 37c-6.2 0-11.1-4.5-12.9-10.8L3.2 30.9C6.9 38.9 14.7 44.5 24 44.5z" />
                </svg>
                <span className="text-sm font-medium text-slate-900">Sign in with Google</span>
              </>
            )}
          </button>

          {/* <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <div className="text-xs text-slate-400">or</div>
            <div className="flex-1 h-px bg-slate-100" />
          </div> */}

          {/* <button
            onClick={() => router.push("/dashboard")}
            className="w-full px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
          >
            Continue to Dashboard (Demo)
          </button> */}

          <div className="text-center text-sm text-slate-500">
            By continuing you agree to our{" "}
            <a className="underline" href="/terms">
              Terms
            </a>{" "}
            and{" "}
            <a className="underline" href="/privacy">
              Privacy Policy
            </a>
            .
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-slate-600 hover:underline"
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
