import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BikaServiceBooking from "@/components/BikaServiceBooking";
import { servicesData, ServiceCategoryKey, SubService } from "@/utils/servicesData";

interface ServiceSubgridProps {
  categoryKey: ServiceCategoryKey;
}

const ServiceSubgrid = ({ categoryKey }: ServiceSubgridProps) => {
  const [selected, setSelected] = useState<SubService | null>(null);
  const [open, setOpen] = useState(false);

  const category = servicesData[categoryKey];

  const onReserve = (s: SubService) => {
    setSelected(s);
    setOpen(true);
  };

  const cards = useMemo(() => category.subservices, [category]);

  return (
    <>
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{`Nos sous-services ${category.packageTitle}`}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {cards.map((s) => (
              <Card key={s.slug} className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <img src={s.image} alt={`${s.title} ${category.packageTitle}`} className="w-full h-40 object-cover rounded-t-lg" loading="lazy" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-base leading-tight">{s.title}</CardTitle>
                    <Badge variant="outline" className="font-semibold">
                      {s.priceDisplay ?? `${s.price}€/h`}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm mb-4 line-clamp-3">{s.description}</CardDescription>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to={`/services/${category.key}/${s.slug}`}>Détails</Link>
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => onReserve(s)}>
                      Réserver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {selected && (
        <BikaServiceBooking
          isOpen={open}
          onClose={() => setOpen(false)}
          service={{
            name: selected.title,
            description: selected.description,
            price: selected.price,
            category: category.key,
          }}
          packageTitle={category.packageTitle}
        />
      )}
    </>
  );
};

export default ServiceSubgrid;
