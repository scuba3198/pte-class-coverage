import { describe, expect, it } from 'vitest';
import { classDefaults, normalizeState } from './state';

describe('normalizeState classes', () => {
  it('keeps only provided classes when defaults are removed', () => {
    const state = normalizeState({
      classes: [{ id: 'class-7-8', name: '7-8' }],
      coverage: {},
      sessions: {},
    });

    expect(state.classes).toEqual([{ id: 'class-7-8', name: '7-8' }]);
  });

  it('fills in missing class names from defaults', () => {
    const state = normalizeState({
      classes: [{ id: 'class-7-8' }],
      coverage: {},
      sessions: {},
    });

    expect(state.classes).toEqual([{ id: 'class-7-8', name: '7-8' }]);
  });

  it('falls back to defaults when classes list is empty', () => {
    const state = normalizeState({ classes: [], coverage: {}, sessions: {} });

    expect(state.classes).toEqual(classDefaults);
  });
});
