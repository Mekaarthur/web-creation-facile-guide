import { supabase } from "@/integrations/supabase/client";

export interface ExternalJob {
  id: string;
  title: string;
  description: string;
  category: string;
  hourlyRate: number;
  location: string;
  provider: string;
  platform: string;
  externalUrl: string;
  availability: string[];
}

/**
 * Securely fetch external jobs through our secure edge function
 * This replaces the vulnerable client-side API integration
 */
export const fetchExternalJobsSecurely = async (category?: string): Promise<ExternalJob[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('secure-external-jobs', {
      body: { category }
    });

    if (error) {
      console.error('Error fetching external jobs:', error);
      return [];
    }

    return data?.jobs || [];
  } catch (error) {
    console.error('Error in fetchExternalJobsSecurely:', error);
    return [];
  }
};

/**
 * Map internal categories to external platform categories
 */
export const mapCategoryToExternal = (internalCategory: string): string => {
  const categoryMap: { [key: string]: string } = {
    'Enfants & Parentalité': 'childcare',
    'Logistique quotidienne': 'housekeeping',
    'Conciergerie & Administration': 'admin',
    'Assistance Voyageurs': 'travel',
    'Premium 7j/7': 'premium',
    'Services pour animaux': 'petcare',
    'Assistance seniors': 'eldercare',
    'Assistance Entreprise': 'business'
  };
  
  return categoryMap[internalCategory] || 'general';
};

/**
 * Secure hook for using external jobs
 * This replaces the vulnerable useExternalJobs hook
 */
export const useSecureExternalJobs = () => {
  const fetchJobsByCategory = async (category: string) => {
    const mappedCategory = mapCategoryToExternal(category);
    return await fetchExternalJobsSecurely(mappedCategory);
  };
  
  return { fetchJobsByCategory };
};