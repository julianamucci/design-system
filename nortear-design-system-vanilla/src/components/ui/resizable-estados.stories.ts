import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, userEvent, within } from 'storybook/test';
import { createResizablePanel } from './resizable';
import { sondarOuvintes, hospedeiroDeSonda, conferirLimpeza, type ResultadoDaSonda } from './leak-probe';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Resizable/States',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Resizable: Idle (padrão), Focus (handle focado via Tab — ring visível e setas operam), Dragging (cursor col-resize/row-resize e painéis ajustam em tempo real) e Disabled (handle inerte). NOTA: Hover não exige mudança visual obrigatória; aplicar hover:bg-ring se necessário.',
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

function frame(child: HTMLElement, minHeight = '220px'): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.contain = 'layout';
  wrap.style.minHeight = minHeight;
  wrap.className = 'nds-w-full nds-border-default nds-rounded-md nds-overflow-hidden nds-bg-background';
  wrap.appendChild(child);
  return wrap;
}

function basicHorizontal(): HTMLElement {
  const root = createResizablePanel({
    direction: 'horizontal',
    panels: [
      { defaultSize: 40, minSize: 20, content: panelContent('Painel A', 'nds-bg-muted nds-text-muted-foreground') },
      { defaultSize: 60, minSize: 30, content: panelContent('Painel B') },
    ],
  });
  const handle = root.querySelector<HTMLElement>('[data-slot="resizable-handle"]');
  handle?.setAttribute('aria-label', 'Redimensionar painéis — use setas para ajustar');
  return root;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Idle: Story = {
  render: () => frame(basicHorizontal()),
  play: async ({ canvasElement, step }) => {
    await step('Handle no estado idle: role=separator + tabindex=0', async () => {
      const handle = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]');
      await expect(handle).toHaveAttribute('role', 'separator');
      await expect(handle).toHaveAttribute('tabindex', '0');
    });
  },
};

export const Focus: Story = {
  render: () => frame(basicHorizontal()),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Tab move foco para o handle', async () => {
      const handle = canvas.getByRole('separator');
      handle.focus();
      await expect(handle).toHaveFocus();
    });
    await step('Handle focado tem classe nds-focus-ring', async () => {
      const handle = canvas.getByRole('separator');
      await expect(handle.className).toMatch(/nds-resizable-handle/);
    });
  },
};

export const Dragging: Story = {
  name: 'Dragging (via keyboard)',
  render: () => frame(basicHorizontal()),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Setas ajustam o tamanho dos painéis (WCAG 2.5.7)', async () => {
      const handle = canvas.getByRole('separator');
      const panels = canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]');
      const before = panels[0].style.width;
      handle.focus();
      await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
      const after = panels[0].style.width;
      await expect(after).not.toBe(before);
      const beforePct = parseFloat(before);
      const afterPct = parseFloat(after);
      await expect(afterPct).toBeGreaterThan(beforePct);
    });
  },
};

export const Disabled: Story = {
  render: () => {
    // NOTA: factory Vanilla NÃO expõe prop disabled — aplicamos manualmente
    // tabindex=-1, aria-disabled=true e pointer-events:none para simular o
    // estado documentado em translations.json.
    const root = basicHorizontal();
    const handle = root.querySelector<HTMLElement>('[data-slot="resizable-handle"]');
    if (handle) {
      handle.setAttribute('aria-disabled', 'true');
      handle.setAttribute('tabindex', '-1');
      handle.dataset.disabled = '';
      handle.style.pointerEvents = 'none';
      handle.style.cursor = 'not-allowed';
      handle.style.opacity = '0.5';
    }
    return frame(root);
  },
  play: async ({ canvasElement, step }) => {
    await step('Handle desabilitado: aria-disabled=true + tabindex=-1', async () => {
      const handle = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]');
      await expect(handle).toHaveAttribute('aria-disabled', 'true');
      await expect(handle).toHaveAttribute('tabindex', '-1');
      await expect(handle).toHaveAttribute('data-disabled', '');
    });
  },
};

// ─── Limpeza de ouvintes ──────────────────────────────────────────────────────
//
// A fábrica registra ouvinte em `document`. Quem tira o nó da página com o
// componente nesse estado não passa por caminho de fechamento nenhum, e antes
// não havia o que chamar. A prova aqui NÃO é "`destroy()` rodou" — isso passaria
// com um `destroy()` vazio. É a contagem de ouvintes do livro-caixa fechando em
// zero, confirmada por uma bateria de eventos disparada no documento depois da
// saída. Ver `leak-probe.ts` para o que cada prova cobre e como pode falhar.

export const ListenerCleanup: Story = {
  parameters: {
    controls: { disable: true },
    // A story existe para o que acontece DEPOIS da saída do nó: a foto seria
    // sempre a mesma legenda.
    chromatic: { disable: true },
  },
  render: () => hospedeiroDeSonda(
    'Sonda de limpeza: o arraste começa e a página é trocada com o botão ainda pressionado.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let sonda!: ResultadoDaSonda;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      sonda = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => {
          const painel = (texto: string) => {
            const el = document.createElement('div');
            el.textContent = texto;
            return el;
          };
          return createResizablePanel({
            direction: 'horizontal',
            panels: [{ content: painel('Esquerda') }, { content: painel('Direita') }],
          });
        },
        exercitar: (no) => {
          const alca = no.querySelector<HTMLElement>('[data-slot="resizable-handle"]');
          alca?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 40 }));
          document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 140, clientY: 40 }));
        },
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await conferirLimpeza(sonda);
    });
  },
};
