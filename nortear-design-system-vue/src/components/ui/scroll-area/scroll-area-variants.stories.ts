import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { transbordo } from '@shared/testing/scroll-area-probe';
import { ScrollArea, ScrollBar } from './index';
import {
  scrollAreaBidirecionalSource,
  scrollAreaHorizontalSource,
  scrollAreaVerticalSource,
} from './scroll-area.source';

const meta = {
  title: 'UI/ScrollArea/Variants',
  component: ScrollArea,
  tags: ['layout'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: scrollAreaVerticalSource },
      description: {
        component:
          'Variantes do ScrollArea pela direção do scroll: vertical (padrão), horizontal (barra horizontal explícita, faixa com largura de conteúdo) e bidirecional (as duas barras mais o canto). A direção nasce do conteúdo — o eixo que transborda é o eixo que rola.',
      },
    },
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const TAGS = Array.from({ length: 40 }, (_, i) => `Tag ${i + 1}`);
const CARDS = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, title: `Card ${i + 1}` }));
const COLS = Array.from({ length: 12 }, (_, i) => `C${i + 1}`);
const ROWS = Array.from({ length: 16 }, (_, i) => `R${i + 1}`);

/** Barras montadas no DOM, por eixo. */
function barras(raiz: HTMLElement, orientation: 'vertical' | 'horizontal') {
  return raiz.querySelectorAll(
    `[data-slot="scroll-area-scrollbar"][data-orientation="${orientation}"]`,
  );
}

export const Vertical: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story:
          'Scroll vertical apenas. `type="always"` porque a story existe para MOSTRAR a barra: com o padrão `hover` a lib só a monta enquanto o ponteiro está sobre a área, e nem o Chromatic nem a asserção viam nada.',
      },
    },
  },
  render: () => ({
    components: { ScrollArea },
    setup() {
      return { tags: TAGS };
    },
    template: `
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 280px">
        <ScrollArea type="always" size="xl" class="nds-w-full">
          <div class="nds-p-4">
            <h4 class="nds-mb-2 nds-text-body nds-font-medium" style="line-height: 1">Tags</h4>
            <div class="nds-stack" data-spacing="sm">
              <div v-for="tag in tags" :key="tag" class="nds-text-body nds-rounded-sm nds-border-default nds-px-2" style="padding-block: 0.375rem">
                {{ tag }}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('Rola só na vertical', async () => {
      // A direção nasce do conteúdo: afirmar a classe da barra provaria apenas
      // que alguém escreveu a classe. O que decide é qual eixo transborda.
      const eixos = transbordo(viewport);
      await expect(eixos.y).toBe(true);
      await expect(eixos.x).toBe(false);
    });

    await step('Só a barra vertical é montada', async () => {
      await expect(barras(canvasElement, 'vertical').length).toBe(1);
      await expect(barras(canvasElement, 'horizontal').length).toBe(0);
    });
  },
};

export const Horizontal: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      // A barra do eixo horizontal é declarada à mão, e a faixa passa a ser uma
      // linha sem quebra: nada disso está no snippet vertical do meta.
      source: { transform: scrollAreaHorizontalSource },
      description: {
        story:
          'Scroll horizontal apenas — faixa com largura de conteúdo, itens que não encolhem e barra horizontal explícita.',
      },
    },
  },
  render: () => ({
    components: { ScrollArea, ScrollBar },
    setup() {
      return { cards: CARDS };
    },
    template: `
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 500px">
        <ScrollArea type="always" size="md" class="nds-w-full nds-whitespace-nowrap">
          <div class="nds-cluster nds-p-4" data-spacing="md" style="width: max-content">
            <figure
              v-for="card in cards"
              :key="card.id"
              class="nds-shrink-0 nds-rounded-md nds-border-default nds-bg-muted nds-p-4" style="width: 160px"
            >
              <div class="nds-text-body nds-font-medium">{{ card.title }}</div>
              <div class="nds-mt-2 nds-text-caption nds-text-muted-foreground">Item horizontal</div>
            </figure>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('Rola só na horizontal', async () => {
      const eixos = transbordo(viewport);
      await expect(eixos.x).toBe(true);
      await expect(eixos.y).toBe(false);
    });

    await step('A barra horizontal é montada e o eixo responde', async () => {
      await expect(barras(canvasElement, 'horizontal').length).toBe(1);
      viewport.scrollLeft = 0;
      viewport.scrollLeft = 60;
      await expect(viewport.scrollLeft).toBe(60);
    });
  },
};

export const Both: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      // Conteúdo que transborda nos dois eixos é outra composição inteira.
      source: { transform: scrollAreaBidirecionalSource },
      description: {
        story:
          'Scroll bidirecional — tabela ampla dentro de um container fixo; as duas barras são montadas e o canto aparece no encontro delas.',
      },
    },
  },
  render: () => ({
    components: { ScrollArea, ScrollBar },
    setup() {
      return { cols: COLS, rows: ROWS };
    },
    template: `
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 500px">
        <ScrollArea type="always" size="xl" class="nds-w-full">
          <table class="nds-border-collapse nds-text-body">
            <thead>
              <tr>
                <th class="nds-bg-background nds-border-default nds-py-2 nds-text-left" style="padding-inline: 0.75rem">#</th>
                <th
                  v-for="col in cols"
                  :key="col"
                  class="nds-bg-background nds-border-default nds-py-2 nds-text-left nds-whitespace-nowrap" style="padding-inline: 0.75rem"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row">
                <th class="nds-border-default nds-py-2 nds-text-left nds-whitespace-nowrap nds-bg-muted" style="padding-inline: 0.75rem">{{ row }}</th>
                <td
                  v-for="col in cols"
                  :key="col"
                  class="nds-border-default nds-py-2 nds-whitespace-nowrap" style="padding-inline: 0.75rem"
                >
                  {{ row }}-{{ col }}
                </td>
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

    await step('Rola nos dois eixos', async () => {
      const eixos = transbordo(viewport);
      await expect(eixos.x).toBe(true);
      await expect(eixos.y).toBe(true);
    });

    await step('As duas barras são montadas', async () => {
      await expect(barras(canvasElement, 'vertical').length).toBe(1);
      await expect(barras(canvasElement, 'horizontal').length).toBe(1);
    });

    await step('Os dois eixos respondem', async () => {
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
      viewport.scrollTop = 40;
      viewport.scrollLeft = 40;
      await expect(viewport.scrollTop).toBe(40);
      await expect(viewport.scrollLeft).toBe(40);
    });
  },
};
