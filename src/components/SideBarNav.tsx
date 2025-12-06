// src/components/SidebarNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/rfps", label: "RFPs" },
    { href: "/dashboard/vendors", label: "Vendors" },
    { href: "/dashboard/proposals", label: "Proposals" },
    // { href: "/dashboard/compare", label: "Compare" },
    // { href: "/dashboard/settings", label: "Settings" },
];

export default function SidebarNav() {
    const path = usePathname();
    return (
        <nav className="px-4">
            <ul className="space-y-1">
                {items.map((it) => {
                    const active = path === it.href;
                    return (
                        <li key={it.href}>
                            <Link href={it.href} className={`block px-3 py-2 rounded ${active ? "bg-slate-100 font-semibold" : "hover:bg-slate-50"}`}>
                                {it.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
