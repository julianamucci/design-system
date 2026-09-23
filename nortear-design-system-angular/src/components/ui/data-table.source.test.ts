import { describe, expect, it } from 'vitest';
import {
  dataTableColumnFiltersSource,
  dataTableExplicitRowLabelSource,
  dataTableInlineEditingSource,
  dataTableNoResultsSource,
  dataTablePaginatedSource,
  dataTablePlaygroundSource,
} from './data-table.source';

/**
 * A ausência deste arquivo era o `source_sem_teste` do auditor, e ele era o
 * único das cinco stacks sem par.
 *
 * O painel Code imprime o `template` da story literalmente — com a fixture
 * importada e o objeto de `props` que o renderer do Angular monta — e essa
 * saída NÃO chega ao DOM durante a `play`: nenhuma suíte de navegador a
 * alcança. O `transform` devolve o uso real, e é aqui que ele tem guarda.
 *
 * A varredura genérica do `source-snippets.test.ts` prova que o snippet importa
 * o que usa e liga só o que a classe declara. O que ela NÃO pode provar é o que
 * este arquivo cobra: que o exemplo ensine a LIÇÃO daquela story, que ele bata
 * com o preview ao lado, e que não volte a ensinar premissa vencida.
 */

/** Todos os construtores, para as regras que valem para o módulo inteiro. */
const ALL = [
  dataTablePlaygroundSource,
  dataTableColumnFiltersSource,
  dataTableInlineEditingSource,
  dataTablePaginatedSource,
  dataTableExplicitRowLabelSource,
  dataTableNoResultsSource,
];

/** O bloco `template:` do snippet — é ali que mora a marcação publicada. */
function template(snippet: string): string {
  return /template:\s*`([\s\S]*?)`/.exec(snippet)?.[1] ?? '';
}

describe('o que vale para todo snippet da DataTable', () => {
  it('ensina a importação do design system, e nenhuma lib de tabela', () => {
    // D1 do PRD: esta stack reimplementa o motor em signal. Um snippet que
    // mandasse instalar `@tanstack/angular-table` ensinaria uma dependência que
    // o componente não tem — foi o que a docs page afirmou por um tempo.
    for (const build of ALL) {
      const output = build();
      // DUAS pontas, e não um prefixo fatiado de um import de linha única: o
      // snippet de edição inline importa três nomes e por isso quebra o import
      // em várias linhas, onde `.slice(0, 38)` nunca casa. O teste nasceu
      // vermelho assim em 2026-09-22 e sobreviveu a uma verificação que leu só
      // a reconciliação de ARQUIVOS da suíte, sem olhar o resultado dos testes.
      expect(output).toContain('NdsDataTable');
      expect(output).toContain(`from '@/components/ui/data-table'`);
      expect(output).not.toContain('@tanstack');
      expect(output).not.toContain('table-core');
    }
  });

  it('DECLARA colunas, dados e rótulos — nada vem do módulo de fixtures', () => {
    // O andaime da story não é parte do design system: quem copiar
    // `COLUMNS_INVOICES` recebe um import que não resolve.
    for (const build of ALL) {
      const output = build();
      expect(output).not.toContain('fixtures');
      expect(output).not.toContain('COLUMNS_INVOICES');
      expect(output).not.toContain('INVOICES_DT');
      expect(output).not.toContain('LABELS_DT');
      expect(output).not.toContain('nds-data-table-demo');
    }
  });

  it('as colunas nascem UMA vez, fora da classe', () => {
    // Recriar o array a cada render troca a identidade das colunas e zera
    // ordenação, filtro e seleção. O exemplo declara no escopo do módulo e a
    // classe só aponta.
    for (const build of ALL) {
      const output = build();
      const declaracao = output.indexOf('const COLUNAS: DataTableColumn<Fatura>[] = [');
      expect(declaracao).toBeGreaterThan(-1);
      expect(output.indexOf('export class Exemplo')).toBeGreaterThan(declaracao);
      expect(output).toContain('readonly colunas = COLUNAS;');
    }
  });

  it('a identidade da linha é sempre explícita', () => {
    // Sem `rowKey` a chave é a POSIÇÃO, e ordenar deixa marcadas as mesmas
    // linhas da tela, não as mesmas faturas.
    for (const build of ALL) {
      const output = build();
      expect(template(output)).toContain('[rowKey]="invoiceKey"');
      expect(output).toContain('readonly invoiceKey = (f: Fatura) => f.id;');
    }
  });

  it('a variante do selo pende da CHAVE estável, nunca do rótulo', () => {
    // Pendurar a cor no texto exibido faria o selo perdê-la no dia em que a
    // página fosse lida em outro idioma — e ninguém veria por quê.
    for (const build of ALL) {
      const output = build();
      expect(output).toContain("paid: 'default',");
      expect(output).toContain("pending: 'warning',");
      expect(output).toContain("canceled: 'destructive',");
      expect(output).toContain('CHAVE_DO_STATUS[String(valor)]');
      // A tabela de cor é indexada pela chave, e não por "Pago"/"Pendente".
      expect(output).not.toContain("Pago: 'default'");
    }
  });

  it('o dinheiro ordena como número, e alinha nos DOIS', () => {
    // A premissa que este caso guarda já foi escrita ao contrário em dois
    // docblocks: enquanto `.nds-table th` valia (0,1,1), o cabeçalho de coluna
    // numérica ficava à esquerda. Hoje a regra é `:where(.nds-table) th` e a
    // classe do markup decide. Um snippet que volte a ensinar o contrário
    // reprova aqui.
    for (const build of ALL) {
      const output = build();
      expect(output).toContain('numeric: true');
      expect(output).toContain('format: brl');
      expect(output).toMatch(/numeric alinha célula e cabeçalho/);
      expect(output).not.toMatch(/cabeçalho fica à esquerda/);
    }
  });
});

describe('Playground', () => {
  it('escreve só o que difere do padrão do componente', () => {
    const output = template(
      dataTablePlaygroundSource(undefined, {
        args: {
          enableRowSelection: true,
          enableGlobalFilter: true,
          enablePagination: false,
          pageSize: 25,
        },
      }),
    );
    expect(output).toContain('[enableRowSelection]="true"');
    expect(output).toContain('[enablePagination]="false"');
    expect(output).toContain('[pageSize]="25"');
    // Igual ao padrão do componente: não entra, porque repetir o default ensina
    // ruído a quem copia.
    expect(output).not.toContain('[enableGlobalFilter]');
  });

  it('sem seleção, o vocabulário de seleção sai do snippet', () => {
    const output = dataTablePlaygroundSource(undefined, { args: { enableRowSelection: false } });
    expect(template(output)).not.toContain('[enableRowSelection]');
    expect(template(output)).not.toContain('[labels]="rotulos"');
    expect(output).not.toContain('readonly rotulos = {');
  });

  it('a legenda nomeia a tabela, e cai no padrão quando o control não dá texto', () => {
    expect(dataTablePlaygroundSource()).toContain('caption="Faturas recentes"');
    expect(dataTablePlaygroundSource(undefined, { args: { caption: 'Pedidos do mês' } })).toContain(
      'caption="Pedidos do mês"',
    );
  });

  it('não deixa espião de control virar código', () => {
    // O control de um arg pode chegar como função espiã; interpolá-la
    // despejaria o corpo do mock dentro do snippet.
    const spy = (() => 'CORPO_DO_MOCK') as never;
    const output = dataTablePlaygroundSource(undefined, {
      args: { caption: spy, pageSize: spy },
    });
    expect(output).not.toContain('CORPO_DO_MOCK');
    expect(output).toContain('caption="Faturas recentes"');
    expect(template(output)).toContain('[pageSize]="5"');
  });
});

describe('cada story publica a própria lição', () => {
  it('o filtro por coluna é declarado na COLUNA', () => {
    const output = dataTableColumnFiltersSource();
    expect(output).toContain("filter: { type: 'text', placeholder: 'Filtrar cliente' }");
    expect(output).toContain(
      "filter: { type: 'select', options: ['Pago', 'Pendente', 'Cancelado'] }",
    );
    expect(template(output)).toContain('[enableColumnFilters]="true"');
  });

  it('a edição inline exige dono de estado: o componente não guarda os dados', () => {
    const output = dataTableInlineEditingSource();
    expect(output).toContain('editable: true');
    expect(template(output)).toContain('(cellEdit)="aplicarEdicao($event)"');
    expect(output).toContain('aplicarEdicao(edicao: DataTableCellEdit): void {');
    expect(output).toContain('this.faturas.update((atuais) =>');
    // Os três campos do payload são o que faz a atualização possível.
    expect(output).toContain('edicao.rowIndex');
    expect(output).toContain('edicao.columnId');
    expect(output).toContain('edicao.value');
    expect(output).toContain("type DataTableCellEdit,");
  });

  it('o tamanho inicial de página aparece junto das opções do seletor', () => {
    // Fora da lista, o seletor não tem opção marcada e passa a exibir a
    // primeira — diria "10" numa tabela que mostra cinco.
    const output = template(dataTablePaginatedSource());
    expect(output).toContain('[pageSize]="5"');
    expect(output).toContain('[pageSizeOptions]="[5, 10]"');
  });

  it('rowLabel vence a primeira coluna como identificador da linha', () => {
    const output = dataTableExplicitRowLabelSource();
    expect(template(output)).toContain('[rowLabel]="invoiceLabel"');
    expect(output).toContain('readonly invoiceLabel = (f: Fatura) => f.cliente;');
    // E continua tendo rowKey: os dois respondem perguntas diferentes.
    expect(template(output)).toContain('[rowKey]="invoiceKey"');
  });

  it('o estado vazio chega como recorte, e a grade continua de pé', () => {
    const output = dataTableNoResultsSource();
    expect(output).toContain('readonly faturas = signal<Fatura[]>([]);');
    expect(template(output)).toContain('emptyMessage="Nenhuma fatura encontrada."');
    // As colunas permanecem: quem esvaziou o recorte com um filtro precisa do
    // campo para desfazer, e quem usa leitor precisa saber que colunas voltam.
    expect(template(output)).toContain('[columns]="colunas"');
  });

  it('nenhum construtor devolve o mesmo snippet que o vizinho', () => {
    // Painel que herda mostra o exemplo de outra story, e acerta por
    // coincidência — foi por isso que as oito stories ganharam construtor
    // próprio em vez de um `transform` no `meta`.
    const saidas = ALL.map((build) => build());
    expect(new Set(saidas).size).toBe(saidas.length);
  });
});
