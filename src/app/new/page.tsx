import { AppHeader } from "@/components/AppHeader";
import { RecordForm } from "@/components/RecordForm";
import Link from "next/link";

export default function NewRecordPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <AppHeader
        title="新增采购"
        subtitle="填写采购条目，并上传图书发票与照片。"
        action={
          <Link href="/" className="rounded-full border border-line px-5 py-2.5 text-sm">
            返回书目
          </Link>
        }
      />
      <RecordForm mode="create" />
    </div>
  );
}
