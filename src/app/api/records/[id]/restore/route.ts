import { NextResponse } from "next/server";
import { restoreRecord } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const restored = await restoreRecord(id);
  if (!restored) {
    return NextResponse.json({ error: "无法恢复该记录" }, { status: 404 });
  }
  return NextResponse.json(restored);
}
