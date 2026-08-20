import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsSeparator } from './separator';

const meta: Meta = {
  title: 'UI/Separator/States',
  decorators: [moduleMetadata({ imports: [NdsSeparator] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Modos do Separator: decorativo (padrão, ignorado por leitores de tela) e semântico (anunciado como divisor, com a própria orientação).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Decorative: Story = {
  parameters: { covers: ['functional.item3', 'accessibility.item2', 'accessibility.item3'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-cap-md" data-spacing="sm">
        <h3 class="nds-text-body nds-font-medium">Decorativo (padrão)</h3>
        <p class="nds-text-caption nds-text-muted-foreground">Ignorado por leitores de tela — a divisão é só visual.</p>
        <p class="nds-text-body">Conteúdo antes do separador.</p>
        <div ndsSeparator [decorative]="true"></div>
        <p class="nds-text-body">Conteúdo depois do separador.</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const sep = canvasElement.querySelector<HTMLElement>('.nds-separator')!;

    await step('Sai da árvore de acessibilidade', async () => {
      await expect(sep).toHaveAttribute('role', 'none');
      await expect(sep).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Não anuncia orientação', async () => {
      // `aria-orientation` não é permitido em role="none" e nada informaria
      // fora da árvore de acessibilidade — o atributo é ruído, não detalhe.
      await expect(sep).not.toHaveAttribute('aria-orientation');
    });
  },
};

export const Semantic: Story = {
  parameters: { covers: ['functional.item4', 'accessibility.item4'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-cap-md" data-spacing="sm">
        <h3 class="nds-text-body nds-font-medium">Semântico</h3>
        <p class="nds-text-caption nds-text-muted-foreground">Anunciado como divisor, com a orientação da linha.</p>
        <p class="nds-text-body">Categoria: Layout</p>
        <div ndsSeparator [decorative]="false" orientation="horizontal"></div>
        <p class="nds-text-body">Categoria: Formulários</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const sep = canvasElement.querySelector<HTMLElement>('.nds-separator')!;

    await step('Exposto como divisor', async () => {
      await expect(sep).toHaveAttribute('role', 'separator');
      await expect(sep).not.toHaveAttribute('aria-hidden');
    });

    await step('Anuncia a própria orientação', async () => {
      await expect(sep).toHaveAttribute('aria-orientation', 'horizontal');
    });
  },
};
