// Validation schemas avec Zod pour edge functions
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================
// SCHEMAS DE VALIDATION
// ============================================

// UUID valide
export const uuidSchema = z.string().uuid({ message: "UUID invalide" });

// Email valide
export const emailSchema = z.string().email({ message: "Email invalide" }).max(255);

// Texte avec limite de caractères
export const textSchema = (max: number = 1000) => 
  z.string().min(1, "Le champ ne peut pas être vide").max(max, `Maximum ${max} caractères`);

// Montant financier
export const amountSchema = z.number()
  .positive("Le montant doit être positif")
  .max(1000000, "Montant trop élevé");

// Date ISO valide
export const dateSchema = z.string().datetime({ message: "Date invalide" });

// ============================================
// VALIDATION ADMIN CARTS
// ============================================

export const validateCartActionSchema = z.object({
  action: z.enum(['validate', 'expire', 'expire-old'], { 
    errorMap: () => ({ message: "Action invalide" })
  }),
  cartId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
  reason: z.string().max(500).optional()
}).refine(
  (data) => {
    if (data.action !== 'expire-old' && !data.cartId) {
      return false;
    }
    return true;
  },
  { message: "cartId requis pour cette action" }
);

// ============================================
// VALIDATION BULK ASSIGN
// ============================================

export const validateBulkAssignSchema = z.object({
  action: z.literal('bulk_assign'),
  missionIds: z.array(z.string().uuid()).min(1, "Au moins 1 mission requise").max(50, "Maximum 50 missions à la fois")
});

// ============================================
// VALIDATION PAIEMENTS
// ============================================

export const validatePaymentActionSchema = z.object({
  action: z.enum(['retry', 'confirm'], { 
    errorMap: () => ({ message: "Action invalide" })
  }),
  paymentId: z.string().uuid(),
  notes: z.string().max(1000).optional()
});

// ============================================
// VALIDATION GDPR EXPORT
// ============================================

export const validateGDPRExportSchema = z.object({
  entity_type: z.enum(['users', 'bookings', 'payments', 'providers'], {
    errorMap: () => ({ message: "Type d'entité invalide" })
  }),
  entity_ids: z.array(z.string().uuid()).min(1, "Au moins 1 ID requis").max(1000, "Maximum 1000 IDs"),
  export_format: z.enum(['json', 'csv', 'excel']).default('json'),
  reason: z.string().max(500).optional()
});

// ============================================
// VALIDATION BULK DELETE
// ============================================

export const validateBulkDeleteSchema = z.object({
  entity_type: z.string().min(1, "Type d'entité requis").max(50),
  entity_ids: z.array(z.string().uuid()).min(1, "Au moins 1 ID requis").max(100, "Maximum 100 suppressions à la fois"),
  reason: z.string().min(10, "Raison trop courte (min 10 caractères)").max(500),
  is_soft_delete: z.boolean().default(false)
});

// ============================================
// HELPERS DE VALIDATION
// ============================================

/**
 * Valide et sanitize un body de requête
 */
export async function validateRequest<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string; details?: any }> {
  try {
    const body = await req.json();
    const validatedData = schema.parse(body);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Erreur de validation des données",
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    return {
      success: false,
      error: "Format de requête invalide"
    };
  }
}

/**
 * Sanitize HTML pour éviter XSS
 */
export function sanitizeHtml(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize SQL pour éviter injections
 */
export function sanitizeSql(text: string): string {
  return text
    .replace(/['";]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

/**
 * Valider et extraire IP de la requête
 */
export function extractClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  return realIp || 'unknown';
}

/**
 * Créer une réponse d'erreur standardisée
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: any
): Response {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  return new Response(
    JSON.stringify({
      error: message,
      details,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}
