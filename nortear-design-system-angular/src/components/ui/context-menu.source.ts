/**
 * Transform do painel Code do ContextMenu.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que este snippet ensina é a divisão entre gatilho e conteúdo: a área que
 * responde ao gesto fica no template, e os itens moram num `<ng-template>` que
 * só é instanciado quando o menu abre. O separador agrupa o que é destrutivo, e
 * o atalho vai numa peça própria — não é texto do item, é anotação dele.
 *
 * A EXTRAÇÃO ENCONTROU UM DEFEITO, e ele está corrigido aqui: os dois
 * `(onSelect)` chamavam `editar()` e `excluir()` contra uma classe `Exemplo`
 * VAZIA. Expressão de template do Angular só enxerga membro de classe, então
 * quem copiasse receberia dois bindings que não resolvem. Enquanto o construtor
 * era função local ninguém podia ver isso; o check `liga só o que a classe
 * declara` acusou no primeiro segundo em que o snippet ficou alcançável.
 */

export type ContextMenuArgs = {
  triggerLabel: string;
  areaClasse: string;
  onSelect: (item: string) => void;
};

/** Ver a nota em separator.stories.ts. */
export function contextMenuPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<ContextMenuArgs> } = {},
): string {
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
export class Exemplo {
  editar(): void {
    // abre a edição do alvo em que o gesto começou
  }

  excluir(): void {
    // o menu fecha sozinho; a confirmação, se houver, é sua
  }
}`;
}
