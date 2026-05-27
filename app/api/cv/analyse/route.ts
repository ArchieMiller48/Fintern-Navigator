import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { CV_ANALYSIS_SYSTEM_PROMPT, buildCvAnalysisPrompt } from "@/lib/ai/prompts/cv-analysis";

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
        system: CV_ANALYSIS_SYSTEM_PROMPT,
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
              text: buildCvAnalysisPrompt(jobDescription || undefined),
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
        system: CV_ANALYSIS_SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: `CV TEXT:\n${cvText}\n\n${buildCvAnalysisPrompt(jobDescription || undefined)}`,
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
