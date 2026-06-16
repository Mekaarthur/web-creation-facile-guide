const WORK_START = 8; // 8h
const WORK_END = 20; // 20h
const MIN_DELAY_HOURS = 5;
const URGENT_THRESHOLD_HOURS = 10;
const MAX_ADVANCE_DAYS = 90;
const SERVICE_HOURS_START = 7;
const SERVICE_HOURS_END = 21;

// R-SEL-17: services nuit/urgence exemptés des règles génériques (créneaux hors 8h-20h)
export const NIGHT_SERVICE_SLUGS = ["urgences-24-7", "gardes-de-nuit-urgence", "courses-urgentes-nuit"];

/**
 * Source de vérité unique pour le calcul des heures ouvrées Bikawo (7j/7, 8h-20h).
 * Ne jamais dupliquer cette logique ailleurs (R-SEL-06 final).
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

export interface BookingValidationResult {
  isValid: boolean;
  isUrgent: boolean;
  errorMessage?: string;
}

export function getBookingValidation(
  serviceDate: Date,
  serviceStartTime: string
): BookingValidationResult {
  const [hours, minutes] = serviceStartTime.split(':').map(Number);
  const serviceDateTime = new Date(serviceDate);
  serviceDateTime.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const workingHoursUntilService = calculateWorkingHours(now, serviceDateTime);

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);
  if (serviceDateTime > maxDate) {
    return {
      isValid: false,
      isUrgent: false,
      errorMessage: "Réservation possible jusqu'à 90 jours à l'avance",
    };
  }

  if (hours < SERVICE_HOURS_START || hours >= SERVICE_HOURS_END) {
    return {
      isValid: false,
      isUrgent: false,
      errorMessage: "Les prestations sont disponibles de 7h à 21h",
    };
  }

  if (workingHoursUntilService < MIN_DELAY_HOURS) {
    return {
      isValid: false,
      isUrgent: false,
      errorMessage: "Ce créneau n'est plus disponible. Veuillez choisir un horaire ultérieur.",
    };
  }

  return {
    isValid: true,
    isUrgent: workingHoursUntilService < URGENT_THRESHOLD_HOURS,
    errorMessage: undefined,
  };
}
