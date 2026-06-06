export function WholesaleRetailGauge({ value }: { value: number }) {
  const bounded = Math.min(Math.max(value, 0), 100);

  return (
    <div>
      <div className="gauge" aria-label="wholesale retail gauge">
        <span className="gauge-marker" style={{ left: `${bounded}%` }} />
      </div>
      <p>도소매 조인 검증 전에는 참고 지표만 표시합니다.</p>
    </div>
  );
}

