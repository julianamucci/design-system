import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { AlertDialog } from './index';
import AlertDialogStory from './AlertDialogStory.svelte';

const meta = {
  title: 'UI/AlertDialog/Composicoes',
  component: AlertDialog,
  tags: ['overlay'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component: 'Composicoes canônicas: confirmação destrutiva e neutra.',
      },
    },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Destrutiva: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Action com tokens bg-destructive + text-destructive-foreground e trigger variant=destructive. Use para ações irreversíveis.',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: true,
      triggerVariant: 'destructive',
      triggerLabel: 'Excluir conta',
      title: 'Excluir sua conta?',
      description:
        'Essa ação é permanente. Todos os dados, arquivos e histórico serão removidos.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir conta',
      tone: 'destructive',
    },
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('alertdialog');
    await expect(dialog).toBeVisible();
    // Ambos trigger e action têm o mesmo texto; escolher o que está dentro do dialog.
    const actions = await body.findAllByRole('button', { name: /Excluir conta/i });
    const action = actions.find((el) => dialog.contains(el));
    await expect(action).toBeDefined();
    await expect(action!).toHaveClass('bg-destructive');
  },
};

export const Neutra: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Action com tokens padrão do Button. Use para confirmações não destrutivas (publicar, enviar, arquivar).',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: true,
      triggerVariant: 'default',
      triggerLabel: 'Publicar agora',
      title: 'Publicar este conteúdo?',
      description:
        'Ao publicar, o conteúdo fica visível para todos os usuários. Você poderá editá-lo depois.',
      cancelLabel: 'Voltar',
      actionLabel: 'Publicar',
      tone: 'default',
    },
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('alertdialog');
    await expect(dialog).toBeVisible();
    const action = await body.findByRole('button', { name: /^Publicar$/i });
    await expect(action).toBeVisible();
  },
};
