import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect, waitFor } from 'storybook/test';
import NavigationMenuStory from './NavigationMenuStory.svelte';

const meta = {
  title: 'UI/NavigationMenu/Estados',
  component: NavigationMenuStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do NavigationMenu: fechado (apenas Triggers/Links), aberto (defaultValue) e ativo (Link com aria-current=page).',
      },
    },
  },
} satisfies Meta<typeof NavigationMenuStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fechado: Story = {
  args: {
    defaultValue: undefined,
    demonstration: 'default',
    ariaLabel: 'Navegação principal',
    delayDuration: 80,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Estado padrão — apenas Triggers e Links visíveis na barra; Viewport não exibe Content.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: /Navegação principal/i });
    await expect(nav).toBeVisible();
    const trigger = canvas.getByRole('button', { name: /Produtos/i });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

export const Aberto: Story = {
  args: {
    defaultValue: 'produtos',
    demonstration: 'default',
    ariaLabel: 'Navegação principal',
    delayDuration: 80,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Trigger "Produtos" expandido via defaultValue. Content renderizado no Viewport com data-state="open". Captura visual no Chromatic.',
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

export const Ativo: Story = {
  args: {
    defaultValue: undefined,
    demonstration: 'default',
    ariaLabel: 'Navegação principal',
    delayDuration: 80,
    activeHref: '/',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Link "Início" marcado com aria-current="page". bg-accent destaca a página atual; leitor anuncia "página atual".',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: /Início/i });
    await expect(link).toHaveAttribute('aria-current', 'page');
  },
};
