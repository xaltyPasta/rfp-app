// src/services/emailService.ts
import prisma from "../lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type SentResult = {
  id?: string | null;
  success: boolean;
  error?: string | null;
};

// This should be your Resend sending identity
const FROM_EMAIL = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

// This MUST be your inbound address from Resend “Receiving Emails” page
// e.g. rfp-inbound@<your-id>.resend.app
const INBOUND_REPLY_TO =
  process.env.REPLY_TO_EMAIL ?? "rfp-inbound@uuustaafle.resend.app";

export async function sendRfpEmail(
  to: string,
  subject: string,
  text: string,
  htmlBody: string
): Promise<SentResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      text,
      html: htmlBody,
      // let Resend set Reply-To correctly
      replyTo: INBOUND_REPLY_TO,
      // OR you can instead use:
      // headers: { "Reply-To": INBOUND_REPLY_TO },
    });

    if (error) {
      console.error("sendRfpEmail resend error", error);
      return { success: false, error: (error as any)?.message ?? "Unknown error" };
    }

    return { id: (data as any)?.id ?? null, success: true };
  } catch (err: any) {
    console.error("sendRfpEmail error", err);
    return { success: false, error: err?.message ?? String(err) };
  }
}
