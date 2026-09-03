/**
 * Transform do painel Code do DropdownMenu.
 *
 * Fora do `.stories.ts` para entrar na varredura do `source-snippets.test.ts`,
 * que CHAMA cada export e cobra o texto publicado — que todo nome mandado
 * importar de `@/components/ui/<slug>` exista mesmo lá, e que nada do andaime
 * da story vaze para o que se copia.
 *
 * O snippet ensina o menu completo em uma peça: gatilho, conteúdo em
 * `ng-template`, rótulo de grupo, itens, separador e o item destrutivo — a
 * variante que existe para a ação que não se desfaz.
 */
import type { DropdownMenuSide, DropdownMenuAlign } from './dropdown-menu';
export type DropdownMenuArgs = {
  side: DropdownMenuSide;
  align: DropdownMenuAlign;
  modal: boolean;
  defaultOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

/**
 * O painel Code imprime o `template` da story como está escrito — com os
 * bindings ligados aos args (`[side]="side"`). Isso é o andaime da story, não o
 * que alguém escreve para usar o menu. O `transform` devolve o uso real, com os
 * valores atuais dos controls já resolvidos (ver a nota em `separator.stories.ts`).
 */
export function dropdownMenuPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<DropdownMenuArgs> } = {},
): string {
  const { side = 'bottom', align = 'start', modal = true } = ctx.args ?? {};

  // Só o que difere do padrão entra: snippet que repete valor default ensina
  // ruído a quem copia.
  const root = ['<nds-dropdown-menu'].concat(modal ? [] : ['[modal]="false"']).join(' ') + '>';
  const content = ['<ng-template ndsDropdownMenuContent']
    .concat(side === 'bottom' ? [] : [`side="${side}"`])
    .concat(align === 'start' ? [] : [`align="${align}"`])
    .join(' ') + '>';

  return `import { NDS_DROPDOWN_MENU } from '@/components/ui/dropdown-menu';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_DROPDOWN_MENU, NdsButton],
  template: \`
    ${root}
      <button ndsDropdownMenuTrigger ndsButton variant="outline">Abrir menu</button>

      ${content}
        <div ndsDropdownMenuLabel>Conta</div>
        <div ndsDropdownMenuItem>Perfil</div>
        <div ndsDropdownMenuItem>Configurações</div>
        <div ndsDropdownMenuSeparator></div>
        <div ndsDropdownMenuItem variant="destructive">Sair</div>
      </ng-template>
    </nds-dropdown-menu>
  \`,
})
export class Exemplo {}`;
}
