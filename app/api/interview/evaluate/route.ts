import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";

const ROLE_LABELS: Record<string, string> = {
  spring_week: "Spring Week",
  summer_internship: "Summer Internship",
  graduate: "Graduate Analyst",
};

export async function POST(req: NextRequest) {
  try {
    const { transcript, config } = await req.json();
    const roleLabel = ROLE_LABELS[config.role] ?? "finance";

    const prompt = `You are an expert finance recruiter evaluating a candidate's mock ${roleLabel} interview. Below is the full interview transcript.

INTERVIEW TRANSCRIPT:
${transcript}

Evaluate this candidate against the real-world criteria used by bulge-bracket banks and top finance firms for ${roleLabel} interviews. Be honest, specific, and genuinely useful.

Scoring dimensions (each 0–100):
1. Communication & Clarity — structure, articulation, use of STAR where appropriate
2. Commercial Awareness — understanding of markets, current events, business acumen
3. Motivation & Fit — conviction for finance, this specific firm/division, long-term goals
4. Competency & Leadership — quality of examples, impact demonstrated, self-awareness
5. Technical Knowledge — appropriate depth for ${roleLabel} level

Return ONLY a valid JSON object with this exact structure:
{
  "overallScore": <weighted integer 0-100>,
  "communicationScore": <integer 0-100>,
  "commercialScore": <integer 0-100>,
  "motivationScore": <integer 0-100>,
  "competencyScore": <integer 0-100>,
  "technicalScore": <integer 0-100>,
  "scoreRationale": "<2-3 sentence honest overall assessment>",
  "strengths": ["<specific strength with evidence>", "<specific strength>", "<specific strength>"],
  "weaknesses": ["<specific weakness with actionable advice>", "<specific weakness>", "<specific weakness>"],
  "recommendations": ["<concrete improvement action>", "<concrete improvement action>", "<concrete improvement action>"],
  "questionFeedback": [
    {
      "question": "<interviewer's question>",
      "summary": "<1 sentence summary of their answer>",
      "feedback": "<specific, honest feedback on this answer>",
      "score": <integer 0-100>
    }
  ]
}`;

    const response = await getAnthropicClient().messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      system:
        "You are an expert finance recruiter evaluating interview performance. Return only valid JSON.",
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
