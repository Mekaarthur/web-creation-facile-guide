import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  structuredData?: object;
}

const SEOComponent = ({ 
  title = "Bikawo - La charge mentale en moins, la sérénité en plus",
  description = "Services d'assistance familiale combinés avec un seul prestataire de confiance. Ménage, garde d'enfants, aide administrative. Réactivité et flexibilité garanties.",
  keywords = "charge mentale, assistance familiale, garde enfants, aide ménagère, services à domicile, délégation tâches, conciergerie familiale, Paris, France",
  image = "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png",
  url = "https://bikawo.fr",
  type = "website",
  publishedTime,
  modifiedTime,
  author = "Bikawo",
  structuredData
}: SEOProps) => {
  
  const fullTitle = title.includes("Bikawo") ? title : `${title} | Bikawo`;
  const fullUrl = url.startsWith("http") ? url : `https://bikawo.fr${url}`;
  const fullImageUrl = image.startsWith("http") ? image : `https://bikawo.fr${image}`;

  return (
    <Helmet>
      {/* Meta de base */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Bikawo" />
      <meta property="og:locale" content="fr_FR" />
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      
      {/* Article meta */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && type === "article" && <meta property="article:author" content={author} />}
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOComponent;