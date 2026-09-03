/**
 * Transform do painel Code do Command.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que este snippet ensina é a ordem das peças da paleta: campo de busca,
 * lista com os grupos, e a frase de vazio POR ÚLTIMO — ela é o que sobra quando
 * o filtro não encontra nada, e precisa existir no template desde o começo para
 * ser anunciada. O `placeholder` faz dobradinha: é o texto do campo e o nome
 * acessível dele e da lista.
 */

export type CommandArgs = {
  placeholder: string;
  emptyMessage: string;
  showGroups: boolean;
  onItemSelect: (detalhe: { value: string; label: string }) => void;
};

/**
 * O painel Code imprime o `template` da story literalmente — com o `@if` que
 * alterna os grupos e com `(itemSelect)` ligado ao espião. O `transform`
 * devolve o uso real, montado a partir dos controls (armadilha 3).
 */
export function commandPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<CommandArgs> } = {},
): string {
  const {
    placeholder = 'Buscar componente...',
    emptyMessage = 'Nenhum resultado encontrado.',
    showGroups = true,
  } = ctx.args ?? {};

  const group = showGroups ? ' heading="Componentes"' : '';

  return `import { NDS_COMMAND } from '@/components/ui/command';

@Component({
  imports: [...NDS_COMMAND],
  template: \`
    <nds-command (itemSelect)="executar($event)">
      <input ndsCommandInput placeholder="${placeholder}" />

      <div ndsCommandList>
        <div ndsCommandGroup${group}>
          <div ndsCommandItem value="button">Button</div>
          <div ndsCommandItem value="input">Input</div>
        </div>
      </div>

      <div ndsCommandEmpty>${emptyMessage}</div>
    </nds-command>
  \`,
})
export class Exemplo {
  executar(comando: CommandSelectDetails): void {
    // roda o comando e volta o foco para onde ele age
  }
}`;
}
