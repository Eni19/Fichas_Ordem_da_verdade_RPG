import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus, Trash2 } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  description: string;
  damage: string;
  hasCounter: boolean;
  counter: number;
}

interface SkillsListProps {
  skills: Skill[];
  onUpdateSkill: (id: string, field: keyof Skill, value: string | number | boolean) => void;
  onDeleteSkill: (id: string) => void;
  onReorderSkills: (draggedId: string, targetId: string) => void;
}

export default function SkillsList({ skills, onUpdateSkill, onDeleteSkill, onReorderSkills }: SkillsListProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [draggedSkillId, setDraggedSkillId] = useState<string | null>(null);

  const scrollCards = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const amount = direction === 'left' ? -340 : 340;
    carouselRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="flex-1 border-2 border-primary bg-black p-3 min-h-0 flex flex-col gap-3">
      {skills.length > 0 && (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => scrollCards('left')}
            className="w-8 h-8 border border-primary text-primary hover:bg-primary hover:text-black transition-colors flex items-center justify-center"
            aria-label="Mover carrossel para a esquerda"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scrollCards('right')}
            className="w-8 h-8 border border-primary text-primary hover:bg-primary hover:text-black transition-colors flex items-center justify-center"
            aria-label="Mover carrossel para a direita"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      <div ref={carouselRef} className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
        <div className="flex gap-4 pr-6 min-w-max items-stretch">
        {skills.length === 0 ? (
          <div className="flex items-center justify-center text-muted-foreground text-center py-10 w-full min-w-[20rem]">
            <p className="font-mono text-sm">Nenhuma habilidade adicionada ainda.</p>
          </div>
        ) : (
          skills.map((skill) => (
            <div
              key={skill.id}
              draggable
              onDragStart={(e) => {
                setDraggedSkillId(skill.id);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', skill.id);
              }}
              onDragEnd={() => setDraggedSkillId(null)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData('text/plain') || draggedSkillId;
                if (!draggedId) return;
                onReorderSkills(draggedId, skill.id);
                setDraggedSkillId(null);
              }}
              className={`border-2 p-5 bg-black space-y-3 flex-shrink-0 w-[20rem] min-h-[19rem] cursor-grab active:cursor-grabbing transition-colors ${
                draggedSkillId === skill.id ? 'border-secondary opacity-80' : 'border-primary'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => onUpdateSkill(skill.id, 'name', e.target.value)}
                  className="flex-1 min-w-0 bg-transparent border-b border-primary text-primary font-display text-base focus:outline-none focus:ring-0 uppercase"
                  placeholder="Nome da Habilidade"
                />
                <button
                  onClick={() => onDeleteSkill(skill.id)}
                  className="text-primary hover:text-secondary transition-colors p-0 flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <textarea
                value={skill.description}
                onChange={(e) => {
                  onUpdateSkill(skill.id, 'description', e.target.value);
                  // Auto-expand textarea
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onInput={(e) => {
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 120) + 'px';
                }}
                className="w-full bg-transparent border border-primary text-muted-foreground text-xs p-1 focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-hidden"
                placeholder="Descrição do efeito"
                rows={3}
                style={{ minHeight: '84px' }}
              />

              <div className="flex items-center gap-2">
                <label className="font-display text-xs text-primary uppercase">Dano:</label>
                <input
                  type="text"
                  value={skill.damage}
                  onChange={(e) => onUpdateSkill(skill.id, 'damage', e.target.value)}
                  style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
                  className="w-24 bg-input border border-primary text-primary text-center focus:outline-none focus:ring-1 focus:ring-primary text-sm p-1"
                  placeholder="1d6"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="font-display text-xs text-primary uppercase flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={skill.hasCounter}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      onUpdateSkill(skill.id, 'hasCounter', enabled);
                      if (!enabled) {
                        onUpdateSkill(skill.id, 'counter', 0);
                      }
                    }}
                    className="accent-red-500"
                  />
                  Contador
                </label>

                {skill.hasCounter && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateSkill(skill.id, 'counter', Math.max(0, skill.counter - 1))}
                      className="w-7 h-7 border border-primary text-primary hover:bg-primary hover:text-black transition-colors flex items-center justify-center"
                      aria-label="Diminuir contador"
                    >
                      <Minus size={12} />
                    </button>
                    <span
                      style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
                      className="text-primary text-sm min-w-8 text-center"
                    >
                      {skill.counter}
                    </span>
                    <button
                      onClick={() => onUpdateSkill(skill.id, 'counter', skill.counter + 1)}
                      className="w-7 h-7 border border-primary text-primary hover:bg-primary hover:text-black transition-colors flex items-center justify-center"
                      aria-label="Incrementar contador"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                )}
              </div>

              {skill.hasCounter && (
                <input
                  type="number"
                  value={skill.counter}
                  onChange={(e) => onUpdateSkill(skill.id, 'counter', parseInt(e.target.value) || 0)}
                  style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
                  className="w-16 bg-input border border-primary text-primary text-center focus:outline-none focus:ring-1 focus:ring-primary text-xs p-1"
                  min="0"
                />
              )}
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
}
