// app/dashboard/proposals/page.tsx
import Link from "next/link";
import prisma from "../../../src/lib/prisma";

async function getProposals() {
    const proposals = await prisma.proposal.findMany({
        include: {
            rfp: {
                select: {
                    id: true,
                    title: true,
                },
            },
            vendor: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return proposals;
}

export default async function ProposalsPage() {
    const proposals = await getProposals();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Proposals
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Inbound vendor responses for your RFPs.
                    </p>
                </div>
            </div>

            {proposals.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No proposals yet. Once vendors reply to your RFPs, they&apos;ll show up here.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border bg-card">
                    <table className="min-w-full text-sm">
                        <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left">Proposal</th>
                                <th className="px-4 py-3 text-left">RFP</th>
                                <th className="px-4 py-3 text-left">Vendor</th>
                                <th className="px-4 py-3 text-left">Total</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Created</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {proposals.map((proposal) => (
                                <tr
                                    key={proposal.id}
                                    className="border-b last:border-b-0 hover:bg-muted/40"
                                >
                                    <td className="px-4 py-3 align-top">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium">
                                                #{proposal.id.slice(0, 8)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                Completeness:{" "}
                                                {proposal.completeness != null
                                                    ? `${Math.round(proposal.completeness * 100)}%`
                                                    : "—"}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 align-top">
                                        {proposal.rfp ? (
                                            <Link
                                                href={`/dashboard/rfps/${proposal.rfp.id}`}
                                                className="text-sm font-medium hover:underline"
                                            >
                                                {proposal.rfp.title}
                                            </Link>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3 align-top">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-medium">
                                                {proposal.vendor?.name ?? "Unknown vendor"}
                                            </span>
                                            {proposal.vendor?.email && (
                                                <span className="text-xs text-muted-foreground">
                                                    {proposal.vendor.email}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 align-top">
                                        {proposal.totalPrice ? (
                                            <span className="text-sm font-medium">
                                                {proposal.currency ? `${proposal.currency} ` : ""}
                                                {proposal.totalPrice ? `${proposal.totalPrice}` : ""}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3 align-top">
                                        <span className="inline-flex rounded-full border px-2 py-0.5 text-xs font-medium">
                                            {proposal.status}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 align-top">
                                        <span className="text-xs text-muted-foreground">
                                            {proposal.createdAt.toLocaleString()}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 align-top text-right">
                                        <Link
                                            href={`/dashboard/proposals/${proposal.id}`}
                                            className="text-xs font-medium text-primary hover:underline"
                                        >
                                            View details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
