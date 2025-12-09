import { useMemo } from 'react';

interface HighlightMatch {
  text: string;
  isMatch: boolean;
}

interface SearchHighlightProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}

export const SearchHighlight = ({
  text,
  query,
  className = '',
  highlightClassName = 'bg-yellow-200 dark:bg-yellow-800 rounded px-0.5',
}: SearchHighlightProps) => {
  const parts = useMemo((): HighlightMatch[] => {
    if (!query.trim()) {
      return [{ text, isMatch: false }];
    }

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const segments = text.split(regex);

    return segments
      .filter((segment) => segment)
      .map((segment) => ({
        text: segment,
        isMatch: regex.test(segment),
      }));
  }, [text, query]);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.isMatch ? (
          <mark key={index} className={highlightClassName}>
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </span>
  );
};
