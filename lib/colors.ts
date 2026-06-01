export const COLORS = ["#00FF87","#04F5FF","#FF2D78","#FFD166","#A06CD5","#FF8A5B","#5BE7C4","#F8696B","#9D8DF1","#E6E6E6","#FFB3C7","#7FE3FF","#C0F58A","#FF6FB5","#8AD1FF","#FFC97A"];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mix = (c1: string, c2: string, t: number) => {
  const a = hex(c1), b = hex(c2);
  return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
};

/** Escala condicional rojo → amarillo → verde, normalizada a [min,max]. */
export function rygColor(v: number, min: number, max: number) {
  const t = max > min ? (v - min) / (max - min) : 1;
  return t < 0.5 ? mix("#F8696B", "#FFEB84", t / 0.5) : mix("#FFEB84", "#63BE7B", (t - 0.5) / 0.5);
}
