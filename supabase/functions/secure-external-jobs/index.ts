import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExternalJob {
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

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { category } = await req.json();
    
    // Securely fetch external jobs using server-side API keys
    const jobs = await fetchExternalJobsSecurely(category);
    
    return new Response(
      JSON.stringify({ jobs }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in secure-external-jobs function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

async function fetchExternalJobsSecurely(category?: string): Promise<ExternalJob[]> {
  const jobs: ExternalJob[] = [];
  
  try {
    // Use server-side environment variables for API keys (secure)
    const brigadKey = Deno.env.get('BRIGAD_API_KEY');
    const qapaKey = Deno.env.get('QAPA_API_KEY');
    const cornerJobKey = Deno.env.get('CORNERJOB_API_KEY');
    
    // Example: Fetch from Brigad API if key is available
    if (brigadKey) {
      try {
        const response = await fetch(`https://api.brigad.co/v1/jobs?category=${category || ''}`, {
          headers: {
            'Authorization': `Bearer ${brigadKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const brigadJobs = data.jobs?.map((job: any) => ({
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
          
          jobs.push(...brigadJobs);
        }
      } catch (error) {
        console.error('Error fetching Brigad jobs:', error);
      }
    }
    
    // Similar implementations for other platforms...
    // Add Qapa and Corner Job integrations here using their respective API keys
    
  } catch (error) {
    console.error('Error in fetchExternalJobsSecurely:', error);
  }
  
  return jobs;
}

serve(handler);