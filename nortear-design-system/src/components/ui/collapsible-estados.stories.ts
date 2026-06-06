import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createCollapsible } from './collapsible';

const meta: Meta = {
  tags: ['disclosure'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Collapsible/Estados',
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeContent(items: string[]): HTMLElement {
  const div = document.createElement('div');
  div.className = 'nds-stack nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-mt-2';
  div.dataset.spacing = 'sm';
  for (const text of items) {
    const p = document.createElement('p');
    p.textContent = text;
    div.appendChild(p);
  }
  return div;
}

// ─── NaoControlado ────────────────────────────────────────────────────────────

export const NaoControlado: Story = {
  render: () =>
    createCollapsible({
      trigger: 'Exibir filtros avançados',
      content: makeContent(['Filtro avançado 1', 'Filtro avançado 2']),
      defaultOpen: false,
      class: 'nds-w-full nds-max-w-sm',
    }),
  parameters: {
    docs: {
      description: {
        story: 'Modo não-controlado. O estado é gerenciado internamente pelo componente. Use quando não há necessidade de compartilhar o estado com outros elementos.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('Trigger começa fechado (aria-expanded=false)', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar no trigger expande o painel', async () => {
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar novamente recolhe o painel', async () => {
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

// ─── AbertoporPadrao ─────────────────────────────────────────────────────────

export const AbertoporPadrao: Story = {
  render: () =>
    createCollapsible({
      trigger: 'Ocultar filtros avançados',
      content: makeContent(['Filtro avançado 1', 'Filtro avançado 2']),
      defaultOpen: true,
      class: 'nds-w-full nds-max-w-sm',
    }),
  parameters: {
    docs: {
      description: {
        story: 'Modo não-controlado com <code>defaultOpen: true</code>. O painel renderiza expandido na montagem sem controle externo de estado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('Trigger começa aberto (aria-expanded=true)', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar no trigger recolhe o painel', async () => {
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () =>
    createCollapsible({
      trigger: 'Filtros avançados (desabilitado)',
      content: makeContent(['Filtro avançado 1', 'Filtro avançado 2']),
      disabled: true,
      class: 'nds-w-full nds-max-w-sm',
    }),
  parameters: {
    docs: {
      description: {
        story: 'Estado desabilitado. O trigger não responde a cliques nem a interações de teclado. Aparência visual de opacidade reduzida.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('Trigger está desabilitado', async () => {
      await expect(trigger).toBeDisabled();
    });

    await step('Clique no trigger desabilitado não altera o estado', async () => {
      await userEvent.click(trigger, { pointerEventsCheck: 0 });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
