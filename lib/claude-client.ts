/**
 * Shared Claude API client for every semantic-edge module
 * (classifiers/semantic-match.ts, agents/*-semantic.ts). API key is read
 * from the environment -- never hardcoded.
 */

import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

let cachedClient: Anthropic | null = null;

function getClaudeClient(): Anthropic {
  if (!cachedClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key.");
    }
    cachedClient = new Anthropic({ apiKey });
  }
  return cachedClient;
}

/**
 * Sends a single-turn system + user prompt to Claude and parses the
 * response as JSON. Returns null (never throws) on any failure -- a
 * missing API key, a network error, or a response that isn't valid JSON
 * -- so callers can fall back to deterministic behaviour instead of
 * crashing the conversation turn.
 */
export async function callClaudeForJson<T>(system: string, userMessage: string): Promise<T | null> {
  try {
    const client = getClaudeClient();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return null;
    }

    return parseJsonLoosely<T>(textBlock.text);
  } catch (error) {
    console.error("[claude-client] call failed, caller should fall back to deterministic behaviour", error);
    return null;
  }
}

/**
 * Claude is instructed to respond with JSON only, but strips code fences
 * defensively in case it wraps the response in a ```json block anyway.
 */
function parseJsonLoosely<T>(text: string): T | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = fenced ? fenced[1] : trimmed;

  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}
