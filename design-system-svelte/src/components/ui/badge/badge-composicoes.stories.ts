import type { Meta, StoryObj } from '@storybook/svelte';
import { Badge } from './index';
import BadgeStory from './BadgeStory.svelte';

const meta = {
  title: 'UI/Badge/Composições',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composições do Badge: com ícone, como link, envolvido em botão clicável e como contador numérico.',
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {
  render: () => ({
    Component: BadgeStory,
    props: { variant: 'default', label: 'Ativo', icon: 'check' },
  }),
};

export const AsLink: Story = {
  render: () => ({
    Component: BadgeStory,
    props: {
      variant: 'secondary',
      label: 'Design',
      href: '#categoria-design',
      ariaLabel: 'Filtrar por categoria Design',
    },
  }),
};

export const AsButton: Story = {
  render: () => ({
    Component: BadgeStory,
    props: {
      variant: 'outline',
      label: 'React',
      icon: 'tag',
      asButton: true,
      ariaLabel: 'Filtrar por tag React',
    },
  }),
};

export const CountBadge: Story = {
  render: () => ({
    Component: BadgeStory,
    props: {
      variant: 'destructive',
      label: '99+',
      ariaLabel: '99 ou mais notificações não lidas',
    },
  }),
};
