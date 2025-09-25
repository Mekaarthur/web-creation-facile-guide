import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  conversationId?: string;
  userEmail?: string;
  userPhone?: string;
  userType?: 'client' | 'provider' | 'anonymous';
}

interface FAQResult {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  priority: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId, userEmail, userPhone, userType = 'anonymous' }: ChatRequest = await req.json();

    if (!message?.trim()) {
      throw new Error('Message is required');
    }

    // Initialiser Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rechercher dans la FAQ
    const faqResults = await searchFAQ(supabase, message);
    
    let response: string;
    let needsHumanEscalation = false;
    let shouldCollectContact = false;

    // Si on trouve des résultats pertinents dans la FAQ
    if (faqResults.length > 0) {
      response = await generateResponseWithFAQ(message, faqResults);
    } else {
      // Utiliser OpenAI pour une réponse plus intelligente
      const aiResponse = await queryOpenAI(message);
      response = aiResponse.response;
      needsHumanEscalation = aiResponse.needsEscalation;
      shouldCollectContact = aiResponse.shouldCollectContact;
    }

    // Gérer ou créer la conversation
    let currentConversationId = conversationId;
    
    if (!currentConversationId) {
      // Créer une nouvelle conversation
      const { data: newConversation, error: convError } = await supabase
        .from('chatbot_conversations')
        .insert({
          user_email: userEmail,
          user_phone: userPhone,
          user_type: userType,
          status: needsHumanEscalation ? 'escalated' : 'active',
          escalated_to_human: needsHumanEscalation,
          escalated_at: needsHumanEscalation ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (convError) throw convError;
      currentConversationId = newConversation.id;
    }

    // Sauvegarder le message de l'utilisateur
    await supabase
      .from('chatbot_messages')
      .insert({
        conversation_id: currentConversationId,
        sender_type: 'user',
        message_text: message,
        message_type: 'text'
      });

    // Sauvegarder la réponse du bot
    await supabase
      .from('chatbot_messages')
      .insert({
        conversation_id: currentConversationId,
        sender_type: 'bot',
        message_text: response,
        message_type: needsHumanEscalation ? 'escalation' : 'text',
        metadata: {
          faq_matches: faqResults.length,
          needs_escalation: needsHumanEscalation,
          should_collect_contact: shouldCollectContact
        }
      });

    // Créer un ticket de support si escalation nécessaire
    if (needsHumanEscalation && userEmail) {
      await supabase
        .from('support_tickets')
        .insert({
          conversation_id: currentConversationId,
          user_email: userEmail,
          user_phone: userPhone,
          subject: 'Demande d\'assistance via chatbot',
          description: `Message original: ${message}\n\nRéponse automatique: ${response}`,
          priority: 'medium',
          status: 'pending'
        });
    }

    return new Response(
      JSON.stringify({
        response,
        conversationId: currentConversationId,
        needsHumanEscalation,
        shouldCollectContact,
        suggestedActions: getSuggestedActions(message, needsHumanEscalation)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in chatbot function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function searchFAQ(supabase: any, query: string): Promise<FAQResult[]> {
  try {
    const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    
    const { data, error } = await supabase
      .from('faq_knowledge_base')
      .select('*')
      .eq('is_active', true)
      .or(
        keywords.map(keyword => 
          `question.ilike.%${keyword}%,answer.ilike.%${keyword}%,keywords.cs.{${keyword}}`
        ).join(',')
      )
      .order('priority', { ascending: false })
      .limit(3);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching FAQ:', error);
    return [];
  }
}

async function generateResponseWithFAQ(query: string, faqResults: FAQResult[]): Promise<string> {
  if (faqResults.length === 1) {
    return faqResults[0].answer;
  }

  // Si plusieurs résultats, utiliser OpenAI pour synthétiser
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    return faqResults[0].answer; // Fallback
  }

  try {
    const faqContext = faqResults.map(faq => 
      `Q: ${faq.question}\nR: ${faq.answer}`
    ).join('\n\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es l'assistant virtuel de Bikawo, une plateforme de services à domicile. Utilise les informations FAQ suivantes pour répondre à la question de l'utilisateur. Sois concis, amical et professionnel. Si la question concerne plusieurs sujets, fournis une réponse synthétique.

FAQ disponibles:
${faqContext}`
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_completion_tokens: 300,
        temperature: 0.3
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response:', data);
      return faqResults[0].answer;
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating FAQ response:', error);
    return faqResults[0].answer;
  }
}

async function queryOpenAI(message: string): Promise<{ response: string; needsEscalation: boolean; shouldCollectContact: boolean }> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    return {
      response: "Je suis désolé, je ne peux pas traiter votre demande pour le moment. Veuillez contacter notre service client.",
      needsEscalation: true,
      shouldCollectContact: true
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es l'assistant virtuel de Bikawo, une plateforme française de services à domicile (garde d'enfants, aide ménagère, assistance seniors, etc.).

Ton rôle:
- Répondre aux questions fréquentes sur les services Bikawo
- Aider les clients et prestataires avec leurs questions
- Identifier quand une escalation vers un humain est nécessaire

Instructions:
1. Sois amical, professionnel et concis
2. Si tu ne connais pas une information spécifique, dis-le honnêtement
3. Pour les questions complexes, techniques ou personnelles, recommande de contacter le service client
4. Termine par [ESCALATION] si la question nécessite un agent humain
5. Termine par [COLLECT_CONTACT] si l'utilisateur devrait laisser ses coordonnées

Services Bikawo:
- Garde d'enfants et aide aux devoirs
- Aide ménagère et repassage  
- Assistance aux seniors
- Services premium et conciergerie
- Support administratif et professionnel

Politique générale:
- Annulation gratuite jusqu'à 2h avant
- Tarifs variables selon service (22€-35€/h)
- Prestataires vérifiés et assurés
- Disponible 7j/7 dans plusieurs villes françaises`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_completion_tokens: 400,
        temperature: 0.4
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response:', data);
      return {
        response: "Je rencontre des difficultés techniques. Puis-je vous mettre en relation avec un agent ?",
        needsEscalation: true,
        shouldCollectContact: true
      };
    }
    
    const aiResponse = data.choices[0].message.content;

    const needsEscalation = aiResponse.includes('[ESCALATION]');
    const shouldCollectContact = aiResponse.includes('[COLLECT_CONTACT]');
    
    // Nettoyer la réponse des marqueurs
    const cleanResponse = aiResponse
      .replace('[ESCALATION]', '')
      .replace('[COLLECT_CONTACT]', '')
      .trim();

    return {
      response: cleanResponse,
      needsEscalation,
      shouldCollectContact
    };
  } catch (error) {
    console.error('Error querying OpenAI:', error);
    return {
      response: "Je rencontre des difficultés techniques. Puis-je vous mettre en relation avec un agent ?",
      needsEscalation: true,
      shouldCollectContact: true
    };
  }
}

function getSuggestedActions(message: string, needsEscalation: boolean): string[] {
  const actions = [];
  
  if (needsEscalation) {
    actions.push("Parler à un agent");
    actions.push("Laisser un message");
  }
  
  // Actions basées sur le contenu du message
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('réservation') || lowerMessage.includes('réserver')) {
    actions.push("Faire une réservation");
  }
  
  if (lowerMessage.includes('prestataire') || lowerMessage.includes('devenir')) {
    actions.push("Devenir prestataire");
  }
  
  if (lowerMessage.includes('tarif') || lowerMessage.includes('prix')) {
    actions.push("Voir nos tarifs");
  }
  
  if (lowerMessage.includes('aide') || lowerMessage.includes('support')) {
    actions.push("Centre d'aide");
  }
  
  return actions.slice(0, 3); // Limiter à 3 actions
}