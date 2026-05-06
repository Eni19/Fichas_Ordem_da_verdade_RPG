import { useEffect, useRef, useState } from 'react';
import { Dice6 } from 'lucide-react';

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
  attributeValue: number;
  trainingDie: number;
  weaponName?: string;
  criticalThreshold?: number;
  criticalMultiplier?: number;
  damageDiceCount?: number;
  damageDiceSides?: number;
}

interface DamageRollRequest {
  id: number;
  weaponName: string;
  diceCount: number;
  diceType: number;
  modifier: number;
}

interface DiceRollerProps {
  rollRequest: SkillRollRequest | null;
  damageRollRequest: DamageRollRequest | null;
}

export default function DiceRoller({ rollRequest, damageRollRequest }: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<DiceResult[]>([]);
  const [displayRolls, setDisplayRolls] = useState<number[]>([]);
  const [displayMessage, setDisplayMessage] = useState<string | null>(null);
  const [displayFlash, setDisplayFlash] = useState<'critical' | 'fail' | null>(null);
  const [numDice, setNumDice] = useState(2);
  const [diceType, setDiceType] = useState(12);
  const lastProcessedRollIdRef = useRef<number | null>(null);
  const [displayMode, setDisplayMode] = useState<'skill' | 'custom'>('skill');
  const [customFormula, setCustomFormula] = useState('');
  const [displaySubtitle, setDisplaySubtitle] = useState<string | null>(null);
  const [displayModifier, setDisplayModifier] = useState(0);
  const [isReRolling, setIsReRolling] = useState<'attribute' | 'training' | null>(null);
  const [isCritical, setIsCritical] = useState(false);
  const [lastAttackWeapon, setLastAttackWeapon] = useState<SkillRollRequest | null>(null);

  const diceTypes = [4, 6, 8, 10, 12, 20];
  const maxDice = 10;
  const lastProcessedDamageRollIdRef = useRef<number | null>(null);

  const getAttributeRollConfig = (attributeValue: number) => {
    switch (attributeValue) {
      case 0:
        return { animationDie: 6, formula: '2d6 (<)' };
      case 1:
        return { animationDie: 6, formula: '1d6' };
      case 2:
        return { animationDie: 8, formula: '1d8' };
      case 3:
        return { animationDie: 10, formula: '1d10' };
      case 4:
        return { animationDie: 12, formula: '1d12' };
      case 5:
        return { animationDie: 12, formula: '2d12 (>)' };
      default:
        return { animationDie: 6, formula: '1d6' };
    }
  };

  const rollAttributeValue = (attributeValue: number) => {
    switch (attributeValue) {
      case 0: {
        const rollA = Math.floor(Math.random() * 6) + 1;
        const rollB = Math.floor(Math.random() * 6) + 1;
        return Math.min(rollA, rollB);
      }
      case 1:
        return Math.floor(Math.random() * 6) + 1;
      case 2:
        return Math.floor(Math.random() * 8) + 1;
      case 3:
        return Math.floor(Math.random() * 10) + 1;
      case 4:
        return Math.floor(Math.random() * 12) + 1;
      case 5: {
        const rollA = Math.floor(Math.random() * 12) + 1;
        const rollB = Math.floor(Math.random() * 12) + 1;
        return Math.max(rollA, rollB);
      }
      default:
        return Math.floor(Math.random() * 6) + 1;
    }
  };

  const triggerDisplayOutcome = (firstRoll: number, secondRoll: number) => {
    if (firstRoll === 1 && secondRoll === 1) {
      setDisplayMessage('Falha Critica!');
      setDisplayFlash('fail');
      setIsCritical(false);
    } else if (firstRoll === secondRoll && firstRoll >= 6) {
      setDisplayMessage('Critico!');
      setDisplayFlash('critical');
      setIsCritical(true);
    } else {
      setDisplayMessage(null);
      setDisplayFlash(null);
      setIsCritical(false);
    }
  };

  const rollWeaponDamage = () => {
    if (!lastAttackWeapon || isRolling) return;
    if (lastAttackWeapon.damageDiceCount === undefined || lastAttackWeapon.damageDiceSides === undefined) return;

    const diceCount = lastAttackWeapon.damageDiceCount;
    const diceType = lastAttackWeapon.damageDiceSides;
    let multiplier = 1;

    if (isCritical && lastAttackWeapon.criticalMultiplier) {
      multiplier = lastAttackWeapon.criticalMultiplier;
    }

    setDisplayMode('custom');
    setCustomFormula(`${diceCount}d${diceType}${multiplier > 1 ? ` x${multiplier}` : ''}`);
    setDisplaySubtitle(`${lastAttackWeapon.weaponName || 'Dano da arma'}${multiplier > 1 ? ' (Crítico)' : ''}`);
    setDisplayModifier(0);
    setDisplayMessage(null);
    setDisplayFlash(null);
    setIsRolling(true);
    setDisplayRolls(Array.from({ length: diceCount }, () => Math.floor(Math.random() * diceType) + 1));

    const animationDuration = 650;
    const startTime = Date.now();

    const animateRoll = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed < animationDuration) {
        setDisplayRolls(Array.from({ length: diceCount }, () => Math.floor(Math.random() * diceType) + 1));
        requestAnimationFrame(animateRoll);
        return;
      }

      const rolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * diceType) + 1);
      let total = rolls.reduce((sum, current) => sum + current, 0);
      total *= multiplier;

      const result: DiceResult = {
        formula: `${diceCount}d${diceType}${multiplier > 1 ? ` x${multiplier}` : ''}`,
        total,
        rolls,
        timestamp: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      setHistory((prev) => [result, ...prev.slice(0, 4)]);
      setDisplayRolls(rolls);
      setIsRolling(false);
    };

    animateRoll();
  };

  const reRollDice = (diceToReRoll: 'attribute' | 'training') => {
    if (!rollRequest || isRolling) return;

    setIsReRolling(diceToReRoll);

    const animationDuration = 400;
    const startTime = Date.now();

    const animateRoll = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed < animationDuration) {
        setDisplayRolls((prev) => {
          const newRolls = [...prev];
          const attributeConfig = getAttributeRollConfig(rollRequest.attributeValue);

          if (diceToReRoll === 'attribute') {
            newRolls[0] = Math.floor(Math.random() * attributeConfig.animationDie) + 1;
          } else {
            newRolls[1] = Math.floor(Math.random() * rollRequest.trainingDie) + 1;
          }
          return newRolls;
        });
        requestAnimationFrame(animateRoll);
        return;
      }

      // Final roll
      setDisplayRolls((prev) => {
        const newRolls = [...prev];
        
        if (diceToReRoll === 'attribute') {
          newRolls[0] = rollAttributeValue(rollRequest.attributeValue);
        } else {
          newRolls[1] = Math.floor(Math.random() * rollRequest.trainingDie) + 1;
        }

        // Recalculate outcome
        triggerDisplayOutcome(newRolls[0], newRolls[1]);

        // Update history with new result
        const attributeConfig = getAttributeRollConfig(rollRequest.attributeValue);
        let total = newRolls[0] + newRolls[1];
        const finalRolls = [...newRolls];

        const formulaParts = [attributeConfig.formula, `1d${rollRequest.trainingDie}`];
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

        return newRolls;
      });

      setIsReRolling(null);
    };

    animateRoll();
  };

  const rollCustomDice = () => {
    if (isRolling) return;

    setDisplayMode('custom');
    setCustomFormula(`${numDice}d${diceType}`);
    setDisplaySubtitle(null);
    setDisplayModifier(0);
    setDisplayMessage(null);
    setDisplayFlash(null);
    setIsRolling(true);
    setDisplayRolls(Array.from({ length: numDice }, () => Math.floor(Math.random() * diceType) + 1));

    const animationDuration = 600;
    const startTime = Date.now();

    const animateRoll = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed < animationDuration) {
        setDisplayRolls(Array.from({ length: numDice }, () => Math.floor(Math.random() * diceType) + 1));
        requestAnimationFrame(animateRoll);
        return;
      }

      const rolls = Array.from({ length: numDice }, () => Math.floor(Math.random() * diceType) + 1);
      const total = rolls.reduce((sum, current) => sum + current, 0);

      const result: DiceResult = {
        formula: `${numDice}d${diceType}`,
        total,
        rolls,
        timestamp: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      setHistory((prev) => [result, ...prev.slice(0, 4)]);
      setDisplayRolls(rolls);
      setIsRolling(false);
    };

    animateRoll();
  };

  const rollUnifiedDisplay = (formula: string, count: number, type: number, modifier = 0, subtitle?: string) => {
    setDisplayMode('custom');
    setCustomFormula(formula);
    setDisplaySubtitle(subtitle ?? null);
    setDisplayModifier(modifier);
    setDisplayMessage(null);
    setDisplayFlash(null);
    setIsRolling(true);
    setDisplayRolls(Array.from({ length: count }, () => Math.floor(Math.random() * type) + 1));

    const animationDuration = 650;
    const startTime = Date.now();

    const animateRoll = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed < animationDuration) {
        setDisplayRolls(Array.from({ length: count }, () => Math.floor(Math.random() * type) + 1));
        requestAnimationFrame(animateRoll);
        return;
      }

      const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * type) + 1);
      const total = rolls.reduce((sum, current) => sum + current, 0) + modifier;

      const resultRolls = modifier !== 0 ? [...rolls, modifier] : rolls;

      const result: DiceResult = {
        formula,
        total,
        rolls: resultRolls,
        timestamp: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      setHistory((prev) => [result, ...prev.slice(0, 4)]);
      setDisplayRolls(rolls);
      setIsRolling(false);
    };

    animateRoll();
  };

  useEffect(() => {
    if (!rollRequest) return;
    if (isRolling) return;
    if (lastProcessedRollIdRef.current === rollRequest.id) return;

    lastProcessedRollIdRef.current = rollRequest.id;
    setLastAttackWeapon(rollRequest);
    setDisplayMode('skill');
    setDisplayModifier(0);

    const attributeConfig = getAttributeRollConfig(rollRequest.attributeValue);

    const diceSides = [attributeConfig.animationDie, rollRequest.trainingDie];


    setDisplayMessage(null);
    setDisplayFlash(null);
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

      const baseAttributeRoll = rollAttributeValue(rollRequest.attributeValue);
      const baseTrainingRoll = Math.floor(Math.random() * rollRequest.trainingDie) + 1;
      const finalRolls = [baseAttributeRoll, baseTrainingRoll];
      let total = baseAttributeRoll + baseTrainingRoll;

      triggerDisplayOutcome(baseAttributeRoll, baseTrainingRoll);



      setDisplayRolls(finalRolls);

      const formulaParts = [attributeConfig.formula, `1d${rollRequest.trainingDie}`];

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
  }, [rollRequest, isRolling]);

  useEffect(() => {
    if (!damageRollRequest) return;
    if (isRolling) return;
    if (lastProcessedDamageRollIdRef.current === damageRollRequest.id) return;

    lastProcessedDamageRollIdRef.current = damageRollRequest.id;

    const bonus = Number(damageRollRequest.modifier || 0);
    const formula = `${damageRollRequest.diceCount}d${damageRollRequest.diceType}${
      bonus !== 0 ? ` + ${bonus}` : ''
    }`;

    rollUnifiedDisplay(
      formula,
      damageRollRequest.diceCount,
      damageRollRequest.diceType,
      bonus,
      `${damageRollRequest.weaponName} - Dano`
    );
  }, [damageRollRequest, isRolling]);

  return (
    <div className="space-y-4">
      <div
        className={`border-2 p-4 transition-colors duration-200 ${
          displayFlash === 'critical'
            ? 'border-yellow-400 bg-yellow-950/25'
            : displayFlash === 'fail'
              ? 'border-red-300 bg-red-950/25'
              : 'border-red-500 bg-black'
        }`}
      >
        <h3 className="text-xs font-bold text-red-500 uppercase mb-3">Display de Testes</h3>

        <div className="text-xs text-red-300 border border-red-500 p-2 bg-black/80 mb-3 min-h-14">
          {displayMode === 'skill' && rollRequest ? (
            <>
              <div className="font-bold text-red-400 uppercase">{rollRequest.periciaName}</div>
              <div>{rollRequest.trainingLabel} com {rollRequest.attributeLabel}</div>
              <div className="text-red-400">{getAttributeRollConfig(rollRequest.attributeValue).formula} + 1d{rollRequest.trainingDie}</div>
            </>
          ) : displayMode === 'custom' && customFormula ? (
            <>
              <div className="font-bold text-red-400 uppercase">{displaySubtitle || 'Rolagem'}</div>
              <div className="text-red-400">{customFormula}</div>
            </>
          ) : (
            <div>Use o botao Rolar em uma pericia para iniciar.</div>
          )}
        </div>

        {displayMode === 'skill' ? (
          <>
            <div className="grid grid-cols-2 gap-2 mb-1">
              <button
                onClick={() => reRollDice('attribute')}
                disabled={isRolling || isReRolling !== null}
                className={`h-14 border-2 border-blue-500 bg-black flex items-center justify-center text-xl font-bold transition-all cursor-pointer hover:bg-blue-950/25 disabled:cursor-default ${isRolling || isReRolling === 'attribute' ? 'animate-pulse text-blue-300' : 'text-blue-500 hover:border-blue-400'}`}
              >
                {displayRolls[0] ?? '-'}
              </button>
              <button
                onClick={() => reRollDice('training')}
                disabled={isRolling || isReRolling !== null}
                className={`h-14 border-2 border-purple-600 bg-black flex items-center justify-center text-xl font-bold transition-all cursor-pointer hover:bg-purple-950/25 disabled:cursor-default ${isRolling || isReRolling === 'training' ? 'animate-pulse text-purple-300' : 'text-purple-500 hover:border-purple-400'}`}
              >
                {displayRolls[1] ?? '-'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3 text-[10px] uppercase tracking-wide font-bold">
              <div className="text-center text-blue-400">
                <div>Atributo</div>
                <div className="text-[9px] text-blue-300 normal-case tracking-normal">{rollRequest?.attributeLabel || '-'}</div>
              </div>
              <div className="text-center text-purple-400">
                <div>Pericia</div>
                <div className="text-[9px] text-purple-300 normal-case tracking-normal">{rollRequest?.trainingLabel || '-'}</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={`h-16 mb-1 border-2 border-red-500 bg-black flex flex-col items-center justify-center ${isRolling ? 'animate-pulse' : ''}`}>
              {displayRolls.length > 0 ? (
                <>
                  <div className={`text-3xl font-bold ${isRolling ? 'text-red-300' : 'text-red-400'}`}>
                    {displayRolls.reduce((a, b) => a + b, 0) + displayModifier}
                  </div>
                  {!isRolling && displayRolls.length > 1 && (
                    <div className="text-[9px] text-red-600 font-mono">
                      {displayRolls.join(' + ')}
                      {displayModifier !== 0 && ` ${displayModifier > 0 ? '+' : '-'} ${Math.abs(displayModifier)}`}
                    </div>
                  )}
                </>
              ) : (
                <span className="text-3xl font-bold text-red-600">-</span>
              )}
            </div>
            <div className="mb-3 text-[10px] uppercase tracking-wide font-bold text-center text-red-500">
              {displaySubtitle || customFormula || 'Customizado'}
            </div>
          </>
        )}

        {displayMessage && (
          <div
            className={`mb-3 text-center text-xs font-bold uppercase ${
              displayFlash === 'critical' ? 'text-yellow-300' : 'text-red-300'
            }`}
          >
            {displayMessage}
          </div>
        )}

        {displayMode === 'skill' && displayRolls[0] && !isRolling && displayFlash !== 'fail' && lastAttackWeapon?.damageDiceCount && lastAttackWeapon?.damageDiceSides && (
          <button
            onClick={rollWeaponDamage}
            className="w-full mb-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase border border-red-500 transition-all text-xs"
          >
            Rolar Dano
          </button>
        )}

        {displayMode === 'skill' && displayRolls[0] && !isRolling && (
          <div className="mb-3 text-center text-[9px] text-gray-400 italic">
            Clique em um dado para re-rolálo
          </div>
        )}


      </div>

      <div className="border-2 border-red-500 p-4 bg-black">
        <h3 className="text-xs font-bold text-red-500 uppercase mb-4">Rolagem Customizada</h3>

        <div className="mb-4">
          <div className="text-xs font-bold text-red-400 uppercase mb-2">Numero de Dados</div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: maxDice }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setNumDice(num)}
                className={`py-2 text-xs font-bold border-2 transition-all ${
                  numDice === num
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'border-red-500 text-red-500 hover:bg-red-500 hover:text-black'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs font-bold text-red-400 uppercase mb-2">Lados do Dado</div>
          <div className="grid grid-cols-3 gap-2">
            {diceTypes.map((type) => (
              <button
                key={type}
                onClick={() => setDiceType(type)}
                className={`py-2 text-xs font-bold border-2 transition-all ${
                  diceType === type
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'border-red-500 text-red-500 hover:bg-red-500 hover:text-black'
                }`}
              >
                d{type}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={rollCustomDice}
          disabled={isRolling}
          className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white font-bold uppercase border-2 border-red-500 transition-all active:scale-95"
        >
          <Dice6 className="inline mr-2" size={20} />
          {isRolling ? 'Rolando...' : `Rolar ${numDice}d${diceType}`}
        </button>
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
