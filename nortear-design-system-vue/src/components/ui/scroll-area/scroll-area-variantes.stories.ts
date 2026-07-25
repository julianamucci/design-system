import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { ScrollArea, ScrollBar } from './index';

const meta = {
  title: 'UI/ScrollArea/Variantes',
  component: ScrollArea,
  tags: ['layout'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do ScrollArea pela direção do scroll: vertical (padrão), horizontal (ScrollBar orientation="horizontal" + flex w-max + whitespace-nowrap) e bidirecional (ambas as scrollbars + corner).',
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

export const Vertical: Story = {
  render: () => ({
    components: { ScrollArea },
    setup() {
      return { tags: TAGS };
    },
    template: `
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 280px; height: 300px">
        <ScrollArea class="nds-w-full" style="height: 100%">
          <div class="nds-p-4">
            <h4 class="mb-3 nds-text-body nds-font-medium" style="line-height: 1">Tags</h4>
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
    await step('Scrollbar é vertical', async () => {
      const bar = canvasElement.querySelector('[data-slot="scroll-area-scrollbar"]');
      await expect(bar).toHaveAttribute('data-orientation', 'vertical');
    });
    await step('Conteúdo é vertical-rolável', async () => {
      const viewport = canvasElement.querySelector<HTMLElement>(
        '[data-slot="scroll-area-viewport"]',
      );
      await expect(viewport!.scrollHeight).toBeGreaterThan(viewport!.clientHeight);
    });
  },
};

export const Horizontal: Story = {
  render: () => ({
    components: { ScrollArea, ScrollBar },
    setup() {
      return { cards: CARDS };
    },
    template: `
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 500px; height: 180px">
        <ScrollArea class="nds-w-full nds-whitespace-nowrap" style="height: 100%">
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
    await step('Existe scrollbar horizontal explícita', async () => {
      const bars = canvasElement.querySelectorAll('[data-slot="scroll-area-scrollbar"]');
      const hasHorizontal = Array.from(bars).some(
        (b) => b.getAttribute('data-orientation') === 'horizontal',
      );
      await expect(hasHorizontal).toBe(true);
    });
    await step('Conteúdo é horizontal-rolável', async () => {
      const viewport = canvasElement.querySelector<HTMLElement>(
        '[data-slot="scroll-area-viewport"]',
      );
      await expect(viewport!.scrollWidth).toBeGreaterThan(viewport!.clientWidth);
    });
  },
};

export const Both: Story = {
  render: () => ({
    components: { ScrollArea, ScrollBar },
    setup() {
      return { cols: COLS, rows: ROWS };
    },
    template: `
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 500px; height: 280px">
        <ScrollArea class="nds-w-full" style="height: 100%">
          <table class="border-collapse nds-text-body">
            <thead>
              <tr>
                <th class="sticky top-0 z-10 nds-bg-background nds-border-default nds-py-2 nds-text-left" style="padding-inline: 0.75rem">#</th>
                <th
                  v-for="col in cols"
                  :key="col"
                  class="sticky top-0 z-10 nds-bg-background nds-border-default nds-py-2 nds-text-left nds-whitespace-nowrap" style="padding-inline: 0.75rem"
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
    await step('Existem duas scrollbars (vertical e horizontal)', async () => {
      const bars = canvasElement.querySelectorAll('[data-slot="scroll-area-scrollbar"]');
      const orientations = Array.from(bars).map((b) => b.getAttribute('data-orientation'));
      await expect(orientations).toContain('vertical');
      await expect(orientations).toContain('horizontal');
    });
    await step('Conteúdo rola em ambas as direções', async () => {
      const viewport = canvasElement.querySelector<HTMLElement>(
        '[data-slot="scroll-area-viewport"]',
      );
      await expect(viewport!.scrollHeight).toBeGreaterThan(viewport!.clientHeight);
      await expect(viewport!.scrollWidth).toBeGreaterThan(viewport!.clientWidth);
    });
  },
};
