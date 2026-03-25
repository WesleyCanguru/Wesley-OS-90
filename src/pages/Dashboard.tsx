import { useNavigate } from "react-router-dom";
import { 
  Activity, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  ChevronRight, 
  Zap, 
  CalendarCheck, 
  Loader2,
  Scale,
  Utensils,
  Dumbbell,
  Flame,
  Droplets,
  Plus,
  Calendar,
  Check,
  XIcon,
  Sparkles
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCycleInfo } from "@/lib/cycle";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const navigate = useNavigate();
  const user = useUser();
  const { startDate, endDate, currentDay, totalDays, cycleProgress, currentWeek } = getCycleInfo();
  const [loading, setLoading] = useState(true);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  };
  
  const [todayStats, setTodayStats] = useState({
    weight: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    workout: null as any,
    energy: 0,
    mood: 0,
    water: 0,
    habitsDone: 0,
    totalHabits: 0
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<any[]>([]);
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchHabitData();
    }
  }, [user]);

  // Configura as datas da semana atual (Segunda a Domingo)
  useEffect(() => {
    const dates = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diffToMonday));

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    setWeekDates(dates);
  }, []);

  const fetchHabitData = async () => {
    if (!user) return;
    
    try {
      // 1. Fetch all habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_name', user.name)
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;
      setHabits(habitsData || []);

      // 2. Fetch logs for the current week
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diffToMonday));
      monday.setHours(0, 0, 0, 0);

      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_name', user.name)
        .gte('date', monday.toISOString().split('T')[0]);

      if (logsError) throw logsError;
      setWeeklyLogs(logsData || []);
    } catch (error) {
      console.error("Erro ao buscar dados de hábitos:", error);
    }
  };

  const getLogForDate = (habitId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return weeklyLogs.find(log => log.habit_id === habitId && log.date === dateStr);
  };

  const calculateHabitWeeklyPercentage = (habit: any) => {
    const logs = weeklyLogs.filter(log => log.habit_id === habit.id && log.completed);
    const totalDays = 7;
    const targetDays = habit.frequency_per_week || 7;
    return Math.round((logs.length / targetDays) * 100);
  };

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 1. Fetch Latest Weight
      const { data: weightData } = await supabase
        .from('body_stats')
        .select('weight')
        .eq('user_name', user.name)
        .order('created_at', { ascending: false })
        .limit(1);

      // 2. Fetch Today's Food Logs
      const { data: foodData } = await supabase
        .from('food_logs')
        .select('calories, protein, carbs, fat')
        .eq('user_name', user.name)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      // 3. Fetch Today's Workout
      const { data: workoutData } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_name', user.name)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .limit(1);

      // 4. Fetch Today's Check-in
      const { data: checkinData } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_name', user.name)
        .eq('date', today.toISOString().split('T')[0])
        .limit(1);

      const calories = foodData?.reduce((acc, curr) => acc + (curr.calories || 0), 0) || 0;
      const protein = foodData?.reduce((acc, curr) => acc + (curr.protein || 0), 0) || 0;
      const carbs = foodData?.reduce((acc, curr) => acc + (curr.carbs || 0), 0) || 0;
      const fats = foodData?.reduce((acc, curr) => acc + (curr.fat || 0), 0) || 0;

      const habits = checkinData?.[0]?.habits || {};
      const habitsDone = Object.values(habits).filter(v => v === true).length;
      const totalHabits = Object.keys(habits).length;

      setTodayStats({
        weight: weightData?.[0]?.weight || 0,
        calories,
        protein,
        carbs,
        fats,
        workout: workoutData?.[0] || null,
        energy: checkinData?.[0]?.energy || 0,
        mood: checkinData?.[0]?.mood || 0,
        water: checkinData?.[0]?.water || 0,
        habitsDone,
        totalHabits
      });

      // 5. Recent Activity (Mocking or fetching a mix)
      // For now, let's just show a few recent items
      setRecentActivity([
        { type: 'food', title: 'Refeição Registrada', time: 'Há 2 horas', value: `${calories} kcal` },
        { type: 'workout', title: workoutData?.[0] ? 'Treino Concluído' : 'Treino Pendente', time: 'Hoje', value: workoutData?.[0]?.type || '--' },
        { type: 'checkin', title: 'Check-in Diário', time: checkinData?.[0] ? 'Concluído' : 'Pendente', value: checkinData?.[0] ? 'OK' : '--' }
      ]);

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const nutritionTargets = user?.name === 'Sarah' 
    ? { calories: 1200, protein: 96, carbs: 135, fats: 30 }
    : { calories: 2200, protein: 180, carbs: 170, fats: 80 };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-primary mb-2">Dashboard Geral</h1>
          <p className="text-text-muted text-lg">Olá, {user?.name}. Aqui está o resumo do seu dia.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Progresso do Ciclo (Compacto) */}
          <div className="bg-surface border border-surface-border rounded-2xl p-4 shadow-sm min-w-[280px]">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Dia {currentDay} de {totalDays}</span>
              </div>
              <span className="text-xs font-mono font-bold text-primary">{Math.round(cycleProgress)}%</span>
            </div>
            <div className="h-2 w-full bg-background rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000" 
                style={{ width: `${cycleProgress}%` }} 
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted font-medium">
              <span>Início: {formatDate(startDate)}</span>
              <span>Fim: {formatDate(endDate)}</span>
            </div>
          </div>

          <button 
            onClick={() => navigate("/hoje")}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group"
          >
            <CalendarCheck className="w-6 h-6 group-hover:scale-110 transition-transform" />
            Check-in Hoje
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          label="Peso" 
          value={`${todayStats.weight} kg`} 
          icon={Scale} 
          onClick={() => navigate("/corpo")}
        />
        <SummaryCard 
          label="Calorias" 
          value={`${todayStats.calories}`} 
          subtext={`Meta: ${nutritionTargets.calories}`}
          icon={Flame} 
          onClick={() => navigate("/corpo")}
          color="text-orange-500"
        />
        <SummaryCard 
          label="Treino" 
          value={todayStats.workout ? todayStats.workout.type : "Pendente"} 
          subtext={todayStats.workout ? `${todayStats.workout.duration} min` : "Não registrado"}
          icon={Dumbbell} 
          onClick={() => navigate("/treinos")}
          color={todayStats.workout ? "text-emerald-600" : "text-amber-500"}
        />
        <SummaryCard 
          label="Alma" 
          value={todayStats.energy > 0 ? `Energia: ${todayStats.energy}` : "Pendente"} 
          subtext={todayStats.habitsDone > 0 ? `${todayStats.habitsDone} hábitos OK` : "Check-in pendente"}
          icon={Brain} 
          onClick={() => navigate("/alma")}
          color="text-primary"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Body & Nutrition */}
        <div className="space-y-8">
          {/* Nutrition Progress */}
          <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl font-semibold text-secondary">Nutrição Hoje</h2>
              <button onClick={() => navigate("/corpo")} className="text-sm font-bold text-primary hover:underline">Ver Detalhes</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 flex flex-col items-center justify-center border-r border-surface-border pr-8">
                <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="58" fill="transparent" stroke="#E5E2D9" strokeWidth="8" />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-primary"
                      strokeDasharray={`${2 * Math.PI * 58}`}
                      strokeDashoffset={`${2 * Math.PI * 58 * (1 - Math.min(1, todayStats.calories / nutritionTargets.calories))}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-serif font-bold text-secondary">{todayStats.calories}</span>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">kcal</span>
                  </div>
                </div>
                <p className="text-xs text-text-muted font-medium text-center">Consumido de {nutritionTargets.calories} kcal</p>
              </div>

              <div className="md:col-span-2 space-y-6">
                <MacroBar label="Proteína" current={todayStats.protein} target={nutritionTargets.protein} unit="g" color="bg-emerald-500" />
                <MacroBar label="Carboidratos" current={todayStats.carbs} target={nutritionTargets.carbs} unit="g" color="bg-blue-500" />
                <MacroBar label="Gorduras" current={todayStats.fats} target={nutritionTargets.fats} unit="g" color="bg-orange-500" />
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-secondary mb-6">Atividade Recente</h2>
            <div className="space-y-6">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex gap-4">
                  <div className="relative">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm",
                      activity.type === 'food' ? 'bg-orange-500' : 
                      activity.type === 'workout' ? 'bg-emerald-500' : 'bg-primary'
                    )}>
                      {activity.type === 'food' ? <Utensils className="w-5 h-5" /> : 
                       activity.type === 'workout' ? <Dumbbell className="w-5 h-5" /> : <CalendarCheck className="w-5 h-5" />}
                    </div>
                    {i < recentActivity.length - 1 && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-10 bg-surface-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-secondary">{activity.title}</h3>
                      <span className="text-[10px] font-mono text-text-muted uppercase">{activity.time}</span>
                    </div>
                    <p className="text-xs text-text-muted">{activity.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Insights & Activity */}
        <div className="space-y-8">
          {/* AI Insight Section */}
          <div className="bg-primary text-white rounded-3xl p-8 relative overflow-hidden shadow-lg flex flex-col min-h-[240px] justify-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 bg-white/10 rounded-full">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-serif text-2xl font-semibold">Insight do Dia</h2>
            </div>
            <p className="text-white/80 leading-relaxed text-lg relative z-10 font-light italic">
              {todayStats.workout 
                ? "Excelente trabalho no treino de hoje! Mantenha o foco na ingestão de proteínas para otimizar sua recuperação muscular."
                : "Ainda não registrou seu treino? Lembre-se que a constância é o segredo do progresso. Um treino curto é melhor que nenhum treino!"}
            </p>
            <div className="mt-8 flex items-center gap-2 relative z-10">
              <Sparkles className="w-4 h-4 text-white/60" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Gerado por Inteligência Artificial</span>
            </div>
          </div>

          {/* Soul & Mind Summary */}
          <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-semibold text-secondary">Alma & Mente</h2>
              <Brain className="w-5 h-5 text-primary" />
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-400/10 rounded-lg">
                    <Zap className="w-4 h-4 text-yellow-500" />
                  </div>
                  <span className="text-sm font-medium text-secondary">Energia</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-2 h-4 rounded-sm transition-all",
                        i <= todayStats.energy ? "bg-yellow-400" : "bg-surface-border"
                      )} 
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-400/10 rounded-lg">
                    <Droplets className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium text-secondary">Água</span>
                </div>
                <div className="text-sm font-bold text-secondary">{todayStats.water} <span className="text-[10px] text-text-muted">ml</span></div>
              </div>

              <div className="p-4 bg-background rounded-2xl border border-surface-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-secondary">Hábitos Concluídos</span>
                  <span className="text-xs font-bold text-primary">{todayStats.habitsDone}/{todayStats.totalHabits}</span>
                </div>
                <div className="h-2 w-full bg-surface-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000" 
                    style={{ width: `${todayStats.totalHabits > 0 ? (todayStats.habitsDone / todayStats.totalHabits) * 100 : 0}%` }} 
                  />
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => navigate("/alma")}
              className="w-full mt-6 py-3 border border-surface-border rounded-xl text-sm font-bold text-text-muted hover:bg-surface-hover hover:text-secondary transition-all"
            >
              Ver Pilar Alma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, subtext, icon: Icon, color, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="bg-surface border border-surface-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</div>
        <Icon className={cn("w-4 h-4", color || "text-text-muted", "group-hover:scale-110 transition-transform")} />
      </div>
      <div className="text-2xl font-serif font-bold text-secondary truncate">{value}</div>
      {subtext && <div className="text-[10px] text-text-muted font-medium mt-1">{subtext}</div>}
    </div>
  );
}

function MacroBar({ label, current, target, unit, color }: any) {
  const percentage = Math.min(100, (current / target) * 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-sm font-medium text-secondary">{label}</span>
        <span className="text-xs font-mono text-text-muted">
          <span className="font-bold text-secondary">{current}</span> / {target}{unit}
        </span>
      </div>
      <div className="h-2 w-full bg-background border border-surface-border rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000", color)} 
          style={{ width: `${percentage}%` }} 
        />
      </div>
    </div>
  );
}

