import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect } from 'storybook/test';
import PopoverStory from './PopoverStory.svelte';
import { track } from '@/lib/analytics';

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

const trackOpen = (label: string, location: string) => () =>
  track('popover_open', { component: 'popover', trigger_label: label, location });

const trackClose = (location: string, reason: string) => () =>
  track('popover_close', { component: 'popover', reason, location });

const waitOpen = async () => {
  const body = within(document.body);
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
    onAction: trackOpen('Abrir popover', 'storybook:composicoes:conteudo-livre'),
    onCancel: trackClose('storybook:composicoes:conteudo-livre', 'cancel'),
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
    onAction: trackOpen('Configuracoes', 'storybook:composicoes:configuracoes'),
    onCancel: trackClose('storybook:composicoes:configuracoes', 'cancel'),
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
    onAction: trackOpen('Editar perfil', 'storybook:composicoes:formulario-inline'),
  },
  play: async () => {
    await waitOpen();
    const body = within(document.body);
    await expect(body.getByText(/Editar perfil/)).toBeInTheDocument();
    await expect(body.getByDisplayValue('maria@exemplo.com')).toBeInTheDocument();
  },
};
