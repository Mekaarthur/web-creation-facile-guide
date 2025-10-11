import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useTranslation } from 'react-i18next';
import testimonialMarie from '@/assets/testimonial-marie.jpg';
import testimonialThomas from '@/assets/testimonial-thomas.jpg';
import testimonialSophie from '@/assets/testimonial-sophie.jpg';

const TestimonialsSection = () => {
  const { t } = useTranslation();
  const testimonials = [
    {
      type: "client",
      name: t('testimonials.client1.name'),
      role: t('testimonials.client1.role'),
      content: t('testimonials.client1.content'),
      avatar: testimonialMarie
    },
    {
      type: "prestataire", 
      name: t('testimonials.provider1.name'),
      role: t('testimonials.provider1.role'),
      content: t('testimonials.provider1.content'),
      avatar: testimonialThomas
    },
    {
      type: "client",
      name: t('testimonials.client2.name'), 
      role: t('testimonials.client2.role'),
      content: t('testimonials.client2.content'),
      avatar: testimonialSophie
    }
  ];

  const renderStars = () => (
    <div className="flex justify-center mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="h-5 w-5 fill-warning text-warning" />
      ))}
    </div>
  );

  return (
    <section className="py-16 bg-gradient-to-b from-secondary/10 to-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {t('testimonials.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                {renderStars()}
                
                <p className="text-lg italic mb-6 text-muted-foreground leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center justify-center gap-3">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="text-left">
                    <p className="font-semibold text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-primary">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;