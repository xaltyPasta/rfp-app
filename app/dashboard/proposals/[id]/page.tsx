// app/dashboard/proposals/[id]/page.tsx
import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

async function getProposal(id: string) {
    if (!id) return null;

    const proposal = await prisma.proposal.findUnique({
        where: { id },
        include: {
            rfp: {
                select: { id: true, title: true, status: true },
            },
            vendor: {
                select: { id: true, name: true, email: true, phone: true, meta: true },
            },
            attachments: true,
        },
    });

    return proposal;
}

export default async function ProposalDetailPage({ params }: Props) {
    const { id } = await params;
    if (!id) notFound();

    const proposal = await getProposal(id);
    if (!proposal) notFound();

    const raw = (proposal.rawEmail ?? {}) as any;

    const rawFrom: string =
        raw.from ??
        raw.webhook?.from ??
        (Array.isArray(raw.full?.from) ? raw.full.from.join(", ") : raw.full?.from) ??
        "—";

    const rawSubject: string =
        raw.subject ?? raw.webhook?.subject ?? raw.full?.subject ?? "—";

    const rawBody: string =
        raw.body ??
        raw.text ??
        raw.html ??
        raw.full?.text ??
        raw.full?.html ??
        raw.webhook?.text ??
        raw.webhook?.html ??
        "—";

    // 👉 helper to build a Cloudinary view URL
    const cloudName =
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ??
        process.env.CLOUDINARY_CLOUD_NAME ??
        "";

    const getAttachmentViewUrl = (att: (typeof proposal.attachments)[number]) => {
        // If we already stored secure_url correctly, just use it
        if (att.url && att.url.startsWith("http")) {
            return att.url;
        }

        // Fallback: rebuild from publicId
        if (att.publicId && cloudName) {
            // This works for images, pdfs, docs, xlsx, etc when using resource_type=auto
            return `https://res.cloudinary.com/${cloudName}/auto/upload/${att.publicId}`;
        }

        // Last-resort dummy link
        return "#";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Proposal #{proposal.id.slice(0, 8)}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Vendor response for{" "}
                        {proposal.rfp ? (
                            <Link
                                href={`/dashboard/rfps/${proposal.rfp.id}`}
                                className="font-medium text-primary hover:underline"
                            >
                                {proposal.rfp.title}
                            </Link>
                        ) : (
                            "Unknown RFP"
                        )}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-1 text-right">
                    <span className="inline-flex rounded-full border px-2 py-0.5 text-xs font-medium">
                        {proposal.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Created: {proposal.createdAt.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Top summary cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card p-4">
                    <div className="text-xs font-medium uppercase text-muted-foreground">
                        Vendor
                    </div>
                    <div className="mt-2 space-y-1">
                        <div className="text-sm font-semibold">
                            {proposal.vendor?.name ?? "Unknown vendor"}
                        </div>
                        {proposal.vendor?.email && (
                            <div className="text-xs text-muted-foreground">
                                {proposal.vendor.email}
                            </div>
                        )}
                        {proposal.vendor?.phone && (
                            <div className="text-xs text-muted-foreground">
                                {proposal.vendor.phone}
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-4">
                    <div className="text-xs font-medium uppercase text-muted-foreground">
                        Commercials
                    </div>
                    <div className="mt-2 space-y-1">
                        <div className="text-sm font-semibold">
                            {proposal.totalPrice
                                ? `${proposal.currency ?? ""} ${proposal.totalPrice}`
                                : "Not extracted"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Completeness:{" "}
                            {proposal.completeness != null
                                ? `${Math.round(proposal.completeness * 100)}%`
                                : "—"}
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-4">
                    <div className="text-xs font-medium uppercase text-muted-foreground">
                        RFP
                    </div>
                    <div className="mt-2 space-y-1">
                        {proposal.rfp ? (
                            <>
                                <Link
                                    href={`/dashboard/rfps/${proposal.rfp.id}`}
                                    className="text-sm font-semibold hover:underline"
                                >
                                    {proposal.rfp.title}
                                </Link>
                                <div className="text-xs text-muted-foreground">
                                    Status: {proposal.rfp.status}
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-muted-foreground">Not linked</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content split: parsed vs raw */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Parsed */}
                <div className="space-y-3 rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Parsed data</h2>
                        <span className="text-xs text-muted-foreground">
                            JSON extracted by parser
                        </span>
                    </div>
                    <pre className="max-h-[420px] overflow-auto rounded-md bg-muted p-3 text-xs">
                        {JSON.stringify(proposal.parsed ?? {}, null, 2)}
                    </pre>
                </div>

                {/* Raw email */}
                <div className="space-y-3 rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Raw email</h2>
                        <span className="text-xs text-muted-foreground">
                            Original incoming content
                        </span>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="text-xs font-medium uppercase text-muted-foreground">
                                From
                            </span>
                            <div className="mt-0.5">{rawFrom}</div>
                        </div>

                        <div>
                            <span className="text-xs font-medium uppercase text-muted-foreground">
                                Subject
                            </span>
                            <div className="mt-0.5">{rawSubject}</div>
                        </div>

                        <div>
                            <span className="text-xs font-medium uppercase text-muted-foreground">
                                Body
                            </span>
                            <div className="mt-0.5 whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                                {rawBody}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attachments */}
            <div className="rounded-xl border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Attachments</h2>
                </div>

                {proposal.attachments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                        No attachments for this proposal.
                    </p>
                ) : (
                    <ul className="space-y-2 text-sm">
                        {proposal.attachments.map((att) => {
                            const viewUrl = getAttachmentViewUrl(att);
                            return (
                                <li
                                    key={att.id}
                                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">{att.filename}</span>
                                        <span className="text-[11px] text-muted-foreground">
                                            {att.mimeType}
                                        </span>
                                    </div>
                                    <Link
                                        href={viewUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[11px] font-medium text-primary hover:underline"
                                    >
                                        Open
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
