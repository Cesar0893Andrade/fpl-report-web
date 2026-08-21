export default function Crest({ text = "VII" }: { text?: string }) {
  return (
    <svg className="crest" viewBox="0 0 64 72" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00FF87" /><stop offset="1" stopColor="#04F5FF" />
        </linearGradient>
      </defs>
      <path d="M14 20 L22 9 L32 17 L42 9 L50 20 L46 24 H18 Z" fill="url(#cg)" />
      <circle cx="22" cy="9" r="2.6" fill="#04F5FF" /><circle cx="32" cy="6" r="2.6" fill="#00FF87" /><circle cx="42" cy="9" r="2.6" fill="#04F5FF" />
      <path d="M14 26 H50 V42 Q50 60 32 67 Q14 60 14 42 Z" fill="none" stroke="url(#cg)" strokeWidth="3" />
      <text x="32" y="50" textAnchor="middle" fontFamily="Poppins,sans-serif" fontWeight="800" fontSize="17" fill="#fff">{text}</text>
    </svg>
  );
}
