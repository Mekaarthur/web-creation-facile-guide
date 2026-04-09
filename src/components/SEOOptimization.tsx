import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOOptimizationProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
}

const SEOOptimization = ({ 
  title = "Bikawo - Assistant Personnel à Domicile | Services Famille Paris",
  description = "Assistant personnel à domicile Paris. Garde d'enfants, préparation culinaire / batch cooking, aide seniors, démarches administratives. Un seul prestataire de confiance pour tous vos besoins. Crédit d'impôt 50%.",
  keywords = "assistant personnel, services domicile, garde enfants Paris, préparation culinaire domicile, batch cooking, aide seniors, démarches administratives, conciergerie familiale, prestataire confiance, crédit impôt 50%, Bikawo",
  image = "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png",
  type = "website"
}: SEOOptimizationProps) => {
  const location = useLocation();
  const currentUrl = `https://bikawo.fr${location.pathname}`;
  const fullImageUrl = image.startsWith("http") ? image : `https://bikawo.fr${image}`;

  return (
    <Helmet>
      {/* Titre optimisé avec mots-clés géographiques */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Balises géographiques pour le SEO local */}
      <meta name="geo.region" content="FR-75" />
      <meta name="geo.placename" content="Paris" />
      <meta name="geo.position" content="48.8566;2.3522" />
      <meta name="ICBM" content="48.8566, 2.3522" />
      
      {/* Open Graph pour les réseaux sociaux */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="Bikawo" />
      <meta property="og:locale" content="fr_FR" />
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Hreflang pour le français */}
      <link rel="alternate" hrefLang="fr" href={currentUrl} />
      <link rel="alternate" hrefLang="x-default" href={currentUrl} />
      
      {/* Robots directives */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      
      {/* Additional SEO meta tags */}
      <meta name="author" content="Bikawo" />
      <meta name="language" content="French" />
      
      {/* Mobile optimization */}
      <meta name="application-name" content="Bikawo" />
      
      {/* Preload critical resources */}
      <link rel="preload" href="/hero-mobile.webp" as="image" type="image/webp" media="(max-width: 767px)" />
      <link rel="preload" href="/hero-desktop.webp" as="image" type="image/webp" media="(min-width: 768px)" />
      
      {/* DNS prefetch */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
    </Helmet>
  );
};

export default SEOOptimization;
