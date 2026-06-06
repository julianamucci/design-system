import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import { Skeleton } from './index';

const meta: Meta<any> = {
  title: 'UI/Skeleton/Variantes',
  component: Skeleton,
  tags: ['feedback'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Skeleton são patterns de uso aplicados via className: Retângulo (rounded-md), Círculo (rounded-full) e Linha de texto (h-3 a h-5 com largura variável).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Retangulo: Story = {
  render: () => ({
    components: { Skeleton },
    template: `
      <div role="status" aria-busy="true" aria-label="Carregando bloco retangular" class="w-[320px]">
        <Skeleton class="h-24 w-full rounded-md motion-reduce:animate-none" aria-hidden="true" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Skeleton retângulo aplica rounded-md e dimensões custom', async () => {
      const skeleton = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;
      await expect(skeleton).toBeInTheDocument();
      await expect(skeleton.className).toContain('rounded-md');
      await expect(skeleton.className).toContain('h-24');
      await expect(skeleton.className).toContain('animate-pulse');
    });
  },
};

export const Circulo: Story = {
  render: () => ({
    components: { Skeleton },
    template: `
      <div role="status" aria-busy="true" aria-label="Carregando avatar circular" class="w-[80px]">
        <Skeleton class="h-12 w-12 rounded-full motion-reduce:animate-none" aria-hidden="true" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Skeleton círculo aplica rounded-full', async () => {
      const skeleton = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;
      await expect(skeleton).toBeInTheDocument();
      await expect(skeleton.className).toContain('rounded-full');
      await expect(skeleton.className).toContain('h-12');
      await expect(skeleton.className).toContain('w-12');
    });
  },
};

export const LinhaDeTexto: Story = {
  render: () => ({
    components: { Skeleton },
    template: `
      <div role="status" aria-busy="true" aria-label="Carregando linhas de texto" class="w-[320px] space-y-2">
        <Skeleton class="h-4 w-[250px] motion-reduce:animate-none" aria-hidden="true" />
        <Skeleton class="h-4 w-[200px] motion-reduce:animate-none" aria-hidden="true" />
        <Skeleton class="h-4 w-[160px] motion-reduce:animate-none" aria-hidden="true" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Linhas de texto aplicam altura fixa h-4', async () => {
      const skeletons = canvasElement.querySelectorAll('[data-slot="skeleton"]');
      await expect(skeletons.length).toBe(3);
      for (const sk of Array.from(skeletons)) {
        await expect((sk as HTMLElement).className).toContain('h-4');
      }
    });
  },
};
