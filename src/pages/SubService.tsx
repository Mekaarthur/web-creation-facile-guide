import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceBreadcrumb from "@/components/ServiceBreadcrumb";
import FloatingCartButton from "@/components/FloatingCartButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BikaServiceBooking from "@/components/BikaServiceBooking";
import { servicesData, ServiceCategoryKey } from "@/utils/servicesData";
import { useTranslation } from "react-i18next";
import { serviceTranslations } from "@/utils/serviceTranslations";

const SubServicePage = () => {
  const { category, slug } = useParams<{ category: ServiceCategoryKey; slug: string }>();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { currentCategory, sub } = useMemo(() => {
    const currentCategory = category ? servicesData[category] : undefined;
    const sub = currentCategory?.subservices.find((s) => s.slug === slug);
    return { currentCategory, sub };
  }, [category, slug]);

  const { i18n, t } = useTranslation();

  if (!currentCategory || !sub) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-2">{t('subService.notFound')}</h1>
          <p className="text-muted-foreground mb-6">{t('subService.notFoundDesc')}</p>
          <Button asChild>
            <Link to="/services">{t('subService.backToServices')}</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }
  const isEn = i18n.language?.startsWith('en');
  const subTrans = isEn && currentCategory && sub
    ? serviceTranslations[currentCategory.key]?.subservices?.[sub.slug]
    : undefined;
  const displayTitle = subTrans?.title ?? sub.title;
  const displayDescription = subTrans?.description ?? sub.description;
  const displayOptions = subTrans?.options ?? sub.options;

  const title = `${displayTitle} | ${currentCategory.packageTitle} | Bikawo`;
  const priceLabel = isEn ? 'Price' : 'Prix';
  const description = `${displayDescription} ${priceLabel}: ${sub.priceDisplay ?? sub.price + "€/h"}. Options: ${(displayOptions || []).join(", ")}`.slice(0, 155);

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://bikawo.fr/services/${currentCategory.key}/${sub.slug}`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: displayTitle,
          provider: { "@type": "Organization", name: "Bikawo", url: "https://bikawo.fr" },
          areaServed: { "@type": "Place", name: "Île-de-France" },
          offers: { "@type": "Offer", price: sub.price, priceCurrency: "EUR", description: displayDescription }
        })}</script>
      </Helmet>

      <Navbar />
      <ServiceBreadcrumb serviceName={`${currentCategory.packageTitle} - ${displayTitle}`} />

      <main className="pt-10 md:pt-16 pb-20 md:pb-0">
        <section className="py-8 md:py-12">
          <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-start">
            <div>
              <img src={sub.image} alt={`${displayTitle} ${currentCategory.packageTitle}`} className="w-full h-auto rounded-xl shadow" loading="lazy" />
            </div>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl md:text-3xl font-bold leading-tight">{displayTitle}</h1>
                <Badge variant="outline" className="text-lg font-bold">
                  {sub.priceDisplay ?? `${sub.price}€/h`}
                </Badge>
              </div>
              <p className="text-muted-foreground">{displayDescription}</p>
              {displayOptions && displayOptions.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold text-lg mb-3">
                    {isEn ? 'Services available (your choice):' : 'Prestations au choix :'}
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {displayOptions.map((opt) => (
                      <li key={opt}>{opt}</li>
                    ))}
                  </ul>
                </Card>
              )}
              <div className="flex gap-3 pt-2">
                <Button onClick={() => setOpen(true)} className="flex-1">{t('subService.bookNow')}</Button>
                <Button variant="outline" asChild>
                  <Link to={`/services`}>{t('subService.backToServices')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky CTA on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 p-3">
        <div className="max-w-5xl mx-auto">
          <Button className="w-full" onClick={() => setOpen(true)}>{t('subService.bookNow')}</Button>
        </div>
      </div>

      <BikaServiceBooking
        isOpen={open}
        onClose={() => setOpen(false)}
        service={{ 
          name: displayTitle, 
          description: displayDescription, 
          price: sub.price, 
          category: currentCategory.key,
          options: displayOptions 
        }}
        packageTitle={currentCategory.packageTitle}
      />

      <FloatingCartButton />

      <Footer />
    </div>
  );
};

export default SubServicePage;
