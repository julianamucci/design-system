import type { Meta, StoryObj } from '@storybook/html';
import { expect } from 'storybook/test';
import { createSeparator } from './separator';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Separator/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Modos do Separator: decorativo (padrão, ignorado por SR) e semântico ' +
          '(role=separator + aria-orientation, anunciado por leitores de tela).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Decorativo: Story = {
  name: 'Decorativo',
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-full nds-max-w-md';
    wrap.dataset.spacing = 'sm';

    const heading = document.createElement('h3');
    heading.className = 'nds-text-body nds-font-medium';
    heading.textContent = 'Decorativo (padrão)';

    const note = document.createElement('p');
    note.className = 'nds-text-caption nds-text-muted-foreground';
    note.textContent = 'role="none" + aria-hidden="true". Ignorado por leitores de tela.';

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
    await step('Modo decorativo: role=none + aria-hidden=true', async () => {
      const separator = canvasElement.querySelector<HTMLElement>('[role="none"]');
      await expect(separator).toBeTruthy();
      await expect(separator).toHaveAttribute('aria-hidden', 'true');
    });
  },
};

export const Semantico: Story = {
  name: 'Semantico',
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-full nds-max-w-md';
    wrap.dataset.spacing = 'sm';

    const heading = document.createElement('h3');
    heading.className = 'nds-text-body nds-font-medium';
    heading.textContent = 'Semântico';

    const note = document.createElement('p');
    note.className = 'nds-text-caption nds-text-muted-foreground';
    note.textContent = 'role="separator" + aria-orientation. Anunciado por leitores de tela.';

    const before = document.createElement('p');
    before.className = 'nds-text-body';
    before.textContent = 'Categoria: Layout';

    const after = document.createElement('p');
    after.className = 'nds-text-body';
    after.textContent = 'Categoria: Forms';

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
    await step('Modo semântico: role=separator + aria-orientation', async () => {
      const separator = canvasElement.querySelector<HTMLElement>('[role="separator"]');
      await expect(separator).toBeTruthy();
      await expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    });
  },
};
