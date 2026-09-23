import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { minimumTargetsBelow } from '@shared/testing/pagination-probe';
import { createPagination } from './pagination';
import { wrap } from './pagination.fixtures';
import { paginationSource, paginationSourceWith } from './pagination.source';

const LABEL_PREVIOUS = 'Ir para a página anterior';
const LABEL_NEXT = 'Ir para a próxima página';

const meta: Meta = {
  tags: ['navigation'],
  title: 'Components/Navigation/Pagination/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: paginationSource },
      description: {
        component:
          'Variantes do link de paginação: Default (inativo), Active (página atual, com aria-current=page) e Directional (anterior/próxima com ícone). A factory não expõe uma prop de variante — a marcação da página atual é aplicada quando `page === current`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    // Override de story: a supressão dos direcionais é o assunto aqui, e
    // `showPrevNext` não passa por control nenhum neste arquivo.
    docs: {
      source: {
        transform: paginationSourceWith({
          total: 5,
          current: 2,
          showPrevNext: false,
          'aria-label': 'Paginação com link inativo',
        }),
      },
    },
  },
  render: () =>
    wrap(
      createPagination({
        total: 5,
        current: 2,
        showPrevNext: false,
        'aria-label': 'Paginação com link inativo',
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cinco números visíveis, sem controles direcionais', async () => {
      const links = canvas.getAllByRole('button');
      await expect(links.length).toBe(5);
      await expect(canvasElement.querySelector('[data-slot="pagination-previous"]')).toBeNull();
    });

    await step('O link inativo não se anuncia como página atual', async () => {
      const inactive = canvas.getByRole('button', { name: 'Ir para página 3' });
      await expect(inactive).not.toHaveAttribute('aria-current');
      // `data-active` só existe quando é verdade — atributo presente com valor
      // "false" faria `[data-active]` casar o item errado.
      await expect(inactive.hasAttribute('data-active')).toBe(false);
    });
  },
};

export const Active: Story = {
  name: 'Active (current page)',
  parameters: {
    docs: {
      source: {
        transform: paginationSourceWith({
          total: 7,
          current: 4,
          showPrevNext: false,
          'aria-label': 'Paginação com página atual',
        }),
      },
    },
  },
  render: () =>
    wrap(
      createPagination({
        total: 7,
        current: 4,
        showPrevNext: false,
        'aria-label': 'Paginação com página atual',
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Exatamente um link é a página atual', async () => {
      const marcados = canvasElement.querySelectorAll('[aria-current="page"]');
      await expect(marcados.length).toBe(1);
      await expect(marcados[0].textContent?.trim()).toBe('4');
    });

    await step('A página atual continua rotulada e destacada', async () => {
      const active = canvas.getByRole('button', { name: 'Ir para página 4' });
      await expect(active).toHaveAttribute('aria-current', 'page');
      await expect(active).toHaveAttribute('data-active', 'true');
      // O realce da página atual é a VARIANTE do botão, não uma segunda folha
      // de link: `outline` na atual, `ghost` nas demais.
      await expect(active).toHaveClass('nds-button-outline');
      await expect(canvas.getByRole('button', { name: 'Ir para página 3' })).toHaveClass(
        'nds-button-ghost',
      );
    });
  },
};

export const Directional: Story = {
  name: 'Directional (previous/next)',
  parameters: { covers: ['accessibility.item5', 'accessibility.item6'] },
  render: () =>
    wrap(
      createPagination({
        total: 8,
        current: 4,
        showPrevNext: true,
        'aria-label': 'Paginação direcional',
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Os controles de direção têm rótulo em português', async () => {
      // accessibility.item5 — abaixo de 40rem o rótulo por extenso é escondido
      // e sobra o chevron: sem o `aria-label` o controle fica mudo justamente
      // na tela estreita. Antes daqui ele saía como "Go to previous page".
      const previous = canvas.getByRole('button', { name: LABEL_PREVIOUS });
      const next = canvas.getByRole('button', { name: LABEL_NEXT });
      await expect(previous.querySelector('svg')).not.toBeNull();
      await expect(next.querySelector('svg')).not.toBeNull();
    });

    await step('O controle é o BOTÃO, na mesma variante e tamanho das outras stacks', async () => {
      // O direcional é `.nds-button` ghost em tamanho default MAIS a classe de
      // recuo assimétrico — que sozinha é (0,1,0) e perderia para
      // `.nds-button:has(> svg)`. Asserir as duas juntas é o que dá dentes à
      // decisão: emitir só `.nds-pagination-prev` volta a ser invisível na tela.
      const previous = canvas.getByRole('button', { name: LABEL_PREVIOUS });
      const next = canvas.getByRole('button', { name: LABEL_NEXT });
      await expect(previous).toHaveClass('nds-button');
      await expect(previous).toHaveClass('nds-button-ghost');
      await expect(previous).toHaveClass('nds-pagination-prev');
      await expect(next).toHaveClass('nds-button');
      await expect(next).toHaveClass('nds-button-ghost');
      await expect(next).toHaveClass('nds-pagination-next');

      // O número é o mesmo botão em tamanho `icon`.
      //
      // Página 3, e não 2: com `total: 8` e `current: 4` a régua colapsa 2, 6 e 7
      // atrás das reticências, então a 2 não chega a ser renderizada. A asserção
      // nasceu apontando para ela e reprovou na primeira suíte — é fato de DOM
      // renderizado, que nenhuma conferência estática alcança.
      const numbered = canvas.getByRole('button', { name: 'Ir para página 3' });
      await expect(numbered).toHaveClass('nds-button');
      await expect(numbered).toHaveClass('nds-button-icon');
      await expect(numbered).toHaveClass('nds-button-ghost');
    });

    await step('O rótulo por extenso acompanha o chevron', async () => {
      // "Anterior"/"Próxima" por extenso é o que o próprio Do & Don't pede.
      // `.nds-pagination-label` é quem o esconde abaixo de 40rem — a classe
      // existe na folha compartilhada e nenhuma stack a emitia aqui.
      const labels = canvasElement.querySelectorAll('.nds-pagination-label');
      await expect(labels.length).toBe(2);
      await expect([...labels].map((r) => r.textContent)).toEqual(['Anterior', 'Próxima']);
    });

    await step('O ícone é decoração, não conteúdo', async () => {
      for (const icon of canvasElement.querySelectorAll('svg')) {
        await expect(icon).toHaveAttribute('aria-hidden', 'true');
      }
    });

    await step('Todo controle alcança o alvo de toque mínimo', async () => {
      // accessibility.item6 — WCAG 2.5.8 pede 24×24 CSS px.
      await expect(JSON.stringify(minimumTargetsBelow(canvasElement))).toBe('[]');
    });
  },
};
