import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './index';

const meta = {
  title: 'UI/Resizable/Estados',
  component: ResizablePanelGroup,
  tags: ['layout'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Resizable: idle (padrão), focus (handle focado via teclado), withHandle (pegador visível) e disabled (handle não-interativo).',
      },
    },
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<Meta<any>>;

export const Idle: Story = {
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <div class="w-[480px] h-[240px] rounded-md border">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel :default-size="50" :min-size="20" :max-size="80">
            <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">Painel A</div>
          </ResizablePanel>
          <ResizableHandle aria-label="Redimensionar painéis — use setas para ajustar" />
          <ResizablePanel :default-size="50" :min-size="20" :max-size="80">
            <div class="flex h-full items-center justify-center p-4 text-sm">Painel B</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Handle idle (sem withHandle) presente', async () => {
      const handle = canvasElement.querySelector('[data-slot="resizable-handle"]');
      await expect(handle).toBeInTheDocument();
    });
  },
};

export const WithHandle: Story = {
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <div class="w-[480px] h-[240px] rounded-md border">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel :default-size="50" :min-size="20" :max-size="80">
            <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">Painel A</div>
          </ResizablePanel>
          <ResizableHandle with-handle aria-label="Redimensionar painéis — use setas para ajustar" />
          <ResizablePanel :default-size="50" :min-size="20" :max-size="80">
            <div class="flex h-full items-center justify-center p-4 text-sm">Painel B</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Pegador visual presente quando with-handle=true', async () => {
      const handle = canvasElement.querySelector('[data-slot="resizable-handle"]');
      const grabber = handle?.querySelector('div');
      await expect(grabber).toBeInTheDocument();
    });
  },
};

export const Focus: Story = {
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <div class="w-[480px] h-[240px] rounded-md border">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel :default-size="50" :min-size="20" :max-size="80">
            <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">Painel A</div>
          </ResizablePanel>
          <ResizableHandle with-handle aria-label="Redimensionar painéis — use setas para ajustar" />
          <ResizablePanel :default-size="50" :min-size="20" :max-size="80">
            <div class="flex h-full items-center justify-center p-4 text-sm">Painel B</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const handle = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]');

    await step('Handle é focável (tabindex)', async () => {
      await expect(handle).toBeInTheDocument();
      handle?.focus();
      await expect(document.activeElement).toBe(handle);
    });

    await step('aria-valuenow / aria-valuemin / aria-valuemax presentes', async () => {
      await expect(handle).toHaveAttribute('aria-valuenow');
      await expect(handle).toHaveAttribute('aria-valuemin');
      await expect(handle).toHaveAttribute('aria-valuemax');
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <div class="w-[480px] h-[240px] rounded-md border">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel :default-size="50" :min-size="20" :max-size="80">
            <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">Painel A</div>
          </ResizablePanel>
          <ResizableHandle disabled with-handle aria-label="Handle desativado" />
          <ResizablePanel :default-size="50" :min-size="20" :max-size="80">
            <div class="flex h-full items-center justify-center p-4 text-sm">Painel B</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Handle marcado como disabled via atributo data-*', async () => {
      const handle = canvasElement.querySelector('[data-slot="resizable-handle"]');
      await expect(handle).toBeInTheDocument();
      // reka-ui aplica data-disabled quando disabled=true
      const hasDisabled =
        handle?.hasAttribute('data-disabled') ||
        handle?.getAttribute('aria-disabled') === 'true';
      await expect(hasDisabled).toBe(true);
    });
  },
};
