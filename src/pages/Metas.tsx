import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { 
  Target, 
  Calendar, 
  Activity, 
  Brain, 
  Briefcase, 
  Compass,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  TableProperties,
  LayoutDashboard,
  Check,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/Modal";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

import { getCycleInfo } from "@/lib/cycle";

// Tipos para o Rastreador
type Habit = {
  id: string;
  name: string;
  frequency_per_week: number;
  type: 'check' | 'numeric' | 'negative';
  target_value: number;
  unit: string;
};

type HabitLog = {
  habit_id: string;
  date: string;
  value: number;
  completed: boolean;
};

export function Metas() {
  const user = useUser();
  
  // Configuração do Ciclo de 12 Semanas
  const { startDate, endDate, totalDays, currentDay, currentWeek, cycleProgress } = getCycleInfo();
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  };
  
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'macro' | 'tracker'>('macro');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  
  // Dados Macro
  const [goals, setGoals] = useState<{ corpo: any[], alma: any[], trabalho: any[] }>({ corpo: [], alma: [], trabalho: [] });
  const [newGoal, setNewGoal] = useState({
    title: "",
    category: "Corpo",
    target_value: "",
    unit: "",
    start_value: "",
    current_value: ""
  });

  // Dados Rastreador
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState<Omit<Habit, 'id'>>({
    name: "",
    frequency_per_week: 7,
    type: 'check',
    target_value: 0,
    unit: ""
  });
  const [weeklyLogs, setWeeklyLogs] = useState<Record<string, Record<string, HabitLog>>>({}); // habit_id -> date -> log
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const celebratedHabits = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchTrackerData();
    }
  }, [user]);

  // Configura as datas da semana atual (Segunda a Domingo)
  useEffect(() => {
    const dates = [];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Dom, 1 = Seg...
    const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Ajusta para Segunda
    
    const monday = new Date(today.setDate(diffToMonday));

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    setWeekDates(dates);
  }, []);

  const fetchGoals = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_name', user.name);

      if (data) {
        const grouped = data.reduce((acc: any, goal: any) => {
          const cat = goal.category.toLowerCase();
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push({
            id: goal.id,
            title: goal.title,
            category: goal.category,
            current: goal.current_value,
            target: goal.target_value,
            unit: goal.unit,
            start: goal.start_value || 0,
            inverse: goal.inverse || false
          });
          return acc;
        }, { corpo: [], alma: [], trabalho: [] });
        setGoals(grouped);
      }
    } catch (error) {
      console.error("Erro ao buscar metas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackerData = async () => {
    if (!user) return;
    try {
      // Busca Hábitos
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_name', user.name)
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;
      setHabits(habitsData || []);

      // Define a data inicial para buscar os logs (menor data entre o início do ciclo e a segunda-feira atual)
      const todayForFetch = new Date();
      const dayOfWeek = todayForFetch.getDay();
      const diffToMonday = todayForFetch.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(todayForFetch);
      monday.setDate(diffToMonday);
      
      const fetchStartDate = startDate < monday ? startDate : monday;
      const localFetchDate = new Date(fetchStartDate.getTime() - (fetchStartDate.getTimezoneOffset() * 60000));

      // Busca Logs
      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_name', user.name)
        .gte('date', localFetchDate.toISOString().split('T')[0]);

      if (logsError) throw logsError;

      // Organiza logs: { habit_id: { 'YYYY-MM-DD': log } }
      const logsMap: Record<string, Record<string, HabitLog>> = {};
      logsData?.forEach(log => {
        if (!logsMap[log.habit_id]) logsMap[log.habit_id] = {};
        logsMap[log.habit_id][log.date] = log;
      });
      setWeeklyLogs(logsMap);

    } catch (error) {
      console.error("Erro ao buscar dados do rastreador:", error);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.title || !newGoal.target_value || !user) return;
    try {
      if (editingGoalId) {
        const { error } = await supabase
          .from('goals')
          .update({
            title: newGoal.title,
            category: newGoal.category,
            target_value: parseFloat(newGoal.target_value),
            current_value: parseFloat(newGoal.current_value || "0"),
            start_value: parseFloat(newGoal.start_value || "0"),
            unit: newGoal.unit
          })
          .eq('id', editingGoalId);

        if (error) throw error;
        setEditingGoalId(null);
      } else {
        const { error } = await supabase
          .from('goals')
          .insert([{
            user_name: user.name,
            title: newGoal.title,
            category: newGoal.category,
            target_value: parseFloat(newGoal.target_value),
            current_value: parseFloat(newGoal.current_value || newGoal.start_value || "0"),
            start_value: parseFloat(newGoal.start_value || "0"),
            unit: newGoal.unit
          }]);

        if (error) throw error;
      }
      
      setNewGoal({ title: "", category: "Corpo", target_value: "", unit: "", start_value: "", current_value: "" });
      fetchGoals();
    } catch (error) {
      console.error("Erro ao salvar meta:", error);
      alert("Erro ao salvar meta.");
    }
  };

  const handleEditGoalClick = (goal: any) => {
    setEditingGoalId(goal.id);
    setNewGoal({
      title: goal.title,
      category: goal.category || "Corpo", // Fallback if category is missing in the object
      target_value: goal.target.toString(),
      unit: goal.unit,
      start_value: (goal.start || 0).toString(),
      current_value: (goal.current || 0).toString()
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta meta?")) return;
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchGoals();
    } catch (error) {
      console.error("Erro ao deletar meta:", error);
      alert("Erro ao deletar meta.");
    }
  };

  const handleEditHabitClick = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setNewHabit({
      name: habit.name,
      frequency_per_week: habit.frequency_per_week,
      type: habit.type,
      target_value: habit.target_value,
      unit: habit.unit
    });
    setIsHabitModalOpen(true);
  };

  const handleDeleteHabit = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este hábito?")) return;
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTrackerData();
    } catch (error) {
      console.error("Erro ao deletar hábito:", error);
    }
  };

  const handleAddHabit = async () => {
    if (!newHabit.name || !user) return;
    try {
      if (editingHabitId) {
        const { error } = await supabase
          .from('habits')
          .update({
            name: newHabit.name,
            frequency_per_week: newHabit.frequency_per_week,
            type: newHabit.type,
            target_value: newHabit.target_value,
            unit: newHabit.unit
          })
          .eq('id', editingHabitId);

        if (error) throw error;
        setEditingHabitId(null);
      } else {
        const { error } = await supabase
          .from('habits')
          .insert([{
            user_name: user.name,
            name: newHabit.name,
            frequency_per_week: newHabit.frequency_per_week,
            type: newHabit.type,
            target_value: newHabit.target_value,
            unit: newHabit.unit
          }]);

        if (error) throw error;
      }
      
      setNewHabit({ name: "", frequency_per_week: 7, type: 'check', target_value: 0, unit: "" });
      setIsHabitModalOpen(false);
      fetchTrackerData();
    } catch (error) {
      console.error("Erro ao salvar hábito:", error);
    }
  };

  const getLogForDate = (habitId: string, date: Date) => {
    // Ajuste de timezone
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    const dateStr = localDate.toISOString().split('T')[0];
    return weeklyLogs[habitId]?.[dateStr];
  };

  const calculateHabitWeeklyPercentage = (habit: Habit) => {
    let completedDays = 0;
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fim do dia de hoje

    weekDates.forEach(date => {
      const log = getLogForDate(habit.id, date);
      const isFuture = date > today;

      if (habit.type === 'negative') {
        // Para negativos, sem log = sucesso. Mas não conta dias futuros.
        if (!isFuture && (!log || log.completed)) completedDays++;
      } else {
        if (log?.completed) completedDays++;
      }
    });
    
    // Calcula a porcentagem baseada na frequência desejada (max 100%)
    const percentage = Math.min(100, Math.round((completedDays / habit.frequency_per_week) * 100));
    return percentage;
  };

  const calculateOverallScore = () => {
    if (habits.length === 0 || currentDay === 0) return 0;
    
    let totalHabitScores = 0;
    
    habits.forEach(habit => {
      let completedDays = 0;
      let expectedDays = Math.max(1, Math.round((habit.frequency_per_week / 7) * currentDay));
      
      for (let d = 0; d < currentDay; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + d);
        const dateStr = date.toISOString().split('T')[0];
        const log = weeklyLogs[habit.id]?.[dateStr];
        
        if (habit.type === 'negative') {
          if (!log || log.completed) completedDays++;
        } else {
          if (log?.completed) completedDays++;
        }
      }
      
      const pct = Math.min(100, Math.round((completedDays / expectedDays) * 100));
      totalHabitScores += pct;
    });
    
    return Math.round(totalHabitScores / habits.length);
  };

  const weeklyScores = habits.map(calculateHabitWeeklyPercentage);
  const weeklyScore = habits.length ? Math.round(weeklyScores.reduce((a, b) => a + b, 0) / habits.length) : 0;
  const overallScore = calculateOverallScore();

  // Efeito para soltar fogos quando bater 85%
  useEffect(() => {
    if (habits.length === 0 || Object.keys(weeklyLogs).length === 0) return;
    
    let fired = false;
    habits.forEach(habit => {
      const pct = calculateHabitWeeklyPercentage(habit);
      if (pct >= 85 && !celebratedHabits.current.has(habit.id)) {
        celebratedHabits.current.add(habit.id);
        fired = true;
      }
    });

    if (fired) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#fcd34d']
      });
    }
  }, [weeklyLogs, habits, weekDates]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10 max-w-6xl mx-auto">
      {/* Header & View Toggle */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">1 Ano em 12 Semanas</div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-primary">Metas & Execução</h1>
        </div>
        
        <div className="flex bg-surface border border-surface-border p-1 rounded-2xl shadow-sm hidden">
          <button 
            onClick={() => setViewMode('macro')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all",
              viewMode === 'macro' ? "bg-primary text-white shadow-md" : "text-text-muted hover:text-primary"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Visão Macro
          </button>
          <button 
            onClick={() => setViewMode('tracker')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all",
              viewMode === 'tracker' ? "bg-primary text-white shadow-md" : "text-text-muted hover:text-primary"
            )}
          >
            <TableProperties className="w-4 h-4" />
            Rastreador
          </button>
        </div>
      </header>

      {viewMode === 'macro' || true ? (
        /* ================= VISÃO MACRO ================= */
        <div className="space-y-10 animate-in slide-in-from-left-4 duration-300">
          {/* Master Progress & Vision */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cycle Progress */}
            <div className="lg:col-span-2 bg-surface border border-surface-border rounded-3xl p-8 shadow-sm flex flex-col justify-center">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background border border-surface-border rounded-xl">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="font-serif text-2xl font-semibold text-secondary">Progresso do Ciclo</h2>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-serif font-bold text-primary">Dia {currentDay}</span>
                  <span className="text-text-muted font-mono ml-2">/ {totalDays}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-mono text-text-muted">
                  <span className="capitalize">Início: {formatDate(startDate)}</span>
                  <span className="capitalize">Fim: {formatDate(endDate)}</span>
                </div>
                <div className="h-4 w-full bg-background rounded-full overflow-hidden border border-surface-border relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 ease-out"
                    style={{ width: `${cycleProgress}%` }}
                  />
                </div>
                <div className="text-right text-xs font-bold text-primary uppercase tracking-widest mt-2">
                  {cycleProgress}% Concluído
                </div>
              </div>
            </div>

            {/* The Vision */}
            <div className="bg-primary text-white rounded-3xl p-8 shadow-md relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <Compass className="w-6 h-6 text-white/50" />
                <h2 className="font-serif text-xl font-semibold">Tema do Ciclo</h2>
              </div>
              <p className="text-white/90 text-2xl font-serif leading-snug relative z-10">
                "Fundação de Ferro"
              </p>
              <p className="text-white/70 font-light mt-3 relative z-10 text-sm">
                Foco total em construir a base: saúde inegociável, rotina blindada e previsibilidade de caixa.
              </p>
            </div>
          </div>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Corpo */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-surface-border">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-text-muted" />
                  <h3 className="font-serif text-xl font-semibold text-secondary">Corpo</h3>
                </div>
                <button onClick={() => setIsEditModalOpen(true)} className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors"><Plus className="w-4 h-4"/></button>
              </div>
              <div className="space-y-4">
                {goals.corpo.map(goal => (
                  <GoalCard key={goal.id} goal={goal} color="bg-emerald-500" onEdit={handleEditGoalClick} />
                ))}
                {goals.corpo.length === 0 && <p className="text-sm text-text-muted italic">Nenhuma meta definida.</p>}
              </div>
            </div>

            {/* Alma */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-surface-border">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-text-muted" />
                  <h3 className="font-serif text-xl font-semibold text-secondary">Alma</h3>
                </div>
                <button onClick={() => setIsEditModalOpen(true)} className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors"><Plus className="w-4 h-4"/></button>
              </div>
              <div className="space-y-4">
                {goals.alma.map(goal => (
                  <GoalCard key={goal.id} goal={goal} color="bg-blue-500" onEdit={handleEditGoalClick} />
                ))}
                {goals.alma.length === 0 && <p className="text-sm text-text-muted italic">Nenhuma meta definida.</p>}
              </div>
            </div>

            {/* Trabalho */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-surface-border">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-text-muted" />
                  <h3 className="font-serif text-xl font-semibold text-secondary">Trabalho</h3>
                </div>
                <button onClick={() => setIsEditModalOpen(true)} className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors"><Plus className="w-4 h-4"/></button>
              </div>
              <div className="space-y-4">
                {goals.trabalho.map(goal => (
                  <GoalCard key={goal.id} goal={goal} color="bg-orange-500" onEdit={handleEditGoalClick} />
                ))}
                {goals.trabalho.length === 0 && <p className="text-sm text-text-muted italic">Nenhuma meta definida.</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= RASTREADOR SEMANAL ================= */
        <div className="bg-surface border border-surface-border rounded-3xl shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-300">
          <div className="p-6 md:p-8 border-b border-surface-border bg-background/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-secondary">Rastreador de Hábitos</h2>
              <p className="text-text-muted text-sm mt-1">Acompanhamento da semana atual. Preencha na aba "Hoje".</p>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              <button 
                onClick={() => {
                  setEditingHabitId(null);
                  setNewHabit({ name: "", frequency_per_week: 7, type: 'check', target_value: 0, unit: "" });
                  setIsHabitModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Hábito</span>
              </button>

              <div className="flex flex-col items-center justify-center px-4 py-2 bg-surface border border-surface-border rounded-xl">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Semana</span>
                <span className="text-lg font-serif font-bold text-primary">{currentWeek} <span className="text-sm text-text-muted font-sans">/ 12</span></span>
              </div>
              
              <div className="flex flex-col items-center justify-center px-4 py-2 bg-surface border border-surface-border rounded-xl">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Score Semanal</span>
                <span className={cn("text-lg font-serif font-bold", weeklyScore >= 85 ? "text-emerald-600" : "text-primary")}>
                  {weeklyScore}%
                </span>
              </div>

              <div className="flex flex-col items-center justify-center px-4 py-2 bg-surface border border-surface-border rounded-xl">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Score Geral</span>
                <span className={cn("text-lg font-serif font-bold", overallScore >= 85 ? "text-emerald-600" : "text-primary")}>
                  {overallScore}%
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-hover/50 border-b border-surface-border">
                  <th className="p-4 font-bold text-xs text-text-muted uppercase tracking-widest w-1/3">Ação Planejada (Hábito)</th>
                  <th className="p-4 font-bold text-xs text-text-muted uppercase tracking-widest text-center w-24">Freq.</th>
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, i) => (
                    <th key={day} className="p-4 font-bold text-xs text-text-muted uppercase tracking-widest text-center w-12">
                      {day}
                      <div className="text-[10px] font-normal mt-0.5 opacity-70">{weekDates[i]?.getDate()}</div>
                    </th>
                  ))}
                  <th className="p-4 font-bold text-xs text-text-muted uppercase tracking-widest text-center w-12">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {habits.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-text-muted italic">
                      Nenhum hábito cadastrado. Vá para a aba "Check-in" para adicionar.
                    </td>
                  </tr>
                ) : (
                  habits.map(habit => {
                    const percentage = calculateHabitWeeklyPercentage(habit);
                    
                    return (
                      <tr key={habit.id} className="hover:bg-surface-hover/30 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-secondary">{habit.name}</div>
                          <div className="text-xs text-text-muted mt-0.5">
                            {habit.type === 'numeric' ? `Meta: ${habit.target_value} ${habit.unit}` : habit.type === 'negative' ? 'Evitar' : 'Check diário'}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-background border border-surface-border text-xs font-bold text-primary">
                            {habit.frequency_per_week}x
                          </span>
                        </td>
                        
                        {/* Dias da Semana */}
                        {weekDates.map((date, i) => {
                          const log = getLogForDate(habit.id, date);
                          let isSuccess = false;
                          let isFailed = false;

                          if (habit.type === 'negative') {
                            isSuccess = !log || log.completed; // Sem log ou completed=true é sucesso
                            isFailed = log && !log.completed; // Log com completed=false é falha
                          } else {
                            isSuccess = log?.completed || false;
                          }

                          // Não mostra falha/sucesso para dias futuros
                          const isFuture = date > new Date();

                          return (
                            <td key={i} className="p-4 text-center">
                              {isFuture ? (
                                <div className="w-6 h-6 mx-auto rounded bg-surface-border/30" />
                              ) : habit.type === 'numeric' && log ? (
                                <div className={cn(
                                  "text-xs font-mono font-bold px-2 py-1 rounded-md inline-block",
                                  isSuccess ? "bg-emerald-100 text-emerald-700" : "bg-blue-50 text-blue-700"
                                )}>
                                  {log.value}<span className="text-[10px] opacity-70 font-normal ml-0.5">/{habit.target_value}</span>
                                </div>
                              ) : isSuccess ? (
                                <div className="w-6 h-6 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                  <Check className="w-4 h-4" />
                                </div>
                              ) : isFailed ? (
                                <div className="w-6 h-6 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                  <X className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 mx-auto rounded-full border-2 border-surface-border" />
                              )}
                            </td>
                          );
                        })}

                        {/* Porcentagem */}
                        <td className="p-4 text-center">
                          <div 
                            className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-bold transition-colors duration-500"
                            style={{ 
                              backgroundColor: `hsl(${Math.min(120, (percentage / 85) * 120)}, 80%, 90%)`,
                              color: `hsl(${Math.min(120, (percentage / 85) * 120)}, 80%, 35%)`
                            }}
                          >
                            {percentage}%
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleEditHabitClick(habit)}
                              className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteHabit(habit.id)}
                              className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Edição de Hábito */}
      <Modal 
        isOpen={isHabitModalOpen} 
        onClose={() => setIsHabitModalOpen(false)}
        title={editingHabitId ? "Editar Hábito" : "Novo Hábito"}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary">Nome do Hábito</label>
            <input 
              type="text"
              value={newHabit.name}
              onChange={(e) => setNewHabit({...newHabit, name: e.target.value})}
              placeholder="Ex: Beber 3L de água"
              className="w-full px-4 py-3 bg-background border border-surface-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Tipo</label>
              <select 
                value={newHabit.type}
                onChange={(e) => setNewHabit({...newHabit, type: e.target.value as any})}
                className="w-full px-4 py-3 bg-background border border-surface-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                <option value="check">Check Diário</option>
                <option value="numeric">Numérico (Meta)</option>
                <option value="negative">Negativo (Evitar)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Freq. Semanal</label>
              <input 
                type="number"
                min="1"
                max="7"
                value={newHabit.frequency_per_week}
                onChange={(e) => setNewHabit({...newHabit, frequency_per_week: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-background border border-surface-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          {newHabit.type === 'numeric' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Meta Diária</label>
                <input 
                  type="number"
                  value={newHabit.target_value}
                  onChange={(e) => setNewHabit({...newHabit, target_value: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 bg-background border border-surface-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Unidade</label>
                <input 
                  type="text"
                  value={newHabit.unit}
                  onChange={(e) => setNewHabit({...newHabit, unit: e.target.value})}
                  placeholder="Ex: ml, kg, min"
                  className="w-full px-4 py-3 bg-background border border-surface-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button 
              onClick={() => setIsHabitModalOpen(false)}
              className="flex-1 px-4 py-3 border border-surface-border text-secondary rounded-xl hover:bg-surface-hover transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              onClick={handleAddHabit}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-sm"
            >
              {editingHabitId ? "Salvar Alterações" : "Criar Hábito"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Goals Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Editar Metas do Ciclo"
        className="max-w-2xl"
      >
        <div className="space-y-8">
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-text-muted uppercase tracking-widest border-b border-surface-border pb-2">Metas Ativas</h4>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
              {[...goals.corpo, ...goals.alma, ...goals.trabalho].length === 0 && (
                <p className="text-sm text-text-muted italic">Nenhuma meta cadastrada.</p>
              )}
              {[...goals.corpo, ...goals.alma, ...goals.trabalho].map(goal => (
                <div key={goal.id} className="flex items-center justify-between p-4 bg-background border border-surface-border rounded-2xl">
                  <div>
                    <div className="font-medium text-secondary">{goal.title}</div>
                    <div className="text-xs text-text-muted">Meta: {goal.target}{goal.unit}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditGoalClick(goal)}
                      className="p-2 text-text-muted hover:text-primary transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-2 text-text-muted hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-text-muted uppercase tracking-widest border-b border-surface-border pb-2">
              {editingGoalId ? "Editar Meta" : "Nova Meta"}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted ml-1">Título</label>
                <input 
                  type="text" 
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="Ex: Ler 5 livros" 
                  className="w-full bg-background border border-surface-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted ml-1">Pilar</label>
                <select 
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                  className="w-full bg-background border border-surface-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                >
                  <option>Corpo</option>
                  <option>Alma</option>
                  <option>Trabalho</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted ml-1">Valor Inicial</label>
                <input 
                  type="number" 
                  value={newGoal.start_value}
                  onChange={(e) => setNewGoal({...newGoal, start_value: e.target.value})}
                  placeholder="0" 
                  className="w-full bg-background border border-surface-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted ml-1">Valor Atual</label>
                <input 
                  type="number" 
                  value={newGoal.current_value}
                  onChange={(e) => setNewGoal({...newGoal, current_value: e.target.value})}
                  placeholder="0" 
                  className="w-full bg-background border border-surface-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted ml-1">Meta Final</label>
                <input 
                  type="number" 
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal({...newGoal, target_value: e.target.value})}
                  placeholder="0" 
                  className="w-full bg-background border border-surface-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted ml-1">Unidade</label>
                <input 
                  type="text" 
                  value={newGoal.unit}
                  onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}
                  placeholder="Ex: kg, %, livros" 
                  className="w-full bg-background border border-surface-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary" 
                />
              </div>
            </div>
            <div className="flex gap-3">
              {editingGoalId && (
                <button 
                  onClick={() => {
                    setEditingGoalId(null);
                    setNewGoal({ title: "", category: "Corpo", target_value: "", unit: "", start_value: "", current_value: "" });
                  }}
                  className="flex-1 py-3 bg-surface border border-surface-border text-text-muted rounded-xl text-sm font-medium hover:bg-surface-border/50 transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button 
                onClick={handleAddGoal}
                className={cn(
                  "flex-[2] py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2",
                  editingGoalId 
                    ? "bg-primary text-white hover:bg-primary/90" 
                    : "bg-background border border-dashed border-primary/30 text-primary hover:bg-primary/5"
                )}
              >
                {editingGoalId ? (
                  <>
                    <Check className="w-4 h-4" />
                    Salvar Alterações
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Adicionar Meta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function GoalCard({ goal, color, onEdit }: any) {
  let percentage = 0;
  if (goal.inverse) {
    const totalDiff = goal.start - goal.target;
    const currentDiff = goal.start - goal.current;
    percentage = Math.max(0, Math.min(100, (currentDiff / totalDiff) * 100));
  } else {
    const totalDiff = goal.target - goal.start;
    const currentDiff = goal.current - goal.start;
    percentage = Math.max(0, Math.min(100, (currentDiff / totalDiff) * 100));
  }

  return (
    <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative">
      {onEdit && (
        <button 
          onClick={() => onEdit(goal)}
          className="absolute top-4 right-4 p-2 bg-background border border-surface-border rounded-lg text-text-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )}
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-medium text-secondary leading-snug pr-10">{goal.title}</h4>
        {percentage >= 100 ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        ) : (
          <Target className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-xl font-mono font-bold text-primary">
            {goal.current}<span className="text-sm font-sans font-normal text-text-muted">{goal.unit}</span>
          </span>
          <span className="text-xs font-mono text-text-muted">
            Meta: {goal.target}{goal.unit}
          </span>
        </div>
        
        <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-surface-border">
          <div 
            className={cn("h-full rounded-full transition-all duration-1000 ease-out", color)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
