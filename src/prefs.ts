/** Small per-browser preferences. Storage can be blocked, and then they simply are not remembered. */
export const readPref = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writePref = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not being able to remember a preference is harmless.
  }
};
