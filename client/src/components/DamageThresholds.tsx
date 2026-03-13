interface DamageThreshold {
  minor: number;
  major: number;
  severe: number;
}

interface DamageThresholdsProps {
  thresholds: DamageThreshold;
  onChange: (field: keyof DamageThreshold, value: number) => void;
}

export default function DamageThresholds({ thresholds, onChange }: DamageThresholdsProps) {
  return (
    <div className="w-full border-2 border-primary bg-card p-2 space-y-1">
      <h3 className="font-display text-xs text-primary uppercase">Limiares</h3>

      <div className="grid grid-cols-3 gap-1">
        <div className="flex flex-col items-center gap-0.5">
          <label className="font-display text-[11px] text-primary uppercase">Menor</label>
          <input
            type="number"
            value={thresholds.minor}
            onChange={(e) => onChange('minor', parseInt(e.target.value) || 0)}
            style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
            className="w-full bg-input border border-primary text-primary text-center focus:outline-none focus:ring-1 focus:ring-primary p-0.5 text-xs"
            min="0"
          />
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <label className="font-display text-[11px] text-primary uppercase">Maior</label>
          <input
            type="number"
            value={thresholds.major}
            onChange={(e) => onChange('major', parseInt(e.target.value) || 0)}
            style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
            className="w-full bg-input border border-primary text-primary text-center focus:outline-none focus:ring-1 focus:ring-primary p-0.5 text-xs"
            min="0"
          />
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <label className="font-display text-[11px] text-primary uppercase">Severo</label>
          <input
            type="number"
            value={thresholds.severe}
            onChange={(e) => onChange('severe', parseInt(e.target.value) || 0)}
            style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
            className="w-full bg-input border border-primary text-primary text-center focus:outline-none focus:ring-1 focus:ring-primary p-0.5 text-xs"
            min="0"
          />
        </div>
      </div>
    </div>
  );
}
