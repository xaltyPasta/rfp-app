// app/dashboard/vendors/page.tsx

import Link from "next/link";
import prisma from "../../../src/lib/prisma";

export default async function VendorListPage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          rfpVendors: true,
          proposals: true,
        },
      },
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vendors</h1>
          <p className="text-sm text-gray-600">
            Manage vendor accounts, contacts, and related proposals.
          </p>
        </div>

        <Link
          href="/dashboard/vendors/new"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New vendor
        </Link>
      </div>

      {vendors.length === 0 && (
        <p className="text-sm text-gray-500">No vendors created yet.</p>
      )}

      <div className="space-y-3">
        {vendors.map((vendor) => (
          <div
            key={vendor.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="space-y-1">
              <Link
                href={`/dashboard/vendors/${vendor.id}`}
                className="text-base font-semibold hover:underline"
              >
                {vendor.name}
              </Link>

              <div className="text-sm text-gray-600">
                {vendor.email}
                {vendor.contactName && (
                  <> • Contact: {vendor.contactName}</>
                )}
                {vendor.phone && <> • {vendor.phone}</>}
              </div>

              <div className="text-xs text-gray-500">
                {vendor._count.rfpVendors} RFP invitations •{" "}
                {vendor._count.proposals} proposals
              </div>
            </div>

            <Link
              href={`/dashboard/vendors/${vendor.id}/edit`}
              className="text-sm text-blue-600 hover:underline"
            >
              Edit
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

