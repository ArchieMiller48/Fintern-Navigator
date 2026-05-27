/**
 * CV Analysis Prompts
 * Used by: app/api/cv/analyse/route.ts
 *
 * Claude reads the uploaded CV (PDF or DOCX) and returns a structured JSON
 * analysis scored across 5 dimensions: ATS, Content, Keywords, Impact, Format.
 */

export const CV_ANALYSIS_SYSTEM_PROMPT = `You are an elite finance recruiter and CV expert with 20+ years of experience at bulge-bracket investment banks (Goldman Sachs, Morgan Stanley, JPMorgan), top private equity firms, and premier consulting firms (McKinsey, BCG, Bain).

You evaluate CVs with the precision of a senior recruiter screening hundreds of applications. You understand exactly what makes a finance CV stand out at tier-1 institutions.

You MUST return a valid JSON object only — no markdown, no explanation, just raw JSON.`;

export const buildCvAnalysisPrompt = (jobDescription?: string) =>
  `Analyse this CV for a finance role${jobDescription ? " targeting the job description provided" : ""}.

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
