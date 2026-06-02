// Guide de mise en place des outils de mesure SEO pour Bikawo

export const seoMeasurementGuide = {
  // 1. GOOGLE ANALYTICS 4 - Configuration
  googleAnalytics: {
    setup: [
      "1. Créer un compte Google Analytics sur analytics.google.com",
      "2. Créer une propriété 'Bikawo' avec type 'Web'",
      "3. Récupérer votre Measurement ID (format: G-XXXXXXXXXX)",
      "4. Remplacer 'GA_MEASUREMENT_ID' dans index.html par votre ID",
      "5. Décommenter le code Google Analytics dans index.html"
    ],
    kpis_essentiels: [
      "Sessions organiques (Acquisition > Tout le trafic > Canaux)",
      "Conversions par objectif (Conversions > Événements)",
      "Pages de destination SEO (Rapports > Engagement > Pages et écrans)",
      "Durée de session moyenne",
      "Taux de rebond par page",
      "Entonnoir de conversion (Explorations > Entonnoir)"
    ],
    evenements_personnalises: [
      "Newsletter inscription",
      "Formulaire de contact soumis", 
      "Devis demandé",
      "Appel téléphonique",
      "Téléchargement guide PDF"
    ]
  },

  // 2. GOOGLE SEARCH CONSOLE
  searchConsole: {
    setup: [
      "1. Aller sur search.google.com/search-console",
      "2. Ajouter votre propriété 'https://bikawo.fr'",
      "3. Choisir 'Préfixe d'URL' comme méthode de validation",
      "4. Télécharger le fichier HTML OU copier la balise meta",
      "5. Si balise meta: remplacer 'VERIFICATION_CODE' dans index.html",
      "6. Cliquer 'Vérifier' dans Search Console"
    ],
    rapports_cles: [
      "Performance > Requêtes (mots-clés qui génèrent du trafic)",
      "Performance > Pages (pages les plus performantes)",
      "Couverture > Pages indexées vs erreurs",
      "Améliorations > Ergonomie mobile",
      "Liens > Liens externes (backlinks)"
    ],
    soumission_sitemap: [
      "1. Dans Search Console > Sitemaps",
      "2. Ajouter 'https://bikawo.fr/sitemap.xml'",
      "3. Soumettre pour indexation rapide"
    ]
  },

  // 3. OUTILS SEO EXTERNES RECOMMANDÉS
  externalTools: {
    ahrefs_semrush: {
      utilite: "Analyse concurrentielle et recherche de mots-clés",
      metriques: [
        "Domain Rating (autorité de domaine)",
        "Trafic organique estimé",
        "Mots-clés positionnés",
        "Backlinks et domaines référents",
        "Analyse des concurrents",
        "Opportunités de mots-clés"
      ],
      cout: "99-399€/mois selon plan"
    },
    gtmetrix: {
      utilite: "Performance et vitesse du site",
      metriques: [
        "Core Web Vitals (LCP, FID, CLS)",
        "Page Speed Score",
        "YSlow Score", 
        "Temps de chargement complet",
        "Optimisations recommandées"
      ],
      cout: "Gratuit + plans premium"
    },
    hotjar: {
      utilite: "Analyse comportementale utilisateurs",
      metriques: [
        "Heatmaps (cartes de chaleur)",
        "Enregistrements de sessions",
        "Funnels de conversion",
        "Feedback utilisateur",
        "Enquêtes sur site"
      ],
      cout: "39-389€/mois selon trafic"
    }
  },

  // 4. KPIs À SUIVRE MENSUELLEMENT
  kpisEssentiels: {
    trafic: {
      organique_sessions: "Nombre de sessions depuis moteurs de recherche",
      organique_utilisateurs: "Utilisateurs uniques organiques",
      pages_vues_organiques: "Pages vues depuis SEO",
      taux_rebond_organique: "% visiteurs qui quittent sans interaction"
    },
    positionnement: {
      mots_cles_top10: "Nombre de mots-clés dans le top 10",
      mots_cles_top3: "Nombre de mots-clés dans le top 3", 
      position_moyenne: "Position moyenne des mots-clés trackés",
      impressions: "Nombre d'affichages dans les résultats Google"
    },
    conversions: {
      leads_organiques: "Formulaires soumis depuis SEO",
      taux_conversion_organique: "% visiteurs SEO qui convertissent",
      valeur_conversion: "CA généré par le trafic organique",
      cout_acquisition_seo: "Coût pour acquérir un client via SEO"
    },
    contenu: {
      blog_sessions: "Sessions sur les articles de blog",
      temps_lecture_moyen: "Durée moyenne sur les articles",
      partages_sociaux: "Partages sur réseaux sociaux",
      backlinks_contenu: "Liens entrants vers le blog"
    }
  },

  // 5. RAPPORTS MENSUELS
  rapportsMensuels: {
    executif: {
      destinataire: "Direction/Investisseurs",
      metriques: [
        "Trafic organique vs objectif",
        "Leads générés vs objectif", 
        "ROI SEO (CA/Investissement)",
        "Positionnement mots-clés prioritaires",
        "3 recommandations principales"
      ]
    },
    operationnel: {
      destinataire: "Équipe marketing",
      metriques: [
        "Analyse détaillée par mot-clé",
        "Performance des pages",
        "Opportunités détectées",
        "Actions prioritaires mois suivant",
        "Analyse concurrentielle",
        "Problèmes techniques identifiés"
      ]
    }
  },

  // 6. ALERTES À CONFIGURER
  alertes: {
    google_analytics: [
      "Baisse trafic organique > 20%",
      "Augmentation taux rebond > 10%",
      "Pic de conversions inhabituel",
      "Erreurs 404 en hausse"
    ],
    search_console: [
      "Nouvelles erreurs d'indexation",
      "Baisse impressions > 15%",
      "Nouveau backlink détecté",
      "Problème ergonomie mobile"
    ]
  },

  // 7. OBJECTIFS SMART À DÉFINIR
  objectifsSMART: {
    "3_mois": [
      "Atteindre 500 sessions organiques/mois",
      "Positionner 'charge mentale' dans le top 10",
      "Générer 20 leads qualifiés/mois via SEO",
      "Obtenir 10 backlinks de qualité"
    ],
    "6_mois": [
      "Atteindre 2000 sessions organiques/mois", 
      "Top 3 sur 'aide familiale Paris'",
      "50 leads qualifiés/mois via SEO",
      "Domain Authority > 40"
    ],
    "12_mois": [
      "5000 sessions organiques/mois",
      "ROI SEO > 400%",
      "100 leads qualifiés/mois",
      "Leader sur 'charge mentale' + services"
    ]
  }
};

// Fonctions utilitaires pour calculer les ROI
export const calculateSEOROI = (
  monthlyOrganicLeads: number,
  conversionRate: number,
  averageOrderValue: number,
  seoInvestment: number
) => {
  const monthlyRevenue = monthlyOrganicLeads * conversionRate * averageOrderValue;
  const yearlyRevenue = monthlyRevenue * 12;
  const yearlyInvestment = seoInvestment * 12;
  const roi = ((yearlyRevenue - yearlyInvestment) / yearlyInvestment) * 100;
  
  return {
    monthlyRevenue,
    yearlyRevenue,
    roi: Math.round(roi),
    breakEvenMonths: Math.ceil(yearlyInvestment / monthlyRevenue)
  };
};

export const trackingCodeTemplate = {
  googleAnalytics: `
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: document.title,
        page_location: window.location.href
      });
      
      // Track conversions
      function trackConversion(action, value = 0) {
        gtag('event', 'conversion', {
          'send_to': 'GA_MEASUREMENT_ID/CONVERSION_ID',
          'value': value,
          'currency': 'EUR',
          'action': action
        });
      }
    </script>
  `,
  
  searchConsole: `<meta name="google-site-verification" content="VERIFICATION_CODE" />`,
  
  customEvents: `
    // Newsletter signup
    gtag('event', 'newsletter_signup', {
      'event_category': 'engagement',
      'event_label': 'footer_newsletter'
    });
    
    // Contact form
    gtag('event', 'contact_form_submit', {
      'event_category': 'conversion',
      'event_label': 'contact_page'
    });
    
    // Phone click
    gtag('event', 'phone_click', {
      'event_category': 'engagement', 
      'event_label': 'header_phone'
    });
  `
};