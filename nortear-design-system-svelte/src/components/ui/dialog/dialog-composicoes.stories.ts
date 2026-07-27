import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect } from 'storybook/test';
import DialogConfirmEmailStory from './DialogConfirmEmailStory.svelte';
import DialogProfileEditStory from './DialogProfileEditStory.svelte';
import DialogMediaPreviewStory from './DialogMediaPreviewStory.svelte';

const meta = {
  title: 'UI/Dialog/Composicoes',
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais do Dialog em fluxos de produto: confirmar email, edição de perfil e pré-visualização de mídia.',
  tags: ['overlay'],
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConfirmEmail: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Dialog usado para confirmar troca de email. Title nomeia a ação, Description orienta o usuário, Footer com Cancelar + Enviar confirmação.',
      },
    },
  },
  render: () => ({
    Component: DialogConfirmEmailStory,
    props: {
      open: true,
    },
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName(/Confirmar novo email/i);
    const action = await body.findByRole('button', { name: /Enviar confirmação/i });
    await expect(action).toBeVisible();
  },
};

export const ProfileEdit: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Edição de perfil em formulário modal. Submissão dispara `dialog_action` e fecha o Dialog ao concluir.',
      },
    },
  },
  render: () => ({
    Component: DialogProfileEditStory,
    props: {
      open: true,
    },
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    const nameInput = await body.findByLabelText(/Nome completo/i);
    await expect(nameInput).toBeVisible();
  },
};

export const MediaPreview: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Pré-visualização de mídia (imagem) em destaque, sem Footer. Fechamento via X, Escape ou clique no overlay.',
      },
    },
  },
  render: () => ({
    Component: DialogMediaPreviewStory,
    props: {
      open: true,
    },
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    const image = await body.findByRole('img', { name: /pôr-do-sol/i });
    await expect(image).toBeVisible();
  },
};
