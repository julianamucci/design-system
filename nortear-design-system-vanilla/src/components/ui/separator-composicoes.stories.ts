import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createSeparator } from './separator';
import { separatorEmCardSource, separatorSource, separatorSourceCom } from './separator.source';
import {
  createCard,
  createCardContent,
  createCardDescription,
  createCardHeader,
  createCardTitle,
} from './card';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Separator/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: separatorSource },
      description: {
        component:
          'Composições do Separator: dentro de um Card, dentro de um menu vertical e com a ênfase forte.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function texto(txt: string, classe = 'nds-text-body'): HTMLElement {
  const el = document.createElement('p');
  el.className = classe;
  el.textContent = txt;
  return el;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const InCard: Story = {
  parameters: {
    covers: ['visual.item3'],
    // O Card é a composição: o snippet do meta mostraria dois parágrafos soltos
    // e esconderia as sub-fábricas que dão a vizinhança da linha.
    docs: { source: { transform: separatorEmCardSource() } },
  },
  render: () => {
    const card = createCard({ className: 'nds-max-w-md' });

    const header = createCardHeader();
    header.append(
      createCardTitle({ text: 'Resumo do pedido' }),
      createCardDescription({ text: '3 itens, entrega em 5 dias úteis.' }),
    );

    const content = createCardContent();
    content.append(texto('Total: R$ 249,90'));

    card.append(header, createSeparator({ orientation: 'horizontal' }), content);
    return card;
  },
  play: async ({ canvasElement, step }) => {
    const card = canvasElement.querySelector<HTMLElement>('.nds-card')!;
    const sep = card.querySelector<HTMLElement>('.nds-separator');

    await step('Separa o cabeçalho do conteúdo dentro do Card', async () => {
      await expect(sep).toBeInTheDocument();
      await expect(sep).toHaveAttribute('data-orientation', 'horizontal');
    });

    await step('Não estoura a largura do Card', async () => {
      // Separador dentro de um contêiner com padding é onde a largura costuma
      // vazar — medir o par prova que ele respeita a caixa.
      const caixa = sep!.getBoundingClientRect();
      await expect(caixa.width).toBeGreaterThan(0);
      await expect(caixa.width).toBeLessThanOrEqual(card.getBoundingClientRect().width);
    });
  },
};

export const InMenu: Story = {
  parameters: {
    covers: ['visual.item4'],
    // A divisão entre grupos de um menu faz parte da estrutura da informação: é
    // o caso em que a linha deixa de ser decorativa, e o padrão da fábrica é o
    // contrário.
    docs: {
      source: { transform: separatorSourceCom({ decorative: false, antes: 'Conta', depois: 'Sair' }) },
    },
  },
  render: () => {
    const menu = document.createElement('div');
    menu.className = 'nds-stack nds-max-w-xs nds-rounded-md nds-border-default nds-bg-background nds-p-1';
    menu.dataset.spacing = 'xs';

    const item = (txt: string) => {
      const el = document.createElement('div');
      el.className = 'nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1 nds-text-body';
      el.textContent = txt;
      return el;
    };

    menu.append(
      item('Perfil'),
      item('Conta'),
      // A divisão entre grupos de um menu FAZ parte da estrutura da informação:
      // é o caso em que o separador deixa de ser decorativo.
      createSeparator({ orientation: 'horizontal', decorative: false }),
      item('Sair'),
    );
    return menu;
  },
  play: async ({ canvasElement, step }) => {
    const menu = canvasElement.querySelector<HTMLElement>('.nds-stack')!;
    const sep = menu.querySelector<HTMLElement>('.nds-separator')!;
    const itens = [...menu.children].filter((c) => !c.classList.contains('nds-separator'));

    await step('A divisão entre grupos é anunciada', async () => {
      await expect(sep).toHaveAttribute('role', 'separator');
      await expect(sep).toHaveAttribute('aria-orientation', 'horizontal');
    });

    await step('Fica ENTRE os dois grupos, não dentro de um deles', async () => {
      const meio = sep.getBoundingClientRect().top;
      await expect(itens).toHaveLength(3);
      await expect(itens[1].getBoundingClientRect().bottom).toBeLessThanOrEqual(meio + 1);
      await expect(itens[2].getBoundingClientRect().top).toBeGreaterThanOrEqual(meio - 1);
    });
  },
};

export const EmphasisStrong: Story = {
  parameters: {
    covers: ['functional.item5', 'functional.item6', 'visual.item5'],
    // A ênfase forte é o assunto, e a classe extra ao lado dela é o par que a
    // docs page documenta em Extensibilidade.
    docs: {
      source: {
        transform: separatorSourceCom({
          emphasis: 'strong',
          className: 'nds-mt-4',
          antes: 'Continuação do mesmo assunto',
          depois: 'Troca de assunto',
        }),
      },
    },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-full nds-max-w-md';
    wrap.dataset.spacing = 'md';

    const padrao = createSeparator({ orientation: 'horizontal' });
    padrao.dataset.testid = 'padrao';

    // A classe extra entra junto com a ênfase: é o mesmo par que a docs page
    // documenta em Extensibilidade, e prova que ela convive com a base.
    const forte = createSeparator({
      orientation: 'horizontal',
      emphasis: 'strong',
      className: 'nds-mt-4',
    });
    forte.dataset.testid = 'forte';

    wrap.append(
      texto('Fim da seção', 'nds-text-body nds-text-muted-foreground'),
      padrao,
      texto('Continuação do mesmo assunto', 'nds-text-body nds-text-muted-foreground'),
      forte,
      texto('Troca de assunto', 'nds-text-body nds-font-medium'),
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const padrao = canvasElement.querySelector<HTMLElement>('[data-testid="padrao"]')!;
    const forte = canvasElement.querySelector<HTMLElement>('[data-testid="forte"]')!;

    await step('A ênfase forte dobra a espessura', async () => {
      await expect(forte).toHaveAttribute('data-emphasis', 'strong');
      await expect(padrao.getBoundingClientRect().height).toBeCloseTo(1, 1);
      await expect(forte.getBoundingClientRect().height).toBeCloseTo(2, 1);
    });

    await step('A ênfase forte troca o token de cor da linha', async () => {
      // Comparar com o separador padrão renderizado ao lado, e não com um valor
      // literal: o token muda por tema, a diferença entre os dois não.
      const corPadrao = getComputedStyle(padrao).backgroundColor;
      const corForte = getComputedStyle(forte).backgroundColor;
      await expect(corForte).not.toBe(corPadrao);
    });

    await step('A classe extra convive com a classe base', async () => {
      await expect(forte).toHaveClass('nds-separator');
      await expect(forte).toHaveClass('nds-mt-4');
    });
  },
};
