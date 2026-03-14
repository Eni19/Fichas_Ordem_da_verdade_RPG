import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

type TrainingLevel = 'treinado' | 'veterano' | 'expert';
type AttributeKey = 'agilidade' | 'força' | 'finesse' | 'instinto' | 'presença' | 'conhecimento';

interface Pericia {
  id: string;
  name: string;
  training: TrainingLevel;
}

interface PericiasProps {
  pericias: Pericia[];
  onAddPericia: () => void;
  onUpdatePericia: (id: string, field: keyof Pericia, value: string) => void;
  onDeletePericia: (id: string) => void;
  onRollPericia: (id: string, attribute: AttributeKey) => void;
}

const ATTRIBUTE_OPTIONS: Array<{ value: AttributeKey; label: string }> = [
  { value: 'agilidade', label: 'Agilidade' },
  { value: 'força', label: 'Forca' },
  { value: 'finesse', label: 'Finesse' },
  { value: 'instinto', label: 'Instinto' },
  { value: 'presença', label: 'Presenca' },
  { value: 'conhecimento', label: 'Conhecimento' },
];

const TRAINING_OPTIONS: Array<{ value: TrainingLevel; label: string }> = [
  { value: 'treinado', label: 'Treinado (1d6)' },
  { value: 'veterano', label: 'Veterano (1d8)' },
  { value: 'expert', label: 'Expert (1d10)' },
];

export default function Pericias({
  pericias,
  onAddPericia,
  onUpdatePericia,
  onDeletePericia,
  onRollPericia,
}: PericiasProps) {
  const [pendingRoll, setPendingRoll] = useState<{ periciaId: string; attribute: AttributeKey } | null>(null);

  return (
    <div className="card-occult flex flex-col gap-2 h-full min-h-0">
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="font-display text-base text-primary uppercase">Pericias</h3>
        <button
          onClick={onAddPericia}
          className="btn-occult text-sm px-2 py-1 flex items-center gap-1 flex-shrink-0"
        >
          <Plus size={12} />
          ADD
        </button>
      </div>

      <ScrollArea className="flex-1 border border-primary bg-black p-2 min-h-0">
        <div className="space-y-2 pr-3">
          {pericias.length === 0 ? (
            <div className="flex items-center justify-center text-muted-foreground text-center py-4">
              <p className="font-mono text-xs">Adicione pericias para rolar testes.</p>
            </div>
          ) : (
            pericias.map((pericia) => {
              const isRollMenuActive = pendingRoll?.periciaId === pericia.id;

              return (
              <div
                key={pericia.id}
                className={`group border border-primary p-2 space-y-2 flex-shrink-0 transition-colors duration-200 ${
                  isRollMenuActive ? 'bg-primary' : 'bg-black hover:bg-primary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pericia.name}
                    onChange={(e) => onUpdatePericia(pericia.id, 'name', e.target.value)}
                    className={`flex-1 min-w-0 bg-transparent border font-display text-sm focus:outline-none focus:ring-0 uppercase px-2 py-1 h-8 transition-colors duration-200 ${
                      isRollMenuActive
                        ? 'border-black text-black placeholder:text-black'
                        : 'border-primary text-primary group-hover:border-black group-hover:text-black group-hover:placeholder:text-black'
                    }`}
                    placeholder="Nome"
                  />

                  <select
                    value={pericia.training}
                    onChange={(e) => onUpdatePericia(pericia.id, 'training', e.target.value)}
                    className={`w-36 border text-sm p-1 focus:outline-none h-8 transition-colors duration-200 ${
                      isRollMenuActive
                        ? 'bg-primary border-black text-black'
                        : 'bg-input border-primary text-primary group-hover:bg-primary group-hover:border-black group-hover:text-black'
                    }`}
                  >
                    {TRAINING_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-black text-primary">
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() =>
                      setPendingRoll((prev) =>
                        prev?.periciaId === pericia.id
                          ? null
                          : { periciaId: pericia.id, attribute: 'agilidade' }
                      )
                    }
                    className={`w-20 h-8 font-bold uppercase text-sm border-2 transition-all hover:bg-black hover:text-primary ${
                      isRollMenuActive
                        ? 'bg-black text-primary border-black'
                        : 'bg-primary text-black border-primary group-hover:bg-black group-hover:text-primary group-hover:border-black'
                    }`}
                  >
                    Rolar
                  </button>

                  <button
                    onClick={() => onDeletePericia(pericia.id)}
                    className={`transition-colors p-0 flex-shrink-0 h-8 w-8 border flex items-center justify-center ${
                      isRollMenuActive
                        ? 'text-black border-black hover:text-secondary'
                        : 'text-primary border-primary hover:text-secondary group-hover:text-black group-hover:border-black'
                    }`}
                    aria-label="Remover pericia"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {pendingRoll?.periciaId === pericia.id && (
                  <div className="border border-primary/60 bg-black/70 p-2 space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {ATTRIBUTE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            onRollPericia(pericia.id, option.value);
                            setPendingRoll(null);
                          }}
                          className="h-8 px-2 bg-black text-primary border border-primary text-sm uppercase font-bold hover:bg-primary hover:text-black transition-all"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
