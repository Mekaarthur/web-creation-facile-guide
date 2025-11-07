import { UserRole } from '@/hooks/useAuth';

/**
 * Utilitaires pour la gestion des rôles et permissions
 */

// Routes accessibles à chaque rôle
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  admin: [
    '/modern-admin',
    '/admin',
    '/audit-qualite',
  ],
  provider: [
    '/espace-prestataire',
    '/dashboard-prestataire',
    '/provider-onboarding',
  ],
  client: [
    '/espace-personnel',
    '/dashboard-client',
    '/payment',
    '/reservation',
    '/reservation-confirmee',
  ],
  moderator: [
    '/modern-admin',
  ],
  user: [
    '/espace-personnel',
  ],
};

// Page d'accueil par défaut pour chaque rôle
export const DEFAULT_ROUTE_BY_ROLE: Record<UserRole, string> = {
  admin: '/modern-admin',
  provider: '/espace-prestataire',
  client: '/espace-personnel',
  moderator: '/modern-admin',
  user: '/espace-personnel',
};

/**
 * Vérifie si un utilisateur avec un rôle donné peut accéder à une route
 */
export const canAccessRoute = (userRoles: UserRole[], targetRoute: string): boolean => {
  // Routes publiques accessibles à tous
  const publicRoutes = ['/', '/auth', '/auth/provider', '/services', '/about', '/contact', '/nous-recrutons', '/politique-cookies', '/politique-confidentialite', '/cgu'];
  
  if (publicRoutes.includes(targetRoute)) {
    return true;
  }

  // Vérifier si l'utilisateur a au moins un rôle qui autorise cette route
  return userRoles.some(role => {
    const allowedRoutes = ROLE_ROUTES[role] || [];
    return allowedRoutes.some(allowedRoute => 
      targetRoute.startsWith(allowedRoute)
    );
  });
};

/**
 * Retourne la page d'accueil appropriée pour un rôle
 */
export const getHomeRouteForRole = (role: UserRole | null): string => {
  if (!role) return '/auth';
  return DEFAULT_ROUTE_BY_ROLE[role] || '/';
};

/**
 * Vérifie si un rôle a des permissions d'administration
 */
export const isAdminRole = (role: UserRole): boolean => {
  return role === 'admin' || role === 'moderator';
};

/**
 * Vérifie si un rôle peut voir les données sensibles
 */
export const canViewSensitiveData = (roles: UserRole[]): boolean => {
  return roles.some(role => isAdminRole(role));
};