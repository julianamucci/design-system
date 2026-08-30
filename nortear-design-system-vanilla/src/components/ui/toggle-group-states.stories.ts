import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide';
import { createToggleGroup, type ToggleGroupItem } from './toggle-group';
import { injectIcons } from './toggle-group.fixtures';
import { toggleGroupSource, toggleGroupSourceWith } from './toggle-group.source';

const meta: Meta = {
  tags: ['form'],
  title: 'Primitives/Form/ToggleGroup/States',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: toggleGroupSource },
      description: {
        component:
          'Estados do ToggleGroup: Default (nenhum selecionado), Selected (um ou mais ativos), Disabled (grupo inteiro bloqueado), DisabledItem (apenas um item bloqueado) e FocusVisible. Não há prop `aria-invalid` no grupo; para estado de erro, aplicar o atributo no item.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers locais ───────────────────────────────────────────────────────────

function makeAlignmentGroup(opts: {
  defaultValue?: string;
  disabledAll?: boolean;
  disabledIndex?: number;
}): HTMLElement {
  const items: ToggleGroupItem[] = [
    { value: 'left',   children: '', disabled: opts.disabledIndex === 0, 'aria-label': 'Alinhar à esquerda' },
    { value: 'center', children: '', disabled: opts.disabledIndex === 1, 'aria-label': 'Centralizar' },
    { value: 'right',  children: '', disabled: opts.disabledIndex === 2, 'aria-label': 'Alinhar à direita' },
  ];
  const group = createToggleGroup({
    type: 'single',
    variant: 'outline',
    items,
    disabled: opts.disabledAll,
    defaultValue: opts.defaultValue,
    'aria-label': 'Alinhamento do texto',
  });
  injectIcons(group, [AlignLeft, AlignCenter, AlignRight]);
  return group;
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => makeAlignmentGroup({}),
  parameters: {
    docs: {
      source: { transform: toggleGroupSourceWith({ defaultValue: null, items: [
            { value: 'left', icon: 'AlignLeft', 'aria-label': 'Alinhar à esquerda' },
            { value: 'center', icon: 'AlignCenter', 'aria-label': 'Centralizar' },
            { value: 'right', icon: 'AlignRight', 'aria-label': 'Alinhar à direita' },
          ] }) },
      description: { story: 'Estado inicial sem nenhum item selecionado. Todos os items têm `aria-pressed="false"` e `data-state="off"`. Fundo transparente; borda `input` da variante outline.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Sem seleção, nenhum item está pressionado', async () => {
      for (const b of canvas.getAllByRole('button')) {
        await expect(b).toHaveAttribute('aria-pressed', 'false');
        await expect(b).toHaveAttribute('data-state', 'off');
      }
    });
    await step('Mesmo sem seleção, um item entra na ordem de tabulação', async () => {
      // Roving tabindex não depende de haver item ativo: sem isto o grupo
      // inteiro sairia da navegação por Tab.
      const inOrder = canvas.getAllByRole('button').filter((b) => b.tabIndex === 0);
      await expect(inOrder).toHaveLength(1);
    });
  },
};

// ─── Selected ─────────────────────────────────────────────────────────────────

export const Selected: Story = {
  render: () => makeAlignmentGroup({ defaultValue: 'center' }),
  parameters: {
    covers: ['accessibility.item2'],
    docs: {
      source: { transform: toggleGroupSourceWith({ defaultValue: 'center', items: [
            { value: 'left', icon: 'AlignLeft', 'aria-label': 'Alinhar à esquerda' },
            { value: 'center', icon: 'AlignCenter', 'aria-label': 'Centralizar' },
            { value: 'right', icon: 'AlignRight', 'aria-label': 'Alinhar à direita' },
          ] }) },
      description: { story: 'Item ativo via `defaultValue`. `aria-pressed="true"`, `data-state="on"`, fundo `--accent`. A factory aplica automaticamente no click.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const center = canvas.getByRole('button', { name: 'Centralizar' });
    const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });

    await step('O item do defaultValue já nasce pressionado', async () => {
      await expect(center).toHaveAttribute('aria-pressed', 'true');
      await expect(center).toHaveAttribute('data-state', 'on');
    });

    await step('accessibility.item2 — o item ativo tem fundo próprio, não só o atributo', async () => {
      // O contraste de 4.5:1 é medido pelo axe; aqui a garantia é mais rasa e
      // complementar: sem a regra de CSS, ativo e inativo pintariam igual e o
      // estado só existiria para quem lê o DOM.
      await expect(getComputedStyle(center).backgroundColor).not.toBe(
        getComputedStyle(left).backgroundColor,
      );
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => makeAlignmentGroup({ defaultValue: 'left', disabledAll: true }),
  parameters: {
    docs: {
      source: { transform: toggleGroupSourceWith({ disabled: true, items: [
            { value: 'left', icon: 'AlignLeft', 'aria-label': 'Alinhar à esquerda' },
            { value: 'center', icon: 'AlignCenter', 'aria-label': 'Centralizar' },
            { value: 'right', icon: 'AlignRight', 'aria-label': 'Alinhar à direita' },
          ] }) },
      description: {
        story:
          '`disabled: true` no grupo — cada item nasce com o atributo HTML `disabled`, e o grupo marca `data-disabled`. A opacidade reduzida e a ausência de resposta ao ponteiro vêm da folha do Toggle.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('O grupo desabilitado se anuncia e desabilita cada item', async () => {
      await expect(canvas.getByRole('toolbar')).toHaveAttribute('data-disabled', '');
      for (const b of canvas.getAllByRole('button')) await expect(b).toBeDisabled();
    });
    await step('Clique não muda estado', async () => {
      const center = canvas.getByRole('button', { name: 'Centralizar' });
      await userEvent.click(center, { pointerEventsCheck: 0 });
      await expect(center).toHaveAttribute('aria-pressed', 'false');
    });
    await step('O estado desabilitado é visível, não só semântico', async () => {
      const opacity = parseFloat(getComputedStyle(canvas.getAllByRole('button')[0]).opacity);
      await expect(opacity).toBeLessThan(1);
    });
  },
};

// ─── DisabledItem ─────────────────────────────────────────────────────────────

export const DisabledItem: Story = {
  render: () => makeAlignmentGroup({ defaultValue: 'left', disabledIndex: 1 }),
  parameters: {
    docs: {
      source: { transform: toggleGroupSourceWith({
          items: [
            { value: 'left', icon: 'AlignLeft', 'aria-label': 'Alinhar à esquerda' },
            { value: 'center', icon: 'AlignCenter', 'aria-label': 'Centralizar', disabled: true },
            { value: 'right', icon: 'AlignRight', 'aria-label': 'Alinhar à direita' },
          ],
        }) },
      description: { story: 'Apenas o item Centralizar desabilitado via `item.disabled: true`. Os demais permanecem interativos. Útil quando uma opção não está disponível no contexto atual.' } },
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

export const FocusVisible: Story = {
  render: () => makeAlignmentGroup({ defaultValue: 'left' }),
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story:
          'Foco visível via Tab — anel de 2px na cor `--ring` aplicado pelo Toggle. O roving tabindex da factory mantém um único item na ordem de tabulação: Tab entra e sai do grupo inteiro, e as setas movem dentro dele. Space/Enter alternam o item focado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
    const center = canvas.getByRole('button', { name: 'Centralizar' });

    await step('accessibility.item3 — o anel de foco aparece na navegação por teclado', async () => {
      // `userEvent.tab()` e não `focus()`: `:focus-visible` só casa quando o
      // foco veio do teclado, e um `focus()` programático deixaria a regra
      // fora — o teste passaria verde com o anel invisível na prática.
      left.blur();
      await userEvent.tab();
      await expect(left).toHaveFocus();
      const sombra = getComputedStyle(left).boxShadow;
      await expect(sombra).not.toBe('none');
      await expect(sombra.length).toBeGreaterThan(0);
    });

    await step('Tab sai do grupo inteiro, não item a item', async () => {
      // É a contrapartida do roving tabindex: o segundo Tab abandona a barra.
      await userEvent.tab();
      await expect(left).not.toHaveFocus();
      await expect(center).not.toHaveFocus();
    });

    await step('Space alterna o item focado, e Enter faz o mesmo', async () => {
      left.focus();
      const antes = left.getAttribute('aria-pressed');
      await userEvent.keyboard(' ');
      await expect(left.getAttribute('aria-pressed')).not.toBe(antes);
      await userEvent.keyboard('{Enter}');
      await expect(left.getAttribute('aria-pressed')).toBe(antes);
    });
  },
};
