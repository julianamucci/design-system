import type { Meta, StoryObj } from '@storybook/html';
import { createCalendar } from './calendar';

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
  title: 'UI/Calendar/Modos',
  parameters: {
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
    createCalendar({
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
};
