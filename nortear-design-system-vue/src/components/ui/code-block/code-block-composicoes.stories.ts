import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { CodeBlock } from './index';

/** Mesmo trecho base dos quatro arranjos da seção "Composições" da docs page. */
const BASE_CODE = `const items = await load();
const total = items.length;
render(items, total);`;

const meta = {
  title: 'UI/CodeBlock/Compositions',
  component: CodeBlock,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  args: { code: BASE_CODE, language: 'ts' },
  render: (args) => ({
    components: { CodeBlock },
    setup() { return { args }; },
    template: '<CodeBlock v-bind="args" />',
  }),
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLabel: Story = {
  args: { title: 'lista.ts' },
  play: async ({ canvasElement, step }) => {
    await step('O header ganha o rótulo do arquivo', async () => {
      const title = canvasElement.querySelector('.nds-code-block-title');
      await expect(title).toBeVisible();
      await expect(title).toHaveTextContent('lista.ts');
    });
  },
};

export const WithoutNumbering: Story = {
  args: { showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

    await step('A coluna de numeração some', async () => {
      await expect(root.querySelector('.nds-code-block-gutter')).not.toBeVisible();
      await expect(root).toHaveAttribute('data-numbered', 'false');
    });
  },
};

export const WithHighlight: Story = {
  args: { highlightLines: [2] },
  play: async ({ canvasElement, step }) => {
    await step('Só a linha pedida fica destacada', async () => {
      const marked = canvasElement.querySelectorAll('.nds-code-block-line[data-highlighted="true"]');
      await expect(marked).toHaveLength(1);
      await expect(marked[0]).toHaveTextContent('const total = items.length;');
    });
  },
};

export const WithFooter: Story = {
  args: { footer: 'A ação de copiar leva apenas o código.' },
  play: async ({ canvasElement, step }) => {
    await step('O rodapé aparece abaixo do código', async () => {
      const footer = canvasElement.querySelector('.nds-code-block-footer');
      await expect(footer).toBeVisible();
      await expect(footer).toHaveTextContent('A ação de copiar leva apenas o código.');
    });
  },
};
