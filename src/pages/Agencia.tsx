import { useState, FormEvent } from "react";
import { 
  Briefcase, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  X,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

// Dados simulados da Agência
const initialAgencyMetrics = {
  mrr: 12500,
  spot: 2900,
  ticketMedio: 2500,
  meta90Dias: 40000,
  faturadoCiclo: 15400,
};

const initialClients = [
  { name: "Tech Solutions", type: "Recorrente", value: 3500, dueDate: "10/03", status: "Pago" },
  { name: "Lanchonete do Bairro", type: "Spot", value: 1200, dueDate: "15/03", status: "Pago" },
  { name: "Imobiliária Silva", type: "Recorrente", value: 2500, dueDate: "20/03", status: "Pendente" },
  { name: "Clínica Odonto", type: "Recorrente", value: 4000, dueDate: "05/03", status: "Atrasado" },
  { name: "E-commerce Modas", type: "Spot", value: 1700, dueDate: "25/03", status: "Pendente" },
];

export function Agencia() {
  const [clients, setClients] = useState(initialClients);
  const [metrics, setMetrics] = useState(initialAgencyMetrics);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  // Form states
  const [newClient, setNewClient] = useState({ name: "", type: "Recorrente", value: "" });
  const [newSale, setNewSale] = useState({ clientName: "", value: "", type: "Spot" });

  const faltamParaMeta = metrics.meta90Dias - metrics.faturadoCiclo;
  const novosClientesNecessarios = Math.ceil(faltamParaMeta / metrics.ticketMedio);

  const handleAddClient = (e: FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.value) return;
    
    const client = {
      ...newClient,
      value: Number(newClient.value),
      dueDate: "A definir",
      status: "Pendente"
    };
    
    setClients([client, ...clients]);
    setIsClientModalOpen(false);
    setNewClient({ name: "", type: "Recorrente", value: "" });
  };

  const handleRegisterSale = (e: FormEvent) => {
    e.preventDefault();
    if (!newSale.clientName || !newSale.value) return;

    const saleValue = Number(newSale.value);
    
    // Update metrics
    setMetrics(prev => ({
      ...prev,
      faturadoCiclo: prev.faturadoCiclo + saleValue,
      spot: newSale.type === "Spot" ? prev.spot + saleValue : prev.spot,
      mrr: newSale.type === "Recorrente" ? prev.mrr + saleValue : prev.mrr
    }));

    // Add to clients list as a spot or update existing? 
    // For simplicity, let's add as a new entry
    setClients([{
      name: newSale.clientName,
      type: newSale.type,
      value: saleValue,
      dueDate: "Hoje",
      status: "Pago"
    }, ...clients]);

    setIsSaleModalOpen(false);
    setNewSale({ clientName: "", value: "", type: "Spot" });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Agency OS</div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-primary">Gestão da Agência</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsClientModalOpen(true)}
            className="bg-surface border border-surface-border text-primary px-5 py-2.5 rounded-full font-medium hover:bg-surface-hover transition-colors flex items-center gap-2 shadow-sm"
          >
            <Users className="w-4 h-4" />
            Novo Cliente
          </button>
          <button 
            onClick={() => setIsSaleModalOpen(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-full font-medium hover:bg-primary/90 transition-colors shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Registrar Venda
          </button>
        </div>
      </header>

      {/* Top Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          label="MRR (Recorrente)" 
          value={`R$ ${(metrics.mrr / 1000).toFixed(1)}k`} 
          subtext="Receita Mensal" 
          icon={TrendingUp} 
          color="text-emerald-600" 
        />
        <MetricCard 
          label="Spot (Únicos)" 
          value={`R$ ${(metrics.spot / 1000).toFixed(1)}k`} 
          subtext="No Ciclo" 
          icon={DollarSign} 
          color="text-blue-500" 
        />
        <MetricCard 
          label="Ticket Médio" 
          value={`R$ ${metrics.ticketMedio}`} 
          subtext="Por Cliente" 
          icon={Target} 
          color="text-primary" 
        />
        <MetricCard 
          label="Faturado Ciclo" 
          value={`R$ ${(metrics.faturadoCiclo / 1000).toFixed(1)}k`} 
          subtext={`Meta: R$ ${metrics.meta90Dias / 1000}k`} 
          icon={Briefcase} 
          color="text-orange-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Goal Math & Funnel */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* A Matemática da Meta */}
          <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
            <h2 className="font-serif text-2xl font-semibold text-secondary mb-8">A Matemática da Meta</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Faltam para a Meta</div>
                  <div className="text-4xl font-serif font-bold text-primary">R$ {(faltamParaMeta / 1000).toFixed(1)}k</div>
                </div>
                <div className="p-6 bg-background border border-surface-border rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="font-medium text-secondary">Novos Clientes Necessários</span>
                  </div>
                  <div className="text-3xl font-serif font-bold text-primary">{novosClientesNecessarios}</div>
                  <p className="text-xs text-text-muted mt-2">Baseado no ticket médio de R$ {metrics.ticketMedio}</p>
                </div>
              </div>

              <div className="bg-primary text-white rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
                <h3 className="font-serif text-xl font-semibold mb-4 relative z-10">Status do Ritmo</h3>
                <div className="flex items-center gap-2 text-emerald-400 mb-2 relative z-10">
                  <ArrowUpRight className="w-5 h-5" />
                  <span className="font-bold">ACIMA DA META</span>
                </div>
                <p className="text-white/80 text-sm leading-relaxed relative z-10">
                  Seu ritmo de fechamento está <span className="text-white font-bold">15% superior</span> ao necessário para bater os R$ 40k.
                </p>
              </div>
            </div>
          </div>

          {/* Controle de Recebimentos */}
          <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-semibold text-secondary">Controle de Recebimentos</h2>
              <button className="text-sm text-primary font-medium hover:underline">Ver todos</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="pb-4 text-xs font-bold text-text-muted uppercase tracking-widest">Cliente</th>
                    <th className="pb-4 text-xs font-bold text-text-muted uppercase tracking-widest">Tipo</th>
                    <th className="pb-4 text-xs font-bold text-text-muted uppercase tracking-widest">Valor</th>
                    <th className="pb-4 text-xs font-bold text-text-muted uppercase tracking-widest">Venc.</th>
                    <th className="pb-4 text-xs font-bold text-text-muted uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {clients.map((client, i) => (
                    <tr key={i} className="group hover:bg-background/50 transition-colors">
                      <td className="py-4 font-medium text-secondary">{client.name}</td>
                      <td className="py-4 text-sm text-text-muted">{client.type}</td>
                      <td className="py-4 font-mono font-bold text-primary">R$ {client.value}</td>
                      <td className="py-4 text-sm font-mono text-text-muted">{client.dueDate}</td>
                      <td className="py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          client.status === "Pago" ? "bg-emerald-100 text-emerald-700" :
                          client.status === "Atrasado" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        )}>
                          {client.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Insights & Pipeline */}
        <div className="space-y-8">
          
          {/* Pipeline Summary */}
          <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-secondary mb-6">Funil de Vendas</h2>
            <div className="space-y-4">
              <PipelineItem label="Leads Ativos" value={45} color="bg-blue-500" />
              <PipelineItem label="Reuniões" value={12} color="bg-yellow-500" />
              <PipelineItem label="Propostas" value={8} color="bg-orange-500" />
              <PipelineItem label="Fechamentos" value={3} color="bg-emerald-500" />
            </div>
            <div className="mt-8 p-4 bg-background border border-surface-border rounded-2xl">
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Conversão Geral</div>
              <div className="text-2xl font-serif font-bold text-primary">6.6%</div>
            </div>
          </div>

          {/* Agency Insight */}
          <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm border-l-4 border-l-primary">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-primary" />
              <h3 className="font-serif text-lg font-semibold text-secondary">Insight da Agência</h3>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              Sua receita recorrente (MRR) cobre <span className="font-bold text-secondary">85% dos seus custos fixos</span>. 
              Foque em fechar mais <span className="font-bold text-secondary">2 contratos recorrentes</span> para atingir o ponto de equilíbrio total e deixar os projetos Spot apenas como lucro líquido.
            </p>
          </div>

        </div>
      </div>

      {/* Modals */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-surface-border rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl font-semibold text-secondary">Novo Cliente</h2>
              <button onClick={() => setIsClientModalOpen(false)} className="p-2 hover:bg-background rounded-full transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <form onSubmit={handleAddClient} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Nome da Empresa</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={newClient.name}
                  onChange={e => setNewClient({...newClient, name: e.target.value})}
                  className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  placeholder="Ex: Tech Solutions"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Tipo</label>
                  <select 
                    value={newClient.type}
                    onChange={e => setNewClient({...newClient, type: e.target.value})}
                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  >
                    <option value="Recorrente">Recorrente</option>
                    <option value="Spot">Spot</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Valor (R$)</label>
                  <input 
                    required
                    type="number" 
                    value={newClient.value}
                    onChange={e => setNewClient({...newClient, value: e.target.value})}
                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono font-bold"
                    placeholder="2500"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                Adicionar Cliente
              </button>
            </form>
          </div>
        </div>
      )}

      {isSaleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-surface-border rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl font-semibold text-secondary">Registrar Venda</h2>
              <button onClick={() => setIsSaleModalOpen(false)} className="p-2 hover:bg-background rounded-full transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <form onSubmit={handleRegisterSale} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Cliente</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={newSale.clientName}
                  onChange={e => setNewSale({...newSale, clientName: e.target.value})}
                  className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  placeholder="Nome do cliente ou empresa"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Tipo de Venda</label>
                  <select 
                    value={newSale.type}
                    onChange={e => setNewSale({...newSale, type: e.target.value})}
                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  >
                    <option value="Spot">Spot (Único)</option>
                    <option value="Recorrente">Recorrente (MRR)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Valor (R$)</label>
                  <input 
                    required
                    type="number" 
                    value={newSale.value}
                    onChange={e => setNewSale({...newSale, value: e.target.value})}
                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono font-bold"
                    placeholder="1500"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
                Confirmar Venda
              </button>
            </form>
          </div>
        </div>
      )}
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
      <div className="text-2xl font-serif font-bold text-secondary mb-1">{value}</div>
      <div className="text-xs font-medium text-text-muted">
        {subtext}
      </div>
    </div>
  );
}

function PipelineItem({ label, value, color }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn("w-2 h-2 rounded-full", color)} />
        <span className="text-sm font-medium text-secondary">{label}</span>
      </div>
      <span className="font-mono font-bold text-primary">{value}</span>
    </div>
  );
}
