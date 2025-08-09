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
  description = "Assistant personnel à domicile Paris. Garde d'enfants, ménage, aide seniors, démarches administratives. Un seul prestataire de confiance pour tous vos besoins. Crédit d'impôt 50%.",
  keywords = "assistant personnel, services domicile, garde enfants Paris, ménage domicile, aide seniors, démarches administratives, conciergerie familiale, prestataire confiance, crédit impôt 50%, Bikawo",
  image = "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png",
  type = "website"
}: SEOOptimizationProps) => {
  const location = useLocation();
  const currentUrl = `https://bikawo.com${location.pathname}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://bikawo.com/#organization",
        "name": "Bikawo",
        "url": "https://bikawo.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://bikawo.com/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png",
          "width": 300,
          "height": 100
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+33609085390",
          "contactType": "Customer Service",
          "areaServed": "FR",
          "availableLanguage": "French"
        },
        "address": {
          "@type": "PostalAddress",
          "addressRegion": "Île-de-France",
          "addressCountry": "FR"
        },
        "sameAs": [
          "https://facebook.com/bikawo",
          "https://instagram.com/bikawo",
          "https://linkedin.com/company/bikawo"
        ]
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://bikawo.com/#localbusiness",
        "name": "Bikawo - Services à Domicile",
        "image": image,
        "telephone": "+33609085390",
        "email": "contact@bikawo.com",
        "address": {
          "@type": "PostalAddress",
          "addressRegion": "Île-de-France",
          "addressCountry": "FR"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 48.8566,
          "longitude": 2.3522
        },
        "url": "https://bikawo.com",
        "priceRange": "€€",
        "openingHours": "Mo-Su 00:00-24:00",
        "serviceArea": {
          "@type": "GeoCircle",
          "geoMidpoint": {
            "@type": "GeoCoordinates",
            "latitude": 48.8566,
            "longitude": 2.3522
          },
          "geoRadius": "50000"
        }
      },
      {
        "@type": "Service",
        "serviceType": "Assistance Personnelle à Domicile",
        "provider": {
          "@id": "https://bikawo.com/#organization"
        },
        "areaServed": {
          "@type": "Place",
          "name": "Île-de-France"
        },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Services Bikawo",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Garde d'enfants à domicile",
                "description": "Service de garde d'enfants professionnel à domicile"
              }
            },
            {
              "@type": "Offer", 
              "itemOffered": {
                "@type": "Service",
                "name": "Ménage et entretien domicile",
                "description": "Service de ménage et entretien à domicile"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service", 
                "name": "Aide aux seniors",
                "description": "Accompagnement et aide aux personnes âgées"
              }
            }
          ]
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://bikawo.com/#website",
        "url": "https://bikawo.com",
        "name": "Bikawo",
        "description": description,
        "publisher": {
          "@id": "https://bikawo.com/#organization"
        },
        "potentialAction": [
          {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://bikawo.com/services?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        ]
      }
    ]
  };

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
      <meta property="og:image" content={image} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="Bikawo" />
      <meta property="og:locale" content="fr_FR" />
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Hreflang pour le français */}
      <link rel="alternate" hrefLang="fr" href={currentUrl} />
      <link rel="alternate" hrefLang="x-default" href={currentUrl} />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      {/* Balises de vérification */}
      <meta name="google-site-verification" content="VOTRE_CODE_GOOGLE" />
      <meta name="msvalidate.01" content="VOTRE_CODE_BING" />
      
      {/* Robots directives */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      
      {/* Additional SEO meta tags */}
      <meta name="author" content="Bikawo" />
      <meta name="generator" content="Bikawo Platform" />
      <meta name="rating" content="general" />
      <meta name="distribution" content="global" />
      <meta name="language" content="French" />
      <meta name="coverage" content="Worldwide" />
      <meta name="target" content="all" />
      <meta name="audience" content="all" />
      
      {/* Rich Snippets additionnels */}
      <meta name="application-name" content="Bikawo" />
      <meta name="apple-mobile-web-app-title" content="Bikawo" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Preload critical resources */}
      <link rel="preload" href="/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png" as="image" />
      
      {/* DNS prefetch pour les domaines externes */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//connect.facebook.net" />
    </Helmet>
  );
};

export default SEOOptimization;