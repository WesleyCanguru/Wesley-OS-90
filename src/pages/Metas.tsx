import { useState } from "react";
import { 
  Target, 
  Flag, 
  Calendar, 
  Activity, 
  Brain, 
  Briefcase, 
  Trophy,
  Compass,
  CheckCircle2,
  Plus,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/Modal";

// Dados simulados das metas
const initialGoalsData = {
  corpo: [
    { id: 1, title: "Reduzir BF para 12%", current: 16.5, target: 12, unit: "%", inverse: true, start: 18 },
    { id: 2, title: "Correr 5km sub 25min", current: 28, target: 24.5, unit: "m", inverse: true, start: 32 },
  ],
  alma: [
    { id: 3, title: "Ler 3 livros de negócios", current: 1, target: 3, unit: " livros", start: 0 },
    { id: 4, title: "Meditar 60 dias no ciclo", current: 12, target: 60, unit: " dias", start: 0 },
  ],
  trabalho: [
    { id: 5, title: "Faturar R$ 40k no ciclo", current: 15.4, target: 40, unit: "k", start: 0 },
    { id: 6, title: "Fechar 10 clientes High-Ticket", current: 3, target: 10, unit: " clientes", start: 0 },
  ]
};

export function Metas() {
  const currentDay = 18;
  const totalDays = 90;
  const cycleProgress = Math.round((currentDay / totalDays) * 100);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [goals, setGoals] = useState(initialGoalsData);

  const handleEditGoals = () => {
    setIsEditModalOpen(true);
  };

  const handleViewGoal = (goal: any) => {
    console.log(`Visualizando meta: ${goal.title}`);
    alert(`Detalhes da meta "${goal.title}" em desenvolvimento.`);
  };

  const handleViewMilestone = (milestone: any) => {
    console.log(`Visualizando marco: ${milestone.label}`);
    alert(`Detalhes do marco "${milestone.label}" em desenvolvimento.`);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Visão Macro</div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-primary">Metas 90 Dias</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleEditGoals}
            className="bg-surface border border-surface-border text-primary px-5 py-2.5 rounded-full font-medium hover:bg-surface-hover transition-colors flex items-center gap-2 shadow-sm"
          >
            <Target className="w-4 h-4" />
            Editar Metas
          </button>
        </div>
      </header>

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
              <span>Início: 01 Mar</span>
              <span>Fim: 29 Mai</span>
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
          <div className="flex items-center gap-3 pb-4 border-b border-surface-border">
            <Activity className="w-5 h-5 text-text-muted" />
            <h3 className="font-serif text-xl font-semibold text-secondary">Corpo</h3>
          </div>
          <div className="space-y-4">
            {goals.corpo.map(goal => (
              <GoalCard key={goal.id} goal={goal} color="bg-emerald-500" onClick={() => handleViewGoal(goal)} />
            ))}
          </div>
        </div>

        {/* Alma */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-surface-border">
            <Brain className="w-5 h-5 text-text-muted" />
            <h3 className="font-serif text-xl font-semibold text-secondary">Alma</h3>
          </div>
          <div className="space-y-4">
            {goals.alma.map(goal => (
              <GoalCard key={goal.id} goal={goal} color="bg-blue-500" onClick={() => handleViewGoal(goal)} />
            ))}
          </div>
        </div>

        {/* Trabalho */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-surface-border">
            <Briefcase className="w-5 h-5 text-text-muted" />
            <h3 className="font-serif text-xl font-semibold text-secondary">Trabalho</h3>
          </div>
          <div className="space-y-4">
            {goals.trabalho.map(goal => (
              <GoalCard key={goal.id} goal={goal} color="bg-orange-500" onClick={() => handleViewGoal(goal)} />
            ))}
          </div>
        </div>

      </div>

      {/* Milestones */}
      <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
        <h2 className="font-serif text-2xl font-semibold text-secondary mb-8">Marcos do Ciclo (Milestones)</h2>
        
        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-border -translate-y-1/2 hidden md:block" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            <Milestone day="0" label="Início" date="01 Mar" status="completed" onClick={() => handleViewMilestone({label: "Início"})} />
            <Milestone day="30" label="Revisão 1/3" date="30 Mar" status="current" onClick={() => handleViewMilestone({label: "Revisão 1/3"})} />
            <Milestone day="60" label="Revisão 2/3" date="29 Abr" status="pending" onClick={() => handleViewMilestone({label: "Revisão 2/3"})} />
            <Milestone day="90" label="Fechamento" date="29 Mai" status="pending" onClick={() => handleViewMilestone({label: "Fechamento"})} />
          </div>
        </div>
      </div>

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
            <div className="space-y-4">
              {[...goals.corpo, ...goals.alma, ...goals.trabalho].map(goal => (
                <div key={goal.id} className="flex items-center justify-between p-4 bg-background border border-surface-border rounded-2xl">
                  <div>
                    <div className="font-medium text-secondary">{goal.title}</div>
                    <div className="text-xs text-text-muted">Meta: {goal.target}{goal.unit}</div>
                  </div>
                  <button className="p-2 text-text-muted hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-text-muted uppercase tracking-widest border-b border-surface-border pb-2">Nova Meta</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted ml-1">Título</label>
                <input type="text" placeholder="Ex: Ler 5 livros" className="w-full bg-background border border-surface-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted ml-1">Pilar</label>
                <select className="w-full bg-background border border-surface-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary">
                  <option>Corpo</option>
                  <option>Alma</option>
                  <option>Trabalho</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted ml-1">Meta Final</label>
                <input type="number" placeholder="0" className="w-full bg-background border border-surface-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted ml-1">Unidade</label>
                <input type="text" placeholder="Ex: kg, %, livros" className="w-full bg-background border border-surface-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary" />
              </div>
            </div>
            <button className="w-full py-3 bg-background border border-dashed border-primary/30 text-primary rounded-xl text-sm font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Meta
            </button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-surface-border">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 py-3 bg-background border border-surface-border rounded-xl text-sm font-medium hover:bg-surface-hover transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                alert("Metas atualizadas com sucesso!");
                setIsEditModalOpen(false);
              }}
              className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function GoalCard({ goal, color, onClick }: any) {
  // Calculate percentage based on whether the goal is to increase or decrease a value
  let percentage = 0;
  if (goal.inverse) {
    // For things like weight loss or time reduction
    const totalDiff = goal.start - goal.target;
    const currentDiff = goal.start - goal.current;
    percentage = Math.max(0, Math.min(100, (currentDiff / totalDiff) * 100));
  } else {
    // For things like revenue or books read
    const totalDiff = goal.target - goal.start;
    const currentDiff = goal.current - goal.start;
    percentage = Math.max(0, Math.min(100, (currentDiff / totalDiff) * 100));
  }

  return (
    <div 
      onClick={onClick}
      className="bg-surface border border-surface-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-medium text-secondary leading-snug pr-4">{goal.title}</h4>
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

function Milestone({ day, label, date, status, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="flex flex-col items-center text-center bg-surface md:bg-transparent p-4 md:p-0 rounded-2xl border md:border-none border-surface-border cursor-pointer group transition-all active:scale-[0.95]"
    >
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center mb-3 border-2 transition-all z-10 bg-surface group-hover:scale-110",
        status === 'completed' ? "border-emerald-500 text-emerald-500" :
        status === 'current' ? "border-primary text-primary shadow-[0_0_15px_rgba(10,37,64,0.2)]" :
        "border-surface-border text-text-muted"
      )}>
        {status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : <Flag className="w-5 h-5" />}
      </div>
      <div className="font-serif font-bold text-secondary text-lg group-hover:text-primary transition-colors">Dia {day}</div>
      <div className="text-sm font-medium text-primary mt-1">{label}</div>
      <div className="text-xs font-mono text-text-muted mt-1">{date}</div>
    </div>
  );
}
