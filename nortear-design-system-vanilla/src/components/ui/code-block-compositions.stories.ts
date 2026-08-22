import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createCodeBlock } from './code-block';
import { codeBlockSource, codeBlockSourceWith } from './code-block.source';
import { COMPOSITION_CODE } from '@/components/docs/CodeBlockDocs';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os arranjos da seção Composições da docs page, sobre o mesmo trecho base: o
// que muda entre eles é só a opção passada à factory.

const meta: Meta = {
  tags: ['display'],
  title: 'UI/CodeBlock/Compositions',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: codeBlockSource },
      description: {
        component:
          'Arranjos canônicos: rótulo no header, sem numeração, com linha destacada, com intervalo destacado, com e sem rodapé.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Seis linhas, porque um intervalo precisa de espaço para existir. Sobre as três
 * de `COMPOSITION_CODE`, `'1, 3'` seriam dois números avulsos — e uma story de
 * intervalo que não contém intervalo é declaração falsa.
 */
const RANGE_CODE = [
  "import { load } from './api';",
  '',
  'const items = await load();',
  'const total = items.length;',
  'render(items, total);',
  'export default total;',
].join('\n');

const FOOTER_NOTE = 'A ação de copiar leva apenas o código.';

const root = (canvasElement: HTMLElement): HTMLElement =>
  canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

/** Números 1-based das linhas marcadas. */
const linesChecked = (canvasElement: HTMLElement): number[] =>
  [...root(canvasElement).querySelectorAll('.nds-code-block-line')]
    .map((el, i) => (el.getAttribute('data-highlighted') === 'true' ? i + 1 : 0))
    .filter((n) => n > 0);

// ─── Stories ──────────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  // Cada arranjo desta seção É uma opção da fábrica: sem override, o snippet do
  // meta mostraria a mesma chamada nas seis stories.
  parameters: {
    docs: { source: { transform: codeBlockSourceWith({ language: 'ts', title: 'lista.ts' }) } },
  },
  render: () =>
    createCodeBlock({ code: COMPOSITION_CODE, language: 'ts', title: 'lista.ts' }),
  play: async ({ canvasElement, step }) => {
    await step('O header mostra o nome do arquivo ao lado da ação de copiar', async () => {
      const title = root(canvasElement).querySelector('.nds-code-block-title')!;
      await expect(title).toBeVisible();
      await expect(title).toHaveTextContent('lista.ts');
      await expect(root(canvasElement).querySelector('[data-slot="code-block-copy"]')).toBeVisible();
    });

    await step('O rótulo longo trunca em vez de empurrar o botão para fora', async () => {
      // Os dois numa asserção só: `text-overflow` sem `nowrap` não trunca nada,
      // então o par é o comportamento — verificar um de cada vez daria a falsa
      // impressão de que qualquer um deles basta.
      const { textOverflow, whiteSpace } = getComputedStyle(
        root(canvasElement).querySelector<HTMLElement>('.nds-code-block-title')!,
      );
      await expect({ textOverflow, whiteSpace }).toEqual({
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      });
    });
  },
};

export const WithoutNumbering: Story = {
  parameters: {
    docs: {
      source: { transform: codeBlockSourceWith({ language: 'ts', showLineNumbers: false }) },
    },
  },
  render: () =>
    createCodeBlock({ code: COMPOSITION_CODE, language: 'ts', showLineNumbers: false }),
  play: async ({ canvasElement, step }) => {
    await step('A coluna de numeração some', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-numbered', 'false');
      // O gutter permanece no DOM — aria-hidden e não selecionável; quem o
      // remove da tela é o CSS, via data-numbered.
      await expect(root(canvasElement).querySelector('.nds-code-block-gutter')).not.toBeVisible();
    });
  },
};

export const WithHighlight: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: {
      source: { transform: codeBlockSourceWith({ language: 'ts', highlightLines: [2] }) },
    },
  },
  render: () =>
    createCodeBlock({ code: COMPOSITION_CODE, language: 'ts', highlightLines: [2] }),
  play: async ({ canvasElement, step }) => {
    await step('Só a linha pedida fica marcada, contando a partir de 1', async () => {
      await expect(linesChecked(canvasElement)).toEqual([2]);
      const marcada = root(canvasElement).querySelector<HTMLElement>(
        '[data-highlighted]:not([data-highlighted="false"])',
      )!;
      await expect(marcada).toHaveTextContent('const total = items.length;');
    });

    await step('A marcação não é só cor', async () => {
      // Barra de acento na lateral além do fundo — WCAG 1.4.1.
      const marcada = root(canvasElement).querySelector<HTMLElement>(
        '[data-highlighted]:not([data-highlighted="false"])',
      )!;
      await expect(getComputedStyle(marcada).boxShadow).not.toBe('none');
    });
  },
};

export const WithHighlightedRange: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: {
      source: {
        transform: codeBlockSourceWith({
          code: RANGE_CODE,
          language: 'ts',
          highlightLines: '1, 4-5',
        }),
      },
    },
  },
  render: () =>
    createCodeBlock({ code: RANGE_CODE, language: 'ts', highlightLines: '1, 4-5' }),
  play: async ({ canvasElement, step }) => {
    await step('Número avulso e intervalo convivem na mesma entrada', async () => {
      // A forma string é a que o control do Playground usa; a forma array já é
      // exercitada em WithHighlight.
      await expect(linesChecked(canvasElement)).toEqual([1, 4, 5]);
    });

    await step('As linhas de fora seguem sem marcação', async () => {
      // Sem isto, um componente que marcasse TUDO passaria: a asserção acima
      // conferiria a presença das três pedidas e ignoraria as outras três.
      await expect(root(canvasElement).querySelectorAll('.nds-code-block-line')).toHaveLength(
        RANGE_CODE.split('\n').length,
      );
      await expect(
        root(canvasElement).querySelectorAll(
          '.nds-code-block-line[data-highlighted]:not([data-highlighted="false"])',
        ),
      ).toHaveLength(3);
    });
  },
};

export const WithFooter: Story = {
  parameters: {
    docs: {
      source: { transform: codeBlockSourceWith({ language: 'ts', footer: FOOTER_NOTE }) },
    },
  },
  render: () =>
    createCodeBlock({ code: COMPOSITION_CODE, language: 'ts', footer: FOOTER_NOTE }),
  play: async ({ canvasElement, step }) => {
    await step('O rodapé aparece abaixo do código', async () => {
      const footer = root(canvasElement).querySelector('.nds-code-block-footer')!;
      await expect(footer).toBeVisible();
      await expect(footer).toHaveTextContent(FOOTER_NOTE);
    });

    await step('O rodapé fica fora da região que rola', async () => {
      // A observação precisa continuar visível enquanto a pessoa rola o trecho.
      const scroll = root(canvasElement).querySelector<HTMLElement>('.nds-code-block-scroll')!;
      const footer = root(canvasElement).querySelector<HTMLElement>('.nds-code-block-footer')!;
      await expect(scroll.contains(footer)).toBe(false);
    });
  },
};

export const WithoutFooter: Story = {
  parameters: {
    docs: { source: { transform: codeBlockSourceWith({ language: 'ts' }) } },
  },
  render: () => createCodeBlock({ code: COMPOSITION_CODE, language: 'ts' }),
  play: async ({ canvasElement, step }) => {
    await step('Sem observação o bloco não cria a faixa inferior', async () => {
      // Faixa vazia deixaria uma borda solta abaixo do código.
      await expect(root(canvasElement).querySelector('.nds-code-block-footer')).toBeNull();
    });
  },
};
