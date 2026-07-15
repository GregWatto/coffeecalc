import { beforeEach, describe, expect, it } from 'vitest';
import {
  STORAGE_KEY,
  createInitialState,
  exportState,
  importState,
  loadState,
  saveState,
} from './storage.js';

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

let storage;

beforeEach(() => {
  storage = createStorage();
});

describe('state persistence', () => {
  it('returns an empty, usable state when no data exists', () => {
    expect(loadState(storage)).toEqual(createInitialState());
  });

  it('saves and reloads recipes and program assignments', () => {
    const state = createInitialState();
    state.recipes.push({
      id: 'shot-1',
      coffee: 'Showcase Blend',
      dose: 18,
      yieldGrams: 40,
      grindSize: '4.2',
      shotTime: 28,
      lastAssignedAt: '2026-07-16T00:00:00.000Z',
    });
    state.programs.Down = 'shot-1';

    saveState(state, storage);

    expect(JSON.parse(storage.getItem(STORAGE_KEY))).toEqual(state);
    expect(loadState(storage)).toEqual(state);
  });

  it('migrates the original prototype storage keys', () => {
    storage.setItem(
      'coffeeRecipes',
      JSON.stringify([{ id: 1, coffee: 'Legacy Coffee', dose: 20, yield: 42 }]),
    );
    storage.setItem(
      'coffeePrograms',
      JSON.stringify({ 'Long Up': 1, Down: null, 'Long Down': null }),
    );

    const state = loadState(storage);

    expect(state.recipes[0].coffee).toBe('Legacy Coffee');
    expect(state.recipes[0].yieldGrams).toBe(42);
    expect(state.recipes[0].grindSize).toBe('');
    expect(state.recipes[0].shotTime).toBeNull();
    expect(state.recipes[0].lastAssignedAt).toBeNull();
    expect(state.programs['Long Up']).toBe(1);
  });

  it('falls back safely when stored JSON is corrupt', () => {
    storage.setItem(STORAGE_KEY, '{broken');
    expect(loadState(storage)).toEqual(createInitialState());
  });
});

describe('backup files', () => {
  it('round-trips exported data', () => {
    const state = createInitialState();
    state.recipes.push({
      id: '1',
      coffee: 'Colombia',
      dose: 19,
      yieldGrams: 44,
      grindSize: '18 clicks',
      shotTime: 31,
      lastAssignedAt: '2026-07-16T01:00:00.000Z',
    });

    expect(importState(exportState(state))).toEqual(state);
  });

  it('normalises invalid backup shapes', () => {
    expect(importState('{"recipes":"nope"}')).toEqual(createInitialState());
  });

  it('does not infer assignment history from an older brew timestamp', () => {
    const state = importState(
      JSON.stringify({
        recipes: [
          {
            id: 'old',
            coffee: 'Older recipe',
            dose: 18,
            yieldGrams: 38,
            createdAt: '2026-06-01T00:00:00.000Z',
            lastBrewed: '2026-06-02T00:00:00.000Z',
          },
        ],
        programs: {},
      }),
    );

    expect(state.recipes[0].lastAssignedAt).toBeNull();
    expect(state.recipes[0]).not.toHaveProperty('lastBrewed');
  });
});
