import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './index';
import {
  resizableEditorSource,
  resizableFaixasSource,
  resizableSidebarConsoleSource,
} from './resizable.source';

const meta = {
  title: 'Primitives/Layout/Resizable/Compositions',
  component: ResizablePanelGroup,
  tags: ['layout'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: resizableEditorSource },
      description: {
        component:
          'Composicoes reais do Resizable: layout de editor com sidebar + preview, layout vertical com cabeçalho/conteúdo/rodapé e três painéis em sequência.',
      },
    },
  },
  // `direction` é prop obrigatória do grupo. Sem o valor padrão aqui, o tipo de
  // Story exige `args` em CADA story — e estas montam a composição no próprio
  // template. É o mesmo padrão do meta de `resizable.stories.ts`.
  args: {
    direction: 'horizontal',
  },
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditorWithPreview: Story = {
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <div class="nds-rounded-md nds-border-default nds-w-xl" style="height: 300px">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel :default-size="25" :min-size="15" :max-size="40">
            <div class="nds-cluster nds-p-4 nds-text-body nds-bg-muted" data-align="center" data-justify="center" style="height: 100%">Arquivos</div>
          </ResizablePanel>
          <ResizableHandle with-handle aria-label="Redimensionar lista de arquivos — use setas para ajustar" />
          <ResizablePanel :default-size="50" :min-size="30">
            <div class="nds-cluster nds-p-4 nds-text-body" data-justify="center" style="height: 100%">Editor</div>
          </ResizablePanel>
          <ResizableHandle with-handle aria-label="Redimensionar editor e preview — use setas para ajustar" />
          <ResizablePanel :default-size="25" :min-size="15" :max-size="40">
            <div class="nds-cluster nds-p-4 nds-text-body nds-bg-muted" data-align="center" data-justify="center" style="height: 100%">Preview</div>
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

export const VerticalHeaderContentFooter: Story = {
  parameters: {
    // Eixo, proporção da moldura e papéis das faixas mudam de uma vez.
    docs: { source: { transform: resizableFaixasSource } },
  },
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <div class="nds-rounded-md nds-border-default" style="width: 420px; height: 400px">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel :default-size="20" :min-size="10" :max-size="40">
            <div class="nds-cluster nds-p-4 nds-text-body nds-bg-muted" data-align="center" data-justify="center" style="height: 100%">Cabeçalho</div>
          </ResizablePanel>
          <ResizableHandle with-handle aria-label="Redimensionar cabeçalho — use setas para ajustar" />
          <ResizablePanel :default-size="60" :min-size="30">
            <div class="nds-cluster nds-p-4 nds-text-body" data-justify="center" style="height: 100%">Conteúdo</div>
          </ResizablePanel>
          <ResizableHandle with-handle aria-label="Redimensionar rodapé — use setas para ajustar" />
          <ResizablePanel :default-size="20" :min-size="10" :max-size="40">
            <div class="nds-cluster nds-p-4 nds-text-body nds-bg-muted" data-align="center" data-justify="center" style="height: 100%">Rodapé</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Três faixas empilhadas dividem a ALTURA em 20/60/20', async () => {
      // A asserção anterior era `canvasElement.firstElementChild` ser truthy:
      // passava com a tela vazia, com o eixo trocado e com os três painéis do
      // mesmo tamanho. A medida agora é a proporção que a story existe para
      // demonstrar.
      const alturas = [
        ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]'),
      ].map((p) => p.getBoundingClientRect().height);
      await expect(alturas).toHaveLength(3);
      const total = alturas.reduce((a, b) => a + b, 0);
      await expect(alturas[0] / total).toBeCloseTo(0.2, 1);
      await expect(alturas[1] / total).toBeCloseTo(0.6, 1);
      await expect(alturas[2] / total).toBeCloseTo(0.2, 1);
    });

    await step('E os dois divisores são linhas deitadas', async () => {
      const punhos = [...canvasElement.querySelectorAll('[data-slot="resizable-handle"]')];
      await expect(punhos).toHaveLength(2);
      for (const p of punhos) await expect(p).toHaveAttribute('aria-orientation', 'horizontal');
    });
  },
};

export const SidebarWithConsole: Story = {
  parameters: {
    // O grupo de dentro é a composição — em sequência os três painéis do meta
    // não mostram o aninhamento.
    docs: { source: { transform: resizableSidebarConsoleSource } },
  },
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <div class="nds-rounded-md nds-border-default nds-w-xl" style="height: 360px">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel :default-size="30" :min-size="20" :max-size="50">
            <div class="nds-cluster nds-p-4 nds-text-body nds-bg-muted" data-align="center" data-justify="center" style="height: 100%">Sidebar</div>
          </ResizablePanel>
          <ResizableHandle with-handle aria-label="Redimensionar sidebar e área principal — use setas" />
          <ResizablePanel :default-size="70" :min-size="50">
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel :default-size="65" :min-size="30">
                <div class="nds-cluster nds-p-4 nds-text-body" data-justify="center" style="height: 100%">Workspace</div>
              </ResizablePanel>
              <ResizableHandle with-handle aria-label="Redimensionar workspace e console — use setas" />
              <ResizablePanel :default-size="35" :min-size="15" :max-size="60">
                <div class="nds-cluster nds-p-4 nds-text-body nds-bg-muted" data-align="center" data-justify="center" style="height: 100%">Console</div>
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
