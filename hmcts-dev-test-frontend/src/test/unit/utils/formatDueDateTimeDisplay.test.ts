import { formatDueDateTimeDisplay } from '../../../main/utils/formatDueDateTimeDisplay';

describe('formatDueDateTimeDisplay', () => {
  test('returns empty for blank input', () => {
    expect(formatDueDateTimeDisplay('')).toBe('');
    expect(formatDueDateTimeDisplay(null)).toBe('');
    expect(formatDueDateTimeDisplay(undefined)).toBe('');
  });

  test('returns raw string for invalid date', () => {
    expect(formatDueDateTimeDisplay('not-a-date')).toBe('not-a-date');
  });

  test('formats a known UTC instant with day, month, year, at, dot minutes, and AM/PM', () => {
    const out = formatDueDateTimeDisplay('2026-05-29T12:40:00.000Z');
    expect(out).toMatch(/^\d{1,2} May 2026 at \d{1,2}\.\d{2}(AM|PM)$/);
  });
});
