import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Search, Eye, CheckCircle, XCircle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  client_name: string;
  provider_name: string;
  service_name: string;
  rating: number;
  comment: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  booking_id: string;
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  // Mock data
  const mockReviews: Review[] = [
    {
      id: '1',
      client_name: 'Marie Dubois',
      provider_name: 'Sophie Martin',
      service_name: 'Garde d\'enfants',
      rating: 5,
      comment: 'Excellent service, Sophie est très professionnelle et mes enfants l\'adorent !',
      created_at: '2024-12-10T14:30:00Z',
      status: 'approved',
      booking_id: 'booking_1'
    },
    {
      id: '2',
      client_name: 'Pierre Martin',
      provider_name: 'Jean Dupont',
      service_name: 'Ménage à domicile',
      rating: 4,
      comment: 'Très bon travail, ponctuel et efficace. Je recommande !',
      created_at: '2024-12-09T16:45:00Z',
      status: 'pending',
      booking_id: 'booking_2'
    },
    {
      id: '3',
      client_name: 'Isabelle Leroy',
      provider_name: 'Claire Bernard',
      service_name: 'Accompagnement senior',
      rating: 3,
      comment: 'Service correct mais manque un peu d\'attention aux détails.',
      created_at: '2024-12-08T10:20:00Z',
      status: 'approved',
      booking_id: 'booking_3'
    },
    {
      id: '4',
      client_name: 'Thomas Roux',
      provider_name: 'Marie Petit',
      service_name: 'Aide administrative',
      rating: 1,
      comment: 'Très déçu, prestation non conforme à ce qui était promis.',
      created_at: '2024-12-07T09:15:00Z',
      status: 'pending',
      booking_id: 'booking_4'
    }
  ];

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('admin-reviews', {
          body: { action: 'list', status: statusFilter, limit: 100 }
        });

        if (error) throw error;

        if (data?.success) {
          setReviews(data.reviews);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des avis:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les avis",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadReviews();
  }, [statusFilter]);

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || review.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Review['status']) => {
    const variants = {
      pending: { variant: 'outline' as const, label: 'En attente' },
      approved: { variant: 'default' as const, label: 'Approuvé' },
      rejected: { variant: 'destructive' as const, label: 'Rejeté' }
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return reviews.length;
    return reviews.filter(review => review.status === status).length;
  };

  const handleApprove = async (reviewId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('admin-reviews', {
        body: { 
          action: 'approve',
          reviewId,
          adminUserId: user?.id
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Succès",
          description: data.message,
        });
        // Recharger les avis
        const { data: reviewsData } = await supabase.functions.invoke('admin-reviews', {
          body: { action: 'list', status: statusFilter, limit: 100 }
        });
        if (reviewsData?.success) {
          setReviews(reviewsData.reviews);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'approuver l'avis",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('admin-reviews', {
        body: { 
          action: 'reject',
          reviewId,
          adminUserId: user?.id,
          reason: 'Rejeté par l\'administrateur'
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Succès",
          description: data.message,
          variant: "destructive",
        });
        // Recharger les avis
        const { data: reviewsData } = await supabase.functions.invoke('admin-reviews', {
          body: { action: 'list', status: statusFilter, limit: 100 }
        });
        if (reviewsData?.success) {
          setReviews(reviewsData.reviews);
        }
      }
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter l'avis",
        variant: "destructive",
      });
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  if (loading) {
    return <div className="p-6">Chargement des avis...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Avis & Notes</h1>
        <p className="text-muted-foreground">Modération des avis clients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total avis</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount('pending')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount('approved')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.length > 0 
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                : '0'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <div className="flex space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un avis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvés</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-start space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(review.client_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{review.client_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Service: {review.service_name} avec {review.provider_name}
                        </p>
                      </div>
                      {getStatusBadge(review.status)}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex">{renderStars(review.rating)}</div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    <p className="text-sm">{review.comment}</p>
                    
                    {review.status === 'pending' && (
                      <div className="flex space-x-2 pt-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprove(review.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approuver
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleReject(review.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeter
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredReviews.length === 0 && (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Aucun avis trouvé
              </p>
              <p className="text-sm text-muted-foreground">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReviews;