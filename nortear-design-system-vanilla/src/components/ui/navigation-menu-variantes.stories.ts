import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { createNavigationMenu } from './navigation-menu';
import { abrir, fechar, wrap } from './navigation-menu.fixtures';
import { navigationMenuSource, navigationMenuSourceCom } from './navigation-menu.source';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/NavigationMenu/Variants',
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
      const lista = canvasElement.querySelector<HTMLElement>('[data-slot="navigation-menu-list"]');
      await expect(lista?.getAttribute('data-orientation')).toBe('horizontal');
      await expect(lista?.classList.contains('nds-navigation-menu-list')).toBe(true);
      await expect(lista?.classList.contains('nds-stack')).toBe(false);
    });

    await step('Cinco itens, dois deles com painel', async () => {
      await expect(canvasElement.querySelectorAll('li')).toHaveLength(5);
      await expect(canvas.getAllByRole('button')).toHaveLength(2);
      await expect(canvas.getAllByRole('link')).toHaveLength(3);
    });

    await step('Os itens ficam lado a lado, na mesma linha', async () => {
      const itens = [...canvasElement.querySelectorAll<HTMLElement>('li')];
      const primeiro = itens[0].getBoundingClientRect();
      const segundo = itens[1].getBoundingClientRect();
      await expect(segundo.left).toBeGreaterThan(primeiro.left);
      await expect(Math.abs(segundo.top - primeiro.top)).toBeLessThan(2);
    });

    await step('O painel abre abaixo da barra', async () => {
      const gatilho = canvas.getByRole('button', { name: /Produtos/ });
      const painel = await abrir(gatilho, canvasElement);
      await expect(painel.getBoundingClientRect().top).toBeGreaterThan(
        gatilho.getBoundingClientRect().top,
      );
      await fechar(gatilho, canvasElement);
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
        transform: navigationMenuSourceCom({
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
      const lista = canvasElement.querySelector<HTMLElement>('[data-slot="navigation-menu-list"]');
      await expect(lista?.getAttribute('data-orientation')).toBe('vertical');
      await expect(lista?.classList.contains('nds-stack')).toBe(true);
      await expect(lista?.classList.contains('nds-navigation-menu-list')).toBe(false);
    });

    await step('Os itens empilham em coluna', async () => {
      const itens = [...canvasElement.querySelectorAll<HTMLElement>('li')];
      await expect(itens).toHaveLength(3);
      const primeiro = itens[0].getBoundingClientRect();
      const segundo = itens[1].getBoundingClientRect();
      await expect(segundo.top).toBeGreaterThan(primeiro.top);
    });

    await step('As setas do eixo vertical percorrem a barra', async () => {
      const painel = canvas.getByRole('link', { name: 'Painel' });
      const gatilho = canvas.getByRole('button', { name: /Relatórios/ });
      painel.focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(gatilho);
      await userEvent.keyboard('{ArrowUp}');
      await expect(document.activeElement).toBe(painel);
    });

    await step('O painel abre ao lado, nunca por baixo', async () => {
      const gatilho = canvas.getByRole('button', { name: /Relatórios/ });
      const painel = await abrir(gatilho, canvasElement);
      await expect(painel.getBoundingClientRect().left).toBeGreaterThan(
        gatilho.getBoundingClientRect().left,
      );
      await fechar(gatilho, canvasElement);
    });
  },
};
