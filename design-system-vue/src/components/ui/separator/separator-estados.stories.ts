import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { Separator } from './index';

const meta: Meta<any> = {
  title: 'UI/Separator/Estados',
  component: Separator,
  tags: ['layout'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Separator quanto à semântica de acessibilidade: decorativo (role=none, aria-hidden) e semântico (role=separator, aria-orientation).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Decorativo: Story = {
  render: () => ({
    components: { Separator },
    template: `
      <div class="w-[360px] space-y-3">
        <div class="text-sm">Bloco visual A.</div>
        <Separator orientation="horizontal" :decorative="true" />
        <div class="text-sm">Bloco visual B (separação ignorada por leitores de tela).</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Separator decorativo tem role=none', async () => {
      const separator = canvasElement.querySelector('[data-slot="separator"]');
      await expect(separator).toHaveAttribute('role', 'none');
    });

    await step('Separator decorativo tem aria-hidden=true', async () => {
      const separator = canvasElement.querySelector('[data-slot="separator"]');
      await expect(separator).toHaveAttribute('aria-hidden', 'true');
    });
  },
};

export const Semantico: Story = {
  render: () => ({
    components: { Separator },
    template: `
      <div class="w-[360px] space-y-3">
        <div class="text-sm">Grupo Documentação</div>
        <Separator orientation="horizontal" :decorative="false" />
        <div class="text-sm">Grupo Componentes (anunciado por leitor de tela).</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Separator semântico tem role=separator', async () => {
      const separator = canvasElement.querySelector('[data-slot="separator"]');
      await expect(separator).toHaveAttribute('role', 'separator');
    });

    await step('Separator semântico tem aria-orientation=horizontal', async () => {
      const separator = canvasElement.querySelector('[data-slot="separator"]');
      await expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    });
  },
};
