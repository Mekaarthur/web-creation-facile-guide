import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { forwardRef, ReactNode } from "react";

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  animationType?: "fade" | "scale" | "slide" | "float";
  delay?: number;
  hover?: boolean;
  children?: ReactNode;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, animationType = "fade", delay = 0, hover = true, children, ...props }, ref) => {
    const getAnimationClass = () => {
      switch (animationType) {
        case "scale":
          return "animate-scale-in";
        case "slide":
          return "animate-slide-in-right";
        case "float":
          return "animate-float";
        default:
          return "animate-fade-in-up";
      }
    };

    return (
      <Card
        ref={ref}
        className={cn(
          getAnimationClass(),
          hover && "transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
          "border-border/50 bg-card/50 backdrop-blur-sm",
          className
        )}
        style={{ animationDelay: `${delay}ms` }}
        {...props}
      >
        {children}
      </Card>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

export const AnimatedCardGrid = ({ 
  children, 
  staggerDelay = 100 
}: { 
  children: React.ReactNode[];
  staggerDelay?: number;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children.map((child, index) => (
        <div key={index} style={{ animationDelay: `${index * staggerDelay}ms` }}>
          {child}
        </div>
      ))}
    </div>
  );
};