import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsToggle, NdsToggleIcon } from './toggle';
import { NdsToggleGroup, NdsToggleGroupIcon } from './toggle-group';

const meta: Meta = {
  title: 'UI/ToggleGroup/Variantes',
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

export const Single: Story = {
  parameters: { covers: ['functional.item1', 'visual.item1'] },
  render: () => ({
    template: `
      <div
        ndsToggleGroup
        variant="outline"
        defaultValue="left"
        aria-label="Alinhamento do texto"
      >
        <button ndsToggle variant="outline" value="left" aria-label="Alinhar à esquerda">
          <svg ndsToggleGroupIcon kind="align-left"></svg>
        </button>
        <button ndsToggle variant="outline" value="center" aria-label="Centralizar">
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
    const centro = canvas.getByRole('button', { name: 'Centralizar' });

    await step('O modo exclusivo nasce com exatamente um item ativo', async () => {
      const pressionados = canvas
        .getAllByRole('button')
        .filter((b) => b.getAttribute('aria-pressed') === 'true');
      await expect(pressionados).toHaveLength(1);
    });

    await step('functional.item1 — escolher um item desliga o anterior', async () => {
      await definir(centro, true);
      await expect(centro).toHaveAttribute('aria-pressed', 'true');
      await expect(esquerda).toHaveAttribute('aria-pressed', 'false');
      await expect(esquerda).toHaveAttribute('data-state', 'off');
      // Volta ao estado inicial para a próxima rodada começar igual a esta.
      await definir(esquerda, true);
    });

    await step('Emendados: o conjunto tem uma borda só, e os cantos internos são retos', async () => {
      // `data-variant="outline"` certo com CSS ausente daria três botões
      // soltos — é o defeito que só a medida pega.
      const grupo = canvas.getByRole('toolbar');
      await expect(grupo).toHaveAttribute('data-variant', 'outline');
      await expect(parseFloat(getComputedStyle(grupo).borderTopWidth)).toBeGreaterThan(0);
      await expect(parseFloat(getComputedStyle(centro).borderTopLeftRadius)).toBe(0);
    });
  },
};

export const Multiple: Story = {
  parameters: { covers: ['functional.item2', 'visual.item2'] },
  render: () => ({
    template: `
      <div
        ndsToggleGroup
        type="multiple"
        variant="outline"
        [defaultValue]="['bold', 'italic']"
        aria-label="Formatação"
      >
        <button ndsToggle variant="outline" value="bold" aria-label="Negrito">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
        <button ndsToggle variant="outline" value="italic" aria-label="Itálico">
          <svg ndsToggleIcon kind="italic"></svg>
        </button>
        <button ndsToggle variant="outline" value="underline" aria-label="Sublinhado">
          <svg ndsToggleIcon kind="underline"></svg>
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const negrito = canvas.getByRole('button', { name: 'Negrito' });
    const italico = canvas.getByRole('button', { name: 'Itálico' });
    const sublinhado = canvas.getByRole('button', { name: 'Sublinhado' });

    const ativos = () =>
      canvas.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true');

    await step('O modo combinado aceita mais de um ativo ao mesmo tempo', async () => {
      await definir(negrito, true);
      await definir(italico, true);
      await definir(sublinhado, false);
      await expect(ativos()).toHaveLength(2);
    });

    await step('functional.item2 — ligar um item soma; desligar subtrai', async () => {
      await definir(sublinhado, true);
      await expect(ativos()).toHaveLength(3);
      await expect(negrito).toHaveAttribute('aria-pressed', 'true');

      await definir(italico, false);
      await expect(ativos()).toHaveLength(2);
      await expect(italico).toHaveAttribute('data-state', 'off');

      // Restaura o estado inicial da story.
      await definir(italico, true);
      await definir(sublinhado, false);
    });
  },
};

export const Vertical: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    template: `
      <div
        ndsToggleGroup
        orientation="vertical"
        variant="outline"
        defaultValue="grid"
        aria-label="Modo de visualização"
      >
        <button ndsToggle variant="outline" value="grid">
          <svg ndsToggleGroupIcon kind="grid"></svg>
          Grade
        </button>
        <button ndsToggle variant="outline" value="list">
          <svg ndsToggleIcon kind="list"></svg>
          Lista
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const grupo = canvas.getByRole('toolbar');
    const grade = canvas.getByRole('button', { name: 'Grade' });
    const lista = canvas.getByRole('button', { name: 'Lista' });

    await step('A orientação chega ao markup e ao anúncio', async () => {
      await expect(grupo).toHaveAttribute('data-orientation', 'vertical');
      await expect(grupo).toHaveAttribute('aria-orientation', 'vertical');
    });

    await step('Empilhado de verdade: o segundo item começa abaixo do primeiro', async () => {
      // `data-orientation` certo com CSS ausente deixaria os dois lado a lado.
      const a = grade.getBoundingClientRect();
      const b = lista.getBoundingClientRect();
      await expect(b.top).toBeGreaterThanOrEqual(a.bottom - 1);
    });

    await step('Com texto visível, aria-label seria ruído', async () => {
      await expect(grade.getAttribute('aria-label')).toBe(null);
      await expect(grade.textContent?.trim()).toBe('Grade');
    });

    await step('As setas verticais navegam, e as horizontais não roubam o foco', async () => {
      grade.focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(lista).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(grade).toHaveFocus();
    });
  },
};
