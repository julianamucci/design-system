import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { transbordo } from '@shared/testing/scroll-area-probe';
import { createScrollArea, type ScrollAreaSize } from './scroll-area';
import { buildList } from './scroll-area.fixtures';
import { scrollAreaSource } from './scroll-area.source';
import { createScrollAreaDocs } from '@/components/docs/ScrollAreaDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ScrollAreaArgs = {
  size: ScrollAreaSize;
  width: string;
  label: string;
  itemCount: number;
  className: string;
};

const meta: Meta<ScrollAreaArgs> = {
  title: 'Primitives/Layout/ScrollArea',
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createScrollAreaDocs), source: { transform: scrollAreaSource } },
  },
  argTypes: {
    size: {
      control: 'radio',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description:
        'Degrau da escada de altura da janela rolável, escrito em data-size no root. OBRIGATÓRIO para o scroll funcionar — a ausência dele é a story NoLimit, em States.',
    },
    width: {
      control: 'text',
      description: 'Largura do root. Útil para scroll horizontal.',
    },
    label: {
      control: 'text',
      description:
        'Nome acessível da região rolável. Vazio não emite papel algum — região anônima não ajuda ninguém.',
    },
    itemCount: {
      control: { type: 'number', min: 1, max: 100, step: 1 },
      description: 'Número de itens da lista de demonstração.',
    },
    className: {
      control: 'text',
      description: 'Classes utilitárias .nds-* extras no root.',
    },
  },
  args: {
    size: 'lg',
    width: '100%',
    label: 'Lista de itens',
    itemCount: 30,
    // Era 'rounded-md border' — duas classes do Tailwind, que saiu do projeto:
    // não pintavam nada e o control ensinava vocabulário morto.
    className: 'nds-rounded-md nds-border-default',
  },
};

export default meta;
type Story = StoryObj<ScrollAreaArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item3',
      'accessibility.item1',
      'accessibility.item5',
    ],
    // Os dois itens abaixo descrevem a barra CUSTOMIZADA que as libs headless
    // desenham. Aqui a barra é a nativa do navegador: não existe nó no DOM para
    // arrastar nem para medir contraste — quem desenha é o sistema operacional.
    coversNotApplicable: {
      'functional.item2': 'barra nativa: o pegador e desenhado pelo sistema, nao ha no no DOM para arrastar',
      'accessibility.item2': 'barra nativa: o contraste do pegador e do sistema operacional, fora do DOM',
    },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-md';
    wrap.appendChild(createScrollArea({
      size: args.size || undefined,
      width: args.width || undefined,
      label: args.label || undefined,
      class: args.className || undefined,
      children: buildList(args.itemCount),
    }));
    return wrap;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="scroll-area"]')!;
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('O markup é o mesmo das outras stacks', async () => {
      await expect(root.tagName).toBe('DIV');
      await expect(root).toHaveClass('nds-scroll-area');
      await expect(viewport.tagName).toBe('DIV');
      await expect(viewport).toHaveClass('nds-scroll-area-viewport');
      // O degrau vai para a RAIZ, e é ela que a folha compartilhada dimensiona:
      // o viewport é `height: 100%` por ela, sem medida repetida no elemento.
      await expect(root.dataset.size).toBe(args.size);
      await expect(viewport.style.maxHeight).toBe('');
    });

    await step('A rolagem é a nativa do navegador', async () => {
      // accessibility.item5 e functional.item3: teclado (setas, PageUp/PageDown,
      // Home/End) e inércia de toque são comportamento NATIVO de um elemento com
      // overflow rolável e foco. Não há como provocá-los por evento sintético —
      // evento não confiável não dispara ação padrão —, então o que se afirma é
      // o contrato que os habilita: overflow nativo mais foco.
      const estilo = getComputedStyle(viewport);
      await expect(estilo.overflowY).toBe('auto');
      await expect(estilo.overflowX).toBe('auto');
    });

    await step('A região rolável tem nome acessível e é alcançável por teclado', async () => {
      // O par papel + nome: sem papel, `aria-label` seria atributo proibido;
      // sem nome, a fábrica não emite papel nenhum.
      //
      // O papel é `group` e NÃO `region`: `region` é papel de MARCO, e um
      // viewport que rola é recurso de layout, não seção de conteúdo — a
      // escolha está medida no cabeçalho de `scroll-area.ts`. Esta asserção
      // ficou para trás quando a fábrica mudou, e passou a cobrar justamente o
      // papel que a decisão tinha acabado de recusar.
      await expect(viewport).toHaveAttribute('tabindex', '0');
      if (args.label) {
        await expect(canvas.getByRole('group', { name: args.label })).toBe(viewport);
      } else {
        await expect(viewport.getAttribute('role')).toBeNull();
        await expect(viewport.getAttribute('aria-label')).toBeNull();
      }

      viewport.blur();
      let alcancado = false;
      for (let i = 0; i < 8 && !alcancado; i++) {
        await userEvent.tab();
        alcancado = document.activeElement === viewport;
      }
      await expect(alcancado).toBe(true);
    });

    await step('O conteúdo rola dentro do viewport, sem mover a página', async () => {
      // functional.item1. A página é o alvo real do teste: rolagem que escapa
      // para o documento é o defeito clássico deste componente.
      const pageBefore = document.scrollingElement?.scrollTop ?? 0;
      await expect(transbordo(viewport).y).toBe(true);
      // Cada passo estabelece a própria precondição: no replay o viewport chega
      // rolado da rodada anterior.
      viewport.scrollTop = 0;
      viewport.scrollTop = 40;
      await expect(viewport.scrollTop).toBe(40);
      await expect(document.scrollingElement?.scrollTop ?? 0).toBe(pageBefore);
    });

    await step('Nada do conteúdo é escondido de tecnologia assistiva', async () => {
      await expect(viewport.getAttribute('aria-hidden')).toBeNull();
      await expect(canvas.getAllByText(/^Item \d+$/).length).toBe(args.itemCount);
    });
  },
};
