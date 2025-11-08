import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  noPadding?: boolean;
}

export const ResponsiveContainer = ({ 
  children, 
  className = "",
  maxWidth = "2xl",
  noPadding = false
}: ResponsiveContainerProps) => {
  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full"
  };

  return (
    <div 
      className={cn(
        "w-full mx-auto",
        maxWidthClasses[maxWidth],
        !noPadding && "px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {children}
    </div>
  );
};

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    base?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: string;
}

export const ResponsiveGrid = ({ 
  children, 
  className = "",
  cols = { base: 1, sm: 2, lg: 3 },
  gap = "gap-4 sm:gap-6"
}: ResponsiveGridProps) => {
  const gridCols = `grid-cols-${cols.base || 1} ${cols.sm ? `sm:grid-cols-${cols.sm}` : ''} ${cols.md ? `md:grid-cols-${cols.md}` : ''} ${cols.lg ? `lg:grid-cols-${cols.lg}` : ''} ${cols.xl ? `xl:grid-cols-${cols.xl}` : ''}`;
  
  return (
    <div className={cn("grid", gridCols, gap, className)}>
      {children}
    </div>
  );
};

interface ResponsiveTextProps {
  children: ReactNode;
  variant?: "h1" | "h2" | "h3" | "h4" | "body" | "small";
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

export const ResponsiveText = ({ 
  children, 
  variant = "body",
  className = "",
  as 
}: ResponsiveTextProps) => {
  const variantClasses = {
    h1: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight",
    h2: "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight",
    h3: "text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold leading-snug",
    h4: "text-base sm:text-lg md:text-xl lg:text-2xl font-medium leading-snug",
    body: "text-sm sm:text-base leading-relaxed",
    small: "text-xs sm:text-sm leading-normal"
  };

  const Component = as || (variant.startsWith('h') ? variant : 'p') as keyof JSX.IntrinsicElements;

  return (
    <Component className={cn(variantClasses[variant], className)}>
      {children}
    </Component>
  );
};

interface ResponsiveStackProps {
  children: ReactNode;
  className?: string;
  spacing?: "xs" | "sm" | "md" | "lg" | "xl";
  direction?: "vertical" | "horizontal";
}

export const ResponsiveStack = ({ 
  children, 
  className = "",
  spacing = "md",
  direction = "vertical"
}: ResponsiveStackProps) => {
  const spacingClasses = {
    xs: direction === "vertical" ? "space-y-2" : "space-x-2",
    sm: direction === "vertical" ? "space-y-3 sm:space-y-4" : "space-x-3 sm:space-x-4",
    md: direction === "vertical" ? "space-y-4 sm:space-y-6" : "space-x-4 sm:space-x-6",
    lg: direction === "vertical" ? "space-y-6 sm:space-y-8" : "space-x-6 sm:space-x-8",
    xl: direction === "vertical" ? "space-y-8 sm:space-y-12" : "space-x-8 sm:space-x-12"
  };

  return (
    <div className={cn(
      "flex",
      direction === "vertical" ? "flex-col" : "flex-row flex-wrap",
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
};