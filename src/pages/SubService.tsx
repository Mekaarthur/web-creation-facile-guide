import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceBreadcrumb from "@/components/ServiceBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BikaServiceBooking from "@/components/BikaServiceBooking";
import { servicesData, ServiceCategoryKey, SubService } from "@/utils/servicesData";

const SubServicePage = () => {
  const { category, slug } = useParams<{ category: ServiceCategoryKey; slug: string }>();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { currentCategory, sub } = useMemo(() => {
    const currentCategory = category ? servicesData[category] : undefined;
    const sub = currentCategory?.subservices.find((s) => s.slug === slug);
    return { currentCategory, sub };
  }, [category, slug]);

  if (!currentCategory || !sub) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-2">Sous-service introuvable</h1>
          <p className="text-muted-foreground mb-6">Le contenu demandé n'existe pas ou a été déplacé.</p>
          <Button asChild>
            <Link to="/services">Retour aux services</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const title = `${sub.title} | ${currentCategory.packageTitle} | Bikawo`;
  const description = `${sub.description} Prix: ${sub.priceDisplay ?? sub.price + "€/h"}. Options: ${(sub.options || []).join(", ")}`.slice(0, 155);

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://bikawo.fr/services/${currentCategory.key}/${sub.slug}`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: sub.title,
          provider: { "@type": "Organization", name: "Bikawo", url: "https://bikawo.fr" },
          areaServed: { "@type": "Place", name: "Île-de-France" },
          offers: { "@type": "Offer", price: sub.price, priceCurrency: "EUR", description: sub.description }
        })}</script>
      </Helmet>

      <Navbar />
      <ServiceBreadcrumb serviceName={`${currentCategory.packageTitle} - ${sub.title}`} />

      <main className="pt-10 md:pt-16">
        <section className="py-8 md:py-12">
          <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-start">
            <div>
              <img src={sub.image} alt={`${sub.title} ${currentCategory.packageTitle}`} className="w-full h-auto rounded-xl shadow" loading="lazy" />
            </div>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl md:text-3xl font-bold leading-tight">{sub.title}</h1>
                <Badge variant="outline" className="text-lg font-bold">
                  {sub.priceDisplay ?? `${sub.price}€/h`}
                </Badge>
              </div>
              <p className="text-muted-foreground">{sub.description}</p>
              {sub.options && sub.options.length > 0 && (
                <Card className="p-4">
                  <ul className="list-disc pl-5 space-y-1">
                    {sub.options.map((opt) => (
                      <li key={opt}>{opt}</li>
                    ))}
                  </ul>
                </Card>
              )}
              <div className="flex gap-3 pt-2">
                <Button onClick={() => setOpen(true)} className="flex-1">Réserver maintenant</Button>
                <Button variant="outline" asChild>
                  <Link to={`/services`}>Retour aux services</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky CTA on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 p-3">
        <div className="max-w-5xl mx-auto">
          <Button className="w-full" onClick={() => setOpen(true)}>Réserver maintenant</Button>
        </div>
      </div>

      <BikaServiceBooking
        isOpen={open}
        onClose={() => setOpen(false)}
        service={{ name: sub.title, description: sub.description, price: sub.price, category: currentCategory.key }}
        packageTitle={currentCategory.packageTitle}
      />

      <Footer />
    </div>
  );
};

export default SubServicePage;
