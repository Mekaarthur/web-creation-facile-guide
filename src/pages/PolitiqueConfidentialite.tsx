import { ArrowLeft, Shield, Database, Users, Clock, Lock, UserCheck, Mail, ExternalLink, Eye, FileEdit, Ban, Download, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PolitiqueConfidentialite = () => {
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
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Politique de Confidentialité
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Protection et gestion de vos données personnelles sur la plateforme Bikawo
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Dernière mise à jour : 20 janvier 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Introduction */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-8">
              <p className="text-lg text-foreground leading-relaxed">
                Ce document a pour objectif de vous expliquer comment vos données personnelles sont collectées 
                et utilisées sur la plateforme Bikawo. <strong>La protection de vos informations personnelles 
                constitue une priorité absolue pour nous.</strong>
              </p>
            </CardContent>
          </Card>

          {/* Section 1: Termes et définitions */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileEdit className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    1. Termes et définitions
                  </h2>
                  <p className="text-muted-foreground">
                    Les termes utilisés dans cette politique de confidentialité
                  </p>
                </div>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="definitions">
                  <AccordionTrigger className="text-foreground font-medium">
                    Voir les définitions complètes
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-4">
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p><strong className="text-primary">« Client »</strong> : toute personne (particulier ou entreprise) qui utilise notre Plateforme pour entrer en contact avec un Partenaire et bénéficier d'un service.</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p><strong className="text-primary">« Commande »</strong> : demande de service effectuée par un Client sur la Plateforme.</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p><strong className="text-primary">« Compte »</strong> : espace personnel et sécurisé de chaque Utilisateur sur notre Plateforme.</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p><strong className="text-primary">« Partenaire »</strong> : professionnel indépendant (société ou auto-entrepreneur) inscrit sur notre Plateforme et qualifié pour réaliser les services proposés.</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p><strong className="text-primary">« Plateforme »</strong> : interface en ligne de Bikawo, accessible via le Site, qui permet la mise en relation et la fourniture des Services.</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p><strong className="text-primary">« Prestation »</strong> : service à domicile (ménage, entretien ou autre) réalisé par un Partenaire au domicile d'un Client.</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p><strong className="text-primary">« Réglementation »</strong> : ensemble des textes applicables en matière de protection des données, notamment le RGPD (Règlement européen 2016/679) et la loi Informatique et Libertés du 6 janvier 1978.</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p><strong className="text-primary">« Bikawo » ou « nous »</strong> : auto-entreprise Bikawo, responsable du traitement de vos données, SIRET n° 880 491 436, située au 231 rue Saint-Honoré, 75001 Paris.</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="mt-6 flex flex-wrap gap-4 text-sm">
                <a 
                  href="https://www.cnil.fr/fr/glossaire" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Glossaire CNIL
                </a>
                <a 
                  href="https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX%3A32016R0679" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Texte complet du RGPD
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Responsable des données */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <UserCheck className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    2. Responsable de vos données personnelles
                  </h2>
                  <p className="text-muted-foreground">
                    Qui gère et protège vos informations
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-foreground leading-relaxed">
                  Dans la majorité des cas, <strong>Bikawo est le responsable du traitement</strong> de vos données sur la Plateforme.
                </p>
                <p className="text-foreground leading-relaxed">
                  Toutefois, pour certaines opérations spécifiques, Bikawo et les Partenaires agissent ensemble en tant que 
                  <strong> coresponsables du traitement</strong>, conformément au RGPD. Cette configuration découle du mode 
                  de fonctionnement de notre service.
                </p>
                <div className="bg-muted/30 rounded-xl p-6 mt-4">
                  <p className="text-muted-foreground">
                    En application de l'article 26 du RGPD, cette répartition des responsabilités a été officialisée 
                    dans un accord accessible sur demande.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Données collectées */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    3. Informations collectées
                  </h2>
                  <p className="text-muted-foreground">
                    Quelles données sont recueillies et pourquoi
                  </p>
                </div>
              </div>
              
              <p className="text-foreground leading-relaxed mb-6">
                Nous recueillons principalement vos données lorsque vous utilisez nos Services, car certaines informations 
                sont indispensables à leur bon fonctionnement.
              </p>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="clients">
                  <AccordionTrigger className="text-foreground font-medium">
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Données des Clients
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <strong>Identité :</strong> civilité, nom, prénom, dénomination sociale (si entreprise)
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <strong>Contact :</strong> email, adresse complète, téléphone
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <strong>Paiement :</strong> coordonnées bancaires (traitées via notre partenaire Stripe)
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="partenaires">
                  <AccordionTrigger className="text-foreground font-medium">
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-accent-foreground" />
                      Données des Partenaires
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <strong>Identité :</strong> civilité, nom, prénom, numéro de carte d'identité, date de naissance
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <strong>Statut professionnel :</strong> SIRET, extrait Kbis, numéro RCS, TVA intracommunautaire, agrément SAP
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <strong>Contact :</strong> adresse ou siège social, email, téléphone
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <strong>Banque :</strong> RIB
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <strong>Qualifications :</strong> diplômes, certifications, compétences professionnelles
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <strong>Localisation :</strong> géolocalisation du Partenaire
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="prospects">
                  <AccordionTrigger className="text-foreground font-medium">
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      Données des Prospects
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <strong>Identité :</strong> civilité, nom, prénom
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <strong>Statut professionnel :</strong> dénomination sociale, numéro RCS, SIRET
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div>
                          <strong>Contact :</strong> adresse postale, email, téléphone
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Section 4: Utilisation des données */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    4. Utilisation de vos données
                  </h2>
                  <p className="text-muted-foreground">
                    Pourquoi et comment nous utilisons vos informations
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Finalité</TableHead>
                      <TableHead className="font-semibold">Données</TableHead>
                      <TableHead className="font-semibold">Base légale</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Inscription et création de Compte</TableCell>
                      <TableCell>Identité, Contact</TableCell>
                      <TableCell>Exécution du contrat (CGU)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Réservation de services</TableCell>
                      <TableCell>Identité, Contact, Transaction</TableCell>
                      <TableCell>Exécution du contrat (CGU)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Réalisation de prestation à domicile</TableCell>
                      <TableCell>Identité, Contact, Localisation</TableCell>
                      <TableCell>Exécution du contrat (CGU)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Mise en relation optimisée</TableCell>
                      <TableCell>Identité, Qualifications, Profil</TableCell>
                      <TableCell>Intérêt légitime de Bikawo</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Paiement et facturation</TableCell>
                      <TableCell>Identité, Contact, Banque</TableCell>
                      <TableCell>Exécution du contrat (CGU)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Communication et offres</TableCell>
                      <TableCell>Identité, Contact, Préférences</TableCell>
                      <TableCell>Intérêt légitime de Bikawo</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Accès aux données */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Users className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    5. Qui peut accéder à vos données ?
                  </h2>
                  <p className="text-muted-foreground">
                    Destinataires et partenaires
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-muted/30 rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-3">Prestataires techniques</h3>
                  <p className="text-muted-foreground">
                    Pour assurer le fonctionnement de nos Services, nous utilisons différentes solutions technologiques. 
                    Par exemple, <strong>Stripe</strong>, notre prestataire de paiement agréé, traite les informations bancaires 
                    pour permettre les transactions sur la Plateforme.
                  </p>
                </div>

                <div className="bg-muted/30 rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-3">Transmission aux Partenaires</h3>
                  <p className="text-muted-foreground">
                    Lorsqu'un Client réserve un service, Bikawo communique au Partenaire concerné les informations 
                    nécessaires à la réalisation de la prestation (nom, prénom, photo, adresse). Dans ces circonstances, 
                    Bikawo et le Partenaire sont coresponsables du traitement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Conservation */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    6. Durée de conservation
                  </h2>
                  <p className="text-muted-foreground">
                    Combien de temps conservons-nous vos données
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-foreground leading-relaxed">
                  Vos données sont conservées tant que vous entretenez une <strong>relation active</strong> avec Bikawo.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-primary mb-2">5 ans</div>
                    <p className="text-sm text-muted-foreground">
                      Conservation après fin de relation<br />(obligations légales et fiscales)
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-primary mb-2">3 ans</div>
                    <p className="text-sm text-muted-foreground">
                      Conservation pour les Prospects<br />(à partir de la collecte)
                    </p>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm mt-4">
                  La relation prend fin si : vous résiliez les CGU, vous demandez la suppression de votre Compte, 
                  ou votre Compte reste inactif pendant 5 ans.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 7: Sécurité */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Lock className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    7. Protection de vos données
                  </h2>
                  <p className="text-muted-foreground">
                    Mesures de sécurité mises en place
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6">
                <p className="text-foreground leading-relaxed">
                  Bikawo déploie l'ensemble des <strong>mesures techniques et organisationnelles</strong> nécessaires 
                  pour protéger vos droits et libertés, notamment en sécurisant vos données contre tout accès non autorisé, 
                  toute destruction, perte, modification ou divulgation.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <span>Outils et logiciels sécurisés par mots de passe</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <span>Accès strictement contrôlé aux données sensibles</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <span>Partenaires de paiement certifiés (Stripe)</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 8: Vos droits */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    8. Vos droits
                  </h2>
                  <p className="text-muted-foreground">
                    Ce que le RGPD vous garantit
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Eye className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Droit d'accès</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Savoir quelles informations Bikawo détient sur vous et en obtenir une copie.
                  </p>
                </div>

                <div className="bg-muted/30 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <FileEdit className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Droit de rectification</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Demander la correction de données inexactes ou périmées.
                  </p>
                </div>

                <div className="bg-muted/30 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Ban className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Droit de suppression</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Demander l'effacement de vos données personnelles (« droit à l'oubli »).
                  </p>
                </div>

                <div className="bg-muted/30 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Download className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Droit à la portabilité</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Recevoir vos données dans un format structuré et exploitable.
                  </p>
                </div>

                <div className="bg-muted/30 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Ban className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Droit d'opposition</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Vous opposer à l'utilisation de vos données par Bikawo.
                  </p>
                </div>

                <div className="bg-muted/30 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Réclamation CNIL</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Saisir la CNIL si vous estimez que vos droits ne sont pas respectés.
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-muted/30 rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-3">Comment exercer vos droits ?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <span><strong>Justification d'identité</strong> requise pour chaque demande</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <span><strong>Délai de réponse</strong> : généralement 1 mois (extensible à 2 mois si complexe)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <span><strong>Gratuité</strong> par principe (sauf demandes excessives)</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 9: Évolution */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <FileEdit className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    9. Évolution de cette politique
                  </h2>
                  <p className="text-muted-foreground">
                    Mises à jour et notifications
                  </p>
                </div>
              </div>

              <p className="text-foreground leading-relaxed">
                Nous pouvons actualiser régulièrement cette politique de confidentialité en raison de l'évolution 
                de nos technologies, de nos Services ou de la réglementation applicable. Le cas échéant, vous serez 
                informé des modifications par email ou via une notification sur notre Site, <strong>au minimum 8 jours 
                avant l'entrée en vigueur</strong> d'une modification importante.
              </p>
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
                    Nous contacter
                  </h2>
                  <p className="text-muted-foreground">
                    Pour toute question sur vos données personnelles
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
              
              <p className="mt-4 text-sm text-muted-foreground">
                Nous nous engageons à vous répondre dans les meilleurs délais.
              </p>
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

export default PolitiqueConfidentialite;
