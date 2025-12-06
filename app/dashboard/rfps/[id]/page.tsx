// app/dashboard/rfps/[id]/page.tsx

import { notFound } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import prisma from "../../../../src/lib/prisma";
import { inviteVendorsToRfp } from "../../../../src/services/rfpService";

type PageProps = {
  // Next 15: params is a Promise in async server components
  params: Promise<{ id: string }>;
};

// server action – thin wrapper that calls the service
async function inviteVendorsAction(rfpId: string, formData: FormData) {
  "use server";

  const vendorIds = formData.getAll("vendorIds") as string[];

  if (!vendorIds || vendorIds.length === 0) {
    return;
  }

  await inviteVendorsToRfp(rfpId, vendorIds);

  // refresh this page data
  revalidatePath(`/dashboard/rfps/${rfpId}`);
}

export default async function RfpDetailPage({ params }: PageProps) {
  const { id } = await params; // ✅ unwrap params

  if (!id) {
    notFound();
  }

  const [rfp, allVendors] = await Promise.all([
    prisma.rfp.findUnique({
      where: { id },
      include: {
        createdBy: true,
        attachments: true,
        rfpVendors: {
          include: {
            vendor: true,
          },
        },
        proposals: {
          include: {
            vendor: true,
            attachments: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.vendor.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  if (!rfp) {
    notFound();
  }

  const creatorName = rfp.createdBy?.name ?? rfp.createdBy?.email ?? "Unknown";

  const invitedVendorIds = new Set(
    rfp.rfpVendors.map((rv) => rv.vendorId)
  );

  return (
    <div className="p-6 space-y-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{rfp.title}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Status: <span className="font-medium">{rfp.status}</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Created by {creatorName} •{" "}
            {rfp.createdAt.toISOString().slice(0, 10)} • Last updated{" "}
            {rfp.updatedAt.toISOString().slice(0, 10)}
          </p>
        </div>

        <Link
          href="/dashboard/rfps"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to RFPs
        </Link>
      </div>

      {/* Description */}
      {rfp.description && (
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Description</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {rfp.description}
          </p>
        </section>
      )}

      {/* Structured + metadata */}
      {(rfp.structured || rfp.metadata) && (
        <section className="grid gap-4 md:grid-cols-2">
          {rfp.structured && (
            <div className="rounded-lg border p-4">
              <h2 className="text-sm font-semibold mb-2">Structured data</h2>
              <pre className="text-xs whitespace-pre-wrap wrap-break-words">
                {JSON.stringify(rfp.structured, null, 2)}
              </pre>
            </div>
          )}

          {rfp.metadata && (
            <div className="rounded-lg border p-4">
              <h2 className="text-sm font-semibold mb-2">Metadata</h2>
              <pre className="text-xs whitespace-pre-wrap wrap-break-words">
                {JSON.stringify(rfp.metadata, null, 2)}
              </pre>
            </div>
          )}
        </section>
      )}

      {/* Attachments */}
      {rfp.attachments.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Attachments</h2>
          <ul className="list-disc list-inside text-sm">
            {rfp.attachments.map((attachment) => (
              <li key={attachment.id}>
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {attachment.filename ?? attachment.url}
                </a>
                {attachment.mimeType && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({attachment.mimeType})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Invite vendors (using service-backed server action) */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Invite vendors</h2>

        {allVendors.length === 0 ? (
          <p className="text-sm text-gray-500">
            No vendors available. Create vendors first from the Vendors page.
          </p>
        ) : (
          <form
            action={inviteVendorsAction.bind(null, rfp.id)}
            className="space-y-3"
          >
            <div className="max-h-56 overflow-auto rounded-md border p-2 space-y-1">
              {allVendors.map((vendor) => (
                <label
                  key={vendor.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="vendorIds"
                    value={vendor.id}
                    defaultChecked={invitedVendorIds.has(vendor.id)}
                  />
                  <span>
                    {vendor.name}{" "}
                    <span className="text-xs text-gray-500">
                      ({vendor.email})
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Send RFP emails
            </button>
          </form>
        )}
      </section>

      {/* Invited vendors (RfpVendor) */}
      {rfp.rfpVendors.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Invited vendors</h2>
          <div className="space-y-2">
            {rfp.rfpVendors.map((rv) => (
              <div
                key={rv.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between rounded-lg border p-3 text-sm"
              >
                <div>
                  <div className="font-medium">
                    {rv.vendor?.name ?? "Unknown vendor"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Status: {rv.status}
                    {rv.sentAt && (
                      <> • Sent: {rv.sentAt.toISOString().slice(0, 10)}</>
                    )}
                    {rv.attempts > 0 && <> • Attempts: {rv.attempts}</>}
                  </div>
                </div>
                {rv.vendor?.email && (
                  <a
                    href={`mailto:${rv.vendor.email}`}
                    className="mt-2 md:mt-0 text-xs text-blue-600 hover:underline"
                  >
                    {rv.vendor.email}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Proposals */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Proposals</h2>

        {rfp.proposals.length === 0 && (
          <p className="text-sm text-gray-500">
            No proposals have been submitted yet.
          </p>
        )}

        {rfp.proposals.length > 0 && (
          <div className="space-y-3">
            {rfp.proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="rounded-lg border p-4 text-sm space-y-2"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-medium">
                      {proposal.vendor?.name ?? "Unnamed vendor"}
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

                {/* Proposal attachments */}
                {proposal.attachments.length > 0 && (
                  <div className="pt-2 border-t mt-2">
                    <div className="text-xs font-semibold mb-1">
                      Attachments
                    </div>
                    <ul className="list-disc list-inside text-xs">
                      {proposal.attachments.map((att) => (
                        <li key={att.id}>
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {att.filename ?? att.url}
                          </a>
                        </li>
                      ))}
                    </ul>
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
