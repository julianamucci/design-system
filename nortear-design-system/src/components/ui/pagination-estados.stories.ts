import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createPagination } from './pagination';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/Pagination/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Pagination: Default (link inativo), Hover (fundo accent), Active (aria-current="page"), Disabled (Previous na primeira página ou Next na última, com pointer-events-none + opacity-50) e Focus (anel ring-ring visível ao Tab).',
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
        current: 3,
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    await step('Link inativo não tem aria-current', async () => {
      const inactive = canvasElement.querySelector('a:not([aria-current])');
      await expect(inactive).toBeTruthy();
    });
  },
};

export const Active: Story = {
  name: 'Active (página atual)',
  render: () =>
    wrap(
      createPagination({
        total: 7,
        current: 3,
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    await step('Página atual marcada com aria-current="page"', async () => {
      const current = canvasElement.querySelector('a[aria-current="page"]');
      await expect(current).toBeTruthy();
      await expect(current?.textContent?.trim()).toBe('3');
    });
  },
};

export const DisabledFirst: Story = {
  name: 'Disabled (Previous na primeira página)',
  render: () =>
    wrap(
      createPagination({
        total: 10,
        current: 1,
        showPrevNext: true,
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    await step('Previous está desabilitado (aria-disabled=true)', async () => {
      const prev = canvasElement.querySelector('a[aria-label="Go to previous page"]');
      await expect(prev).toHaveAttribute('aria-disabled', 'true');
    });
    await step('Next continua habilitado', async () => {
      const next = canvasElement.querySelector('a[aria-label="Go to next page"]');
      await expect(next).not.toHaveAttribute('aria-disabled', 'true');
    });
  },
};

export const DisabledLast: Story = {
  name: 'Disabled (Next na última página)',
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
    await step('Next está desabilitado (aria-disabled=true)', async () => {
      const next = canvasElement.querySelector('a[aria-label="Go to next page"]');
      await expect(next).toHaveAttribute('aria-disabled', 'true');
    });
    await step('Previous continua habilitado', async () => {
      const prev = canvasElement.querySelector('a[aria-label="Go to previous page"]');
      await expect(prev).not.toHaveAttribute('aria-disabled', 'true');
    });
  },
};

export const Focus: Story = {
  name: 'Focus (Tab)',
  render: () =>
    wrap(
      createPagination({
        total: 5,
        current: 2,
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Tab move foco para o primeiro link interativo', async () => {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement | null;
      await expect(focused?.tagName).toBe('A');
    });
    await step('Primeiro link recebe foco via Tab', async () => {
      const links = canvas.getAllByRole('link');
      await expect(links[0]).toHaveClass('nds-pagination-link');
      await expect(document.activeElement).toBe(links[0]);
    });
  },
};
