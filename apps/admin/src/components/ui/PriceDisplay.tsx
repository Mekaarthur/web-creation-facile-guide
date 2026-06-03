import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  amount: number;
  originalAmount?: number;
  currency?: string;
  period?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { amount: 'text-lg', original: 'text-sm', period: 'text-xs' },
  md: { amount: 'text-2xl', original: 'text-base', period: 'text-sm' },
  lg: { amount: 'text-4xl', original: 'text-lg', period: 'text-base' },
};

export const PriceDisplay = ({
  amount,
  originalAmount,
  currency = '€',
  period,
  size = 'md',
  className,
}: PriceDisplayProps) => {
  const hasDiscount = originalAmount && originalAmount > amount;
  const discountPercent = hasDiscount
    ? Math.round(((originalAmount - amount) / originalAmount) * 100)
    : 0;

  const formatPrice = (value: number) => {
    return value.toLocaleString('fr-FR', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className={cn('flex items-baseline gap-2 flex-wrap', className)}>
      {hasDiscount && (
        <span
          className={cn(
            'line-through text-muted-foreground',
            sizes[size].original
          )}
        >
          {formatPrice(originalAmount)}{currency}
        </span>
      )}
      
      <span className={cn('font-bold text-foreground', sizes[size].amount)}>
        {formatPrice(amount)}{currency}
      </span>
      
      {period && (
        <span className={cn('text-muted-foreground', sizes[size].period)}>
          /{period}
        </span>
      )}
      
      {hasDiscount && (
        <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-semibold rounded-full">
          -{discountPercent}%
        </span>
      )}
    </div>
  );
};
