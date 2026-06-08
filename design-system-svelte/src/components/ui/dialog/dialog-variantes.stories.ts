import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect, waitFor } from 'storybook/test';
import DialogStory from './DialogStory.svelte';

const meta = {
  title: 'UI/Dialog/Variantes',
  component: DialogStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes estruturais do Dialog. Não há prop `variant` ou `cva()` — cada item abaixo é um padrão de uso recorrente.',
      },
    },
  },
} satisfies Meta<typeof DialogStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: { story: 'Title + Description + Footer com ação primária. Composição padrão.' },
    },
  },
  args: {
    open: true,
    variant: 'default',
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
    actionLabel: 'Salvar alterações',
    cancelLabel: 'Cancelar',
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  },
};

export const WithForm: Story = {
  parameters: {
    docs: {
      description: { story: 'Body com formulário inline. Submit dispara a ação primária.' },
    },
  },
  args: {
    open: true,
    variant: 'withForm',
    triggerLabel: 'Editar dados',
    title: 'Editar dados pessoais',
    description: 'Atualize seu nome e e-mail.',
    actionLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const WithScrollContent: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Body com conteúdo longo e scroll interno. Em Vue use DialogScrollContent; em Svelte aplique max-h + overflow-y-auto.',
      },
    },
  },
  args: {
    open: true,
    variant: 'withScrollContent',
    triggerLabel: 'Termos de uso',
    title: 'Termos e condições',
    description: 'Leia atentamente antes de aceitar.',
    actionLabel: 'Aceitar',
    cancelLabel: 'Recusar',
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const NoFooter: Story = {
  parameters: {
    docs: {
      description: { story: 'Apenas Title + Description, sem Footer. Para uso informativo.' },
    },
  },
  args: {
    open: true,
    variant: 'noFooter',
    triggerLabel: 'Sobre o produto',
    title: 'Sobre este produto',
    description:
      'Plataforma de design system multi-stack mantida pela equipe de Engenharia. Atualizada continuamente.',
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const WithDestructiveAction: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Footer com ação primária destrutiva. Diferente de AlertDialog — use só quando a destrutividade é secundária ao fluxo.',
      },
    },
  },
  args: {
    open: true,
    variant: 'withDestructiveAction',
    triggerLabel: 'Remover item',
    title: 'Remover item da lista',
    description: 'Você pode adicioná-lo novamente depois, mas perderá os ajustes feitos.',
    actionLabel: 'Remover item',
    cancelLabel: 'Cancelar',
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const CustomCloseInFooter: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'showCloseButton={false} no Content para ocultar o X — fechamento via ações do Footer ou Escape.',
      },
    },
  },
  args: {
    open: true,
    variant: 'default',
    showCloseButton: false,
    triggerLabel: 'Convidar',
    title: 'Convidar para o time',
    description: 'Envie um convite por e-mail. O destinatário poderá aceitar ou recusar.',
    actionLabel: 'Enviar convite',
    cancelLabel: 'Cancelar',
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
