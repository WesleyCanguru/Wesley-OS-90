import { useState, useEffect } from 'react';
import { useUser } from './useUser';
import { supabase } from '@/lib/supabase';
import { NUTRITION_TARGETS, DEFAULT_NUTRITION } from "@/config/nutritionTargets";

export type UserGoals = {
  // Corpo
  targetWeight: number;
  targetBf: number;
  targetCalories: number;
  targetProtein: number;
  // Alma
  targetEnergy: number;
};

export function useUserGoals() {
  const user = useUser();
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_name', user.name);

      if (error) throw error;

      const defaultGoals: UserGoals = {
        targetWeight: 0,
        targetBf: 0,
        targetCalories: NUTRITION_TARGETS[user.name]?.calories ?? DEFAULT_NUTRITION.calories,
        targetProtein: NUTRITION_TARGETS[user.name]?.protein ?? DEFAULT_NUTRITION.protein,
        targetEnergy: 4.0,
      };

      if (data && data.length > 0) {
        const fetchedGoals: Partial<UserGoals> = {};
        
        data.forEach(goal => {
          if (goal.title === 'Peso') fetchedGoals.targetWeight = goal.target_value;
          if (goal.title === 'Gordura Corporal') fetchedGoals.targetBf = goal.target_value;
          if (goal.title === 'Calorias Diárias') fetchedGoals.targetCalories = goal.target_value;
          if (goal.title === 'Proteína Diária') fetchedGoals.targetProtein = goal.target_value;
          if (goal.title === 'Energia Diária') fetchedGoals.targetEnergy = goal.target_value;
        });

        setGoals({ ...defaultGoals, ...fetchedGoals });
      } else {
        // If no goals in DB, seed them
        const coreGoals = [
          { user_name: user.name, title: 'Peso', category: 'Corpo', target_value: 0, unit: 'kg', start_value: 0, current_value: 0 },
          { user_name: user.name, title: 'Gordura Corporal', category: 'Corpo', target_value: 0, unit: '%', start_value: 0, current_value: 0 },
          { user_name: user.name, title: 'Calorias Diárias', category: 'Corpo', target_value: defaultGoals.targetCalories, unit: 'kcal', start_value: 0, current_value: 0 },
          { user_name: user.name, title: 'Proteína Diária', category: 'Corpo', target_value: defaultGoals.targetProtein, unit: 'g', start_value: 0, current_value: 0 },
          { user_name: user.name, title: 'Energia Diária', category: 'Alma', target_value: defaultGoals.targetEnergy, unit: '/ 5', start_value: 0, current_value: 0 },
        ];
        
        await supabase.from('goals').insert(coreGoals);
        setGoals(defaultGoals);
      }
    } catch (e) {
      console.error("Failed to fetch user goals from Supabase", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const updateGoals = async (newGoals: Partial<UserGoals>) => {
    if (!user || !goals) return;
    const updated = { ...goals, ...newGoals };
    setGoals(updated);

    // Update in Supabase
    const updates = [];
    if (newGoals.targetWeight !== undefined) updates.push({ title: 'Peso', target_value: newGoals.targetWeight });
    if (newGoals.targetBf !== undefined) updates.push({ title: 'Gordura Corporal', target_value: newGoals.targetBf });
    if (newGoals.targetCalories !== undefined) updates.push({ title: 'Calorias Diárias', target_value: newGoals.targetCalories });
    if (newGoals.targetProtein !== undefined) updates.push({ title: 'Proteína Diária', target_value: newGoals.targetProtein });
    if (newGoals.targetEnergy !== undefined) updates.push({ title: 'Energia Diária', target_value: newGoals.targetEnergy });

    for (const update of updates) {
      await supabase
        .from('goals')
        .update({ target_value: update.target_value })
        .eq('user_name', user.name)
        .eq('title', update.title);
    }
  };

  return { goals, updateGoals, loading };
}
