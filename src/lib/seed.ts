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

export const seedWesleyData = async (userName: string = 'Wesley') => {
  try {
    // Verifica se já existem dados para evitar duplicidade
    const { data: existingCheckins, error: checkError } = await supabase
      .from('daily_checkins')
      .select('id')
      .eq('user_name', userName)
      .limit(1);

    if (checkError) {
      console.error('Erro ao verificar dados existentes:', checkError);
      return;
    }

    if (existingCheckins && existingCheckins.length > 0) {
      console.log('Dados já existem para este usuário.');
      return;
    }

    console.log('Semeando dados fictícios para Wesley...');

    // 1. Metas (Goals)
    const goals = [
      { 
        user_name: userName, 
        title: "Reduzir BF para 12%", 
        category: "Corpo", 
        target_value: 12, 
        current_value: 16.5, 
        start_value: 18, 
        unit: "%", 
        inverse: true 
      },
      { 
        user_name: userName, 
        title: "Correr 5km sub 25min", 
        category: "Corpo", 
        target_value: 24.5, 
        current_value: 28, 
        start_value: 32, 
        unit: "m", 
        inverse: true 
      },
      { 
        user_name: userName, 
        title: "Ler 3 livros de negócios", 
        category: "Alma", 
        target_value: 3, 
        current_value: 1, 
        start_value: 0, 
        unit: " livros" 
      },
      { 
        user_name: userName, 
        title: "Faturar R$ 40k no ciclo", 
        category: "Trabalho", 
        target_value: 40, 
        current_value: 15.4, 
        start_value: 0, 
        unit: "k" 
      }
    ];

    const { error: goalsError } = await supabase.from('goals').insert(goals);
    if (goalsError) throw goalsError;

    // 2. Estatísticas Corporais (Body Stats) - Histórico de peso
    const bodyStats = [];
    const now = new Date();
    for (let i = 10; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      bodyStats.push({
        user_name: userName,
        date: date.toISOString().split('T')[0],
        weight: 85 - (i * 0.2) + (Math.random() * 0.5),
        body_fat: 18 - (i * 0.1),
        measurements: { cintura: 90 - (i * 0.1), peito: 105 }
      });
    }
    const { error: bodyError } = await supabase.from('body_stats').insert(bodyStats);
    if (bodyError) throw bodyError;

    // 3. Logs de Comida (Food Logs) - Para hoje
    const foodLogs = [
      { user_name: userName, name: "Ovos Mexidos (3 unidades)", calories: 210, protein: 18, carbs: 2, fat: 15 },
      { user_name: userName, name: "Frango Grelhado (200g)", calories: 330, protein: 62, carbs: 0, fat: 7 },
      { user_name: userName, name: "Arroz Integral (150g)", calories: 165, protein: 4, carbs: 35, fat: 1 },
      { user_name: userName, name: "Whey Protein", calories: 120, protein: 24, carbs: 3, fat: 2 }
    ];
    const { error: foodError } = await supabase.from('food_logs').insert(foodLogs);
    if (foodError) throw foodError;

    // 4. Check-ins Diários (Daily Checkins) - Últimos 3 dias
    const checkins = [];
    for (let i = 3; i >= 1; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      checkins.push({
        user_name: userName,
        date: date.toISOString().split('T')[0],
        energy: 4,
        mood: 5,
        water_ml: 2500,
        victory: "Concluí todas as tarefas do dia " + i,
        improvement: "Poderia ter dormido mais cedo",
        habits: [
          { id: 1, name: "Leitura 15 min", done: true },
          { id: 2, name: "Treino do dia", done: true },
          { id: 3, name: "Aderência Dieta", done: true }
        ]
      });
    }
    const { error: checkinError } = await supabase.from('daily_checkins').insert(checkins);
    if (checkinError) throw checkinError;

    console.log('Semeadura concluída!');
  } catch (error) {
    console.error('Erro ao semear dados fictícios:', error);
  }
};
