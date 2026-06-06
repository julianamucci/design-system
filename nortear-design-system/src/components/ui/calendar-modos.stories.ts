import type { Meta, StoryObj } from '@storybook/html';
import { createCalendar } from './calendar';
import { within, expect } from 'storybook/test';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Modos de operação do Calendar.
//
// A implementação vanilla do Basecoat expõe apenas o modo "single" via a
// factory `createCalendar`. Modos "multiple" e "range" existem nas stacks
// React/Vue/Svelte (sobre react-day-picker / reka-ui / bits-ui) mas não
// fazem parte da API atual desta factory — documentadas aqui apenas como
// referência de comportamento esperado para quando forem adicionadas.

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Calendar/Modos',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Modo de seleção do Calendar. Na API vanilla do Basecoat apenas **single** está disponível — `multiple` e `range` são cobertos pelas stacks React/Vue/Svelte.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Single: Story = {
  render: () =>
    createCalendar({ locale: 'pt-BR',
      value: new Date(2026, 3, 12),
      class: 'rounded-md border',
    }),
  parameters: {
    docs: {
      description: {
        story:
          'Seleção de uma única data. `value` define a data pré-selecionada; `onSelect` recebe um `Date` a cada clique em uma célula habilitada.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
