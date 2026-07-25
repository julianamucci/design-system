import storybook from "eslint-plugin-storybook";
import js from '@eslint/js';
import globals from 'globals';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores([
    'dist',
    'storybook-static',
    'node_modules',
    'coverage',
    '.storybook/manager-head.html',
    '.svelte-kit',
  ]),
  {
    files: ['**/*.{ts,js}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
    ],
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['**/*.svelte'],
    extends: [
      ...svelte.configs['flat/recommended'],
    ],
    plugins: {
      'unused-imports': unusedImports,
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2020,
        sourceType: 'module',
        extraFileExtensions: ['.svelte'],
      },
      globals: globals.browser,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      // {@html} é envelopado por sanitizeHtml(); regra muito ruidosa
      'svelte/no-at-html-tags': 'off',
      // each-key é boa prática mas o backlog é grande; mantém visível como warn
      'svelte/require-each-key': 'warn',
      'svelte/no-useless-children-snippet': 'warn',
      'svelte/prefer-writable-derived': 'warn',
      'svelte/no-useless-mustaches': 'warn',
      'svelte/no-navigation-without-resolve': 'warn',
      // Não existe nesta versão do plugin; arquivos têm eslint-disable obsoleto
      'svelte/state_referenced_locally': 'off',
    },
  },
  {
    files: ['**/*.stories.{ts,tsx}'],
    rules: {
      'unused-imports/no-unused-vars': 'warn',
    },
  },
  ...storybook.configs['flat/recommended'],
]);
