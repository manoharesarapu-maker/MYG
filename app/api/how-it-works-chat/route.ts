import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

/**
 * Illustrative Guide-layer system prompt for this visualization only —
 * not the production MyGuide system prompt (that codebase wasn't
 * available when this view was built). Keep it generic and scoped to
 * the parking permit scenario used throughout /how-it-works.
 */
const GUIDE_SYSTEM_PROMPT = `You are the "Guide" layer of a council citizen-services assistant, shown here only as an illustration of how Guide, Validator, and Plus work together.
A citizen has raised a request related to parking permits or parking fines. Respond conversationally and briefly (2-4 sentences), acknowledging their request and explaining in plain language what happens next, as if you are about to hand this off to a policy check. Do not invent specific eligibility rules, fees, or deadlines — speak in general terms only, since this demo does not have access to the real council policy dataset.`;

export async function POST(req: Request) {
  const { message } = await req.json();

  if (typeof message !== "string" || !message.trim()) {
    return new Response("Missing message", { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      "ANTHROPIC_API_KEY is not configured on this deployment, so the Guide band can't make a live call. Set it in your environment and reload.",
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });

  const stream = await client.messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 300,
    system: GUIDE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: message }],
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      stream.on("text", (text) => {
        controller.enqueue(encoder.encode(text));
      });
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
