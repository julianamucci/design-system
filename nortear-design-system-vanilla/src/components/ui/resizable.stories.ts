import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { createResizablePanel } from './resizable';
import { createResizableDocs } from '@/components/docs/ResizableDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const ROTULO_PUNHO = 'Redimensionar painéis — use setas para ajustar';

type ResizableArgs = {
  direction: 'horizontal' | 'vertical';
  defaultSize: number;
  minSize: number;
  maxSize: number;
  withHandle: boolean;
};

const meta: Meta<ResizableArgs> = {
  title: 'UI/Resizable',
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createResizableDocs) },
  },
  argTypes: {
    direction: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Split lateral (horizontal) ou empilhado (vertical).',
      table: { type: { summary: '"horizontal" | "vertical"' }, defaultValue: { summary: 'horizontal' } },
    },
    defaultSize: {
      control: { type: 'range', min: 20, max: 60, step: 5 },
      description: 'Tamanho inicial do primeiro painel, em porcentagem do grupo.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '—' } },
    },
    minSize: {
      control: { type: 'range', min: 10, max: 40, step: 5 },
      description: 'Tamanho mínimo de cada painel, em porcentagem do grupo.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '10' } },
    },
    maxSize: {
      control: { type: 'range', min: 40, max: 90, step: 5 },
      description: 'Tamanho máximo do primeiro painel, em porcentagem do grupo.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '100' } },
    },
    withHandle: {
      control: 'boolean',
      description: 'Mostra o pegador visual centralizado no divisor.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  args: {
    direction: 'horizontal',
    defaultSize: 30,
    minSize: 20,
    maxSize: 60,
    withHandle: true,
  },
};

export default meta;
type Story = StoryObj<ResizableArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function panelContent(titulo: string, apoio: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'nds-stack nds-p-4';
  el.dataset.spacing = 'xs';
  const h = document.createElement('p');
  h.className = 'nds-text-body nds-font-semibold';
  h.textContent = titulo;
  const p = document.createElement('p');
  p.className = 'nds-text-caption nds-text-muted-foreground';
  p.textContent = apoio;
  el.append(h, p);
  return el;
}

function frame(child: HTMLElement, altura: string): HTMLElement {
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

/** Geometria real: `flex-basis: 0` faz `style.width` não decidir nada. */
function fracaoDoPrimeiro(canvasElement: HTMLElement, horizontal: boolean): number {
  const paineis = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]')];
  const medidas = paineis.map((p) =>
    horizontal ? p.getBoundingClientRect().width : p.getBoundingClientRect().height,
  );
  return medidas[0] / medidas.reduce((a, b) => a + b, 0);
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item2',
      'accessibility.item1',
      'accessibility.item4',
      'accessibility.item5',
    ],
  },
  render: (args) => {
    const root = createResizablePanel({
      direction: args.direction,
      withHandle: args.withHandle,
      'aria-label': ROTULO_PUNHO,
      panels: [
        {
          defaultSize: args.defaultSize,
          minSize: args.minSize,
          maxSize: args.maxSize,
          content: panelContent('Sidebar', 'Navegação do projeto'),
        },
        {
          defaultSize: 100 - args.defaultSize,
          minSize: args.minSize,
          content: panelContent('Conteúdo principal', 'Arraste o divisor ou use as setas com ele focado.'),
        },
      ],
    });
    return frame(root, args.direction === 'vertical' ? '280px' : '220px');
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: ROTULO_PUNHO });
    const horizontal = args.direction === 'horizontal';

    await step('O divisor é um separator com nome e valor', async () => {
      // accessibility.item4 e item5 — o `getByRole` acima já falharia sem papel
      // ou sem nome. Ele já passava antes, com a story escrevendo o atributo por
      // fora; o que a busca por nome prova agora é que a OPÇÃO `aria-label` da
      // factory chega ao divisor. Aqui fica o VALOR, que é o que um separator
      // focável precisa ter para o leitor de tela anunciar o tamanho ao mover.
      await expect(punho).toHaveAttribute('aria-label', ROTULO_PUNHO);
      await expect(punho).toHaveAttribute('aria-orientation', horizontal ? 'vertical' : 'horizontal');
      await expect(punho).toHaveAttribute('aria-valuemin', String(args.minSize));
      await expect(Number(punho.getAttribute('aria-valuenow'))).toBe(
        Math.round(fracaoDoPrimeiro(canvasElement, horizontal) * 100),
      );
    });

    await step('O tamanho declarado chega à tela na proporção pedida', async () => {
      // A porcentagem viaja por `--panel-size` e é consumida pelo CSS
      // (`flex-grow`). Escrever largura inline não teria efeito nenhum, e era
      // exatamente o que a fábrica fazia — com a story afirmando o `style.width`
      // que ninguém aplicava.
      await expect(fracaoDoPrimeiro(canvasElement, horizontal)).toBeCloseTo(args.defaultSize / 100, 1);
    });

    await step('As setas movem o divisor — o equivalente por teclado do arrasto', async () => {
      // functional.item2. Sem isto, ajustar o layout seria um gesto de arrasto
      // sem alternativa (WCAG 2.1.1 e 2.5.7).
      //
      // O par cresce/encolhe é de saldo ZERO: o painel Interactions reexecuta a
      // play no mesmo DOM, e um passo que só cresce iria encostando no limite até
      // a asserção inverter de sentido numa rodada qualquer.
      const antes = Number(punho.getAttribute('aria-valuenow'));
      punho.focus();
      await expect(punho).toHaveFocus();

      const cresce = horizontal ? '{ArrowRight}' : '{ArrowDown}';
      const encolhe = horizontal ? '{ArrowLeft}' : '{ArrowUp}';

      await userEvent.keyboard(cresce);
      await waitFor(() => expect(Number(punho.getAttribute('aria-valuenow'))).toBeGreaterThan(antes));
      await expect(fracaoDoPrimeiro(canvasElement, horizontal) * 100).toBeGreaterThan(antes);

      await userEvent.keyboard(encolhe);
      await waitFor(() => expect(Number(punho.getAttribute('aria-valuenow'))).toBe(antes));
    });

    await step('A seta do outro eixo não é sequestrada', async () => {
      // Um separator vertical que consumisse ArrowUp roubaria a rolagem de quem
      // só está de passagem pelo foco.
      const antes = punho.getAttribute('aria-valuenow');
      await userEvent.keyboard(horizontal ? '{ArrowUp}' : '{ArrowLeft}');
      await expect(punho.getAttribute('aria-valuenow')).toBe(antes);
    });
  },
};
