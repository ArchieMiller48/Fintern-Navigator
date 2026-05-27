import { NextRequest } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";

const ROLE_LABELS: Record<string, string> = {
  spring_week: "Spring Week insight programme",
  summer_internship: "Summer Internship",
  graduate: "Graduate Analyst",
};

const QUESTION_GUIDES: Record<string, string> = {
  spring_week: `
- Opening: warm welcome + "tell me about yourself"
- Why finance and why this specific area?
- Commercial awareness question (recent market event or trend)
- One competency question (e.g. teamwork, problem solving)
- Leave 2 minutes for candidate questions`,

  summer_internship: `
- Opening: warm welcome + "walk me through your background"
- Motivation: why finance, why this division, why this firm?
- Commercial awareness: markets knowledge, recent news
- Competency 1: leadership or teamwork (STAR)
- Competency 2: problem solving or resilience (STAR)
- Brief technical question appropriate to the division
- Leave 2 minutes for candidate questions`,

  graduate: `
- Opening: warm welcome + "take me through your CV"
- Motivation and long-term career goals
- Commercial awareness: specific market views, recent deal/trade
- Competency 1: leadership with measurable impact (STAR)
- Competency 2: dealing with failure or setback (STAR)
- Competency 3: working under pressure (STAR)
- Technical depth: valuation, modelling, or markets (division-specific)
- Leave 3 minutes for candidate questions`,
};

function buildSystemPrompt(config: {
  role: string;
  duration: number;
  firm: string;
  jd: string;
  cvText: string;
}): string {
  const roleLabel = ROLE_LABELS[config.role] ?? "finance role";
  const firmContext = config.firm ? ` at ${config.firm}` : " at a leading investment bank";
  const numQuestions = config.duration <= 10 ? 3 : config.duration <= 20 ? 5 : 7;

  const cvSection = config.cvText
    ? `\nCANDIDATE'S CV:\n${config.cvText.slice(0, 3000)}\n`
    : "";

  const jdSection = config.jd
    ? `\nROLE DESCRIPTION:\n${config.jd.slice(0, 2000)}\n`
    : "";

  return `You are Alex Carter, a Senior Recruiter with 9 years of experience at bulge-bracket investment banks. You are conducting a ${roleLabel} interview${firmContext}.

${cvSection}${jdSection}

INTERVIEW PLAN (${config.duration} minutes, ~${numQuestions} questions):
${QUESTION_GUIDES[config.role] ?? QUESTION_GUIDES.summer_internship}

YOUR VOICE AND STYLE:
- Warm, professional, and completely human — never robotic or formulaic
- Speak conversationally: use contractions, vary sentence length, sound natural
- React briefly and authentically before each new question — one short sentence like "That's an interesting perspective" or "Good, I appreciate the honesty"
- Ask targeted follow-ups when an answer is vague or particularly strong
- Reference the candidate's CV naturally if relevant: "I noticed you spent time at X — can you tell me more about that?"
- Keep your responses concise — this is a real-time spoken conversation (2–4 sentences max after the opening)
- Never use bullet points, headers, or any markdown — plain natural speech only

CRITICAL RULES:
- Never break character or admit you are an AI under any circumstances
- Never give feedback or scores during the interview — you are assessing, not coaching
- Ask exactly one question at a time — never stack multiple questions
- When time is nearly up, naturally close: "We're coming to the end of our time today. Before I let you go, do you have any questions for me?"
- After the candidate asks their questions and you answer, give a warm, natural sign-off: say it was great to meet them and that they'll hear from the team within a few days.`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, config } = await req.json();

    const systemPrompt = buildSystemPrompt(config);

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
