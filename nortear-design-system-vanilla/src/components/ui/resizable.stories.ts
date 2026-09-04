import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { createResizablePanel } from './resizable';
import { firstFraction, frame, panelWithHelper } from './resizable.fixtures';
import { resizableSourceWith } from './resizable.source';
import { createResizableDocs } from '@/components/docs/ResizableDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const LABEL_HANDLE = 'Redimensionar painéis — use setas para ajustar';

type ResizableArgs = {
  direction: 'horizontal' | 'vertical';
  defaultSize: number;
  minSize: number;
  maxSize: number;
  withHandle: boolean;
};

const meta: Meta<ResizableArgs> = {
  title: 'Components/Layout/Resizable',
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(createResizableDocs),
      // Os três números dos controls viram os dois painéis do exemplo; o nome
      // dos divisores não passa por control nenhum e vem fixo daqui.
      source: { transform: resizableSourceWith({ 'aria-label': LABEL_HANDLE }) },
    },
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

// ─── Playground ───────────────────────────────────────────────────────────────
//
// Andaimes em `resizable.fixtures`: aqui o eixo segue o control `direction`, e
// por isso `firstFraction` e `frame` recebem os dois valores explicitamente.

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
      'aria-label': LABEL_HANDLE,
      panels: [
        {
          defaultSize: args.defaultSize,
          minSize: args.minSize,
          maxSize: args.maxSize,
          content: panelWithHelper('Sidebar', 'Navegação do projeto'),
        },
        {
          defaultSize: 100 - args.defaultSize,
          minSize: args.minSize,
          content: panelWithHelper('Conteúdo principal', 'Arraste o divisor ou use as setas com ele focado.'),
        },
      ],
    });
    return frame(root, args.direction === 'vertical' ? '280px' : '220px');
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: LABEL_HANDLE });
    const horizontal = args.direction === 'horizontal';

    await step('O divisor é um separator com nome e valor', async () => {
      // accessibility.item4 e item5 — o `getByRole` acima já falharia sem papel
      // ou sem nome. Ele já passava antes, com a story escrevendo o atributo por
      // fora; o que a busca por nome prova agora é que a OPÇÃO `aria-label` da
      // factory chega ao divisor. Aqui fica o VALOR, que é o que um separator
      // focável precisa ter para o leitor de tela anunciar o tamanho ao mover.
      await expect(punho).toHaveAttribute('aria-label', LABEL_HANDLE);
      await expect(punho).toHaveAttribute('aria-orientation', horizontal ? 'vertical' : 'horizontal');
      await expect(punho).toHaveAttribute('aria-valuemin', String(args.minSize));
      await expect(Number(punho.getAttribute('aria-valuenow'))).toBe(
        Math.round(firstFraction(canvasElement, horizontal) * 100),
      );
    });

    await step('O tamanho declarado chega à tela na proporção pedida', async () => {
      // A porcentagem viaja por `--panel-size` e é consumida pelo CSS
      // (`flex-grow`). Escrever largura inline não teria efeito nenhum, e era
      // exatamente o que a fábrica fazia — com a story afirmando o `style.width`
      // que ninguém aplicava.
      await expect(firstFraction(canvasElement, horizontal)).toBeCloseTo(args.defaultSize / 100, 1);
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
      await expect(firstFraction(canvasElement, horizontal) * 100).toBeGreaterThan(antes);

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
