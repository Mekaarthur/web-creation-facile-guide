const WORK_START = 8; // 8h
const WORK_END = 20; // 20h
export const MIN_DELAY_HOURS = 5;
export const URGENT_THRESHOLD_HOURS = 10;

// R-SEL-17: services nuit/urgence exemptés de la règle générale (créneaux hors 8h-20h)
// Miroir de apps/public/src/utils/workingHours.ts (Deno ne peut pas importer le code frontend)
export const NIGHT_SERVICE_SLUGS = ["urgences-24-7", "gardes-de-nuit-urgence", "courses-urgentes-nuit"];

/**
 * R-SEL-06 final: source de vérité unique pour le calcul des heures ouvrées Bikawo (7j/7, 8h-20h).
 */
export function calculateWorkingHours(fromDate: Date, toDate: Date): number {
  let workingHours = 0;
  const current = new Date(fromDate);

  while (current < toDate) {
    const hour = current.getHours();
    const nextHour = new Date(current);
    nextHour.setHours(hour + 1, 0, 0, 0);

    if (nextHour > toDate) {
      const minutes = (toDate.getTime() - current.getTime()) / 60000;
      if (hour >= WORK_START && hour < WORK_END) {
        workingHours += minutes / 60;
      }
      break;
    }

    if (hour >= WORK_START && hour < WORK_END) {
      workingHours += 1;
    }

    current.setHours(hour + 1, 0, 0, 0);
  }

  return workingHours;
}
