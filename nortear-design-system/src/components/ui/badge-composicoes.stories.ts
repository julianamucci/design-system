import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { Check, Bell } from 'lucide';
import { createBadge, type BadgeVariant } from './badge';

const meta: Meta = {
  tags: ['feedback'],
  title: 'UI/Badge/Composicoes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes reais: Badge com ícone SVG, como contagem de notificações, ' +
          'envolvido em <a> para link e em <button> para trigger clicável.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers: ícones Lucide como SVG vanilla ─────────────────────────────────

type LucideIconNode = [string, Record<string, string>];

function createIcon(nodes: LucideIconNode[], className = ''): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  // default sizing: 0.75rem with right margin; consumers may override via className
  if (!className) {
    svg.setAttribute('class', 'nds-icon');
    svg.style.width = '0.75rem';
    svg.style.height = '0.75rem';
    svg.style.marginRight = '0.25rem';
  } else {
    svg.setAttribute('class', className);
  }

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

// ─── Composicoes ──────────────────────────────────────────────────────────────

export const WithIcon: Story = {
  render: () => {
    const icon = createIcon(Check as unknown as LucideIconNode[]);
    return makeBadge('default', icon as unknown as HTMLElement, 'Ativo');
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Ativo')).toBeVisible();

    const svg = canvasElement.querySelector('.nds-badge svg');
    await expect(svg).not.toBeNull();
    await expect(svg?.getAttribute('aria-hidden')).toBe('true');
  },
};

export const CountBadge: Story = {
  render: () => {
    const wrap = document.createElement('span');
    wrap.setAttribute('role', 'status');
    wrap.setAttribute('aria-label', '12 notificações não lidas');
    wrap.className = 'nds-cluster';
    wrap.dataset.spacing = 'sm';
    wrap.style.display = 'inline-flex';

    const bell = createIcon(Bell as unknown as LucideIconNode[], 'nds-text-foreground');
    bell.style.width = '1.25rem';
    bell.style.height = '1.25rem';
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
    link.style.display = 'inline-flex';
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
    const badge = link?.querySelector('.nds-badge-secondary');
    await expect(badge).not.toBeNull();
  },
};

export const AsButton: Story = {
  render: () => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nds-bg-transparent nds-cursor-pointer nds-rounded-md';
    btn.style.display = 'inline-flex';
    btn.style.padding = '0';
    btn.style.border = '0';
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
    const badge = btn.querySelector('.nds-badge-outline');
    await expect(badge).not.toBeNull();
  },
};
