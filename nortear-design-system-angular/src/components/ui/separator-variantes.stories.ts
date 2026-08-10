import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsSeparator } from './separator';

const meta: Meta = {
  title: 'UI/Separator/Variants',
  decorators: [moduleMetadata({ imports: [NdsSeparator] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes nesta story: o painel Controls ficaria vazio.
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const Horizontal: Story = {
  parameters: { covers: ['functional.item3', 'visual.item1'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="md">
        <p class="nds-text-body">Seção superior</p>
        <div ndsSeparator orientation="horizontal"></div>
        <p class="nds-text-body">Seção inferior</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Orientação horizontal chega ao DOM', async () => {
      const sep = canvasElement.querySelector<HTMLElement>('.nds-separator');
      await expect(sep).toBeTruthy();
      await expect(sep).toHaveAttribute('data-orientation', 'horizontal');
    });

    await step('Ocupa a largura do container e tem espessura de 1px', async () => {
      // O que o horizontal promete é linha cheia e fina — medir os dois evita
      // que uma troca de classe passe com o atributo certo e o visual errado.
      const sep = canvasElement.querySelector<HTMLElement>('.nds-separator')!;
      const caixa = sep.getBoundingClientRect();
      await expect(caixa.width).toBeGreaterThan(100);
      await expect(caixa.height).toBeLessThanOrEqual(2);
    });
  },
};

export const Vertical: Story = {
  parameters: { covers: ['functional.item4', 'visual.item2'] },
  render: () => ({
    template: `
      <div class="nds-cluster nds-docs-demo-row" data-spacing="md">
        <span class="nds-text-body">Item A</span>
        <div ndsSeparator orientation="vertical"></div>
        <span class="nds-text-body nds-text-muted-foreground">Item B</span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Orientação vertical chega ao DOM', async () => {
      const sep = canvasElement.querySelector<HTMLElement>('.nds-separator');
      await expect(sep).toBeTruthy();
      await expect(sep).toHaveAttribute('data-orientation', 'vertical');
    });

    await step('Estica na altura do container e tem espessura de 1px', async () => {
      const sep = canvasElement.querySelector<HTMLElement>('.nds-separator')!;
      const caixa = sep.getBoundingClientRect();
      await expect(caixa.height).toBeGreaterThan(20);
      await expect(caixa.width).toBeLessThanOrEqual(2);
    });
  },
};
