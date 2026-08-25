import Temporada from "@/components/Temporada";
import { LigaAnalitica } from "@/lib/typesAnalytics";
import analitica from "@/data/liga-747-analitica.json";

export const metadata = { title: "La temporada - Fantasy Premier League VIII" };

export default function Page() {
  return <Temporada d={analitica as unknown as LigaAnalitica} />;
}
