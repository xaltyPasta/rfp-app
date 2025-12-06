// app/page.tsx
import Link from "next/link";
import SignInButton from "../src/components/SignInButton";

export const metadata = {
  title: "xaltypasta RFP",
  description: "Manage RFPs, vendors and proposals — demo",
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 font-sans dark:bg-black">
      <main className="w-full max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold mb-4">Request for Proposals</h1>
        <p className="text-slate-600 mb-8">
          Create RFPs, send them to vendors, receive and parse proposals, and let AI help you choose the best offer.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
          <Link href="/dashboard" className="px-6 py-3 rounded bg-blue-600 text-white font-medium hover:shadow">
            Open Dashboard
          </Link>

          <SignInButton provider="google" className="px-6 py-3 rounded border bg-grey hover:shadow" />
        </div>

        <div className="mt-8 text-sm text-slate-500">
          Need help? Check the{" "}
          <Link href="/docs" className="underline">
            docs
          </Link>
          {" "}or try the demo flow.
        </div>
      </main>
    </div>
  );
}
