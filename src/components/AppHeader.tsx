import type { ReactNode } from "react";
import Link from "next/link";

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
};

export function AppHeader({
  title = "图书采购资料库",
  subtitle = "发票、照片与采购信息集中归档",
  action,
}: AppHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-line/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Link href="/" className="group inline-flex flex-col">
          <span className="text-xs tracking-[0.28em] text-gold uppercase">
            Purchase Archive
          </span>
          <h1 className="mt-2 font-serif text-3xl tracking-wide text-ink sm:text-4xl">
            {title}
          </h1>
        </Link>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">{subtitle}</p>
      </div>
      {action}
    </header>
  );
}
