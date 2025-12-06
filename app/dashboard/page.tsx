// app/dashboard/page.tsx
import prisma from "@/src/lib/prisma";
import type { Rfp } from "@prisma/client";
import Link from "next/link";

export default async function DashboardPage() {
    // small dataset for overview
    const rfps = await prisma.rfp.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, createdAt: true },
    });

    const vendorsCount = await prisma.vendor.count();
    const proposalsCount = await prisma.proposal.count();

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-grey rounded shadow">
                    <h4 className="text-sm text-slate-500">RFPs</h4>
                    <p className="text-2xl font-semibold">{rfps.length}</p>
                    <Link href="/dashboard/rfps" className="text-sm text-blue-600">View all</Link>
                </div>
                <div className="p-4 bg-grey rounded shadow">
                    <h4 className="text-sm text-slate-500">Vendors</h4>
                    <p className="text-2xl font-semibold">{vendorsCount}</p>
                    <Link href="/dashboard/vendors" className="text-sm text-blue-600">View all</Link>
                </div>
                <div className="p-4 bg-grey rounded shadow">
                    <h4 className="text-sm text-slate-500">Proposals</h4>
                    <p className="text-2xl font-semibold">{proposalsCount}</p>
                    <Link href="/dashboard/proposals" className="text-sm text-blue-600">View all</Link>
                </div>
            </div>

            <section className="bg-grey rounded shadow p-4">
                <h3 className="text-lg font-medium mb-2">Recent RFPs</h3>
                <ul className="space-y-2">
                    {rfps.map((r) => (
                        <li key={r.id} className="p-3 border rounded flex items-center justify-between">
                            <div>
                                <div className="font-medium">{r.title}</div>
                                <div className="text-sm text-slate-500">{r.status}</div>
                            </div>
                            <Link href={`/dashboard/rfps`} className="text-sm text-blue-600">Open</Link>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
