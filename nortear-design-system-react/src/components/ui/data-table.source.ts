/**
 * Transforms do painel Code do DataTable.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * A transform que morava INLINE no `meta` do arquivo de story montava o snippet
 * com `data={invoices}` sem declarar `invoices` em lugar nenhum: quem copiava
 * recebia uma tabela sem dados e um erro de compilação. Aqui os dados, as
 * colunas e os rótulos são DECLARADOS dentro do snippet — nada vem de módulo de
 * andaime.
 */
import {
  attrsMultilinha,
  propBool,
  propNumber,
  propText,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

export type DataTableArgs = {
  enableRowSelection: boolean;
  enableGlobalFilter: boolean;
  enableColumnVisibility: boolean;
  enablePagination: boolean;
  pageSize: number;
  globalFilterPlaceholder: string;
  emptyMessage: string;
  caption: string;
};

const CAPTION = 'Faturas recentes';

/**
 * Os dados vêm de fora — aqui um recorte, só para a tabela ter o que mostrar.
 * O que importa no exemplo é a FORMA do registro, que é o que as colunas leem.
 */
const DATA = `const invoices = [
  { id: "INV-001", customer: "Ana Souza", status: "Pago", method: "Cartão de crédito", amount: 250 },
  { id: "INV-002", customer: "Bruno Lima", status: "Pendente", method: "Boleto bancário", amount: 150 },
  { id: "INV-003", customer: "Carla Mendes", status: "Cancelado", method: "Pix", amount: 350 },
];`;

/**
 * O tipo da linha sai dos PRÓPRIOS dados.
 *
 * Uma fonte só para forma e conteúdo: mudar um campo do registro reprova as
 * colunas na hora, sem uma interface paralela para manter em dia.
 */
const LINE = '(typeof invoices)[number]';

const FORMATOS = `const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  Pago: "default",
  Pendente: "secondary",
  Cancelado: "destructive",
};`;

/**
 * Colunas em escopo estável.
 *
 * Recriar o array a cada render troca a IDENTIDADE das colunas, e a tabela
 * headless as remonta quando isso acontece — largura, ordem e fixação se perdem
 * no meio do arraste. Por isso a declaração mora fora do componente.
 */
const COLUMNS = `const columns: DataTableColumn<${LINE}>[] = [
  { accessorKey: "id", header: "Fatura", size: 110 },
  { accessorKey: "customer", header: "Cliente", size: 200 },
  {
    accessorKey: "status",
    header: "Status",
    size: 140,
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge>
    ),
  },
  { accessorKey: "method", header: "Método", size: 200 },
  {
    accessorKey: "amount",
    header: "Valor",
    size: 130,
    cell: ({ row }) => (
      <span className="nds-font-medium nds-tabular-nums">
        {currency.format(row.original.amount)}
      </span>
    ),
  },
];`;

const IMPORT_BASE = `import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";`;

/**
 * Monta o snippet inteiro: imports, dados, formatos, colunas, um bloco opcional
 * e a marcação.
 *
 * Os dados entram SEMPRE, mesmo no exemplo do conjunto vazio: é deles que o
 * tipo da linha sai, e sem eles as colunas não teriam o que tipar.
 */
function tableSnippet(partes: {
  imports?: string;
  colunas?: string;
  extra?: string;
  markup: string;
}): string {
  const blocks = [
    partes.imports ?? IMPORT_BASE,
    DATA,
    FORMATOS,
    partes.colunas ?? COLUMNS,
    partes.extra ?? null,
    partes.markup,
  ].filter((bloco): bloco is string => Boolean(bloco));
  return blocks.join('\n\n');
}

/**
 * Rótulos do domínio.
 *
 * Sem tipo anotado de propósito: o objeto literal já casa com `labels`, e o
 * exemplo não precisa ensinar um import a mais. Só as chaves informadas mudam —
 * o resto continua no padrão do componente.
 *
 * "fatura" no lugar de "linha" não é enfeite: quem lê a tela vê faturas, e dez
 * controles chamados "Selecionar linha" são indistinguíveis entre si para quem
 * usa leitor de tela (WCAG 4.1.2).
 */
const LABELS = `const rotulos = {
  selectAll: "Selecionar todas as faturas",
  selectRow: (r: string) => \`Selecionar fatura \${r}\`,
  rowsSelected: (s: number, n: number) => \`\${s} de \${n} fatura(s) selecionada(s).\`,
};`;

/**
 * Transform do `meta` — vale para todas as stories do arquivo.
 *
 * Lê os controls do Playground e escreve só o que difere do padrão do
 * componente. `rowKey` está sempre presente porque a identidade da linha é o
 * que faz a marcação viajar com o REGISTRO: sem ele a chave é a posição, e
 * ordenar deixa marcadas as mesmas linhas da tela, não os mesmos dados.
 */
export const dataTableSource: SourceTransform<DataTableArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const selection = args.enableRowSelection !== false;

  const props = attrsMultilinha(
    [
      'columns={columns}',
      'data={invoices}',
      propBool('enableRowSelection', args.enableRowSelection ?? true, false),
      propBool('enableGlobalFilter', args.enableGlobalFilter, true),
      propBool('enableColumnVisibility', args.enableColumnVisibility, true),
      propBool('enablePagination', args.enablePagination, true),
      propNumber('pageSize', args.pageSize === 10 ? null : args.pageSize),
      propText('caption', texto(args.caption) ?? CAPTION),
      propText('globalFilterPlaceholder', args.globalFilterPlaceholder),
      propText('emptyMessage', args.emptyMessage),
      selection ? 'labels={rotulos}' : null,
      'rowKey={(fatura) => fatura.id}',
    ],
    '  ',
    0,
  );

  return tableSnippet({
    extra: selection ? LABELS : undefined,
    markup: `<DataTable${props}/>`,
  });
};

/**
 * Filtros por coluna: o recorte é declarado na COLUNA, em `meta.filter`.
 *
 * `text` e `select` são os dois tipos; o `select` precisa da lista de opções.
 * Os filtros somam entre si — não se substituem —, e a coluna sem filtro ainda
 * ocupa uma célula na linha, que por isso recebe o nome da coluna fora da tela:
 * célula de cabeçalho vazia é o que o axe reprova.
 */
export function columnDataTableWithFiltersSource(): string {
  return tableSnippet({
    colunas: `const columns: DataTableColumn<${LINE}>[] = [
  { accessorKey: "id", header: "Fatura", meta: { filter: { type: "text" } } },
  { accessorKey: "customer", header: "Cliente", meta: { filter: { type: "text" } } },
  {
    accessorKey: "status",
    header: "Status",
    meta: {
      filter: { type: "select", options: ["Pago", "Pendente", "Cancelado"] },
    },
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge>
    ),
  },
  { accessorKey: "method", header: "Método", meta: { filter: { type: "text" } } },
  {
    accessorKey: "amount",
    header: "Valor",
    cell: ({ row }) => (
      <span className="nds-font-medium nds-tabular-nums">
        {currency.format(row.original.amount)}
      </span>
    ),
  },
];`,
    markup: `<DataTable
  columns={columns}
  data={invoices}
  enableColumnFilters
  enablePagination={false}
/>`,
  });
}

/**
 * Colunas redimensionáveis: a alça se anuncia como separador vertical, com o
 * nome da coluna no rótulo.
 *
 * `size` deixa de ser sugestão e passa a ser a largura inicial — com
 * `table-layout: fixed`, arrastar uma coluna não pode alterar a largura
 * declarada da vizinha.
 */
export function dataTableRedimensionavelSource(): string {
  return tableSnippet({
    markup: `<DataTable columns={columns} data={invoices} enableColumnResizing />`,
  });
}

/**
 * Reordenar e fixar: as duas flags andam juntas na prática.
 *
 * Arrastar o cabeçalho move a coluna INTEIRA, células incluídas; fixar é
 * posição (`sticky`), e não cor — sem isso o pin vira só um ícone aceso. O
 * controle de fixar mora no menu de colunas, que por isso precisa continuar
 * ligado.
 */
export function dataTableReordenavelEFixavelSource(): string {
  return tableSnippet({
    markup: `<DataTable
  columns={columns}
  data={invoices}
  enableColumnOrdering
  enableColumnPinning
/>`,
  });
}

/**
 * Edição inline: o DataTable NÃO guarda os dados.
 *
 * `meta.editable` abre o campo na célula e `onCellEdit` avisa com
 * (rowIndex, columnId, value) — quem atualiza o array é quem consome. Por isso
 * o exemplo tem dono de estado: sem ele a célula volta ao valor antigo assim
 * que perde o foco.
 */
export function dataTableWithEditSource(): string {
  return tableSnippet({
    imports: `${IMPORT_BASE}
import { useState } from "react";`,
    colunas: `const columns: DataTableColumn<${LINE}>[] = [
  { accessorKey: "id", header: "Fatura" },
  { accessorKey: "customer", header: "Cliente", meta: { editable: true } },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge>
    ),
  },
  { accessorKey: "method", header: "Método", meta: { editable: true } },
  {
    accessorKey: "amount",
    header: "Valor",
    meta: { editable: true },
    cell: ({ row }) => (
      <span className="nds-font-medium nds-tabular-nums">
        {currency.format(row.original.amount)}
      </span>
    ),
  },
];`,
    markup: `function TabelaEditavel() {
  const [dados, setDados] = useState(invoices);

  return (
    <DataTable
      columns={columns}
      data={dados}
      enableGlobalFilter={false}
      enableColumnVisibility={false}
      enablePagination={false}
      onCellEdit={(rowIndex, columnId, value) =>
        setDados((antigos) =>
          antigos.map((linha, i) =>
            i === rowIndex ? { ...linha, [columnId]: value } : linha
          )
        )
      }
    />
  );
}`,
  });
}

/**
 * Paginação: `pageSize` é só o primeiro render — depois quem manda é o seletor
 * do rodapé.
 *
 * O tamanho inicial PRECISA estar entre as opções: fora da lista o seletor não
 * tem opção marcada e passa a exibir a primeira, dizendo "10" numa tabela que
 * mostra cinco.
 */
export function dataTablePaginadaSource(): string {
  return tableSnippet({
    markup: `<DataTable
  columns={columns}
  data={invoices}
  enableGlobalFilter={false}
  pageSize={5}
  pageSizeOptions={[5, 10]}
/>`,
  });
}

/**
 * Rótulo de linha explícito: `rowLabel` diz qual campo identifica a linha.
 *
 * É o primeiro degrau do fallback e vence a primeira coluna. Sem ele o nome do
 * controle de seleção sai da primeira coluna de dados — o mesmo texto que quem
 * enxerga usaria para apontar a linha.
 */
export function lineDataTableWithLabelSource(): string {
  return tableSnippet({
    markup: `<DataTable
  columns={columns}
  data={invoices}
  enableRowSelection
  enableGlobalFilter={false}
  enablePagination={false}
  rowKey={(fatura) => fatura.id}
  rowLabel={(fatura) => fatura.customer}
/>`,
  });
}

/**
 * Virtualização: só as linhas visíveis existem no DOM.
 *
 * `maxHeight` é obrigatório na prática — é a altura da janela de rolagem que
 * define quantas linhas montar. Virtualizar desliga a paginação: as duas
 * recortam o mesmo conjunto e brigariam pelo mesmo rodapé.
 */
export function dataTableVirtualizadaSource(): string {
  return tableSnippet({
    extra: `// Mil registros num array só: quem recorta o que vai ao DOM é a
// virtualização, não quem chama.
const muitasFaturas = Array.from({ length: 1000 }, (_, i) => ({
  ...invoices[i % invoices.length],
  id: \`INV-\${String(i + 1).padStart(5, "0")}\`,
}));`,
    markup: `<DataTable
  columns={columns}
  data={muitasFaturas}
  virtualized
  maxHeight="400px"
  enableColumnVisibility={false}
/>`,
  });
}

/**
 * Sem resultados: o vazio é o assunto.
 *
 * A grade NÃO se desmonta — cabeçalho e busca continuam na tela, porque quem
 * esvaziou o recorte com um filtro precisa do campo para desfazer, e quem usa
 * leitor de tela precisa saber que colunas voltarão. `emptyMessage` é o texto
 * que ocupa a largura inteira da tabela.
 */
export function dataTableNoResultsSource(): string {
  return tableSnippet({
    markup: `// A tabela recebe o RECORTE já aplicado: quando ele volta vazio, a grade
// continua de pé e é a mensagem que ocupa a largura inteira.
<DataTable
  columns={columns}
  data={[]}
  enableRowSelection
  emptyMessage="Nenhuma fatura encontrada."
/>`,
  });
}
