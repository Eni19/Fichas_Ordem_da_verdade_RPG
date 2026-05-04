import { useState } from 'react';

interface AttributeHexagonProps {
  attribute: string;
  value: number;
  onChange: (value: number) => void;
}

const attributeDieMap: Record<number, string> = {
  0: '2d6 (<)',
  1: '1d6',
  2: '1d8',
  3: '1d10',
  4: '1d12',
  5: '2d12 (>)',
};

const attributeLabels: Record<string, string> = {
  força: 'FOR',
  agilidade: 'AGI',
  inteligência: 'INT',
  presença: 'PRE',
  vigor: 'VIG',
};

export default function AttributeHexagon({ attribute, value, onChange }: AttributeHexagonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  const handleSave = () => {
    const parsedValue = parseInt(tempValue) || 0;
    const numValue = Math.max(0, Math.min(5, parsedValue));
    onChange(numValue);
    setTempValue(numValue.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-full aspect-square max-w-20 md:max-w-24 mx-auto bg-black border-2 border-primary hover:shadow-[0_0_10px_rgba(255,23,68,0.35)] transition-all duration-200 cursor-pointer flex items-center justify-center"
        onClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <input
            type="number"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
            className="w-12 h-12 bg-black text-primary text-center text-lg border-none outline-none"
            min={0}
            max={5}
          />
        ) : (
          <div className="text-center">
            <div style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }} className="text-2xl text-primary">{value}</div>
            <div className="text-[10px] text-muted-foreground font-mono">{attributeDieMap[Math.max(0, Math.min(5, value))]}</div>
          </div>
        )}
      </div>
      <span className="text-sm font-display text-primary uppercase tracking-wider font-bold">
        {attributeLabels[attribute]}
      </span>
    </div>
  );
}
