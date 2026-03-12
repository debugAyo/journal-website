"use client";

import Link from "next/link";
import { useId } from "react";

export default function Logo({ size = "default" }) {
  const uid = useId();
  const tealGrad = `${uid}-teal`;
  const goldGrad = `${uid}-gold`;
  const circuitGrad = `${uid}-circuit`;

  const sizes = {
    small: {
      box: "w-9 h-9",
      svg: 36,
      title: "text-sm",
      subtitle: "text-[8px]",
      gap: "gap-2",
    },
    default: {
      box: "w-11 h-11",
      svg: 44,
      title: "text-lg",
      subtitle: "text-[9px]",
      gap: "gap-2.5",
    },
    large: {
      box: "w-14 h-14",
      svg: 56,
      title: "text-2xl",
      subtitle: "text-[10px]",
      gap: "gap-3",
    },
  };

  const s = sizes[size] || sizes.default;

  return (
    <Link href="/" className={`flex items-center ${s.gap} group`} aria-label="IJECCET home">
      {/* Logo mark */}
      <div
        className={`${s.box} rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-xl group-hover:scale-[1.03]`}
        style={{
          background: "linear-gradient(145deg, #0b2e2b 0%, #14534e 45%, #1a6b64 100%)",
          boxShadow: "0 4px 16px rgba(10,46,43,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <svg
          viewBox="0 0 100 100"
          width={s.svg}
          height={s.svg}
          role="img"
          aria-hidden="true"
          style={{ display: "block" }}
        >
          <defs>
            <linearGradient id={tealGrad} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8ec6c0" />
              <stop offset="100%" stopColor="#5ba8a0" />
            </linearGradient>
            <linearGradient id={goldGrad} x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0%" stopColor="#f5e2b0" />
              <stop offset="50%" stopColor="#c9a24d" />
              <stop offset="100%" stopColor="#f0d89a" />
            </linearGradient>
            <linearGradient id={circuitGrad} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8ec6c0" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#5ba8a0" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Outer hexagonal shield outline */}
          <polygon
            points="50,8 88,28 88,72 50,92 12,72 12,28"
            fill="none"
            stroke={`url(#${goldGrad})`}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Inner hexagonal frame */}
          <polygon
            points="50,18 78,34 78,66 50,82 22,66 22,34"
            fill="none"
            stroke={`url(#${tealGrad})`}
            strokeWidth="1.2"
            strokeLinejoin="round"
            opacity="0.5"
          />

          {/* Central open book */}
          <path
            d="M32,60 L50,54 L68,60 L68,38 L50,32 L32,38 Z"
            fill="none"
            stroke={`url(#${goldGrad})`}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Book spine */}
          <line
            x1="50" y1="32" x2="50" y2="54"
            stroke={`url(#${goldGrad})`}
            strokeWidth="1.5"
          />

          {/* Left page: circuit/tech traces */}
          <line x1="36" y1="42" x2="46" y2="40" stroke={`url(#${circuitGrad})`} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="36" y1="47" x2="44" y2="45.5" stroke={`url(#${circuitGrad})`} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="36" y1="52" x2="46" y2="50" stroke={`url(#${circuitGrad})`} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="36" cy="42" r="1.3" fill="#8ec6c0" />
          <circle cx="36" cy="47" r="1.3" fill="#8ec6c0" />
          <circle cx="36" cy="52" r="1.3" fill="#8ec6c0" />

          {/* Right page: circuit/tech traces */}
          <line x1="54" y1="40" x2="64" y2="42" stroke={`url(#${circuitGrad})`} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="56" y1="45.5" x2="64" y2="47" stroke={`url(#${circuitGrad})`} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="54" y1="50" x2="64" y2="52" stroke={`url(#${circuitGrad})`} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="64" cy="42" r="1.3" fill="#8ec6c0" />
          <circle cx="64" cy="47" r="1.3" fill="#8ec6c0" />
          <circle cx="64" cy="52" r="1.3" fill="#8ec6c0" />

          {/* Top: small electron orbit / signal arcs */}
          <path
            d="M40,24 Q50,18 60,24"
            fill="none"
            stroke={`url(#${tealGrad})`}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="50" cy="19" r="1.8" fill="#c9a24d" />

          {/* Bottom accent line */}
          <line x1="38" y1="70" x2="62" y2="70" stroke={`url(#${goldGrad})`} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col leading-none">
        <span
          className={`${s.title} font-extrabold tracking-tight`}
          style={{ color: "#0e3d3a", fontFamily: "'Georgia', 'Times New Roman', serif" }}
        >
          IJECCET
        </span>
        <span
          className={`${s.subtitle} mt-0.5 font-semibold uppercase tracking-[0.2em]`}
          style={{ color: "#8a9693" }}
        >
          Open Access Journal
        </span>
      </div>
    </Link>
  );
}
