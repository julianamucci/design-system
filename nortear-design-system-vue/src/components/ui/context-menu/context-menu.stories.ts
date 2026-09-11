import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, waitFor, fn } from 'storybook/test';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import ContextMenuDocs from '@/components/docs/ContextMenuDocs.vue';
import { FOCUS_RULE_GUARDA, waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import {
  AREA_CLICK_DIREITO,
  gestoOpen,
  clickOutside,
  closeMenu,
  menuOpen,
} from '@shared/testing/context-menu-area';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';
import { contextMenuSource } from './context-menu.source';

import { figmaDesign } from '@shared/figma/design-links';
type ContextMenuArgs = {
  triggerLabel: string;
  modal: boolean;
  showDestructive: boolean;
  showSeparator: boolean;
  showShortcuts: boolean;
  onOpenChange: (open: boolean, reason?: 'escape' | 'overlay' | 'api') => void;
};

const meta: Meta<ContextMenuArgs> = {
  title: 'Components/Overlay/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('dropdownMenu'),
    layout: 'centered',
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: { page: withAutoDocsTab(ContextMenuDocs), source: { transform: contextMenuSource } },
  },
  argTypes: {
    triggerLabel: {
      control: 'text',
      description: 'Texto da área que responde ao gesto.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'Clique com o botão direito aqui' } },
    },
    modal: {
      control: 'boolean',
      description: 'Quando ligado, interações fora do menu ficam bloqueadas enquanto ele está aberto.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
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
      description: 'Callback disparado ao abrir e ao fechar o menu; no fechamento, traz o motivo.',
      table: { type: { summary: "(open: boolean, reason?: 'escape' | 'overlay' | 'api') => void" } },
    },
  },
  args: {
    triggerLabel: 'Clique com o botão direito aqui',
    modal: true,
    showDestructive: true,
    showSeparator: true,
    showShortcuts: true,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<ContextMenuArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'functional.item12', 'functional.item13', 'functional.item14', 'functional.item15',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item7', 'accessibility.item8',
      'visual.item1',
    ],
  },
  render: (args) => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuSeparator,
      ContextMenuShortcut,
    },
    setup() {
      return { args };
    },
    template: `
      <ContextMenu :modal="args.modal" @update:open="args.onOpenChange">
        <ContextMenuTrigger class="${AREA_CLICK_DIREITO}" data-align="center" data-justify="center" data-testid="area">
          {{ args.triggerLabel }}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>
            Editar
            <ContextMenuShortcut v-if="args.showShortcuts">Ctrl+E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>Duplicar</ContextMenuItem>
          <ContextMenuSeparator v-if="args.showSeparator" />
          <ContextMenuItem v-if="args.showDestructive" variant="destructive">
            Excluir
            <ContextMenuShortcut v-if="args.showShortcuts">Delete</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
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
      const menu = await waitForPortal('menu');
      const items = [...menu.querySelectorAll('[data-slot="context-menu-item"]')];
      await expect(items.length).toBe(3);
      for (const item of items) await expect(item.getAttribute('role')).toBe('menuitem');
      await expect(
        menu.querySelector('[data-slot="context-menu-separator"]')?.getAttribute('role'),
      ).toBe('separator');
    });

    await step('Nenhum grupo sem nome: as ações ficam direto no menu', async () => {
      // Grupo sem rótulo não tem nome, e a lib escreve nele um
      // `aria-labelledby` para um id que NÃO existe — referência pendurada que
      // o leitor de tela resolve em nada. O Vanilla só abre grupo onde há
      // rótulo; aqui não há rótulo, então não há grupo.
      const menu = await waitForPortal('menu');
      await expect(menu.querySelector('[role="group"]')).toBeNull();
      const ids = [...menu.querySelectorAll('[aria-labelledby]')].flatMap((el) =>
        (el.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean),
      );
      for (const id of ids) await expect(document.getElementById(id)).not.toBeNull();
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
      const menu = await waitForPortal('menu');
      const items = [...menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]')];
      items[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(document.activeElement).toBe(items[1]));
      await userEvent.keyboard('{ArrowUp}');
      await waitFor(() => expect(document.activeElement).toBe(items[0]));
    });

    await step('Home e End levam às pontas da lista', async () => {
      // Parte do item do MEIO: de uma ponta, Home ou End poderia "passar" sem
      // mover o foco, e a asserção não distinguiria tecla ignorada de tecla
      // atendida.
      const menu = await waitForPortal('menu');
      const items = [...menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]')];
      items[1].focus();
      await userEvent.keyboard('{End}');
      await waitFor(() => expect(document.activeElement).toBe(items[items.length - 1]));
      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(document.activeElement).toBe(items[0]));
    });

    await step('Digitar salta para o item, e as letras se acumulam por um segundo', async () => {
      // Numa lista de ações longa, o typeahead é o que evita percorrer item por
      // item. As três asserções são degraus, e cada uma só passa se a anterior
      // for verdade — por isso comparam com OUTRO item, e nunca com "mudou".
      const menu = await waitForPortal('menu');
      const items = [...menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]')];
      // Editar · Duplicar · Excluir — três rótulos com iniciais que se separam,
      // e dois deles começando por "e", que é o que dá sentido ao acúmulo.
      await expect(items.length).toBe(3);

      // Relógio e não `waitFor`: o que se espera é o acúmulo EXPIRAR (um
      // segundo, o padrão WAI-ARIA), e não uma mutação que se possa observar.
      const waitForTypeaheadReset = () => new Promise((resolve) => setTimeout(resolve, 1100));

      // Uma letra: a busca recomeça DEPOIS do item em foco, então "d" a partir
      // de Editar acha Duplicar.
      items[0].focus();
      await userEvent.keyboard('d');
      await expect(document.activeElement).toBe(items[1]);

      // Duas letras seguidas: "e" pousa em Excluir e "ed" — o acúmulo — corrige
      // para Editar. Sem acúmulo o segundo toque seria um "d" solto a partir de
      // Excluir, que acharia Duplicar; é essa a diferença que a asserção mede.
      await waitForTypeaheadReset();
      await userEvent.keyboard('e');
      await expect(document.activeElement).toBe(items[2]);
      await userEvent.keyboard('d');
      await expect(document.activeElement).toBe(items[0]);

      // E o acúmulo EXPIRA: passado o segundo, "d" volta a valer sozinho — de
      // Editar para Duplicar. Se o buffer não zerasse, "edd" não acharia nada.
      await waitForTypeaheadReset();
      await userEvent.keyboard('d');
      await expect(document.activeElement).toBe(items[1]);
    });

    await step('Tab fecha o menu e o foco segue o percurso da página', async () => {
      // O menu NÃO prende o foco (C2): prender é contrato de diálogo. No modo
      // modal a lib prendia — Tab não fazia nada —, e quem solta é o painel
      // desta stack (`useTabCloses`).
      //
      // Um ponto de tabulação logo depois da área, só durante o passo: sem ele
      // a página da story não tem "próximo", e o passo não distinguiria "seguiu
      // a página" de "voltou para a área". Sai no `finally`, antes do axe.
      const nextStop = document.createElement('button');
      nextStop.type = 'button';
      nextStop.textContent = 'Próximo da página';
      area().insertAdjacentElement('afterend', nextStop);
      try {
        const menu = await gestoOpen(area());
        menu.querySelector<HTMLElement>('[data-slot="context-menu-item"]')!.focus();
        await userEvent.tab();
        await waitFor(() => expect(menuOpen()).toBeNull());
        await waitFor(() => expect(document.activeElement).toBe(nextStop));
        // Saiu sem decidir nada: é `overlay`, a mesma palavra do clique fora.
        await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
      } finally {
        nextStop.remove();
      }
    });

    await step('Escape fecha e devolve o foco à área', async () => {
      await gestoOpen(area());
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('menu');
      await waitFor(() => expect(document.activeElement).toBe(area()));
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'escape');
    });

    await step('Clique fora fecha', async () => {
      await gestoOpen(area());
      await clickOutside();
      await waitForPortalGone('menu');
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Escolher um item fecha, e o motivo é a escolha', async () => {
      // `api` é o que sobra quando nenhum gesto de saída foi visto — e o único
      // caminho assim é o item escolhido. Anotação de um fechamento anterior
      // vazando para cá sairia aqui como `overlay`.
      const menu = await gestoOpen(area());
      const duplicateItem = [...menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]')][1];
      await userEvent.click(duplicateItem);
      await waitForPortalGone('menu');
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'api');
    });

    await step('Shift+F10 na área focada abre o menu, e o foco entra nele', async () => {
      // O navegador converte a tecla de menu e o Shift+F10 em `contextmenu` no
      // elemento FOCADO — é por isso que a área tem `tabindex="0"`. O
      // `userEvent` entrega a tecla, mas evento sintético não tem ação padrão:
      // o `contextmenu` que o navegador dispararia é despachado aqui, na
      // posição da área, e é ELE que a lib escuta. A tecla vem antes para a
      // lib saber que a abertura foi por teclado — é o que manda o foco ao
      // primeiro item em vez de deixá-lo no painel.
      await closeMenu();
      area().focus();
      await userEvent.keyboard('{Shift>}{F10}{/Shift}');
      const box = area().getBoundingClientRect();
      area().dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: box.left,
          clientY: box.bottom,
        }),
      );
      const menu = await waitForPortal('menu');
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
