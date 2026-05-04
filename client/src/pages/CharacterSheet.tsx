import { useState } from 'react';
import AttributeHexagon from '@/components/AttributeHexagon';
import SkillsList from '@/components/SkillsList';
import DiceRoller from '@/components/DiceRoller';
import VitalStats from '@/components/VitalStats';
import Pericias from '@/components/Pericias';
import DamageThresholds from '@/components/DamageThresholds';
import HopeCounter from '@/components/HopeCounter';
import ArmorSelector from '@/components/ArmorSelector';
import InventoryPanel from '@/components/InventoryPanel';
import InsanityPanel from '@/components/InsanityPanel';
import RitualsPanel from '@/components/RitualsPanel';
import SaveLoad from '@/components/SaveLoad';
import symbols, { type RitualSymbol } from '@/data/symbols';

/**
 * Dark Occult Minimalism - Ficha de RPG Daggerheart
 * 
 * Estrutura:
 * - Topo: Nome do personagem
 * - Abaixo do nome: Thresholds em linha + Vitals + Hope Counter + Armor/Evasion
 * - Coluna esquerda: Atributos em hexágonos vermelhos
 * - Centro: Habilidades com scroll fixo, Expertises abaixo com scroll
 * - Direita: Rolagem de dados + Menu retrátil (Inventário/Equipamentos)
 */

interface Skill {
  id: string;
  name: string;
  description: string;
  damage: string;
  hasCounter: boolean;
  counter: number;
}

interface Pericia {
  id: string;
  name: string;
  training: 'treinado' | 'veterano' | 'expert';
}

interface DamageThreshold {
  minor: number;
  major: number;
  severe: number;
}

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

interface DamageRollRequest {
  id: number;
  weaponName: string;
  diceCount: number;
  diceType: number;
  modifier: number;
}

interface Insanity {
  id: string;
  name: string;
  description: string;
}

interface ParanormalPower {
  id: string;
  name: string;
  description: string;
}

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
  step: number; // 1 = escolha do símbolo, 2 = escolha de componente, 3 = final
  chosenComponentId?: string | null;
}

interface LoadedRitual extends Partial<Omit<Ritual, 'versions'>> {
  name?: string;
  circle?: string;
  cost?: string;
  duration?: string;
  resistance?: number;
  type?: RitualType;
  description?: string;
  retained?: boolean;
  versions?: Array<Partial<RitualVersion>>;
}

interface CharacterData {
  name: string;
  attributes: {
    força: number;
    agilidade: number;
    inteligência: number;
    presença: number;
    vigor: number;
  };
  skills: Skill[];
  pericias: Pericia[];
  hp: { current: number; max: number };
  sanity: { current: number; max: number };
  damageThresholds: DamageThreshold;
  hope: number;
  armor: number;
  evasion: number;
  inventory: InventoryItem[];
  primaryWeapon: Weapon;
  secondaryWeapon: Weapon;
  insanities: Insanity[];
  paranormalPowers: ParanormalPower[];
  rituals: Ritual[];
  ritualComponents: RitualComponent[];
}

interface SkillRollRequest {
  id: number;
  periciaName: string;
  attributeLabel: string;
  trainingLabel: string;
  attributeValue: number;
  trainingDie: number;
}

const ATTRIBUTE_KEYS: Array<keyof CharacterData['attributes']> = [
  'força',
  'agilidade',
  'inteligência',
  'presença',
  'vigor',
];

const ATTRIBUTE_LABELS: Record<keyof CharacterData['attributes'], string> = {
  força: 'Forca',
  agilidade: 'Agilidade',
  inteligência: 'Inteligencia',
  presença: 'Presenca',
  vigor: 'Vigor',
};

const TRAINING_DIE_MAP: Record<Pericia['training'], number> = {
  treinado: 6,
  veterano: 8,
  expert: 10,
};

const TRAINING_LABELS: Record<Pericia['training'], string> = {
  treinado: 'Treinado',
  veterano: 'Veterano',
  expert: 'Expert',
};

export default function CharacterSheet() {
  const [pendingRoll, setPendingRoll] = useState<SkillRollRequest | null>(null);
  const [pendingDamageRoll, setPendingDamageRoll] = useState<DamageRollRequest | null>(null);
  const [openSidebar, setOpenSidebar] = useState<'inventory' | 'insanity' | 'rituals' | null>(null);
  const [ritualConjureState, setRitualConjureState] = useState<RitualConjureState | null>(null);
  const [ritualResolveState, setRitualResolveState] = useState<
    | {
        ritualId: string;
        selectedAttribute?: keyof CharacterData['attributes'];
        selectedPericiaId?: string | null;
        isRolling?: boolean;
        rolls?: number[];
        total?: number;
        passed?: boolean;
        difficulty?: number;
      }
    | null
  >(null);
  const [character, setCharacter] = useState<CharacterData>({
    name: 'Seu Personagem',
    attributes: {
      força: 0,
      agilidade: 0,
      inteligência: 0,
      presença: 0,
      vigor: 0,
    },
    skills: [],
    pericias: [
      { id: '1', name: 'Luta', training: 'treinado' },
      { id: '2', name: 'Pontaria', training: 'veterano' },
    ],
    hp: { current: 20, max: 20 },
    sanity: { current: 10, max: 10 },
    damageThresholds: { minor: 7, major: 14, severe: 21 },
    hope: 3,
    armor: 0,
    evasion: 0,
    inventory: [],
    primaryWeapon: {
      id: '1',
      name: '',
      traits: '',
      damageDie: 6,
      hasDamageBonus: false,
      damageBonus: 0,
      proficiency: 0,
      feature: '',
    },
    secondaryWeapon: {
      id: '2',
      name: '',
      traits: '',
      damageDie: 6,
      hasDamageBonus: false,
      damageBonus: 0,
      proficiency: 0,
      feature: '',
    },
    insanities: [],
    paranormalPowers: [],
    rituals: [],
    ritualComponents: [],
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCharacter({ ...character, name: e.target.value });
  };

  const handleAttributeChange = (attr: keyof typeof character.attributes, value: number) => {
    setCharacter({
      ...character,
      attributes: { ...character.attributes, [attr]: value },
    });
  };

  const handleAddSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: 'Nova Habilidade',
      description: 'Descricao da habilidade',
      damage: '1d6',
      hasCounter: false,
      counter: 0,
    };
    setCharacter((prev) => ({ ...prev, skills: [...prev.skills, newSkill] }));
  };

  const handleUpdateSkill = (id: string, field: keyof Skill, value: string | number | boolean) => {
    setCharacter((prev) => ({
      ...prev,
      skills: prev.skills.map((skill) =>
        skill.id === id ? { ...skill, [field]: value } : skill
      ),
    }));
  };

  const handleDeleteSkill = (id: string) => {
    setCharacter((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill.id !== id),
    }));
  };

  const handleReorderSkills = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    setCharacter((prev) => {
      const fromIndex = prev.skills.findIndex((skill) => skill.id === draggedId);
      const toIndex = prev.skills.findIndex((skill) => skill.id === targetId);

      if (fromIndex === -1 || toIndex === -1) return prev;

      const reordered = [...prev.skills];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);

      return {
        ...prev,
        skills: reordered,
      };
    });
  };

  const handleAddPericia = () => {
    const newPericia: Pericia = {
      id: Date.now().toString(),
      name: 'Nova Pericia',
      training: 'treinado',
    };
    setCharacter({ ...character, pericias: [...character.pericias, newPericia] });
  };

  const handleUpdatePericia = (id: string, field: keyof Pericia, value: string) => {
    setCharacter({
      ...character,
      pericias: character.pericias.map((pericia) =>
        pericia.id === id ? { ...pericia, [field]: value } : pericia
      ),
    });
  };

  const handleDeletePericia = (id: string) => {
    setCharacter({
      ...character,
      pericias: character.pericias.filter((pericia) => pericia.id !== id),
    });
  };

  const handleRollPericia = (id: string, selectedAttribute: keyof CharacterData['attributes']) => {
    const pericia = character.pericias.find((p) => p.id === id);
    if (!pericia) return;

    const attributeValue = character.attributes[selectedAttribute];
    const normalizedAttribute = Math.max(0, Math.min(5, attributeValue));

    setPendingRoll({
      id: Date.now(),
      periciaName: pericia.name || 'Pericia sem nome',
      attributeLabel: ATTRIBUTE_LABELS[selectedAttribute],
      trainingLabel: TRAINING_LABELS[pericia.training],
      attributeValue: normalizedAttribute,
      trainingDie: TRAINING_DIE_MAP[pericia.training],
    });
  };

  const handleVitalChange = (type: 'hp' | 'sanity', field: 'current' | 'max', value: number): void => {
    setCharacter({
      ...character,
      [type]: { ...character[type], [field]: value },
    });
  };

  const handleDamageThresholdChange = (field: keyof DamageThreshold, value: number) => {
    setCharacter({
      ...character,
      damageThresholds: { ...character.damageThresholds, [field]: value },
    });
  };

  const handleHopeChange = (value: number) => {
    setCharacter({ ...character, hope: value });
  };

  const handleArmorChange = (value: number) => {
    setCharacter({ ...character, armor: value });
  };

  const handleEvasionChange = (value: number) => {
    setCharacter({ ...character, evasion: value });
  };

  const handleAddInventoryItem = () => {
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: 'Novo Item',
      description: '',
    };
    setCharacter({ ...character, inventory: [...character.inventory, newItem] });
  };

  const handleUpdateInventoryItem = (id: string, field: keyof InventoryItem, value: string) => {
    setCharacter({
      ...character,
      inventory: character.inventory.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const handleDeleteInventoryItem = (id: string) => {
    setCharacter({
      ...character,
      inventory: character.inventory.filter((item) => item.id !== id),
    });
  };

  const handleUpdatePrimaryWeapon = (field: keyof Weapon, value: string | number | boolean) => {
    setCharacter({
      ...character,
      primaryWeapon: { ...character.primaryWeapon, [field]: value },
    });
  };

  const handleUpdateSecondaryWeapon = (field: keyof Weapon, value: string | number | boolean) => {
    setCharacter({
      ...character,
      secondaryWeapon: { ...character.secondaryWeapon, [field]: value },
    });
  };

  const handleRollWeaponDamage = (weapon: Weapon) => {
    const diceCount = Math.max(1, weapon.proficiency || 0);
    const modifier = weapon.hasDamageBonus ? weapon.damageBonus : 0;

    setPendingDamageRoll({
      id: Date.now(),
      weaponName: weapon.name || 'Arma sem nome',
      diceCount,
      diceType: weapon.damageDie,
      modifier,
    });
  };

  const toggleInventoryPanel = () => {
    setOpenSidebar((prev) => (prev === 'inventory' ? null : 'inventory'));
  };

  const toggleInsanityPanel = () => {
    setOpenSidebar((prev) => (prev === 'insanity' ? null : 'insanity'));
  };

  const toggleRitualsPanel = () => {
    setOpenSidebar((prev) => (prev === 'rituals' ? null : 'rituals'));
  };

  const handleAddRitual = (ritual: Ritual) => {
    setCharacter((prev) => {
      const activeVersion = ritual.versions[ritual.activeVersion] ?? ritual.versions[0];
      const costValue = parseInt(activeVersion?.cost || '0') || 0;

      const newSanity = activeVersion?.retained
        ? {
            current: Math.max(0, prev.sanity.current - costValue),
            max: Math.max(0, prev.sanity.max - costValue),
          }
        : prev.sanity;

      return {
        ...prev,
        sanity: newSanity,
        rituals: [...prev.rituals, ritual],
      };
    });
  };

  const getRandomSymbolChoices = (): RitualSymbol[] => {
    const pool = [...symbols];
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
    }

    return pool.slice(0, 3);
  };

  const handleSetRitualVersion = (id: string, activeVersion: number) => {
    setCharacter((prev) => ({
      ...prev,
      rituals: prev.rituals.map((ritual) =>
        ritual.id === id
          ? {
              ...ritual,
              activeVersion: Math.max(0, Math.min(activeVersion, ritual.versions.length - 1)),
            }
          : ritual
      ),
    }));
  };

  const handleUpdateRitual = (id: string, ritual: Ritual) => {
    setCharacter((prev) => {
      const oldRitual = prev.rituals.find((r) => r.id === id);
      const oldVersion = oldRitual?.versions[oldRitual.activeVersion] ?? oldRitual?.versions[0];
      const newVersion = ritual.versions[ritual.activeVersion] ?? ritual.versions[0];
      const wasRetained = oldVersion?.retained ?? false;
      const isRetained = newVersion?.retained ?? false;
      const costValue = parseInt(newVersion?.cost || '0') || 0;

      let newSanity = prev.sanity;

      if (!wasRetained && isRetained) {
        // Ritual is being retained - deduct cost from current and max
        newSanity = {
          current: Math.max(0, prev.sanity.current - costValue),
          max: Math.max(0, prev.sanity.max - costValue),
        };
      } else if (wasRetained && !isRetained) {
        // Ritual is no longer retained - restore max sanity
        newSanity = {
          current: prev.sanity.current,
          max: prev.sanity.max + costValue,
        };
      }

      return {
        ...prev,
        sanity: newSanity,
        rituals: prev.rituals.map((item) => (item.id === id ? ritual : item)),
      };
    });
  };

  const handleRemoveRitual = (id: string) => {
    setCharacter((prev) => {
      const ritualToRemove = prev.rituals.find((r) => r.id === id);
      const currentVersion = ritualToRemove?.versions[ritualToRemove.activeVersion] ?? ritualToRemove?.versions[0];
      const costValue = parseInt(currentVersion?.cost || '0') || 0;

      let newSanity = prev.sanity;
      if (currentVersion?.retained) {
        // If removing a retained ritual, restore max sanity
        newSanity = {
          current: prev.sanity.current,
          max: prev.sanity.max + costValue,
        };
      }

      return {
        ...prev,
        sanity: newSanity,
        rituals: prev.rituals.filter((item) => item.id !== id),
      };
    });
  };

  const handleConjureRitual = (_ritual: Ritual) => {
    const ritual = _ritual;
    const activeVersion = ritual.versions[ritual.activeVersion] ?? ritual.versions[0];

    if (activeVersion?.retained) {
      handleUpdateRitual(ritual.id, {
        ...ritual,
        versions: ritual.versions.map((version, index) =>
          index === ritual.activeVersion ? { ...version, retained: false } : version
        ),
      });
      return;
    }

    setRitualConjureState({
      ritualId: ritual.id,
      symbolChoices: getRandomSymbolChoices(),
      selectedSymbol: null,
      step: 1,
      chosenComponentId: null,
    });
    setOpenSidebar('rituals');
  };

  const handleChooseRitualSymbol = (symbol: RitualSymbol) => {
    setRitualConjureState((prev) =>
      prev ? { ...prev, selectedSymbol: symbol } : prev
    );
  };

  const handleContinueRitual = (_ritualId: string) => {
    setRitualConjureState((prev) => {
      if (!prev) return prev;
      if (prev.step === 1 && prev.selectedSymbol) {
        return { ...prev, step: 2 };
      }
      if (prev.step === 2) {
        return { ...prev, step: 3 };
      }
      return prev;
    });
    setOpenSidebar('rituals');
  };

  const handleContinueWithoutComponents = (ritualId: string) => {
    setRitualConjureState((prev) => (prev && prev.ritualId === ritualId ? { ...prev, step: 3 } : prev));
    setOpenSidebar('rituals');
  };

  const handleCancelConjure = () => {
    setRitualConjureState(null);
  };

  const handleResolveRitual = (ritualId: string) => {
    setRitualResolveState({ ritualId });
    setOpenSidebar('rituals');
  };

  const rollAttributeValueLocal = (attributeValue: number) => {
    switch (attributeValue) {
      case 0: {
        const a = Math.floor(Math.random() * 6) + 1;
        const b = Math.floor(Math.random() * 6) + 1;
        return Math.min(a, b);
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
        const a = Math.floor(Math.random() * 12) + 1;
        const b = Math.floor(Math.random() * 12) + 1;
        return Math.max(a, b);
      }
      default:
        return Math.floor(Math.random() * 6) + 1;
    }
  };

  const handlePerformResolveRoll = async () => {
    if (!ritualResolveState) return;

    const ritual = character.rituals.find((r) => r.id === ritualResolveState.ritualId);
    if (!ritual) return;

    const version = ritual.versions[ritual.activeVersion] ?? ritual.versions[0];
    const costValue = parseInt(version.cost || '0') || 0;
    const difficulty = 7 + costValue;

    const attributeKey = ritualResolveState.selectedAttribute ?? 'força';
    const attributeValue = character.attributes[attributeKey];
    const pericia = character.pericias.find((p) => p.id === ritualResolveState.selectedPericiaId) ?? character.pericias[0];
    const trainingDie = TRAINING_DIE_MAP[pericia?.training ?? 'treinado'];

    setRitualResolveState((prev) => (prev ? { ...prev, isRolling: true, difficulty } : prev));

    const animationDuration = 900;
    const start = Date.now();
    let rafId: number | null = null;

    const animate = () => {
      const elapsed = Date.now() - start;
      if (elapsed < animationDuration) {
        // show random values
        setRitualResolveState((prev) =>
          prev
            ? { ...prev, rolls: [Math.floor(Math.random() * (attributeValue >= 5 ? 12 : 6)) + 1, Math.floor(Math.random() * trainingDie) + 1] }
            : prev
        );
        rafId = requestAnimationFrame(animate);
        return;
      }

      // final rolls
      const attrRoll = rollAttributeValueLocal(attributeValue);
      const trainRoll = Math.floor(Math.random() * trainingDie) + 1;
      const total = attrRoll + trainRoll;
      const passed = total >= difficulty;

      setRitualResolveState((prev) =>
        prev
          ? { ...prev, rolls: [attrRoll, trainRoll], total, passed, isRolling: false, difficulty }
          : prev
      );
      if (rafId) cancelAnimationFrame(rafId);
    };

    animate();
  };

  const handleCloseResolve = () => {
    setRitualResolveState(null);
    setRitualConjureState(null);
  };

  const handleAddInsanity = (insanity: Insanity) => {
    setCharacter({ ...character, insanities: [...character.insanities, insanity] });
  };

  const handleUpdateInsanity = (id: string, insanity: Insanity) => {
    setCharacter({
      ...character,
      insanities: character.insanities.map((i) => (i.id === id ? insanity : i)),
    });
  };

  const handleRemoveInsanity = (id: string) => {
    setCharacter({
      ...character,
      insanities: character.insanities.filter((i) => i.id !== id),
    });
  };

  const handleAddPower = (power: ParanormalPower) => {
    setCharacter({ ...character, paranormalPowers: [...character.paranormalPowers, power] });
  };

  const handleUpdatePower = (id: string, power: ParanormalPower) => {
    setCharacter({
      ...character,
      paranormalPowers: character.paranormalPowers.map((p) => (p.id === id ? power : p)),
    });
  };

  const handleRemovePower = (id: string) => {
    setCharacter({
      ...character,
      paranormalPowers: character.paranormalPowers.filter((p) => p.id !== id),
    });
  };

  const handleLoadCharacter = (
    data: Partial<Omit<CharacterData, 'rituals'>> & {
      expertises?: Array<{ id: string; name: string }>;
      skills?: Array<
        Partial<Skill> & { id: string; name?: string; effect?: string; cost?: number }
      >;
      rituals?: LoadedRitual[];
    }
  ) => {
    const normalizeWeapon = (weapon: Partial<Weapon> | undefined, fallback: Weapon): Weapon => {
      const parsedLegacyDie =
        typeof weapon?.damage === 'string'
          ? Number((weapon.damage.match(/d(\d+)/i) || [])[1] || 0)
          : 0;

      const candidateDie = Number(weapon?.damageDie ?? parsedLegacyDie ?? fallback.damageDie);
      const safeDie = Number.isFinite(candidateDie) && candidateDie > 0 ? candidateDie : fallback.damageDie;

      return {
        ...fallback,
        ...weapon,
        damageDie: safeDie,
        hasDamageBonus: Boolean(weapon?.hasDamageBonus),
        damageBonus: Number(weapon?.damageBonus ?? 0),
        proficiency: Number(weapon?.proficiency ?? fallback.proficiency),
      };
    };

    const loadedSkills: Skill[] = Array.isArray(data.skills)
      ? data.skills.map((skill) => ({
          id: skill.id,
          name: skill.name ?? 'Habilidade',
          description: skill.description ?? skill.effect ?? '',
          damage: skill.damage ?? '1d6',
          hasCounter: skill.hasCounter ?? false,
          counter: skill.counter ?? skill.cost ?? 0,
        }))
      : [];

    const loadedPericias: Pericia[] = Array.isArray(data.pericias)
      ? data.pericias.map((pericia) => ({
          id: pericia.id,
          name: pericia.name,
          training: pericia.training ?? 'treinado',
        }))
      : (data.expertises || []).map((expertise) => ({
          id: expertise.id,
          name: expertise.name,
          training: 'treinado' as const,
        }));

    const normalizeRitualVersion = (version: Partial<RitualVersion> | undefined): RitualVersion => ({
      name: version?.name ?? '',
      circle: version?.circle ?? '',
      cost: version?.cost ?? '',
      duration: version?.duration ?? '',
      resistance: Number(version?.resistance ?? 0),
      type: version?.type ?? 'utilidade',
      description: version?.description ?? '',
      retained: Boolean(version?.retained ?? false),
    });

    const loadedRituals: Ritual[] = Array.isArray(data.rituals)
      ? data.rituals.map((ritual) => {
          const versions = Array.isArray(ritual.versions) && ritual.versions.length > 0
            ? ritual.versions.slice(0, 3).map((version) => normalizeRitualVersion(version))
            : [
                normalizeRitualVersion({
                  name: ritual.name,
                  circle: ritual.circle,
                  cost: ritual.cost,
                  duration: ritual.duration,
                  resistance: ritual.resistance,
                  type: ritual.type,
                  description: ritual.description,
                  retained: ritual.retained,
                }),
              ];

          return {
            id: ritual.id ?? Date.now().toString(),
            versions,
            activeVersion: Math.max(
              0,
              Math.min(Number(ritual.activeVersion ?? 0), versions.length - 1)
            ),
          };
        })
      : [];

    const loadedRitualComponents: RitualComponent[] = Array.isArray(data.ritualComponents)
      ? data.ritualComponents.map((component) => ({
          id: component.id,
          name: component.name ?? '',
          description: component.description ?? '',
        }))
      : [];

    setCharacter((prev) => ({
      ...prev,
      ...data,
      attributes: {
        força: Number(data.attributes?.força ?? prev.attributes.força ?? 0),
        agilidade: Number(data.attributes?.agilidade ?? prev.attributes.agilidade ?? 0),
        inteligência: Number(data.attributes?.inteligência ?? prev.attributes.inteligência ?? 0),
        presença: Number(data.attributes?.presença ?? prev.attributes.presença ?? 0),
        vigor: Number(data.attributes?.vigor ?? prev.attributes.vigor ?? 0),
      },
      skills: loadedSkills.length > 0 ? loadedSkills : prev.skills,
      pericias: loadedPericias.length > 0 ? loadedPericias : prev.pericias,
      rituals: loadedRituals.length > 0 ? loadedRituals : prev.rituals,
      ritualComponents:
        loadedRitualComponents.length > 0 ? loadedRitualComponents : prev.ritualComponents,
      primaryWeapon: normalizeWeapon(data.primaryWeapon, prev.primaryWeapon),
      secondaryWeapon: normalizeWeapon(data.secondaryWeapon, prev.secondaryWeapon),
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b-2 border-primary bg-black p-2 md:p-4 flex-shrink-0 space-y-2 md:space-y-3 overflow-y-auto max-h-screen md:max-h-none">
        <h1 className="font-display text-2xl md:text-4xl text-primary">ORDEM DA VERDADE</h1>
        <input
          type="text"
          value={character.name}
          onChange={handleNameChange}
          className="input-occult text-lg md:text-2xl font-display bg-black border-b-2 border-primary focus:border-primary w-full"
          placeholder="Nome do Personagem"
        />

        {/* Save/Load Buttons */}
        <SaveLoad
          characterData={character}
          onLoadCharacter={handleLoadCharacter}
        />

        {/* Vitals + Hope + Armor Row - Stack on mobile */}
        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <div className="flex-1 min-w-0">
            <VitalStats
              hp={character.hp}
              sanity={character.sanity}
              onHpChange={(field, value) => handleVitalChange('hp', field, value)}
              onSanityChange={(field, value) => handleVitalChange('sanity', field, value)}
            />
          </div>
          <div className="w-full md:w-56 flex-shrink-0 space-y-2">
            <div>
              <HopeCounter
                current={character.hope}
                onChange={handleHopeChange}
              />
            </div>
            <div>
              <DamageThresholds
                thresholds={character.damageThresholds}
                onChange={handleDamageThresholdChange}
              />
            </div>
          </div>
          <div className="w-full md:w-56 flex-shrink-0">
            <ArmorSelector
              armorValue={character.armor}
              onArmorChange={handleArmorChange}
              evasion={character.evasion}
              onEvasionChange={handleEvasionChange}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 gap-2 md:gap-4 p-2 md:p-4 overflow-hidden pr-0">
        {/* Left Column - Attributes */}
        <div className="flex-shrink-0 w-full md:w-40">
          <h2 className="font-display text-xs md:text-sm text-primary uppercase mb-2 md:mb-3">Atributos</h2>
          <div className="grid grid-cols-3 md:grid-cols-2 gap-2 md:gap-3">
            {ATTRIBUTE_KEYS.map((attr) => (
              <AttributeHexagon
                key={attr}
                attribute={attr}
                value={character.attributes[attr]}
                onChange={(val) => handleAttributeChange(attr, val)}
              />
            ))}
          </div>
        </div>

        {/* Center Column - Skills & Pericias */}
        <div className="flex-1 flex flex-col min-w-0 gap-2 md:gap-4 md:ml-3">
          {/* Pericias Section */}
          <div className="h-80 md:h-[32rem] flex flex-col min-h-0 flex-shrink-0">
            <Pericias
              pericias={character.pericias}
              onAddPericia={handleAddPericia}
              onUpdatePericia={handleUpdatePericia}
              onDeletePericia={handleDeletePericia}
              onRollPericia={handleRollPericia}
            />
          </div>

          {/* Skills Section - Fixed Height with Scroll */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <h2 className="font-display text-sm md:text-lg text-primary">HABILIDADES</h2>
              <button
                onClick={handleAddSkill}
                className="btn-occult text-xs px-2 py-1"
              >
                + ADD
              </button>
            </div>
            <SkillsList
              skills={character.skills}
              onUpdateSkill={handleUpdateSkill}
              onDeleteSkill={handleDeleteSkill}
              onReorderSkills={handleReorderSkills}
            />
          </div>
        </div>

        {/* Right Column - Dice */}
        <div className="flex-shrink-0 w-full md:w-56 pr-0 md:pr-4">
          <DiceRoller rollRequest={pendingRoll} damageRollRequest={pendingDamageRoll} />
        </div>
      </div>

      {/* Inventory Panel - Retractable Sidebar */}
      <InventoryPanel
        isOpen={openSidebar === 'inventory'}
        showToggle={openSidebar !== 'insanity' && openSidebar !== 'rituals'}
        onToggle={toggleInventoryPanel}
        inventory={character.inventory}
        onAddItem={handleAddInventoryItem}
        onUpdateItem={handleUpdateInventoryItem}
        onDeleteItem={handleDeleteInventoryItem}
        primaryWeapon={character.primaryWeapon}
        onUpdatePrimaryWeapon={handleUpdatePrimaryWeapon}
        secondaryWeapon={character.secondaryWeapon}
        onUpdateSecondaryWeapon={handleUpdateSecondaryWeapon}
        onRollPrimaryDamage={() => handleRollWeaponDamage(character.primaryWeapon)}
        onRollSecondaryDamage={() => handleRollWeaponDamage(character.secondaryWeapon)}
      />

      {/* Insanity Panel - Second Retractable Sidebar */}
      <InsanityPanel
        isOpen={openSidebar === 'insanity'}
        showToggle={openSidebar !== 'inventory' && openSidebar !== 'rituals'}
        onToggle={toggleInsanityPanel}
        insanities={character.insanities}
        paranormalPowers={character.paranormalPowers}
        onInsanityAdd={handleAddInsanity}
        onInsanityRemove={handleRemoveInsanity}
        onInsanityUpdate={handleUpdateInsanity}
        onPowerAdd={handleAddPower}
        onPowerRemove={handleRemovePower}
        onPowerUpdate={handleUpdatePower}
      />

      <RitualsPanel
        isOpen={openSidebar === 'rituals'}
        showToggle={openSidebar !== 'inventory' && openSidebar !== 'insanity'}
        onToggle={toggleRitualsPanel}
        rituals={character.rituals}
        components={character.ritualComponents}
        onAddRitual={handleAddRitual}
        onUpdateRitual={handleUpdateRitual}
        ritualConjureState={ritualConjureState}
        onChooseRitualSymbol={handleChooseRitualSymbol}
        onSetRitualVersion={handleSetRitualVersion}
        onContinueRitual={handleContinueRitual}
        onContinueWithoutComponents={handleContinueWithoutComponents}
        onCancelConjure={handleCancelConjure}
        onResolveRitual={handleResolveRitual}
        onRemoveRitual={handleRemoveRitual}
        onConjureRitual={handleConjureRitual}
      />

      {/* Resolve Ritual Modal */}
      {ritualResolveState && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl border-2 border-cyan-500 bg-black p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-cyan-300 uppercase">Resolver Ritual</h3>
              <button onClick={handleCloseResolve} className="text-xs text-cyan-300 border border-cyan-500 px-2 py-1">Fechar</button>
            </div>

            {!ritualResolveState.rolls || ritualResolveState.isRolling === undefined ? (
              <div className="space-y-2">
                <div className="text-xs text-cyan-200">Escolha atributo</div>
                <div className="grid grid-cols-3 gap-2">
                  {ATTRIBUTE_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => setRitualResolveState((prev) => (prev ? { ...prev, selectedAttribute: key } : prev))}
                      className={`py-2 text-xs uppercase border ${ritualResolveState.selectedAttribute === key ? 'bg-cyan-500 text-black' : 'text-cyan-300 border-cyan-500'}`}
                    >
                      {ATTRIBUTE_LABELS[key]}
                    </button>
                  ))}
                </div>

                <div>
                  <div className="text-xs text-cyan-200">Escolha pericia</div>
                  <select
                    value={ritualResolveState.selectedPericiaId ?? ''}
                    onChange={(e) => setRitualResolveState((prev) => (prev ? { ...prev, selectedPericiaId: e.target.value } : prev))}
                    className="w-full bg-black border border-cyan-500 p-2 text-cyan-200"
                  >
                    <option value="">(usar primeira)</option>
                    {character.pericias.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePerformResolveRoll}
                    className="flex-1 bg-cyan-500 text-black py-2 uppercase font-bold"
                  >
                    Rolar
                  </button>
                  <button onClick={handleCloseResolve} className="flex-1 border border-cyan-500 text-cyan-300 py-2 uppercase">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-cyan-200 uppercase">Resultado</div>
                <div className="flex gap-3">
                  <div className="h-16 w-16 border-2 border-blue-500 flex items-center justify-center text-2xl font-bold">{ritualResolveState.rolls?.[0]}</div>
                  <div className="h-16 w-16 border-2 border-purple-600 flex items-center justify-center text-2xl font-bold">{ritualResolveState.rolls?.[1]}</div>
                  <div className="flex-1 border-2 border-red-500 p-3">
                    <div className="text-sm font-bold text-cyan-200">Total: {ritualResolveState.total}</div>
                    <div className={`mt-1 text-xs font-bold ${ritualResolveState.passed ? 'text-green-400' : 'text-red-400'}`}>{ritualResolveState.passed ? 'Sucesso' : 'Falha'}</div>
                    <div className="text-[10px] text-cyan-300 mt-2">Dificuldade: {ritualResolveState.difficulty}</div>
                  </div>
                </div>

                <div className="border border-cyan-500 p-3">
                  <div className="text-xs text-cyan-200 uppercase font-bold">Efeito do Ritual</div>
                  <div className="mt-2 text-sm text-cyan-100">{(character.rituals.find((r) => r.id === ritualResolveState.ritualId)?.versions[0]?.description) || 'Descrição do ritual'}</div>
                  <div className="mt-2 text-[10px] text-cyan-300">Símbolo: {ritualConjureState?.selectedSymbol?.simbolo ?? 'Nenhum'}</div>
                  <div className="mt-1 text-[10px] text-cyan-300">Componentes: Nenhum selecionado</div>
                </div>

                <div className="flex gap-2">
                  <button onClick={handleCloseResolve} className="flex-1 bg-cyan-500 text-black py-2 uppercase font-bold">Fechar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
