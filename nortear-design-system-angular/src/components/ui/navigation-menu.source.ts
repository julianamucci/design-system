/**
 * Transform do painel Code do NavigationMenu.
 *
 * Módulo à parte para entrar na varredura do `source-snippets.test.ts`, que
 * CHAMA cada export e cobra o snippet publicado — inclusive que todo nome que
 * ele manda importar do design system exista mesmo lá.
 *
 * O snippet ensina a navegação como `<nav>` com `aria-label`, lista de itens, e
 * o painel de submenu em `ng-template`: um link simples e um item com gatilho,
 * lado a lado, que é a diferença que a estrutura precisa deixar clara.
 */
import type { NavigationMenuAlign, NavigationMenuOrientation } from './navigation-menu';
export type NavigationMenuArgs = {
  orientation: NavigationMenuOrientation;
  align: NavigationMenuAlign;
  delay: number;
  closeDelay: number;
  indicator: boolean;
  onValueChange: (value: string | null) => void;
};

/**
 * O painel Code imprime o `template` da story como está escrito — com os
 * bindings ligados aos args (`[orientation]="orientation"`). Isso é o andaime da
 * story, não o que alguém escreve para usar a barra. O `transform` devolve o uso
 * real, com os valores atuais dos controls já resolvidos (ver a nota em
 * `separator.stories.ts`).
 */
export function navigationMenuPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<NavigationMenuArgs> } = {},
): string {
  const { orientation = 'horizontal', align = 'start', indicator = false } = ctx.args ?? {};

  // Só o que difere do padrão entra no snippet: repetir valor default ensina
  // ruído a quem copia.
  const root = ['<nav ndsNavigationMenu aria-label="Navegação principal"']
    .concat(orientation === 'horizontal' ? [] : [`orientation="${orientation}"`])
    .concat(align === 'start' ? [] : [`align="${align}"`])
    .concat(indicator ? ['indicator'] : [])
    .join(' ') + '>';

  return `import { NDS_NAVIGATION_MENU } from '@/components/ui/navigation-menu';

@Component({
  imports: [...NDS_NAVIGATION_MENU],
  template: \`
    ${root}
      <ul ndsNavigationMenuList>
        <li ndsNavigationMenuItem>
          <a ndsNavigationMenuLink href="/" active>Início</a>
        </li>

        <li ndsNavigationMenuItem value="produtos">
          <button ndsNavigationMenuTrigger>Produtos</button>

          <ng-template ndsNavigationMenuContent>
            <ul ndsNavigationMenuPanel class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
              <li>
                <a ndsNavigationMenuChild href="/produtos/inicial">
                  <div ndsNavigationMenuChildLabel>Plano Inicial</div>
                </a>
              </li>
              <li>
                <a ndsNavigationMenuChild href="/produtos/profissional">
                  <div ndsNavigationMenuChildLabel>Plano Profissional</div>
                </a>
              </li>
            </ul>
          </ng-template>
        </li>

        <li ndsNavigationMenuItem>
          <a ndsNavigationMenuLink href="/sobre">Sobre</a>
        </li>
      </ul>
    </nav>
  \`,
})
export class Exemplo {}`;
}
