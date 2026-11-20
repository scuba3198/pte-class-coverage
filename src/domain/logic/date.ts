/**
 * Returns a Date as YYYY-MM-DD in the *local* timezone.
 * (toISOString() is UTC and gives the wrong day for users ahead of/behind UTC.)
 */
export const toLocalDateString = (date: Date = new Date()): string => {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Parses a YYYY-MM-DD string as a local date (new Date("YYYY-MM-DD") is UTC midnight,
 * which displays as the previous day in timezones behind UTC).
 */
export const parseLocalDate = (value: string): Date => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};
