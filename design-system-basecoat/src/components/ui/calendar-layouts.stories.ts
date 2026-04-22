import type { Meta, StoryObj } from '@storybook/html';
import { createCalendar } from './calendar';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Layouts do Calendar.
//
// A factory vanilla `createCalendar` do Basecoat não expõe `captionLayout`,
// `showWeekNumber` ou `numberOfMonths`. Os layouts cobertos aqui são aqueles
// realmente alcançáveis via a API atual:
//  - CaptionLabel  → legenda em texto (padrão, única disponível)
//  - Bordered      → card com borda + radius reforçando integração visual
//
// Quando a factory for estendida para captionLayout/numberOfMonths/weekNumber,
// novas stories poderão ser adicionadas replicando as das stacks React/Vue/Svelte.

const meta: Meta = {
  title: 'UI/Calendar/Layouts',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Layouts disponíveis na API vanilla do Basecoat. `captionLayout="dropdown"`, `numberOfMonths` e `showWeekNumber` são exclusivos das stacks com react-day-picker/reka-ui/bits-ui.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const CaptionLabel: Story = {
  render: () =>
    createCalendar({
      value: new Date(2026, 3, 12),
      class: 'rounded-md border',
    }),
  parameters: {
    docs: {
      description: {
        story:
          'Legenda padrão em texto: "April 2026". Navegação feita pelos botões Prev/Next (`aria-label="Go to previous/next month"`).',
      },
    },
  },
};

export const Bordered: Story = {
  render: () =>
    createCalendar({
      value: new Date(2026, 3, 12),
      class: 'rounded-md border shadow-sm',
    }),
  parameters: {
    docs: {
      description: {
        story:
          'Layout com borda + sombra sutil — útil para isolar o Calendar de um fundo uniforme (ex: inline em página, fora de Popover).',
      },
    },
  },
};

export const Bare: Story = {
  render: () => createCalendar({ value: new Date(2026, 3, 12) }),
  parameters: {
    docs: {
      description: {
        story:
          'Sem classes adicionais — apenas o `p-3 select-none` aplicado pela factory. Ideal para encaixar o Calendar dentro de Popover ou DropdownMenu, onde o wrapper pai já define borda/shadow.',
      },
    },
  },
};
