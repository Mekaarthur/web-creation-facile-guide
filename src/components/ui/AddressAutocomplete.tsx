import { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressSuggestion {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    postcode?: string;
  };
  lat: string;
  lon: string;
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=fr&addressdetails=1&limit=5`,
        { headers: { 'Accept-Language': 'fr' } }
      );
      const data: AddressSuggestion[] = await response.json();
      setSuggestions(data || []);
      setShowDropdown((data || []).length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    onChange(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(val), 600);
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    const addr = suggestion.address;
    const parts = [addr.house_number, addr.road].filter(Boolean).join(' ');
    const city = addr.city || addr.town || addr.village || addr.municipality || '';
    const postcode = addr.postcode || '';
    const fullAddress = [parts, postcode, city].filter(Boolean).join(', ');

    onChange(fullAddress);
    setShowDropdown(false);
    setSuggestions([]);

    onSelect?.({
      address: fullAddress,
      city,
      postcode,
      lat: parseFloat(suggestion.lat),
      lon: parseFloat(suggestion.lon),
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
                <span className="text-foreground line-clamp-2">{s.display_name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
