import { useState } from 'react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { formatValidationErrors, checkRateLimit } from '@/lib/security-validation';

interface UseSecureFormOptions<T extends z.ZodType> {
  schema: T;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  rateLimitKey?: string;
  rateLimitAction?: string;
}

/**
 * Hook personnalisé pour gérer les formulaires de manière sécurisée
 * - Validation avec Zod
 * - Rate limiting
 * - Gestion d'erreurs
 * - Protection contre les doubles soumissions
 */
export function useSecureForm<T extends z.ZodType>({
  schema,
  onSubmit,
  rateLimitKey,
  rateLimitAction = 'form_submit'
}: UseSecureFormOptions<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleSubmit = async (data: unknown) => {
    // Reset errors
    setErrors({});

    // Rate limiting
    if (rateLimitKey) {
      const rateLimit = checkRateLimit(rateLimitKey, rateLimitAction);
      if (!rateLimit.allowed) {
        toast({
          title: "Trop de tentatives",
          description: `Veuillez réessayer dans ${rateLimit.retryAfter} secondes`,
          variant: "destructive",
        });
        return;
      }
    }

    // Protection double soumission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Validation
      const validatedData = schema.parse(data);

      // Soumission
      await onSubmit(validatedData);

      // Ne pas afficher de toast générique, laisser onSubmit gérer les messages
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Erreurs de validation
        const formattedErrors = formatValidationErrors(error);
        setErrors(formattedErrors);
        
        toast({
          title: "Erreur de validation",
          description: "Veuillez corriger les erreurs dans le formulaire",
          variant: "destructive",
        });
      } else {
        // Autres erreurs
        console.error('Form submission error:', error);
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Une erreur est survenue",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    errors,
    setErrors,
  };
}
