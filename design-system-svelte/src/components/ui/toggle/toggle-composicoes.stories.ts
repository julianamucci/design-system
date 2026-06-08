import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import ToggleStory from './ToggleStory.svelte';

const meta = {
  title: 'UI/Toggle/Composicoes',
  component: ToggleStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do Toggle: icon-only com aria-label, ícone + texto visível (filtros) e variações de tamanho.',
      },
    },
  },
} satisfies Meta<typeof ToggleStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IconOnly: Story = {
  args: {
    pressed: false,
    icon: 'bold',
    ariaLabel: 'Negrito',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Negrito' });

    await step('Toggle icon-only com aria-label "Negrito"', async () => {
      await expect(toggle).toHaveAttribute('aria-label', 'Negrito');
    });

    await step('Clicar alterna o estado', async () => {
      await userEvent.click(toggle);
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });
  },
};

export const IconWithLabel: Story = {
  args: {
    pressed: false,
    variant: 'outline',
    icon: 'eye',
    label: 'Mostrar ocultos',
    withLabel: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Texto "Mostrar ocultos" está visível', async () => {
      const label = canvas.getByText('Mostrar ocultos');
      await expect(label).toBeVisible();
    });

    await step('Toggle acessível pelo texto visível', async () => {
      const toggle = canvas.getByRole('button', { name: 'Mostrar ocultos' });
      await expect(toggle).toBeInTheDocument();
    });
  },
};

export const FilterCompactView: Story = {
  args: {
    pressed: true,
    variant: 'outline',
    icon: 'layout',
    label: 'Visão compacta',
    withLabel: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Visão compacta' });

    await step('Toggle começa pressionado', async () => {
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    await step('Clicar desativa', async () => {
      await userEvent.click(toggle);
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

export const ItalicOutline: Story = {
  args: {
    pressed: false,
    variant: 'outline',
    icon: 'italic',
    ariaLabel: 'Itálico',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Itálico' });

    await step('Toggle outline com aria-label "Itálico"', async () => {
      await expect(toggle).toHaveAttribute('aria-label', 'Itálico');
    });
  },
};

export const UnderlineSm: Story = {
  args: {
    pressed: false,
    size: 'sm',
    icon: 'underline',
    ariaLabel: 'Sublinhado',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Sublinhado' });

    await step('Toggle sm icon-only', async () => {
      await expect(toggle).toBeInTheDocument();
    });
  },
};

export const ListLg: Story = {
  args: {
    pressed: false,
    size: 'lg',
    icon: 'list',
    ariaLabel: 'Lista',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Lista' });

    await step('Toggle lg icon-only', async () => {
      await expect(toggle).toBeInTheDocument();
    });
  },
};
