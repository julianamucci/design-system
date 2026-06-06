import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import NavigationMenuStory from './NavigationMenuStory.svelte';
import NavigationMenuDocs from '@/components/docs/NavigationMenuDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/NavigationMenu',
  component: NavigationMenuStory,
  tags: ['autodocs', 'navigation'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(NavigationMenuDocs),
      description: {
        component:
          'NavigationMenu construído sobre bits-ui. Menu principal de navegação web com Triggers expansíveis em hover/focus, Viewport compartilhado, Links com aria-current, suporte horizontal/vertical e WCAG 2.1 AA.',
      },
    },
  },
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'Item ativo inicial em modo não-controlado (ex: "produtos").',
    },
    delayDuration: {
      control: { type: 'number', min: 0, max: 1000, step: 50 },
      description: 'Delay em ms antes de abrir Content em hover.',
    },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      description: 'Orientação da lista de items.',
    },
    ariaLabel: {
      control: 'text',
      description: 'aria-label do Root (obrigatório).',
    },
    demonstration: {
      control: 'select',
      options: ['default', 'simpleLink', 'withDropdown', 'megaMenuGrid', 'withFeatured'],
      description: 'Composição interna usada na demonstração.',
    },
    activeHref: {
      control: 'text',
      description: 'href que recebe aria-current="page".',
    },
  },
  args: {
    defaultValue: undefined,
    delayDuration: 80,
    orientation: 'horizontal',
    ariaLabel: 'Navegação principal',
    demonstration: 'default',
    activeHref: undefined,
  },
} satisfies Meta<typeof NavigationMenuStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('1. Root tem role=navigation e aria-label', async () => {
      const nav = canvas.getByRole('navigation', { name: /Navegação principal/i });
      await expect(nav).toBeInTheDocument();
      await expect(nav).toHaveAttribute('aria-label', 'Navegação principal');
    });

    await step('2. Trigger "Produtos" tem aria-expanded=false (fechado)', async () => {
      const trigger = canvas.getByRole('button', { name: /Produtos/i });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('3. Click no Trigger expande Content', async () => {
      const trigger = canvas.getByRole('button', { name: /Produtos/i });
      await userEvent.click(trigger);
      await waitFor(async () => {
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    await step('4. ESC fecha o Content', async () => {
      await userEvent.keyboard('{Escape}');
      const trigger = canvas.getByRole('button', { name: /Produtos/i });
      await waitFor(async () => {
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });
    });
  },
};
