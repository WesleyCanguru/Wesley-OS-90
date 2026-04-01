export const CYCLE_START_DATE = new Date(2026, 3, 1); // 01 de Abril de 2026
export const CYCLE_TOTAL_DAYS = 84; // 12 semanas * 7 dias

export function getCycleInfo() {
  const endDate = new Date(CYCLE_START_DATE.getTime() + (CYCLE_TOTAL_DAYS - 1) * 24 * 60 * 60 * 1000);
  
  const today = new Date();
  const diffTime = today.getTime() - CYCLE_START_DATE.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  const currentDay = diffDays < 1 ? 0 : Math.min(diffDays, CYCLE_TOTAL_DAYS);
  
  // Primeira semana curta: Quarta (1) a Domingo (5)
  let currentWeek = 1;
  if (currentDay > 5) {
    currentWeek = Math.ceil((currentDay - 5) / 7) + 1;
  } else if (currentDay === 0) {
    currentWeek = 1;
  }
  
  const cycleProgress = Math.round((currentDay / CYCLE_TOTAL_DAYS) * 100);

  return {
    startDate: CYCLE_START_DATE,
    endDate,
    totalDays: CYCLE_TOTAL_DAYS,
    currentDay,
    currentWeek,
    cycleProgress
  };
}
