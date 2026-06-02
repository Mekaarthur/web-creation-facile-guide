import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Keyboard, Search, Home, ShoppingCart, User, HelpCircle } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  icon: React.ReactNode;
  action?: () => void;
}

export const KeyboardShortcuts = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const shortcuts: Shortcut[] = [
    {
      keys: ['⌘', 'K'],
      description: 'Ouvrir la recherche',
      icon: <Search className="w-4 h-4" />,
    },
    {
      keys: ['G', 'H'],
      description: 'Aller à l\'accueil',
      icon: <Home className="w-4 h-4" />,
      action: () => navigate('/'),
    },
    {
      keys: ['G', 'S'],
      description: 'Aller aux services',
      icon: <ShoppingCart className="w-4 h-4" />,
      action: () => navigate('/services'),
    },
    {
      keys: ['G', 'P'],
      description: 'Aller au profil',
      icon: <User className="w-4 h-4" />,
      action: () => navigate('/espace-personnel'),
    },
    {
      keys: ['?'],
      description: 'Afficher les raccourcis',
      icon: <HelpCircle className="w-4 h-4" />,
    },
    {
      keys: ['Esc'],
      description: 'Fermer les modales',
      icon: <Keyboard className="w-4 h-4" />,
    },
  ];

  useEffect(() => {
    let keySequence: string[] = [];
    let sequenceTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Show shortcuts with ?
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      // Handle key sequences (G + H, G + S, etc.)
      clearTimeout(sequenceTimeout);
      keySequence.push(e.key.toUpperCase());

      // Check for matches
      if (keySequence.length >= 2) {
        const sequence = keySequence.slice(-2).join('');
        
        if (sequence === 'GH') {
          e.preventDefault();
          navigate('/');
          keySequence = [];
        } else if (sequence === 'GS') {
          e.preventDefault();
          navigate('/services');
          keySequence = [];
        } else if (sequence === 'GP') {
          e.preventDefault();
          navigate('/espace-personnel');
          keySequence = [];
        }
      }

      // Reset sequence after 1 second
      sequenceTimeout = setTimeout(() => {
        keySequence = [];
      }, 1000);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(sequenceTimeout);
    };
  }, [navigate]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Raccourcis clavier
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  {shortcut.icon}
                </span>
                <span className="text-sm text-foreground">
                  {shortcut.description}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className="px-2 py-1 bg-muted border rounded text-xs font-mono text-muted-foreground"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Appuyez sur <kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">?</kbd> à tout moment pour afficher ce panneau
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
