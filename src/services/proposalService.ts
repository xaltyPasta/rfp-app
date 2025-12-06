// src/services/proposalService.ts
import prisma from "../lib/prisma";
import { parseProposalEmail } from "./aiService";
import type { Proposal } from "@prisma/client";
import { Resend } from "resend";
import { uploadRemoteFileToCloudinary } from "./cloudinaryService";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function handleInboundEmail(payload: any): Promise<Proposal | null> {
  console.log("📥 handleInboundEmail payload:", {
    subject: payload?.subject,
    from: payload?.from,
    email_id: payload?.email_id,
    hasText: !!payload?.text,
    hasHtml: !!payload?.html,
  });

  const subject: string = payload.subject ?? "";
  const from: string = payload.from ?? "";

  // 1) Extract RFP ID
  const idMatch = subject.match(
    /RFP\s*#([0-9a-fA-F-]{36}|rfp[0-9]{5}-[0-9-]{24})\b/i
  );
  const rfpId = idMatch?.[1]?.trim() ?? null;

  if (!rfpId) {
    console.warn("handleInboundEmail: NO VALID RFP ID FOUND", subject);
    return null;
  }

  const rfp = await prisma.rfp.findUnique({ where: { id: rfpId } });
  if (!rfp) {
    console.warn("❌ RFP not found in DB:", rfpId);
    return null;
  }

  // 2) Vendor lookup
  const emailMatch = (from.match(/<([^>]+)>/) ?? [null, from])[1];
  const fromEmail = (emailMatch ?? from).trim().toLowerCase();
  const vendor = await prisma.vendor.findUnique({
    where: { email: fromEmail },
  });

  // 3) Fetch full Resend email body
  let fullEmail: any = null;
  let textBody = "";
  try {
    if (payload.email_id) {
      const { data, error } = await resend.emails.receiving.get(payload.email_id);
      if (!error && data) {
        fullEmail = data;
        textBody = data.text ?? data.html ?? "";
      } else {
        console.error("❌ error fetching full email:", error);
      }
    } else {
      textBody = payload.text ?? payload.html ?? "";
    }
  } catch (err) {
    console.error("⚠ Resend get error:", err);
  }

  const rawEmailForStorage = {
    from: fullEmail?.from ?? payload.from ?? null,
    subject: fullEmail?.subject ?? payload.subject ?? null,
    text: fullEmail?.text ?? payload.text ?? null,
    html: fullEmail?.html ?? payload.html ?? null,
    body: fullEmail?.text ?? fullEmail?.html ?? payload.text ?? payload.html ?? null,
    email_id: payload.email_id ?? null,
    webhook: payload,
    full: fullEmail,
  };

  // 4) Create RAW proposal
  let proposal: Proposal;
  try {
    proposal = await prisma.proposal.create({
      data: {
        rfpId: rfp.id,
        vendorId: vendor?.id ?? null,
        rawEmail: rawEmailForStorage,
        status: "RAW",
        needsReview: true,
      },
    });
  } catch (err) {
    console.error("❌ Error creating proposal:", err);
    return null;
  }

  // ⭐⭐⭐ 5) PROCESS ATTACHMENTS (NEW CODE HERE)
  try {
    if (payload.email_id) {
      const { data: attachments, error } =
        await resend.emails.receiving.attachments.list({
          emailId: payload.email_id,
        });

      if (error) {
        console.error("❌ Resend attachment list error:", error);
      } else if (attachments?.data?.length) {
        console.log("📎 Found attachments:", attachments.data.length);

        for (const att of attachments.data) {
          if (!att.download_url) continue;

          const uploaded = await uploadRemoteFileToCloudinary({
            fileUrl: att.download_url,
            filename: att.filename ?? undefined,
            folder: "rfp-app/proposals",
          });

          if (!uploaded) {
            console.warn("⚠ Cloudinary upload failed:", att.filename);
            continue;
          }

          await prisma.attachment.create({
            data: {
              url: uploaded.url,
              publicId: uploaded.publicId,
              filename: att.filename ?? null,
              mimeType: att.content_type ?? null,
              size: att.size ?? null,
              proposalId: proposal.id,
            },
          });

          console.log("✅ Uploaded & saved attachment:", uploaded.url);
        }
      }
    }
  } catch (err) {
    console.error("⚠ Attachment processing error:", err);
  }

  // 6) Parse with AI
  const parsed = textBody ? await parseProposalEmail(textBody) : null;

  // 7) Compute completeness
  let completeness: number | null = null;
  if (parsed) {
    let present = 0;
    const total = 6;
    if (parsed.totalPrice) present++;
    if (parsed.currency) present++;
    if (parsed.paymentTerms) present++;
    if (parsed.deliveryDays) present++;
    if (parsed.warrantyYears) present++;
    if (parsed.items?.length) present++;
    completeness = present / total;
  }

  const needsReview = !parsed || (completeness ?? 0) < 0.6;

  // 8) Update proposal with parsed data
  const updated = await prisma.proposal.update({
    where: { id: proposal.id },
    data: {
      parsed: parsed ?? {},
      totalPrice: parsed?.totalPrice ?? null,
      currency: parsed?.currency ?? null,
      completeness,
      needsReview,
      status: parsed ? "PARSED" : "RAW",
    },
  });

  // 9) Mark RfpVendor responded
  if (vendor) {
    await prisma.rfpVendor.updateMany({
      where: { rfpId: rfp.id, vendorId: vendor.id },
      data: { status: "RESPONDED" },
    });
  }

  // 10) Audit log
  await prisma.auditLog.create({
    data: {
      entity: "PROPOSAL",
      entityId: updated.id,
      action: "PARSE",
      payload: { subject, fromEmail, completeness },
    },
  });

  return updated;
}
