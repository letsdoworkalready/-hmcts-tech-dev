import { formatActorName } from '../../../main/utils/formatActorName';

describe('formatActorName', () => {
  test('returns empty for blank input', () => {
    expect(formatActorName('')).toBe('');
    expect(formatActorName('   ')).toBe('');
  });

  test('capitalises first letter and lowercases the rest of each word', () => {
    expect(formatActorName('julie')).toBe('Julie');
    expect(formatActorName('JULIE')).toBe('Julie');
    expect(formatActorName('jULIE')).toBe('Julie');
  });

  test('handles multiple words', () => {
    expect(formatActorName('mary jane')).toBe('Mary Jane');
    expect(formatActorName('ALICE BOB')).toBe('Alice Bob');
  });

  test('trims and collapses whitespace', () => {
    expect(formatActorName('  alice  ')).toBe('Alice');
    expect(formatActorName('bob   charlie')).toBe('Bob Charlie');
  });
});
