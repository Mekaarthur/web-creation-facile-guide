import { ArrowLeft, Mail, Building2, FileText, Shield, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const MentionsLegales = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background py-16">
        <div className="container mx-auto px-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Scale className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Mentions Légales
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Informations légales relatives à l'éditeur du site Bikawo
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Éditeur du site */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Éditeur du site
                  </h2>
                  <p className="text-muted-foreground">
                    Informations sur l'entreprise éditrice
                  </p>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                <p className="text-foreground">
                  Le site <strong className="text-primary">https://bikawo.com/</strong> est édité par <strong>Bikawo</strong>, 
                  entreprise individuelle (auto-entreprise), immatriculée sous le numéro <strong>880 491 436</strong>.
                </p>
                
                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold text-foreground">Siège social :</p>
                  <p className="text-muted-foreground">231 rue Saint-Honoré, 75001 Paris</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activités et déclarations */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <FileText className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Activités et déclarations
                  </h2>
                  <p className="text-muted-foreground">
                    Services à la personne et conformité réglementaire
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <p className="text-foreground leading-relaxed">
                  La société Bikawo exerce à titre exclusif des activités de <strong>services à la personne</strong>, 
                  conformément à sa déclaration effectuée sur la plateforme NOVA auprès de la Direction Départementale 
                  de l'Emploi, du Travail et des Solidarités de Paris (DDETS 75).
                </p>

                <div className="bg-muted/30 rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Conformité réglementaire
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Nos activités sont exercées dans le respect de la réglementation applicable aux services à la personne, notamment :
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                      <span className="text-foreground">
                        L'<strong>arrêté du 17 mars 2015</strong> relatif à l'information préalable du consommateur 
                        sur les prestations de services à la personne
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                      <span className="text-foreground">
                        Les <strong>articles D.7231-1 et suivants</strong> du Code du travail
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Contact
                  </h2>
                  <p className="text-muted-foreground">
                    Pour toute question ou demande d'information
                  </p>
                </div>
              </div>
              
              <a 
                href="mailto:contact@bikawo.com"
                className="inline-flex items-center gap-3 px-6 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
              >
                <Mail className="h-5 w-5" />
                contact@bikawo.com
              </a>
            </CardContent>
          </Card>

          {/* Date de mise à jour */}
          <div className="text-center pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Dernière mise à jour : 20 janvier 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentionsLegales;
