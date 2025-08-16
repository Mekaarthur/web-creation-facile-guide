import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Eye, 
  Download, 
  Search, 
  Filter, 
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  Building,
  MessageSquare,
  Euro,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReservationData {
  id: string;
  items: Array<{
    serviceName: string;
    packageTitle: string;
    price: number;
    customBooking?: {
      clientInfo?: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        company?: string;
      };
      address: string;
      serviceType?: string;
      description?: string;
      preferredDate?: string;
      budget?: string;
    };
  }>;
  totalEstimated: number;
  additionalNotes?: string;
  submittedAt: string;
  status: 'en_attente' | 'en_cours' | 'accepte' | 'refuse' | 'termine';
}

const AdminReservations = () => {
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<ReservationData[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<ReservationData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();

  // Charger les réservations depuis localStorage
  useEffect(() => {
    const loadReservations = () => {
      const saved = localStorage.getItem('bikawo-final-reservations') || '[]';
      try {
        const data = JSON.parse(saved);
        setReservations(data);
        setFilteredReservations(data);
      } catch (error) {
        console.error('Erreur lors du chargement des réservations:', error);
      }
    };

    loadReservations();
    // Recharger toutes les 30 secondes pour voir les nouvelles demandes
    const interval = setInterval(loadReservations, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtrer les réservations
  useEffect(() => {
    let filtered = reservations;

    if (searchTerm) {
      filtered = filtered.filter(res => 
        res.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.items.some(item => 
          item.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.customBooking?.clientInfo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.customBooking?.clientInfo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.customBooking?.clientInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(res => res.status === statusFilter);
    }

    setFilteredReservations(filtered);
  }, [reservations, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    const variants = {
      'en_attente': 'default',
      'en_cours': 'secondary',
      'accepte': 'default',
      'refuse': 'destructive',
      'termine': 'default'
    };
    
    const labels = {
      'en_attente': 'En attente',
      'en_cours': 'En cours',
      'accepte': 'Accepté',
      'refuse': 'Refusé',
      'termine': 'Terminé'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const updateReservationStatus = (reservationId: string, newStatus: string) => {
    const updated = reservations.map(res => 
      res.id === reservationId ? { ...res, status: newStatus as any } : res
    );
    setReservations(updated);
    localStorage.setItem('bikawo-final-reservations', JSON.stringify(updated));
    
    toast({
      title: "Statut mis à jour",
      description: `La réservation ${reservationId} a été mise à jour`,
    });
  };

  const exportToExcel = () => {
    // Simulation d'export Excel
    const exportData = filteredReservations.map(res => ({
      ID: res.id,
      Date: new Date(res.submittedAt).toLocaleDateString('fr-FR'),
      Client: res.items[0]?.customBooking?.clientInfo ? 
        `${res.items[0].customBooking.clientInfo.firstName} ${res.items[0].customBooking.clientInfo.lastName}` : 
        'N/A',
      Email: res.items[0]?.customBooking?.clientInfo?.email || 'N/A',
      Services: res.items.map(item => item.serviceName).join(', '),
      Total: `${res.totalEstimated}€`,
      Statut: res.status
    }));

    console.log('Export Excel:', exportData);
    toast({
      title: "Export généré",
      description: `${exportData.length} réservations exportées (fonctionnalité simulée)`,
    });
  };

  const exportToPDF = (reservation: ReservationData) => {
    console.log('Export PDF:', reservation);
    toast({
      title: "PDF généré",
      description: `Récapitulatif de la réservation ${reservation.id} (fonctionnalité simulée)`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Réservations</h1>
          <p className="text-muted-foreground">
            {reservations.length} demande{reservations.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <Button onClick={exportToExcel} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exporter Excel
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="ID, nom, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="accepte">Accepté</SelectItem>
                  <SelectItem value="refuse">Refusé</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}>
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des réservations */}
      <div className="grid gap-4">
        {filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Aucune réservation trouvée</p>
            </CardContent>
          </Card>
        ) : (
          filteredReservations.map((reservation) => (
            <Card key={reservation.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{reservation.id}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(reservation.submittedAt).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Euro className="w-4 h-4" />
                        {reservation.totalEstimated}€
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {reservation.items.length} service{reservation.items.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(reservation.status)}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedReservation(reservation);
                        setIsDetailOpen(true);
                        setAdminNotes("");
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button>
                  </div>
                </div>

                {/* Aperçu client */}
                {reservation.items[0]?.customBooking?.clientInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {reservation.items[0].customBooking.clientInfo.firstName} {' '}
                        {reservation.items[0].customBooking.clientInfo.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{reservation.items[0].customBooking.clientInfo.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{reservation.items[0].customBooking.clientInfo.phone}</span>
                    </div>
                  </div>
                )}

                {/* Services demandés */}
                <div className="mt-4">
                  <p className="font-medium text-sm mb-2">Services demandés:</p>
                  <div className="flex flex-wrap gap-2">
                    {reservation.items.map((item, index) => (
                      <Badge key={index} variant="outline">
                        {item.serviceName}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de détails */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Détails de la réservation {selectedReservation?.id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedReservation && (
            <div className="space-y-6">
              {/* Statut et actions */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {getStatusBadge(selectedReservation.status)}
                  <span className="text-sm text-muted-foreground">
                    Reçue le {new Date(selectedReservation.submittedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Select 
                    value={selectedReservation.status} 
                    onValueChange={(value) => updateReservationStatus(selectedReservation.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_attente">En attente</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="accepte">Accepté</SelectItem>
                      <SelectItem value="refuse">Refusé</SelectItem>
                      <SelectItem value="termine">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button size="sm" onClick={() => exportToPDF(selectedReservation)}>
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Détails des services */}
              <div className="space-y-4">
                <h3 className="font-semibold">Services demandés</h3>
                {selectedReservation.items.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium">{item.serviceName}</h4>
                          <p className="text-sm text-muted-foreground">{item.packageTitle}</p>
                          <Badge variant="outline" className="mt-2">
                            {item.price}€/h
                          </Badge>
                        </div>
                        
                        {item.customBooking && (
                          <div className="space-y-2 text-sm">
                            {item.customBooking.clientInfo && (
                              <div className="space-y-1">
                                <p><strong>Client:</strong> {item.customBooking.clientInfo.firstName} {item.customBooking.clientInfo.lastName}</p>
                                <p><strong>Email:</strong> {item.customBooking.clientInfo.email}</p>
                                <p><strong>Téléphone:</strong> {item.customBooking.clientInfo.phone}</p>
                                {item.customBooking.clientInfo.company && (
                                  <p><strong>Entreprise:</strong> {item.customBooking.clientInfo.company}</p>
                                )}
                              </div>
                            )}
                            
                            <p><strong>Adresse:</strong> {item.customBooking.address}</p>
                            
                            {item.customBooking.serviceType && (
                              <p><strong>Type de prestation:</strong> {item.customBooking.serviceType}</p>
                            )}
                            
                            {item.customBooking.description && (
                              <div>
                                <strong>Description:</strong>
                                <p className="mt-1 text-muted-foreground">{item.customBooking.description}</p>
                              </div>
                            )}
                            
                            {item.customBooking.budget && (
                              <p><strong>Budget:</strong> {item.customBooking.budget}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Notes additionnelles */}
              {selectedReservation.additionalNotes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes du client</h3>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm">{selectedReservation.additionalNotes}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Total */}
              <div className="bg-primary/5 p-4 rounded-lg">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total estimé:</span>
                  <span className="text-primary">{selectedReservation.totalEstimated}€</span>
                </div>
              </div>

              {/* Notes admin */}
              <div className="space-y-2">
                <Label htmlFor="adminNotes">Notes administratives</Label>
                <Textarea
                  id="adminNotes"
                  placeholder="Ajouter des notes internes..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
                <Button size="sm" onClick={() => {
                  // Sauvegarder les notes admin (simulation)
                  toast({
                    title: "Notes sauvegardées",
                    description: "Les notes administratives ont été enregistrées",
                  });
                }}>
                  Sauvegarder les notes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReservations;