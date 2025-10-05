import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) return NextResponse.json({ ok: false }, { status: 500 });
    const client = new ConvexHttpClient(url);
    await client.mutation(api.games.finalizeGameIfDone, { slug });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}


