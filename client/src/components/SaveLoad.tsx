import { Download, Upload } from 'lucide-react';
import { useRef } from 'react';

interface SaveLoadProps {
  characterData: any;
  onLoadCharacter: (data: any) => void;
}

export default function SaveLoad({ characterData, onLoadCharacter }: SaveLoadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const dataToSave = {
      name: characterData.name,
      attributes: characterData.attributes,
      skills: characterData.skills,
      pericias: characterData.pericias,
      hp: characterData.hp,
      sanity: characterData.sanity,
      damageThresholds: characterData.damageThresholds,
      hope: characterData.hope,
      armor: characterData.armor,
      evasion: characterData.evasion,
      inventory: characterData.inventory,
      primaryWeapon: characterData.primaryWeapon,
      secondaryWeapon: characterData.secondaryWeapon,
      insanities: characterData.insanities,
      paranormalPowers: characterData.paranormalPowers,
    };

    const jsonString = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ficha-${characterData.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        onLoadCharacter(data);
        alert('Ficha carregada com sucesso!');
      } catch (error) {
        alert('Erro ao carregar a ficha. Verifique se o arquivo é válido.');
        console.error(error);
      }
    };
    reader.readAsText(file);

    // Reset input para permitir carregar o mesmo arquivo novamente
    event.target.value = '';
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleSave}
        className="flex-1 py-2 px-3 bg-primary text-black font-bold uppercase text-xs border-2 border-primary hover:bg-black hover:text-primary transition-all flex items-center justify-center gap-2"
        title="Salvar ficha em arquivo JSON"
      >
        <Download size={16} />
        SALVAR
      </button>

      <button
        onClick={handleLoadClick}
        className="flex-1 py-2 px-3 bg-black text-primary font-bold uppercase text-xs border-2 border-primary hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-2"
        title="Carregar ficha de arquivo JSON"
      >
        <Upload size={16} />
        CARREGAR
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
