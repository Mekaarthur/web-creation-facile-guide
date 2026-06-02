import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Props {
  email: string;
}

export function ProviderSignupSuccess({ email }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-elegant p-8">
            <CheckCircle className="mx-auto h-16 w-16 text-success mb-6" />
            <h1 className="text-3xl font-bold text-primary mb-4">
              Candidature envoyée avec succès !
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Merci pour votre intérêt ! Nous avons bien reçu votre candidature
              et vous recontacterons sous 48h.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Un email de confirmation vous a été envoyé à l'adresse : <strong>{email}</strong>
            </p>
            <Button onClick={() => window.location.href = '/'} className="bg-primary hover:bg-primary/90">
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
