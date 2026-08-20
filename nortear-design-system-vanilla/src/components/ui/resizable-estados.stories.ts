import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { createResizablePanel } from './resizable';
import { resizableSource, resizableSourceCom } from './resizable.source';
import { sondarOuvintes, hospedeiroDeSonda, conferirLimpeza, type ResultadoDaSonda } from './leak-probe';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Resizable/States',
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

const ROTULO = 'Redimensionar painéis — use setas para ajustar';

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

/** Geometria real, e nunca `style.width` — ver a nota em `resizable-variantes`. */
function fracaoDoPrimeiro(canvasElement: HTMLElement): number {
  const paineis = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]')];
  const larguras = paineis.map((p) => p.getBoundingClientRect().width);
  return larguras[0] / larguras.reduce((a, b) => a + b, 0);
}

function grupo(opcoes: {
  disabled?: boolean;
  withHandle?: boolean;
  minA?: number;
  maxA?: number;
  onLayout?: (s: number[]) => void;
}): HTMLElement {
  const root = createResizablePanel({
    direction: 'horizontal',
    disabled: opcoes.disabled,
    withHandle: opcoes.withHandle,
    onLayout: opcoes.onLayout,
    'aria-label': ROTULO,
    panels: [
      {
        defaultSize: 50,
        minSize: opcoes.minA ?? 20,
        maxSize: opcoes.maxA,
        content: panelContent('Painel A', 'nds-bg-muted nds-text-muted-foreground'),
      },
      { defaultSize: 50, minSize: opcoes.minA ?? 20, content: panelContent('Painel B') },
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
        transform: resizableSourceCom({
          withHandle: true,
          onLayout: '(sizes) => guardarLayout(sizes)',
          'aria-label': ROTULO,
          panels: [
            { titulo: 'Painel A', defaultSize: 50 },
            { titulo: 'Painel B', defaultSize: 50 },
          ],
        }),
      },
    },
  },
  render: () => grupo({ minA: 10, withHandle: true, onLayout: (s) => layoutsEmitidos.push(s) }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: ROTULO });
    layoutsEmitidos.length = 0;

    await step('Arrastar o divisor ajusta os painéis em tempo real', async () => {
      // functional.item1. A sequência completa de ponteiro, e não um evento
      // construído à mão: o arrasto nasce no `mousedown` do punho e continua em
      // ouvintes de `document`, que um clique sintético nunca alcança.
      const caixa = punho.getBoundingClientRect();
      const x = caixa.left + caixa.width / 2;
      const y = caixa.top + caixa.height / 2;
      const antes = fracaoDoPrimeiro(canvasElement);

      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: punho, coords: { clientX: x, clientY: y } },
        { target: punho, coords: { clientX: x + 80, clientY: y } },
        { keys: '[/MouseLeft]' },
      ]);

      await waitFor(() => expect(fracaoDoPrimeiro(canvasElement)).toBeGreaterThan(antes + 0.05));
    });

    await step('O vizinho devolve exatamente o que o outro ganhou', async () => {
      // O arrasto de um divisor move DOIS painéis; nunca empurra o layout
      // inteiro nem deixa a soma escorrer.
      const paineis = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]')];
      const soma = paineis.reduce((a, p) => a + Number(p.style.getPropertyValue('--panel-size')), 0);
      await expect(soma).toBeCloseTo(100, 1);
    });

    await step('O tamanho anunciado acompanha o arrasto', async () => {
      const primeiro = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-panel"]')!;
      await expect(Number(punho.getAttribute('aria-valuenow'))).toBe(
        Math.round(Number(primeiro.style.getPropertyValue('--panel-size'))),
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
      const doPunho = luminancia(getComputedStyle(punho).backgroundColor);
      const doFundo = luminancia(getComputedStyle(document.body).backgroundColor);
      const [claro, escuro] = doPunho > doFundo ? [doPunho, doFundo] : [doFundo, doPunho];
      await expect((claro + 0.05) / (escuro + 0.05)).toBeGreaterThanOrEqual(3);
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
        transform: resizableSourceCom({
          'aria-label': ROTULO,
          panels: [
            { titulo: 'Painel A', defaultSize: 50, minSize: 30, maxSize: 60 },
            { titulo: 'Painel B', defaultSize: 50, minSize: 30 },
          ],
        }),
      },
    },
  },
  render: () => grupo({ minA: 30, maxA: 60 }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: ROTULO });

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
      await expect(fracaoDoPrimeiro(canvasElement)).toBeCloseTo(0.3, 1);
    });

    await step('E para no máximo, que é o menor entre o teto e o piso do vizinho', async () => {
      // O teto anunciado não é o `maxSize` do painel: o vizinho também tem um
      // mínimo, e é ele quem manda quando é o mais restritivo. Aqui 60 e 100−30
      // empatam em 60.
      for (let i = 0; i < 40; i++) await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(punho).toHaveAttribute('aria-valuenow', '60'));
      await expect(punho).toHaveAttribute('aria-valuemax', '60');
      await expect(fracaoDoPrimeiro(canvasElement)).toBeCloseTo(0.6, 1);
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
        transform: resizableSourceCom({
          'aria-label': ROTULO,
          panels: [
            { titulo: 'Painel A', defaultSize: 50, minSize: 20 },
            { titulo: 'Painel B', defaultSize: 50, minSize: 20 },
          ],
        }),
      },
    },
  },
  render: () => grupo({}),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: ROTULO });
    const primeiro = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-panel"]')!;

    await step('O Tab alcança o divisor', async () => {
      // functional.item4. Um divisor fora da ordem de tabulação seria
      // inalcançável para quem não usa mouse, e as setas nunca chegariam a ele.
      primeiro.focus();
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
      await expect(primeiro).toHaveAttribute('tabindex', '0');
      await expect(getComputedStyle(primeiro).overflow).toBe('auto');
    });
  },
};

export const Disabled: Story = {
  parameters: {
    // Override de story: `disabled` é o assunto, e `false` é o padrão.
    docs: {
      source: {
        transform: resizableSourceCom({
          disabled: true,
          'aria-label': ROTULO,
          panels: [
            { titulo: 'Painel A', defaultSize: 50, minSize: 20 },
            { titulo: 'Painel B', defaultSize: 50, minSize: 20 },
          ],
        }),
      },
    },
  },
  render: () => grupo({ disabled: true }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: ROTULO });

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
      const antes = fracaoDoPrimeiro(canvasElement);
      await userEvent.keyboard('{ArrowRight}{ArrowRight}{Home}{End}');
      await expect(fracaoDoPrimeiro(canvasElement)).toBeCloseTo(antes, 2);
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
        transform: resizableSourceCom({
          destroy: true,
          'aria-label': ROTULO,
          panels: [{ titulo: 'Esquerda' }, { titulo: 'Direita' }],
        }),
      },
    },
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
