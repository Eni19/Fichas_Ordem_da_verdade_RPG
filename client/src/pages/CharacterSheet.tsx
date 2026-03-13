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
import SaveLoad from '@/components/SaveLoad';

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
  damage: string;
  proficiency: number;
  feature: string;
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

interface CharacterData {
  name: string;
  attributes: {
    agilidade: number;
    força: number;
    finesse: number;
    instinto: number;
    presença: number;
    conhecimento: number;
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
}

interface SkillRollRequest {
  id: number;
  periciaName: string;
  attributeLabel: string;
  trainingLabel: string;
  attributeDie: number;
  trainingDie: number;
}

const ATTRIBUTE_DIE_MAP: Record<number, number> = {
  [-1]: 4,
  0: 6,
  1: 8,
  2: 10,
  3: 12,
  4: 12,
};

const ATTRIBUTE_LABELS: Record<keyof CharacterData['attributes'], string> = {
  agilidade: 'Agilidade',
  força: 'Forca',
  finesse: 'Finesse',
  instinto: 'Instinto',
  presença: 'Presenca',
  conhecimento: 'Conhecimento',
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
  const [character, setCharacter] = useState<CharacterData>({
    name: 'Seu Personagem',
    attributes: {
      agilidade: 0,
      força: 0,
      finesse: 0,
      instinto: 0,
      presença: 0,
      conhecimento: 0,
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
      damage: '',
      proficiency: 0,
      feature: '',
    },
    secondaryWeapon: {
      id: '2',
      name: '',
      traits: '',
      damage: '',
      proficiency: 0,
      feature: '',
    },
    insanities: [],
    paranormalPowers: [],
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
    const normalizedAttribute = Math.max(-1, Math.min(4, attributeValue));

    setPendingRoll({
      id: Date.now(),
      periciaName: pericia.name || 'Pericia sem nome',
      attributeLabel: ATTRIBUTE_LABELS[selectedAttribute],
      trainingLabel: TRAINING_LABELS[pericia.training],
      attributeDie: ATTRIBUTE_DIE_MAP[normalizedAttribute],
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

  const handleUpdatePrimaryWeapon = (field: keyof Weapon, value: string | number) => {
    setCharacter({
      ...character,
      primaryWeapon: { ...character.primaryWeapon, [field]: value },
    });
  };

  const handleUpdateSecondaryWeapon = (field: keyof Weapon, value: string | number) => {
    setCharacter({
      ...character,
      secondaryWeapon: { ...character.secondaryWeapon, [field]: value },
    });
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
    data: Partial<CharacterData> & {
      expertises?: Array<{ id: string; name: string }>;
      skills?: Array<
        Partial<Skill> & { id: string; name?: string; effect?: string; cost?: number }
      >;
    }
  ) => {
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

    setCharacter((prev) => ({
      ...prev,
      ...data,
      attributes: {
        ...prev.attributes,
        ...data.attributes,
      },
      skills: loadedSkills.length > 0 ? loadedSkills : prev.skills,
      pericias: loadedPericias.length > 0 ? loadedPericias : prev.pericias,
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
          <div className="w-full md:w-64 flex-shrink-0">
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
            {Object.entries(character.attributes).map(([attr, value]) => (
              <AttributeHexagon
                key={attr}
                attribute={attr}
                value={value}
                onChange={(val) => handleAttributeChange(attr as keyof typeof character.attributes, val)}
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
          <DiceRoller rollRequest={pendingRoll} />
        </div>
      </div>

      {/* Inventory Panel - Retractable Sidebar */}
      <InventoryPanel
        inventory={character.inventory}
        onAddItem={handleAddInventoryItem}
        onUpdateItem={handleUpdateInventoryItem}
        onDeleteItem={handleDeleteInventoryItem}
        primaryWeapon={character.primaryWeapon}
        onUpdatePrimaryWeapon={handleUpdatePrimaryWeapon}
        secondaryWeapon={character.secondaryWeapon}
        onUpdateSecondaryWeapon={handleUpdateSecondaryWeapon}
      />

      {/* Insanity Panel - Second Retractable Sidebar */}
      <InsanityPanel
        insanities={character.insanities}
        paranormalPowers={character.paranormalPowers}
        onInsanityAdd={handleAddInsanity}
        onInsanityRemove={handleRemoveInsanity}
        onInsanityUpdate={handleUpdateInsanity}
        onPowerAdd={handleAddPower}
        onPowerRemove={handleRemovePower}
        onPowerUpdate={handleUpdatePower}
      />
    </div>
  );
}
