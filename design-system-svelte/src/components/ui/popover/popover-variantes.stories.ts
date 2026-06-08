import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect } from 'storybook/test';
import PopoverStory from './PopoverStory.svelte';

const meta = {
  title: 'UI/Popover/Variantes',
  component: PopoverStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes estruturais do Popover. Não há prop `variant` ou `cva()` — cada item abaixo é um padrão de uso recorrente.',
      },
    },
  },
} satisfies Meta<typeof PopoverStory>;

export default meta;
type Story = StoryObj<typeof meta>;

const waitOpen = async () => {
  const body = within(document.body);
  const dialog = await waitForPortal('dialog', { timeout: 2000 });
  await expect(dialog).toBeVisible();
};

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Conteúdo livre — apenas `PopoverContent` com texto. Use para snippets curtos sem header.',
      },
    },
  },
  args: {
    open: true,
    variant: 'default',
    triggerLabel: 'Abrir popover',
    description: 'Conteúdo contextual livre dentro do popover.',
  },
  play: async () => {
    await waitOpen();
  },
};

export const WithTitle: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`PopoverHeader` com `PopoverTitle` e `PopoverDescription` + ações Salvar/Cancelar. Composição padrão para acessibilidade.',
      },
    },
  },
  args: {
    open: true,
    variant: 'withTitle',
    triggerLabel: 'Configuracoes',
    title: 'Configuracoes de exibição',
    description: 'Ajuste a aparência do conteúdo da página.',
    saveLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  play: waitOpen,
};

export const Form: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Formulário inline — Inputs e botão de submit dentro do `PopoverContent`. Submit dispara onAction.',
      },
    },
  },
  args: {
    open: true,
    variant: 'form',
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize seu nome e e-mail.',
    nameLabel: 'Nome',
    emailLabel: 'Email',
    submitLabel: 'Atualizar',
  },
  play: waitOpen,
};
