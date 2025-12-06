// app/dashboard/rfp/[id]/edit/page.tsx

import { notFound, redirect } from "next/navigation";
import { RfpStatus } from "@prisma/client";
import prisma from "../../../../../src/lib/prisma";

type PageProps = {
    // Next 15: params is a Promise in async server components
    params: Promise<{ id: string }>;
};

async function updateRfp(id: string, formData: FormData) {
    "use server";

    const title = formData.get("title")?.toString().trim();
    const description =
        formData.get("description")?.toString().trim() || null;
    const statusValue = formData.get("status")?.toString() as
        | RfpStatus
        | undefined;

    if (!title) {
        throw new Error("Title is required");
    }

    await prisma.rfp.update({
        where: { id },
        data: {
            title,
            description,
            status: statusValue ?? RfpStatus.DRAFT,
        },
    });

    redirect(`/dashboard/rfps/${id}`);
}

export default async function EditRfpPage({ params }: PageProps) {
    const { id } = await params;

    const rfp = await prisma.rfp.findUnique({
        where: { id },
    });

    if (!rfp) {
        notFound();
    }

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Edit RFP</h1>

            <form action={updateRfp.bind(null, id)} className="space-y-4">
                {/* Title */}
                <div className="space-y-1">
                    <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Title<span className="text-red-500">*</span>
                    </label>
                    <input
                        id="title"
                        name="title"
                        required
                        defaultValue={rfp.title}
                        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Description */}
                <div className="space-y-1">
                    <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        defaultValue={rfp.description ?? ""}
                        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Status */}
                <div className="space-y-1">
                    <label
                        htmlFor="status"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Status
                    </label>
                    <select
                        id="status"
                        name="status"
                        defaultValue={rfp.status}
                        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Object.values(RfpStatus).map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <button
                        type="submit"
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Save changes
                    </button>

                    <a
                        href={`/dashboard/rfps/${id}`}
                        className="text-sm text-gray-600 hover:underline"
                    >
                        Cancel
                    </a>
                </div>
            </form>
        </div>
    );
}
