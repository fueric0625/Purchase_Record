"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { fileUrl, formatDate, formatMoney } from "@/lib/format";
import type { PurchaseRecord } from "@/lib/types";

const actionBtn =
  "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-normal leading-none";

export function RecordDetail({ record }: { record: PurchaseRecord }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");

  async function confirmDelete() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/records/${record.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "删除失败");
      }
      setConfirmOpen(false);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
      >
        <span aria-hidden="true">←</span>
        返回
      </Link>
      <AppHeader
        title={record.title}
        subtitle={`${record.author || "作者未填"} · ${formatDate(record.purchaseDate)}`}
        action={
          <div className="flex items-center gap-3">
            <Link
              href={`/records/${record.id}/edit`}
              className={`${actionBtn} bg-[#cfc3ae] text-ink-soft hover:bg-[#c4b79f]`}
            >
              修改
            </Link>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={pending}
              className={`${actionBtn} border border-line text-ink-soft disabled:opacity-60`}
            >
              删除
            </button>
          </div>
        }
      />

      {error ? (
        <p className="rounded-2xl bg-seal/10 px-4 py-3 text-sm text-seal">{error}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="overflow-hidden rounded-3xl border border-line bg-surface">
          {record.photoName ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fileUrl(record.id, "photo")}
              alt={record.title}
              className="w-full object-cover"
            />
          ) : (
            <div className="flex h-80 items-center justify-center text-ink-soft">
              尚未上传图书照片
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-line bg-surface p-6">
          <h2 className="font-serif text-2xl">采购信息</h2>
          {!record.invoiceName ? (
            <p className="mt-3 rounded-2xl bg-seal/10 px-4 py-3 text-sm text-seal">
              该书尚未上传发票，请点击「修改」补充。
            </p>
          ) : null}
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <Item label="购买申请" value={record.applicant} />
            <Item label="采购人员" value={record.purchaser} />
            <Item label="购买数量" value={record.quantity ? `${record.quantity} 本` : ""} />
            <Item label="费用" value={formatMoney(record.cost)} />
            <Item label="报销经费" value={record.fundSource} />
            <Item label="采购时间" value={formatDate(record.purchaseDate)} />
            <Item label="图书去向" value={record.destination} wide />
            <Item label="备注" value={record.notes} wide />
            <div className="sm:col-span-2">
              <dt className="text-xs tracking-widest text-ink-soft">补充文档</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-3 text-base leading-7">
                {record.extraDocName ? (
                  <>
                    <span>{record.extraDocOriginalName || record.extraDocName}</span>
                    <a
                      href={fileUrl(record.id, "extra")}
                      download={record.extraDocOriginalName || record.extraDocName}
                      className="rounded-full border border-line px-3 py-1 text-sm hover:bg-paper-deep"
                    >
                      下载
                    </a>
                  </>
                ) : (
                  <span className="text-ink-soft">未上传</span>
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            {record.invoiceName ? (
              <a
                href={fileUrl(record.id, "invoice")}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#cfc3ae] px-4 py-2 text-sm text-ink hover:bg-[#c4b79f]"
              >
                查看发票 PDF
              </a>
            ) : (
              <span className="rounded-full bg-paper-deep px-4 py-2 text-sm text-ink-soft">
                未上传发票
              </span>
            )}
            <a
              href={fileUrl(record.id, "purchase")}
              className="rounded-full bg-[#cfc3ae] px-4 py-2 text-sm text-ink hover:bg-[#c4b79f]"
            >
              下载采购信息
            </a>
            <Link href="/" className="rounded-full border border-line px-4 py-2 text-sm">
              返回书目
            </Link>
          </div>
        </section>
      </div>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 px-5"
          onClick={() => {
            if (!pending) setConfirmOpen(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-[0_20px_46px_rgba(80,60,40,0.16)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="font-serif text-xl text-ink">确认删除</h3>
            <p className="mt-3 text-sm leading-6 text-ink-soft">
              确定删除《{record.title}》这条采购记录吗？删除后无法恢复。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmOpen(false)}
                className={`${actionBtn} border border-line text-ink-soft disabled:opacity-60`}
              >
                取消
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={confirmDelete}
                className={`${actionBtn} bg-[#cfc3ae] text-ink-soft hover:bg-[#c4b79f] disabled:opacity-60`}
              >
                {pending ? "删除中…" : "删除"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Item({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs tracking-widest text-ink-soft">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-base leading-7">
        {value || "未填写"}
      </dd>
    </div>
  );
}
