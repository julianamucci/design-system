import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import { createContextMenu, type ContextMenuItemDef } from './context-menu';
import { createContextMenuDocs } from '@/components/docs/ContextMenuDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import {
  abrirPorGesto,
  clicarFora,
  criarAreaDeClique,
  fecharMenu,
  menuAberto,
} from '@shared/testing/context-menu-area';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ContextMenuArgs = {
  triggerLabel: string;
  showDestructive: boolean;
  showSeparator: boolean;
  showShortcuts: boolean;
  onOpenChange: (open: boolean) => void;
};

const meta: Meta<ContextMenuArgs> = {
  title: 'UI/ContextMenu',
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(createContextMenuDocs) },
  },
  argTypes: {
    triggerLabel: {
      control: 'text',
      description: 'Texto da área que responde ao gesto.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'Clique com o botão direito aqui' } },
    },
    showDestructive: {
      control: 'boolean',
      description: 'Exibe o item destrutivo (Excluir).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    showSeparator: {
      control: 'boolean',
      description: 'Exibe a divisória antes do item destrutivo.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    showShortcuts: {
      control: 'boolean',
      description: 'Exibe os atalhos de teclado ao lado dos rótulos.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    onOpenChange: {
      control: false,
      description: 'Callback disparado ao abrir e ao fechar o menu.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    triggerLabel: 'Clique com o botão direito aqui',
    showDestructive: true,
    showSeparator: true,
    showShortcuts: true,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<ContextMenuArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item7', 'accessibility.item8',
      'visual.item1',
    ],
  },
  render: (args) => {
    const itens: ContextMenuItemDef[] = [
      {
        type: 'item',
        label: 'Editar',
        value: 'edit',
        shortcut: args.showShortcuts ? '⌘E' : undefined,
        onClick: fn(),
      },
      { type: 'item', label: 'Duplicar', value: 'duplicate', onClick: fn() },
    ];

    if (args.showSeparator) itens.push({ type: 'separator' });

    if (args.showDestructive) {
      itens.push({
        type: 'item',
        label: 'Excluir',
        value: 'delete',
        variant: 'destructive',
        shortcut: args.showShortcuts ? '⌫' : undefined,
        onClick: fn(),
      });
    }

    return createContextMenu({
      trigger: criarAreaDeClique(args.triggerLabel),
      items: itens,
      onOpenChange: args.onOpenChange,
    });
  },
  play: async ({ canvasElement, step, args }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O menu do navegador não aparece por cima do nosso', async () => {
      // `defaultPrevented` é a única prova possível aqui: o menu nativo não
      // existe no DOM. Sem esta chamada barrada, os dois menus se sobrepõem.
      await fecharMenu();
      const evento = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      area().dispatchEvent(evento);
      await waitFor(() => expect(evento.defaultPrevented).toBe(true));
    });

    await step('O botão direito abre o menu ONDE o ponteiro estava', async () => {
      // O popup não é ancorado no gatilho: ele nasce no ponto do gesto. É a
      // única diferença real em relação ao DropdownMenu.
      const menu = await abrirPorGesto(area());
      const caixaArea = area().getBoundingClientRect();
      const caixaMenu = menu.getBoundingClientRect();
      await expect(
        Math.abs(caixaMenu.left - (caixaArea.left + caixaArea.width / 2)),
      ).toBeLessThan(24);
      await expect(
        Math.abs(caixaMenu.top - (caixaArea.top + caixaArea.height / 2)),
      ).toBeLessThan(24);
      await expect(args.onOpenChange).toHaveBeenCalled();
    });

    await step('Os itens são itens de menu de verdade', async () => {
      const menu = menuAberto()!;
      await expect(menu.getAttribute('role')).toBe('menu');
      const itens = [...menu.querySelectorAll('[data-slot="context-menu-item"]')];
      await expect(itens.length).toBe(3);
      for (const item of itens) await expect(item.getAttribute('role')).toBe('menuitem');
      await expect(
        menu.querySelector('[data-slot="context-menu-separator"]')?.getAttribute('role'),
      ).toBe('separator');
    });

    await step('O atalho é lido junto do item, não escondido', async () => {
      // "Excluir, ⌫" é o nome útil. Com `aria-hidden` no atalho a pessoa ouviria
      // só "Excluir" e o atalho não ensinaria nada.
      const atalho = menuAberto()!.querySelector<HTMLElement>(
        '[data-slot="context-menu-shortcut"]',
      )!;
      await expect(atalho.hasAttribute('aria-hidden')).toBe(false);
      await expect(atalho.closest('[data-slot="context-menu-item"]')).not.toBeNull();
    });

    await step('As setas percorrem os itens na ordem em que aparecem', async () => {
      // O foco parte de um item conhecido: assim o passo vale igual na primeira
      // rodada e no replay, e não depende de onde a abertura deixou o foco.
      const itens = [
        ...menuAberto()!.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]'),
      ];
      itens[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(document.activeElement).toBe(itens[1]));
      await userEvent.keyboard('{ArrowUp}');
      await waitFor(() => expect(document.activeElement).toBe(itens[0]));
    });

    await step('Escape fecha e devolve o foco à área', async () => {
      await abrirPorGesto(area());
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(menuAberto()).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(area()));
    });

    await step('Clique fora fecha', async () => {
      await abrirPorGesto(area());
      await clicarFora();
      await expect(menuAberto()).toBeNull();
    });

    await step('A story termina com o menu ABERTO', async () => {
      // É o estado que o Chromatic fotografa e o axe varre — `visual.item1`
      // descreve o menu aberto, não a área vazia.
      const menu = await abrirPorGesto(area());
      await expect(menu).toBeVisible();
    });
  },
};
