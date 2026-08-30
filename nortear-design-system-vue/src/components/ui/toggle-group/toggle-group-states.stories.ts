import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import { ToggleGroup, ToggleGroupItem } from './index';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-vue-next';
import {
  toggleGroupDisabledSource,
  toggleGroupItemDisabledSource,
  toggleGroupDefaultSource,
  toggleGroupSelectedSource,
} from './toggle-group.source';

const meta = {
  title: 'Primitives/Form/ToggleGroup/States',
  component: ToggleGroup,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: toggleGroupDefaultSource },
      description: {
        component:
          'Estados do ToggleGroup: default, selected (aria-pressed=true), hover, focus (roving tabindex) e disabled.',
      },
    },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight },
    setup() { return {}; },
    template: `
      <ToggleGroup type="single" aria-label="Alinhamento do texto">
        <ToggleGroupItem value="left" aria-label="Alinhar à esquerda"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Centralizar"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Alinhar à direita"><AlignRight aria-hidden="true" /></ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
    await step('Todos itens começam não-pressionados', async () => {
      await expect(left).toHaveAttribute('aria-pressed', 'false');
      await expect(left).toHaveAttribute('data-state', 'off');
    });
  },
};

export const Selected: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight },
    setup() { return {}; },
    template: `
      <ToggleGroup type="single" default-value="center" aria-label="Alinhamento do texto">
        <ToggleGroupItem value="left" aria-label="Alinhar à esquerda"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Centralizar"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Alinhar à direita"><AlignRight aria-hidden="true" /></ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  parameters: {
    covers: ['accessibility.item2'],
    // A seleção inicial é o assunto, e ela vem de `default-value` na raiz — a do
    // meta nasce sem item nenhum ligado.
    docs: { source: { transform: toggleGroupSelectedSource } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const center = canvas.getByRole('button', { name: 'Centralizar' });
    const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
    await step('Item selecionado tem aria-pressed=true e data-state=on', async () => {
      await expect(center).toHaveAttribute('aria-pressed', 'true');
      await expect(center).toHaveAttribute('data-state', 'on');
    });
    await step('accessibility.item2 — o item ativo tem fundo próprio, não só o atributo', async () => {
      // O contraste de 4.5:1 é medido pelo axe; aqui a garantia é mais rasa e
      // complementar: sem a regra de CSS, ativo e inativo pintariam igual.
      await expect(getComputedStyle(center).backgroundColor).not.toBe(
        getComputedStyle(left).backgroundColor,
      );
    });
  },
};

export const FocusVisible: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight },
    setup() { return {}; },
    template: `
      <ToggleGroup type="single" aria-label="Alinhamento do texto">
        <ToggleGroupItem value="left" aria-label="Alinhar à esquerda"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Centralizar"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Alinhar à direita"><AlignRight aria-hidden="true" /></ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story: 'Foco via teclado com roving tabindex: Tab entra no grupo, setas movem o foco. Anel de 2px na cor --ring visível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
    const center = canvas.getByRole('button', { name: 'Centralizar' });

    await step('Roving tabindex — o grupo inteiro é uma parada de Tab só', async () => {
      // A lib entrega o roving pela BORDA do grupo: enquanto nenhum item foi
      // focado, quem carrega `tabindex="0"` é o container, e o foco entra dele
      // para o item ativo. Contar só os itens daria zero e acusaria um defeito
      // que não existe — o que o contrato exige é uma parada, não onde ela mora.
      const group = canvasElement.querySelector('[data-slot="toggle-group"]') as HTMLElement;
      const orderItems = canvas.getAllByRole('button').filter((b) => b.tabIndex === 0);
      const paradas = orderItems.length + (group.tabIndex === 0 ? 1 : 0);
      await expect(paradas).toBe(1);
    });

    await step('accessibility.item3 — o anel de foco aparece na navegação por teclado', async () => {
      // `userEvent.tab()` e não `focus()`: `:focus-visible` só casa quando o
      // foco veio do teclado, e um `focus()` programático deixaria a regra
      // fora — o teste passaria verde com o anel invisível na prática.
      (left as HTMLElement).blur();
      await userEvent.tab();
      await expect(left).toHaveFocus();
      const sombra = getComputedStyle(left).boxShadow;
      await expect(sombra).not.toBe('none');
      await expect(sombra.length).toBeGreaterThan(0);
    });

    await step('ArrowRight move foco para o próximo item', async () => {
      await userEvent.keyboard('{ArrowRight}');
      await expect(center).toHaveFocus();
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight },
    setup() { return {}; },
    template: `
      <ToggleGroup type="single" :disabled="true" aria-label="Alinhamento do texto">
        <ToggleGroupItem value="left" aria-label="Alinhar à esquerda"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Centralizar"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Alinhar à direita"><AlignRight aria-hidden="true" /></ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  parameters: {
    // A prop desce do grupo para todos os itens — a do meta mostraria o grupo
    // vivo, que é o oposto do que a story documenta.
    docs: { source: { transform: toggleGroupDisabledSource } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
    await step('Itens estão disabled', async () => {
      await expect(left).toBeDisabled();
      await expect(left).toHaveAttribute('data-disabled');
    });
    await step('Clique não altera estado', async () => {
      await userEvent.click(left, { pointerEventsCheck: 0 });
      await expect(left).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

export const ItemDisabled: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight },
    setup() { return {}; },
    template: `
      <ToggleGroup type="single" aria-label="Alinhamento do texto">
        <ToggleGroupItem value="left" aria-label="Alinhar à esquerda"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="center" :disabled="true" aria-label="Centralizar"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Alinhar à direita"><AlignRight aria-hidden="true" /></ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  parameters: {
    // Aqui a prop mora no ITEM, não na raiz: é a diferença que a story existe
    // para mostrar, e o snippet do meta a esconderia.
    docs: { source: { transform: toggleGroupItemDisabledSource } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
    const center = canvas.getByRole('button', { name: 'Centralizar' });
    await step('Apenas o item central está desabilitado', async () => {
      await expect(center).toBeDisabled();
      await expect(left).not.toBeDisabled();
    });
  },
};
