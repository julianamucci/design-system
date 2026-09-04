import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsToggle, NdsToggleIcon } from './toggle';
import { NdsToggleGroup, NdsToggleGroupIcon } from './toggle-group';

const meta: Meta = {
  title: 'Components/Form/ToggleGroup/States',
  tags: ['form'],
  decorators: [
    moduleMetadata({ imports: [NdsToggleGroup, NdsToggleGroupIcon, NdsToggle, NdsToggleIcon] }),
  ],
  parameters: {
    layout: 'padded',
    // Sem argTypes nesta story: o painel Controls ficaria vazio.
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

const ALIGNMENT = `
  <button ndsToggle variant="outline" value="left" aria-label="Alinhar à esquerda">
    <svg ndsToggleGroupIcon kind="align-left"></svg>
  </button>
  <button ndsToggle variant="outline" value="center" aria-label="Centralizar">
    <svg ndsToggleGroupIcon kind="align-center"></svg>
  </button>
  <button ndsToggle variant="outline" value="right" aria-label="Alinhar à direita">
    <svg ndsToggleGroupIcon kind="align-right"></svg>
  </button>
`;

export const Default: Story = {
  render: () => ({
    template: `
      <div ndsToggleGroup variant="outline" aria-label="Alinhamento do texto">
        ${ALIGNMENT}
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sem seleção, nenhum item está pressionado', async () => {
      for (const button of canvas.getAllByRole('button')) {
        await expect(button).toHaveAttribute('aria-pressed', 'false');
        await expect(button).toHaveAttribute('data-state', 'off');
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

export const Selected: Story = {
  parameters: { covers: ['accessibility.item2'] },
  render: () => ({
    template: `
      <div ndsToggleGroup variant="outline" defaultValue="center" aria-label="Alinhamento do texto">
        ${ALIGNMENT}
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const center = canvas.getByRole('button', { name: 'Centralizar' });
    const esquerda = canvas.getByRole('button', { name: 'Alinhar à esquerda' });

    await step('O item do defaultValue já nasce pressionado', async () => {
      await expect(center).toHaveAttribute('aria-pressed', 'true');
      await expect(center).toHaveAttribute('data-state', 'on');
    });

    await step('accessibility.item2 — o item ativo tem fundo próprio, não só o atributo', async () => {
      // O contraste de 4.5:1 é medido pelo axe; aqui a garantia é mais rasa e
      // complementar: sem a regra de CSS, ativo e inativo pintariam igual e o
      // estado só existiria para quem lê o DOM.
      const backgroundActive = getComputedStyle(center).backgroundColor;
      const backgroundInactive = getComputedStyle(esquerda).backgroundColor;
      await expect(backgroundActive).not.toBe(backgroundInactive);
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <div ndsToggleGroup variant="outline" [disabled]="true" defaultValue="left" aria-label="Alinhamento do texto">
        ${ALIGNMENT}
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O grupo desabilitado se anuncia e desabilita cada item', async () => {
      const group = canvas.getByRole('toolbar');
      await expect(group).toHaveAttribute('data-disabled', '');
      for (const button of canvas.getAllByRole('button')) {
        await expect(button).toBeDisabled();
      }
    });

    await step('O estado desabilitado é visível, não só semântico', async () => {
      const opacity = parseFloat(getComputedStyle(canvas.getAllByRole('button')[0]).opacity);
      await expect(opacity).toBeLessThan(1);
    });
  },
};

export const ItemDisabled: Story = {
  render: () => ({
    template: `
      <div ndsToggleGroup variant="outline" defaultValue="left" aria-label="Alinhamento do texto">
        <button ndsToggle variant="outline" value="left" aria-label="Alinhar à esquerda">
          <svg ndsToggleGroupIcon kind="align-left"></svg>
        </button>
        <button ndsToggle variant="outline" value="center" [disabled]="true" aria-label="Centralizar (indisponível)">
          <svg ndsToggleGroupIcon kind="align-center"></svg>
        </button>
        <button ndsToggle variant="outline" value="right" aria-label="Alinhar à direita">
          <svg ndsToggleGroupIcon kind="align-right"></svg>
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const esquerda = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
    const center = canvas.getByRole('button', { name: 'Centralizar (indisponível)' });
    const direita = canvas.getByRole('button', { name: 'Alinhar à direita' });

    await step('Só o item marcado fica desabilitado', async () => {
      await expect(center).toBeDisabled();
      await expect(esquerda).toBeEnabled();
      await expect(direita).toBeEnabled();
    });

    await step('A seta pula o item indisponível em vez de parar nele', async () => {
      // O grupo lê o metadado que cada item publica no composite; sem isso a
      // navegação encalharia num botão que não recebe foco.
      esquerda.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(direita).toHaveFocus();
    });
  },
};

// Variante default aqui; a mesma story no Vanilla mede o anel DENTRO de um
// grupo outline. As duas medem porque o reset de sombra do grupo outline
// (`.nds-toggle-group[data-variant="outline"] > .nds-toggle { box-shadow: none }`)
// vencia `.nds-toggle:focus-visible` por especificidade e apagava o anel na
// variante mais usada — a folha compartilhada passou a restaurá-lo com uma
// regra de especificidade maior, e é essa regra que a story do Vanilla guarda.
export const FocusVisible: Story = {
  parameters: { covers: ['accessibility.item3'] },
  render: () => ({
    template: `
      <div ndsToggleGroup defaultValue="left" aria-label="Alinhamento do texto">
        <button ndsToggle value="left" aria-label="Alinhar à esquerda">
          <svg ndsToggleGroupIcon kind="align-left"></svg>
        </button>
        <button ndsToggle value="center" aria-label="Centralizar">
          <svg ndsToggleGroupIcon kind="align-center"></svg>
        </button>
        <button ndsToggle value="right" aria-label="Alinhar à direita">
          <svg ndsToggleGroupIcon kind="align-right"></svg>
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const esquerda = canvas.getByRole('button', { name: 'Alinhar à esquerda' });

    await step('accessibility.item3 — o anel de foco aparece na navegação por teclado', async () => {
      // `userEvent.tab()` e não `focus()`: `:focus-visible` só casa quando o
      // foco veio do teclado, e um `focus()` programático deixaria a regra
      // fora — o teste passaria verde com o anel invisível na prática.
      await userEvent.tab();
      await expect(esquerda).toHaveFocus();
      const sombra = getComputedStyle(esquerda).boxShadow;
      await expect(sombra).not.toBe('none');
      await expect(sombra.length).toBeGreaterThan(0);
    });

    await step('Tab sai do grupo inteiro, não item a item', async () => {
      // É a contrapartida do roving tabindex: o segundo Tab abandona a barra.
      await userEvent.tab();
      await expect(esquerda).not.toHaveFocus();
      await expect(canvas.getByRole('button', { name: 'Centralizar' })).not.toHaveFocus();
    });
  },
};
