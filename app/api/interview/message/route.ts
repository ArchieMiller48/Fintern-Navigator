import { NextRequest } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { buildInterviewSystemPrompt } from "@/lib/ai/prompts/interview";

export async function POST(req: NextRequest) {
  try {
    const { messages, config } = await req.json();

    const systemPrompt = buildInterviewSystemPrompt(config);

    const stream = getAnthropicClient().messages.stream({
      model: "claude-opus-4-5",
      max_tokens: 350,
      system: systemPrompt,
      messages,
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("[Interview Message Error]", err);
    return new Response(JSON.stringify({ error: "Failed to get response" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
