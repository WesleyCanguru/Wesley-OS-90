import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div 
        className={cn(
          "relative w-full max-w-lg bg-surface border border-surface-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300",
          className
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <h3 className="text-2xl font-serif font-semibold text-secondary">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-background rounded-full transition-colors text-text-muted hover:text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
}
