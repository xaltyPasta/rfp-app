// app/dashboard/rfp/new/page.tsx

import { redirect } from "next/navigation";
import { RfpStatus } from "@prisma/client";
import { createRfpFromNaturalText } from "../../../../src/services/rfpService";

async function createRfpAction(formData: FormData) {
    "use server";

    const naturalText = formData.get("naturalText")?.toString().trim();
    const statusValue = formData.get("status")?.toString() as
        | RfpStatus
        | undefined;

    if (!naturalText) {
        throw new Error("Please describe what you want to buy.");
    }

    const rfp = await createRfpFromNaturalText(naturalText, {
        status: statusValue ?? RfpStatus.DRAFT,
        // createdById: later from session
    });

    redirect(`/dashboard/rfps/${rfp.id}`);
}

export default function NewRfpPage() {
    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Create new RFP (AI)</h1>

            <form action={createRfpAction} className="space-y-6">
                {/* Natural-language spec (AI) */}
                <div className="space-y-1">
                    <label
                        htmlFor="naturalText"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Describe what you want to buy
                        <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-1">
                        The system will use AI to generate a structured RFP (title,
                        description, items, budget, etc.) from this description.
                    </p>
                    <textarea
                        id="naturalText"
                        name="naturalText"
                        rows={6}
                        required
                        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`e.g. "I need to procure laptops and monitors for our new office.
Budget is $50,000 total. Need delivery within 30 days.
We need 20 laptops with 16GB RAM and 15 monitors 27-inch.
Payment terms should be net 30, and we need at least 1 year warranty."`}
                    />
                </div>

                {/* Status */}
                <div className="space-y-1">
                    <label
                        htmlFor="status"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Initial status
                    </label>
                    <select
                        id="status"
                        name="status"
                        defaultValue={RfpStatus.DRAFT}
                        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Object.values(RfpStatus).map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500">
                        Typically start as <code>DRAFT</code> and move to <code>OPEN</code>{" "}
                        when ready to send to vendors.
                    </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <button
                        type="submit"
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Create RFP with AI
                    </button>

                    <a
                        href="/dashboard/rfps"
                        className="text-sm text-gray-600 hover:underline"
                    >
                        Cancel
                    </a>
                </div>
            </form>
        </div>
    );
}
