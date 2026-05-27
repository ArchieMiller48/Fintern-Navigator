import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";

const SYSTEM_PROMPT = `You are an elite finance recruiter and CV expert with 20+ years of experience at bulge-bracket investment banks (Goldman Sachs, Morgan Stanley, JPMorgan), top private equity firms, and premier consulting firms (McKinsey, BCG, Bain).

You evaluate CVs with the precision of a senior recruiter screening hundreds of applications. You understand exactly what makes a finance CV stand out at tier-1 institutions.

You MUST return a valid JSON object only — no markdown, no explanation, just raw JSON.`;

const ANALYSIS_PROMPT = (jobDescription?: string) => `Analyse this CV for a finance role${jobDescription ? " targeting the job description provided" : ""}.

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}\n\n` : ""}Return ONLY a JSON object with this exact structure:
{
  "overallScore": <integer 0-100>,
  "atsScore": <integer 0-100>,
  "contentScore": <integer 0-100>,
  "formatScore": <integer 0-100>,
  "keywordScore": <integer 0-100>,
  "impactScore": <integer 0-100>,
  "scoreRationale": "<2-3 sentence explanation>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>", "<strength 4>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>", "<weakness 4>"],
  "missingKeywords": ["<keyword>", "<keyword>", "<keyword>", "<keyword>", "<keyword>", "<keyword>", "<keyword>", "<keyword>"],
  "presentKeywords": ["<keyword>", "<keyword>", "<keyword>", "<keyword>", "<keyword>"],
  "criticalIssues": ["<issue if any>"],
  "bulletImprovements": [
    {
      "original": "<exact bullet point from the CV>",
      "improved": "<rewritten version optimised for finance recruiting>",
      "explanation": "<why this version is stronger>"
    },
    {
      "original": "<exact bullet point from the CV>",
      "improved": "<rewritten version optimised for finance recruiting>",
      "explanation": "<why this version is stronger>"
    },
    {
      "original": "<exact bullet point from the CV>",
      "improved": "<rewritten version optimised for finance recruiting>",
      "explanation": "<why this version is stronger>"
    },
    {
      "original": "<exact bullet point from the CV>",
      "improved": "<rewritten version optimised for finance recruiting>",
      "explanation": "<why this version is stronger>"
    }
  ],
  "immediateActions": [
    { "title": "<action>", "description": "<detail>", "scoreImpact": "<+X pts>", "priority": "high" },
    { "title": "<action>", "description": "<detail>", "scoreImpact": "<+X pts>", "priority": "high" },
    { "title": "<action>", "description": "<detail>", "scoreImpact": "<+X pts>", "priority": "medium" },
    { "title": "<action>", "description": "<detail>", "scoreImpact": "<+X pts>", "priority": "medium" },
    { "title": "<action>", "description": "<detail>", "scoreImpact": "<+X pts>", "priority": "low" }
  ],
  "financeIntel": {
    "dealExperience": { "status": "Not evident" | "Partial" | "Strong", "comment": "<assessment>" },
    "technicalSkills": { "status": "Not evident" | "Partial" | "Strong", "comment": "<assessment>" },
    "prestige": { "status": "Not evident" | "Partial" | "Strong", "comment": "<assessment>" },
    "leadershipNarrative": { "status": "Not evident" | "Needs depth" | "Strong", "comment": "<assessment>" }
  }
}`;

async function parseDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const jobDescription = formData.get("jobDescription") as string | undefined;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const isPdf = file.type === "application/pdf";
    const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!isPdf && !isDocx) {
      return NextResponse.json({ error: "Only PDF and DOCX files are supported" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const client = getAnthropicClient();
    let response: Awaited<ReturnType<typeof client.messages.create>>;

    if (isPdf) {
      // Send PDF directly to Claude — no parsing library needed
      response = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: buffer.toString("base64"),
              },
            } as any,
            {
              type: "text",
              text: ANALYSIS_PROMPT(jobDescription || undefined),
            },
          ],
        }],
      });
    } else {
      // DOCX: extract text with mammoth, send as plain text
      const cvText = await parseDocx(buffer);
      if (!cvText || cvText.length < 50) {
        return NextResponse.json({ error: "Could not extract text from file. Make sure it is not a scanned image." }, { status: 400 });
      }
      response = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: `CV TEXT:\n${cvText}\n\n${ANALYSIS_PROMPT(jobDescription || undefined)}`,
        }],
      });
    }

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Clean up response (remove any accidental markdown fences)
    const cleaned = content.text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const analysis = JSON.parse(cleaned);

    return NextResponse.json({ analysis, fileName: file.name });
  } catch (err) {
    console.error("[CV Analyse Error]", err);
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "AI returned malformed data. Please try again." }, { status: 500 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
