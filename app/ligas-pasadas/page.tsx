import Link from "next/link";
import Dashboard from "@/components/Dashboard";
import { League } from "@/lib/types";
import liga35 from "@/data/liga-35.json";
import liga24996 from "@/data/liga-24996.json";

export const metadata = { title: "Ligas pasadas - Fantasy Premier League" };

export default function Page() {
  const leagues: Record<number, League> = {
    35: liga35 as unknown as League,
    24996: liga24996 as unknown as League,
  };
  return (
    <>
      <div className="backbar">
        <div className="wrap">
          <Link className="backlink" href="/">&larr; Liga actual 26/27</Link>
        </div>
      </div>
      <Dashboard leagues={leagues} order={[35, 24996]} />
    </>
  );
}
