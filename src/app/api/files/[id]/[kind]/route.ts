import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getUploadPath, type UploadKind } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = new Set<UploadKind>(["photo", "invoice", "extra", "purchase"]);

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function contentDisposition(type: "attachment" | "inline", name: string) {
  const encoded = encodeURIComponent(name).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  const ascii = name.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; kind: string }> },
) {
  const { id, kind } = await params;
  if (!KINDS.has(kind as UploadKind)) {
    return NextResponse.json({ error: "无效的文件类型" }, { status: 400 });
  }

  const upload = await getUploadPath(id, kind as UploadKind);
  if (!upload) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  const ext = upload.fileName.slice(upload.fileName.lastIndexOf(".")).toLowerCase();
  const body = await readFile(upload.filePath);
  const downloadName = upload.downloadName || upload.fileName;
  const dispositionType =
    kind === "extra" || kind === "purchase" ? "attachment" : "inline";
  return new NextResponse(Uint8Array.from(body), {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Content-Disposition": contentDisposition(dispositionType, downloadName),
      "Cache-Control": kind === "extra" || kind === "purchase" ? "no-store" : "public, max-age=3600",
    },
  });
}
