import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './index';

const meta = {
  title: 'UI/Resizable/Variantes',
  component: ResizablePanelGroup,
  tags: ['layout'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Resizable pela direção do grupo: horizontal (split lateral, handle vertical) e vertical (split vertical, handle horizontal).',
      },
    },
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<Meta<any>>;

export const Horizontal: Story = {
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <div class="w-[480px] h-[240px] rounded-md border">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel :default-size="30" :min-size="20" :max-size="50">
            <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">Esquerda</div>
          </ResizablePanel>
          <ResizableHandle with-handle aria-label="Redimensionar painéis — use setas para ajustar" />
          <ResizablePanel :default-size="70" :min-size="50">
            <div class="flex h-full items-center justify-center p-4 text-sm">Direita</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Handle no modo horizontal recebe data-panel-group-direction=horizontal', async () => {
      const handle = canvasElement.querySelector('[data-slot="resizable-handle"]');
      await expect(handle).toHaveAttribute('data-panel-group-direction', 'horizontal');
    });
  },
};

export const Vertical: Story = {
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <div class="w-[360px] h-[300px] rounded-md border">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel :default-size="50" :min-size="20" :max-size="80">
            <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">Topo</div>
          </ResizablePanel>
          <ResizableHandle with-handle aria-label="Redimensionar painéis — use setas para ajustar" />
          <ResizablePanel :default-size="50" :min-size="20" :max-size="80">
            <div class="flex h-full items-center justify-center p-4 text-sm">Rodapé</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Handle no modo vertical recebe data-panel-group-direction=vertical', async () => {
      const handle = canvasElement.querySelector('[data-slot="resizable-handle"]');
      await expect(handle).toHaveAttribute('data-panel-group-direction', 'vertical');
    });
  },
};

export const Nested: Story = {
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <div class="w-[560px] h-[300px] rounded-md border">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel :default-size="30" :min-size="20" :max-size="50">
            <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">Sidebar</div>
          </ResizablePanel>
          <ResizableHandle with-handle aria-label="Redimensionar sidebar e conteúdo — use setas" />
          <ResizablePanel :default-size="70" :min-size="50">
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel :default-size="60" :min-size="20">
                <div class="flex h-full items-center justify-center p-4 text-sm">Conteúdo</div>
              </ResizablePanel>
              <ResizableHandle with-handle aria-label="Redimensionar conteúdo e console — use setas" />
              <ResizablePanel :default-size="40" :min-size="20">
                <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">Console</div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Dois grupos aninhados renderizam', async () => {
      const groups = canvasElement.querySelectorAll('[data-slot="resizable-panel-group"]');
      await expect(groups.length).toBeGreaterThanOrEqual(2);
    });

    await step('Cada handle tem aria-label próprio', async () => {
      const handles = canvasElement.querySelectorAll('[data-slot="resizable-handle"]');
      await expect(handles.length).toBeGreaterThanOrEqual(2);
      handles.forEach((h) => {
        const label = h.getAttribute('aria-label') ?? '';
        expect(label.length).toBeGreaterThan(0);
      });
    });
  },
};
