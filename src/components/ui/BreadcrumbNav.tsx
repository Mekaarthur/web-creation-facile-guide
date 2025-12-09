import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbNavItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbNavItem[];
  className?: string;
  showHome?: boolean;
}

export const BreadcrumbNav = ({
  items,
  className,
  showHome = true,
}: BreadcrumbNavProps) => {
  const allItems = showHome
    ? [{ label: 'Accueil', href: '/' }, ...items]
    : items;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center gap-1 text-sm">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isHome = index === 0 && showHome;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
              )}

              {isLast ? (
                <span className="font-medium text-foreground">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  to={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  {isHome && <Home className="w-4 h-4" />}
                  {!isHome && item.label}
                </Link>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1">
                  {isHome && <Home className="w-4 h-4" />}
                  {!isHome && item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
