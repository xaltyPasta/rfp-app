// src/components/DashboardHeader.tsx
"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function DashboardHeader({ session }: { session?: any }) {
    const { data } = useSession();
    const user = data?.user;
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function onDoc(e: MouseEvent) {
            const target = e.target as Node;
            if (!btnRef.current || !panelRef.current) return;
            if (!btnRef.current.contains(target) && !panelRef.current.contains(target)) {
                setOpen(false);
            }
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    return (
        <header className="bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        className="md:hidden p-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 transition"
                        aria-label="Open menu"
                    >
                        <span className="text-xl leading-none">☰</span>
                    </button>

                    <div className="hidden md:block">
                        <h4 className="text-lg font-semibold text-slate-800">Overview & Management</h4>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/rfps/new"
                        className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                    >
                        + New RFP
                    </Link>

                    {user ? (
                        <div className="relative">
                            {/* User button */}
                            <button
                                ref={btnRef}
                                onClick={() => setOpen((v) => !v)}
                                aria-expanded={open}
                                aria-haspopup="true"
                                className="inline-flex items-center gap-3 px-3 py-1.5 rounded-md bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 transition"
                            >
                                <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                                </div>
                                <span className="text-sm font-medium">{user?.name ?? user?.email}</span>
                                <svg
                                    className={`w-4 h-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
                                    viewBox="0 0 20 20"
                                    fill="none"
                                >
                                    <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            {/* Dropdown menu */}
                            {open && (
                                <div
                                    ref={panelRef}
                                    role="menu"
                                    aria-orientation="vertical"
                                    className="absolute right-0 mt-2 w-44 bg-white border border-slate-100 rounded-md shadow-lg py-2 z-50"
                                >
                                    <div className="px-3 py-2 text-xs text-slate-500">Signed in as</div>
                                    <div className="px-3 py-2 text-sm font-medium text-slate-800 truncate">{user?.email}</div>
                                    <div className="border-t border-slate-100 my-1" />
                                    <button
                                        onClick={() => signOut({ callbackUrl: "/" })}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition"
                                        role="menuitem"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            href="/auth/signin"
                            className="px-3 py-1.5 rounded-md bg-slate-100 text-sm hover:bg-slate-200 transition"
                        >
                            Sign in
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
