import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import ToggleGroupStory from './ToggleGroupStory.svelte';

const meta = {
  title: 'UI/ToggleGroup/Variantes',
  component: ToggleGroupStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do ToggleGroup: single (escolha exclusiva), multiple (combinação) e vertical (items empilhados).',
      },
    },
  },
} satisfies Meta<typeof ToggleGroupStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  args: {
    type: 'single',
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  parameters: {
    docs: {
      description: {
        story: 'type="single" — seleção exclusiva. value é string. Ideal para alinhamento.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('radio');

    await step('Renderiza 3 itens com role=radio (single)', async () => {
      await expect(items).toHaveLength(3);
    });

    await step('ToggleGroup tem aria-label de categoria', async () => {
      const group = canvas.getByRole('group');
      await expect(group).toHaveAttribute('aria-label', 'Alinhamento do texto');
    });
  },
};

export const Multiple: Story = {
  args: {
    type: 'multiple',
    kind: 'formatting',
    ariaLabel: 'Formatação',
  },
  parameters: {
    docs: {
      description: {
        story: 'type="multiple" — seleção combinada. value é string[]. Ideal para formatação Bold/Italic/Underline.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('button');

    await step('Renderiza 3 itens (multiple usa role=button)', async () => {
      await expect(items).toHaveLength(3);
    });

    await step('Itens começam não pressionados', async () => {
      for (const it of items) await expect(it).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

export const Vertical: Story = {
  args: {
    type: 'single',
    orientation: 'vertical',
    kind: 'view',
    ariaLabel: 'Modo de visualização',
  },
  parameters: {
    docs: {
      description: {
        story: 'orientation="vertical" — items empilhados; navegação por ArrowUp/ArrowDown.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group');

    await step('aria-orientation=vertical', async () => {
      await expect(group).toHaveAttribute('aria-orientation', 'vertical');
    });

    await step('Renderiza 2 itens (Grade/Lista)', async () => {
      await expect(canvas.getAllByRole('radio')).toHaveLength(2);
    });
  },
};

export const Outline: Story = {
  args: {
    type: 'single',
    variant: 'outline',
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  parameters: {
    docs: {
      description: {
        story: 'variant="outline" — items com borda. Herdada via Context para todos os ToggleGroupItem.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group');

    await step('Grupo aplica data-variant=outline', async () => {
      await expect(group).toHaveAttribute('data-variant', 'outline');
    });
  },
};
