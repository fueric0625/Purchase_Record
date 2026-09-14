import type { PurchaseRecord } from "./types";

export type StatsGroup = {
  name: string;
  count: number;
  quantity: number;
  cost: number;
};

export type PurchaseStats = {
  count: number;
  titles: number;
  quantity: number;
  cost: number;
  averageCost: number;
  missingInvoice: number;
  byMonth: StatsGroup[];
  byFund: StatsGroup[];
  byPurchaser: StatsGroup[];
  byApplicant: StatsGroup[];
  books: PurchaseRecord[];
};

export function purchaseDay(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
  return "";
}

export function recordsInPurchaseRange(
  records: PurchaseRecord[],
  start: string,
  end: string,
): PurchaseRecord[] {
  const from = start.trim();
  const to = end.trim();
  return records.filter((record) => {
    const day = purchaseDay(record.purchaseDate);
    if (!day) return !from && !to;
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  });
}

export function dateBounds(records: PurchaseRecord[]): { start: string; end: string } {
  const days = records.map((record) => purchaseDay(record.purchaseDate)).filter(Boolean);
  if (days.length === 0) return { start: "", end: "" };
  days.sort();
  return { start: days[0], end: days[days.length - 1] };
}

function groupBy(
  records: PurchaseRecord[],
  keyFn: (record: PurchaseRecord) => string,
): StatsGroup[] {
  const map = new Map<string, StatsGroup>();
  for (const record of records) {
    const name = keyFn(record);
    const current = map.get(name) ?? { name, count: 0, quantity: 0, cost: 0 };
    current.count += 1;
    current.quantity += record.quantity || 0;
    current.cost += record.cost || 0;
    map.set(name, current);
  }
  return [...map.values()].sort((a, b) => {
    const costCmp = b.cost - a.cost;
    return costCmp !== 0 ? costCmp : b.count - a.count;
  });
}

export function summarizePurchases(records: PurchaseRecord[]): PurchaseStats {
  const books = [...records].sort((a, b) => {
    const dateCmp = (b.purchaseDate || "").localeCompare(a.purchaseDate || "");
    return dateCmp !== 0 ? dateCmp : (b.createdAt || "").localeCompare(a.createdAt || "");
  });
  const count = books.length;
  const quantity = books.reduce((sum, record) => sum + (record.quantity || 0), 0);
  const cost = books.reduce((sum, record) => sum + (record.cost || 0), 0);
  const titles = new Set(
    books.map((record) => record.title.trim()).filter(Boolean),
  ).size;

  return {
    count,
    titles,
    quantity,
    cost,
    averageCost: count ? cost / count : 0,
    missingInvoice: books.filter((record) => !record.invoiceName).length,
    byMonth: groupBy(books, (record) => record.purchaseDate.slice(0, 7) || "未填写").sort(
      (a, b) => a.name.localeCompare(b.name),
    ),
    byFund: groupBy(books, (record) => record.fundSource.trim() || "未填写"),
    byPurchaser: groupBy(books, (record) => record.purchaser.trim() || "未填写"),
    byApplicant: groupBy(books, (record) => record.applicant.trim() || "未填写"),
    books,
  };
}
