import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Download, Eye } from "lucide-react";
import { toast } from "sonner";

const PostExamples = () => {
  const postExamples = [
    {
      platform: "LinkedIn",
      type: "Vision Post",
      title: "Notre mission sans équipe visible",
      content: `🏠 Notre conviction : chaque famille mérite d'avoir accès à des services de qualité à domicile

Aujourd'hui en France, 73% des parents souffrent de charge mentale invisible. Ils jonglent entre travail, enfants, maison... sans répit.

💡 Chez Bikawo, nous croyons que déléguer n'est pas un luxe, c'est une nécessité pour retrouver l'équilibre.

Notre mission ? Transformer cette charge en sérénité partagée.

Et vous, reconnaissez-vous ces signaux d'épuisement chez vous ? 👇

#ChargeMetale #AssistanceFamiliale #Bikawo #Delegation #VieDeParent`,
      imageIdea: "Citation inspirante sur fond coloré avec logo Bikawo",
      format: "1080x1080px, couleurs de votre charte graphique"
    },
    {
      platform: "LinkedIn",
      type: "Conseil Expert",
      title: "Guide pratique - 5 étapes",
      content: `📚 Comment choisir le bon prestataire à domicile en 5 étapes

Vous hésitez à franchir le pas par peur de mal choisir ?

Voici notre méthode testée avec +500 familles :

1️⃣ Définissez VOS priorités (temps/budget/qualité)
2️⃣ Vérifiez assurances et certifications
3️⃣ Demandez 3 références récentes
4️⃣ Testez avec une petite mission d'abord
5️⃣ Évaluez après 2 semaines et ajustez

✅ Résultat : 89% de nos clients trouvent LE prestataire idéal du premier coup.

Quelle étape vous pose le plus de difficultés ? 

#ConseilExpert #ServicesADomicile #Bikawo #ChoixPrestataire`,
      imageIdea: "Infographie avec les 5 étapes, icônes et couleurs cohérentes",
      format: "Carrousel LinkedIn - 5 slides de 1080x1080px"
    },
    {
      platform: "Instagram",
      type: "Carrousel Problème/Solution",
      title: "Tu te reconnais ? 😅",
      content: `🧠 TU TE RECONNAIS ?

Ces 5 situations qui montrent que tu as VRAIMENT besoin d'aide à la maison ⬇️

Swipe pour voir si c'est TON quotidien 👉

❤️ Sauvegarde ce post si ça résonne !

#ChargeMetale #MamanEpuisee #PapaDeborde #AideADomicile #Bikawo #OrganisationFamiliale #VieDeParent #Delegation #TempsPourSoi #EquilibreViePrivee`,
      imageIdea: "5 slides : situations humoristiques + solution Bikawo",
      slides: [
        "Titre : TU TE RECONNAIS ? (fond coloré)",
        "Tu cherches tes clés... dans le frigo ? 🔑❄️", 
        "Tu rêves de vacances... aux toilettes ? 🚽✨",
        "Ta liste de courses fait 3 pages ? 📝📋",
        "Solution : DÉLÈGUE avec Bikawo ! 💙"
      ]
    },
    {
      platform: "Instagram", 
      type: "Before/After",
      title: "Transformation organisation",
      content: `✨ AVANT VS APRÈS Bikawo ✨

📸 Voici ce qui change quand tu délègues intelligemment 

👈 AVANT : Chaos, stress, épuisement
👉 APRÈS : Sérénité, temps retrouvé, énergie

Le secret ? Pas la perfection, mais la DÉLÉGATION ! 

Tu veux ton avant/après ? Raconte-nous ton défi en commentaire 👇

#AvantApres #TransformationVie #Bikawo #Delegation #ChargeMentale #MieuxVivre`,
      imageIdea: "Split screen : côté chaos (listes, stress) vs côté zen (famille souriante)",
      format: "Photo unique 1080x1350px ou carrousel 2 slides"
    },
    {
      platform: "Instagram",
      type: "Citation Motivante", 
      title: "Phrase inspirante",
      content: `💬 "Déléguer n'est pas un échec, c'est un acte d'amour envers soi-même"

Cette phrase de Sarah, maman de 2 enfants, après 3 mois avec Bikawo ✨

Elle a retrouvé 8h par semaine pour SA vie. 8h pour dormir, lire, rire avec ses enfants...

Et toi, tu t'autorises à recevoir de l'aide ? 💙

#Citation #Inspiration #Bikawo #DelegationPositive #AmourDeSoi #MamanInspirante #TemoignageClient`,
      imageIdea: "Belle typo sur fond dégradé + photo discrète de mains qui s'entraident",
      format: "1080x1080px, couleurs douces et apaisantes"
    }
  ];

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Post copié dans le presse-papier !");
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-4">Templates de Posts Prêts à Utiliser</h3>
        <p className="text-muted-foreground">Exemples concrets avec suggestions d'images pour démarrer sans équipe ni bureau</p>
      </div>

      <div className="grid gap-6">
        {postExamples.map((post, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={post.platform === "LinkedIn" ? "default" : "secondary"}>
                    {post.platform}
                  </Badge>
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(post.content)}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copier
                </Button>
              </div>
              <CardDescription>{post.type}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Contenu du post :</h4>
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                  {post.content}
                </pre>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Image suggérée :
                </h4>
                <p className="text-sm text-muted-foreground mb-2">{post.imageIdea}</p>
                {post.format && (
                  <p className="text-xs bg-white/70 px-2 py-1 rounded">
                    Format : {post.format}
                  </p>
                )}
                {post.slides && (
                  <div className="mt-3">
                    <p className="text-xs font-medium mb-1">Slides du carrousel :</p>
                    <ul className="text-xs space-y-1">
                      {post.slides.map((slide, i) => (
                        <li key={i} className="bg-white/70 px-2 py-1 rounded">
                          {slide}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">💡 Conseil Pro</h3>
          <p className="text-sm text-muted-foreground">
            Adaptez ces templates en changeant les détails spécifiques à votre région, 
            vos services ou vos valeurs. L'authenticité prime sur la perfection !
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostExamples;