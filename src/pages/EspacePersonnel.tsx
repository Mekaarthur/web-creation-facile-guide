import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CreditCard, Bell, History, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EspacePersonnel = () => {
  const [selectedTab, setSelectedTab] = useState("reservations");

  const reservations = [
    {
      id: "RES001",
      service: "Assist'Kids - Garde ponctuelle",
      date: "2024-01-15",
      heure: "14:00 - 18:00",
      statut: "Confirmé",
      prestataire: "Marie D.",
      prix: "120€"
    },
    {
      id: "RES002",
      service: "Assist'Maison - Courses express",
      date: "2024-01-18",
      heure: "16:00 - 17:30",
      statut: "En cours",
      prestataire: "Paul M.",
      prix: "45€"
    },
    {
      id: "RES003",
      service: "Assist'Travel - Transfert aéroport",
      date: "2024-01-22",
      heure: "06:00 - 08:00",
      statut: "À venir",
      prestataire: "Lucas R.",
      prix: "80€"
    }
  ];

  const factures = [
    {
      id: "FAC001",
      date: "2024-01-10",
      montant: "165€",
      statut: "Payée",
      services: "Assist'Kids (2 prestations)"
    },
    {
      id: "FAC002",
      date: "2024-01-05",
      montant: "280€",
      statut: "Payée",
      services: "Assist'Maison + Assist'Vie"
    }
  ];

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "Confirmé": return "bg-accent text-accent-foreground";
      case "En cours": return "bg-gradient-primary text-white";
      case "À venir": return "bg-secondary text-secondary-foreground";
      case "Payée": return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Mon Espace Personnel</h1>
            <p className="text-muted-foreground text-lg">
              Gérez vos réservations, suivez vos prestations et accédez à vos factures
            </p>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="reservations" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Réservations
              </TabsTrigger>
              <TabsTrigger value="prestations" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Prestations
              </TabsTrigger>
              <TabsTrigger value="factures" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Factures
              </TabsTrigger>
              <TabsTrigger value="calendrier" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Calendrier
              </TabsTrigger>
            </TabsList>

            {/* Historique des réservations */}
            <TabsContent value="reservations" className="space-y-6">
              <div className="grid gap-4">
                <h2 className="text-2xl font-semibold text-foreground">Historique des réservations</h2>
                {reservations.map((reservation) => (
                  <Card key={reservation.id} className="hover:shadow-soft transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            {reservation.service}
                          </h3>
                          <p className="text-muted-foreground">
                            {reservation.date} • {reservation.heure}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Prestataire: {reservation.prestataire}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(reservation.statut)}>
                            {reservation.statut}
                          </Badge>
                          <p className="text-lg font-semibold text-foreground mt-2">
                            {reservation.prix}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Voir détails</Button>
                        {reservation.statut === "À venir" && (
                          <Button variant="ghost" size="sm">Modifier</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Suivi des prestations */}
            <TabsContent value="prestations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Prestations en cours et à venir
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reservations.filter(r => r.statut !== "Terminé").map((prestation) => (
                    <div key={prestation.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">{prestation.service}</h4>
                        <p className="text-sm text-muted-foreground">
                          {prestation.date} à {prestation.heure.split(' - ')[0]}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(prestation.statut)}>
                          {prestation.statut}
                        </Badge>
                        <Button variant="outline" size="sm">Suivre</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Factures et paiements */}
            <TabsContent value="factures" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Mes factures
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {factures.map((facture) => (
                      <div key={facture.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">Facture {facture.id}</p>
                          <p className="text-sm text-muted-foreground">{facture.date}</p>
                          <p className="text-sm text-muted-foreground">{facture.services}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{facture.montant}</p>
                          <Badge className={getStatusColor(facture.statut)}>{facture.statut}</Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Méthodes de paiement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg">
                        <p className="font-medium text-foreground">Carte bancaire</p>
                        <p className="text-sm text-muted-foreground">**** **** **** 1234</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="font-medium text-foreground">Prélèvement SEPA</p>
                        <p className="text-sm text-muted-foreground">Compte principal</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="font-medium text-foreground">CESU</p>
                        <p className="text-sm text-muted-foreground">Chèques emploi service</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      Ajouter un moyen de paiement
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Calendrier familial */}
            <TabsContent value="calendrier" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Calendrier familial partagé
                    <Badge className="bg-gradient-primary text-white">Assist'Plus</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Calendrier familial
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Synchronisez vos rendez-vous familiaux et prestations Assist'me
                    </p>
                    <Button variant="hero">Activer le calendrier</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EspacePersonnel;