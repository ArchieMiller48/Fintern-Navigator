import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

/**
 * Reads the Anthropic API key directly from .env.local if process.env
 * doesn't have it (works around Next.js sandbox env stripping).
 */
function getApiKey(): string {
  // 1. Try process.env first (standard)
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;

  // 2. Fall back to reading .env.local directly
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const contents = fs.readFileSync(envPath, "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("ANTHROPIC_API_KEY=")) {
        const val = trimmed.slice("ANTHROPIC_API_KEY=".length).trim();
        if (val) return val;
      }
    }
  } catch {
    // file not found or unreadable
  }

  throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env.local");
}

export function getAnthropicClient(): Anthropic {
  return new Anthropic({ apiKey: getApiKey() });
}
