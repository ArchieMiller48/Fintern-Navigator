import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { EVALUATION_SYSTEM_PROMPT, ROLE_LABELS, buildEvaluationPrompt } from "@/lib/ai/prompts/evaluation";

export async function POST(req: NextRequest) {
  try {
    const { transcript, config } = await req.json();
    const roleLabel = ROLE_LABELS[config.role] ?? "finance";

    const prompt = buildEvaluationPrompt(transcript, roleLabel);

    const response = await getAnthropicClient().messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      system: EVALUATION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    const cleaned = content.text
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const evaluation = JSON.parse(cleaned);

    return NextResponse.json({ evaluation });
  } catch (err) {
    console.error("[Interview Evaluate Error]", err);
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Evaluation parsing failed. Please try again." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Evaluation failed" },
      { status: 500 }
    );
  }
}
