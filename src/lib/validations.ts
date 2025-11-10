import { z } from "zod";

// Schémas de validation réutilisables pour les champs communs
export const phoneSchema = z
  .string()
  .regex(/^(?:\+33|0)[1-9](?:[0-9]{8})$/, "Format de téléphone invalide");

export const emailSchema = z.string().trim().min(1, "L'email est requis").max(255, "Email trop long").email("Email invalide");

export const nameSchema = z
  .string()
  .min(2, "Le nom doit contenir au moins 2 caractères")
  .max(50, "Le nom ne peut pas dépasser 50 caractères");

// Schéma de validation robuste pour les mots de passe
export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .max(128, "Le mot de passe ne peut pas dépasser 128 caractères")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
  .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)");

// Schéma pour le checkout invité
export const guestCheckoutSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema.optional(),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  postalCode: z.string().regex(/^[0-9]{5}$/, "Code postal invalide"),
  city: z.string().min(2, "Ville requise"),
});

export const authSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema.optional(),
  phone: phoneSchema.optional(),
});

// Schéma spécifique pour l'inscription prestataire (nom obligatoire)
export const providerSignupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  phone: phoneSchema.optional(),
});

export const profileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  avatar_url: z.string().url().optional(),
});

export const bookingSchema = z.object({
  serviceId: z.string().min(1, "Service requis"),
  date: z.date({ required_error: "Date requise" }),
  startTime: z.string().min(1, "Heure de début requise"),
  endTime: z.string().min(1, "Heure de fin requise"),
  location: z.string().min(3, "Adresse requise"),
  description: z.string().min(10, "Description requise (minimum 10 caractères)"),
  urgency: z.enum(["low", "medium", "high"]).optional(),
});

export const providerApplicationSchema = z.object({
  businessName: z.string().min(2, "Nom de l'entreprise requis"),
  description: z.string().min(50, "Description requise (minimum 50 caractères)"),
  hourlyRate: z.number().min(10, "Tarif minimum 10€/h").max(200, "Tarif maximum 200€/h"),
  location: z.string().min(3, "Localisation requise"),
  services: z.array(z.string()).min(1, "Au moins un service requis"),
  siretNumber: z.string().regex(/^\d{14}$/, "Numéro SIRET invalide").optional(),
  experience: z.string().min(20, "Expérience requise (minimum 20 caractères)"),
});

// Schéma pour le formulaire de candidature prestataire complet
export const providerCandidateSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  city: z.string().min(2, "Ville requise"),
  postal_code: z.string().regex(/^[0-9]{5}$/, "Code postal invalide (5 chiffres)"),
  services: z.array(z.string()).min(1, "Veuillez sélectionner au moins un service"),
  coverage_zone: z.string().min(3, "Zone géographique requise"),
  availability: z.string().min(1, "Disponibilités requises"),
  motivation: z.string().optional(),
  // Documents obligatoires
  identity_document: z.any().refine((file) => file instanceof File || file === null, "Pièce d'identité requise"),
  criminal_record: z.any().refine((file) => file instanceof File || file === null, "Casier judiciaire requis"),
  criminal_record_date: z.date().optional(),
  siren_number: z.string().regex(/^\d{9}$/, "Numéro SIREN invalide (9 chiffres)"),
  rib_iban: z.any().refine((file) => file instanceof File || file === null, "RIB/IBAN requis"),
  cv_file: z.any().refine((file) => file instanceof File || file === null, "CV requis"),
  // Documents optionnels
  certifications: z.any().optional(),
});

export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: z.string().min(3, "Sujet requis"),
  message: z.string().min(10, "Message requis (minimum 10 caractères)"),
});

export const fileUploadSchema = z.object({
  file: z.any().refine((file) => file instanceof File, "Fichier requis"),
  documentType: z.enum(["identity", "insurance", "certification", "other"]),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB par défaut
  allowedTypes: z.array(z.string()).default(["image/*", "application/pdf"]),
});

export type GuestCheckoutForm = z.infer<typeof guestCheckoutSchema>;
export type AuthForm = z.infer<typeof authSchema>;
export type ProviderSignupForm = z.infer<typeof providerSignupSchema>;
export type ProfileForm = z.infer<typeof profileSchema>;
export type BookingForm = z.infer<typeof bookingSchema>;
export type ProviderApplicationForm = z.infer<typeof providerApplicationSchema>;
export type ProviderCandidateForm = z.infer<typeof providerCandidateSchema>;
export type ContactForm = z.infer<typeof contactSchema>;
export type FileUploadForm = z.infer<typeof fileUploadSchema>;