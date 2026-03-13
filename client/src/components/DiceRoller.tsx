import { useEffect, useState } from 'react';

interface DiceResult {
  formula: string;
  total: number;
  rolls: number[];
  timestamp: string;
}

interface SkillRollRequest {
  id: number;
  periciaName: string;
  attributeLabel: string;
  trainingLabel: string;
  attributeDie: number;
  trainingDie: number;
}

interface DiceRollerProps {
  rollRequest: SkillRollRequest | null;
}

export default function DiceRoller({ rollRequest }: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<DiceResult[]>([]);
  const [advantageEnabled, setAdvantageEnabled] = useState(false);
  const [disadvantageEnabled, setDisadvantageEnabled] = useState(false);
  const [displayRolls, setDisplayRolls] = useState<number[]>([]);

  useEffect(() => {
    if (!rollRequest || isRolling) return;

    const diceSides = [rollRequest.attributeDie, rollRequest.trainingDie];
    if (advantageEnabled) diceSides.push(6);
    if (disadvantageEnabled) diceSides.push(6);

    setIsRolling(true);

    const animationDuration = 650;
    const startTime = Date.now();

    const animateRoll = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed < animationDuration) {
        setDisplayRolls(diceSides.map((sides) => Math.floor(Math.random() * sides) + 1));
        requestAnimationFrame(animateRoll);
        return;
      }

      const baseAttributeRoll = Math.floor(Math.random() * rollRequest.attributeDie) + 1;
      const baseTrainingRoll = Math.floor(Math.random() * rollRequest.trainingDie) + 1;
      const finalRolls = [baseAttributeRoll, baseTrainingRoll];
      let total = baseAttributeRoll + baseTrainingRoll;

      if (advantageEnabled) {
        const advantageRoll = Math.floor(Math.random() * 6) + 1;
        finalRolls.push(advantageRoll);
        total += advantageRoll;
      }

      if (disadvantageEnabled) {
        const disadvantageRoll = Math.floor(Math.random() * 6) + 1;
        finalRolls.push(-disadvantageRoll);
        total -= disadvantageRoll;
      }

      setDisplayRolls(finalRolls);

      const formulaParts = [`1d${rollRequest.attributeDie}`, `1d${rollRequest.trainingDie}`];
      if (advantageEnabled) formulaParts.push('1d6');
      if (disadvantageEnabled) formulaParts.push('-1d6');
      const formula = formulaParts.join(' + ').replace('+ -', '- ');

      const result: DiceResult = {
        formula,
        total,
        rolls: finalRolls,
        timestamp: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      setHistory((prev) => [result, ...prev.slice(0, 4)]);
      setIsRolling(false);
    };

    animateRoll();
  }, [rollRequest, advantageEnabled, disadvantageEnabled, isRolling]);

  return (
    <div className="space-y-4">
      <div className="border-2 border-red-500 p-4 bg-black">
        <h3 className="text-xs font-bold text-red-500 uppercase mb-3">Display de Testes</h3>

        <div className="text-xs text-red-300 border border-red-500 p-2 bg-black/80 mb-3 min-h-14">
          {rollRequest ? (
            <>
              <div className="font-bold text-red-400 uppercase">{rollRequest.periciaName}</div>
              <div>{rollRequest.trainingLabel} com {rollRequest.attributeLabel}</div>
              <div className="text-red-400">1d{rollRequest.attributeDie} + 1d{rollRequest.trainingDie}</div>
            </>
          ) : (
            <div>Use o botao Rolar em uma pericia para iniciar.</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className={`h-14 border-2 border-red-500 bg-black flex items-center justify-center text-xl font-bold ${isRolling ? 'animate-pulse text-red-300' : 'text-red-500'}`}>
            {displayRolls[0] ?? '-'}
          </div>
          <div className={`h-14 border-2 border-red-500 bg-black flex items-center justify-center text-xl font-bold ${isRolling ? 'animate-pulse text-red-300' : 'text-red-500'}`}>
            {displayRolls[1] ?? '-'}
          </div>
        </div>

        {(advantageEnabled || disadvantageEnabled) && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="h-10 border border-primary text-primary flex items-center justify-center text-sm font-bold">
              {advantageEnabled ? `+${displayRolls[2] ?? '-'}` : '-'}
            </div>
            <div className="h-10 border border-red-500 text-red-400 flex items-center justify-center text-sm font-bold">
              {disadvantageEnabled ? `-${displayRolls[advantageEnabled ? 3 : 2] ?? '-'}` : '-'}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              setAdvantageEnabled((prev) => !prev);
            }}
            className={`flex-1 px-2 py-1 text-xs font-bold uppercase border-2 transition-all ${
              advantageEnabled
                ? 'bg-primary border-primary text-black'
                : 'border-primary text-primary hover:bg-primary hover:text-black'
            }`}
          >
            Vantagem
          </button>

          <button
            onClick={() => {
              setDisadvantageEnabled((prev) => !prev);
            }}
            className={`flex-1 px-2 py-1 text-xs font-bold uppercase border-2 transition-all ${
              disadvantageEnabled
                ? 'bg-red-600 border-red-500 text-white'
                : 'border-red-500 text-red-500 hover:bg-red-500 hover:text-black'
            }`}
          >
            Desvantagem
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="border-2 border-red-500 p-4 bg-black">
          <h3 className="text-xs font-bold text-red-500 uppercase mb-3">Histórico</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.map((roll, idx) => (
              <div key={idx} className="p-3 border-2 border-red-500 bg-black text-xs font-mono transition-all">
                <div className="flex justify-between items-start mb-1">
                  <div className="font-bold text-red-500">{roll.formula}</div>
                  <div className="text-red-400">{roll.timestamp}</div>
                </div>
                <div className="text-red-300 mb-1">Total: {roll.total}</div>
                <div className="text-red-400 text-xs">
                  Dados: {roll.rolls.map((r) => (r < 0 ? `(${r})` : r)).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
