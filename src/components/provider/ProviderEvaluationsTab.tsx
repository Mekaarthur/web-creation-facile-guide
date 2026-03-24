import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: { first_name: string; last_name: string } | null;
}

interface ProviderEvaluationsTabProps {
  reviews: Review[];
}

const ProviderEvaluationsTab = ({ reviews }: ProviderEvaluationsTabProps) => {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Avis clients</CardTitle>
        <CardDescription>Retours et évaluations de vos clients</CardDescription>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">Aucun avis disponible pour le moment.</p>
        ) : (
          <ul className="space-y-4">
            {reviews.map(review => (
              <li key={review.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {review.profiles?.first_name} {review.profiles?.last_name}
                  </p>
                </div>
                <p className="text-muted-foreground mb-2">{review.comment}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(review.created_at), 'PPPP', { locale: fr })}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ProviderEvaluationsTab;
