import { supabase } from './supabase';

export const clearUserData = async (userName: string) => {
  try {
    console.log(`Limpando dados para ${userName}...`);
    await supabase.from('goals').delete().eq('user_name', userName);
    await supabase.from('body_stats').delete().eq('user_name', userName);
    await supabase.from('food_logs').delete().eq('user_name', userName);
    await supabase.from('daily_checkins').delete().eq('user_name', userName);
    await supabase.from('habit_logs').delete().eq('user_name', userName);
    await supabase.from('habits').delete().eq('user_name', userName);
    console.log(`Dados de ${userName} limpos com sucesso!`);
  } catch (error) {
    console.error(`Erro ao limpar dados de ${userName}:`, error);
  }
};
