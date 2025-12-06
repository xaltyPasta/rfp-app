// src/services/rfpService.ts

import { RfpStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { generateRfpStructureFromText, generateVendorRfpEmail } from "./aiService";
import { sendRfpEmail } from "./emailService";

/**
 * AI-powered RFP creation from natural language.
 *
 * - Calls Groq to generate structured RFP JSON
 * - Stores the structured JSON in Rfp.structured
 * - Stores AI metadata + original text in Rfp.metadata.ai
 * - Writes an AuditLog entry for traceability
 */
export async function createRfpFromNaturalText(
  naturalText: string,
  opts?: {
    status?: RfpStatus;
    createdById?: string | null;
  }
) {
  const status = opts?.status ?? RfpStatus.DRAFT;
  const createdById = opts?.createdById ?? null;

  const structured = await generateRfpStructureFromText(naturalText);

  const title: string =
    structured?.title?.toString().trim() ||
    naturalText.slice(0, 60) ||
    "Untitled RFP";

  const description: string | null =
    structured?.description?.toString().trim() || naturalText.trim() || null;

  const aiMeta = {
    source: "NATURAL_LANGUAGE_RFP",
    model: "groq/llama-3.3-70b-versatile",
    naturalText,
    structuredPreview: structured ?? null,
    generatedAt: new Date().toISOString(),
  };

  const metadata = {
    ai: aiMeta,
  };

  const rfp = await prisma.rfp.create({
    data: {
      title,
      description,
      status,
      createdById,
      structured: structured ?? null,
      metadata,
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: "RFP",
      entityId: rfp.id,
      action: "AI_RFP_GENERATION",
      payload: aiMeta,
      createdBy: createdById ?? null,
    },
  });

  return rfp;
}

/**
 * Invite vendors to an RFP using AI-generated, polished emails.
 * Each email uses:
 * - Vendor details
 * - RFP title + description
 * - RFP structured JSON (scope, budget, payment terms, etc.)
 * AI returns: { subject, textBody, htmlBody }
 */
export async function inviteVendorsToRfp(rfpId: string, vendorIds: string[]) {
  const rfp = await prisma.rfp.findUnique({ where: { id: rfpId } });
  if (!rfp) throw new Error("RFP not found");

  const vendors = await prisma.vendor.findMany({
    where: { id: { in: vendorIds } },
  });

  const results: Array<{
    vendorId: string;
    sent: boolean;
    messageId?: string | null;
    error?: string | null;
  }> = [];

  for (const vendor of vendors) {
    // -------------------------------
    // 1️⃣ Generate AI professional email
    // -------------------------------
    const email = await generateVendorRfpEmail({
      rfp: {
        id:rfp.id,
        title: rfp.title,
        description: rfp.description,
        structured: rfp.structured, // prisma JSON field
      },
      vendor: {
        name: vendor.name,
        contactName: vendor.contactName,
        email: vendor.email,
      },
    });

    // -------------------------------
    // 2️⃣ Send email (text + HTML)
    // -------------------------------
    const sent = await sendRfpEmail(
      vendor.email,
      email.subject,
      email.textBody,
      email.htmlBody
    );

    // -------------------------------
    // 3️⃣ Update rfpVendor table
    // -------------------------------
    if (sent.success) {
      await prisma.rfpVendor.upsert({
        where: {
          rfpId_vendorId: { rfpId, vendorId: vendor.id },
        },
        update: {
          status: "SENT",
          sentAt: new Date(),
          messageId: sent.id ?? null,
          attempts: { increment: 1 },
        },
        create: {
          rfpId,
          vendorId: vendor.id,
          status: "SENT",
          sentAt: new Date(),
          messageId: sent.id ?? null,
          attempts: 1,
        },
      });
    }

    // -------------------------------
    // 4️⃣ Push result summary
    // -------------------------------
    results.push({
      vendorId: vendor.id,
      sent: sent.success,
      messageId: sent.id ?? null,
      error: sent.error ?? null,
    });
  }

  return results;
}