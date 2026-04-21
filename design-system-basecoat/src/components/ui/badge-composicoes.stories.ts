import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { Check, Bell } from 'lucide';
import { createBadge, type BadgeVariant } from './badge';

const meta: Meta = {
  title: 'UI/Badge/Composições',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composições reais: Badge com ícone SVG, como contagem de notificações, ' +
          'envolvido em <a> para link e em <button> para trigger clicável.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers: ícones Lucide como SVG vanilla ─────────────────────────────────

type LucideIconNode = [string, Record<string, string>];

function createIcon(nodes: LucideIconNode[], className = 'size-3 mr-1'): SVGSVGElement {
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

  for (const [tag, attrs] of nodes) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

function makeBadge(variant: BadgeVariant, ...children: Array<string | HTMLElement>): HTMLElement {
  return createBadge({ variant, children });
}

// ─── Composições ──────────────────────────────────────────────────────────────

export const WithIcon: Story = {
  render: () => {
    const icon = createIcon(Check as unknown as LucideIconNode[]);
    return makeBadge('default', icon, 'Ativo');
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Ativo')).toBeVisible();

    const svg = canvasElement.querySelector('.badge svg');
    await expect(svg).not.toBeNull();
    await expect(svg?.getAttribute('aria-hidden')).toBe('true');
  },
};

export const CountBadge: Story = {
  render: () => {
    const wrap = document.createElement('span');
    wrap.setAttribute('role', 'status');
    wrap.setAttribute('aria-label', '12 notificações não lidas');
    wrap.className = 'inline-flex items-center gap-2';

    const bell = createIcon(Bell as unknown as LucideIconNode[], 'size-5 text-foreground');
    bell.removeAttribute('aria-hidden');
    bell.setAttribute('aria-hidden', 'true');

    const badge = createBadge({ variant: 'destructive', children: '12' });
    wrap.append(bell, badge);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('12')).toBeVisible();

    const status = canvasElement.querySelector('[role="status"]');
    await expect(status).not.toBeNull();
    await expect(status?.getAttribute('aria-label')).toBe('12 notificações não lidas');
  },
};

export const AsLink: Story = {
  render: () => {
    const link = document.createElement('a');
    link.href = '#design';
    link.className = 'inline-flex';
    link.setAttribute('aria-label', 'Ver todos os itens da categoria Design');
    link.appendChild(createBadge({ variant: 'secondary', children: 'Design' }));
    return link;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Design')).toBeVisible();

    const link = canvasElement.querySelector('a');
    await expect(link).not.toBeNull();
    await expect(link?.getAttribute('aria-label')).toBe('Ver todos os itens da categoria Design');
    // Badge fica como filho do link — é o link que é focável.
    const badge = link?.querySelector('.badge.badge-secondary');
    await expect(badge).not.toBeNull();
  },
};

export const AsButton: Story = {
  render: () => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'inline-flex bg-transparent p-0 border-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:outline-none rounded-md';
    btn.setAttribute('aria-label', 'Filtrar por React');
    btn.appendChild(createBadge({ variant: 'outline', children: 'React' }));
    return btn;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('React')).toBeVisible();

    const btn = canvas.getByRole('button', { name: 'Filtrar por React' });
    await expect(btn).toBeVisible();
    // O botão é o elemento focável — o Badge interno permanece decorativo.
    const badge = btn.querySelector('.badge.badge-outline');
    await expect(badge).not.toBeNull();
  },
};
