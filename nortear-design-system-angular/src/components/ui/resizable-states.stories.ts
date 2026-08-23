import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NdsResizable, NdsResizablePanel, NdsResizableHandle } from './resizable';

/**
 * Layouts emitidos pelo output `layout`.
 *
 * Módulo e não `args`: o renderer Angular só repassa em `props` o que tem
 * entrada em `argTypes`, e esta suíte desliga os controles. Cada play limpa a
 * lista antes de interagir.
 */
const layoutsEmitidos: number[][] = [];

const meta: Meta = {
  title: 'UI/Resizable/States',
  decorators: [moduleMetadata({ imports: [NdsResizable, NdsResizablePanel, NdsResizableHandle] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

const LABEL = 'Redimensionar painéis — use as setas';

export const Dragging: Story = {
  parameters: {
    covers: ['functional.item1', 'accessibility.item2'],
  },
  render: () => ({
    props: { aoLayout: (t: number[]) => layoutsEmitidos.push(t) },
    template: `
      <div
        ndsResizable
        direction="horizontal"
        class="nds-min-h-50 nds-w-full"
        (layout)="aoLayout($event)"
      >
        <div ndsResizablePanel [defaultSize]="50" [minSize]="10">
          <div class="nds-p-4"><p class="nds-text-body nds-m-0">Esquerda</p></div>
        </div>
        <div ndsResizableHandle [withHandle]="true" aria-label="${LABEL}"></div>
        <div ndsResizablePanel [defaultSize]="50" [minSize]="10">
          <div class="nds-p-4"><p class="nds-text-body nds-m-0">Direita</p></div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: LABEL });
    const panels = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]')];
    layoutsEmitidos.length = 0;

    await step('Arrastar o divisor ajusta os painéis em tempo real', async () => {
      // functional.item1. `userEvent.pointer` com a sequência completa, e não
      // PointerEvent construído à mão: o punho chama `setPointerCapture` no
      // pointerdown, e captura só existe para um ponteiro que o navegador
      // conhece — evento sintético é descartado ali, em silêncio.
      const caixa = punho.getBoundingClientRect();
      const y = caixa.top + caixa.height / 2;
      const x = caixa.left + caixa.width / 2;
      const antes = Number(panels[0].style.getPropertyValue('--panel-size'));

      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: punho, coords: { clientX: x, clientY: y } },
        { target: punho, coords: { clientX: x + 60, clientY: y } },
        { keys: '[/MouseLeft]' },
      ]);

      // `waitFor`: esta stack roda sem zone, então a detecção de mudança que
      // reescreve a custom property é agendada, não síncrona ao pointerup.
      await waitFor(() =>
        expect(Number(panels[0].style.getPropertyValue('--panel-size'))).toBeGreaterThan(antes),
      );

      // O vizinho devolve exatamente o que o outro ganhou: o arrasto de um
      // divisor move DOIS painéis, nunca empurra o layout inteiro.
      const depois = Number(panels[0].style.getPropertyValue('--panel-size'));
      await expect(depois + Number(panels[1].style.getPropertyValue('--panel-size'))).toBeCloseTo(
        100,
        1,
      );
    });

    await step('O tamanho anunciado acompanha o arrasto', async () => {
      await waitFor(() =>
        expect(Number(punho.getAttribute('aria-valuenow'))).toBe(
          Math.round(Number(panels[0].style.getPropertyValue('--panel-size'))),
        ),
      );
    });

    await step('O layout é emitido uma vez por gesto, não por pixel', async () => {
      // Um evento por pointermove entupiria o GA4 e o callback de quem persiste
      // o layout.
      await expect(layoutsEmitidos).toHaveLength(1);
      await expect(layoutsEmitidos[0]).toHaveLength(2);
    });

    await step('O gesto termina: o punho não fica marcado como em arrasto', async () => {
      await expect(punho.hasAttribute('data-dragging')).toBe(false);
    });

    await step('O divisor em repouso alcança 3:1 contra o fundo', async () => {
      // accessibility.item2. O punho é o CONTROLE que a pessoa precisa achar
      // para arrastar, então a régua é a de componente de interface (WCAG
      // 1.4.11), não a de decoração.
      //
      // Isso já reprovou: a folha compartilhada pintava o divisor com `--border`,
      // que dá 1,25:1 — uma linha que praticamente não existia, nas cinco
      // stacks. Medir aqui é o que impede a regressão silenciosa, porque o olho
      // não distingue 1,25 de 3,0 numa linha de 1px.
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
      const ratio = (light + 0.05) / (escuro + 0.05);

      await expect(ratio).toBeGreaterThanOrEqual(3);
    });
  },
};

export const Limits: Story = {
  parameters: { covers: ['functional.item3'] },
  render: () => ({
    template: `
      <div ndsResizable direction="horizontal" class="nds-min-h-50 nds-w-full">
        <div ndsResizablePanel [defaultSize]="50" [minSize]="30" [maxSize]="60">
          <div class="nds-p-4"><p class="nds-text-body nds-m-0">Limitado</p></div>
        </div>
        <div ndsResizableHandle aria-label="${LABEL}"></div>
        <div ndsResizablePanel [defaultSize]="50" [minSize]="30">
          <div class="nds-p-4"><p class="nds-text-body nds-m-0">Livre</p></div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: LABEL });

    await step('O painel para no mínimo, e o valor anunciado para junto', async () => {
      // functional.item3. Sem o piso, insistir na seta faria o painel sumir —
      // e o conteúdo dentro dele com dele.
      punho.focus();
      for (let i = 0; i < 30; i++) await userEvent.keyboard('{ArrowLeft}');
      await waitFor(() => expect(punho).toHaveAttribute('aria-valuenow', '30'));
      await expect(punho).toHaveAttribute('aria-valuemin', '30');
    });

    await step('E para no máximo, que é o menor entre o teto e o piso do vizinho', async () => {
      // O teto anunciado não é o `maxSize` do painel: o vizinho também tem um
      // mínimo, e é ele quem manda quando é o mais restritivo. Aqui 60 e
      // 100−30 empatam em 60.
      for (let i = 0; i < 40; i++) await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(punho).toHaveAttribute('aria-valuenow', '60'));
      await expect(punho).toHaveAttribute('aria-valuemax', '60');
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
  parameters: { covers: ['functional.item4', 'accessibility.item3'] },
  render: () => ({
    template: `
      <div ndsResizable direction="horizontal" class="nds-min-h-50 nds-w-full">
        <div ndsResizablePanel [defaultSize]="50" [minSize]="20">
          <div class="nds-p-4"><p class="nds-text-body nds-m-0">Um</p></div>
        </div>
        <div ndsResizableHandle aria-label="${LABEL}"></div>
        <div ndsResizablePanel [defaultSize]="50" [minSize]="20">
          <div class="nds-p-4"><p class="nds-text-body nds-m-0">Dois</p></div>
        </div>
      </div>
    `,
  }),
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
  },
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div ndsResizable direction="horizontal" class="nds-min-h-50 nds-w-full">
        <div ndsResizablePanel [defaultSize]="50" [minSize]="20">
          <div class="nds-p-4"><p class="nds-text-body nds-m-0">Fixo</p></div>
        </div>
        <div ndsResizableHandle [disabled]="true" aria-label="${LABEL}"></div>
        <div ndsResizablePanel [defaultSize]="50" [minSize]="20">
          <div class="nds-p-4"><p class="nds-text-body nds-m-0">Fixo</p></div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: LABEL });

    await step('O divisor travado continua anunciado e alcançável', async () => {
      // `aria-disabled` em vez de sumir da ordem de tabulação: um controle que
      // desaparece do Tab não tem como explicar por que está travado.
      await expect(punho).toHaveAttribute('aria-disabled', 'true');
      punho.focus();
      await expect(punho).toHaveFocus();
    });

    await step('Mas as setas não movem nada', async () => {
      const antes = punho.getAttribute('aria-valuenow');
      await userEvent.keyboard('{ArrowRight}{ArrowRight}{Home}{End}');
      await expect(punho.getAttribute('aria-valuenow')).toBe(antes);
    });
  },
};
