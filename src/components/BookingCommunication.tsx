import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ChatInterface from './ChatInterface';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BookingCommunicationProps {
  bookingId: string;
  userType: 'client' | 'provider';
}

interface ConversationInfo {
  booking: {
    id: string;
    booking_date: string;
    start_time: string;
    status: string;
    services: {
      name: string;
    };
  };
  otherUser: {
    id: string;
    name: string;
    type: 'client' | 'provider';
  };
}

const BookingCommunication = ({ bookingId, userType }: BookingCommunicationProps) => {
  const [conversationInfo, setConversationInfo] = useState<ConversationInfo | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadConversationInfo();
    loadUnreadCount();
  }, [bookingId, userType]);

  const loadConversationInfo = async () => {
    if (!user) return;

    try {
      const { data: bookingData } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          status,
          client_id,
          provider_id,
          services(name)
        `)
        .eq('id', bookingId)
        .single();

      if (bookingData) {
        let otherUser;
        
        if (userType === 'client' && bookingData.provider_id) {
          // Le client veut parler au prestataire
          const { data: providerData } = await supabase
            .from('providers')
            .select('id, user_id, business_name')
            .eq('id', bookingData.provider_id)
            .single();

          if (providerData) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', providerData.user_id)
              .single();

            const providerName = providerData.business_name || 
                                `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim();
            
            otherUser = {
              id: providerData.user_id,
              name: providerName || 'Prestataire',
              type: 'provider' as const
            };
          }
        } else if (userType === 'provider') {
          // Le prestataire veut parler au client
          const { data: clientProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', bookingData.client_id)
            .single();
          
          const clientName = `${clientProfile?.first_name || ''} ${clientProfile?.last_name || ''}`.trim();
          
          otherUser = {
            id: bookingData.client_id,
            name: clientName || 'Client',
            type: 'client' as const
          };
        }

        if (otherUser) {
          setConversationInfo({
            booking: {
              id: bookingData.id,
              booking_date: bookingData.booking_date,
              start_time: bookingData.start_time,
              status: bookingData.status,
              services: bookingData.services
            },
            otherUser
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des infos de conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!user) return;

    try {
      const { count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact' })
        .eq('booking_id', bookingId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Erreur lors du chargement du nombre de messages non lus:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-emerald-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmé';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!conversationInfo) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Conversation non disponible</p>
        </CardContent>
      </Card>
    );
  }

  if (showChat) {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => setShowChat(false)}
          className="mb-4"
        >
          ← Retour
        </Button>
        
        <ChatInterface
          bookingId={bookingId}
          otherUserId={conversationInfo.otherUser.id}
          otherUserName={conversationInfo.otherUser.name}
        />
      </div>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Communication
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informations de la prestation */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">{conversationInfo.booking.services.name}</h4>
            <Badge className={`${getStatusColor(conversationInfo.booking.status)} text-white text-xs`}>
              {getStatusText(conversationInfo.booking.status)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(conversationInfo.booking.booking_date), 'PPP', { locale: fr })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{conversationInfo.booking.start_time}</span>
            </div>
          </div>
        </div>

        {/* Informations du contact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-full">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            
            <div>
              <p className="font-medium">
                {conversationInfo.otherUser.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {conversationInfo.otherUser.type === 'provider' ? 'Prestataire' : 'Client'}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
            </Badge>
          )}
        </div>

        {/* Bouton pour ouvrir le chat */}
        <Button 
          onClick={() => setShowChat(true)}
          className="w-full"
          variant="outline"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {unreadCount > 0 ? `Voir les messages (${unreadCount})` : 'Ouvrir la conversation'}
        </Button>

        {/* Message d'aide */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
          <p>
            💡 Vous pouvez échanger avec votre {conversationInfo.otherUser.type === 'provider' ? 'prestataire' : 'client'} 
            pour coordonner votre prestation, poser des questions ou partager des informations importantes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingCommunication;