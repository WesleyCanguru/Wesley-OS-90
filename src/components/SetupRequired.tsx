import { AlertCircle, ExternalLink, Settings } from "lucide-react";

export function SetupRequired() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-50 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-neutral-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-serif font-bold text-neutral-900 mb-4">
          Configuração Necessária
        </h1>
        
        <p className="text-neutral-600 mb-8 leading-relaxed">
          Para que o aplicativo funcione, você precisa configurar as variáveis de ambiente do <strong>Supabase</strong> no Vercel.
        </p>

        <div className="space-y-4 text-left mb-8">
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Passos no Vercel:
            </h3>
            <ol className="text-sm text-neutral-600 space-y-2 list-decimal ml-4">
              <li>Vá para o seu projeto no <strong>Vercel Dashboard</strong>.</li>
              <li>Clique em <strong>Settings</strong> → <strong>Environment Variables</strong>.</li>
              <li>Adicione <code>VITE_SUPABASE_URL</code> com a URL do seu projeto.</li>
              <li>Adicione <code>VITE_SUPABASE_ANON_KEY</code> com a chave anônima.</li>
              <li>Faça um novo <strong>Redeploy</strong> para aplicar as mudanças.</li>
            </ol>
          </div>
        </div>

        <a 
          href="https://vercel.com/dashboard" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
        >
          Ir para o Vercel
          <ExternalLink className="w-4 h-4" />
        </a>

        <p className="mt-6 text-xs text-neutral-400">
          Dica: Você encontra essas chaves em <strong>Project Settings</strong> → <strong>API</strong> no painel do Supabase.
        </p>
      </div>
    </div>
  );
}
