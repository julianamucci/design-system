import type { Meta, StoryObj } from '@storybook/vue3-vite';
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
      <div role="status" aria-busy="true" aria-label="Carregando bloco retangular" class="" style="width: 320px">
        <Skeleton class="nds-w-full nds-rounded-md motion-reduce:animate-none" style="height: 6rem" aria-hidden="true" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Skeleton retângulo aplica rounded-md e dimensões custom', async () => {
      const skeleton = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;
      await expect(skeleton).toBeInTheDocument();
      await expect(skeleton.className).toContain('nds-skeleton');
      await expect(skeleton.className).toContain('h-24');
      await expect(getComputedStyle(skeleton).animationName).toBe('nds-skeleton-pulse');
    });
  },
};

export const Circulo: Story = {
  render: () => ({
    components: { Skeleton },
    template: `
      <div role="status" aria-busy="true" aria-label="Carregando avatar circular" class="" style="width: 80px">
        <Skeleton class="nds-rounded-full motion-reduce:animate-none" style="height: 3rem; width: 3rem" aria-hidden="true" />
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
      <div role="status" aria-busy="true" aria-label="Carregando linhas de texto" class="" data-spacing="sm" style="width: 320px">
        <Skeleton class="motion-reduce:animate-none" style="height: 1rem; width: 250px" aria-hidden="true" />
        <Skeleton class="motion-reduce:animate-none" style="height: 1rem; width: 200px" aria-hidden="true" />
        <Skeleton class="motion-reduce:animate-none" style="height: 1rem; width: 160px" aria-hidden="true" />
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
