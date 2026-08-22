import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './index';
import {
  resizableNestedSource,
  resizableWithGrabberSource,
  resizableHorizontalSource,
  resizableVerticalSource,
} from './resizable.source';

const meta = {
  title: 'UI/Resizable/Variants',
  component: ResizablePanelGroup,
  tags: ['layout'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: resizableHorizontalSource },
      description: {
        component:
          'Variantes do Resizable: Horizontal (split lateral com divisor vertical), Vertical (split empilhado com divisor deitado), Nested (grupo dentro de painel) e WithHandle (pegador visual centralizado).',
      },
    },
  },
  // `direction` é prop obrigatória do grupo. Sem o valor padrão aqui, o tipo de
  // Story exige `args` em CADA story — e estas montam a composição no próprio
  // template, cada uma com a sua orientação. É o mesmo padrão do meta de
  // `resizable.stories.ts`.
  args: {
    direction: 'horizontal',
  },
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Geometria real; `style.width` não decide nada num item de `flex-basis: 0`. */
function fracoes(panels: HTMLElement[], horizontal: boolean): number[] {
  const measurement = (p: HTMLElement) =>
    horizontal ? p.getBoundingClientRect().width : p.getBoundingClientRect().height;
  const total = panels.reduce((a, p) => a + measurement(p), 0);
  return panels.map((p) => measurement(p) / total);
}

function panelsDiretos(grupo: Element): HTMLElement[] {
  return [...grupo.querySelectorAll<HTMLElement>(':scope > [data-slot="resizable-panel"]')];
}

export const Horizontal: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 480px; height: 240px">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel :default-size="30" :min-size="20" :max-size="50">
            <div class="nds-cluster nds-p-4 nds-text-body nds-bg-muted" data-align="center" data-justify="center" style="height: 100%">Esquerda</div>
          </ResizablePanel>
          <ResizableHandle aria-label="Redimensionar as colunas — use setas para ajustar" />
          <ResizablePanel :default-size="70" :min-size="50">
            <div class="nds-cluster nds-p-4 nds-text-body" data-justify="center" style="height: 100%">Direita</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Split lateral: o divisor é uma linha vertical', async () => {
      // O CSS decide espessura e cursor pelo eixo do punho. Um grupo horizontal
      // é dividido por uma linha VERTICAL — a inversão é a fonte clássica de
      // erro aqui.
      const grupo = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-panel-group"]')!;
      const punho = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]')!;
      await expect(punho).toHaveAttribute('aria-orientation', 'vertical');
      await expect(getComputedStyle(grupo).flexDirection).toBe('row');
      await expect(getComputedStyle(punho).cursor).toBe('col-resize');
    });

    await step('Os painéis dividem a LARGURA na proporção declarada', async () => {
      const grupo = canvasElement.querySelector('[data-slot="resizable-panel-group"]')!;
      await expect(fracoes(panelsDiretos(grupo), true)[0]).toBeCloseTo(0.3, 1);
    });
  },
};

export const Vertical: Story = {
  parameters: {
    covers: ['visual.item2'],
    // O eixo troca a proporção da moldura e a direção do grupo — a do meta
    // mostraria o split lateral, que é outra composição.
    docs: { source: { transform: resizableVerticalSource } },
  },
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 360px; height: 300px">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel :default-size="40" :min-size="20">
            <div class="nds-cluster nds-p-4 nds-text-body" data-justify="center" style="height: 100%">Topo</div>
          </ResizablePanel>
          <ResizableHandle aria-label="Redimensionar as faixas — use setas para ajustar" />
          <ResizablePanel :default-size="60" :min-size="20">
            <div class="nds-cluster nds-p-4 nds-text-body nds-bg-muted" data-align="center" data-justify="center" style="height: 100%">Rodapé</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Split empilhado: o divisor é uma linha deitada', async () => {
      // Aqui morava um defeito que nenhuma story via: o divisor de um grupo
      // vertical saía com 1px de LARGURA e cursor de coluna, e comia 24px da
      // altura dos painéis. A folha não conhecia o vocabulário de eixo que este
      // primitivo emite. A asserção é sobre a geometria, não sobre o atributo.
      const grupo = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-panel-group"]')!;
      const punho = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]')!;
      await expect(punho).toHaveAttribute('aria-orientation', 'horizontal');
      await expect(getComputedStyle(grupo).flexDirection).toBe('column');
      await expect(getComputedStyle(punho).cursor).toBe('row-resize');
      await expect(punho.getBoundingClientRect().width).toBeCloseTo(
        grupo.getBoundingClientRect().width,
        0,
      );
      await expect(punho.getBoundingClientRect().height).toBeLessThan(4);
    });

    await step('Os painéis dividem a ALTURA, e não a largura', async () => {
      const grupo = canvasElement.querySelector('[data-slot="resizable-panel-group"]')!;
      await expect(fracoes(panelsDiretos(grupo), false)[0]).toBeCloseTo(0.4, 1);
    });
  },
};

export const Nested: Story = {
  parameters: {
    covers: ['visual.item3'],
    // O segundo grupo dentro do painel é justamente o que a story ensina.
    docs: { source: { transform: resizableNestedSource } },
  },
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 560px; height: 300px">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel :default-size="30" :min-size="20" :max-size="50">
            <div class="nds-cluster nds-p-4 nds-text-body nds-bg-muted" data-align="center" data-justify="center" style="height: 100%">Sidebar</div>
          </ResizablePanel>
          <ResizableHandle aria-label="Redimensionar sidebar e conteúdo — use setas" />
          <ResizablePanel :default-size="70" :min-size="50">
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel :default-size="60" :min-size="20">
                <div class="nds-cluster nds-p-4 nds-text-body" data-justify="center" style="height: 100%">Editor</div>
              </ResizablePanel>
              <ResizableHandle aria-label="Redimensionar editor e console — use setas" />
              <ResizablePanel :default-size="40" :min-size="20">
                <div class="nds-cluster nds-p-4 nds-text-body nds-bg-muted" data-align="center" data-justify="center" style="height: 100%">Console</div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada grupo governa só os próprios painéis', async () => {
      // O grupo de dentro é outro grupo: os painéis dele não podem entrar na
      // conta do de fora, senão um ajuste move os dois layouts ao mesmo tempo.
      const grupos = [...canvasElement.querySelectorAll('[data-slot="resizable-panel-group"]')];
      await expect(grupos).toHaveLength(2);
      for (const g of grupos) await expect(panelsDiretos(g)).toHaveLength(2);
    });

    await step('O divisor de dentro tem o eixo do grupo de dentro', async () => {
      await expect(
        canvas.getByRole('separator', { name: 'Redimensionar sidebar e conteúdo — use setas' }),
      ).toHaveAttribute('aria-orientation', 'vertical');
      await expect(
        canvas.getByRole('separator', { name: 'Redimensionar editor e console — use setas' }),
      ).toHaveAttribute('aria-orientation', 'horizontal');
    });

    await step('E as proporções de cada grupo são independentes', async () => {
      const grupos = [...canvasElement.querySelectorAll('[data-slot="resizable-panel-group"]')];
      await expect(fracoes(panelsDiretos(grupos[0]), true)[0]).toBeCloseTo(0.3, 1);
      await expect(fracoes(panelsDiretos(grupos[1]), false)[0]).toBeCloseTo(0.6, 1);
    });
  },
};

export const WithHandle: Story = {
  parameters: {
    covers: ['visual.item4'],
    // A flag do pegador é o assunto, e o divisor do meta não a tem.
    docs: { source: { transform: resizableWithGrabberSource } },
  },
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: `
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 480px; height: 240px">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel :default-size="50" :min-size="20">
            <div class="nds-cluster nds-p-4 nds-text-body" data-justify="center" style="height: 100%">Antes</div>
          </ResizablePanel>
          <ResizableHandle with-handle aria-label="Redimensionar painéis — use setas" />
          <ResizablePanel :default-size="50" :min-size="20">
            <div class="nds-cluster nds-p-4 nds-text-body nds-bg-muted" data-align="center" data-justify="center" style="height: 100%">Depois</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O pegador aparece e é maior que a linha de 1px', async () => {
      // A linha sozinha é quase invisível; o pegador é o que anuncia que ali
      // existe um controle. É por isso que a guideline pede o pegador em
      // desktop.
      const grip = canvasElement.querySelector<HTMLElement>('.nds-resizable-grip-bar')!;
      await expect(grip).toBeInTheDocument();
      await expect(grip.getBoundingClientRect().height).toBeGreaterThan(8);
    });

    await step('O pegador não rouba o nome acessível do divisor', async () => {
      // Quem carrega o significado é o `aria-label` do separator; o pegador é
      // desenho. Um elemento com texto ali dentro passaria a compor o nome.
      const punho = canvas.getByRole('separator', { name: 'Redimensionar painéis — use setas' });
      await expect(punho.querySelector('.nds-resizable-grip-bar')?.textContent?.trim()).toBe('');
    });
  },
};
