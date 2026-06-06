import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, userEvent } from 'storybook/test';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide';
import { createToggleGroup, type ToggleGroupItem } from './toggle-group';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/ToggleGroup/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do ToggleGroup: Default (nenhum selecionado), Selected (um ou mais ativos), Disabled (todos os items bloqueados via `item.disabled`), DisabledItem (apenas um item bloqueado) e FocoVisivel. **Divergência Basecoat**: factory não expõe `disabled` no grupo — usar `item.disabled` em cada um. Não há prop `aria-invalid` no grupo; para estado de erro, aplicar atributos manualmente.',
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

function makeAlignmentGroup(opts: {
  defaultValue?: string;
  disabledAll?: boolean;
  disabledIndex?: number;
}): HTMLElement {
  const items: ToggleGroupItem[] = [
    { value: 'left',   children: '', disabled: opts.disabledAll || opts.disabledIndex === 0 },
    { value: 'center', children: '', disabled: opts.disabledAll || opts.disabledIndex === 1 },
    { value: 'right',  children: '', disabled: opts.disabledAll || opts.disabledIndex === 2 },
  ];
  const group = createToggleGroup({
    type: 'single',
    variant: 'outline',
    items,
    defaultValue: opts.defaultValue,
  });
  injectIcons(group, [AlignLeft, AlignCenter, AlignRight]);
  group.setAttribute('aria-label', 'Alinhamento do texto');
  applyItemAriaLabels(group, ['Alinhar à esquerda', 'Centralizar', 'Alinhar à direita']);
  return group;
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => makeAlignmentGroup({}),
  parameters: {
    docs: { description: { story: 'Estado inicial sem nenhum item selecionado. Todos os items têm `aria-pressed="false"` e `data-state="off"`. Fundo transparente; borda `input` da variante outline.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Nenhum pressionado', async () => {
      const btns = canvas.getAllByRole('button');
      const pressed = btns.filter((b) => b.getAttribute('aria-pressed') === 'true');
      await expect(pressed).toHaveLength(0);
    });
  },
};

// ─── Selected ─────────────────────────────────────────────────────────────────

export const Selected: Story = {
  render: () => makeAlignmentGroup({ defaultValue: 'center' }),
  parameters: {
    docs: { description: { story: 'Item ativo via `defaultValue`. `aria-pressed="true"`, `data-state="on"`, fundo `bg-accent`. A factory aplica automaticamente no click.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Centralizar pressionado', async () => {
      const center = canvas.getByRole('button', { name: 'Centralizar' });
      await expect(center).toHaveAttribute('aria-pressed', 'true');
      await expect(center).toHaveAttribute('data-state', 'on');
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => makeAlignmentGroup({ defaultValue: 'left', disabledAll: true }),
  parameters: {
    docs: {
      description: {
        story:
          'Todos os items desabilitados — **Divergência Basecoat**: factory não expõe `disabled` no grupo. Aqui passamos `disabled: true` em cada `ToggleGroupItem`. Atributo HTML `disabled` aplicado em cada `<button>`; `opacity-50` e `pointer-events-none` vêm das classes do Toggle.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Todos disabled', async () => {
      const btns = canvas.getAllByRole('button');
      btns.forEach((b) => expect(b).toBeDisabled());
    });
    await step('Clique não muda estado', async () => {
      const center = canvas.getByRole('button', { name: 'Centralizar' });
      await userEvent.click(center, { pointerEventsCheck: 0 });
      await expect(center).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

// ─── DisabledItem ─────────────────────────────────────────────────────────────

export const DisabledItem: Story = {
  render: () => makeAlignmentGroup({ defaultValue: 'left', disabledIndex: 1 }),
  parameters: {
    docs: { description: { story: 'Apenas o item Centralizar desabilitado via `item.disabled: true`. Os demais permanecem interativos. Útil quando uma opção não está disponível no contexto atual.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Centralizar disabled, demais habilitados', async () => {
      const center = canvas.getByRole('button', { name: 'Centralizar' });
      await expect(center).toBeDisabled();
      const right = canvas.getByRole('button', { name: 'Alinhar à direita' });
      await expect(right).not.toBeDisabled();
    });
  },
};

// ─── FocoVisivel ──────────────────────────────────────────────────────────────

export const FocoVisivel: Story = {
  render: () => makeAlignmentGroup({ defaultValue: 'left' }),
  parameters: {
    docs: {
      description: {
        story:
          'Foco visível via Tab — anel `ring-1 ring-ring` aplicado pelo Toggle. **Divergência Basecoat**: a factory NÃO implementa roving tabindex automático; todos os items recebem `tabindex=0` (do próprio `<button>`). Para roving real, escute ArrowLeft/Right e mova `focus()` manualmente. Space/Enter alternam o item focado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Focar primeiro item', async () => {
      const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
      (left as HTMLElement).focus();
      await expect(left).toHaveFocus();
    });
    await step('Space alterna o item focado', async () => {
      const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
      // Inicia pressionado — Space desativa
      await userEvent.keyboard(' ');
      await expect(left).toHaveAttribute('aria-pressed', 'false');
    });
    await step('Enter pressiona novamente', async () => {
      const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
      (left as HTMLElement).focus();
      await userEvent.keyboard('{Enter}');
      await expect(left).toHaveAttribute('aria-pressed', 'true');
    });
  },
};
