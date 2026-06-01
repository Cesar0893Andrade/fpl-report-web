import Dashboard, { League } from "@/components/Dashboard";
import liga35 from "@/data/liga-35.json";
import liga24996 from "@/data/liga-24996.json";

export default function Page() {
  const leagues: Record<number, League> = {
    35: liga35 as League,
    24996: liga24996 as League,
  };
  return <Dashboard leagues={leagues} order={[35, 24996]} />;
}
