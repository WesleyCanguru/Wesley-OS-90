import React, { useState } from 'react';
import { Button } from './Button';
import { KeyRound, LogIn } from 'lucide-react';

export const Auth = ({ onLogin }: { onLogin: (user: { name: string }) => void }) => {
  const [key, setKey] = useState('');

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    const accessKey = key.trim();
    
    if (accessKey === 'Wesley123') {
      const user = { name: 'Wesley' };
      localStorage.setItem('w12_user', JSON.stringify(user));
      onLogin(user);
    } else if (accessKey === 'Sarah123') {
      const user = { name: 'Sarah' };
      localStorage.setItem('w12_user', JSON.stringify(user));
      onLogin(user);
    } else {
      alert('Chave de acesso inválida!');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-neutral-200">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 shadow-inner">
            <KeyRound className="w-10 h-10" />
          </div>
        </div>
        
        <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-2 text-center">12 Week Challenge</h1>
        <p className="text-neutral-500 text-center mb-10 text-sm">Digite sua chave de acesso pessoal</p>
        
        <form onSubmit={handleAccess} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-[0.2em] mb-3 ml-1">Chave de Acesso</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border border-neutral-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-center text-2xl tracking-[0.3em] font-mono"
              placeholder="••••••••"
              required
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 py-7 rounded-2xl text-xl font-bold shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <LogIn className="w-6 h-6" />
            Entrar no Sistema
          </Button>
        </form>
        
        <div className="mt-10 pt-8 border-t border-neutral-100 text-center">
          <p className="text-xs text-neutral-400 font-medium">Acesso restrito e privado</p>
        </div>
      </div>
    </div>
  );
};
