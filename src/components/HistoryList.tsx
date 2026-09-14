"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { formatDateTime } from "@/lib/format";
import type { PurchaseRecord } from "@/lib/types";

const actionBtn =
  "inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-normal leading-none";

export function HistoryList({ records }: { records: PurchaseRecord[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [purgeTarget, setPurgeTarget] = useState<PurchaseRecord | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? records.filter((record) =>
          [record.title, record.author].join(" ").toLowerCase().includes(q),
        )
      : [...records];
    return matched.sort((a, b) => {
      const createdCmp = (a.createdAt || "").localeCompare(b.createdAt || "");
      return createdCmp !== 0 ? createdCmp : a.id.localeCompare(b.id);
    });
  }, [query, records]);

  async function restore(id: string) {
    setPendingId(id);
    setError("");
    try {
      const response = await fetch(`/api/records/${id}/restore`, { method: "POST" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "恢复失败");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "恢复失败");
    } finally {
      setPendingId("");
    }
  }

  async function confirmPurge() {
    if (!purgeTarget) return;
    setPendingId(purgeTarget.id);
    setError("");
    try {
      const response = await fetch(`/api/records/${purgeTarget.id}/purge`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "彻底删除失败");
      }
      setPurgeTarget(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "彻底删除失败");
    } finally {
      setPendingId("");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 text-sm text-ink-soft transition hover:text-ink"
      >
        <span aria-hidden="true">←</span>
        返回书目
      </Link>
      <AppHeader
        title="历史记录"
        subtitle="查看全部书目的创建与删除时间。恢复后会重新出现在书目中；彻底删除才会清掉文件。"
      />

      {error ? (
        <p className="rounded-2xl bg-seal/10 px-4 py-3 text-sm text-seal">{error}</p>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_16px_40px_rgba(80,60,40,0.05)]">
        <div className="border-b border-line p-5 sm:px-6">
          <label className="block">
            <span className="mb-2 block text-xs tracking-[0.22em] text-ink-soft">
              查询书名 / 作者
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="例如：自我突围"
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] outline-none transition placeholder:text-ink-soft/50 focus:border-[#cfc3ae] focus:bg-white focus:ring-4 focus:ring-[#cfc3ae]/25"
            />
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-serif text-2xl text-ink">
              {records.length === 0 ? "还没有历史记录" : "没有匹配的书目"}
            </p>
            <p className="mt-3 text-sm text-ink-soft">
              {records.length === 0
                ? "新增或删除书目后，都会出现在这里。"
                : "换个书名或作者再试一次。"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-paper text-xs tracking-[0.18em] text-ink-soft">
                <tr>
                  <th className="px-5 py-3 font-normal sm:px-6">书名</th>
                  <th className="px-5 py-3 font-normal sm:px-6">创建日期</th>
                  <th className="px-5 py-3 font-normal sm:px-6">删除日期</th>
                  <th className="px-5 py-3 font-normal sm:px-6">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => {
                  const deleted = Boolean(record.deletedAt);
                  const busy = pendingId === record.id;
                  return (
                    <tr key={record.id} className="border-t border-line">
                      <td className="px-5 py-4 sm:px-6">
                        <div className="font-medium text-ink">{record.title}</div>
                        <div className="mt-1 text-xs text-ink-soft">
                          {record.author || "作者未填"}
                          {deleted ? (
                            <span className="ml-2 rounded-full bg-paper-deep px-2 py-0.5">
                              已删除
                            </span>
                          ) : (
                            <span className="ml-2 rounded-full bg-[#cfc3ae]/70 px-2 py-0.5">
                              在库
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 tabular-nums text-ink-soft sm:px-6">
                        {formatDateTime(record.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 tabular-nums text-ink-soft sm:px-6">
                        {record.deletedAt ? formatDateTime(record.deletedAt) : "—"}
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex flex-wrap gap-2">
                          {deleted ? (
                            <>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => restore(record.id)}
                                className={`${actionBtn} bg-[#cfc3ae] text-ink-soft hover:bg-[#c4b79f] disabled:opacity-60`}
                              >
                                {busy && !purgeTarget ? "恢复中…" : "恢复"}
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setPurgeTarget(record)}
                                className={`${actionBtn} border border-line text-ink-soft disabled:opacity-60`}
                              >
                                彻底删除
                              </button>
                            </>
                          ) : (
                            <Link
                              href={`/records/${record.id}`}
                              className={`${actionBtn} border border-line text-ink-soft`}
                            >
                              查看
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {purgeTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 px-5"
          onClick={() => {
            if (!pendingId) setPurgeTarget(null);
          }}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-[0_20px_46px_rgba(80,60,40,0.16)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="font-serif text-xl text-ink">彻底删除</h3>
            <p className="mt-3 text-sm leading-6 text-ink-soft">
              确定彻底删除《{purgeTarget.title}》吗？相关照片、发票和文档都会一并清除，无法恢复。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={Boolean(pendingId)}
                onClick={() => setPurgeTarget(null)}
                className={`${actionBtn} border border-line text-ink-soft disabled:opacity-60`}
              >
                取消
              </button>
              <button
                type="button"
                disabled={Boolean(pendingId)}
                onClick={confirmPurge}
                className={`${actionBtn} bg-seal text-white hover:bg-seal-deep disabled:opacity-60`}
              >
                {pendingId === purgeTarget.id ? "删除中…" : "彻底删除"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
