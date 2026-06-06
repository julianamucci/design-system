import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { ScrollArea, ScrollBar } from './index';
import ScrollAreaDocs from '@/components/docs/ScrollAreaDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(ScrollAreaDocs),
      description: {
        component:
          'ScrollArea provê scroll customizado dentro de um container com altura fixa, com scrollbar estilizada e suporte a scroll vertical, horizontal ou bidirecional. Construído sobre reka-ui (ScrollAreaRoot/Viewport/Scrollbar/Thumb/Corner), mantém scroll nativo no mobile para preservar gestos de swipe.',
      },
    },
  },
  argTypes: {
    type: {
      control: { type: 'inline-radio' },
      options: ['auto', 'always', 'scroll', 'hover'],
      description: 'Quando exibir as scrollbars.',
    },
    scrollHideDelay: {
      control: { type: 'number' },
      description: 'Tempo em ms para esconder a scrollbar inativa.',
    },
  },
  args: {
    type: 'hover',
    scrollHideDelay: 600,
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const TAGS = Array.from({ length: 40 }, (_, i) => `Tag ${i + 1}`);

export const Playground: Story = {
  render: (args) => ({
    components: { ScrollArea },
    setup() {
      return { args, tags: TAGS };
    },
    template: `
      <div class="w-[280px] h-[300px] rounded-md border overflow-hidden">
        <ScrollArea v-bind="args" class="h-full w-full">
          <div class="p-4">
            <h4 class="mb-3 text-sm font-medium leading-none">Tags</h4>
            <div class="space-y-2">
              <div
                v-for="tag in tags"
                :key="tag"
                class="text-sm rounded-sm border px-2 py-1.5"
              >
                {{ tag }}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('ScrollArea root renderiza com data-slot', async () => {
      const root = canvasElement.querySelector('[data-slot="scroll-area"]');
      await expect(root).toBeInTheDocument();
    });

    await step('Viewport está presente e é rolável', async () => {
      const viewport = canvasElement.querySelector<HTMLElement>(
        '[data-slot="scroll-area-viewport"]',
      );
      await expect(viewport).toBeInTheDocument();
      await expect(viewport!.scrollHeight).toBeGreaterThan(viewport!.clientHeight);
    });

    await step('Scrollbar vertical (default) está presente', async () => {
      const bar = canvasElement.querySelector('[data-slot="scroll-area-scrollbar"]');
      await expect(bar).toBeInTheDocument();
      await expect(bar).toHaveAttribute('data-orientation', 'vertical');
    });

    await step('Conteúdo do canvas é acessível', async () => {
      await expect(canvas.getByText('Tag 1')).toBeInTheDocument();
    });
  },
};
