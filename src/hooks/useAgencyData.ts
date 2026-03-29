import { useState, useEffect } from 'react';
import { useUser } from './useUser';
import { supabase } from '@/lib/supabase';

export type AgencyLead = {
  id: string;
  name: string;
  status: 'pending' | 'contacted' | 'approved';
  country: 'BR' | 'CAN';
};

export type AgencyDailyLog = {
  date: string; // YYYY-MM-DD
  brAbordagens: number;
  brFollowups: number;
  brCalls: number;
  brPropostas: number;
  canAbordagens: number;
  canFollowups: number;
  leads?: AgencyLead[];
};

export type AgencyMetrics = {
  mrrBr: number;
  mrrCan: number;
  caixaTotalCad: number;
  caixaMesBr: number;
  brFechamentos: number;
  canFechamentos: number;
  targetMrrBr: number;
  targetMrrCan: number;
  targetCaixaMes: number;
};

export interface AgencyClient {
  id: string;
  name: string;
  service: string;
  mrr: number;
  currency: 'BRL' | 'CAD';
  startDate: string;
}

const WESLEY_DEFAULT_METRICS: AgencyMetrics = {
  mrrBr: 8000,
  mrrCan: 0,
  caixaTotalCad: 14000,
  caixaMesBr: 2500,
  brFechamentos: 0,
  canFechamentos: 0,
  targetMrrBr: 30000,
  targetMrrCan: 3000,
  targetCaixaMes: 10000,
};

const GENERIC_DEFAULT_METRICS: AgencyMetrics = {
  mrrBr: 0,
  mrrCan: 0,
  caixaTotalCad: 0,
  caixaMesBr: 0,
  brFechamentos: 0,
  canFechamentos: 0,
  targetMrrBr: 5000,
  targetMrrCan: 0,
  targetCaixaMes: 2000,
};

export function useAgencyData() {
  const user = useUser();
  
  const defaultMetrics = user?.name === 'Wesley' ? WESLEY_DEFAULT_METRICS : GENERIC_DEFAULT_METRICS;

  const [logs, setLogs] = useState<Record<string, AgencyDailyLog>>({});
  const [metrics, setMetrics] = useState<AgencyMetrics>(defaultMetrics);
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        // Fetch Metrics
        const { data: metricsData } = await supabase
          .from('agency_metrics')
          .select('*')
          .eq('user_name', user.name)
          .single();

        if (metricsData) {
          setMetrics({
            mrrBr: metricsData.mrr_br,
            mrrCan: metricsData.mrr_can,
            caixaTotalCad: metricsData.caixa_total_cad,
            caixaMesBr: metricsData.caixa_mes_br,
            brFechamentos: metricsData.br_fechamentos,
            canFechamentos: metricsData.can_fechamentos,
            targetMrrBr: metricsData.target_mrr_br,
            targetMrrCan: metricsData.target_mrr_can,
            targetCaixaMes: metricsData.target_caixa_mes,
          });
        } else {
          // Seed default metrics
          await supabase.from('agency_metrics').insert([{
            user_name: user.name,
            mrr_br: defaultMetrics.mrrBr,
            mrr_can: defaultMetrics.mrrCan,
            caixa_total_cad: defaultMetrics.caixaTotalCad,
            caixa_mes_br: defaultMetrics.caixaMesBr,
            br_fechamentos: defaultMetrics.brFechamentos,
            can_fechamentos: defaultMetrics.canFechamentos,
            target_mrr_br: defaultMetrics.targetMrrBr,
            target_mrr_can: defaultMetrics.targetMrrCan,
            target_caixa_mes: defaultMetrics.targetCaixaMes,
          }]);
        }

        // Fetch Clients
        const { data: clientsData } = await supabase
          .from('agency_clients')
          .select('*')
          .eq('user_name', user.name);
        
        if (clientsData) {
          setClients(clientsData.map(c => ({
            id: c.id,
            name: c.name,
            service: c.service,
            mrr: c.mrr,
            currency: c.currency,
            startDate: c.start_date
          })));
        }

        // Fetch Logs
        const { data: logsData } = await supabase
          .from('agency_logs')
          .select('*')
          .eq('user_name', user.name);
        
        if (logsData) {
          const logsMap: Record<string, AgencyDailyLog> = {};
          logsData.forEach(log => {
            logsMap[log.date] = {
              date: log.date,
              brAbordagens: log.br_abordagens,
              brFollowups: log.br_followups,
              brCalls: log.br_calls,
              brPropostas: log.br_propostas,
              canAbordagens: log.can_abordagens,
              canFollowups: log.can_followups,
            };
          });
          setLogs(logsMap);
        }
      } catch (e) {
        console.error("Error fetching agency data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Save logs
  const updateDailyLog = async (date: string, updates: Partial<AgencyDailyLog>) => {
    if (!user) return;
    
    const current = logs[date] || {
      date,
      brAbordagens: 0,
      brFollowups: 0,
      brCalls: 0,
      brPropostas: 0,
      canAbordagens: 0,
      canFollowups: 0,
    };
    
    const updatedLog = { ...current, ...updates };
    setLogs(prev => ({ ...prev, [date]: updatedLog }));

    await supabase.from('agency_logs').upsert({
      user_name: user.name,
      date,
      br_abordagens: updatedLog.brAbordagens,
      br_followups: updatedLog.brFollowups,
      br_calls: updatedLog.brCalls,
      br_propostas: updatedLog.brPropostas,
      can_abordagens: updatedLog.canAbordagens,
      can_followups: updatedLog.canFollowups,
    });
  };

  // Save metrics
  const updateMetrics = async (newMetrics: AgencyMetrics) => {
    if (!user) return;
    setMetrics(newMetrics);
    
    await supabase.from('agency_metrics').update({
      mrr_br: newMetrics.mrrBr,
      mrr_can: newMetrics.mrrCan,
      caixa_total_cad: newMetrics.caixaTotalCad,
      caixa_mes_br: newMetrics.caixaMesBr,
      br_fechamentos: newMetrics.brFechamentos,
      can_fechamentos: newMetrics.canFechamentos,
      target_mrr_br: newMetrics.targetMrrBr,
      target_mrr_can: newMetrics.targetMrrCan,
      target_caixa_mes: newMetrics.targetCaixaMes,
    }).eq('user_name', user.name);

    // Also update MRR targets in goals table for Metas.tsx
    await supabase.from('goals').update({ target_value: newMetrics.targetMrrBr }).eq('user_name', user.name).eq('title', 'MRR Total');
    await supabase.from('goals').update({ target_value: newMetrics.targetCaixaMes }).eq('user_name', user.name).eq('title', 'Caixa Mensal');
  };

  const addClient = async (client: Omit<AgencyClient, 'id'>) => {
    if (!user) return;
    
    const { data, error } = await supabase.from('agency_clients').insert([{
      user_name: user.name,
      name: client.name,
      service: client.service,
      mrr: client.mrr,
      currency: client.currency,
      start_date: client.startDate
    }]).select().single();

    if (data) {
      const newClients = [...clients, { ...client, id: data.id }];
      setClients(newClients);
      
      // Auto-update MRR
      const totalBr = newClients.filter(c => c.currency === 'BRL').reduce((sum, c) => sum + c.mrr, 0);
      const totalCan = newClients.filter(c => c.currency === 'CAD').reduce((sum, c) => sum + c.mrr, 0);
      updateMetrics({ ...metrics, mrrBr: totalBr, mrrCan: totalCan });
    }
  };

  const updateClient = async (id: string, updates: Partial<AgencyClient>) => {
    if (!user) return;
    
    await supabase.from('agency_clients').update({
      name: updates.name,
      service: updates.service,
      mrr: updates.mrr,
      currency: updates.currency,
      start_date: updates.startDate
    }).eq('id', id);

    const newClients = clients.map(c => c.id === id ? { ...c, ...updates } : c);
    setClients(newClients);
    
    // Auto-update MRR
    const totalBr = newClients.filter(c => c.currency === 'BRL').reduce((sum, c) => sum + c.mrr, 0);
    const totalCan = newClients.filter(c => c.currency === 'CAD').reduce((sum, c) => sum + c.mrr, 0);
    updateMetrics({ ...metrics, mrrBr: totalBr, mrrCan: totalCan });
  };

  const removeClient = async (id: string) => {
    if (!user) return;
    
    await supabase.from('agency_clients').delete().eq('id', id);

    const newClients = clients.filter(c => c.id !== id);
    setClients(newClients);
    
    // Auto-update MRR
    const totalBr = newClients.filter(c => c.currency === 'BRL').reduce((sum, c) => sum + c.mrr, 0);
    const totalCan = newClients.filter(c => c.currency === 'CAD').reduce((sum, c) => sum + c.mrr, 0);
    updateMetrics({ ...metrics, mrrBr: totalBr, mrrCan: totalCan });
  };

  const getWeeklySums = (weekDates: Date[]) => {
    const sums = {
      brAbordagens: 0,
      brFollowups: 0,
      brCalls: 0,
      brPropostas: 0,
      canAbordagens: 0,
      canFollowups: 0,
    };

    weekDates.forEach(dateObj => {
      const localDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));
      const dateStr = localDate.toISOString().split('T')[0];
      
      const log = logs[dateStr];
      if (log) {
        sums.brAbordagens += log.brAbordagens || 0;
        sums.brFollowups += log.brFollowups || 0;
        sums.brCalls += log.brCalls || 0;
        sums.brPropostas += log.brPropostas || 0;
        sums.canAbordagens += log.canAbordagens || 0;
        sums.canFollowups += log.canFollowups || 0;
      }
    });

    return sums;
  };

  return {
    logs,
    metrics,
    clients,
    loading,
    updateDailyLog,
    updateMetrics,
    addClient,
    updateClient,
    removeClient,
    getWeeklySums
  };
}
