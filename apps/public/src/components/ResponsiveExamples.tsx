/**
 * 📱 Guide Responsive Design - Bikawo
 * 
 * Ce fichier contient des exemples d'utilisation des composants responsive
 * et des bonnes pratiques pour garantir un affichage parfait sur tous les écrans.
 */

import { ResponsiveContainer, ResponsiveGrid, ResponsiveText, ResponsiveStack } from "./ResponsiveContainer";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

/**
 * ✅ EXEMPLE 1: Layout de page responsive
 * Utilise ResponsiveContainer pour centrer et padding automatique
 */
export const ResponsivePageLayout = () => (
  <ResponsiveContainer maxWidth="2xl" className="py-6 sm:py-8 lg:py-12">
    <ResponsiveStack spacing="lg">
      <ResponsiveText variant="h1" as="h1">
        Titre Principal Responsive
      </ResponsiveText>
      <ResponsiveText variant="body" className="text-muted-foreground">
        Ce texte s'adapte automatiquement à la taille de l'écran avec une typographie fluide.
      </ResponsiveText>
    </ResponsiveStack>
  </ResponsiveContainer>
);

/**
 * ✅ EXEMPLE 2: Grille responsive avec cards
 * 1 colonne mobile, 2 colonnes tablette, 3 colonnes desktop
 */
export const ResponsiveCardGrid = () => (
  <ResponsiveContainer>
    <ResponsiveGrid 
      cols={{ base: 1, sm: 2, lg: 3 }}
      gap="gap-4 sm:gap-6 lg:gap-8"
    >
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Card key={item} className="h-full">
          <CardHeader>
            <CardTitle>Card {item}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveText variant="body">
              Contenu adaptatif qui reste lisible sur tous les écrans.
            </ResponsiveText>
          </CardContent>
        </Card>
      ))}
    </ResponsiveGrid>
  </ResponsiveContainer>
);

/**
 * ✅ EXEMPLE 3: Formulaire responsive
 * Utilise les classes de base pour garantir la lisibilité
 */
export const ResponsiveForm = () => (
  <ResponsiveContainer maxWidth="md">
    <Card>
      <CardHeader>
        <ResponsiveText variant="h2" as="h2">
          Formulaire Responsive
        </ResponsiveText>
      </CardHeader>
      <CardContent>
        <ResponsiveStack spacing="md">
          {/* Les inputs ont automatiquement font-size: 16px sur mobile pour éviter le zoom iOS */}
          <div className="space-y-2">
            <label className="text-sm sm:text-base font-medium">
              Nom complet
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="Votre nom"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm sm:text-base font-medium">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="votre@email.com"
            />
          </div>
          
          {/* Bouton pleine largeur sur mobile, largeur auto sur desktop */}
          <Button className="w-full sm:w-auto">
            Envoyer
          </Button>
        </ResponsiveStack>
      </CardContent>
    </Card>
  </ResponsiveContainer>
);

/**
 * ✅ EXEMPLE 4: Section Hero responsive
 * Texte centré mobile, aligné à gauche desktop
 */
export const ResponsiveHero = () => (
  <ResponsiveContainer className="py-12 sm:py-16 lg:py-24">
    <div className="text-center sm:text-left">
      <ResponsiveText 
        variant="h1" 
        as="h1"
        className="mb-4 sm:mb-6"
      >
        Bienvenue sur Bikawo
      </ResponsiveText>
      
      <ResponsiveText 
        variant="h3" 
        as="p"
        className="text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto sm:mx-0"
      >
        Des services à domicile de qualité, disponibles partout en France
      </ResponsiveText>
      
      {/* Stack vertical mobile, horizontal desktop */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
        <Button size="lg" className="w-full sm:w-auto">
          Réserver maintenant
        </Button>
        <Button size="lg" variant="outline" className="w-full sm:w-auto">
          En savoir plus
        </Button>
      </div>
    </div>
  </ResponsiveContainer>
);

/**
 * ✅ EXEMPLE 5: Navigation responsive
 * Menu hamburger mobile, barre horizontale desktop
 */
export const ResponsiveNav = () => (
  <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
    <ResponsiveContainer>
      <div className="flex items-center justify-between h-16 sm:h-20">
        {/* Logo */}
        <ResponsiveText variant="h4" as="span" className="font-bold">
          Bikawo
        </ResponsiveText>
        
        {/* Menu desktop (caché sur mobile) */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm lg:text-base hover:text-primary transition-colors">
            Services
          </a>
          <a href="#" className="text-sm lg:text-base hover:text-primary transition-colors">
            À propos
          </a>
          <a href="#" className="text-sm lg:text-base hover:text-primary transition-colors">
            Contact
          </a>
          <Button size="sm">
            Connexion
          </Button>
        </div>
        
        {/* Hamburger menu (visible sur mobile) */}
        <button className="md:hidden p-2 touch-target" aria-label="Menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </ResponsiveContainer>
  </nav>
);

/**
 * ✅ EXEMPLE 6: Images responsives
 * Images qui s'adaptent sans déformation
 */
export const ResponsiveImages = () => (
  <ResponsiveContainer>
    <ResponsiveGrid cols={{ base: 1, md: 2 }} gap="gap-6">
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <img
          src="/api/placeholder/800/600"
          alt="Service de ménage"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <img
          src="/api/placeholder/800/600"
          alt="Service de repassage"
          className="w-full h-full object-cover"
        />
      </div>
    </ResponsiveGrid>
  </ResponsiveContainer>
);

/**
 * 📋 BONNES PRATIQUES RESPONSIVE
 * 
 * 1. TYPOGRAPHIE:
 *    - Utilisez ResponsiveText ou clamp() pour une taille fluide
 *    - Min 16px pour les inputs (évite zoom iOS)
 *    - line-height adapté: 1.2 titres, 1.6 texte
 * 
 * 2. ESPACEMENTS:
 *    - Utilisez ResponsiveStack ou space-y-{X} avec breakpoints
 *    - Mobile: espacements réduits (1-2rem)
 *    - Desktop: espacements généreux (2-4rem)
 * 
 * 3. GRILLES:
 *    - ResponsiveGrid avec cols adaptatifs
 *    - Mobile: 1 colonne (lisibilité)
 *    - Tablette: 2 colonnes
 *    - Desktop: 3-4 colonnes
 * 
 * 4. BOUTONS:
 *    - Min 44x44px (touch target)
 *    - w-full sur mobile, w-auto sur desktop
 *    - padding: 0.75rem-1rem
 * 
 * 5. IMAGES:
 *    - Toujours max-width: 100%
 *    - height: auto
 *    - object-fit: cover ou contain
 *    - aspect-ratio pour éviter layout shift
 * 
 * 6. OVERFLOW:
 *    - overflow-x: hidden sur body
 *    - word-wrap: break-word
 *    - max-width: 100% sur tous les éléments
 * 
 * 7. NAVIGATION:
 *    - Menu hamburger mobile
 *    - Barre horizontale desktop
 *    - z-index élevé (50+)
 *    - backdrop-blur pour effet moderne
 * 
 * 8. FORMULAIRES:
 *    - font-size: 16px (évite zoom)
 *    - min-height: 44px
 *    - padding généreux
 *    - labels visibles et clairs
 */

/**
 * 🎨 CLASSES UTILITAIRES CUSTOM
 * 
 * Utilisez ces classes pour un responsive rapide:
 * 
 * - .touch-target : min 44x44px pour mobile
 * - .mobile-p-4 : padding adaptatif
 * - .text-responsive : taille fluide
 * - .card-mobile : card optimisée mobile
 * - .hero-mobile : hero responsive
 * - .cta-mobile : bouton CTA mobile
 * - .grid-responsive : grille auto-adaptative
 */