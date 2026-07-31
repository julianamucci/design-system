import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect } from 'storybook/test';
import PopoverStory from './PopoverStory.svelte';

const meta = {
  title: 'UI/Popover/Composicoes',
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
} satisfies Meta<typeof PopoverStory>;

export default meta;
type Story = StoryObj<typeof meta>;

const waitOpen = async () => {
  const dialog = await waitForPortal('dialog', { timeout: 2000 });
  await expect(dialog).toBeVisible();
};

export const ConteudoLivre: Story = {
  name: 'Conteúdo livre',
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

export const ConfiguracoesComTitulo: Story = {
  name: 'Configuracoes com título',
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
  name: 'Formulário inline',
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
    await waitOpen();
    const body = within(document.body);
    await expect(body.getByText(/Editar perfil/)).toBeInTheDocument();
    await expect(body.getByDisplayValue('maria@exemplo.com')).toBeInTheDocument();
  },
};
