/**
 * Transform do painel Code do Table.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * O que o snippet ensina: a tabela é HTML nativo com uma diretiva por elemento,
 * e o elemento externo que rola na horizontal é escrito por quem usa — diretiva
 * de atributo tem o `<table>` como host e não pode criar um pai. A `<caption>`
 * nunca some do DOM: é ela que dá nome à tabela para o leitor de tela, e o que
 * muda é ficar ou não visível.
 *
 * O achado do primeiro dia sob portão: o comentário do snippet chamava o
 * elemento externo pelo nome que a guarda reserva ao ANDAIME da story. Ele
 * passou a ser nomeado pela diretiva que o define.
 */
import { TOTAL } from './table.fixtures';

export type TableArgs = {
  captionVisible: boolean;
  withFooter: boolean;
};

/**
 * O painel Code imprime o `template` da story como está escrito — com o `@for`
 * que percorre a fixture e os `@if` que ligam e desligam rodapé e legenda. É o
 * andaime da story, não o que alguém escreve para montar uma tabela. O
 * `transform` devolve o uso real, com o valor atual dos controls resolvido.
 * Ver a nota em `separator.source.ts`.
 */
export function tablePlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<TableArgs> } = {},
): string {
  const { captionVisible = false, withFooter = true } = ctx.args ?? {};

  // A legenda nunca some do DOM: é ela que dá nome à tabela para o leitor de
  // tela. O que muda é ficar ou não visível.
  const caption = captionVisible
    ? '<caption ndsTableCaption>Lista de faturas recentes</caption>'
    : '<caption ndsTableCaption class="nds-sr-only">Lista de faturas recentes</caption>';

  const footer = withFooter
    ? `
      <tfoot ndsTableFooter>
        <tr ndsTableRow>
          <td ndsTableCell colspan="3">Total</td>
          <td ndsTableCell class="nds-text-right">${TOTAL}</td>
        </tr>
      </tfoot>`
    : '';

  return `import {
  NdsTableWrapper, NdsTable, NdsTableCaption, NdsTableHeader,
  NdsTableBody, NdsTableFooter, NdsTableRow, NdsTableHead, NdsTableCell,
} from '@/components/ui/table';

@Component({
  imports: [
    NdsTableWrapper, NdsTable, NdsTableCaption, NdsTableHeader,
    NdsTableBody, NdsTableFooter, NdsTableRow, NdsTableHead, NdsTableCell,
  ],
  template: \`
    <!-- O elemento externo é escrito por quem usa: a diretiva ndsTableWrapper
         tem o <table> como host e não pode criar um pai. Ele é quem rola na
         horizontal, e é por isso que precisa ser alcançável por teclado. -->
    <div ndsTableWrapper>
      <table ndsTable>
        ${caption}
        <thead ndsTableHeader>
          <tr ndsTableRow>
            <th ndsTableHead>Fatura</th>
            <th ndsTableHead>Status</th>
            <th ndsTableHead>Método</th>
            <th ndsTableHead class="nds-text-right">Valor</th>
          </tr>
        </thead>
        <tbody ndsTableBody>
          @for (fatura of faturas(); track fatura.id) {
            <tr ndsTableRow>
              <td ndsTableCell class="nds-font-medium">{{ fatura.id }}</td>
              <td ndsTableCell>{{ fatura.status }}</td>
              <td ndsTableCell>{{ fatura.metodo }}</td>
              <td ndsTableCell class="nds-text-right">{{ fatura.valor }}</td>
            </tr>
          }
        </tbody>${footer}
      </table>
    </div>
  \`,
})
export class Exemplo {
  readonly faturas = signal(carregarFaturas());
}`;
}
