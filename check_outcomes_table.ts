import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis do .env se existir
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

async function checkTable() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("Variáveis de ambiente do Supabase não configuradas no ambiente local!");
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.from('cycle_outcomes').select('*').limit(1);
  if (error) {
    console.error("Erro ao ler cycle_outcomes:", error);
  } else {
    console.log("Colunas encontradas na tabela cycle_outcomes:", data && data.length > 0 ? Object.keys(data[0]) : "Tabela vazia ou sem registros.");
  }
}

checkTable();
