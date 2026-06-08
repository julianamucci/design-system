import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Root as Sidebar } from './index';
import SidebarNavGroupsStory from './SidebarNavGroupsStory.svelte';
import SidebarSubMenuStory from './SidebarSubMenuStory.svelte';
import SidebarSkeletonStory from './SidebarSkeletonStory.svelte';

const meta = {
  title: 'UI/Sidebar/Composicoes',
  component: SidebarNavGroupsStory,
  tags: ['layout'],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes avançadas da Sidebar: múltiplos grupos de navegação, sub-menus expansíveis e estado de carregamento com skeleton.',
      },
    },
  },
} satisfies Meta<typeof SidebarNavGroupsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComGruposDeNav: Story = {
  name: 'Com grupos de navegação',
  render: () => ({
    Component: SidebarNavGroupsStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('sidebar com múltiplos grupos está presente', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });

    await step('campo de busca está presente', async () => {
      const input = canvas.getByPlaceholderText(/buscar/i);
      await expect(input).toBeInTheDocument();
    });
  },
};

export const ComSubMenu: Story = {
  name: 'Com sub-menu',
  render: () => ({
    Component: SidebarSubMenuStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('sidebar com sub-menu está presente', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });

    await step('item de sub-menu ativo tem aria-current="page"', async () => {
      const activeBtn = canvas.getByRole('link', { current: 'page' });
      await expect(activeBtn).toBeInTheDocument();
    });
  },
};

export const ComSkeleton: Story = {
  name: 'Estado de carregamento (Skeleton)',
  render: () => ({
    Component: SidebarSkeletonStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('sidebar de skeleton está presente', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
  },
};
