import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import {
  createContextMenu,
  type ContextMenuCloseReason,
  type ContextMenuItemDef,
} from './context-menu';
import { contextMenuSource } from './context-menu.source';
import { createContextMenuDocs } from '@/components/docs/ContextMenuDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { pressTab } from '@/lib/press-tab';
import { createButton } from './button';
import {
  gestoOpen,
  clickOutside,
  clickCreateArea,
  closeMenu,
  menuOpen,
} from '@shared/testing/context-menu-area';

import { figmaDesign } from '@shared/figma/design-links';
// ─── Meta ─────────────────────────────────────────────────────────────────────

type ContextMenuArgs = {
  triggerLabel: string;
  showDestructive: boolean;
  showSeparator: boolean;
  showShortcuts: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: (reason: ContextMenuCloseReason) => void;
};

const meta: Meta<ContextMenuArgs> = {
  title: 'Components/Overlay/ContextMenu',
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('dropdownMenu'),
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
    // Divergência de API, declarada: só a fábrica desta stack tem o motivo do
    // fechamento como callback próprio — nas outras ele vem no evento de troca
    // de estado da lib. É ele que alimenta o `reason` do `context_menu_close`.
    onClose: {
      control: false,
      description: 'Callback do fechamento, com o motivo: escape, overlay (clique fora ou Tab) ou api (item escolhido).',
      table: { type: { summary: "(reason: 'escape' | 'overlay' | 'api') => void" } },
    },
  },
  args: {
    triggerLabel: 'Clique com o botão direito aqui',
    showDestructive: true,
    showSeparator: true,
    showShortcuts: true,
    onOpenChange: fn(),
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<ContextMenuArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'functional.item12', 'functional.item13', 'functional.item14', 'functional.item15',
      'functional.item16',
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
      onClose: args.onClose,
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

    await step('O foco ENTRA no menu aberto, e as setas andam a partir dali', async () => {
      // Sem foco nenhum empurrado pela play: o que se mede é onde a ABERTURA o
      // deixou. Um menu que abrisse com o foco na área faria a seta seguinte
      // rolar a página em vez de andar pelos itens.
      const items = [
        ...menuOpen()!.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]'),
      ];
      await expect(document.activeElement).toBe(items[0]);
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(items[1]);
    });

    await step('E CRESCE a partir do ponteiro, não do meio do painel', async () => {
      // O painel entra com zoom, e a folha lê a origem de `--transform-origin`.
      // Sem ele a cadeia cai em `center`: o menu cresce do meio, longe do
      // clique, e nada reprova — `center` é fallback válido. A medida é a
      // origem RESOLVIDA, perto do canto que encosta no ponteiro; no defeito ela
      // é metade da largura e metade da altura.
      const menu = menuOpen()!;
      const [ox, oy] = getComputedStyle(menu).transformOrigin.split(' ').map(parseFloat);
      await expect(ox).toBeLessThan(menu.offsetWidth / 4);
      await expect(oy).toBeLessThan(menu.offsetHeight / 4);
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

    await step('Home e End levam às pontas do menu', async () => {
      // Parte do item do MEIO: assim cada tecla tem para onde ir, e uma
      // implementação que ignorasse as duas deixaria o foco parado ali.
      const items = [
        ...menuOpen()!.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]'),
      ];
      items[1].focus();
      await userEvent.keyboard('{End}');
      await expect(document.activeElement).toBe(items[items.length - 1]);
      await userEvent.keyboard('{Home}');
      await expect(document.activeElement).toBe(items[0]);
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

    await step('Escolher um item fecha o menu e devolve o foco à área', async () => {
      // O fechamento `api` é o único em que a pessoa DECIDIU — é o motivo que o
      // `context_menu_close` precisa separar dos outros dois.
      await gestoOpen(area());
      const duplicate = menuOpen()!.querySelector<HTMLElement>('[data-value="duplicate"]')!;
      duplicate.focus();
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(menuOpen()).toBeNull());
      await expect(document.activeElement).toBe(area());
      await expect(args.onClose).toHaveBeenLastCalledWith('api');
    });

    await step('Escape fecha e devolve o foco à área', async () => {
      await gestoOpen(area());
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(menuOpen()).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(area()));
      await expect(args.onClose).toHaveBeenLastCalledWith('escape');
    });

    await step('Tab fecha o menu e, com a área como última parada, o foco volta a ela', async () => {
      // Menu não é diálogo (C2): o Tab fecha e segue a página a partir da ÁREA.
      // Aqui a área é a única parada do canvas — não há vizinho depois dela —,
      // então o destino é ela mesma: nem o `<body>`, nem o fim do documento,
      // onde o painel vive em portal. Os vizinhos estão na story TabLeavesMenu.
      //
      // Tab despachado à mão (`@/lib/press-tab`): sem ação padrão, o foco só
      // chega à área se o MENU o levar.
      await gestoOpen(area());
      menuOpen()!.querySelector<HTMLElement>('[data-slot="context-menu-item"]')!.focus();
      pressTab();
      await expect(menuOpen()).toBeNull();
      await expect(document.activeElement).toBe(area());
      // Saiu sem decidir: `overlay`, como o clique fora — e não `escape`.
      await expect(args.onClose).toHaveBeenLastCalledWith('overlay');
    });

    await step('Clique fora fecha', async () => {
      await gestoOpen(area());
      await clickOutside();
      await expect(menuOpen()).toBeNull();
      await expect(args.onClose).toHaveBeenLastCalledWith('overlay');
    });

    /**
     * A tecla de menu e o Shift+F10 são o caminho de quem não usa mouse.
     *
     * A tecla é pressionada DE VERDADE, e o que ela produz se mede: o `keydown`
     * chega à área focada — sem a parada de tabulação da área não haveria
     * elemento focado a quem entregá-la. O que o user-event não faz é a AÇÃO
     * PADRÃO do navegador para essas teclas, que é disparar `contextmenu` no
     * elemento que recebeu a tecla; essa metade a play faz, e só ela, no alvo
     * que o `keydown` de fato atingiu. O resto se prova: o menu abre e o foco
     * ENTRA nele, pousando no primeiro item.
     */
    const openByKey = async (keys: string, key: string) => {
      await closeMenu();
      area().focus();
      await expect(document.activeElement).toBe(area());

      let target: EventTarget | null = null;
      const record = (e: KeyboardEvent) => {
        if (e.key === key) target = e.target;
      };
      document.addEventListener('keydown', record, true);
      try {
        await userEvent.keyboard(keys);
      } finally {
        document.removeEventListener('keydown', record, true);
      }
      await expect(target).toBe(area());

      const box = area().getBoundingClientRect();
      (target as unknown as HTMLElement).dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: box.left + box.width / 2,
          clientY: box.top + box.height / 2,
        }),
      );
      await waitFor(() => expect(menuOpen()).not.toBeNull());
      return [...menuOpen()!.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]')];
    };

    await step('A tecla de menu na área focada abre o menu, e o foco entra nele', async () => {
      const items = await openByKey('{ContextMenu}', 'ContextMenu');
      await expect(document.activeElement).toBe(items[0]);
      // E a seta alcança os itens a partir dali, sem o mouse: é o caminho
      // inteiro de quem abriu pelo teclado.
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(items[1]);
    });

    await step('Shift+F10 na área focada abre o menu, e o foco entra nele', async () => {
      const items = await openByKey('{Shift>}{F10}{/Shift}', 'F10');
      await expect(document.activeElement).toBe(items[0]);
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(items[1]);
    });

    await step('A story termina com o menu ABERTO', async () => {
      // É o estado que o Chromatic fotografa e o axe varre — `visual.item1`
      // descreve o menu aberto, não a área vazia.
      const menu = await gestoOpen(area());
      await expect(menu).toBeVisible();
    });
  },
};

// ─── Tab sai do menu ──────────────────────────────────────────────────────────

/**
 * Menu não prende o foco (C2 do PRD do DropdownMenu, que é também o deste): Tab
 * fecha e o foco segue a página a partir da ÁREA — o próximo ponto de
 * tabulação depois dela, ou o anterior no Shift+Tab. A área como última parada
 * está no Playground.
 *
 * Antes da correção o menu fechava, mas quem movia o foco era o navegador, a
 * partir do fim do `body`, onde o painel vive em portal: Tab saía do documento
 * e Shift+Tab caía na ÚLTIMA parada da página. O Tab é despachado à mão
 * (`@/lib/press-tab`), então o foco só chega ao vizinho se o menu o levar.
 */
export const TabLeavesMenu: Story = {
  parameters: {
    covers: ['functional.item12'],
    controls: { disable: true },
  },
  render: (args) => {
    const container = document.createElement('div');
    container.className = 'nds-cluster';
    container.dataset.spacing = 'md';
    container.append(
      createButton({ variant: 'ghost', label: 'Antes' }),
      createContextMenu({
        trigger: clickCreateArea(args.triggerLabel),
        items: [
          { type: 'item', label: 'Editar', value: 'edit' },
          { type: 'item', label: 'Duplicar', value: 'duplicate' },
          {
            type: 'submenu',
            label: 'Compartilhar',
            value: 'share',
            items: [
              { type: 'item', label: 'Por e-mail', value: 'email' },
              { type: 'item', label: 'Por link', value: 'link' },
            ],
          },
        ],
        onClose: args.onClose,
      }),
      createButton({ variant: 'ghost', label: 'Depois' }),
    );
    return container;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const area = () => canvas.getByTestId('area');
    const before = canvas.getByRole('button', { name: 'Antes' });
    const after = canvas.getByRole('button', { name: 'Depois' });
    const openMenus = () => within(document.body).queryAllByRole('menu');

    const openWithItemFocused = async () => {
      const menu = await gestoOpen(area());
      menu.querySelector<HTMLElement>('[data-slot="context-menu-item"]')!.focus();
      await expect(menu.contains(document.activeElement)).toBe(true);
      return menu;
    };

    await step('Tab fecha o menu e o foco vai ao ponto DEPOIS da área', async () => {
      await openWithItemFocused();
      pressTab();
      // Síncrono de propósito: fechar e mover o foco são o mesmo gesto.
      await expect(openMenus()).toHaveLength(0);
      await expect(document.activeElement).toBe(after);
      await expect(args.onClose).toHaveBeenLastCalledWith('overlay');
    });

    await step('Shift+Tab fecha o menu e o foco vai ao ponto ANTES da área', async () => {
      await openWithItemFocused();
      pressTab(true);
      await expect(openMenus()).toHaveLength(0);
      await expect(document.activeElement).toBe(before);
      await expect(args.onClose).toHaveBeenLastCalledWith('overlay');
    });

    await step('Tab dentro do submenu fecha o menu INTEIRO e segue da área', async () => {
      const menu = await openWithItemFocused();
      within(menu).getByRole('menuitem', { name: 'Compartilhar' }).focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(openMenus()).toHaveLength(2));
      const sub = document.querySelector<HTMLElement>('[data-slot="context-menu-sub-content"]')!;
      await waitFor(() => expect(sub.contains(document.activeElement)).toBe(true));

      pressTab();
      // Os dois painéis: fechar só o filho deixaria o raiz aberto com o foco
      // fora dele.
      await expect(openMenus()).toHaveLength(0);
      await expect(document.activeElement).toBe(after);
      await expect(args.onClose).toHaveBeenLastCalledWith('overlay');
    });
  },
};
