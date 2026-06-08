import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import { Skeleton } from './index';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const meta: Meta<any> = {
  title: 'UI/Skeleton/Composicoes',
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

export const CardDePerfil: Story = {
  render: () => ({
    components: { Skeleton },
    template: `
      <div
        role="status"
        aria-busy="true"
        aria-label="Carregando card de perfil"
        class="flex items-center gap-4 w-[320px] rounded-md border p-4"
      >
        <Skeleton class="h-12 w-12 rounded-full motion-reduce:animate-none" :aria-hidden="true" />
        <div class="space-y-2 flex-1">
          <Skeleton class="h-4 w-[180px] motion-reduce:animate-none" :aria-hidden="true" />
          <Skeleton class="h-4 w-[140px] motion-reduce:animate-none" :aria-hidden="true" />
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

export const ListaComAvatar: Story = {
  render: () => ({
    components: { Skeleton },
    template: `
      <ul
        role="list"
        aria-busy="true"
        aria-label="Carregando lista de pedidos"
        class="space-y-3 w-[360px] m-0 p-0 list-none"
      >
        <li v-for="i in 5" :key="i" class="flex items-center gap-3">
          <Skeleton class="h-10 w-10 rounded-full motion-reduce:animate-none" :aria-hidden="true" />
          <div class="space-y-2 flex-1">
            <Skeleton class="h-3 w-[200px] motion-reduce:animate-none" :aria-hidden="true" />
            <Skeleton class="h-3 w-[120px] motion-reduce:animate-none" :aria-hidden="true" />
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

export const ImagemEmAspectRatio: Story = {
  render: () => ({
    components: { Skeleton, AspectRatio },
    template: `
      <div
        role="status"
        aria-busy="true"
        aria-label="Carregando imagem em proporção 16:9"
        class="w-[480px]"
      >
        <AspectRatio :ratio="16 / 9">
          <Skeleton class="h-full w-full rounded-md motion-reduce:animate-none" :aria-hidden="true" />
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

export const Paragrafo: Story = {
  render: () => ({
    components: { Skeleton },
    template: `
      <div
        role="status"
        aria-busy="true"
        aria-label="Carregando parágrafo de texto"
        class="space-y-2 w-[360px]"
      >
        <Skeleton class="h-4 w-full motion-reduce:animate-none" :aria-hidden="true" />
        <Skeleton class="h-4 w-[92%] motion-reduce:animate-none" :aria-hidden="true" />
        <Skeleton class="h-4 w-[60%] motion-reduce:animate-none" :aria-hidden="true" />
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
