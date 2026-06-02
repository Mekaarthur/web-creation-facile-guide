export const seoKeywords = {
  primary: [
    "charge mentale",
    "assistant personnel",
    "services à domicile",
    "aide familiale",
    "garde enfants"
  ],
  secondary: [
    "délégation tâches ménagères",
    "conciergerie familiale",
    "aide administrative",
    "soutien parental",
    "organisation quotidienne"
  ],
  longTail: [
    "comment réduire la charge mentale",
    "aide ménagère garde enfants paris",
    "déléguer sans culpabiliser",
    "services combinés même prestataire",
    "assistant familial de confiance"
  ],
  geographic: [
    "Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Montpellier", "Strasbourg", "Bordeaux", "Lille"
  ]
};

export const seoStructuredData = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Bikawo",
    "description": "La charge mentale en moins, la sérénité en plus. Services d'assistance familiale combinés.",
    "url": "https://bikawo.fr",
    "logo": {
      "@type": "ImageObject",
      "url": "https://bikawo.fr/lovable-uploads/3496ff80-ec42-436d-8734-200bcb42494f.png",
      "width": 512,
      "height": 512
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+33609085390",
      "contactType": "customer service",
      "availableLanguage": "French"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Paris",
      "addressRegion": "Île-de-France",
      "postalCode": "75000",
      "addressCountry": "FR"
    },
    "sameAs": [
      "https://www.facebook.com/bikawo",
      "https://www.linkedin.com/company/bikawo",
      "https://www.instagram.com/bikawo"
    ]
  },

  localBusiness: {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Bikawo",
    "description": "Services à domicile en Île-de-France : garde d'enfants, aide seniors, ménage, assistant personnel. Organisme SAP déclaré. Crédit d'impôt 50%.",
    "url": "https://bikawo.fr",
    "telephone": "+33609085390",
    "email": "contact@bikawo.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://bikawo.fr/lovable-uploads/3496ff80-ec42-436d-8734-200bcb42494f.png",
      "width": 512,
      "height": 512
    },
    "image": "https://bikawo.fr/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Paris",
      "addressRegion": "Île-de-France",
      "postalCode": "75000",
      "addressCountry": "FR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "48.8566",
      "longitude": "2.3522"
    },
    "areaServed": [
      { "@type": "AdministrativeArea", "name": "Île-de-France" },
      { "@type": "City", "name": "Paris" },
      { "@type": "City", "name": "Boulogne-Billancourt" },
      { "@type": "City", "name": "Saint-Denis" },
      { "@type": "City", "name": "Argenteuil" },
      { "@type": "City", "name": "Montreuil" },
      { "@type": "City", "name": "Versailles" },
      { "@type": "City", "name": "Nanterre" },
      { "@type": "City", "name": "Créteil" },
      { "@type": "City", "name": "Vincennes" },
      { "@type": "City", "name": "Neuilly-sur-Seine" }
    ],
    "priceRange": "€€",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "20:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Saturday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    ],
    "sameAs": [
      "https://www.facebook.com/bikawo",
      "https://www.linkedin.com/company/bikawo",
      "https://www.instagram.com/bikawo"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Services à domicile Bikawo",
      "itemListElement": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Garde d'enfants à domicile" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Aide ménagère et batch cooking" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Aide à domicile seniors" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Assistant personnel" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Garde d'animaux et pet-sitting" } }
      ]
    }
  },

  service: {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Services d'assistance familiale Bikawo",
    "description": "Services combinés de garde d'enfants, aide ménagère et assistance administrative avec un seul prestataire",
    "provider": {
      "@type": "Organization",
      "name": "Bikawo",
      "url": "https://bikawo.fr"
    },
    "serviceType": "Assistance familiale",
    "areaServed": [
      { "@type": "AdministrativeArea", "name": "Île-de-France" },
      { "@type": "City", "name": "Paris" },
      { "@type": "City", "name": "Boulogne-Billancourt" },
      { "@type": "City", "name": "Versailles" },
      { "@type": "City", "name": "Neuilly-sur-Seine" },
      { "@type": "City", "name": "Montreuil" },
      { "@type": "City", "name": "Nanterre" }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Catalogue services Bikawo",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Garde d'enfants à domicile",
            "description": "Garde ponctuelle et régulière d'enfants à domicile par des professionnels qualifiés"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Aide ménagère et batch cooking",
            "description": "Services de ménage, repassage, préparation culinaire et entretien du domicile"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Assistance administrative",
            "description": "Gestion des rendez-vous, démarches administratives et organisation"
          }
        }
      ]
    }
  },

  faq: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Qu'est-ce que la charge mentale ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La charge mentale représente tout le travail invisible de planification, d'organisation et de coordination qui incombe souvent à une personne dans la gestion du foyer et de la famille."
        }
      },
      {
        "@type": "Question",
        "name": "Comment Bikawo peut-il réduire ma charge mentale ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Bikawo propose des services combinés avec un seul prestataire : garde d'enfants + ménage + aide administrative. Cela réduit votre charge de coordination et vous libère du temps pour l'essentiel."
        }
      },
      {
        "@type": "Question",
        "name": "Dans quelles villes Bikawo intervient-il ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Bikawo intervient principalement en Île-de-France : Paris, Boulogne-Billancourt, Neuilly-sur-Seine, Versailles, Montreuil, Nanterre, Créteil et toute la petite couronne parisienne."
        }
      },
      {
        "@type": "Question",
        "name": "Quel est le crédit d'impôt pour les services à domicile Bikawo ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "En tant qu'organisme SAP déclaré, Bikawo ouvre droit à un crédit d'impôt de 50% sur toutes vos prestations. Concrètement, une heure facturée 25€ ne vous coûte que 12,50€. Vous pouvez aussi bénéficier de l'avance immédiate Urssaf pour ne pas avancer les frais."
        }
      },
      {
        "@type": "Question",
        "name": "Comment réserver un service Bikawo ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Réservez directement en ligne sur bikawo.fr : choisissez votre service, indiquez vos disponibilités et un intervenant vous est assigné. Vous pouvez aussi appeler le +33 6 09 08 53 90 ou envoyer un email à contact@bikawo.com."
        }
      },
      {
        "@type": "Question",
        "name": "Quels sont les tarifs des services Bikawo ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Les tarifs démarrent à 25€/heure pour la garde d'enfants et le ménage, et à 30€/heure pour l'aide seniors. Après crédit d'impôt de 50%, votre reste à charge réel est dès 12,50€/heure. Des formules combinées sont disponibles pour optimiser le coût."
        }
      },
      {
        "@type": "Question",
        "name": "Bikawo est-il un organisme SAP déclaré ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Oui. Bikawo est un organisme de Service à la Personne (SAP) officiellement déclaré (SIRET 880491436). Cette accréditation garantit le sérieux des intervenants, la conformité légale et l'éligibilité au crédit d'impôt de 50%."
        }
      },
      {
        "@type": "Question",
        "name": "Puis-je bénéficier de l'avance immédiate du crédit d'impôt avec Bikawo ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Oui. Bikawo est compatible avec le dispositif d'avance immédiate mis en place par l'Urssaf. Vous ne payez que 50% du prix dès la facturation, sans attendre votre déclaration de revenus annuelle."
        }
      }
    ]
  },

  breadcrumb: (items: Array<{name: string, url: string}>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://bikawo.fr${item.url}`
    }))
  })
};

export const generateArticleStructuredData = (article: {
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  modifiedAt?: string;
  image: string;
  slug: string;
  wordCount?: number;
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": article.title,
  "description": article.description,
  "image": {
    "@type": "ImageObject",
    "url": article.image.startsWith("http") ? article.image : `https://bikawo.fr${article.image}`,
    "width": 1200,
    "height": 630
  },
  "author": {
    "@type": "Person",
    "name": article.author,
    "url": "https://bikawo.fr/blog"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Bikawo",
    "logo": {
      "@type": "ImageObject",
      "url": "https://bikawo.fr/lovable-uploads/3496ff80-ec42-436d-8734-200bcb42494f.png",
      "width": 512,
      "height": 512
    }
  },
  "datePublished": article.publishedAt,
  "dateModified": article.modifiedAt || article.publishedAt,
  ...(article.wordCount ? { "wordCount": article.wordCount } : {}),
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": `https://bikawo.fr/blog/${article.slug}`
  }
});

export const generateServiceStructuredData = (service: {
  name: string;
  description: string;
  url: string;
  priceFrom: string;
  priceAfterTax: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "name": service.name,
  "description": service.description,
  "url": `https://bikawo.fr${service.url}`,
  "provider": {
    "@type": "LocalBusiness",
    "name": "Bikawo",
    "url": "https://bikawo.fr",
    "telephone": "+33609085390",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Paris",
      "addressRegion": "Île-de-France",
      "addressCountry": "FR"
    }
  },
  "areaServed": { "@type": "AdministrativeArea", "name": "Île-de-France" },
  "offers": {
    "@type": "Offer",
    "price": service.priceFrom,
    "priceCurrency": "EUR",
    "description": `À partir de ${service.priceFrom} (${service.priceAfterTax} après crédit d'impôt 50%)`,
    "eligibleRegion": { "@type": "AdministrativeArea", "name": "Île-de-France" }
  }
});
