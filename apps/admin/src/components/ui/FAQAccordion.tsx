import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  className?: string;
  allowMultiple?: boolean;
}

export const FAQAccordion = ({
  items,
  className,
  allowMultiple = false,
}: FAQAccordionProps) => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    } else {
      setOpenItems((prev) =>
        prev.includes(index) ? [] : [index]
      );
    }
  };

  return (
    <div className={cn('divide-y divide-border rounded-xl border', className)}>
      {items.map((item, index) => {
        const isOpen = openItems.includes(index);
        
        return (
          <div key={index}>
            <button
              onClick={() => toggleItem(index)}
              className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium text-foreground pr-4">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
            
            <div
              className={cn(
                'overflow-hidden transition-all duration-200',
                isOpen ? 'max-h-96' : 'max-h-0'
              )}
            >
              <p className="p-4 pt-0 text-muted-foreground text-sm leading-relaxed">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
