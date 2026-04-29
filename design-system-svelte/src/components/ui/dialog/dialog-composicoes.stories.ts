import type { Meta, StoryObj } from '@storybook/svelte';
import { within, expect } from 'storybook/test';
import DialogStory from './DialogStory.svelte';

const meta = {
  title: 'UI/Dialog/Composições',
  component: DialogStory,
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composições reais de Dialog: edição de perfil, formulário inline e pré-visualização passiva.',
      },
    },
  },
} satisfies Meta<typeof DialogStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProfileEdit: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Edição de perfil com formulário inline. Submit dispara a ação primária do Footer.',
      },
    },
  },
  args: {
    open: true,
    variant: 'withForm',
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
    actionLabel: 'Salvar alterações',
    cancelLabel: 'Cancelar',
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('dialog');
    await expect(dialog).toBeVisible();
    const nameField = await body.findByDisplayValue(/Maria Silva/i);
    await expect(nameField).toBeVisible();
  },
};

export const LongContent: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Conteúdo longo com scroll interno. Header e ações continuam visíveis enquanto o body rola.',
      },
    },
  },
  args: {
    open: true,
    variant: 'withScrollContent',
    triggerLabel: 'Ler termos',
    title: 'Termos de uso',
    description: 'Leia atentamente antes de aceitar.',
    actionLabel: 'Aceitar termos',
    cancelLabel: 'Recusar',
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('dialog');
    await expect(dialog).toBeVisible();
  },
};

export const InfoOnly: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Dialog informativo sem Footer. O fechamento ocorre apenas pelo botão X, Escape ou clique no overlay.',
      },
    },
  },
  args: {
    open: true,
    variant: 'noFooter',
    triggerLabel: 'Sobre',
    title: 'Sobre este produto',
    description:
      'Plataforma de design system multi-stack mantida pela equipe de Engenharia. Atualizada continuamente.',
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('dialog');
    await expect(dialog).toBeVisible();
  },
};
