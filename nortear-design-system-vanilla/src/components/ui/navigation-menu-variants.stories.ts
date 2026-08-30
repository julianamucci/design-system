import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { createNavigationMenu } from './navigation-menu';
import { open, close, wrap } from './navigation-menu.fixtures';
import { navigationMenuSource, navigationMenuSourceWith } from './navigation-menu.source';

const meta: Meta = {
  tags: ['navigation'],
  title: 'Primitives/Navigation/NavigationMenu/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      source: { transform: navigationMenuSource },
      description: {
        component:
          'As duas direções da barra. Horizontal é o cabeçalho de site, com os itens em linha e o painel abrindo para baixo; vertical é a coluna de uma barra lateral ou gaveta, com os itens empilhados e o painel abrindo para o lado — abrir para baixo numa coluna cobriria os próprios itens seguintes.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => {
    const nav = createNavigationMenu([
      { label: 'Início', href: '#inicio' },
      {
        label: 'Produtos',
        children: [
          { label: 'Plano Inicial', href: '#inicial' },
          { label: 'Plano Profissional', href: '#profissional' },
        ],
      },
      {
        label: 'Recursos',
        children: [
          { label: 'Guias', href: '#guias' },
          { label: 'Referência da API', href: '#api' },
        ],
      },
      { label: 'Preços', href: '#precos' },
      { label: 'Sobre', href: '#sobre' },
    ]);
    nav.setAttribute('aria-label', 'Navegação principal');
    return wrap(nav);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A orientação padrão chega ao markup e à classe da lista', async () => {
      const list = canvasElement.querySelector<HTMLElement>('[data-slot="navigation-menu-list"]');
      await expect(list?.getAttribute('data-orientation')).toBe('horizontal');
      await expect(list?.classList.contains('nds-navigation-menu-list')).toBe(true);
      await expect(list?.classList.contains('nds-stack')).toBe(false);
    });

    await step('Cinco itens, dois deles com painel', async () => {
      await expect(canvasElement.querySelectorAll('li')).toHaveLength(5);
      await expect(canvas.getAllByRole('button')).toHaveLength(2);
      await expect(canvas.getAllByRole('link')).toHaveLength(3);
    });

    await step('Os itens ficam lado a lado, na mesma linha', async () => {
      const items = [...canvasElement.querySelectorAll<HTMLElement>('li')];
      const first = items[0].getBoundingClientRect();
      const segundo = items[1].getBoundingClientRect();
      await expect(segundo.left).toBeGreaterThan(first.left);
      await expect(Math.abs(segundo.top - first.top)).toBeLessThan(2);
    });

    await step('O painel abre abaixo da barra', async () => {
      const trigger = canvas.getByRole('button', { name: /Produtos/ });
      const panel = await open(trigger, canvasElement);
      await expect(panel.getBoundingClientRect().top).toBeGreaterThan(
        trigger.getBoundingClientRect().top,
      );
      await close(trigger, canvasElement);
    });
  },
};

export const Vertical: Story = {
  // A orientação é opção da fábrica, e é o assunto da story: sem override o
  // painel mostraria a barra horizontal, que é o padrão.
  parameters: {
    covers: ['visual.item5'],
    docs: {
      source: {
        transform: navigationMenuSourceWith({
          orientation: 'vertical',
          class: 'nds-w-sm',
          ariaLabel: 'Navegação da conta',
          items: [
            { label: 'Painel', href: '#painel' },
            {
              label: 'Relatórios',
              children: [
                { label: 'Vendas', href: '#vendas' },
                { label: 'Assinaturas', href: '#assinaturas' },
              ],
            },
            { label: 'Configurações', href: '#configuracoes' },
          ],
        }),
      },
    },
  },
  render: () => {
    const nav = createNavigationMenu(
      [
        { label: 'Painel', href: '#painel' },
        {
          label: 'Relatórios',
          children: [
            { label: 'Vendas', href: '#vendas' },
            { label: 'Assinaturas', href: '#assinaturas' },
          ],
        },
        { label: 'Configurações', href: '#configuracoes' },
      ],
      // A orientação é opção da factory, não remendo da story: a versão antiga
      // empilhava a barra com `style` inline e trocava a classe do `<ul>` à mão,
      // o que tirava a coluna do tema, da densidade e da escala.
      { orientation: 'vertical' },
    );
    nav.setAttribute('aria-label', 'Navegação da conta');
    nav.classList.add('nds-w-sm');
    return wrap(nav, 260);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A orientação vertical troca a classe da lista', async () => {
      // A folha compartilhada só descreve a barra horizontal — não há regra por
      // `data-orientation` na lista. Na vertical ela vira `.nds-stack`, que é a
      // mesma saída das demais stacks.
      const list = canvasElement.querySelector<HTMLElement>('[data-slot="navigation-menu-list"]');
      await expect(list?.getAttribute('data-orientation')).toBe('vertical');
      await expect(list?.classList.contains('nds-stack')).toBe(true);
      await expect(list?.classList.contains('nds-navigation-menu-list')).toBe(false);
    });

    await step('Os itens empilham em coluna', async () => {
      const items = [...canvasElement.querySelectorAll<HTMLElement>('li')];
      await expect(items).toHaveLength(3);
      const first = items[0].getBoundingClientRect();
      const segundo = items[1].getBoundingClientRect();
      await expect(segundo.top).toBeGreaterThan(first.top);
    });

    await step('As setas do eixo vertical percorrem a barra', async () => {
      const panel = canvas.getByRole('link', { name: 'Painel' });
      const trigger = canvas.getByRole('button', { name: /Relatórios/ });
      panel.focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(trigger);
      await userEvent.keyboard('{ArrowUp}');
      await expect(document.activeElement).toBe(panel);
    });

    await step('O painel abre ao lado, nunca por baixo', async () => {
      const trigger = canvas.getByRole('button', { name: /Relatórios/ });
      const panel = await open(trigger, canvasElement);
      await expect(panel.getBoundingClientRect().left).toBeGreaterThan(
        trigger.getBoundingClientRect().left,
      );
      await close(trigger, canvasElement);
    });
  },
};
