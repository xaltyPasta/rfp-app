// app/dashboard/rfp/page.tsx
import prisma from "@/src/lib/prisma";
import Link from "next/link";
import RfpCard from "../../../src/components/rfp/RfpCard";

export const revalidate = 0; // live-ish in dev

export default async function RfpListPage() {
  const rfps = await prisma.rfp.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      description: true,
      createdById: true,
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">RFPs</h2>
        <Link
          href="/dashboard/rfps/new"
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          + Create RFP
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rfps.map((r) => (
          <RfpCard
            key={r.id}
            id={r.id}
            title={r.title}
            status={r.status}
            description={r.description ?? undefined}
            createdAt={r.createdAt}
          />
        ))}
      </div>
    </div>
  );
}
