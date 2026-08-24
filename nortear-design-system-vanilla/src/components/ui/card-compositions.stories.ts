import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import {
  createCard,
  createCardHeader,
  createCardTitle,
  createCardDescription,
  createCardAction,
  createCardContent,
  createCardFooter,
} from './card';
import { cardSource, cardSourceWith } from './card.source';
import { createButton } from '@/components/ui/button';

/**
 * Imagem em data URI, igual nas cinco stacks: a asserção de radius e de padding
 * mede a imagem REAL, e uma URL remota faria o resultado depender da rede.
 */
const DEMO_IMAGE_PRODUCT =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='160'%3E%3Crect width='400' height='160' fill='%23cbd5e1'/%3E%3C/svg%3E";

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Card/Compositions',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      source: { transform: cardSource },
      description: {
        component:
          'Composições canônicas do Card: com footer (ações), com slot de ação no header e com imagem como primeiro filho (padding superior removido automaticamente).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildHeader(title: string, description: string): HTMLElement {
  const header = createCardHeader();
  header.appendChild(createCardTitle({ text: title, level: 3 }));
  header.appendChild(createCardDescription({ text: description }));
  return header;
}

function buildPrice(text = 'R$ 1.299,00'): HTMLElement {
  const content = createCardContent();
  const price = document.createElement('p');
  price.className = 'nds-text-h4';
  price.textContent = text;
  content.appendChild(price);
  return content;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const WithFooter: Story = {
  parameters: {
    docs: {
      // Override de story: o rodapé é a fábrica em foco.
      source: { transform: cardSourceWith({ showFooter: true }) },
      description: {
        story:
          'O CardFooter ganha borda superior e fundo soft; o Card zera o próprio padding inferior ao detectar o rodapé como filho direto, para a borda encostar na base.',
      },
    },
  },
  render: () => {
    const card = createCard({ className: 'nds-w-sm' });
    const footer = createCardFooter({ className: 'nds-cluster' });
    footer.dataset.spacing = 'md';
    footer.dataset.justify = 'end';
    footer.appendChild(
      createButton({
        variant: 'outline',
        label: 'Cancelar',
        'aria-label': 'Cancelar edição de Cadeira Gamer Pro',
      }),
    );
    footer.appendChild(
      createButton({ label: 'Salvar', 'aria-label': 'Salvar alterações em Cadeira Gamer Pro' }),
    );

    card.append(
      buildHeader('Cadeira Gamer Pro', 'Produto atualizado em 12/04.'),
      buildPrice(),
      footer,
    );
    return card;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
    const footer = card.querySelector<HTMLElement>('[data-slot="card-footer"]')!;

    await step('O rodapé é filho direto e vem DEPOIS do conteúdo', async () => {
      await expect(footer.parentElement).toBe(card);
      await expect(card.lastElementChild).toBe(footer);
    });

    await step('O rodapé se separa do conteúdo por uma borda superior', async () => {
      await expect(Number.parseFloat(getComputedStyle(footer).borderTopWidth)).toBeGreaterThan(0);
    });

    await step('As ações do rodapé nomeiam o card', async () => {
      await expect(
        canvas.getByRole('button', { name: 'Cancelar edição de Cadeira Gamer Pro' }),
      ).toBeInTheDocument();
      await expect(
        canvas.getByRole('button', { name: 'Salvar alterações em Cadeira Gamer Pro' }),
      ).toBeInTheDocument();
    });
  },
};

export const WithAction: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item5', 'visual.item3'],
    docs: {
      // Override de story: `createCardAction` é a fábrica em foco, e é ela que
      // faz o cabeçalho virar grid de duas colunas.
      source: { transform: cardSourceWith({ action: true, description: 'Em estoque' }) },
      description: {
        story:
          'Com CardAction o header vira grid de duas colunas e a ação encosta à direita. A ordem do DOM continua título → descrição → ação, então o leitor de tela lê na ordem lógica.',
      },
    },
  },
  render: () => {
    const card = createCard({ className: 'nds-w-sm' });
    const header = buildHeader('Cadeira Gamer Pro', 'Em estoque');

    const action = createCardAction();
    action.appendChild(
      createButton({
        variant: 'ghost',
        size: 'sm',
        label: 'Editar',
        'aria-label': 'Editar produto Cadeira Gamer Pro',
      }),
    );
    header.appendChild(action);

    card.append(header, buildPrice());
    return card;
  },
  play: async ({ canvasElement, step }) => {
    const header = canvasElement.querySelector<HTMLElement>('[data-slot="card-header"]')!;

    await step('A ação vive DENTRO do header, não solta no card', async () => {
      // Fora do header a ação cairia no fluxo normal e o alinhamento à direita
      // sumiria — a posição vem da grid do header, não de uma classe própria.
      await expect(header.querySelector('[data-slot="card-action"]')).toBeInTheDocument();
    });

    await step('O header passa a ter duas colunas', async () => {
      const colunas = getComputedStyle(header).gridTemplateColumns.trim().split(/\s+/);
      await expect(colunas).toHaveLength(2);
    });

    await step('A ordem do DOM é título → descrição → ação', async () => {
      const slots = [...header.children].map((el) => el.getAttribute('data-slot'));
      await expect(slots).toEqual(['card-title', 'card-description', 'card-action']);
    });
  },
};

export const WithImage: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item5'],
    docs: {
      // Override de story: a imagem como PRIMEIRO filho é o assunto — é a
      // posição dela que dispara a regra de CSS.
      source: { transform: cardSourceWith({ image: true }) },
      description: {
        story:
          'Imagem como primeiro filho: o Card arredonda o topo dela e remove o próprio padding superior por CSS — não é preciso passar classe na imagem.',
      },
    },
  },
  render: () => {
    const card = createCard({ className: 'nds-w-sm' });

    const img = document.createElement('img');
    img.src = DEMO_IMAGE_PRODUCT;
    img.alt = 'Cadeira Gamer Pro vista de frente, em fundo neutro';
    img.className = 'nds-w-full nds-aspect-16-9';
    img.style.objectFit = 'cover';

    card.append(
      img,
      buildHeader(
        'Cadeira Gamer Pro',
        'Estrutura ergonômica com ajuste de altura e apoio lombar.',
      ),
      buildPrice(),
    );
    return card;
  },
  play: async ({ canvasElement, step }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
    const img = card.querySelector('img')!;

    await step('A imagem é o primeiro filho DIRETO do card', async () => {
      await expect(card.firstElementChild).toBe(img);
    });

    await step('O card cede o padding superior e o raio para a imagem', async () => {
      await expect(Number.parseFloat(getComputedStyle(card).paddingTop)).toBe(0);
      await expect(
        Number.parseFloat(getComputedStyle(img).borderTopLeftRadius),
      ).toBeGreaterThan(0);
    });

    await step('A imagem tem alternativa textual descritiva', async () => {
      // Imagem informativa: `alt` vazio a esconderia de quem usa leitor de tela,
      // e é ela que mostra o produto.
      await expect(img.alt.trim().length).toBeGreaterThan(0);
    });
  },
};
