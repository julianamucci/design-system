import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import SwitchStory from './SwitchStory.svelte';

const meta = {
  title: 'UI/Switch/Composicoes',
  component: SwitchStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do Switch com Label, descrição auxiliar e padrões de uso em painel de configurações.',
      },
    },
  },
} satisfies Meta<typeof SwitchStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SemLabel: Story = {
  args: {
    checked: false,
    withLabel: false,
    id: 'comp-no-label',
    ariaLabel: 'Ativar modo escuro',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Switch está presente no DOM', async () => {
      await expect(sw).toBeInTheDocument();
    });

    await step('Switch tem role=switch', async () => {
      await expect(sw).toHaveAttribute('role', 'switch');
    });
  },
};

export const ComLabel: Story = {
  args: {
    checked: false,
    withLabel: true,
    labelText: 'Receber notificações por email',
    id: 'comp-with-label',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Switch associado à Label via for/id', async () => {
      const sw = canvas.getByRole('switch', { name: 'Receber notificações por email' });
      await expect(sw).toBeInTheDocument();
    });

    await step('Label está visível', async () => {
      const label = canvas.getByText('Receber notificações por email');
      await expect(label).toBeVisible();
    });

    await step('Clicar no Label alterna o Switch', async () => {
      const label = canvas.getByText('Receber notificações por email');
      await userEvent.click(label);
      const sw = canvas.getByRole('switch');
      await expect(sw).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const ComDescricao: Story = {
  args: {
    checked: false,
    withDescription: true,
    labelText: 'Emails de marketing',
    descriptionText: 'Receba novidades e promoções da plataforma.',
    id: 'comp-with-desc',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Switch está presente no DOM', async () => {
      const sw = canvas.getByRole('switch');
      await expect(sw).toBeInTheDocument();
    });

    await step('Texto descritivo está visível', async () => {
      const desc = canvas.getByText('Receba novidades e promoções da plataforma.');
      await expect(desc).toBeVisible();
    });

    await step('Label está associado via for/id', async () => {
      const label = canvas.getByText('Emails de marketing');
      await expect(label).toBeVisible();
    });

    await step('Switch tem aria-describedby', async () => {
      const sw = canvas.getByRole('switch');
      await expect(sw).toHaveAttribute('aria-describedby', 'comp-with-desc-description');
    });
  },
};

export const Ativado: Story = {
  args: {
    checked: true,
    withLabel: true,
    labelText: 'Modo escuro',
    id: 'comp-darkmode',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch', { name: 'Modo escuro' });

    await step('Switch começa ativado', async () => {
      await expect(sw).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const TamanhoSm: Story = {
  args: {
    checked: false,
    size: 'sm',
    withLabel: true,
    labelText: 'Notificações push',
    id: 'comp-sm-list',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Switch tem size sm', async () => {
      await expect(sw).toHaveAttribute('data-size', 'sm');
    });
  },
};
