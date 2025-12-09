import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'service' | 'page' | 'article' | 'help';
  url: string;
  icon?: React.ReactNode;
}

const SEARCH_DATA: SearchResult[] = [
  // Services
  { id: 'bika-kids', title: 'Bika Kids', description: 'Garde d\'enfants et babysitting', category: 'service', url: '/bika-kids' },
  { id: 'bika-maison', title: 'Bika Maison', description: 'Ménage, repassage, organisation', category: 'service', url: '/bika-maison' },
  { id: 'bika-vie', title: 'Bika Vie', description: 'Assistance administrative et quotidienne', category: 'service', url: '/bika-vie' },
  { id: 'bika-seniors', title: 'Bika Seniors', description: 'Accompagnement personnes âgées', category: 'service', url: '/bika-seniors' },
  { id: 'bika-animals', title: 'Bika Animals', description: 'Garde et promenade d\'animaux', category: 'service', url: '/bika-animals' },
  { id: 'bika-travel', title: 'Bika Travel', description: 'Services de voyage et transport', category: 'service', url: '/bika-travel' },
  { id: 'bika-plus', title: 'Bika Plus', description: 'Services premium personnalisés', category: 'service', url: '/bika-plus' },
  { id: 'bika-pro', title: 'Bika Pro', description: 'Services pour professionnels', category: 'service', url: '/bika-pro' },
  
  // Pages
  { id: 'services', title: 'Tous nos services', description: 'Découvrir l\'ensemble de nos prestations', category: 'page', url: '/services' },
  { id: 'espace-client', title: 'Mon espace client', description: 'Gérer mes réservations et mon compte', category: 'page', url: '/espace-personnel' },
  { id: 'contact', title: 'Contact', description: 'Nous contacter', category: 'page', url: '/contact' },
  { id: 'about', title: 'À propos', description: 'En savoir plus sur Bikawo', category: 'page', url: '/a-propos-de-nous' },
  { id: 'blog', title: 'Blog', description: 'Nos articles et conseils', category: 'page', url: '/blog' },
  
  // Help
  { id: 'aide', title: 'Centre d\'aide', description: 'FAQ et assistance', category: 'help', url: '/aide' },
  { id: 'devenir-prestataire', title: 'Devenir prestataire', description: 'Rejoindre l\'équipe Bikawo', category: 'page', url: '/nous-recrutons' },
];

const POPULAR_SEARCHES = ['Garde d\'enfants', 'Ménage', 'Babysitting', 'Aide administrative'];

export const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('bikawo-recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = SEARCH_DATA.filter(item => 
      item.title.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm)
    ).slice(0, 8);

    setResults(filtered);
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const saveSearch = useCallback((term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('bikawo-recent-searches', JSON.stringify(updated));
  }, [recentSearches]);

  const handleSelect = (result: SearchResult) => {
    saveSearch(result.title);
    setIsOpen(false);
    navigate(result.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getCategoryLabel = (category: SearchResult['category']) => {
    const labels = {
      service: 'Service',
      page: 'Page',
      article: 'Article',
      help: 'Aide'
    };
    return labels[category];
  };

  const getCategoryColor = (category: SearchResult['category']) => {
    const colors = {
      service: 'bg-primary/10 text-primary',
      page: 'bg-secondary text-secondary-foreground',
      article: 'bg-accent text-accent-foreground',
      help: 'bg-muted text-muted-foreground'
    };
    return colors[category];
  };

  return (
    <>
      {/* Search trigger button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 text-muted-foreground hover:text-foreground w-64"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left text-sm">Rechercher...</span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Mobile search icon */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="md:hidden"
      >
        <Search className="w-5 h-5" />
      </Button>

      {/* Search dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b">
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher un service, une page..."
              className="border-0 focus-visible:ring-0 px-0 h-14 text-base"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuery('')}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {query && results.length > 0 ? (
              <div className="p-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                      selectedIndex === index 
                        ? "bg-primary/10" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">
                          {result.title}
                        </span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                          getCategoryColor(result.category)
                        )}>
                          {getCategoryLabel(result.category)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {result.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : query && results.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>Aucun résultat pour "{query}"</p>
                <p className="text-sm mt-1">Essayez d'autres termes de recherche</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-2 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <Clock className="w-3 h-3" />
                      Recherches récentes
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term, i) => (
                        <button
                          key={i}
                          onClick={() => setQuery(term)}
                          className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular searches */}
                <div>
                  <div className="flex items-center gap-2 px-2 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <TrendingUp className="w-3 h-3" />
                    Recherches populaires
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(term)}
                        className="px-3 py-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-full transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px]">↑↓</kbd>
                naviguer
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px]">↵</kbd>
                sélectionner
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px]">esc</kbd>
              fermer
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
