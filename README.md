# CoffeeCalc

CoffeeCalc is a browser-based espresso dial-in notebook. Enter the dose, beverage yield, and measured strength from a refractometer; the app calculates extraction and suggests the next dose and yield for your target recipe.

The app runs entirely in the browser. Recipes and machine-program assignments are saved to local storage, and users can export or import a JSON backup.

## Features

- Guided espresso dial-in workflow
- Extraction yield and dissolved-solids calculations
- Recommended dose and yield based on configurable targets
- Machine-program assignment board
- Grind-size, shot-time, and last-assigned tracking
- Search-free, locally stored recipe log
- JSON backup and restore
- Quick calculator for unsaved shots
- Responsive and keyboard-accessible interface
- Installable web-app manifest
- Automated linting, tests, builds, and GitHub Pages deployment

## Start developing

Requirements: Node.js 22 or later and npm.

```sh
npm install
npm run dev
```

Vite prints the local development URL. Changes in `src/` update immediately.

## Quality checks

```sh
npm run check         # lint, tests, and production build
npm run format:check  # verify formatting
npm run format        # apply formatting
```

## Calculation model

CoffeeCalc uses these relationships:

```text
dissolved solids (g) = beverage yield × (strength / 100)
extraction yield (%) = dissolved solids / dose × 100
recommended dose (g) = target dissolved solids / extraction yield
recommended yield (g) = target dissolved solids / target strength
```

Recommended dose is rounded to 0.1 g and recommended yield to the nearest 0.5 g. The default targets are 9.30% strength and 4.41 g dissolved solids. These are operational targets, not universal definitions of a good espresso; adjust them for the coffee and service recipe.

## Project structure

```text
src/calculator.js       Pure espresso calculations
src/storage.js          Local persistence, migration, and backups
src/main.js             Interface and app state
src/styles.css          Responsive visual system
public/                 Web-app manifest and icon
.github/workflows/      CI and GitHub Pages deployment
```

## Deploying

The Pages workflow builds and deploys the site whenever `main` changes. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions** once. Pull requests run the CI workflow without deploying.

Because Vite uses a relative asset base, the build works at both a custom domain and a repository Pages path.

## Data and privacy

No backend or account is required. Recipe data remains in the current browser profile unless the user exports it. Clearing site data removes recipes, so keep JSON backups when the log matters.

The original prototype used `coffeeRecipes` and `coffeePrograms` local-storage keys. This version reads those keys automatically so existing browser data continues to work. Older recipes remain valid; grind size and shot time appear as not recorded until a new dial-in supplies them.

“Last assigned” records when a recipe was most recently assigned to a machine program. It is intentionally not described as a brew timestamp because CoffeeCalc does not receive usage data from the espresso machine.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). This repository does not currently declare an open-source license; obtain the owner’s permission before redistributing the code.
