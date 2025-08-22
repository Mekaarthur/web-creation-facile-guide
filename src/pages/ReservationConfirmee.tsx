import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Home, Phone, Mail, Calendar } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface ReservationDetails {
  id: string;
  clientInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
  };
  preferredDate: string;
  preferredTime?: string;
  services: any[];
  totalEstimated: number;
  status: string;
  createdAt: string;
}

const ReservationConfirmee = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<ReservationDetails | null>(null);

  useEffect(() => {
    const reservationId = location.state?.reservationId;
    
    if (reservationId) {
      // Récupérer les détails de la réservation depuis localStorage
      const savedReservations = localStorage.getItem('bikawo-reservations');
      if (savedReservations) {
        const reservations = JSON.parse(savedReservations);
        const foundReservation = reservations.find((r: ReservationDetails) => r.id === reservationId);
        if (foundReservation) {
          setReservation(foundReservation);
        }
      }
    }

    if (!reservationId || !reservation) {
      // Rediriger vers l'accueil après 3 secondes si pas de réservation trouvée
      const timer = setTimeout(() => navigate('/'), 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate, reservation]);

  if (!reservation) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
              <div className="h-8 bg-muted rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
            <p className="text-muted-foreground mt-4">
              Chargement de votre confirmation...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header de confirmation */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Réservation confirmée !
              </h1>
              <p className="text-xl text-muted-foreground">
                Merci {reservation.clientInfo.firstName}, votre demande a été enregistrée
              </p>
              <Badge variant="outline" className="text-sm">
                Référence : {reservation.id}
              </Badge>
            </div>
          </div>

          {/* Détails de la réservation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations de contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Nous vous contacterons
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{reservation.clientInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{reservation.clientInfo.phone}</span>
                  </div>
                  {reservation.preferredDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(reservation.preferredDate).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                        {reservation.preferredTime && ` à ${reservation.preferredTime}`}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    📞 Prochaines étapes :
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Un conseiller vous contactera sous 24h</li>
                    <li>• Confirmation des détails et du planning</li>
                    <li>• Attribution d'un prestataire qualifié</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Récapitulatif des services */}
            <Card>
              <CardHeader>
                <CardTitle>Services réservés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {reservation.services.map((service, index) => (
                    <div key={index} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{service.serviceName}</h4>
                        <p className="text-xs text-muted-foreground">{service.packageTitle}</p>
                        {service.customBooking?.hours && (
                          <p className="text-xs text-muted-foreground">
                            ⏱️ {service.customBooking.hours}h minimum
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {service.customBooking?.hours 
                          ? `${service.price * service.customBooking.hours}€`
                          : `${service.price * 2}€`
                        }
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total estimé :</span>
                    <span className="text-primary">{reservation.totalEstimated}€</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Prix indicatif - Le tarif final sera confirmé par notre équipe
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informations importantes */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-yellow-800">📋 Important à retenir :</h3>
                <ul className="space-y-2 text-sm text-yellow-700">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>Votre réservation est en attente de validation par notre équipe</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>Un email de confirmation vous sera envoyé sous peu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>Pour toute urgence, contactez-nous au 01 XX XX XX XX</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>Les services ont une durée minimum de 2 heures</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Retour à l'accueil
            </Button>
            
            <Button 
              onClick={() => navigate('/services')}
              className="flex items-center gap-2"
            >
              Découvrir d'autres services
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ReservationConfirmee;