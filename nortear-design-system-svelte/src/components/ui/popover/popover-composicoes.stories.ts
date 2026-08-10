import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect } from 'storybook/test';
import PopoverStory from './PopoverStory.svelte';

const meta: Meta = {
  title: 'UI/Popover/Compositions',
  component: PopoverStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais do Popover em fluxos de produto: conteúdo livre, configurações com título e formulário inline.',
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

export const ConteudoLivre: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Apenas `PopoverContent` com texto explicativo curto. Sem header — ideal para snippets contextuais simples.',
      },
    },
  },
  args: {
    open: true,
    variant: 'default',
    triggerLabel: 'Abrir popover',
    description: 'Conteúdo contextual livre. Use para snippets curtos sem header.',
  },
  play: waitOpen,
};

export const SettingsWithTitle: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`PopoverHeader` com `PopoverTitle` + `PopoverDescription` e ações Salvar/Cancelar. Padrão recomendado.',
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
  play: async () => {
    await waitOpen();
    const body = within(document.body);
    await expect(body.getByText(/Configuracoes de exibição/)).toBeInTheDocument();
  },
};

export const FormularioInline: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Edição contextual em formulário curto. Inputs Nome/Email e botão Atualizar dentro do `PopoverContent`.',
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
  play: async () => {
    const dialog = await waitForPortal('dialog', { timeout: 2000 });
    // Escopo no diálogo: o rótulo do trigger e o título são o mesmo texto, e
    // desde que o painel ganhou nome acessível a busca solta casava com os dois.
    await expect(dialog).toHaveAccessibleName('Editar perfil');
    const body = within(dialog);
    await expect(body.getByDisplayValue('maria@exemplo.com')).toBeInTheDocument();
  },
};
