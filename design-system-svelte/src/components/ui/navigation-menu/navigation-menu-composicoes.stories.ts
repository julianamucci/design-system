import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect, waitFor } from 'storybook/test';
import NavigationMenuStory from './NavigationMenuStory.svelte';

const meta = {
  title: 'UI/NavigationMenu/Composicoes',
  component: NavigationMenuStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes idiomáticas do NavigationMenu: link simples (sem submenu), com dropdown de produtos, mega-menu em grid e mega-menu com card destacado.',
      },
    },
  },
} satisfies Meta<typeof NavigationMenuStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LinkSimples: Story = {
  args: {
    demonstration: 'simpleLink',
    ariaLabel: 'Navegação principal',
    delayDuration: 80,
  },
  parameters: {
    docs: {
      description: {
        story:
          'NavigationMenu com 3 Links diretos sem dropdown. Adequado para sites com poucas categorias top-level.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const links = canvas.getAllByRole('link');
    await expect(links.length).toBeGreaterThanOrEqual(3);
  },
};

export const ComDropdown: Story = {
  args: {
    demonstration: 'withDropdown',
    ariaLabel: 'Navegação principal',
    defaultValue: 'produtos',
    delayDuration: 80,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Link "Início" + Trigger "Produtos" com dropdown de 4 sub-links. Renderizado aberto via defaultValue para captura visual.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Produtos/i });
    await waitFor(async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

export const MegaMenuGrid: Story = {
  args: {
    demonstration: 'megaMenuGrid',
    ariaLabel: 'Navegação principal',
    defaultValue: 'solucoes',
    delayDuration: 80,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Trigger "Soluções" com mega-menu em grid 2 colunas, 6 sub-links agrupados por categoria de público.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Soluções/i });
    await waitFor(async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

export const ComCardDestacado: Story = {
  args: {
    demonstration: 'withFeatured',
    ariaLabel: 'Navegação principal',
    defaultValue: 'produtos',
    delayDuration: 80,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Mega-menu com card destacado à esquerda (Plano Empresarial) + lista de sub-links à direita. Padrão clássico de marketing pages.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Produtos/i });
    await waitFor(async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  },
};
