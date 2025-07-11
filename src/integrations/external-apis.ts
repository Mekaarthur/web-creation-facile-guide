// Configuration pour l'intégration des APIs de plateformes d'intérim
// Note: Pour des intégrations réelles, vous devrez obtenir les clés API auprès de chaque plateforme

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

// Configuration des APIs externes
const API_CONFIGS = {
  // Exemple: Brigad (plateforme d'intérim)
  brigad: {
    baseUrl: 'https://api.brigad.co/v1',
    apiKey: process.env.VITE_BRIGAD_API_KEY || '',
    endpoints: {
      jobs: '/jobs',
      providers: '/providers'
    }
  },
  
  // Exemple: Qapa (plateforme d'emploi)
  qapa: {
    baseUrl: 'https://www.qapa.fr/api',
    apiKey: process.env.VITE_QAPA_API_KEY || '',
    endpoints: {
      jobs: '/jobs',
      candidates: '/candidates'
    }
  },
  
  // Exemple: Corner Job (app d'emploi)
  cornerJob: {
    baseUrl: 'https://api.cornerjob.com/v1',
    apiKey: process.env.VITE_CORNERJOB_API_KEY || '',
    endpoints: {
      jobs: '/jobs',
      profiles: '/profiles'
    }
  }
};

// Fonction pour récupérer les offres d'emploi externes
export const fetchExternalJobs = async (category?: string): Promise<ExternalJob[]> => {
  const jobs: ExternalJob[] = [];
  
  try {
    // Intégration Brigad (exemple)
    if (API_CONFIGS.brigad.apiKey) {
      const brigadJobs = await fetchBrigadJobs(category);
      jobs.push(...brigadJobs);
    }
    
    // Intégration Qapa (exemple)
    if (API_CONFIGS.qapa.apiKey) {
      const qapaJobs = await fetchQapaJobs(category);
      jobs.push(...qapaJobs);
    }
    
    // Intégration Corner Job (exemple)
    if (API_CONFIGS.cornerJob.apiKey) {
      const cornerJobs = await fetchCornerJobs(category);
      jobs.push(...cornerJobs);
    }
    
  } catch (error) {
    console.error('Erreur lors de la récupération des offres externes:', error);
  }
  
  return jobs;
};

// Fonction spécifique pour Brigad
const fetchBrigadJobs = async (category?: string): Promise<ExternalJob[]> => {
  try {
    const response = await fetch(`${API_CONFIGS.brigad.baseUrl}${API_CONFIGS.brigad.endpoints.jobs}?category=${category || ''}`, {
      headers: {
        'Authorization': `Bearer ${API_CONFIGS.brigad.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Erreur API Brigad');
    
    const data = await response.json();
    
    return data.jobs?.map((job: any) => ({
      id: `brigad_${job.id}`,
      title: job.title,
      description: job.description,
      category: job.category,
      hourlyRate: job.hourly_rate,
      location: job.location,
      provider: job.company_name,
      platform: 'Brigad',
      externalUrl: job.external_url,
      availability: job.time_slots || []
    })) || [];
    
  } catch (error) {
    console.error('Erreur Brigad API:', error);
    return [];
  }
};

// Fonction spécifique pour Qapa
const fetchQapaJobs = async (category?: string): Promise<ExternalJob[]> => {
  try {
    const response = await fetch(`${API_CONFIGS.qapa.baseUrl}${API_CONFIGS.qapa.endpoints.jobs}?sector=${category || ''}`, {
      headers: {
        'Authorization': `Bearer ${API_CONFIGS.qapa.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Erreur API Qapa');
    
    const data = await response.json();
    
    return data.results?.map((job: any) => ({
      id: `qapa_${job.id}`,
      title: job.job_title,
      description: job.job_description,
      category: job.sector,
      hourlyRate: job.salary_min,
      location: job.city,
      provider: job.company_name,
      platform: 'Qapa',
      externalUrl: job.apply_url,
      availability: []
    })) || [];
    
  } catch (error) {
    console.error('Erreur Qapa API:', error);
    return [];
  }
};

// Fonction spécifique pour Corner Job
const fetchCornerJobs = async (category?: string): Promise<ExternalJob[]> => {
  try {
    const response = await fetch(`${API_CONFIGS.cornerJob.baseUrl}${API_CONFIGS.cornerJob.endpoints.jobs}?category=${category || ''}`, {
      headers: {
        'Authorization': `Bearer ${API_CONFIGS.cornerJob.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Erreur API Corner Job');
    
    const data = await response.json();
    
    return data.jobs?.map((job: any) => ({
      id: `corner_${job.id}`,
      title: job.title,
      description: job.description,
      category: job.category,
      hourlyRate: job.hourly_pay,
      location: job.location,
      provider: job.employer,
      platform: 'Corner Job',
      externalUrl: job.url,
      availability: job.schedules || []
    })) || [];
    
  } catch (error) {
    console.error('Erreur Corner Job API:', error);
    return [];
  }
};

// Fonction pour mapper les catégories internes vers les catégories des APIs externes
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

// Hook pour utiliser les offres externes
export const useExternalJobs = () => {
  const fetchJobsByCategory = async (category: string) => {
    const mappedCategory = mapCategoryToExternal(category);
    return await fetchExternalJobs(mappedCategory);
  };
  
  return { fetchJobsByCategory };
};