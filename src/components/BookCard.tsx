import Link from "next/link";
import { fileUrl, formatDate, formatMoney } from "@/lib/format";
import type { PurchaseRecord } from "@/lib/types";

export function BookCard({ record }: { record: PurchaseRecord }) {
  return (
    <Link
      href={`/records/${record.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_16px_40px_rgba(80,60,40,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_46px_rgba(80,60,40,0.12)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-paper-deep">
        {record.photoName ? (
          // Uploaded covers are served from the local API, not the Next image optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl(record.id, "photo")}
            alt={record.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <span className="font-serif text-4xl text-ink/30">
              {record.title.slice(0, 1) || "书"}
            </span>
          </div>
        )}
        {!record.invoiceName ? (
          <div className="absolute inset-x-0 bottom-0 bg-[#9c3b2a]/88 px-3 py-2 text-center text-xs leading-5 text-white">
            需补充发票
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-4 py-4">
        <h2 className="font-serif text-xl leading-7 text-ink">{record.title}</h2>
        <p className="text-sm text-ink-soft">{record.author || "作者未填"}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-ink-soft">
          <span>{formatDate(record.purchaseDate)}</span>
          <span className="text-seal">{formatMoney(record.cost)}</span>
        </div>
      </div>
    </Link>
  );
}
