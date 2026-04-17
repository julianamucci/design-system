import type { Meta, StoryObj } from '@storybook/svelte';
import TableStory from './TableStory.svelte';

const meta = {
  title: 'UI/Table/Densidades',
  component: TableStory,
} satisfies Meta<typeof TableStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Compact: Story = {
  name: 'Compact (h-8)',
  args: { scenario: 'compact' },
  parameters: {
    docs: {
      description: {
        story:
          'Densidade compacta (`h-8` no `TableHead`, `py-1` no `TableCell`). Use em dashboards com muitos dados onde a compactação visual é prioritária.',
      },
    },
  },
};

export const Default: Story = {
  name: 'Default (h-10)',
  args: { scenario: 'default' },
  parameters: {
    docs: {
      description: {
        story:
          'Densidade padrão — o `TableHead` já vem com `h-10` por padrão e o `TableCell` com `p-2`. Use em uso geral: equilíbrio entre densidade e legibilidade.',
      },
    },
  },
};

export const Comfortable: Story = {
  name: 'Comfortable (h-12)',
  args: { scenario: 'comfortable' },
  parameters: {
    docs: {
      description: {
        story:
          'Densidade confortável (`h-12` no `TableHead`, `py-4` no `TableCell`). Use quando células contêm conteúdo rico: avatares, badges, múltiplas ações ou descrições.',
      },
    },
  },
};
