import { StatsPanel } from "@/components/StatsPanel";
import { listRecords } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const records = await listRecords();
  return <StatsPanel records={records} />;
}
