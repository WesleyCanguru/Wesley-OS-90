import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  UploadCloud, 
  Activity, 
  Flame, 
  Timer, 
  Footprints, 
  CheckCircle2, 
  ArrowRight, 
  Image as ImageIcon,
  Loader2,
  Utensils,
  Dumbbell,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

export function Ontem() {
  const navigate = useNavigate();
  const user = useUser();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estados para os dados extraídos
  const [fitnessData, setFitnessData] = useState({
    caloriasAtivas: "",
    caloriasTotais: "",
    minutosExercicio: "",
    horasEmPe: "",
    passos: "",
  });

  // Estados para fechamento manual
  const [treinoFeito, setTreinoFeito] = useState<boolean | null>(null);
  const [dietaAderente, setDietaAderente] = useState<boolean | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setStep(2); // Vai para o estado de "Analisando"
    setLoading(true);

    try {
      // 1. Upload para o Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.name}/${Date.now()}.${fileExt}`;
      const filePath = `progress-photos/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('progress-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(filePath);

      setPhotoUrl(publicUrl);

      // 2. Simula o tempo de processamento de uma IA lendo a imagem (OCR)
      await new Promise(resolve => setTimeout(resolve, 2000));

      setFitnessData({
        caloriasAtivas: "840",
        caloriasTotais: "2950",
        minutosExercicio: "65",
        horasEmPe: "12",
        passos: "11240",
      });
      setStep(3); // Vai para o estado de "Revisão"
    } catch (error) {
      console.error("Erro no upload/processamento:", error);
      alert("Erro ao processar imagem. Tente novamente.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const closureData = {
        user_name: user.name,
        date: yesterdayStr,
        notes: observacoes,
        photo_url: photoUrl,
        active_calories: parseInt(fitnessData.caloriasAtivas) || 0,
        total_calories: parseInt(fitnessData.caloriasTotais) || 0,
        exercise_minutes: parseInt(fitnessData.minutosExercicio) || 0,
        stand_hours: parseInt(fitnessData.horasEmPe) || 0,
        steps: parseInt(fitnessData.passos) || 0,
        workout_done: treinoFeito,
        diet_adherence: dietaAderente,
      };

      const { error } = await supabase
        .from('daily_closures')
        .insert([closureData]);

      if (error) throw error;

      navigate("/");
    } catch (error) {
      console.error("Erro ao salvar fechamento:", error);
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const formattedYesterday = yesterdayDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Fechamento do Dia</div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-primary">Ontem, {formattedYesterday}</h1>
        </div>
        {step === 3 && (
          <button 
            onClick={handleFinish}
            disabled={saving}
            className="bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Concluir Fechamento"}
            {!saving && <CheckCircle2 className="w-4 h-4" />}
          </button>
        )}
      </header>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="bg-surface border border-surface-border rounded-3xl p-12 shadow-sm text-center">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <UploadCloud className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-secondary">Upload do Apple Fitness</h2>
            <p className="text-text-muted text-lg">
              Envie o print do seu resumo diário do Apple Watch para extração automática dos dados.
            </p>
            
            <label className="w-full bg-background border-2 border-dashed border-surface-border hover:border-primary/50 hover:bg-surface-hover transition-all rounded-2xl p-8 flex flex-col items-center justify-center gap-3 group cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
              />
              <ImageIcon className="w-8 h-8 text-text-muted group-hover:text-primary transition-colors" />
              <span className="font-medium text-secondary">Clique para selecionar a imagem</span>
              <span className="text-sm text-text-muted">PNG, JPG até 5MB</span>
            </label>
          </div>
        </div>
      )}

      {/* Step 2: Processing */}
      {step === 2 && (
        <div className="bg-surface border border-surface-border rounded-3xl p-20 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <div>
            <h2 className="font-serif text-2xl font-semibold text-secondary mb-2">Analisando imagem...</h2>
            <p className="text-text-muted">A inteligência artificial está extraindo suas métricas.</p>
          </div>
        </div>
      )}

      {/* Step 3: Review & Manual Input */}
      {step === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* Left Column: Extracted Data */}
          <div className="space-y-6">
            <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-serif text-2xl font-semibold text-secondary">Dados Extraídos</h2>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-wider">Sucesso</span>
              </div>

              <div className="space-y-5">
                <MetricInput 
                  icon={Flame} 
                  label="Calorias Ativas" 
                  value={fitnessData.caloriasAtivas} 
                  unit="kcal"
                  onChange={(v) => setFitnessData({...fitnessData, caloriasAtivas: v})}
                  color="text-orange-500"
                />
                <MetricInput 
                  icon={Activity} 
                  label="Calorias Totais" 
                  value={fitnessData.caloriasTotais} 
                  unit="kcal"
                  onChange={(v) => setFitnessData({...fitnessData, caloriasTotais: v})}
                  color="text-red-500"
                />
                <MetricInput 
                  icon={Timer} 
                  label="Exercício" 
                  value={fitnessData.minutosExercicio} 
                  unit="min"
                  onChange={(v) => setFitnessData({...fitnessData, minutosExercicio: v})}
                  color="text-emerald-500"
                />
                <MetricInput 
                  icon={Footprints} 
                  label="Passos" 
                  value={fitnessData.passos} 
                  unit="passos"
                  onChange={(v) => setFitnessData({...fitnessData, passos: v})}
                  color="text-blue-500"
                />
              </div>
              
              <p className="text-xs text-text-muted mt-6 text-center">
                Você pode corrigir os valores manualmente se a leitura estiver incorreta.
              </p>
            </div>
          </div>

          {/* Right Column: Manual Confirmation */}
          <div className="space-y-6">
            <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm space-y-8">
              <h2 className="font-serif text-2xl font-semibold text-secondary mb-2">Confirmação Manual</h2>
              
              {/* Treino */}
              <div>
                <label className="flex items-center gap-2 text-text-muted font-medium mb-3">
                  <Dumbbell className="w-5 h-5" />
                  Treino Realizado?
                </label>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setTreinoFeito(true)}
                    className={cn(
                      "flex-1 py-3 rounded-xl border font-medium transition-all",
                      treinoFeito === true 
                        ? "bg-primary border-primary text-white shadow-sm" 
                        : "bg-background border-surface-border text-text-muted hover:border-primary/50"
                    )}
                  >
                    Sim
                  </button>
                  <button 
                    onClick={() => setTreinoFeito(false)}
                    className={cn(
                      "flex-1 py-3 rounded-xl border font-medium transition-all",
                      treinoFeito === false 
                        ? "bg-red-500 border-red-500 text-white shadow-sm" 
                        : "bg-background border-surface-border text-text-muted hover:border-red-500/50"
                    )}
                  >
                    Não
                  </button>
                </div>
              </div>

              {/* Dieta */}
              <div>
                <label className="flex items-center gap-2 text-text-muted font-medium mb-3">
                  <Utensils className="w-5 h-5" />
                  Aderência à Dieta?
                </label>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setDietaAderente(true)}
                    className={cn(
                      "flex-1 py-3 rounded-xl border font-medium transition-all",
                      dietaAderente === true 
                        ? "bg-primary border-primary text-white shadow-sm" 
                        : "bg-background border-surface-border text-text-muted hover:border-primary/50"
                    )}
                  >
                    Sim
                  </button>
                  <button 
                    onClick={() => setDietaAderente(false)}
                    className={cn(
                      "flex-1 py-3 rounded-xl border font-medium transition-all",
                      dietaAderente === false 
                        ? "bg-red-500 border-red-500 text-white shadow-sm" 
                        : "bg-background border-surface-border text-text-muted hover:border-red-500/50"
                    )}
                  >
                    Não
                  </button>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-text-muted font-medium mb-3">
                  Observações do dia
                </label>
                <textarea 
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Como você se sentiu? Algum imprevisto?"
                  className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none h-24"
                />
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function MetricInput({ icon: Icon, label, value, unit, onChange, color }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-background border border-surface-border hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-surface shadow-sm", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-medium text-secondary">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <input 
          type="text" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 text-right bg-transparent font-mono font-bold text-lg text-primary focus:outline-none focus:border-b-2 focus:border-primary"
        />
        <span className="text-sm text-text-muted font-mono">{unit}</span>
      </div>
    </div>
  );
}
