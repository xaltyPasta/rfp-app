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


/* -------------------------------------------------------------------------- */
/*        NEW: Compare proposals and produce ranking using Groq               */
/* -------------------------------------------------------------------------- */

export type ProposalForAi = {
  proposalId: string;
  vendorName: string | null;
  totalPrice: number | null;
  currency: string | null;
  completeness: number | null;
  parsed: ParsedProposal | any; // structured proposal JSON you already store
};

export type AiComparisonItem = {
  proposalId: string;
  score: number; // 0–100, higher is better
  rank: number;  // 1 = best
  explanation?: any;
};

export type AiComparisonResult = AiComparisonItem[];

/**
 * Fallback deterministic ranking if Groq output is invalid.
 * Heuristic: lower totalPrice is better; tie-breaker = higher completeness.
 */
function fallbackRank(proposals: ProposalForAi[]): AiComparisonResult {
  const sorted = [...proposals].sort((a, b) => {
    const priceA = a.totalPrice ?? Number.POSITIVE_INFINITY;
    const priceB = b.totalPrice ?? Number.POSITIVE_INFINITY;

    if (priceA !== priceB) return priceA - priceB;

    const compA = a.completeness ?? 0;
    const compB = b.completeness ?? 0;
    return compB - compA;
  });

  return sorted.map((proposal, index) => ({
    proposalId: proposal.proposalId,
    score: Math.max(0, 100 - index * 5),
    rank: index + 1,
    explanation: {
      source: "fallback",
      reason:
        "Ranked primarily by lowest totalPrice, with completeness as tie-breaker.",
      totalPrice: proposal.totalPrice,
      currency: proposal.currency,
      completeness: proposal.completeness,
    },
  }));
}

/**
 * Normalize/validate AI output:
 * - Filter unknown proposalIds
 * - Ensure every proposal appears at least once
 * - Recompute ranks from score desc, starting at 1
 */
function normalizeAiResult(
  proposals: ProposalForAi[],
  rawItems: Partial<AiComparisonItem>[]
): AiComparisonResult {
  const proposalIds = new Set(proposals.map((p) => p.proposalId));
  const items: AiComparisonItem[] = [];

  for (const raw of rawItems) {
    if (!raw || !raw.proposalId) continue;
    if (!proposalIds.has(raw.proposalId)) continue;

    const safeScore = Number.isFinite(raw.score as number)
      ? Number(raw.score)
      : 0;

    items.push({
      proposalId: raw.proposalId,
      score: Math.min(100, Math.max(0, safeScore)),
      rank: 0, // temporary, recomputed below
      explanation: raw.explanation ?? null,
    });
  }

  if (items.length === 0) {
    return fallbackRank(proposals);
  }

  // Ensure all proposals appear at least once
  const existing = new Set(items.map((i) => i.proposalId));
  const missing = proposals.filter((p) => !existing.has(p.proposalId));

  if (missing.length > 0) {
    const fallbackForMissing = fallbackRank(missing);
    items.push(...fallbackForMissing);
  }

  // Recompute ranks from score desc, deterministic
  const sorted = [...items].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.proposalId.localeCompare(b.proposalId);
  });

  return sorted.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

/**
 * Main entry: use Groq (llama-3.3-70b) to compare proposals and generate
 * scores + ranks based on:
 * - price (totalPrice, currency)
 * - completeness
 * - parsed structured data (paymentTerms, deliveryDays, warrantyYears, items, notes)
 * - RFP structured JSON (from Rfp.structured) if you pass it in context
 */
export async function compareProposalsWithAi(
  proposals: ProposalForAi[],
  context: {
    rfpId: string;
    rfpTitle?: string;
    rfpDescription?: string | null;
    rfpStructured?: any | null;
    evaluationCriteria?: string | null;
  }
): Promise<AiComparisonResult> {
  if (proposals.length === 0) return [];

  const aiInput = proposals.map((p) => ({
    proposalId: p.proposalId,
    vendorName: p.vendorName,
    totalPrice: p.totalPrice,
    currency: p.currency,
    completeness: p.completeness,
    parsed: p.parsed,
  }));

  const systemPrompt = `
You are an expert procurement analyst evaluating vendor proposals for an RFP.

You MUST follow these rules:

1. Output ONLY a valid JSON object, no markdown, no extra text.
2. The JSON MUST have this exact shape:

{
  "items": [
    {
      "proposalId": "string",
      "score": number,
      "rank": number,
      "explanation": {
        "shortReason": "string",
        "priceComment": "string",
        "strengths": string[],
        "weaknesses": string[],
        "notes": "string"
      }
    },
    ...
  ]
}

3. Every "proposalId" from the input MUST appear exactly once in "items".
4. "score" should be 0–100 (higher is better).
5. "rank" must be unique and start at 1, with 1 as the best proposal.
6. Use ALL available information:
   - parsed proposal JSON (totalPrice, paymentTerms, deliveryDays, warrantyYears, items, notes)
   - completeness
   - cost (totalPrice, currency)
   - RFP structured JSON (requirements, items, constraints) if provided.
7. Prefer proposals that best match the RFP requirements overall:
   - requirement coverage & quality
   - delivery timeline fit
   - warranty/support
   - payment terms
   - total cost/value
`.trim();

  const userPrompt = {
    rfpContext: {
      rfpId: context.rfpId,
      title: context.rfpTitle ?? null,
      description: context.rfpDescription ?? null,
      structured: context.rfpStructured ?? null,
      evaluationCriteria:
        context.evaluationCriteria ??
        "Choose the overall best value: requirement coverage, quality, delivery timeline, and cost.",
    },
    proposals: aiInput,
  };

  let rawContent: string | undefined;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify(userPrompt, null, 2),
        },
      ],
    });

    rawContent = completion.choices[0]?.message?.content ?? "";
    const jsonText = extractJson(rawContent);

    const parsed = JSON.parse(jsonText) as {
      items?: Partial<AiComparisonItem>[];
    };

    if (!parsed || !Array.isArray(parsed.items)) {
      console.warn(
        "[compareProposalsWithAi] Groq returned invalid shape, using fallback.",
        jsonText.slice(0, 300)
      );
      return fallbackRank(proposals);
    }

    return normalizeAiResult(proposals, parsed.items);
  } catch (err) {
    console.error(
      "[compareProposalsWithAi] Groq error, using fallback.",
      err,
      rawContent?.slice(0, 300)
    );
    return fallbackRank(proposals);
  }
}