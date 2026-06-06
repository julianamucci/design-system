import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import ToggleStory from './ToggleStory.svelte';

const meta = {
  title: 'UI/Toggle/Variantes',
  component: ToggleStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes visuais do Toggle: default (sem borda), outline (borda input) e withLabel (ícone + texto visível).',
      },
    },
  },
} satisfies Meta<typeof ToggleStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    pressed: false,
    variant: 'default',
    icon: 'bold',
    ariaLabel: 'Negrito',
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle padrão icon-only sem borda. Fundo transparente; aria-pressed=true aplica bg-muted.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button');

    await step('Toggle tem aria-label', async () => {
      await expect(toggle).toHaveAttribute('aria-label', 'Negrito');
    });

    await step('Toggle não tem borda (variant=default)', async () => {
      await expect(toggle).not.toHaveClass('border');
    });
  },
};

export const Outline: Story = {
  args: {
    pressed: false,
    variant: 'outline',
    icon: 'italic',
    ariaLabel: 'Itálico',
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle com borda input — variant="outline". Mesma lógica de pressed.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button');

    await step('Toggle tem aria-label "Itálico"', async () => {
      await expect(toggle).toHaveAttribute('aria-label', 'Itálico');
    });

    await step('Toggle tem classe border', async () => {
      await expect(toggle).toHaveClass('border');
    });
  },
};

export const WithLabel: Story = {
  args: {
    pressed: false,
    variant: 'outline',
    icon: 'eye',
    label: 'Mostrar ocultos',
    withLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle com ícone + texto visível — útil para filtros como "Mostrar ocultos".',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Texto visível é renderizado', async () => {
      const label = canvas.getByText('Mostrar ocultos');
      await expect(label).toBeVisible();
    });

    await step('Toggle não tem aria-label (texto visível supre)', async () => {
      const toggle = canvas.getByRole('button', { name: 'Mostrar ocultos' });
      await expect(toggle).not.toHaveAttribute('aria-label');
    });
  },
};
