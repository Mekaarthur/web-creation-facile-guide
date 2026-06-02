/**
 * Escapes user input before use in Supabase `.ilike()` or `.or()` filter strings.
 * - Escapes SQL LIKE wildcards (%, _) so they match literally.
 * - Strips PostgREST filter-syntax characters (,  ( )  { }) that would inject
 *   extra OR conditions when the value is interpolated into a .or() string.
 */
export function sanitizeSearch(term: string): string {
  return term
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/[(),{}]/g, '');
}
