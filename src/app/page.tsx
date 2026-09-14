import { HomeCatalog } from "@/components/HomeCatalog";
import { listRecords } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const records = await listRecords();
  return <HomeCatalog records={records} />;
}
