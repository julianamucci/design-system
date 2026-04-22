import type { Meta, StoryObj } from '@storybook/svelte';
import { Breadcrumb } from './index';
import BreadcrumbStory from './BreadcrumbStory.svelte';

const meta = {
  title: 'UI/Breadcrumb/Composições',
  component: Breadcrumb,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Configurações disponíveis do Breadcrumb: padrão com ChevronRight, com ellipsis para níveis longos, separador customizado (Slash) e composição responsiva com DropdownMenu.',
      },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    Component: BreadcrumbStory,
    props: { variant: 'default' },
  }),
};

export const WithEllipsis: Story = {
  render: () => ({
    Component: BreadcrumbStory,
    props: { variant: 'withEllipsis' },
  }),
};

export const CustomSeparator: Story = {
  render: () => ({
    Component: BreadcrumbStory,
    props: { variant: 'customSeparator' },
  }),
};

export const Responsive: Story = {
  render: () => ({
    Component: BreadcrumbStory,
    props: { variant: 'responsive' },
  }),
};
