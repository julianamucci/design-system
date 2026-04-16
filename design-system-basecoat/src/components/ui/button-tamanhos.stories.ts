import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90';

function btn(label: string, sizeClass: string, extraAttrs: Record<string, string> = {}): HTMLButtonElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `${BTN_BASE} ${sizeClass}`;
  el.textContent = label;
  Object.entries(extraAttrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function svgIcon(sizeClass = 'h-4 w-4'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${sizeClass}"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/Button/Tamanhos',
};

export default meta;
type Story = StoryObj;

// ─── Small ────────────────────────────────────────────────────────────────────

export const Small: Story = {
  render: () => btn('Botão', 'h-8 px-3 rounded-md'),
  parameters: {
    docs: {
      description: {
        story: 'Tamanho compacto (h-8) para contextos com espaço reduzido — toolbars, tabelas e cards densos.',
      },
    },
  },
};

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => btn('Botão', 'h-9 px-4 py-2'),
  parameters: {
    docs: {
      description: {
        story: 'Tamanho padrão (h-9). Adequado para a maioria dos contextos de interface.',
      },
    },
  },
};

// ─── Large ────────────────────────────────────────────────────────────────────

export const Large: Story = {
  render: () => btn('Botão', 'h-10 px-6 rounded-md'),
  parameters: {
    docs: {
      description: {
        story: 'Tamanho expandido (h-10) para CTAs de destaque — hero sections e landing pages.',
      },
    },
  },
};

// ─── IconOnly ─────────────────────────────────────────────────────────────────

export const IconOnly: Story = {
  render: () => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `${BTN_BASE} size-9`;
    el.setAttribute('aria-label', 'Fechar');
    el.innerHTML = svgIcon();
    return el;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Botão icon-only possui aria-label acessível', async () => {
      const button = canvas.getByRole('button', { name: 'Fechar' });
      await expect(button).toHaveAttribute('aria-label', 'Fechar');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tamanho quadrado (size-9). **Obrigatório** passar `aria-label` descritivo — sem ele o botão é inacessível para leitores de tela.',
      },
    },
  },
};
