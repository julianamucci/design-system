import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import ToggleGroupStory from './ToggleGroupStory.svelte';

const meta = {
  title: 'UI/ToggleGroup/Composicoes',
  component: ToggleGroupStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do ToggleGroup: barra de alinhamento (single), formatação de texto (multiple) e modo de visualização (vertical).',
      },
    },
  },
} satisfies Meta<typeof ToggleGroupStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AlignmentBar: Story = {
  args: {
    type: 'single',
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
    items: [
      { value: 'left', ariaLabel: 'Alinhar à esquerda', icon: 'alignLeft' },
      { value: 'center', ariaLabel: 'Centralizar', icon: 'alignCenter' },
      { value: 'right', ariaLabel: 'Alinhar à direita', icon: 'alignRight' },
      { value: 'justify', ariaLabel: 'Justificar', icon: 'alignJustify' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Barra de alinhamento clássica — 4 opções mutuamente exclusivas (type=single).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('radio');

    await step('Renderiza 4 opções de alinhamento', async () => {
      await expect(items).toHaveLength(4);
    });

    await step('Selecionar "Centralizar" desativa os outros', async () => {
      await userEvent.click(items[1]);
      await expect(items[1]).toHaveAttribute('aria-checked', 'true');
      await expect(items[0]).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const FormattingToolbar: Story = {
  args: {
    type: 'multiple',
    kind: 'formatting',
    ariaLabel: 'Formatação',
  },
  parameters: {
    docs: {
      description: {
        story: 'Barra de formatação Bold/Italic/Underline — combinações independentes (type=multiple).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('button');

    await step('Negrito + Itálico podem ser ativados juntos', async () => {
      await userEvent.click(items[0]);
      await userEvent.click(items[1]);
      await expect(items[0]).toHaveAttribute('aria-pressed', 'true');
      await expect(items[1]).toHaveAttribute('aria-pressed', 'true');
    });

    await step('Clicar em Negrito novamente o desativa', async () => {
      await userEvent.click(items[0]);
      await expect(items[0]).toHaveAttribute('aria-pressed', 'false');
      await expect(items[1]).toHaveAttribute('aria-pressed', 'true');
    });
  },
};

export const ViewModeVertical: Story = {
  args: {
    type: 'single',
    orientation: 'vertical',
    variant: 'outline',
    kind: 'view',
    ariaLabel: 'Modo de visualização',
  },
  parameters: {
    docs: {
      description: {
        story: 'Modo de visualização Grade/Lista vertical com variante outline. ArrowDown navega.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('radio');

    await step('ArrowDown navega para o próximo item', async () => {
      (items[0] as HTMLElement).focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(items[1]).toHaveFocus();
    });
  },
};

export const SegmentedOutline: Story = {
  args: {
    type: 'single',
    variant: 'outline',
    spacing: 0,
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  parameters: {
    docs: {
      description: {
        story: 'Visual segmented (spacing=0 + outline) — bordas conectadas, estilo barra única.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group');

    await step('Grupo tem data-spacing=0', async () => {
      await expect(group).toHaveAttribute('data-spacing', '0');
    });
  },
};

export const SeparatedItems: Story = {
  args: {
    type: 'single',
    variant: 'outline',
    spacing: 2,
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  parameters: {
    docs: {
      description: {
        story: 'Items separados (spacing > 0) — botões distintos, sem bordas conectadas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group');

    await step('Grupo tem data-spacing=2', async () => {
      await expect(group).toHaveAttribute('data-spacing', '2');
    });
  },
};
