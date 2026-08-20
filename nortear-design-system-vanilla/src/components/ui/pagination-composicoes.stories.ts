import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createPagination } from './pagination';
import {
  paginationComEstadoSourceCom,
  paginationSource,
  paginationSourceCom,
} from './pagination.source';

const ROTULO_ANTERIOR = 'Ir para a página anterior';
const ROTULO_PROXIMA = 'Ir para a próxima página';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/Pagination/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: paginationSource },
      description: {
        component:
          'Composições do Pagination: Simple (5 páginas), WithEllipsis (12 páginas), LastPage (próxima desabilitado), Interactive (estado do consumidor) e CompleteTable (rodapé de tabela). A factory não guarda estado — quem consome mantém `current` e remonta a faixa a cada mudança.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-cluster nds-w-full nds-p-2 nds-min-h-24';
  wrapper.dataset.justify = 'center';
  wrapper.dataset.align = 'center';
  wrapper.appendChild(child);
  return wrapper;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Simple: Story = {
  name: 'Simple (5 pages)',
  parameters: { covers: ['visual.item1'] },
  render: () =>
    wrap(
      createPagination({
        total: 5,
        current: 1,
        showPrevNext: true,
        label: 'Paginação simples',
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A faixa mostra todos os números, sem reticências', async () => {
      // visual.item1 — é o estado que o Chromatic fotografa como "default".
      const numerados = canvasElement.querySelectorAll('[data-slot="pagination-link"]');
      await expect(numerados.length).toBe(5);
      await expect([...numerados].map((l) => l.textContent?.trim())).toEqual([
        '1', '2', '3', '4', '5',
      ]);
      await expect(
        canvasElement.querySelectorAll('[data-slot="pagination-ellipsis"]').length,
      ).toBe(0);
    });

    await step('A primeira página é a atual e Anterior está desabilitado', async () => {
      await expect(canvas.getByRole('link', { name: 'Ir para página 1' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      await expect(canvas.getByRole('link', { name: ROTULO_ANTERIOR })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });
  },
};

export const WithEllipsis: Story = {
  name: 'With ellipsis (12 pages, current 6)',
  parameters: {
    covers: ['visual.item2'],
    // Override de story: as reticências só aparecem acima de 7 páginas — o
    // snippet do meta, com 5, esconderia justamente o assunto.
    docs: {
      source: {
        transform: paginationSourceCom({
          total: 12,
          current: 6,
          label: 'Paginação com reticências',
        }),
      },
    },
  },
  render: () =>
    wrap(
      createPagination({
        total: 12,
        current: 6,
        showPrevNext: true,
        label: 'Paginação com reticências',
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('As páginas distantes colapsam em reticências', async () => {
      // visual.item2
      const reticencias = canvasElement.querySelectorAll('[data-slot="pagination-ellipsis"]');
      await expect(reticencias.length).toBe(2);
      for (const item of reticencias) {
        // notes.item3: o caractere tipográfico, não três pontos e não um ícone.
        await expect(item.textContent?.trim()).toBe('…');
        await expect(item.tagName).toBe('SPAN');
      }
    });

    await step('As reticências não são lidas nem tabuladas', async () => {
      for (const item of canvasElement.querySelectorAll('[data-slot="pagination-ellipsis"]')) {
        await expect(item).toHaveAttribute('aria-hidden', 'true');
        await expect(item.hasAttribute('tabindex')).toBe(false);
      }
    });

    await step('Primeira, última e a atual continuam visíveis', async () => {
      await expect(canvas.getByRole('link', { name: 'Ir para página 1' })).toBeVisible();
      await expect(canvas.getByRole('link', { name: 'Ir para página 12' })).toBeVisible();
      await expect(canvas.getByRole('link', { name: 'Ir para página 6' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });
  },
};

export const LastPage: Story = {
  name: 'Last page (next disabled)',
  parameters: {
    docs: {
      source: {
        transform: paginationSourceCom({
          total: 10,
          current: 10,
          label: 'Paginação na última página',
        }),
      },
    },
  },
  render: () =>
    wrap(
      createPagination({
        total: 10,
        current: 10,
        showPrevNext: true,
        label: 'Paginação na última página',
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A página 10 é a atual', async () => {
      await expect(canvas.getByRole('link', { name: 'Ir para página 10' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    await step('Próxima está desabilitado e fora da tabulação', async () => {
      const proxima = canvas.getByRole('link', { name: ROTULO_PROXIMA });
      await expect(proxima).toHaveAttribute('aria-disabled', 'true');
      await expect(proxima).toHaveAttribute('tabindex', '-1');
    });
  },
};

export const Interactive: Story = {
  name: 'Interactive (state held by the consumer)',
  parameters: {
    // Override de story: aqui o assunto é o estado do lado de quem consome, e
    // ele pede outra FORMA de snippet — a fábrica não guarda a página.
    docs: {
      source: {
        transform: paginationComEstadoSourceCom({
          total: 8,
          current: 3,
          label: 'Paginação interativa',
        }),
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack nds-w-full nds-p-2 nds-min-h-24';
    wrapper.dataset.spacing = 'sm';

    const status = document.createElement('p');
    status.className = 'nds-text-body nds-text-muted-foreground';
    status.dataset.slot = 'pagina-atual';

    const total = 8;
    let current = 3;

    const navContainer = document.createElement('div');

    function remontar(): void {
      status.textContent = `Página ${current} de ${total}`;
      navContainer.replaceChildren(
        createPagination({
          total,
          current,
          showPrevNext: true,
          label: 'Paginação interativa',
          onPageChange: (page) => {
            current = page;
            remontar();
          },
        }),
      );
    }

    remontar();
    wrapper.append(status, navContainer);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const status = () => canvasElement.querySelector('[data-slot="pagina-atual"]');

    const irPara = async (n: number) => {
      // Par idempotente: só clica quando ainda não é a página atual. O painel
      // Interactions reexecuta a play no mesmo DOM, e um clique cego partiria
      // do estado que a rodada anterior deixou.
      const alvo = canvas.getByRole('link', { name: `Ir para página ${n}` });
      if (alvo.getAttribute('aria-current') !== 'page') await userEvent.click(alvo);
      await waitFor(() =>
        expect(canvas.getByRole('link', { name: `Ir para página ${n}` })).toHaveAttribute(
          'aria-current',
          'page',
        ),
      );
    };

    await step('Clicar numa página move o destaque e o contador', async () => {
      await irPara(4);
      await expect(status()).toHaveTextContent('Página 4 de 8');
    });

    await step('Só uma página é a atual em qualquer momento', async () => {
      await expect(canvasElement.querySelectorAll('[aria-current="page"]').length).toBe(1);
    });

    await step('O estado volta ao início para a próxima rodada', async () => {
      await irPara(3);
      await expect(status()).toHaveTextContent('Página 3 de 8');
    });
  },
};

// ─── Integrada a rota ─────────────────────────────────────────────────────────
//
// Sem `hrefForPage` todo link nasce `#` e o clique é anulado: serve à paginação
// que vive só na memória, e para de servir quando a página precisa ser
// compartilhável, indexável ou aberta em nova aba. Com ele o link é um destino
// de verdade e o clique SEGUE — quem usa roteador de cliente o intercepta como
// interceptaria qualquer link da página.

export const WithRoute: Story = {
  name: 'Integrated with routing',
  parameters: {
    // Override de story: `hrefForPage` é o assunto, e sem ele o snippet do meta
    // mostraria links que nascem `#`.
    docs: {
      source: {
        transform: paginationSourceCom({
          total: 8,
          current: 3,
          label: 'Paginação por rota',
          hrefForPage: '(page) => `?page=${page}`',
        }),
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack nds-w-full nds-p-2 nds-min-h-24';
    wrapper.dataset.spacing = 'sm';

    const status = document.createElement('p');
    status.className = 'nds-text-body nds-text-muted-foreground';
    status.dataset.slot = 'rota-atual';
    status.textContent = 'Rota: ?page=3';

    const nav = createPagination({
      total: 8,
      current: 3,
      label: 'Paginação por rota',
      hrefForPage: (page) => `?page=${page}`,
      onPageChange: (page) => {
        status.textContent = `Rota: ?page=${page}`;
      },
    });

    // O papel do roteador de cliente: ele assume a navegação e impede a ida
    // real. Numa aplicação seria `router.push(href)`; aqui basta que a story
    // não recarregue o iframe.
    nav.addEventListener('click', (e) => {
      const alvo = (e.target as HTMLElement).closest('a');
      if (!alvo) return;
      // Antes de o roteador assumir, o clique tem de estar VIVO — se a fábrica
      // o tivesse anulado, `defaultPrevented` já viria verdadeiro e nenhum
      // roteador do mundo saberia que houve navegação.
      status.dataset.interceptado = String(!e.defaultPrevented);
      e.preventDefault();
    });

    wrapper.append(status, nav);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const status = () => canvasElement.querySelector<HTMLElement>('[data-slot="rota-atual"]')!;

    await step('Cada link carrega o endereço real da sua página', async () => {
      const pagina4 = canvas.getByRole('link', { name: 'Ir para página 4' });
      await expect(pagina4.getAttribute('href')).toBe('?page=4');
      await expect(
        canvas.getByRole('link', { name: ROTULO_PROXIMA }).getAttribute('href'),
      ).toBe('?page=4');
      await expect(
        canvas.getByRole('link', { name: ROTULO_ANTERIOR }).getAttribute('href'),
      ).toBe('?page=2');
    });

    await step('O clique chega vivo ao roteador, e ainda avisa quem escuta', async () => {
      await userEvent.click(canvas.getByRole('link', { name: 'Ir para página 4' }));
      await waitFor(() => expect(status().dataset.interceptado).toBe('true'));
      await expect(status()).toHaveTextContent('Rota: ?page=4');
    });
  },
};

export const CompleteTable: Story = {
  name: 'Complete table footer',
  parameters: {
    // Override de story: o alinhamento é o PONTO desta composição, e `align`
    // não passa por control nenhum.
    docs: {
      source: {
        transform: paginationSourceCom({
          total: 12,
          current: 2,
          align: 'end',
          label: 'Paginação do rodapé da tabela',
        }),
      },
    },
  },
  render: () => {
    // `nds-cluster` e não `nds-stack`: só o cluster tem data-align/data-justify,
    // e é ele que quebra a linha sozinho quando a largura aperta.
    const rodape = document.createElement('div');
    rodape.className =
      'nds-cluster nds-w-full nds-max-w-prose nds-border-default nds-rounded-lg nds-p-4';
    rodape.dataset.spacing = 'sm';
    rodape.dataset.align = 'center';
    rodape.dataset.justify = 'between';

    const contador = document.createElement('span');
    contador.className = 'nds-text-body nds-text-muted-foreground';
    contador.textContent = 'Mostrando 11–20 de 120 resultados';

    rodape.append(
      contador,
      createPagination({
        total: 12,
        current: 2,
        showPrevNext: true,
        align: 'end',
        label: 'Paginação do rodapé da tabela',
        onPageChange: () => {},
      }),
    );
    return rodape;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A faixa encosta na borda direita do rodapé', async () => {
      // O alinhamento é o PONTO desta composição: sem `data-align`, a faixa
      // ocupa a linha inteira e fica centrada.
      const nav = canvas.getByRole('navigation', { name: 'Paginação do rodapé da tabela' });
      await expect(getComputedStyle(nav).justifyContent).toBe('flex-end');
      await expect(nav.getBoundingClientRect().width).toBeLessThan(
        (nav.parentElement as HTMLElement).getBoundingClientRect().width,
      );
    });

    await step('O contador e a faixa dividem a mesma linha', async () => {
      const rodape = canvasElement.querySelector('.nds-cluster') as HTMLElement;
      await expect(getComputedStyle(rodape).justifyContent).toBe('space-between');
      await expect(canvas.getByRole('link', { name: 'Ir para página 2' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });
  },
};
