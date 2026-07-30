import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect } from 'storybook/test';
import { CodeBlock } from './index';

/** Mesmo trecho base da seção Composições da docs page. */
const BASE_CODE = `const items = await load();
const total = items.length;
render(items, total);`;

const meta = {
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Os quatro arranjos canônicos sobre o mesmo trecho: com rótulo de arquivo, sem numeração, com linha destacada e com rodapé.',
      },
    },
  },
  title: 'UI/CodeBlock/Composicoes',
  component: CodeBlock,
  tags: ['display'],
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComRotulo: Story = {
  args: { code: BASE_CODE, language: 'ts', title: 'lista.ts' },
  play: async ({ canvasElement, step }) => {
    await step('O rótulo do arquivo aparece no header, ao lado da ação de copiar', async () => {
      const label = canvasElement.querySelector('.nds-code-block-title');
      await expect(label).toBeInTheDocument();
      await expect(label).toHaveTextContent('lista.ts');
      await expect(
        canvasElement.querySelector('.nds-code-block-header [data-slot="code-block-copy"]'),
      ).toBeInTheDocument();
    });
  },
};

export const SemNumeracao: Story = {
  args: { code: BASE_CODE, language: 'ts', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('Sem numeração o gutter não aparece', async () => {
      // O gutter segue no DOM (aria-hidden); é o data-numbered da raiz que o oculta.
      await expect(canvasElement.querySelector('.nds-code-block-gutter')).not.toBeVisible();
      await expect(canvasElement.querySelector('[data-slot="code-block"]')).toHaveAttribute(
        'data-numbered',
        'false',
      );
    });
  },
};

export const ComDestaque: Story = {
  args: { code: BASE_CODE, language: 'ts', highlightLines: [2] },
  play: async ({ canvasElement, step }) => {
    await step('Só a linha pedida fica destacada', async () => {
      const lines = canvasElement.querySelectorAll('.nds-code-block-line');
      await expect(lines).toHaveLength(BASE_CODE.split('\n').length);
      const marked = [...lines]
        .map((el, i) => (el.getAttribute('data-highlighted') === 'true' ? i + 1 : 0))
        .filter(Boolean);
      await expect(marked).toEqual([2]);
    });
  },
};

export const ComRodape: Story = {
  args: {
    code: BASE_CODE,
    language: 'ts',
    footer: 'A ação de copiar leva apenas o código, sem os números de linha.',
  },
  play: async ({ canvasElement, step }) => {
    await step('O rodapé aparece abaixo do código, fora da área rolável', async () => {
      const footer = canvasElement.querySelector('.nds-code-block-footer');
      await expect(footer).toBeInTheDocument();
      await expect(footer).toHaveTextContent('A ação de copiar leva apenas o código');
      await expect(canvasElement.querySelector('.nds-code-block-scroll')).not.toContainElement(
        footer as HTMLElement,
      );
    });
  },
};
