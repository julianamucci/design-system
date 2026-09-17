import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect, userEvent, waitFor, fn } from 'storybook/test';
import PopoverStory from './PopoverStory.svelte';
import { panel } from './popover.fixtures';
import {
  popoverSource,
  popoverDefaultSource,
  popoverWithTitleSource,
  popoverFormSource,
} from './popover.source';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  title: 'Components/Overlay/Popover/Variants',
  component: PopoverStory,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('popover'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: cada uma declara a sua
      // composição em `args`, e a transform monta o snippet a partir deles.
      source: { transform: popoverSource },
      description: {
        component:
          'Conteúdo livre, cabeçalho com título e descrição, e formulário inline. O painel sempre precisa de nome acessível: com título ele vem do aria-labelledby, sem título ele é declarado por aria-label.',
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
      source: { transform: popoverDefaultSource },
      description: {
        story:
          'Conteúdo livre — apenas `PopoverContent` com texto. Sem título, o painel declara o próprio nome por `aria-label`.',
      },
    },
  },
  args: {
    open: true,
    variant: 'default',
    triggerLabel: 'Ver atalhos',
    description: 'Use Ctrl+K para abrir a busca em qualquer tela.',
    panelLabel: 'Informações adicionais',
  },
  play: async ({ step }) => {
    await step('Sem título, o painel se nomeia por aria-label', async () => {
      // `role="dialog"` sem nome reprova na regra aria-dialog-name do axe — e o
      // nome herdado do gatilho anunciaria o botão, não o painel.
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      await expect(dialog).toHaveAccessibleName('Informações adicionais');
    });

    await step('E carrega a classe do design system com o conteúdo livre', async () => {
      await expect(panel()).toHaveClass(/nds-popover-content/);
      await expect(panel()!.textContent).toMatch(/Ctrl\+K/);
    });
  },
};

export const WithTitle: Story = {
  parameters: {
    covers: [
      'visual.item2', 'accessibility.item5', 'accessibility.item3', 'functional.item4',
    ],
    docs: {
      source: { transform: popoverWithTitleSource },
      description: {
        story:
          '`PopoverHeader` com `PopoverTitle` e `PopoverDescription` + ações Salvar/Cancelar. Composição padrão para acessibilidade.',
      },
    },
  },
  args: {
    open: true,
    variant: 'withTitle',
    triggerLabel: 'Configurações',
    title: 'Configurações de exibição',
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
      await expect(dialog).toHaveAccessibleName(/Configurações de exibição/i);
    });

    await step('A descrição entra por aria-describedby', async () => {
      // D12: o painel aponta `aria-describedby` para o id da descrição.
      const dialog = panel()!;
      const idDescription = dialog.getAttribute('aria-describedby');
      await expect(idDescription).toBeTruthy();
      await expect(document.getElementById(idDescription!)).toHaveClass(/nds-popover-description/);
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
      source: { transform: popoverFormSource },
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
    onAction: fn(),
    onOpenChange: fn(),
  },
  play: async ({ canvasElement, step, args }) => {
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

    await step('Atualizar salva e fecha por código — motivo api', async () => {
      // O confirmar do formulário é `type="submit"`, e o fechamento vive no
      // `submit`, depois do `preventDefault`: fechar no `click` desmontaria o
      // formulário antes de ele submeter, e o "salvar" nunca aconteceria.
      // Ele também não é `PopoverClose` — a peça de fechar reportaria
      // `close-button`, e "concluiu" viraria "apertou o botão de fechar".
      const update = within(panel()!).getByRole('button', { name: 'Atualizar' });
      await expect(update).not.toHaveAttribute('data-slot', 'popover-close');
      await userEvent.click(update);
      // Leitura PURA dentro do `waitFor`: `panel()` é um `querySelector` e não
      // toca no DOM — condição que muta aqui dentro se reagenda sozinha pelo
      // observador de mutação e pendura o arquivo inteiro.
      await waitFor(
        () => {
          if (panel()) throw new Error('o painel não fechou ao salvar');
        },
        { timeout: 2000 },
      );
      await expect(args.onAction).toHaveBeenCalled();
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'api');
    });

    await step('Enter num campo envia o formulário e fecha o painel', async () => {
      // É por isto que o fechamento mora no `submit`, e não no clique do
      // "Atualizar": metade das pessoas envia formulário pelo teclado, e o
      // caminho do clique não cobriria este gesto.
      const trigger = within(canvasElement).getByRole('button', { name: /Editar perfil/i });
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      const name = within(dialog).getByLabelText(/Nome/i);
      name.focus();
      (args.onOpenChange as ReturnType<typeof fn>).mockClear();
      await userEvent.keyboard('{Enter}');
      await waitFor(
        () => {
          if (panel()) throw new Error('o painel não fechou no Enter');
        },
        { timeout: 2000 },
      );
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'api');
    });

    // Termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      const trigger = within(canvasElement).getByRole('button', { name: /Editar perfil/i });
      await userEvent.click(trigger);
      await expect(await waitForPortal('dialog', { timeout: 2000 })).toBeVisible();
    });
  },
};
