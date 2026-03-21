import { useNavigate } from "react-router-dom";
import { Activity, Brain, TrendingUp, AlertTriangle, ChevronRight, Zap, CalendarCheck, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function Dashboard() {
  const navigate = useNavigate();
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    corpo: 0,
    alma: 0,
    peso: "0 kg",
    dieta: "0%",
    energia: "0",
    disciplina: "0"
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      // Se for a Sarah e não tiver dados, mantemos os zeros
      // Se for o Wesley, os dados de semente já estarão no banco
      
      const { data: bodyData } = await supabase
        .from('body_stats')
        .select('weight')
        .eq('user_name', user.name)
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: checkinData } = await supabase
        .from('daily_checkins')
        .select('energy, habits')
        .eq('user_name', user.name)
        .order('date', { ascending: false })
        .limit(7);

      if (user.name === 'Wesley' || (bodyData && bodyData.length > 0)) {
        const currentWeight = bodyData?.[0]?.weight || 0;
        const avgEnergy = checkinData?.length 
          ? (checkinData.reduce((acc, curr) => acc + (curr.energy || 0), 0) / checkinData.length).toFixed(1)
          : "0";

        setStats({
          corpo: user.name === 'Wesley' ? 85 : 0,
          alma: user.name === 'Wesley' ? 92 : 0,
          peso: `${currentWeight} kg`,
          dieta: user.name === 'Wesley' ? "90%" : "0%",
          energia: avgEnergy,
          disciplina: user.name === 'Wesley' ? "92" : "0"
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-primary mb-2">Olá, {user?.name}</h1>
          <p className="text-text-muted text-lg">Seu progresso individual e hábitos.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <button 
            onClick={() => navigate("/hoje")}
            className="bg-primary text-white px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 group"
          >
            <CalendarCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Fazer Check-in Hoje
          </button>
          <div className="md:text-right bg-surface px-6 py-3 rounded-2xl border border-surface-border shadow-sm">
            <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Ciclo Atual</div>
            <div className="text-3xl font-serif font-bold text-primary">DIA 18 <span className="text-text-muted text-xl font-sans font-normal">/ 90</span></div>
          </div>
        </div>
      </header>

      {/* Main Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScoreCard 
          title="Corpo" 
          score={stats.corpo} 
          trend={user?.name === 'Wesley' ? "+2%" : ""} 
          icon={Activity} 
          onClick={() => navigate("/corpo")}
        />
        <ScoreCard 
          title="Alma" 
          score={stats.alma} 
          trend={user?.name === 'Wesley' ? "+5%" : ""} 
          icon={Brain} 
          onClick={() => navigate("/alma")}
        />
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insight do Dia */}
        <div className="lg:col-span-2 bg-primary text-white rounded-3xl p-8 relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 bg-white/10 rounded-full">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-serif text-2xl font-semibold">Insight Pessoal</h2>
          </div>
          <p className="text-white/80 leading-relaxed text-lg relative z-10 font-light">
            {user?.name === 'Wesley' 
              ? "Sua consistência de leitura matinal atingiu uma sequência de 5 dias. Priorize o descanso hoje para manter o pilar Alma em alta."
              : "Comece seu desafio hoje! Registre seu primeiro check-in para gerar insights personalizados sobre sua rotina."}
          </p>
        </div>

        {/* Alertas / Pendências */}
        <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-50 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-secondary">Atenção</h2>
          </div>
          <ul className="space-y-4">
            {user?.name === 'Wesley' ? (
              <>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                  <span className="text-text-muted leading-snug">Faltam 300ml de água para a meta de ontem.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                  <span className="text-text-muted leading-snug">Você não registrou a foto de progresso desta semana.</span>
                </li>
              </>
            ) : (
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                <span className="text-text-muted leading-snug">Tudo em dia! Aguardando seus registros de hoje.</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Quick Metrics */}
      <div>
        <h2 className="text-2xl font-serif font-semibold text-primary mb-6">Desempenho Recente</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Peso Atual" value={stats.peso} subtext={user?.name === 'Wesley' ? "Tendência: Baixa" : ""} />
          <MetricCard label="Aderência Dieta" value={stats.dieta} subtext={user?.name === 'Wesley' ? "Últimos 7 dias" : ""} />
          <MetricCard label="Média Energia" value={stats.energia} subtext="Escala 1-5" />
          <MetricCard label="Score Disciplina" value={stats.disciplina} subtext={user?.name === 'Wesley' ? "Excelente" : ""} />
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ title, score, trend, icon: Icon, alert, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="bg-surface border border-surface-border rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-8">
        <div className="p-3 rounded-2xl bg-background text-primary border border-surface-border group-hover:bg-primary group-hover:text-white transition-colors">
          <Icon className="w-6 h-6" />
        </div>
        {alert && (
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </div>
      
      <div className="mt-auto">
        <h3 className="text-text-muted font-medium mb-2 text-sm uppercase tracking-widest">{title}</h3>
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-serif font-bold text-secondary">{score}</span>
          <span className={`text-sm font-mono font-medium ${trend.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend}
          </span>
        </div>
      </div>
      
      <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
        <ChevronRight className="w-6 h-6 text-primary" />
      </div>
    </div>
  );
}

function MetricCard({ label, value, subtext }: any) {
  return (
    <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">{label}</div>
      <div className="text-2xl font-serif font-semibold text-secondary mb-1">{value}</div>
      <div className="text-xs text-text-muted">{subtext}</div>
    </div>
  );
}
