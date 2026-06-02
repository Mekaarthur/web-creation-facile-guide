import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: '8 caractères minimum', test: (p) => p.length >= 8 },
  { label: 'Une majuscule', test: (p) => /[A-Z]/.test(p) },
  { label: 'Une minuscule', test: (p) => /[a-z]/.test(p) },
  { label: 'Un chiffre', test: (p) => /[0-9]/.test(p) },
  { label: 'Un caractère spécial', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const PasswordStrength = ({ password, className }: PasswordStrengthProps) => {
  const { score, passed } = useMemo(() => {
    const passed = requirements.map((req) => req.test(password));
    const score = passed.filter(Boolean).length;
    return { score, passed };
  }, [password]);

  const strength = useMemo(() => {
    if (score === 0) return { label: '', color: 'bg-muted' };
    if (score <= 2) return { label: 'Faible', color: 'bg-destructive' };
    if (score <= 3) return { label: 'Moyen', color: 'bg-yellow-500' };
    if (score <= 4) return { label: 'Bon', color: 'bg-primary' };
    return { label: 'Excellent', color: 'bg-green-500' };
  }, [score]);

  if (!password) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Force du mot de passe</span>
          <span className={cn(
            'font-medium',
            score <= 2 && 'text-destructive',
            score === 3 && 'text-yellow-600',
            score >= 4 && 'text-green-600'
          )}>
            {strength.label}
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                i < score ? strength.color : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements list */}
      <ul className="space-y-1">
        {requirements.map((req, i) => (
          <li
            key={i}
            className={cn(
              'flex items-center gap-2 text-xs transition-colors',
              passed[i] ? 'text-green-600' : 'text-muted-foreground'
            )}
          >
            {passed[i] ? (
              <Check className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            )}
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
};
