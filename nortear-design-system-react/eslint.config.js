// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([globalIgnores(['dist', 'storybook-static', 'node_modules', 'coverage', '.storybook/manager-head.html']), {
  files: ['**/*.{ts,tsx}'],
  extends: [
    js.configs.recommended,
    tseslint.configs.recommended,
    reactHooks.configs.flat.recommended,
    reactRefresh.configs.vite,
  ],
  plugins: {
    'unused-imports': unusedImports,
  },
  rules: {
    // Desliga a regra padrão e usa unused-imports/* — esse autofixa
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'error',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    // Convenção do projeto: exporta o componente E `*Variants` (cva) no mesmo
    // arquivo. Considera *Variants/use*Context/use* como allowed constants.
    'react-refresh/only-export-components': [
      'warn',
      {
        allowConstantExport: true,
        allowExportNames: [
          'useChart', 'useFormField', 'useSidebar', 'useCarousel',
          'badgeVariants', 'buttonVariants', 'toggleVariants', 'tabsListVariants',
          'navigationMenuTriggerStyle',
          'buildBarOption', 'buildLineOption', 'buildAreaOption', 'buildPieOption',
        ],
        // Reconhece HOCs do projeto pra Fast Refresh não confundir com componentes
        extraHOCs: ['withAutoDocsTab'],
      },
    ],
  },
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
}, ...storybook.configs["flat/recommended"]])
