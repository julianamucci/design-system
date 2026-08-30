import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect, userEvent } from 'storybook/test';
import PopoverStory from './PopoverStory.svelte';
import { panel } from './popover.fixtures';
import { popoverSource } from './popover.source';

const meta: Meta = {
  title: 'Primitives/Overlay/Popover/Variants',
  component: PopoverStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: cada uma declara a sua
      // composição em `args`, e a transform monta o snippet a partir deles.
      source: { transform: popoverSource },
      description: {
        component:
          'Conteúdo livre, cabeçalho com título e descrição, e formulário inline. O painel sempre precisa de nome acessível: com título ele vem do aria-labelledby, sem título ele herda o texto do gatilho.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story:
          'Conteúdo livre — apenas `PopoverContent` com texto. Sem título, o painel herda o nome acessível do gatilho.',
      },
    },
  },
  args: {
    open: true,
    variant: 'default',
    triggerLabel: 'Ver atalhos',
    description: 'Use Ctrl + K para abrir a busca em qualquer tela.',
  },
  play: async ({ step }) => {
    await step('Sem título, o painel herda o nome acessível do gatilho', async () => {
      // `role="dialog"` sem nome reprova na regra aria-dialog-name do axe.
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      await expect(dialog).toHaveAccessibleName('Ver atalhos');
    });

    await step('E carrega a classe do design system com o conteúdo livre', async () => {
      await expect(panel()).toHaveClass(/nds-popover-content/);
      await expect(panel()!.textContent).toMatch(/Ctrl \+ K/);
    });
  },
};

export const WithTitle: Story = {
  parameters: {
    covers: [
      'visual.item2', 'accessibility.item5', 'accessibility.item3', 'functional.item4',
    ],
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
  play: async ({ step }) => {
    await step('O título nomeia o painel por aria-labelledby', async () => {
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      const id = dialog.getAttribute('aria-labelledby');
      await expect(id).toBeTruthy();
      const title = document.getElementById(id!)!;
      await expect(title).toHaveAttribute('data-slot', 'popover-title');
      await expect(title).toHaveClass(/nds-popover-title/);
      await expect(dialog).toHaveAccessibleName(/Configuracoes de exibição/i);
    });

    await step('Tab caminha entre os controles internos', async () => {
      const ctx = within(panel()!);
      const cancelar = ctx.getByRole('button', { name: 'Cancelar' });
      const salvar = ctx.getByRole('button', { name: 'Salvar' });
      cancelar.focus();
      await userEvent.tab();
      await expect(salvar).toHaveFocus();
    });

    await step('E o elemento focado por teclado mostra o anel de foco', async () => {
      // `:focus-visible` é a condição exata que o CSS compartilhado usa para
      // desenhar o anel — se o foco tivesse vindo do ponteiro, o navegador não
      // casaria a pseudo-classe e o anel não apareceria.
      const salvar = within(panel()!).getByRole('button', { name: 'Salvar' });
      await expect(salvar.matches(':focus-visible')).toBe(true);
      // O anel de `.nds-button` é box-shadow, não outline — medir a propriedade
      // errada daria verde em qualquer elemento.
      await expect(getComputedStyle(salvar).boxShadow).not.toBe('none');
    });
  },
};

export const Form: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      description: {
        story:
          'Formulário inline — Inputs e botão de submit dentro do `PopoverContent`.',
      },
    },
  },
  args: {
    open: true,
    variant: 'form',
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Altere o nome e o email da conta.',
    nameLabel: 'Nome',
    emailLabel: 'Email',
    submitLabel: 'Atualizar',
    cancelLabel: 'Cancelar',
  },
  play: async ({ step }) => {
    await step('Os campos existem e estão associados aos rótulos', async () => {
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      const ctx = within(dialog);
      await expect(ctx.getByLabelText(/Nome/i)).toHaveValue('Ana Ribeiro');
      await expect(ctx.getByLabelText(/Email/i)).toHaveValue('ana@nortear.com.br');
    });

    await step('E aceitam digitação — o painel não é inerte', async () => {
      // Conteúdo interativo dentro do painel é a razão de existir do popover.
      const name = within(panel()!).getByLabelText(/Nome/i);
      await userEvent.clear(name);
      await userEvent.type(name, 'Bruno Lima');
      await expect(name).toHaveValue('Bruno Lima');
    });
  },
};
