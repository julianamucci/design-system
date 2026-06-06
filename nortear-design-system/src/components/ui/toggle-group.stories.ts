import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide';
import { createToggleGroup, type ToggleGroupItem } from './toggle-group';
import { createToggleGroupDocs } from '@/components/docs/ToggleGroupDocs';
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

function injectIcons(group: HTMLElement, icons: unknown[]): void {
  // Basecoat: createToggle usa textContent quando `children` é string —
  // injetamos o SVG via DOM API após criar o grupo.
  group.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]').forEach((btn, i) => {
    btn.textContent = '';
    const wrap = document.createElement('span');
    wrap.style.display = 'inline-flex';
    wrap.appendChild(buildLucideSvg(icons[i]));
    btn.appendChild(wrap);
  });
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ToggleGroupArgs = {
  type: 'single' | 'multiple';
  variant: 'default' | 'outline';
  orientation: 'horizontal' | 'vertical';
  ariaLabel: string;
};

const meta: Meta<ToggleGroupArgs> = {
  title: 'UI/ToggleGroup',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createToggleGroupDocs) },
  },
  argTypes: {
    type: {
      control: { type: 'inline-radio' },
      options: ['single', 'multiple'],
      description: 'Modo de seleção. `single` = string, `multiple` = string[].',
    },
    variant: {
      control: { type: 'inline-radio' },
      options: ['default', 'outline'],
      description: 'Estilo visual herdado pelos items.',
    },
    orientation: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Orientação visual. Basecoat: factory não expõe — aplicado via classList no playground.',
    },
    ariaLabel: {
      control: 'text',
      description: 'aria-label do grupo — OBRIGATÓRIO.',
    },
  },
  args: {
    type: 'single',
    variant: 'outline',
    orientation: 'horizontal',
    ariaLabel: 'Alinhamento do texto',
  },
};

export default meta;
type Story = StoryObj<ToggleGroupArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const items: ToggleGroupItem[] = [
      { value: 'left',   children: '' },
      { value: 'center', children: '' },
      { value: 'right',  children: '' },
    ];
    const itemLabels = ['Alinhar à esquerda', 'Centralizar', 'Alinhar à direita'];

    const group = createToggleGroup({
      type: args.type,
      variant: args.variant,
      items,
      defaultValue: args.type === 'single' ? 'left' : ['left'],
    });

    // Injeta SVGs (factory usa textContent quando children é string)
    injectIcons(group, [AlignLeft, AlignCenter, AlignRight]);

    // aria-label OBRIGATÓRIO no grupo
    group.setAttribute('aria-label', args.ariaLabel);
    group.setAttribute('aria-orientation', args.orientation);

    if (args.orientation === 'vertical') {
      group.classList.remove('flex-row');
      group.style.flexDirection = 'column';
      group.style.alignItems = 'stretch';
    }

    // aria-label OBRIGATÓRIO em items icon-only
    group.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]').forEach((btn, i) => {
      btn.setAttribute('aria-label', itemLabels[i] ?? `Item ${i + 1}`);
    });

    return group;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Grupo presente com aria-label', async () => {
      const group = canvas.getByRole('toolbar');
      await expect(group).toBeInTheDocument();
      await expect(group).toHaveAttribute('aria-label');
    });

    await step('Três botões com aria-label próprio', async () => {
      const btns = canvas.getAllByRole('button');
      await expect(btns).toHaveLength(3);
      btns.forEach((b) => expect(b.getAttribute('aria-label')).toBeTruthy());
    });

    await step('Item inicial pressionado', async () => {
      const btn = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
      await expect(btn).toHaveAttribute('data-state', 'on');
    });

    await step('Clicar em outro item alterna seleção', async () => {
      const center = canvas.getByRole('button', { name: 'Centralizar' });
      await userEvent.click(center);
      await expect(center).toHaveAttribute('aria-pressed', 'true');
    });
  },
};
