import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Phone, Mail, User, Bot, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatResponse {
  response: string;
  conversationId: string;
  needsHumanEscalation: boolean;
  shouldCollectContact: boolean;
  suggestedActions: string[];
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Bonjour ! Je suis votre assistant intelligent Bikawo. Je peux répondre à vos questions sur nos services, tarifs, réservations et plus encore. Comment puis-je vous aider ?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [needsEscalation, setNeedsEscalation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Ajouter un message de typing
    const typingMessage: Message = {
      id: 'typing',
      text: 'Assistant en train d\'écrire...',
      sender: 'bot',
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('intelligent-chatbot', {
        body: {
          message: currentMessage,
          conversationId,
          userEmail: userEmail || undefined,
          userPhone: userPhone || undefined,
          userType: 'anonymous'
        }
      });

      // Enlever le message de typing
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));

      if (error) throw error;

      const response: ChatResponse = data;
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setConversationId(response.conversationId);

      if (response.needsHumanEscalation) {
        setNeedsEscalation(true);
        
        const escalationMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: response.shouldCollectContact 
            ? "Pour vous mettre en relation avec un agent, j'aurais besoin de votre email ou numéro de téléphone."
            : "Un agent va prendre en charge votre demande sous peu.",
          sender: 'bot',
          timestamp: new Date()
        };
        
        setTimeout(() => {
          setMessages(prev => [...prev, escalationMessage]);
          if (response.shouldCollectContact) {
            setShowContactForm(true);
          }
        }, 1500);
      }

    } catch (error: any) {
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: 'error',
        text: 'Désolé, je rencontre des difficultés techniques. Veuillez réessayer ou contacter notre service client au 06 09 08 53 90.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Erreur",
        description: "Impossible de traiter votre message. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSubmit = async () => {
    if (!userEmail && !userPhone) {
      toast({
        title: "Information requise",
        description: "Veuillez fournir au moins votre email ou votre numéro de téléphone.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          conversation_id: conversationId,
          user_email: userEmail,
          user_phone: userPhone,
          subject: 'Demande d\'assistance via chatbot',
          description: 'L\'utilisateur souhaite être contacté par un agent.',
          priority: 'medium'
        });

      if (error) throw error;

      const confirmationMessage: Message = {
        id: Date.now().toString(),
        text: `Parfait ! Nous avons bien noté vos coordonnées${userEmail ? ` (${userEmail})` : ''}${userPhone ? ` (${userPhone})` : ''}. Un agent vous contactera dans les plus brefs délais. Merci de votre patience !`,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, confirmationMessage]);
      setShowContactForm(false);
      
      toast({
        title: "Demande enregistrée",
        description: "Un agent vous contactera bientôt.",
      });

    } catch (error) {
      console.error('Error submitting contact:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre demande. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Faire une réservation':
        navigate('/services');
        setIsOpen(false);
        break;
      case 'Voir nos tarifs':
        setInputMessage('Quels sont vos tarifs ?');
        break;
      case 'Annuler une réservation':
        setInputMessage('Comment annuler une réservation ?');
        break;
      case 'Devenir prestataire':
        setInputMessage('Comment devenir prestataire ?');
        break;
      case 'Parler à un agent':
        setNeedsEscalation(true);
        setShowContactForm(true);
        break;
      case 'Centre d\'aide':
        navigate('/aide');
        setIsOpen(false);
        break;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    'Faire une réservation',
    'Voir nos tarifs',
    'Annuler une réservation',
    'Devenir prestataire',
    'Parler à un agent'
  ];

  return (
    <>
      {/* Bouton flottant */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-gradient-primary text-white shadow-glow hover:shadow-cocon transition-all duration-300 hover:scale-110"
          size="icon"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* Interface de chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] z-50 animate-fade-in">
          <Card className="h-full flex flex-col shadow-cocon border-primary/20">
            {/* Header */}
            <CardHeader className="bg-gradient-primary text-white p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Assistant Bikawo</h3>
                    <p className="text-xs text-white/80 flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      IA Active - Réponses instantanées
                    </p>
                  </div>
                </div>
                {needsEscalation && (
                  <AlertCircle className="w-5 h-5 text-yellow-300" />
                )}
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'bot' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg text-sm ${
                      message.sender === 'bot'
                        ? message.isTyping 
                          ? 'bg-muted/50 text-muted-foreground animate-pulse'
                          : 'bg-muted text-foreground'
                        : 'bg-gradient-primary text-white'
                    }`}
                  >
                    {message.isTyping && (
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
                        </div>
                        <span>{message.text}</span>
                      </div>
                    )}
                    {!message.isTyping && message.text}
                  </div>
                </div>
              ))}
              
              {/* Formulaire de contact */}
              {showContactForm && (
                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Vos coordonnées pour être recontacté
                  </h4>
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="Votre email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="tel"
                      placeholder="Votre téléphone (optionnel)"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Button 
                      onClick={handleContactSubmit}
                      className="w-full h-8 text-sm bg-gradient-primary"
                    >
                      Envoyer ma demande
                    </Button>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Actions rapides */}
            <div className="p-3 border-t border-border">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {quickActions.map((action) => (
                  <Button
                    key={action}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 hover:bg-primary/5"
                    onClick={() => handleQuickAction(action)}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tapez votre message..."
                  className="flex-1 h-9 text-sm"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  size="sm"
                  className="h-9 bg-gradient-primary text-white"
                  disabled={isLoading || !inputMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Contact alternatif */}
            <div className="p-3 border-t border-border bg-muted/30">
              <div className="flex justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Phone className="w-3 h-3" />
                  <span>06 09 08 53 90</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>7j/7 9h-22h</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Mail className="w-3 h-3" />
                  <span>contact@bikawo.com</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default ChatBot;