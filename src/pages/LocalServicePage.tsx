import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Star, Shield, Clock, ChevronRight, Phone, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  getServiceBySlug,
  getCityBySlug,
  getCitiesByDepartment,
  generateLocalSEOTitle,
  generateLocalSEODescription,
  generateLocalKeywords,
  generateLocalStructuredData,
  services,
  departments,
  type LocalCity,
  type LocalService,
} from '@/data/seoLocalData';

const LocalServicePage = () => {
  const { serviceSlug, citySlug } = useParams<{ serviceSlug: string; citySlug: string }>();

  const service = serviceSlug ? getServiceBySlug(serviceSlug) : undefined;
  const city = citySlug ? getCityBySlug(citySlug) : undefined;

  // Redirection si service ou ville non trouvé
  if (!service || !city) {
    return <Navigate to="/services" replace />;
  }

  const title = generateLocalSEOTitle(service, city);
  const description = generateLocalSEODescription(service, city);
  const keywords = generateLocalKeywords(service, city);
  const structuredData = generateLocalStructuredData(service, city);
  const canonicalUrl = `https://bikawo.com/services/${service.slug}/${city.slug}`;

  // Villes du même département pour le maillage interne
  const nearbyCities = getCitiesByDepartment(city.departmentCode)
    .filter(c => c.slug !== city.slug)
    .slice(0, 6);

  // Autres services pour le maillage
  const otherServices = services.filter(s => s.slug !== service.slug).slice(0, 4);

  const benefits = [
    { icon: Shield, text: 'Prestataires vérifiés et assurés' },
    { icon: Star, text: 'Note moyenne de 4.8/5' },
    { icon: Clock, text: 'Disponible 7j/7' },
    { icon: CheckCircle2, text: service.taxCreditEligible ? '50% de crédit d\'impôt' : 'Service de qualité' },
  ];

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords.join(', ')} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        
        {/* Geo Tags */}
        <meta name="geo.region" content={`FR-${city.departmentCode}`} />
        <meta name="geo.placename" content={city.name} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <nav className="bg-muted/30 py-3 border-b" aria-label="Fil d'Ariane">
          <div className="container mx-auto px-4">
            <ol className="flex items-center gap-2 text-sm flex-wrap">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Accueil
                </Link>
              </li>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <li>
                <Link to="/services" className="text-muted-foreground hover:text-primary transition-colors">
                  Services
                </Link>
              </li>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <li>
                <Link to={`/services?category=${service.id}`} className="text-muted-foreground hover:text-primary transition-colors">
                  {service.shortName}
                </Link>
              </li>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <li className="text-foreground font-medium" aria-current="page">
                {city.name}
              </li>
            </ol>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="py-12 md:py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">{city.name} ({city.departmentCode})</span>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                {service.name} à {city.name}
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/services">
                    Réserver maintenant
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <a href="tel:+33609085390">
                    <Phone className="h-4 w-4" />
                    06 09 08 53 90
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 border-b">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex flex-col items-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{benefit.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Service Details */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Pourquoi choisir Bikawo pour votre {service.shortName.toLowerCase()} à {city.name} ?
              </h2>
              
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p>
                  Bikawo vous accompagne dans votre quotidien à {city.name} et ses environs en {city.department}. 
                  Notre équipe de prestataires qualifiés et vérifiés est à votre disposition pour vous offrir 
                  un service de {service.shortName.toLowerCase()} de qualité, adapté à vos besoins.
                </p>
                
                <p>
                  Que vous soyez une famille active, un senior souhaitant rester à domicile, ou un professionnel 
                  débordé, nous avons la solution pour vous. Nos intervenants sont sélectionnés avec soin et 
                  bénéficient de formations régulières pour garantir votre entière satisfaction.
                </p>

                {service.taxCreditEligible && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 my-6">
                    <h3 className="text-lg font-semibold text-primary mb-2">
                      💰 Économisez 50% grâce au crédit d'impôt
                    </h3>
                    <p className="text-sm text-muted-foreground mb-0">
                      Nos services de {service.shortName.toLowerCase()} sont éligibles au crédit d'impôt de 50%. 
                      Profitez de l'avance immédiate URSSAF et ne payez que la moitié du prix !
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Nearby Cities - Internal Linking */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
              {service.shortName} dans les villes proches
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
              {nearbyCities.map((nearbyCity) => (
                <Link
                  key={nearbyCity.slug}
                  to={`/services/${service.slug}/${nearbyCity.slug}`}
                  className="bg-background rounded-lg p-4 text-center hover:shadow-md transition-shadow border"
                >
                  <MapPin className="h-5 w-5 text-primary mx-auto mb-2" />
                  <span className="text-sm font-medium text-foreground">{nearbyCity.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Other Services - Cross-linking */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
              Autres services à {city.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {otherServices.map((otherService) => (
                <Link
                  key={otherService.slug}
                  to={`/services/${otherService.slug}/${city.slug}`}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-foreground mb-2">{otherService.shortName}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {otherService.description}
                      </p>
                      {otherService.taxCreditEligible && (
                        <span className="inline-block mt-3 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          50% crédit d'impôt
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Prêt à simplifier votre quotidien à {city.name} ?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
              Réservez votre prestation de {service.shortName.toLowerCase()} en quelques clics. 
              C'est simple, rapide et sans engagement.
            </p>
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link to="/services">
                Commencer maintenant
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* All Departments Links - Footer SEO */}
        <section className="py-12 border-t">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-bold text-foreground mb-6 text-center">
              {service.shortName} en Île-de-France
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {departments.map((dept) => (
                <div key={dept.code} className="text-center">
                  <span className="text-sm font-medium text-muted-foreground">{dept.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default LocalServicePage;
