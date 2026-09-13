import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, userEvent, expect, fn, waitFor } from 'storybook/test';
import ContextMenuStory from './ContextMenuStory.svelte';
import ContextMenuDocs from '@/components/docs/ContextMenuDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { FOCUS_RULE_GUARDA, waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { gestoOpen, clickOutside, closeMenu } from '@shared/testing/context-menu-area';
import { expectInvolucroComCaixa, waitForAncorado } from '@shared/testing/ancoragem';
import { contextMenuSource } from './context-menu.source';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  title: 'Components/Overlay/ContextMenu',
  component: ContextMenuStory,
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('dropdownMenu'),
    layout: 'centered',
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      page: withAutoDocsTab(ContextMenuDocs),
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
type Story = StoryObj;

/**
 * Um `Tab` de teclado, DESPACHADO À MÃO no elemento em foco.
 *
 * `userEvent.keyboard('{Tab}')` e `userEvent.tab()` MOVEM O FOCO primeiro e só
 * então anunciam a tecla — medido em 2026-09-03 na story `Modal` do popover
 * desta stack, onde o docblock do `pressTab` de lá registra a medição. Aqui isso
 * mediria outra coisa: a lib trata o Tab no `keydown` do PAINEL, e com o foco já
 * fora dele a tecla nunca chega a quem decide fechar. Despachar reproduz a ordem
 * do teclado real — `keydown` no item em foco primeiro, movimento depois.
 */
function pressTab(shift = false): void {
  document.activeElement?.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true }),
  );
}

/**
 * A tecla de MENU, apertada de verdade sobre a área focada.
 *
 * Quem transforma a tecla num `contextmenu` é o NAVEGADOR, e ele só faz isso
 * com entrada trusted: o `userEvent` do `storybook/test` monta o `keydown` no
 * DOM e nada acontece depois dele. O `userEvent` do vitest em modo browser
 * passa pelo driver e é tecla de verdade — é por ele que a suíte mede. O
 * especificador é LITERAL de propósito: `vitest/browser` é módulo virtual, e só
 * o plugin do Vitest o resolve (mesmo desenho de `apertarTecla`, em
 * `@shared/testing/slider-probe`).
 *
 * Fora do modo browser — o painel Interactions, onde não há driver — o import
 * falha ou o módulo lança, e o passo despacha o `contextmenu` que o navegador
 * despacharia, para que a story siga navegável ali. A medição é a da suíte.
 */
async function pressMenuKey(target: HTMLElement): Promise<void> {
  target.focus();
  await expect(document.activeElement).toBe(target);
  try {
    const { userEvent: browserEvent } = await import('vitest/browser');
    await browserEvent.keyboard('{ContextMenu}');
    return;
  } catch {
    // Sem driver: o caminho do DOM, logo abaixo.
  }
  target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
}

/**
 * Espera o acúmulo do typeahead expirar. Relógio e não `waitFor`: o que se
 * espera é o tempo passar, e não uma mutação que se possa observar. A lib zera
 * a busca 1000 ms depois da última letra.
 */
const waitTypeaheadExpiry = () => new Promise((resolve) => setTimeout(resolve, 1100));

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
  render: (args) => ({
    Component: ContextMenuStory,
    props: {
      triggerLabel: args.triggerLabel ?? 'Clique com o botão direito aqui',
      showDestructive: args.showDestructive ?? true,
      showSeparator: args.showSeparator ?? true,
      showShortcuts: args.showShortcuts ?? true,
      onOpenChange: args.onOpenChange,
    },
  }),
  play: async ({ canvasElement, step, args }) => {
    const area = () => within(canvasElement).getByTestId('area');
    const menuItems = async () => [
      ...(await waitForPortal('menu')).querySelectorAll<HTMLElement>(
        '[data-slot="context-menu-item"]',
      ),
    ];

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
      // A abertura chega a quem consome: é o aviso que a docs page mede.
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    });

    await step('E o invólucro que a lib posiciona tem CAIXA', async () => {
      // Este menu nasce no ponto do ponteiro, e não ancorado a um elemento: não
      // há vão a cobrar. O que vale é a outra metade da asserção da família —
      // com o painel fora do fluxo pela folha (a mesma `nds-dropdown-menu-content`
      // dos três menus), o invólucro que a lib posiciona colapsa para 0×0 e ela
      // passa a calcular colisão contra uma caixa sem tamanho. Ver `ancoragem.ts`.
      const panel = document.querySelector<HTMLElement>('.nds-dropdown-menu-content')!;
      await waitForAncorado(panel);
      expectInvolucroComCaixa(panel);
    });

    await step('O foco entra no menu ao abrir, e a seta alcança os itens a partir dali', async () => {
      // Aberto pelo gesto, o foco tem de estar DENTRO do painel — no próprio
      // painel ou num item. Se ficasse na área, a seta seguinte rolaria a
      // página em vez de andar no menu, e ele seria inoperável por teclado.
      const menu = await waitForPortal('menu');
      await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true));
      // De onde quer que a abertura tenha deixado o foco, a seta para baixo
      // pousa num ITEM do menu — é a outra metade do critério.
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => {
        const active = document.activeElement as HTMLElement | null;
        expect(active?.getAttribute('role')).toBe('menuitem');
        expect(menu.contains(active)).toBe(true);
      });
    });

    await step('Os itens são itens de menu de verdade', async () => {
      const menu = await waitForPortal('menu');
      await expect(menu.getAttribute('role')).toBe('menu');
      const items = await menuItems();
      await expect(items.length).toBe(3);
      for (const item of items) await expect(item.getAttribute('role')).toBe('menuitem');
      await expect(
        menu.querySelector('[data-slot="context-menu-separator"]')?.getAttribute('role'),
      ).toBe('separator');
    });

    await step('O atalho é lido junto do item, não escondido', async () => {
      // "Excluir, Delete" é o nome útil. Com `aria-hidden` no atalho a pessoa ouviria
      // só "Excluir" e o atalho não ensinaria nada.
      const menu = await waitForPortal('menu');
      const atalho = menu.querySelector<HTMLElement>('[data-slot="context-menu-shortcut"]')!;
      await expect(atalho.hasAttribute('aria-hidden')).toBe(false);
      await expect(atalho.closest('[data-slot="context-menu-item"]')).not.toBeNull();
    });

    await step('As setas percorrem os itens na ordem em que aparecem', async () => {
      // O foco parte de um item conhecido: assim o passo vale igual na primeira
      // rodada e no replay, e não depende de onde a abertura deixou o foco.
      const items = await menuItems();
      items[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(document.activeElement).toBe(items[1]));
      await userEvent.keyboard('{ArrowUp}');
      await waitFor(() => expect(document.activeElement).toBe(items[0]));
    });

    await step('Home e End levam às pontas do menu', async () => {
      // Parte do primeiro item: End salta os do meio e pousa no último, Home
      // volta. Comparar com o item certo — e não com "o foco mudou" — é o que
      // separa ir à ponta de andar um passo.
      const items = await menuItems();
      items[0].focus();
      await userEvent.keyboard('{End}');
      await expect(document.activeElement).toBe(items[items.length - 1]);
      await userEvent.keyboard('{Home}');
      await expect(document.activeElement).toBe(items[0]);
    });

    await step('Digitar salta para o item, e as letras se acumulam por um segundo', async () => {
      // Numa lista de ações longa, o typeahead é o que evita percorrer item por
      // item. As asserções são degraus, e cada uma só passa se a anterior for
      // verdade — por isso comparam com OUTRO item, e nunca com "mudou".
      const items = await menuItems();
      // Editar · Duplicar · Excluir — três rótulos com iniciais que se separam,
      // e dois deles começando por "e", que é o que dá sentido ao acúmulo.
      await expect(items.length).toBe(3);

      // Uma letra: a busca recomeça DEPOIS do item em foco, então "d" a partir
      // de Editar acha Duplicar.
      items[0].focus();
      await userEvent.keyboard('d');
      await expect(document.activeElement).toBe(items[1]);

      // Duas letras seguidas: "e" pousa em Excluir e "ed" — o acúmulo — corrige
      // para Editar. Sem acúmulo o segundo toque seria um "d" solto a partir de
      // Excluir, que acharia Duplicar; é essa a diferença que a asserção mede.
      await waitTypeaheadExpiry();
      await userEvent.keyboard('e');
      await expect(document.activeElement).toBe(items[2]);
      await userEvent.keyboard('d');
      await expect(document.activeElement).toBe(items[0]);

      // E o acúmulo EXPIRA: passado o segundo do padrão WAI-ARIA, "d" volta a
      // valer sozinho — de Editar para Duplicar. Se o buffer não zerasse, "edd"
      // não acharia nada e o foco ficaria parado.
      await waitTypeaheadExpiry();
      await userEvent.keyboard('d');
      await expect(document.activeElement).toBe(items[1]);
    });

    await step('Escolher um item fecha o menu e devolve o foco à área', async () => {
      // O fechamento por escolha é o único em que a pessoa DECIDIU — é o motivo
      // `api` do `context_menu_close`, que a docs page separa do Escape e do
      // clique fora. Enter no item em foco, como no vanilla.
      await gestoOpen(area());
      const duplicate = (await menuItems())[1];
      duplicate.focus();
      await userEvent.keyboard('{Enter}');
      await waitForPortalGone('menu');
      await waitFor(() => expect(document.activeElement).toBe(area()));
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    });

    await step('Escape fecha e devolve o foco à área', async () => {
      await gestoOpen(area());
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('menu');
      await waitFor(() => expect(document.activeElement).toBe(area()));
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    });

    await step('Clique fora fecha', async () => {
      await gestoOpen(area());
      await clickOutside();
      await waitForPortalGone('menu');
    });

    await step('Tab fecha o menu e o foco segue para a próxima parada da página', async () => {
      // O menu NÃO prende o foco: isso é contrato de diálogo. A próxima parada
      // é montada aqui e sai no fim — o canvas não tem outra, e sem ela o passo
      // mediria só o caso da borda, logo abaixo.
      const next = document.createElement('button');
      next.type = 'button';
      next.textContent = 'Próxima parada';
      canvasElement.appendChild(next);
      try {
        await gestoOpen(area());
        (await menuItems())[0].focus();
        pressTab();
        await waitForPortalGone('menu');
        await waitFor(() => expect(document.activeElement).toBe(next));
        await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
      } finally {
        next.remove();
      }
    });

    await step('Tab fecha o menu também quando a área é a última parada, e o foco volta a ela', async () => {
      // A borda que a lib deixava aberta: sem próxima parada, ela barrava a
      // tecla e só chamava `body.focus()` — o menu ficava aberto e o foco preso
      // nele. O wrapper do painel fecha nesse caso (ver `context.ts`). F12 diz
      // para ONDE o foco vai: sem outra parada, de volta à área — o fechamento
      // sozinho passaria com o foco perdido no `<body>`.
      await gestoOpen(area());
      (await menuItems())[0].focus();
      pressTab();
      await waitForPortalGone('menu');
      await waitFor(() => expect(document.activeElement).toBe(area()));
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    });

    await step('A tecla de menu na área focada abre o menu, e o foco entra nele', async () => {
      // A tecla é APERTADA de verdade: o `contextmenu` que ela produz é o
      // navegador quem dispara, e só entrada trusted chega lá (ver
      // `pressMenuKey`). Até 2026-09-11 o passo despachava o `contextmenu` à mão
      // e declarava cobrir a tecla — media o próprio despacho. A área entra na
      // ordem de tabulação, recebe o foco, a tecla abre o menu e o foco sai da
      // área para DENTRO dele (F16) — senão quem abriu pelo teclado ficaria com
      // o menu na tela e o foco atrás dele.
      await closeMenu();
      await expect(area().tabIndex).toBe(0);
      await pressMenuKey(area());
      const menu = await waitForPortal('menu');
      await expect(menu).toBeVisible();
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
      await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true));
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
 * O que só esta story mede é o Tab dado DE DENTRO DO SUBMENU (F12, ação
 * emendada): o painel filho vive num portal à parte, e a tecla dada nele não
 * passa pelo painel de cima — é o `closeAfterTab` do painel do submenu, e o
 * `handleTabKeyDown` da lib subindo até a raiz, que fecham o menu INTEIRO.
 */
export const TabLeavesMenu: Story = {
  args: { neighbors: true, withSubmenu: true },
  parameters: { covers: ['functional.item12'], controls: { disable: true } },
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

    const openSubmenuWithItemFocused = async () => {
      const menu = await openWithItemFocused();
      const subTrigger = menu.querySelector<HTMLElement>('[data-slot="context-menu-sub-trigger"]')!;
      subTrigger.focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(openMenus()).toHaveLength(2));
      const submenu = document.querySelector<HTMLElement>('[data-slot="context-menu-sub-content"]')!;
      submenu.querySelector<HTMLElement>('[data-slot="context-menu-item"]')!.focus();
      await expect(submenu.contains(document.activeElement)).toBe(true);
    };

    await step('Tab fecha o menu e o foco vai ao ponto DEPOIS da área', async () => {
      await openWithItemFocused();
      pressTab();
      await waitForPortalGone('menu');
      await waitFor(() => expect(document.activeElement).toBe(after));
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    });

    await step('Shift+Tab fecha o menu e o foco vai ao ponto ANTES da área', async () => {
      await openWithItemFocused();
      pressTab(true);
      await waitForPortalGone('menu');
      await waitFor(() => expect(document.activeElement).toBe(before));
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    });

    await step('Tab dentro do submenu fecha o menu INTEIRO e segue a página', async () => {
      // Nenhum painel sobra aberto — nem o do submenu, nem o raiz —, e o foco
      // segue da ÁREA, não do sub-gatilho.
      await openSubmenuWithItemFocused();
      pressTab();
      await waitForPortalGone('menu');
      await expect(openMenus()).toHaveLength(0);
      await waitFor(() => expect(document.activeElement).toBe(after));
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    });

    await step('Shift+Tab dentro do submenu também fecha tudo', async () => {
      await openSubmenuWithItemFocused();
      pressTab(true);
      await waitForPortalGone('menu');
      await expect(openMenus()).toHaveLength(0);
      await waitFor(() => expect(document.activeElement).toBe(before));
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    });
  },
};
