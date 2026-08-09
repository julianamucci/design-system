import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsSeparator } from './separator';

const meta: Meta = {
  title: 'UI/Separator/Estados',
  decorators: [moduleMetadata({ imports: [NdsSeparator] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const Decorativo: Story = {
  parameters: { covers: ['functional.item5', 'accessibility.item3'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="md">
        <p class="nds-text-body">Resumo</p>
        <div ndsSeparator [decorative]="true"></div>
        <p class="nds-text-body">Detalhes</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Sai da árvore de acessibilidade', async () => {
      const sep = canvasElement.querySelector<HTMLElement>('.nds-separator')!;
      await expect(sep).toHaveAttribute('role', 'none');
      await expect(sep).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Não anuncia orientação', async () => {
      // aria-orientation num elemento com role="none" seria contraditório: o
      // leitor não expõe o elemento, mas a auditoria de ARIA acusa o atributo.
      const sep = canvasElement.querySelector<HTMLElement>('.nds-separator')!;
      await expect(sep).not.toHaveAttribute('aria-orientation');
    });
  },
};

export const Semantico: Story = {
  parameters: { covers: ['accessibility.item4', 'accessibility.item5'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="md">
        <p class="nds-text-body">Conteúdo principal</p>
        <div ndsSeparator [decorative]="false" orientation="horizontal"></div>
        <p class="nds-text-body">Conteúdo relacionado</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Exposto como divisor', async () => {
      const sep = canvasElement.querySelector<HTMLElement>('.nds-separator')!;
      await expect(sep).toHaveAttribute('role', 'separator');
      await expect(sep).not.toHaveAttribute('aria-hidden');
    });

    await step('Anuncia a própria orientação', async () => {
      const sep = canvasElement.querySelector<HTMLElement>('.nds-separator')!;
      await expect(sep).toHaveAttribute('aria-orientation', 'horizontal');
    });
  },
};
