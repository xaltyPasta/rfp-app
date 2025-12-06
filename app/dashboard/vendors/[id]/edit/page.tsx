// app/dashboard/vendor/[id]/edit/page.tsx

import { notFound, redirect } from "next/navigation";
import prisma from "../../../../../src/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function updateVendor(id: string, formData: FormData) {
  "use server";

  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const contactName =
    formData.get("contactName")?.toString().trim() || null;
  const phone = formData.get("phone")?.toString().trim() || null;
  const metaRaw = formData.get("meta")?.toString().trim() || "";

  if (!name || !email) {
    throw new Error("Name and email are required");
  }

  let meta: any = null;
  if (metaRaw) {
    try {
      meta = JSON.parse(metaRaw);
    } catch {
      meta = null;
    }
  }

  await prisma.vendor.update({
    where: { id },
    data: {
      name,
      email,
      contactName,
      phone,
      meta,
    },
  });

  redirect(`/dashboard/vendors/${id}`);
}

export default async function EditVendorPage({ params }: PageProps) {
  const { id } = await params;

  const vendor = await prisma.vendor.findUnique({
    where: { id },
  });

  if (!vendor) {
    notFound();
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Edit vendor</h1>

      <form action={updateVendor.bind(null, id)} className="space-y-4">
        {/* Name */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Name<span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            required
            defaultValue={vendor.name}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Email<span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            required
            defaultValue={vendor.email}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Contact name */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Contact name
          </label>
          <input
            name="contactName"
            defaultValue={vendor.contactName ?? ""}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            name="phone"
            defaultValue={vendor.phone ?? ""}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Meta JSON */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Metadata (JSON)
          </label>
          <textarea
            name="meta"
            rows={4}
            defaultValue={
              vendor.meta ? JSON.stringify(vendor.meta, null, 2) : ""
            }
            className="w-full rounded-md border px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save changes
          </button>

          <a
            href={`/dashboard/vendors/${id}`}
            className="text-sm text-gray-600 hover:underline"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}

