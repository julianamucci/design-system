import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import { ScrollArea, ScrollBar } from './index';

const meta = {
  title: 'UI/ScrollArea/Composicoes',
  component: ScrollArea,
  tags: ['layout'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais do ScrollArea: lista em sidebar fixa, galeria horizontal de cards e tabela ampla com scroll bidirecional.',
      },
    },
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const SIDEBAR_ITEMS = [
  'Visão geral',
  'Componentes',
  'Tokens',
  'Padrões',
  'Acessibilidade',
  'Conteúdo',
  'Marca',
  'Voz e tom',
  'Templates',
  'Recursos',
  'Equipe',
  'Changelog',
  'Suporte',
  'Contribuir',
  'Roadmap',
  'FAQ',
  'Privacidade',
  'Termos',
  'Status',
  'Contato',
];

const GALLERY = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  title: `Imagem ${i + 1}`,
  hue: (i * 27) % 360,
}));

const COLS = ['Nome', 'Email', 'Função', 'Departamento', 'Localização', 'Início', 'Status'];
const ROWS = Array.from({ length: 18 }, (_, i) => ({
  nome: `Pessoa ${i + 1}`,
  email: `pessoa${i + 1}@exemplo.com`,
  funcao: i % 2 === 0 ? 'Designer' : 'Engenheiro',
  depto: i % 3 === 0 ? 'Design System' : 'Produto',
  loc: i % 2 === 0 ? 'São Paulo' : 'Remoto',
  inicio: `0${(i % 9) + 1}/2024`,
  status: i % 4 === 0 ? 'Férias' : 'Ativo',
}));

export const SidebarLista: Story = {
  render: () => ({
    components: { ScrollArea },
    setup() {
      return { items: SIDEBAR_ITEMS };
    },
    template: `
      <div class="flex w-[640px] h-[320px] rounded-md border overflow-hidden">
        <aside class="w-[200px] border-r overflow-hidden">
          <ScrollArea class="h-full w-full">
            <nav class="p-2">
              <a
                v-for="item in items"
                :key="item"
                href="#"
                class="block rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
              >
                {{ item }}
              </a>
            </nav>
          </ScrollArea>
        </aside>
        <main class="flex-1 p-6 text-sm text-muted-foreground">
          Conteúdo principal — a sidebar rola sem mover esta área.
        </main>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('ScrollArea da sidebar é rolável', async () => {
      const viewport = canvasElement.querySelector<HTMLElement>(
        '[data-slot="scroll-area-viewport"]',
      );
      await expect(viewport).toBeInTheDocument();
      await expect(viewport!.scrollHeight).toBeGreaterThan(viewport!.clientHeight);
    });
  },
};

export const GaleriaHorizontal: Story = {
  render: () => ({
    components: { ScrollArea, ScrollBar },
    setup() {
      return { items: GALLERY };
    },
    template: `
      <div class="w-[560px] rounded-md border overflow-hidden">
        <div class="h-[220px] overflow-hidden">
          <ScrollArea class="h-full w-full whitespace-nowrap">
            <div class="flex w-max gap-3 p-4">
              <figure
                v-for="item in items"
                :key="item.id"
                class="shrink-0 w-[160px] overflow-hidden rounded-md border"
              >
                <div
                  class="h-[120px]"
                  :style="{ background: 'hsl(' + item.hue + ' 60% 70%)' }"
                />
                <figcaption class="p-2 text-xs">{{ item.title }}</figcaption>
              </figure>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('ScrollBar horizontal presente', async () => {
      const bars = canvasElement.querySelectorAll('[data-slot="scroll-area-scrollbar"]');
      const hasHorizontal = Array.from(bars).some(
        (b) => b.getAttribute('data-orientation') === 'horizontal',
      );
      await expect(hasHorizontal).toBe(true);
    });
  },
};

export const TabelaAmpla: Story = {
  render: () => ({
    components: { ScrollArea, ScrollBar },
    setup() {
      return { cols: COLS, rows: ROWS };
    },
    template: `
      <div class="w-[560px] h-[320px] rounded-md border overflow-hidden">
        <ScrollArea class="h-full w-full">
          <table class="border-collapse text-sm">
            <thead>
              <tr>
                <th
                  v-for="col in cols"
                  :key="col"
                  class="sticky top-0 z-10 bg-background border-b px-3 py-2 text-left whitespace-nowrap"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.email">
                <td class="border-b px-3 py-2 whitespace-nowrap">{{ row.nome }}</td>
                <td class="border-b px-3 py-2 whitespace-nowrap">{{ row.email }}</td>
                <td class="border-b px-3 py-2 whitespace-nowrap">{{ row.funcao }}</td>
                <td class="border-b px-3 py-2 whitespace-nowrap">{{ row.depto }}</td>
                <td class="border-b px-3 py-2 whitespace-nowrap">{{ row.loc }}</td>
                <td class="border-b px-3 py-2 whitespace-nowrap">{{ row.inicio }}</td>
                <td class="border-b px-3 py-2 whitespace-nowrap">{{ row.status }}</td>
              </tr>
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Tabela rola em ambas as direções', async () => {
      const viewport = canvasElement.querySelector<HTMLElement>(
        '[data-slot="scroll-area-viewport"]',
      );
      await expect(viewport).toBeInTheDocument();
      await expect(viewport!.scrollHeight).toBeGreaterThan(viewport!.clientHeight);
      await expect(viewport!.scrollWidth).toBeGreaterThan(viewport!.clientWidth);
    });
  },
};
