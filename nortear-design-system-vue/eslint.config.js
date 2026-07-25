import storybook from "eslint-plugin-storybook";
import js from '@eslint/js';
import globals from 'globals';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores([
    'dist',
    'storybook-static',
    'node_modules',
    'coverage',
    '.storybook/manager-head.html',
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
      // `any` aparece muito em assinaturas de play function (step: any) que
      // são difíceis de tipar via Storybook 10 — mantém como warning visível
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
    // Stories: vars destructure como { canvasElement, step } onde step é
    // usado mas canvasElement não — comum no Storybook 10. Relaxa pra warn.
    files: ['**/*.stories.{ts,tsx}'],
    rules: {
      'unused-imports/no-unused-vars': 'warn',
    },
  },
  {
    files: ['**/*.vue'],
    extends: [
      ...vue.configs['flat/recommended'],
    ],
    plugins: {
      'unused-imports': unusedImports,
    },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2020,
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
      globals: globals.browser,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'vue/multi-word-component-names': 'off',
      // Usamos TS types em defineProps; opcional via `?` é o default
      'vue/require-default-prop': 'off',
      // v-html é envelopado por sanitizeHtml(); regra muito ruidosa
      'vue/no-v-html': 'off',
      // Aceita atalhos como `name?: string` sem alarmar
      'vue/no-v-text-v-html-on-component': 'off',
    },
  },
  ...storybook.configs['flat/recommended'],
]);
