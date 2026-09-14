"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { fileUrl } from "@/lib/format";
import type { PurchaseRecord } from "@/lib/types";

type RecordFormProps = {
  mode: "create" | "edit";
  record?: PurchaseRecord;
};

type FormState = {
  title: string;
  author: string;
  purchaseDate: string;
  applicant: string;
  purchaser: string;
  quantity: string;
  cost: string;
  fundSource: string;
  destination: string;
  notes: string;
};

function toState(record?: PurchaseRecord): FormState {
  return {
    title: record?.title ?? "",
    author: record?.author ?? "",
    purchaseDate: record?.purchaseDate ?? "",
    applicant: record?.applicant ?? "",
    purchaser: record?.purchaser ?? "",
    quantity: record ? String(record.quantity) : "1",
    cost: record ? String(record.cost) : "",
    fundSource: record?.fundSource ?? "",
    destination: record?.destination ?? "",
    notes: record?.notes ?? "",
  };
}

export function RecordForm({ mode, record }: RecordFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toState(record));
  const [photo, setPhoto] = useState<File | null>(null);
  const [invoice, setInvoice] = useState<File | null>(null);
  const [extra, setExtra] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const photoPreview = useMemo(() => {
    if (photo) return URL.createObjectURL(photo);
    if (record?.photoName) return fileUrl(record.id, "photo");
    return "";
  }, [photo, record]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("请填写书名");
      return;
    }
    if (!form.purchaseDate) {
      setError("请填写采购时间");
      return;
    }
    if (mode === "create" && !photo && !record?.photoName) {
      setError("请上传图书照片");
      return;
    }

    const payload = new FormData();
    payload.set("title", form.title);
    payload.set("author", form.author);
    payload.set("purchaseDate", form.purchaseDate);
    payload.set("applicant", form.applicant);
    payload.set("purchaser", form.purchaser);
    payload.set("quantity", form.quantity || "0");
    payload.set("cost", form.cost || "0");
    payload.set("fundSource", form.fundSource);
    payload.set("destination", form.destination);
    payload.set("notes", form.notes);
    if (photo) payload.set("photo", photo);
    if (invoice) payload.set("invoice", invoice);
    if (extra) payload.set("extra", extra);

    setPending(true);
    try {
      const url = mode === "create" ? "/api/records" : `/api/records/${record?.id}`;
      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        body: payload,
      });
      const data = (await response.json()) as PurchaseRecord & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "保存失败");
      }
      router.push(`/records/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-serif text-2xl">采购信息</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="书名" required>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="field"
              placeholder="自我突围"
            />
          </Field>
          <Field label="作者">
            <input
              value={form.author}
              onChange={(e) => update("author", e.target.value)}
              className="field"
              placeholder="施一公"
            />
          </Field>
          <Field label="采购时间" required>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => update("purchaseDate", e.target.value)}
              className="field"
            />
          </Field>
          <Field label="购买申请">
            <input
              value={form.applicant}
              onChange={(e) => update("applicant", e.target.value)}
              className="field"
              placeholder="申请人"
            />
          </Field>
          <Field label="采购人员">
            <input
              value={form.purchaser}
              onChange={(e) => update("purchaser", e.target.value)}
              className="field"
              placeholder="经办人"
            />
          </Field>
          <Field label="购买数量">
            <input
              type="number"
              min="0"
              step="1"
              value={form.quantity}
              onChange={(e) => update("quantity", e.target.value)}
              className="field"
            />
          </Field>
          <Field label="费用（元）">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(e) => update("cost", e.target.value)}
              className="field"
              placeholder="98"
            />
          </Field>
          <Field label="报销经费">
            <input
              value={form.fundSource}
              onChange={(e) => update("fundSource", e.target.value)}
              className="field"
              placeholder="党史经费"
            />
          </Field>
          <Field label="图书去向" className="sm:col-span-2">
            <textarea
              value={form.destination}
              onChange={(e) => update("destination", e.target.value)}
              className="field min-h-28"
              placeholder={"图书室编目1本\n欧七斤1本"}
            />
          </Field>
          <Field label="备注" className="sm:col-span-2">
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="field min-h-24"
              placeholder="补充说明（可选）"
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <UploadCard
          title="图书照片"
          required={mode === "create"}
          hint="封面或实物照片"
          accept="image/*"
          file={photo}
          existingLabel={record?.photoName ? "已有照片，可替换" : undefined}
          onChange={setPhoto}
          preview={photoPreview}
        />
        <UploadCard
          title="图书发票"
          hint={"可选。\n没有发票时可先保存，之后再补充"}
          accept="application/pdf"
          file={invoice}
          existingLabel={record?.invoiceName ? "已有发票，可替换" : undefined}
          onChange={setInvoice}
        />
        <UploadCard
          title="补充文档"
          hint={"可选。\n手工收集的 Word，与系统生成的采购信息分开保存"}
          accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          file={extra}
          existingLabel={
            record?.extraDocName
              ? record.extraDocOriginalName || record.extraDocName
              : undefined
          }
          onChange={setExtra}
        />

        {error ? (
          <p className="rounded-2xl bg-seal/10 px-4 py-3 text-sm text-seal">{error}</p>
        ) : null}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-full bg-seal px-5 py-3 text-white transition hover:bg-seal-deep disabled:opacity-60"
          >
            {pending ? "保存中…" : mode === "create" ? "保存记录" : "保存修改"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-line px-5 py-3 text-ink-soft"
          >
            取消
          </button>
        </div>
      </section>
    </form>
  );
}

function Field({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm text-ink-soft">
        {label}
        {required ? <span className="ml-1 text-seal">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function UploadCard({
  title,
  hint,
  accept,
  required,
  file,
  existingLabel,
  onChange,
  preview,
}: {
  title: string;
  hint: string;
  accept: string;
  required?: boolean;
  file: File | null;
  existingLabel?: string;
  onChange: (file: File | null) => void;
  preview?: string;
}) {
  return (
    <label className="block cursor-pointer rounded-3xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-serif text-xl">
            {title}
            {required ? <span className="ml-1 text-base text-seal">*</span> : null}
          </div>
          <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{hint}</p>
        </div>
        <span className="rounded-full bg-paper-deep px-3 py-1 text-xs text-ink-soft">
          {file ? file.name : existingLabel || "点击上传"}
        </span>
      </div>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="mt-4 h-48 w-full rounded-2xl object-cover"
        />
      ) : null}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}
