import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createSeparator } from './separator';
import { separatorSource, separatorSourceWith } from './separator.source';

const meta: Meta = {
  tags: ['layout'],
  title: 'Components/Layout/Separator/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: separatorSource },
      description: {
        component:
          'Orientações do Separator. A horizontal é uma linha de 1px de altura que ocupa a largura do contêiner; ' +
          'a vertical é uma linha de 1px de largura cuja altura vem do contêiner flex ou de grade, sem medida cravada.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  parameters: { covers: ['functional.item1', 'visual.item1'] },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-md';
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
    const wrap = canvasElement.querySelector<HTMLElement>('.nds-stack')!;
    const sep = wrap.querySelector<HTMLElement>('.nds-separator');

    await step('A orientação horizontal chega ao DOM', async () => {
      await expect(sep).toBeInTheDocument();
      await expect(sep).toHaveAttribute('data-orientation', 'horizontal');
    });

    await step('Linha fina na altura e cheia na largura', async () => {
      // O que o horizontal promete é linha cheia e fina. Medir os dois evita
      // que uma troca de folha passe com o atributo certo e o visual errado.
      const box = sep!.getBoundingClientRect();
      const parent = wrap.getBoundingClientRect();
      await expect(box.height).toBeCloseTo(1, 1);
      await expect(box.width).toBeCloseTo(parent.width, 0);
    });
  },
};

export const Vertical: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item2'],
    // A orientação é o assunto da story, e nenhum control a cobre aqui: sem o
    // override o painel Code mostraria a horizontal, que é o padrão da fábrica.
    docs: { source: { transform: separatorSourceWith({ orientation: 'vertical', antes: 'Blog', depois: 'Documentação' }) } },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-cluster nds-docs-demo-row nds-w-md';
    wrap.dataset.spacing = 'md';

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
    const seps = canvasElement.querySelectorAll<HTMLElement>('.nds-separator');

    await step('As duas linhas verticais chegam ao DOM', async () => {
      await expect(seps).toHaveLength(2);
      await expect(seps[0]).toHaveAttribute('data-orientation', 'vertical');
    });

    await step('Linha fina na largura e esticada na altura, sem medida cravada', async () => {
      // Este é o caso que a asserção antiga jamais pegaria: o separador vertical
      // colapsa para 0px quando o contêiner não é flex nem grade, e continua
      // presente no DOM com o atributo certo. Medir a altura é o que denuncia.
      const box = seps[0].getBoundingClientRect();
      await expect(box.width).toBeCloseTo(1, 1);
      await expect(box.height).toBeGreaterThan(8);
      await expect(seps[0].style.height).toBe('');
    });
  },
};
