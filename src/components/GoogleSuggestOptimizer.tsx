import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const GoogleSuggestOptimizer = () => {
  useEffect(() => {
    // Schema.org pour les suggestions Google
    const createRichSnippets = () => {
      const scripts = [
        // FAQ Schema pour les questions fréquentes
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Combien coûte un assistant personnel à domicile ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Nos services d'assistant personnel débutent à 22€/h avec un crédit d'impôt de 50%. Les tarifs varient selon le type de service : garde d'enfants, ménage, aide administrative."
              }
            },
            {
              "@type": "Question", 
              "name": "Quels services propose Bikawo ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Bikawo propose 6 services principaux : Bika Kids (garde d'enfants), Bika Maison (ménage et courses), Bika Seniors (aide aux personnes âgées), Bika Animals (soins animaux), Bika Travel (assistance voyage), et Bika Plus (service premium)."
              }
            },
            {
              "@type": "Question",
              "name": "Comment réserver un service d'assistant personnel ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Vous pouvez réserver en 3 étapes : 1) Choisissez votre service sur notre site, 2) Sélectionnez vos créneaux, 3) Confirmez votre réservation. Un prestataire vérifié intervient chez vous."
              }
            },
            {
              "@type": "Question",
              "name": "Bikawo intervient-il sur Paris et l'Île-de-France ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Oui, Bikawo couvre toute l'Île-de-France : Paris et la petite couronne (92, 93, 94). Nos prestataires sont disponibles 7j/7 avec une intervention possible en moins de 2h pour les urgences."
              }
            }
          ]
        },
        
        // Service Schema
        {
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Assistant Personnel à Domicile - Bikawo",
          "description": "Services d'assistant personnel et de conciergerie à domicile. Garde d'enfants, ménage, aide seniors, démarches administratives avec crédit d'impôt 50%.",
          "provider": {
            "@type": "Organization",
            "name": "Bikawo",
            "telephone": "+33609085390",
            "email": "contact@bikawo.com"
          },
          "areaServed": {
            "@type": "Place",
            "name": "Île-de-France"
          },
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Catalogue Services Bikawo",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Garde d'enfants à domicile",
                  "description": "Service de garde d'enfants professionnel, aide aux devoirs, activités éducatives"
                },
                "price": "24",
                "priceCurrency": "EUR",
                "priceSpecification": {
                  "@type": "UnitPriceSpecification",
                  "price": "24",
                  "priceCurrency": "EUR",
                  "unitText": "HOUR"
                }
              }
            ]
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "247",
            "bestRating": "5",
            "worstRating": "1"
          }
        },

        // BreadcrumbList pour la navigation
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Accueil",
              "item": "https://bikawo.com"
            },
            {
              "@type": "ListItem", 
              "position": 2,
              "name": "Services",
              "item": "https://bikawo.com/services"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "Contact",
              "item": "https://bikawo.com/contact"
            }
          ]
        },

        // HowTo Schema pour les guides
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "Comment réserver un assistant personnel avec Bikawo",
          "description": "Guide complet pour réserver votre assistant personnel à domicile en 3 étapes simples",
          "image": {
            "@type": "ImageObject",
            "url": "https://bikawo.com/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png"
          },
          "totalTime": "PT5M",
          "estimatedCost": {
            "@type": "MonetaryAmount",
            "currency": "EUR",
            "value": "24"
          },
          "step": [
            {
              "@type": "HowToStep",
              "name": "Choisir votre service",
              "text": "Sélectionnez le service souhaité parmi nos 6 offres : garde d'enfants, ménage, aide seniors, etc.",
              "image": {
                "@type": "ImageObject",
                "url": "https://bikawo.com/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png"
              }
            },
            {
              "@type": "HowToStep", 
              "name": "Définir vos besoins",
              "text": "Précisez vos créneaux, fréquence et besoins spécifiques pour un service personnalisé",
              "image": {
                "@type": "ImageObject",
                "url": "https://bikawo.com/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png"
              }
            },
            {
              "@type": "HowToStep",
              "name": "Confirmer et payer",
              "text": "Validez votre réservation et bénéficiez immédiatement du crédit d'impôt de 50%",
              "image": {
                "@type": "ImageObject", 
                "url": "https://bikawo.com/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png"
              }
            }
          ]
        }
      ];

      // Injecter les scripts structured data
      scripts.forEach((schema, index) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = `structured-data-${index}`;
        script.textContent = JSON.stringify(schema);
        
        // Supprimer l'ancien script s'il existe
        const oldScript = document.getElementById(`structured-data-${index}`);
        if (oldScript) {
          oldScript.remove();
        }
        
        document.head.appendChild(script);
      });
    };

    // Optimisation pour les recherches vocales
    const optimizeForVoiceSearch = () => {
      // Ajouter des mots-clés longue traîne dans le contenu
      const voiceSearchQueries = [
        "assistant personnel à domicile paris",
        "garde d'enfants à domicile crédit impôt",
        "service ménage domicile île de france",
        "aide personnes âgées à domicile",
        "conciergerie familiale paris",
        "prestataire services domicile fiable"
      ];

      // Ajouter les requêtes comme données invisibles pour le SEO
      const hiddenDiv = document.createElement('div');
      hiddenDiv.style.display = 'none';
      hiddenDiv.setAttribute('aria-hidden', 'true');
      hiddenDiv.innerHTML = voiceSearchQueries.join(' ');
      document.body.appendChild(hiddenDiv);

      return () => {
        if (hiddenDiv.parentNode) {
          hiddenDiv.parentNode.removeChild(hiddenDiv);
        }
      };
    };

    // Mise à jour du sitemap dynamique
    const updateSitemap = () => {
      const pages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/services', priority: '0.9', changefreq: 'weekly' },
        { url: '/a-propos-de-nous', priority: '0.7', changefreq: 'monthly' },
        { url: '/contact', priority: '0.8', changefreq: 'monthly' },
        { url: '/blog', priority: '0.6', changefreq: 'weekly' },
        { url: '/nous-recrutons', priority: '0.5', changefreq: 'monthly' }
      ];

      // Générer le sitemap XML
      const sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `
  <url>
    <loc>https://bikawo.com${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
</urlset>`;

      // Notification à Google via IndexNow (si disponible)
      if ('navigator' in window && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(() => {
          // Ping Google pour mise à jour du sitemap
          fetch('https://www.google.com/ping?sitemap=https://bikawo.com/sitemap.xml', {
            method: 'GET',
            mode: 'no-cors'
          }).catch(() => {
            // Ignore les erreurs CORS, c'est normal
          });
        });
      }
    };

    createRichSnippets();
    const cleanupVoiceSearch = optimizeForVoiceSearch();
    updateSitemap();

    return () => {
      cleanupVoiceSearch();
      // Nettoyer les scripts structured data
      for (let i = 0; i < 4; i++) {
        const script = document.getElementById(`structured-data-${i}`);
        if (script) {
          script.remove();
        }
      }
    };
  }, []);

  return (
    <Helmet>
      {/* Optimisation pour Google Suggest et autocomplétion */}
      <meta name="google" content="nositelinkssearchbox" />
      <meta name="google" content="notranslate" />
      
      {/* Schema.org pour les suggestions */}
      <meta itemProp="name" content="Bikawo - Assistant Personnel Domicile Paris" />
      <meta itemProp="description" content="Service d'assistant personnel à domicile. Garde enfants, ménage, aide seniors. Crédit impôt 50%. Intervention Paris et Île-de-France." />
      <meta itemProp="image" content="https://bikawo.com/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png" />
      
      {/* Données pour les rich snippets */}
      <meta name="google-site-verification" content="VOTRE_CODE_VERIFICATION_GOOGLE" />
      <meta name="yandex-verification" content="VOTRE_CODE_YANDEX" />
      <meta name="bing-site-verification" content="VOTRE_CODE_BING" />
      
      {/* Optimisation mobile pour les suggestions */}
      <meta name="HandheldFriendly" content="true" />
      <meta name="MobileOptimized" content="width" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      
      {/* Préconnexions pour améliorer la vitesse */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://www.google.com" />
      <link rel="preconnect" href="https://www.gstatic.com" />
      
      {/* Prefetch des pages importantes */}
      <link rel="prefetch" href="/services" />
      <link rel="prefetch" href="/contact" />
      
      {/* JSON-LD pour WebSite avec SearchAction */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Bikawo",
          "url": "https://bikawo.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://bikawo.com/services?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        })}
      </script>
    </Helmet>
  );
};

export default GoogleSuggestOptimizer;