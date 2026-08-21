import HomeLive from "@/components/HomeLive";
import { LeagueLive } from "@/lib/typesLive";
import liga747 from "@/data/liga-747.json";

export default function Page() {
  return <HomeLive d={liga747 as unknown as LeagueLive} />;
}
