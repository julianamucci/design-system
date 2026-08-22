import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NdsResizable, NdsResizablePanel, NdsResizableHandle } from './resizable';

const meta: Meta = {
  title: 'UI/Resizable/Variants',
  decorators: [moduleMetadata({ imports: [NdsResizable, NdsResizablePanel, NdsResizableHandle] })],
  // Sem argTypes nesta suíte: sem desligar, o painel Controls abre vazio.
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Horizontal: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => ({
    template: `
      <div ndsResizable direction="horizontal" class="nds-min-h-50 nds-w-full">
        <div ndsResizablePanel [defaultSize]="30" [minSize]="20" [maxSize]="50">
          <div class="nds-p-4"><p class="nds-text-body nds-m-0">Esquerda</p></div>
        </div>
        <div ndsResizableHandle aria-label="Redimensionar as colunas — use as setas"></div>
        <div ndsResizablePanel [defaultSize]="70" [minSize]="50">
          <div class="nds-p-4"><p class="nds-text-body nds-m-0">Direita</p></div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Split lateral: o divisor é uma linha vertical', async () => {
      // O CSS decide espessura e cursor pelo `aria-orientation` do punho e pelo
      // `data-direction` do grupo. Um grupo horizontal é dividido por uma linha
      // VERTICAL — a inversão é a fonte clássica de erro aqui.
      const grupo = canvasElement.querySelector<HTMLElement>('[data-slot="resizable"]')!;
      const punho = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]')!;
      await expect(grupo).toHaveAttribute('data-direction', 'horizontal');
      await expect(punho).toHaveAttribute('aria-orientation', 'vertical');
      await expect(getComputedStyle(grupo).flexDirection).toBe('row');
      await expect(getComputedStyle(punho).cursor).toBe('col-resize');
    });

    await step('Os painéis dividem a largura na proporção declarada', async () => {
      const [a, b] = [
        ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]'),
      ].map((p) => p.getBoundingClientRect().width);
      await expect(a / (a + b)).toBeCloseTo(0.3, 1);
    });
  },
};

export const Vertical: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => ({
    template: `
      <div ndsResizable direction="vertical" class="nds-min-h-50 nds-w-full">
        <div ndsResizablePanel [defaultSize]="40" [minSize]="20">
          <div class="nds-p-4"><p class="nds-text-body nds-m-0">Topo</p></div>
        </div>
        <div ndsResizableHandle aria-label="Redimensionar as faixas — use as setas"></div>
        <div ndsResizablePanel [defaultSize]="60" [minSize]="20">
          <div class="nds-p-4"><p class="nds-text-body nds-m-0">Rodapé</p></div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Split empilhado: o divisor é uma linha deitada', async () => {
      const grupo = canvasElement.querySelector<HTMLElement>('[data-slot="resizable"]')!;
      const punho = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]')!;
      await expect(grupo).toHaveAttribute('data-direction', 'vertical');
      await expect(punho).toHaveAttribute('aria-orientation', 'horizontal');
      await expect(getComputedStyle(grupo).flexDirection).toBe('column');
      await expect(getComputedStyle(punho).cursor).toBe('row-resize');
    });

    await step('Os painéis dividem a ALTURA, e não a largura', async () => {
      // O eixo trocado é invisível numa foto quadrada: os dois painéis
      // apareceriam empilhados de qualquer jeito e só a proporção denunciaria.
      const [a, b] = [
        ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]'),
      ].map((p) => p.getBoundingClientRect().height);
      await expect(a / (a + b)).toBeCloseTo(0.4, 1);
    });
  },
};

export const Nested: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    template: `
      <div ndsResizable direction="horizontal" class="nds-min-h-50 nds-w-full">
        <div ndsResizablePanel [defaultSize]="30" [minSize]="20">
          <div class="nds-p-4"><p class="nds-text-body nds-m-0">Sidebar</p></div>
        </div>
        <div ndsResizableHandle aria-label="Redimensionar sidebar e conteúdo — use as setas"></div>
        <div ndsResizablePanel [defaultSize]="70" [minSize]="40">
          <div ndsResizable direction="vertical" class="nds-h-full">
            <div ndsResizablePanel [defaultSize]="60" [minSize]="20">
              <div class="nds-p-4"><p class="nds-text-body nds-m-0">Editor</p></div>
            </div>
            <div ndsResizableHandle aria-label="Redimensionar editor e console — use as setas"></div>
            <div ndsResizablePanel [defaultSize]="40" [minSize]="20">
              <div class="nds-p-4"><p class="nds-text-body nds-m-0">Console</p></div>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada grupo governa só os próprios painéis', async () => {
      // O estado vive no elemento do grupo, não em `root`: sem isso o grupo de
      // dentro e o de fora dividiriam a mesma lista de painéis e um arrasto
      // moveria os dois layouts ao mesmo tempo.
      const grupos = canvasElement.querySelectorAll('[data-slot="resizable"]');
      await expect(grupos).toHaveLength(2);

      const externo = grupos[0].querySelectorAll(':scope > [data-slot="resizable-panel"]');
      const interno = grupos[1].querySelectorAll(':scope > [data-slot="resizable-panel"]');
      await expect(externo).toHaveLength(2);
      await expect(interno).toHaveLength(2);
    });

    await step('O divisor de dentro tem o eixo do grupo de dentro', async () => {
      await expect(
        canvas.getByRole('separator', { name: 'Redimensionar sidebar e conteúdo — use as setas' }),
      ).toHaveAttribute('aria-orientation', 'vertical');
      await expect(
        canvas.getByRole('separator', { name: 'Redimensionar editor e console — use as setas' }),
      ).toHaveAttribute('aria-orientation', 'horizontal');
    });
  },
};

export const WithHandle: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    template: `
      <div ndsResizable direction="horizontal" class="nds-min-h-50 nds-w-full">
        <div ndsResizablePanel [defaultSize]="50" [minSize]="20">
          <div class="nds-p-4"><p class="nds-text-body nds-m-0">Antes</p></div>
        </div>
        <div
          ndsResizableHandle
          [withHandle]="true"
          aria-label="Redimensionar painéis — use as setas"
        ></div>
        <div ndsResizablePanel [defaultSize]="50" [minSize]="20">
          <div class="nds-p-4"><p class="nds-text-body nds-m-0">Depois</p></div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O pegador aparece e é maior que a linha de 1px', async () => {
      // A linha sozinha é quase invisível; o pegador é o que anuncia que ali
      // existe um controle. É por isso que a guideline pede `withHandle` em
      // desktop.
      const grip = canvasElement.querySelector<HTMLElement>('.nds-resizable-grip')!;
      await expect(grip).toBeInTheDocument();
      await expect(grip.getBoundingClientRect().width).toBeGreaterThan(4);
    });

    await step('O ícone do pegador fica fora da árvore de acessibilidade', async () => {
      // Seis pontinhos não têm nada a dizer a um leitor de tela: quem carrega o
      // significado é o aria-label do separator.
      await expect(canvasElement.querySelector('.nds-resizable-grip svg')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    });
  },
};
