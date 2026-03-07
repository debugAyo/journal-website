"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh({ intervalMs = 15000 }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();

    const intervalId = setInterval(refresh, intervalMs);
    window.addEventListener("focus", refresh);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
    };
  }, [router, intervalMs]);

  return null;
}
