import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { conversationId, type, format } = await req.json();

    if (!conversationId || !type) {
      throw new Error("Missing required parameters");
    }

    // Charger les messages
    let messages: any[] = [];
    let conversationData: any = null;

    if (type === 'client-provider') {
      // Chat conversations
      const { data: conv } = await supabaseAdmin
        .from('chat_conversations')
        .select(`
          *,
          client:profiles!chat_conversations_client_id_fkey(first_name, last_name, email),
          provider:profiles!chat_conversations_provider_id_fkey(first_name, last_name, email),
          booking:bookings(service_id, services(name, category))
        `)
        .eq('id', conversationId)
        .single();

      conversationData = conv;

      const { data: msgs } = await supabaseAdmin
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!chat_messages_sender_id_fkey(first_name, last_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      messages = msgs || [];
    } else {
      // Internal conversations
      const { data: conv } = await supabaseAdmin
        .from('internal_conversations')
        .select(`
          *,
          client:profiles!internal_conversations_client_id_fkey(first_name, last_name, email),
          provider:profiles!internal_conversations_provider_id_fkey(first_name, last_name, email),
          admin:profiles!internal_conversations_admin_id_fkey(first_name, last_name)
        `)
        .eq('id', conversationId)
        .single();

      conversationData = conv;

      const { data: msgs } = await supabaseAdmin
        .from('internal_messages')
        .select(`
          *,
          sender:profiles!internal_messages_sender_id_fkey(first_name, last_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      messages = msgs || [];
    }

    // Générer le format demandé
    if (format === 'csv') {
      return generateCSV(conversationData, messages);
    } else {
      return generateHTML(conversationData, messages);
    }
  } catch (error) {
    console.error('Erreur export:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function generateCSV(conversation: any, messages: any[]): Response {
  const csvRows = [
    ['Date', 'Expéditeur', 'Message', 'Statut'].join(',')
  ];

  messages.forEach(msg => {
    const row = [
      new Date(msg.created_at).toISOString(),
      msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : 'Utilisateur',
      `"${msg.message_text.replace(/"/g, '""')}"`,
      msg.is_read ? 'Lu' : 'Non lu'
    ];
    csvRows.push(row.join(','));
  });

  const csvContent = csvRows.join('\n');

  return new Response(csvContent, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="conversation_${conversation.id}.csv"`
    },
    status: 200
  });
}

function generateHTML(conversation: any, messages: any[]): Response {
  const clientName = conversation.client 
    ? `${conversation.client.first_name} ${conversation.client.last_name}` 
    : 'Client';
  const providerName = conversation.provider 
    ? `${conversation.provider.first_name} ${conversation.provider.last_name}` 
    : conversation.admin 
      ? `Admin (${conversation.admin.first_name})`
      : 'Admin';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Historique Conversation - Bikawo</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 40px auto; 
            padding: 20px;
            background: #f5f5f5;
          }
          .header {
            background: #3b82f6;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: white;
            padding: 20px;
            border-radius: 0 0 8px 8px;
          }
          .info-section {
            border: 1px solid #e5e7eb;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            background: #f9fafb;
          }
          .message {
            margin: 15px 0;
            padding: 12px;
            border-left: 3px solid #3b82f6;
            background: #f0f9ff;
          }
          .message-header {
            font-weight: bold;
            margin-bottom: 5px;
            color: #1e40af;
          }
          .message-time {
            font-size: 12px;
            color: #6b7280;
            margin-top: 5px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BIKAWO</h1>
          <p>Historique de conversation</p>
        </div>
        <div class="content">
          <div class="info-section">
            <h3>Informations de la conversation</h3>
            <p><strong>Sujet:</strong> ${conversation.subject || 'N/A'}</p>
            <p><strong>Participants:</strong> ${clientName} ↔ ${providerName}</p>
            <p><strong>Date de création:</strong> ${new Date(conversation.created_at).toLocaleString('fr-FR')}</p>
            <p><strong>Statut:</strong> ${conversation.status || 'N/A'}</p>
            <p><strong>Nombre de messages:</strong> ${messages.length}</p>
          </div>

          <h3>Messages</h3>
          ${messages.map(msg => `
            <div class="message">
              <div class="message-header">
                ${msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : 'Utilisateur'}
                ${msg.is_read ? '✓✓' : '✓'}
              </div>
              <div>${msg.message_text}</div>
              <div class="message-time">
                ${new Date(msg.created_at).toLocaleString('fr-FR')}
              </div>
            </div>
          `).join('')}

          <div class="footer">
            <p>Document généré automatiquement par Bikawo SAS</p>
            <p>SIRET: 123 456 789 00012 | Conservation: 10 ans minimum (obligation légale)</p>
            <p>Date de génération: ${new Date().toLocaleString('fr-FR')}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8"
    },
    status: 200
  });
}
