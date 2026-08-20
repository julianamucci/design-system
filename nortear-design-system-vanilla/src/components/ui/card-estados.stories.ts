import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, fn, userEvent } from 'storybook/test';
import {
  createCard,
  createCardHeader,
  createCardTitle,
  createCardDescription,
  createCardContent,
  createCardFooter,
} from './card';
import { cardClicavelSourceCom, cardSource, cardSourceCom } from './card.source';
import { createButton } from '@/components/ui/button';

/**
 * Espiões em escopo de MÓDULO: criados dentro do `render` seriam inalcançáveis
 * pela `play`. Cada passo limpa o seu antes de agir, para a contagem valer na
 * segunda execução do painel Interactions.
 */
const onNavigate = fn();
const onSave = fn();

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Card/States',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      source: { transform: cardSource },
      description: {
        component:
          'Configurações do Card: padrão (container passivo), clicável (envolvido em <a> com aria-label descritivo) e com footer de ações. O Card raiz nunca recebe foco — a semântica de ativação vive no wrapper ou nos controles internos.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildBasicCard(): HTMLElement {
  const card = createCard({ className: 'nds-w-cap-sm' });
  const header = createCardHeader();
  header.appendChild(createCardTitle({ text: 'Cadeira Gamer Pro', level: 3 }));
  header.appendChild(
    createCardDescription({ text: 'Estrutura ergonômica com ajuste de altura e apoio lombar.' }),
  );
  const content = createCardContent();
  const price = document.createElement('p');
  price.className = 'nds-text-h4';
  price.textContent = 'R$ 1.299,00';
  content.appendChild(price);
  card.append(header, content);
  return card;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    covers: ['accessibility.item2'],
    docs: {
      description: {
        story:
          'Container passivo — o Card por si só não recebe foco nem eventos de teclado. Toda a interatividade vive no conteúdo interno.',
      },
    },
  },
  render: () => buildBasicCard(),
  play: async ({ canvasElement, step }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;

    await step('O Card é container passivo — não entra na ordem de foco', async () => {
      await expect(card).not.toHaveAttribute('tabindex');
      await expect(card).not.toHaveAttribute('role');
    });

    await step('A descrição não herda a cor do título', async () => {
      // O contraste em si é medido pelo axe. O que esta asserção guarda é a
      // hierarquia: descrição na cor muted, título na cor do card. Cair na
      // mesma cor passaria no axe e apagaria a diferença entre as duas.
      const title = card.querySelector<HTMLElement>('[data-slot="card-title"]')!;
      const description = card.querySelector<HTMLElement>('[data-slot="card-description"]')!;
      await expect(getComputedStyle(description).color).not.toBe(getComputedStyle(title).color);
    });
  },
};

export const Clickable: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item4'],
    docs: {
      // Override de story: a forma do snippet é outra — o `<a>` de fora é o
      // assunto, e é ele que carrega nome, anel de foco e ativação.
      source: { transform: cardClicavelSourceCom() },
      description: {
        story:
          'Card envolvido em `<a>` com `aria-label` descritivo. Não use handler de clique no Card root — a semântica de ativação por teclado e o anel de foco vivem no wrapper, e o Tab alcança um destino só.',
      },
    },
  },
  render: () => {
    const link = document.createElement('a');
    link.href = '#produto-cadeira-gamer-pro';
    link.className = 'nds-block nds-w-cap-sm nds-text-left nds-focus-ring nds-rounded-xl';
    link.setAttribute('aria-label', 'Abrir detalhes do produto Cadeira Gamer Pro');
    link.addEventListener('click', (event) => {
      event.preventDefault();
      onNavigate({ event: 'card_click', label: 'Cadeira Gamer Pro' });
    });
    link.appendChild(buildBasicCard());
    return link;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', {
      name: 'Abrir detalhes do produto Cadeira Gamer Pro',
    });

    await step('Tab alcança o card inteiro como um destino único', async () => {
      link.blur();
      await userEvent.tab();
      await expect(link).toHaveFocus();
    });

    await step('O anel de foco aparece quando o foco vem do teclado', async () => {
      const { outlineStyle, boxShadow } = getComputedStyle(link);
      await expect(outlineStyle !== 'none' || boxShadow !== 'none').toBe(true);
    });

    await step('Enter navega a partir do wrapper', async () => {
      onNavigate.mockClear();
      await userEvent.keyboard('{Enter}');
      await expect(onNavigate).toHaveBeenCalledTimes(1);
    });

    await step('O Card interno continua passivo dentro do link', async () => {
      const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
      await expect(card).not.toHaveAttribute('tabindex');
    });
  },
};

export const WithFooter: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: {
      // Override de story: o rodapé é uma fábrica a mais na composição, e é ele
      // que zera o respiro de baixo do Card.
      source: { transform: cardSourceCom({ showFooter: true }) },
      description: {
        story:
          'Composição com CardFooter: o Card zera o próprio padding inferior quando detecta o rodapé como filho direto, e o rodapé ganha borda superior e fundo soft. Botões usam `aria-label` contextual para não virarem rótulos repetidos numa lista.',
      },
    },
  },
  render: () => {
    const card = buildBasicCard();

    const footer = createCardFooter({ className: 'nds-cluster' });
    footer.dataset.spacing = 'sm';
    footer.dataset.justify = 'end';
    footer.appendChild(
      createButton({
        variant: 'outline',
        label: 'Cancelar',
        'aria-label': 'Cancelar edição de Cadeira Gamer Pro',
      }),
    );
    const salvar = createButton({
      label: 'Salvar',
      'aria-label': 'Salvar alterações em Cadeira Gamer Pro',
    });
    salvar.addEventListener('click', () => onSave());
    footer.appendChild(salvar);

    card.appendChild(footer);
    return card;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;

    await step('Clicar no botão do rodapé chama o handler uma única vez', async () => {
      onSave.mockClear();
      await userEvent.click(
        canvas.getByRole('button', { name: 'Salvar alterações em Cadeira Gamer Pro' }),
      );
      await expect(onSave).toHaveBeenCalledTimes(1);
    });

    await step('O Card raiz não intercepta o clique — segue passivo', async () => {
      // Container: nenhum handler próprio e nenhuma entrada na ordem de foco.
      // É o que garante que o clique termina no botão e não em duas ações.
      await expect(card.onclick).toBeNull();
      await expect(card).not.toHaveAttribute('tabindex');
    });
  },
};
