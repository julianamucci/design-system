import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createSeparator } from './separator';
import { separatorSource, separatorSourceCom } from './separator.source';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Separator/States',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: separatorSource },
      description: {
        component:
          'Modos do Separator: decorativo (padrão, ignorado por leitores de tela) e semântico ' +
          '(anunciado como divisor, com a própria orientação).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Decorative: Story = {
  parameters: { covers: ['functional.item3', 'accessibility.item2', 'accessibility.item3'] },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-md';
    wrap.dataset.spacing = 'sm';

    const heading = document.createElement('h3');
    heading.className = 'nds-text-body nds-font-medium';
    heading.textContent = 'Decorativo (padrão)';

    const note = document.createElement('p');
    note.className = 'nds-text-caption nds-text-muted-foreground';
    note.textContent = 'Ignorado por leitores de tela — a divisão é só visual.';

    const before = document.createElement('p');
    before.className = 'nds-text-body';
    before.textContent = 'Conteúdo antes do separador.';

    const after = document.createElement('p');
    after.className = 'nds-text-body';
    after.textContent = 'Conteúdo depois do separador.';

    wrap.append(
      heading,
      note,
      before,
      createSeparator({ orientation: 'horizontal', decorative: true }),
      after,
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const sep = canvasElement.querySelector<HTMLElement>('.nds-separator');

    await step('Sai da árvore de acessibilidade', async () => {
      await expect(sep).toHaveAttribute('role', 'none');
      await expect(sep).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Não anuncia orientação', async () => {
      // `aria-orientation` não é permitido em role="none" e nada informaria
      // fora da árvore de acessibilidade — o atributo é ruído, não detalhe.
      await expect(sep).not.toHaveAttribute('aria-orientation');
    });
  },
};

export const Semantic: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item4'],
    // O modo semântico é o assunto: sem o override o snippet mostraria o
    // decorativo, que é o padrão da fábrica.
    docs: {
      source: {
        transform: separatorSourceCom({
          decorative: false,
          antes: 'Categoria: Layout',
          depois: 'Categoria: Formulários',
        }),
      },
    },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-md';
    wrap.dataset.spacing = 'sm';

    const heading = document.createElement('h3');
    heading.className = 'nds-text-body nds-font-medium';
    heading.textContent = 'Semântico';

    const note = document.createElement('p');
    note.className = 'nds-text-caption nds-text-muted-foreground';
    note.textContent = 'Anunciado como divisor, com a orientação da linha.';

    const before = document.createElement('p');
    before.className = 'nds-text-body';
    before.textContent = 'Categoria: Layout';

    const after = document.createElement('p');
    after.className = 'nds-text-body';
    after.textContent = 'Categoria: Formulários';

    wrap.append(
      heading,
      note,
      before,
      createSeparator({ orientation: 'horizontal', decorative: false }),
      after,
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const sep = canvasElement.querySelector<HTMLElement>('.nds-separator');

    await step('Exposto como divisor', async () => {
      await expect(sep).toHaveAttribute('role', 'separator');
      await expect(sep).not.toHaveAttribute('aria-hidden');
    });

    await step('Anuncia a própria orientação', async () => {
      await expect(sep).toHaveAttribute('aria-orientation', 'horizontal');
    });
  },
};
