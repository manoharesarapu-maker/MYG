import { NextRequest, NextResponse } from "next/server";
import { handler, resetSession } from "@/services/guide-orchestrator/handler";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.sessionId !== "string" || typeof body.message !== "string") {
    return NextResponse.json({ error: "sessionId and message (strings) are required" }, { status: 400 });
  }

  const result = await handler({
    sessionId: body.sessionId,
    message: body.message,
    channel: body.channel === "voice" ? "voice" : "web_chat",
  });

  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.sessionId !== "string") {
    return NextResponse.json({ error: "sessionId (string) is required" }, { status: 400 });
  }

  resetSession(body.sessionId);
  return NextResponse.json({ ok: true });
}
