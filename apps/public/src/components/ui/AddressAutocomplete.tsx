import { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressSuggestion {
  label: string;
  housenumber?: string;
  street?: string;
  postcode?: string;
  city?: string;
  citycode?: string;
  x: number;
  y: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: { address: string; city: string; postcode: string; lat: number; lon: number }) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  showIcon?: boolean;
}

const AddressAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder = "Saisissez une adresse",
  className,
  required,
  showIcon = true,
}: AddressAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      // API adresse.data.gouv.fr — gratuite, sans limite, CORS ok, France uniquement
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=6&autocomplete=1`
      );
      const data = await response.json();
      const features: AddressSuggestion[] = (data.features || []).map((f: any) => ({
        label: f.properties.label,
        housenumber: f.properties.housenumber,
        street: f.properties.street,
        postcode: f.properties.postcode,
        city: f.properties.city,
        citycode: f.properties.citycode,
        x: f.geometry.coordinates[0],
        y: f.geometry.coordinates[1],
      }));
      setSuggestions(features);
      setShowDropdown(features.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    onChange(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(val), 400);
  };

  const handleSelect = (s: AddressSuggestion) => {
    onChange(s.label);
    setShowDropdown(false);
    setSuggestions([]);
    onSelect?.({
      address: s.label,
      city: s.city || '',
      postcode: s.postcode || '',
      lat: s.y,
      lon: s.x,
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {showIcon && (
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className={cn(showIcon && "pl-10", className)}
          required={required}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border last:border-0"
              onClick={() => handleSelect(s)}
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <span className="text-foreground line-clamp-2">{s.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
