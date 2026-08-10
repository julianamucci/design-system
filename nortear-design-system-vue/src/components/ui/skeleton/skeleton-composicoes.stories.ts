import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { Skeleton } from './index';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const meta: Meta<any> = {
  title: 'UI/Skeleton/Compositions',
  component: Skeleton,
  tags: ['feedback'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais do Skeleton replicando estruturas de conteúdo: card de perfil, lista com avatar, imagem em AspectRatio e parágrafo. Cada Skeleton com aria-hidden e container com aria-busy + aria-label.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ProfileCard: Story = {
  render: () => ({
    components: { Skeleton },
    template: `
      <div
        role="status"
        aria-busy="true"
        aria-label="Carregando card de perfil"
        class="nds-cluster nds-rounded-md nds-border-default nds-p-4" data-align="center" data-spacing="md" style="width: 320px"
      >
        <Skeleton class="nds-rounded-full motion-reduce:animate-none" style="height: 3rem; width: 3rem" :aria-hidden="true" />
        <div class="nds-flex-1" data-spacing="sm">
          <Skeleton class="motion-reduce:animate-none" style="height: 1rem; width: 180px" :aria-hidden="true" />
          <Skeleton class="motion-reduce:animate-none" style="height: 1rem; width: 140px" :aria-hidden="true" />
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Container expõe aria-busy=true e aria-label', async () => {
      const container = canvasElement.querySelector('[aria-busy="true"]');
      await expect(container).toBeInTheDocument();
      await expect(container).toHaveAttribute('aria-label', 'Carregando card de perfil');
    });

    await step('Todos os Skeletons têm aria-hidden=true', async () => {
      const skeletons = canvasElement.querySelectorAll('[data-slot="skeleton"]');
      await expect(skeletons.length).toBe(3);
      for (const sk of Array.from(skeletons)) {
        await expect(sk).toHaveAttribute('aria-hidden', 'true');
      }
    });

    await step('Avatar usa rounded-full', async () => {
      const avatar = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;
      await expect(avatar.className).toContain('rounded-full');
    });
  },
};

export const ListWithAvatar: Story = {
  render: () => ({
    components: { Skeleton },
    template: `
      <ul
        role="list"
        aria-busy="true"
        aria-label="Carregando lista de pedidos"
        class="m-0 nds-p-0 nds-list-none" data-spacing="sm" style="width: 360px"
      >
        <li v-for="i in 5" :key="i" class="nds-cluster" data-spacing="sm">
          <Skeleton class="nds-rounded-full motion-reduce:animate-none" style="height: 2.5rem; width: 2.5rem" :aria-hidden="true" />
          <div class="nds-flex-1" data-spacing="sm">
            <Skeleton class="motion-reduce:animate-none" style="height: 0.75rem; width: 200px" :aria-hidden="true" />
            <Skeleton class="motion-reduce:animate-none" style="height: 0.75rem; width: 120px" :aria-hidden="true" />
          </div>
        </li>
      </ul>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Container lista expõe aria-busy=true', async () => {
      const list = canvasElement.querySelector('[aria-busy="true"]');
      await expect(list).toBeInTheDocument();
      await expect(list).toHaveAttribute('aria-label', 'Carregando lista de pedidos');
    });

    await step('Renderiza 5 itens com 3 Skeletons cada (15 total)', async () => {
      const skeletons = canvasElement.querySelectorAll('[data-slot="skeleton"]');
      await expect(skeletons.length).toBe(15);
      for (const sk of Array.from(skeletons)) {
        await expect(sk).toHaveAttribute('aria-hidden', 'true');
      }
    });
  },
};

export const ImageInAspectRatio: Story = {
  render: () => ({
    components: { Skeleton, AspectRatio },
    template: `
      <div
        role="status"
        aria-busy="true"
        aria-label="Carregando imagem em proporção 16:9"
        class="" style="width: 480px"
      >
        <AspectRatio :ratio="16 / 9">
          <Skeleton class="nds-w-full nds-rounded-md motion-reduce:animate-none" style="height: 100%" :aria-hidden="true" />
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Container expõe aria-busy=true', async () => {
      const container = canvasElement.querySelector('[aria-busy="true"]');
      await expect(container).toBeInTheDocument();
    });

    await step('Skeleton ocupa h-full w-full dentro do AspectRatio', async () => {
      const skeleton = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;
      await expect(skeleton).toBeInTheDocument();
      await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
      await expect(skeleton.className).toContain('h-full');
      await expect(skeleton.className).toContain('w-full');
    });
  },
};

export const Paragraph: Story = {
  render: () => ({
    components: { Skeleton },
    template: `
      <div
        role="status"
        aria-busy="true"
        aria-label="Carregando parágrafo de texto"
        class="" data-spacing="sm" style="width: 360px"
      >
        <Skeleton class="nds-w-full motion-reduce:animate-none" style="height: 1rem" :aria-hidden="true" />
        <Skeleton class="motion-reduce:animate-none" style="height: 1rem; width: 92%" :aria-hidden="true" />
        <Skeleton class="motion-reduce:animate-none" style="height: 1rem; width: 60%" :aria-hidden="true" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Container expõe aria-busy=true', async () => {
      const container = canvasElement.querySelector('[aria-busy="true"]');
      await expect(container).toBeInTheDocument();
    });

    await step('Renderiza 3 linhas de Skeleton com aria-hidden', async () => {
      const skeletons = canvasElement.querySelectorAll('[data-slot="skeleton"]');
      await expect(skeletons.length).toBe(3);
      for (const sk of Array.from(skeletons)) {
        await expect(sk).toHaveAttribute('aria-hidden', 'true');
        await expect((sk as HTMLElement).className).toContain('motion-reduce:animate-none');
      }
    });
  },
};
