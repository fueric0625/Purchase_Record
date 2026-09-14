import { NextResponse } from "next/server";
import {
  deleteRecord,
  getRecord,
  saveUpload,
  updateRecord,
} from "@/lib/store";
import type { RecordInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readInput(form: FormData): RecordInput {
  return {
    title: String(form.get("title") ?? ""),
    author: String(form.get("author") ?? ""),
    purchaseDate: String(form.get("purchaseDate") ?? ""),
    applicant: String(form.get("applicant") ?? ""),
    purchaser: String(form.get("purchaser") ?? ""),
    quantity: Number(form.get("quantity") ?? 0),
    cost: Number(form.get("cost") ?? 0),
    fundSource: String(form.get("fundSource") ?? ""),
    destination: String(form.get("destination") ?? ""),
    notes: String(form.get("notes") ?? ""),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = await getRecord(id);
  if (!record) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }
  return NextResponse.json(record);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const form = await request.formData();
  const input = readInput(form);

  if (!input.title) {
    return NextResponse.json({ error: "请填写书名" }, { status: 400 });
  }
  if (!input.purchaseDate) {
    return NextResponse.json({ error: "请填写采购时间" }, { status: 400 });
  }

  const updated = await updateRecord(id, input);
  if (!updated) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  const photo = form.get("photo");
  const invoice = form.get("invoice");
  const extra = form.get("extra");

  if (photo instanceof File && photo.size > 0) {
    await saveUpload(id, "photo", photo);
  }
  if (invoice instanceof File && invoice.size > 0) {
    await saveUpload(id, "invoice", invoice);
  }
  if (extra instanceof File && extra.size > 0) {
    await saveUpload(id, "extra", extra);
  }

  const saved = await getRecord(id);
  return NextResponse.json(saved);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ok = await deleteRecord(id);
  if (!ok) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
