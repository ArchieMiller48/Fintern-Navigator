import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

type Replacement = { original: string; improved: string };

/* ── XML helpers ──────────────────────────────────────────────────────────── */

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Apply replacements to a DOCX word/document.xml string.
 * Tries XML-escaped match first, then raw match.
 * Does NOT normalise runs — that caused content duplication.
 */
function applyReplacementsToXml(xml: string, replacements: Replacement[]): string {
  let out = xml;
  for (const { original, improved } of replacements) {
    const clean = original.replace(/^[•\-\*–]\s*/, "").trim();

    // Strategy 1: XML-escaped (most common — Word escapes & < > in text nodes)
    const escapedOrig = escapeXml(clean);
    const escapedImproved = escapeXml(improved);
    if (out.includes(escapedOrig)) {
      out = out.replace(escapedOrig, escapedImproved);
      continue;
    }

    // Strategy 2: Plain text match (for documents where text isn't escaped)
    if (out.includes(clean)) {
      out = out.replace(clean, improved);
    }
  }
  return out;
}

/* ── PDF text extraction ──────────────────────────────────────────────────── */

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  // De-duplicate repeated lines (PDFParse can repeat lines for multi-col PDFs)
  const lines = result.text.split(/\r?\n/);
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const line of lines) {
    const key = line.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(line);
  }
  return deduped.join("\n");
}

/* ── Build a complete DOCX from plain text + replacements ─────────────────── */

function buildDocxFromText(rawText: string, replacements: Replacement[]): JSZip {
  let text = rawText;
  for (const { original, improved } of replacements) {
    const clean = original.replace(/^[•\-\*–]\s*/, "").trim();
    if (text.includes(clean)) text = text.replace(clean, improved);
  }

  const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.length > 0);

  function isHeading(line: string): boolean {
    if (line.length > 55) return false;
    if (/[,;]$/.test(line)) return false;
    if (line === line.toUpperCase() && line.trim().length >= 3) return true;
    return false;
  }

  function makePara(line: string, bold: boolean, size: number): string {
    const space = /^\s|\s$/.test(line) ? ' xml:space="preserve"' : "";
    const rPr = `<w:rPr>${bold ? "<w:b/>" : ""}<w:sz w:val="${size}"/></w:rPr>`;
    return `<w:p><w:r>${rPr}<w:t${space}>${escapeXml(line)}</w:t></w:r></w:p>`;
  }

  const paragraphs = lines.map((line) => makePara(line, isHeading(line), isHeading(line) ? 26 : 20));

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs.join("\n    ")}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const zip = new JSZip();
  zip.file("_rels/.rels", rels);
  zip.file("[Content_Types].xml", contentTypes);
  zip.file("word/document.xml", docXml);
  zip.file("word/_rels/document.xml.rels", wordRels);
  return zip;
}

/* ── Route handler ────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const replacementsRaw = formData.get("replacements") as string | null;

    if (!file || !replacementsRaw) {
      return NextResponse.json({ error: "Missing file or replacements" }, { status: 400 });
    }

    const replacements: Replacement[] = JSON.parse(replacementsRaw);
    const buffer = Buffer.from(await file.arrayBuffer());
    const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const baseName = file.name.replace(/\.(pdf|docx)$/i, "");

    if (isDocx) {
      /* ── DOCX: patch XML directly — preserves all original formatting ── */
      const zip = await JSZip.loadAsync(buffer);
      const docXmlFile = zip.file("word/document.xml");
      if (!docXmlFile) throw new Error("Invalid DOCX: missing word/document.xml");
      const docXml = await docXmlFile.async("string");
      zip.file("word/document.xml", applyReplacementsToXml(docXml, replacements));
      const outBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
      return new NextResponse(new Uint8Array(outBuffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${baseName} (Updated).docx"`,
        },
      });
    } else {
      /* ── PDF: extract text → apply changes → full DOCX ── */
      const rawText = await extractPdfText(buffer);
      if (!rawText || rawText.length < 50) {
        return NextResponse.json({ error: "Could not extract text from PDF." }, { status: 400 });
      }
      const zip = buildDocxFromText(rawText, replacements);
      const outBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
      return new NextResponse(new Uint8Array(outBuffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${baseName} (Updated).docx"`,
        },
      });
    }
  } catch (err) {
    console.error("[CV Export Error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Export failed" },
      { status: 500 }
    );
  }
}
