import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, userEvent } from 'storybook/test';
import NavigationMenuStory from './NavigationMenuStory.svelte';
import { abrir, fechar } from './navigation-menu.fixtures';
import { navigationMenuSource } from './navigation-menu.source';

const meta: Meta = {
  title: 'UI/NavigationMenu/Variants',
  component: NavigationMenuStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; a composição de cada uma
      // sai dos próprios `args`, que são os mesmos que a demonstração usa.
      source: { transform: navigationMenuSource },
      description: {
        component:
          'As duas direções da barra. Horizontal é o cabeçalho de site, com os itens em linha; vertical é a coluna de uma barra lateral ou gaveta, com os itens empilhados.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
    ariaLabel: 'Navegação principal',
    demonstration: 'bar',
    delayDuration: 100,
  },
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story: 'Padrão — itens lado a lado; usado em cabeçalhos de site e de produto web.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cinco itens, dois deles com painel', async () => {
      const itens = canvasElement.querySelectorAll('[data-slot="navigation-menu-item"]');
      await expect(itens).toHaveLength(5);
      await expect(canvas.getAllByRole('button')).toHaveLength(2);
      await expect(canvas.getAllByRole('link')).toHaveLength(3);
    });

    await step('Os itens ficam lado a lado, na mesma linha', async () => {
      const itens = [
        ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="navigation-menu-item"]'),
      ];
      const primeiro = itens[0].getBoundingClientRect();
      const segundo = itens[1].getBoundingClientRect();
      await expect(segundo.left).toBeGreaterThan(primeiro.left);
      await expect(Math.abs(segundo.top - primeiro.top)).toBeLessThan(2);
    });

    await step('O painel abre abaixo da barra', async () => {
      const gatilho = canvas.getByRole('button', { name: /Produtos/ });
      const conteudo = await abrir(gatilho);
      const barra = canvas.getByRole('navigation', { name: 'Navegação principal' });
      await expect(conteudo.getBoundingClientRect().top).toBeGreaterThan(
        barra.getBoundingClientRect().top,
      );
      await fechar(gatilho);
    });
  },
};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    ariaLabel: 'Navegação da conta',
    demonstration: 'simpleLink',
    delayDuration: 100,
  },
  parameters: {
    covers: ['visual.item5'],
    docs: {
      description: {
        story:
          'Itens empilhados; usado em barras laterais e gavetas móveis. As setas Cima/Baixo percorrem a barra.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Os itens empilham em coluna', async () => {
      const itens = [
        ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="navigation-menu-item"]'),
      ];
      await expect(itens).toHaveLength(3);
      const primeiro = itens[0].getBoundingClientRect();
      const segundo = itens[1].getBoundingClientRect();
      await expect(segundo.top).toBeGreaterThan(primeiro.top);
    });

    await step('As setas do eixo vertical percorrem a barra', async () => {
      const links = canvas.getAllByRole('link');
      links[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(links[1]);
    });
  },
};
