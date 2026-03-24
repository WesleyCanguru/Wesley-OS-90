import { useState, useEffect } from "react";
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
  History,
  Loader2,
  Sparkles
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/Modal";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

import { calculateMacros } from "@/services/geminiService";
import { getCycleInfo } from "@/lib/cycle";

export function Corpo() {
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isMeasurementsModalOpen, setIsMeasurementsModalOpen] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [mealDescription, setMealDescription] = useState("");
  const [mealTime, setMealTime] = useState("Café da Manhã");
  const [isCalculatingMacros, setIsCalculatingMacros] = useState(false);
  const [selectedMacro, setSelectedMacro] = useState<string | null>(null);
  const [viewingGallery, setViewingGallery] = useState(false);
  const [viewingMeals, setViewingMeals] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [chartTab, setChartTab] = useState<"composicao" | "medidas">("composicao");
  
  const [weight, setWeight] = useState<number>(0);
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any>({});
  const [foodLogs, setFoodLogs] = useState<any[]>([]);
  
  const [newWeight, setNewWeight] = useState("");
  const [newFoodAmount, setNewFoodAmount] = useState("");
  const [newProtein, setNewProtein] = useState("");
  const [newCarbs, setNewCarbs] = useState("");
  const [newFats, setNewFats] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMeasurementDate, setSelectedMeasurementDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user) {
      fetchBodyData();
      setAiFeedback(null); // Clear feedback when date changes
    }
  }, [user, selectedDate]);

  const fetchBodyData = async () => {
    if (!user) return;
    try {
      // 1. Fetch Weight History
      const { data: stats, error: statsError } = await supabase
        .from('body_stats')
        .select('*')
        .eq('user_name', user.name)
        .order('created_at', { ascending: true });

      if (stats && stats.length > 0) {
        const history = stats.map(s => ({
          day: new Date(s.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          peso: s.weight,
          photo_url: s.measurements?.photo_url,
          bf: s.measurements?.bf ? parseFloat(s.measurements.bf) : null,
          muscle: s.measurements?.muscle ? parseFloat(s.measurements.muscle) : null,
          waist: s.measurements?.waist ? parseFloat(s.measurements.waist) : null,
          chest: s.measurements?.chest ? parseFloat(s.measurements.chest) : null,
          armL: s.measurements?.armL ? parseFloat(s.measurements.armL) : null,
          armR: s.measurements?.armR ? parseFloat(s.measurements.armR) : null,
          thighL: s.measurements?.thighL ? parseFloat(s.measurements.thighL) : null,
          thighR: s.measurements?.thighR ? parseFloat(s.measurements.thighR) : null,
        }));
        setWeightHistory(history);
        setWeight(stats[stats.length - 1].weight);
        setMeasurements(stats[stats.length - 1].measurements || {});
      }

      // 2. Fetch Food Logs for selectedDate
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: foods, error: foodsError } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_name', user.name)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      if (foods) {
        setFoodLogs(foods);
      }
    } catch (error) {
      console.error("Erro ao buscar dados corporais:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWeight = async () => {
    if (!newWeight || !user) return;
    try {
      const { error } = await supabase
        .from('body_stats')
        .insert([{
          user_name: user.name,
          weight: parseFloat(newWeight),
          measurements: measurements // Keep existing measurements
        }]);

      if (error) throw error;
      
      setIsWeightModalOpen(false);
      setNewWeight("");
      fetchBodyData();
    } catch (error) {
      console.error("Erro ao salvar peso:", error);
      alert("Erro ao salvar peso.");
    }
  };

  const handleSaveMeasurements = async () => {
    if (!user) return;
    try {
      const insertDate = new Date(selectedMeasurementDate);
      insertDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

      await supabase.from('body_stats').insert([{ 
        user_name: user.name, 
        weight: weight, 
        measurements: measurements,
        created_at: insertDate.toISOString()
      }]);
      alert("Medidas salvas com sucesso!");
      setIsMeasurementsModalOpen(false);
      fetchBodyData();
    } catch (e) {
      alert("Erro ao salvar medidas.");
    }
  };

  const handleSaveFood = async () => {
    if (!newFoodAmount || !user) return;
    try {
      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();
      const insertDate = isToday ? now : new Date(selectedDate.setHours(12, 0, 0, 0));

      const { error } = await supabase
        .from('food_logs')
        .insert([{
          user_name: user.name,
          name: `[Avulso] ${selectedMacro}`,
          calories: selectedMacro === 'Calorias' ? parseInt(newFoodAmount) : (selectedMacro === 'Gorduras' ? parseFloat(newFoodAmount) * 9 : parseFloat(newFoodAmount) * 4),
          protein: selectedMacro === 'Proteínas' ? parseFloat(newFoodAmount) : 0,
          carbs: selectedMacro === 'Carboidratos' ? parseFloat(newFoodAmount) : 0,
          fat: selectedMacro === 'Gorduras' ? parseFloat(newFoodAmount) : 0,
          created_at: insertDate.toISOString()
        }]);

      if (error) throw error;
      
      setIsFoodModalOpen(false);
      setNewFoodAmount("");
      fetchBodyData();
    } catch (error) {
      console.error("Erro ao salvar alimento:", error);
      alert("Erro ao salvar alimento.");
    }
  };

  const handleSaveMeal = async () => {
    if (!mealDescription || !user) return;
    setIsCalculatingMacros(true);
    try {
      const macros = await calculateMacros(mealDescription);
      if (macros) {
        const now = new Date();
        const isToday = selectedDate.toDateString() === now.toDateString();
        const insertDate = isToday ? now : new Date(selectedDate.setHours(12, 0, 0, 0));

        const { error } = await supabase.from('food_logs').insert([{
          user_name: user.name,
          name: `[${mealTime}] ${macros.name || "Refeição"}`,
          calories: Math.round(Number(macros.calories)),
          protein: Math.round(Number(macros.protein)),
          carbs: Math.round(Number(macros.carbs)),
          fat: Math.round(Number(macros.fats)),
          created_at: insertDate.toISOString()
        }]);
        if (error) throw error;
        setIsMealModalOpen(false);
        setMealDescription("");
        fetchBodyData();
      } else {
        alert("Não foi possível calcular os macros. Tente novamente.");
      }
    } catch (error: any) {
      console.error("Erro ao salvar refeição:", error);
      alert(`Erro ao salvar refeição: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsCalculatingMacros(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploadingPhoto(true);
    try {
      // Compress image
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const base64Image = canvas.toDataURL('image/jpeg', 0.7);
          
          // Save to body_stats
          const newMeasurements = { ...measurements, photo_url: base64Image };
          const { error } = await supabase.from('body_stats').insert([{
            user_name: user.name,
            weight: weight,
            measurements: newMeasurements
          }]);
          
          if (error) throw error;
          fetchBodyData();
          setUploadingPhoto(false);
          alert("Foto salva com sucesso!");
        };
      };
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
      alert("Erro ao fazer upload da foto.");
      setUploadingPhoto(false);
    }
  };

  const handleNewPhoto = () => {
    document.getElementById('photo-upload')?.click();
  };

  const handleRegisterMeasurements = () => {
    setIsMeasurementsModalOpen(true);
  };

  const handleRegisterWeight = () => {
    setIsWeightModalOpen(true);
  };

  const handleViewPhotos = () => {
    setViewingGallery(true);
  };

  const handleSyncHealth = (metric: string) => {
    console.log(`Sincronizando ${metric} com Apple Health...`);
    alert(`Sincronização de "${metric}" com Apple Health em desenvolvimento.`);
  };

  const nutritionTargets = user?.name === 'Sarah' 
    ? { calories: 1200, protein: 96, carbs: 135, fats: 30 }
    : { calories: 2200, protein: 180, carbs: 170, fats: 80 }; // Wesley's targets

  useEffect(() => {
    const generateFeedback = async () => {
      if (viewingMeals && !aiFeedback && foodLogs.length > 0 && !generatingFeedback) {
        setGeneratingFeedback(true);
        try {
          const { generateDailyFeedback } = await import('@/services/geminiService');
          const feedback = await generateDailyFeedback(foodLogs, nutritionTargets);
          setAiFeedback(feedback);
        } catch (error) {
          console.error("Erro ao gerar feedback:", error);
        } finally {
          setGeneratingFeedback(false);
        }
      }
    };
    generateFeedback();
  }, [viewingMeals, foodLogs, aiFeedback, generatingFeedback, nutritionTargets]);

  const handleLogFood = (macro: string) => {
    setSelectedMacro(macro);
    setIsFoodModalOpen(true);
  };

  const handleViewMeals = () => {
    setViewingMeals(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalCalories = foodLogs.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const totalProteins = foodLogs.reduce((acc, curr) => acc + (curr.protein || 0), 0);
  const totalCarbs = foodLogs.reduce((acc, curr) => acc + (curr.carbs || 0), 0);
  const totalFats = foodLogs.reduce((acc, curr) => acc + (curr.fat || 0), 0);

  const photos = weightHistory.filter(h => h.photo_url).map(h => ({
    day: h.day,
    url: h.photo_url,
    weight: h.peso
  }));

  if (viewingMeals) {
    // Group meals by meal time (prefix in name)
    const groupedMeals = foodLogs.reduce((acc, log) => {
      const match = log.name?.match(/^\[(.*?)\]\s*(.*)$/);
      const time = match ? match[1] : 'Outros';
      const desc = match ? match[2] : log.name;
      
      if (!acc[time]) acc[time] = [];
      acc[time].push({ ...log, desc });
      return acc;
    }, {} as Record<string, any[]>);

    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button onClick={() => setViewingMeals(false)} className="text-text-muted hover:text-primary flex items-center gap-2 mb-2">
              <ChevronRight className="w-4 h-4 rotate-180" />
              Voltar
            </button>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-serif font-semibold text-primary">Refeições</h1>
              <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm border border-border">
                <button onClick={() => {
                  const prev = new Date(selectedDate);
                  prev.setDate(prev.getDate() - 1);
                  setSelectedDate(prev);
                }} className="p-1 hover:bg-background rounded-full text-text-muted hover:text-primary transition-colors">
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <span className="text-sm font-medium text-text-primary min-w-[100px] text-center">
                  {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
                <button onClick={() => {
                  const next = new Date(selectedDate);
                  next.setDate(next.getDate() + 1);
                  setSelectedDate(next);
                }} className="p-1 hover:bg-background rounded-full text-text-muted hover:text-primary transition-colors" disabled={selectedDate.toDateString() === new Date().toDateString()}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsMealModalOpen(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-full font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-md self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nova Refeição
          </button>
        </header>

        {/* AI Feedback Section */}
        <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-serif font-semibold text-secondary mb-2">Feedback da Nutri (IA)</h3>
              {generatingFeedback ? (
                <div className="flex items-center gap-2 text-text-muted text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analisando seu dia...
                </div>
              ) : aiFeedback ? (
                <div className="text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                  {aiFeedback}
                </div>
              ) : (
                <p className="text-text-muted text-sm">Adicione refeições para receber um feedback.</p>
              )}
            </div>
          </div>
        </div>

        {/* Meals List */}
        <div className="space-y-6">
          {Object.keys(groupedMeals).length === 0 ? (
            <div className="py-12 text-center text-text-muted bg-surface rounded-3xl border border-surface-border">
              Nenhuma refeição registrada {selectedDate.toDateString() === new Date().toDateString() ? "hoje" : "neste dia"}.
            </div>
          ) : (
            Object.entries(groupedMeals).map(([time, meals]) => (
              <div key={time} className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-serif font-semibold text-secondary mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  {time}
                </h3>
                <div className="space-y-4">
                  {meals.map((meal, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-background rounded-2xl border border-surface-border">
                      <div className="flex-1">
                        <p className="font-medium text-secondary">{meal.desc}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-muted">
                          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-secondary" /> {meal.calories} kcal</span>
                          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> {meal.protein}g prot</span>
                          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400" /> {meal.carbs}g carb</span>
                          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500" /> {meal.fat}g gord</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <Modal 
          isOpen={isMealModalOpen} 
          onClose={() => !isCalculatingMacros && setIsMealModalOpen(false)} 
          title="Registrar Refeição (IA)"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest px-1">Qual refeição?</label>
              <select
                value={mealTime}
                onChange={(e) => setMealTime(e.target.value)}
                disabled={isCalculatingMacros}
                className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-text-main"
              >
                <option value="Café da Manhã">Café da Manhã</option>
                <option value="Almoço">Almoço</option>
                <option value="Café da Tarde">Café da Tarde</option>
                <option value="Jantar">Jantar</option>
                <option value="Lanches">Lanches/Outros</option>
              </select>
            </div>

            <div className="p-1 bg-background rounded-2xl border border-surface-border">
              <textarea 
                placeholder="Ex: 80g de arroz, 40g de feijão, 130g de frango grelhado..." 
                value={mealDescription}
                onChange={(e) => setMealDescription(e.target.value)}
                className="w-full h-32 bg-transparent border-none outline-none p-4 text-secondary resize-none focus:ring-0"
                disabled={isCalculatingMacros}
              />
            </div>
            
            <button 
              onClick={handleSaveMeal}
              disabled={isCalculatingMacros || !mealDescription}
              className="w-full p-4 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCalculatingMacros ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Calculando Macros...
                </>
              ) : (
                "Calcular e Salvar"
              )}
            </button>
          </div>
        </Modal>
      </div>
    );
  }

  if (viewingGallery) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        <header className="flex items-center justify-between">
          <div>
            <button onClick={() => setViewingGallery(false)} className="text-text-muted hover:text-primary flex items-center gap-2 mb-2">
              <ChevronRight className="w-4 h-4 rotate-180" />
              Voltar
            </button>
            <h1 className="text-3xl font-serif font-semibold text-primary">Galeria de Progresso</h1>
          </div>
          <button 
            onClick={handleNewPhoto}
            className="bg-primary text-white px-5 py-2.5 rounded-full font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-md"
          >
            <Camera className="w-4 h-4" />
            Nova Foto
          </button>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.length === 0 ? (
            <div className="col-span-full py-12 text-center text-text-muted">
              Nenhuma foto registrada ainda.
            </div>
          ) : (
            photos.map((photo, i) => (
              <div key={i} className="aspect-[3/4] bg-surface rounded-2xl border border-surface-border overflow-hidden relative group">
                <img src={photo.url} alt={`Progresso ${photo.day}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <span className="text-white font-bold">{photo.day}</span>
                  <span className="text-white/80 text-sm">{photo.weight} kg</span>
                </div>
              </div>
            ))
          )}
        </div>
        <input 
          type="file" 
          id="photo-upload" 
          accept="image/*" 
          className="hidden" 
          onChange={handlePhotoUpload} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      <input 
        type="file" 
        id="photo-upload" 
        accept="image/*" 
        className="hidden" 
        onChange={handlePhotoUpload} 
      />
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
          value={`${weight} kg`} 
          subtext="Meta: 78 kg" 
          icon={Scale} 
          trend="down" 
          onClick={handleRegisterWeight}
        />
        <MetricCard label="Média Semanal" value={`${weight} kg`} subtext="Estável" icon={Activity} onClick={() => alert("Visualizando histórico de peso...")} />
        <MetricCard label="Gordura Est." value={`${measurements.bf || '0'}%`} subtext="Meta: 12%" icon={TrendingDown} trend="down" onClick={handleRegisterMeasurements} />
        <MetricCard label="Passos (Média)" value="10.2k" subtext="Últimos 7 dias" icon={Footprints} onClick={() => handleSyncHealth("Passos")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Chart & Fitness */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Weight Chart */}
          <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl font-semibold text-secondary">Evolução</h2>
              <div className="flex bg-background border border-surface-border rounded-lg p-1">
                <button 
                  onClick={() => setChartTab("composicao")}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                    chartTab === "composicao" ? "bg-white shadow-sm text-secondary" : "text-text-muted hover:text-secondary"
                  )}
                >
                  Composição
                </button>
                <button 
                  onClick={() => setChartTab("medidas")}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                    chartTab === "medidas" ? "bg-white shadow-sm text-secondary" : "text-text-muted hover:text-secondary"
                  )}
                >
                  Medidas
                </button>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightHistory.length > 0 ? weightHistory : [{day: '01', peso: weight, bf: measurements.bf, muscle: measurements.muscle}]} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E2D9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
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
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  
                  {chartTab === "composicao" ? (
                    <>
                      <Line name="Peso (kg)" type="monotone" dataKey="peso" stroke="#0A2540" strokeWidth={3} dot={{ fill: '#0A2540', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} connectNulls />
                      <Line name="Músculo (kg)" type="monotone" dataKey="muscle" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} connectNulls />
                      <Line name="Gordura (%)" type="monotone" dataKey="bf" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} connectNulls />
                    </>
                  ) : (
                    <>
                      <Line name="Cintura" type="monotone" dataKey="waist" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                      <Line name="Peito" type="monotone" dataKey="chest" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                      <Line name="Braço (E)" type="monotone" dataKey="armL" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                      <Line name="Braço (D)" type="monotone" dataKey="armR" stroke="#d946ef" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                      <Line name="Coxa (E)" type="monotone" dataKey="thighL" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                      <Line name="Coxa (D)" type="monotone" dataKey="thighR" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Resumo de Medidas */}
            <div className="mt-8 pt-6 border-t border-surface-border">
              <h3 className="text-sm font-semibold text-secondary mb-4 uppercase tracking-wider">Resumo Atual</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-background p-3 rounded-xl border border-surface-border">
                  <div className="text-xs text-text-muted mb-1">Cintura</div>
                  <div className="font-serif font-bold text-secondary">{measurements.waist || '--'} <span className="text-xs font-sans font-normal text-text-muted">cm</span></div>
                </div>
                <div className="bg-background p-3 rounded-xl border border-surface-border">
                  <div className="text-xs text-text-muted mb-1">Peito</div>
                  <div className="font-serif font-bold text-secondary">{measurements.chest || '--'} <span className="text-xs font-sans font-normal text-text-muted">cm</span></div>
                </div>
                <div className="bg-background p-3 rounded-xl border border-surface-border">
                  <div className="text-xs text-text-muted mb-1">Braços (E/D)</div>
                  <div className="font-serif font-bold text-secondary">{measurements.armL || '--'} / {measurements.armR || '--'} <span className="text-xs font-sans font-normal text-text-muted">cm</span></div>
                </div>
                <div className="bg-background p-3 rounded-xl border border-surface-border">
                  <div className="text-xs text-text-muted mb-1">Coxas (E/D)</div>
                  <div className="font-serif font-bold text-secondary">{measurements.thighL || '--'} / {measurements.thighR || '--'} <span className="text-xs font-sans font-normal text-text-muted">cm</span></div>
                </div>
              </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background border border-surface-border rounded-xl">
                  <Utensils className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-serif text-2xl font-semibold text-secondary">
                  Nutrição {selectedDate.toDateString() === new Date().toDateString() ? "Hoje" : selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleViewMeals}
                  className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors flex items-center gap-2"
                >
                  Ver Refeições
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <MacroBar label="Proteínas" current={totalProteins} target={nutritionTargets.protein} unit="g" color="bg-primary" onClick={() => handleLogFood("Proteínas")} />
              <MacroBar label="Carboidratos" current={totalCarbs} target={nutritionTargets.carbs} unit="g" color="bg-blue-400" onClick={() => handleLogFood("Carboidratos")} />
              <MacroBar label="Gorduras" current={totalFats} target={nutritionTargets.fats} unit="g" color="bg-yellow-500" onClick={() => handleLogFood("Gorduras")} />
              
              <div className="pt-4 border-t border-surface-border mt-4">
                <MacroBar label="Calorias Totais" current={totalCalories} target={nutritionTargets.calories} unit="kcal" color="bg-secondary" onClick={() => handleLogFood("Calorias")} />
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-background rounded-2xl border border-surface-border flex items-start gap-3">
              <Droplets className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-secondary">Água: 2.0L / 3.0L</div>
                <div className="text-xs text-text-muted mt-1">Você está no ritmo certo para bater a meta {selectedDate.toDateString() === new Date().toDateString() ? "hoje" : "neste dia"}.</div>
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
              {photos.length > 0 && (
                <div className="aspect-[3/4] bg-background rounded-xl border border-surface-border flex flex-col items-center justify-center text-text-muted relative overflow-hidden">
                  <img src={photos[photos.length - 1].url} alt="Última foto" className="w-full h-full object-cover" />
                  <span className="text-xs font-mono absolute top-3 left-3 bg-surface/80 px-2 py-1 rounded-md backdrop-blur-sm">{photos[photos.length - 1].day}</span>
                </div>
              )}
              {photos.length === 0 && (
                <div className="aspect-[3/4] bg-background rounded-xl border border-surface-border flex flex-col items-center justify-center text-text-muted relative overflow-hidden">
                  <span className="text-xs font-mono absolute top-3 left-3 bg-surface/80 px-2 py-1 rounded-md backdrop-blur-sm">Dia 01</span>
                  <Camera className="w-6 h-6 opacity-20" />
                </div>
              )}
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  handleNewPhoto();
                }}
                className="aspect-[3/4] bg-background rounded-xl border border-dashed border-surface-border flex flex-col items-center justify-center text-text-muted hover:bg-surface-hover transition-colors"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-6 h-6 mb-2 text-primary animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 mb-2 text-primary/50" />
                )}
                <span className="text-xs font-medium">{uploadingPhoto ? 'Enviando...' : 'Adicionar'}</span>
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
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
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
              onClick={handleSaveWeight}
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
          <div className="flex items-center justify-between bg-background p-4 rounded-2xl border border-surface-border">
            <span className="text-sm font-medium text-secondary">Data da Medição</span>
            <input 
              type="date" 
              value={selectedMeasurementDate}
              onChange={(e) => setSelectedMeasurementDate(e.target.value)}
              className="bg-transparent border-none outline-none text-primary font-medium focus:ring-0"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MeasurementInput label="Cintura" unit="cm" value={measurements.waist} onChange={(v) => setMeasurements({...measurements, waist: v})} />
            <MeasurementInput label="Peito" unit="cm" value={measurements.chest} onChange={(v) => setMeasurements({...measurements, chest: v})} />
            <MeasurementInput label="Braço (E)" unit="cm" value={measurements.armL} onChange={(v) => setMeasurements({...measurements, armL: v})} />
            <MeasurementInput label="Braço (D)" unit="cm" value={measurements.armR} onChange={(v) => setMeasurements({...measurements, armR: v})} />
            <MeasurementInput label="Coxa (E)" unit="cm" value={measurements.thighL} onChange={(v) => setMeasurements({...measurements, thighL: v})} />
            <MeasurementInput label="Coxa (D)" unit="cm" value={measurements.thighR} onChange={(v) => setMeasurements({...measurements, thighR: v})} />
            <MeasurementInput label="Gordura Est." unit="%" value={measurements.bf} onChange={(v) => setMeasurements({...measurements, bf: v})} />
            <MeasurementInput label="Massa Muscular" unit="kg" value={measurements.muscle} onChange={(v) => setMeasurements({...measurements, muscle: v})} />
          </div>
          <button 
            onClick={handleSaveMeasurements}
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
                value={newFoodAmount}
                onChange={(e) => setNewFoodAmount(e.target.value)}
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
                <button 
                  key={val} 
                  onClick={() => setNewFoodAmount(val.toString())}
                  className="px-4 py-2 bg-background border border-surface-border rounded-xl text-sm hover:bg-surface-hover transition-colors"
                >
                  +{val}{selectedMacro === 'Calorias' ? '' : 'g'}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSaveFood}
            className="w-full p-4 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md"
          >
            Confirmar Registro
          </button>
        </div>
      </Modal>
    </div>
  );
}

function MeasurementInput({ label, unit, value, onChange }: { label: string, unit: string, value?: any, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-text-muted uppercase tracking-widest px-1">{label}</label>
      <div className="relative">
        <input 
          type="number" 
          step="0.1"
          placeholder="0.0" 
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
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
