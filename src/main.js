import { calculateDialIn, formatMeasurement } from './calculator.js';
import {
  PROGRAM_NAMES,
  exportState,
  importState,
  loadState,
  saveState,
} from './storage.js';

let state = loadState();
let lastCalculation = null;

const app = document.querySelector('#app');

app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="#dashboard" aria-label="CoffeeCalc home">
      <span class="brand-mark" aria-hidden="true">C</span>
      <span>
        <strong>CoffeeCalc</strong>
        <small>Espresso dial-in notebook</small>
      </span>
    </a>
    <span class="save-status"><span aria-hidden="true"></span> Saved on this device</span>
  </header>

  <main class="app-shell">
    <section class="hero">
      <div>
        <p class="eyebrow">Brew with intent</p>
        <h1>Turn today’s shot into tomorrow’s recipe.</h1>
        <p class="hero-copy">Measure dose, yield, and strength. CoffeeCalc works out extraction and recommends the next shot.</p>
      </div>
      <div class="hero-formula" aria-label="Calculation process">
        <span>Measure</span><i>→</i><span>Calculate</span><i>→</i><span>Adjust</span>
      </div>
    </section>

    <nav class="tabs" aria-label="Main navigation">
      <button class="tab is-active" type="button" data-view="dashboard" aria-selected="true">Programs</button>
      <button class="tab" type="button" data-view="dial-in" aria-selected="false">Dial in</button>
      <button class="tab" type="button" data-view="recipes" aria-selected="false">Recipe log</button>
      <button class="tab" type="button" data-view="quick" aria-selected="false">Quick calc</button>
    </nav>

    <section class="view" id="view-dashboard" data-view-panel="dashboard">
      <div class="section-heading">
        <div><p class="eyebrow">At the machine</p><h2>Program board</h2></div>
        <button class="button button-secondary" type="button" data-go="dial-in">+ Dial in a coffee</button>
      </div>
      <div class="program-grid" id="program-grid"></div>
      <div class="empty-state" id="dashboard-empty" hidden>
        <span class="empty-icon" aria-hidden="true">◎</span>
        <h3>No recipes saved yet</h3>
        <p>Dial in your first coffee, then assign it to a machine program.</p>
        <button class="button button-primary" type="button" data-go="dial-in">Start a dial-in</button>
      </div>
    </section>

    <section class="view" id="view-dial-in" data-view-panel="dial-in" hidden>
      <div class="section-heading">
        <div><p class="eyebrow">Guided workflow</p><h2>Dial in a coffee</h2></div>
        <p class="section-note">All measurements are in grams.</p>
      </div>
      <div class="workflow-grid">
        <form class="panel form-panel" id="dial-form">
          <div class="field field-wide">
            <label for="coffee-name">Coffee name</label>
            <input id="coffee-name" name="coffee" type="text" maxlength="80" autocomplete="off" placeholder="e.g. Showcase Blend" required />
          </div>
          <div class="field">
            <label for="grind-size">Grind size <span>setting</span></label>
            <input id="grind-size" name="grindSize" type="text" maxlength="40" autocomplete="off" placeholder="e.g. 4.2 or 18 clicks" required />
          </div>
          <div class="field">
            <label for="shot-time">Shot time <span>seconds</span></label>
            <input id="shot-time" name="shotTime" type="number" min="1" max="300" step="0.1" inputmode="decimal" placeholder="28.0" required />
          </div>
          <div class="field">
            <label for="dose">Dose <span>g</span></label>
            <input id="dose" name="dose" type="number" min="0.1" max="100" step="0.1" inputmode="decimal" placeholder="18.0" required />
          </div>
          <div class="field">
            <label for="yield">Yield <span>g</span></label>
            <input id="yield" name="yieldGrams" type="number" min="0.1" max="300" step="0.1" inputmode="decimal" placeholder="40.0" required />
          </div>
          <div class="field field-wide">
            <label for="strength">Measured strength <span>% TDS</span></label>
            <input id="strength" name="strength" type="number" min="0.01" max="30" step="0.01" inputmode="decimal" placeholder="9.30" required />
            <small>Enter the reading from your refractometer.</small>
          </div>
          <details class="targets field-wide">
            <summary>Target settings</summary>
            <div class="target-grid">
              <div class="field">
                <label for="target-strength">Target strength <span>%</span></label>
                <input id="target-strength" name="targetStrength" type="number" min="0.01" max="30" step="0.01" value="9.30" required />
              </div>
              <div class="field">
                <label for="target-solids">Target dissolved solids <span>g</span></label>
                <input id="target-solids" name="targetSolids" type="number" min="0.01" max="30" step="0.01" value="4.41" required />
              </div>
            </div>
          </details>
          <p class="form-error field-wide" id="dial-error" role="alert" hidden></p>
          <button class="button button-primary button-large field-wide" type="submit">Calculate next shot</button>
        </form>

        <aside class="panel result-panel" id="dial-result" aria-live="polite">
          <div class="result-placeholder" id="result-placeholder">
            <span aria-hidden="true">↗</span>
            <h3>Your recommendation appears here</h3>
            <p>Add the shot measurements to see extraction and the suggested next recipe.</p>
          </div>
          <div id="result-content" hidden>
            <p class="eyebrow">Recommended next shot</p>
            <div class="recommendation">
              <div><strong id="result-dose">—</strong><span>Dose · g</span></div>
              <i aria-hidden="true">→</i>
              <div><strong id="result-yield">—</strong><span>Yield · g</span></div>
            </div>
            <div class="result-metrics">
              <div><span>Extraction yield</span><strong id="result-extraction">—</strong></div>
              <div><span>Dissolved solids</span><strong id="result-solids">—</strong></div>
            </div>
            <div class="result-actions">
              <button class="button button-primary" id="dial-further" type="button">Use recommendation</button>
              <button class="button button-secondary" id="save-recipe" type="button">Save this shot</button>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <section class="view" id="view-recipes" data-view-panel="recipes" hidden>
      <div class="section-heading">
        <div><p class="eyebrow">Your brews</p><h2>Recipe log</h2></div>
        <div class="toolbar">
          <button class="button button-secondary" id="import-button" type="button">Import</button>
          <input id="import-file" type="file" accept="application/json,.json" hidden />
          <button class="button button-secondary" id="export-button" type="button">Export</button>
        </div>
      </div>
      <div class="recipe-list" id="recipe-list"></div>
      <div class="empty-state" id="recipes-empty" hidden>
        <span class="empty-icon" aria-hidden="true">□</span>
        <h3>Your recipe log is empty</h3>
        <p>Saved dial-ins will appear here, grouped by coffee.</p>
        <button class="button button-primary" type="button" data-go="dial-in">Dial in a coffee</button>
      </div>
    </section>

    <section class="view" id="view-quick" data-view-panel="quick" hidden>
      <div class="section-heading">
        <div><p class="eyebrow">No record, no fuss</p><h2>Quick calculator</h2></div>
        <p class="section-note">Calculations here are not saved.</p>
      </div>
      <div class="quick-layout">
        <form class="panel quick-form" id="quick-form">
          <div class="field"><label for="quick-dose">Dose <span>g</span></label><input id="quick-dose" name="dose" type="number" min="0.1" step="0.1" placeholder="18.0" /></div>
          <div class="field"><label for="quick-yield">Yield <span>g</span></label><input id="quick-yield" name="yieldGrams" type="number" min="0.1" step="0.1" placeholder="40.0" /></div>
          <div class="field"><label for="quick-strength">Strength <span>%</span></label><input id="quick-strength" name="strength" type="number" min="0.01" step="0.01" placeholder="9.30" /></div>
          <input name="targetStrength" type="hidden" value="9.30" />
          <input name="targetSolids" type="hidden" value="4.41" />
        </form>
        <div class="quick-results" aria-live="polite">
          <div><span>Recommended dose</span><strong id="quick-rec-dose">—</strong><small>grams</small></div>
          <div><span>Recommended yield</span><strong id="quick-rec-yield">—</strong><small>grams</small></div>
          <div><span>Extraction</span><strong id="quick-extraction">—</strong><small>percent</small></div>
          <div><span>Dissolved solids</span><strong id="quick-solids">—</strong><small>grams</small></div>
        </div>
      </div>
    </section>
  </main>

  <footer><p>CoffeeCalc stores recipes in your browser. Export a backup before clearing browser data.</p></footer>
  <div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
`;

const byId = (id) => document.getElementById(id);
const numberFrom = (formData, name) => Number(formData.get(name));

function measurementsFrom(form) {
  const data = new FormData(form);
  return {
    dose: numberFrom(data, 'dose'),
    yieldGrams: numberFrom(data, 'yieldGrams'),
    strength: numberFrom(data, 'strength'),
    targetStrength: numberFrom(data, 'targetStrength'),
    targetSolids: numberFrom(data, 'targetSolids'),
  };
}

function brewDetailsFrom(form) {
  const data = new FormData(form);
  return {
    grindSize: data.get('grindSize').trim(),
    shotTime: Number(data.get('shotTime')),
  };
}

function showToast(message) {
  const toast = byId('toast');
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

function showView(viewName) {
  document.querySelectorAll('[data-view-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.viewPanel !== viewName;
  });
  document.querySelectorAll('[data-view]').forEach((tab) => {
    const active = tab.dataset.view === viewName;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  window.history.replaceState(null, '', `#${viewName}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function createProgramCard(programName, recipe) {
  const card = document.createElement('article');
  card.className = `program-card${recipe ? ' is-filled' : ''}`;

  const heading = document.createElement('div');
  const label = document.createElement('span');
  label.className = 'program-label';
  label.textContent = programName;
  heading.append(label);

  const title = document.createElement('h3');
  title.textContent = recipe?.coffee || 'Ready for a coffee';
  heading.append(title);

  const detail = document.createElement('p');
  detail.textContent = recipe
    ? `${formatMeasurement(recipe.dose)}g → ${formatMeasurement(recipe.yieldGrams ?? recipe.yield)}g · ${formatMeasurement(recipe.strength, 2)}% · ${recipe.grindSize || 'Grind not set'} · ${recipe.shotTime ? `${formatMeasurement(recipe.shotTime)}s` : 'Time not set'}`
    : 'Assign a saved recipe to this machine program.';
  heading.append(detail);

  if (recipe) {
    const recency = document.createElement('p');
    recency.className = 'program-recency';
    recency.textContent = `Last assigned ${formatRecency(recipe.lastAssignedAt)}`;
    heading.append(recency);
  }
  card.append(heading);

  const marker = document.createElement('span');
  marker.className = 'program-marker';
  marker.textContent = recipe ? '●' : '+';
  marker.setAttribute('aria-hidden', 'true');
  card.append(marker);
  return card;
}

function renderDashboard() {
  const grid = byId('program-grid');
  grid.replaceChildren();
  PROGRAM_NAMES.forEach((programName) => {
    const recipe = state.recipes.find(
      (item) => String(item.id) === String(state.programs[programName]),
    );
    grid.append(createProgramCard(programName, recipe));
  });
  byId('dashboard-empty').hidden = state.recipes.length !== 0;
}

function formatDate(recipe) {
  const date = recipe.createdAt ? new Date(recipe.createdAt) : null;
  if (date && !Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
  return recipe.date || 'Saved recipe';
}

function formatRecency(value) {
  if (!value) return 'not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'not recorded';

  const elapsedDays = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)),
  );
  if (elapsedDays === 0) return 'today';
  if (elapsedDays === 1) return 'yesterday';
  if (elapsedDays < 14) return `${elapsedDays} days ago`;
  return `on ${new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)}`;
}

function assignRecipe(recipeId, programName) {
  const recipe = state.recipes.find(
    (item) => String(item.id) === String(recipeId),
  );
  if (!recipe) return;

  Object.entries(state.programs).forEach(([name, assignedId]) => {
    const assigned = state.recipes.find(
      (item) => String(item.id) === String(assignedId),
    );
    if (assigned?.coffee === recipe.coffee && name !== programName) {
      state.programs[name] = null;
    }
  });
  state.programs[programName] = recipe.id;
  recipe.lastAssignedAt = new Date().toISOString();
  persistAndRender();
  showToast(`${recipe.coffee} assigned to ${programName}.`);
}

function deleteRecipe(recipeId) {
  const recipe = state.recipes.find(
    (item) => String(item.id) === String(recipeId),
  );
  if (!recipe || !window.confirm(`Delete the saved shot for ${recipe.coffee}?`))
    return;

  state.recipes = state.recipes.filter(
    (item) => String(item.id) !== String(recipeId),
  );
  Object.keys(state.programs).forEach((name) => {
    if (String(state.programs[name]) === String(recipeId))
      state.programs[name] = null;
  });
  persistAndRender();
  showToast('Recipe deleted.');
}

function createRecipeCard(recipe) {
  const card = document.createElement('article');
  card.className = 'recipe-card panel';

  const top = document.createElement('div');
  top.className = 'recipe-top';
  const titleWrap = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = recipe.coffee;
  const date = document.createElement('p');
  date.textContent = formatDate(recipe);
  titleWrap.append(title, date);
  top.append(titleWrap);

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'icon-button';
  remove.setAttribute('aria-label', `Delete ${recipe.coffee} recipe`);
  remove.textContent = 'Delete';
  remove.addEventListener('click', () => deleteRecipe(recipe.id));
  top.append(remove);
  card.append(top);

  const metrics = document.createElement('dl');
  metrics.className = 'recipe-metrics';
  const entries = [
    ['Dose', `${formatMeasurement(recipe.dose)}g`],
    ['Yield', `${formatMeasurement(recipe.yieldGrams ?? recipe.yield)}g`],
    ['Strength', `${formatMeasurement(recipe.strength, 2)}%`],
    [
      'Extraction',
      recipe.extractionYield
        ? `${formatMeasurement(recipe.extractionYield, 2)}%`
        : '—',
    ],
  ];
  entries.forEach(([term, value]) => {
    const group = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = term;
    dd.textContent = value;
    group.append(dt, dd);
    metrics.append(group);
  });
  card.append(metrics);

  const brewContext = document.createElement('dl');
  brewContext.className = 'brew-context';
  const brewEntries = [
    ['Grind size', recipe.grindSize || 'Not recorded'],
    [
      'Shot time',
      recipe.shotTime
        ? `${formatMeasurement(recipe.shotTime)} seconds`
        : 'Not recorded',
    ],
    ['Last assigned', formatRecency(recipe.lastAssignedAt)],
  ];
  brewEntries.forEach(([term, value]) => {
    const group = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = term;
    dd.textContent = value;
    group.append(dt, dd);
    brewContext.append(group);
  });
  card.append(brewContext);

  const assignment = document.createElement('div');
  assignment.className = 'assignment';
  const select = document.createElement('select');
  select.setAttribute(
    'aria-label',
    `Assign ${recipe.coffee} to a machine program`,
  );
  const prompt = document.createElement('option');
  prompt.value = '';
  prompt.textContent = 'Assign to a program…';
  select.append(prompt);
  PROGRAM_NAMES.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    option.selected = String(state.programs[name]) === String(recipe.id);
    select.append(option);
  });
  select.addEventListener('change', () => {
    if (select.value) assignRecipe(recipe.id, select.value);
  });
  assignment.append(select);
  card.append(assignment);
  return card;
}

function renderRecipes() {
  const list = byId('recipe-list');
  list.replaceChildren();
  [...state.recipes]
    .sort((a, b) =>
      String(b.createdAt ?? b.id).localeCompare(String(a.createdAt ?? a.id)),
    )
    .forEach((recipe) => list.append(createRecipeCard(recipe)));
  byId('recipes-empty').hidden = state.recipes.length !== 0;
}

function persistAndRender() {
  saveState(state);
  renderDashboard();
  renderRecipes();
}

function showCalculation(calculation) {
  byId('result-placeholder').hidden = true;
  byId('result-content').hidden = false;
  byId('result-dose').textContent = formatMeasurement(
    calculation.recommendedDose,
  );
  byId('result-yield').textContent = formatMeasurement(
    calculation.recommendedYield,
  );
  byId('result-extraction').textContent =
    `${formatMeasurement(calculation.extractionYield, 2)}%`;
  byId('result-solids').textContent =
    `${formatMeasurement(calculation.dissolvedSolids, 2)}g`;
}

byId('dial-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const error = byId('dial-error');
  error.hidden = true;
  try {
    const measurements = measurementsFrom(event.currentTarget);
    const result = calculateDialIn(measurements);
    const coffee = new FormData(event.currentTarget).get('coffee').trim();
    const brewDetails = brewDetailsFrom(event.currentTarget);
    lastCalculation = { coffee, measurements, brewDetails, result };
    showCalculation(result);
  } catch (caught) {
    error.textContent = caught.message;
    error.hidden = false;
  }
});

byId('dial-further').addEventListener('click', () => {
  if (!lastCalculation) return;
  byId('dose').value = formatMeasurement(
    lastCalculation.result.recommendedDose,
  );
  byId('yield').value = formatMeasurement(
    lastCalculation.result.recommendedYield,
  );
  byId('strength').value = '';
  byId('strength').focus();
  showToast('Recommendation loaded. Measure the next shot’s strength.');
});

byId('save-recipe').addEventListener('click', () => {
  if (!lastCalculation) return;
  const { coffee, measurements, brewDetails, result } = lastCalculation;
  const savedAt = new Date().toISOString();
  state.recipes.push({
    id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
    coffee,
    dose: measurements.dose,
    yieldGrams: measurements.yieldGrams,
    strength: measurements.strength,
    grindSize: brewDetails.grindSize,
    shotTime: brewDetails.shotTime,
    extractionYield: result.extractionYield,
    dissolvedSolids: result.dissolvedSolids,
    createdAt: savedAt,
    lastAssignedAt: null,
  });
  persistAndRender();
  byId('dial-form').reset();
  byId('target-strength').value = '9.30';
  byId('target-solids').value = '4.41';
  byId('result-placeholder').hidden = false;
  byId('result-content').hidden = true;
  lastCalculation = null;
  showView('recipes');
  showToast(`${coffee} saved to your recipe log.`);
});

byId('quick-form').addEventListener('input', (event) => {
  const values = measurementsFrom(event.currentTarget);
  const outputs = [
    'quick-rec-dose',
    'quick-rec-yield',
    'quick-extraction',
    'quick-solids',
  ];
  try {
    const result = calculateDialIn(values);
    byId('quick-rec-dose').textContent = formatMeasurement(
      result.recommendedDose,
    );
    byId('quick-rec-yield').textContent = formatMeasurement(
      result.recommendedYield,
    );
    byId('quick-extraction').textContent = formatMeasurement(
      result.extractionYield,
      2,
    );
    byId('quick-solids').textContent = formatMeasurement(
      result.dissolvedSolids,
      2,
    );
  } catch {
    outputs.forEach((id) => {
      byId(id).textContent = '—';
    });
  }
});

byId('export-button').addEventListener('click', () => {
  const blob = new Blob([exportState(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `coffeecalc-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('Backup exported.');
});

byId('import-button').addEventListener('click', () =>
  byId('import-file').click(),
);
byId('import-file').addEventListener('change', async (event) => {
  const [file] = event.currentTarget.files;
  if (!file) return;
  try {
    state = importState(await file.text());
    persistAndRender();
    showToast('Backup imported.');
  } catch {
    showToast('That file is not a valid CoffeeCalc backup.');
  } finally {
    event.currentTarget.value = '';
  }
});

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-view], [data-go]');
  if (!target) return;
  showView(target.dataset.view || target.dataset.go);
});

renderDashboard();
renderRecipes();
const initialView = window.location.hash.slice(1);
if (['dashboard', 'dial-in', 'recipes', 'quick'].includes(initialView))
  showView(initialView);
