import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createPagination, PAGINATION_LABELS_DEFAULT } from './pagination';
import { wrap } from './pagination.fixtures';
import {
  paginationWithStateSourceWith,
  paginationSource,
  paginationSourceWith,
} from './pagination.source';

const LABEL_PREVIOUS = 'Ir para a página anterior';
const LABEL_NEXT = 'Ir para a próxima página';

const meta: Meta = {
  tags: ['navigation'],
  title: 'Components/Navigation/Pagination/Compositions',
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
        'aria-label': 'Paginação simples',
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A faixa mostra todos os números, sem reticências', async () => {
      // visual.item1 — é o estado que o Chromatic fotografa como "default".
      const numbered = canvasElement.querySelectorAll('[data-slot="pagination-link"]');
      await expect(numbered.length).toBe(5);
      await expect([...numbered].map((l) => l.textContent?.trim())).toEqual([
        '1', '2', '3', '4', '5',
      ]);
      await expect(
        canvasElement.querySelectorAll('[data-slot="pagination-ellipsis"]').length,
      ).toBe(0);
    });

    await step('A primeira página é a atual e Anterior está desabilitado', async () => {
      await expect(canvas.getByRole('button', { name: 'Ir para página 1' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      // Sem rota o controle é botão, e o desabilitado é o NATIVO: `disabled` já
      // tira da tabulação, barra o clique e se anuncia, sem atributo ARIA.
      await expect(canvas.getByRole('button', { name: LABEL_PREVIOUS })).toBeDisabled();
    });

    await step('Sem rota, todo controle é botão', async () => {
      // notes.item1 — a tag segue a rota. Sem asserção, voltar a emitir
      // `<a href="#">` passaria despercebido: a faixa fica idêntica na tela.
      for (const control of canvasElement.querySelectorAll(
        '[data-slot="pagination-link"], [data-slot="pagination-previous"], [data-slot="pagination-next"]',
      )) {
        await expect(control.tagName).toBe('BUTTON');
        await expect(control).toHaveAttribute('type', 'button');
        await expect(control.hasAttribute('href')).toBe(false);
      }
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
        transform: paginationSourceWith({
          total: 12,
          current: 6,
          'aria-label': 'Paginação com reticências',
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
        'aria-label': 'Paginação com reticências',
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
      await expect(canvas.getByRole('button', { name: 'Ir para página 1' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: 'Ir para página 12' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: 'Ir para página 6' })).toHaveAttribute(
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
        transform: paginationSourceWith({
          total: 10,
          current: 10,
          'aria-label': 'Paginação na última página',
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
        'aria-label': 'Paginação na última página',
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A página 10 é a atual', async () => {
      await expect(canvas.getByRole('button', { name: 'Ir para página 10' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    await step('Próxima está desabilitado e fora da tabulação', async () => {
      // Botão: `disabled` nativo faz as duas coisas de uma vez. O par
      // `aria-disabled` + `tabindex="-1"` é o caminho da ÂNCORA, e vale só
      // quando há rota — ver a story `Integrated with routing`.
      const next = canvas.getByRole('button', { name: LABEL_NEXT });
      await expect(next).toBeDisabled();
      await expect(next).not.toHaveAttribute('aria-disabled');
      await expect(next.hasAttribute('tabindex')).toBe(false);
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
        transform: paginationWithStateSourceWith({
          total: 8,
          current: 3,
          'aria-label': 'Paginação interativa',
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

    function reappendLine(): void {
      status.textContent = `Página ${current} de ${total}`;
      navContainer.replaceChildren(
        createPagination({
          total,
          current,
          showPrevNext: true,
          'aria-label': 'Paginação interativa',
          onPageChange: (page) => {
            current = page;
            reappendLine();
          },
        }),
      );
    }

    reappendLine();
    wrapper.append(status, navContainer);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const status = () => canvasElement.querySelector('[data-slot="pagina-atual"]');

    const irTo = async (n: number) => {
      // Par idempotente: só clica quando ainda não é a página atual. O painel
      // Interactions reexecuta a play no mesmo DOM, e um clique cego partiria
      // do estado que a rodada anterior deixou.
      const target = canvas.getByRole('button', { name: `Ir para página ${n}` });
      if (target.getAttribute('aria-current') !== 'page') await userEvent.click(target);
      await waitFor(() =>
        expect(canvas.getByRole('button', { name: `Ir para página ${n}` })).toHaveAttribute(
          'aria-current',
          'page',
        ),
      );
    };

    await step('Clicar numa página move o destaque e o contador', async () => {
      await irTo(4);
      await expect(status()).toHaveTextContent('Página 4 de 8');
    });

    await step('Só uma página é a atual em qualquer momento', async () => {
      await expect(canvasElement.querySelectorAll('[aria-current="page"]').length).toBe(1);
    });

    await step('O estado volta ao início para a próxima rodada', async () => {
      await irTo(3);
      await expect(status()).toHaveTextContent('Página 3 de 8');
    });
  },
};

// ─── Integrada a rota ─────────────────────────────────────────────────────────
//
// `hrefForPage` decide a TAG do controle. Com ele cada controle é `<a href>`:
// destino de verdade, abre em nova aba, é indexável, e o clique SEGUE — quem usa
// roteador de cliente o intercepta como interceptaria qualquer link da página.
// Sem ele o controle é `<button type="button">`, porque âncora vazia que age na
// própria página engana quem navega por teclado e por leitor de tela.

export const WithRoute: Story = {
  name: 'Integrated with routing',
  parameters: {
    // Override de story: `hrefForPage` é o assunto, e sem ele o snippet do meta
    // mostraria a faixa de botões, que é justamente o outro caminho.
    docs: {
      source: {
        transform: paginationSourceWith({
          total: 8,
          current: 3,
          'aria-label': 'Paginação por rota',
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
      'aria-label': 'Paginação por rota',
      hrefForPage: (page) => `?page=${page}`,
      onPageChange: (page) => {
        status.textContent = `Rota: ?page=${page}`;
      },
    });

    // O papel do roteador de cliente: ele assume a navegação e impede a ida
    // real. Numa aplicação seria `router.push(href)`; aqui basta que a story
    // não recarregue o iframe.
    nav.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
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
      // COM rota a tag é âncora — e é por ser âncora que o destino existe para
      // o "abrir em nova aba", para o indexador e para o roteador de cliente.
      await expect(pagina4.tagName).toBe('A');
      await expect(pagina4.getAttribute('href')).toBe('?page=4');
      await expect(
        canvas.getByRole('link', { name: LABEL_NEXT }).getAttribute('href'),
      ).toBe('?page=4');
      await expect(
        canvas.getByRole('link', { name: LABEL_PREVIOUS }).getAttribute('href'),
      ).toBe('?page=2');
    });

    await step('Com rota, o extremo desabilitado usa o par da âncora', async () => {
      // O outro mecanismo de desabilitado. Em `<a>` não existe `disabled`, e sem
      // asserção o par `aria-disabled` + `tabindex="-1"` seria promessa: a faixa
      // desta story está na página 3, longe dos dois extremos.
      const naPrimeira = createPagination({
        total: 8,
        current: 1,
        hrefForPage: (page) => `?page=${page}`,
        'aria-label': 'Paginação por rota, primeira página',
      });
      const previous = naPrimeira.querySelector('[data-slot="pagination-previous"]')!;
      await expect(previous.tagName).toBe('A');
      await expect(previous).toHaveAttribute('aria-disabled', 'true');
      await expect(previous).toHaveAttribute('tabindex', '-1');
      // Endereço válido no extremo convidaria a abrir uma página que não existe.
      await expect(previous.getAttribute('href')).toBe('#');
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
        transform: paginationSourceWith({
          total: 12,
          current: 2,
          align: 'end',
          'aria-label': 'Paginação do rodapé da tabela',
        }),
      },
    },
  },
  render: () => {
    // `nds-cluster` e não `nds-stack`: só o cluster tem data-align/data-justify,
    // e é ele que quebra a linha sozinho quando a largura aperta.
    const footer = document.createElement('div');
    footer.className =
      'nds-cluster nds-w-prose nds-border-default nds-rounded-lg nds-p-4';
    footer.dataset.spacing = 'sm';
    footer.dataset.align = 'center';
    footer.dataset.justify = 'between';

    const counter = document.createElement('span');
    counter.className = 'nds-text-body nds-text-muted-foreground';
    counter.textContent = 'Mostrando 11–20 de 120 resultados';

    footer.append(
      counter,
      createPagination({
        total: 12,
        current: 2,
        showPrevNext: true,
        align: 'end',
        'aria-label': 'Paginação do rodapé da tabela',
        onPageChange: () => {},
      }),
    );
    return footer;
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
      const footer = canvasElement.querySelector('.nds-cluster') as HTMLElement;
      await expect(getComputedStyle(footer).justifyContent).toBe('space-between');
      await expect(canvas.getByRole('button', { name: 'Ir para página 2' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });
  },
};

/**
 * O mesmo catálogo em inglês, montado por quem CHAMA a fábrica.
 *
 * Fora de uma story, quem monta isto é a docs page, lendo
 * `demonstration.labels.*` do conteúdo compartilhado; aqui o objeto é literal
 * para que a asserção compare com um texto que ela mesma enuncia.
 */
const LABELS_EN = {
  navigation: 'Pagination',
  previous: 'Go to the previous page',
  next: 'Go to the next page',
  page: (n: number) => `Go to page ${n}`,
  previousText: 'Previous',
  nextText: 'Next',
};

export const TranslatedLabels: Story = {
  name: 'Labels from the consumer (another language)',
  parameters: {
    // Override de story: o assunto É a opção `labels`, e o snippet do meta
    // mostraria a faixa em português — justamente o que esta story existe para
    // deixar de ser obrigatório.
    docs: {
      source: {
        transform: paginationSourceWith({
          total: 5,
          current: 2,
          labels:
            "{ navigation: 'Pagination', previous: 'Go to the previous page', "
            + "next: 'Go to the next page', page: (n) => `Go to page ${n}`, "
            + "previousText: 'Previous', nextText: 'Next' }",
        }),
      },
    },
  },
  render: () =>
    wrap(
      createPagination({
        total: 5,
        current: 2,
        showPrevNext: true,
        // Sem `'aria-label'`: aqui o nome do landmark vem do próprio catálogo,
        // que é o caminho de quem traduz a faixa inteira de uma vez.
        labels: LABELS_EN,
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O landmark é nomeado pelo catálogo recebido', async () => {
      const nav = canvas.getByRole('navigation', { name: 'Pagination' });
      await expect(nav).toHaveAttribute('data-slot', 'pagination');
    });

    await step('Todo controle numerado fala o idioma de quem chamou', async () => {
      // Até 2026-09-23 esta faixa anunciava "Ir para página 3" em português em
      // QUALQUER idioma: os rótulos eram constante de módulo sem caminho de
      // override, e só o nome do landmark aceitava valor de fora.
      for (let n = 1; n <= 5; n++) {
        await expect(
          canvas.getByRole('button', { name: `Go to page ${n}` }),
        ).toHaveAttribute('data-slot', 'pagination-link');
      }
      await expect(canvas.getByRole('button', { name: 'Go to page 2' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    await step('Os direcionais trocam o nome acessível E o texto visível', async () => {
      // São duas coisas diferentes: o nome acessível é a frase inteira, e o
      // texto visível é a palavra que `.nds-pagination-label` esconde em tela
      // estreita. Trocar só um deixaria a faixa bilíngue.
      const previous = canvas.getByRole('button', { name: 'Go to the previous page' });
      const next = canvas.getByRole('button', { name: 'Go to the next page' });
      await expect(previous).toHaveAttribute('data-slot', 'pagination-previous');
      await expect(next).toHaveAttribute('data-slot', 'pagination-next');
      await expect(previous.querySelector('.nds-pagination-label')).toHaveTextContent('Previous');
      await expect(next.querySelector('.nds-pagination-label')).toHaveTextContent('Next');
    });

    await step('O catálogo é PARCIAL: o que não vier continua no padrão', async () => {
      // Sem esta asserção, `labels` seria uma opção tudo-ou-nada, e quem
      // quisesse trocar uma palavra teria de redigitar as seis.
      const meia = createPagination({
        total: 3,
        current: 1,
        labels: { nextText: 'Next' },
      });
      await expect(
        meia.querySelector('[data-slot="pagination-next"] .nds-pagination-label'),
      ).toHaveTextContent('Next');
      await expect(meia.querySelector('[data-slot="pagination-next"]')).toHaveAttribute(
        'aria-label',
        PAGINATION_LABELS_DEFAULT.next,
      );
      await expect(meia.querySelector('[data-slot="pagination-link"]')).toHaveAttribute(
        'aria-label',
        PAGINATION_LABELS_DEFAULT.page(1),
      );
      await expect(meia).toHaveAttribute('aria-label', PAGINATION_LABELS_DEFAULT.navigation);
    });

    await step('O nome do landmark tem dono: a opção canônica vence o catálogo', async () => {
      const nomeado = createPagination({
        total: 3,
        current: 1,
        'aria-label': 'Pagination, search results',
        labels: LABELS_EN,
      });
      await expect(nomeado).toHaveAttribute('aria-label', 'Pagination, search results');
    });
  },
};
