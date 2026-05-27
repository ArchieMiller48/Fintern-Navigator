import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";

export async function GET() {
  try {
    const client = getAnthropicClient();
    return NextResponse.json({ ok: true, clientReady: !!client });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
