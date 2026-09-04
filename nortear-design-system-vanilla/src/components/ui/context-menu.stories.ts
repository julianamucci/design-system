import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import { createContextMenu, type ContextMenuItemDef } from './context-menu';
import { contextMenuSource } from './context-menu.source';
import { createContextMenuDocs } from '@/components/docs/ContextMenuDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import {
  gestoOpen,
  clickOutside,
  clickCreateArea,
  closeMenu,
  menuOpen,
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
  title: 'Components/Overlay/ContextMenu',
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(createContextMenuDocs),
      // O painel Code mostra a chamada da fábrica, e não o `outerHTML` do
      // wrapper. A transform cascateia para todas as stories deste arquivo.
      source: { transform: contextMenuSource },
    },
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
    const items: ContextMenuItemDef[] = [
      {
        type: 'item',
        label: 'Editar',
        value: 'edit',
        shortcut: args.showShortcuts ? 'Ctrl+E' : undefined,
        onClick: fn(),
      },
      { type: 'item', label: 'Duplicar', value: 'duplicate', onClick: fn() },
    ];

    if (args.showSeparator) items.push({ type: 'separator' });

    if (args.showDestructive) {
      items.push({
        type: 'item',
        label: 'Excluir',
        value: 'delete',
        variant: 'destructive',
        shortcut: args.showShortcuts ? 'Delete' : undefined,
        onClick: fn(),
      });
    }

    return createContextMenu({
      trigger: clickCreateArea(args.triggerLabel),
      items: items,
      onOpenChange: args.onOpenChange,
    });
  },
  play: async ({ canvasElement, step, args }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O menu do navegador não aparece por cima do nosso', async () => {
      // `defaultPrevented` é a única prova possível aqui: o menu nativo não
      // existe no DOM. Sem esta chamada barrada, os dois menus se sobrepõem.
      await closeMenu();
      const evento = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      area().dispatchEvent(evento);
      await waitFor(() => expect(evento.defaultPrevented).toBe(true));
    });

    await step('O botão direito abre o menu ONDE o ponteiro estava', async () => {
      // O popup não é ancorado no gatilho: ele nasce no ponto do gesto. É a
      // única diferença real em relação ao DropdownMenu.
      const menu = await gestoOpen(area());
      const boxArea = area().getBoundingClientRect();
      const boxMenu = menu.getBoundingClientRect();
      await expect(
        Math.abs(boxMenu.left - (boxArea.left + boxArea.width / 2)),
      ).toBeLessThan(24);
      await expect(
        Math.abs(boxMenu.top - (boxArea.top + boxArea.height / 2)),
      ).toBeLessThan(24);
      await expect(args.onOpenChange).toHaveBeenCalled();
    });

    await step('Os itens são itens de menu de verdade', async () => {
      const menu = menuOpen()!;
      await expect(menu.getAttribute('role')).toBe('menu');
      const items = [...menu.querySelectorAll('[data-slot="context-menu-item"]')];
      await expect(items.length).toBe(3);
      for (const item of items) await expect(item.getAttribute('role')).toBe('menuitem');
      await expect(
        menu.querySelector('[data-slot="context-menu-separator"]')?.getAttribute('role'),
      ).toBe('separator');
    });

    await step('O atalho é lido junto do item, não escondido', async () => {
      // "Excluir, Delete" é o nome útil. Com `aria-hidden` no atalho a pessoa ouviria
      // só "Excluir" e o atalho não ensinaria nada.
      const atalho = menuOpen()!.querySelector<HTMLElement>(
        '[data-slot="context-menu-shortcut"]',
      )!;
      await expect(atalho.hasAttribute('aria-hidden')).toBe(false);
      await expect(atalho.closest('[data-slot="context-menu-item"]')).not.toBeNull();
    });

    await step('As setas percorrem os itens na ordem em que aparecem', async () => {
      // O foco parte de um item conhecido: assim o passo vale igual na primeira
      // rodada e no replay, e não depende de onde a abertura deixou o foco.
      const items = [
        ...menuOpen()!.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]'),
      ];
      items[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(document.activeElement).toBe(items[1]));
      await userEvent.keyboard('{ArrowUp}');
      await waitFor(() => expect(document.activeElement).toBe(items[0]));
    });

    await step('Digitar salta para o item, e as letras se acumulam por um segundo', async () => {
      // Numa lista de ações longa, o typeahead é o que evita percorrer item por
      // item. As três asserções são degraus, e cada uma só passa se a anterior
      // for verdade — por isso comparam com OUTRO item, e nunca com "mudou".
      const items = [
        ...menuOpen()!.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]'),
      ];
      // Editar · Duplicar · Excluir — três rótulos com iniciais que se separam,
      // e dois deles começando por "e", que é o que dá sentido ao acúmulo.
      await expect(items.length).toBe(3);

      // As esperas de relógio entre os grupos NÃO são folga para o navegador:
      // são o acúmulo expirando. A primeira versão deste passo não as tinha e
      // reprovou — o "d" de um grupo continuava no buffer e o "e" do grupo
      // seguinte virava "de", que não é o começo de rótulo nenhum. Custou a
      // rodada para aparecer, e é exatamente o que o passo existe para medir.
      // Relógio e não `waitFor`: o que se espera é o tempo passar, e não uma
      // mutação que se possa observar.
      const expirarAcumulo = () => new Promise((resolve) => setTimeout(resolve, 1100));

      // Uma letra: a busca recomeça DEPOIS do item em foco, então "d" a partir
      // de Editar acha Duplicar.
      items[0].focus();
      await userEvent.keyboard('d');
      await expect(document.activeElement).toBe(items[1]);

      // Duas letras seguidas: "e" pousa em Excluir e "ed" — o acúmulo — corrige
      // para Editar. Sem acúmulo o segundo toque seria um "d" solto a partir de
      // Excluir, que acharia Duplicar; é essa a diferença que a asserção mede.
      await expirarAcumulo();
      await userEvent.keyboard('e');
      await expect(document.activeElement).toBe(items[2]);
      await userEvent.keyboard('d');
      await expect(document.activeElement).toBe(items[0]);

      // E o acúmulo EXPIRA: passado o segundo do padrão WAI-ARIA, "d" volta a
      // valer sozinho — de Editar para Duplicar. Se o buffer não zerasse, "edd"
      // não acharia nada e o foco ficaria parado.
      await expirarAcumulo();
      await userEvent.keyboard('d');
      await expect(document.activeElement).toBe(items[1]);
    });

    await step('Escape fecha e devolve o foco à área', async () => {
      await gestoOpen(area());
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(menuOpen()).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(area()));
    });

    await step('Clique fora fecha', async () => {
      await gestoOpen(area());
      await clickOutside();
      await expect(menuOpen()).toBeNull();
    });

    await step('A story termina com o menu ABERTO', async () => {
      // É o estado que o Chromatic fotografa e o axe varre — `visual.item1`
      // descreve o menu aberto, não a área vazia.
      const menu = await gestoOpen(area());
      await expect(menu).toBeVisible();
    });
  },
};
