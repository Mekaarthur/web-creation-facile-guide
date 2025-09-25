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

    console.log('💬 Nouvelle question reçue:', message);

    // Rechercher dans la FAQ
    const faqResults = await searchFAQ(supabase, message);
    
    let response: string;
    let needsHumanEscalation = false;
    let shouldCollectContact = false;
    let confidence = 0;

    // Si on trouve des résultats pertinents dans la FAQ
    if (faqResults.length > 0) {
      console.log(`✅ ${faqResults.length} résultat(s) FAQ trouvé(s)`);
      response = await generateResponseWithFAQ(message, faqResults);
      confidence = Math.max(...faqResults.map(f => f.priority));
    } else {
      // Utiliser OpenAI pour une réponse plus intelligente
      console.log('🤖 Pas de FAQ correspondante, utilisation d\'OpenAI');
      const aiResponse = await queryOpenAI(message);
      response = aiResponse.response;
      needsHumanEscalation = aiResponse.needsEscalation;
      shouldCollectContact = aiResponse.shouldCollectContact;
      confidence = needsHumanEscalation ? 30 : 70;
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

      if (convError) {
        console.error('❌ Erreur création conversation:', convError);
        throw convError;
      }
      
      currentConversationId = newConversation.id;
      console.log('✅ Nouvelle conversation créée:', currentConversationId);
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
          should_collect_contact: shouldCollectContact,
          confidence_score: confidence,
          source: faqResults.length > 0 ? 'faq' : 'openai'
        }
      });

    // Créer un ticket de support si escalation nécessaire
    if (needsHumanEscalation && userEmail) {
      console.log('📧 Création ticket de support pour:', userEmail);
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

    console.log('✅ Réponse générée et sauvegardée');

    return new Response(
      JSON.stringify({
        response,
        conversationId: currentConversationId,
        needsHumanEscalation,
        shouldCollectContact,
        confidence,
        suggestedActions: getSuggestedActions(message, needsHumanEscalation)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: unknown) {
    console.error('❌ Erreur dans la fonction chatbot:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        response: "Je rencontre des difficultés techniques. Puis-je vous mettre en relation avec un agent ?",
        needsHumanEscalation: true,
        shouldCollectContact: true
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function searchFAQ(supabase: any, query: string): Promise<FAQResult[]> {
  try {
    const keywords = query.toLowerCase()
      .split(' ')
      .filter(word => word.length > 2)
      .slice(0, 10); // Limiter le nombre de mots-clés
    
    if (keywords.length === 0) {
      return [];
    }

    // Recherche par mots-clés avec pondération
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
      .limit(5);

    if (error) {
      console.error('❌ Erreur recherche FAQ:', error);
      throw error;
    }
    
    console.log(`🔍 Recherche FAQ pour "${query}" - ${data?.length || 0} résultat(s)`);
    return data || [];
  } catch (error) {
    console.error('❌ Erreur dans searchFAQ:', error);
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
            content: `Tu es l'assistant virtuel de Bikawo, une plateforme de services à domicile en Île-de-France. Utilise UNIQUEMENT les informations FAQ suivantes pour répondre à la question de l'utilisateur. Sois concis, amical et professionnel. Si la question concerne plusieurs sujets, fournis une réponse synthétique.

IMPORTANT : Ne réponds QU'avec les informations contenues dans les FAQ ci-dessous :

${faqContext}

Adapte le ton : chaleureux, professionnel, et conclus toujours par une question pour engager l'utilisateur.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Réponse OpenAI invalide:', data);
      return faqResults[0].answer;
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('❌ Erreur génération réponse FAQ:', error);
    return faqResults[0].answer;
  }
}

async function queryOpenAI(message: string): Promise<{ response: string; needsEscalation: boolean; shouldCollectContact: boolean }> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    return {
      response: "Je suis désolé, je ne peux pas traiter votre demande pour le moment. Puis-je vous mettre en relation avec notre équipe ?",
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
            content: `Tu es l'assistant virtuel de Bikawo, une plateforme française de services à domicile en Île-de-France (Paris + départements 77, 78, 91, 92, 93, 94, 95).

🎯 MISSION : Aider les clients et prestataires avec leurs questions sur nos services.

📍 ZONE D'INTERVENTION : Paris et Île-de-France (30km)
📞 CONTACT : 0609085390 | contact@bikawo.fr | www.bikawo.fr

🛍️ NOS SERVICES :
• BIKA KIDS (25€/h) : Garde d'enfants, baby-sitting, soutien scolaire (30€/h)
• BIKA MAISON (25€/h) : Courses, ménage, jardinage, déménagement (30€/h urgences)
• BIKA VIE (25€/h) : Administratif, pressing, planning personnel (30€/h assistance)
• BIKA TRAVEL (30€/h) : Organisation voyages, formalités
• BIKA ANIMAL (25€/h soins, 30€/h vétérinaire) : Garde animaux, promenades
• BIKA SENIORS (30€/h) : Assistance personnes âgées, compagnie
• BIKA PRO (50€/h+) : Services aux entreprises
• BIKA PLUS : Services sur mesure premium

💳 PAIEMENT : CB et virement (pas de CESU)
❌ ANNULATION : Gratuite >24h, puis barème dégressif
✅ GARANTIES : Intervenants vérifiés, assurés, qualifiés

INSTRUCTIONS :
1. Sois chaleureux, professionnel et concis
2. Pour tarifs précis → "Contactez-nous pour devis personnalisé"
3. Pour réservations → "Notre équipe finalise votre réservation"
4. Pour questions complexes → [ESCALATION]
5. Pour collecter coordonnées → [COLLECT_CONTACT]
6. Toujours conclure par une question engageante`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 400,
        temperature: 0.4
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Réponse OpenAI invalide:', data);
      return {
        response: "Je rencontre des difficultés techniques. Puis-je vous mettre en relation avec un agent ?",
        needsHumanEscalation: true,
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
    console.error('❌ Erreur requête OpenAI:', error);
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
  
  if (lowerMessage.includes('réservation') || lowerMessage.includes('réserver') || lowerMessage.includes('commande')) {
    actions.push("Faire une réservation");
  }
  
  if (lowerMessage.includes('prestataire') || lowerMessage.includes('devenir') || lowerMessage.includes('candidature')) {
    actions.push("Devenir prestataire");
  }
  
  if (lowerMessage.includes('tarif') || lowerMessage.includes('prix') || lowerMessage.includes('coût')) {
    actions.push("Voir nos tarifs");
  }
  
  if (lowerMessage.includes('aide') || lowerMessage.includes('support') || lowerMessage.includes('problème')) {
    actions.push("Centre d'aide");
  }

  if (lowerMessage.includes('annul') || lowerMessage.includes('modif') || lowerMessage.includes('chang')) {
    actions.push("Modifier une réservation");
  }
  
  return actions.length > 0 ? actions.slice(0, 3) : ["Faire une réservation", "Voir nos services", "Nous contacter"];
}