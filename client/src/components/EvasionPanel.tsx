import { useState } from 'react';
import { Settings2, Shield } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type EvasionProtection = 'none' | 'light' | 'heavy';

interface EvasionPanelProps {
  agility: number;
  protection: EvasionProtection;
  defensiveCharges: number;
  maxDefensiveCharges: number;
  onProtectionChange: (value: EvasionProtection) => void;
  onDefensiveChargesChange: (value: number) => void;
  onMaxDefensiveChargesChange: (value: number) => void;
}

const MAX_POSSIBLE_CHARGES = 4;

const PROTECTION_OPTIONS: Array<{
  value: EvasionProtection;
  label: string;
  bonus: number;
}> = [
  { value: 'none', label: 'Sem proteção', bonus: 0 },
  { value: 'light', label: 'Proteção leve', bonus: 1 },
  { value: 'heavy', label: 'Proteção pesada', bonus: 3 },
];

export default function EvasionPanel({
  agility,
  protection,
  defensiveCharges,
  maxDefensiveCharges,
  onProtectionChange,
  onDefensiveChargesChange,
  onMaxDefensiveChargesChange,
}: EvasionPanelProps) {
  const [configOpen, setConfigOpen] = useState(false);

  const baseEvasion = 7 + agility;
  const protectionBonus = PROTECTION_OPTIONS.find((option) => option.value === protection)?.bonus ?? 0;
  const totalEvasion = baseEvasion + protectionBonus;
  const protectionLabel = PROTECTION_OPTIONS.find((option) => option.value === protection)?.label ?? 'Sem proteção';

  const handleChargeClick = (index: number) => {
    const chargeMask = 1 << index;
    const newCharges = defensiveCharges ^ chargeMask;

    onDefensiveChargesChange(newCharges);
  };

  return (
    <div className="card-occult space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 text-center">
          <h3 className="font-display text-sm text-sky-300 uppercase">Evasão</h3>
          <div className="font-display text-3xl text-sky-300 leading-none">{totalEvasion}</div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Popover open={configOpen} onOpenChange={setConfigOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="btn-occult h-7 w-7 p-0 flex items-center justify-center opacity-80 hover:opacity-100"
                aria-label="Configurar proteção da evasão"
              >
                <Settings2 size={14} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 border-primary bg-black text-white p-3">
              <div className="space-y-3">
                <div>
                  <div className="font-display text-xs uppercase text-primary">Proteção</div>
                  <div className="text-[10px] uppercase text-muted-foreground">
                    Escolha um estado de proteção
                  </div>
                </div>

                <div className="space-y-2">
                  {PROTECTION_OPTIONS.map((option) => {
                    const isActive = option.value === protection;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onProtectionChange(option.value);
                          setConfigOpen(false);
                        }}
                        className={`w-full border px-3 py-2 text-left text-xs uppercase transition-all ${
                          isActive
                            ? 'border-primary bg-primary text-black'
                            : 'border-primary/40 bg-black text-primary hover:border-primary hover:bg-primary/10'
                        }`}
                      >
                        <span>{option.label}</span>
                        <span className="ml-2 text-[10px] opacity-80">+{option.bonus}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-primary/20 pt-3">
                  <div className="font-display text-xs uppercase text-primary mb-2">Cargas defensivas</div>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: MAX_POSSIBLE_CHARGES }).map((_, index) => {
                      const chargeCount = index + 1;
                      const isActive = chargeCount === maxDefensiveCharges;

                      return (
                        <button
                          key={chargeCount}
                          type="button"
                          onClick={() => onMaxDefensiveChargesChange(chargeCount)}
                          className={`border px-2 py-2 text-xs uppercase transition-all ${
                            isActive
                              ? 'border-primary bg-primary text-black'
                              : 'border-primary/40 bg-black text-primary hover:border-primary hover:bg-primary/10'
                          }`}
                        >
                          {chargeCount}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex gap-2">
            {Array.from({ length: maxDefensiveCharges }).map((_, index) => {
              const isFilled = (defensiveCharges & (1 << index)) !== 0;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleChargeClick(index)}
                  className={`flex h-7 w-7 items-center justify-center border transition-all ${
                    isFilled
                      ? 'border-sky-400 bg-sky-400 text-black'
                      : 'border-sky-400/40 bg-black text-sky-300 hover:border-sky-400 hover:bg-sky-400/10'
                  }`}
                  aria-label={`Definir cargas defensivas em ${index + 1}`}
                >
                  <Shield size={12} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}