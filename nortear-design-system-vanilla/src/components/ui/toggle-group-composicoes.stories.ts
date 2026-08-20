import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
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
import { buildLucideSvg, definir, injectIcons } from './toggle-group.fixtures';
import { toggleGroupSource, toggleGroupSourceCom } from './toggle-group.source';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/ToggleGroup/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: toggleGroupSource },
      description: {
        component:
          'Composicoes reais do ToggleGroup: barra de alinhamento (single), barra de formatação (multiple), modo de visualização (vertical com texto). **Divergências Vanilla**: (1) a factory é não-controlada — sem prop `value`, apenas `defaultValue`; (2) `aria-label` no grupo e em items icon-only é setado via `setAttribute` no elemento retornado; (3) `children` é string literal — gerar SVG via `createElementNS` e anexar por DOM (NUNCA interpolar dado dinâmico).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers locais ───────────────────────────────────────────────────────────

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

// ─── BarraDeAlinhamento (single) ──────────────────────────────────────────────

export const AlignmentBar: Story = {
  render: () => {
    const items: ToggleGroupItem[] = [
      { value: 'left',   children: '', 'aria-label': 'Alinhar à esquerda' },
      { value: 'center', children: '', 'aria-label': 'Centralizar' },
      { value: 'right',  children: '', 'aria-label': 'Alinhar à direita' },
    ];
    const group = createToggleGroup({
      type: 'single',
      variant: 'outline',
      items,
      defaultValue: 'left',
      'aria-label': 'Alinhamento do texto',
      onValueChange: (value) => {
        // Em produção, dispara analytics.track('field_change', { component: 'toggle_group', ... })
        console.log('alignment:', value);
      },
    });
    injectIcons(group, [AlignLeft, AlignCenter, AlignRight]);
    return group;
  },
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: { transform: toggleGroupSourceCom({
          items: [
            { value: 'left', icon: 'AlignLeft', 'aria-label': 'Alinhar à esquerda' },
            { value: 'center', icon: 'AlignCenter', 'aria-label': 'Centralizar' },
            { value: 'right', icon: 'AlignRight', 'aria-label': 'Alinhar à direita' },
          ],
          onValueChange: '(value) => aplicarAlinhamento(value)',
        }) },
      description: {
        story:
          'Caso clássico de `type="single"`: alinhamento de texto. Apenas uma opção ativa. O callback recebe a string do `value` (ou vazia se nenhum). aria-label no grupo descreve a categoria; em cada item, a função específica.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
    const right = canvas.getByRole('button', { name: 'Alinhar à direita' });

    await step('Trocar de left para right', async () => {
      await definir(right, true);
      await expect(right).toHaveAttribute('aria-pressed', 'true');
      await expect(left).toHaveAttribute('aria-pressed', 'false');
      // Volta ao estado inicial para a próxima rodada começar igual a esta.
      await definir(left, true);
    });

    await step('visual.item4 — a variante outline emenda os itens num container só', async () => {
      // Um container com borda; os itens perdem a sua. É o que separa o
      // "segmentado" de três botões soltos lado a lado.
      const grupo = canvas.getByRole('toolbar');
      await expect(grupo).toHaveAttribute('data-variant', 'outline');
      await expect(parseFloat(getComputedStyle(grupo).borderTopWidth)).toBeGreaterThan(0);
      await expect(parseFloat(getComputedStyle(left).borderTopWidth)).toBe(0);
      await expect(parseFloat(getComputedStyle(grupo).columnGap || '0')).toBe(0);
    });
  },
};

// ─── BarraDeFormatacao (multiple) ─────────────────────────────────────────────

export const FormattingBar: Story = {
  render: () => {
    const items: ToggleGroupItem[] = [
      { value: 'bold',      children: '', 'aria-label': 'Negrito' },
      { value: 'italic',    children: '', 'aria-label': 'Itálico' },
      { value: 'underline', children: '', 'aria-label': 'Sublinhado' },
    ];
    const group = createToggleGroup({
      type: 'multiple',
      variant: 'outline',
      items,
      defaultValue: ['bold'],
      'aria-label': 'Formatação',
      onValueChange: (value) => {
        console.log('formatting:', value); // string[]
      },
    });
    injectIcons(group, [Bold, Italic, Underline]);
    return group;
  },
  parameters: {
    docs: {
      source: { transform: toggleGroupSourceCom({
          type: 'multiple',
          'aria-label': 'Formatação',
          defaultValue: ['bold'],
          items: [
            { value: 'bold', icon: 'Bold', 'aria-label': 'Negrito' },
            { value: 'italic', icon: 'Italic', 'aria-label': 'Itálico' },
            { value: 'underline', icon: 'Underline', 'aria-label': 'Sublinhado' },
          ],
          onValueChange: '(values) => aplicarFormatacao(values)',
        }) },
      description: {
        story:
          'Caso clássico de `type="multiple"`: formatação (Bold + Italic + Underline combinados). O callback recebe `string[]` com todos os values ativos. Ordem de items segue a convenção do domínio (B → I → U), não alfabética.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole('button', { name: 'Negrito' });
    const italic = canvas.getByRole('button', { name: 'Itálico' });
    const ativos = () =>
      canvas.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true');

    await step('Combinar Bold + Italic', async () => {
      await definir(bold, true);
      await definir(italic, true);
      await expect(ativos()).toHaveLength(2);
      await expect(bold).toHaveAttribute('aria-pressed', 'true');
    });

    await step('Desligar Italic subtrai só ele', async () => {
      await definir(italic, false);
      await expect(ativos()).toHaveLength(1);
      await expect(bold).toHaveAttribute('data-state', 'on');
    });
  },
};

// ─── ModoDeVisualizacao (vertical + texto visível) ────────────────────────────

export const ViewMode: Story = {
  render: () => {
    const items: ToggleGroupItem[] = [
      { value: 'grid', children: '' },
      { value: 'list', children: '' },
    ];
    const group = createToggleGroup({
      type: 'single',
      variant: 'outline',
      orientation: 'vertical',
      items,
      defaultValue: 'grid',
      'aria-label': 'Modo de visualização',
    });
    injectIconsAndText(group, [
      { icon: LayoutGrid, text: 'Grade' },
      { icon: List,       text: 'Lista' },
    ]);
    // Items aqui têm texto visível, então não precisam de aria-label próprio.
    return group;
  },
  parameters: {
    docs: {
      source: { transform: toggleGroupSourceCom({
          orientation: 'vertical',
          'aria-label': 'Modo de visualização',
          defaultValue: 'grid',
          // Com texto visível o item dispensa nome acessível próprio.
          items: [
            { value: 'grid', icon: 'LayoutGrid', children: 'Grade' },
            { value: 'list', icon: 'List', children: 'Lista' },
          ],
        }) },
      description: {
        story:
          'Orientação vertical + texto visível ao lado do ícone. Quando o texto é visível, items NÃO precisam de `aria-label` (o leitor usa o texto interno). O grupo ainda precisa de `aria-label`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const grade = canvas.getByRole('button', { name: 'Grade' });
    const lista = canvas.getByRole('button', { name: 'Lista' });

    await step('Texto visível dispensa aria-label no item', async () => {
      await expect(grade.getAttribute('aria-label')).toBe(null);
      await expect(lista.getAttribute('aria-label')).toBe(null);
    });

    await step('O grupo continua nomeado — o rótulo dele é a categoria', async () => {
      const group = canvas.getByRole('toolbar');
      await expect(group).toHaveAttribute('aria-label', 'Modo de visualização');
      await expect(group).toHaveAttribute('aria-orientation', 'vertical');
    });

    await step('Empilhado de verdade: o segundo item começa abaixo do primeiro', async () => {
      const a = grade.getBoundingClientRect();
      const b = lista.getBoundingClientRect();
      await expect(b.top).toBeGreaterThanOrEqual(a.bottom - 1);
    });
  },
};

// ─── ComItemDesabilitado ──────────────────────────────────────────────────────

export const WithDisabledItem: Story = {
  render: () => {
    const items: ToggleGroupItem[] = [
      { value: 'left',   children: '', 'aria-label': 'Alinhar à esquerda' },
      { value: 'center', children: '', disabled: true, 'aria-label': 'Centralizar (indisponível)' },
      { value: 'right',  children: '', 'aria-label': 'Alinhar à direita' },
    ];
    const group = createToggleGroup({
      type: 'single',
      variant: 'outline',
      items,
      defaultValue: 'left',
      'aria-label': 'Alinhamento do texto',
    });
    injectIcons(group, [AlignLeft, AlignCenter, AlignRight]);
    return group;
  },
  parameters: {
    docs: {
      source: { transform: toggleGroupSourceCom({
          items: [
            { value: 'left', icon: 'AlignLeft', 'aria-label': 'Alinhar à esquerda' },
            { value: 'center', icon: 'AlignCenter', 'aria-label': 'Centralizar (indisponível)', disabled: true },
            { value: 'right', icon: 'AlignRight', 'aria-label': 'Alinhar à direita' },
          ],
        }) },
      description: {
        story:
          'Um item desabilitado (via `item.disabled: true`) — útil quando uma opção não se aplica ao contexto. O `aria-label` do item indica explicitamente a indisponibilidade; para travar o grupo inteiro existe `disabled` no grupo, que cada item herda.',
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

export const WithVisibleFilter: Story = {
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
      // Espaçamento acima de zero: os botões deixam de ser emendados e cada um
      // mantém o próprio contorno — é o contraste do visual segmentado.
      spacing: 1,
      items,
      defaultValue: ['compact'],
      'aria-label': 'Filtros de exibição',
    });
    injectIconsAndText(group, [
      { icon: Eye,  text: 'Ocultos'  },
      { icon: List, text: 'Compacto' },
    ]);
    group.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]').forEach((btn) => {
      btn.dataset.variant = 'outline';
    });
    wrapper.appendChild(group);

    return wrapper;
  },
  parameters: {
    covers: ['visual.item5'],
    docs: {
      source: { transform: toggleGroupSourceCom({
          type: 'multiple',
          spacing: 1,
          'aria-label': 'Filtros de exibição',
          defaultValue: ['compact'],
          items: [
            { value: 'hidden', icon: 'Eye', children: 'Ocultos' },
            { value: 'compact', icon: 'List', children: 'Compacto' },
          ],
        }) },
      description: {
        story:
          'Conjunto de filtros booleanos independentes com texto visível — `type="multiple"` permite combinar Ocultos + Compacto. O `aria-label` do grupo descreve a categoria geral; cada item dispensa `aria-label` porque o texto está visível. `spacing: 1` separa os botões, e o contorno passa a ser de cada item.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const grupo = canvas.getByRole('toolbar');
    const hidden = canvas.getByRole('button', { name: 'Ocultos' });
    const compact = canvas.getByRole('button', { name: 'Compacto' });

    await step('visual.item5 — com espaçamento os botões deixam de ser emendados', async () => {
      await expect(grupo).toHaveAttribute('data-spacing', '1');
      const a = hidden.getBoundingClientRect();
      const b = compact.getBoundingClientRect();
      await expect(b.left).toBeGreaterThan(a.right);
    });

    await step('Separados, os itens mantêm o próprio canto arredondado', async () => {
      await expect(parseFloat(getComputedStyle(hidden).borderTopRightRadius)).toBeGreaterThan(0);
    });

    await step('Filtros independentes: um ativo não desliga o outro', async () => {
      await definir(compact, true);
      await definir(hidden, true);
      await expect(hidden).toHaveAttribute('aria-pressed', 'true');
      await expect(compact).toHaveAttribute('aria-pressed', 'true');
      // Restaura o estado inicial da story.
      await definir(hidden, false);
    });
  },
};
