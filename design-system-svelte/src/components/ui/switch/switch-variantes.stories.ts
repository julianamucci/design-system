import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import SwitchStory from './SwitchStory.svelte';

const meta = {
  title: 'UI/Switch/Variantes',
  component: SwitchStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes visuais do Switch. Não possui variantes cva — as composições representam os padrões de uso recomendados.',
      },
    },
  },
} satisfies Meta<typeof SwitchStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    checked: false,
    withLabel: true,
    labelText: 'Receber notificações por email',
    id: 'var-default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Switch padrão (32×18.4px) com Label à direita. Layout `flex items-center gap-2`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Switch está presente no DOM', async () => {
      await expect(sw).toBeInTheDocument();
    });

    await step('Switch tem aria-checked false', async () => {
      await expect(sw).toHaveAttribute('aria-checked', 'false');
    });

    await step('Switch tem size default', async () => {
      await expect(sw).toHaveAttribute('data-size', 'default');
    });
  },
};

export const WithDescription: Story = {
  args: {
    checked: false,
    withDescription: true,
    labelText: 'Emails de marketing',
    descriptionText: 'Receba novidades e promoções da plataforma.',
    id: 'var-with-desc',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Switch em painel de configurações — Label + descrição à esquerda, Switch à direita (`flex justify-between`).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Switch e descrição estão visíveis', async () => {
      const sw = canvas.getByRole('switch');
      await expect(sw).toBeInTheDocument();
      const desc = canvas.getByText('Receba novidades e promoções da plataforma.');
      await expect(desc).toBeVisible();
    });

    await step('Switch tem aria-describedby associado', async () => {
      const sw = canvas.getByRole('switch');
      await expect(sw).toHaveAttribute('aria-describedby', 'var-with-desc-description');
    });
  },
};

export const Sm: Story = {
  args: {
    checked: false,
    size: 'sm',
    withLabel: true,
    labelText: 'Tamanho compacto',
    id: 'var-sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tamanho compacto (24×14px) — `size="sm"`. Recomendado para listas densas e menus.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Switch tem size sm', async () => {
      await expect(sw).toHaveAttribute('data-size', 'sm');
    });
  },
};
