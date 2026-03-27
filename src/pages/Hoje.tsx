import React, { useState, useEffect } from "react";
import { 
  Check, 
  Plus, 
  X, 
  Droplet, 
  Ban, 
  Loader2,
  Battery,
  Smile,
  Trophy,
  Target,
  Save,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";
import { useAgencyData } from "@/hooks/useAgencyData";

// Tipos
type Habit = {
  id: string;
  name: string;
  frequency_per_week: number;
  type: 'check' | 'numeric' | 'negative';
  target_value: number;
  unit: string;
  color: string;
};

type HabitLog = {
  id?: string;
  habit_id: string;
  date: string;
  value: number;
  completed: boolean;
};

const COLORS: Record<string, { bg: string, text: string, border: string, light: string }> = {
  blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50' },
  green: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-200', light: 'bg-purple-50' },
  red: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-200', light: 'bg-red-50' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-200', light: 'bg-orange-50' },
  gray: { bg: 'bg-gray-500', text: 'text-gray-600', border: 'border-gray-200', light: 'bg-gray-50' },
};

export function Hoje() {
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<string, HabitLog>>({});
  const [goals, setGoals] = useState<{ id: string, title: string }[]>([]);
  
  // Controle de Data
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  // Reflexão do Dia (daily_checkins)
  const [energy, setEnergy] = useState(3);
  const [mood, setMood] = useState(3);
  const [victory, setVictory] = useState("");
  const [improvement, setImprovement] = useState("");
  const [savingReflection, setSavingReflection] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);

  // Modal de Novo Hábito
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newHabit, setNewHabit] = useState<Partial<Habit> & { goal_id?: string }>({
    type: 'check',
    frequency_per_week: 7,
    target_value: 1,
    color: 'blue'
  });

  // Tabs
  const [activeTab, setActiveTab] = useState<'pessoal' | 'agencia'>('pessoal');

  // Agency Data
  const { logs: agencyLogs, updateDailyLog: updateAgencyLog } = useAgencyData();
  const currentAgencyLog = agencyLogs[new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0]] || {
    brAbordagens: 0,
    brFollowups: 0,
    brCalls: 0,
    brPropostas: 0,
    canAbordagens: 0,
    canFollowups: 0,
  };

  // Gera os dias da semana atual
  useEffect(() => {
    const dates = [];
    const today = new Date(selectedDate);
    const dayOfWeek = today.getDay(); // 0 = Domingo, 6 = Sábado
    
    // Volta para o domingo da semana atual
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    setWeekDates(dates);
  }, [selectedDate]);

  // Carrega Hábitos e Logs
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedDate]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    // Ajuste de timezone para pegar a data local correta no formato YYYY-MM-DD
    const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
    const dateStr = localDate.toISOString().split('T')[0];

    try {
      // Busca Hábitos
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_name', user.name)
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;
      setHabits(habitsData || []);

      // Busca Logs do dia selecionado
      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_name', user.name)
        .eq('date', dateStr);

      if (logsError) throw logsError;

      // Converte array de logs para um dicionário (habit_id -> log)
      const logsDict: Record<string, HabitLog> = {};
      logsData?.forEach(log => {
        logsDict[log.habit_id] = log;
      });
      setLogs(logsDict);

      // Busca Reflexão do Dia (daily_checkins)
      const { data: checkinData, error: checkinError } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_name', user.name)
        .eq('date', dateStr)
        .single();

      if (checkinData) {
        setEnergy(checkinData.energy || 3);
        setMood(checkinData.mood || 3);
        setVictory(checkinData.victory || "");
        setImprovement(checkinData.improvement || "");
      } else {
        // Reset se não houver checkin para o dia
        setEnergy(3);
        setMood(3);
        setVictory("");
        setImprovement("");
      }

      // Busca Metas (Goals)
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('id, title')
        .eq('user_name', user.name);
        
      if (goalsError) throw goalsError;
      setGoals(goalsData || []);

    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
      setReflectionSaved(false);
    }
  };

  // Ações Interativas (Auto-save)
  const handleToggleCheck = async (habit: Habit) => {
    const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
    const dateStr = localDate.toISOString().split('T')[0];
    const existingLog = logs[habit.id];
    const isCompleted = existingLog ? !existingLog.completed : true;

    // Atualiza UI Otimisticamente
    setLogs(prev => ({
      ...prev,
      [habit.id]: {
        ...existingLog,
        habit_id: habit.id,
        date: dateStr,
        value: isCompleted ? habit.target_value : 0,
        completed: isCompleted
      }
    }));

    // Salva no Supabase
    await upsertLog(habit.id, dateStr, isCompleted ? habit.target_value : 0, isCompleted);
  };

  const handleIncrementNumeric = async (habit: Habit) => {
    const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
    const dateStr = localDate.toISOString().split('T')[0];
    const existingLog = logs[habit.id];
    
    // Define o "passo" de incremento (ex: se a meta é 2000, incrementa de 250 em 250)
    let step = 1;
    if (habit.target_value >= 1000) step = 250;
    else if (habit.target_value >= 100) step = 10;

    let newValue = (existingLog?.value || 0) + step;
    if (newValue > habit.target_value) newValue = habit.target_value; // Limita ao máximo
    
    const isCompleted = newValue >= habit.target_value;

    // Atualiza UI Otimisticamente
    setLogs(prev => ({
      ...prev,
      [habit.id]: {
        ...existingLog,
        habit_id: habit.id,
        date: dateStr,
        value: newValue,
        completed: isCompleted
      }
    }));

    // Salva no Supabase
    await upsertLog(habit.id, dateStr, newValue, isCompleted);
  };

  const handleFailNegative = async (habit: Habit) => {
    const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
    const dateStr = localDate.toISOString().split('T')[0];
    const existingLog = logs[habit.id];
    
    // Para hábitos negativos, "completed = false" significa que falhou (caiu na tentação)
    // Se não tem log, assumimos que está indo bem (sucesso implícito)
    const hasFailed = existingLog ? !existingLog.completed : true; // Inverte o estado atual

    // Atualiza UI Otimisticamente
    setLogs(prev => ({
      ...prev,
      [habit.id]: {
        ...existingLog,
        habit_id: habit.id,
        date: dateStr,
        value: 0,
        completed: !hasFailed // false = falhou, true = recuperou
      }
    }));

    // Salva no Supabase
    await upsertLog(habit.id, dateStr, 0, !hasFailed);
  };

  const upsertLog = async (habitId: string, date: string, value: number, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('habit_logs')
        .upsert({
          user_name: user?.name,
          habit_id: habitId,
          date: date,
          value: value,
          completed: completed
        }, { onConflict: 'habit_id,date' });

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao salvar log:", error);
    }
  };

  const handleSaveReflection = async () => {
    if (!user) return;
    setSavingReflection(true);
    
    const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
    const dateStr = localDate.toISOString().split('T')[0];

    try {
      const { error } = await supabase
        .from('daily_checkins')
        .upsert({
          user_name: user.name,
          date: dateStr,
          energy,
          mood,
          victory,
          improvement,
          water_ml: 0 // Mantido para compatibilidade com o schema antigo, mas a água agora é um hábito
        }, { onConflict: 'user_name,date' });

      if (error) throw error;
      
      setReflectionSaved(true);
      setTimeout(() => setReflectionSaved(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar reflexão:", error);
      alert("Erro ao salvar reflexão.");
    } finally {
      setSavingReflection(false);
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newHabit.name) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert([{
          user_name: user.name,
          name: newHabit.name,
          type: newHabit.type,
          frequency_per_week: newHabit.frequency_per_week,
          target_value: newHabit.type === 'check' ? 1 : newHabit.target_value,
          unit: newHabit.unit || '',
          color: newHabit.color,
          goal_id: newHabit.goal_id || null
        }])
        .select();

      if (error) throw error;
      
      if (data) {
        setHabits([...habits, data[0]]);
      }
      setIsModalOpen(false);
      setNewHabit({ type: 'check', frequency_per_week: 7, target_value: 1, color: 'blue', goal_id: undefined });
    } catch (error) {
      console.error("Erro ao criar hábito:", error);
      alert("Erro ao criar hábito.");
    }
  };

  const getDayName = (date: Date) => {
    const days = ['Do', 'Se', 'Te', 'Qu', 'Qu', 'Se', 'Sá'];
    return days[date.getDay()];
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  if (loading && habits.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto pb-20">
      
      {/* Header & Calendar */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl pt-6 pb-4 border-b border-surface-border -mx-6 px-6 md:-mx-10 md:px-10 lg:-mx-16 lg:px-16">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-serif font-bold text-primary">Hoje</h1>
          {activeTab === 'pessoal' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('pessoal')}
            className={cn(
              "flex-1 py-2.5 rounded-2xl font-bold transition-all text-sm",
              activeTab === 'pessoal' ? "bg-primary text-white shadow-md" : "bg-surface text-text-muted hover:bg-surface-hover border border-surface-border"
            )}
          >
            Pessoal
          </button>
          {user?.name === 'Wesley' && (
            <button
              onClick={() => setActiveTab('agencia')}
              className={cn(
                "flex-1 py-2.5 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2",
                activeTab === 'agencia' ? "bg-primary text-white shadow-md" : "bg-surface text-text-muted hover:bg-surface-hover border border-surface-border"
              )}
            >
              <Briefcase className="w-4 h-4" />
              Agência
            </button>
          )}
        </div>

        <div className="flex justify-between items-center">
          {weekDates.map((date, i) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(date)}
                className="flex flex-col items-center gap-2"
              >
                <span className={cn(
                  "text-xs font-medium",
                  isSelected ? "text-primary font-bold" : "text-text-muted"
                )}>
                  {getDayName(date)}
                </span>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  isSelected 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : isToday 
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-secondary hover:bg-surface-hover"
                )}>
                  {date.getDate()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'pessoal' ? (
        <>
          {/* Habits List */}
          <div className="space-y-4">
        {habits.length === 0 ? (
          <div className="text-center py-12 bg-surface border border-surface-border rounded-3xl">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-serif font-bold text-secondary mb-2">Nenhum hábito cadastrado</h3>
            <p className="text-text-muted text-sm mb-6 max-w-xs mx-auto">Comece adicionando os hábitos que vão te levar à sua meta de 12 semanas.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-white px-6 py-2.5 rounded-full font-medium shadow-md hover:bg-primary/90 transition-colors"
            >
              Adicionar Hábito
            </button>
          </div>
        ) : (
          habits.map(habit => {
            const log = logs[habit.id];
            const colorTheme = COLORS[habit.color] || COLORS.blue;
            
            // Lógica de exibição por tipo
            if (habit.type === 'numeric') {
              const currentValue = log?.value || 0;
              const isCompleted = currentValue >= habit.target_value;
              
              return (
                <div key={habit.id} className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all",
                  isCompleted ? colorTheme.light : "bg-surface",
                  isCompleted ? colorTheme.border : "border-surface-border"
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", colorTheme.light, colorTheme.text)}>
                      <Droplet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={cn("font-medium", isCompleted ? colorTheme.text : "text-secondary")}>{habit.name}</h3>
                      <div className="text-xs font-mono text-text-muted mt-0.5">
                        {currentValue}/{habit.target_value} {habit.unit}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleIncrementNumeric(habit)}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      isCompleted ? colorTheme.bg + " text-white" : "bg-background border border-surface-border text-primary hover:bg-primary/5"
                    )}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </button>
                </div>
              );
            }

            if (habit.type === 'check') {
              const isCompleted = log?.completed || false;
              
              return (
                <div key={habit.id} className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all",
                  isCompleted ? colorTheme.light : "bg-surface",
                  isCompleted ? colorTheme.border : "border-surface-border"
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", colorTheme.light, colorTheme.text)}>
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={cn("font-medium", isCompleted ? colorTheme.text : "text-secondary")}>{habit.name}</h3>
                      <div className="flex gap-1 mt-1.5">
                        {/* Indicador de frequência visual (bolinhas) */}
                        {Array.from({ length: habit.frequency_per_week }).map((_, i) => (
                          <div key={i} className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            i === 0 && isCompleted ? colorTheme.bg : "bg-surface-border"
                          )} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleToggleCheck(habit)}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      isCompleted ? colorTheme.bg + " text-white shadow-md" : "bg-background border border-surface-border text-surface-border hover:border-primary/30 hover:text-primary"
                    )}
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              );
            }

            if (habit.type === 'negative') {
              // Negativo: completed = false significa que falhou. Se não tem log, é sucesso (true)
              const hasFailed = log ? !log.completed : false;
              
              return (
                <div key={habit.id} className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all",
                  hasFailed ? "bg-red-50 border-red-200" : "bg-red-500 border-red-500 shadow-md shadow-red-500/20"
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      hasFailed ? "bg-red-100 text-red-500" : "bg-white/20 text-white"
                    )}>
                      <Ban className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={cn("font-medium", hasFailed ? "text-red-700" : "text-white")}>{habit.name}</h3>
                      <div className={cn("text-xs font-mono mt-0.5", hasFailed ? "text-red-400" : "text-red-200")}>
                        0/0
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleFailNegative(habit)}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      hasFailed ? "bg-red-500 text-white shadow-md" : "bg-white text-red-500 hover:bg-red-50"
                    )}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              );
            }

            return null;
          })
        )}
      </div>

      {/* Reflexão do Dia */}
      <div className="mt-12 pt-8 border-t border-surface-border space-y-8">
        <h2 className="font-serif text-2xl font-semibold text-secondary">Reflexão do Dia</h2>
        
        <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm space-y-8">
          {/* Energia e Humor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-text-muted font-medium">
                  <Battery className="w-5 h-5" />
                  Energia
                </div>
                <span className="font-mono font-bold text-primary">{energy}/5</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={`energy-${val}`}
                    onClick={() => setEnergy(val)}
                    className={cn(
                      "flex-1 h-12 rounded-xl border transition-all",
                      energy >= val 
                        ? "bg-primary border-primary text-white shadow-sm" 
                        : "bg-background border-surface-border text-text-muted hover:border-primary/50"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-text-muted font-medium">
                  <Smile className="w-5 h-5" />
                  Humor
                </div>
                <span className="font-mono font-bold text-primary">{mood}/5</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={`mood-${val}`}
                    onClick={() => setMood(val)}
                    className={cn(
                      "flex-1 h-12 rounded-xl border transition-all",
                      mood >= val 
                        ? "bg-primary border-primary text-white shadow-sm" 
                        : "bg-background border-surface-border text-text-muted hover:border-primary/50"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Textos */}
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-text-muted uppercase tracking-widest mb-3">
                <Trophy className="w-4 h-4 text-emerald-500" />
                Maior vitória do dia
              </label>
              <textarea 
                value={victory}
                onChange={(e) => setVictory(e.target.value)}
                placeholder="O que você fez de melhor hoje?"
                className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none h-24"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-text-muted uppercase tracking-widest mb-3">
                <Target className="w-4 h-4 text-primary" />
                Ajuste para amanhã
              </label>
              <textarea 
                value={improvement}
                onChange={(e) => setImprovement(e.target.value)}
                placeholder="Onde você precisa melhorar?"
                className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none h-24"
              />
            </div>
          </div>

          <button 
            onClick={handleSaveReflection}
            disabled={savingReflection}
            className={cn(
              "w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
              reflectionSaved 
                ? "bg-emerald-500 text-white" 
                : "bg-primary/10 text-primary hover:bg-primary/20",
              savingReflection && "opacity-70 cursor-not-allowed"
            )}
          >
            {savingReflection ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : reflectionSaved ? (
              <>
                <Check className="w-5 h-5" />
                Reflexão Salva!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Reflexão
              </>
            )}
          </button>
        </div>
      </div>
        </>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Checklist Agência */}
          <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-secondary mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">🇧🇷</span>
              Canguru (Brasil)
            </h2>
            
            <div className="space-y-4">
              {[
                { key: 'brAbordagens', label: 'Novas Abordagens', max: 20, icon: '🎯' },
                { key: 'brFollowups', label: 'Follow-ups', max: 12, icon: '🔄' },
                { key: 'brCalls', label: 'Calls Realizadas', max: 1, icon: '📞' },
                { key: 'brPropostas', label: 'Propostas Enviadas', max: 1, icon: '📄' },
              ].map((item) => {
                const val = currentAgencyLog[item.key as keyof typeof currentAgencyLog] || 0;
                const dateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                return (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-background border border-surface-border rounded-2xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <div className="font-medium text-secondary">{item.label}</div>
                        <div className="text-xs text-text-muted font-mono">{val}/{item.max}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateAgencyLog(dateStr, { [item.key]: Math.max(0, val - 1) })}
                        className="w-8 h-8 rounded-full bg-surface border border-surface-border flex items-center justify-center text-text-muted hover:text-red-500"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-primary">{val}</span>
                      <button 
                        onClick={() => updateAgencyLog(dateStr, { [item.key]: Math.min(item.max, val + 1) })}
                        className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-secondary mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm">🇨🇦</span>
              Kanoa (Canadá)
            </h2>
            
            <div className="space-y-4">
              {[
                { key: 'canAbordagens', label: 'Novas Abordagens', max: 16, icon: '🎯' },
                { key: 'canFollowups', label: 'Follow-ups', max: 8, icon: '🔄' },
              ].map((item) => {
                const val = currentAgencyLog[item.key as keyof typeof currentAgencyLog] || 0;
                const dateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                return (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-background border border-surface-border rounded-2xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <div className="font-medium text-secondary">{item.label}</div>
                        <div className="text-xs text-text-muted font-mono">{val}/{item.max}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateAgencyLog(dateStr, { [item.key]: Math.max(0, val - 1) })}
                        className="w-8 h-8 rounded-full bg-surface border border-surface-border flex items-center justify-center text-text-muted hover:text-red-500"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-primary">{val}</span>
                      <button 
                        onClick={() => updateAgencyLog(dateStr, { [item.key]: Math.min(item.max, val + 1) })}
                        className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação de Hábito */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full md:max-w-md md:rounded-3xl rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl font-semibold text-secondary">Novo Hábito</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-background rounded-full transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            
            <form onSubmit={handleCreateHabit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Nome do Hábito</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={newHabit.name || ''}
                  onChange={e => setNewHabit({...newHabit, name: e.target.value})}
                  className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  placeholder="Ex: Beber água, Ler 10 páginas..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Tipo de Registro</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewHabit({...newHabit, type: 'check', color: 'purple'})}
                    className={cn("py-2 px-3 rounded-xl text-sm font-medium border transition-all flex flex-col items-center gap-1", newHabit.type === 'check' ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-background border-surface-border text-text-muted")}
                  >
                    <Check className="w-4 h-4" /> Sim/Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewHabit({...newHabit, type: 'numeric', color: 'blue'})}
                    className={cn("py-2 px-3 rounded-xl text-sm font-medium border transition-all flex flex-col items-center gap-1", newHabit.type === 'numeric' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-background border-surface-border text-text-muted")}
                  >
                    <Droplet className="w-4 h-4" /> Quantidade
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewHabit({...newHabit, type: 'negative', color: 'red'})}
                    className={cn("py-2 px-3 rounded-xl text-sm font-medium border transition-all flex flex-col items-center gap-1", newHabit.type === 'negative' ? "bg-red-50 border-red-200 text-red-700" : "bg-background border-surface-border text-text-muted")}
                  >
                    <Ban className="w-4 h-4" /> Evitar
                  </button>
                </div>
              </div>

              {newHabit.type === 'numeric' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Meta Diária</label>
                    <input 
                      required
                      type="number" 
                      value={newHabit.target_value || ''}
                      onChange={e => setNewHabit({...newHabit, target_value: Number(e.target.value)})}
                      className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono font-bold"
                      placeholder="Ex: 2000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Unidade</label>
                    <select 
                      required
                      value={newHabit.unit || ''}
                      onChange={e => setNewHabit({...newHabit, unit: e.target.value})}
                      className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-text-main"
                    >
                      <option value="" disabled>Selecione</option>
                      <option value="ml">ml</option>
                      <option value="litros">litros</option>
                      <option value="minutos">minutos</option>
                      <option value="horas">horas</option>
                      <option value="páginas">páginas</option>
                      <option value="km">km</option>
                      <option value="passos">passos</option>
                      <option value="vezes">vezes</option>
                      <option value="kcal">kcal</option>
                      <option value="g">gramas</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Meta Relacionada (Opcional)</label>
                <select
                  value={newHabit.goal_id || ''}
                  onChange={e => setNewHabit({...newHabit, goal_id: e.target.value})}
                  className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-text-main"
                >
                  <option value="">Nenhuma meta específica</option>
                  {goals.map(goal => (
                    <option key={goal.id} value={goal.id}>{goal.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Frequência (Dias/Semana)</label>
                <input 
                  type="range" 
                  min="1" max="7" 
                  value={newHabit.frequency_per_week || 7}
                  onChange={e => setNewHabit({...newHabit, frequency_per_week: Number(e.target.value)})}
                  className="w-full accent-primary"
                />
                <div className="text-center font-mono font-bold text-primary">{newHabit.frequency_per_week}x na semana</div>
              </div>

              <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 mt-4">
                Salvar Hábito
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
