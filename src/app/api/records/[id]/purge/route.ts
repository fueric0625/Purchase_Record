import { NextResponse } from "next/server";
import { purgeRecord } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ok = await purgeRecord(id);
  if (!ok) {
    return NextResponse.json({ error: "只能彻底删除已移入历史的记录" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
