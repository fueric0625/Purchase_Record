import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { PurchaseRecord, RecordInput } from "./types";
import { buildPurchaseDocx } from "./word";

const DATA_DIR = process.env.PURCHASE_DATA_DIR
  ? path.resolve(process.env.PURCHASE_DATA_DIR)
  : path.join(process.cwd(), "data");
const RECORDS_FILE = path.join(DATA_DIR, "records.json");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

const SAMPLE_DIR = path.join(
  process.env.USERPROFILE ?? "",
  "Downloads",
  "2023.10.25-自我突围 98.00",
);

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function readRecordsFile(): Promise<PurchaseRecord[]> {
  try {
    const raw = await fs.readFile(RECORDS_FILE, "utf8");
    const parsed = JSON.parse(raw) as PurchaseRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeRecordsFile(records: PurchaseRecord[]) {
  await ensureDirs();
  await fs.writeFile(RECORDS_FILE, JSON.stringify(records, null, 2), "utf8");
}

async function pathExists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function copyIfExists(from: string, to: string) {
  if (!(await pathExists(from))) return false;
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
  return true;
}

function withoutLegacyFlag(record: PurchaseRecord): PurchaseRecord {
  const { extraDocGenerated: _ignored, ...rest } = record;
  return rest;
}

async function seedSampleIfEmpty(records: PurchaseRecord[]) {
  if (records.length > 0) return records;
  if (!(await pathExists(SAMPLE_DIR))) return records;

  const id = "20231025-ziwo-tuwei";
  const uploadDir = path.join(UPLOADS_DIR, id);
  await fs.mkdir(uploadDir, { recursive: true });

  const photoCopied = await copyIfExists(
    path.join(SAMPLE_DIR, "图书图片.png"),
    path.join(uploadDir, "photo.png"),
  );
  const invoiceCopied = await copyIfExists(
    path.join(SAMPLE_DIR, "2023.10.25-自我突围 98.00.pdf"),
    path.join(uploadDir, "invoice.pdf"),
  );
  const extraCopied = await copyIfExists(
    path.join(SAMPLE_DIR, "2023.10.25-自我突围 -采购信息.docx"),
    path.join(uploadDir, "extra.docx"),
  );

  const now = new Date().toISOString();
  const sample: PurchaseRecord = {
    id,
    title: "自我突围",
    author: "施一公",
    purchaseDate: "2023-10-25",
    applicant: "欧七斤",
    purchaser: "漆姚敏",
    quantity: 2,
    cost: 98,
    fundSource: "党史经费",
    destination: "图书室编目1本(K826.15/41 2023)\n欧七斤1本",
    notes: "",
    photoName: photoCopied ? "photo.png" : null,
    invoiceName: invoiceCopied ? "invoice.pdf" : null,
    purchaseDocName: null,
    extraDocName: extraCopied ? "extra.docx" : null,
    extraDocOriginalName: extraCopied ? "2023.10.25-自我突围 -采购信息.docx" : null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await writeRecordsFile([sample]);
  return [sample];
}

async function loadAllRecords(): Promise<PurchaseRecord[]> {
  await ensureDirs();
  return backfillGeneratedDocs(await seedSampleIfEmpty(await readRecordsFile()));
}

function isDeleted(record: PurchaseRecord) {
  return Boolean(record.deletedAt);
}

function compareCreatedAt(a: PurchaseRecord, b: PurchaseRecord) {
  const createdCmp = (a.createdAt || "").localeCompare(b.createdAt || "");
  return createdCmp !== 0 ? createdCmp : a.id.localeCompare(b.id);
}

export async function listRecords(): Promise<PurchaseRecord[]> {
  const records = (await loadAllRecords()).filter((item) => !isDeleted(item));
  return [...records].sort((a, b) => {
    const dateCmp = (b.purchaseDate || "").localeCompare(a.purchaseDate || "");
    return dateCmp !== 0 ? dateCmp : -compareCreatedAt(a, b);
  });
}

export async function listHistoryRecords(): Promise<PurchaseRecord[]> {
  const records = await loadAllRecords();
  return [...records].sort(compareCreatedAt);
}

export async function getRecord(
  id: string,
  options?: { includeDeleted?: boolean },
): Promise<PurchaseRecord | null> {
  const records = await loadAllRecords();
  const record = records.find((item) => item.id === id) ?? null;
  if (!record) return null;
  if (isDeleted(record) && !options?.includeDeleted) return null;
  return record;
}

function normalizeInput(input: RecordInput): RecordInput {
  return {
    title: input.title.trim(),
    author: input.author.trim(),
    purchaseDate: input.purchaseDate.trim(),
    applicant: input.applicant.trim(),
    purchaser: input.purchaser.trim(),
    quantity: Number.isFinite(input.quantity) ? input.quantity : 0,
    cost: Number.isFinite(input.cost) ? input.cost : 0,
    fundSource: input.fundSource.trim(),
    destination: input.destination.trim(),
    notes: input.notes.trim(),
  };
}

export async function createRecord(input: RecordInput): Promise<PurchaseRecord> {
  const records = await loadAllRecords();
  const now = new Date().toISOString();
  const record: PurchaseRecord = {
    id: randomUUID(),
    ...normalizeInput(input),
    photoName: null,
    invoiceName: null,
    purchaseDocName: null,
    extraDocName: null,
    extraDocOriginalName: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  records.push(record);
  await writeRecordsFile(records);
  return record;
}

export async function updateRecord(
  id: string,
  input: RecordInput,
): Promise<PurchaseRecord | null> {
  const records = await loadAllRecords();
  const index = records.findIndex((item) => item.id === id);
  if (index === -1 || isDeleted(records[index])) return null;
  records[index] = await writeGeneratedWord({
    ...records[index],
    ...normalizeInput(input),
    updatedAt: new Date().toISOString(),
  });
  await writeRecordsFile(records);
  return records[index];
}

export async function deleteRecord(id: string): Promise<boolean> {
  const records = await loadAllRecords();
  const index = records.findIndex((item) => item.id === id);
  if (index === -1 || isDeleted(records[index])) return false;
  const now = new Date().toISOString();
  records[index] = {
    ...records[index],
    deletedAt: now,
    updatedAt: now,
  };
  await writeRecordsFile(records);
  return true;
}

export async function restoreRecord(id: string): Promise<PurchaseRecord | null> {
  const records = await loadAllRecords();
  const index = records.findIndex((item) => item.id === id);
  if (index === -1 || !isDeleted(records[index])) return null;
  records[index] = {
    ...records[index],
    deletedAt: null,
  };
  await writeRecordsFile(records);
  return records[index];
}

export async function purgeRecord(id: string): Promise<boolean> {
  const records = await loadAllRecords();
  const record = records.find((item) => item.id === id);
  if (!record || !isDeleted(record)) return false;
  await writeRecordsFile(records.filter((item) => item.id !== id));
  await fs.rm(path.join(UPLOADS_DIR, id), { recursive: true, force: true });
  return true;
}

export type UploadKind = "photo" | "invoice" | "extra" | "purchase";

const KIND_FIELD: Record<UploadKind, keyof PurchaseRecord> = {
  photo: "photoName",
  invoice: "invoiceName",
  extra: "extraDocName",
  purchase: "purchaseDocName",
};

export async function saveUpload(
  id: string,
  kind: Exclude<UploadKind, "purchase">,
  file: File,
): Promise<PurchaseRecord | null> {
  const records = await loadAllRecords();
  const index = records.findIndex((item) => item.id === id);
  if (index === -1 || isDeleted(records[index])) return null;

  const ext = path.extname(file.name).toLowerCase() || defaultExt(kind);
  const fileName =
    kind === "extra" ? sanitizeUploadName(file.name, ext) : `${kind}${ext}`;
  const dir = path.join(UPLOADS_DIR, id);
  await fs.mkdir(dir, { recursive: true });

  const previous = records[index][KIND_FIELD[kind]];
  if (typeof previous === "string" && previous && previous !== fileName) {
    await fs.rm(path.join(dir, previous), { force: true });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, fileName), buffer);

  records[index] = {
    ...records[index],
    [KIND_FIELD[kind]]: fileName,
    extraDocOriginalName:
      kind === "extra" ? file.name : records[index].extraDocOriginalName,
    updatedAt: new Date().toISOString(),
  };
  await writeRecordsFile(records);
  return records[index];
}

export async function getUploadPath(
  id: string,
  kind: UploadKind,
): Promise<{ filePath: string; fileName: string; downloadName?: string } | null> {
  let record = await getRecord(id);
  if (!record) return null;

  if (kind === "purchase") {
    const purchasePath = record.purchaseDocName
      ? path.join(UPLOADS_DIR, id, record.purchaseDocName)
      : "";
    if (!record.purchaseDocName || !(await pathExists(purchasePath))) {
      record = await generatePurchaseDoc(id);
    }
    if (!record?.purchaseDocName) return null;
    return {
      filePath: path.join(UPLOADS_DIR, id, record.purchaseDocName),
      fileName: record.purchaseDocName,
      downloadName: `${record.title || "采购信息"}-采购信息.docx`,
    };
  }

  const fileName = record[KIND_FIELD[kind]];
  if (typeof fileName !== "string" || !fileName) return null;
  const filePath = path.join(UPLOADS_DIR, id, fileName);
  if (!(await pathExists(filePath))) return null;
  return {
    filePath,
    fileName,
    downloadName:
      kind === "extra"
        ? record.extraDocOriginalName || fileName
        : undefined,
  };
}

export async function generatePurchaseDoc(id: string): Promise<PurchaseRecord | null> {
  const records = await loadAllRecords();
  const index = records.findIndex((item) => item.id === id);
  if (index === -1 || isDeleted(records[index])) return null;
  records[index] = await writeGeneratedWord(await migrateLegacyExtra(records[index]));
  await writeRecordsFile(records);
  return records[index];
}

async function backfillGeneratedDocs(records: PurchaseRecord[]) {
  let changed = false;
  const next: PurchaseRecord[] = [];
  for (const record of records) {
    const migrated = await migrateLegacyExtra(record);
    if (isDeleted(migrated)) {
      next.push(withoutLegacyFlag(migrated));
      continue;
    }
    const purchasePath = migrated.purchaseDocName
      ? path.join(UPLOADS_DIR, migrated.id, migrated.purchaseDocName)
      : "";
    const needsPurchase =
      !migrated.purchaseDocName || !(await pathExists(purchasePath));
    const nextRecord = needsPurchase ? await writeGeneratedWord(migrated) : migrated;
    if (JSON.stringify(withoutLegacyFlag(nextRecord)) !== JSON.stringify(withoutLegacyFlag(record))) {
      changed = true;
    }
    next.push(withoutLegacyFlag(nextRecord));
  }
  if (changed) await writeRecordsFile(next);
  return next;
}

async function migrateLegacyExtra(record: PurchaseRecord): Promise<PurchaseRecord> {
  const extraWasGenerated = record.extraDocGenerated === true;
  let extraDocName = record.extraDocName ?? null;
  let extraDocOriginalName = record.extraDocOriginalName ?? null;

  if (extraWasGenerated && extraDocName) {
    const extraPath = path.join(UPLOADS_DIR, record.id, extraDocName);
    if (await pathExists(extraPath)) {
      await fs.rm(extraPath, { force: true });
    }
    extraDocName = null;
    extraDocOriginalName = null;
  } else if (extraDocName && !extraDocOriginalName) {
    extraDocOriginalName =
      record.id === "20231025-ziwo-tuwei"
        ? "2023.10.25-自我突围 -采购信息.docx"
        : extraDocName;
  }

  return withoutLegacyFlag({
    ...record,
    purchaseDocName: record.purchaseDocName ?? null,
    extraDocName,
    extraDocOriginalName,
  });
}

async function writeGeneratedWord(record: PurchaseRecord): Promise<PurchaseRecord> {
  const dir = path.join(UPLOADS_DIR, record.id);
  await fs.mkdir(dir, { recursive: true });
  const fileName = "purchase.docx";
  await fs.writeFile(path.join(dir, fileName), await buildPurchaseDocx(record));
  return withoutLegacyFlag({
    ...record,
    purchaseDocName: fileName,
  });
}

function defaultExt(kind: Exclude<UploadKind, "purchase">) {
  if (kind === "photo") return ".png";
  if (kind === "invoice") return ".pdf";
  return ".docx";
}

function sanitizeUploadName(name: string, fallbackExt: string) {
  const base = path
    .basename(name)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .trim();
  if (!base || base === "." || base === "..") return `extra${fallbackExt}`;
  return base;
}
