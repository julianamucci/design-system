/**
 * Transforms do painel Code do Table.
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
 *
 * O achado de 2026-09-24: havia UM construtor para treze stories. Os outros
 * onze painéis publicavam o `template` da story — `@for` sobre a fixture,
 * `props` do renderer, `@if` ligado a control —, que é andaime e não uso. Cada
 * story passou a ter o seu, e os dados são DECLARADOS dentro do exemplo: quem
 * copia recebe algo que compila sozinho.
 */
import { TOTAL } from './table.fixtures';

export type TableArgs = {
  captionVisible: boolean;
  withFooter: boolean;
};

const CAPTION = 'Lista de faturas recentes';

// ─── Montagem do exemplo ──────────────────────────────────────────────────────

/**
 * O bloco `@Component` completo, com import, template e classe.
 *
 * Expressão de template do Angular só enxerga MEMBRO DE CLASSE: constante
 * importada no topo do arquivo é invisível ali. Por isso todo dado que o
 * template percorre entra em `members`, e não numa constante do módulo.
 */
function example(opts: {
  parts: string[];
  /** Tipos importados da mesma peça — entram no import, nunca em `imports: []`. */
  types?: string[];
  /** Linhas de import de OUTRAS peças do design system. */
  extras?: string[];
  /**
   * Os nomes que aquelas linhas trazem, para o array `imports` do `@Component`.
   *
   * Sem isto o exemplo importava a peça no topo e não a declarava no
   * componente: em standalone é o array que faz a diretiva valer no template, e
   * quem copiasse receberia um `<button ndsButton>` inerte.
   */
  extraDirectives?: string[];
  angular?: string[];
  markup: string;
  members: string[];
}): string {
  const parts = [...new Set(opts.parts)].sort();
  const types = [...new Set(opts.types ?? [])].sort();
  const angular = [...new Set(['Component', ...(opts.angular ?? [])])].sort();
  const declared = [...parts, ...(opts.extraDirectives ?? [])];
  const importedFromTable = [
    ...parts.map((p) => `  ${p},`),
    ...types.map((t) => `  type ${t},`),
  ].join('\n');
  const head = [
    `import { ${angular.join(', ')} } from '@angular/core';`,
    `import {\n${importedFromTable}\n} from '@/components/ui/table';`,
    ...(opts.extras ?? []),
  ].join('\n');

  return `${head}

@Component({
  imports: [
${declared.map((d) => `    ${d},`).join('\n')}
  ],
  template: \`
${opts.markup}
  \`,
})
export class Example {
${opts.members.join('\n')}
}`;
}

/** Peças que quase todo exemplo usa. */
const BASE_PARTS = [
  'NdsTableWrapper',
  'NdsTable',
  'NdsTableCaption',
  'NdsTableHeader',
  'NdsTableBody',
  'NdsTableRow',
  'NdsTableHead',
  'NdsTableCell',
];

/**
 * O elemento externo que rola na horizontal.
 *
 * Ele é escrito por quem usa porque a diretiva `ndsTableWrapper` tem o
 * `<table>` como host e não pode criar um pai. `regionLabel` é opcional: sem
 * nome não emitimos papel nenhum, e papel sem nome é uma parada que o leitor de
 * tela não sabe anunciar.
 */
function shell(inner: string, regionLabel?: string): string {
  const label = regionLabel ? ` regionLabel="${regionLabel}"` : '';
  return `    <!-- O elemento externo é escrito por quem usa: a diretiva
         ndsTableWrapper tem o <table> como host e não pode criar um pai. Ele é
         quem rola na horizontal, e por isso precisa ser alcançável por teclado. -->
    <div ndsTableWrapper${label}>
      <table ndsTable>
${inner}
      </table>
    </div>`;
}

/**
 * A legenda NUNCA sai do DOM: é ela que dá nome à tabela para quem ouve. O que
 * muda é ficar ou não visível, e `nds-sr-only` recorta a caixa sem tirar da
 * árvore de acessibilidade — `display: none` tiraria das duas.
 */
function caption(text = CAPTION, visible = false): string {
  const cls = visible ? '' : ' class="nds-sr-only"';
  return `        <caption ndsTableCaption${cls}>${text}</caption>`;
}

/** Cabeçalho de quatro colunas, com a numérica alinhada à direita. */
const HEADER = `        <thead ndsTableHeader>
          <tr ndsTableRow>
            <th ndsTableHead>Fatura</th>
            <th ndsTableHead>Status</th>
            <th ndsTableHead>Método</th>
            <th ndsTableHead class="nds-text-right">Valor</th>
          </tr>
        </thead>`;

/** Corpo percorrendo os dados — é assim que a tabela é escrita de verdade. */
const BODY = `        <tbody ndsTableBody>
          @for (invoice of invoices(); track invoice.id) {
            <tr ndsTableRow>
              <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
              <td ndsTableCell>{{ invoice.status }}</td>
              <td ndsTableCell>{{ invoice.method }}</td>
              <td ndsTableCell class="nds-text-right">{{ invoice.amount }}</td>
            </tr>
          }
        </tbody>`;

/** Sumário. O `colspan` faz o rótulo ocupar as colunas descritivas e o valor
 * cair exatamente sob a coluna que ele soma. */
const FOOTER = `        <tfoot ndsTableFooter>
          <tr ndsTableRow>
            <td ndsTableCell colspan="3">Total</td>
            <td ndsTableCell class="nds-text-right">${TOTAL}</td>
          </tr>
        </tfoot>`;

/**
 * As três faturas do exemplo, como MEMBRO da classe.
 *
 * O valor é string formatada de propósito: o exemplo ensina a montagem da
 * tabela, e uma conversão de moeda no meio dela roubaria a atenção do assunto.
 */
const INVOICES_MEMBER = [
  '  readonly invoices = signal([',
  "    { id: '#INV-001', status: 'Pago', method: 'Cartão de crédito', amount: 'R$ 250,00' },",
  "    { id: '#INV-002', status: 'Pendente', method: 'Transferência bancária', amount: 'R$ 150,00' },",
  "    { id: '#INV-003', status: 'Cancelado', method: 'Pix', amount: 'R$ 350,00' },",
  '  ]);',
];

// ─── Playground ───────────────────────────────────────────────────────────────

/**
 * O painel Code imprimia o `template` da story como está escrito — com o `@for`
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

  return example({
    parts: withFooter ? [...BASE_PARTS, 'NdsTableFooter'] : BASE_PARTS,
    angular: ['signal'],
    markup: shell(
      [caption(CAPTION, captionVisible), HEADER, BODY, withFooter ? FOOTER : '']
        .filter(Boolean)
        .join('\n'),
    ),
    members: INVOICES_MEMBER,
  });
}

// ─── Variantes ────────────────────────────────────────────────────────────────

/**
 * Forma mínima que ainda cumpre o contrato: legenda VISÍVEL e nenhum sumário.
 * Sem `caption` a tabela chega ao leitor de tela sem nome, e "tabela, 4 colunas"
 * não diz de quê.
 */
export function tableBasicSource(): string {
  return example({
    parts: BASE_PARTS,
    angular: ['signal'],
    markup: shell([caption(CAPTION, true), HEADER, BODY].join('\n')),
    members: INVOICES_MEMBER,
  });
}

/** Total no `tfoot`. O rodapé semântico é lido como sumário; a mesma célula no
 * corpo entraria na contagem de registros. */
export function tableFooterSource(): string {
  return example({
    parts: [...BASE_PARTS, 'NdsTableFooter'],
    angular: ['signal'],
    markup: shell(
      [caption('Faturas recentes com total'), HEADER, BODY, FOOTER].join('\n'),
    ),
    members: INVOICES_MEMBER,
  });
}

/**
 * Legenda só para leitor de tela, ao lado de um título visível na página.
 *
 * É o par que justifica a classe: o `<h2>` nomeia a seção para quem vê e a
 * legenda nomeia a TABELA para quem ouve. Sem o título por perto, esconder a
 * legenda é só esconder informação.
 */
export function tableCaptionSrOnlySource(): string {
  const body = `        <tbody ndsTableBody>
          @for (invoice of invoices(); track invoice.id) {
            <tr ndsTableRow>
              <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
              <td ndsTableCell>{{ invoice.status }}</td>
              <td ndsTableCell class="nds-text-right">{{ invoice.amount }}</td>
            </tr>
          }
        </tbody>`;
  const header = `        <thead ndsTableHeader>
          <tr ndsTableRow>
            <th ndsTableHead>Fatura</th>
            <th ndsTableHead>Status</th>
            <th ndsTableHead class="nds-text-right">Valor</th>
          </tr>
        </thead>`;

  return example({
    parts: BASE_PARTS,
    angular: ['signal'],
    markup: `    <div class="nds-stack" data-spacing="sm">
      <h2 class="nds-text-h3 nds-m-0">Faturas recentes</h2>
${shell([caption(), header, body].join('\n'))
      .split('\n')
      .map((line) => (line ? '  ' + line : line))
      .join('\n')}
    </div>`,
    members: INVOICES_MEMBER,
  });
}

/**
 * Coluna de ações por linha.
 *
 * Duas decisões que o desenho não mostra: o cabeçalho da coluna existe e é
 * apenas invisível — sem ele a coluna some para quem navega por cabeçalhos —, e
 * cada botão diz A QUAL registro pertence. Cinco botões chamados "Editar"
 * seriam cinco controles indistinguíveis na lista do leitor de tela, e o ícone
 * não nomeia nada: a diretiva já o marca como decorativo.
 */
export function tableRowActionsSource(): string {
  const header = `        <thead ndsTableHeader>
          <tr ndsTableRow>
            <th ndsTableHead>Fatura</th>
            <th ndsTableHead>Status</th>
            <th ndsTableHead class="nds-text-right">Valor</th>
            <!-- O cabeçalho da coluna de ações não é decorativo: sem ele a
                 coluna existe para quem vê e some para quem navega por
                 cabeçalhos. Quem sai da tela é o RÓTULO, num span. -->
            <th ndsTableHead><span class="nds-sr-only">Ações</span></th>
          </tr>
        </thead>`;
  const body = `        <tbody ndsTableBody>
          @for (invoice of invoices(); track invoice.id) {
            <tr ndsTableRow>
              <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
              <td ndsTableCell>
                <span ndsBadge [variant]="variantOf(invoice.status)">{{ invoice.status }}</span>
              </td>
              <td ndsTableCell class="nds-text-right">{{ invoice.amount }}</td>
              <td ndsTableCell class="nds-text-right">
                <button
                  ndsButton
                  variant="ghost"
                  size="icon-sm"
                  [attr.aria-label]="'Editar fatura ' + invoice.id"
                >
                  <svg ndsButtonIcon kind="pencil" class="nds-icon"></svg>
                </button>
              </td>
            </tr>
          }
        </tbody>`;

  return example({
    parts: BASE_PARTS,
    extras: [
      "import { NdsBadge } from '@/components/ui/badge';",
      "import { NdsButton, NdsButtonIcon } from '@/components/ui/button';",
    ],
    extraDirectives: ['NdsBadge', 'NdsButton', 'NdsButtonIcon'],
    angular: ['signal'],
    markup: shell([caption('Faturas recentes com ações'), header, body].join('\n')),
    members: [
      ...INVOICES_MEMBER,
      '',
      "  variantOf(status: string): 'success' | 'warning' | 'destructive' {",
      "    if (status === 'Pago') return 'success';",
      "    return status === 'Cancelado' ? 'destructive' : 'warning';",
      '  }',
    ],
  });
}

/**
 * Tabela larga demais para a caixa.
 *
 * O que o exemplo mostra é o que PROVOCA a rolagem — muitas colunas —, e não um
 * ajuste a fazer. A única entrada escrita é `regionLabel`, e ela é a outra
 * metade da regra: foco sem nome faz uma parada que o leitor de tela não sabe
 * anunciar. O nome é do CONTEÚDO, então o design system não tem como cravá-lo.
 */
export function tableHorizontalScrollSource(): string {
  const header = `        <thead ndsTableHeader>
          <tr ndsTableRow>
            <th ndsTableHead>Fatura</th>
            @for (month of months(); track month) {
              <th ndsTableHead>{{ month }}</th>
            }
          </tr>
        </thead>`;
  const body = `        <tbody ndsTableBody>
          @for (invoice of invoices(); track invoice.id) {
            <tr ndsTableRow>
              <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
              @for (month of months(); track month) {
                <td ndsTableCell class="nds-text-right">{{ invoice.amount }}</td>
              }
            </tr>
          }
        </tbody>`;

  return example({
    parts: BASE_PARTS,
    angular: ['signal'],
    markup: shell(
      [caption('Faturas por mês de competência'), header, body].join('\n'),
      'Faturas por mês de competência',
    ),
    members: [
      ...INVOICES_MEMBER,
      '',
      '  readonly months = signal(',
      "    ['2025', '2026'].flatMap((year) =>",
      "      ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map(",
      "        (month) => month + '/' + year,",
      '      ),',
      '    ),',
      '  );',
    ],
  });
}

/**
 * Linha expansível — duas `<tr>` irmãs por registro.
 *
 * As quatro decisões da forma:
 *
 * 1. `aria-expanded` no BOTÃO, nunca na `<tr>`. O `data-state` da linha já é da
 *    SELEÇÃO, e os dois estados coexistem. Quem faz a linha reagir ao controle
 *    é a folha compartilhada, por `tbody tr:has([aria-expanded="true"])`.
 * 2. A revelada é IRMÃ e fica SEMPRE no DOM, escondida por `hidden`: o `id`
 *    dela é o alvo do `aria-controls`, e alvo que some deixa o atributo
 *    apontando para nada.
 * 3. O nome acessível é do REGISTRO e não muda ao abrir. Trocar "Mostrar" por
 *    "Ocultar" diria a mesma coisa que o `aria-expanded` já diz.
 * 4. A ordem de foco sai do DOM: a linha revelada vem logo depois da de dados,
 *    então o conteúdo dela é o próximo ponto de tabulação, sem `tabindex`.
 */
export function tableExpandableRowsSource(): string {
  const header = `        <thead ndsTableHeader>
          <tr ndsTableRow>
            <!-- A coluna do disclosure vem primeiro e também tem cabeçalho: o
                 rótulo sai da tela num span, e não por classe no próprio th,
                 que desmontaria a grade. -->
            <th ndsTableHead><span class="nds-sr-only">Detalhes</span></th>
            <th ndsTableHead>Fatura</th>
            <th ndsTableHead>Status</th>
            <th ndsTableHead>Método</th>
            <th ndsTableHead class="nds-text-right">Valor</th>
          </tr>
        </thead>`;
  const body = `        <tbody ndsTableBody>
          @for (invoice of invoices(); track invoice.id) {
            <tr ndsTableRow [selected]="invoice.id === selectedId()">
              <td ndsTableCell>
                <button
                  ndsButton
                  variant="ghost"
                  size="icon-sm"
                  [attr.aria-expanded]="expanded().has(invoice.id)"
                  [attr.aria-controls]="detailId(invoice.id)"
                  [attr.aria-label]="'Detalhes da fatura ' + invoice.id"
                  (click)="toggle(invoice.id)"
                >
                  <svg ndsButtonIcon kind="chevron-down" class="nds-chevron"></svg>
                </button>
              </td>
              <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
              <td ndsTableCell>{{ invoice.status }}</td>
              <td ndsTableCell>{{ invoice.method }}</td>
              <td ndsTableCell class="nds-text-right">{{ invoice.amount }}</td>
            </tr>

            <!-- A linha revelada fica sempre no DOM e some por hidden: o alvo do
                 aria-controls nunca deixa de existir, e hidden tira da tela, da
                 árvore de acessibilidade e da tabulação de uma vez. -->
            <tr ndsTableRow [attr.id]="detailId(invoice.id)" [hidden]="!expanded().has(invoice.id)">
              <td ndsTableCell [attr.colspan]="columnCount()">
                <div class="nds-stack" data-spacing="sm">
                  <p class="nds-text-muted-foreground">
                    Emitida por {{ invoice.method }}, no valor de {{ invoice.amount }}.
                  </p>
                  <button
                    ndsButton
                    variant="outline"
                    size="sm"
                    [attr.aria-label]="'Baixar recibo da fatura ' + invoice.id"
                  >
                    Baixar recibo
                  </button>
                </div>
              </td>
            </tr>
          }
        </tbody>`;

  return example({
    parts: BASE_PARTS,
    extras: ["import { NdsButton, NdsButtonIcon } from '@/components/ui/button';"],
    extraDirectives: ['NdsButton', 'NdsButtonIcon'],
    angular: ['signal'],
    markup: shell([caption('Faturas recentes com detalhes'), header, body].join('\n')),
    members: [
      ...INVOICES_MEMBER,
      '',
      '  // Colunas de dado MAIS a do disclosure: a célula do detalhe atravessa',
      '  // a tabela inteira.',
      '  readonly columnCount = signal(5);',
      "  readonly selectedId = signal('#INV-002');",
      '  readonly expanded = signal<ReadonlySet<string>>(new Set());',
      '',
      '  // O id sai do REGISTRO, sem o "#": duas tabelas na mesma tela não podem',
      '  // repetir id, e "#" dentro dele quebraria qualquer seletor.',
      '  detailId(id: string): string {',
      "    return 'invoice-detail-' + id.replace('#', '');",
      '  }',
      '',
      '  toggle(id: string): void {',
      '    const next = new Set(this.expanded());',
      '    if (next.has(id)) next.delete(id);',
      '    else next.add(id);',
      '    this.expanded.set(next);',
      '  }',
    ],
  });
}

// ─── Estados ──────────────────────────────────────────────────────────────────

/**
 * Conjunto vazio.
 *
 * A estrutura NÃO é desmontada: cabeçalho e legenda continuam ali, porque quem
 * usa leitor de tela precisa saber que colunas voltarão a existir quando houver
 * dados. O `colspan` sai do tamanho da lista de colunas — escrito à mão, ele
 * deixaria a mensagem torta na próxima coluna acrescentada. A classe
 * `.nds-table-empty` é o que dá à mensagem o piso de altura, o centro e o tom
 * discreto de uma vez.
 */
export function tableEmptySource(): string {
  const header = `        <thead ndsTableHeader>
          <tr ndsTableRow>
            @for (column of columns(); track column) {
              <th ndsTableHead>{{ column }}</th>
            }
          </tr>
        </thead>`;
  const body = `        <tbody ndsTableBody>
          <tr ndsTableRow>
            <td ndsTableCell [attr.colspan]="columns().length" class="nds-table-empty">
              Nenhuma fatura encontrada.
            </td>
          </tr>
        </tbody>`;

  return example({
    parts: BASE_PARTS,
    angular: ['signal'],
    markup: shell([caption(), header, body].join('\n')),
    members: [
      "  readonly columns = signal(['Fatura', 'Status', 'Método', 'Valor']);",
    ],
  });
}

/**
 * Linha selecionada.
 *
 * O estado é da `<tr>`, e é ela que a folha compartilhada pinta — marcar a
 * célula não pintaria a linha. As duas formas convivem: a entrada `selected` da
 * diretiva e o atributo `data-state` escrito à mão.
 */
export function tableSelectedRowSource(): string {
  const body = `        <tbody ndsTableBody>
          @for (invoice of invoices(); track invoice.id) {
            <tr ndsTableRow [selected]="invoice.id === selectedId()">
              <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
              <td ndsTableCell>{{ invoice.status }}</td>
              <td ndsTableCell>{{ invoice.method }}</td>
              <td ndsTableCell class="nds-text-right">{{ invoice.amount }}</td>
            </tr>
          }
        </tbody>`;

  return example({
    parts: BASE_PARTS,
    angular: ['signal'],
    markup: shell([caption(), HEADER, body].join('\n')),
    members: [...INVOICES_MEMBER, '', "  readonly selectedId = signal('#INV-002');"],
  });
}

/**
 * Carregando.
 *
 * O par é sempre este: esqueleto `aria-hidden` dentro de uma região com nome e
 * `aria-busy`. Esqueleto anunciado seria ruído; região sem nome não seria
 * anunciada de jeito nenhum, e quem ouve teria só uma tabela vazia.
 *
 * A forma do esqueleto vem por atributo, nunca por altura cravada: assim a
 * linha mede o que vai medir quando o texto chegar, e cresce junto com a fonte
 * do navegador (WCAG 1.4.4).
 */
export function tableLoadingSource(): string {
  const header = `        <thead ndsTableHeader>
          <tr ndsTableRow>
            @for (column of columns(); track column) {
              <th ndsTableHead>{{ column }}</th>
            }
          </tr>
        </thead>`;
  const body = `        <tbody ndsTableBody>
          @for (row of rows(); track row) {
            <tr ndsTableRow>
              @for (column of columns(); track column) {
                <td ndsTableCell>
                  <div ndsSkeleton data-shape="text" data-width="3-4"></div>
                </td>
              }
            </tr>
          }
        </tbody>`;

  const inner = shell([caption(), header, body].join('\n'))
    .split('\n')
    .map((line) => (line ? '  ' + line : line))
    .join('\n');

  return example({
    parts: BASE_PARTS,
    extras: ["import { NdsSkeleton } from '@/components/ui/skeleton';"],
    extraDirectives: ['NdsSkeleton'],
    angular: ['signal'],
    markup: `    <!-- aria-busy na REGIÃO, não na célula: o esqueleto é aria-hidden, e sem
         o container quem usa leitor de tela ouve uma tabela vazia sem saber que
         os dados estão a caminho. -->
    <div role="status" aria-busy="true" aria-label="Carregando faturas">
${inner}
    </div>`,
    members: [
      "  readonly columns = signal(['Fatura', 'Status', 'Método', 'Valor']);",
      '  readonly rows = signal([1, 2, 3]);',
    ],
  });
}

// ─── Composições ──────────────────────────────────────────────────────────────

/**
 * Toolbar de filtros.
 *
 * O campo fica FORA da tabela e reduz o conjunto exibido; quando a busca não
 * acha nada, o estado vazio entra no lugar das linhas em vez de uma tabela
 * muda. `signal` e `computed`, e não um array mutado: o stack é zoneless, e sem
 * sinal a digitação não dispararia detecção nenhuma.
 */
export function tableFilterToolbarSource(): string {
  const body = `        <tbody ndsTableBody>
          @for (invoice of filtered(); track invoice.id) {
            <tr ndsTableRow>
              <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
              <td ndsTableCell>{{ invoice.status }}</td>
              <td ndsTableCell>{{ invoice.method }}</td>
              <td ndsTableCell class="nds-text-right">{{ invoice.amount }}</td>
            </tr>
          } @empty {
            <tr ndsTableRow>
              <td ndsTableCell colspan="4" class="nds-table-empty">
                Nenhuma fatura encontrada.
              </td>
            </tr>
          }
        </tbody>`;

  const inner = shell([caption('Faturas filtradas pela busca'), HEADER, body].join('\n'))
    .split('\n')
    .map((line) => (line ? '  ' + line : line))
    .join('\n');

  return example({
    parts: BASE_PARTS,
    extras: [
      "import { NdsInput } from '@/components/ui/input';",
      "import { NdsLabel } from '@/components/ui/label';",
    ],
    extraDirectives: ['NdsInput', 'NdsLabel'],
    angular: ['computed', 'signal'],
    markup: `    <div class="nds-stack" data-spacing="sm">
      <div class="nds-stack" data-spacing="xs">
        <label ndsLabel for="filter-invoices">Buscar fatura</label>
        <input
          ndsInput
          id="filter-invoices"
          type="search"
          placeholder="Fatura, status ou método"
          (input)="filter($event)"
        />
      </div>

${inner}
    </div>`,
    members: [
      ...INVOICES_MEMBER,
      '',
      "  readonly term = signal('');",
      '  readonly filtered = computed(() => {',
      '    const search = this.term().trim().toLowerCase();',
      '    if (!search) return this.invoices();',
      '    return this.invoices().filter((invoice) =>',
      "      (invoice.id + ' ' + invoice.status + ' ' + invoice.method)",
      '        .toLowerCase()',
      '        .includes(search),',
      '    );',
      '  });',
      '',
      '  filter(event: Event): void {',
      '    this.term.set((event.target as HTMLInputElement).value);',
      '  }',
    ],
  });
}

/**
 * Cabeçalhos ordenáveis.
 *
 * `aria-sort` mora na CÉLULA de cabeçalho, nunca no botão: quem carrega a
 * relação com a coluna é o `<th>`, e o botão é só o gatilho. Sem ele a ordem
 * existe apenas para quem enxerga a tabela.
 */
export function tableSortableHeadersSource(): string {
  const header = `        <thead ndsTableHeader>
          <tr ndsTableRow>
            <th ndsTableHead>Fatura</th>
            <th ndsTableHead>Status</th>
            <!-- aria-sort na CÉLULA de cabeçalho, não no botão: quem carrega a
                 relação com a coluna é o th. -->
            <th ndsTableHead [sort]="direction()">
              <button ndsButton variant="ghost" size="sm" (click)="toggleSort()">
                Valor
                <svg ndsButtonIcon kind="chevron-right" class="nds-icon"></svg>
              </button>
            </th>
          </tr>
        </thead>`;
  const body = `        <tbody ndsTableBody>
          @for (invoice of sorted(); track invoice.id) {
            <tr ndsTableRow>
              <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
              <td ndsTableCell>{{ invoice.status }}</td>
              <td ndsTableCell class="nds-text-right">{{ invoice.amount }}</td>
            </tr>
          }
        </tbody>`;

  return example({
    parts: BASE_PARTS,
    types: ['TableSortDirection'],
    extras: ["import { NdsButton, NdsButtonIcon } from '@/components/ui/button';"],
    extraDirectives: ['NdsButton', 'NdsButtonIcon'],
    angular: ['computed', 'signal'],
    markup: shell([caption('Faturas ordenadas por valor'), header, body].join('\n')),
    members: [
      ...INVOICES_MEMBER,
      '',
      "  readonly direction = signal<TableSortDirection>('ascending');",
      '  readonly sorted = computed(() => {',
      "    const sign = this.direction() === 'ascending' ? 1 : -1;",
      '    return [...this.invoices()].sort(',
      '      (a, b) => (this.amountOf(a.amount) - this.amountOf(b.amount)) * sign,',
      '    );',
      '  });',
      '',
      '  toggleSort(): void {',
      "    this.direction.update((d) => (d === 'ascending' ? 'descending' : 'ascending'));",
      '  }',
      '',
      '  // "R$ 250,00" para 250. Comparar as strings colocaria "R$ 50,00" depois',
      '  // de "R$ 450,00".',
      '  private amountOf(amount: string): number {',
      "    return Number(amount.replace(/[^\\d,]/g, '').replace(',', '.'));",
      '  }',
    ],
  });
}

/**
 * Seleção de linhas.
 *
 * Um checkbox por linha e um mestre no cabeçalho. A linha marcada recebe
 * `data-state="selected"` pela entrada `selected` da diretiva; o mestre fica
 * misto enquanto a seleção é parcial. Cada rótulo diz QUAL fatura ele marca:
 * "Selecionar" repetido cinco vezes é indistinguível na lista de controles.
 */
export function tableRowSelectionSource(): string {
  const header = `        <thead ndsTableHeader>
          <tr ndsTableRow>
            <th ndsTableHead>
              <button
                ndsCheckbox
                aria-label="Selecionar todas as faturas"
                [checked]="allSelected()"
                [indeterminate]="someSelected()"
                (checkedChange)="toggleAll($event)"
              ></button>
            </th>
            <th ndsTableHead>Fatura</th>
            <th ndsTableHead>Status</th>
            <th ndsTableHead class="nds-text-right">Valor</th>
          </tr>
        </thead>`;
  const body = `        <tbody ndsTableBody>
          @for (invoice of invoices(); track invoice.id) {
            <tr ndsTableRow [selected]="selected().has(invoice.id)">
              <td ndsTableCell>
                <button
                  ndsCheckbox
                  [attr.aria-label]="'Selecionar fatura ' + invoice.id"
                  [checked]="selected().has(invoice.id)"
                  (checkedChange)="toggle(invoice.id, $event)"
                ></button>
              </td>
              <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
              <td ndsTableCell>{{ invoice.status }}</td>
              <td ndsTableCell class="nds-text-right">{{ invoice.amount }}</td>
            </tr>
          }
        </tbody>`;

  return example({
    parts: BASE_PARTS,
    extras: ["import { NdsCheckbox } from '@/components/ui/checkbox';"],
    extraDirectives: ['NdsCheckbox'],
    angular: ['computed', 'signal'],
    markup: shell([caption('Faturas para operação em lote'), header, body].join('\n')),
    members: [
      ...INVOICES_MEMBER,
      '',
      '  readonly selected = signal<ReadonlySet<string>>(new Set());',
      '  readonly allSelected = computed(',
      '    () => this.selected().size === this.invoices().length,',
      '  );',
      '  readonly someSelected = computed(',
      '    () => this.selected().size > 0 && !this.allSelected(),',
      '  );',
      '',
      '  toggle(id: string, checked: boolean): void {',
      '    const next = new Set(this.selected());',
      '    if (checked) next.add(id);',
      '    else next.delete(id);',
      '    this.selected.set(next);',
      '  }',
      '',
      '  toggleAll(checked: boolean): void {',
      '    this.selected.set(',
      '      checked ? new Set(this.invoices().map((invoice) => invoice.id)) : new Set(),',
      '    );',
      '  }',
    ],
  });
}
