import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import BikawoCart from "@/components/BikawoCart";
import BikawoCartIndicator from "@/components/BikawoCartIndicator";
import { useBikawoCart } from "@/hooks/useBikawoCart";
import { ShoppingCart, TestTube, AlertTriangle, Check } from "lucide-react";

/**
 * Composant de démonstration des nouvelles fonctionnalités du panier Bikawo
 * - Panier non-persistant (session uniquement)
 * - Validation des compatibilités entre services
 * - Séparation automatique en plusieurs réservations
 * - Paiement groupé
 */
const BikawoCartDemo = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { addToCart, clearCart, hasIncompatibleServices } = useBikawoCart();

  // Exemples de services pour les tests
  const demoServices = [
    {
      serviceName: "Garde d'enfants",
      serviceCategory: 'kids' as const,
      packageTitle: "Bika Kids - Garde Premium",
      price: 25,
      timeSlot: {
        date: new Date(2024, 0, 15, 14, 0), // 15 janvier 2024, 14h
        startTime: "14:00",
        endTime: "18:00"
      },
      address: "123 Rue de la Paix, 75001 Paris",
      description: "Garde d'enfants avec activités éducatives"
    },
    {
      serviceName: "Ménage à domicile",
      serviceCategory: 'maison' as const,
      packageTitle: "Bika Maison - Nettoyage",
      price: 20,
      timeSlot: {
        date: new Date(2024, 0, 15, 14, 30), // Même jour, créneau qui chevauche
        startTime: "14:30",
        endTime: "17:30"
      },
      address: "123 Rue de la Paix, 75001 Paris", // Même adresse
      description: "Nettoyage complet de l'appartement"
    },
    {
      serviceName: "Aide aux seniors",
      serviceCategory: 'seniors' as const,
      packageTitle: "Bika Seniors - Accompagnement",
      price: 22,
      timeSlot: {
        date: new Date(2024, 0, 16, 10, 0), // Jour différent
        startTime: "10:00",
        endTime: "12:00"
      },
      address: "456 Avenue des Champs, 75008 Paris",
      description: "Accompagnement et aide aux courses"
    },
    {
      serviceName: "Services de voyage",
      serviceCategory: 'travel' as const,
      packageTitle: "Bika Travel - Assistance aéroport",
      price: 35,
      timeSlot: {
        date: new Date(2024, 0, 17, 8, 0),
        startTime: "08:00",
        endTime: "10:00"
      },
      address: "Aéroport Charles de Gaulle",
      description: "Accompagnement à l'aéroport"
    }
  ];

  const addTestService = (index: number) => {
    const service = demoServices[index];
    addToCart(service);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <TestTube className="w-6 h-6 text-primary" />
              Démonstration - Nouveau Système de Panier Bikawo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Badge variant="outline" className="p-3 justify-center">
                🚫 Panier non-persistant
              </Badge>
              <Badge variant="outline" className="p-3 justify-center">
                ✅ Validation compatibilité
              </Badge>
              <Badge variant="outline" className="p-3 justify-center">
                🔄 Séparation automatique
              </Badge>
              <Badge variant="outline" className="p-3 justify-center">
                💳 Paiement groupé
              </Badge>
            </div>
            
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <strong>Test en cours :</strong> Ce panier se vide automatiquement à la fermeture de l'onglet. 
                Les services incompatibles sont séparés en réservations distinctes mais payées en une seule fois.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Zone de test et panier */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Zone de test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Tests d'Ajout de Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Testez l'ajout de services pour voir les règles de compatibilité en action :
              </p>
              
              <div className="space-y-3">
                {demoServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{service.serviceName}</div>
                      <div className="text-xs text-muted-foreground">
                        {service.timeSlot.date.toLocaleDateString('fr-FR')} - {service.timeSlot.startTime}
                      </div>
                      <div className="text-xs text-muted-foreground">{service.address}</div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => addTestService(index)}
                      variant="outline"
                    >
                      Ajouter
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={clearCart}
                  className="flex-1"
                >
                  Vider le panier
                </Button>
                <Button 
                  onClick={() => setIsCartOpen(true)}
                  className="flex-1"
                >
                  Voir le panier
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Indicateur de panier */}
          <Card>
            <CardHeader>
              <CardTitle>État du Panier en Temps Réel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Indicateur visuel */}
              <div className="flex items-center justify-center p-8 border-2 border-dashed border-muted rounded-lg">
                <BikawoCartIndicator 
                  onOpenCart={() => setIsCartOpen(true)}
                  showTotal={true}
                  className="transform scale-150"
                />
              </div>

              {/* Statut des incompatibilités */}
              {hasIncompatibleServices() ? (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Services incompatibles détectés !</strong><br />
                    Le système a automatiquement créé des réservations séparées.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-200 bg-green-50">
                  <Check className="w-4 h-4" />
                  <AlertDescription>
                    Tous les services sont compatibles entre eux.
                  </AlertDescription>
                </Alert>
              )}

              {/* Instructions */}
              <div className="space-y-2 text-sm">
                <p><strong>💡 Testez les conflits :</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Garde d'enfants + Ménage = 🚫 Créneaux incompatibles</li>
                  <li>Services sur dates différentes = ✅ Compatible</li>
                  <li>Voyage + Services domicile = 🚫 Incompatible</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panier modal */}
        <BikawoCart 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
        />
      </div>
    </div>
  );
};

export default BikawoCartDemo;