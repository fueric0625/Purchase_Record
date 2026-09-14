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

export function fileUrl(
  id: string,
  kind: "photo" | "invoice" | "extra" | "purchase",
): string {
  return `/api/files/${id}/${kind}`;
}
