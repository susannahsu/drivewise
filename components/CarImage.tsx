"use client";

import { useEffect, useState } from "react";
import { fetchCarThumb } from "@/lib/car-image";

/** Car photo for a make/model, with a neutral glyph fallback so layout holds. */
export function CarImage({
  make,
  model,
  className = "",
}: {
  make: string;
  model: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    // setState happens after the await, not synchronously in the effect body.
    fetchCarThumb(make, model).then((url) => {
      if (!active) return;
      setSrc(url);
      setDone(true);
    });
    return () => {
      active = false;
    };
  }, [make, model]);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- dynamic Wikimedia URL
      <img
        src={src}
        alt={`${make} ${model}`}
        loading="lazy"
        className={`object-contain ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 ${
        done ? "text-zinc-300" : "animate-pulse text-zinc-200"
      } ${className}`}
      aria-label={`${make} ${model}`}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
        <path d="M3 13l2-5a3 3 0 012.8-2h8.4A3 3 0 0119 8l2 5v5h-3v-2H6v2H3v-5zm3 0h12l-1.2-3.6a1 1 0 00-.95-.65H8.15a1 1 0 00-.95.65L6 13zm1.5 2.5a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z" />
      </svg>
    </div>
  );
}
