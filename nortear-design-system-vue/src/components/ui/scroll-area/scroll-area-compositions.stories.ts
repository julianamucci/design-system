import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent } from 'storybook/test';
import { transbordo } from '@shared/testing/scroll-area-probe';
import { ScrollArea, ScrollBar } from './index';
import {
  scrollAreaGaleriaSource,
  scrollAreaSidebarSource,
  scrollAreaTableSource,
} from './scroll-area.source';

const meta = {
  title: 'Components/Layout/ScrollArea/Compositions',
  component: ScrollArea,
  tags: ['layout'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: scrollAreaSidebarSource },
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
  name: `Pessoa ${i + 1}`,
  email: `pessoa${i + 1}@exemplo.com`,
  funcao: i % 2 === 0 ? 'Designer' : 'Engenheiro',
  depto: i % 3 === 0 ? 'Design System' : 'Produto',
  loc: i % 2 === 0 ? 'São Paulo' : 'Remoto',
  start: `0${(i % 9) + 1}/2024`,
  status: i % 4 === 0 ? 'Férias' : 'Ativo',
}));

export const SidebarList: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Sidebar rolável ao lado do conteúdo principal — a lista rola sem mover a área ao lado, e os links continuam alcançáveis por teclado.',
      },
    },
  },
  render: () => ({
    components: { ScrollArea },
    setup() {
      return { items: SIDEBAR_ITEMS };
    },
    // A borda divisória ficava numa classe `border-r` que não existe no CSS
    // do design system — não pintava nada. A sidebar passa a ser uma caixa
    // própria com borda, como no Vanilla, que é a referência de markup.
    template: `
      <div class="nds-cluster nds-w-xl" data-spacing="md" data-align="stretch">
        <aside class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 200px">
          <ScrollArea size="xl" class="nds-w-full">
            <nav aria-label="Seções da documentação" class="nds-p-2">
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
        <main class="nds-flex-1 nds-rounded-md nds-border-default nds-p-6 nds-text-body nds-text-muted-foreground">
          Conteúdo principal — a sidebar rola sem mover esta área.
        </main>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('A navegação tem nome acessível e mora dentro da área rolável', async () => {
      const nav = canvas.getByRole('navigation', { name: 'Seções da documentação' });
      await expect(viewport.contains(nav)).toBe(true);
      await expect(transbordo(viewport).y).toBe(true);
    });

    await step('Os links são alcançáveis por teclado, na ordem do documento', async () => {
      const links = canvas.getAllByRole('link');
      await expect(links.length).toBe(SIDEBAR_ITEMS.length);
      viewport.blur();
      viewport.focus();
      await userEvent.tab();
      await expect(document.activeElement).toBe(links[0]);
    });
  },
};

export const HorizontalGallery: Story = {
  parameters: {
    docs: {
      // O eixo troca, a barra horizontal entra à mão e a faixa vira linha sem
      // quebra — nada disso está no snippet de sidebar do meta.
      source: { transform: scrollAreaGaleriaSource },
      description: {
        story:
          'Galeria horizontal de cards — faixa com largura de conteúdo, itens que não encolhem e barra horizontal explícita.',
      },
    },
  },
  render: () => ({
    components: { ScrollArea, ScrollBar },
    setup() {
      return { items: GALLERY };
    },
    // A miniatura tinha um `style` com um objeto de binding escrito dentro da
    // string e um `:` solto na linha seguinte — resíduo de uma conversão
    // mecânica. Não pintava cor nenhuma e deixava um atributo inválido no
    // markup. Agora a cor é um binding de verdade.
    template: `
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 560px">
        <ScrollArea type="always" size="md" class="nds-w-full nds-whitespace-nowrap">
          <div class="nds-cluster nds-p-4" data-spacing="sm" style="width: max-content">
            <figure
              v-for="item in items"
              :key="item.id"
              class="nds-shrink-0 nds-overflow-hidden nds-rounded-md nds-border-default" style="width: 160px"
            >
              <div :style="{ height: '120px', background: 'hsl(' + item.hue + ' 60% 70%)' }" />
              <figcaption class="nds-p-2 nds-text-caption">{{ item.title }}</figcaption>
            </figure>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('A galeria transborda na horizontal e a barra correspondente é montada', async () => {
      await expect(transbordo(viewport).x).toBe(true);
      const h = canvasElement.querySelectorAll(
        '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]',
      );
      await expect(h.length).toBe(1);
    });

    await step('Todas as miniaturas estão no DOM e o eixo responde', async () => {
      await expect(canvas.getAllByText(/^Imagem \d+$/).length).toBe(GALLERY.length);
      viewport.scrollLeft = 0;
      viewport.scrollLeft = 200;
      await expect(viewport.scrollLeft).toBe(200);
    });
  },
};

export const WideTable: Story = {
  parameters: {
    docs: {
      // Tabela rolando nos dois eixos é outra composição inteira.
      source: { transform: scrollAreaTableSource },
      description: {
        story:
          'Tabela ampla com scroll bidirecional — o cabeçalho acompanha o conteúdo, como no Vanilla; barra vertical e horizontal montadas.',
      },
    },
  },
  render: () => ({
    components: { ScrollArea, ScrollBar },
    setup() {
      return { cols: COLS, rows: ROWS };
    },
    // O cabeçalho usava `sticky top-0 z-10`, três classes que não existem no
    // CSS do design system — o cabeçalho nunca grudou. Removidas: a referência
    // cross-stack (Vanilla) também rola o cabeçalho junto.
    template: `
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 560px">
        <ScrollArea type="always" size="xl" class="nds-w-full">
          <table class="nds-border-collapse nds-text-body">
            <thead>
              <tr>
                <th
                  v-for="col in cols"
                  :key="col"
                  class="nds-bg-background nds-border-b nds-py-2 nds-text-left nds-whitespace-nowrap" style="padding-inline: 0.75rem"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.email">
                <td class="nds-border-b nds-py-2 nds-whitespace-nowrap" style="padding-inline: 0.75rem">{{ row.name }}</td>
                <td class="nds-border-b nds-py-2 nds-whitespace-nowrap" style="padding-inline: 0.75rem">{{ row.email }}</td>
                <td class="nds-border-b nds-py-2 nds-whitespace-nowrap" style="padding-inline: 0.75rem">{{ row.funcao }}</td>
                <td class="nds-border-b nds-py-2 nds-whitespace-nowrap" style="padding-inline: 0.75rem">{{ row.depto }}</td>
                <td class="nds-border-b nds-py-2 nds-whitespace-nowrap" style="padding-inline: 0.75rem">{{ row.loc }}</td>
                <td class="nds-border-b nds-py-2 nds-whitespace-nowrap" style="padding-inline: 0.75rem">{{ row.start }}</td>
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
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('A tabela transborda nos dois eixos', async () => {
      const eixos = transbordo(viewport);
      await expect(eixos.x).toBe(true);
      await expect(eixos.y).toBe(true);
    });

    await step('As duas barras são montadas', async () => {
      const v = canvasElement.querySelectorAll(
        '[data-slot="scroll-area-scrollbar"][data-orientation="vertical"]',
      );
      const h = canvasElement.querySelectorAll(
        '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]',
      );
      await expect(v.length).toBe(1);
      await expect(h.length).toBe(1);
    });
  },
};
