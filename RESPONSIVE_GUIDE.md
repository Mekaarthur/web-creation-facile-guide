# 📱 Guide Responsive Design - Bikawo

## 🎯 Objectif
Garantir un affichage parfait sur tous les écrans (mobile, tablette, desktop) sans chevauchement de texte ni éléments coupés.

## 🚀 Quick Start

### 1. Composants Responsive Prêts à l'emploi

```tsx
import { 
  ResponsiveContainer, 
  ResponsiveGrid, 
  ResponsiveText, 
  ResponsiveStack 
} from "@/components/ResponsiveContainer";

// Layout de page
<ResponsiveContainer maxWidth="2xl">
  <ResponsiveText variant="h1">Mon Titre</ResponsiveText>
</ResponsiveContainer>

// Grille adaptative
<ResponsiveGrid cols={{ base: 1, sm: 2, lg: 3 }}>
  {items.map(item => <Card key={item.id}>{item.content}</Card>)}
</ResponsiveGrid>
```

### 2. Classes CSS Utilitaires

```tsx
// Typography fluide (s'adapte automatiquement)
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">Titre</h1>

// Espacements adaptatifs
<div className="space-y-4 sm:space-y-6 lg:space-y-8">...</div>

// Padding responsive
<div className="p-4 sm:p-6 lg:p-8">...</div>

// Grilles responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
  ...
</div>
```

## 📐 Breakpoints Tailwind

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `base` | 0px | Mobile par défaut |
| `sm` | 640px | Tablette portrait |
| `md` | 768px | Tablette paysage |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Grand desktop |
| `2xl` | 1536px | Très grand écran |

## ✅ Checklist Responsive

### Typography
- [ ] Utiliser `clamp()` ou classes responsive (`text-xl sm:text-2xl lg:text-3xl`)
- [ ] Line-height: 1.2 pour titres, 1.6 pour texte
- [ ] Min 16px sur inputs (évite zoom iOS)
- [ ] Max-width sur paragraphes longs (65ch optimal)

### Layout
- [ ] Container avec padding: `px-4 sm:px-6 lg:px-8`
- [ ] Grid: 1 col mobile, 2-3 cols desktop
- [ ] Stack vertical mobile, horizontal desktop si pertinent
- [ ] Pas de fixed width, toujours `max-w-*`

### Images
- [ ] `max-width: 100%` et `height: auto`
- [ ] `object-fit: cover` ou `contain`
- [ ] `aspect-ratio` pour éviter layout shift
- [ ] Lazy loading: `loading="lazy"`

### Boutons & CTA
- [ ] Min 44x44px (touch target)
- [ ] `w-full sm:w-auto` pour CTA importants
- [ ] Padding: `px-4 py-2 sm:px-6 sm:py-3`
- [ ] `touch-action: manipulation` pour éviter double tap

### Formulaires
- [ ] `font-size: 16px` sur inputs (évite zoom)
- [ ] `min-height: 44px`
- [ ] Labels visibles et associés
- [ ] Messages d'erreur lisibles

### Navigation
- [ ] Menu hamburger mobile
- [ ] Fixed/sticky avec `z-50`
- [ ] `backdrop-blur` pour effet moderne
- [ ] Touch targets 44px minimum

### Overflow & Spacing
- [ ] `overflow-x: hidden` sur body
- [ ] `word-wrap: break-word` globalement
- [ ] `max-width: 100%` sur tous les containers
- [ ] Espacement cohérent (système 4px: 4, 8, 12, 16, 24, 32...)

## 🎨 Patterns Communs

### Hero Section Responsive
```tsx
<section className="py-12 sm:py-16 lg:py-24">
  <ResponsiveContainer maxWidth="xl">
    <div className="text-center sm:text-left">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
        Bienvenue sur Bikawo
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto sm:mx-0">
        Des services à domicile de qualité
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
        <Button size="lg" className="w-full sm:w-auto">Réserver</Button>
        <Button size="lg" variant="outline" className="w-full sm:w-auto">En savoir plus</Button>
      </div>
    </div>
  </ResponsiveContainer>
</section>
```

### Cards Grid Responsive
```tsx
<ResponsiveGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap="gap-4 sm:gap-6">
  {services.map(service => (
    <Card key={service.id} className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">{service.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm sm:text-base">{service.description}</p>
      </CardContent>
    </Card>
  ))}
</ResponsiveGrid>
```

### Form Responsive
```tsx
<form className="space-y-4 sm:space-y-6">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="space-y-2">
      <label className="text-sm sm:text-base font-medium">Prénom</label>
      <input 
        type="text" 
        className="w-full px-3 py-2 sm:px-4 sm:py-3 text-base border rounded-lg"
      />
    </div>
    <div className="space-y-2">
      <label className="text-sm sm:text-base font-medium">Nom</label>
      <input 
        type="text" 
        className="w-full px-3 py-2 sm:px-4 sm:py-3 text-base border rounded-lg"
      />
    </div>
  </div>
  <Button type="submit" className="w-full sm:w-auto">
    Envoyer
  </Button>
</form>
```

## 🐛 Problèmes Courants & Solutions

### Texte qui se chevauche
**Problème**: Textes superposés sur mobile
**Solution**: 
```css
* {
  word-wrap: break-word;
  overflow-wrap: break-word;
}
```

### Zoom iOS sur focus input
**Problème**: Zoom automatique sur input focus
**Solution**:
```tsx
<input style={{ fontSize: '16px' }} />
```

### Images qui dépassent
**Problème**: Images plus larges que le container
**Solution**:
```css
img {
  max-width: 100%;
  height: auto;
}
```

### Grid qui ne s'adapte pas
**Problème**: Grilles fixes sur mobile
**Solution**:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
  {/* Utiliser breakpoints explicites */}
</div>
```

### Boutons trop petits sur mobile
**Problème**: Touch targets < 44px
**Solution**:
```tsx
<button className="min-h-[44px] min-w-[44px] px-4 py-2">
  Action
</button>
```

## 🔧 Outils de Test

### Simulateur navigateur
1. Chrome DevTools: `Cmd+Shift+M` (Mac) / `Ctrl+Shift+M` (Windows)
2. Tester sur: iPhone SE, iPhone 14, iPad, Desktop

### Tests réels
- iPhone: Safari mobile
- Android: Chrome mobile
- Tablette: Safari/Chrome

### Checklist de test
- [ ] Textes lisibles sans zoom
- [ ] Pas de scroll horizontal
- [ ] Boutons cliquables facilement
- [ ] Images chargées correctement
- [ ] Formulaires utilisables
- [ ] Navigation fonctionnelle

## 📚 Ressources

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Web.dev Performance](https://web.dev/performance/)

## 🎯 Métriques de Performance

### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Optimisations
- Lazy loading images
- Font display: swap
- Compression images (WebP)
- CSS/JS minification