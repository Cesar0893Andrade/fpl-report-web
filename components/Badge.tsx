import { COLORS } from "@/lib/colors";

export default function Badge({ emblem, short, i }: { emblem: string | null; short: string; i: number }) {
  return emblem
    ? <img className="badge sm" src={`/${emblem}`} alt="" loading="lazy" />
    : <div className="badge sm" style={{ background: `linear-gradient(160deg,${COLORS[i % COLORS.length]},${COLORS[(i + 3) % COLORS.length]})` }}>{short}</div>;
}
