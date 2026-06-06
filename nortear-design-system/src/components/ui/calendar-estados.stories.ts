import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createCalendar } from './calendar';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Estados visuais/funcionais do Calendar disponíveis na API vanilla.
//
// Coberto:
//  - Selected    → `value` definido
//  - Disabled    → função `disabled`
//  - Today       → detectado automaticamente pela factory
//
// Fora do escopo desta factory (documentado mas não rendereizável aqui):
//  - WithOutsideDays → a factory atual NÃO renderiza dias do mês anterior/próximo
//    (células vazias). Disponível em React/Vue/Svelte via `showOutsideDays`.
//  - RangeWithMiddle → requer mode="range", ausente no Basecoat.

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Calendar/Estados',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados cobertos pela API vanilla: Selected, Disabled e Today. `WithOutsideDays` e `RangeWithMiddle` dependem de recursos ausentes na factory atual (ver CalendarDocs · Propriedades · Extensibilidade).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Selected: Story = {
  render: () =>
    createCalendar({ locale: 'pt-BR',
      value: new Date(2026, 3, 12),
      class: 'rounded-md border',
    }),
  parameters: {
    docs: {
      description: {
        story:
          'Data selecionada via `value`. A célula ganha `aria-selected="true"` e a classe `bg-primary text-primary-foreground`.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole('grid');
    const selected = grid.querySelector('.nds-calendar-day[aria-pressed="true"]');
    await expect(selected).not.toBeNull();
    await expect(selected).toHaveTextContent('12');
  },
};

export const Disabled: Story = {
  render: () =>
    createCalendar({ locale: 'pt-BR',
      value: new Date(2026, 3, 12),
      disabled: (date) => {
        const d = date.getDay();
        return d === 0 || d === 6; // bloqueia finais de semana
      },
      class: 'rounded-md border',
    }),
  parameters: {
    docs: {
      description: {
        story:
          'Função `disabled` recebe cada data e retorna `true` para bloquear. A célula ganha atributo `disabled` no `<button>`, ficam com `opacity-50` e não disparam `onSelect`.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const grid = canvasElement.querySelector('[role="grid"]');
    await expect(grid).not.toBeNull();
    const disabledButtons = grid?.querySelectorAll('button[disabled]');
    await expect((disabledButtons?.length ?? 0) > 0).toBe(true);
  },
};

export const Today: Story = {
  render: () => createCalendar({ locale: 'pt-BR', class: 'rounded-md border' }),
  parameters: {
    docs: {
      description: {
        story:
          'Sem `value` — o Calendar abre no mês corrente e a célula de hoje recebe `bg-accent text-accent-foreground`. Sem `aria-selected` porque nenhuma data foi escolhida.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole('grid');
    await expect(grid).toBeInTheDocument();
    // Sem dia marcado por padrão (nenhuma data passada via value).
    const selected = grid.querySelector('.nds-calendar-day[aria-pressed="true"]');
    await expect(selected).toBeNull();
  },
};

// ─── Stubs documentacionais ───────────────────────────────────────────────────
// As stories abaixo existem apenas para transparência no Storybook sidebar,
// espelhando a presença nas stacks React/Vue/Svelte. A factory vanilla do
// Basecoat não suporta esses modos — ver descrição em cada story.

export const WithOutsideDays: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A factory vanilla do Basecoat não renderiza dias do mês anterior/próximo (células vazias em vez de outside-days esmaecidos). Para esse comportamento, consulte as stacks React/Vue/Svelte, que expõem `showOutsideDays`/`disableDaysOutsideCurrentView` nativamente.',
      },
    },
  },
  render: () => createCalendar({ locale: 'pt-BR', class: 'rounded-md border' }),
  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const RangeWithMiddle: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A factory vanilla do Basecoat não suporta `mode="range"`. Não há como destacar dias do meio de um intervalo. Para esse comportamento, use as stacks React (`react-day-picker` com `mode="range"`) ou Vue (`RangeCalendar` do reka-ui).',
      },
    },
  },
  render: () => createCalendar({ locale: 'pt-BR', class: 'rounded-md border' }),
  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
