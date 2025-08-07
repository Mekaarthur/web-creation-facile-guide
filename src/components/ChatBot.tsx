import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, Phone, Mail, Clock } from "lucide-react";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Bonjour ! Je suis votre expert virtuel Bikawo. Comment puis-je vous aider aujourd'hui ?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const quickActions = [
    "Demander un devis",
    "Réserver une garde d'enfant",
    "Parler à un conseiller",
    "Tarifs des services"
  ];

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");

    // Simulation de réponse automatique
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: "Merci pour votre message ! Un de nos conseillers va vous recontacter dans les plus brefs délais. En attendant, vous pouvez nous appeler au 06 09 08 53 90.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

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
        <div className="fixed bottom-24 right-6 w-80 h-96 z-50 animate-fade-in">
          <Card className="h-full flex flex-col shadow-cocon border-primary/20">
            {/* Header */}
            <div className="bg-gradient-primary text-white p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Expert Bikawo</h3>
                    <p className="text-xs text-white/80 flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      En ligne
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      message.isBot
                        ? 'bg-muted text-foreground'
                        : 'bg-gradient-primary text-white'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions rapides */}
            <div className="p-3 border-t border-border">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {quickActions.map((action) => (
                  <Button
                    key={action}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setInputMessage(action)}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Button
                  onClick={handleSendMessage}
                  size="sm"
                  className="bg-gradient-primary text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Contact alternatif */}
            <div className="p-3 border-t border-border bg-muted/50">
              <div className="flex justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Phone className="w-3 h-3" />
                  <span>06 09 08 53 90</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>7j/7 9h-22h</span>
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