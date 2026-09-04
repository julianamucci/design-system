import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { createResizablePanel } from './resizable';
import { firstFraction, frame, panelLabelled } from './resizable.fixtures';
import { resizableSource, resizableSourceWith } from './resizable.source';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';

const meta: Meta = {
  tags: ['layout'],
  title: 'Components/Layout/Resizable/States',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: resizableSource },
      description: {
        component:
          'Estados do Resizable: Dragging (arrasto ajusta os painéis em tempo real), Limits (o painel para no mínimo e no máximo), Focus (divisor alcançado pelo Tab, com anel visível) e Disabled (divisor travado, ainda anunciado e alcançável).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const LABEL = 'Redimensionar painéis — use setas para ajustar';

// ─── Helpers ──────────────────────────────────────────────────────────────────
//
// As stories deste arquivo são todas HORIZONTAIS, por isso `firstFraction`
// vem do fixture no padrão — quem varia o eixo é a story raiz, que passa o
// parâmetro.

function group(options: {
  disabled?: boolean;
  withHandle?: boolean;
  minA?: number;
  maxA?: number;
  onLayout?: (s: number[]) => void;
}): HTMLElement {
  const root = createResizablePanel({
    direction: 'horizontal',
    disabled: options.disabled,
    withHandle: options.withHandle,
    onLayout: options.onLayout,
    'aria-label': LABEL,
    panels: [
      {
        defaultSize: 50,
        minSize: options.minA ?? 20,
        maxSize: options.maxA,
        content: panelLabelled('Painel A', 'nds-bg-muted nds-text-muted-foreground'),
      },
      { defaultSize: 50, minSize: options.minA ?? 20, content: panelLabelled('Painel B') },
    ],
  });
  return frame(root);
}

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Layouts emitidos por `onLayout`. Cada play limpa a lista antes de interagir. */
const layoutsEmitidos: number[][] = [];

export const Dragging: Story = {
  parameters: {
    covers: ['functional.item1', 'accessibility.item2'],
    // Override de story: `onLayout` e `withHandle` são o assunto, e nenhum
    // control deste arquivo os cobre.
    docs: {
      source: {
        transform: resizableSourceWith({
          withHandle: true,
          onLayout: '(sizes) => guardarLayout(sizes)',
          'aria-label': LABEL,
          panels: [
            { title: 'Painel A', defaultSize: 50 },
            { title: 'Painel B', defaultSize: 50 },
          ],
        }),
      },
    },
  },
  render: () => group({ minA: 10, withHandle: true, onLayout: (s) => layoutsEmitidos.push(s) }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: LABEL });
    layoutsEmitidos.length = 0;

    await step('Arrastar o divisor ajusta os painéis em tempo real', async () => {
      // functional.item1. A sequência completa de ponteiro, e não um evento
      // construído à mão: o arrasto nasce no `mousedown` do punho e continua em
      // ouvintes de `document`, que um clique sintético nunca alcança.
      const box = punho.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      const antes = firstFraction(canvasElement);

      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: punho, coords: { clientX: x, clientY: y } },
        { target: punho, coords: { clientX: x + 80, clientY: y } },
        { keys: '[/MouseLeft]' },
      ]);

      await waitFor(() => expect(firstFraction(canvasElement)).toBeGreaterThan(antes + 0.05));
    });

    await step('O vizinho devolve exatamente o que o outro ganhou', async () => {
      // O arrasto de um divisor move DOIS painéis; nunca empurra o layout
      // inteiro nem deixa a soma escorrer.
      const panels = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]')];
      const sum = panels.reduce((a, p) => a + Number(p.style.getPropertyValue('--panel-size')), 0);
      await expect(sum).toBeCloseTo(100, 1);
    });

    await step('O tamanho anunciado acompanha o arrasto', async () => {
      const first = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-panel"]')!;
      await expect(Number(punho.getAttribute('aria-valuenow'))).toBe(
        Math.round(Number(first.style.getPropertyValue('--panel-size'))),
      );
    });

    await step('O layout é emitido uma vez por gesto, não por pixel', async () => {
      // Um evento por mousemove entupiria o GA4 e o callback de quem persiste.
      await expect(layoutsEmitidos).toHaveLength(1);
      await expect(layoutsEmitidos[0]).toHaveLength(2);
    });

    await step('O divisor em repouso alcança 3:1 contra o fundo', async () => {
      // accessibility.item2. O punho é o CONTROLE que a pessoa precisa achar
      // para arrastar, então a régua é a de componente de interface (WCAG
      // 1.4.11) e não a de decoração. O olho não distingue 1,25 de 3,0 numa
      // linha de 1px — por isso a conta fica aqui.
      const luminancia = (cor: string): number => {
        const [r = 0, g = 0, b = 0] = cor.match(/[\d.]+/g)?.map(Number) ?? [];
        const canal = (c: number) => {
          const v = c / 255;
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
      };
      const ofHandle = luminancia(getComputedStyle(punho).backgroundColor);
      const ofBackground = luminancia(getComputedStyle(document.body).backgroundColor);
      const [light, escuro] = ofHandle > ofBackground ? [ofHandle, ofBackground] : [ofBackground, ofHandle];
      await expect((light + 0.05) / (escuro + 0.05)).toBeGreaterThanOrEqual(3);
    });
  },
};

export const Limits: Story = {
  parameters: {
    covers: ['functional.item3'],
    // Override de story: piso e teto são o assunto, e eles moram dentro de
    // `panels`.
    docs: {
      source: {
        transform: resizableSourceWith({
          'aria-label': LABEL,
          panels: [
            { title: 'Painel A', defaultSize: 50, minSize: 30, maxSize: 60 },
            { title: 'Painel B', defaultSize: 50, minSize: 30 },
          ],
        }),
      },
    },
  },
  render: () => group({ minA: 30, maxA: 60 }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: LABEL });

    // Cada passo leva o divisor a um EXTREMO absoluto antes de medir: assim a
    // rodada seguinte do painel Interactions parte de onde quiser e chega ao
    // mesmo lugar.
    await step('O painel para no mínimo, e o valor anunciado para junto', async () => {
      // functional.item3. Sem o piso, insistir na seta faria o painel sumir — e
      // o conteúdo dentro dele com ele.
      punho.focus();
      for (let i = 0; i < 30; i++) await userEvent.keyboard('{ArrowLeft}');
      await waitFor(() => expect(punho).toHaveAttribute('aria-valuenow', '30'));
      await expect(punho).toHaveAttribute('aria-valuemin', '30');
      await expect(firstFraction(canvasElement)).toBeCloseTo(0.3, 1);
    });

    await step('E para no máximo, que é o menor entre o teto e o piso do vizinho', async () => {
      // O teto anunciado não é o `maxSize` do painel: o vizinho também tem um
      // mínimo, e é ele quem manda quando é o mais restritivo. Aqui 60 e 100−30
      // empatam em 60.
      for (let i = 0; i < 40; i++) await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(punho).toHaveAttribute('aria-valuenow', '60'));
      await expect(punho).toHaveAttribute('aria-valuemax', '60');
      await expect(firstFraction(canvasElement)).toBeCloseTo(0.6, 1);
    });

    await step('Home e End vão direto aos extremos', async () => {
      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(punho).toHaveAttribute('aria-valuenow', '30'));
      await userEvent.keyboard('{End}');
      await waitFor(() => expect(punho).toHaveAttribute('aria-valuenow', '60'));
    });

    await step('Enter devolve o tamanho declarado', async () => {
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(punho).toHaveAttribute('aria-valuenow', '50'));
    });
  },
};

export const Focus: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item3'],
    docs: {
      source: {
        transform: resizableSourceWith({
          'aria-label': LABEL,
          panels: [
            { title: 'Painel A', defaultSize: 50, minSize: 20 },
            { title: 'Painel B', defaultSize: 50, minSize: 20 },
          ],
        }),
      },
    },
  },
  render: () => group({}),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: LABEL });
    const first = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-panel"]')!;

    await step('O Tab alcança o divisor', async () => {
      // functional.item4. Um divisor fora da ordem de tabulação seria
      // inalcançável para quem não usa mouse, e as setas nunca chegariam a ele.
      first.focus();
      await userEvent.tab();
      await expect(punho).toHaveFocus();
    });

    await step('E o foco fica visível', async () => {
      // accessibility.item3 — `:focus-visible` é a condição exata que o CSS
      // compartilhado usa; asserção sobre `:focus` passaria também no clique,
      // onde o anel não deve aparecer.
      await expect(punho.matches(':focus-visible')).toBe(true);
      await expect(getComputedStyle(punho).boxShadow).not.toBe('none');
    });

    await step('O painel rolável também é alcançável pelo Tab', async () => {
      // O painel tem `overflow: auto`; região rolável fora da ordem de tabulação
      // esconde conteúdo de quem não usa mouse (WCAG 2.1.1).
      await expect(first).toHaveAttribute('tabindex', '0');
      await expect(getComputedStyle(first).overflow).toBe('auto');
    });
  },
};

export const Disabled: Story = {
  parameters: {
    // Override de story: `disabled` é o assunto, e `false` é o padrão.
    docs: {
      source: {
        transform: resizableSourceWith({
          disabled: true,
          'aria-label': LABEL,
          panels: [
            { title: 'Painel A', defaultSize: 50, minSize: 20 },
            { title: 'Painel B', defaultSize: 50, minSize: 20 },
          ],
        }),
      },
    },
  },
  render: () => group({ disabled: true }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: LABEL });

    await step('O divisor travado continua anunciado e alcançável', async () => {
      // `aria-disabled` em vez de sumir da ordem de tabulação: um controle que
      // desaparece do Tab não tem como explicar por que está travado.
      await expect(punho).toHaveAttribute('aria-disabled', 'true');
      await expect(punho).toHaveAttribute('data-disabled', '');
      punho.focus();
      await expect(punho).toHaveFocus();
    });

    await step('Sem cursor de resize', async () => {
      await expect(getComputedStyle(punho).cursor).not.toBe('col-resize');
    });

    await step('E as setas não movem nada', async () => {
      const antes = firstFraction(canvasElement);
      await userEvent.keyboard('{ArrowRight}{ArrowRight}{Home}{End}');
      await expect(firstFraction(canvasElement)).toBeCloseTo(antes, 2);
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
    // Override de story: o assunto é a limpeza, e a linha de `destroy()` é
    // justamente o que o snippet do meta não mostra.
    docs: {
      source: {
        transform: resizableSourceWith({
          destroy: true,
          'aria-label': LABEL,
          panels: [{ title: 'Esquerda' }, { title: 'Direita' }],
        }),
      },
    },
  },
  render: () => probeHost(
    'Sonda de limpeza: o arraste começa e a página é trocada com o botão ainda pressionado.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let probe!: ProbeResult;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      probe = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => {
          const panel = (text: string) => {
            const el = document.createElement('div');
            el.textContent = text;
            return el;
          };
          return createResizablePanel({
            direction: 'horizontal',
            panels: [{ content: panel('Esquerda') }, { content: panel('Direita') }],
          });
        },
        exercitar: (no) => {
          const thumb = no.querySelector<HTMLElement>('[data-slot="resizable-handle"]');
          thumb?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 40 }));
          document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 140, clientY: 40 }));
        },
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await checkLimpeza(probe);
    });
  },
};
