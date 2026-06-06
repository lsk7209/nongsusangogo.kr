"use client";

import { useMemo, useState } from "react";

export function PriceTool({
  price,
  unit,
  pricePerKg,
}: {
  price: number | null;
  unit: string;
  pricePerKg: number | null;
}) {
  const [mode, setMode] = useState<"unit" | "kg">("unit");
  const display = useMemo(() => {
    if (mode === "kg") {
      return pricePerKg === null
        ? "환산 보류"
        : `${pricePerKg.toLocaleString("ko-KR")}원/kg`;
    }

    return price === null ? "결측" : `${price.toLocaleString("ko-KR")}원/${unit}`;
  }, [mode, price, pricePerKg, unit]);

  return (
    <div className="tool">
      <div className="segmented" role="group" aria-label="price display mode">
        <button
          type="button"
          aria-pressed={mode === "unit"}
          onClick={() => setMode("unit")}
        >
          단위
        </button>
        <button
          type="button"
          aria-pressed={mode === "kg"}
          onClick={() => setMode("kg")}
        >
          원/kg
        </button>
      </div>
      <strong>{display}</strong>
    </div>
  );
}

