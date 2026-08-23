import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './index';
import { firstFraction } from './resizable.fixtures';
import {
  resizableArrastandoSource,
  resizableFocusSource,
  resizableLimitesSource,
  resizableTravadoSource,
} from './resizable.source';

const meta = {
  title: 'UI/Resizable/States',
  component: ResizablePanelGroup,
  tags: ['layout'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: resizableArrastandoSource },
      description: {
        component:
          'Estados do Resizable: Dragging (arrasto ajusta os painéis em tempo real), Limits (o painel para no mínimo e no máximo), Focus (divisor alcançado pelo Tab, com anel visível) e Disabled (divisor travado).',
      },
    },
  },
  // `direction` é prop obrigatória do grupo. Sem o valor padrão aqui, o tipo de
  // Story exige `args` em CADA story — e estas montam a composição no próprio
  // template, não pelos controls. É o mesmo padrão do meta de `resizable.stories.ts`.
  args: {
    direction: 'horizontal',
  },
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const LABEL = 'Redimensionar painéis — use setas para ajustar';

function contrastRatio(frente: string, background: string): number {
  const luminancia = (cor: string): number => {
    const [r = 0, g = 0, b = 0] = cor.match(/[\d.]+/g)?.map(Number) ?? [];
    const canal = (c: number) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  };
  const [a, b] = [luminancia(frente), luminancia(background)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

function box(interno: string): string {
  return `
    <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 480px; height: 240px">
      ${interno}
    </div>
  `;
}

export const Dragging: Story = {
  parameters: { covers: ['functional.item1', 'accessibility.item2'] },
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: box(`
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel :default-size="50" :min-size="10">
          <div class="nds-cluster nds-p-4 nds-text-body" data-justify="center" style="height: 100%">Esquerda</div>
        </ResizablePanel>
        <ResizableHandle with-handle aria-label="${LABEL}" />
        <ResizablePanel :default-size="50" :min-size="10">
          <div class="nds-cluster nds-p-4 nds-text-body nds-bg-muted" data-align="center" data-justify="center" style="height: 100%">Direita</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    `),
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: LABEL });

    await step('Arrastar o divisor ajusta os painéis em tempo real', async () => {
      // functional.item1. `userEvent.pointer` com a sequência completa, e não um
      // PointerEvent construído à mão: o primitivo decide o arrasto por regiões
      // de acerto calculadas a partir de eventos de ponteiro reais, e descarta
      // em silêncio o que for sintético.
      const c = punho.getBoundingClientRect();
      const x = c.left + c.width / 2;
      const y = c.top + c.height / 2;
      const antes = firstFraction(canvasElement);

      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: punho, coords: { clientX: x, clientY: y } },
        { target: punho, coords: { clientX: x + 80, clientY: y } },
        { keys: '[/MouseLeft]' },
      ]);

      await waitFor(() => expect(firstFraction(canvasElement)).toBeGreaterThan(antes + 0.05));
    });

    await step('O tamanho anunciado acompanha o arrasto', async () => {
      await waitFor(() =>
        expect(Number(punho.getAttribute('aria-valuenow'))).toBeCloseTo(
          firstFraction(canvasElement) * 100,
          0,
        ),
      );
    });

    await step('O divisor em repouso alcança 3:1 contra o fundo', async () => {
      // accessibility.item2. O punho é o CONTROLE que a pessoa precisa achar
      // para arrastar, então a régua é a de componente de interface (WCAG
      // 1.4.11) e não a de decoração. O olho não distingue 1,25 de 3,0 numa
      // linha de 1px — por isso a conta fica aqui.
      const ratio = contrastRatio(
        getComputedStyle(punho).backgroundColor,
        getComputedStyle(document.body).backgroundColor,
      );
      await expect(ratio).toBeGreaterThanOrEqual(3);
    });
  },
};

export const Limits: Story = {
  parameters: {
    covers: ['functional.item3'],
    // O piso e o teto moram no painel, e são o assunto: o snippet do meta traz
    // painéis livres, onde não há em que parar.
    docs: { source: { transform: resizableLimitesSource } },
  },
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: box(`
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel :default-size="50" :min-size="30" :max-size="60">
          <div class="nds-cluster nds-p-4 nds-text-body" data-justify="center" style="height: 100%">Limitado</div>
        </ResizablePanel>
        <ResizableHandle aria-label="${LABEL}" />
        <ResizablePanel :default-size="50" :min-size="30">
          <div class="nds-cluster nds-p-4 nds-text-body nds-bg-muted" data-align="center" data-justify="center" style="height: 100%">Livre</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    `),
  }),
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
      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(firstFraction(canvasElement)).toBeCloseTo(0.3, 1));
      await expect(punho).toHaveAttribute('aria-valuemin', '30');
      await expect(Number(punho.getAttribute('aria-valuenow'))).toBeCloseTo(30, 0);
    });

    await step('Insistir na seta não passa do piso', async () => {
      for (let i = 0; i < 10; i++) await userEvent.keyboard('{ArrowLeft}');
      await expect(firstFraction(canvasElement)).toBeCloseTo(0.3, 1);
    });

    await step('E para no máximo declarado', async () => {
      await userEvent.keyboard('{End}');
      await waitFor(() => expect(firstFraction(canvasElement)).toBeCloseTo(0.6, 1));
      for (let i = 0; i < 10; i++) await userEvent.keyboard('{ArrowRight}');
      await expect(firstFraction(canvasElement)).toBeCloseTo(0.6, 1);
      await expect(punho).toHaveAttribute('aria-valuemax', '60');
    });
  },
};

export const Focus: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item3'],
    // Aqui o divisor é a linha nua: o pegador do snippet do meta cobriria
    // justamente o traço em volta do qual o anel de foco é desenhado.
    docs: { source: { transform: resizableFocusSource } },
  },
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: box(`
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel :default-size="50" :min-size="20">
          <div class="nds-cluster nds-p-4 nds-text-body" data-justify="center" style="height: 100%">Um</div>
        </ResizablePanel>
        <ResizableHandle aria-label="${LABEL}" />
        <ResizablePanel :default-size="50" :min-size="20">
          <div class="nds-cluster nds-p-4 nds-text-body nds-bg-muted" data-align="center" data-justify="center" style="height: 100%">Dois</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    `),
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: LABEL });

    await step('O Tab alcança o divisor', async () => {
      // functional.item4. Um divisor fora da ordem de tabulação seria
      // inalcançável para quem não usa mouse, e as setas nunca chegariam a ele.
      //
      // O passo parte do `body`, e não do painel anterior: o primitivo desta
      // stack não põe os painéis na ordem de tabulação, então não há âncora
      // dentro do grupo. Andar até achar prova o que interessa — que o divisor
      // ESTÁ no caminho do Tab — e reestabelece a própria precondição no replay.
      await expect(punho).toHaveAttribute('tabindex', '0');
      punho.blur();
      document.body.focus();
      for (let i = 0; i < 12 && document.activeElement !== punho; i++) await userEvent.tab();
      await expect(punho).toHaveFocus();
    });

    await step('E o foco fica visível', async () => {
      // accessibility.item3 — `:focus-visible` é a condição exata que o CSS
      // compartilhado usa; asserção sobre `:focus` passaria também no clique,
      // onde o anel não deve aparecer.
      await expect(punho.matches(':focus-visible')).toBe(true);
      await expect(getComputedStyle(punho).boxShadow).not.toBe('none');
    });
  },
};

export const Disabled: Story = {
  parameters: {
    // A flag que trava o divisor é o assunto, e não está no snippet do meta.
    docs: { source: { transform: resizableTravadoSource } },
  },
  render: () => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    template: box(`
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel :default-size="50" :min-size="20">
          <div class="nds-cluster nds-p-4 nds-text-body" data-justify="center" style="height: 100%">Fixo</div>
        </ResizablePanel>
        <ResizableHandle disabled with-handle aria-label="${LABEL}" />
        <ResizablePanel :default-size="50" :min-size="20">
          <div class="nds-cluster nds-p-4 nds-text-body nds-bg-muted" data-align="center" data-justify="center" style="height: 100%">Fixo</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    `),
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: LABEL });

    await step('O divisor travado continua anunciado e alcançável', async () => {
      // Marcado em vez de removido da ordem de tabulação: um controle que
      // desaparece do Tab não tem como explicar por que está travado.
      await expect(punho).toHaveAttribute('data-disabled');
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
