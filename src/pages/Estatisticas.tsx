import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Target, 
  Trophy,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";
import { useCycle } from "@/hooks/useCycle";

type Habit = {
  id: string;
  name: string;
  color?: string;
  frequency_per_week: number;
};

type HabitLog = {
  id: string;
  habit_id: string;
  date: string;
  completed: boolean;
};

export function Estatisticas() {
  const user = useUser();
  const { cycle } = useCycle();
  const [loading, setLoading] = useState(true);
  const [habitsData, setHabitsData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [overview, setOverview] = useState({
    aderenciaSemanal: 0,
    aderenciaMensal: 0,
    aderenciaTotal: 0,
    totalConcluido: 0,
    habitosAtivos: 0,
    maisConsistente: { name: "---", val: "0%" },
    maiorStreak: { name: "---", val: "0 dias" },
    maisExecutado: { name: "---", val: "0 conclusões" }
  });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, cycle]);

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [habitsRes, logsRes, goalsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_name', user.name),
        supabase.from('habit_logs').select('*').eq('user_name', user.name),
        supabase.from('cycle_outcomes').select('*').eq('user_name', user.name).order('created_at', { ascending: true })
      ]);

      const habits = habitsRes.data || [];
      const logs = logsRes.data || [];
      const outcomes = goalsRes.data || [];
      
      setGoals(outcomes);

      const activeHabits = habits.length || 0;
      const totalConcluido = logs.filter(l => l.completed).length || 0;

      // ... existing processing logic ...
      const now = new Date();
      // ... (no changes to processing logic inside fetchStats, but need to keep it consistent)
      
      // Calculate Monday of current week
      const currentWeekMonday = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      currentWeekMonday.setDate(diff);
      currentWeekMonday.setHours(0, 0, 0, 0);

      const lastWeekMonday = new Date(currentWeekMonday);
      lastWeekMonday.setDate(currentWeekMonday.getDate() - 7);

      const nextMonday = new Date(currentWeekMonday);
      nextMonday.setDate(currentWeekMonday.getDate() + 7);

      const processedHabits = (habits || []).map(h => {
        const allHLogs = (logs || []).filter(l => l.habit_id === h.id && l.completed);
        
        const getWeekAdherence = (start: Date, end: Date) => {
          const count = allHLogs.filter(l => {
            const d = new Date(l.date + 'T12:00:00');
            return d >= start && d < end;
          }).length;
          const expected = h.frequency_per_week || 7;
          return Math.min(100, Math.round((count / expected) * 100));
        };

        const currentWeekAd = getWeekAdherence(currentWeekMonday, nextMonday);
        const lastWeekAd = getWeekAdherence(lastWeekMonday, currentWeekMonday);
        
        let cycleAd = 0;
        if (cycle) {
          const cycleStart = new Date(cycle.start_date + 'T12:00:00');
          const cycleLogs = allHLogs.filter(l => {
            const d = new Date(l.date + 'T12:00:00');
            return d >= cycleStart && d <= now;
          });

          const elapsedMs = now.getTime() - cycleStart.getTime();
          const weeksElapsed = Math.max(1, elapsedMs / (1000 * 3600 * 24 * 7));
          const totalExpectedSoFar = weeksElapsed * (h.frequency_per_week || 7);
          
          cycleAd = Math.min(100, Math.round((cycleLogs.length / totalExpectedSoFar) * 100));
        }

        return {
          ...h,
          totalDone: allHLogs.length,
          adCurrent: currentWeekAd,
          adLast: lastWeekAd,
          adCycle: cycleAd
        };
      });

      // (Weekly score logic continues...)
      let weeklyScores: number[] = [];
      let currentWeekScore = 0;
      if (cycle) {
        const cycleStart = new Date(cycle.start_date + 'T12:00:00');
        const cycleWeeks = [];
        const totalExpectedPerWeek = habits?.reduce((acc, h) => acc + (h.frequency_per_week || 7), 0) || 0;

        for (let i = 0; i < 12; i++) {
          const weekStart = new Date(cycleStart);
          weekStart.setDate(cycleStart.getDate() + (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);

          const weekLogsCount = (logs || []).filter(l => {
            const d = new Date(l.date + 'T12:00:00');
            return d >= weekStart && d <= weekEnd && l.completed;
          }).length;

          const score = totalExpectedPerWeek > 0 ? Math.min(100, Math.round((weekLogsCount / totalExpectedPerWeek) * 100)) : 0;
          
          const isCurrent = now >= weekStart && now <= weekEnd;
          const isPast = now > weekEnd;
          
          if (isCurrent) currentWeekScore = score;
          if (isPast || isCurrent) weeklyScores.push(score);

          cycleWeeks.push({
            week: i + 1,
            score,
            isCurrent,
            isFuture: now < weekStart
          });
        }
        setWeeklyData(cycleWeeks);
      }

      setHabitsData(processedHabits);
      setOverview({
        aderenciaSemanal: currentWeekScore,
        aderenciaMensal: weeklyScores.length > 0 ? Math.round(weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length) : 0,
        aderenciaTotal: weeklyScores.length > 0 ? Math.round(weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length) : 0,
        totalConcluido,
        habitosAtivos: activeHabits,
        maisConsistente: processedHabits.length > 0 ? { name: [...processedHabits].sort((a,b) => b.adCycle - a.adCycle)[0].name, val: `Melhor média de ciclo` } : { name: '---', val: '0%' },
        maiorStreak: { name: '---', val: 'Em breve' },
        maisExecutado: processedHabits.length > 0 ? { name: [...processedHabits].sort((a,b) => b.totalDone - a.totalDone)[0].name, val: `${[...processedHabits].sort((a,b) => b.totalDone - a.totalDone)[0].totalDone} conclusões` } : { name: '---', val: '0 conclusões' }
      });

    } catch (error) {
       console.error("Error fetching stats;", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 pb-16 px-4 md:px-0">
      <header className="space-y-3 md:space-y-4">
        <h1 className="text-3xl md:text-5xl font-display font-bold text-secondary tracking-tight">
          Estatísticas
        </h1>
        <p className="text-text-muted text-base md:text-lg max-w-lg font-medium">Seu progresso no Ano de 12 Semanas.</p>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <StatCard 
          label="ADERÊNCIA DA SEMANA" 
          value={`${overview.aderenciaSemanal}%`} 
          icon={TrendingUp}
          color="text-primary"
          description="Meta do livro: 85%"
        />
        <StatCard 
          label="TOTAL CONCLUÍDO" 
          value={overview.totalConcluido.toString()} 
          icon={Target}
          color="text-accent"
          description="Evolução acumulada"
        />
        <StatCard 
          label="HÁBITOS ATIVOS" 
          value={overview.habitosAtivos.toString()} 
          icon={Trophy}
          color="text-orange-500"
          description="Disciplinas em foco"
        />
      </div>

      {/* Cycle Weekly performance - The "12 Week Year" Heart */}
      {cycle && (
        <section className="bg-surface border border-surface-border rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold text-secondary">Execução Semanal</h2>
              <p className="text-xs text-text-muted font-medium mt-1">Sua jornada nas 12 semanas do ciclo atual</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/10">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Meta: 85%</span>
            </div>
          </div>

          <p className="text-xs text-text-muted block md:hidden -mt-4 bg-background/50 p-2.5 rounded-lg border border-surface-border/50">
            💡 <span className="font-semibold">Dica:</span> Toque em uma barra para destacá-la e ver os dados de adesão.
          </p>

          <div className="flex flex-col gap-3 h-60 md:h-72 pt-8">
            {/* Arena unificada de barras e rótulos para alinhamento absoluto e preciso */}
            <div className="relative flex-1 flex gap-2 md:gap-3 items-stretch">
              {/* Linha guia de 85% para a meta do livro */}
              <div 
                className="absolute left-0 right-0 border-t border-dashed border-primary/45 pointer-events-none z-0" 
                style={{ bottom: '85%' }} 
              />
              <span 
                className="absolute right-0 -top-5 text-[9px] font-bold text-primary/75 bg-surface/90 px-1 rounded border border-primary/10 tracking-widest uppercase pointer-events-none"
                style={{ bottom: '85%' }}
              >
                Meta 85%
              </span>
              
              {weeklyData.map((w) => (
                <div key={w.week} className="flex-1 flex flex-col justify-end items-center h-full group relative z-10">
                  {/* Container da barra */}
                  <div className="relative w-full flex-1 flex items-end justify-center min-h-[40px]">
                    <div 
                      className={cn(
                        "w-full max-w-[28px] rounded-t-lg transition-all duration-300 relative cursor-pointer flex flex-col justify-end",
                        w.isFuture 
                          ? "bg-surface-border/15 h-[10%]" 
                          : w.score >= 85 
                            ? "bg-primary hover:brightness-105" 
                            : "bg-accent/45 hover:brightness-105",
                        w.isCurrent && "ring-2 ring-primary ring-offset-4 ring-offset-surface",
                        selectedWeek === w.week && "ring-4 ring-primary ring-offset-2 ring-offset-surface scale-105 z-30"
                      )}
                      style={{ height: w.isFuture ? '10%' : `${Math.max(10, w.score)}%` }}
                      onClick={() => {
                        if (!w.isFuture) {
                          setSelectedWeek(selectedWeek === w.week ? null : w.week);
                        }
                      }}
                    >
                      {/* Percentual sob a barra - sempre visível em telas menores ou no active do desktop */}
                      {!w.isFuture && (
                        <div className={cn(
                          "absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] font-extrabold whitespace-nowrap px-1.5 py-0.5 rounded shadow-sm z-20 pointer-events-none transition-all transform scale-95 opacity-0 md:group-hover:opacity-100 md:group-hover:scale-100 bg-secondary text-white",
                          // Se for tela de toque/mobile, mostramos sempre de maneira limpa para facilitar ver os números
                          "block md:hidden opacity-100 scale-100 !bg-secondary/90",
                          // Se clicado/ativado em qualquer tamanho
                          selectedWeek === w.week && "!opacity-100 !scale-110 bg-primary ring-1 ring-white/30 !text-[11px] pb-1"
                        )}>
                          {w.score}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Nome da semana exatamente sob a barra */}
                  <span className={cn(
                    "text-[10px] font-bold mt-2.5 block text-center w-full truncate transition-all duration-200 border-t border-transparent pt-1",
                    w.isCurrent ? "text-primary border-t-2 border-primary/20 pt-1 font-black scale-105" : "text-text-muted"
                  )}>
                    S{w.week}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-surface-border flex flex-wrap gap-4 md:gap-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-sm" />
              <span className="text-xs font-bold text-text-muted">META ALCANÇADA (85%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent/40 rounded-sm" />
              <span className="text-xs font-bold text-text-muted">ABAIXO DA META</span>
            </div>
          </div>
        </section>
      )}

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <MiniStatCard label="MAIS CONSISTENTE" value={overview.maisConsistente.name} subtext={overview.maisConsistente.val} />
        <MiniStatCard label="MAIOR STREAK" value={overview.maiorStreak.name} subtext={overview.maiorStreak.val} icon={Flame} />
        <MiniStatCard label="MAIS EXECUTADO" value={overview.maisExecutado.name} subtext={overview.maisExecutado.val} />
      </div>

      {/* Por Hábito Section */}
      <section className="space-y-8 pt-6">
        <header>
          <h2 className="text-2xl font-display font-bold text-secondary">Aderência por Hábito</h2>
          <p className="text-xs text-text-muted font-medium mt-1">Visão detalhada do seu compromisso com cada disciplina</p>
        </header>
        
        <div className="space-y-12">
          {[...goals, { id: null, title: 'Hábitos de Manutenção' }].map((group) => {
            const groupHabits = habitsData.filter(h => h.goal_id === group.id || (!h.goal_id && group.id === null));
            if (groupHabits.length === 0) return null;

            return (
              <div key={group.id || 'unlinked'} className="space-y-6">
                <div className="flex items-center gap-3 border-b border-surface-border pb-4">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    group.id ? "bg-primary" : "bg-accent"
                  )} />
                  <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.4em] font-display">
                    {group.title}
                  </h3>
                  <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest ml-auto">
                    {groupHabits.length} Itens
                  </span>
                </div>

                <div className="space-y-4">
                  {groupHabits.map(habit => (
                    <div key={habit.id} className="bg-surface border border-surface-border rounded-2xl p-5 md:p-6 shadow-sm group hover:border-primary/20 transition-all">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-2xl flex-shrink-0 shadow-inner border border-black/5 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-rotate-3"
                            style={{ backgroundColor: habit.color || '#5A8D6E' }}
                          >
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-secondary text-base md:text-lg leading-tight uppercase tracking-tight">{habit.name}</h3>
                            <p className="text-[10px] text-text-muted mt-1 font-bold uppercase tracking-widest">
                               {habit.area || "Geral"} &middot; Frequência: {habit.frequency_per_week}x
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-muted font-bold">
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-hover rounded-lg border border-surface-border/50"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> {habit.totalDone}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                        <ProgressBar label="Esta Semana" percent={habit.adCurrent} color={habit.color || '#5A8D6E'} />
                        <ProgressBar label="Semana Passada" percent={habit.adLast} color={habit.color || '#5A8D6E'} />
                        <ProgressBar label="Média do Ciclo" percent={habit.adCycle} color={habit.color || '#5A8D6E'} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {habitsData.length === 0 && !loading && (
             <div className="text-center py-12 text-sm text-text-muted bg-surface border border-surface-border rounded-xl">
               Nenhum hábito cadastrado ainda.
             </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ProgressBar({ label, percent, color }: { label: string, percent: number, color: string }) {
  const displayPercent = Math.min(percent, 100);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] font-bold text-text-muted uppercase tracking-wider">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-surface-border">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${displayPercent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, description }: any) {
  return (
    <div className="bg-surface border border-surface-border rounded-2xl p-6 md:p-8 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</span>
        <div className="text-3xl md:text-4xl font-display font-bold text-secondary">{value}</div>
        {description && <p className="text-[10px] font-bold text-primary italic uppercase tracking-wider">{description}</p>}
      </div>
      <div className={cn("p-4 rounded-xl bg-opacity-10", color.replace('text-', 'bg-'))}>
        <Icon className={cn("w-6 h-6", color)} />
      </div>
    </div>
  );
}

function MiniStatCard({ label, value, subtext, icon: Icon }: any) {
  return (
    <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-sm group hover:border-primary/20 transition-all">
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-2 mt-2">
        {Icon && <Icon className="w-4 h-4 text-orange-500" />}
        <div className="text-lg md:text-xl font-display font-bold text-secondary truncate">{value}</div>
      </div>
      <div className="text-xs font-medium text-text-muted mt-1">{subtext}</div>
    </div>
  );
}

