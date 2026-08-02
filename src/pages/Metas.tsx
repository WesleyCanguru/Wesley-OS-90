import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Pencil, 
  Target, 
  Heart, 
  Zap, 
  Check,
  ChevronRight,
  TrendingUp,
  Scale,
  Brain,
  Droplets,
  Loader2,
  Calendar,
  Sparkles,
  Clock,
  MapPin,
  MessageSquare,
  Tag,
  GripVertical
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useUserGoals } from "@/hooks/useUserGoals";
import { useCycle } from "@/hooks/useCycle";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { format, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Habit = {
  id: string;
  name: string;
  emoji: string;
  area: 'alma' | 'corpo' | 'foco';
  type: 'check' | 'numeric';
  frequency_per_week: number;
  daily_goal: number;
  unit: string;
  time?: string;
  location?: string;
  motivation?: string;
  description?: string;
  category?: string;
  color?: string;
  goal_id?: string;
};

const AREAS = [
  { id: 'alma', name: 'Alma', emoji: '🤎', color: 'text-secondary', bg: 'bg-secondary/5' },
  { id: 'corpo', name: 'Corpo', emoji: '🌿', color: 'text-primary', bg: 'bg-primary/5' },
  { id: 'foco', name: 'Trabalho', emoji: '🪵', color: 'text-accent', bg: 'bg-accent/5' }
];

const UNITS = ["vezes", "km", "minutos", "litros", "kcal", "páginas", "horas"];
const COLOR_OPTIONS = [
  "#5A8D6E", // Lightened North Green
  "#4A352F", // Brown
  "#A66E6E", // Muted Red
  "#B38E5D", // Gold/Ocher
  "#5D6D7E", // Slate Blue
  "#A18E78", // Taupe
  "#353535", // Deep Gray
  "#5E6E5A"  // Leaf Green
];
const CATEGORIES = ["Saúde", "Trabalho", "Mental", "Espiritual", "Social", "Lazer", "Finanças"];

export function Metas() {
  const user = useUser();
  const { goals, updateGoals, loading: goalsLoading } = useUserGoals();
  const { cycle, startNewCycle, loading: cycleLoading } = useCycle();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [newCycleStartDate, setNewCycleStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'habit' | 'outcome' } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Habit>>({
    name: '',
    area: 'corpo',
    type: 'check',
    frequency_per_week: 7,
    daily_goal: 1,
    unit: 'vezes',
    category: 'Saúde',
    color: '#5A8D6E'
  });

  useEffect(() => {
    if (user) {
      fetchHabits();
    }
  }, [user]);

  const fetchHabits = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_name', user.name)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setHabits(data || []);
    } catch (error) {
      console.error("Error fetching habits:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveHabit = async () => {
    if (!user || !formData.name) return;
    
    // Preparar dados para inserção/update
    const cleanData = { ...formData, user_name: user.name };
    
    // Se goal_id for string vazia, deve ser null para o Supabase (UUID)
    if (cleanData.goal_id === "") {
      delete cleanData.goal_id;
    }

    try {
      if (editingHabit) {
        const { error } = await supabase
          .from('habits')
          .update(cleanData)
          .eq('id', editingHabit.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('habits')
          .insert([cleanData]);
          
        if (error) throw error;
      }
      
      fetchHabits();
      setIsModalOpen(false);
      setEditingHabit(null);
      resetForm();
    } catch (error: any) {
      console.error("Error saving habit:", error);
      alert(`Erro ao salvar hábito: ${error.message || 'Erro de conexão ou no banco de dados'}. Se você vinculou a uma meta, verifique se a coluna goal_id existe na tabela habits.`);
    }
  };

  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [newOutcomeTitle, setNewOutcomeTitle] = useState('');
  const [newOutcomeDescription, setNewOutcomeDescription] = useState('');
  const [isNewOutcomeModalOpen, setIsNewOutcomeModalOpen] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<{id: string, title: string, description?: string} | null>(null);

  // Estados de Conclusão e Evolução de Metas
  const [selectedGoalForComplete, setSelectedGoalForComplete] = useState<any | null>(null);
  const [completeWeek, setCompleteWeek] = useState<number>(1);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [selectedGoalForEvolve, setSelectedGoalForEvolve] = useState<any | null>(null);
  const [evolvedTitle, setEvolvedTitle] = useState<string>('');
  const [isEvolveModalOpen, setIsEvolveModalOpen] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);

  const fetchOutcomes = async () => {
    if (!user || !cycle) return;
    try {
      const { data, error } = await supabase
        .from('cycle_outcomes')
        .select('*')
        .eq('cycle_id', cycle.id)
        .eq('user_name', user.name)
        .order('position', { ascending: true, nullsFirst: false });
      
      if (error) {
         const fallback = await supabase.from('cycle_outcomes').select('*').eq('cycle_id', cycle.id).eq('user_name', user.name);
         setOutcomes(fallback.data || []);
         return;
      }
      setOutcomes(data || []);
    } catch (e) {
      console.error("Erro ao buscar metas:", e);
    }
  };

  const handleCompleteGoal = async () => {
    if (!user || !selectedGoalForComplete) return;
    setIsCompleting(true);
    try {
      const { error } = await supabase
        .from('cycle_outcomes')
        .update({ is_completed: true, completed_week: completeWeek })
        .eq('id', selectedGoalForComplete.id)
        .eq('user_name', user.name);

      if (error) throw error;
      
      await fetchOutcomes();
      setIsCompleteModalOpen(false);
      setSelectedGoalForComplete(null);
    } catch (err: any) {
      console.error("Erro ao completar meta:", err);
      alert(`Houve um erro ao salvar a conclusão: ${err.message || err}`);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleEvolveGoal = async () => {
    if (!user || !cycle || !selectedGoalForEvolve || !evolvedTitle) return;
    setIsEvolving(true);
    try {
      // 1. Criar a nova meta ativa evoluída
      const { data: newGoalData, error: newGoalError } = await supabase
        .from('cycle_outcomes')
        .insert({
          user_name: user.name,
          cycle_id: cycle.id,
          title: evolvedTitle,
          parent_id: selectedGoalForEvolve.id,
          is_completed: false,
          completed_week: null,
          position: (outcomes.length > 0 ? Math.max(...outcomes.map(o => o.position || 0)) + 1 : 0)
        })
        .select()
        .single();

      if (newGoalError) throw newGoalError;

      // 2. Vincular os hábitos da meta concluída à nova meta evoluída ativa
      if (newGoalData) {
        const { error: updateHabitsError } = await supabase
          .from('habits')
          .update({ goal_id: newGoalData.id })
          .eq('goal_id', selectedGoalForEvolve.id)
          .eq('user_name', user.name);

        if (updateHabitsError) throw updateHabitsError;
      }

      await fetchOutcomes();
      await fetchHabits();
      setIsEvolveModalOpen(false);
      setSelectedGoalForEvolve(null);
      setEvolvedTitle('');
    } catch (err: any) {
      console.error("Erro ao evoluir meta:", err);
      alert(`Houve um erro ao evoluir a meta: ${err.message || err}`);
    } finally {
      setIsEvolving(false);
    }
  };

  const handleOutcomeDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    const items = [...outcomes];
    const [reorderedItem] = items.splice(sourceIndex, 1);
    items.splice(destIndex, 0, reorderedItem);

    const updatedItems = items.map((t, index) => ({
      ...t,
      position: index
    }));

    setOutcomes(updatedItems);

    for (let i = 0; i < updatedItems.length; i++) {
        supabase.from('cycle_outcomes').update({ position: i }).eq('id', updatedItems[i].id).then(r => {
           if(r.error) console.log("Se der erro de coluna inexistente, adicione a coluna position");
        });
    }
  };

  useEffect(() => {
    if (cycle) fetchOutcomes();
  }, [cycle]);

  const getCycleProgress = () => {
    if (!cycle) return null;
    try {
      const start = parseISO(cycle.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const totalDays = 84; 
      const progress = Math.min(Math.max((diffDays / totalDays) * 100, 0), 100);
      const currentDay = Math.min(Math.max(diffDays, 0), totalDays);
      return { currentDay, totalDays, progress };
    } catch (e) {
      return null;
    }
  };

  const cycleInfo = getCycleProgress();

  const addOutcome = async () => {
    if (!user || !cycle || !newOutcomeTitle.trim()) {
      if (!cycle) alert("Você precisa iniciar um ciclo antes de adicionar metas.");
      return;
    }
    try {
      const nextPos = outcomes.length > 0 ? Math.max(...outcomes.map(o => o.position || 0)) + 1 : 0;
      const payload = {
        user_name: user.name,
        cycle_id: cycle.id,
        title: newOutcomeTitle.trim(),
        description: newOutcomeDescription.trim() || null,
        position: nextPos
      };

      let { error } = await supabase.from('cycle_outcomes').insert(payload);

      if (error) {
        console.warn("Falha no insert com descrição, tentando sem coluna de descrição:", error);
        const { error: fallbackErr } = await supabase.from('cycle_outcomes').insert({
          user_name: user.name,
          cycle_id: cycle.id,
          title: newOutcomeTitle.trim()
        });
        if (fallbackErr) throw fallbackErr;
      }

      setNewOutcomeTitle('');
      setNewOutcomeDescription('');
      setIsNewOutcomeModalOpen(false);
      fetchOutcomes();
    } catch (error: any) {
      console.error("Erro ao adicionar missão:", error);
      alert(`Houve um erro ao salvar a missão: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const updateOutcome = async () => {
    if (!user || !cycle || !editingOutcome || !editingOutcome.title.trim()) return;
    try {
      const payload = {
        title: editingOutcome.title.trim(),
        description: editingOutcome.description?.trim() || null
      };

      let { error } = await supabase
        .from('cycle_outcomes')
        .update(payload)
        .eq('id', editingOutcome.id)
        .eq('user_name', user.name);

      if (error) {
        console.warn("Falha no update com descrição, tentando apenas título:", error);
        const { error: fallbackErr } = await supabase
          .from('cycle_outcomes')
          .update({ title: editingOutcome.title.trim() })
          .eq('id', editingOutcome.id)
          .eq('user_name', user.name);
        if (fallbackErr) throw fallbackErr;
      }

      setEditingOutcome(null);
      fetchOutcomes();
    } catch (error: any) {
      console.error("Erro ao atualizar missão:", error);
      alert(`Houve um erro ao atualizar a missão: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      await supabase.from('habit_logs').delete().eq('habit_id', id);
      await supabase.from('habits').delete().eq('id', id);
      setHabits(prev => prev.filter(h => h.id !== id));
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setFormData(habit);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      area: 'corpo',
      type: 'check',
      frequency_per_week: 7,
      daily_goal: 1,
      unit: 'vezes',
      time: '',
      motivation: '',
      description: '',
      category: 'Saúde',
      color: '#5A8D6E'
    });
  };

  const filteredHabits = habits;

  if (goalsLoading || loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="animate-spin text-primary w-8 h-8"/></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 pb-24 px-4 md:px-0">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 rounded-full border border-primary/10 w-fit">
          <Target className="w-3 h-3 text-primary" />
          <span className="text-[8px] font-bold text-primary uppercase tracking-[0.3em]">A Arqueologia do Futuro</span>
        </div>
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-secondary tracking-[-0.04em] leading-[0.9] uppercase">Nossas<br/>Metas.</h1>
        <p className="text-text-muted text-sm md:text-base max-w-lg font-light leading-relaxed pt-1">Onde a intenção se torna arquitetura. Defina o seu destino e mapeie o caminho com precisão absoluta.</p>
      </motion.header>

      <section className="bg-secondary rounded-[2rem] p-6 md:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5 md:space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 bg-primary animate-pulse rounded-full" />
                <span className="text-[8px] font-bold uppercase tracking-[0.3em]">Configurar Jornada</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-display font-bold leading-[1.1] uppercase tracking-tighter">O Ano em <span className="text-primary italic">12 Semanas.</span></h2>
              <p className="text-white/60 text-sm md:text-base max-w-lg font-light italic">“Um ano não tem 12 meses. Tem {cycle ? "12 semanas" : "o quanto você desejar"}. O tempo é curto, a execução deve ser implacável.”</p>
            </div>
            {cycle && cycleInfo && (
              <div className="space-y-5 pt-3 max-w-sm">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.4em]">Dia {cycleInfo.currentDay} de {cycleInfo.totalDays}</p>
                    <p className="text-lg font-bold font-display uppercase italic text-primary">{Math.round((cycleInfo.currentDay / cycleInfo.totalDays) * 100)}% Concluído</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.4em]">Fase do Ciclo</p>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Semana {Math.ceil(cycleInfo.currentDay / 7)} / 12</p>
                  </div>
                </div>
                <div className="h-1 lg:h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${cycleInfo.progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            )}
            {cycle ? (
              <div className="flex flex-wrap items-center gap-6 md:gap-8 pt-2">
                <div className="space-y-1">
                  <p className="text-[7px] font-bold text-white/30 uppercase tracking-[0.4em]">Início do Ciclo</p>
                  <p className="text-lg md:text-xl font-display font-bold">{format(parseISO(cycle.start_date), "dd 'de' MMMM", { locale: ptBR })}</p>
                </div>
                <div className="w-px h-8 bg-white/10 hidden md:block" />
                <div className="space-y-1">
                  <p className="text-[7px] font-bold text-white/30 uppercase tracking-[0.4em]">Horizonte Final</p>
                  <p className="text-lg md:text-xl font-display font-bold text-primary">{format(addDays(parseISO(cycle.start_date), 84), "dd 'de' MMMM", { locale: ptBR })}</p>
                </div>
                <Button onClick={() => { setNewCycleStartDate(cycle.start_date); setIsCycleModalOpen(true); }} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl px-5 py-2.5 font-bold uppercase tracking-[0.2em] text-[9px]">Redefinir Ciclo</Button>
              </div>
            ) : (
              <Button onClick={() => setIsCycleModalOpen(true)} className="bg-primary text-secondary hover:scale-105 px-6 py-3 rounded-xl font-bold uppercase tracking-widest transition-all">Iniciar Ciclo de 12 Semanas</Button>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-surface-border pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-xl md:text-3xl font-display font-bold text-secondary uppercase tracking-tight">Missões das 12 Semanas</h2>
            </div>
            <p className="text-text-muted text-[10px] md:text-xs max-w-xl font-light">As missões que definirão o sucesso deste ciclo de 12 semanas. Mapeie seus hábitos a cada uma delas.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => setIsNewOutcomeModalOpen(true)} 
              className="bg-primary text-white h-11 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl uppercase text-[9px] tracking-widest"
            >
              <Plus className="w-3.5 h-3.5"/>
              <span>Nova Missão</span>
            </button>
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-secondary text-white h-11 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl uppercase text-[9px] tracking-widest"><Plus className="w-3.5 h-3.5"/><span>Novo Hábito</span></button>
          </div>
        </header>

        <DragDropContext onDragEnd={handleOutcomeDragEnd}>
          <Droppable droppableId="outcomes-list" direction="vertical">
            {(provided) => (
              <div 
                className="space-y-16"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {/* Metas Principais e seus Hábitos */}
                {outcomes.map((goal, idx) => (
                  <React.Fragment key={goal.id}>
                    {/* @ts-ignore */}
                    <Draggable draggableId={goal.id} index={idx}>
                    {(provided, snapshot) => (
                      <div 
                        className={cn(
                          "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start transition-all duration-300",
                          snapshot.isDragging && "opacity-90 bg-background z-50 rounded-[2rem] shadow-2xl p-4 scale-[1.01]"
                        )}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <div className="lg:col-span-4 sticky top-24">
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className={cn(
                              "bg-surface border border-surface-border rounded-[2rem] p-8 space-y-4 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all",
                              goal.is_completed && "bg-gradient-to-br from-surface via-amber-500/5 to-amber-500/10 border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.08)]"
                            )}
                          >
                            {/* Subtle, elegant achievement glow animation for completed missions */}
                            {goal.is_completed && (
                              <motion.div 
                                initial={{ opacity: 0.2 }}
                                animate={{ opacity: [0.2, 0.6, 0.2] }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -inset-px rounded-[2rem] border border-amber-500/40 pointer-events-none shadow-[inset_0_0_12px_rgba(245,158,11,0.08)]"
                              />
                            )}

                            <div 
                              {...provided.dragHandleProps}
                              className="absolute top-4 left-4 p-2 text-surface-border hover:text-text-muted cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity z-20"
                            >
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><span className="text-7xl font-display font-bold italic">{idx + 1}</span></div>
                            
                            <div className="flex gap-3 items-center justify-between relative z-10">
                              <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform",
                                goal.is_completed 
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-600" 
                                  : "bg-primary/5 border-primary/10 text-primary"
                              )}>
                                {goal.is_completed ? <Sparkles className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                              </div>
                              
                              {goal.is_completed && (
                                <span className="bg-amber-500/15 text-amber-700 border border-amber-500/20 px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-widest uppercase flex items-center gap-1">
                                  🏆 Concluída na S{goal.completed_week}
                                </span>
                              )}
                            </div>

                            <div className="space-y-2 relative z-10 w-full">
                              <p className="text-[8px] font-bold text-primary uppercase tracking-[0.4em]">
                                {goal.is_completed ? "Missão Concluída" : "Missão Ativa"}
                              </p>
                              {editingOutcome?.id === goal.id ? (
                                <div className="flex flex-col gap-3 my-2 bg-surface-hover/30 p-3 rounded-2xl border border-primary/20">
                                  <div>
                                    <label className="text-[8px] font-bold text-text-muted uppercase tracking-wider block mb-1">Título da Missão</label>
                                    <input 
                                      type="text" 
                                      value={editingOutcome.title}
                                      onChange={(e) => setEditingOutcome({ ...editingOutcome, title: e.target.value })}
                                      placeholder="Ex: Ser um homem saudável"
                                      className="w-full bg-surface border border-surface-border focus:border-primary rounded-xl px-3 py-2 text-sm font-bold text-secondary outline-none"
                                      autoFocus
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] font-bold text-text-muted uppercase tracking-wider block mb-1">Descrição / Subtítulo</label>
                                    <textarea 
                                      value={editingOutcome.description || ''}
                                      onChange={(e) => setEditingOutcome({ ...editingOutcome, description: e.target.value })}
                                      placeholder="Ex: Construindo um corpo forte e disciplinado..."
                                      rows={3}
                                      className="w-full bg-surface border border-surface-border focus:border-primary rounded-xl px-3 py-2 text-xs font-medium text-secondary outline-none resize-none leading-relaxed"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={updateOutcome} className="px-3 py-1.5 bg-primary text-white rounded-lg text-[9px] font-bold uppercase tracking-wider hover:opacity-90">Salvar</button>
                                    <button onClick={() => setEditingOutcome(null)} className="px-3 py-1.5 bg-surface-border text-text-muted rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-surface-border/80">Cancelar</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <h3 className={cn(
                                    "text-xl md:text-2xl font-display font-bold uppercase leading-tight tracking-tight",
                                    goal.is_completed ? "text-secondary/70 line-through decoration-amber-500/30" : "text-secondary"
                                  )}>
                                    {goal.title}
                                  </h3>

                                  {goal.description && (
                                    <p className="text-xs text-text-muted font-normal leading-relaxed italic border-l-2 border-primary/30 pl-3 py-0.5 my-1.5">
                                      {goal.description}
                                    </p>
                                  )}
                                  
                                  {(() => {
                                    const parentGoal = outcomes.find(o => o.id === goal.parent_id);
                                    if (parentGoal) {
                                      return (
                                        <div className="mt-2.5 p-2.5 bg-primary/5 rounded-xl border border-primary/10 text-[9px] text-primary/95 flex items-start gap-1.5 font-semibold">
                                          <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                          <span>Evolução de: <span className="font-bold underline">{parentGoal.title}</span> (Batida na S{parentGoal.completed_week})</span>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              )}
                            </div>

                            <div className="pt-4 flex flex-col gap-3 border-t border-surface-border/50">
                              <div className="flex items-center justify-between">
                                <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest">
                                  {habits.filter(h => h.goal_id === goal.id).length} Hábitos Vinculados
                                </span>
                                <div className="flex gap-1">
                                  {!goal.is_completed && (
                                    <button onClick={() => setEditingOutcome(goal)} className="p-1.5 text-text-muted hover:text-primary transition-all">
                                      <Pencil className="w-3.5 h-3.5"/>
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => setDeleteTarget({ id: goal.id, type: 'outcome' })} 
                                    className="p-1.5 text-text-muted hover:text-red-500 transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5"/>
                                  </button>
                                </div>
                              </div>

                              <div className="flex gap-2 w-full">
                                {!goal.is_completed ? (
                                  <button
                                    onClick={() => {
                                      setSelectedGoalForComplete(goal);
                                      const curW = cycleInfo ? Math.ceil(cycleInfo.currentDay / 7) : 1;
                                      setCompleteWeek(Math.min(12, Math.max(1, curW)));
                                      setIsCompleteModalOpen(true);
                                    }}
                                    className="w-full py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-white border border-amber-500/20 hover:border-amber-500 rounded-xl text-[9px] font-extrabold tracking-widest uppercase transition-all flex items-center justify-center gap-1"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Concluir Missão 🏆</span>
                                  </button>
                                ) : (
                                  !outcomes.some(o => o.parent_id === goal.id) ? (
                                    <button
                                      onClick={() => {
                                        setSelectedGoalForEvolve(goal);
                                        setEvolvedTitle(goal.title);
                                        setIsEvolveModalOpen(true);
                                      }}
                                      className="w-full py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary rounded-xl text-[9px] font-extrabold tracking-widest uppercase transition-all flex items-center justify-center gap-1"
                                    >
                                      <Zap className="w-3 h-3 animate-pulse" />
                                      <span>Evoluir Meta ⚡</span>
                                    </button>
                                  ) : (
                                    <div className="w-full py-1.5 bg-text-muted/5 border border-text-muted/10 rounded-xl text-[8px] font-bold text-text-muted tracking-widest uppercase flex items-center justify-center gap-1">
                                      <span>Evoluída com Sucesso ✓</span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </motion.div>
              </div>

              <div className="lg:col-span-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {habits.filter(h => h.goal_id === goal.id).map((habit) => (
                    <motion.div 
                      key={habit.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="bg-white/40 backdrop-blur-sm border border-surface-border rounded-3xl p-6 space-y-4 group hover:shadow-xl hover:bg-white transition-all border-dashed"
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-black/5 shadow-sm" style={{ backgroundColor: habit.color || '#5E6E5A' }}>
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(habit)} className="p-2 bg-surface border border-surface-border rounded-lg text-text-muted hover:text-primary transition-all"><Pencil className="w-3 h-3"/></button>
                          <button onClick={() => setDeleteTarget({ id: habit.id, type: 'habit' })} className="p-2 bg-surface border border-surface-border rounded-lg text-text-muted hover:text-red-500 transition-all"><Trash2 className="w-3 h-3"/></button>
                        </div>
                      </div>
                      <h3 className="text-base font-display font-bold text-secondary uppercase tracking-tight truncate">{habit.name}</h3>
                      {habit.motivation && (
                        <p className="text-[10px] text-text-muted italic leading-relaxed line-clamp-2 pt-1 border-t border-surface-border/20 mt-1">
                          "{habit.motivation}"
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-surface-border/30">
                        <span className="text-[8px] font-bold text-text-muted uppercase tracking-[0.2em]">{habit.category}</span>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-primary"><Zap className="w-3 h-3" /> {habit.frequency_per_week}x/Semana</div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Botão de adicionar hábito rápido já vinculado à meta */}
                  <button 
                    onClick={() => { resetForm(); setFormData(prev => ({ ...prev, goal_id: goal.id })); setIsModalOpen(true); }}
                    className="border-2 border-dashed border-surface-border rounded-3xl flex flex-col items-center justify-center gap-3 p-8 opacity-40 hover:opacity-100 hover:border-primary/50 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-border flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Plus className="w-5 h-5 text-text-muted group-hover:text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Adicionar hábito à meta</span>
                  </button>
                </div>
              </div>
                    </div>
                  )}
                </Draggable>
              </React.Fragment>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

          {/* Hábitos Independentes */}
          {habits.filter(h => !h.goal_id).length > 0 && (
             <div className="space-y-8 pt-8 border-t border-surface-border/50">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 md:w-10 md:h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                   <Zap className="w-4 h-4 text-accent" />
                 </div>
                 <h2 className="text-xl md:text-2xl font-display font-bold text-secondary uppercase tracking-tight">Hábitos de Manutenção</h2>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {habits.filter(h => !h.goal_id).map((habit) => (
                   <motion.div 
                     key={habit.id}
                     initial={{ opacity: 0, scale: 0.95 }}
                     whileInView={{ opacity: 1, scale: 1 }}
                     viewport={{ once: true }}
                     className="bg-surface border border-surface-border rounded-2xl p-5 space-y-4 group hover:shadow-xl transition-all shadow-sm"
                   >
                     <div className="flex justify-between items-start">
                       <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-black/5" style={{ backgroundColor: habit.color || '#5E6E5A' }}>
                         <Sparkles className="w-4 h-4 text-white" />
                       </div>
                       <div className="flex gap-1.5">
                         <button onClick={() => handleEdit(habit)} className="p-1.5 text-text-muted hover:text-primary transition-all"><Pencil className="w-3 h-3"/></button>
                         <button onClick={() => setDeleteTarget({ id: habit.id, type: 'habit' })} className="p-1.5 text-text-muted hover:text-red-500 transition-all"><Trash2 className="w-3 h-3"/></button>
                       </div>
                     </div>
                     <h3 className="text-base font-display font-bold text-secondary uppercase tracking-tight truncate">{habit.name}</h3>
                     {habit.motivation && (
                       <p className="text-[10px] text-text-muted italic leading-relaxed line-clamp-2 pt-1 border-t border-surface-border/20 mt-1">
                         "{habit.motivation}"
                       </p>
                     )}
                     <div className="flex items-center justify-between pt-2 border-t border-surface-border/50">
                       <span className="text-[8px] font-bold text-text-muted uppercase tracking-[0.2em]">{habit.category}</span>
                       <div className="flex items-center gap-1 text-[8px] font-bold text-primary"><Zap className="w-2.5 h-2.5" /> {habit.frequency_per_week}x/Semana</div>
                     </div>
                   </motion.div>
                 ))}
               </div>
             </div>
          )}
      </section>

      <Modal isOpen={isCycleModalOpen} onClose={() => setIsCycleModalOpen(false)} title="Arquitetar Ciclo">
        <div className="space-y-10 p-2">
          <div className="space-y-6">
            <div className="flex items-center justify-between"><label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em]">Marco Zero (Início)</label><div className="flex items-center gap-2 text-primary"><Calendar className="w-4 h-4" /><span className="text-xs font-bold uppercase">{format(parseISO(newCycleStartDate), "dd 'de' MMMM", { locale: ptBR })}</span></div></div>
            <div className="bg-surface-hover/30 border border-surface-border rounded-[2.5rem] p-8"><input type="date" value={newCycleStartDate} onChange={(e) => setNewCycleStartDate(e.target.value)} className="w-full bg-transparent border-none text-4xl font-display font-bold text-secondary outline-none text-center cursor-pointer hover:text-primary transition-colors"/><p className="text-center text-[10px] text-text-muted font-bold uppercase tracking-widest mt-4">Toque para alterar a data</p></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-surface border border-surface-border rounded-3xl space-y-2"><p className="text-[8px] font-bold text-text-muted uppercase tracking-[0.2em]">Duração</p><p className="text-xl font-bold text-secondary italic">12 Semanas</p></div>
            <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl space-y-2"><p className="text-[8px] font-bold text-primary/60 uppercase tracking-[0.2em]">Horizonte Final</p><p className="text-xl font-bold text-primary">{format(addDays(parseISO(newCycleStartDate), 84), "dd/MM/yy")}</p></div>
          </div>
          <Button onClick={async () => { await startNewCycle(newCycleStartDate); setIsCycleModalOpen(false); }} className="w-full py-10 text-lg font-bold rounded-[2rem] bg-secondary text-white uppercase tracking-[0.2em]">Sincronizar Cronograma</Button>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingHabit(null); }} title={editingHabit ? "Ajustar Hábito" : "Novo Hábito"}>
        <div className="space-y-6 md:space-y-8 p-1 overflow-y-auto max-h-[85vh] scrollbar-hide">
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em] block pl-1">Nome do Hábito</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              className="w-full bg-surface-hover/30 border border-surface-border rounded-xl px-6 py-8 text-2xl font-display font-bold text-secondary outline-none focus:border-primary transition-all placeholder:opacity-20 uppercase" 
              placeholder="EX: MEDITAÇÃO PROFUNDA"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em] block pl-1">Esfera de Atuação</label>
              <div className="grid grid-cols-1 gap-2">
                {AREAS.map((area) => (
                  <button 
                    key={area.id} 
                    onClick={() => setFormData({ ...formData, area: area.id as any })} 
                    className={cn(
                      "p-3 rounded-xl flex items-center justify-between px-5 border transition-all text-[10px] font-bold uppercase tracking-widest", 
                      formData.area === area.id 
                        ? "bg-secondary text-white border-secondary shadow-lg" 
                        : "bg-surface-hover/20 border-surface-border text-text-muted opacity-60 hover:opacity-100"
                    )}
                  >
                    <span>{area.name}</span>
                    <div className={cn("w-1.5 h-1.5 rounded-full", formData.area === area.id ? "bg-primary" : "bg-surface-border")} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em] block pl-1">Por que isso é inegociável?</label>
              <textarea 
                value={formData.motivation} 
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })} 
                placeholder="Defina o propósito..." 
                className="w-full h-[126px] bg-surface-hover/20 border border-surface-border rounded-xl px-5 py-4 text-xs font-light text-secondary outline-none focus:border-primary transition-all resize-none italic"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] flex items-center gap-2 pl-1"><Clock className="w-3 h-3" /> Horário</label>
              <input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="w-full bg-surface-hover/20 border border-surface-border rounded-xl px-4 py-3 text-xs font-bold text-secondary outline-none focus:border-primary transition-all"/>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] flex items-center gap-2 pl-1"><Tag className="w-3 h-3" /> Categoria</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-surface-hover/20 border border-surface-border rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-secondary outline-none focus:border-primary transition-all appearance-none cursor-pointer">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
            </div>
            <div className="space-y-2 col-span-2 md:col-span-1">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] pl-1">Arquitetura (Cor)</label>
              <div className="flex gap-2 justify-between bg-surface-hover/20 border border-surface-border rounded-xl p-2">
                {COLOR_OPTIONS.map(color => (
                  <button key={color} onClick={() => setFormData({ ...formData, color })} className={cn("w-6 h-6 rounded-full border transition-all transform hover:scale-110", formData.color === color ? "border-primary ring-2 ring-primary/20 scale-110" : "border-transparent")} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] flex items-center gap-2 pl-1"><Target className="w-3 h-3" /> Conectar à Meta Maior</label>
            <select value={formData.goal_id} onChange={(e) => setFormData({ ...formData, goal_id: e.target.value })} className="w-full bg-surface-hover/20 border border-surface-border rounded-xl px-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary outline-none focus:border-primary transition-all appearance-none cursor-pointer">
              <option value="">Nenhuma meta vinculada</option>
              {outcomes.map(o => (<option key={o.id} value={o.id}>{o.title}</option>))}
            </select>
          </div>

          <div className="bg-surface-hover/10 rounded-3xl p-6 md:p-8 space-y-6 border border-surface-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em]">Recorrência Semanal</label>
                <span className="text-[10px] font-bold text-primary">{formData.frequency_per_week} dias</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button key={num} onClick={() => setFormData({ ...formData, frequency_per_week: num })} className={cn("flex-1 py-3 rounded-lg text-[10px] font-bold transition-all border", formData.frequency_per_week === num ? "bg-secondary text-white border-secondary shadow-lg scale-105" : "bg-background border-surface-border text-text-muted")}>
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-3">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em] pl-1">Meta Diária</label>
                <div className="flex gap-3">
                  <input type="number" value={formData.daily_goal} onChange={(e) => setFormData({ ...formData, daily_goal: Number(e.target.value) })} className="flex-1 bg-background border border-surface-border rounded-xl px-5 py-3 text-lg font-display font-bold text-secondary outline-none focus:border-primary"/>
                  <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="flex-1 bg-background border border-surface-border rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-secondary">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <Button onClick={saveHabit} className="w-full py-8 text-[10px] font-bold rounded-2xl shadow-xl transition-all bg-secondary text-white uppercase tracking-[0.3em] hover:scale-[1.01] active:scale-95">Consolidar Hábito</Button>
        </div>
      </Modal>

      {/* Modal de confirmação para marcar meta como batida */}
      <Modal 
        isOpen={isCompleteModalOpen} 
        onClose={() => { setIsCompleteModalOpen(false); setSelectedGoalForComplete(null); }} 
        title="Concluir Missão 🏆"
      >
        <div className="space-y-6 p-1">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 items-center">
            <div className="text-2xl">🎉</div>
            <p className="text-xs font-semibold text-amber-800 leading-normal">
              Parabéns pelo progresso! Selecione em qual semana do ciclo atual você cumpriu esta missão para registrar este marco.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] block pl-1">Semana de Conquista</label>
            <select 
              value={completeWeek} 
              onChange={(e) => setCompleteWeek(Number(e.target.value))} 
              className="w-full bg-surface-hover/20 border border-surface-border rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest text-secondary outline-none focus:border-primary transition-all appearance-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(w => (
                <option key={w} value={w}>Semana {w}</option>
              ))}
            </select>
          </div>

          <Button 
            onClick={handleCompleteGoal} 
            disabled={isCompleting}
            className="w-full py-5 text-[9px] font-bold rounded-xl bg-amber-500 text-white uppercase tracking-[0.3em] hover:bg-amber-600 shadow-md transition-colors"
          >
            {isCompleting ? "Registrando conquista..." : "Concluir Missão 🏆"}
          </Button>
        </div>
      </Modal>

      {/* Modal para Evolução de Meta */}
      <Modal 
        isOpen={isEvolveModalOpen} 
        onClose={() => { setIsEvolveModalOpen(false); setSelectedGoalForEvolve(null); }} 
        title="Evoluir Meta ⚡"
      >
        <div className="space-y-6 p-1">
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex gap-3 items-center">
            <div className="text-2xl">🚀</div>
            <p className="text-xs font-semibold text-primary leading-normal">
              Metas batidas abrem espaço para novos patamares de excelência. Digite o novo objetivo aprimorado abaixo.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] block pl-1">Nova Meta Aprimorada</label>
            <textarea 
              value={evolvedTitle} 
              onChange={(e) => setEvolvedTitle(e.target.value)} 
              placeholder="Ex: Chegar a 80 kg e manter musculatura com rotina forte" 
              className="w-full h-24 bg-surface-hover/20 border border-surface-border rounded-xl px-4 py-3 text-sm font-semibold text-secondary outline-none focus:border-primary transition-all resize-none"
            />
            <p className="text-[8px] text-text-muted/80 pl-1">
              * Ao apoiar a evolução desta meta, todos os hábitos previamente associados à meta "{selectedGoalForEvolve?.title}" serão migrados automaticamente para a nova meta ativa.
            </p>
          </div>

          <Button 
            onClick={handleEvolveGoal} 
            disabled={isEvolving || !evolvedTitle}
            className="w-full py-5 text-[9px] font-bold rounded-xl bg-primary text-white uppercase tracking-[0.3em] hover:opacity-95 shadow-md transition-all"
          >
            {isEvolving ? "Evoluindo arquitetura..." : "Evoluir e Persistir ⚡"}
          </Button>
        </div>
      </Modal>

      {/* Modal de Criação de Nova Missão */}
      <Modal
        isOpen={isNewOutcomeModalOpen}
        onClose={() => { setIsNewOutcomeModalOpen(false); setNewOutcomeTitle(''); setNewOutcomeDescription(''); }}
        title="Criar Nova Missão 🎯"
      >
        <div className="space-y-5 p-1">
          <div>
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] block mb-1.5">
              Título da Missão *
            </label>
            <input
              type="text"
              value={newOutcomeTitle}
              onChange={(e) => setNewOutcomeTitle(e.target.value)}
              placeholder="Ex: Ser um homem saudável"
              className="w-full bg-surface-hover/50 border border-surface-border focus:border-primary/50 rounded-xl px-4 py-3 text-sm md:text-base font-bold text-secondary outline-none transition-colors"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && newOutcomeTitle.trim()) addOutcome(); }}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] block mb-1.5">
              Descrição / Subtítulo (Opcional)
            </label>
            <textarea
              value={newOutcomeDescription}
              onChange={(e) => setNewOutcomeDescription(e.target.value)}
              placeholder="Ex: Construindo um corpo forte e disciplinado, saudável para viver plenamente essa nova fase da minha vida..."
              rows={4}
              className="w-full bg-surface-hover/50 border border-surface-border focus:border-primary/50 rounded-xl px-4 py-3 text-xs md:text-sm font-medium text-secondary outline-none transition-colors resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setIsNewOutcomeModalOpen(false); setNewOutcomeTitle(''); setNewOutcomeDescription(''); }}
              className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={addOutcome}
              disabled={!newOutcomeTitle.trim()}
              className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest bg-primary text-white hover:bg-primary/90"
            >
              Criar Missão
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget?.type === 'outcome') {
             await supabase.from('cycle_outcomes').delete().eq('id', deleteTarget.id).eq('user_name', user.name); 
             fetchOutcomes(); 
          } else if (deleteTarget?.type === 'habit') {
             await deleteHabit(deleteTarget.id);
          }
        }}
        title={`Excluir ${deleteTarget?.type === 'outcome' ? 'Meta' : 'Hábito'}`}
        description={`Tem certeza que deseja excluir est${deleteTarget?.type === 'outcome' ? 'a' : 'e'} ${deleteTarget?.type === 'outcome' ? 'meta' : 'hábito'}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
