import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, userEvent } from 'storybook/test';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Eye, List } from 'lucide';
import { createToggle, type ToggleOptions, type ToggleVariant } from './toggle';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Toggle/Composicoes',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes de uso do Toggle: toolbar de formatação (icon-only com aria-label), filtro com label visível, tamanhos (sm/default/lg) e simulação de ToggleGroup. Lembre: para conjunto relacionado representando uma escolha conjunta, use `ToggleGroup` em vez de múltiplos Toggle soltos.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Lucide helper ────────────────────────────────────────────────────────────

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

function wrapIcon(icon: unknown): HTMLSpanElement {
  const span = document.createElement('span');
  span.style.display = 'inline-flex';
  span.appendChild(buildLucideSvg(icon));
  return span;
}

function iconToggle(opts: {
  icon: unknown;
  ariaLabel: string;
  pressed?: boolean;
  variant?: ToggleVariant;
  size?: ToggleOptions['size'];
  extraClass?: string;
}): HTMLButtonElement {
  const btn = createToggle({
    pressed: opts.pressed ?? false,
    variant: opts.variant ?? 'default',
    size: opts.size ?? 'default',
    children: wrapIcon(opts.icon),
    class: opts.extraClass,
  });
  btn.setAttribute('aria-label', opts.ariaLabel);
  return btn;
}

// ─── ToolbarFormatacao ────────────────────────────────────────────────────────

export const ToolbarFormatacao: Story = {
  render: () => {
    const toolbar = document.createElement('div');
    toolbar.className = 'nds-cluster nds-rounded-md nds-border-default nds-p-1';
    toolbar.dataset.spacing = 'xs';
    toolbar.setAttribute('role', 'group');
    toolbar.setAttribute('aria-label', 'Formatação de texto');

    toolbar.appendChild(iconToggle({ icon: Bold, ariaLabel: 'Negrito', pressed: true }));
    toolbar.appendChild(iconToggle({ icon: Italic, ariaLabel: 'Itálico' }));
    toolbar.appendChild(iconToggle({ icon: Underline, ariaLabel: 'Sublinhado' }));

    return toolbar;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Toolbar com 3 Toggles icon-only de formatação. Cada um tem `aria-label` descritivo. O container usa `role="group"` + `aria-label` para identificar a barra. Cada toggle mantém estado independente — para escolha única/exclusiva, use `ToggleGroup`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Três toggles presentes', async () => {
      const btns = canvas.getAllByRole('button');
      await expect(btns).toHaveLength(3);
    });
    await step('Cada toggle tem aria-label descritivo', async () => {
      await expect(canvas.getByRole('button', { name: 'Negrito' })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: 'Itálico' })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: 'Sublinhado' })).toBeInTheDocument();
    });
    await step('Apenas o primeiro inicia pressionado', async () => {
      const btns = canvas.getAllByRole('button');
      const pressed = btns.filter(b => b.getAttribute('aria-pressed') === 'true');
      await expect(pressed).toHaveLength(1);
    });
  },
};

// ─── FiltroComLabel ───────────────────────────────────────────────────────────

export const FiltroComLabel: Story = {
  render: () => {
    const wrap = document.createElement('span');
    wrap.className = 'nds-cluster';
    wrap.dataset.spacing = 'sm';
    wrap.style.display = 'inline-flex';
    wrap.appendChild(buildLucideSvg(Eye));
    const text = document.createElement('span');
    text.textContent = 'Mostrar ocultos';
    wrap.appendChild(text);

    return createToggle({
      pressed: false,
      variant: 'outline',
      children: wrap,
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Toggle com ícone + texto visível para filtro de visualização. Como o texto é visível e descritivo, `aria-label` não é necessário — o leitor de tela usa o texto interno do botão.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Texto visível presente', async () => {
      await expect(canvas.getByText('Mostrar ocultos')).toBeVisible();
    });
    await step('Clique alterna estado', async () => {
      const btn = canvas.getByRole('button');
      await expect(btn).toHaveAttribute('aria-pressed', 'false');
      await userEvent.click(btn);
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
    });
  },
};

// ─── Tamanhos ─────────────────────────────────────────────────────────────────

export const Tamanhos: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-cluster';
    wrap.dataset.spacing = 'sm';
    wrap.appendChild(iconToggle({ icon: Bold, ariaLabel: 'Negrito (sm)', size: 'sm', variant: 'outline' }));
    wrap.appendChild(iconToggle({ icon: Bold, ariaLabel: 'Negrito (default)', size: 'default', variant: 'outline' }));
    wrap.appendChild(iconToggle({ icon: Bold, ariaLabel: 'Negrito (lg)', size: 'lg', variant: 'outline' }));
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Três tamanhos lado a lado (`sm`, `default`, `lg`) — altura definida por classes `h-8`/`h-9`/`h-10` no factory. Use `sm` em listas densas, `default` em toolbars e `lg` em ações destacadas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Três tamanhos presentes', async () => {
      const btns = canvas.getAllByRole('button');
      await expect(btns).toHaveLength(3);
      await expect(btns[0].dataset.size).toBe('sm');
      await expect(btns[1].dataset.size).toBeUndefined();
      await expect(btns[2].dataset.size).toBe('lg');
    });
  },
};

// ─── SimulacaoToggleGroup ─────────────────────────────────────────────────────

export const SimulacaoToggleGroup: Story = {
  render: () => {
    // Divergência idiomática Basecoat: não existe ToggleGroup nativo no factory.
    // Aqui simulamos manualmente uma escolha exclusiva (single) — em produção,
    // prefira `ToggleGroup` quando representam escolha conjunta.
    const group = document.createElement('div');
    group.className = 'nds-cluster nds-rounded-md nds-border-default nds-bg-background';
    group.dataset.spacing = 'xs';
    group.style.display = 'inline-flex';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Alinhamento de texto');

    const items = [
      { icon: AlignLeft, label: 'Alinhar à esquerda', value: 'left', pressed: true },
      { icon: AlignCenter, label: 'Centralizar', value: 'center', pressed: false },
      { icon: AlignRight, label: 'Alinhar à direita', value: 'right', pressed: false },
    ];

    const buttons: HTMLButtonElement[] = [];

    items.forEach(({ icon, label, pressed }) => {
      const btn = createToggle({
        pressed,
        variant: 'default',
        children: wrapIcon(icon),
        class: 'rounded-none border-0',
      });
      btn.setAttribute('aria-label', label);
      btn.addEventListener('click', () => {
        // Simulação single — desativa os outros
        for (const other of buttons) {
          if (other !== btn) {
            other.setAttribute('aria-pressed', 'false');
            other.dataset.state = 'off';
          }
        }
      });
      buttons.push(btn);
      group.appendChild(btn);
    });

    return group;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Simulação de ToggleGroup (`type="single"`) — 3 Toggles agrupados visualmente com lógica de exclusividade adicionada manualmente. **Divergência Basecoat**: o factory custom não fornece `ToggleGroup` nativo. Em produção, prefira usar o componente `ToggleGroup` específico (existe nas outras stacks como referência).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Três botões no grupo', async () => {
      const btns = canvas.getAllByRole('button');
      await expect(btns).toHaveLength(3);
    });
    await step('Apenas um pressionado inicialmente', async () => {
      const btns = canvas.getAllByRole('button');
      const pressed = btns.filter(b => b.getAttribute('aria-pressed') === 'true');
      await expect(pressed).toHaveLength(1);
    });
    await step('Clicar no segundo desativa o primeiro', async () => {
      const center = canvas.getByRole('button', { name: 'Centralizar' });
      await userEvent.click(center);
      await expect(center).toHaveAttribute('aria-pressed', 'true');
      const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
      await expect(left).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

// ─── ListaDeFiltros ───────────────────────────────────────────────────────────

export const ListaDeFiltros: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';
    wrapper.style.width = '18rem';

    const title = document.createElement('p');
    title.className = 'nds-text-body nds-font-semibold nds-mb-1';
    title.textContent = 'Filtros de exibição';
    wrapper.appendChild(title);

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.spacing = 'sm';
    row.style.flexWrap = 'wrap';

    const filters = [
      { icon: Eye, label: 'Mostrar ocultos', pressed: false },
      { icon: List, label: 'Visão compacta', pressed: true },
    ];

    filters.forEach(({ icon, label, pressed }) => {
      const wrap = document.createElement('span');
      wrap.className = 'nds-cluster';
    wrap.dataset.spacing = 'sm';
    wrap.style.display = 'inline-flex';
      wrap.appendChild(buildLucideSvg(icon));
      const text = document.createElement('span');
      text.textContent = label;
      wrap.appendChild(text);
      const btn = createToggle({ pressed, variant: 'outline', children: wrap });
      row.appendChild(btn);
    });

    wrapper.appendChild(row);
    return wrapper;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Conjunto de filtros independentes (cada um pode estar ativo separadamente). Diferente do ToggleGroup exclusivo, aqui cada Toggle representa uma escolha booleana isolada.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Dois filtros presentes', async () => {
      const btns = canvas.getAllByRole('button');
      await expect(btns).toHaveLength(2);
    });
    await step('Visão compacta inicia ativa', async () => {
      await expect(canvas.getByText('Visão compacta')).toBeVisible();
    });
  },
};
