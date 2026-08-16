import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect } from 'storybook/test';
import { CodeBlock } from './index';

/** Mesmo trecho base da seção Composições da docs page. */
const BASE_CODE = `const items = await load();
const total = items.length;
render(items, total);`;

/**
 * Seis linhas, porque um intervalo precisa de espaço para existir. Sobre as três
 * de `BASE_CODE`, `'1, 3'` seriam dois números avulsos — e uma story de
 * intervalo que não contém intervalo é declaração falsa.
 */
const RANGE_CODE = `import { load } from './api';

const items = await load();
const total = items.length;
render(items, total);
export default total;`;

const FOOTER_NOTE = 'A ação de copiar leva apenas o código, sem os números de linha.';

const rootOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

/** Números 1-based das linhas marcadas. */
const linhasMarcadas = (canvasElement: HTMLElement) =>
  [...rootOf(canvasElement).querySelectorAll('.nds-code-block-line')]
    .map((el, i) => (el.getAttribute('data-highlighted') === 'true' ? i + 1 : 0))
    .filter((n) => n > 0);

const meta: Meta = {
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Arranjos canônicos sobre o mesmo trecho: com rótulo de arquivo, sem numeração, com linha destacada, com intervalo destacado, com e sem rodapé.',
      },
    },
  },
  title: 'UI/CodeBlock/Compositions',
  component: CodeBlock,
  tags: ['display'],
};

export default meta;
type Story = StoryObj;

export const WithLabel: Story = {
  args: { code: BASE_CODE, language: 'ts', title: 'lista.ts' },
  play: async ({ canvasElement, step }) => {
    await step('O rótulo do arquivo aparece no header, ao lado da ação de copiar', async () => {
      const label = rootOf(canvasElement).querySelector('.nds-code-block-title');
      await expect(label).toBeVisible();
      await expect(label).toHaveTextContent('lista.ts');
      await expect(
        canvasElement.querySelector('.nds-code-block-header [data-slot="code-block-copy"]'),
      ).toBeVisible();
    });

    await step('O rótulo longo trunca em vez de empurrar o botão para fora', async () => {
      // Os dois numa asserção só: `text-overflow` sem `nowrap` não trunca nada,
      // então o par é o comportamento — verificar um de cada vez daria a falsa
      // impressão de que qualquer um deles basta.
      const { textOverflow, whiteSpace } = getComputedStyle(
        rootOf(canvasElement).querySelector<HTMLElement>('.nds-code-block-title')!,
      );
      await expect({ textOverflow, whiteSpace }).toEqual({
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      });
    });
  },
};

export const WithoutNumbering: Story = {
  args: { code: BASE_CODE, language: 'ts', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('Sem numeração o gutter não aparece', async () => {
      // O gutter segue no DOM (aria-hidden); é o data-numbered da raiz que o oculta.
      await expect(canvasElement.querySelector('.nds-code-block-gutter')).not.toBeVisible();
      await expect(rootOf(canvasElement)).toHaveAttribute('data-numbered', 'false');
    });
  },
};

export const WithHighlight: Story = {
  parameters: { covers: ['functional.item5', 'visual.item4'] },
  args: { code: BASE_CODE, language: 'ts', highlightLines: [2] },
  play: async ({ canvasElement, step }) => {
    await step('Só a linha pedida fica marcada, contando a partir de 1', async () => {
      await expect(canvasElement.querySelectorAll('.nds-code-block-line')).toHaveLength(
        BASE_CODE.split('\n').length,
      );
      await expect(linhasMarcadas(canvasElement)).toEqual([2]);
      const marcada = rootOf(canvasElement).querySelector<HTMLElement>(
        '[data-highlighted]:not([data-highlighted="false"])',
      )!;
      await expect(marcada).toHaveTextContent('const total = items.length;');
    });

    await step('A marcação não é só cor', async () => {
      // Barra de acento na lateral além do fundo — WCAG 1.4.1.
      const marcada = rootOf(canvasElement).querySelector<HTMLElement>(
        '[data-highlighted]:not([data-highlighted="false"])',
      )!;
      await expect(getComputedStyle(marcada).boxShadow).not.toBe('none');
    });
  },
};

export const WithHighlightedRange: Story = {
  parameters: { covers: ['functional.item5', 'visual.item4'] },
  args: { code: RANGE_CODE, language: 'ts', highlightLines: '1, 4-5' },
  play: async ({ canvasElement, step }) => {
    await step('Número avulso e intervalo convivem na mesma entrada', async () => {
      // A forma string é a que o control do Playground usa; a forma array já é
      // exercitada em WithHighlight.
      await expect(linhasMarcadas(canvasElement)).toEqual([1, 4, 5]);
    });

    await step('As linhas de fora seguem sem marcação', async () => {
      // Sem isto, um componente que marcasse TUDO passaria: a asserção acima
      // conferiria a presença das três pedidas e ignoraria as outras três.
      const root = rootOf(canvasElement);
      await expect(root.querySelectorAll('.nds-code-block-line')).toHaveLength(
        RANGE_CODE.split('\n').length,
      );
      await expect(
        root.querySelectorAll(
          '.nds-code-block-line[data-highlighted]:not([data-highlighted="false"])',
        ),
      ).toHaveLength(3);
    });
  },
};

export const WithFooter: Story = {
  args: { code: BASE_CODE, language: 'ts', footer: FOOTER_NOTE },
  play: async ({ canvasElement, step }) => {
    await step('O rodapé aparece abaixo do código, fora da área rolável', async () => {
      const footer = rootOf(canvasElement).querySelector<HTMLElement>('.nds-code-block-footer')!;
      await expect(footer).toBeVisible();
      await expect(footer).toHaveTextContent('A ação de copiar leva apenas o código');
      const scroll = rootOf(canvasElement).querySelector<HTMLElement>('.nds-code-block-scroll')!;
      await expect(scroll.contains(footer)).toBe(false);
    });
  },
};

export const WithoutFooter: Story = {
  args: { code: BASE_CODE, language: 'ts' },
  play: async ({ canvasElement, step }) => {
    await step('Sem observação o bloco não cria a faixa inferior', async () => {
      // Faixa vazia deixaria uma borda solta abaixo do código.
      await expect(rootOf(canvasElement).querySelector('.nds-code-block-footer')).toBeNull();
    });
  },
};
