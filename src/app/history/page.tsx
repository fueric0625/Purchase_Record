import { HistoryList } from "@/components/HistoryList";
import { listHistoryRecords } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const records = await listHistoryRecords();
  return <HistoryList records={records} />;
}
