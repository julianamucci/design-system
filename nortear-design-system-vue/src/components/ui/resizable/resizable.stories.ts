import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './index';
import { fracaoDoPrimeiro } from './resizable.fixtures';
import ResizableDocs from '@/components/docs/ResizableDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { resizableSource } from './resizable.source';

/**
 * Rótulo do punho repetido nas stories.
 *
 * O aria-label é o nome acessível de um `role="separator"` focável — sem ele o
 * leitor de tela anuncia "separador" e nada mais. E ele diz o ATALHO, porque a
 * alternativa ao arrasto não tem nenhuma pista visual.
 */
const ROTULO_PUNHO = 'Redimensionar painéis — use setas para ajustar';

const meta = {
  title: 'UI/Resizable',
  component: ResizablePanelGroup,
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(ResizableDocs),
      source: { transform: resizableSource },
      description: {
        component:
          'Resizable agrupa painéis ajustáveis pelo usuário via arrasto ou teclado, com layouts horizontal, vertical e aninhado e suporte a WCAG 2.5.7 (Dragging Movements).',
      },
    },
  },
  argTypes: {
    direction: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Split lateral (horizontal) ou empilhado (vertical).',
      table: { type: { summary: '"horizontal" | "vertical"' }, defaultValue: { summary: 'horizontal' } },
    },
  },
  args: {
    direction: 'horizontal',
  },
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

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
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    setup() {
      return { args, rotulo: ROTULO_PUNHO };
    },
    template: `
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 480px; height: 240px">
        <ResizablePanelGroup :direction="args.direction" :key="args.direction">
          <ResizablePanel :default-size="30" :min-size="20" :max-size="60">
            <div class="nds-stack nds-p-4" data-spacing="xs">
              <p class="nds-text-body nds-font-semibold">Sidebar</p>
              <p class="nds-text-caption nds-text-muted-foreground">Navegação do projeto</p>
            </div>
          </ResizablePanel>
          <ResizableHandle with-handle :aria-label="rotulo" />
          <ResizablePanel :default-size="70" :min-size="20">
            <div class="nds-stack nds-p-4" data-spacing="xs">
              <p class="nds-text-body nds-font-semibold">Conteúdo principal</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Arraste o divisor ou use as setas com ele focado.
              </p>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const punho = canvas.getByRole('separator', { name: ROTULO_PUNHO });
    const horizontal = args.direction === 'horizontal';

    await step('O divisor é um separator com nome e valor', async () => {
      // accessibility.item4 e item5 — o `getByRole` acima já falharia sem papel
      // ou sem nome. Aqui ficam o EIXO e o VALOR, que é o que um separator
      // focável precisa ter para o leitor de tela anunciar o tamanho ao mover.
      // O eixo faltava: o primitivo publica só `data-orientation`, e o
      // `aria-orientation` saía vazio nesta stack — medido pela sonda.
      await expect(punho).toHaveAttribute(
        'aria-orientation',
        horizontal ? 'vertical' : 'horizontal',
      );
      await expect(punho).toHaveAttribute('aria-valuemin', '20');
      await expect(Number(punho.getAttribute('aria-valuenow'))).toBeCloseTo(
        fracaoDoPrimeiro(canvasElement, horizontal) * 100,
        0,
      );
    });

    await step('O tamanho declarado chega à tela na proporção pedida', async () => {
      await expect(fracaoDoPrimeiro(canvasElement, horizontal)).toBeCloseTo(0.3, 1);
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
