import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, userEvent, waitFor } from 'storybook/test';
import { PaneGroup } from './index';
import ResizableStory from './ResizableStory.svelte';
import ResizableDocs from '@/components/docs/ResizableDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/**
 * Rótulo do punho repetido nas stories.
 *
 * O aria-label é o nome acessível de um `role="separator"` focável — sem ele o
 * leitor de tela anuncia "separador" e nada mais. E ele diz o ATALHO, porque a
 * alternativa ao arrasto não tem nenhuma pista visual.
 */
const ROTULO_PUNHO = 'Redimensionar painéis — use setas para ajustar';

/** Geometria real; `style.width` não decide nada num item de `flex-basis: 0`. */
function fracaoDoPrimeiro(canvasElement: HTMLElement, horizontal: boolean): number {
  const paineis = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]')];
  const medidas = paineis.map((p) =>
    horizontal ? p.getBoundingClientRect().width : p.getBoundingClientRect().height,
  );
  return medidas[0] / medidas.reduce((a, b) => a + b, 0);
}

const meta: Meta = {
  title: 'UI/Resizable',
  component: PaneGroup,
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(ResizableDocs),
      description: {
        component:
          'Resizable — painéis redimensionáveis com layouts horizontal, vertical e aninhado, ajustáveis por arrasto e por teclado (WCAG 2.5.7).',
      },
    },
  },
  argTypes: {
    direction: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      description: 'Split lateral (horizontal) ou empilhado (vertical).',
      table: { type: { summary: '"horizontal" | "vertical"' }, defaultValue: { summary: 'horizontal' } },
    },
    withHandle: {
      control: 'boolean',
      description: 'Mostra o pegador visual centralizado no divisor.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
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
  },
  args: {
    direction: 'horizontal',
    withHandle: true,
    defaultSize: 30,
    minSize: 20,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item2',
      'accessibility.item1',
      'accessibility.item4',
      'accessibility.item5',
    ],
  },
  render: (args) => ({
    Component: ResizableStory,
    props: {
      variant: 'simples',
      direction: args.direction,
      withHandle: args.withHandle,
      defaultSize: args.defaultSize,
      minSize: args.minSize,
      maxSize: 60,
      labelA: 'Sidebar',
      labelB: 'Conteúdo principal',
      ariaLabel: ROTULO_PUNHO,
      height: '260px',
    },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: ROTULO_PUNHO });
    const horizontal = args.direction === 'horizontal';

    await step('O divisor é um separator com nome e valor', async () => {
      // accessibility.item4 e item5 — o `getByRole` acima já falharia sem papel
      // ou sem nome. Aqui ficam o EIXO e o VALOR, que é o que um separator
      // focável precisa ter para o leitor de tela anunciar o tamanho ao mover.
      await expect(punho).toHaveAttribute(
        'aria-orientation',
        horizontal ? 'vertical' : 'horizontal',
      );
      await expect(punho).toHaveAttribute('aria-valuemin', String(args.minSize));
      await expect(Number(punho.getAttribute('aria-valuenow'))).toBeCloseTo(
        fracaoDoPrimeiro(canvasElement, horizontal) * 100,
        0,
      );
    });

    await step('O tamanho declarado chega à tela na proporção pedida', async () => {
      // Os painéis não tinham nem `data-slot` nem a classe do contrato: a sonda
      // procurou e achou ZERO nesta stack. Os testes contavam grupos e punhos,
      // nunca painéis — e por isso a ausência atravessou todas as auditorias.
      await expect(fracaoDoPrimeiro(canvasElement, horizontal)).toBeCloseTo(
        args.defaultSize / 100,
        1,
      );
    });

    await step('As setas movem o divisor — o equivalente por teclado do arrasto', async () => {
      // functional.item2. Sem isto, ajustar o layout seria um gesto de arrasto
      // sem alternativa (WCAG 2.1.1 e 2.5.7).
      //
      // O par cresce/encolhe é de saldo ZERO: o painel Interactions reexecuta a
      // play no mesmo DOM, e um passo que só cresce iria encostando no limite
      // até a asserção inverter de sentido numa rodada qualquer.
      const antes = fracaoDoPrimeiro(canvasElement, horizontal);
      punho.focus();
      await expect(punho).toHaveFocus();

      const cresce = horizontal ? '{ArrowRight}' : '{ArrowDown}';
      const encolhe = horizontal ? '{ArrowLeft}' : '{ArrowUp}';

      await userEvent.keyboard(cresce);
      await waitFor(() =>
        expect(fracaoDoPrimeiro(canvasElement, horizontal)).toBeGreaterThan(antes + 0.01),
      );

      await userEvent.keyboard(encolhe);
      await waitFor(() =>
        expect(fracaoDoPrimeiro(canvasElement, horizontal)).toBeCloseTo(antes, 2),
      );
    });

    await step('A seta do outro eixo não é sequestrada', async () => {
      // Um separator vertical que consumisse ArrowUp roubaria a rolagem de quem
      // só está de passagem pelo foco.
      const antes = fracaoDoPrimeiro(canvasElement, horizontal);
      await userEvent.keyboard(horizontal ? '{ArrowUp}' : '{ArrowLeft}');
      await expect(fracaoDoPrimeiro(canvasElement, horizontal)).toBeCloseTo(antes, 2);
    });
  },
};
