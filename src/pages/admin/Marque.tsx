import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Palette, 
  Save, 
  Upload, 
  Eye, 
  Type, 
  Image as ImageIcon,
  Download,
  RefreshCw,
  Zap,
  Monitor,
  Smartphone,
  FileText
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BrandSettings {
  identity: {
    brand_name: string;
    tagline: string;
    description: string;
    logo_url?: string;
    favicon_url?: string;
    brand_color_primary: string;
    brand_color_secondary: string;
    brand_color_accent: string;
  };
  visual: {
    font_primary: string;
    font_secondary: string;
    border_radius: string;
    shadows: boolean;
    animations: boolean;
  };
  content: {
    welcome_message: string;
    about_text: string;
    contact_info: string;
    terms_url?: string;
    privacy_url?: string;
  };
}

const AdminMarque = () => {
  const [settings, setSettings] = useState<BrandSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const { toast } = useToast();

  useEffect(() => {
    // Mock data
    setTimeout(() => {
      setSettings({
        identity: {
          brand_name: 'Bikawo',
          tagline: 'Services à domicile de confiance',
          description: 'Bikawo connecte les particuliers avec des prestataires de services qualifiés pour tous leurs besoins à domicile.',
          logo_url: '/api/placeholder/200/80',
          favicon_url: '/api/placeholder/32/32',
          brand_color_primary: '#e65100',
          brand_color_secondary: '#f5f5f4',
          brand_color_accent: '#f97316'
        },
        visual: {
          font_primary: 'Poppins',
          font_secondary: 'Inter',
          border_radius: '0.75rem',
          shadows: true,
          animations: true
        },
        content: {
          welcome_message: 'Bienvenue sur Bikawo, votre plateforme de services à domicile !',
          about_text: 'Fondée en 2024, Bikawo révolutionne les services à domicile en connectant directement les particuliers avec des prestataires qualifiés.',
          contact_info: 'Pour toute question, contactez-nous à contact@bikawo.com ou au 01 23 45 67 89',
          terms_url: 'https://bikawo.com/terms',
          privacy_url: 'https://bikawo.com/privacy'
        }
      });
      setLoading(false);
    }, 1000);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Identité de marque sauvegardée",
        description: "Les modifications ont été appliquées avec succès.",
      });
      setSaving(false);
    }, 1500);
  };

  const updateSetting = (category: keyof BrandSettings, key: string, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    });
  };

  const handleFileUpload = async (type: 'logo' | 'favicon', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(filePath);

      updateSetting('identity', type === 'logo' ? 'logo_url' : 'favicon_url', data.publicUrl);

      toast({
        title: `${type === 'logo' ? 'Logo' : 'Favicon'} téléchargé`,
        description: "Le fichier a été téléchargé avec succès.",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erreur d'upload",
        description: "Impossible de télécharger le fichier.",
        variant: "destructive",
      });
    }
  };

  const generateBrandKit = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-brand-kit', {
        body: { settings }
      });

      if (error) throw error;

      // Download the generated file
      const link = document.createElement('a');
      link.href = data.download_url;
      link.download = 'bikawo-brand-kit.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Kit de marque généré",
        description: "Votre kit de marque est prêt à télécharger.",
      });
    } catch (error) {
      console.error('Error generating brand kit:', error);
      toast({
        title: "Erreur de génération",
        description: "Impossible de générer le kit de marque.",
        variant: "destructive",
      });
    }
  };

  if (loading || !settings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Identité de Marque</h1>
            <p className="text-muted-foreground">Personnalisez l'apparence de votre plateforme</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="w-full h-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="w-full h-3 bg-muted animate-pulse rounded" />
                  <div className="w-3/4 h-3 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Identité de Marque</h1>
          <p className="text-muted-foreground">Personnalisez l'apparence de votre plateforme</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={generateBrandKit}>
            <Download className="w-4 h-4 mr-2" />
            Kit de marque
          </Button>
          <Button 
            variant="outline"
            onClick={() => setPreviewMode(previewMode === 'desktop' ? 'mobile' : 'desktop')}
          >
            {previewMode === 'desktop' ? (
              <>
                <Smartphone className="w-4 h-4 mr-2" />
                Vue mobile
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4 mr-2" />
                Vue desktop
              </>
            )}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Palette className="w-4 h-4 mr-2" />
              Couleurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-1">
              <div 
                className="w-6 h-6 rounded-full border"
                style={{ backgroundColor: settings.identity.brand_color_primary }}
              />
              <div 
                className="w-6 h-6 rounded-full border"
                style={{ backgroundColor: settings.identity.brand_color_secondary }}
              />
              <div 
                className="w-6 h-6 rounded-full border"
                style={{ backgroundColor: settings.identity.brand_color_accent }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Type className="w-4 h-4 mr-2" />
              Typographie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div style={{ fontFamily: settings.visual.font_primary }}>
                {settings.visual.font_primary}
              </div>
              <div style={{ fontFamily: settings.visual.font_secondary }} className="text-muted-foreground">
                {settings.visual.font_secondary}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ImageIcon className="w-4 h-4 mr-2" />
              Ressources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">
              {settings.identity.logo_url ? 'Logo OK' : 'Pas de logo'}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Expérience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={settings.visual.animations ? "default" : "outline"}>
              {settings.visual.animations ? 'Animé' : 'Statique'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="identity" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="identity">Identité</TabsTrigger>
              <TabsTrigger value="visual">Visuel</TabsTrigger>
              <TabsTrigger value="content">Contenu</TabsTrigger>
            </TabsList>

            <TabsContent value="identity">
              <Card>
                <CardHeader>
                  <CardTitle>Identité de Marque</CardTitle>
                  <CardDescription>
                    Définissez les éléments principaux de votre marque
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand_name">Nom de la marque</Label>
                      <Input
                        id="brand_name"
                        value={settings.identity.brand_name}
                        onChange={(e) => updateSetting('identity', 'brand_name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tagline">Slogan</Label>
                      <Input
                        id="tagline"
                        value={settings.identity.tagline}
                        onChange={(e) => updateSetting('identity', 'tagline', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={settings.identity.description}
                      onChange={(e) => updateSetting('identity', 'description', e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Logo principal</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                        {settings.identity.logo_url ? (
                          <img 
                            src={settings.identity.logo_url} 
                            alt="Logo" 
                            className="max-h-16 mx-auto mb-2"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        )}
                        <label htmlFor="logo-upload">
                          <Button variant="outline" size="sm" asChild>
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              Télécharger
                            </span>
                          </Button>
                        </label>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload('logo', e)}
                          className="hidden"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Favicon</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                        {settings.identity.favicon_url ? (
                          <img 
                            src={settings.identity.favicon_url} 
                            alt="Favicon" 
                            className="w-8 h-8 mx-auto mb-2"
                          />
                        ) : (
                          <div className="w-8 h-8 mx-auto mb-2 bg-muted rounded" />
                        )}
                        <label htmlFor="favicon-upload">
                          <Button variant="outline" size="sm" asChild>
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              Télécharger
                            </span>
                          </Button>
                        </label>
                        <input
                          id="favicon-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload('favicon', e)}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Label>Palette de couleurs</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary_color">Couleur primaire</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="primary_color"
                            type="color"
                            value={settings.identity.brand_color_primary}
                            onChange={(e) => updateSetting('identity', 'brand_color_primary', e.target.value)}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={settings.identity.brand_color_primary}
                            onChange={(e) => updateSetting('identity', 'brand_color_primary', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="secondary_color">Couleur secondaire</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="secondary_color"
                            type="color"
                            value={settings.identity.brand_color_secondary}
                            onChange={(e) => updateSetting('identity', 'brand_color_secondary', e.target.value)}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={settings.identity.brand_color_secondary}
                            onChange={(e) => updateSetting('identity', 'brand_color_secondary', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="accent_color">Couleur d'accent</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="accent_color"
                            type="color"
                            value={settings.identity.brand_color_accent}
                            onChange={(e) => updateSetting('identity', 'brand_color_accent', e.target.value)}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={settings.identity.brand_color_accent}
                            onChange={(e) => updateSetting('identity', 'brand_color_accent', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visual">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres Visuels</CardTitle>
                  <CardDescription>
                    Personnalisez l'apparence visuelle de votre plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Police principale</Label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={settings.visual.font_primary}
                        onChange={(e) => updateSetting('visual', 'font_primary', e.target.value)}
                      >
                        <option value="Poppins">Poppins</option>
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Montserrat">Montserrat</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Police secondaire</Label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={settings.visual.font_secondary}
                        onChange={(e) => updateSetting('visual', 'font_secondary', e.target.value)}
                      >
                        <option value="Inter">Inter</option>
                        <option value="Poppins">Poppins</option>
                        <option value="System UI">System UI</option>
                        <option value="Arial">Arial</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="border_radius">Arrondi des bordures</Label>
                    <Input
                      id="border_radius"
                      value={settings.visual.border_radius}
                      onChange={(e) => updateSetting('visual', 'border_radius', e.target.value)}
                      placeholder="0.75rem"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Ombres</Label>
                        <p className="text-sm text-muted-foreground">Activer les ombres sur les éléments</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.visual.shadows}
                        onChange={(e) => updateSetting('visual', 'shadows', e.target.checked)}
                        className="rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Animations</Label>
                        <p className="text-sm text-muted-foreground">Activer les animations et transitions</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.visual.animations}
                        onChange={(e) => updateSetting('visual', 'animations', e.target.checked)}
                        className="rounded"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <CardTitle>Contenu Editorial</CardTitle>
                  <CardDescription>
                    Gérez les textes et contenus de votre plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="welcome_message">Message d'accueil</Label>
                    <Textarea
                      id="welcome_message"
                      value={settings.content.welcome_message}
                      onChange={(e) => updateSetting('content', 'welcome_message', e.target.value)}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="about_text">À propos</Label>
                    <Textarea
                      id="about_text"
                      value={settings.content.about_text}
                      onChange={(e) => updateSetting('content', 'about_text', e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact_info">Informations de contact</Label>
                    <Textarea
                      id="contact_info"
                      value={settings.content.contact_info}
                      onChange={(e) => updateSetting('content', 'contact_info', e.target.value)}
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="terms_url">Lien CGU</Label>
                      <Input
                        id="terms_url"
                        value={settings.content.terms_url || ''}
                        onChange={(e) => updateSetting('content', 'terms_url', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="privacy_url">Lien Confidentialité</Label>
                      <Input
                        id="privacy_url"
                        value={settings.content.privacy_url || ''}
                        onChange={(e) => updateSetting('content', 'privacy_url', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Aperçu */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Aperçu {previewMode}
              </CardTitle>
              <CardDescription>
                Prévisualisation en temps réel de vos modifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className={`border rounded-lg p-4 space-y-4 ${
                  previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''
                }`}
                style={{
                  '--primary': settings.identity.brand_color_primary,
                  '--secondary': settings.identity.brand_color_secondary,
                  '--accent': settings.identity.brand_color_accent,
                  borderRadius: settings.visual.border_radius,
                  fontFamily: settings.visual.font_primary
                } as any}
              >
                {/* Header preview */}
                <div className="flex items-center space-x-2">
                  {settings.identity.logo_url && (
                    <img 
                      src={settings.identity.logo_url} 
                      alt="Logo" 
                      className="h-8"
                    />
                  )}
                  <div>
                    <h3 
                      className="font-bold" 
                      style={{ 
                        color: settings.identity.brand_color_primary,
                        fontFamily: settings.visual.font_primary 
                      }}
                    >
                      {settings.identity.brand_name}
                    </h3>
                    <p 
                      className="text-xs"
                      style={{ fontFamily: settings.visual.font_secondary }}
                    >
                      {settings.identity.tagline}
                    </p>
                  </div>
                </div>
                
                {/* Button preview */}
                <button 
                  className="px-4 py-2 text-white text-sm font-medium rounded transition-colors"
                  style={{ 
                    backgroundColor: settings.identity.brand_color_primary,
                    borderRadius: settings.visual.border_radius,
                    fontFamily: settings.visual.font_primary,
                    boxShadow: settings.visual.shadows ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                    transform: settings.visual.animations ? 'scale(1)' : 'none',
                    transition: settings.visual.animations ? 'all 0.2s ease' : 'none'
                  }}
                >
                  Bouton primaire
                </button>
                
                {/* Card preview */}
                <div 
                  className="p-3 border"
                  style={{ 
                    borderRadius: settings.visual.border_radius,
                    backgroundColor: settings.identity.brand_color_secondary,
                    boxShadow: settings.visual.shadows ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <p 
                    className="text-sm"
                    style={{ fontFamily: settings.visual.font_secondary }}
                  >
                    {settings.content.welcome_message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminMarque;