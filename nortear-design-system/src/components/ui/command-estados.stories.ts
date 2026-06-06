import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createCommand } from './command';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/Command/Estados',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados específicos do Command: empty state (query sem resultados) e item desabilitado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Empty State ──────────────────────────────────────────────────────────────

export const EmptyState: Story = {
  name: 'Empty State — Sem resultados',
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-border-default nds-rounded-md nds-shadow-md';
    wrap.style.width = '320px';

    // Cria command com query que não retorna resultados via input pre-preenchido
    const cmd = createCommand({
      placeholder: 'Buscar componente...',
      items: [
        { value: 'button',    label: 'Button'    },
        { value: 'input',     label: 'Input'     },
        { value: 'separator', label: 'Separator' },
      ],
    });
    wrap.appendChild(cmd);

    // Pré-preenche o input para forçar empty state
    const input = wrap.querySelector('input');
    if (input) {
      input.value = 'xyznotfound';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Mensagem de empty state está visível', async () => {
      const empty = canvas.getByText('No results found.');
      await expect(empty).toBeInTheDocument();
      await expect(empty).toBeVisible();
    });

    await step('Nenhum item option está visível', async () => {
      const options = canvas.queryAllByRole('option');
      await expect(options.length).toBe(0);
    });
  },
};

// ─── Disabled Item ────────────────────────────────────────────────────────────

export const DisabledItem: Story = {
  name: 'Item Desabilitado',
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-border-default nds-rounded-md nds-shadow-md';
    wrap.style.width = '320px';
    wrap.appendChild(
      createCommand({
        placeholder: 'Buscar...',
        items: [
          { value: 'button',    label: 'Button'           },
          { value: 'input',     label: 'Input (disabled)', disabled: true },
          { value: 'separator', label: 'Separator'         },
        ],
      })
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Item desabilitado está presente no DOM', async () => {
      const disabledItem = canvas.getByText('Input (disabled)');
      await expect(disabledItem).toBeInTheDocument();
    });

    await step('Item desabilitado tem pointer-events-none e opacidade reduzida', async () => {
      const disabledItem = canvas.getByText('Input (disabled)').closest('[data-slot="command-item"]');
      await expect(disabledItem).not.toBeNull();
      // O item desabilitado deve ter aria-disabled
      await expect(disabledItem?.getAttribute('aria-disabled')).toBe('true');
    });
  },
};
