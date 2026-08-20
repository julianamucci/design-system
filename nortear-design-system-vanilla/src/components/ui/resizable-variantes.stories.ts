import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, within } from 'storybook/test';
import { createResizablePanel } from './resizable';
import {
  resizableSource,
  resizableSourceAninhado,
  resizableSourceCom,
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

function panelContent(label: string, extraClass = ''): HTMLElement {
  const el = document.createElement('div');
  el.className = `nds-cluster nds-w-full nds-p-4 nds-text-body nds-font-medium ${extraClass}`.trim();
  el.dataset.justify = 'center';
  el.style.height = '100%';
  const span = document.createElement('span');
  span.textContent = label;
  el.appendChild(span);
  return el;
}

function frame(child: HTMLElement, altura = '220px'): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.contain = 'layout';
  // ALTURA DEFINIDA, e não só `min-height`: um grupo vertical distribui a
  // ALTURA livre entre os painéis, e não existe altura livre dentro de um
  // contêiner de altura automática — os painéis colapsavam para zero. Com
  // `min-height` no invólucro, o `height: 100%` do grupo resolvia para `auto`.
  // A suíte só viu isso quando a asserção passou a medir a geometria.
  wrap.style.height = altura;
  wrap.className = 'nds-w-full nds-border-default nds-rounded-md nds-overflow-hidden nds-bg-background';
  wrap.appendChild(child);
  return wrap;
}

/**
 * Fração do eixo principal que o painel realmente ocupa na tela.
 *
 * A medida é `getBoundingClientRect`, e nunca `style.width`: a folha
 * compartilhada dá `flex-basis: 0` ao painel, então largura inline não decide
 * nada. As stories afirmavam `style.width === '30%'` e passavam com os painéis
 * desenhados 50/50 — a asserção guardava o defeito em vez de pegá-lo.
 */
function fracao(paineis: HTMLElement[], horizontal: boolean): number[] {
  const medida = (p: HTMLElement) =>
    horizontal ? p.getBoundingClientRect().width : p.getBoundingClientRect().height;
  const total = paineis.reduce((acc, p) => acc + medida(p), 0);
  return paineis.map((p) => medida(p) / total);
}

function paineisDe(raiz: ParentNode, seletorGrupo = '[data-slot="resizable"]'): HTMLElement[] {
  const grupo = raiz.querySelector<HTMLElement>(seletorGrupo)!;
  return [...grupo.querySelectorAll<HTMLElement>(':scope > [data-slot="resizable-panel"]')];
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => {
    const root = createResizablePanel({
      direction: 'horizontal',
      'aria-label': 'Redimensionar Sidebar e Conteúdo — use setas para ajustar',
      panels: [
        { defaultSize: 30, minSize: 15, content: panelContent('Sidebar', 'nds-bg-muted nds-text-muted-foreground') },
        { defaultSize: 70, minSize: 30, content: panelContent('Conteúdo principal') },
      ],
    });
    return frame(root, '220px');
  },
  play: async ({ canvasElement, step }) => {
    await step('Split lateral: o divisor é uma linha vertical', async () => {
      // O CSS decide espessura e cursor pelo eixo do punho. Um grupo horizontal
      // é dividido por uma linha VERTICAL — a inversão é a fonte clássica de
      // erro aqui.
      const grupo = canvasElement.querySelector<HTMLElement>('[data-slot="resizable"]')!;
      const punho = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]')!;
      await expect(grupo).toHaveAttribute('data-direction', 'horizontal');
      await expect(punho).toHaveAttribute('role', 'separator');
      await expect(punho).toHaveAttribute('aria-orientation', 'vertical');
      await expect(getComputedStyle(grupo).flexDirection).toBe('row');
      await expect(getComputedStyle(punho).cursor).toBe('col-resize');
    });

    await step('Os painéis dividem a LARGURA na proporção declarada', async () => {
      const [a] = fracao(paineisDe(canvasElement), true);
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
        transform: resizableSourceCom({
          direction: 'vertical',
          'aria-label': 'Redimensionar Topo e Rodapé — use setas para ajustar',
          panels: [
            { titulo: 'Topo', defaultSize: 40, minSize: 20 },
            { titulo: 'Rodapé', defaultSize: 60, minSize: 20 },
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
        { defaultSize: 40, minSize: 20, content: panelContent('Topo') },
        { defaultSize: 60, minSize: 20, content: panelContent('Rodapé', 'nds-bg-muted nds-text-muted-foreground') },
      ],
    });
    return frame(root, '280px');
  },
  play: async ({ canvasElement, step }) => {
    await step('Split empilhado: o divisor é uma linha deitada', async () => {
      const grupo = canvasElement.querySelector<HTMLElement>('[data-slot="resizable"]')!;
      const punho = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]')!;
      await expect(punho).toHaveAttribute('aria-orientation', 'horizontal');
      await expect(getComputedStyle(grupo).flexDirection).toBe('column');
      await expect(getComputedStyle(punho).cursor).toBe('row-resize');
    });

    await step('Os painéis dividem a ALTURA, e não a largura', async () => {
      // O eixo trocado é invisível numa foto quadrada: os dois painéis
      // apareceriam empilhados de qualquer jeito e só a proporção denunciaria.
      const [a] = fracao(paineisDe(canvasElement), false);
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
        transform: resizableSourceAninhado({
          interno: {
            direction: 'vertical',
            'aria-label': 'Redimensionar Editor e Console — use setas para ajustar',
            panels: [
              { titulo: 'Editor', defaultSize: 60, minSize: 20 },
              { titulo: 'Console', defaultSize: 40, minSize: 20 },
            ],
          },
          externo: {
            'aria-label': 'Redimensionar Sidebar e área principal — use setas para ajustar',
            panels: [
              { titulo: 'Sidebar', defaultSize: 30, minSize: 15 },
              { titulo: 'Área principal', defaultSize: 70, minSize: 30 },
            ],
          },
          vizinho: { titulo: 'Sidebar', defaultSize: 30, minSize: 15 },
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
        { defaultSize: 60, minSize: 20, content: panelContent('Editor') },
        { defaultSize: 40, minSize: 20, content: panelContent('Console', 'nds-bg-muted nds-text-muted-foreground') },
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
        { defaultSize: 30, minSize: 15, content: panelContent('Sidebar', 'nds-bg-muted nds-text-muted-foreground') },
        { defaultSize: 70, minSize: 30, content: innerWrap },
      ],
    });
    return frame(root, '320px');
  },
  play: async ({ canvasElement, step }) => {
    await step('Cada grupo governa só os próprios painéis', async () => {
      // O grupo de dentro é outro grupo: os painéis dele não podem entrar na
      // conta do de fora, senão um ajuste move os dois layouts ao mesmo tempo.
      const grupos = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable"]')];
      await expect(grupos).toHaveLength(2);
      for (const g of grupos) {
        await expect(g.querySelectorAll(':scope > [data-slot="resizable-panel"]')).toHaveLength(2);
      }
    });

    await step('O divisor de dentro tem o eixo do grupo de dentro', async () => {
      const grupos = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable"]')];
      const eixo = (g: HTMLElement) =>
        g.querySelector(':scope > [data-slot="resizable-handle"]')!.getAttribute('aria-orientation');
      await expect(eixo(grupos[0])).toBe('vertical');
      await expect(eixo(grupos[1])).toBe('horizontal');
    });

    await step('E as proporções de cada grupo são independentes', async () => {
      const grupos = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable"]')];
      const externo = [...grupos[0].querySelectorAll<HTMLElement>(':scope > [data-slot="resizable-panel"]')];
      const interno = [...grupos[1].querySelectorAll<HTMLElement>(':scope > [data-slot="resizable-panel"]')];
      await expect(fracao(externo, true)[0]).toBeCloseTo(0.3, 1);
      await expect(fracao(interno, false)[0]).toBeCloseTo(0.6, 1);
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
        transform: resizableSourceCom({
          withHandle: true,
          'aria-label': 'Redimensionar painéis — use setas para ajustar',
          panels: [
            { titulo: 'Antes', defaultSize: 50, minSize: 20 },
            { titulo: 'Depois', defaultSize: 50, minSize: 20 },
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
        { defaultSize: 50, minSize: 20, content: panelContent('Antes') },
        { defaultSize: 50, minSize: 20, content: panelContent('Depois', 'nds-bg-muted nds-text-muted-foreground') },
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
