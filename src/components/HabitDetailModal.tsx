import React from "react";
import { 
  Sparkles, 
  Zap, 
  Calendar, 
  Clock, 
  MapPin, 
  Target, 
  Heart, 
  Pencil, 
  Tag,
  Quote,
  X
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { cn } from "@/lib/utils";

export type HabitDetail = {
  id: string;
  name: string;
  emoji?: string;
  area?: 'alma' | 'corpo' | 'foco' | string;
  type?: 'check' | 'numeric' | string;
  frequency_per_week?: number;
  daily_goal?: number;
  unit?: string;
  time?: string;
  location?: string;
  motivation?: string;
  description?: string;
  category?: string;
  color?: string;
  goal_id?: string;
};

interface HabitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: HabitDetail | null;
  goalTitle?: string;
  onEdit?: (habit: HabitDetail) => void;
}

const AREA_MAP: Record<string, { name: string; emoji: string }> = {
  alma: { name: 'Alma', emoji: '🤎' },
  corpo: { name: 'Corpo', emoji: '🌿' },
  foco: { name: 'Trabalho & Foco', emoji: '🪵' },
};

export function HabitDetailModal({
  isOpen,
  onClose,
  habit,
  goalTitle,
  onEdit
}: HabitDetailModalProps) {
  if (!habit) return null;

  const areaInfo = AREA_MAP[habit.area || 'corpo'] || { name: habit.area || 'Geral', emoji: '✨' };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Hábito">
      <div className="space-y-5">
        {/* Banner do Hábito */}
        <div className="bg-surface-hover/30 border border-surface-border rounded-2xl p-4 flex items-start gap-4">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-md border border-black/10"
            style={{ backgroundColor: habit.color || '#5E6E5A' }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-lg md:text-xl text-secondary uppercase tracking-tight leading-snug break-words">
              {habit.name}
            </h3>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                <span>{areaInfo.emoji}</span>
                <span>{areaInfo.name}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-secondary/10 text-secondary border border-secondary/20">
                <Zap className="w-3 h-3 text-secondary" />
                <span>{habit.frequency_per_week || 7}x / semana</span>
              </span>

              {habit.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20">
                  <Tag className="w-3 h-3" />
                  <span>{habit.category}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Por que isso é inegociável / Motivação */}
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 md:p-5 space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
            <Quote className="w-4 h-4" />
            <span>Por que isso é inegociável?</span>
          </div>
          {habit.motivation || habit.description ? (
            <p className="text-secondary/90 text-sm md:text-base italic leading-relaxed whitespace-pre-wrap font-sans pl-1">
              "{habit.motivation || habit.description}"
            </p>
          ) : (
            <p className="text-text-muted text-xs italic">
              Nenhuma motivação/propósito cadastrado para este hábito.
            </p>
          )}
        </div>

        {/* Informações do Cadastro */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            Informações do Cadastro
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Meta Vinculada */}
            <div className="bg-surface border border-surface-border rounded-xl p-3 flex items-start gap-2.5">
              <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-text-muted">
                  Missão / Meta
                </span>
                <span className="font-semibold text-secondary block mt-0.5">
                  {goalTitle || "Sem meta vinculada"}
                </span>
              </div>
            </div>

            {/* Tipo e Meta Diária */}
            <div className="bg-surface border border-surface-border rounded-xl p-3 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-text-muted">
                  Tipo de Meta
                </span>
                <span className="font-semibold text-secondary block mt-0.5">
                  {habit.type === 'numeric' 
                    ? `Objetivo Numérico (${habit.daily_goal || 1} ${habit.unit || 'unidades'})`
                    : 'Checklist simples'}
                </span>
              </div>
            </div>

            {/* Horário */}
            <div className="bg-surface border border-surface-border rounded-xl p-3 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-text-muted">
                  Horário Previsto
                </span>
                <span className="font-semibold text-secondary block mt-0.5">
                  {habit.time || "Qualquer horário"}
                </span>
              </div>
            </div>

            {/* Local */}
            <div className="bg-surface border border-surface-border rounded-xl p-3 flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-text-muted">
                  Local
                </span>
                <span className="font-semibold text-secondary block mt-0.5">
                  {habit.location || "Não especificado"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé / Botões */}
        <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-surface-border bg-surface hover:bg-surface-hover text-secondary font-bold text-xs uppercase tracking-wider transition-all"
          >
            Fechar
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(habit);
              }}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-primary/20"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar Hábito</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
