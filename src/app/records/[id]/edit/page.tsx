import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { RecordForm } from "@/components/RecordForm";
import { getRecord } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getRecord(id);
  if (!record) notFound();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <AppHeader
        title={`整理《${record.title}》`}
        subtitle="修改采购信息，或替换发票、照片与补充文档。"
        action={
          <Link
            href={`/records/${record.id}`}
            className="rounded-full border border-line px-5 py-2.5 text-sm"
          >
            返回详情
          </Link>
        }
      />
      <RecordForm mode="edit" record={record} />
    </div>
  );
}
