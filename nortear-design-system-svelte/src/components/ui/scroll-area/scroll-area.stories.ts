import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, userEvent } from 'storybook/test';
import { transbordo } from '@shared/testing/scroll-area-probe';
import { ScrollArea } from './index';
import ScrollAreaStory from './ScrollAreaStory.svelte';
import ScrollAreaDocs from '@/components/docs/ScrollAreaDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(ScrollAreaDocs),
      description: {
        component:
          'ScrollArea — viewport com scroll customizado. Suporta scroll vertical, horizontal ou ambos, com scrollbar estilizada; a rolagem continua sendo a nativa do navegador, o que preserva teclado e gestos de toque (WCAG 2.2).',
      },
    },
  },
  argTypes: {
    orientation: {
      control: 'inline-radio',
      options: ['vertical', 'horizontal', 'both'],
      description: 'Direção(ões) de scroll suportadas.',
    },
    type: {
      control: 'select',
      options: ['auto', 'always', 'scroll', 'hover'],
      description: 'Quando exibir a scrollbar.',
    },
    scrollHideDelay: {
      control: { type: 'number', min: 0, max: 5000, step: 100 },
      description: 'Tempo (ms) para esconder a scrollbar inativa.',
    },
  },
  args: {
    orientation: 'vertical',
    // 'always' e nao 'hover': com 'hover' a barra so se materializa sob o
    // ponteiro — o control continua oferecendo as quatro opcoes.
    type: 'always',
    scrollHideDelay: 600,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item3',
      'accessibility.item1',
      'accessibility.item5',
    ],
    // functional.item2 e accessibility.item2 dependem do pegador da barra e
    // ficam na story Always, que e a que garante a barra montada e medida.
  },
  render: (args) => ({
    Component: ScrollAreaStory,
    props: {
      variant: (args.orientation as 'vertical' | 'horizontal' | 'both') ?? 'vertical',
      type: args.type,
      scrollHideDelay: args.scrollHideDelay,
      height: '300px',
      width: '360px',
      itemCount: 30,
      tagLabel: 'Tag',
      cardLabel: 'Card',
    },
  }),
  play: async ({ canvasElement, step, args }) => {
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
      const eixoOverflow = args.orientation === 'horizontal' ? estilo.overflowX : estilo.overflowY;
      await expect(['auto', 'scroll']).toContain(eixoOverflow);
      // `touch-action: none` no viewport mataria o gesto de arrastar no celular.
      await expect(estilo.touchAction).not.toBe('none');
    });

    await step('O viewport é alcançável por teclado', async () => {
      // functional.item3: setas e PageUp/PageDown são ação padrão do navegador
      // num elemento rolável COM foco. Evento sintético não dispara ação padrão,
      // então o que se afirma é o contrato que a habilita.
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
      const horizontal = args.orientation === 'horizontal';
      const eixo = horizontal ? 'scrollLeft' : 'scrollTop';
      const eixos = transbordo(viewport);
      await expect(horizontal ? eixos.x : eixos.y).toBe(true);

      // Cada passo estabelece a própria precondição: no replay o viewport chega
      // rolado da rodada anterior.
      viewport[eixo] = 0;
      viewport[eixo] = 40;
      await expect(viewport[eixo]).toBe(40);
      await expect(document.scrollingElement?.scrollTop ?? 0).toBe(paginaAntes);
    });

    await step('Nada do conteúdo é escondido de tecnologia assistiva', async () => {
      await expect(viewport.getAttribute('aria-hidden')).toBeNull();
      await expect(canvas.getAllByText(/^(Tag|Card|R\d+·C\d+)/).length).toBeGreaterThan(5);
    });
  },
};
