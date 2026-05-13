const LOCALE = 'en-GB';

/**
 * Normalises a display name: each word starts with one uppercase letter; other letters are lowercase.
 * Whitespace is trimmed and inner runs of spaces collapse to a single space.
 */
export function formatActorName(raw: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) {
    return '';
  }

  return trimmed
    .split(/\s+/)
    .map(segment => {
      if (!segment) {
        return '';
      }
      const first = segment.charAt(0).toLocaleUpperCase(LOCALE);
      const rest = segment.slice(1).toLocaleLowerCase(LOCALE);
      return first + rest;
    })
    .filter(Boolean)
    .join(' ');
}
