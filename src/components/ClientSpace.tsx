import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, LogIn, Calendar, History, CreditCard, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const ClientSpace = () => {
  const { user } = useAuth();

  return (
    <div className="bg-gradient-to-r from-primary/5 to-secondary/5 py-8">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <User className="h-6 w-6 text-primary" />
              Espace Client
            </CardTitle>
            <CardDescription className="text-lg">
              {user ? 
                "Gérez vos réservations, factures et profitez de vos récompenses" : 
                "Accédez à votre espace personnel pour gérer toutes vos prestations"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="grid md:grid-cols-4 gap-4">
                <Link to="/espace-personnel?tab=reservations">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover:bg-primary/10">
                    <Calendar className="h-6 w-6" />
                    <span className="text-sm">Mes Réservations</span>
                  </Button>
                </Link>
                <Link to="/espace-personnel?tab=factures">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover:bg-primary/10">
                    <CreditCard className="h-6 w-6" />
                    <span className="text-sm">Mes Factures</span>
                  </Button>
                </Link>
                <Link to="/espace-personnel?tab=recompenses">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover:bg-primary/10">
                    <Gift className="h-6 w-6" />
                    <span className="text-sm">Mes Récompenses</span>
                  </Button>
                </Link>
                <Link to="/espace-personnel?tab=profil">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover:bg-primary/10">
                    <User className="h-6 w-6" />
                    <span className="text-sm">Mon Profil</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/espace-personnel">
                  <Button className="w-full sm:w-auto flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Se connecter à mon espace
                  </Button>
                </Link>
                <Link to="/espace-personnel">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Créer mon compte client
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientSpace;