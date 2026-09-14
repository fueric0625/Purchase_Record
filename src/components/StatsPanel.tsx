"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { formatDate, formatMoney, formatYearMonth } from "@/lib/format";
import {
  dateBounds,
  recordsInPurchaseRange,
  summarizePurchases,
  type StatsGroup,
} from "@/lib/stats";
import type { PurchaseRecord } from "@/lib/types";

type Preset = "all" | "year" | "month" | "custom";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function isoDay(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function yearRange(now = new Date()) {
  const year = now.getFullYear();
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

function monthRange(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const last = new Date(year, month, 0).getDate();
  return { start: `${year}-${pad(month)}-01`, end: `${year}-${pad(month)}-${pad(last)}` };
}

export function StatsPanel({ records }: { records: PurchaseRecord[] }) {
  const bounds = useMemo(() => dateBounds(records), [records]);
  const [start, setStart] = useState(bounds.start);
  const [end, setEnd] = useState(bounds.end);
  const [preset, setPreset] = useState<Preset>("all");

  const range = useMemo(() => {
    if (start && end && start > end) return { start: end, end: start };
    return { start, end };
  }, [start, end]);

  const stats = useMemo(() => {
    const matched = recordsInPurchaseRange(records, range.start, range.end);
    return summarizePurchases(matched);
  }, [records, range]);

  function applyPreset(next: Preset) {
    setPreset(next);
    if (next === "all") {
      setStart(bounds.start);
      setEnd(bounds.end);
      return;
    }
    const picked = next === "year" ? yearRange() : monthRange();
    setStart(picked.start);
    setEnd(picked.end);
  }

  function changeStart(value: string) {
    setPreset("custom");
    setStart(value);
  }

  function changeEnd(value: string) {
    setPreset("custom");
    setEnd(value);
  }

  const maxMonthCost = Math.max(0, ...stats.byMonth.map((row) => row.cost));
  const inverted = Boolean(start && end && start > end);

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
        title="采购统计"
        subtitle="按采购时间选择日期范围，汇总采购条目、费用与书目。"
      />

      <section className="rounded-3xl border border-line bg-surface p-5 shadow-[0_16px_40px_rgba(80,60,40,0.05)] sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs tracking-[0.22em] text-ink-soft">快捷范围</span>
          <div className="inline-flex rounded-full bg-paper-deep p-1">
            <Chip active={preset === "all"} onClick={() => applyPreset("all")}>
              全部
            </Chip>
            <Chip active={preset === "year"} onClick={() => applyPreset("year")}>
              今年
            </Chip>
            <Chip active={preset === "month"} onClick={() => applyPreset("month")}>
              本月
            </Chip>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs tracking-[0.22em] text-ink-soft">
              开始日期
            </span>
            <input
              type="date"
              value={start}
              onChange={(event) => changeStart(event.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] outline-none transition focus:border-[#cfc3ae] focus:bg-white focus:ring-4 focus:ring-[#cfc3ae]/25"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs tracking-[0.22em] text-ink-soft">
              结束日期
            </span>
            <input
              type="date"
              value={end}
              onChange={(event) => changeEnd(event.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] outline-none transition focus:border-[#cfc3ae] focus:bg-white focus:ring-4 focus:ring-[#cfc3ae]/25"
            />
          </label>
        </div>
        {inverted ? (
          <p className="mt-3 text-sm text-ink-soft">起止日期已自动对调后计算。</p>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard label="采购条目" value={`${stats.count}`} unit="条" />
        <SummaryCard label="书目种数" value={`${stats.titles}`} unit="种" />
        <SummaryCard label="购买数量" value={`${stats.quantity}`} unit="本" />
        <SummaryCard label="累计费用" value={formatMoney(stats.cost)} unit="" />
        <SummaryCard label="平均费用" value={formatMoney(stats.averageCost)} unit="每条" />
        <SummaryCard label="未上传发票" value={`${stats.missingInvoice}`} unit="条" />
      </section>

      {stats.count === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-surface/70 px-6 py-16 text-center">
          <p className="font-serif text-2xl text-ink">这个日期范围内没有采购</p>
          <p className="mt-3 text-sm text-ink-soft">换一段时间再看，或点「全部」查看所有在库书目。</p>
        </div>
      ) : (
        <>
          <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="font-serif text-2xl text-ink">按月费用</h2>
            <div className="mt-5 flex flex-col gap-3">
              {stats.byMonth.map((row) => (
                <div key={row.name} className="grid grid-cols-[7.5rem_minmax(0,1fr)_auto] items-center gap-3">
                  <span className="text-sm text-ink-soft">{formatYearMonth(row.name)}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-paper-deep">
                    <div
                      className="h-full rounded-full bg-[#cfc3ae]"
                      style={{
                        width:
                          maxMonthCost && row.cost
                            ? `${Math.max(8, (row.cost / maxMonthCost) * 100)}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <span className="whitespace-nowrap text-sm tabular-nums text-ink">
                    {formatMoney(row.cost)}
                    <span className="ml-2 text-ink-soft">{row.count} 条</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <GroupTable title="报销经费" rows={stats.byFund} />
            <GroupTable title="采购人员" rows={stats.byPurchaser} />
            <GroupTable title="购买申请" rows={stats.byApplicant} />
          </div>

          <section className="overflow-hidden rounded-3xl border border-line bg-surface">
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <h2 className="font-serif text-2xl text-ink">书目明细</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-paper text-xs tracking-[0.18em] text-ink-soft">
                  <tr>
                    <th className="px-5 py-3 font-normal sm:px-6">书名</th>
                    <th className="px-5 py-3 font-normal sm:px-6">采购时间</th>
                    <th className="px-5 py-3 font-normal sm:px-6">数量</th>
                    <th className="px-5 py-3 font-normal sm:px-6">费用</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.books.map((record) => (
                    <tr key={record.id} className="border-t border-line">
                      <td className="px-5 py-4 sm:px-6">
                        <Link href={`/records/${record.id}`} className="font-medium text-ink hover:underline">
                          {record.title}
                        </Link>
                        <div className="mt-1 text-xs text-ink-soft">
                          {record.author || "作者未填"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-ink-soft sm:px-6">
                        {formatDate(record.purchaseDate)}
                      </td>
                      <td className="px-5 py-4 tabular-nums text-ink-soft sm:px-6">
                        {record.quantity || 0} 本
                      </td>
                      <td className="px-5 py-4 tabular-nums text-ink sm:px-6">
                        {formatMoney(record.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Chip({
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
        active ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function SummaryCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-3xl border border-line bg-surface px-5 py-5">
      <div className="text-xs tracking-[0.22em] text-ink-soft">{label}</div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-serif text-3xl leading-none tabular-nums text-ink">{value}</span>
        {unit ? <span className="text-sm text-ink-soft">{unit}</span> : null}
      </div>
    </div>
  );
}

function GroupTable({ title, rows }: { title: string; rows: StatsGroup[] }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-serif text-2xl text-ink">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-paper text-xs tracking-[0.18em] text-ink-soft">
            <tr>
              <th className="px-5 py-3 font-normal">名称</th>
              <th className="px-5 py-3 font-normal">条数</th>
              <th className="px-5 py-3 font-normal">费用</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-t border-line">
                <td className="px-5 py-3 text-ink">{row.name}</td>
                <td className="px-5 py-3 tabular-nums text-ink-soft">{row.count}</td>
                <td className="px-5 py-3 tabular-nums text-ink">{formatMoney(row.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
