import { useState, useEffect } from 'react';
import { useUser } from './useUser';

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
};

export interface AgencyClient {
  id: string;
  name: string;
  service: string;
  mrr: number;
  currency: 'BRL' | 'CAD';
  startDate: string;
}

const DEFAULT_METRICS: AgencyMetrics = {
  mrrBr: 8000,
  mrrCan: 0,
  caixaTotalCad: 14000,
  caixaMesBr: 2500,
  brFechamentos: 0,
  canFechamentos: 0,
};

const DEFAULT_CLIENTS: AgencyClient[] = [
  { id: '1', name: 'Cliente 1 (Exemplo)', service: 'Assessoria Completa', mrr: 5000, currency: 'BRL', startDate: '2026-01-01' },
  { id: '2', name: 'Cliente 2 (Exemplo)', service: 'Gestão de Tráfego', mrr: 1500, currency: 'BRL', startDate: '2026-02-01' },
  { id: '3', name: 'Cliente 3 (Exemplo)', service: 'Gestão de Tráfego', mrr: 1500, currency: 'BRL', startDate: '2026-03-01' },
];

export function useAgencyData() {
  const user = useUser();
  const [logs, setLogs] = useState<Record<string, AgencyDailyLog>>({});
  const [metrics, setMetrics] = useState<AgencyMetrics>(DEFAULT_METRICS);
  const [clients, setClients] = useState<AgencyClient[]>(DEFAULT_CLIENTS);

  // Load data
  useEffect(() => {
    if (!user) return;
    
    const storedLogs = localStorage.getItem(`agency_logs_${user.name}`);
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs));
      } catch (e) {
        console.error("Failed to parse agency logs", e);
      }
    }

    const storedMetrics = localStorage.getItem(`agency_metrics_${user.name}`);
    if (storedMetrics) {
      try {
        setMetrics(JSON.parse(storedMetrics));
      } catch (e) {
        console.error("Failed to parse agency metrics", e);
      }
    }

    const storedClients = localStorage.getItem(`agency_clients_${user.name}`);
    if (storedClients) {
      try {
        setClients(JSON.parse(storedClients));
      } catch (e) {
        console.error("Failed to parse agency clients", e);
      }
    } else {
      localStorage.setItem(`agency_clients_${user.name}`, JSON.stringify(DEFAULT_CLIENTS));
    }
  }, [user]);

  // Save logs
  const updateDailyLog = (date: string, updates: Partial<AgencyDailyLog>) => {
    if (!user) return;
    
    setLogs(prev => {
      const current = prev[date] || {
        date,
        brAbordagens: 0,
        brFollowups: 0,
        brCalls: 0,
        brPropostas: 0,
        canAbordagens: 0,
        canFollowups: 0,
        leads: [],
      };
      
      const newLogs = {
        ...prev,
        [date]: { ...current, ...updates }
      };
      
      localStorage.setItem(`agency_logs_${user.name}`, JSON.stringify(newLogs));
      return newLogs;
    });
  };

  // Save metrics
  const updateMetrics = (newMetrics: AgencyMetrics) => {
    if (!user) return;
    setMetrics(newMetrics);
    localStorage.setItem(`agency_metrics_${user.name}`, JSON.stringify(newMetrics));
  };

  const addClient = (client: Omit<AgencyClient, 'id'>) => {
    if (!user) return;
    const newClient = { ...client, id: Math.random().toString(36).substr(2, 9) };
    const newClients = [...clients, newClient];
    setClients(newClients);
    localStorage.setItem(`agency_clients_${user.name}`, JSON.stringify(newClients));
    
    // Auto-update MRR
    const totalBr = newClients.filter(c => c.currency === 'BRL').reduce((sum, c) => sum + c.mrr, 0);
    const totalCan = newClients.filter(c => c.currency === 'CAD').reduce((sum, c) => sum + c.mrr, 0);
    updateMetrics({ ...metrics, mrrBr: totalBr, mrrCan: totalCan });
  };

  const updateClient = (id: string, updates: Partial<AgencyClient>) => {
    if (!user) return;
    const newClients = clients.map(c => c.id === id ? { ...c, ...updates } : c);
    setClients(newClients);
    localStorage.setItem(`agency_clients_${user.name}`, JSON.stringify(newClients));
    
    // Auto-update MRR
    const totalBr = newClients.filter(c => c.currency === 'BRL').reduce((sum, c) => sum + c.mrr, 0);
    const totalCan = newClients.filter(c => c.currency === 'CAD').reduce((sum, c) => sum + c.mrr, 0);
    updateMetrics({ ...metrics, mrrBr: totalBr, mrrCan: totalCan });
  };

  const removeClient = (id: string) => {
    if (!user) return;
    const newClients = clients.filter(c => c.id !== id);
    setClients(newClients);
    localStorage.setItem(`agency_clients_${user.name}`, JSON.stringify(newClients));
    
    // Auto-update MRR
    const totalBr = newClients.filter(c => c.currency === 'BRL').reduce((sum, c) => sum + c.mrr, 0);
    const totalCan = newClients.filter(c => c.currency === 'CAD').reduce((sum, c) => sum + c.mrr, 0);
    updateMetrics({ ...metrics, mrrBr: totalBr, mrrCan: totalCan });
  };

  // Get weekly sums
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
      // Adjust date to local timezone string YYYY-MM-DD
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
    updateDailyLog,
    updateMetrics,
    addClient,
    updateClient,
    removeClient,
    getWeeklySums
  };
}
