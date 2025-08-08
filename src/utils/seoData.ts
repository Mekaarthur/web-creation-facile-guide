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
    "logo": "https://bikawo.fr/lovable-uploads/3496ff80-ec42-436d-8734-200bcb42494f.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+33-1-23-45-67-89",
      "contactType": "customer service",
      "availableLanguage": "French"
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "FR",
      "addressRegion": "Île-de-France"
    },
    "sameAs": [
      "https://www.facebook.com/bikawo",
      "https://www.linkedin.com/company/bikawo",
      "https://www.instagram.com/bikawo"
    ]
  },

  service: {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Services d'assistance familiale Bikawo",
    "description": "Services combinés de garde d'enfants, aide ménagère et assistance administrative avec un seul prestataire",
    "provider": {
      "@type": "Organization",
      "name": "Bikawo"
    },
    "serviceType": "Assistance familiale",
    "areaServed": {
      "@type": "Country",
      "name": "France"
    },
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
            "name": "Aide ménagère",
            "description": "Services de ménage, repassage et entretien du domicile"
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
          "text": "Bikawo intervient dans toute la France, avec une présence renforcée dans les grandes métropoles : Paris, Lyon, Marseille, Toulouse, Nice, Nantes, Montpellier, Strasbourg, Bordeaux et Lille."
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
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": article.title,
  "description": article.description,
  "image": `https://bikawo.fr${article.image}`,
  "author": {
    "@type": "Person",
    "name": article.author
  },
  "publisher": {
    "@type": "Organization",
    "name": "Bikawo",
    "logo": {
      "@type": "ImageObject",
      "url": "https://bikawo.fr/lovable-uploads/3496ff80-ec42-436d-8734-200bcb42494f.png"
    }
  },
  "datePublished": article.publishedAt,
  "dateModified": article.modifiedAt || article.publishedAt,
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": `https://bikawo.fr/blog/${article.slug}`
  }
});