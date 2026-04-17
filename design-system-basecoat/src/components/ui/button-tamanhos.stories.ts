import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function btn(label: string, cls: string, extraAttrs: Record<string, string> = {}): HTMLButtonElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = cls;
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
  render: () => btn('Botão', 'btn-sm'),
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
  render: () => btn('Botão', 'btn'),
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
  render: () => btn('Botão', 'btn-lg'),
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
    el.className = 'btn-icon';
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
