import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent } from 'storybook/test';
import { transbordo } from '@shared/testing/scroll-area-probe';
import { ScrollArea } from './index';
import ScrollAreaDocs from '@/components/docs/ScrollAreaDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(ScrollAreaDocs),
      description: {
        component:
          'ScrollArea provê scroll customizado dentro de um container com altura fixa, com scrollbar estilizada e suporte a scroll vertical, horizontal ou bidirecional. O scroll continua sendo o nativo do navegador, o que preserva gestos de swipe no celular.',
      },
    },
  },
  argTypes: {
    type: {
      control: { type: 'inline-radio' },
      options: ['auto', 'always', 'scroll', 'hover'],
      description: 'Quando exibir as scrollbars.',
    },
    scrollHideDelay: {
      control: { type: 'number' },
      description: 'Tempo em ms para esconder a scrollbar inativa.',
    },
  },
  args: {
    type: 'hover',
    scrollHideDelay: 600,
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const TAGS = Array.from({ length: 40 }, (_, i) => `Tag ${i + 1}`);

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item3',
      'accessibility.item1',
      'accessibility.item5',
    ],
    // functional.item2 e accessibility.item2 dependem do pegador da barra, que
    // com o padrão `hover` só se materializa sob o ponteiro. Ficam na story
    // Always, que é a que garante essa condição.
  },
  render: (args) => ({
    components: { ScrollArea },
    setup() {
      return { args, tags: TAGS };
    },
    template: `
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 280px; height: 300px">
        <ScrollArea v-bind="args" class="nds-w-full" style="height: 100%">
          <div class="nds-p-4">
            <h4 class="nds-mb-2 nds-text-body nds-font-medium" style="line-height: 1">Tags</h4>
            <div class="nds-stack" data-spacing="sm">
              <div
                v-for="tag in tags"
                :key="tag"
                class="nds-text-body nds-rounded-sm nds-border-default nds-px-2" style="padding-block: 0.375rem"
              >
                {{ tag }}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="scroll-area"]')!;
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('O markup é o mesmo das outras stacks', async () => {
      await expect(raiz.tagName).toBe('DIV');
      await expect(raiz).toHaveClass('nds-scroll-area');
      await expect(viewport.tagName).toBe('DIV');
      await expect(viewport).toHaveClass('nds-scroll-area-viewport');
    });

    await step('A rolagem continua sendo a do navegador', async () => {
      // accessibility.item5: a lib estiliza a barra, não substitui o mecanismo.
      // Overflow rolável no eixo do exemplo é o que preserva roda, teclado e
      // inércia de toque no celular.
      //
      // Só o eixo que a story rola: a lib desliga o overflow do eixo sem barra,
      // e afirmar os dois seria afirmar detalhe de implementação de uma lib.
      const estilo = getComputedStyle(viewport);
      await expect(['auto', 'scroll']).toContain(estilo.overflowY);
      // `touch-action: none` no viewport mataria o gesto de arrastar no celular.
      await expect(estilo.touchAction).not.toBe('none');
    });

    await step('O viewport é alcançável por teclado', async () => {
      // functional.item3: setas e PageUp/PageDown são ação padrão do navegador
      // num elemento rolável COM foco. Evento sintético não dispara ação padrão,
      // então o que se afirma é o contrato que a habilita — e por Tab, porque
      // interessa estar NA ordem de tabulação, não só aceitar foco.
      await expect(viewport).toHaveAttribute('tabindex', '0');
      viewport.blur();
      let alcancado = false;
      for (let i = 0; i < 8 && !alcancado; i++) {
        await userEvent.tab();
        alcancado = document.activeElement === viewport;
      }
      await expect(alcancado).toBe(true);
    });

    await step('O conteúdo rola dentro do viewport, sem mover a página', async () => {
      // functional.item1. A página é o alvo real: rolagem que escapa para o
      // documento é o defeito clássico deste componente.
      const paginaAntes = document.scrollingElement?.scrollTop ?? 0;
      await expect(transbordo(viewport).y).toBe(true);
      // Cada passo estabelece a própria precondição: no replay o viewport chega
      // rolado da rodada anterior.
      viewport.scrollTop = 0;
      viewport.scrollTop = 40;
      await expect(viewport.scrollTop).toBe(40);
      await expect(document.scrollingElement?.scrollTop ?? 0).toBe(paginaAntes);
    });

    await step('Nada do conteúdo é escondido de tecnologia assistiva', async () => {
      await expect(viewport.getAttribute('aria-hidden')).toBeNull();
      await expect(canvas.getAllByText(/^Tag \d+$/).length).toBe(TAGS.length);
    });
  },
};
