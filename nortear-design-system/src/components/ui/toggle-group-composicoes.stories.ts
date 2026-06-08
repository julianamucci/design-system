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
  Eye,
} from 'lucide';
import { createToggleGroup, type ToggleGroupItem } from './toggle-group';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/ToggleGroup/Composicoes',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais do ToggleGroup: barra de alinhamento (single), barra de formatação (multiple), modo de visualização (vertical com texto). **Divergências Basecoat** documentadas em 3 camadas (notes + DocsProps + esta composição): (1) factory é não-controlada — sem prop `value`, apenas `defaultValue`; (2) `orientation`/`size`/`spacing`/`disabled` no grupo NÃO existem — aplicar manualmente; (3) `aria-label` no grupo e em items icon-only setado via `setAttribute` no elemento retornado; (4) `children` é string HTML literal — gerar SVG via `createElementNS` + `outerHTML` (NUNCA interpolar dado dinâmico).',
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

function injectIconsAndText(group: HTMLElement, entries: Array<{ icon: unknown; text: string }>): void {
  group.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]').forEach((btn, i) => {
    const entry = entries[i];
    if (!entry) return;
    btn.textContent = '';
    const wrap = document.createElement('span');
    wrap.className = 'nds-cluster';
    wrap.dataset.spacing = 'sm';
    wrap.style.display = 'inline-flex';
    wrap.appendChild(buildLucideSvg(entry.icon));
    const t = document.createElement('span');
    t.textContent = entry.text; // textContent escapa automaticamente — sem XSS
    wrap.appendChild(t);
    btn.appendChild(wrap);
  });
}

function applyItemAriaLabels(group: HTMLElement, labels: string[]): void {
  group.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]').forEach((btn, i) => {
    if (labels[i]) btn.setAttribute('aria-label', labels[i]);
  });
}

// ─── BarraDeAlinhamento (single) ──────────────────────────────────────────────

export const BarraDeAlinhamento: Story = {
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
      onValueChange: (value) => {
        // Em produção, dispara analytics.track('field_change', { component: 'toggle_group', ... })
        console.log('alignment:', value);
      },
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
          'Caso clássico de `type="single"`: alinhamento de texto. Apenas uma opção ativa. O callback recebe a string do `value` (ou vazia se nenhum). aria-label no grupo descreve a categoria; em cada item, a função específica.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Trocar de left para right', async () => {
      const right = canvas.getByRole('button', { name: 'Alinhar à direita' });
      await userEvent.click(right);
      await expect(right).toHaveAttribute('aria-pressed', 'true');
      const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
      await expect(left).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

// ─── BarraDeFormatacao (multiple) ─────────────────────────────────────────────

export const BarraDeFormatacao: Story = {
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
      defaultValue: ['bold'],
      onValueChange: (value) => {
        console.log('formatting:', value); // string[]
      },
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
          'Caso clássico de `type="multiple"`: formatação (Bold + Italic + Underline combinados). O callback recebe `string[]` com todos os values ativos. Ordem de items segue a convenção do domínio (B → I → U), não alfabética.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Combinar Bold + Italic', async () => {
      const italic = canvas.getByRole('button', { name: 'Itálico' });
      await userEvent.click(italic);
      const btns = canvas.getAllByRole('button');
      const pressed = btns.filter((b) => b.getAttribute('aria-pressed') === 'true');
      await expect(pressed).toHaveLength(2);
    });
  },
};

// ─── ModoDeVisualizacao (vertical + texto visível) ────────────────────────────

export const ModoDeVisualizacao: Story = {
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
    injectIconsAndText(group, [
      { icon: LayoutGrid, text: 'Grade' },
      { icon: List,       text: 'Lista' },
    ]);
    group.setAttribute('aria-label', 'Modo de visualização');
    group.setAttribute('aria-orientation', 'vertical');
    // Divergência Basecoat: factory não expõe orientation
    group.classList.remove('flex-row');
    group.classList.add('flex-col', 'items-stretch');
    // Items aqui têm texto visível, então não precisam de aria-label próprio.
    return group;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Orientação vertical + texto visível ao lado do ícone. Quando o texto é visível, items NÃO precisam de `aria-label` (o leitor usa o texto interno). O grupo ainda precisa de `aria-label`. **Divergência Basecoat**: `orientation` não é prop — `flex-col` aplicado manualmente; `aria-orientation` setado via `setAttribute`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-orientation vertical', async () => {
      const group = canvas.getByRole('toolbar');
      await expect(group).toHaveAttribute('aria-orientation', 'vertical');
    });
    await step('Textos visíveis presentes', async () => {
      await expect(canvas.getByText('Grade')).toBeVisible();
      await expect(canvas.getByText('Lista')).toBeVisible();
    });
  },
};

// ─── ComItemDesabilitado ──────────────────────────────────────────────────────

export const ComItemDesabilitado: Story = {
  render: () => {
    const items: ToggleGroupItem[] = [
      { value: 'left',   children: '' },
      { value: 'center', children: '', disabled: true },
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
    applyItemAriaLabels(group, ['Alinhar à esquerda', 'Centralizar (indisponível)', 'Alinhar à direita']);
    return group;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Um item desabilitado (via `item.disabled: true`) — útil quando uma opção não se aplica ao contexto. O `aria-label` do item indica explicitamente a indisponibilidade. **Divergência Basecoat**: para desabilitar o grupo inteiro, aplicar `disabled: true` em CADA item (factory não expõe `disabled` no grupo).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Apenas Centralizar está disabled', async () => {
      const center = canvas.getByRole('button', { name: 'Centralizar (indisponível)' });
      await expect(center).toBeDisabled();
      const right = canvas.getByRole('button', { name: 'Alinhar à direita' });
      await expect(right).not.toBeDisabled();
    });
  },
};

// ─── ComFiltroVisivel ─────────────────────────────────────────────────────────

export const ComFiltroVisivel: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';
    wrapper.style.width = '18rem';

    const title = document.createElement('p');
    title.className = 'nds-text-body nds-font-semibold nds-mb-1';
    title.textContent = 'Filtros de exibição';
    wrapper.appendChild(title);

    const items: ToggleGroupItem[] = [
      { value: 'hidden',  children: '' },
      { value: 'compact', children: '' },
    ];
    const group = createToggleGroup({
      type: 'multiple',
      variant: 'outline',
      items,
      defaultValue: ['compact'],
    });
    injectIconsAndText(group, [
      { icon: Eye,  text: 'Ocultos'  },
      { icon: List, text: 'Compacto' },
    ]);
    group.setAttribute('aria-label', 'Filtros de exibição');
    wrapper.appendChild(group);

    return wrapper;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Conjunto de filtros booleanos independentes com texto visível — `type="multiple"` permite combinar Ocultos + Compacto. O `aria-label` do grupo descreve a categoria geral; cada item dispensa `aria-label` porque o texto está visível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Compacto inicia ativo', async () => {
      const compact = canvas.getByRole('button', { name: 'Compacto' });
      await expect(compact).toHaveAttribute('aria-pressed', 'true');
    });
    await step('Adicionar Ocultos mantém Compacto', async () => {
      const hidden = canvas.getByRole('button', { name: 'Ocultos' });
      await userEvent.click(hidden);
      await expect(hidden).toHaveAttribute('aria-pressed', 'true');
      const compact = canvas.getByRole('button', { name: 'Compacto' });
      await expect(compact).toHaveAttribute('aria-pressed', 'true');
    });
  },
};
