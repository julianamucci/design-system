/**
 * Transform do painel Code do Sidebar.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * O que o snippet ensina: a coluna inteira nasce do `ndsSidebarProvider`, e é
 * ele que guarda o estado de aberto/recolhido — sem esse pai, nem o gatilho nem
 * o trilho têm o que alternar. O `ndsSidebarInset` é o irmão que recebe o
 * conteúdo da página, e a navegação vai dentro de um `<nav>` nomeado, que é
 * quem dá o marco ao leitor de tela.
 */
export type SidebarArgs = {
  side: 'left' | 'right';
  variant: 'sidebar' | 'floating' | 'inset';
  collapsible: 'offcanvas' | 'icon' | 'none';
  defaultOpen: boolean;
  /**
   * Ponto de virada entre coluna e gaveta. Declarado aqui só para existir na
   * tabela da aba API Reference: nesta stack ele é token de injeção, entra por
   * `providers` e nunca por `args` — por isso o argType é `control: false` e
   * não há valor inicial.
   */
  NDS_SIDEBAR_MOBILE_QUERY?: never;
};

/** Ver a nota em separator.source.ts. */
export function sidebarPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<SidebarArgs> } = {},
): string {
  const {
    side = 'left',
    variant = 'sidebar',
    collapsible = 'offcanvas',
    defaultOpen = true,
  } = ctx.args ?? {};

  const attrs = [
    side !== 'left' ? `side="${side}"` : '',
    variant !== 'sidebar' ? `variant="${variant}"` : '',
    collapsible !== 'offcanvas' ? `collapsible="${collapsible}"` : '',
  ].filter(Boolean).join(' ');

  return `import { NDS_SIDEBAR } from '@/components/ui/sidebar';

@Component({
  imports: [NDS_SIDEBAR],
  template: \`
    <div ndsSidebarProvider [defaultOpen]="${defaultOpen}">
      <div ndsSidebar${attrs ? ' ' + attrs : ''}>
        <div ndsSidebarHeader>Acme</div>

        <div ndsSidebarContent>
          <nav aria-label="Navegação principal">
            <div ndsSidebarGroup>
              <div ndsSidebarGroupLabel>Plataforma</div>
              <ul ndsSidebarMenu>
                <li ndsSidebarMenuItem>
                  <a ndsSidebarMenuButton href="/painel" [active]="true">Painel</a>
                </li>
                <li ndsSidebarMenuItem>
                  <a ndsSidebarMenuButton href="/ajustes">Ajustes</a>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <button ndsSidebarRail></button>
      </div>

      <main ndsSidebarInset>
        <button ndsSidebarTrigger>☰</button>
      </main>
    </div>
  \`,
})
export class Exemplo {}`;
}
