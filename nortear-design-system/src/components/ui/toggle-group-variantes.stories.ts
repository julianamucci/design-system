import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, userEvent } from 'storybook/test';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  LayoutGrid,
  List,
} from 'lucide';
import { createToggleGroup, type ToggleGroupItem } from './toggle-group';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/ToggleGroup/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do ToggleGroup: Single (seleção exclusiva — `value` é string), Multiple (seleção combinada — `value` é array) e Vertical (orientação empilhada). **Divergência Basecoat**: factory não expõe `orientation`, `size`, `spacing` nem `disabled` no grupo — aplicar manualmente via `classList`/`setAttribute`/`item.disabled`. `aria-label` no grupo e em items icon-only é OBRIGATÓRIO e setado via `setAttribute` no elemento retornado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

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
  // Factory createToggle usa textContent quando children é string — injetamos SVGs depois
  group.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]').forEach((btn, i) => {
    btn.textContent = '';
    const wrap = document.createElement('span');
    wrap.style.display = 'inline-flex';
    wrap.appendChild(buildLucideSvg(icons[i]));
    btn.appendChild(wrap);
  });
}

function applyItemAriaLabels(group: HTMLElement, labels: string[]): void {
  group.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]').forEach((btn, i) => {
    if (labels[i]) btn.setAttribute('aria-label', labels[i]);
  });
}

// ─── Single ───────────────────────────────────────────────────────────────────

export const Single: Story = {
  render: () => {
    const items: ToggleGroupItem[] = [
      { value: 'left',   children: '' },
      { value: 'center', children: '' },
      { value: 'right',  children: '' },
    ];
    const group = createToggleGroup({
      type: 'single',
      variant: 'outline',
      items,
      defaultValue: 'left',
    });
    injectIcons(group, [AlignLeft, AlignCenter, AlignRight]);
    group.setAttribute('aria-label', 'Alinhamento do texto');
    applyItemAriaLabels(group, ['Alinhar à esquerda', 'Centralizar', 'Alinhar à direita']);
    return group;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Variante `type="single"` — apenas um item ativo por vez. Clicar em outro item desativa o anterior automaticamente (factory cuida disso). O callback `onValueChange` recebe **string** (o `value` do item selecionado) ou string vazia se nenhum estiver ativo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Grupo tem aria-label', async () => {
      const group = canvas.getByRole('toolbar');
      await expect(group).toHaveAttribute('aria-label', 'Alinhamento do texto');
    });
    await step('Apenas um pressionado inicialmente', async () => {
      const btns = canvas.getAllByRole('button');
      const pressed = btns.filter((b) => b.getAttribute('aria-pressed') === 'true');
      await expect(pressed).toHaveLength(1);
    });
    await step('Clicar em outro alterna seleção', async () => {
      const center = canvas.getByRole('button', { name: 'Centralizar' });
      await userEvent.click(center);
      await expect(center).toHaveAttribute('aria-pressed', 'true');
      const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
      await expect(left).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

// ─── Multiple ─────────────────────────────────────────────────────────────────

export const Multiple: Story = {
  render: () => {
    const items: ToggleGroupItem[] = [
      { value: 'bold',      children: '' },
      { value: 'italic',    children: '' },
      { value: 'underline', children: '' },
    ];
    const group = createToggleGroup({
      type: 'multiple',
      variant: 'outline',
      items,
      defaultValue: ['bold', 'italic'],
    });
    injectIcons(group, [Bold, Italic, Underline]);
    group.setAttribute('aria-label', 'Formatação');
    applyItemAriaLabels(group, ['Negrito', 'Itálico', 'Sublinhado']);
    return group;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Variante `type="multiple"` — combinação livre de items pressionados. O callback `onValueChange` recebe **string[]** com todos os values ativos. Ideal para barras de formatação (Bold + Italic simultâneos).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Dois items pressionados inicialmente', async () => {
      const btns = canvas.getAllByRole('button');
      const pressed = btns.filter((b) => b.getAttribute('aria-pressed') === 'true');
      await expect(pressed).toHaveLength(2);
    });
    await step('Adicionar terceiro mantém os anteriores', async () => {
      const underline = canvas.getByRole('button', { name: 'Sublinhado' });
      await userEvent.click(underline);
      const btns = canvas.getAllByRole('button');
      const pressed = btns.filter((b) => b.getAttribute('aria-pressed') === 'true');
      await expect(pressed).toHaveLength(3);
    });
  },
};

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  render: () => {
    const items: ToggleGroupItem[] = [
      { value: 'grid', children: '' },
      { value: 'list', children: '' },
    ];
    const group = createToggleGroup({
      type: 'single',
      variant: 'outline',
      items,
      defaultValue: 'grid',
    });
    injectIcons(group, [LayoutGrid, List]);
    group.setAttribute('aria-label', 'Modo de visualização');
    group.setAttribute('aria-orientation', 'vertical');
    // Divergência Basecoat: factory não expõe orientation — aplicar manualmente
    group.classList.remove('flex-row');
    group.classList.add('flex-col', 'items-stretch');
    applyItemAriaLabels(group, ['Grade', 'Lista']);
    return group;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Orientação vertical — items empilhados. **Divergência Basecoat**: a factory custom NÃO expõe `orientation`; aplicamos `flex-col` + `aria-orientation="vertical"` manualmente. Navegação por setas verticais requer implementação custom (roving tabindex não é automático na factory).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-orientation é vertical', async () => {
      const group = canvas.getByRole('toolbar');
      await expect(group).toHaveAttribute('aria-orientation', 'vertical');
    });
    await step('Container tem classe flex-col', async () => {
      const group = canvas.getByRole('toolbar');
      await expect(group.className).toMatch(/flex-col/);
    });
  },
};
