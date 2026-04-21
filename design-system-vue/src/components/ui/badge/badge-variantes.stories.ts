import type { Meta, StoryObj } from '@storybook/vue3';
import { Badge } from './index';

const meta = {
  title: 'UI/Badge/Variantes',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'As 4 variantes nativas do Badge: default, secondary, destructive e outline. Dimensão única (sem prop size).',
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Badge },
    setup() { return {}; },
    template: `<Badge>Novo</Badge>`,
  }),
};

export const Secondary: Story = {
  render: () => ({
    components: { Badge },
    setup() { return {}; },
    template: `<Badge variant="secondary">Beta</Badge>`,
  }),
};

export const Destructive: Story = {
  render: () => ({
    components: { Badge },
    setup() { return {}; },
    template: `<Badge variant="destructive">Urgente</Badge>`,
  }),
};

export const Outline: Story = {
  render: () => ({
    components: { Badge },
    setup() { return {}; },
    template: `<Badge variant="outline">Rascunho</Badge>`,
  }),
};
