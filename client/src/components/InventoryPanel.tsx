import { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Plus, Dice6 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
}

interface Weapon {
  id: string;
  name: string;
  traits: string;
  damageDie: number;
  hasDamageBonus: boolean;
  damageBonus: number;
  proficiency: number;
  feature: string;
}

interface InventoryPanelProps {
  inventory: InventoryItem[];
  onAddItem: () => void;
  onUpdateItem: (id: string, field: keyof InventoryItem, value: string) => void;
  onDeleteItem: (id: string) => void;
  primaryWeapon: Weapon;
  onUpdatePrimaryWeapon: (field: keyof Weapon, value: string | number | boolean) => void;
  secondaryWeapon: Weapon;
  onUpdateSecondaryWeapon: (field: keyof Weapon, value: string | number | boolean) => void;
  onRollPrimaryDamage: () => void;
  onRollSecondaryDamage: () => void;
}

export default function InventoryPanel({
  inventory,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  primaryWeapon,
  onUpdatePrimaryWeapon,
  secondaryWeapon,
  onUpdateSecondaryWeapon,
  onRollPrimaryDamage,
  onRollSecondaryDamage,
}: InventoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const damageDice = [4, 6, 8, 10, 12, 20];

  const autoResizeTextarea = (target: HTMLTextAreaElement) => {
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  const handleRollAndClose = (onRoll: () => void) => {
    onRoll();
    setIsOpen(false);
  };

  return (
    <>
      {/* Toggle Button - Always visible, positioned outside the panel */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group fixed right-0 top-16 z-40 h-12 w-12 hover:w-40 overflow-hidden bg-black border-2 border-primary hover:bg-primary hover:bg-opacity-10 flex items-center justify-start text-primary transition-all duration-300"
      >
        <span className="flex h-full w-12 flex-shrink-0 items-center justify-center">
          {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </span>
        <span className="pr-4 text-sm font-display uppercase tracking-wide whitespace-nowrap opacity-0 -translate-x-2 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          Equipamentos
        </span>
      </button>

      {/* Panel Content */}
      <div className={`fixed right-0 top-0 h-screen bg-black transition-all duration-300 flex flex-col ${isOpen ? 'w-[21rem] border-l-2 border-primary' : 'w-0 border-l-0'}`} style={{ paddingTop: '3rem' }}>

      {/* Content */}
      {isOpen && (
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="p-4 space-y-4 pr-4">
            {/* Active Weapons Section */}
            <div className="space-y-2">
              <h3 className="font-display text-base text-primary uppercase">Equipamentos</h3>

              {/* Primary Weapon */}
              <div className="border border-primary bg-black p-2.5 space-y-1.5">
                <div className="font-display text-sm text-primary uppercase">Primária</div>
                <input
                  type="text"
                  value={primaryWeapon.name}
                  onChange={(e) => onUpdatePrimaryWeapon('name', e.target.value)}
                  className="w-full bg-transparent border-b border-primary text-primary text-sm focus:outline-none focus:ring-0 uppercase py-0.5"
                  placeholder="Nome"
                />
                <div className="flex gap-1 items-center">
                  <label className="font-display text-sm text-primary uppercase flex-shrink-0">Prof:</label>
                  <input
                    type="number"
                    value={primaryWeapon.proficiency}
                    onChange={(e) => onUpdatePrimaryWeapon('proficiency', parseInt(e.target.value) || 0)}
                    style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
                    className="w-12 h-8 bg-input border border-primary text-primary text-center focus:outline-none focus:ring-1 focus:ring-primary text-sm p-0.5"
                    min="0"
                  />
                </div>
                <div className="flex gap-1 items-center">
                  <label className="font-display text-sm text-primary uppercase flex-shrink-0">Dado:</label>
                  <select
                    value={primaryWeapon.damageDie}
                    onChange={(e) => onUpdatePrimaryWeapon('damageDie', parseInt(e.target.value))}
                    className="flex-1 bg-input border border-primary text-primary text-sm p-1 focus:outline-none"
                  >
                    {damageDice.map((die) => (
                      <option key={die} value={die} className="bg-black text-primary">
                        d{die}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-sm text-primary">
                    <input
                      type="checkbox"
                      checked={primaryWeapon.hasDamageBonus}
                      onChange={(e) => onUpdatePrimaryWeapon('hasDamageBonus', e.target.checked)}
                      className="accent-red-600"
                    />
                    Somar
                  </label>
                  <input
                    type="number"
                    value={primaryWeapon.damageBonus}
                    onChange={(e) => onUpdatePrimaryWeapon('damageBonus', parseInt(e.target.value) || 0)}
                    disabled={!primaryWeapon.hasDamageBonus}
                    className="w-14 h-8 bg-input border border-primary text-primary text-center focus:outline-none focus:ring-1 focus:ring-primary text-sm p-0.5 disabled:opacity-50"
                  />
                </div>
                <input
                  type="text"
                  value={primaryWeapon.traits}
                  onChange={(e) => onUpdatePrimaryWeapon('traits', e.target.value)}
                  className="w-full bg-transparent border-b border-primary text-primary text-sm focus:outline-none focus:ring-0 py-0.5"
                  placeholder="Traits & Range"
                />
                <textarea
                  value={primaryWeapon.feature}
                  onChange={(e) => onUpdatePrimaryWeapon('feature', e.target.value)}
                  onInput={(e) => autoResizeTextarea(e.currentTarget)}
                  className="w-full bg-transparent border border-primary text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary py-1 px-1 resize-none overflow-hidden"
                  placeholder="Feature"
                  rows={1}
                />
                <button
                  onClick={() => handleRollAndClose(onRollPrimaryDamage)}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase border border-red-500 transition-all text-xs"
                >
                  <Dice6 className="inline mr-1" size={14} />
                  Rolar Dano
                </button>
              </div>

              {/* Secondary Weapon */}
              <div className="border border-primary bg-black p-2.5 space-y-1.5">
                <div className="font-display text-sm text-primary uppercase">Secundária</div>
                <input
                  type="text"
                  value={secondaryWeapon.name}
                  onChange={(e) => onUpdateSecondaryWeapon('name', e.target.value)}
                  className="w-full bg-transparent border-b border-primary text-primary text-sm focus:outline-none focus:ring-0 uppercase py-0.5"
                  placeholder="Nome"
                />
                <div className="flex gap-1 items-center">
                  <label className="font-display text-sm text-primary uppercase flex-shrink-0">Prof:</label>
                  <input
                    type="number"
                    value={secondaryWeapon.proficiency}
                    onChange={(e) => onUpdateSecondaryWeapon('proficiency', parseInt(e.target.value) || 0)}
                    style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
                    className="w-12 h-8 bg-input border border-primary text-primary text-center focus:outline-none focus:ring-1 focus:ring-primary text-sm p-0.5"
                    min="0"
                  />
                </div>
                <div className="flex gap-1 items-center">
                  <label className="font-display text-sm text-primary uppercase flex-shrink-0">Dado:</label>
                  <select
                    value={secondaryWeapon.damageDie}
                    onChange={(e) => onUpdateSecondaryWeapon('damageDie', parseInt(e.target.value))}
                    className="flex-1 bg-input border border-primary text-primary text-sm p-1 focus:outline-none"
                  >
                    {damageDice.map((die) => (
                      <option key={die} value={die} className="bg-black text-primary">
                        d{die}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-sm text-primary">
                    <input
                      type="checkbox"
                      checked={secondaryWeapon.hasDamageBonus}
                      onChange={(e) => onUpdateSecondaryWeapon('hasDamageBonus', e.target.checked)}
                      className="accent-red-600"
                    />
                    Somar
                  </label>
                  <input
                    type="number"
                    value={secondaryWeapon.damageBonus}
                    onChange={(e) => onUpdateSecondaryWeapon('damageBonus', parseInt(e.target.value) || 0)}
                    disabled={!secondaryWeapon.hasDamageBonus}
                    className="w-14 h-8 bg-input border border-primary text-primary text-center focus:outline-none focus:ring-1 focus:ring-primary text-sm p-0.5 disabled:opacity-50"
                  />
                </div>
                <input
                  type="text"
                  value={secondaryWeapon.traits}
                  onChange={(e) => onUpdateSecondaryWeapon('traits', e.target.value)}
                  className="w-full bg-transparent border-b border-primary text-primary text-sm focus:outline-none focus:ring-0 py-0.5"
                  placeholder="Traits & Range"
                />
                <textarea
                  value={secondaryWeapon.feature}
                  onChange={(e) => onUpdateSecondaryWeapon('feature', e.target.value)}
                  onInput={(e) => autoResizeTextarea(e.currentTarget)}
                  className="w-full bg-transparent border border-primary text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary py-1 px-1 resize-none overflow-hidden"
                  placeholder="Feature"
                  rows={1}
                />
                <button
                  onClick={() => handleRollAndClose(onRollSecondaryDamage)}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase border border-red-500 transition-all text-xs"
                >
                  <Dice6 className="inline mr-1" size={14} />
                  Rolar Dano
                </button>
              </div>
            </div>

            {/* Inventory Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base text-primary uppercase">Inventário</h3>
                <button
                  onClick={onAddItem}
                  className="btn-occult text-xs px-1.5 py-0.5 flex items-center gap-0.5 flex-shrink-0"
                >
                  <Plus size={10} />
                  ADD
                </button>
              </div>

              <div className="space-y-2">
                {inventory.map((item) => (
                  <div key={item.id} className="border border-primary bg-black p-1.5 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => onUpdateItem(item.id, 'name', e.target.value)}
                        className="flex-1 min-w-0 bg-transparent border-b border-primary text-primary font-display text-sm focus:outline-none focus:ring-0 uppercase py-0.5"
                        placeholder="Item"
                      />
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="text-primary hover:text-secondary transition-colors p-0 flex-shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <textarea
                      value={item.description}
                      onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      className="w-full bg-transparent border border-primary text-muted-foreground text-xs p-1 focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-hidden"
                      placeholder="Descrição"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      )}
      </div>
    </>
  );
}
