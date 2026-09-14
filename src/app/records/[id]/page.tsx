import { notFound } from "next/navigation";
import { RecordDetail } from "@/components/RecordDetail";
import { getRecord } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function RecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getRecord(id);
  if (!record) notFound();
  return <RecordDetail record={record} />;
}
