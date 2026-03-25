import { 
  Brain, 
  BookOpen, 
  Sunrise, 
  Zap, 
  Smile, 
  CalendarDays, 
  Flame,
  CheckCircle2,
  Circle,
  Quote,
  Loader2
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function Alma() {
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [energyMoodData, setEnergyMoodData] = useState<any[]>([]);
  const [habitsTracker, setHabitsTracker] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchAlmaData();
    }
  }, [user]);

  const fetchAlmaData = async () => {
    if (!user) return;

    if (user.name === 'Wesley') {
      setEnergyMoodData([
        { day: "12/03", energia: 4, humor: 4 },
        { day: "13/03", energia: 3, humor: 4 },
        { day: "14/03", energia: 5, humor: 5 },
        { day: "15/03", energia: 4, humor: 3 },
        { day: "16/03", energia: 2, humor: 3 },
        { day: "17/03", energia: 4, humor: 4 },
        { day: "18/03", energia: 4, humor: 5 },
      ]);
      setHabitsTracker([
        { name: "Rotina Matinal", icon: Sunrise, days: [true, true, true, false, true, true, true] },
        { name: "Leitura (15m)", icon: BookOpen, days: [true, true, true, true, true, false, true] },
        { name: "Espiritualidade", icon: Brain, days: [false, true, true, true, true, true, true] },
        { name: "Organização", icon: CalendarDays, days: [true, true, false, true, true, true, true] },
      ]);
    } else {
      setEnergyMoodData([]);
      setHabitsTracker([]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Pilar 2</div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-primary">Alma & Mente</h1>
        </div>
        <div className="flex gap-3">
          <div className="bg-surface border border-surface-border px-5 py-2.5 rounded-full flex items-center gap-3 shadow-sm">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-medium text-secondary">Sequência: <span className="font-mono font-bold text-primary">{user?.name === 'Wesley' ? '12 Dias' : '0 Dias'}</span></span>
          </div>
        </div>
      </header>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Score Disciplina" value={user?.name === 'Wesley' ? "92" : "0"} subtext={user?.name === 'Wesley' ? "Excelente" : ""} icon={CheckCircle2} color="text-emerald-600" />
        <MetricCard label="Score Constância" value={user?.name === 'Wesley' ? "88" : "0"} subtext={user?.name === 'Wesley' ? "+5% vs semana ant." : ""} icon={CalendarDays} color="text-primary" />
        <MetricCard label="Média Energia" value={user?.name === 'Wesley' ? "3.8" : "0"} subtext="Meta: > 4.0" icon={Zap} color="text-yellow-500" />
        <MetricCard label="Média Humor" value={user?.name === 'Wesley' ? "4.1" : "0"} subtext="Estável" icon={Smile} color="text-blue-500" />
      </div>

      {/* Daily Note (Mais proeminente) */}
      <div className="bg-primary text-white rounded-[2.5rem] p-10 md:p-14 shadow-2xl shadow-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Quote className="w-8 h-8 text-white/40" />
            <h2 className="font-serif text-3xl font-semibold tracking-tight">Nota do Dia</h2>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <p className="text-white/90 text-xl md:text-2xl leading-relaxed font-light italic max-w-4xl">
              "A disciplina de hoje é o conforto de amanhã. Manter a rotina matinal mesmo cansado fez toda a diferença na produtividade da tarde."
            </p>
            <div className="text-sm font-mono text-white/50 uppercase tracking-widest whitespace-nowrap border-l border-white/10 pl-8 hidden md:block">
              Ontem, 17 de Março
            </div>
            <div className="text-xs font-mono text-white/40 uppercase tracking-widest md:hidden">
              Ontem, 17 de Março
            </div>
          </div>
        </div>
      </div>

      {/* Habit Tracker (Full Width) */}
      <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm overflow-x-auto">
        <h2 className="font-serif text-2xl font-semibold text-secondary mb-6">Consistência de Hábitos</h2>
        
        <div className="min-w-[600px]">
          {/* Header Dias */}
          <div className="flex mb-4">
            <div className="w-48 flex-shrink-0"></div>
            <div className="flex-1 flex justify-between px-4">
              {["D-6", "D-5", "D-4", "D-3", "D-2", "Ontem", "Hoje"].map((day, i) => (
                <div key={i} className="text-[10px] font-mono text-text-muted uppercase tracking-wider w-10 text-center">
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Linhas de Hábitos */}
          <div className="space-y-4">
            {habitsTracker.length === 0 ? (
              <div className="text-center py-8 text-text-muted italic">Nenhum hábito rastreado ainda.</div>
            ) : (
              habitsTracker.map((habit, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="w-48 flex-shrink-0 flex items-center gap-3">
                    <div className="p-2 bg-background border border-surface-border rounded-lg">
                      <habit.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-sm text-secondary">{habit.name}</span>
                  </div>
                  <div className="flex-1 flex justify-between px-4">
                    {habit.days.map((done: boolean, i: number) => (
                      <div key={i} className="w-10 flex justify-center">
                        {done ? (
                          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-md bg-background border border-surface-border flex items-center justify-center">
                            <Circle className="w-3 h-3 text-surface-border" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Wins */}
        <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-secondary mb-6">Últimas Vitórias</h2>
          <div className="space-y-4">
            <WinItem day="Ontem" text="Fechei todos os anéis do Apple Watch e li 20 páginas." />
            <WinItem day="D-2" text="Resisti à sobremesa no jantar de negócios." />
            <WinItem day="D-3" text="Acordei às 05:30 sem usar o botão soneca." />
          </div>
        </div>

        {/* Energy & Mood Chart */}
        <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-xl font-semibold text-secondary">Energia vs. Humor</h2>
            <div className="flex gap-4 text-[10px] uppercase font-bold tracking-wider">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-text-muted">Energia</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-text-muted">Humor</span>
              </div>
            </div>
          </div>
          
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={energyMoodData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEnergia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FACC15" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FACC15" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHumor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E2D9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  dy={10}
                />
                <YAxis 
                  domain={[0, 5]} 
                  ticks={[1, 2, 3, 4, 5]}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A1A1A', 
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ fontFamily: 'JetBrains Mono', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="energia" stroke="#FACC15" strokeWidth={3} fillOpacity={1} fill="url(#colorEnergia)" />
                <Area type="monotone" dataKey="humor" stroke="#60A5FA" strokeWidth={3} fillOpacity={1} fill="url(#colorHumor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subtext, icon: Icon, color }: any) {
  return (
    <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="text-xs font-bold text-text-muted uppercase tracking-widest">{label}</div>
        <Icon className={cn("w-4 h-4", color || "text-text-muted")} />
      </div>
      <div className="text-3xl font-serif font-bold text-secondary mb-1">{value}</div>
      <div className="text-xs font-medium text-text-muted">
        {subtext}
      </div>
    </div>
  );
}

function WinItem({ day, text }: { day: string, text: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-12 flex-shrink-0 text-xs font-mono text-text-muted pt-1">{day}</div>
      <div className="flex-1 bg-background border border-surface-border rounded-xl p-3 text-sm text-secondary">
        {text}
      </div>
    </div>
  );
}
