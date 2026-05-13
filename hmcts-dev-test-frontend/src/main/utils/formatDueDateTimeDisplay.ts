const LONDON = 'Europe/London';

/**
 * Formats an ISO 8601 due date/time for display (UK timezone), e.g.
 * "29 May 2026 at 1.40PM"
 */
export function formatDueDateTimeDisplay(iso: string | undefined | null): string {
  const raw = (iso ?? '').trim();
  if (!raw) {
    return '';
  }

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return raw;
  }

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: LONDON,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const parts = formatter.formatToParts(d);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      map[p.type] = p.value;
    }
  }

  const day = map.day;
  const month = map.month;
  const year = map.year;
  const hour = map.hour;
  const minute = (map.minute ?? '00').padStart(2, '0');
  const period = (map.dayPeriod ?? '').toUpperCase();

  if (!day || !month || !year || !hour || !period) {
    return raw;
  }

  return `${day} ${month} ${year} at ${hour}.${minute}${period}`;
}
