import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Heart, 
  Users, 
  PawPrint, 
  Home, 
  Plane, 
  Baby, 
  ShieldCheck,
  Clock,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Euro,
  Calendar,
  Award,
  Briefcase,
  Target,
  TrendingUp,
  HandHeart,
  CheckCircle
} from 'lucide-react';

// Import images that exist in the project
import heroFamilySupport from '@/assets/hero-family-support.jpg';
import serviceChildcare from '@/assets/service-childcare-home.jpg';
import serviceSeniors from '@/assets/service-seniors-care.jpg';
import serviceAnimals from '@/assets/service-animals.jpg';
import serviceHome from '@/assets/service-home-cleaning.jpg';

const DigitalFlyer = () => {
  const [currentSide, setCurrentSide] = useState<'front' | 'back' | 'advantages'>('front');

  const services = [
    { icon: Baby, title: "BIKA KIDS", subtitle: "GARDE ET AIDE AUX DEVOIRS", color: "text-yellow-600" },
    { icon: Plane, title: "BIKA TRAVEL", subtitle: "ASSISTANCE AÉROPORTUAIRE", color: "text-blue-600" },
    { icon: PawPrint, title: "BIKA ANIMALS", subtitle: "PROMENADES ET SOINS", color: "text-orange-600" },
    { icon: Home, title: "BIKA MAISON", subtitle: "COURSES ET ORGANISATION", color: "text-green-600" },
    { icon: Users, title: "BIKA PERSONNE ÂGÉE", subtitle: "COURSES ET COMPAGNIE", color: "text-purple-600" },
    { icon: Star, title: "BIKA PLUS", subtitle: "SERVICES SUR DEMANDE", color: "text-pink-600" }
  ];

  const advantages = [
    "AVANCE IMMÉDIATE CRÉDIT D'IMPÔTS 50%",
    "FACILITÉ & RÉACTIVITÉ", 
    "PERSONNEL DE CONFIANCE"
  ];

  const steps = [
    "VOUS NOUS CONTACTEZ",
    "NOUS DÉFINISSONS ENSEMBLE VOS BESOINS",
    "NOUS INTERVENONS À VOTRE CONVENANCE"
  ];

  const polaroidImages = [
    { src: serviceChildcare, alt: "Garde d'enfants", rotation: "-rotate-3" },
    { src: serviceSeniors, alt: "Aide aux seniors", rotation: "rotate-2" },
    { src: serviceHome, alt: "Services maison", rotation: "-rotate-1" },
    { src: serviceAnimals, alt: "Soins animaux", rotation: "rotate-3" }
  ];

  const clientAdvantages = [
    {
      icon: Euro,
      title: "Crédit d'impôt 50%",
      description: "Bénéficiez d'un crédit d'impôt immédiat sur tous nos services"
    },
    {
      icon: Clock,
      title: "Disponibilité 7j/7",
      description: "Service client réactif et prestataires disponibles quand vous en avez besoin"
    },
    {
      icon: ShieldCheck,
      title: "Personnel vérifié",
      description: "Tous nos prestataires sont sélectionnés et formés avec soin"
    },
    {
      icon: Heart,
      title: "Programme de parrainage",
      description: "20€ de crédits offerts pour vous et votre filleul après sa 1ère mission"
    }
  ];

  const providerAdvantages = [
    {
      icon: TrendingUp,
      title: "Revenus complémentaires",
      description: "Augmentez vos revenus avec des missions flexibles et bien rémunérées"
    },
    {
      icon: Calendar,
      title: "Flexibilité totale",
      description: "Choisissez vos horaires et vos missions selon votre disponibilité"
    },
    {
      icon: Award,
      title: "Formation continue",
      description: "Accès à des formations pour développer vos compétences"
    },
    {
      icon: HandHeart,
      title: "Programme de parrainage",
      description: "30€ offerts après que votre filleul ait complété 5 missions avec un bon score"
    },
    {
      icon: Briefcase,
      title: "Support professionnel",
      description: "Accompagnement personnalisé et assistance technique"
    },
    {
      icon: Target,
      title: "Missions qualifiées",
      description: "Accès à des clients pré-qualifiés et motivés"
    }
  ];

  const FrontSide = () => (
    <div className="relative w-full h-full bg-gradient-to-br from-amber-100 to-orange-200 overflow-hidden">
      {/* Decorative stars */}
      <div className="absolute top-8 left-8">
        <Star className="w-8 h-8 text-amber-600 fill-current transform rotate-12" />
      </div>
      <div className="absolute top-12 right-12">
        <Star className="w-6 h-6 text-orange-500 fill-current transform -rotate-12" />
      </div>
      <div className="absolute bottom-16 left-16">
        <Star className="w-7 h-7 text-amber-500 fill-current transform rotate-45" />
      </div>
      <div className="absolute bottom-8 right-8">
        <Star className="w-5 h-5 text-orange-600 fill-current transform -rotate-45" />
      </div>

      {/* QR Code section */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <div className="bg-white p-4 rounded-lg shadow-lg border-4 border-white transform rotate-3">
          <QrCode className="w-20 h-20 text-gray-800" />
          <div className="text-center mt-2 text-xs font-bold text-gray-800">
            BIKAWO
          </div>
        </div>
      </div>

      {/* Main title */}
      <div className="text-center pt-32 pb-8">
        <div className="text-4xl font-bold text-gray-800 mb-2">BIKAWO</div>
        <div className="text-lg font-medium text-gray-700 tracking-wider">
          LE PLAISIR D'ACCOMPAGNER
        </div>
      </div>

      {/* Polaroid photos arrangement */}
      <div className="relative flex justify-center items-center min-h-[400px] px-8">
        {polaroidImages.map((image, index) => (
          <div
            key={index}
            className={`absolute bg-white p-3 shadow-xl transform ${image.rotation} hover:scale-105 transition-transform duration-300`}
            style={{
              zIndex: index + 1,
              left: `${20 + index * 15}%`,
              top: `${10 + (index % 2) * 30}%`
            }}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-32 h-32 object-cover"
            />
            <div className="text-center mt-2 text-xs font-medium text-gray-700">
              {image.alt}
            </div>
          </div>
        ))}
        
        {/* Heart decoration */}
        <div className="absolute bottom-16 left-8">
          <Heart className="w-12 h-12 text-red-400 fill-current" />
        </div>
      </div>

      {/* Contact info */}
      <div className="absolute bottom-4 left-4 text-sm text-gray-700">
        <div className="flex items-center mb-1">
          <Phone className="w-4 h-4 mr-2" />
          +33 0609085390
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 text-sm text-gray-700">
        <div className="flex items-center mb-1">
          <Mail className="w-4 h-4 mr-2" />
          CONTACT@BIKAWO.COM
        </div>
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          ÎLE DE FRANCE
        </div>
      </div>
    </div>
  );

  const BackSide = () => (
    <div className="w-full h-full bg-white p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-3xl font-bold text-primary mb-2">BIKAWO</div>
        <div className="text-lg text-muted-foreground">Le Plaisir d'accompagner</div>
      </div>

      {/* Main images */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <img src={serviceHome} alt="Services maison" className="w-full h-32 object-cover rounded-lg" />
        <img src={serviceChildcare} alt="Garde d'enfants" className="w-full h-32 object-cover rounded-lg" />
      </div>

      {/* Services section */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-center mb-6 text-gray-800">NOS SERVICES</h3>
        <div className="grid grid-cols-2 gap-4">
          {services.map((service, index) => (
            <div key={index} className="flex items-center space-x-3">
              <service.icon className={`w-6 h-6 ${service.color}`} />
              <div className="text-sm">
                <div className="font-semibold text-gray-800">{service.title}</div>
                <div className="text-gray-600">{service.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QR Code center */}
      <div className="text-center mb-8">
        <div className="font-bold text-lg mb-2">SCANNE ET REJOINT-NOUS</div>
        <div className="flex justify-center">
          <QrCode className="w-24 h-24 text-gray-800" />
        </div>
      </div>

      {/* Bottom images */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <img src={serviceAnimals} alt="Soins animaux" className="w-full h-24 object-cover rounded-lg" />
        <img src={serviceSeniors} alt="Aide seniors" className="w-full h-24 object-cover rounded-lg" />
      </div>

      {/* Bottom sections */}
      <div className="grid grid-cols-2 gap-8 text-sm">
        <div>
          <h4 className="font-bold mb-3 text-gray-800">AVANTAGES</h4>
          <ul className="space-y-1">
            {advantages.map((advantage, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-2 flex-shrink-0"></div>
                <span className="text-gray-700">{advantage}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold mb-3 text-gray-800">COMMENT ÇA MARCHE</h4>
          <ul className="space-y-1">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-secondary rounded-full mt-2 mr-2 flex-shrink-0"></div>
                <span className="text-gray-700">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const AdvantagesSide = () => (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-3xl font-bold text-primary mb-2">BIKAWO</div>
        <div className="text-lg text-muted-foreground">Avantages pour tous</div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 h-full">
        {/* Client Advantages */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="text-center mb-6">
            <Users className="w-12 h-12 text-primary mx-auto mb-3" />
            <h3 className="text-xl font-bold text-gray-800">Avantages Clients</h3>
          </div>
          <div className="space-y-4">
            {clientAdvantages.map((advantage, index) => (
              <div key={index} className="flex items-start space-x-3">
                <advantage.icon className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">{advantage.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{advantage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Provider Advantages */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="text-center mb-6">
            <Briefcase className="w-12 h-12 text-secondary mx-auto mb-3" />
            <h3 className="text-xl font-bold text-gray-800">Avantages Prestataires</h3>
          </div>
          <div className="space-y-3">
            {providerAdvantages.map((advantage, index) => (
              <div key={index} className="flex items-start space-x-3">
                <advantage.icon className="w-5 h-5 text-secondary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">{advantage.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{advantage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="text-center mt-8">
        <div className="bg-white/80 rounded-lg p-4 backdrop-blur-sm">
          <p className="text-sm text-gray-700 mb-3">
            Rejoignez la communauté Bikawo dès aujourd'hui !
          </p>
          <div className="flex justify-center space-x-4">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
              <Phone className="w-3 h-3 mr-1" />
              +33 0609085390
            </Badge>
            <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary">
              <Mail className="w-3 h-3 mr-1" />
              contact@bikawo.com
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Nos Flyers Digitaux</h2>
        <p className="text-gray-600 mb-6">
          Découvrez nos services à travers nos flyers interactifs
        </p>
        
        {/* Toggle buttons */}
        <div className="flex justify-center space-x-2 mb-8 flex-wrap">
          <Button
            variant={currentSide === 'front' ? 'default' : 'outline'}
            onClick={() => setCurrentSide('front')}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Recto</span>
          </Button>
          <Button
            variant={currentSide === 'back' ? 'default' : 'outline'}
            onClick={() => setCurrentSide('back')}
            className="flex items-center space-x-2"
          >
            <span>Verso</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant={currentSide === 'advantages' ? 'default' : 'outline'}
            onClick={() => setCurrentSide('advantages')}
            className="flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Avantages</span>
          </Button>
        </div>
      </div>

      {/* Flyer container */}
      <Card className="mx-auto w-full max-w-2xl shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="aspect-[3/4] relative">
            {currentSide === 'front' && <FrontSide />}
            {currentSide === 'back' && <BackSide />}
            {currentSide === 'advantages' && <AdvantagesSide />}
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="text-center mt-8 space-y-4">
        <div className="flex justify-center space-x-4">
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            Télécharger PDF
          </Button>
          <Button size="lg" variant="outline">
            Partager
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          Format optimisé pour impression A4 ou diffusion digitale
        </p>
      </div>
    </div>
  );
};

export default DigitalFlyer;