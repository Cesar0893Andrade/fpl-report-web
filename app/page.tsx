import HomeLive from "@/components/HomeLive";
import { LeagueLive, Predicciones } from "@/lib/typesLive";
import liga747 from "@/data/liga-747.json";
import pred747 from "@/data/predicciones-747.json";

export default function Page() {
  return <HomeLive d={liga747 as unknown as LeagueLive} pred={pred747 as unknown as Predicciones} />;
}
