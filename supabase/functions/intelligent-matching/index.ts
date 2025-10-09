import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchingRequest {
  clientRequestId: string;
  serviceType: string;
  location: string;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  budget?: number;
  preferredDate?: string;
  requireCertifications?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      clientRequestId, 
      serviceType, 
      location, 
      urgency, 
      budget,
      preferredDate,
      requireCertifications 
    }: MatchingRequest = await req.json();

    console.log('🎯 Starting intelligent matching for request:', clientRequestId);

    // 1. Récupérer les prestataires potentiels via la fonction existante
    const { data: potentialProviders, error: providersError } = await supabase
      .rpc('get_matching_providers', {
        p_service_type: serviceType,
        p_location: location,
        p_limit: 20,
        p_date_time: preferredDate || null
      });

    if (providersError) {
      console.error('Error fetching providers:', providersError);
      throw providersError;
    }

    if (!potentialProviders || potentialProviders.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Aucun prestataire disponible trouvé',
          providers: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${potentialProviders.length} potential providers`);

    // 2. Scoring avancé avec l'IA Lovable
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    let aiScores: Record<string, number> = {};
    
    if (LOVABLE_API_KEY) {
      try {
        const aiPrompt = `Analyse ces prestataires pour une mission ${serviceType} à ${location}.
Urgence: ${urgency}. Budget: ${budget || 'Non spécifié'}€.

Prestataires:
${potentialProviders.map((p: any, idx: number) => 
  `${idx + 1}. ${p.business_name} - Rating: ${p.rating}/5, Distance: ${p.match_score}, Missions: ${p.services_offered?.length || 0}`
).join('\n')}

Retourne un score de 0 à 100 pour chaque prestataire basé sur:
- Compatibilité avec le service
- Rating et expérience
- Disponibilité
- Distance/localisation
- Urgence de la demande`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { 
                role: 'system', 
                content: 'Tu es un expert en matching de prestataires. Réponds uniquement avec des scores numériques de 0 à 100 pour chaque prestataire, un par ligne.' 
              },
              { role: 'user', content: aiPrompt }
            ],
            temperature: 0.3,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiText = aiData.choices?.[0]?.message?.content || '';
          console.log('🤖 AI Response:', aiText);
          
          // Parser les scores de l'IA
          const lines = aiText.split('\n');
          lines.forEach((line: string, idx: number) => {
            const scoreMatch = line.match(/(\d+)/);
            if (scoreMatch && potentialProviders[idx]) {
              aiScores[potentialProviders[idx].provider_id] = parseInt(scoreMatch[1]);
            }
          });
        }
      } catch (aiError) {
        console.warn('⚠️ AI scoring failed, using traditional scoring:', aiError);
      }
    }

    // 3. Calcul du score final combiné
    const scoredProviders = potentialProviders.map((provider: any) => {
      const baseScore = provider.match_score || 0;
      const ratingScore = (provider.rating || 0) * 15;
      const aiScore = aiScores[provider.provider_id] || 50;
      const urgencyMultiplier = urgency === 'urgent' ? 1.3 : urgency === 'high' ? 1.15 : 1.0;
      
      const finalScore = Math.round(
        ((baseScore * 0.3) + (ratingScore * 0.3) + (aiScore * 0.4)) * urgencyMultiplier
      );

      return {
        ...provider,
        ai_score: aiScore,
        final_score: finalScore,
        reasoning: `Base: ${baseScore}, Rating: ${ratingScore}, AI: ${aiScore}`
      };
    });

    // 4. Trier par score final
    scoredProviders.sort((a: any, b: any) => b.final_score - a.final_score);

    // 5. Sélectionner les 3 meilleurs pour attribution en cascade
    const topProviders = scoredProviders.slice(0, 3);

    console.log('✅ Top 3 providers selected:', topProviders.map((p: any) => 
      `${p.business_name} (Score: ${p.final_score})`
    ));

    // 6. Créer les missions d'attribution pour chaque prestataire
    const missions = await Promise.all(
      topProviders.map(async (provider: any, index: number) => {
        const { data: mission, error: missionError } = await supabase
          .from('missions')
          .insert({
            client_request_id: clientRequestId,
            assigned_provider_id: provider.provider_id,
            status: index === 0 ? 'pending' : 'backup',
            priority: index === 0 ? 1 : index + 1,
            match_score: provider.final_score,
            assigned_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min timeout
          })
          .select()
          .single();

        if (missionError) {
          console.error('Error creating mission:', missionError);
          return null;
        }

        // Notification au prestataire principal uniquement
        if (index === 0) {
          await supabase.from('provider_notifications').insert({
            provider_id: provider.provider_id,
            title: '🎯 Nouvelle mission disponible',
            message: `Mission ${serviceType} à ${location}. Urgence: ${urgency}. Répondez dans les 30 minutes.`,
            type: 'new_mission',
            created_at: new Date().toISOString(),
          });
        }

        return mission;
      })
    );

    const validMissions = missions.filter(m => m !== null);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${validMissions.length} prestataires assignés`,
        primaryProvider: topProviders[0],
        backupProviders: topProviders.slice(1),
        allScores: scoredProviders,
        missions: validMissions
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ Intelligent matching error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Erreur lors du matching intelligent'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});