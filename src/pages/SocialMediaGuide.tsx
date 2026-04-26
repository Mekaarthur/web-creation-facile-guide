import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOComponent from "@/components/SEOComponent";
import PostExamples from "@/components/PostExamples";
import ImageGenerator from "@/components/ImageGenerator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Heart, 
  MessageCircle, 
  Share2, 
  Camera, 
  FileText,
  Target,
  Clock,
  Lightbulb,
  CheckCircle
} from "lucide-react";

const SocialMediaGuide = () => {
  const linkedinPostTemplates = [
    {
      type: "Story Personnel",
      template: `🏠 [EMOJI PERTINENT]

[ACCROCHE PERSONNELLE - 1 ligne qui interpelle]

[HISTOIRE COURTE - 2-3 phrases sur un défi client résolu]

💡 La leçon : [INSIGHT CLÉ EN 1 PHRASE]

[QUESTION POUR ENGAGEMENT]

---
#ChargeMetale #AssistanceFamiliale #Bikawo #Delegation #VieDeParent`,
      example: `🏠 Cette semaine, Sarah m'a dit : "Je dormais enfin !"

Maman de 2 enfants, elle jonglait entre réunions Zoom et devoirs. L'épuisement total. Depuis qu'elle délègue ménage + garde à notre équipe, elle a retrouvé 8h par semaine pour SA vie.

💡 La leçon : Déléguer n'est pas un échec, c'est un acte d'amour envers soi.

Et vous, quel serait votre premier "oui" à vous-même ? 👇

---
#ChargeMetale #AssistanceFamiliale #Bikawo #Delegation #VieDeParent`
    },
    {
      type: "Conseil Expert",
      template: `📚 [TITRE CONSEIL - Maximum 8 mots]

[PROBLÈME IDENTIFIÉ - 1 phrase]

Voici ma méthode en [X] étapes :

1️⃣ [ÉTAPE 1]
2️⃣ [ÉTAPE 2] 
3️⃣ [ÉTAPE 3]

✅ Résultat : [BÉNÉFICE CONCRET]

[CTA DOUX]

---
[3-5 HASHTAGS PERTINENTS]`,
      example: `📚 Comment déléguer sans culpabiliser en 3 étapes

Vous pensez que "personne ne le fera aussi bien que moi" ?

Voici ma méthode testée avec +500 familles :

1️⃣ Commencez PETIT : Déléguez 1 tâche non-critique (ex: courses)
2️⃣ Définissez le "assez bien" : 80% de votre standard = victoire 
3️⃣ Mesurez le TEMPS récupéré : Qu'allez-vous en faire ?

✅ Résultat : Nos clients récupèrent en moyenne 6h/semaine pour l'essentiel.

Quelle tâche pourriez-vous déléguer cette semaine ? 

---
#Delegation #ChargeMetale #OrganisationFamiliale #Bikawo`
    },
    {
      type: "Statistique Choc",
      template: `📊 [CHIFFRE MARQUANT + CONTEXTE]

[EXPLICATION DU PROBLÈME - 2 phrases]

Chez Bikawo, nous observons :
• [STAT 1]
• [STAT 2] 
• [STAT 3]

[SOLUTION PROPOSÉE]

[QUESTION/CTA]

---
[HASHTAGS]`,
      example: `📊 73% des mères françaises souffrent de charge mentale invisible

Elles gèrent en moyenne 22 tâches mentales par jour : RDV médecin, liste courses, devoirs, activités... Un vrai 2ème travail non-rémunéré.

Chez Bikawo, nous observons :
• 89% de nos clientes retrouvent confiance en 30 jours
• 6h/semaine récupérées en moyenne
• 0% de culpabilité après 3 mois de délégation

Notre mission : transformer cette charge en sérénité partagée.

Reconnaissez-vous ces signaux chez vous ? 👇

---
#ChargeMetale #StatistiquesFrance #MamanEpuisee #Bikawo #Solutions`
    }
  ];

  const instagramPostIdeas = [
    {
      type: "Carrousel Conseil",
      slides: [
        "Slide 1: TITRE + Hook visuel",
        "Slide 2-4: Conseils illustrés", 
        "Slide 5: Call-to-action + branding"
      ],
      caption: `[TITRE EN EMOJIS] 
      
[INTRODUCTION COURTE]

Swipe pour découvrir 👉

[HASHTAGS - 15-20 max]
[LOCALISATION]`,
      example: {
        title: "🧠 5 SIGNES DE CHARGE MENTALE",
        slides: [
          "Vous pensez aux courses pendant une réunion ?",
          "Vous préparez mentalement le lendemain avant de dormir ?", 
          "Votre famille vous demande où sont LEURS affaires ?",
          "Vous gérez les RDV de toute la famille ?",
          "STOP ! Il est temps de déléguer 💙"
        ]
      }
    },
    {
      type: "Behind-the-scenes",
      description: "Photos équipe, intervention, coulisses",
      caption: `[DESCRIPTION ACTIVITÉ] 

[ANECDOTE OU APPRENTISSAGE]

[ENGAGEMENT] Tagguez quelqu'un qui a besoin de cette aide ! 👇

#BehindTheScenes #EquipeBikawo #[VILLE] #ServicesADomicile`
    },
    {
      type: "Témoignage Client",
      format: "Photo client + citation overlay",
      caption: `💬 "Citation marquante du témoignage"

[NOM CLIENT] partage son expérience Bikawo ✨

[RÉSUMÉ BÉNÉFICES EN 2-3 PHRASES]

Et vous, prêt(e) à retrouver du temps pour l'essentiel ? 

#TemoignageClient #AvisClient #BikawoExperience #[VILLE]`
    }
  ];

  const contentCalendar = [
    { jour: "Lundi", theme: "Motivation Week", format: "Story inspirante LinkedIn", hashtags: "#LundiMotivation #ChargeMetale" },
    { jour: "Mardi", theme: "Tip Tuesday", format: "Conseil pratique IG carrousel", hashtags: "#TipTuesday #ConseilOrganisation" },
    { jour: "Mercredi", theme: "Behind-the-scenes", format: "Story/Post équipe", hashtags: "#BehindTheScenes #EquipeBikawo" },
    { jour: "Jeudi", theme: "Testimonial Thursday", format: "Témoignage client", hashtags: "#TemoignageClient #JeudiTemoignage" },
    { jour: "Vendredi", theme: "Feel Good Friday", format: "Résultat/Success story", hashtags: "#VendrediPositif #SuccessStory" },
    { jour: "Weekend", theme: "Repos", format: "Contenu famille/détente", hashtags: "#WeekendFamille #TempsLibre" }
  ];

  return (
    <div className="min-h-screen">
      <SEOComponent 
        title="Guide Réseaux Sociaux - LinkedIn & Instagram | Bikawo"
        description="Guide complet pour alimenter et développer votre présence sur LinkedIn et Instagram. Templates, calendrier éditorial et stratégie de contenu."
        keywords="réseaux sociaux, linkedin, instagram, contenu, marketing digital, templates posts"
      />
      <Navbar />
      <div className="pt-16 lg:pt-20 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Guide Réseaux Sociaux Bikawo
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              De zéro à expert : alimentez LinkedIn et Instagram pour développer votre visibilité et attirer des clients qualifiés
            </p>
          </div>

          <Tabs defaultValue="examples" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="examples">Exemples</TabsTrigger>
              <TabsTrigger value="generator">Images</TabsTrigger>
              <TabsTrigger value="strategy">Stratégie</TabsTrigger>
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
              <TabsTrigger value="calendar">Planning</TabsTrigger>
            </TabsList>

            <TabsContent value="examples" className="space-y-6">
              <PostExamples />
            </TabsContent>

            <TabsContent value="generator" className="space-y-6">
              <ImageGenerator />
            </TabsContent>

            <TabsContent value="strategy" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      Objectifs LinkedIn
                    </CardTitle>
                    <CardDescription>Positionnement expert et génération de leads B2B</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Établir votre expertise charge mentale</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Attirer dirigeants d'entreprise (services B2B)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Réseauter avec partenaires potentiels</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Partager success stories et insights</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-pink-600" />
                      Objectifs Instagram
                    </CardTitle>
                    <CardDescription>Humanisation de la marque et clients B2C</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Montrer le côté humain de Bikawo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Toucher parents et familles directement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Créer une communauté engagée</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Générer du bouche-à-oreille visuel</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Métriques de Succès
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-2">5-10%</div>
                      <div className="text-sm text-muted-foreground">Taux d'engagement LinkedIn</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-pink-600 mb-2">3-5%</div>
                      <div className="text-sm text-muted-foreground">Taux d'engagement Instagram</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-2">10+</div>
                      <div className="text-sm text-muted-foreground">Leads mensuels réseaux sociaux</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="linkedin" className="space-y-6">
              <div className="space-y-6">
                {linkedinPostTemplates.map((template, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Template: {template.type}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Structure:</h4>
                        <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                          {template.template}
                        </pre>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2 text-blue-800">Exemple concret:</h4>
                        <pre className="text-sm whitespace-pre-wrap">
                          {template.example}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>📋 Checklist LinkedIn Post Parfait</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Hook dans les 125 premiers caractères</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Histoire personnelle ou insight</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Valeur ajoutée claire</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Question pour engagement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">3-5 hashtags pertinents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Publier entre 8h-10h ou 17h-19h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="instagram" className="space-y-6">
              <div className="space-y-6">
                {instagramPostIdeas.map((idea, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-pink-600" />
                        Format: {idea.type}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {idea.slides && (
                        <div className="bg-pink-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Structure carrousel:</h4>
                          <ul className="space-y-1 text-sm">
                            {idea.slides.map((slide, i) => (
                              <li key={i}>• {slide}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {idea.example && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Exemple: {idea.example.title}</h4>
                          <ul className="space-y-1 text-sm">
                            {idea.example.slides.map((slide, i) => (
                              <li key={i}>Slide {i + 1}: {slide}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Caption type:</h4>
                        <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                          {idea.caption}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>📸 Ideas de Contenu Visual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Photos à prendre:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Équipe en action (avec autorisation)</li>
                        <li>• Avant/après organisation maison</li>
                        <li>• Citations motivantes sur charge mentale</li>
                        <li>• Moments de vie équipe</li>
                        <li>• Coulisses formations/recrutement</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Stories quotidiennes:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Tips express organisation</li>
                        <li>• Sondages engagement audience</li>
                        <li>• Réponses FAQ clients</li>
                        <li>• Highlights services</li>
                        <li>• Republication témoignages</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Planning Hebdomadaire
                  </CardTitle>
                  <CardDescription>Routine de publication optimisée</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contentCalendar.map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{day.jour}</div>
                          <div className="text-sm text-muted-foreground">{day.theme}</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm">{day.format}</div>
                        </div>
                        <div className="flex-1">
                          <Badge variant="outline" className="text-xs">{day.hashtags}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🕐 Horaires Optimaux de Publication</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3 text-blue-600">LinkedIn</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• <strong>Lundi-Vendredi:</strong> 8h-10h (avant travail)</li>
                        <li>• <strong>Mardi-Jeudi:</strong> 17h-19h (après travail)</li>
                        <li>• <strong>Éviter:</strong> Weekend et vacances scolaires</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3 text-pink-600">Instagram</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• <strong>Semaine:</strong> 11h-13h et 19h-21h</li>
                        <li>• <strong>Weekend:</strong> 10h-12h et 14h-16h</li>
                        <li>• <strong>Stories:</strong> Quotidien 9h et 18h</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tools" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-600" />
                      Outils de Création
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Canva Pro</span>
                      <Badge variant="secondary">Design posts</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Later / Buffer</span>
                      <Badge variant="secondary">Programmation</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Unsplash / Pexels</span>
                      <Badge variant="secondary">Photos libres</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>ChatGPT / Claude</span>
                      <Badge variant="secondary">Aide rédaction</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-600" />
                      Outils d'Analyse
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>LinkedIn Analytics</span>
                      <Badge className="bg-green-100 text-green-800">Gratuit</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Instagram Insights</span>
                      <Badge className="bg-green-100 text-green-800">Gratuit</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Hootsuite Analytics</span>
                      <Badge variant="secondary">Premium</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Sprout Social</span>
                      <Badge variant="secondary">Premium</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>🎯 Plan d'Action Première Semaine</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border rounded bg-blue-50">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      <span>Optimiser profil LinkedIn + Instagram (bio, photo, bannière)</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded bg-green-50">
                      <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <span>Créer 5 posts avec templates fournis</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded bg-purple-50">
                      <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      <span>Installer outil de programmation (Later/Buffer)</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded bg-orange-50">
                      <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                      <span>Prendre 10 photos équipe/coulisses</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded bg-pink-50">
                      <div className="w-6 h-6 bg-pink-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
                      <span>Programmer 1 semaine de contenu</span>
                    </div>
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

export default SocialMediaGuide;