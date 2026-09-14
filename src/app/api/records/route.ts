import { NextResponse } from "next/server";
import { createRecord, listRecords, saveUpload } from "@/lib/store";
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

export async function GET() {
  const records = await listRecords();
  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const input = readInput(form);

  if (!input.title) {
    return NextResponse.json({ error: "请填写书名" }, { status: 400 });
  }
  if (!input.purchaseDate) {
    return NextResponse.json({ error: "请填写采购时间" }, { status: 400 });
  }

  const record = await createRecord(input);
  const photo = form.get("photo");
  const invoice = form.get("invoice");
  const extra = form.get("extra");

  if (photo instanceof File && photo.size > 0) {
    await saveUpload(record.id, "photo", photo);
  }
  if (invoice instanceof File && invoice.size > 0) {
    await saveUpload(record.id, "invoice", invoice);
  }
  if (extra instanceof File && extra.size > 0) {
    await saveUpload(record.id, "extra", extra);
  }

  const saved = (await listRecords()).find((item) => item.id === record.id) ?? record;
  return NextResponse.json(saved, { status: 201 });
}
