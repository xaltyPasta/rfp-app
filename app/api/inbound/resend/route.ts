// app/api/inbound/resend/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleInboundEmail } from "@/src/services/proposalService";

export const POST = async (req: NextRequest) => {
  try {
    const event = await req.json();
    console.log("🔥 Resend inbound event:", JSON.stringify(event, null, 2));

    if (event.type !== "email.received") {
      console.log("Ignoring non-email.received event:", event.type);
      return NextResponse.json({ ok: true, ignored: true });
    }

    // 👇 VERY IMPORTANT: pass ONLY event.data, not the whole event
    const payload = event.data;

    const proposal = await handleInboundEmail(payload);

    if (!proposal) {
      console.log("handleInboundEmail returned null (no proposal created)");
      return NextResponse.json({
        ok: true,
        created: false,
        reason: "handleInboundEmail_returned_null",
      });
    }

    return NextResponse.json({ ok: true, created: true, proposalId: proposal.id });
  } catch (err) {
    console.error("Error in /api/inbound/resend:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
};
