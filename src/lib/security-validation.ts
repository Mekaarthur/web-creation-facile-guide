import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS - SÉCURITÉ
// ============================================

// Email avec blocage domaines jetables
const disposableEmailDomains = [
  'tempmail.com', 'guerrillamail.com', '10minutemail.com',
  'throwaway.email', 'maildrop.cc', 'mailinator.com',
  'trashmail.com', 'temp-mail.org', 'getnada.com'
];

export const emailSchema = z
  .string()
  .trim()
  .min(1, "L'email est requis")
  .max(255, "L'email est trop long")
  .email("Format d'email invalide")
  .refine(
    (email) => {
      const domain = email.split('@')[1]?.toLowerCase();
      return !disposableEmailDomains.includes(domain);
    },
    { message: "Les adresses email jetables ne sont pas autorisées" }
  );

// Téléphone international
export const phoneSchema = z
  .string()
  .trim()
  .min(10, "Numéro de téléphone trop court")
  .max(20, "Numéro de téléphone trop long")
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,}[)]?[-\s\.]?[0-9]{1,}[-\s\.]?[0-9]{1,}$/, 
    "Format de téléphone invalide");

// Mot de passe fort
export const passwordSchema = z
  .string()
  .min(8, "Minimum 8 caractères")
  .max(128, "Maximum 128 caractères")
  .regex(/[a-z]/, "Doit contenir une minuscule")
  .regex(/[A-Z]/, "Doit contenir une majuscule")
  .regex(/[0-9]/, "Doit contenir un chiffre")
  .regex(/[^A-Za-z0-9]/, "Doit contenir un caractère spécial");

// Nom / Prénom
export const nameSchema = z
  .string()
  .trim()
  .min(2, "Minimum 2 caractères")
  .max(100, "Maximum 100 caractères")
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Caractères invalides détectés");

// Adresse
export const addressSchema = z
  .string()
  .trim()
  .min(5, "Adresse trop courte")
  .max(500, "Adresse trop longue");

// Code postal français
export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{5}$/, "Code postal invalide (5 chiffres requis)");

// Message / Description
export const messageSchema = z
  .string()
  .trim()
  .min(10, "Message trop court (minimum 10 caractères)")
  .max(5000, "Message trop long (maximum 5000 caractères)");

// URL sécurisée
export const urlSchema = z
  .string()
  .trim()
  .url("URL invalide")
  .refine(
    (url) => url.startsWith('https://') || url.startsWith('http://'),
    { message: "URL doit commencer par http:// ou https://" }
  );

// Montant monétaire
export const amountSchema = z
  .number()
  .min(0, "Le montant ne peut pas être négatif")
  .max(100000, "Montant trop élevé");

// Date future
export const futureDateSchema = z
  .date()
  .refine((date) => date > new Date(), {
    message: "La date doit être dans le futur"
  });

// ============================================
// SCHEMAS COMPOSÉS
// ============================================

// Formulaire de contact
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  message: messageSchema,
});

// Inscription client
export const signupSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
  address: addressSchema.optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter les conditions d'utilisation"
  }),
});

// Réservation
export const bookingSchema = z.object({
  serviceId: z.string().uuid("ID service invalide"),
  date: futureDateSchema,
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format heure invalide (HH:MM)"),
  duration: z.number().min(1, "Durée minimum 1 heure").max(24, "Durée maximum 24 heures"),
  address: addressSchema,
  notes: messageSchema.optional(),
});

// Profil prestataire
export const providerProfileSchema = z.object({
  businessName: nameSchema,
  description: messageSchema,
  location: addressSchema,
  postalCode: postalCodeSchema,
  hourlyRate: amountSchema,
  services: z.array(z.string().uuid()).min(1, "Sélectionnez au moins un service"),
});

// ============================================
// SANITIZATION HELPERS
// ============================================

/**
 * Nettoie une chaîne pour éviter les injections XSS
 */
export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Retire les balises HTML
    .replace(/javascript:/gi, '') // Bloque les scripts
    .replace(/on\w+=/gi, '') // Bloque les event handlers
    .trim();
};

/**
 * Encode pour URL de manière sécurisée
 */
export const safeEncodeURIComponent = (input: string): string => {
  return encodeURIComponent(sanitizeString(input));
};

/**
 * Valide et nettoie un objet JSON
 */
export const sanitizeJSON = <T>(data: T): T => {
  const jsonString = JSON.stringify(data);
  if (jsonString.includes('<script') || jsonString.includes('javascript:')) {
    throw new Error('Données potentiellement dangereuses détectées');
  }
  return JSON.parse(jsonString);
};

// ============================================
// RATE LIMITING HELPERS
// ============================================

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Vérifie le rate limit pour une action donnée
 */
export const checkRateLimit = (
  identifier: string,
  action: string,
  config: RateLimitConfig = { maxAttempts: 5, windowMs: 60000 }
): { allowed: boolean; retryAfter?: number } => {
  const key = `${identifier}:${action}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Nettoyer les anciennes entrées
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
  }

  if (!record || record.resetTime < now) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true };
  }

  if (record.count >= config.maxAttempts) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((record.resetTime - now) / 1000) 
    };
  }

  record.count++;
  return { allowed: true };
};

/**
 * Reset le rate limit pour un identifiant
 */
export const resetRateLimit = (identifier: string, action: string): void => {
  const key = `${identifier}:${action}`;
  rateLimitStore.delete(key);
};

// ============================================
// VALIDATION ERROR FORMATTER
// ============================================

export const formatValidationErrors = (errors: z.ZodError): Record<string, string> => {
  const formatted: Record<string, string> = {};
  errors.errors.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });
  return formatted;
};

export type ContactFormData = z.infer<typeof contactFormSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type BookingData = z.infer<typeof bookingSchema>;
export type ProviderProfileData = z.infer<typeof providerProfileSchema>;
