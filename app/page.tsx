import Dashboard from "@/components/Dashboard";
import { League } from "@/lib/types";
import liga35 from "@/data/liga-35.json";
import liga24996 from "@/data/liga-24996.json";

export default function Page() {
  const leagues: Record<number, League> = {
    35: liga35 as unknown as League,
    24996: liga24996 as unknown as League,
  };
  return <Dashboard leagues={leagues} order={[35, 24996]} />;
}
