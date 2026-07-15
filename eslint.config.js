import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['dist', 'coverage'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'vite.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
  },
  {
    files: ['**/*.test.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
];
