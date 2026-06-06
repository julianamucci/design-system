import type { Meta, StoryObj } from '@storybook/html';
import { expect } from 'storybook/test';
import { createSeparator } from './separator';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Separator/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Orientações do Separator: horizontal (h-px w-full) e vertical (w-px h-full). ' +
          'A orientação vertical exige um parent com altura definida ou flex container.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  name: 'Horizontal',
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-full nds-max-w-md';
    wrap.dataset.spacing = 'md';

    const top = document.createElement('div');
    top.className = 'nds-text-body';
    const topTitle = document.createElement('p');
    topTitle.className = 'nds-font-medium';
    topTitle.textContent = 'Configurações da conta';
    const topDesc = document.createElement('p');
    topDesc.className = 'nds-text-muted-foreground';
    topDesc.textContent = 'Gerencie seu nome e e-mail.';
    top.append(topTitle, topDesc);

    const bottom = document.createElement('div');
    bottom.className = 'nds-text-body';
    const bottomTitle = document.createElement('p');
    bottomTitle.className = 'nds-font-medium';
    bottomTitle.textContent = 'Preferências';
    const bottomDesc = document.createElement('p');
    bottomDesc.className = 'nds-text-muted-foreground';
    bottomDesc.textContent = 'Tema, idioma e notificações.';
    bottom.append(bottomTitle, bottomDesc);

    wrap.append(top, createSeparator({ orientation: 'horizontal' }), bottom);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    await step('Separator horizontal com bg-border presente', async () => {
      const separator = canvasElement.querySelector<HTMLElement>('.bg-border');
      await expect(separator).toBeTruthy();
    });
    await step('Classes de dimensão horizontal (h-[1px] + w-full)', async () => {
      const separator = canvasElement.querySelector<HTMLElement>('.bg-border');
      await expect(separator).toHaveClass('h-[1px]');
      await expect(separator).toHaveClass('w-full');
    });
  },
};

export const Vertical: Story = {
  name: 'Vertical',
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-cluster nds-w-full nds-max-w-md';
    wrap.style.height = '4rem';

    const a = document.createElement('span');
    a.className = 'nds-text-body';
    a.textContent = 'Blog';

    const b = document.createElement('span');
    b.className = 'nds-text-body';
    b.textContent = 'Documentação';

    const c = document.createElement('span');
    c.className = 'nds-text-body';
    c.textContent = 'Contato';

    wrap.append(
      a,
      createSeparator({ orientation: 'vertical' }),
      b,
      createSeparator({ orientation: 'vertical' }),
      c,
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    await step('Separators verticais com bg-border presentes', async () => {
      const separators = canvasElement.querySelectorAll<HTMLElement>('.bg-border');
      await expect(separators.length).toBeGreaterThan(0);
    });
    await step('Classes de dimensão vertical (w-[1px] + h-full)', async () => {
      const separator = canvasElement.querySelector<HTMLElement>('.bg-border');
      await expect(separator).toHaveClass('w-[1px]');
      await expect(separator).toHaveClass('h-full');
    });
  },
};
