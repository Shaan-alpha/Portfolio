"use client";

// Fixed (deterministic) glitter positions so SSR and client markup match.
const DOTS = [
  { left: "8%", top: "22%", size: 3, delay: 0.0, dur: 3.2 },
  { left: "16%", top: "64%", size: 2, delay: 1.4, dur: 2.6 },
  { left: "24%", top: "38%", size: 4, delay: 0.8, dur: 3.8 },
  { left: "31%", top: "78%", size: 2, delay: 2.1, dur: 2.9 },
  { left: "40%", top: "18%", size: 3, delay: 1.1, dur: 3.4 },
  { left: "47%", top: "56%", size: 2, delay: 2.6, dur: 2.5 },
  { left: "55%", top: "30%", size: 4, delay: 0.4, dur: 4.0 },
  { left: "61%", top: "72%", size: 2, delay: 1.8, dur: 2.7 },
  { left: "68%", top: "24%", size: 3, delay: 3.0, dur: 3.1 },
  { left: "74%", top: "60%", size: 2, delay: 0.6, dur: 3.6 },
  { left: "81%", top: "40%", size: 3, delay: 2.3, dur: 2.8 },
  { left: "88%", top: "70%", size: 2, delay: 1.2, dur: 3.3 },
  { left: "92%", top: "28%", size: 3, delay: 0.2, dur: 3.9 },
  { left: "12%", top: "44%", size: 2, delay: 2.8, dur: 2.6 },
  { left: "36%", top: "50%", size: 2, delay: 1.6, dur: 3.5 },
  { left: "58%", top: "14%", size: 2, delay: 0.9, dur: 3.0 },
];

export default function Sparkles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]" aria-hidden>
      {DOTS.map((d, i) => (
        <span
          key={i}
          className="sparkle"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
