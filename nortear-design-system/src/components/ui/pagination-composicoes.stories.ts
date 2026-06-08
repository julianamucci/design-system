import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createPagination } from './pagination';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/Pagination/Composicoes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do Pagination: Simples (5 páginas, sem ellipsis), ComEllipsis (12 páginas com … entre 1, atual e total), UltimaPagina (Next desabilitado) e Interativo (estado controlado por re-render). NOTA: a factory createPagination (Basecoat) não tem estado interno — para SPA real, mantenha `current` no escopo do consumidor e re-monte o nav a cada onPageChange.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement, minHeight = 120): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full nds-p-2';
  wrapper.dataset.justify = 'center';
  wrapper.style.minHeight = `${minHeight}px`;
  wrapper.appendChild(child);
  return wrapper;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Simples: Story = {
  name: 'Simples (5 páginas)',
  render: () =>
    wrap(
      createPagination({
        total: 5,
        current: 1,
        showPrevNext: true,
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Renderiza 5 links numerados + Prev + Next', async () => {
      const links = canvas.getAllByRole('link');
      // 5 numerados + Previous + Next = 7
      await expect(links.length).toBe(7);
    });
    await step('Sem ellipsis (total <= 7)', async () => {
      const ellipsis = canvasElement.querySelector('span[aria-hidden="true"]');
      // Pode existir <span aria-hidden> dos chevrons SVG; checamos texto "…"
      const hasEllipsisChar = !!Array.from(canvasElement.querySelectorAll('span')).find(
        (s) => s.textContent === '…',
      );
      await expect(hasEllipsisChar).toBe(false);
      void ellipsis;
    });
  },
};

export const ComEllipsis: Story = {
  name: 'Com Ellipsis (12 páginas, atual=6)',
  render: () =>
    wrap(
      createPagination({
        total: 12,
        current: 6,
        showPrevNext: true,
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    await step('Renderiza pelo menos um caractere "…"', async () => {
      const hasEllipsis = !!Array.from(canvasElement.querySelectorAll('span')).find(
        (s) => s.textContent === '…',
      );
      await expect(hasEllipsis).toBe(true);
    });
    await step('Página atual = 6', async () => {
      const current = canvasElement.querySelector('a[aria-current="page"]');
      await expect(current?.textContent?.trim()).toBe('6');
    });
    await step('Primeira (1) e última (12) sempre visíveis', async () => {
      const links = Array.from(canvasElement.querySelectorAll('a')).map((a) =>
        (a.textContent ?? '').trim(),
      );
      await expect(links).toContain('1');
      await expect(links).toContain('12');
    });
  },
};

export const UltimaPagina: Story = {
  name: 'Última página (Next desabilitado)',
  render: () =>
    wrap(
      createPagination({
        total: 10,
        current: 10,
        showPrevNext: true,
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    await step('Página 10 ativa', async () => {
      const current = canvasElement.querySelector('a[aria-current="page"]');
      await expect(current?.textContent?.trim()).toBe('10');
    });
    await step('Next está desabilitado', async () => {
      const next = canvasElement.querySelector('a[aria-label="Go to next page"]');
      await expect(next).toHaveAttribute('aria-disabled', 'true');
    });
  },
};

export const Interativo: Story = {
  name: 'Interativo (estado controlado externamente)',
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.contain = 'layout';
    wrapper.className = 'nds-stack nds-w-full nds-p-2';
    wrapper.dataset.spacing = 'sm';
    wrapper.style.minHeight = '160px';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';

    const status = document.createElement('p');
    status.className = 'nds-text-body nds-text-muted-foreground';
    status.dataset.testid = 'page-status';

    const total = 8;
    let current = 3;

    const navContainer = document.createElement('div');

    function rerender() {
      status.textContent = `Página ${current} de ${total}`;
      const nav = createPagination({
        total,
        current,
        showPrevNext: true,
        onPageChange: (page) => {
          current = page;
          rerender();
        },
      });
      navContainer.replaceChildren(nav);
    }

    rerender();
    wrapper.append(status, navContainer);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const status = canvasElement.querySelector('[data-testid="page-status"]');

    await step('Status inicial: Página 3 de 8', async () => {
      await expect(status?.textContent).toMatch(/Página 3 de 8/);
    });

    await step('Click em "4" atualiza status para Página 4', async () => {
      // Com total=8 e current=3, o algoritmo de páginas retorna
      // [1, 2, 3, 4, ellipsis, 8] — então clicamos no vizinho "4".
      const links = canvas.getAllByRole('link');
      const four = links.find((a) => (a.textContent ?? '').trim() === '4');
      if (!four) throw new Error('link "4" não encontrado');
      await userEvent.click(four);
      await waitFor(() => {
        if (!/Página 4 de 8/.test(status?.textContent ?? '')) {
          throw new Error('status não atualizou para 4');
        }
      });
    });

    await step('Click em Next leva para página 5', async () => {
      const next = canvasElement.querySelector<HTMLAnchorElement>(
        'a[aria-label="Go to next page"]',
      );
      if (!next) throw new Error('Next não encontrado');
      await userEvent.click(next);
      await waitFor(() => {
        if (!/Página 5 de 8/.test(status?.textContent ?? '')) {
          throw new Error('status não atualizou para 5');
        }
      });
    });
  },
};
