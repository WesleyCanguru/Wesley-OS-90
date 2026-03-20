import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from './Button';
import { LogIn, User } from 'lucide-react';

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().toLowerCase();
    
    if (cleanName !== 'wesley' && cleanName !== 'sarah') {
      alert('Acesso restrito. Por favor, use "Wesley" ou "Sarah".');
      return;
    }

    setLoading(true);
    const email = `${cleanName}@system.com`;
    const password = `acesso_${cleanName}_123`;

    // 1. Tenta fazer login
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });

    if (signInError) {
      // 2. Se falhar, tenta cadastrar (primeiro acesso)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            display_name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
          }
        }
      });
      
      if (signUpError) {
        if (signUpError.message.includes('Database error')) {
          alert('Erro de Banco de Dados: Verifique se você executou o SQL de criação das tabelas no painel do Supabase.');
        } else {
          alert('Erro: ' + signUpError.message);
        }
      } else if (signUpData.session) {
        // Logado automaticamente após cadastro (se "Confirm Email" estiver OFF)
        console.log('Usuário criado e logado com sucesso');
      } else {
        alert('Acesso criado! Se o login não ocorrer automaticamente, verifique se a opção "Confirm Email" está DESATIVADA no seu painel do Supabase (Authentication > Providers > Email).');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm w-full max-w-md border border-neutral-200">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <User className="w-8 h-8" />
          </div>
        </div>
        
        <h1 className="text-2xl font-serif font-bold text-neutral-900 mb-2 text-center">Bem-vindo</h1>
        <p className="text-neutral-500 text-center mb-8 text-sm">Digite seu nome para acessar o dashboard</p>
        
        <form onSubmit={handleAccess} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 ml-1">Seu Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-3 rounded-2xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-lg font-medium"
              placeholder="Ex: Wesley ou Sarah"
              required
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 py-6 rounded-2xl text-lg font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Acessando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                Acessar Dashboard
              </div>
            )}
          </Button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
          <p className="text-xs text-neutral-400">Acesso restrito para Wesley e Sarah</p>
        </div>
      </div>
    </div>
  );
};
