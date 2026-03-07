"use client";

import Link from "next/link";
import { useId } from "react";

export default function Logo({ size = "default" }) {
  const gradientId = useId();

  const sizes = {
    small: {
      box: "w-8 h-8",
      glyph: "w-5 h-5",
      dot: "w-2 h-2",
      title: "text-base",
      subtitle: "text-[10px]",
    },
    default: {
      box: "w-10 h-10",
      glyph: "w-6 h-6",
      dot: "w-3 h-3",
      title: "text-lg",
      subtitle: "text-xs",
    },
    large: {
      box: "w-14 h-14",
      glyph: "w-8 h-8",
      dot: "w-4 h-4",
      title: "text-2xl",
      subtitle: "text-sm",
    },
  };

  const s = sizes[size] || sizes.default;

  return (
    <Link href="/" className="flex items-center gap-2.5 group" aria-label="Ubuntu Journal home">
      <div className="relative">
        <div
          className={`${s.box} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 border border-white/30`}
          style={{
            background: "linear-gradient(145deg, #0f3d3a 0%, #175653 45%, #2f8b83 100%)",
            boxShadow: "0 8px 20px rgba(16,56,56,0.28)",
          }}
        >
          <svg viewBox="0 0 32 32" className={`${s.glyph}`} role="img" aria-hidden="true">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f7d6a3" />
                <stop offset="100%" stopColor="#d5a66a" />
              </linearGradient>
            </defs>
            <path
              d="M7 8.5v9.3c0 4.2 3.1 7.2 7.8 7.2 3.8 0 6.9-1.9 8.5-5.1"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M24.5 8.2v8.4"
              stroke="#f4f1ea"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <circle cx="24.5" cy="20.7" r="2.2" fill={`url(#${gradientId})`} />
          </svg>
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 ${s.dot} rounded-full border-2 border-white`}
          style={{ backgroundColor: "#d5a66a" }}
        ></div>
      </div>
      <div className="flex flex-col">
        <span className={`${s.title} font-bold tracking-tight`} style={{ color: "#175653" }}>
          Ubuntu
        </span>
        <span className={`${s.subtitle} -mt-1 tracking-[0.22em]`} style={{ color: "#7a6a56" }}>
          JOURNAL
        </span>
      </div>
    </Link>
  );
}
