import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RitualSymbol } from '@/data/symbols';

type RitualType = 'dano' | 'aflicao' | 'utilidade';

interface RitualVersion {
  name: string;
  circle: string;
  cost: string;
  duration: string;
  resistance: number;
  type: RitualType;
  description: string;
  retained: boolean;
}

interface Ritual {
  id: string;
  versions: RitualVersion[];
  activeVersion: number;
}

interface RitualComponent {
  id: string;
  name: string;
  description: string;
}

interface RitualConjureState {
  ritualId: string;
  symbolChoices: RitualSymbol[];
  selectedSymbol: RitualSymbol | null;
  step: number;
  chosenComponentId?: string | null;
}


interface RitualsPanelProps {
  isOpen: boolean;
  showToggle: boolean;
  onToggle: () => void;
  rituals: Ritual[];
  components: RitualComponent[];
  onAddRitual: (ritual: Ritual) => void;
  onUpdateRitual: (id: string, ritual: Ritual) => void;
  ritualConjureState: RitualConjureState | null;
  onChooseRitualSymbol: (symbol: RitualSymbol) => void;
  onSetRitualVersion: (id: string, activeVersion: number) => void;
  onContinueRitual: (ritualId: string) => void;
  onContinueWithoutComponents: (ritualId: string) => void;
  onCancelConjure?: () => void;
  onResolveRitual: (ritualId: string) => void;
  onRemoveRitual: (id: string) => void;
  onConjureRitual: (ritual: Ritual) => void;
}

const RITUAL_TYPES: Array<{ value: RitualType; label: string }> = [
  { value: 'dano', label: 'Dano' },
  { value: 'aflicao', label: 'Aflição' },
  { value: 'utilidade', label: 'Utilidade' },
];

export default function RitualsPanel({
  isOpen,
  showToggle,
  onToggle,
  rituals,
  components,
  onAddRitual,
  onUpdateRitual,
  ritualConjureState,
  onChooseRitualSymbol,
  onSetRitualVersion,
  onContinueRitual,
  onContinueWithoutComponents,
  onCancelConjure,
  onResolveRitual,
  onRemoveRitual,
  onConjureRitual,
}: RitualsPanelProps) {
  const [showRitualForm, setShowRitualForm] = useState(false);
  const [newRitual, setNewRitual] = useState<Omit<RitualVersion, 'id'>>({
    name: '',
    circle: '',
    cost: '',
    duration: '',
    resistance: 0,
    type: 'utilidade',
    description: '',
    retained: false,
  });

  const getActiveVersion = (ritual: Ritual) => ritual.versions[ritual.activeVersion] ?? ritual.versions[0];

  const updateActiveVersion = (ritual: Ritual, updates: Partial<RitualVersion>): Ritual => {
    const activeVersion = Math.max(0, Math.min(ritual.activeVersion, ritual.versions.length - 1));

    return {
      ...ritual,
      versions: ritual.versions.map((version, index) =>
        index === activeVersion ? { ...version, ...updates } : version
      ),
    };
  };

  const autoResizeTextarea = (target: HTMLTextAreaElement) => {
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  const [revealed, setRevealed] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    // When a new conjure modal opens with no selected symbol, reveal cards one by one
    if (!ritualConjureState || ritualConjureState.selectedSymbol) {
      setRevealed([false, false, false]);
      return;
    }

    setRevealed([false, false, false]);
    const timeouts: number[] = [];
    ritualConjureState.symbolChoices.forEach((_, idx) => {
      const delay = idx * 450 + 600; // stagger reveal
      const t = window.setTimeout(() => {
        setRevealed((prev) => {
          const copy = [...prev];
          copy[idx] = true;
          return copy;
        });
      }, delay);
      timeouts.push(t);
    });

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [ritualConjureState]);

  const addRitual = () => {
    if (!newRitual.name.trim()) return;

    onAddRitual({
      id: Date.now().toString(),
      versions: [
        {
          ...newRitual,
          resistance: Number(newRitual.resistance) || 0,
        },
      ],
      activeVersion: 0,
    });

    setNewRitual({
      name: '',
      circle: '',
      cost: '',
      duration: '',
      resistance: 0,
      type: 'utilidade',
      description: '',
      retained: false,
    });
    setShowRitualForm(false);
  };

  const goToPreviousVersion = (ritual: Ritual) => {
    if (ritual.activeVersion > 0) {
      onSetRitualVersion(ritual.id, ritual.activeVersion - 1);
    }
  };

  const goToNextVersion = (ritual: Ritual) => {
    if (ritual.activeVersion < ritual.versions.length - 1) {
      onSetRitualVersion(ritual.id, ritual.activeVersion + 1);
      return;
    }

    if (ritual.versions.length < 3) {
      const currentVersion = getActiveVersion(ritual);
      const nextVersions = [...ritual.versions, { ...currentVersion }];

      onUpdateRitual(ritual.id, {
        ...ritual,
        versions: nextVersions,
        activeVersion: nextVersions.length - 1,
      });
    }
  };

  const activeConjureRitual = ritualConjureState?.ritualId ?? null;

  const isSelectedSymbolReady = Boolean(ritualConjureState?.selectedSymbol);
  const conjureStep = ritualConjureState?.step ?? 0;

  return (
    <div className="fixed right-0 top-0 h-screen z-30">
      {showToggle && (
        <button
          onClick={onToggle}
          className={`group fixed top-40 z-40 h-12 w-12 hover:w-40 overflow-hidden bg-black border-2 border-cyan-500 hover:bg-cyan-500 hover:bg-opacity-10 flex items-center justify-start text-cyan-300 transition-all duration-300 ${
            isOpen ? 'right-[22rem]' : 'right-0'
          }`}
        >
          <span className="flex h-full w-12 flex-shrink-0 items-center justify-center">
            <ChevronLeft size={20} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </span>
          <span className="pr-4 text-sm font-display uppercase tracking-wide whitespace-nowrap opacity-0 -translate-x-2 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            Rituais
          </span>
        </button>
      )}

      <div
        className={`h-full bg-black transition-all duration-300 ${
          isOpen ? 'w-[22rem] border-l-2 border-cyan-500' : 'w-0 border-l-0'
        }`}
      >
        {isOpen && (
          <ScrollArea className="h-full" style={{ paddingTop: '3rem' }}>
            <div className="p-4 space-y-6">
              {ritualConjureState && ritualConjureState.selectedSymbol && (
                <div className="border border-cyan-500 bg-cyan-950/20 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-cyan-400 uppercase font-bold">Símbolo escolhido</div>
                    <div className="space-x-2">
                      <button
                        onClick={() => onCancelConjure && onCancelConjure()}
                        className="text-[10px] px-2 py-1 border border-cyan-500 text-cyan-300 hover:bg-cyan-500/10"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>

                  <div className="text-sm text-cyan-200 font-bold uppercase">
                    {ritualConjureState.selectedSymbol.simbolo}
                  </div>
                  <div className="text-xs text-cyan-100/80 leading-relaxed">
                    {ritualConjureState.selectedSymbol.efeito}
                  </div>
                  <div className="text-[10px] text-cyan-400 uppercase font-bold">
                    {ritualConjureState.selectedSymbol.tag}
                  </div>

                  {conjureStep === 1 && (
                    <button
                      onClick={() => onContinueRitual(ritualConjureState.ritualId)}
                      className="w-full py-2 bg-cyan-500 text-black font-bold uppercase border border-cyan-400 hover:bg-cyan-400 transition-colors text-xs"
                    >
                      Continuar Ritual
                    </button>
                  )}

                  {conjureStep === 2 && (
                    <div className="space-y-2">
                      <div className="text-[10px] text-cyan-400 uppercase font-bold">Etapa 2 de 3</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          disabled
                          className="h-9 bg-black border border-cyan-500 text-cyan-300 text-xs font-bold uppercase"
                        >
                          Escolher componente
                        </button>
                        <button
                          onClick={() => onContinueWithoutComponents(ritualConjureState.ritualId)}
                          className="h-9 bg-cyan-500 text-black font-bold uppercase border border-cyan-400 hover:bg-cyan-400 transition-colors text-xs"
                        >
                          Continuar sem componentes
                        </button>
                      </div>
                    </div>
                  )}

                  {conjureStep === 3 && (
                    <div>
                      <div className="text-[10px] text-cyan-400 uppercase font-bold">Etapa final</div>
                      <button
                        onClick={() => onResolveRitual(ritualConjureState!.ritualId)}
                        className="w-full py-2 bg-cyan-500 text-black font-bold uppercase border border-cyan-400 hover:bg-cyan-400 transition-colors text-xs"
                      >
                        Resolver Ritual
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3 border-b-2 border-cyan-500 pb-2">
                  <h3 className="font-display text-lg text-cyan-300 uppercase">Rituais</h3>
                  <button
                    onClick={() => setShowRitualForm((prev) => !prev)}
                    className="bg-cyan-500 text-black font-bold px-2 py-1 hover:bg-cyan-400 transition-colors flex items-center gap-1 text-xs uppercase"
                  >
                    <Plus size={14} />
                    Adicionar
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  {rituals.map((ritual) => {
                    const version = getActiveVersion(ritual);

                    return (
                      <div key={ritual.id} className="bg-black border-2 border-cyan-500 p-2 space-y-2">
                        <div>
                          <label className="text-[10px] text-cyan-400 uppercase font-bold block mb-0.5">Nome</label>
                          <div className="flex items-start gap-2">
                            <div className="flex items-center gap-1 shrink-0 pt-0.5">
                              <button
                                onClick={() => goToPreviousVersion(ritual)}
                                disabled={ritual.activeVersion === 0}
                                className="h-6 w-6 border border-cyan-500 text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-500 hover:text-black transition-colors flex items-center justify-center"
                                aria-label="Versão anterior"
                              >
                                <ChevronLeft size={12} />
                              </button>
                              <span className="text-[10px] text-cyan-300 uppercase font-bold min-w-12 text-center">
                                {ritual.activeVersion + 1}/3
                              </span>
                              <button
                                onClick={() => goToNextVersion(ritual)}
                                disabled={ritual.activeVersion === 2 && ritual.versions.length >= 3}
                                className="h-6 w-6 border border-cyan-500 text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-500 hover:text-black transition-colors flex items-center justify-center"
                                aria-label="Versão seguinte"
                              >
                                <ChevronRight size={12} />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={version.name}
                              onChange={(e) =>
                                onUpdateRitual(
                                  ritual.id,
                                  updateActiveVersion(ritual, { name: e.target.value })
                                )
                              }
                              className="bg-black text-cyan-200 text-sm font-bold border-b border-cyan-500 outline-none flex-1 uppercase"
                              placeholder="Nome do Ritual"
                            />
                            <button
                              onClick={() => onRemoveRitual(ritual.id)}
                              className="text-cyan-400 hover:text-cyan-200"
                              aria-label="Remover ritual"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-cyan-400 uppercase font-bold block mb-0.5">Círculo</label>
                            <input
                              type="text"
                              value={version.circle}
                              onChange={(e) =>
                                onUpdateRitual(
                                  ritual.id,
                                  updateActiveVersion(ritual, { circle: e.target.value })
                                )
                              }
                              className="w-full bg-black text-cyan-200 text-xs border border-cyan-500 p-1.5 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-cyan-400 uppercase font-bold block mb-0.5">Custo</label>
                            <input
                              type="text"
                              value={version.cost}
                              onChange={(e) =>
                                onUpdateRitual(
                                  ritual.id,
                                  updateActiveVersion(ritual, { cost: e.target.value })
                                )
                              }
                              className="w-full bg-black text-cyan-200 text-xs border border-cyan-500 p-1.5 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-cyan-400 uppercase font-bold block mb-0.5">Duração</label>
                            <input
                              type="text"
                              value={version.duration}
                              onChange={(e) =>
                                onUpdateRitual(
                                  ritual.id,
                                  updateActiveVersion(ritual, { duration: e.target.value })
                                )
                              }
                              className="w-full bg-black text-cyan-200 text-xs border border-cyan-500 p-1.5 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-cyan-400 uppercase font-bold block mb-0.5">Resistência</label>
                            <input
                              type="number"
                              value={version.resistance}
                              onChange={(e) =>
                                onUpdateRitual(
                                  ritual.id,
                                  updateActiveVersion(ritual, {
                                    resistance: parseInt(e.target.value) || 0,
                                  })
                                )
                              }
                              className="w-full bg-black text-cyan-200 text-xs border border-cyan-500 p-1.5 outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-cyan-400 uppercase font-bold block mb-0.5">Tipo</label>
                          <div className="grid grid-cols-3 gap-1">
                            {RITUAL_TYPES.map((option) => (
                              <button
                                key={option.value}
                                onClick={() =>
                                  onUpdateRitual(ritual.id, updateActiveVersion(ritual, { type: option.value }))
                                }
                                className={`h-8 text-xs font-bold uppercase border transition-colors ${
                                  version.type === option.value
                                    ? 'bg-cyan-500 text-black border-cyan-500'
                                    : 'bg-black text-cyan-300 border-cyan-500 hover:bg-cyan-500/20'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-cyan-400 uppercase font-bold block mb-0.5">Efeito</label>
                          <textarea
                            value={version.description}
                            onChange={(e) =>
                              onUpdateRitual(
                                ritual.id,
                                updateActiveVersion(ritual, { description: e.target.value })
                              )
                            }
                            onInput={(e) => autoResizeTextarea(e.currentTarget)}
                            className="w-full bg-black text-cyan-200 text-xs border border-cyan-500 p-2 outline-none resize-none overflow-hidden"
                            rows={2}
                          />
                        </div>

                        <div>
                          <button
                            onClick={() =>
                              onUpdateRitual(
                                ritual.id,
                                updateActiveVersion(ritual, { retained: !version.retained })
                              )
                            }
                            className={`h-8 w-full border-2 font-bold uppercase text-xs transition-colors ${
                              version.retained
                                ? 'bg-cyan-500 text-black border-cyan-500'
                                : 'bg-black text-cyan-200 border-cyan-500'
                            }`}
                          >
                            Retido {version.retained ? '✓' : ''}
                          </button>
                        </div>

                        <button
                          onClick={() =>
                            isSelectedSymbolReady && activeConjureRitual === ritual.id
                              ? onContinueRitual(ritual.id)
                              : onConjureRitual(ritual)
                          }
                          className="w-full py-2 bg-cyan-500 text-black font-bold uppercase border border-cyan-400 hover:bg-cyan-400 transition-colors text-xs"
                        >
                          {isSelectedSymbolReady && activeConjureRitual === ritual.id ? 'Continuar Ritual' : 'Conjurar Ritual'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {ritualConjureState && !ritualConjureState.selectedSymbol && (
                  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl border-2 border-cyan-500 bg-black p-4 space-y-4 max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between border-b border-cyan-500 pb-2">
                        <div>
                          <h3 className="font-display text-lg text-cyan-300 uppercase">Escolha um símbolo</h3>
                          <p className="text-xs text-cyan-200/70">Selecione uma das três cartas para iniciar o ritual.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-[10px] text-cyan-400 uppercase font-bold">Etapa 1 de 3</div>
                          <button
                            onClick={() => onCancelConjure && onCancelConjure()}
                            className="text-[10px] px-2 py-1 border border-cyan-500 text-cyan-300 hover:bg-cyan-500/10"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>

                      <div className="relative">
                        {/* fog particles removed */}

                        <div className="grid gap-4 md:grid-cols-3">
                          {ritualConjureState.symbolChoices.map((symbol, idx) => (
                            <div
                              key={symbol.simbolo}
                              className={`border border-cyan-500 bg-cyan-950/10 p-4 space-y-3 card-draw ${revealed[idx] ? 'card-flip' : ''}`}
                              style={{ animationDelay: `${idx * 300}ms` }}
                            >
                              <div className="card-inner relative w-full min-h-[14rem] md:min-h-[16rem]">
                                <div className="card-back absolute inset-0 flex items-center justify-center text-cyan-300 text-sm font-bold uppercase">
                                  {/* Back of card - generic sigil */}
                                  <div className="w-12 h-12 rounded border border-cyan-400/30 flex items-center justify-center opacity-60">✦</div>
                                </div>

                                <div className="card-front absolute inset-0 p-1 text-cyan-200">
                                  <div className="text-sm font-bold uppercase text-cyan-200">{symbol.simbolo}</div>
                                  <div className="text-[10px] text-cyan-400 uppercase font-bold">{symbol.tag}</div>
                                  <p className="text-xs text-cyan-100/80 leading-relaxed">{symbol.efeito}</p>
                                </div>
                              </div>

                              <button
                                onClick={() => revealed[idx] && onChooseRitualSymbol(symbol)}
                                disabled={!revealed[idx]}
                                className={`w-full py-2 ${revealed[idx] ? 'bg-cyan-500 text-black' : 'bg-black text-cyan-400/40'} font-bold uppercase border border-cyan-400 hover:bg-cyan-400 transition-colors text-xs`}
                              >
                                {revealed[idx] ? 'Escolher' : 'Revelando...'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showRitualForm && (
                  <div className="space-y-2 border border-cyan-500 p-2 bg-cyan-950/10">
                    <div>
                      <label className="text-[10px] text-cyan-400 uppercase font-bold block mb-0.5">Nome</label>
                      <input
                        type="text"
                        value={newRitual.name}
                        onChange={(e) => setNewRitual((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-black text-cyan-200 text-sm border border-cyan-500 p-2 outline-none"
                        placeholder="Nome do Ritual"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-cyan-400 uppercase font-bold block mb-0.5">Círculo</label>
                        <input
                          type="text"
                          value={newRitual.circle}
                          onChange={(e) => setNewRitual((prev) => ({ ...prev, circle: e.target.value }))}
                          className="w-full bg-black text-cyan-200 text-xs border border-cyan-500 p-1.5 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-cyan-400 uppercase font-bold block mb-0.5">Custo</label>
                        <input
                          type="text"
                          value={newRitual.cost}
                          onChange={(e) => setNewRitual((prev) => ({ ...prev, cost: e.target.value }))}
                          className="w-full bg-black text-cyan-200 text-xs border border-cyan-500 p-1.5 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-cyan-400 uppercase font-bold block mb-0.5">Duração</label>
                        <input
                          type="text"
                          value={newRitual.duration}
                          onChange={(e) => setNewRitual((prev) => ({ ...prev, duration: e.target.value }))}
                          className="w-full bg-black text-cyan-200 text-xs border border-cyan-500 p-1.5 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-cyan-400 uppercase font-bold block mb-0.5">Resistência</label>
                        <input
                          type="number"
                          value={newRitual.resistance}
                          onChange={(e) =>
                            setNewRitual((prev) => ({
                              ...prev,
                              resistance: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full bg-black text-cyan-200 text-xs border border-cyan-500 p-1.5 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-cyan-400 uppercase font-bold block mb-0.5">Tipo</label>
                      <div className="grid grid-cols-3 gap-1">
                        {RITUAL_TYPES.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setNewRitual((prev) => ({ ...prev, type: option.value }))}
                            className={`h-8 text-xs font-bold uppercase border transition-colors ${
                              newRitual.type === option.value
                                ? 'bg-cyan-500 text-black border-cyan-500'
                                : 'bg-black text-cyan-300 border-cyan-500 hover:bg-cyan-500/20'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-cyan-400 uppercase font-bold block mb-0.5">Efeito</label>
                      <textarea
                        value={newRitual.description}
                        onChange={(e) =>
                          setNewRitual((prev) => ({ ...prev, description: e.target.value }))
                        }
                        onInput={(e) => autoResizeTextarea(e.currentTarget)}
                        className="w-full bg-black text-cyan-200 text-sm border border-cyan-500 p-2 outline-none resize-none overflow-hidden"
                        rows={2}
                      />
                    </div>

                    <div>
                      <button
                        onClick={() => setNewRitual((prev) => ({ ...prev, retained: !prev.retained }))}
                        className={`h-8 w-full border-2 font-bold uppercase text-xs transition-colors ${
                          newRitual.retained
                            ? 'bg-cyan-500 text-black border-cyan-500'
                            : 'bg-black text-cyan-200 border-cyan-500'
                        }`}
                      >
                        Retido {newRitual.retained ? '✓' : ''}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={addRitual}
                        className="flex-1 bg-cyan-500 text-black font-bold py-1 hover:bg-cyan-400 transition-colors flex items-center justify-center gap-1 text-xs uppercase"
                      >
                        <Plus size={14} />
                        Salvar
                      </button>
                      <button
                        onClick={() => setShowRitualForm(false)}
                        className="flex-1 border border-cyan-500 text-cyan-300 font-bold py-1 hover:bg-cyan-500 hover:text-black transition-colors text-xs uppercase"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="mb-3 border-b-2 border-cyan-500 pb-2">
                  <h3 className="font-display text-lg text-cyan-300 uppercase">Componentes</h3>
                </div>
                <div className="border border-cyan-500 p-3 text-xs text-cyan-200/80">
                  {components.length === 0 ? 'Area reservada para componentes.' : `${components.length} componente(s) cadastrado(s).`}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
