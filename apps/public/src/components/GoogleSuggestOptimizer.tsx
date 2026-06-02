import { Helmet } from 'react-helmet-async';

const GoogleSuggestOptimizer = () => {
  return (
    <Helmet>
      {/* Schema.org WebSite avec SearchAction pour Google Sitelinks Search */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Bikawo",
          "url": "https://bikawo.fr",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://bikawo.fr/services?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        })}
      </script>

      {/* FAQ Schema pour les rich snippets Google */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Combien coûte un assistant personnel à domicile ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Nos services d'assistant personnel débutent à 22€/h avec un crédit d'impôt de 50%. Les tarifs varient selon le type de service : garde d'enfants, préparation culinaire / batch cooking, aide administrative."
              }
            },
            {
              "@type": "Question",
              "name": "Quels services propose Bikawo ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Bikawo propose 6 services principaux : Bika Kids (garde d'enfants), Bika Maison (préparation culinaire / batch cooking et courses), Bika Seniors (aide aux personnes âgées), Bika Animals (soins animaux), Bika Travel (assistance voyage), et Bika Plus (service premium)."
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
        })}
      </script>

      {/* HowTo Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "Comment réserver un assistant personnel avec Bikawo",
          "description": "Guide complet pour réserver votre assistant personnel à domicile en 3 étapes simples",
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
              "text": "Sélectionnez le service souhaité parmi nos 6 offres : garde d'enfants, préparation culinaire / batch cooking, aide seniors, etc."
            },
            {
              "@type": "HowToStep",
              "name": "Définir vos besoins",
              "text": "Précisez vos créneaux, fréquence et besoins spécifiques pour un service personnalisé"
            },
            {
              "@type": "HowToStep",
              "name": "Confirmer et payer",
              "text": "Validez votre réservation et bénéficiez immédiatement du crédit d'impôt de 50%"
            }
          ]
        })}
      </script>

      {/* Préconnexions pour améliorer la vitesse */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://www.gstatic.com" />
      
      {/* Prefetch des pages importantes */}
      <link rel="prefetch" href="/services" />
      <link rel="prefetch" href="/contact" />
    </Helmet>
  );
};

export default GoogleSuggestOptimizer;
