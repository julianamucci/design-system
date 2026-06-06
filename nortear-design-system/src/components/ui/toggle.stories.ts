import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { Bold } from 'lucide';
import { createToggle } from './toggle';
import { createToggleDocs } from '@/components/docs/ToggleDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Lucide → SVG (vanilla) ───────────────────────────────────────────────────

type LucideIconNode = [string, Record<string, string>];

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

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ToggleArgs = {
  pressed: boolean;
  disabled: boolean;
  variant: 'default' | 'outline';
  size: 'default' | 'sm' | 'lg';
  label: string;
  ariaLabel: string;
};

const meta: Meta<ToggleArgs> = {
  title: 'UI/Toggle',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createToggleDocs) },
  },
  argTypes: {
    pressed: {
      control: 'boolean',
      description: 'Estado inicial pressionado (não-controlado no Basecoat).',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o Toggle.',
    },
    variant: {
      control: { type: 'inline-radio' },
      options: ['default', 'outline'],
      description: 'Estilo visual — `outline` adiciona borda `input`.',
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'sm', 'lg'],
      description: 'Altura via tokens `--height-*`.',
    },
    label: {
      control: 'text',
      description: 'Texto visível ao lado do ícone. Vazio = toggle icon-only.',
    },
    ariaLabel: {
      control: 'text',
      description: 'aria-label — OBRIGATÓRIO em toggles icon-only (sem label visível).',
    },
  },
  args: {
    pressed: false,
    disabled: false,
    variant: 'default',
    size: 'default',
    label: '',
    ariaLabel: 'Negrito',
  },
};

export default meta;
type Story = StoryObj<ToggleArgs>;

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildPlaygroundToggle(args: ToggleArgs): HTMLElement {
  let children: HTMLElement;
  if (args.label) {
    children = document.createElement('span');
    children.className = 'nds-cluster nds-inline-block';
    children.dataset.spacing = 'sm';
    children.style.display = 'inline-flex';
    children.appendChild(buildLucideSvg(Bold));
    const text = document.createElement('span');
    text.textContent = args.label;
    children.appendChild(text);
  } else {
    // icon-only — usamos o ícone como filho
    const wrap = document.createElement('span');
    wrap.style.display = 'inline-flex';
    wrap.appendChild(buildLucideSvg(Bold));
    children = wrap;
  }

  const btn = createToggle({
    pressed: args.pressed,
    disabled: args.disabled,
    variant: args.variant,
    size: args.size,
    children,
  });

  // aria-label obrigatório para icon-only
  if (!args.label && args.ariaLabel) {
    btn.setAttribute('aria-label', args.ariaLabel);
  }

  return btn;
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => buildPlaygroundToggle(args),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Toggle presente no DOM', async () => {
      const btn = canvas.getByRole('button');
      await expect(btn).toBeInTheDocument();
    });

    await step('aria-pressed reflete o estado inicial', async () => {
      const btn = canvas.getByRole('button');
      await expect(btn).toHaveAttribute('aria-pressed', 'false');
    });

    await step('Clique alterna para pressionado', async () => {
      const btn = canvas.getByRole('button');
      await userEvent.click(btn);
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
      await expect(btn).toHaveAttribute('data-state', 'on');
    });

    await step('Space alterna o estado', async () => {
      const btn = canvas.getByRole('button');
      (btn as HTMLElement).focus();
      await userEvent.keyboard(' ');
      await expect(btn).toHaveAttribute('aria-pressed', 'false');
    });

    await step('Enter alterna o estado', async () => {
      const btn = canvas.getByRole('button');
      (btn as HTMLElement).focus();
      await userEvent.keyboard('{Enter}');
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
    });
  },
};
