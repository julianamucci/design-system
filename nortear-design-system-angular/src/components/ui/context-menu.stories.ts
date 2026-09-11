import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { NDS_CONTEXT_MENU } from './context-menu';
import { gestoOpen } from './context-menu.fixtures';
import { contextMenuPlaygroundSource, type ContextMenuArgs } from './context-menu.source';
import { NdsContextMenuDocs } from '@/components/docs/ContextMenuDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal, waitForPortalVanish, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import { pressTab } from '@/lib/press-tab';
import { NdsButton } from './button';
import { AREA_CLICK_DIREITO, clickOutside, closeMenu } from '@shared/testing/context-menu-area';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta<ContextMenuArgs> = {
  title: 'Components/Overlay/ContextMenu',
  tags: ['autodocs', 'overlay'],
  // `NdsButton` serve aos vizinhos da story de Tab — um ponto de tabulação antes
  // e outro depois da área.
  decorators: [moduleMetadata({ imports: [...NDS_CONTEXT_MENU, NdsButton] })],
  parameters: {
    design: figmaDesign('dropdownMenu'),
    layout: 'centered',
    docs: { page: withAutoDocsTab(NdsContextMenuDocs) },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
  },
  argTypes: {
    triggerLabel: { control: 'text', description: 'Texto da área que responde ao gesto.' },
    showDestructive: { control: 'boolean', description: 'Exibe o item destrutivo (Excluir).' },
    showSeparator: { control: 'boolean', description: 'Exibe a divisória antes do item destrutivo.' },
    showShortcuts: { control: 'boolean', description: 'Exibe os atalhos de teclado ao lado dos rótulos.' },
    // Sem entrada em argTypes o renderer Angular não repassa NADA ao template —
    // nem função, nem string. Ver armadilha 5 no CLAUDE.md deste stack.
    areaClasse: { control: false, table: { disable: true } },
    onSelect: { control: false, table: { disable: true } },
    onOpenChange: { control: false, table: { disable: true } },
  },
  args: {
    triggerLabel: 'Clique com o botão direito aqui',
    showDestructive: true,
    showSeparator: true,
    showShortcuts: true,
    areaClasse: AREA_CLICK_DIREITO,
    onSelect: fn(),
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<ContextMenuArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: contextMenuPlaygroundSource } },
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'functional.item12', 'functional.item13', 'functional.item14', 'functional.item15',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item7', 'accessibility.item8',
      'visual.item1',
    ],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div ndsContextMenu (openChange)="onOpenChange($event)">
        <div
          ndsContextMenuTrigger
          [class]="areaClasse"
          data-align="center"
          data-justify="center"
          data-testid="area"
        >{{ triggerLabel }}</div>

        <ng-template ndsContextMenuContent>
          <div ndsContextMenuItem (onSelect)="onSelect('editar')">
            Editar
            @if (showShortcuts) {
              <span ndsContextMenuShortcut>Ctrl+E</span>
            }
          </div>
          <div ndsContextMenuItem (onSelect)="onSelect('duplicar')">Duplicar</div>

          @if (showSeparator) {
            <div ndsContextMenuSeparator></div>
          }

          @if (showDestructive) {
            <div ndsContextMenuItem variant="destructive" (onSelect)="onSelect('excluir')">
              Excluir
              @if (showShortcuts) {
                <span ndsContextMenuShortcut>Delete</span>
              }
            </div>
          }
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const area = () => canvasElement.querySelector<HTMLElement>('[data-testid="area"]')!;

    await step('O menu do navegador não aparece por cima do nosso', async () => {
      // `defaultPrevented` é a única prova possível aqui: o menu nativo não
      // existe no DOM. Sem esta chamada barrada, os dois menus se sobrepõem.
      //
      // O `closeMenu()` NÃO é higiene: sem ele o passo mede a coisa errada no
      // replay. A lib registra um segundo supressor no `document` que barra o
      // menu nativo SEMPRE QUE o popup está aberto — então, com o menu de pé, o
      // `defaultPrevented` sai verdadeiro mesmo que o ouvinte do gatilho tenha
      // parado de funcionar. Partindo do menu fechado, quem preveniu só pode
      // ser o gatilho.
      await closeMenu();
      const evento = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      area().dispatchEvent(evento);
      await waitFor(() => expect(evento.defaultPrevented).toBe(true));
      await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('menu');
    });

    await step('O botão direito abre o menu ONDE o ponteiro estava', async () => {
      // O popup não é ancorado no gatilho: ele nasce no ponto do gesto. É a
      // única diferença real em relação ao DropdownMenu.
      const menu = await gestoOpen(area());
      const boxArea = area().getBoundingClientRect();
      const boxMenu = menu.getBoundingClientRect();
      const center = { x: boxArea.left + boxArea.width / 2, y: boxArea.top + boxArea.height / 2 };
      await expect(Math.abs(boxMenu.left - center.x)).toBeLessThan(24);
      await expect(Math.abs(boxMenu.top - center.y)).toBeLessThan(24);
      // Quem escuta a troca de estado fica sabendo da abertura.
      await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    });

    await step('Os itens são itens de menu de verdade', async () => {
      const menu = await waitForPortal('menu');
      await expect(menu.getAttribute('role')).toBe('menu');
      const items = [...menu.querySelectorAll('[data-slot="context-menu-item"]')];
      await expect(items.length).toBe(3);
      for (const item of items) await expect(item.getAttribute('role')).toBe('menuitem');
      // O PAPEL da divisória, e não só a presença dela: sem `role="separator"` a
      // linha é desenho, e o leitor de tela não anuncia que o bloco mudou.
      await expect(
        menu.querySelector('[data-slot="context-menu-separator"]')?.getAttribute('role'),
      ).toBe('separator');
    });

    await step('O atalho é lido junto do item, não escondido', async () => {
      // "Excluir, Del" é o nome útil. Com `aria-hidden` no atalho a pessoa
      // ouviria só "Excluir" e o atalho não serviria para nada.
      const menu = await waitForPortal('menu');
      const atalho = menu.querySelector<HTMLElement>('[data-slot="context-menu-shortcut"]')!;
      await expect(atalho.hasAttribute('aria-hidden')).toBe(false);
      await expect(atalho.closest('[data-slot="context-menu-item"]')).not.toBeNull();
    });

    await step('As setas percorrem os itens na ordem em que aparecem', async () => {
      // O foco parte de um item CONHECIDO — como nas outras quatro stacks.
      // Antes o passo apertava a seta a partir de onde a abertura tivesse
      // deixado o foco e conferia o TEXTO do elemento ativo: na primeira rodada
      // acertava por sorte, e no replay do painel Interactions (que reexecuta no
      // mesmo DOM, sem remontar) partia de outro lugar. Cada passo estabelece a
      // própria precondição.
      const menu = await waitForPortal('menu');
      const items = [...menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]')];
      items[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(document.activeElement).toBe(items[1]));
      await userEvent.keyboard('{ArrowUp}');
      await waitFor(() => expect(document.activeElement).toBe(items[0]));
    });

    await step('Home e End levam às pontas do menu', async () => {
      // Parte do item do MEIO: assim cada tecla tem para onde ir, e uma
      // implementação que ignorasse as duas deixaria o foco parado ali.
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
      // item. As asserções são degraus, e cada uma compara com OUTRO item —
      // nunca com "mudou", que passaria com o foco indo para qualquer lugar.
      const menu = await waitForPortal('menu');
      const items = [...menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]')];
      // Editar · Duplicar · Excluir — iniciais que se separam, e duas começando
      // por "e", que é o que dá sentido ao acúmulo.
      await expect(items.length).toBe(3);

      // Relógio, e não `waitFor`: o que se espera é o acúmulo EXPIRAR (o segundo
      // do padrão WAI-ARIA), não uma mutação que se possa observar. Sem a espera
      // o "d" de um grupo fica no buffer e o "e" do seguinte vira "de".
      const expireTypeahead = () => new Promise((resolve) => setTimeout(resolve, 1100));

      // Uma letra: a busca recomeça DEPOIS do item em foco — "d" a partir de
      // Editar acha Duplicar.
      items[0].focus();
      await userEvent.keyboard('d');
      await waitFor(() => expect(document.activeElement).toBe(items[1]));

      // Duas letras seguidas: "e" pousa em Excluir, e "ed" — o acúmulo — corrige
      // para Editar. Sem acúmulo o segundo toque seria um "d" solto a partir de
      // Excluir, que acharia Duplicar.
      await expireTypeahead();
      await userEvent.keyboard('e');
      await waitFor(() => expect(document.activeElement).toBe(items[2]));
      await userEvent.keyboard('d');
      await waitFor(() => expect(document.activeElement).toBe(items[0]));

      // E o acúmulo EXPIRA: passado o segundo, "d" volta a valer sozinho.
      await expireTypeahead();
      await userEvent.keyboard('d');
      await waitFor(() => expect(document.activeElement).toBe(items[1]));
    });

    await step('Escape fecha e devolve o foco à área', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('menu');
      await waitFor(() => expect(document.activeElement).toBe(area()));
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    });

    await step('Tab fecha o menu e, com a área como última parada, o foco volta a ela', async () => {
      // Menu não é diálogo (C2): o Tab fecha e segue a página a partir da ÁREA.
      // Aqui a área é a única parada do canvas — não há vizinho depois dela —,
      // então o destino é ela mesma: nem o `<body>`, nem o fim do documento,
      // onde o painel vive em portal. Os vizinhos estão na story TabLeavesMenu.
      //
      // Tab despachado à mão (`@/lib/press-tab`): sem ação padrão, o foco só
      // chega à área se o MENU o levar. Com `userEvent.keyboard('{Tab}')` a
      // biblioteca de teste movia o foco pela conta dela, e o passo reprovava
      // ou passava conforme o relógio.
      const menu = await gestoOpen(area());
      menu.querySelector<HTMLElement>('[data-slot="context-menu-item"]')!.focus();
      pressTab();
      await waitForPortalVanish('menu');
      await waitFor(() => expect(document.activeElement).toBe(area()));
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    });

    await step('Clique fora fecha', async () => {
      // `clickOutside` despacha `pointerdown`, `mousedown` e `click` no `<body>`
      // em vez de `userEvent.click(document.body)`: a camada dispensável escuta
      // um evento diferente em cada lib, e o `userEvent` se RECUSA a clicar num
      // elemento com `pointer-events: none` — a play morreria com erro em vez de
      // falha. É o helper que as outras quatro stacks já usam aqui.
      await gestoOpen(area());
      await clickOutside();
      await waitForPortalVanish('menu');
    });

    await step('Escolher um item avisa quem escuta', async () => {
      const menu = await gestoOpen(area());
      await userEvent.click(
        within(menu).getByText('Duplicar').closest('[data-slot="context-menu-item"]')!,
      );
      await waitForPortalVanish('menu');
      await expect(args.onSelect).toHaveBeenCalledWith('duplicar');
      // E o foco volta à área, de onde o menu saiu.
      await waitFor(() => expect(document.activeElement).toBe(area()));
    });

    await step('Shift+F10 na área focada abre o menu, e o foco entra nele', async () => {
      // A tecla Menu e o Shift+F10 são o caminho de quem não usa mouse, e o
      // navegador os entrega como `contextmenu` no elemento FOCADO. Tecla
      // sintética não dispara a ação padrão do navegador, então o passo entrega o
      // evento que ele entregaria — e o que se prova é o resto: a área RECEBE
      // foco (sem a parada de tabulação não haveria a quem entregar), o mesmo
      // evento abre o menu, e o foco pousa no primeiro item.
      await closeMenu();
      area().focus();
      await expect(document.activeElement).toBe(area());
      // O primitivo separa teclado de ponteiro pelo tempo desde o último
      // `pointerdown` na área (300 ms): o passo anterior foi um gesto de
      // ponteiro, e sem esta espera o evento seria lido como clique direito —
      // que abre sem destacar item nenhum. Relógio, porque o que se espera é o
      // tempo passar.
      await new Promise((resolve) => setTimeout(resolve, 350));
      const box = area().getBoundingClientRect();
      area().dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: box.left + box.width / 2,
          clientY: box.top + box.height / 2,
        }),
      );
      const menu = await waitForPortal('menu');
      const firstItem = menu.querySelector<HTMLElement>('[data-slot="context-menu-item"]')!;
      await waitFor(() => expect(document.activeElement).toBe(firstItem));
    });

    await step('A story termina com o menu ABERTO', async () => {
      // É o estado que o Chromatic fotografa e o axe varre — `visual.item1`
      // descreve o menu ABERTO, com itens, divisória e atalho. Até esta passada
      // a play terminava escolhendo um item, ou seja, com o menu fechado: a
      // declaração de cobertura visual apontava para uma foto da área vazia.
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
 * Antes da correção (medido com teclado real em 2026-09-10), a lib fechava o
 * menu e o foco VOLTAVA à área: Tab e Shift+Tab davam no mesmo lugar, e no
 * submenu só o submenu fechava. O Tab é despachado à mão (`@/lib/press-tab`),
 * então o foco só chega ao vizinho se o menu o levar.
 */
export const TabLeavesMenu: Story = {
  parameters: {
    covers: ['functional.item12'],
    controls: { disable: true },
  },
  render: () => ({
    props: { areaClasse: AREA_CLICK_DIREITO },
    template: `
      <div class="nds-cluster" data-spacing="md">
        <button ndsButton variant="ghost">Antes</button>
        <div ndsContextMenu>
          <div
            ndsContextMenuTrigger
            [class]="areaClasse"
            data-align="center"
            data-justify="center"
            data-testid="area"
          >Clique com o botão direito aqui</div>

          <ng-template ndsContextMenuContent>
            <div ndsContextMenuItem>Editar</div>
            <div ndsContextMenuItem>Duplicar</div>

            <div ndsContextMenuSub>
              <div ndsContextMenuSubTrigger>Compartilhar</div>
              <ng-template ndsContextMenuSubContent>
                <div ndsContextMenuItem>Por e-mail</div>
                <div ndsContextMenuItem>Por link</div>
              </ng-template>
            </div>
          </ng-template>
        </div>
        <button ndsButton variant="ghost">Depois</button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const area = () => canvas.getByTestId('area');
    const before = canvas.getByRole('button', { name: 'Antes' });
    const after = canvas.getByRole('button', { name: 'Depois' });

    const openWithItemFocused = async () => {
      const menu = await gestoOpen(area());
      menu.querySelector<HTMLElement>('[data-slot="context-menu-item"]')!.focus();
      await expect(menu.contains(document.activeElement)).toBe(true);
      return menu;
    };

    await step('Tab fecha o menu e o foco vai ao ponto DEPOIS da área', async () => {
      await openWithItemFocused();
      pressTab();
      await waitForPortalVanish('menu');
      // Nem a área, que era onde a lib devolvia o foco, nem o fim do documento,
      // onde o painel vive em portal.
      await waitFor(() => expect(document.activeElement).toBe(after));
    });

    await step('Shift+Tab fecha o menu e o foco vai ao ponto ANTES da área', async () => {
      await openWithItemFocused();
      pressTab(true);
      await waitForPortalVanish('menu');
      await waitFor(() => expect(document.activeElement).toBe(before));
    });

    await step('Tab dentro do submenu fecha o menu INTEIRO e segue da área', async () => {
      const menu = await openWithItemFocused();
      within(menu).getByRole('menuitem', { name: 'Compartilhar' }).focus();
      await userEvent.keyboard('{ArrowRight}');
      const submenu = () =>
        document.querySelector<HTMLElement>('[data-slot="context-menu-sub-content"]');
      await waitFor(() => expect(submenu()?.contains(document.activeElement)).toBe(true));

      pressTab();
      // Os dois painéis: fechar só o filho deixaria o raiz aberto com o foco
      // fora dele.
      await waitForPortalVanish('menu');
      await waitFor(() => expect(document.activeElement).toBe(after));
    });
  },
};
