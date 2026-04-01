export const CYCLE_START_DATE = new Date(2026, 3, 2); // 02 de Abril de 2026 (Quinta-feira)
export const CYCLE_END_DATE = new Date(2026, 5, 28); // 28 de Junho de 2026 (Domingo)

export function getCycleInfo() {
  const totalDays = Math.floor((CYCLE_END_DATE.getTime() - CYCLE_START_DATE.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const today = new Date();
  const diffTime = today.getTime() - CYCLE_START_DATE.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  const currentDay = diffDays < 1 ? 0 : Math.min(diffDays, totalDays);
  
  // Primeira semana curta: Quinta (1) a Domingo (4)
  let currentWeek = 1;
  if (currentDay > 4) {
    currentWeek = Math.ceil((currentDay - 4) / 7) + 1;
  } else if (currentDay === 0) {
    currentWeek = 1;
  }
  
  const cycleProgress = Math.round((currentDay / totalDays) * 100);

  return {
    startDate: CYCLE_START_DATE,
    endDate: CYCLE_END_DATE,
    totalDays: totalDays,
    currentDay,
    currentWeek,
    cycleProgress
  };
}
