import React, { useState, useEffect } from "react";
import { 
  Compass, 
  Sparkles, 
  Edit3, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Target, 
  CheckCircle2, 
  ShieldAlert, 
  HelpCircle,
  Quote,
  Eye,
  Flag,
  BookOpen,
  RotateCcw
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { useCycle } from "@/hooks/useCycle";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";

interface ManifestoData {
  mission: string;
  vision: string;
  principles: string[];
}

const DEFAULT_MISSION = "Construir uma vida de liberdade para minha família, guiado por Deus, através da saúde, do trabalho e da disciplina.";

const DEFAULT_VISION = "Estar vivendo no Canadá com minha família, com uma empresa sólida, uma nova fonte de renda internacional e saúde para aproveitar essa nova fase da vida.";

const DEFAULT_PRINCIPLES = [
  "Deus acima de tudo.",
  "Minha palavra vale mais que minha emoção.",
  "Disciplina vence motivação.",
  "Minha família vem antes do meu ego.",
  "Toda decisão aproxima ou afasta meu futuro.",
  "Nunca paro de aprender."
];

export function Manifesto() {
  const user = useUser();
  const { cycle } = useCycle();

  // Estados principais do Manifesto
  const [manifesto, setManifesto] = useState<ManifestoData>({
    mission: DEFAULT_MISSION,
    vision: DEFAULT_VISION,
    principles: DEFAULT_PRINCIPLES
  });

  // Outcomess/Missões do ciclo ativo
  const [activeOutcomes, setActiveOutcomes] = useState<any[]>([]);
  const [loadingOutcomes, setLoadingOutcomes] = useState(true);

  // Modos de edição
  const [editingCard, setEditingCard] = useState<'mission' | 'vision' | 'principles' | null>(null);
  
  // Buffers de edição temporários
  const [editMission, setEditMission] = useState('');
  const [editVision, setEditVision] = useState('');
  const [editPrinciples, setEditPrinciples] = useState<string[]>([]);
  const [newPrincipleInput, setNewPrincipleInput] = useState('');

  // Controle do Modal de Alinhamento de Ciclo
  const [isCyclePromptOpen, setIsCyclePromptOpen] = useState(false);

  // Carregar dados salvos do manifesto
  useEffect(() => {
    if (!user) return;
    loadManifestoData();
  }, [user]);

  // Carregar missões ativas do ciclo
  useEffect(() => {
    if (!user || !cycle) {
      setActiveOutcomes([]);
      setLoadingOutcomes(false);
      return;
    }
    fetchActiveOutcomes();
  }, [user, cycle]);

  // Verificar se um novo ciclo começou e se precisa perguntar "Este Manifesto ainda representa quem você quer ser?"
  useEffect(() => {
    if (!user || !cycle) return;
    const confirmedCycleKey = `w12_manifesto_cycle_confirmed_${user.name}`;
    const confirmedCycleId = localStorage.getItem(confirmedCycleKey);

    if (confirmedCycleId !== cycle.id) {
      setIsCyclePromptOpen(true);
    }
  }, [user, cycle]);

  const loadManifestoData = async () => {
    if (!user) return;
    const localKey = `w12_manifesto_${user.name}`;
    const savedLocal = localStorage.getItem(localKey);

    let currentData: ManifestoData = {
      mission: DEFAULT_MISSION,
      vision: DEFAULT_VISION,
      principles: DEFAULT_PRINCIPLES
    };

    if (savedLocal) {
      try {
        currentData = JSON.parse(savedLocal);
      } catch (e) {
        console.error("Erro ao ler manifesto do localStorage:", e);
      }
    }

    // Tentar buscar do Supabase
    try {
      const { data, error } = await supabase
        .from('user_manifesto')
        .select('*')
        .eq('user_name', user.name)
        .maybeSingle();

      if (!error && data) {
        currentData = {
          mission: data.mission || currentData.mission,
          vision: data.vision || currentData.vision,
          principles: Array.isArray(data.principles) && data.principles.length > 0 
            ? data.principles 
            : currentData.principles
        };
      }
    } catch (err) {
      // Tabela pode não existir no DB ainda, usamos fallback silencioso para o localStorage
      console.warn("Utilizando armazenamento local para o Manifesto.");
    }

    setManifesto(currentData);
  };

  const saveManifestoData = async (newData: ManifestoData) => {
    if (!user) return;
    
    // 1. Salva no LocalStorage
    const localKey = `w12_manifesto_${user.name}`;
    localStorage.setItem(localKey, JSON.stringify(newData));
    setManifesto(newData);

    // 2. Tenta salvar no Supabase
    try {
      const { error } = await supabase
        .from('user_manifesto')
        .upsert({
          user_name: user.name,
          mission: newData.mission,
          vision: newData.vision,
          principles: newData.principles,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_name' });

      if (error) {
        console.warn("Incapaz de sincronizar manifesto com Supabase, usando persistência local:", error);
      }
    } catch (err) {
      console.warn("Incapaz de sincronizar manifesto com Supabase, usando persistência local:", err);
    }
  };

  const fetchActiveOutcomes = async () => {
    if (!user || !cycle) return;
    setLoadingOutcomes(true);
    try {
      const { data, error } = await supabase
        .from('cycle_outcomes')
        .select('*')
        .eq('user_name', user.name)
        .eq('cycle_id', cycle.id)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Erro ao carregar missões do ciclo:", error);
        setActiveOutcomes([]);
      } else {
        setActiveOutcomes(data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar missões do ciclo:", err);
    } finally {
      setLoadingOutcomes(false);
    }
  };

  // Funções de Edição
  const startEditing = (type: 'mission' | 'vision' | 'principles') => {
    if (type === 'mission') {
      setEditMission(manifesto.mission);
    } else if (type === 'vision') {
      setEditVision(manifesto.vision);
    } else if (type === 'principles') {
      setEditPrinciples([...manifesto.principles]);
      setNewPrincipleInput('');
    }
    setEditingCard(type);
  };

  const cancelEditing = () => {
    setEditingCard(null);
  };

  const saveMission = () => {
    if (!editMission.trim()) return;
    const updated = { ...manifesto, mission: editMission.trim() };
    saveManifestoData(updated);
    setEditingCard(null);
  };

  const saveVision = () => {
    if (!editVision.trim()) return;
    const updated = { ...manifesto, vision: editVision.trim() };
    saveManifestoData(updated);
    setEditingCard(null);
  };

  const savePrinciples = () => {
    const validPrinciples = editPrinciples.map(p => p.trim()).filter(Boolean);
    if (validPrinciples.length === 0) {
      alert("Adicione pelo menos um princípio.");
      return;
    }
    const updated = { ...manifesto, principles: validPrinciples };
    saveManifestoData(updated);
    setEditingCard(null);
  };

  const handleAddPrinciple = () => {
    if (!newPrincipleInput.trim()) return;
    setEditPrinciples([...editPrinciples, newPrincipleInput.trim()]);
    setNewPrincipleInput('');
  };

  const handleRemovePrinciple = (index: number) => {
    setEditPrinciples(editPrinciples.filter((_, idx) => idx !== index));
  };

  // Confirmação de Ciclo
  const handleConfirmCycleSame = () => {
    if (!user || !cycle) return;
    const confirmedCycleKey = `w12_manifesto_cycle_confirmed_${user.name}`;
    localStorage.setItem(confirmedCycleKey, cycle.id);
    setIsCyclePromptOpen(false);
  };

  const handleConfirmCycleEdit = () => {
    if (!user || !cycle) return;
    const confirmedCycleKey = `w12_manifesto_cycle_confirmed_${user.name}`;
    localStorage.setItem(confirmedCycleKey, cycle.id);
    setIsCyclePromptOpen(false);
    startEditing('mission');
  };

  // Formatador para transformar títulos de missão na frase "Quem estou me tornando"
  const formatIdentityStatement = (title: string) => {
    if (!title) return '';
    let trimmed = title.trim();
    
    // Se a missão já começa com "Ser " (ex: "Ser um homem saudável" ou "Ser empresário"),
    // removemos o "Ser " inicial para ficar "Um homem saudável"
    if (trimmed.toLowerCase().startsWith('ser ')) {
      const stripped = trimmed.slice(4).trim();
      // Capitaliza a primeira letra
      return stripped.charAt(0).toUpperCase() + stripped.slice(1);
    }
    return trimmed;
  };

  return (
    <div className="min-h-screen pb-20 pt-4 px-4 md:px-8 max-w-6xl mx-auto space-y-12">
      {/* Header da Tela */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-surface-border pb-8">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-sm">
              <Compass className="w-5 h-5 md:w-6 md:h-6 text-primary animate-spin-slow" />
            </div>
            <div>
              <span className="text-[9px] md:text-[10px] font-extrabold text-primary uppercase tracking-[0.3em] block">
                Bússola de Propósito
              </span>
              <h1 className="text-2xl md:text-4xl font-display font-bold text-secondary uppercase tracking-tight">
                Manifesto
              </h1>
            </div>
          </div>
          <p className="text-text-muted text-xs md:text-sm font-light leading-relaxed">
            Sua declaração de intenção e identidade. Esta tela não mede métricas ou progresso — ela existe para lembrar diariamente do motivo pelo qual você escolheu mudar.
          </p>
        </div>

        {/* Quick action controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCyclePromptOpen(true)}
            className="flex items-center gap-2 bg-surface hover:bg-surface-hover border border-surface-border text-text-muted hover:text-secondary px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
            title="Revisar alinhamento do manifesto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Revisar Manifesto</span>
          </button>
        </div>
      </header>

      {/* Grid Principal do Manifesto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        
        {/* CARD 01 — MINHA MISSÃO (Editável) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-surface border border-surface-border rounded-[2.5rem] p-7 md:p-8 space-y-5 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[8px] font-extrabold text-primary uppercase tracking-[0.3em]">Card 01</span>
                  <h2 className="text-lg md:text-xl font-display font-bold text-secondary uppercase tracking-tight">
                    Minha Missão
                  </h2>
                </div>
              </div>
              
              {editingCard !== 'mission' && (
                <button
                  onClick={() => startEditing('mission')}
                  className="p-2 rounded-xl text-text-muted hover:text-primary hover:bg-primary/5 transition-all"
                  title="Editar Missão"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            {editingCard === 'mission' ? (
              <div className="space-y-4 pt-2">
                <textarea
                  value={editMission}
                  onChange={(e) => setEditMission(e.target.value)}
                  rows={4}
                  placeholder="Escreva a missão principal deste momento da sua vida..."
                  className="w-full bg-surface-hover/50 border border-primary/30 focus:border-primary rounded-2xl p-4 text-xs md:text-sm font-medium text-secondary outline-none resize-none leading-relaxed"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={cancelEditing} className="py-2 px-4 text-[9px]">
                    Cancelar
                  </Button>
                  <Button onClick={saveMission} className="py-2 px-4 text-[9px] bg-primary text-white">
                    Salvar Missão
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-2 relative">
                <Quote className="w-8 h-8 text-primary/10 absolute -top-3 -left-2 pointer-events-none" />
                <p className="text-sm md:text-base font-serif italic text-secondary leading-relaxed pl-4 border-l-2 border-primary/40">
                  "{manifesto.mission}"
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-surface-border/50 flex items-center justify-between text-[9px] font-semibold text-text-muted">
            <span className="uppercase tracking-widest text-primary/70">Propósito de Vida</span>
            <span className="italic">Geralmente se mantém entre ciclos</span>
          </div>
        </motion.div>

        {/* CARD 02 — MINHA VISÃO (Editável) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-surface border border-surface-border rounded-[2.5rem] p-7 md:p-8 space-y-5 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[8px] font-extrabold text-amber-600 uppercase tracking-[0.3em]">Card 02</span>
                  <h2 className="text-lg md:text-xl font-display font-bold text-secondary uppercase tracking-tight">
                    Minha Visão
                  </h2>
                </div>
              </div>

              {editingCard !== 'vision' && (
                <button
                  onClick={() => startEditing('vision')}
                  className="p-2 rounded-xl text-text-muted hover:text-amber-600 hover:bg-amber-500/5 transition-all"
                  title="Editar Visão"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            {editingCard === 'vision' ? (
              <div className="space-y-4 pt-2">
                <textarea
                  value={editVision}
                  onChange={(e) => setEditVision(e.target.value)}
                  rows={4}
                  placeholder="Escreva como você imagina sua vida ao final deste ciclo..."
                  className="w-full bg-surface-hover/50 border border-amber-500/30 focus:border-amber-500 rounded-2xl p-4 text-xs md:text-sm font-medium text-secondary outline-none resize-none leading-relaxed"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={cancelEditing} className="py-2 px-4 text-[9px]">
                    Cancelar
                  </Button>
                  <Button onClick={saveVision} className="py-2 px-4 text-[9px] bg-amber-600 text-white hover:bg-amber-700">
                    Salvar Visão
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-2 relative">
                <p className="text-sm md:text-base font-serif italic text-secondary leading-relaxed pl-4 border-l-2 border-amber-500/40">
                  "{manifesto.vision}"
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-surface-border/50 flex items-center justify-between text-[9px] font-semibold text-text-muted">
            <span className="uppercase tracking-widest text-amber-600/70">Futuro Desejado</span>
            <span className="italic">Destino de médio prazo</span>
          </div>
        </motion.div>

        {/* CARD 03 — QUEM ESTOU ME TORNANDO (Automático / Não Editável) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-surface border border-surface-border rounded-[2.5rem] p-7 md:p-8 space-y-5 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[8px] font-extrabold text-emerald-600 uppercase tracking-[0.3em]">Card 03</span>
                <h2 className="text-lg md:text-xl font-display font-bold text-secondary uppercase tracking-tight">
                  Quem estou me tornando
                </h2>
              </div>
            </div>

            <span className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[8px] font-extrabold uppercase tracking-widest">
              AUTOMÁTICO
            </span>
          </div>

          <p className="text-text-muted text-xs font-light">
            Sua nova identidade em construção, gerada a partir das Missões ativas deste ciclo:
          </p>

          {loadingOutcomes ? (
            <div className="py-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : activeOutcomes.length > 0 ? (
            <div className="space-y-3 pt-1">
              {activeOutcomes.map((goal) => (
                <div 
                  key={goal.id} 
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface-hover/30 border border-surface-border/60 hover:border-emerald-500/30 transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-sm font-display font-bold text-secondary tracking-tight">
                    {formatIdentityStatement(goal.title)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-hover/20 border border-dashed border-surface-border rounded-2xl p-5 text-center space-y-2">
              <Target className="w-6 h-6 text-text-muted mx-auto opacity-50" />
              <p className="text-xs text-text-muted font-medium">
                Nenhuma missão cadastrada no ciclo atual.
              </p>
              <p className="text-[10px] text-text-muted/70">
                Adicione missões na página <strong className="text-primary font-bold">Metas</strong> para refletir sua identidade aqui.
              </p>
            </div>
          )}
        </motion.div>

        {/* CARD 04 — MISSÕES DESTE CICLO (Automático / Não Editável) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-surface border border-surface-border rounded-[2.5rem] p-7 md:p-8 space-y-5 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[8px] font-extrabold text-primary uppercase tracking-[0.3em]">Card 04</span>
                <h2 className="text-lg md:text-xl font-display font-bold text-secondary uppercase tracking-tight">
                  Missões deste ciclo
                </h2>
              </div>
            </div>

            <span className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full text-[8px] font-extrabold uppercase tracking-widest">
              12 SEMANAS
            </span>
          </div>

          <p className="text-text-muted text-xs font-light">
            Grandes prioridades inegociáveis para as 12 semanas atuais:
          </p>

          {loadingOutcomes ? (
            <div className="py-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : activeOutcomes.length > 0 ? (
            <div className="space-y-3 pt-1">
              {activeOutcomes.map((goal) => (
                <div 
                  key={goal.id} 
                  className="p-3.5 rounded-2xl bg-surface-hover/30 border border-surface-border/60 hover:border-primary/20 transition-all space-y-1"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <span className="text-xs md:text-sm font-bold text-secondary uppercase tracking-tight">
                      {goal.title}
                    </span>
                  </div>
                  {goal.description && (
                    <p className="text-[11px] text-text-muted pl-4 italic font-light leading-relaxed">
                      {goal.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-hover/20 border border-dashed border-surface-border rounded-2xl p-5 text-center space-y-2">
              <BookOpen className="w-6 h-6 text-text-muted mx-auto opacity-50" />
              <p className="text-xs text-text-muted font-medium">
                Nenhuma missão configurada no ciclo.
              </p>
            </div>
          )}
        </motion.div>

        {/* CARD 05 — MEUS PRINCÍPIOS (Editável) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="md:col-span-2 bg-surface border border-surface-border rounded-[2.5rem] p-7 md:p-8 space-y-6 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[8px] font-extrabold text-purple-600 uppercase tracking-[0.3em]">Card 05</span>
                <h2 className="text-lg md:text-xl font-display font-bold text-secondary uppercase tracking-tight">
                  Meus Princípios
                </h2>
              </div>
            </div>

            {editingCard !== 'principles' && (
              <button
                onClick={() => startEditing('principles')}
                className="p-2 rounded-xl text-text-muted hover:text-purple-600 hover:bg-purple-500/5 transition-all"
                title="Editar Princípios"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-text-muted text-xs font-light">
            Regras inegociáveis de conduta e código de vida que permanecem mesmo com a mudança de ciclos:
          </p>

          {editingCard === 'principles' ? (
            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                {editPrinciples.map((principle, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-600 w-5">{idx + 1}.</span>
                    <input
                      type="text"
                      value={principle}
                      onChange={(e) => {
                        const copy = [...editPrinciples];
                        copy[idx] = e.target.value;
                        setEditPrinciples(copy);
                      }}
                      className="flex-1 bg-surface-hover/50 border border-surface-border focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-medium text-secondary outline-none"
                    />
                    <button
                      onClick={() => handleRemovePrinciple(idx)}
                      className="p-2 text-text-muted hover:text-red-500 transition-colors"
                      title="Remover princípio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newPrincipleInput}
                  onChange={(e) => setNewPrincipleInput(e.target.value)}
                  placeholder="Adicionar novo princípio..."
                  className="flex-1 bg-surface-hover/30 border border-surface-border focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-medium text-secondary outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddPrinciple(); }}
                />
                <button
                  type="button"
                  onClick={handleAddPrinciple}
                  className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500 text-purple-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-surface-border">
                <Button variant="secondary" onClick={cancelEditing} className="py-2 px-4 text-[9px]">
                  Cancelar
                </Button>
                <Button onClick={savePrinciples} className="py-2 px-4 text-[9px] bg-purple-600 text-white hover:bg-purple-700">
                  Salvar Princípios
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {manifesto.principles.map((principle, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 rounded-2xl bg-surface-hover/30 border border-surface-border/60 hover:border-purple-500/20 transition-all flex items-start gap-3"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                  <span className="text-xs md:text-sm font-semibold text-secondary leading-relaxed">
                    {principle}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* CARD 06 — PERGUNTA DO DIA (Fixo / Não Editável) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="md:col-span-2 bg-gradient-to-br from-primary/10 via-surface to-amber-500/10 border-2 border-primary/20 rounded-[2.5rem] p-8 md:p-12 text-center space-y-4 shadow-lg relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <HelpCircle className="w-6 h-6 animate-pulse" />
          </div>

          <span className="text-[9px] md:text-[10px] font-extrabold text-primary uppercase tracking-[0.4em] block">
            Reflexão Diária Fixo • Card 06
          </span>

          <h3 className="text-2xl md:text-4xl font-display font-extrabold text-secondary tracking-tight max-w-3xl mx-auto leading-tight">
            "O que preciso fazer hoje para me tornar quem decidi ser?"
          </h3>

          <p className="text-text-muted text-xs md:text-sm font-light max-w-lg mx-auto">
            Faça dessa pergunta a sua primeira ação consciente antes de abrir qualquer lista de tarefas ou agenda.
          </p>
        </motion.div>

      </div>

      {/* RODAPÉ DO MANIFESTO */}
      <footer className="pt-8 pb-4 text-center border-t border-surface-border">
        <p className="text-xs md:text-sm font-serif italic text-text-muted max-w-2xl mx-auto leading-relaxed">
          "Você não está construindo hábitos. Está construindo a pessoa que viverá a vida que você sonha."
        </p>
      </footer>

      {/* MODAL DE CONFIRMAÇÃO EM NOVO CICLO */}
      <Modal
        isOpen={isCyclePromptOpen}
        onClose={() => setIsCyclePromptOpen(false)}
        title="Alinhamento de Manifesto 🧭"
      >
        <div className="space-y-6 p-1">
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex gap-3 items-center">
            <Compass className="w-6 h-6 text-primary shrink-0" />
            <p className="text-xs font-semibold text-secondary leading-normal">
              Um novo ciclo de 12 semanas está em andamento! Hora de garantir que sua bússola continua apontando para o seu verdadeiro norte.
            </p>
          </div>

          <div className="text-center py-2 space-y-2">
            <h4 className="text-base md:text-lg font-display font-bold text-secondary uppercase tracking-tight">
              Este Manifesto ainda representa quem você quer ser?
            </h4>
            <p className="text-xs text-text-muted font-light leading-relaxed">
              Você pode manter tudo como está ou aproveitar o novo ciclo para ajustar sua missão, visão e princípios.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleConfirmCycleSame}
              className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest"
            >
              Continuar Igual
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCycleEdit}
              className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest bg-primary text-white hover:bg-primary/90"
            >
              Editar Manifesto
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
