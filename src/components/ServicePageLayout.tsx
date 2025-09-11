import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ServiceBenefit {
  icon: ReactNode;
  title: string;
  description: string;
  bgGradient: string;
  iconGradient: string;
}

interface ServicePageProps {
  title: string;
  subtitle?: string;
  rating: number;
  reviewCount: string;
  price: string;
  discountPrice: string;
  heroImage: string;
  heroImageAlt: string;
  keyPoints: string[];
  primaryCTA: string;
  secondaryCTA?: string;
  benefits: ServiceBenefit[];
  heroGradient: string;
  children?: ReactNode;
}

const ServicePageLayout = ({
  title,
  subtitle,
  rating,
  reviewCount,
  price,
  discountPrice,
  heroImage,
  heroImageAlt,
  keyPoints,
  primaryCTA,
  secondaryCTA,
  benefits,
  heroGradient,
  children
}: ServicePageProps) => {
  const navigate = useNavigate();

  return (
    <main className="pt-16">
      {/* Hero Section */}
      <section className={`relative ${heroGradient} py-16 lg:py-24 overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Content */}
            <div className="text-white space-y-8 order-2 lg:order-1">
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-4">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-xl lg:text-2xl text-white/90 font-medium">
                      {subtitle}
                    </p>
                  )}
                </div>
                
                {/* Rating */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${i < rating ? 'fill-white text-white' : 'text-white/40'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-white/90 font-semibold text-lg">
                    {rating}/5 - {reviewCount}
                  </span>
                </div>

                {/* Price */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-2xl lg:text-3xl font-bold mb-1">
                    {price}
                  </div>
                  <div className="text-lg text-white/80">
                    soit {discountPrice} avec le crédit d'impôt
                  </div>
                </div>
              </div>

              {/* Key Benefits */}
              <div className="space-y-4">
                {keyPoints.map((point, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg lg:text-xl font-medium">{point}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/custom-request')}
                  className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 shadow-xl text-lg font-bold rounded-xl h-auto transition-all duration-300 hover:scale-105"
                >
                  {primaryCTA}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                {secondaryCTA && (
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate('/nous-recrutons')}
                    className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-bold rounded-xl h-auto backdrop-blur-sm"
                  >
                    {secondaryCTA}
                  </Button>
                )}
              </div>
            </div>

            {/* Right: Image */}
            <div className="relative order-1 lg:order-2">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                <img 
                  src={heroImage} 
                  alt={heroImageAlt} 
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 ring-1 ring-white/20 rounded-3xl"></div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-white rounded-full p-4 shadow-xl">
                <Badge className="bg-primary text-white text-sm font-bold px-3 py-1">
                  Top Service
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pourquoi nous choisir */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Vous allez nous aimer
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Découvrez les avantages qui font de Bikawo votre partenaire de confiance
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className={`group border-0 ${benefit.bgGradient} p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 rounded-2xl`}>
                <CardContent className="text-center p-0">
                  <div className={`w-20 h-20 ${benefit.iconGradient} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {benefit.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Content */}
      {children}
    </main>
  );
};

export default ServicePageLayout;