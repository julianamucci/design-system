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
import { expectInvolucroComCaixa } from '@shared/testing/ancoragem';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { Button } from '@/components/ui/button';
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

/**
 * Espião dos itens do Playground — prova que o clique fora fecha SEM executar
 * item nenhum (F3). Fora dos `args` de propósito: é instrumento da play, não
 * control, e um arg sem `argTypes` deixaria o painel com uma linha muda.
 */
const playgroundItemSelect = fn();

/**
 * O teclado REAL do navegador — o `userEvent` do vitest em modo browser, que
 * passa pelo CDP —, quando existir.
 *
 * O `userEvent` do `storybook/test` monta eventos no DOM, e evento montado não
 * executa a ação padrão do navegador. Para a tecla de menu a ação padrão É o
 * que se quer medir: o navegador dispara `contextmenu` no elemento focado.
 * Com o evento montado, a tecla chegaria à área e nada abriria.
 *
 * `vitest/browser` é módulo virtual do plugin do Vitest (ver
 * `.storybook/main.ts`): fora do modo browser — o painel Interactions — o
 * import falha, e quem chama faz a parte do navegador pelo DOM.
 */
async function realKeyboard(): Promise<((text: string) => Promise<void>) | null> {
  try {
    const mod = (await import('vitest/browser')) as {
      userEvent?: { keyboard?: (text: string) => Promise<void> };
    };
    const keyboard = mod.userEvent?.keyboard;
    if (keyboard) return (text) => keyboard.call(mod.userEvent, text);
  } catch {
    // Sem modo browser: o chamador faz a parte do navegador.
  }
  return null;
}

/**
 * A parte do navegador, quando não há teclado real: `contextmenu` no centro do
 * elemento, que é o que a tecla de menu e o Shift+F10 disparam no focado.
 */
function dispatchContextMenu(target: HTMLElement): void {
  const box = target.getBoundingClientRect();
  target.dispatchEvent(
    new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: box.left + box.width / 2,
      clientY: box.top + box.height / 2,
    }),
  );
}

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
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuSeparator,
      ContextMenuShortcut,
    },
    setup() {
      return { args, itemSelect: playgroundItemSelect };
    },
    template: `
      <ContextMenu :modal="args.modal" @update:open="args.onOpenChange">
        <ContextMenuTrigger class="${AREA_CLICK_DIREITO}" data-align="center" data-justify="center" data-testid="area">
          {{ args.triggerLabel }}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem @select="itemSelect">
            Editar
            <ContextMenuShortcut v-if="args.showShortcuts">Ctrl+E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem @select="itemSelect">Duplicar</ContextMenuItem>
          <ContextMenuSeparator v-if="args.showSeparator" />
          <ContextMenuItem v-if="args.showDestructive" variant="destructive" @select="itemSelect">
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
      // F16, pelo ponteiro: o foco ENTRA no menu ao abrir — sem isso a seta
      // seguinte andaria na página, e o menu à vista seria inalcançável pelo
      // teclado de quem abriu com o mouse.
      await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true));
    });

    await step('E o invólucro que a lib posiciona tem CAIXA', async () => {
      // Aqui não há folga a cobrar: o menu nasce no ponto do ponteiro, e não
      // ancorado num elemento. O que vale é a outra metade da ancoragem — com o
      // painel fora do fluxo pela folha, o invólucro que a lib posiciona colapsa
      // para 0×0 e ela passa a calcular colisão contra uma caixa sem tamanho.
      // O defeito é silencioso até o TAMANHO do painel entrar na conta. Ver
      // `ancoragem.ts`.
      const panel = document.querySelector<HTMLElement>('.nds-dropdown-menu-content')!;
      expectInvolucroComCaixa(panel);
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

    await step('Com a área como ÚLTIMA parada da página, Tab fecha o menu e o foco volta a ela', async () => {
      // A segunda metade do F12: sem próximo ponto de tabulação, o Tab fecha do
      // mesmo jeito — preso, seria a armadilha que C2 proíbe — e o foco volta à
      // área pelo caminho da lib, como no Escape. Nesta story a área é o ÚNICO
      // ponto de tabulação (o vizinho do passo anterior já saiu no `finally`),
      // então ela é também o último. A precondição é conferida, não suposta — e
      // sem o `tabbableBeside` do wrapper, que seria medir a peça com ela mesma:
      // "tabulável" aqui é `tabIndex >= 0` e visível.
      const stopsAfterArea = [...canvasElement.ownerDocument.querySelectorAll<HTMLElement>('*')].filter(
        (el) =>
          el.tabIndex >= 0
          && el.getClientRects().length > 0
          && Boolean(area().compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING),
      );
      await expect(stopsAfterArea).toHaveLength(0);

      const menu = await gestoOpen(area());
      menu.querySelector<HTMLElement>('[data-slot="context-menu-item"]')!.focus();
      // Despacho, e não `userEvent.tab()`: sem próximo ponto, o user-event
      // calcularia por conta própria para onde ir, e o passo mediria a
      // biblioteca de teste em vez do wrapper — ver `pressTab`.
      pressTab();
      await waitForPortalGone('menu');
      await waitFor(() => expect(document.activeElement).toBe(area()));
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Escape fecha e devolve o foco à área', async () => {
      await gestoOpen(area());
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('menu');
      await waitFor(() => expect(document.activeElement).toBe(area()));
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'escape');
    });

    await step('Clique fora fecha, sem executar nenhum item', async () => {
      await gestoOpen(area());
      // Zerado DEPOIS de abrir e antes do clique: o que se mede é só este
      // gesto. F3 promete as duas metades — fecha E não executa —, e sem o
      // espião a segunda passava sem ninguém olhar.
      playgroundItemSelect.mockClear();
      await clickOutside();
      await waitForPortalGone('menu');
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
      await expect(playgroundItemSelect).not.toHaveBeenCalled();
    });

    await step('Escolher um item fecha, e o motivo é a escolha', async () => {
      // `api` é o que sobra quando nenhum gesto de saída foi visto — e o único
      // caminho assim é o item escolhido. Anotação de um fechamento anterior
      // vazando para cá sairia aqui como `overlay`.
      const menu = await gestoOpen(area());
      const duplicateItem = [...menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]')][1];
      playgroundItemSelect.mockClear();
      await userEvent.click(duplicateItem);
      await waitForPortalGone('menu');
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'api');
      // O contraponto do clique fora: aqui o espião DISPARA — é o que dá dentes
      // ao "não executou" do passo anterior.
      await expect(playgroundItemSelect).toHaveBeenCalledTimes(1);
    });

    await step('A TECLA DE MENU com a área focada abre o menu, e o foco entra nele', async () => {
      // F15 e F16 pela tecla de menu de verdade. A área PRECISA estar na ordem
      // de tabulação: a tecla dispara `contextmenu` no elemento focado, e sem
      // parada de tabulação o menu não existe para quem não usa mouse.
      await closeMenu();
      area().focus();
      await expect(document.activeElement).toBe(area());
      const real = await realKeyboard();
      if (real) {
        // Teclado REAL: quem transforma a tecla em `contextmenu` é o próprio
        // navegador, e nada é despachado à mão — é a tecla que se mede.
        await real('{ContextMenu}');
      } else {
        // Painel Interactions, sem CDP: a play faz a parte do navegador.
        await userEvent.keyboard('{ContextMenu}');
        dispatchContextMenu(area());
      }
      const menu = await waitForPortal('menu');
      // O foco ENTRA no menu, sem nenhum item focado à mão — e a seta prova que
      // dali os itens são alcançáveis.
      await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true));
      await userEvent.keyboard('{ArrowDown}');
      const items = [...menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]')];
      await waitFor(() => expect(items).toContain(document.activeElement));
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('menu');
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

/**
 * Um `Tab` de teclado, DESPACHADO À MÃO no elemento em foco — a ordem do
 * teclado real, `keydown` no item em foco primeiro. Quem decide o Tab é o
 * ouvinte de CAPTURA do painel (`useTabCloses`); com o foco já movido, a tecla
 * nunca chegaria a ele. A mesma forma das stories de Tab do DropdownMenu.
 */
function pressTab(shift = false): void {
  document.activeElement?.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true }),
  );
}

/**
 * Menu não prende o foco (C2 do PRD do DropdownMenu, que é também o deste): Tab
 * fecha e o foco segue a página a partir da ÁREA — o próximo ponto de
 * tabulação depois dela, ou o anterior no Shift+Tab. A área como última parada
 * está no Playground.
 *
 * O passo que só esta story mede é o do SUBMENU (F12, "também de dentro do
 * submenu"): o painel dele vive em outro portal, e a tecla apertada ali nunca
 * chega ao ouvinte do raiz. O Playground cobria só o painel raiz.
 */
export const TabLeavesMenu: Story = {
  parameters: {
    covers: ['functional.item12'],
    controls: { disable: true },
  },
  render: (args) => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuSub,
      ContextMenuSubTrigger,
      ContextMenuSubContent,
      Button,
    },
    setup() {
      return { args };
    },
    template: `
      <div class="nds-cluster" data-spacing="md">
        <Button variant="ghost">Antes</Button>
        <ContextMenu @update:open="args.onOpenChange">
          <ContextMenuTrigger class="${AREA_CLICK_DIREITO}" data-align="center" data-justify="center" data-testid="area">
            {{ args.triggerLabel }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Editar</ContextMenuItem>
            <ContextMenuItem>Duplicar</ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Por e-mail</ContextMenuItem>
                <ContextMenuItem>Por link</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
        <Button variant="ghost">Depois</Button>
      </div>
    `,
  }),
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
      await waitForPortalGone('menu');
      await waitFor(() => expect(document.activeElement).toBe(after));
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Shift+Tab fecha o menu e o foco vai ao ponto ANTES da área', async () => {
      await openWithItemFocused();
      pressTab(true);
      await waitForPortalGone('menu');
      await waitFor(() => expect(document.activeElement).toBe(before));
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Tab dentro do submenu fecha o menu INTEIRO e segue da área', async () => {
      const menu = await openWithItemFocused();
      within(menu).getByRole('menuitem', { name: 'Compartilhar' }).focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(openMenus()).toHaveLength(2));
      const sub = document.querySelector<HTMLElement>('[data-slot="context-menu-sub-content"]')!;
      within(sub).getAllByRole('menuitem')[0].focus();
      await expect(sub.contains(document.activeElement)).toBe(true);

      pressTab();
      // Os dois painéis: fechar só o filho deixaria o raiz aberto com o foco
      // fora dele.
      await waitForPortalGone('menu');
      await waitFor(() => expect(document.activeElement).toBe(after));
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });
  },
};
