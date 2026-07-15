export const STORAGE_KEY = 'coffeecalc:v1';

export const PROGRAM_NAMES = ['Long Up', 'Down', 'Long Down'];

export function createInitialState() {
  return {
    recipes: [],
    programs: Object.fromEntries(PROGRAM_NAMES.map((name) => [name, null])),
  };
}

function normaliseState(value) {
  const initial = createInitialState();
  if (
    !value ||
    !Array.isArray(value.recipes) ||
    typeof value.programs !== 'object'
  ) {
    return initial;
  }

  return {
    recipes: value.recipes
      .filter(
        (recipe) =>
          recipe &&
          typeof recipe.coffee === 'string' &&
          Number.isFinite(Number(recipe.dose)) &&
          Number.isFinite(Number(recipe.yieldGrams ?? recipe.yield)),
      )
      .map((recipe) => {
        const shotTime = Number(recipe.shotTime);
        const normalised = {
          ...recipe,
          yieldGrams: Number(recipe.yieldGrams ?? recipe.yield),
          grindSize: String(recipe.grindSize ?? ''),
          shotTime: Number.isFinite(shotTime) && shotTime > 0 ? shotTime : null,
          lastAssignedAt: recipe.lastAssignedAt ?? null,
        };
        delete normalised.lastBrewed;
        return normalised;
      }),
    programs: Object.fromEntries(
      PROGRAM_NAMES.map((name) => [name, value.programs[name] ?? null]),
    ),
  };
}

export function loadState(storage = window.localStorage) {
  try {
    const current = storage.getItem(STORAGE_KEY);
    if (current) return normaliseState(JSON.parse(current));

    const legacyRecipes = JSON.parse(
      storage.getItem('coffeeRecipes') || 'null',
    );
    const legacyPrograms = JSON.parse(
      storage.getItem('coffeePrograms') || 'null',
    );
    if (legacyRecipes || legacyPrograms) {
      return normaliseState({
        recipes: legacyRecipes || [],
        programs: legacyPrograms || {},
      });
    }
  } catch {
    return createInitialState();
  }

  return createInitialState();
}

export function saveState(state, storage = window.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(normaliseState(state)));
}

export function exportState(state) {
  return JSON.stringify(normaliseState(state), null, 2);
}

export function importState(json) {
  return normaliseState(JSON.parse(json));
}
