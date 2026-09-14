export function formatDate(value: string): string {
  if (!value) return "未填写";
  const [year, month, day] = value.split("-");
  if (!year || !month) return value;
  return day ? `${year}年${Number(month)}月${Number(day)}日` : `${year}年${Number(month)}月`;
}

export function formatMoney(value: number): string {
  return `¥${value.toLocaleString("zh-CN", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatYearMonth(value: string): string {
  if (!value || value === "未填写") return "未填写";
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  return `${year}年${Number(month)}月`;
}

export function formatDateTime(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export function fileUrl(
  id: string,
  kind: "photo" | "invoice" | "extra" | "purchase",
  version?: string | null,
): string {
  const base = `/api/files/${id}/${kind}`;
  return version ? `${base}?v=${encodeURIComponent(version)}` : base;
}
