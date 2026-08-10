import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { ScrollArea, ScrollBar } from './index';

const meta = {
  title: 'UI/ScrollArea/Compositions',
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

export const SidebarList: Story = {
  render: () => ({
    components: { ScrollArea },
    setup() {
      return { items: SIDEBAR_ITEMS };
    },
    template: `
      <div class="nds-cluster nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 640px; height: 320px">
        <aside class="border-r nds-overflow-hidden" style="width: 200px">
          <ScrollArea class="nds-w-full" style="height: 100%">
            <nav class="nds-p-2">
              <a
                v-for="item in items"
                :key="item"
                href="#"
                class="nds-block nds-rounded-sm nds-px-2 nds-text-body nds-hover-bg-muted-soft" style="padding-block: 0.375rem"
              >
                {{ item }}
              </a>
            </nav>
          </ScrollArea>
        </aside>
        <main class="nds-flex-1 nds-p-6 nds-text-body nds-text-muted-foreground">
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
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 560px">
        <div class="nds-overflow-hidden" style="height: 220px">
          <ScrollArea class="nds-w-full nds-whitespace-nowrap" style="height: 100%">
            <div class="nds-cluster nds-p-4" data-spacing="sm" style="width: max-content">
              <figure
                v-for="item in items"
                :key="item.id"
                class="nds-shrink-0 nds-overflow-hidden nds-rounded-md nds-border-default" style="width: 160px"
              >
                <div
                  class="" style="height: 120px; { background: 'hsl(' + item.hue + ' 60% 70%)' }"
                  :
                />
                <figcaption class="nds-p-2 nds-text-caption">{{ item.title }}</figcaption>
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
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 560px; height: 320px">
        <ScrollArea class="nds-w-full" style="height: 100%">
          <table class="border-collapse nds-text-body">
            <thead>
              <tr>
                <th
                  v-for="col in cols"
                  :key="col"
                  class="sticky top-0 z-10 nds-bg-background nds-border-b nds-py-2 nds-text-left nds-whitespace-nowrap" style="padding-inline: 0.75rem"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.email">
                <td class="nds-border-b nds-py-2 nds-whitespace-nowrap" style="padding-inline: 0.75rem">{{ row.nome }}</td>
                <td class="nds-border-b nds-py-2 nds-whitespace-nowrap" style="padding-inline: 0.75rem">{{ row.email }}</td>
                <td class="nds-border-b nds-py-2 nds-whitespace-nowrap" style="padding-inline: 0.75rem">{{ row.funcao }}</td>
                <td class="nds-border-b nds-py-2 nds-whitespace-nowrap" style="padding-inline: 0.75rem">{{ row.depto }}</td>
                <td class="nds-border-b nds-py-2 nds-whitespace-nowrap" style="padding-inline: 0.75rem">{{ row.loc }}</td>
                <td class="nds-border-b nds-py-2 nds-whitespace-nowrap" style="padding-inline: 0.75rem">{{ row.inicio }}</td>
                <td class="nds-border-b nds-py-2 nds-whitespace-nowrap" style="padding-inline: 0.75rem">{{ row.status }}</td>
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
