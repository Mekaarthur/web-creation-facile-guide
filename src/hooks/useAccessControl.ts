import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook pour logger les tentatives d'accès non autorisées
 * et détecter les comportements suspects
 */
export const useAccessControl = () => {
  const { user, roles, primaryRole } = useAuth();

  const logAccessAttempt = useCallback((
    page: string,
    isAuthorized: boolean,
    attemptedAction?: string
  ) => {
    if (!user) return;

    // Logger dans la console pour le monitoring (en production, on pourrait envoyer à un service)
    const logData = {
      timestamp: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      page,
      isAuthorized,
      primaryRole,
      allRoles: roles,
      attemptedAction: attemptedAction || 'page_access',
    };

    if (!isAuthorized) {
      console.warn('[ACCESS_DENIED]', logData);
    } else {
      console.log('[ACCESS_GRANTED]', logData);
    }
  }, [user, primaryRole, roles]);

  const logUnauthorizedAccess = useCallback((page: string) => {
    logAccessAttempt(page, false, 'unauthorized_page_access');
  }, [logAccessAttempt]);

  const logAuthorizedAccess = useCallback((page: string) => {
    logAccessAttempt(page, true, 'page_access');
  }, [logAccessAttempt]);

  return {
    logAccessAttempt,
    logUnauthorizedAccess,
    logAuthorizedAccess,
  };
};