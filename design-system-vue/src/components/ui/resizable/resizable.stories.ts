import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './index';
import ResizableDocs from '@/components/docs/ResizableDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Resizable',
  component: ResizablePanelGroup,
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(ResizableDocs),
      description: {
        component:
          'Resizable agrupa painéis ajustáveis pelo usuário via arrasto ou teclado. Construído sobre reka-ui (SplitterGroup/SplitterPanel/SplitterResizeHandle), expõe ResizablePanelGroup, ResizablePanel e ResizableHandle com suporte WCAG 2.2 (Dragging Movements).',
      },
    },
  },
  argTypes: {
    direction: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Direção do agrupamento dos painéis.',
    },
  },
  args: {
    direction: 'horizontal',
  },
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    setup() {
      return { args };
    },
    template: `
      <div class="w-[480px] h-[240px] rounded-md border">
        <ResizablePanelGroup :direction="args.direction" :key="args.direction">
          <ResizablePanel :default-size="30" :min-size="20" :max-size="50">
            <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">Sidebar</div>
          </ResizablePanel>
          <ResizableHandle with-handle aria-label="Redimensionar painéis — use setas para ajustar" />
          <ResizablePanel :default-size="70" :min-size="50">
            <div class="flex h-full items-center justify-center p-4 text-sm">Conteúdo principal</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('PanelGroup renderiza com data-slot', async () => {
      const group = canvasElement.querySelector('[data-slot="resizable-panel-group"]');
      await expect(group).toBeInTheDocument();
    });

    await step('Handle é focável e tem role=separator', async () => {
      const handle = canvasElement.querySelector('[data-slot="resizable-handle"]');
      await expect(handle).toBeInTheDocument();
      await expect(handle).toHaveAttribute('role', 'separator');
    });

    await step('Handle tem aria-label descritivo com atalho de teclado', async () => {
      const handle = canvasElement.querySelector('[data-slot="resizable-handle"]');
      const label = handle?.getAttribute('aria-label') ?? '';
      await expect(label.length).toBeGreaterThan(10);
      await expect(label.toLowerCase()).toContain('setas');
    });

    await step('Painéis estão visíveis no DOM', async () => {
      await expect(canvas.getByText('Sidebar')).toBeVisible();
      await expect(canvas.getByText('Conteúdo principal')).toBeVisible();
    });
  },
};
