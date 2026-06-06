import type { PriceObservation } from "@/lib/content/site-pages";

export function PriceChart({
  observations,
}: {
  observations: PriceObservation[];
}) {
  const max = Math.max(
    ...observations.map((observation) => observation.price ?? 0),
    1,
  );

  return (
    <div className="chart" aria-label="price chart">
      {observations.map((observation) => (
        <div className="chart-row" key={observation.label}>
          <span>{observation.label}</span>
          <div className="bar-track">
            <div
              className="bar"
              style={{
                width: `${Math.max(((observation.price ?? 0) / max) * 100, 4)}%`,
              }}
            />
          </div>
          <strong>
            {observation.price === null
              ? "결측"
              : `${observation.price.toLocaleString("ko-KR")}원`}
          </strong>
        </div>
      ))}
    </div>
  );
}

