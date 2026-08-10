import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { expect } from 'storybook/test';
import PopoverStory from './PopoverStory.svelte';

const meta: Meta = {
  title: 'UI/Popover/Variants',
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
};

export default meta;
type Story = StoryObj;

const waitOpen = async () => {
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
