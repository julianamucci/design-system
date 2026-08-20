import type { Meta, StoryObj } from '@storybook/html-vite';
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
import { injectIcons } from './toggle-group.fixtures';
import { toggleGroupSource, toggleGroupSourceCom } from './toggle-group.source';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/ToggleGroup/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: toggleGroupSource },
      description: {
        component:
          'Variantes do ToggleGroup: Single (seleção exclusiva — `value` é string), Multiple (seleção combinada — `value` é array) e Vertical (orientação empilhada). `aria-label` no grupo e em items icon-only é OBRIGATÓRIO e setado via `setAttribute` no elemento retornado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers locais ───────────────────────────────────────────────────────────

/**
 * Clica só quando o estado atual não é o desejado. Reexecutar a play no painel
 * Interactions parte do estado que a rodada anterior deixou; um clique cego
 * inverteria o resultado a cada rodada.
 */
async function definir(botao: HTMLElement, ligado: boolean): Promise<void> {
  if ((botao.getAttribute('aria-pressed') === 'true') !== ligado) {
    await userEvent.click(botao);
  }
}

// ─── Single ───────────────────────────────────────────────────────────────────

export const Single: Story = {
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
    });
    injectIcons(group, [AlignLeft, AlignCenter, AlignRight]);
    return group;
  },
  parameters: {
    covers: ['functional.item1', 'visual.item1'],
    docs: {
      description: {
        story:
          'Variante `type="single"` — apenas um item ativo por vez. Clicar em outro item desativa o anterior automaticamente (factory cuida disso). O callback `onValueChange` recebe **string** (o `value` do item selecionado) ou string vazia se nenhum estiver ativo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
    const center = canvas.getByRole('button', { name: 'Centralizar' });

    await step('Grupo tem aria-label', async () => {
      const group = canvas.getByRole('toolbar');
      await expect(group).toHaveAttribute('aria-label', 'Alinhamento do texto');
    });
    await step('O modo exclusivo nasce com exatamente um item ativo', async () => {
      const btns = canvas.getAllByRole('button');
      const pressed = btns.filter((b) => b.getAttribute('aria-pressed') === 'true');
      await expect(pressed).toHaveLength(1);
    });
    await step('functional.item1 — escolher um item desliga o anterior', async () => {
      await definir(center, true);
      await expect(center).toHaveAttribute('aria-pressed', 'true');
      await expect(left).toHaveAttribute('aria-pressed', 'false');
      await expect(left).toHaveAttribute('data-state', 'off');
      // Volta ao estado inicial para a próxima rodada começar igual a esta.
      await definir(left, true);
    });
    await step('Emendados: o conjunto tem uma borda só, e os cantos internos são retos', async () => {
      // `data-variant="outline"` certo com CSS ausente daria três botões
      // soltos — é o defeito que só a medida pega.
      const group = canvas.getByRole('toolbar');
      await expect(group).toHaveAttribute('data-variant', 'outline');
      await expect(parseFloat(getComputedStyle(group).borderTopWidth)).toBeGreaterThan(0);
      await expect(parseFloat(getComputedStyle(center).borderTopLeftRadius)).toBe(0);
    });
  },
};

// ─── Multiple ─────────────────────────────────────────────────────────────────

export const Multiple: Story = {
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
      defaultValue: ['bold', 'italic'],
      'aria-label': 'Formatação',
    });
    injectIcons(group, [Bold, Italic, Underline]);
    return group;
  },
  parameters: {
    covers: ['functional.item2', 'visual.item2'],
    docs: {
      source: { transform: toggleGroupSourceCom({
          type: 'multiple',
          'aria-label': 'Formatação',
          defaultValue: ['bold', 'italic'],
          items: [
            { value: 'bold', icon: 'Bold', 'aria-label': 'Negrito' },
            { value: 'italic', icon: 'Italic', 'aria-label': 'Itálico' },
            { value: 'underline', icon: 'Underline', 'aria-label': 'Sublinhado' },
          ],
        }) },
      description: {
        story:
          'Variante `type="multiple"` — combinação livre de items pressionados. O callback `onValueChange` recebe **string[]** com todos os values ativos. Ideal para barras de formatação (Bold + Italic simultâneos).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole('button', { name: 'Negrito' });
    const italic = canvas.getByRole('button', { name: 'Itálico' });
    const underline = canvas.getByRole('button', { name: 'Sublinhado' });
    const ativos = () =>
      canvas.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true');

    await step('O modo combinado aceita mais de um ativo ao mesmo tempo', async () => {
      await definir(bold, true);
      await definir(italic, true);
      await definir(underline, false);
      await expect(ativos()).toHaveLength(2);
    });

    await step('functional.item2 — ligar um item soma; desligar subtrai', async () => {
      await definir(underline, true);
      await expect(ativos()).toHaveLength(3);
      await expect(bold).toHaveAttribute('aria-pressed', 'true');

      await definir(italic, false);
      await expect(ativos()).toHaveLength(2);
      await expect(italic).toHaveAttribute('data-state', 'off');

      // Restaura o estado inicial da story.
      await definir(italic, true);
      await definir(underline, false);
    });
  },
};

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  render: () => {
    const items: ToggleGroupItem[] = [
      { value: 'grid', children: '', 'aria-label': 'Grade' },
      { value: 'list', children: '', 'aria-label': 'Lista' },
    ];
    const group = createToggleGroup({
      type: 'single',
      variant: 'outline',
      orientation: 'vertical',
      items,
      defaultValue: 'grid',
      'aria-label': 'Modo de visualização',
    });
    injectIcons(group, [LayoutGrid, List]);
    return group;
  },
  parameters: {
    covers: ['visual.item3'],
    docs: {
      source: { transform: toggleGroupSourceCom({
          orientation: 'vertical',
          'aria-label': 'Modo de visualização',
          defaultValue: 'grid',
          items: [
            { value: 'grid', icon: 'LayoutGrid', 'aria-label': 'Grade' },
            { value: 'list', icon: 'List', 'aria-label': 'Lista' },
          ],
        }) },
      description: {
        story:
          'Orientação vertical — items empilhados via `orientation: "vertical"`, que a factory traduz em `data-orientation` (lido pelo CSS compartilhado) e `aria-orientation`. As setas cima/baixo navegam pelo roving tabindex do grupo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const grade = canvas.getByRole('button', { name: 'Grade' });
    const lista = canvas.getByRole('button', { name: 'Lista' });

    await step('A orientação chega ao markup e ao anúncio', async () => {
      const group = canvas.getByRole('toolbar');
      await expect(group).toHaveAttribute('data-orientation', 'vertical');
      await expect(group).toHaveAttribute('aria-orientation', 'vertical');
    });

    await step('Empilhado de verdade: o segundo item começa abaixo do primeiro', async () => {
      // `data-orientation` certo com CSS ausente deixaria os dois lado a lado —
      // era o que acontecia quando a story aplicava `flex-col`, classe que
      // nenhuma folha do projeto define.
      const a = grade.getBoundingClientRect();
      const b = lista.getBoundingClientRect();
      await expect(b.top).toBeGreaterThanOrEqual(a.bottom - 1);
    });

    await step('As setas verticais navegam dentro do grupo', async () => {
      grade.focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(lista).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(grade).toHaveFocus();
    });
  },
};
