// src/components/rfp/RfpCard.tsx
"use client";

import Link from "next/link";
import { format } from "date-fns";

export default function RfpCard({
  id,
  title,
  status,
  description,
  createdAt,
}: {
  id: string;
  title: string;
  status: string;
  description?: string;
  createdAt: Date;
}) {
  return (
    <article className="bg-white border border-slate-100 rounded-md p-4 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <div className="text-xs text-slate-500">{format(new Date(createdAt), "dd MMM yyyy")}</div>
        </div>

        {description && <p className="mt-2 text-sm text-slate-600 line-clamp-3">{description}</p>}

        <div className="mt-3">
          <span
            className={`inline-block text-xs px-2 py-1 rounded-full ${
              status === "OPEN" ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-700"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Link href={`/dashboard/rfps/${id}`} className="text-sm text-blue-600">
          Open
        </Link>

        <Link href={`/dashboard/rfps/${id}/edit`} className="text-sm px-2 py-1 rounded bg-slate-100">
          Edit
        </Link>
      </div>
    </article>
  );
}


