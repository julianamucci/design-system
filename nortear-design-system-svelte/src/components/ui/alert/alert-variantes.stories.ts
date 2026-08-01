import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import { Alert } from './index';
import AlertStory from './AlertStory.svelte';
import AlertDismissivelStory from './AlertDismissivelStory.svelte';

const meta = {
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Alert/Variantes',
  component: Alert,
  tags: ['feedback'],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'default',
      title: 'Atenção',
      description: 'Suas alterações serão aplicadas na próxima sessão.',
      showIcon: true,
      icon: 'info',
    },
  }),

  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole('alert');
    await expect(alert).toHaveClass('nds-alert');
    await expect(alert).not.toHaveClass('nds-alert-destructive');
    await expect(within(canvasElement).getByText('Atenção')).toBeVisible();
  },
};

export const Destructive: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'destructive',
      title: 'Erro ao salvar',
      description: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
      showIcon: true,
      icon: 'error',
    },
  }),

  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole('alert');
    await expect(alert).toHaveClass('nds-alert-destructive');
    await expect(within(canvasElement).getByText('Erro ao salvar')).toBeVisible();
  },
};

export const Success: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'success',
      title: 'Perfil atualizado',
      description: 'Suas informações foram salvas com sucesso.',
      showIcon: true,
      icon: 'success',
    },
  }),

  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole('alert');
    await expect(alert).toHaveClass('nds-alert-success');
    await expect(within(canvasElement).getByText('Perfil atualizado')).toBeVisible();
  },
};

export const Warning: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'warning',
      title: 'Assinatura expirando',
      description: 'Sua assinatura expira em 3 dias. Renove para evitar interrupções.',
      showIcon: true,
      icon: 'warning',
    },
  }),

  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole('alert');
    await expect(alert).toHaveClass('nds-alert-warning');
    await expect(within(canvasElement).getByText('Assinatura expirando')).toBeVisible();
  },
};

export const Info: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'info',
      title: 'Dica',
      description: 'Você pode fixar seus filtros favoritos para acessá-los mais rápido.',
      showIcon: true,
      icon: 'info',
    },
  }),

  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole('alert');
    await expect(alert).toHaveClass('nds-alert-info');
    await expect(within(canvasElement).getByText('Dica')).toBeVisible();
  },
};

// As duas stories abaixo usam AlertDismissivelStory: fechar remove o alert e
// remonta um novo em seguida, então o canvas nunca fica vazio (Chromatic
// fotografava a story vazia). A prova da remoção mede o nó ORIGINAL.
export const Dismissible: Story = {
  args: {
    dismissible: true,
    onDismiss: fn(),
  },
  render: (args) => ({
    Component: AlertDismissivelStory,
    props: {
      onDismiss: args.onDismiss,
    },
  }),

  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);

    await step('Botão de fechar visível e acessível por rótulo', async () => {
      const dismissButton = await canvas.findByRole('button', { name: 'Fechar alerta' });
      await expect(dismissButton).toBeVisible();
    });

    await step('Clique no X remove o alert e dispara o callback uma única vez', async () => {
      const alertOriginal = canvas.getByRole('alert');
      const dismissButton = canvas.getByRole('button', { name: 'Fechar alerta' });
      await userEvent.click(dismissButton);
      await waitFor(() => expect(alertOriginal).not.toBeInTheDocument());
      await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    });

    await step('Um alert novo volta ao canvas — a story não fica vazia', async () => {
      await waitFor(() => expect(canvas.getByRole('alert')).toBeVisible());
    });
  },
};

export const DismissibleTeclado: Story = {
  args: {
    dismissible: true,
    onDismiss: fn(),
  },
  render: (args) => ({
    Component: AlertDismissivelStory,
    props: {
      onDismiss: args.onDismiss,
    },
  }),

  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);

    await step('Enter no botão focado remove o alert e dispara o callback uma única vez', async () => {
      const alertOriginal = await canvas.findByRole('alert');
      const dismissButton = canvas.getByRole('button', { name: 'Fechar alerta' });
      dismissButton.focus();
      await expect(dismissButton).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(alertOriginal).not.toBeInTheDocument());
      await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    });

    await step('Um alert novo volta ao canvas — a story não fica vazia', async () => {
      await waitFor(() => expect(canvas.getByRole('alert')).toBeVisible());
    });
  },
};
