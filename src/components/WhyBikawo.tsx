import { Brain, DollarSign, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';

const WhyBikawo = () => {
  const { t } = useTranslation();
  
  const benefits = [
    {
      icon: Brain,
      title: t('why.benefit1'),
      description: t('why.benefit1Desc'),
      color: "text-primary"
    },
    {
      icon: DollarSign,
      title: t('why.benefit2'), 
      description: t('why.benefit2Desc'),
      color: "text-accent"
    },
    {
      icon: Heart,
      title: t('why.benefit3'),
      description: t('why.benefit3Desc'),
      color: "text-secondary"
    }
  ];

  return (
    <section className="py-16 bg-primary/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {t('why.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-0 shadow-lg bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <benefit.icon className={`h-16 w-16 mx-auto ${benefit.color}`} />
                </div>
                
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  {benefit.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyBikawo;