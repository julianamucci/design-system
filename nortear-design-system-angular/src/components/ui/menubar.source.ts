/**
 * Transform do painel Code do Menubar.
 *
 * Fora do `.stories.ts` porque só assim a guarda `source-snippets.test.ts`
 * alcança o construtor: ela varre `*.source.ts` por glob e CHAMA cada export
 * para ler o texto. Função local não é exportada nem alcançável.
 *
 * O snippet ensina a barra escrita à mão, com dois menus explícitos — e não o
 * `@for` que a story usa para montá-la a partir de uma lista. Quem copia
 * precisa ver a forma de um `nds-menubar-menu`: gatilho, conteúdo em
 * `ng-template` e itens com atalho.
 */
import type { MenubarSide, MenubarAlign } from './menubar';
export type MenubarArgs = {
  side: MenubarSide;
  align: MenubarAlign;
  modal: boolean;
  loopFocus: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

/**
 * O painel Code imprime o `template` da story como está escrito — com o `@for`
 * que monta a barra e com `[side]="side"` ligado ao arg. É o andaime da story,
 * não o que alguém escreve para usar o menubar. O `transform` devolve o uso
 * real, com os valores atuais dos controls já resolvidos.
 */
export function menubarPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<MenubarArgs> } = {},
): string {
  const { side = 'bottom', align = 'start', modal = true, loopFocus = true } = ctx.args ?? {};

  // Só o que difere do padrão entra: snippet que repete valor default ensina
  // ruído a quem copia.
  const barra = ['<nds-menubar']
    .concat(modal ? [] : ['[modal]="false"'])
    .concat(loopFocus ? [] : ['[loopFocus]="false"'])
    .join(' ') + '>';
  const content = ['<ng-template ndsMenubarContent']
    .concat(side === 'bottom' ? [] : [`side="${side}"`])
    .concat(align === 'start' ? [] : [`align="${align}"`])
    .join(' ') + '>';

  return `import { NDS_MENUBAR } from '@/components/ui/menubar';

@Component({
  imports: [...NDS_MENUBAR],
  template: \`
    ${barra}
      <nds-menubar-menu>
        <button ndsMenubarTrigger>Arquivo</button>

        ${content}
          <div ndsMenubarItem>Novo <span ndsMenubarShortcut>Ctrl+N</span></div>
          <div ndsMenubarItem>Abrir <span ndsMenubarShortcut>Ctrl+O</span></div>
        </ng-template>
      </nds-menubar-menu>

      <nds-menubar-menu>
        <button ndsMenubarTrigger>Editar</button>

        ${content}
          <div ndsMenubarItem>Desfazer <span ndsMenubarShortcut>Ctrl+Z</span></div>
          <div ndsMenubarItem>Refazer <span ndsMenubarShortcut>Ctrl+Shift+Z</span></div>
        </ng-template>
      </nds-menubar-menu>
    </nds-menubar>
  \`,
})
export class Exemplo {}`;
}
