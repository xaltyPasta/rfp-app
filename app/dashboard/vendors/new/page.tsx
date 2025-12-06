// app/dashboard/vendor/new/page.tsx

import { redirect } from "next/navigation";
import prisma from "../../../../src/lib/prisma";

async function createVendor(formData: FormData) {
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
      // If invalid JSON, you could throw. For now, ignore.
      meta = null;
    }
  }

  const vendor = await prisma.vendor.create({
    data: {
      name,
      email,
      contactName,
      phone,
      meta,
    },
  });

  redirect(`/dashboard/vendors/${vendor.id}`);
}

export default function NewVendorPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Create new vendor</h1>

      <form action={createVendor} className="space-y-4">
        {/* Name */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Name<span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            required
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Acme Supplies Pvt Ltd"
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
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="vendor@example.com"
          />
        </div>

        {/* Contact name */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Contact name
          </label>
          <input
            name="contactName"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Primary contact person"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            name="phone"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+91 ..."
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
            className="w-full rounded-md border px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
            placeholder='e.g. { "industry": "IT services", "rating": 4.5 }'
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create vendor
          </button>

          <a
            href="/dashboard/vendors"
            className="text-sm text-gray-600 hover:underline"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}

