import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

interface InfiniteScrollLoaderProps {
  isLoading: boolean;
  hasMore: boolean;
  itemsLoaded?: number;
  totalItems?: number;
}

const InfiniteScrollLoader = forwardRef<HTMLDivElement, InfiniteScrollLoaderProps>(
  ({ isLoading, hasMore, itemsLoaded, totalItems }, ref) => {
    return (
      <div 
        ref={ref} 
        className="w-full py-8 flex flex-col items-center justify-center gap-2"
      >
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm">Chargement...</span>
          </div>
        )}
        
        {!isLoading && hasMore && (
          <div className="h-4 w-4 bg-primary/20 rounded-full animate-pulse" />
        )}
        
        {!hasMore && itemsLoaded && totalItems && (
          <p className="text-sm text-muted-foreground">
            {itemsLoaded} sur {totalItems} éléments affichés
          </p>
        )}
      </div>
    );
  }
);

InfiniteScrollLoader.displayName = "InfiniteScrollLoader";

export default InfiniteScrollLoader;