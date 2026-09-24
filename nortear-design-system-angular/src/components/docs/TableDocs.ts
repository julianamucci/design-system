import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  signal,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import {
  NdsTable,
  NdsTableBody,
  NdsTableCaption,
  NdsTableCell,
  NdsTableFooter,
  NdsTableHead,
  NdsTableHeader,
  NdsTableRow,
  NdsTableWrapper,
} from '@/components/ui/table';
import {
  NdsPagination,
  NdsPaginationContent,
  NdsPaginationItem,
  NdsPaginationLink,
  NdsPaginationPrevious,
  NdsPaginationNext,
  NdsPaginationEllipsis,
} from '@/components/ui/pagination';
import { NdsBadge, type BadgeVariant } from '@/components/ui/badge';
import { NdsButton, NdsButtonIcon } from '@/components/ui/button';
import { NdsCheckbox } from '@/components/ui/checkbox';
import { NdsInput } from '@/components/ui/input';
import uiTranslations from '@/i18n/ui.json';
import tableTranslations from '@shared/content/table/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsVariants,
  NdsDocsCompositions,
  NdsDocsStates,
  NdsDocsProps,
  NdsDocsTokens,
  NdsDocsAccessibility,
  NdsDocsRelated,
  NdsDocsNotes,
  NdsDocsAnalytics,
  NdsDocsTestes,
} from '@/components/docs/shared/sections';

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// Overrides só de descrição de propriedade — nunca de snippet `*Code`, que
// ficaria preso neste stack e invisível para o conteúdo compartilhado.
//
// As quatro chaves abaixo não existem no conteúdo compartilhado porque
// descrevem peças que só este stack tem: o wrapper explícito (uma diretiva de
// atributo não pode criar o próprio pai) e os inputs `selected` e `sort`, que
// nas outras stacks são atributos escritos à mão.
const { t, dict } = useTranslation(tableTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.items.className':
      'Classes extras vão no atributo class do próprio elemento — o Angular mescla com as do design system.',
    'props.items.children':
      'Conteúdo do subcomponente: células, linhas ou o texto da célula, escritos dentro do elemento.',
    'props.items.wrapper':
      'Container que rola na horizontal. É escrito por quem usa porque uma diretiva de atributo tem o elemento como host e não pode criar um pai.',
    'props.items.tabindex':
      'Aplicado automaticamente: região que rola precisa ser alcançável por teclado, senão as colunas fora da caixa só existem para quem usa mouse.',
    'props.items.selected':
      'Marca a linha como selecionada. O atributo escrito à mão continua valendo — os dois caminhos levam ao mesmo estado.',
    'props.items.sort':
      'Direção da ordenação da coluna. Sem valor, nenhuma ordenação é anunciada: coluna que não ordena não deve prometer que ordena.',
  },
  en: {
    'props.items.className':
      'Extra classes go on the class attribute of the element itself — Angular merges them with the design system ones.',
    'props.items.children':
      'Subcomponent content: cells, rows, or the cell text, written inside the element.',
    'props.items.wrapper':
      'Horizontally scrolling container. It is written by the consumer because an attribute directive has the element as its host and cannot create a parent.',
    'props.items.tabindex':
      'Applied automatically: a scrolling region must be reachable by keyboard, otherwise the columns outside the box exist only for mouse users.',
    'props.items.selected':
      'Marks the row as selected. The hand-written attribute still works — both paths lead to the same state.',
    'props.items.sort':
      'Sort direction of the column. With no value, no sorting is announced: a column that does not sort must not promise that it does.',
  },
  es: {
    'props.items.className':
      'Las clases extra van en el atributo class del propio elemento — Angular las combina con las del design system.',
    'props.items.children':
      'Contenido del subcomponente: celdas, filas o el texto de la celda, escritos dentro del elemento.',
    'props.items.wrapper':
      'Contenedor que se desplaza en horizontal. Lo escribe quien usa porque una directiva de atributo tiene el elemento como host y no puede crear un padre.',
    'props.items.tabindex':
      'Se aplica automáticamente: una región desplazable debe ser alcanzable por teclado, si no las columnas fuera de la caja solo existen para quien usa ratón.',
    'props.items.selected':
      'Marca la fila como seleccionada. El atributo escrito a mano sigue valiendo — los dos caminos llevan al mismo estado.',
    'props.items.sort':
      'Dirección de ordenación de la columna. Sin valor no se anuncia ninguna ordenación: una columna que no ordena no debe prometer que ordena.',
  },
});

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
  { labelKey: 'nav.overview', sections: [
    { id: 'demonstracao', labelKey: 'nav.demonstration' },
    { id: 'anatomia',     labelKey: 'nav.anatomy'       },
    { id: 'quando-usar',  labelKey: 'nav.usage'         },
    { id: 'do-dont',      labelKey: 'nav.doDont'        },
  ]},
  { labelKey: 'nav.techRef', sections: [
    { id: 'importacao',   labelKey: 'nav.import'       },
    { id: 'variantes',    labelKey: 'nav.variants'     },
    { id: 'composicoes',  labelKey: 'nav.compositions' },
    { id: 'estados',      labelKey: 'nav.states'       },
    { id: 'propriedades', labelKey: 'nav.props'        },
    { id: 'tokens',       labelKey: 'nav.tokens'       },
  ]},
  { labelKey: 'nav.context', sections: [
    { id: 'acessibilidade', labelKey: 'nav.accessibility' },
    { id: 'relacionados',   labelKey: 'nav.related'       },
    { id: 'notas',          labelKey: 'nav.notes'         },
  ]},
  { labelKey: 'nav.quality', sections: [
    { id: 'analytics', labelKey: 'nav.analytics' },
    { id: 'testes',    labelKey: 'nav.testes'    },
  ]},
];

// ─── Snippets ─────────────────────────────────────────────────────────────────
//
// Markup de template Angular, que é o que se copia. O import fica separado do
// uso: quem já tem a família importada só quer o trecho de baixo.

const IMPORT_CODE = `import {
  NdsTableWrapper, NdsTable, NdsTableCaption, NdsTableHeader,
  NdsTableBody, NdsTableFooter, NdsTableRow, NdsTableHead, NdsTableCell,
} from '@/components/ui/table';`;

const CODE_BASICA = `<div ndsTableWrapper>
  <table ndsTable>
    <caption ndsTableCaption>Lista de faturas recentes</caption>
    <thead ndsTableHeader>
      <tr ndsTableRow>
        <th ndsTableHead>Fatura</th>
        <th ndsTableHead>Status</th>
        <th ndsTableHead>Valor</th>
      </tr>
    </thead>
    <tbody ndsTableBody>
      @for (fatura of faturas(); track fatura.id) {
        <tr ndsTableRow>
          <td ndsTableCell>{{ fatura.id }}</td>
          <td ndsTableCell>{{ fatura.status }}</td>
          <td ndsTableCell class="nds-text-right">{{ fatura.valor }}</td>
        </tr>
      }
    </tbody>
  </table>
</div>`;

const CODE_WITH_FOOTER = `<tfoot ndsTableFooter>
  <tr ndsTableRow>
    <td ndsTableCell colspan="2">Total</td>
    <td ndsTableCell class="nds-text-right">R$ 1.250,00</td>
  </tr>
</tfoot>`;

const CODE_CAPTION_SR_ONLY = `<h2>Faturas recentes</h2>

<div ndsTableWrapper>
  <table ndsTable>
    <!-- Fora da tela, dentro do DOM: sem a legenda a tabela chega ao leitor
         de tela sem nome nenhum. -->
    <caption ndsTableCaption class="nds-sr-only">Lista de faturas recentes</caption>
    ...
  </table>
</div>`;

const CODE_ACTIONS = `<td ndsTableCell>
  <!-- O conteúdo visível é a reticência tipográfica (U+2026), UM caractere: os
       três pontos de "..." o leitor de tela soletra, e a quebra de linha pode
       partir no meio. Ícone de lápis aqui prometeria UMA ação ("Editar") onde o
       controle abre um MENU de ações.

       O nome acessível carrega o identificador da linha: "Ações" sozinho,
       repetido em toda linha, é indistinguível na lista de controles. -->
  <button
    ndsButton
    variant="ghost"
    size="sm"
    [attr.aria-label]="'Ações para fatura ' + fatura.id"
  >…</button>
</td>`;

const EMPTY_CODE = `<tbody ndsTableBody>
  @for (fatura of faturas(); track fatura.id) {
    <tr ndsTableRow>...</tr>
  } @empty {
    <tr ndsTableRow>
      <td ndsTableCell [attr.colspan]="colunas.length" class="nds-table-empty">
        Nenhuma fatura encontrada.
      </td>
    </tr>
  }
</tbody>`;

const CODE_EXPANDABLE = `<thead ndsTableHeader>
  <tr ndsTableRow>
    <!-- A coluna do disclosure vem primeiro e também tem cabeçalho: o rótulo
         sai da tela num span, e não por classe no próprio th, que desmontaria
         a grade. -->
    <th ndsTableHead><span class="nds-sr-only">Detalhes</span></th>
    <th ndsTableHead>Fatura</th>
    <th ndsTableHead>Status</th>
    <th ndsTableHead class="nds-text-right">Valor</th>
  </tr>
</thead>
<tbody ndsTableBody>
  @for (fatura of faturas(); track fatura.id) {
    <!-- aria-expanded no BOTÃO, nunca na <tr>: a linha já usa data-state para a
         SELEÇÃO, e os dois estados acontecem juntos. Quem faz a linha reagir ao
         controle é a folha, por tbody tr:has([aria-expanded="true"]). -->
    <tr ndsTableRow [selected]="marcadas().has(fatura.id)">
      <td ndsTableCell>
        <button
          ndsButton
          variant="ghost"
          size="icon-sm"
          [attr.aria-expanded]="abertas().has(fatura.id)"
          [attr.aria-controls]="idDoDetalhe(fatura.id)"
          [attr.aria-label]="'Detalhes da fatura ' + fatura.id"
          (click)="alternar(fatura.id)"
        >
          <svg ndsButtonIcon kind="chevron-down" class="nds-chevron"></svg>
        </button>
      </td>
      <td ndsTableCell class="nds-font-medium">{{ fatura.id }}</td>
      <td ndsTableCell>{{ fatura.status }}</td>
      <td ndsTableCell class="nds-text-right">{{ fatura.valor }}</td>
    </tr>

    <!-- A revelada fica sempre no DOM e some por hidden: o alvo do
         aria-controls nunca deixa de existir, e hidden tira da tela, da árvore
         de acessibilidade e da tabulação de uma vez. O colspan cobre as colunas
         de dado MAIS a do disclosure. -->
    <tr ndsTableRow [attr.id]="idDoDetalhe(fatura.id)" [hidden]="!abertas().has(fatura.id)">
      <td ndsTableCell colspan="4">
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-muted-foreground">{{ fatura.detalhe }}</p>
          <button
            ndsButton
            variant="outline"
            size="sm"
            [attr.aria-label]="'Baixar recibo da fatura ' + fatura.id"
          >
            Baixar recibo
          </button>
        </div>
      </td>
    </tr>
  }
</tbody>`;

const CODE_COMP_TOOLBAR = `<div class="nds-stack" data-spacing="sm">
  <!-- O campo se nomeia por aria-label espelhando o placeholder: o texto de
       dica já diz o que o campo faz, e um rótulo visível acima dele repetiria a
       mesma frase duas vezes na mesma caixa. -->
  <input
    ndsInput
    id="filtro"
    type="search"
    aria-label="Filtrar faturas"
    placeholder="Filtrar faturas"
    (input)="filtrar($event)"
  />

  <div ndsTableWrapper>
    <table ndsTable>...</table>
  </div>
</div>`;

const CODE_COMP_ORDENACAO = `<!-- aria-sort na CÉLULA de cabeçalho, não no botão: quem carrega a relação
     com a coluna é o th. O botão é só o gatilho. -->
<th ndsTableHead [sort]="direcao()">
  <button ndsButton variant="ghost" size="sm" (click)="alternar()">
    Valor
    <svg ndsButtonIcon kind="chevron-right" class="nds-icon"></svg>
  </button>
</th>`;

const CODE_COMP_PAGINATION = `<div class="nds-stack" data-spacing="md">
  <div ndsTableWrapper>
    <table ndsTable><!-- ... --></table>
  </div>

  <!-- Fora da tabela: a paginacao navega entre recortes dos dados. -->
  <nav ndsPagination label="Paginacao das faturas">
    <ul ndsPaginationContent>
      <li ndsPaginationItem>
        <a ndsPaginationPrevious href="?pagina=1" [disabled]="ehPrimeira()">Anterior</a>
      </li>
      <li ndsPaginationItem>
        <a ndsPaginationLink href="?pagina=1" [isActive]="true">1</a>
      </li>
      <li ndsPaginationItem>
        <span ndsPaginationEllipsis label="Mais paginas"></span>
      </li>
      <li ndsPaginationItem>
        <a ndsPaginationNext href="?pagina=2">Proxima</a>
      </li>
    </ul>
  </nav>
</div>`;

const CODE_COMP_SELECTION = `<tr ndsTableRow [selected]="selecionadas().has(fatura.id)">
  <td ndsTableCell>
    <button
      ndsCheckbox
      [attr.aria-label]="'Selecionar fatura ' + fatura.id"
      [checked]="selecionadas().has(fatura.id)"
      (checkedChange)="alternar(fatura.id, $event)"
    ></button>
  </td>
  ...
</tr>`;

const INTERFACE_CODE = `// A família inteira é de DIRETIVA de atributo: nenhum subcomponente tem markup
// próprio, então o DOM sai igual ao HTML semântico que você já escreveria.

@Directive({ selector: 'div[ndsTableWrapper]' })   // rola na horizontal, tabindex="0"
@Directive({ selector: 'table[ndsTable]' })
@Directive({ selector: 'thead[ndsTableHeader]' })
@Directive({ selector: 'tbody[ndsTableBody]' })
@Directive({ selector: 'tfoot[ndsTableFooter]' })
@Directive({ selector: 'caption[ndsTableCaption]' })
@Directive({ selector: 'td[ndsTableCell]' })

@Directive({ selector: 'tr[ndsTableRow]' })
export class NdsTableRow {
  readonly selected = input(false, { transform: booleanAttribute });  // data-state="selected"
}

@Directive({ selector: 'th[ndsTableHead]' })
export class NdsTableHead {
  readonly scope = input<'col' | 'row' | 'colgroup' | 'rowgroup'>('col');
  readonly sort = input<TableSortDirection | undefined>(undefined);   // aria-sort
}

// colspan, rowspan, lang e class são atributos nativos — não viram input.`;

const TOKENS_CSS = `/* O Table não declara variáveis próprias: ele consome os tokens globais.
   Personalizar é redefinir o token no tema, e a tabela acompanha. */
.meu-tema {
  --border: 220 13% 91%;
  --muted: 220 14% 96%;
  --muted-foreground: 220 9% 46%;
}`;

// ─── Dados de exemplo ─────────────────────────────────────────────────────────
//
// O mapeamento status → variante do badge é o mesmo das outras stacks. Os
// RÓTULOS saem do conteúdo compartilhado, e o caminho de cada chave é escrito
// POR EXTENSO na chamada — ver a nota em `linhasDemo`.

const VARIANTS_DEMO: BadgeVariant[] = [
  'success',
  'warning',
  'destructive',
  'success',
  'warning',
];

@Component({
  selector: 'nds-table-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsPagination, NdsPaginationContent, NdsPaginationItem, NdsPaginationLink,
    NdsPaginationPrevious, NdsPaginationNext, NdsPaginationEllipsis,
    NdsTableWrapper, NdsTable, NdsTableCaption, NdsTableHeader, NdsTableBody,
    NdsTableFooter, NdsTableRow, NdsTableHead, NdsTableCell,
    NdsBadge, NdsButton, NdsButtonIcon, NdsCheckbox, NdsInput,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants, NdsDocsCompositions,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- ── Previews do Do & Don't ───────────────────────────────────────────
         Os previews não usam main nem heading: a docs page já está dentro de
         um main, e marco dentro de marco é landmark-main-is-top-level no axe. -->
    <!-- Par 1 — a LEGENDA, e só ela: duas colunas (fatura e valor) e UMA linha,
         idênticas dos dois lados, para que o que muda de um para o outro seja
         uma coisa só. O par fica menor do que a demonstração de propósito —
         três linhas de dado só afastariam o olho do que muda.

         O scope NÃO entra no par: ndsTableHead já o emite por padrão, nas
         cinco stacks, então o dont renderizaria scope="col" de qualquer
         jeito e o contraste seria falso. Forçá-lo escrevendo o atributo vazio
         ensinaria a desarmar um default seguro. -->
    <ng-template #tplDoDont1Do>
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption>{{ t('demonstration.labels.caption') }}</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>{{ t('demonstration.labels.invoice') }}</th>
              <th ndsTableHead>{{ t('demonstration.labels.amount') }}</th>
            </tr>
          </thead>
          <tbody ndsTableBody>
            <tr ndsTableRow>
              <td ndsTableCell class="nds-font-medium">{{ t('demonstration.labels.inv001') }}</td>
              <td ndsTableCell>{{ t('demonstration.labels.amount001') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <!-- Sem caption: a mesma grade, e ela muda para quem não a enxerga — o
           leitor de tela anuncia uma tabela sem dizer do que ela trata. -->
      <div ndsTableWrapper>
        <table ndsTable>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>{{ t('demonstration.labels.invoice') }}</th>
              <th ndsTableHead>{{ t('demonstration.labels.amount') }}</th>
            </tr>
          </thead>
          <tbody ndsTableBody>
            <tr ndsTableRow>
              <td ndsTableCell class="nds-font-medium">{{ t('demonstration.labels.inv001') }}</td>
              <td ndsTableCell>{{ t('demonstration.labels.amount001') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-template>
    <!-- Par 2 — o estado vazio. Uma coluna só, legenda nos DOIS lados: o que
         muda de um para o outro é a linha que diz que não há nada, não a
         legenda. -->
    <ng-template #tplDoDont2Do>
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption>{{ t('demonstration.labels.caption') }}</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>{{ t('demonstration.labels.invoice') }}</th>
            </tr>
          </thead>
          <tbody ndsTableBody>
            <tr ndsTableRow>
              <td ndsTableCell colspan="1" class="nds-table-empty">
                {{ t('demonstration.labels.emptyState') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption>{{ t('demonstration.labels.caption') }}</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>{{ t('demonstration.labels.invoice') }}</th>
            </tr>
          </thead>
          <tbody ndsTableBody></tbody>
        </table>
      </div>
    </ng-template>

    <!-- ── Previews das variantes ─────────────────────────────────────────── -->
    <ng-template #tplVarBasica>
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption>{{ t('demonstration.labels.caption') }}</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>{{ t('demonstration.labels.invoice') }}</th>
              <th ndsTableHead>{{ t('demonstration.labels.status') }}</th>
              <th ndsTableHead>{{ t('demonstration.labels.amount') }}</th>
            </tr>
          </thead>
          <tbody ndsTableBody>
            @for (line of linhasCurtas(); track line.key) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ line.id }}</td>
                <td ndsTableCell>{{ line.status }}</td>
                <td ndsTableCell class="nds-text-right">{{ line.value }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </ng-template>

    <ng-template #tplVarFooter>
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption class="nds-sr-only">{{ t('demonstration.labels.caption') }}</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>{{ t('demonstration.labels.invoice') }}</th>
              <th ndsTableHead>{{ t('demonstration.labels.status') }}</th>
              <th ndsTableHead>{{ t('demonstration.labels.amount') }}</th>
            </tr>
          </thead>
          <!-- As CINCO, e nao as tres curtas: o total do rodape e a soma
               das cinco faturas. Com tres na tela o leitor via um total que
               nao fecha com o que estava acima dele. -->
          <tbody ndsTableBody>
            @for (line of linhasDemo(); track line.key) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ line.id }}</td>
                <td ndsTableCell>{{ line.status }}</td>
                <td ndsTableCell class="nds-text-right">{{ line.value }}</td>
              </tr>
            }
          </tbody>
          <tfoot ndsTableFooter>
            <tr ndsTableRow>
              <td ndsTableCell colspan="2">{{ t('demonstration.labels.total') }}</td>
              <td ndsTableCell class="nds-text-right">{{ t('demonstration.labels.totalAmount') }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </ng-template>

    <ng-template #tplVarCaptionSrOnly>
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption class="nds-sr-only">{{ t('demonstration.labels.caption') }}</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>{{ t('demonstration.labels.invoice') }}</th>
              <th ndsTableHead>{{ t('demonstration.labels.method') }}</th>
            </tr>
          </thead>
          <tbody ndsTableBody>
            @for (line of linhasCurtas(); track line.key) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ line.id }}</td>
                <td ndsTableCell>{{ line.metodo }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </ng-template>

    <ng-template #tplVarAcoes>
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption class="nds-sr-only">{{ t('demonstration.labels.caption') }}</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>{{ t('demonstration.labels.invoice') }}</th>
              <th ndsTableHead>{{ t('demonstration.labels.status') }}</th>
              <!-- O rótulo da coluna de ações é VISÍVEL: a coluna existe na
                   grade, e escondê-la do olho deixava o cabeçalho vazio
                   sobrando por cima de uma coluna que todo mundo vê. -->
              <th ndsTableHead>{{ t('demonstration.labels.actions') }}</th>
            </tr>
          </thead>
          <tbody ndsTableBody>
            @for (line of linhasCurtas(); track line.key) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ line.id }}</td>
                <td ndsTableCell>
                  <span ndsBadge [variant]="line.variant">{{ line.status }}</span>
                </td>
                <td ndsTableCell>
                  <!-- Reticência tipográfica (U+2026), UM caractere, e não um
                       ícone de lápis: o controle abre um MENU de ações, e o
                       lápis prometia "Editar" contradizendo o nome acessível ao
                       lado dele. -->
                  <button ndsButton variant="ghost" size="sm" [attr.aria-label]="line.acaoLabel">…</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </ng-template>

    <ng-template #tplVarEmpty>
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption class="nds-sr-only">{{ t('demonstration.labels.caption') }}</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              @for (column of colunasCurtas(); track column) {
                <th ndsTableHead>{{ column }}</th>
              }
            </tr>
          </thead>
          <tbody ndsTableBody>
            <tr ndsTableRow>
              <!-- colspan derivado do cabeçalho: número escrito à mão deixaria a
                   mensagem torta assim que uma coluna entrasse. -->
              <td
                ndsTableCell
                [attr.colspan]="colunasCurtas().length"
                class="nds-table-empty"
              >
                {{ t('demonstration.labels.emptyState') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-template>

    <!-- Linha expansível — a forma sai da story WithExpandableRows, em escala
         menor. Quatro contratos, e a prévia mantém os quatro:

         1. aria-expanded mora no BOTÃO, nunca na <tr>: a linha já usa
            data-state para a SELEÇÃO, e os dois estados acontecem juntos.
            Quem faz a linha reagir é a folha compartilhada, por
            tbody tr:has([aria-expanded="true"]).
         2. A revelada é IRMÃ, sempre no DOM, escondida por hidden — o id
            dela é alvo do aria-controls, e alvo que some deixa o atributo
            apontando para nada.
         3. O nome acessível é o do REGISTRO e não muda ao alternar: quem
            anuncia o estado é o aria-expanded.
         4. A ordem de foco sai do DOM: a revelada vem logo depois da linha de
            dados, então o botão dentro dela é o próximo ponto de tabulação
            depois do disclosure, sem tabindex nenhum.

         A segunda linha nasce MARCADA: aberta e selecionada ao mesmo tempo é o
         caso que o :not([data-state="selected"]) da folha protege. -->
    <ng-template #tplVarExpansivel>
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption class="nds-sr-only">{{ t('demonstration.labels.caption') }}</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <!-- A coluna do disclosure vem primeiro e também tem cabeçalho: o
                   rótulo sai da tela num span, e não por classe no próprio th,
                   que desmontaria a grade. -->
              <th ndsTableHead><span class="nds-sr-only">{{ t('demonstration.labels.detailsColumn') }}</span></th>
              <th ndsTableHead>{{ t('demonstration.labels.invoice') }}</th>
              <th ndsTableHead>{{ t('demonstration.labels.status') }}</th>
              <th ndsTableHead class="nds-text-right">{{ t('demonstration.labels.amount') }}</th>
            </tr>
          </thead>
          <tbody ndsTableBody>
            @for (line of linhasCurtas(); track line.key) {
              <tr ndsTableRow [selected]="line.key === selectedPreviewKey">
                <td ndsTableCell>
                  <button
                    ndsButton
                    variant="ghost"
                    size="icon-sm"
                    [attr.aria-expanded]="expandidas().has(line.key)"
                    [attr.aria-controls]="detailId(line.key)"
                    [attr.aria-label]="line.detalhesLabel"
                    (click)="toggleExpansion(line.key)"
                  >
                    <svg ndsButtonIcon kind="chevron-down" class="nds-chevron"></svg>
                  </button>
                </td>
                <td ndsTableCell class="nds-font-medium">{{ line.id }}</td>
                <td ndsTableCell>{{ line.status }}</td>
                <td ndsTableCell class="nds-text-right">{{ line.value }}</td>
              </tr>

              <tr
                ndsTableRow
                [attr.id]="detailId(line.key)"
                [hidden]="!expandidas().has(line.key)"
              >
                <!-- Três colunas de dado mais a do disclosure. -->
                <td ndsTableCell colspan="4">
                  <div class="nds-stack" data-spacing="sm">
                    <p class="nds-text-muted-foreground">{{ t('demonstration.labels.detailText') }}</p>
                    <button ndsButton variant="outline" size="sm" [attr.aria-label]="line.reciboLabel">
                      {{ t('demonstration.labels.receipt') }}
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </ng-template>

    <!-- ── Previews das composições ───────────────────────────────────────── -->
    <ng-template #tplCompToolbar>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <!-- O campo se nomeia por aria-label espelhando o placeholder, e as
             duas saem da MESMA chave: o texto de dica já diz o que o campo faz,
             e um rótulo visível acima dele repetiria a frase na mesma caixa. O
             rótulo que estava aqui dizia "Fatura" — o nome da COLUNA, não o do
             campo. -->
        <input
          ndsInput
          id="docs-table-filtro"
          type="search"
          [attr.aria-label]="t('demonstration.labels.filterLabel')"
          [attr.placeholder]="t('demonstration.labels.filterLabel')"
          [value]="termo()"
          (input)="filter($event)"
        />
        <div ndsTableWrapper>
          <table ndsTable>
            <caption ndsTableCaption class="nds-sr-only">{{ t('demonstration.labels.caption') }}</caption>
            <thead ndsTableHeader>
              <tr ndsTableRow>
                <th ndsTableHead>{{ t('demonstration.labels.invoice') }}</th>
                <th ndsTableHead>{{ t('demonstration.labels.method') }}</th>
              </tr>
            </thead>
            <tbody ndsTableBody>
              @for (line of linhasFiltradas(); track line.key) {
                <tr ndsTableRow>
                  <td ndsTableCell class="nds-font-medium">{{ line.id }}</td>
                  <td ndsTableCell>{{ line.metodo }}</td>
                </tr>
              } @empty {
                <tr ndsTableRow>
                  <td ndsTableCell colspan="2" class="nds-table-empty">
                    {{ t('demonstration.labels.emptyState') }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </ng-template>

    <ng-template #tplCompOrdenacao>
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption class="nds-sr-only">{{ t('demonstration.labels.caption') }}</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>{{ t('demonstration.labels.invoice') }}</th>
              <th ndsTableHead [sort]="direction()">
                <button ndsButton variant="ghost" size="sm" (click)="toggleSort()">
                  {{ t('demonstration.labels.amount') }}
                  <svg ndsButtonIcon kind="chevron-right" class="nds-icon"></svg>
                </button>
              </th>
            </tr>
          </thead>
          <tbody ndsTableBody>
            @for (line of linhasOrdenadas(); track line.key) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ line.id }}</td>
                <td ndsTableCell class="nds-text-right">{{ line.value }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </ng-template>

    <ng-template #tplCompPaginacao>
      <div class="nds-stack nds-w-full" data-spacing="md">
        <div ndsTableWrapper>
          <table ndsTable>
            <caption ndsTableCaption class="nds-sr-only">{{ t('demonstration.labels.caption') }}</caption>
            <thead ndsTableHeader>
              <tr ndsTableRow>
                <th ndsTableHead>{{ t('demonstration.labels.invoice') }}</th>
                <th ndsTableHead>{{ t('demonstration.labels.status') }}</th>
              </tr>
            </thead>
            <tbody ndsTableBody>
              @for (line of linhasCurtas(); track line.key) {
                <tr ndsTableRow>
                  <td ndsTableCell class="nds-font-medium">{{ line.id }}</td>
                  <td ndsTableCell>{{ line.status }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- A paginacao fica FORA da tabela, como o conteudo descreve: ela
             navega entre recortes dos dados, nao faz parte da grade. -->
        <nav ndsPagination label="Paginacao das faturas">
          <ul ndsPaginationContent>
            <li ndsPaginationItem>
              <a ndsPaginationPrevious href="#pag-1" [disabled]="true">Anterior</a>
            </li>
            <li ndsPaginationItem>
              <a ndsPaginationLink href="#pag-1" [isActive]="true">1</a>
            </li>
            <li ndsPaginationItem>
              <a ndsPaginationLink href="#pag-2">2</a>
            </li>
            <li ndsPaginationItem>
              <span ndsPaginationEllipsis label="Mais paginas"></span>
            </li>
            <li ndsPaginationItem>
              <a ndsPaginationNext href="#pag-2">Proxima</a>
            </li>
          </ul>
        </nav>
      </div>
    </ng-template>

    <ng-template #tplCompSelecao>
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption class="nds-sr-only">{{ t('demonstration.labels.caption') }}</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>
                <button
                  ndsCheckbox
                  [attr.aria-label]="selectAllLabel()"
                  [checked]="todasSelecionadas()"
                  [indeterminate]="algumasSelecionadas()"
                  (checkedChange)="toggleAll($event)"
                ></button>
              </th>
              <th ndsTableHead>{{ t('demonstration.labels.invoice') }}</th>
              <th ndsTableHead>{{ t('demonstration.labels.status') }}</th>
            </tr>
          </thead>
          <tbody ndsTableBody>
            @for (line of linhasCurtas(); track line.key) {
              <tr ndsTableRow [selected]="selecionadas().has(line.key)">
                <td ndsTableCell>
                  <button
                    ndsCheckbox
                    [attr.aria-label]="line.selecaoLabel"
                    [checked]="selecionadas().has(line.key)"
                    (checkedChange)="toggleSelection(line.key, $event)"
                  ></button>
                </td>
                <td ndsTableCell class="nds-font-medium">{{ line.id }}</td>
                <td ndsTableCell>{{ line.status }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="table"
    >
      <div docsHeader>
        <nds-docs-header
          [title]="t('title')"
          [description]="t('description')"
          [category]="t('category')"
          [type]="t('type')"
        />
      </div>

      <ng-container docsMain>
        <nds-docs-demonstration>
          <div ndsTableWrapper>
            <table ndsTable>
              <caption ndsTableCaption>{{ t('demonstration.labels.caption') }}</caption>
              <thead ndsTableHeader>
                <tr ndsTableRow>
                  <th ndsTableHead>{{ t('demonstration.labels.invoice') }}</th>
                  <th ndsTableHead>{{ t('demonstration.labels.status') }}</th>
                  <th ndsTableHead>{{ t('demonstration.labels.method') }}</th>
                  <th ndsTableHead>{{ t('demonstration.labels.amount') }}</th>
                  <th ndsTableHead>{{ t('demonstration.labels.actions') }}</th>
                </tr>
              </thead>
              <tbody ndsTableBody>
                @for (line of linhasDemo(); track line.key) {
                  <tr ndsTableRow>
                    <td ndsTableCell class="nds-font-medium">{{ line.id }}</td>
                    <td ndsTableCell>
                      <span ndsBadge [variant]="line.variant">{{ line.status }}</span>
                    </td>
                    <td ndsTableCell>{{ line.metodo }}</td>
                    <td ndsTableCell class="nds-text-right">{{ line.value }}</td>
                    <td ndsTableCell>
                      <button ndsButton variant="ghost" size="sm" [attr.aria-label]="line.acaoLabel">…</button>
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot ndsTableFooter>
                <tr ndsTableRow>
                  <td ndsTableCell colspan="3">{{ t('demonstration.labels.total') }}</td>
                  <td ndsTableCell class="nds-text-right">{{ t('demonstration.labels.totalAmount') }}</td>
                  <td ndsTableCell></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="t('anatomy.structureCode')"
          language="html"
        />

        <nds-docs-when-to-use
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [uxWriting]="uxWriting()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [pairs]="doDontPairs()" />

        <nds-docs-import
          [code]="importCode"
          componentSlug="table"
          language="ts"
        />

        <nds-docs-variants
          id="variantes"
          [items]="variantItems()"
          componentSlug="table"
          language="html"
        />

        <!-- nds-docs-compositions: é o NdsDocsVariants com a linha "Quando usar:"
             mesclada na descrição, e ele repassa o language. -->
        <nds-docs-compositions
          id="composicoes"
          [useWhenLabel]="useWhenLabel()"
          [items]="compositionItems()"
          componentSlug="table"
          language="html"
        />

        <nds-docs-states
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <nds-docs-props
          [tables]="propTables()"
          [interfaceCode]="interfaceCode"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityNotes]="t('props.extensibility')"
        />

        <nds-docs-tokens
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="tokensCss"
        />

        <nds-docs-accessibility
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="tNav('common.keyboardNav')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [items]="relatedItems()"
          componentSlug="table"
        />

        <nds-docs-notes [items]="noteItems()" componentSlug="table" />

        <nds-docs-analytics
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

        <nds-docs-testes
          [functional]="testesFunctional()"
          [accessibility]="testesAccessibility()"
          [visual]="testesVisual()"
        />
      </ng-container>
    </nds-docs-page-layout>
  `,
})
export class NdsTableDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly importCode = IMPORT_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly tokensCss = TOKENS_CSS;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarBasica = viewChild.required<TemplateRef<unknown>>('tplVarBasica');
  private readonly tplVarFooter = viewChild.required<TemplateRef<unknown>>('tplVarFooter');
  private readonly tplVarCaptionSrOnly = viewChild.required<TemplateRef<unknown>>('tplVarCaptionSrOnly');
  private readonly tplVarAcoes = viewChild.required<TemplateRef<unknown>>('tplVarAcoes');
  private readonly tplVarEmpty = viewChild.required<TemplateRef<unknown>>('tplVarEmpty');
  private readonly tplVarExpansivel = viewChild.required<TemplateRef<unknown>>('tplVarExpansivel');
  private readonly tplCompToolbar = viewChild.required<TemplateRef<unknown>>('tplCompToolbar');
  private readonly tplCompOrdenacao = viewChild.required<TemplateRef<unknown>>('tplCompOrdenacao');
  private readonly tplCompPaginacao = viewChild.required<TemplateRef<unknown>>('tplCompPaginacao');
  private readonly tplCompSelecao = viewChild.required<TemplateRef<unknown>>('tplCompSelecao');

  // ─── Dados dos exemplos ─────────────────────────────────────────────────────

  /**
   * As cinco faturas da demonstração, já traduzidas.
   *
   * Cada caminho é escrito POR EXTENSO, e nunca montado por interpolação
   * (`demonstration.labels.${chave}`). Chave montada em tempo de execução some
   * das buscas de quem procura pelo rótulo e some da varredura de conteúdo: por
   * ela, esta página declarava usar 10 das 26 chaves da demonstração enquanto
   * as outras usavam 26 — cinco demonstrações diferentes sob o mesmo título.
   *
   * Cinco chaves são idênticas nos três idiomas porque são número de fatura e
   * valor em reais. É esperado, não redundância.
   */
  protected readonly linhasDemo = computed(() => {
    dict();
    const lines = [
      {
        key: '001',
        id: t('demonstration.labels.inv001'),
        status: t('demonstration.labels.paid'),
        metodo: t('demonstration.labels.creditCard'),
        value: t('demonstration.labels.amount001'),
      },
      {
        key: '002',
        id: t('demonstration.labels.inv002'),
        status: t('demonstration.labels.pending'),
        metodo: t('demonstration.labels.bankTransfer'),
        value: t('demonstration.labels.amount002'),
      },
      {
        key: '003',
        id: t('demonstration.labels.inv003'),
        status: t('demonstration.labels.canceled'),
        metodo: t('demonstration.labels.pix'),
        value: t('demonstration.labels.amount003'),
      },
      {
        key: '004',
        id: t('demonstration.labels.inv004'),
        status: t('demonstration.labels.paid'),
        metodo: t('demonstration.labels.creditCard'),
        value: t('demonstration.labels.amount004'),
      },
      {
        key: '005',
        id: t('demonstration.labels.inv005'),
        status: t('demonstration.labels.pending'),
        metodo: t('demonstration.labels.pix'),
        value: t('demonstration.labels.amount005'),
      },
    ];

    return lines.map((line, i) => ({
      ...line,
      variant: VARIANTS_DEMO[i],
      // O rótulo da ação carrega o identificador da linha: "Ações" sozinho, cinco
      // vezes, é indistinguível na lista de controles do leitor de tela.
      acaoLabel: `${t('demonstration.labels.actionsLabel')} ${line.id}`,
      selecaoLabel: `${t('demonstration.labels.selectRow')} ${line.id}`,
      // O nome acessível do disclosure é o do REGISTRO e não muda ao alternar:
      // quem anuncia aberto ou fechado é o `aria-expanded`. Trocar "Mostrar"
      // por "Ocultar" diria a mesma coisa duas vezes.
      detalhesLabel: `${t('demonstration.labels.detailsLabel')} ${line.id}`,
      reciboLabel: `${t('demonstration.labels.receiptLabel')} ${line.id}`,
    }));
  });

  /** Três linhas para os previews dos cards, que são estreitos. */
  protected readonly linhasCurtas = computed(() => this.linhasDemo().slice(0, 3));

  // ── Variante "linha expansível" ────────────────────────────────────────────
  //
  // Signal, e não um Set mutado: o stack é zoneless, e sem sinal a abertura não
  // dispararia detecção nenhuma.
  protected readonly expandidas = signal<ReadonlySet<string>>(new Set());

  /**
   * A linha que nasce MARCADA na prévia de linha expansível.
   *
   * Aberta e selecionada ao mesmo tempo é o caso que o
   * `:not([data-state="selected"])` da folha compartilhada protege — sem ele a
   * regra do disclosure é a última do arquivo e rebaixaria a linha marcada ao
   * tom claro do hover. Dar de ver as duas coisas juntas é o que a prévia
   * acrescenta à story.
   */
  protected readonly selectedPreviewKey = '002';

  /** Id da linha revelada. Sem o "#" do identificador da fatura, que quebraria
   * qualquer seletor — e por isso a chave estável da linha, não o rótulo. */
  protected detailId(key: string): string {
    return `docs-table-row-detail-${key}`;
  }

  protected toggleExpansion(key: string): void {
    const next = new Set(this.expandidas());
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this.expandidas.set(next);
  }

  protected readonly colunasCurtas = computed(() => {
    dict();
    return [
      t('demonstration.labels.invoice'),
      t('demonstration.labels.status'),
      t('demonstration.labels.amount'),
    ];
  });

  // Composição "toolbar de filtros": o filtro é de verdade, então o preview
  // mostra também o empty state quando a busca não acha nada.
  protected readonly termo = signal('');
  protected readonly linhasFiltradas = computed(() => {
    const search = this.termo().trim().toLowerCase();
    const lines = this.linhasDemo();
    if (!search) return lines;
    return lines.filter((l) => `${l.id} ${l.metodo}`.toLowerCase().includes(search));
  });

  protected filter(evento: Event): void {
    this.termo.set((evento.target as HTMLInputElement).value);
  }

  // Composição "cabeçalhos ordenáveis".
  protected readonly direction = signal<'ascending' | 'descending'>('ascending');
  protected readonly linhasOrdenadas = computed(() => {
    const sinal = this.direction() === 'ascending' ? 1 : -1;
    return [...this.linhasCurtas()].sort(
      (a, b) => (valueNumerico(a.value) - valueNumerico(b.value)) * sinal,
    );
  });

  protected toggleSort(): void {
    this.direction.update((d) => (d === 'ascending' ? 'descending' : 'ascending'));
  }

  // Composição "seleção de linhas".
  protected readonly selecionadas = signal<ReadonlySet<string>>(new Set());
  protected readonly todasSelecionadas = computed(
    () => this.selecionadas().size === this.linhasCurtas().length,
  );
  protected readonly algumasSelecionadas = computed(
    () => this.selecionadas().size > 0 && !this.todasSelecionadas(),
  );
  protected readonly selectAllLabel = computed(() => {
    dict();
    return t('demonstration.labels.selectAll');
  });

  protected toggleSelection(key: string, checked: boolean): void {
    const next = new Set(this.selecionadas());
    if (checked) next.add(key);
    else next.delete(key);
    this.selecionadas.set(next);
  }

  protected toggleAll(checked: boolean): void {
    this.selecionadas.set(
      checked ? new Set(this.linhasCurtas().map((l) => l.key)) : new Set(),
    );
  }

  // ─── Seções ─────────────────────────────────────────────────────────────────

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => numberedFromDict(dict(), 'anatomy'));

  protected readonly guidelines = computed(() => {
    const d = dict();
    return {
      title: t('usage.guidelines.title'),
      items: numberedFromDict(d, 'usage.guidelines'),
    };
  });

  protected readonly scenarios = computed(() => {
    const d = dict();
    return {
      title: t('usage.scenarios.title'),
      cols: {
        scenario: t('usage.scenarios.cols.scenario'),
        use: t('usage.scenarios.cols.use'),
        alternative: t('usage.scenarios.cols.alternative'),
      },
      items: itemsFromDict(d, 'usage.scenarios', ['s', 'u', 'a']),
    };
  });

  protected readonly uxWriting = computed(() => {
    dict();
    return {
      title: t('usage.uxWriting.title'),
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: ['caption', 'head', 'emptyState', 'actionLabel'].map((key) => ({
        element: t(`usage.uxWriting.table.${key}.name`),
        rules: t(`usage.uxWriting.table.${key}.format`),
        do: t(`usage.uxWriting.table.${key}.good`),
        dont: t(`usage.uxWriting.table.${key}.bad`),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    const d = dict();
    return { title: t('usage.do.title'), items: numberedFromDict(d, 'usage.do') };
  });

  protected readonly usageDont = computed(() => {
    const d = dict();
    return { title: t('usage.dont.title'), items: numberedFromDict(d, 'usage.dont') };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    return [
      {
        doLabel: tNav('common.do'),
        dontLabel: tNav('common.dont'),
        doCaption: toPlainText(t('doDont.pair1.do')),
        dontCaption: toPlainText(t('doDont.pair1.dont')),
        doPreview: this.tplDoDont1Do(),
        dontPreview: this.tplDoDont1Dont(),
      },
      {
        doLabel: tNav('common.do'),
        dontLabel: tNav('common.dont'),
        doCaption: toPlainText(t('doDont.pair2.do')),
        dontCaption: toPlainText(t('doDont.pair2.dont')),
        doPreview: this.tplDoDont2Do(),
        dontPreview: this.tplDoDont2Dont(),
      },
    ];
  });

  protected readonly variantItems = computed(() => {
    dict();
    return [
      { key: 'basic',              code: CODE_BASICA,          tpl: this.tplVarBasica()          },
      { key: 'withFooter',         code: CODE_WITH_FOOTER,      tpl: this.tplVarFooter()          },
      { key: 'withSrOnlyCaption',  code: CODE_CAPTION_SR_ONLY, tpl: this.tplVarCaptionSrOnly()   },
      { key: 'withInlineActions',  code: CODE_ACTIONS,           tpl: this.tplVarAcoes()           },
      { key: 'withEmptyState',     code: EMPTY_CODE,           tpl: this.tplVarEmpty()           },
      { key: 'withExpandableRows', code: CODE_EXPANDABLE,      tpl: this.tplVarExpansivel()      },
    ].map(({ key, code, tpl }) => ({
      name: t(`variants.items.${key}.label`),
      description: t(`variants.items.${key}.description`),
      code,
      trackId: key,
      preview: tpl,
    }));
  });

  /** Rótulo da linha "Quando usar:" que o container mescla na descrição. */
  protected readonly useWhenLabel = computed(() => {
    dict();
    return tNav('common.useWhen');
  });

  protected readonly compositionItems = computed(() => {
    dict();
    return [
      { key: 'filterableToolbar', code: CODE_COMP_TOOLBAR,   tpl: this.tplCompToolbar()   },
      { key: 'sortableHeaders',   code: CODE_COMP_ORDENACAO, tpl: this.tplCompOrdenacao() },
      { key: 'selectableRows',    code: CODE_COMP_SELECTION,   tpl: this.tplCompSelecao()   },
      { key: 'withPagination',    code: CODE_COMP_PAGINATION, tpl: this.tplCompPaginacao() },
    ].map(({ key, code, tpl }) => ({
      name: t(`variants.compositions.${key}.name`),
      description: t(`variants.compositions.${key}.description`),
      useWhen: t(`variants.compositions.${key}.use`),
      code,
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly statesCols = computed(() => {
    dict();
    return {
      state: t('states.cols.state'),
      trigger: t('states.cols.trigger'),
      behavior: t('states.cols.behavior'),
    };
  });

  protected readonly stateItems = computed(() => {
    dict();
    return ['empty', 'selected', 'loading'].map((k) => ({
      label: t(`states.${k}.label`),
      trigger: toPlainText(t(`states.${k}.trigger`)),
      behavior: toPlainText(t(`states.${k}.behavior`)),
    }));
  });

  protected readonly propTables = computed(() => {
    dict();
    const cols = {
      prop: t('props.table.prop'),
      type: t('props.table.type'),
      default: t('props.table.default'),
      required: t('props.table.required'),
      description: t('props.table.description'),
    };
    const not = tNav('common.no');
    const className = {
      name: 'class',
      type: 'string',
      defaultValue: '—',
      required: not,
      description: toPlainText(t('props.items.className')),
    };
    const content = {
      name: '(conteúdo)',
      type: 'HTML',
      defaultValue: '—',
      required: not,
      description: toPlainText(t('props.items.children')),
    };

    return [
      {
        // Sem chave no conteúdo compartilhado: o wrapper explícito só existe
        // neste stack. As outras stacks o criam por dentro do componente.
        title: 'TableWrapper',
        cols,
        items: [
          { name: '(elemento)', type: 'div',    defaultValue: '—', required: not, description: toPlainText(t('props.items.wrapper')) },
          { name: 'tabindex',   type: '"0"',    defaultValue: '"0"', required: not, description: toPlainText(t('props.items.tabindex')) },
          className,
          content,
        ],
      },
      { title: t('props.tableTitle'),        cols, items: [className, content] },
      { title: t('props.tableHeaderTitle'),  cols, items: [className, content] },
      { title: t('props.tableBodyTitle'),    cols, items: [className, content] },
      { title: t('props.tableFooterTitle'),  cols, items: [className, content] },
      {
        title: t('props.tableRowTitle'),
        cols,
        items: [
          { name: 'selected',   type: 'boolean',    defaultValue: 'false', required: not, description: toPlainText(t('props.items.selected')) },
          { name: 'data-state', type: '"selected"', defaultValue: '—',     required: not, description: toPlainText(t('props.items.dataState')) },
          className,
          content,
        ],
      },
      {
        title: t('props.tableHeadTitle'),
        cols,
        items: [
          { name: 'scope', type: '"col" | "row" | "colgroup" | "rowgroup"', defaultValue: "'col'", required: not, description: toPlainText(t('props.items.scope')) },
          { name: 'sort',  type: 'TableSortDirection',                      defaultValue: '—',     required: not, description: toPlainText(t('props.items.sort')) },
          className,
          content,
        ],
      },
      {
        title: t('props.tableCellTitle'),
        cols,
        items: [
          { name: 'colspan', type: 'number', defaultValue: '—', required: not, description: toPlainText(t('props.items.colSpan')) },
          { name: 'rowspan', type: 'number', defaultValue: '—', required: not, description: toPlainText(t('props.items.rowSpan')) },
          className,
          content,
        ],
      },
      { title: t('props.tableCaptionTitle'), cols, items: [className, content] },
    ];
  });

  protected readonly tokensCols = computed(() => {
    dict();
    return {
      token: t('tokens.table.token'),
      value: t('tokens.table.part'),
      description: t('tokens.table.description'),
    };
  });

  protected readonly tokenItems = computed(() => {
    dict();
    // O token real, não a classe utilitária da era anterior: a folha
    // docs/shared/styles/nds/table.css consome estas custom properties.
    return [
      { token: '--border',              parte: 'TableHeader / TableBody / TableRow', k: 'borderB'          },
      { token: '--muted',               parte: 'TableFooter / TableRow (hover)',     k: 'bgMuted'          },
      { token: '--muted',               parte: 'TableRow[data-state="selected"]',    k: 'bgMutedSelected'  },
      { token: '--muted-foreground',    parte: 'TableCaption / empty state',         k: 'textMuted'        },
      { token: '--font-weight-medium',  parte: 'TableHead / TableFooter',            k: 'fontMedium'       },
      { token: '--spacing-10',          parte: 'TableHead',                          k: 'h10'              },
      { token: '--spacing-2',           parte: 'TableCell',                          k: 'p2'               },
      { token: 'caption-side',          parte: 'Table (caption)',                    k: 'captionBottom'    },
    ].map(({ token, parte, k }) => ({
      token,
      value: parte,
      description: toPlainText(t(`tokens.items.${k}`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    // Os itens de a11y deste componente vivem sob `accessibility.aria.*`, com
    // chaves nomeadas — não numeradas como em outros componentes.
    return ['scope', 'caption', 'ariaLabel', 'ariaSort', 'tabIndex'].map((k) =>
      t(`accessibility.aria.${k}`),
    );
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',   description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Enter', description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Space', description: toPlainText(t('accessibility.keyboard.space')) },
      { key: '—',     description: toPlainText(t('accessibility.keyboard.noKeyboard')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    // As chaves de `screenReader` variam por componente — aqui elas vivem sob
    // `accessibility`, com nomes próprios. Só os valores importam.
    const porLocale = tableTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    return Object.values(porLocale[locale]?.accessibility?.screenReader ?? {});
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'dataTable',    name: 'DataTable',    path: '?path=/docs/components-tables-datatable--docs'    },
      { key: 'badge',        name: 'Badge',        path: '?path=/docs/components-feedback-badge--docs'        },
      { key: 'skeleton',     name: 'Skeleton',     path: '?path=/docs/components-feedback-skeleton--docs'     },
      { key: 'avatar',       name: 'Avatar',       path: '?path=/docs/components-display-avatar--docs'       },
      { key: 'pagination',   name: 'Pagination',   path: '?path=/docs/components-navigation-pagination--docs'   },
      { key: 'dropdownMenu', name: 'DropdownMenu', path: '?path=/docs/components-navigation-dropdownmenu--docs' },
    ].map(({ key, name, path }) => ({
      name: name,
      description: toPlainText(t(`related.${key}`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    const d = dict();
    return numberedFromDict(d, 'notes', 'tip').map((content) => ({ title: '', content }));
  });

  protected readonly analyticsCols = computed(() => {
    dict();
    return {
      event: t('analytics.table.event'),
      trigger: toPlainText(t('analytics.table.trigger')),
      payload: t('analytics.table.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    // Table é passivo: não dispara evento próprio. O que sai daqui é o tracking
    // da própria docs page.
    return ['pageView', 'sectionViewed', 'langSwitch'].map((k) => ({
      event: t(`analytics.table.${k}`),
      trigger: toPlainText(t(`analytics.table.${k}Trigger`)),
      payload: toPlainText(t(`analytics.table.${k}Payload`)),
    }));
  });

  protected readonly testesFunctional = computed(() => {
    const d = dict();
    return {
      title: t('testes.functional.title'),
      description: t('testes.functional.description'),
      cols: {
        action: tNav('common.userAction'),
        result: tNav('common.expectedResult'),
        priority: tNav('common.priority'),
      },
      items: itemsFromDict(d, 'testes.functional', ['action', 'result', 'priority']).map((r) => ({
        action: toPlainText(r.action),
        result: stripHtml(toPlainText(r.result)),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    const d = dict();
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: itemsFromDict(d, 'testes.accessibility', ['criterion', 'level', 'how']).map((r) => ({
        criterion: toPlainText(r.criterion),
        level: r.level,
        how: toPlainText(r.how),
      })),
    };
  });

  protected readonly testesVisual = computed(() => {
    const d = dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
      items: itemsFromDict(d, 'testes.visual', ['story', 'priority']).map((r) => ({
        story: toPlainText(r.story),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  private observer: { disconnect: () => void } | undefined;

  constructor() {
    effect((onCleanup) => {
      dict();
      const locale = getLocale();
      const cleanup = applySeo({
        title: t('seo.title'),
        description: t('seo.description'),
        locale,
        componentSlug: 'table',
      });
      track('docs_page_view', {
        component_name: 'table',
        locale,
        page_title: `${t('title')} · Design System`,
      });
      onCleanup(cleanup);
    });
  }

  ngAfterViewInit(): void {
    this.observer = createActiveSectionObserver(
      [...SECTION_IDS],
      (id) => document.getElementById(id),
      (id) => this.activeSection.set(id),
      (id) =>
        track('docs_section_viewed', {
          component_name: 'table',
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

/** "R$ 250,00" → 250. Ordenar as strings colocaria "R$ 50,00" depois de "R$ 450,00". */
function valueNumerico(value: string): number {
  return Number(value.replace(/[^\d,]/g, '').replace(',', '.'));
}

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

/**
 * Lista numerada (`base.item1`, `base.item2`…) lida do dicionário até acabar.
 *
 * Contar à mão é o defeito que aparece na tela: com um item a menos, a chave
 * crua sai escrita no lugar do texto; com um a mais, o item some da página.
 */
function numberedFromDict(
  d: Record<string, string>,
  base: string,
  prefixo = 'item',
): string[] {
  const items: string[] = [];
  for (let i = 1; ; i++) {
    const value = d[`${base}.${prefixo}${i}`];
    if (value === undefined) break;
    items.push(value);
  }
  return items;
}

function itemsFromDict<K extends string>(
  d: Record<string, string>,
  base: string,
  fields: readonly K[],
): Record<K, string>[] {
  const rows: Record<K, string>[] = [];
  for (let i = 1; ; i++) {
    if (d[`${base}.item${i}.${fields[0]}`] === undefined) break;
    const row = {} as Record<K, string>;
    for (const f of fields) row[f] = d[`${base}.item${i}.${f}`] ?? '';
    rows.push(row);
  }
  return rows;
}
