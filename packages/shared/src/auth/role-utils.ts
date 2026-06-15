import { UserRole } from './useAuth';

export const ROLE_ROUTES: Record<UserRole, string[]> = {
  super_admin:         ['/modern-admin', '/admin', '/audit-qualite'],
  admin:               ['/modern-admin', '/admin', '/audit-qualite'],
  agent_operationnel:  ['/modern-admin'],
  comptable_partenaire:['/modern-admin'],
  support_client:      ['/modern-admin'],
  provider:            ['/espace-prestataire', '/dashboard-prestataire', '/provider-onboarding'],
  client:              ['/espace-personnel', '/dashboard-client', '/payment', '/reservation', '/reservation-confirmee'],
  moderator:           ['/modern-admin'],
  user:                ['/espace-personnel'],
};

export const DEFAULT_ROUTE_BY_ROLE: Record<UserRole, string> = {
  super_admin:          '/modern-admin',
  admin:                '/modern-admin',
  agent_operationnel:   '/modern-admin',
  comptable_partenaire: '/modern-admin',
  support_client:       '/modern-admin',
  provider:             '/espace-prestataire',
  client:               '/espace-personnel',
  moderator:            '/modern-admin',
  user:                 '/espace-personnel',
};

export const canAccessRoute = (userRoles: UserRole[], targetRoute: string): boolean => {
  const publicRoutes = ['/', '/auth', '/auth/provider', '/services', '/about', '/contact', '/nous-recrutons', '/politique-cookies', '/politique-confidentialite', '/cgu'];

  if (publicRoutes.includes(targetRoute)) {
    return true;
  }

  return userRoles.some(role => {
    const allowedRoutes = ROLE_ROUTES[role] || [];
    return allowedRoutes.some(allowedRoute =>
      targetRoute.startsWith(allowedRoute)
    );
  });
};

export const getHomeRouteForRole = (role: UserRole | null): string => {
  if (!role) return '/auth';
  return DEFAULT_ROUTE_BY_ROLE[role] || '/';
};

export const isAdminRole = (role: UserRole): boolean => {
  return role === 'admin' || role === 'moderator';
};

export const canViewSensitiveData = (roles: UserRole[]): boolean => {
  return roles.some(role => isAdminRole(role));
};
