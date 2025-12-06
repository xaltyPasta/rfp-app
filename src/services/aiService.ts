// src/services/aiService.ts

import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";

export type ParsedProposal = {
  totalPrice?: number | null;
  currency?: string | null;
  paymentTerms?: string | null;
  deliveryDays?: number | null;
  warrantyYears?: number | null;
  items?: Array<{ name?: string; quantity?: number; unitPrice?: number }>;
  notes?: string | null;
};

export type VendorRfpEmailPayload = {
  subject: string;
  textBody: string;
  htmlBody: string;
};

// Small helper to clean ```json ... ``` wrappers if the model adds them
function extractJson(text: string): string {
  let trimmed = text.trim();

  if (trimmed.startsWith("```")) {
    // remove leading ```json or ```
    trimmed = trimmed.replace(/^```(?:json)?/i, "").trim();
    // remove trailing ```
    trimmed = trimmed.replace(/```$/, "").trim();
  }

  return trimmed;
}

/**
 * Parse vendor proposal emails → JSON using Groq
 */
export async function parseProposalEmail(
  body: string
): Promise<ParsedProposal | null> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You extract structured proposal details from vendor email text. Respond with ONLY JSON, no explanation, no markdown.",
      },
      {
        role: "user",
        content: `Extract a JSON object with fields:
{
  "totalPrice": number | null,
  "currency": string | null,
  "paymentTerms": string | null,
  "deliveryDays": number | null,
  "warrantyYears": number | null,
  "items": Array<{ "name": string, "quantity": number, "unitPrice": number }>,
  "notes": string | null
}

Email body:
${body}`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) return null;

  const jsonText = extractJson(text);

  try {
    const parsed = JSON.parse(jsonText);
    return parsed as ParsedProposal;
  } catch (err) {
    console.error("Groq parseProposalEmail JSON parse error:", err, jsonText);
    return null;
  }
}

/**
 * Convert natural-language procurement request → structured RFP JSON using Groq
 */
export async function generateRfpStructureFromText(
  naturalText: string
): Promise<any | null> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Convert procurement requests into structured RFP JSON. Respond with ONLY JSON, no explanation, no markdown.",
      },
      {
        role: "user",
        content: `Create a JSON object representing this RFP with fields:
{
  "title": string,
  "description": string,
  "budgetTotal": number | null,
  "deliveryTimelineDays": number | null,
  "paymentTerms": string | null,
  "warrantyYears": number | null,
  "items": Array<{ "name": string, "quantity": number, "specs": string }>
}

Text:
${naturalText}`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) return null;

  const jsonText = extractJson(text);

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    console.error(
      "Groq generateRfpStructureFromText JSON parse error:",
      err,
      jsonText
    );
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*        NEW: Generate professional vendor invitation email via Groq         */
/* -------------------------------------------------------------------------- */

type MinimalRfpForEmail = {
  id: string;
  title: string;
  description?: string | null;
  structured?: any | null;

};

type MinimalVendorForEmail = {
  name: string;
  contactName?: string | null;
  email: string;
};

export async function generateVendorRfpEmail(params: {
  rfp: MinimalRfpForEmail;
  vendor: MinimalVendorForEmail;
}): Promise<VendorRfpEmailPayload> {
  const { rfp, vendor } = params;

  const vendorDisplayName =
    vendor.contactName?.trim() || vendor.name || "Valued Vendor";

  const structured = rfp.structured ?? {};

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `
You help a procurement team write professional B2B Request for Proposal (RFP) invitation emails.

- Tone: formal, clear, and concise.
- Audience: vendors / suppliers.
- Goal: invite them to participate in an RFP and clearly present key details.
- IMPORTANT: Respond with ONLY JSON, no explanation, no markdown fences.
- JSON shape MUST be:

{
  "subject": string,
  "textBody": string,
  "htmlBody": string
}
      `.trim(),
      },
      {
        role: "user",
        content: `
Generate a professional RFP invitation email to a vendor.

Vendor:
- Display name to address in greeting: ${vendorDisplayName}
- Company name (if any): ${vendor.name}
- Email: ${vendor.email}

RFP:
- Title: ${rfp.title}
- Description: ${rfp.description ?? ""}

Structured RFP JSON:
${JSON.stringify(structured, null, 2)}

The structured JSON may include fields like:
- "budgetTotal": total budget for this RFP
- "deliveryTimelineDays": expected delivery timeline in days
- "paymentTerms": requested payment terms
- "warrantyYears": duration of warranty/support
- "items": array of { "name", "quantity", "specs" } describing the scope of work

Requirements:

1. "subject":
   - Concise email subject line.
   - Example style: "Request for Proposal – <short summary>".

2. "textBody":
   - Plain-text email (no HTML).
   - Start with "Dear <vendorDisplayName>,"
   - Explain the purpose of the RFP.
   - Summarize key details based on the structured JSON when available:
     - Scope of work / items
     - Budget or cost expectations (budgetTotal)
     - Delivery timeline (deliveryTimelineDays)
     - Payment terms
     - Warranty / support (warrantyYears)
     - Any important constraints or evaluation criteria if present.
   - Clearly ask them to submit their proposal (pricing, payment terms, delivery, etc.) and mention how / by when if such data is present.
   - Close with "Best regards," and "Procurement Team".

3. "htmlBody":
   - HTML version of the same email body.
   - Do NOT include <html>, <head>, or <body> tags, only inner HTML.
   - Use semantic tags such as <p>, <h2>, <h3>, <ul>, <li>, <strong>.
   - Prefer a structure like:
     - Greeting
     - RFP Overview
     - Scope / Requirements (based on structured items/specifications)
     - Timeline and key dates (if any in structured data)
     - Budget / commercial terms (if any)
     - Submission instructions
     - Closing (Best regards, Procurement Team).
        `.trim(),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  const subjectPrefix = `RFP #${rfp.id} - `; // 👈 here

  if (!raw) {
    // Fallback if Groq fails entirely
    return {
      subject: `${subjectPrefix}Request for Proposal: ${rfp.title}`,
      textBody: `Dear ${vendorDisplayName},

We invite you to participate in the Request for Proposal (RFP) titled "${rfp.title}".

${rfp.description ?? ""}

Please reply to this email with your proposal, including pricing, payment terms, delivery timeline, and any other relevant commercial/technical details.

Best regards,
Procurement Team`,
      htmlBody: `
<p>Dear ${vendorDisplayName},</p>
<p>We invite you to participate in the Request for Proposal (RFP) titled <strong>${rfp.title}</strong>.</p>
<p>${(rfp.description ?? "").replace(/\n/g, "<br />")}</p>
<p>Please reply to this email with your proposal, including pricing, payment terms, delivery timeline, and any other relevant commercial or technical details.</p>
<p>Best regards,<br/>Procurement Team</p>
      `.trim(),
    };
  }

  const jsonText = extractJson(raw);

  try {
    const parsed = JSON.parse(jsonText) as VendorRfpEmailPayload;

    const baseSubject =
      parsed.subject || `Request for Proposal: ${rfp.title}`;

    return {
      subject: `${subjectPrefix}${baseSubject}`, // 👈 prepend ID here
      textBody:
        parsed.textBody ||
        `Dear ${vendorDisplayName},

We invite you to participate in the Request for Proposal (RFP) titled "${rfp.title}".

${rfp.description ?? ""}

Please reply to this email with your proposal, including pricing, payment terms, delivery timeline, and any other relevant commercial/technical details.

Best regards,
Procurement Team`,
      htmlBody:
        parsed.htmlBody ||
        `
<p>Dear ${vendorDisplayName},</p>
<p>We invite you to participate in the Request for Proposal (RFP) titled <strong>${rfp.title}</strong>.</p>
<p>${(rfp.description ?? "").replace(/\n/g, "<br />")}</p>
<p>Please reply to this email with your proposal, including pricing, payment terms, delivery timeline, and any other relevant commercial or technical details.</p>
<p>Best regards,<br/>Procurement Team</p>
        `.trim(),
    };
  } catch (err) {
    console.error(
      "Groq generateVendorRfpEmail JSON parse error:",
      err,
      jsonText
    );

    return {
      subject: `Request for Proposal: ${rfp.title} ${subjectPrefix}`,
      textBody: `Dear ${vendorDisplayName},

We invite you to participate in the Request for Proposal (RFP) titled "${rfp.title}".

${rfp.description ?? ""}

Please reply to this email with your proposal, including pricing, payment terms, delivery timeline, and any other relevant commercial/technical details.

Best regards,
Procurement Team`,
      htmlBody: `
<p>Dear ${vendorDisplayName},</p>
<p>We invite you to participate in the Request for Proposal (RFP) titled <strong>${rfp.title}</strong>.</p>
<p>${(rfp.description ?? "").replace(/\n/g, "<br />")}</p>
<p>Please reply to this email with your proposal, including pricing, payment terms, delivery timeline, and any other relevant commercial or technical details.</p>
<p>Best regards,<br/>Procurement Team</p>
      `.trim(),
    };
  }
}
