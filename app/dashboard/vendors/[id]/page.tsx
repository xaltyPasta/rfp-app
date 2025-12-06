// app/dashboard/vendors/[id]/page.tsx

import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "../../../../src/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function VendorDetailPage({ params }: PageProps) {
  const { id } = await params;

  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      rfpVendors: {
        include: {
          rfp: true,
        },
        orderBy: { createdAt: "desc" },
      },
      proposals: {
        include: {
          rfp: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!vendor) {
    notFound();
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{vendor.name}</h1>
          <div className="mt-1 text-sm text-gray-600 space-x-2">
            <span>{vendor.email}</span>
            {vendor.contactName && (
              <span>• Contact: {vendor.contactName}</span>
            )}
            {vendor.phone && <span>• {vendor.phone}</span>}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Created: {vendor.createdAt.toISOString().slice(0, 10)} • Updated:{" "}
            {vendor.updatedAt.toISOString().slice(0, 10)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/vendors/${vendor.id}/edit`}
            className="text-sm text-blue-600 hover:underline"
          >
            Edit
          </Link>
          <Link
            href="/dashboard/vendors"
            className="text-sm text-gray-600 hover:underline"
          >
            ← Back to vendors
          </Link>
        </div>
      </div>

      {/* Meta JSON */}
      {vendor.meta && (
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Metadata</h2>
          <pre className="rounded-lg border p-3 text-xs whitespace-pre-wrap wrap-break-words">
            {JSON.stringify(vendor.meta, null, 2)}
          </pre>
        </section>
      )}

      {/* RFP invitations */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">RFP invitations</h2>

        {vendor.rfpVendors.length === 0 && (
          <p className="text-sm text-gray-500">
            This vendor has not been invited to any RFP yet.
          </p>
        )}

        {vendor.rfpVendors.length > 0 && (
          <div className="space-y-2">
            {vendor.rfpVendors.map((rv) => (
              <div
                key={rv.id}
                className="rounded-lg border p-3 text-sm flex flex-col md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <Link
                    href={`/dashboard/rfps/${rv.rfpId}`}
                    className="font-medium hover:underline"
                  >
                    {rv.rfp?.title ?? "Unknown RFP"}
                  </Link>
                  <div className="text-xs text-gray-500">
                    Status: {rv.status}
                    {rv.sentAt && (
                      <> • Sent: {rv.sentAt.toISOString().slice(0, 10)}</>
                    )}
                    {rv.attempts > 0 && <> • Attempts: {rv.attempts}</>}
                  </div>
                </div>

                {rv.messageId && (
                  <div className="mt-2 md:mt-0 text-xs text-gray-500">
                    Message ID: {rv.messageId}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Proposals */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Proposals</h2>

        {vendor.proposals.length === 0 && (
          <p className="text-sm text-gray-500">
            This vendor has not submitted any proposals yet.
          </p>
        )}

        {vendor.proposals.length > 0 && (
          <div className="space-y-2">
            {vendor.proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="rounded-lg border p-3 text-sm space-y-1"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-medium">
                      {proposal.rfp?.title ?? "Unknown RFP"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Submitted:{" "}
                      {proposal.createdAt.toISOString().slice(0, 10)} • Status:{" "}
                      {proposal.status}
                      {proposal.needsReview && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-800">
                          Needs review
                        </span>
                      )}
                    </div>
                  </div>

                  {proposal.totalPrice && (
                    <div className="mt-2 md:mt-0 text-sm font-semibold">
                      {proposal.currency ? `${proposal.currency} ` : ""}
                      {proposal.totalPrice.toString()}
                    </div>
                  )}
                </div>

                {proposal.completeness !== null &&
                  proposal.completeness !== undefined && (
                    <div className="text-xs text-gray-500">
                      Parsed completeness:{" "}
                      {(proposal.completeness * 100).toFixed(0)}%
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

