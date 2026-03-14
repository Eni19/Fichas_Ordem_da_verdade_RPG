interface ArmorSelectorProps {
  armorValue: number;
  onArmorChange: (value: number) => void;
  evasion: number;
  onEvasionChange: (value: number) => void;
}

const MAX_ARMOR = 12;

export default function ArmorSelector({
  armorValue,
  onArmorChange,
  evasion,
  onEvasionChange,
}: ArmorSelectorProps) {
  const handleArmorClick = (index: number) => {
    // Clicando no quadrado: se já está preenchido até ali, limpa; senão, preenche até ali
    const newValue = armorValue === index + 1 ? index : index + 1;
    onArmorChange(newValue);
  };

  return (
    <div className="card-occult h-full space-y-3">
      <div className="space-y-2">
        {/* Evasion */}
        <div className="flex items-center gap-2">
          <label className="font-display text-base text-sky-300 uppercase flex-shrink-0 w-24">Evasão</label>
          <input
            type="number"
            value={evasion}
            onChange={(e) => onEvasionChange(parseInt(e.target.value) || 0)}
            style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
            className="w-20 h-14 bg-sky-950/20 border-2 border-sky-400 text-sky-200 text-center focus:outline-none focus:ring-2 focus:ring-sky-400 p-1 text-2xl"
            min="0"
          />
        </div>

        {/* Armor */}
        <div className="space-y-1">
          <label className="font-display text-sm text-primary uppercase block">Armadura</label>
          <div className="bg-black border border-primary p-2 space-y-2">
            {/* Armor Value Display */}
            <div className="flex items-center justify-between">
              <span className="font-display text-sm text-primary uppercase">Valor</span>
              <span
                style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
                className="text-primary text-base"
              >
                {armorValue}
              </span>
            </div>

            {/* Armor Squares Grid */}
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: MAX_ARMOR }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleArmorClick(index)}
                  className={`w-6 h-6 border-2 transition-all duration-200 flex items-center justify-center text-xs ${
                    index < armorValue
                      ? 'bg-primary border-primary text-black'
                      : 'bg-black border-primary text-primary hover:bg-primary hover:bg-opacity-20'
                  }`}
                  style={{
                    fontWeight: 700,
                    fontFamily: "'Roboto Mono', monospace",
                  }}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
