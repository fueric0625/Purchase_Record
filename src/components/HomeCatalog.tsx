"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BookCard } from "@/components/BookCard";
import { formatMoney } from "@/lib/format";
import type { PurchaseRecord } from "@/lib/types";

export function HomeCatalog({ records }: { records: PurchaseRecord[] }) {
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [missingInvoiceOnly, setMissingInvoiceOnly] = useState(false);

  const missingInvoice = records.filter((record) => !record.invoiceName).length;
  const totalCost = records.reduce((sum, record) => sum + (record.cost || 0), 0);
  const totalQty = records.reduce((sum, record) => sum + (record.quantity || 0), 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? records.filter((record) => {
          const haystack = [
            record.title,
            record.author,
            record.purchaseDate,
            record.applicant,
            record.purchaser,
            record.fundSource,
            record.destination,
            String(record.cost),
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        })
      : [...records];

    const visible =
      missingInvoiceOnly && missingInvoice > 0
        ? matched.filter((record) => !record.invoiceName)
        : matched;

    return visible.sort((a, b) => {
      const dateCmp = (a.purchaseDate || "").localeCompare(b.purchaseDate || "");
      const createdCmp = (a.createdAt || "").localeCompare(b.createdAt || "");
      const cmp = dateCmp !== 0 ? dateCmp : createdCmp;
      return sortOrder === "newest" ? -cmp : cmp;
    });
  }, [query, records, sortOrder, missingInvoiceOnly, missingInvoice]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <AppHeader
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/stats"
              className="inline-flex h-10 items-center justify-center rounded-full border border-line px-5 text-sm font-normal leading-none text-ink-soft hover:bg-paper-deep"
            >
              统计
            </Link>
            <Link
              href="/history"
              className="inline-flex h-10 items-center justify-center rounded-full border border-line px-5 text-sm font-normal leading-none text-ink-soft hover:bg-paper-deep"
            >
              历史记录
            </Link>
            <Link
              href="/new"
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#cfc3ae] px-5 text-sm font-normal leading-none text-ink-soft hover:bg-[#c4b79f]"
            >
              新增采购
            </Link>
          </div>
        }
      />

      <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_16px_40px_rgba(80,60,40,0.05)]">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="p-5 sm:px-6 sm:py-5">
            <label className="block">
              <span className="mb-2 block text-xs tracking-[0.22em] text-ink-soft">
                查询书名 / 作者 / 采购时间
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="例如：自我突围、施一公、2023-10"
                className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] outline-none transition placeholder:text-ink-soft/50 focus:border-[#cfc3ae] focus:bg-white focus:ring-4 focus:ring-[#cfc3ae]/25"
              />
            </label>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-xs tracking-[0.22em] text-ink-soft">时间排序</span>
              <div className="inline-flex rounded-full bg-paper-deep p-1">
                <SortChip
                  active={sortOrder === "newest"}
                  onClick={() => setSortOrder("newest")}
                >
                  从新到旧
                </SortChip>
                <SortChip
                  active={sortOrder === "oldest"}
                  onClick={() => setSortOrder("oldest")}
                >
                  从旧到新
                </SortChip>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[auto_auto] border-t border-line lg:border-l lg:border-t-0">
            <Stat label="采购条目" value={`${records.length}`} unit="条" />
            <Stat
              label="累计费用"
              value={formatMoney(totalCost)}
              unit={`${totalQty} 本`}
              stacked
              divided
            />
          </div>
        </div>

        {missingInvoice > 0 ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-line bg-paper px-5 py-3 sm:px-6">
            <span className="rounded-full bg-[#cfc3ae] px-2.5 py-0.5 text-xs tracking-wide text-ink">
              待补充
            </span>
            <p className="text-sm text-ink-soft">
              有 <span className="font-medium text-ink">{missingInvoice}</span>{" "}
              本图书尚未上传发票，封面已标注，点进去即可补传。
            </p>
            <button
              type="button"
              onClick={() => setMissingInvoiceOnly((current) => !current)}
              aria-label={
                missingInvoiceOnly ? "显示全部书目" : "只看需补充发票的书目"
              }
              title={missingInvoiceOnly ? "显示全部书目" : "只看需补充发票的书目"}
              className={`ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-base text-ink-soft transition hover:bg-[#cfc3ae]/60 hover:text-ink ${
                missingInvoiceOnly ? "bg-[#cfc3ae] text-ink" : "bg-surface"
              }`}
            >
              <span
                aria-hidden="true"
                className={`leading-none transition-transform ${
                  missingInvoiceOnly ? "rotate-90" : ""
                }`}
              >
                →
              </span>
            </button>
          </div>
        ) : null}
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-surface/70 px-6 py-16 text-center">
          <p className="font-serif text-2xl text-ink">
            {records.length === 0 ? "还没有采购记录" : "没有匹配的书目"}
          </p>
          <p className="mt-3 text-sm text-ink-soft">
            {records.length === 0
              ? "点击右上角新增，录入发票、照片和采购信息。"
              : missingInvoiceOnly
                ? "当前筛选下没有需补充发票的书目。"
                : "换个书名、作者或日期再试一次。"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((record) => (
            <BookCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}

function SortChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm transition ${
        active
          ? "bg-surface text-ink shadow-sm"
          : "text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  unit,
  divided,
  stacked,
}: {
  label: string;
  value: string;
  unit: string;
  divided?: boolean;
  stacked?: boolean;
}) {
  return (
    <div
      className={`flex flex-col justify-center bg-paper/70 px-5 py-4 ${
        divided ? "border-l border-line" : ""
      }`}
    >
      <div className="text-xs tracking-[0.22em] text-ink-soft">{label}</div>
      {stacked ? (
        <div className="mt-2">
          <div className="font-serif text-2xl leading-none whitespace-nowrap tabular-nums text-ink">
            {value}
          </div>
          <div className="mt-1.5 text-xs text-ink-soft">{unit}</div>
        </div>
      ) : (
        <div className="mt-2 flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="font-serif text-2xl leading-none tabular-nums text-ink">
            {value}
          </span>
          <span className="text-sm text-ink-soft">{unit}</span>
        </div>
      )}
    </div>
  );
}
