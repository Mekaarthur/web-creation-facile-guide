import { z } from "zod";

// Schémas de validation réutilisables
export const phoneSchema = z.string()
  .regex(/^(?:\+33|0)[1-9](?:[0-9]{8})$/, "Numéro de téléphone français invalide");

export const emailSchema = z.string()
  .email("Format d'email invalide")
  .min(1, "L'email est requis");

export const nameSchema = z.string()
  .min(2, "Le nom doit contenir au moins 2 caractères")
  .max(50, "Le nom ne peut pas dépasser 50 caractères");

export const passwordSchema = z.string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre");

// Schémas pour les formulaires principaux
export const authSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
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

export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: z.string().min(3, "Sujet requis"),
  message: z.string().min(10, "Message requis (minimum 10 caractères)"),
});

// Validation côté serveur pour les uploads
export const fileUploadSchema = z.object({
  file: z.any().refine((file) => file instanceof File, "Fichier requis"),
  documentType: z.enum(["identity", "insurance", "certification", "other"]),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB par défaut
  allowedTypes: z.array(z.string()).default(["image/*", "application/pdf"]),
});

export type AuthForm = z.infer<typeof authSchema>;
export type ProfileForm = z.infer<typeof profileSchema>;
export type BookingForm = z.infer<typeof bookingSchema>;
export type ProviderApplicationForm = z.infer<typeof providerApplicationSchema>;
export type ContactForm = z.infer<typeof contactSchema>;
export type FileUploadForm = z.infer<typeof fileUploadSchema>;