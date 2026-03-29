import { useState, FormEvent, useEffect } from "react";
import { 
  Briefcase, 
  TrendingUp, 
  DollarSign, 
  Target, 
  ArrowUpRight, 
  CheckCircle2,
  AlertCircle,
  Globe,
  ShieldCheck,
  Activity,
  Plus,
  X,
  Edit2,
  Users,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useAgencyData, AgencyClient } from "@/hooks/useAgencyData";

export function Agencia() {
  const user = useUser();
  const { metrics, updateMetrics, getWeeklySums, clients, addClient, updateClient, removeClient } = useAgencyData();
  
  const [activeTab, setActiveTab] = useState<'macro' | 'mrr'>('macro');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<AgencyClient | null>(null);
  const [editMetrics, setEditMetrics] = useState(metrics);
  
  const [newClientData, setNewClientData] = useState<Omit<AgencyClient, 'id'>>({
    name: '',
    service: '',
    mrr: 0,
    currency: 'BRL',
    startDate: new Date().toISOString().split('T')[0]
  });

  // Calculate current week dates
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  useEffect(() => {
    const dates = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diffToMonday));

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    setWeekDates(dates);
  }, []);

  const weeklySums = getWeeklySums(weekDates);

  useEffect(() => {
    setEditMetrics(metrics);
  }, [metrics]);

  const handleUpdateMetrics = (e: FormEvent) => {
    e.preventDefault();
    updateMetrics(editMetrics);
    setIsUpdateModalOpen(false);
  };

  const handleAddClient = (e: FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateClient(editingClient.id, newClientData);
    } else {
      addClient(newClientData);
    }
    setIsNewClientModalOpen(false);
    setEditingClient(null);
    setNewClientData({
      name: '',
      service: '',
      mrr: 0,
      currency: 'BRL',
      startDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleEditClient = (client: AgencyClient) => {
    setEditingClient(client);
    setNewClientData({
      name: client.name,
      service: client.service,
      mrr: client.mrr,
      currency: client.currency,
      startDate: client.startDate
    });
    setIsNewClientModalOpen(true);
  };

  const handleCloseClientModal = () => {
    setIsNewClientModalOpen(false);
    setEditingClient(null);
    setNewClientData({
      name: '',
      service: '',
      mrr: 0,
      currency: 'BRL',
      startDate: new Date().toISOString().split('T')[0]
    });
  };

  if (user?.name !== 'Wesley') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in fade-in duration-500">
        <Briefcase className="w-16 h-16 text-surface-border" />
        <h2 className="text-2xl font-serif font-semibold text-secondary">Área da Agência</h2>
        <p className="text-text-muted max-w-md">
          As metas e o painel de gestão para o seu perfil ainda não foram configurados. 
          Em breve, suas informações estarão disponíveis aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Agency OS</div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-primary">Gestão da Agência</h1>
          <p className="text-text-muted mt-2">Acompanhamento do ciclo de 12 semanas (30/03 a 21/06)</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsUpdateModalOpen(true)}
            className="bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Atualizar Números
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-border pb-px">
        <button
          onClick={() => setActiveTab('macro')}
          className={cn(
            "px-6 py-3 font-bold transition-all border-b-2 text-sm",
            activeTab === 'macro' ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-secondary"
          )}
        >
          Visão Macro
        </button>
        <button
          onClick={() => setActiveTab('mrr')}
          className={cn(
            "px-6 py-3 font-bold transition-all border-b-2 text-sm",
            activeTab === 'mrr' ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-secondary"
          )}
        >
          Base de MRR
        </button>
      </div>

      {activeTab === 'macro' ? (
        <div className="space-y-10 animate-in fade-in duration-500">
          {/* Placares Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placar 1: MRR Portátil */}
        <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-secondary leading-tight">MRR Portátil</h3>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Meta Principal</p>
            </div>
          </div>
          <div className="space-y-5 relative z-10">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-text-muted font-medium">Brasil (Meta: R$ 30k)</span>
                <span className="font-bold text-primary">R$ {metrics.mrrBr.toLocaleString('pt-BR')}</span>
              </div>
              <div className="h-2.5 w-full bg-background rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (metrics.mrrBr / 30000) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-text-muted font-medium">Canadá (Meta: CAD 3k)</span>
                <span className="font-bold text-emerald-600">CAD {metrics.mrrCan.toLocaleString('en-CA')}</span>
              </div>
              <div className="h-2.5 w-full bg-background rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (metrics.mrrCan / 3000) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Placar 2: Caixa (Aceleração) */}
        <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-secondary leading-tight">Caixa Extra</h3>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Aceleração</p>
            </div>
          </div>
          <div className="space-y-4 relative z-10">
            <div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Faturado no Mês</div>
              <div className="text-3xl font-serif font-bold text-blue-600">R$ {metrics.caixaMesBr.toLocaleString('pt-BR')}</div>
              <div className="text-xs text-text-muted mt-1">Meta: R$ 10.000 / mês</div>
            </div>
            <div className="h-2.5 w-full bg-background rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (metrics.caixaMesBr / 10000) * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Placar 3: Runway */}
        <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 bg-orange-500/10 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-secondary leading-tight">Runway</h3>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Segurança</p>
            </div>
          </div>
          <div className="space-y-4 relative z-10">
            <div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Meses de Folga</div>
              <div className="text-3xl font-serif font-bold text-orange-600">{(metrics.caixaTotalCad / 7000).toFixed(1)} <span className="text-lg text-orange-600/60">meses</span></div>
              <div className="text-xs text-text-muted mt-1">Base: CAD 7k/mês | Caixa: CAD {metrics.caixaTotalCad.toLocaleString('en-CA')}</div>
            </div>
            <div className="h-2.5 w-full bg-background rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (metrics.caixaTotalCad / (7000 * 6)) * 100)}%` }} />
            </div>
            <div className="text-[10px] font-bold text-text-muted text-right uppercase tracking-widest">Meta ideal: 6 meses</div>
          </div>
        </div>
      </div>

      {/* Metas de Atividade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Atividades BR */}
        <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-secondary">Atividades BR</h2>
              <p className="text-sm text-text-muted mt-1">Acompanhamento Semanal</p>
            </div>
            <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold tracking-widest uppercase">Canguru</span>
          </div>
          
          <div className="space-y-6">
            <ActivityProgress label="Abordagens Novas" current={weeklySums.brAbordagens} target={100} dailyTarget={20} color="bg-primary" />
            <ActivityProgress label="Follow-ups" current={weeklySums.brFollowups} target={60} dailyTarget={12} color="bg-primary" />
            <ActivityProgress label="Calls Realizadas" current={weeklySums.brCalls} target={5} dailyTarget={1} color="bg-primary" />
            <ActivityProgress label="Propostas Enviadas" current={weeklySums.brPropostas} target={5} dailyTarget={1} color="bg-primary" />
            
            <div className="pt-6 border-t border-surface-border mt-8">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-sm font-bold text-secondary uppercase tracking-widest mb-1">Fechamentos</div>
                  <div className="text-xs text-text-muted">Meta: 1/sem (Adiciona ~R$ 2.500 MRR)</div>
                </div>
                <div className="text-3xl font-serif font-bold text-emerald-600">{metrics.brFechamentos}<span className="text-xl text-emerald-600/50">/1</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Atividades CAN */}
        <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-secondary">Atividades CAN</h2>
              <p className="text-sm text-text-muted mt-1">Acompanhamento Semanal</p>
            </div>
            <span className="px-4 py-1.5 bg-red-500/10 text-red-600 rounded-full text-xs font-bold tracking-widest uppercase">Kanoa</span>
          </div>
          
          <div className="space-y-6">
            <ActivityProgress label="Abordagens Novas" current={weeklySums.canAbordagens} target={80} dailyTarget={16} color="bg-red-500" />
            <ActivityProgress label="Follow-ups" current={weeklySums.canFollowups} target={40} dailyTarget={8} color="bg-red-500" />
            
            <div className="pt-6 border-t border-surface-border mt-8">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-sm font-bold text-secondary uppercase tracking-widest mb-1">Pacotes Fechados</div>
                  <div className="text-xs text-text-muted">Meta: 4/sem (CAD 200 por pacote)</div>
                </div>
                <div className="text-3xl font-serif font-bold text-emerald-600">{metrics.canFechamentos}<span className="text-xl text-emerald-600/50">/4</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regras do Jogo */}
      <div className="bg-primary text-white rounded-3xl p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-white/40" />
            <h2 className="font-serif text-2xl font-semibold tracking-tight">Regras do Jogo</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
              <div className="text-xl font-serif font-bold mb-2">Foco S1 a S9</div>
              <p className="text-sm text-white/80 leading-relaxed">Aquisição agressiva. Bater a meta de 9 clientes BR até 31/05.</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
              <div className="text-xl font-serif font-bold mb-2">Foco S10 a S12</div>
              <p className="text-sm text-white/80 leading-relaxed">Retenção, estabilização e entrega impecável. Buffer de segurança.</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
              <div className="text-xl font-serif font-bold mb-2">Serviço Avulso</div>
              <p className="text-sm text-white/80 leading-relaxed">Não conta para MRR. É combustível 100% para o Caixa Extra e Runway.</p>
            </div>
          </div>
        </div>
      </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-secondary">Clientes Ativos (MRR)</h2>
                  <p className="text-sm text-text-muted mt-1">Base que compõe os R$ {metrics.mrrBr.toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewClientModalOpen(true)}
                className="bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Novo Cliente
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-hover/50 border-b border-surface-border">
                    <th className="p-4 font-bold text-xs text-text-muted uppercase tracking-widest rounded-tl-xl">Cliente</th>
                    <th className="p-4 font-bold text-xs text-text-muted uppercase tracking-widest">Serviço</th>
                    <th className="p-4 font-bold text-xs text-text-muted uppercase tracking-widest">Valor (MRR)</th>
                    <th className="p-4 font-bold text-xs text-text-muted uppercase tracking-widest rounded-tr-xl text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {clients.map(client => (
                    <tr key={client.id} className="hover:bg-surface-hover/30 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-secondary">{client.name}</div>
                        <div className="text-xs text-text-muted mt-0.5">Desde {new Date(client.startDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</div>
                      </td>
                      <td className="p-4 text-sm text-secondary">{client.service}</td>
                      <td className="p-4 font-mono font-bold text-primary">
                        {client.currency === 'BRL' ? 'R$ ' : 'CAD '}
                        {client.mrr.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEditClient(client)}
                            className="text-text-muted hover:text-primary transition-colors p-2"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => removeClient(client.id)}
                            className="text-text-muted hover:text-red-500 transition-colors p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {clients.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-text-muted">
                        Nenhum cliente cadastrado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-surface-hover/30 border-t-2 border-surface-border">
                  <tr>
                    <td colSpan={2} className="p-4 font-bold text-secondary text-right">Total MRR Brasil:</td>
                    <td className="p-4 font-mono font-bold text-primary text-lg">R$ {metrics.mrrBr.toLocaleString('pt-BR')}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="p-4 font-bold text-secondary text-right">Total MRR Canadá:</td>
                    <td className="p-4 font-mono font-bold text-red-600 text-lg">CAD {metrics.mrrCan.toLocaleString('pt-BR')}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <span className="font-bold">Nota:</span> Esta é uma lista simplificada para acompanhamento rápido do seu MRR. A gestão financeira completa e emissão de notas continua sendo feita no sistema principal da Canguru.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Atualização */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-surface-border rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-surface py-2 z-10 border-b border-surface-border">
              <h2 className="font-serif text-2xl font-semibold text-secondary">Atualizar Números</h2>
              <button onClick={() => setIsUpdateModalOpen(false)} className="p-2 hover:bg-background rounded-full transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateMetrics} className="space-y-8">
              {/* Placares */}
              <div>
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Placares Principais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">MRR Brasil (R$)</label>
                    <input 
                      type="number" 
                      value={editMetrics.mrrBr}
                      onChange={e => setEditMetrics({...editMetrics, mrrBr: Number(e.target.value)})}
                      className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">MRR Canadá (CAD)</label>
                    <input 
                      type="number" 
                      value={editMetrics.mrrCan}
                      onChange={e => setEditMetrics({...editMetrics, mrrCan: Number(e.target.value)})}
                      className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Caixa Extra Mês (R$)</label>
                    <input 
                      type="number" 
                      value={editMetrics.caixaMesBr}
                      onChange={e => setEditMetrics({...editMetrics, caixaMesBr: Number(e.target.value)})}
                      className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Caixa Total (CAD)</label>
                    <input 
                      type="number" 
                      value={editMetrics.caixaTotalCad}
                      onChange={e => setEditMetrics({...editMetrics, caixaTotalCad: Number(e.target.value)})}
                      className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Atividades BR */}
              <div>
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Fechamentos BR (Semana)</h3>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Novos Clientes</label>
                    <input 
                      type="number" 
                      value={editMetrics.brFechamentos}
                      onChange={e => setEditMetrics({...editMetrics, brFechamentos: Number(e.target.value)})}
                      className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-emerald-700"
                    />
                  </div>
                </div>
              </div>

              {/* Atividades CAN */}
              <div>
                <h3 className="text-sm font-bold text-red-600 uppercase tracking-widest mb-4">Fechamentos CAN (Semana)</h3>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Pacotes Fechados</label>
                    <input 
                      type="number" 
                      value={editMetrics.canFechamentos}
                      onChange={e => setEditMetrics({...editMetrics, canFechamentos: Number(e.target.value)})}
                      className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-emerald-700"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 sticky bottom-0 bg-surface pb-2">
                <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo/Editar Cliente */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-surface-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-surface-border">
              <h2 className="font-serif text-2xl font-semibold text-secondary">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button 
                onClick={handleCloseClientModal}
                className="p-2 hover:bg-surface-hover rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            
            <form onSubmit={handleAddClient} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Nome do Cliente / Empresa</label>
                  <input 
                    type="text" 
                    required
                    value={newClientData.name}
                    onChange={e => setNewClientData({...newClientData, name: e.target.value})}
                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Ex: Empresa X"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Serviço Prestado</label>
                  <input 
                    type="text" 
                    required
                    value={newClientData.service}
                    onChange={e => setNewClientData({...newClientData, service: e.target.value})}
                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Ex: Gestão de Tráfego"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Valor (MRR)</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      value={newClientData.mrr}
                      onChange={e => setNewClientData({...newClientData, mrr: Number(e.target.value)})}
                      className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Moeda</label>
                    <select 
                      value={newClientData.currency}
                      onChange={e => setNewClientData({...newClientData, currency: e.target.value as 'BRL' | 'CAD'})}
                      className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="BRL">BRL (R$)</option>
                      <option value="CAD">CAD ($)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Data de Início</label>
                  <input 
                    type="date" 
                    required
                    value={newClientData.startDate}
                    onChange={e => setNewClientData({...newClientData, startDate: e.target.value})}
                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="pt-4 sticky bottom-0 bg-surface pb-2">
                <button 
                  type="submit"
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md"
                >
                  {editingClient ? 'Salvar Alterações' : 'Adicionar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityProgress({ label, current, target, dailyTarget, color }: any) {
  const percent = Math.min(100, Math.round((current / target) * 100));
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-secondary">{label}</span>
        <span className="font-bold text-secondary">{current} <span className="text-text-muted font-normal">/ {target}</span></span>
      </div>
      <div className="h-2.5 w-full bg-background rounded-full overflow-hidden mb-1.5">
        <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${percent}%` }} />
      </div>
      <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-right">Meta diária: {dailyTarget}</div>
    </div>
  );
}
