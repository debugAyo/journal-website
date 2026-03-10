"use client";

import Link from "next/link";
import { useId } from "react";

export default function Logo({ size = "default" }) {
  const gradientId = useId();
  const goldId = `${gradientId}-gold`;

  const sizes = {
    small: {
      box: "w-9 h-9",
      svg: "w-6 h-6",
      title: "text-sm",
      subtitle: "text-[9px]",
      gap: "gap-2",
    },
    default: {
      box: "w-11 h-11",
      svg: "w-7 h-7",
      title: "text-lg",
      subtitle: "text-[10px]",
      gap: "gap-2.5",
    },
    large: {
      box: "w-14 h-14",
      svg: "w-9 h-9",
      title: "text-2xl",
      subtitle: "text-xs",
      gap: "gap-3",
    },
  };

  const s = sizes[size] || sizes.default;

  return (
    <Link href="/" className={`flex items-center ${s.gap} group`} aria-label="IJECCET home">
      {/* Shield / crest icon */}
      <div
        className={`${s.box} rounded-lg flex items-center justify-center transition-shadow duration-300 group-hover:shadow-xl`}
        style={{
          background: "linear-gradient(160deg, #0a2e2b 0%, #14534e 50%, #1a6b64 100%)",
          boxShadow: "0 4px 14px rgba(10,46,43,0.35)",
        }}
      >
        <svg viewBox="0 0 40 40" className={s.svg} role="img" aria-hidden="true">
          <defs>
            <linearGradient id={goldId} x1="0" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#f0d89a" />
              <stop offset="50%" stopColor="#c9a24d" />
              <stop offset="100%" stopColor="#f0d89a" />
            </linearGradient>
          </defs>
          {/* Open book */}
          <path
            d="M10 28 L20 25 L30 28 L30 13 L20 10 L10 13 Z"
            fill="none"
            stroke={`url(#${goldId})`}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          {/* Spine */}
          <line x1="20" y1="10" x2="20" y2="25" stroke={`url(#${goldId})`} strokeWidth="1.2" />
          {/* Circuit / tech lines on left page */}
          <line x1="13" y1="16" x2="18" y2="15" stroke="#8ec6c0" strokeWidth="0.9" strokeLinecap="round" />
          <line x1="13" y1="19" x2="17" y2="18.2" stroke="#8ec6c0" strokeWidth="0.9" strokeLinecap="round" />
          <circle cx="13" cy="16" r="0.9" fill="#8ec6c0" />
          {/* Circuit / tech lines on right page */}
          <line x1="22" y1="15" x2="27" y2="16" stroke="#8ec6c0" strokeWidth="0.9" strokeLinecap="round" />
          <line x1="23" y1="18.2" x2="27" y2="19" stroke="#8ec6c0" strokeWidth="0.9" strokeLinecap="round" />
          <circle cx="27" cy="16" r="0.9" fill="#8ec6c0" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col leading-none">
        <span
          className={`${s.title} font-bold tracking-tight`}
          style={{ color: "#0e3d3a", fontFamily: "'Georgia', 'Times New Roman', serif" }}
        >
          IJECCET
        </span>
        <span
          className={`${s.subtitle} mt-0.5 font-medium uppercase tracking-[0.18em]`}
          style={{ color: "#7a8a87" }}
        >
          Open Access Journal
        </span>
      </div>
    </Link>
  );
}
