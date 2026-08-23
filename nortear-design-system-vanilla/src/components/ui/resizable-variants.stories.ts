import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, within } from 'storybook/test';
import { createResizablePanel } from './resizable';
import { frame, panelLabelled } from './resizable.fixtures';
import {
  resizableSource,
  resizableSourceNested,
  resizableSourceWith,
} from './resizable.source';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Resizable/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: resizableSource },
      description: {
        component:
          'Variantes do Resizable: Horizontal (split lateral com handle vertical), Vertical (split vertical com handle horizontal), Nested (PanelGroup dentro de Panel combinando direções) e WithHandle (pegador visual centralizado).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fração do eixo principal que CADA painel de um grupo ocupa na tela.
 *
 * A medida é `getBoundingClientRect`, e nunca `style.width`: a folha
 * compartilhada dá `flex-basis: 0` ao painel, então largura inline não decide
 * nada. As stories afirmavam `style.width === '30%'` e passavam com os painéis
 * desenhados 50/50 — a asserção guardava o defeito em vez de pegá-lo.
 *
 * Só aqui: as stories deste arquivo comparam grupos ANINHADOS, e cada um traz
 * a própria lista de painéis. O `firstFraction` do fixture mede o canvas
 * inteiro, que juntaria os dois grupos numa conta só.
 */
function fraction(panels: HTMLElement[], horizontal: boolean): number[] {
  const measurement = (p: HTMLElement) =>
    horizontal ? p.getBoundingClientRect().width : p.getBoundingClientRect().height;
  const total = panels.reduce((acc, p) => acc + measurement(p), 0);
  return panels.map((p) => measurement(p) / total);
}

function panelsOf(root: ParentNode, seletorGrupo = '[data-slot="resizable"]'): HTMLElement[] {
  const group = root.querySelector<HTMLElement>(seletorGrupo)!;
  return [...group.querySelectorAll<HTMLElement>(':scope > [data-slot="resizable-panel"]')];
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => {
    const root = createResizablePanel({
      direction: 'horizontal',
      'aria-label': 'Redimensionar Sidebar e Conteúdo — use setas para ajustar',
      panels: [
        { defaultSize: 30, minSize: 15, content: panelLabelled('Sidebar', 'nds-bg-muted nds-text-muted-foreground') },
        { defaultSize: 70, minSize: 30, content: panelLabelled('Conteúdo principal') },
      ],
    });
    return frame(root, '220px');
  },
  play: async ({ canvasElement, step }) => {
    await step('Split lateral: o divisor é uma linha vertical', async () => {
      // O CSS decide espessura e cursor pelo eixo do punho. Um grupo horizontal
      // é dividido por uma linha VERTICAL — a inversão é a fonte clássica de
      // erro aqui.
      const group = canvasElement.querySelector<HTMLElement>('[data-slot="resizable"]')!;
      const punho = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]')!;
      await expect(group).toHaveAttribute('data-direction', 'horizontal');
      await expect(punho).toHaveAttribute('role', 'separator');
      await expect(punho).toHaveAttribute('aria-orientation', 'vertical');
      await expect(getComputedStyle(group).flexDirection).toBe('row');
      await expect(getComputedStyle(punho).cursor).toBe('col-resize');
    });

    await step('Os painéis dividem a LARGURA na proporção declarada', async () => {
      const [a] = fraction(panelsOf(canvasElement), true);
      await expect(a).toBeCloseTo(0.3, 1);
    });
  },
};

export const Vertical: Story = {
  parameters: {
    covers: ['visual.item2'],
    // Override de story: o eixo é o assunto, e `direction` não passa por
    // control neste arquivo.
    docs: {
      source: {
        transform: resizableSourceWith({
          direction: 'vertical',
          'aria-label': 'Redimensionar Topo e Rodapé — use setas para ajustar',
          panels: [
            { title: 'Topo', defaultSize: 40, minSize: 20 },
            { title: 'Rodapé', defaultSize: 60, minSize: 20 },
          ],
        }),
      },
    },
  },
  render: () => {
    const root = createResizablePanel({
      direction: 'vertical',
      'aria-label': 'Redimensionar Topo e Rodapé — use setas para ajustar',
      panels: [
        { defaultSize: 40, minSize: 20, content: panelLabelled('Topo') },
        { defaultSize: 60, minSize: 20, content: panelLabelled('Rodapé', 'nds-bg-muted nds-text-muted-foreground') },
      ],
    });
    return frame(root, '280px');
  },
  play: async ({ canvasElement, step }) => {
    await step('Split empilhado: o divisor é uma linha deitada', async () => {
      const group = canvasElement.querySelector<HTMLElement>('[data-slot="resizable"]')!;
      const punho = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]')!;
      await expect(punho).toHaveAttribute('aria-orientation', 'horizontal');
      await expect(getComputedStyle(group).flexDirection).toBe('column');
      await expect(getComputedStyle(punho).cursor).toBe('row-resize');
    });

    await step('Os painéis dividem a ALTURA, e não a largura', async () => {
      // O eixo trocado é invisível numa foto quadrada: os dois painéis
      // apareceriam empilhados de qualquer jeito e só a proporção denunciaria.
      const [a] = fraction(panelsOf(canvasElement), false);
      await expect(a).toBeCloseTo(0.4, 1);
    });
  },
};

export const Nested: Story = {
  parameters: {
    covers: ['visual.item3'],
    // Override de story: um grupo dentro do painel de outro pede outra FORMA de
    // snippet — cada grupo nomeia o próprio divisor.
    docs: {
      source: {
        transform: resizableSourceNested({
          interno: {
            direction: 'vertical',
            'aria-label': 'Redimensionar Editor e Console — use setas para ajustar',
            panels: [
              { title: 'Editor', defaultSize: 60, minSize: 20 },
              { title: 'Console', defaultSize: 40, minSize: 20 },
            ],
          },
          externo: {
            'aria-label': 'Redimensionar Sidebar e área principal — use setas para ajustar',
            panels: [
              { title: 'Sidebar', defaultSize: 30, minSize: 15 },
              { title: 'Área principal', defaultSize: 70, minSize: 30 },
            ],
          },
          neighbour: { title: 'Sidebar', defaultSize: 30, minSize: 15 },
        }),
      },
    },
  },
  render: () => {
    // Cada grupo nomeia o PRÓPRIO divisor. Percorrer os divisores a partir da
    // raiz do grupo de fora, como se fazia aqui, alcançava também os do grupo de
    // dentro — e nomeava dois controles de layouts diferentes por posição.
    const inner = createResizablePanel({
      direction: 'vertical',
      'aria-label': 'Redimensionar Editor e Console — use setas para ajustar',
      panels: [
        { defaultSize: 60, minSize: 20, content: panelLabelled('Editor') },
        { defaultSize: 40, minSize: 20, content: panelLabelled('Console', 'nds-bg-muted nds-text-muted-foreground') },
      ],
    });
    const innerWrap = document.createElement('div');
    innerWrap.style.height = '100%';
    innerWrap.style.width = '100%';
    innerWrap.appendChild(inner);

    const root = createResizablePanel({
      direction: 'horizontal',
      'aria-label': 'Redimensionar Sidebar e área principal — use setas para ajustar',
      panels: [
        { defaultSize: 30, minSize: 15, content: panelLabelled('Sidebar', 'nds-bg-muted nds-text-muted-foreground') },
        { defaultSize: 70, minSize: 30, content: innerWrap },
      ],
    });
    return frame(root, '320px');
  },
  play: async ({ canvasElement, step }) => {
    await step('Cada grupo governa só os próprios painéis', async () => {
      // O grupo de dentro é outro grupo: os painéis dele não podem entrar na
      // conta do de fora, senão um ajuste move os dois layouts ao mesmo tempo.
      const groups = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable"]')];
      await expect(groups).toHaveLength(2);
      for (const g of groups) {
        await expect(g.querySelectorAll(':scope > [data-slot="resizable-panel"]')).toHaveLength(2);
      }
    });

    await step('O divisor de dentro tem o eixo do grupo de dentro', async () => {
      const groups = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable"]')];
      const eixo = (g: HTMLElement) =>
        g.querySelector(':scope > [data-slot="resizable-handle"]')!.getAttribute('aria-orientation');
      await expect(eixo(groups[0])).toBe('vertical');
      await expect(eixo(groups[1])).toBe('horizontal');
    });

    await step('E as proporções de cada grupo são independentes', async () => {
      const groups = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable"]')];
      const externo = [...groups[0].querySelectorAll<HTMLElement>(':scope > [data-slot="resizable-panel"]')];
      const interno = [...groups[1].querySelectorAll<HTMLElement>(':scope > [data-slot="resizable-panel"]')];
      await expect(fraction(externo, true)[0]).toBeCloseTo(0.3, 1);
      await expect(fraction(interno, false)[0]).toBeCloseTo(0.6, 1);
    });
  },
};

export const WithHandle: Story = {
  parameters: {
    covers: ['visual.item4'],
    // Override de story: `withHandle` é o assunto, e `false` é o padrão da
    // fábrica — sem esta linha o snippet esconderia justamente a opção.
    docs: {
      source: {
        transform: resizableSourceWith({
          withHandle: true,
          'aria-label': 'Redimensionar painéis — use setas para ajustar',
          panels: [
            { title: 'Antes', defaultSize: 50, minSize: 20 },
            { title: 'Depois', defaultSize: 50, minSize: 20 },
          ],
        }),
      },
    },
  },
  render: () => {
    const root = createResizablePanel({
      direction: 'horizontal',
      withHandle: true,
      'aria-label': 'Redimensionar painéis — use setas para ajustar',
      panels: [
        { defaultSize: 50, minSize: 20, content: panelLabelled('Antes') },
        { defaultSize: 50, minSize: 20, content: panelLabelled('Depois', 'nds-bg-muted nds-text-muted-foreground') },
      ],
    });
    return frame(root, '220px');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O pegador aparece e é maior que a linha de 1px', async () => {
      // A linha sozinha é quase invisível; o pegador é o que anuncia que ali
      // existe um controle.
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
      await expect(
        canvas.getByRole('separator', { name: 'Redimensionar painéis — use setas para ajustar' }),
      ).toBeInTheDocument();
    });
  },
};
