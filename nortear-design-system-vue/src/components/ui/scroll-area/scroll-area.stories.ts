import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { ScrollArea } from './index';
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
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 280px; height: 300px">
        <ScrollArea v-bind="args" class="nds-w-full" style="height: 100%">
          <div class="nds-p-4">
            <h4 class="mb-3 nds-text-body nds-font-medium" style="line-height: 1">Tags</h4>
            <div class="nds-stack" data-spacing="sm">
              <div
                v-for="tag in tags"
                :key="tag"
                class="nds-text-body nds-rounded-sm nds-border-default nds-px-2" style="padding-block: 0.375rem"
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
