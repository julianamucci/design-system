import type { Meta, StoryObj } from '@storybook/vue3';
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
      <div class="w-[280px] h-[300px] rounded-md border overflow-hidden">
        <ScrollArea class="h-full w-full">
          <div class="p-4">
            <h4 class="mb-3 text-sm font-medium leading-none">Tags</h4>
            <div class="space-y-2">
              <div v-for="tag in tags" :key="tag" class="text-sm rounded-sm border px-2 py-1.5">
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
      <div class="w-[500px] h-[180px] rounded-md border overflow-hidden">
        <ScrollArea class="h-full w-full whitespace-nowrap">
          <div class="flex w-max gap-4 p-4">
            <figure
              v-for="card in cards"
              :key="card.id"
              class="shrink-0 w-[160px] rounded-md border bg-muted p-4"
            >
              <div class="text-sm font-medium">{{ card.title }}</div>
              <div class="mt-2 text-xs text-muted-foreground">Item horizontal</div>
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
      <div class="w-[500px] h-[280px] rounded-md border overflow-hidden">
        <ScrollArea class="h-full w-full">
          <table class="border-collapse text-sm">
            <thead>
              <tr>
                <th class="sticky top-0 z-10 bg-background border px-3 py-2 text-left">#</th>
                <th
                  v-for="col in cols"
                  :key="col"
                  class="sticky top-0 z-10 bg-background border px-3 py-2 text-left whitespace-nowrap"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row">
                <th class="border px-3 py-2 text-left whitespace-nowrap bg-muted">{{ row }}</th>
                <td
                  v-for="col in cols"
                  :key="col"
                  class="border px-3 py-2 whitespace-nowrap"
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
