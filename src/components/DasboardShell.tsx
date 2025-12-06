// src/components/DashboardShell.tsx
"use client";

import React from "react";
import SidebarNav from "./SideBarNav";
import DashboardHeader from "./DashboardHeader";

export default function DashboardShell({
    children,
    session,
}: {
    children: React.ReactNode;
    session?: any;
}) {
    return (
        <div className="min-h-screen flex bg-zinc-50 text-slate-900">
            {/* Sidebar */}
            <aside className="w-72 border-r border-slate-200 bg-white hidden md:flex md:flex-col">
                <div className="px-6 py-5 flex items-center gap-3 border-b border-slate-100">
                    <div className="h-10 w-10 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold">
                        RFP
                    </div>
                    <div>
                        <div className="text-lg font-semibold text-slate-900">DashBoard</div>
                        
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <nav className="px-4 py-6">
                        <SidebarNav />
                    </nav>
                </div>

                <div className="px-4 py-4 border-t border-slate-100">
                    <div className="text-xs text-slate-500 mb-2">Support</div>
                    <a
                        className="block text-sm text-blue-600 hover:underline"
                        href="/docs"
                        aria-label="Docs"
                    >
                        Documentation
                    </a>
                </div>
            </aside>

            {/* Main area */}
            <div className="flex-1 min-w-0 flex flex-col">
                <DashboardHeader session={session} />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
}
