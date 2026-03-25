import { useState, useEffect } from "react";
import { 
  Dumbbell, 
  Plus, 
  History, 
  Loader2, 
  Clock, 
  Flame, 
  Calendar,
  ChevronRight,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/Modal";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

export function Treinos() {
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [workoutType, setWorkoutType] = useState("Musculação");
  const [workoutDuration, setWorkoutDuration] = useState("");
  const [workoutCalories, setWorkoutCalories] = useState("");
  const [workoutDescription, setWorkoutDescription] = useState("");

  useEffect(() => {
    if (user) {
      fetchWorkouts();
    }
  }, [user, selectedDate]);

  const fetchWorkouts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_name', user.name)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error("Erro ao buscar treinos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkout = async () => {
    if (!user || !workoutType) return;
    try {
      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();
      const insertDate = isToday ? now : new Date(selectedDate.setHours(12, 0, 0, 0));

      const { error } = await supabase.from('workouts').insert([{
        user_name: user.name,
        type: workoutType,
        duration: workoutDuration ? parseInt(workoutDuration) : null,
        calories: workoutCalories ? parseInt(workoutCalories) : null,
        description: workoutDescription,
        date: insertDate.toISOString().split('T')[0],
        created_at: insertDate.toISOString()
      }]);

      if (error) throw error;
      
      setIsWorkoutModalOpen(false);
      setWorkoutType("Musculação");
      setWorkoutDuration("");
      setWorkoutCalories("");
      setWorkoutDescription("");
      fetchWorkouts();
    } catch (error) {
      console.error("Erro ao salvar treino:", error);
      alert("Erro ao salvar treino.");
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest mb-2">
            <Dumbbell className="w-4 h-4" />
            Corpo & Movimento
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-secondary">Meus Treinos</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-surface border border-surface-border rounded-2xl p-1 shadow-sm">
            <button 
              onClick={() => changeDate(-1)}
              className="p-2 hover:bg-surface-hover rounded-xl transition-colors"
            >
              <ChevronRight className="w-5 h-5 rotate-180 text-text-muted" />
            </button>
            <div className="px-4 font-medium text-secondary min-w-[140px] text-center">
              {selectedDate.toDateString() === new Date().toDateString() 
                ? "Hoje" 
                : selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </div>
            <button 
              onClick={() => changeDate(1)}
              className="p-2 hover:bg-surface-hover rounded-xl transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-text-muted" />
            </button>
          </div>
          
          <button 
            onClick={() => setIsWorkoutModalOpen(true)}
            className="bg-primary text-white p-4 rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all group"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Treinos Hoje</div>
          <div className="text-3xl font-serif font-bold text-secondary">{workouts.length}</div>
        </div>
        <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Tempo Total</div>
          <div className="text-3xl font-serif font-bold text-secondary">
            {workouts.reduce((acc, curr) => acc + (curr.duration || 0), 0)} <span className="text-sm font-sans font-normal text-text-muted">min</span>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Calorias Est.</div>
          <div className="text-3xl font-serif font-bold text-orange-500">
            {workouts.reduce((acc, curr) => acc + (curr.calories || 0), 0)} <span className="text-sm font-sans font-normal text-text-muted">kcal</span>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Status</div>
          <div className={cn(
            "text-lg font-bold mt-1",
            workouts.length > 0 ? "text-emerald-600" : "text-amber-500"
          )}>
            {workouts.length > 0 ? "Meta Batida" : "Pendente"}
          </div>
        </div>
      </div>

      {/* Workouts List */}
      <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
        <h2 className="font-serif text-2xl font-semibold text-secondary mb-8">Registro de Atividades</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : workouts.length > 0 ? (
          <div className="space-y-6">
            {workouts.map((workout, index) => (
              <div 
                key={index} 
                className="group bg-background p-6 rounded-3xl border border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <Dumbbell className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-secondary">{workout.type}</h3>
                      <span className="px-2 py-0.5 bg-surface-hover rounded-full text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        {new Date(workout.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-text-muted leading-relaxed">{workout.description || "Sem descrição detalhada."}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8 px-6 py-4 bg-surface rounded-2xl border border-surface-border md:border-none md:bg-transparent">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-text-muted mb-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Duração</span>
                    </div>
                    <div className="font-serif font-bold text-secondary text-xl">{workout.duration || '--'} <span className="text-xs font-sans font-normal text-text-muted">min</span></div>
                  </div>
                  <div className="w-px h-8 bg-surface-border" />
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-text-muted mb-1">
                      <Flame className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Queima</span>
                    </div>
                    <div className="font-serif font-bold text-orange-500 text-xl">{workout.calories || '--'} <span className="text-xs font-sans font-normal text-text-muted">kcal</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-background rounded-3xl border border-dashed border-surface-border">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
              <Activity className="w-10 h-10 text-text-muted opacity-30" />
            </div>
            <h3 className="text-xl font-serif font-bold text-secondary mb-2">Nenhum treino hoje</h3>
            <p className="text-text-muted max-w-xs mx-auto mb-8">
              Registre seu esforço físico para que a IA possa ajustar suas recomendações nutricionais.
            </p>
            <button 
              onClick={() => setIsWorkoutModalOpen(true)}
              className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Registrar Primeiro Treino
            </button>
          </div>
        )}
      </div>

      {/* Modal de Registro */}
      <Modal 
        isOpen={isWorkoutModalOpen} 
        onClose={() => setIsWorkoutModalOpen(false)} 
        title="Novo Registro de Treino"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-text-muted uppercase tracking-widest mb-2">O que você treinou?</label>
              <select 
                value={workoutType}
                onChange={(e) => setWorkoutType(e.target.value)}
                className="w-full bg-background border border-surface-border rounded-xl px-4 py-4 text-secondary outline-none focus:border-primary font-medium"
              >
                <option value="Musculação">Musculação (Hipertrofia)</option>
                <option value="Cardio">Cardio (Esteira/Bike)</option>
                <option value="Crossfit">Crossfit / Funcional</option>
                <option value="Corrida">Corrida de Rua</option>
                <option value="Ciclismo">Ciclismo / Pedal</option>
                <option value="Natação">Natação</option>
                <option value="Esporte">Esporte (Futebol/Tênis/etc)</option>
                <option value="Descanso">Descanso Ativo (Yoga/Alongamento)</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Duração (min)</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input 
                    type="number" 
                    placeholder="60" 
                    value={workoutDuration}
                    onChange={(e) => setWorkoutDuration(e.target.value)}
                    className="w-full bg-background border border-surface-border rounded-xl pl-12 pr-4 py-4 text-secondary outline-none focus:border-primary font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Calorias (kcal)</label>
                <div className="relative">
                  <Flame className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input 
                    type="number" 
                    placeholder="450" 
                    value={workoutCalories}
                    onChange={(e) => setWorkoutCalories(e.target.value)}
                    className="w-full bg-background border border-surface-border rounded-xl pl-12 pr-4 py-4 text-secondary outline-none focus:border-primary font-bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Descrição / Notas</label>
              <textarea 
                placeholder="Ex: Treino de Costas focado em remadas + 20min de esteira leve." 
                value={workoutDescription}
                onChange={(e) => setWorkoutDescription(e.target.value)}
                className="w-full bg-background border border-surface-border rounded-xl px-4 py-4 text-secondary outline-none focus:border-primary h-32 resize-none leading-relaxed"
              />
            </div>
          </div>
          
          <button 
            onClick={handleSaveWorkout}
            className="w-full py-5 bg-primary text-white rounded-2xl text-lg font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
          >
            <Dumbbell className="w-6 h-6" />
            Salvar Treino
          </button>
        </div>
      </Modal>
    </div>
  );
}
