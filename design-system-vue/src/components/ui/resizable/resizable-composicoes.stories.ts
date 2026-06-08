import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './index';

const meta = {
  title: 'UI/Resizable/Composicoes',
  component: ResizablePanelGroup,
  tags: ['layout'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais do Resizable: layout de editor com sidebar + preview, layout vertical com cabeçalho/conteúdo/rodapé e três painéis em sequência.',
      },
    },
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<Meta<any>>;

export const EditorComPreview: Story = {
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <div class="w-[640px] h-[300px] rounded-md border">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel :default-size="25" :min-size="15" :max-size="40">
            <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">Arquivos</div>
          </ResizablePanel>
          <ResizableHandle with-handle aria-label="Redimensionar lista de arquivos — use setas para ajustar" />
          <ResizablePanel :default-size="50" :min-size="30">
            <div class="flex h-full items-center justify-center p-4 text-sm">Editor</div>
          </ResizablePanel>
          <ResizableHandle with-handle aria-label="Redimensionar editor e preview — use setas para ajustar" />
          <ResizablePanel :default-size="25" :min-size="15" :max-size="40">
            <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">Preview</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Três painéis e dois handles renderizam', async () => {
      const panels = canvasElement.querySelectorAll('[data-slot="resizable-panel"]');
      const handles = canvasElement.querySelectorAll('[data-slot="resizable-handle"]');
      await expect(panels.length).toBe(3);
      await expect(handles.length).toBe(2);
    });
  },
};

export const VerticalCabecalhoConteudoRodape: Story = {
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <div class="w-[420px] h-[400px] rounded-md border">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel :default-size="20" :min-size="10" :max-size="40">
            <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">Cabeçalho</div>
          </ResizablePanel>
          <ResizableHandle with-handle aria-label="Redimensionar cabeçalho — use setas para ajustar" />
          <ResizablePanel :default-size="60" :min-size="30">
            <div class="flex h-full items-center justify-center p-4 text-sm">Conteúdo</div>
          </ResizablePanel>
          <ResizableHandle with-handle aria-label="Redimensionar rodapé — use setas para ajustar" />
          <ResizablePanel :default-size="20" :min-size="10" :max-size="40">
            <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">Rodapé</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const SidebarComConsole: Story = {
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <div class="w-[640px] h-[360px] rounded-md border">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel :default-size="30" :min-size="20" :max-size="50">
            <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">Sidebar</div>
          </ResizablePanel>
          <ResizableHandle with-handle aria-label="Redimensionar sidebar e área principal — use setas" />
          <ResizablePanel :default-size="70" :min-size="50">
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel :default-size="65" :min-size="30">
                <div class="flex h-full items-center justify-center p-4 text-sm">Workspace</div>
              </ResizablePanel>
              <ResizableHandle with-handle aria-label="Redimensionar workspace e console — use setas" />
              <ResizablePanel :default-size="35" :min-size="15" :max-size="60">
                <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">Console</div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Composição aninhada renderiza dois grupos', async () => {
      const groups = canvasElement.querySelectorAll('[data-slot="resizable-panel-group"]');
      await expect(groups.length).toBe(2);
    });
  },
};
