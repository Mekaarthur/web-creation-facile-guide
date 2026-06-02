import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, Download, Wand2, Copy } from "lucide-react";
import { toast } from "sonner";

const ImageGenerator = () => {
  const [apiKey, setApiKey] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const imageTemplates = [
    {
      id: "citation",
      name: "Citation Motivante",
      prompt: `Belle citation motivante avec typographie élégante sur fond dégradé doux, couleurs pastel, style moderne et inspirant, texte lisible, design professionnel pour réseaux sociaux, 1080x1080 pixels`,
      description: "Perfect pour les posts inspirants LinkedIn/Instagram"
    },
    {
      id: "infographie",
      name: "Infographie Conseils",
      prompt: `Infographie moderne et colorée avec 5 étapes numérotées, icônes simples, couleurs vives et professionnelles, layout vertical, style flat design, lisible et engageant, pour conseils pratiques`,
      description: "Idéal pour les carrousels de conseils"
    },
    {
      id: "probleme-solution",
      name: "Problème vs Solution",
      prompt: `Design split screen avant/après, côté gauche chaos et stress avec couleurs sombres, côté droit sérénité avec couleurs douces, style illustration moderne, contraste visuel fort, format carré`,
      description: "Perfect pour montrer la transformation"
    },
    {
      id: "stats",
      name: "Statistique Marquante",
      prompt: `Graphique moderne avec statistique mise en avant, grand chiffre coloré, fond professionnel, style infographie corporate, couleurs de confiance (bleu, vert), design clean et impactant`,
      description: "Pour les posts avec données chiffrées"
    },
    {
      id: "temoignage",
      name: "Template Témoignage",
      prompt: `Template témoignage client avec espace pour citation, design élégant avec guillemets stylisés, couleurs douces et rassurantes, typography professionnelle, format story Instagram 1080x1920`,
      description: "Pour mettre en valeur les avis clients"
    },
    {
      id: "behind-scenes",
      name: "Behind the Scenes",
      prompt: `Template "coulisses" moderne avec style magazine, couleurs dynamiques, layout asymétrique, espace pour texte overlay, feeling authentique et humain, format story`,
      description: "Pour montrer l'envers du décor"
    }
  ];

  const generateImage = async () => {
    if (!apiKey) {
      toast.error("Veuillez entrer votre clé API Runware");
      return;
    }

    const template = imageTemplates.find(t => t.id === selectedTemplate);
    const finalPrompt = customPrompt || template?.prompt || "";

    if (!finalPrompt) {
      toast.error("Veuillez sélectionner un template ou entrer un prompt");
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch("https://api.runware.ai/v1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            taskType: "authentication",
            apiKey: apiKey
          },
          {
            taskType: "imageInference",
            taskUUID: crypto.randomUUID(),
            positivePrompt: finalPrompt + ", ultra high resolution, professional design, social media ready",
            model: "runware:100@1",
            width: 1080,
            height: 1080,
            numberResults: 1,
            outputFormat: "WEBP",
            CFGScale: 1,
            scheduler: "FlowMatchEulerDiscreteScheduler"
          }
        ])
      });

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const imageResult = data.data.find((item: any) => item.taskType === "imageInference");
        if (imageResult && imageResult.imageURL) {
          setGeneratedImage(imageResult.imageURL);
          toast.success("Image générée avec succès !");
        } else {
          toast.error("Erreur lors de la génération de l'image");
        }
      } else {
        toast.error("Aucune image générée");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur de connexion à l'API");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bikawo-social-image-${Date.now()}.webp`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Image téléchargée !");
    } catch (error) {
      toast.error("Erreur lors du téléchargement");
    }
  };

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copié !");
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-4">Générateur d'Images pour Réseaux Sociaux</h3>
        <p className="text-muted-foreground">Créez des visuels professionnels adaptés à vos posts LinkedIn et Instagram</p>
      </div>

      {/* Configuration API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Configuration
          </CardTitle>
          <CardDescription>
            Obtenez votre clé API gratuite sur{" "}
            <a href="https://runware.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              runware.ai
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="password"
            placeholder="Entrez votre clé API Runware"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Templates d'images */}
      <Card>
        <CardHeader>
          <CardTitle>Templates d'Images</CardTitle>
          <CardDescription>Choisissez un template adapté à votre type de contenu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un template d'image" />
            </SelectTrigger>
            <SelectContent>
              {imageTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedTemplate && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Prompt du template :</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const template = imageTemplates.find(t => t.id === selectedTemplate);
                    if (template) copyPrompt(template.prompt);
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {imageTemplates.find(t => t.id === selectedTemplate)?.prompt}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt personnalisé (optionnel) :</label>
            <Textarea
              placeholder="Décrivez l'image que vous souhaitez générer..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide pour utiliser le template sélectionné, ou personnalisez votre prompt
            </p>
          </div>

          <Button 
            onClick={generateImage} 
            disabled={isGenerating || !apiKey}
            className="w-full"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            {isGenerating ? "Génération en cours..." : "Générer l'Image"}
          </Button>
        </CardContent>
      </Card>

      {/* Image générée */}
      {generatedImage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Image Générée
              <Button variant="outline" onClick={downloadImage}>
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <img 
                src={generatedImage} 
                alt="Image générée" 
                className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conseils d'utilisation */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">💡 Conseils pour vos Visuels</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Formats recommandés :</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Posts Instagram : 1080x1080px (carré)</li>
                <li>• Stories Instagram : 1080x1920px (vertical)</li>
                <li>• Posts LinkedIn : 1200x627px (horizontal)</li>
                <li>• Carrousels : 1080x1080px par slide</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Bonnes pratiques :</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Gardez vos couleurs de marque</li>
                <li>• Texte lisible sur mobile</li>
                <li>• Contraste suffisant</li>
                <li>• Logo discret mais visible</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageGenerator;