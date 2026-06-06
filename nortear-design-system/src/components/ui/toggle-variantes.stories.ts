import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { Bold, Italic, Eye } from 'lucide';
import { createToggle } from './toggle';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Toggle/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes de uso do Toggle: Default (sem borda, fundo `muted` quando pressionado), Outline (borda `input`), WithLabel (ícone + texto visível). Em icon-only, `aria-label` é OBRIGATÓRIO. O factory custom Basecoat já aplica `aria-pressed` + `data-state` automaticamente no click.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers locais ───────────────────────────────────────────────────────────

type LucideIconNode = [string, Record<string, string>];

function wrapIcon(icon: unknown, className = 'nds-icon-sm'): HTMLSpanElement {
  const span = document.createElement('span');
  span.style.display = 'inline-flex';
  span.appendChild(buildLucideSvg(icon, className));
  return span;
}

function buildLucideSvg(icon: unknown, className = 'nds-icon-sm'): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', className);
  for (const [tag, attrs] of icon as unknown as LucideIconNode[]) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => {
    const btn = createToggle({
      pressed: true,
      variant: 'default',
      children: wrapIcon(Bold),
    });
    btn.setAttribute('aria-label', 'Negrito');
    return btn;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Variante padrão (`variant="default"`) — sem borda, fundo transparente. No estado pressionado (`aria-pressed=true`), aplica `bg-accent` (data-state=on). Use em toolbars de formatação (negrito, itálico, sublinhado).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Toggle pressionado por padrão', async () => {
      const btn = canvas.getByRole('button');
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
      await expect(btn).toHaveAttribute('data-state', 'on');
    });
    await step('aria-label obrigatório presente', async () => {
      const btn = canvas.getByRole('button');
      await expect(btn).toHaveAttribute('aria-label', 'Negrito');
    });
  },
};

// ─── Outline ──────────────────────────────────────────────────────────────────

export const Outline: Story = {
  render: () => {
    const btn = createToggle({
      pressed: false,
      variant: 'outline',
      children: wrapIcon(Italic),
    });
    btn.setAttribute('aria-label', 'Itálico');
    return btn;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Variante `outline` — adiciona borda `input` e sombra `sm`. Útil quando o Toggle aparece isolado fora de uma toolbar (botão de filtro, ação solta). Mantém a mesma lógica de `aria-pressed` para estado on/off.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Toggle outline presente', async () => {
      const btn = canvas.getByRole('button');
      await expect(btn).toBeInTheDocument();
      await expect(btn.dataset.variant).toBe('outline');
    });
  },
};

// ─── WithLabel ────────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  render: () => {
    const wrap = document.createElement('span');
    wrap.className = 'nds-cluster';
    wrap.dataset.spacing = 'sm';
    wrap.style.display = 'inline-flex';
    wrap.appendChild(buildLucideSvg(Eye));
    const text = document.createElement('span');
    text.textContent = 'Mostrar ocultos';
    wrap.appendChild(text);

    const btn = createToggle({
      pressed: false,
      variant: 'outline',
      children: wrap,
    });
    // Texto visível dispensa aria-label
    return btn;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Toggle com ícone + texto visível — não precisa de `aria-label` (o leitor de tela usa o texto interno). Padrão para filtros e modos de exibição ("Mostrar ocultos", "Visão compacta").',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Texto visível presente', async () => {
      await expect(canvas.getByText('Mostrar ocultos')).toBeVisible();
    });
    await step('Toggle inicia não pressionado', async () => {
      const btn = canvas.getByRole('button');
      await expect(btn).toHaveAttribute('aria-pressed', 'false');
    });
  },
};
