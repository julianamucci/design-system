import storybook from 'eslint-plugin-storybook';
import js from '@eslint/js';
import globals from 'globals';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
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
      angular.configs.tsRecommended,
    ],
    // `processInlineTemplates` extrai o `template:` inline para que as regras do
    // bloco `**/*.html` abaixo o enxerguem. Este pacote NÃO tem arquivo `.html`
    // nenhum: todo template é inline, então sem o processor as regras de
    // template não veriam uma linha sequer.
    processor: angular.processInlineTemplates,
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

      // ── Seletor de diretiva ──────────────────────────────────────────────
      // Prefixo `nds`, atributo, camelCase. As 217 diretivas do pacote já
      // seguem isso, então a regra é lei em vigor e não aspiração.
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'nds', style: 'camelCase' },
      ],

      // ── Duas regras do preset que este pacote não comporta ───────────────
      //
      // `component-selector` fica DE FORA. Mais da metade dos componentes daqui
      // usa seletor de ATRIBUTO (`div[ndsAlert]`, `button[ndsButton]`) porque o
      // primitivo estiliza a tag que já existe em vez de embrulhar uma nova —
      // é o markup que o Vanilla, a referência cross-stack, produz. A regra
      // aceita um único `style`, e aqui convivem elemento em kebab-case
      // (`nds-alert-docs`) e atributo em camelCase; ligá-la exigiria escolher um
      // dos dois e acusar 105 arquivos corretos. Ausência medida, não descuido.
      //
      // `no-output-on-prefix` acusa 33 pontos, e a medição de cada um mostra que
      // nenhum é uma escolha de nomenclatura deste projeto:
      //   · 32 são RE-EXPORTS de output do `@radix-ng/primitives` via
      //     `hostDirectives: [{ outputs: [...] }]` — `onOpenChange`,
      //     `onValueChange`, `onSelect`, `onValueCommitted` são nomes DA LIB.
      //     Renomear não é opção: sem o nome exato o binding não liga em nada,
      //     e aliasar trocaria a API pública que o conteúdo compartilhado
      //     documenta.
      //   · 1 é próprio (`NdsCommandItem.onSelect`) e existe justamente para
      //     NÃO colidir com o evento `select` do DOM, além de casar com os
      //     `(onSelect)` irmãos de dropdown-menu, context-menu e menubar.
      // Nome de evento é API de framework — pelo CLAUDE.md, divergência aí se
      // registra, não se "alinha".
      '@angular-eslint/no-output-on-prefix': 'off',
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // Templates inline, extraídos pelo processor acima.
    //
    // `templateAccessibility` NÃO entra. Ele é um preset à parte do
    // `templateRecommended`, e medi-lo neste pacote dá 124 acusações que a
    // análise estática não tem como acertar: `elements-content` vê
    // `<button ndsCarouselPrevious>` vazio porque é a diretiva que injeta ícone
    // e rótulo em tempo de execução; `label-has-associated-control` vê
    // `<label ndsFormLabel>` sem `for` porque é a diretiva que casa `for`/`id`
    // pelo contexto do campo. Acessibilidade aqui é medida por axe, que roda
    // sobre o DOM já montado em toda story (`addon-a11y` + `docs-smoke`) — e
    // passa. Trocar o gate certo por um palpite estático seria regressão.
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended],
  },
  {
    // Stories: vars destructure como { canvasElement, step } onde step é
    // usado mas canvasElement não — comum no Storybook 10. Relaxa pra warn.
    files: ['**/*.stories.ts'],
    rules: {
      'unused-imports/no-unused-vars': 'warn',
    },
  },
  ...storybook.configs['flat/recommended'],
]);
