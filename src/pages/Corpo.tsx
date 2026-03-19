import { useState } from "react";
import { 
  Scale, 
  Camera, 
  Flame, 
  Utensils, 
  Activity, 
  Footprints, 
  TrendingDown,
  Droplets,
  ChevronRight,
  Plus,
  History
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/Modal";

// Dados simulados para o gráfico de peso
const weightData = [
  { day: "01", peso: 84.5 },
  { day: "04", peso: 84.2 },
  { day: "07", peso: 83.8 },
  { day: "10", peso: 83.9 },
  { day: "13", peso: 83.1 },
  { day: "16", peso: 82.7 },
  { day: "18", peso: 82.4 },
];

export function Corpo() {
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isMeasurementsModalOpen, setIsMeasurementsModalOpen] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [selectedMacro, setSelectedMacro] = useState<string | null>(null);

  const handleNewPhoto = () => {
    console.log("Abrindo câmera para nova foto...");
    alert("Funcionalidade de câmera será implementada com Firebase Storage.");
  };

  const handleRegisterMeasurements = () => {
    setIsMeasurementsModalOpen(true);
  };

  const handleRegisterWeight = () => {
    setIsWeightModalOpen(true);
  };

  const handleViewPhotos = () => {
    console.log("Abrindo galeria de fotos...");
    alert("Galeria de fotos em desenvolvimento.");
  };

  const handleSyncHealth = (metric: string) => {
    console.log(`Sincronizando ${metric} com Apple Health...`);
    alert(`Sincronização de "${metric}" com Apple Health em desenvolvimento.`);
  };

  const handleLogFood = (macro: string) => {
    setSelectedMacro(macro);
    setIsFoodModalOpen(true);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Pilar 1</div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-primary">Corpo & Saúde</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleNewPhoto}
            className="bg-surface border border-surface-border text-primary px-5 py-2.5 rounded-full font-medium hover:bg-surface-hover transition-colors flex items-center gap-2 shadow-sm"
          >
            <Camera className="w-4 h-4" />
            Nova Foto
          </button>
          <button 
            onClick={handleRegisterMeasurements}
            className="bg-primary text-white px-5 py-2.5 rounded-full font-medium hover:bg-primary/90 transition-colors shadow-md"
          >
            Registrar Medidas
          </button>
        </div>
      </header>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          label="Peso Atual" 
          value="82.4 kg" 
          subtext="-2.1 kg no ciclo" 
          icon={Scale} 
          trend="down" 
          onClick={handleRegisterWeight}
        />
        <MetricCard label="Média Semanal" value="82.7 kg" subtext="Estável" icon={Activity} onClick={() => alert("Visualizando histórico de peso...")} />
        <MetricCard label="Gordura Est." value="16.5%" subtext="Meta: 12%" icon={TrendingDown} trend="down" onClick={handleRegisterMeasurements} />
        <MetricCard label="Passos (Média)" value="10.2k" subtext="Últimos 7 dias" icon={Footprints} onClick={() => handleSyncHealth("Passos")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Chart & Fitness */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Weight Chart */}
          <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl font-semibold text-secondary">Tendência de Peso</h2>
              <select className="bg-background border border-surface-border text-sm rounded-lg px-3 py-1.5 outline-none focus:border-primary">
                <option>Últimos 18 dias</option>
                <option>Últimos 30 dias</option>
                <option>Ciclo Completo</option>
              </select>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E2D9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    domain={['dataMin - 1', 'dataMax + 1']} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'JetBrains Mono' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1A1A1A', 
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ color: '#00e5ff', fontFamily: 'JetBrains Mono' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="peso" 
                    stroke="#0A2540" 
                    strokeWidth={3}
                    dot={{ fill: '#0A2540', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#00e5ff', stroke: '#0A2540' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Apple Fitness Averages */}
          <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
            <h2 className="font-serif text-2xl font-semibold text-secondary mb-6">Médias do Apple Fitness</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <FitnessRing 
                label="Calorias Ativas" 
                value="750" 
                unit="kcal" 
                target="800" 
                color="bg-orange-500" 
                icon={Flame} 
                onClick={() => handleSyncHealth("Calorias Ativas")}
              />
              <FitnessRing 
                label="Exercício" 
                value="55" 
                unit="min" 
                target="60" 
                color="bg-emerald-500" 
                icon={Activity} 
                onClick={() => handleSyncHealth("Exercício")}
              />
              <FitnessRing 
                label="Em pé" 
                value="12" 
                unit="hrs" 
                target="12" 
                color="bg-blue-500" 
                icon={Activity} 
                onClick={() => handleSyncHealth("Em pé")}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Nutrition & Photos */}
        <div className="space-y-8">
          
          {/* Nutrition Macros */}
          <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-background border border-surface-border rounded-xl">
                <Utensils className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-secondary">Nutrição Hoje</h2>
            </div>

            <div className="space-y-6">
              <MacroBar label="Proteínas" current={145} target={180} unit="g" color="bg-primary" onClick={() => handleLogFood("Proteínas")} />
              <MacroBar label="Carboidratos" current={120} target={200} unit="g" color="bg-blue-400" onClick={() => handleLogFood("Carboidratos")} />
              <MacroBar label="Gorduras" current={55} target={70} unit="g" color="bg-yellow-500" onClick={() => handleLogFood("Gorduras")} />
              
              <div className="pt-4 border-t border-surface-border mt-4">
                <MacroBar label="Calorias Totais" current={1850} target={2200} unit="kcal" color="bg-secondary" onClick={() => handleLogFood("Calorias")} />
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-background rounded-2xl border border-surface-border flex items-start gap-3">
              <Droplets className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-secondary">Água: 2.0L / 3.0L</div>
                <div className="text-xs text-text-muted mt-1">Você está no ritmo certo para bater a meta hoje.</div>
              </div>
            </div>
          </div>

          {/* Progress Photos Placeholder */}
          <div 
            onClick={handleViewPhotos}
            className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm group cursor-pointer hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-semibold text-secondary">Fotos de Progresso</h2>
              <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-[3/4] bg-background rounded-xl border border-surface-border flex flex-col items-center justify-center text-text-muted relative overflow-hidden">
                <span className="text-xs font-mono absolute top-3 left-3 bg-surface/80 px-2 py-1 rounded-md backdrop-blur-sm">Dia 01</span>
                <Camera className="w-6 h-6 opacity-20" />
              </div>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  handleNewPhoto();
                }}
                className="aspect-[3/4] bg-background rounded-xl border border-dashed border-surface-border flex flex-col items-center justify-center text-text-muted hover:bg-surface-hover transition-colors"
              >
                <Camera className="w-6 h-6 mb-2 text-primary/50" />
                <span className="text-xs font-medium">Adicionar</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={isWeightModalOpen} 
        onClose={() => setIsWeightModalOpen(false)} 
        title="Registrar Peso"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-8 bg-background rounded-2xl border border-surface-border">
            <Scale className="w-12 h-12 text-primary mb-4 opacity-20" />
            <div className="flex items-baseline gap-2">
              <input 
                type="number" 
                step="0.1" 
                placeholder="00.0" 
                className="text-5xl font-serif font-bold text-secondary bg-transparent border-none outline-none w-32 text-center focus:ring-0"
                autoFocus
              />
              <span className="text-2xl font-serif text-text-muted">kg</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-background border border-surface-border rounded-2xl text-sm font-medium hover:bg-surface-hover transition-colors flex items-center justify-center gap-2">
              <History className="w-4 h-4" />
              Histórico
            </button>
            <button 
              onClick={() => {
                alert("Peso registrado com sucesso!");
                setIsWeightModalOpen(false);
              }}
              className="p-4 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md"
            >
              Salvar Peso
            </button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isMeasurementsModalOpen} 
        onClose={() => setIsMeasurementsModalOpen(false)} 
        title="Medidas Corporais"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <MeasurementInput label="Cintura" unit="cm" />
            <MeasurementInput label="Peito" unit="cm" />
            <MeasurementInput label="Braço (E)" unit="cm" />
            <MeasurementInput label="Braço (D)" unit="cm" />
            <MeasurementInput label="Coxa (E)" unit="cm" />
            <MeasurementInput label="Coxa (D)" unit="cm" />
            <MeasurementInput label="Gordura Est." unit="%" />
            <MeasurementInput label="Massa Muscular" unit="kg" />
          </div>
          <button 
            onClick={() => {
              alert("Medidas salvas com sucesso!");
              setIsMeasurementsModalOpen(false);
            }}
            className="w-full p-4 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md"
          >
            Salvar Todas as Medidas
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={isFoodModalOpen} 
        onClose={() => setIsFoodModalOpen(false)} 
        title={`Registrar ${selectedMacro}`}
      >
        <div className="space-y-6">
          <div className="p-6 bg-background rounded-2xl border border-surface-border">
            <div className="flex items-center gap-3 mb-4">
              <Utensils className="w-5 h-5 text-primary" />
              <span className="font-medium text-secondary">Adicionar quantidade</span>
            </div>
            <div className="flex items-baseline gap-2">
              <input 
                type="number" 
                placeholder="0" 
                className="text-4xl font-serif font-bold text-secondary bg-transparent border-none outline-none w-24 focus:ring-0"
                autoFocus
              />
              <span className="text-xl font-serif text-text-muted">{selectedMacro === 'Calorias' ? 'kcal' : 'g'}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="text-xs font-bold text-text-muted uppercase tracking-widest px-1">Sugestões Rápidas</div>
            <div className="flex flex-wrap gap-2">
              {[10, 20, 30, 50].map(val => (
                <button key={val} className="px-4 py-2 bg-background border border-surface-border rounded-xl text-sm hover:bg-surface-hover transition-colors">
                  +{val}{selectedMacro === 'Calorias' ? '' : 'g'}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => {
              alert(`${selectedMacro} registrado com sucesso!`);
              setIsFoodModalOpen(false);
            }}
            className="w-full p-4 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md"
          >
            Confirmar Registro
          </button>
        </div>
      </Modal>
    </div>
  );
}

function MeasurementInput({ label, unit }: { label: string, unit: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-text-muted uppercase tracking-widest px-1">{label}</label>
      <div className="relative">
        <input 
          type="number" 
          step="0.1"
          placeholder="0.0" 
          className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-secondary font-mono focus:border-primary outline-none transition-colors"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-text-muted">{unit}</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subtext, icon: Icon, trend, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-surface border border-surface-border rounded-2xl p-5 shadow-sm transition-all",
        onClick && "cursor-pointer hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="text-xs font-bold text-text-muted uppercase tracking-widest">{label}</div>
        <Icon className="w-4 h-4 text-text-muted" />
      </div>
      <div className="text-2xl font-serif font-semibold text-secondary mb-1">{value}</div>
      <div className={cn(
        "text-xs font-medium",
        trend === 'down' ? "text-emerald-600" : trend === 'up' ? "text-red-500" : "text-text-muted"
      )}>
        {subtext}
      </div>
    </div>
  );
}

function MacroBar({ label, current, target, unit, color, onClick }: any) {
  const percentage = Math.min(100, (current / target) * 100);
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group transition-all",
        onClick && "cursor-pointer hover:opacity-80"
      )}
    >
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">{label}</span>
        <div className="text-sm">
          <span className="font-mono font-bold text-primary">{current}</span>
          <span className="text-text-muted font-mono text-xs ml-1">/ {target}{unit}</span>
        </div>
      </div>
      <div className="h-2.5 w-full bg-background rounded-full overflow-hidden border border-surface-border">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function FitnessRing({ label, value, unit, target, color, icon: Icon, onClick }: any) {
  const percentage = Math.min(100, (Number(value) / Number(target)) * 100);
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center p-4 bg-background rounded-2xl border border-surface-border transition-all",
        onClick && "cursor-pointer hover:border-primary/30 hover:shadow-sm active:scale-[0.98]"
      )}
    >
      <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90 absolute inset-0">
          <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-surface-border" />
          <circle 
            cx="40" cy="40" r="36" 
            stroke="currentColor" 
            strokeWidth="6" 
            fill="transparent" 
            strokeDasharray="226" 
            strokeDashoffset={226 - (226 * percentage) / 100}
            strokeLinecap="round"
            className={color.replace('bg-', 'text-')} 
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <Icon className={cn("w-6 h-6", color.replace('bg-', 'text-'))} />
      </div>
      <div className="text-center">
        <div className="font-mono font-bold text-xl text-secondary">{value}</div>
        <div className="text-xs text-text-muted font-medium uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}
