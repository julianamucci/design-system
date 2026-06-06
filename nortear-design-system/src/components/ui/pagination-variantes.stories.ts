import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createPagination } from './pagination';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/Pagination/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Pagination: Default (link inativo, ghost), Active (página atual com aria-current="page" e estilo destacado) e Directional (Previous/Next com ícone). NOTA: o factory createPagination (Basecoat) não expõe prop `variant` — a variante "active" é aplicada internamente quando `page === current`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement, minHeight = 100): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full nds-p-2';
  wrapper.dataset.justify = 'center';
  wrapper.style.minHeight = `${minHeight}px`;
  wrapper.appendChild(child);
  return wrapper;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default',
  render: () =>
    wrap(
      createPagination({
        total: 5,
        current: 2,
        showPrevNext: false,
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('5 links numerados visíveis (sem Prev/Next)', async () => {
      const links = canvas.getAllByRole('link');
      await expect(links.length).toBe(5);
    });
    await step('Apenas 1 link com aria-current="page"', async () => {
      const current = canvasElement.querySelectorAll('a[aria-current="page"]');
      await expect(current.length).toBe(1);
    });
  },
};

export const Active: Story = {
  name: 'Active (página atual)',
  render: () => {
    const nav = createPagination({
      total: 7,
      current: 4,
      showPrevNext: false,
      onPageChange: () => {},
    });
    // Reforça visualmente o "outline" da variante active (factory marca apenas
    // aria-current + pointer-events-none — aqui acrescentamos border para parity).
    const current = nav.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
    if (current) current.classList.add('nds-border-default');
    return wrap(nav);
  },
  play: async ({ canvasElement, step }) => {
    await step('Link 4 marcado com aria-current="page"', async () => {
      const current = canvasElement.querySelector('a[aria-current="page"]');
      await expect(current).toBeTruthy();
      await expect(current?.textContent?.trim()).toBe('4');
    });
    await step('Link ativo marcado via aria-current=page (não navega)', async () => {
      const current = canvasElement.querySelector('a[aria-current="page"]');
      await expect(current).toHaveAttribute('aria-current', 'page');
    });
  },
};

export const Directional: Story = {
  name: 'Directional (Previous/Next)',
  render: () =>
    wrap(
      createPagination({
        total: 8,
        current: 4,
        showPrevNext: true,
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    await step('Previous e Next presentes com aria-label', async () => {
      const prev = canvasElement.querySelector('a[aria-label="Go to previous page"]');
      const next = canvasElement.querySelector('a[aria-label="Go to next page"]');
      await expect(prev).toBeTruthy();
      await expect(next).toBeTruthy();
    });
    await step('Ambos contêm um <svg> (ícone chevron)', async () => {
      const prev = canvasElement.querySelector('a[aria-label="Go to previous page"] svg');
      const next = canvasElement.querySelector('a[aria-label="Go to next page"] svg');
      await expect(prev).toBeTruthy();
      await expect(next).toBeTruthy();
    });
  },
};
