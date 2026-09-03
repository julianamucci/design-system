import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { NDS_CONTEXT_MENU } from './context-menu';
import { gestoOpen } from './context-menu.fixtures';
import { NdsContextMenuDocs } from '@/components/docs/ContextMenuDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal, waitForPortalVanish, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import { AREA_CLICK_DIREITO, clickOutside, closeMenu } from '@shared/testing/context-menu-area';

type ContextMenuArgs = {
  triggerLabel: string;
  areaClasse: string;
  onSelect: (item: string) => void;
};

/** Ver a nota em separator.stories.ts. */
function playgroundSource(_gerado: string, ctx: { args?: Partial<ContextMenuArgs> }): string {
  const { triggerLabel = 'Clique com o botão direito' } = ctx.args ?? {};

  return `import { NDS_CONTEXT_MENU } from '@/components/ui/context-menu';

@Component({
  imports: [NDS_CONTEXT_MENU],
  template: \`
    <div ndsContextMenu>
      <div ndsContextMenuTrigger>${triggerLabel}</div>

      <ng-template ndsContextMenuContent>
        <div ndsContextMenuItem (onSelect)="editar()">
          Editar
          <span ndsContextMenuShortcut>Ctrl+E</span>
        </div>
        <div ndsContextMenuItem>Duplicar</div>

        <div ndsContextMenuSeparator></div>

        <div ndsContextMenuItem variant="destructive" (onSelect)="excluir()">
          Excluir
          <span ndsContextMenuShortcut>Del</span>
        </div>
      </ng-template>
    </div>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<ContextMenuArgs> = {
  title: 'Primitives/Overlay/ContextMenu',
  tags: ['autodocs', 'overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_CONTEXT_MENU] })],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(NdsContextMenuDocs) },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
  },
  argTypes: {
    triggerLabel: { control: 'text', description: 'Texto da área que responde ao gesto.' },
    // Sem entrada em argTypes o renderer Angular não repassa NADA ao template —
    // nem função, nem string. Ver armadilha 5 no CLAUDE.md deste stack.
    areaClasse: { control: false, table: { disable: true } },
    onSelect: { control: false, table: { disable: true } },
  },
  args: {
    triggerLabel: 'Clique com o botão direito aqui',
    areaClasse: AREA_CLICK_DIREITO,
    onSelect: fn(),
  },
};

export default meta;
type Story = StoryObj<ContextMenuArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item7', 'accessibility.item8',
      'visual.item1',
    ],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div ndsContextMenu>
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
            <span ndsContextMenuShortcut>Ctrl+E</span>
          </div>
          <div ndsContextMenuItem (onSelect)="onSelect('duplicar')">Duplicar</div>

          <div ndsContextMenuSeparator></div>

          <div ndsContextMenuItem variant="destructive" (onSelect)="onSelect('excluir')">
            Excluir
            <span ndsContextMenuShortcut>Del</span>
          </div>
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
    });

    await step('Os itens são itens de menu de verdade', async () => {
      const menu = await waitForPortal('menu');
      const items = [...menu.querySelectorAll('[data-slot="context-menu-item"]')];
      await expect(items.length).toBe(3);
      for (const item of items) await expect(item.getAttribute('role')).toBe('menuitem');
      await expect(menu.querySelector('[data-slot="context-menu-separator"]')).not.toBeNull();
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

    await step('Escape fecha e devolve o foco à área', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('menu');
      await waitFor(() => expect(document.activeElement).toBe(area()));
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
