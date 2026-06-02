import DOMPurify from 'dompurify';

export function sanitizeEmailPreview(rawHtml: string): string {
  return DOMPurify.sanitize(rawHtml, { WHOLE_DOCUMENT: true });
}
