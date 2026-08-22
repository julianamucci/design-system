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
import { NdsLabel } from '@/components/ui/label';
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
    // O conteúdo compartilhado não tem rótulo de seleção — a composição
    // "seleção de linhas" está documentada em texto, mas os labels dos
    // checkboxes nunca foram escritos. Reportado; aqui ficam como override de
    // rótulo, que é exatamente para o que override serve.
    'demonstration.labels.selectRow': 'Selecionar fatura',
    'demonstration.labels.selectAll': 'Selecionar todas as faturas',
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
    'demonstration.labels.selectRow': 'Select invoice',
    'demonstration.labels.selectAll': 'Select all invoices',
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
    'demonstration.labels.selectRow': 'Seleccionar factura',
    'demonstration.labels.selectAll': 'Seleccionar todas las facturas',
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

const CODE_ACTIONS = `<td ndsTableCell class="nds-text-right">
  <button
    ndsButton
    variant="ghost"
    size="icon-sm"
    [attr.aria-label]="'Editar fatura ' + fatura.id"
  >
    <svg ndsButtonIcon kind="pencil" class="nds-icon"></svg>
  </button>
</td>`;

const EMPTY_CODE = `<tbody ndsTableBody>
  @for (fatura of faturas(); track fatura.id) {
    <tr ndsTableRow>...</tr>
  } @empty {
    <tr ndsTableRow>
      <td
        ndsTableCell
        [attr.colspan]="colunas.length"
        class="nds-text-center nds-text-muted-foreground"
      >
        Nenhuma fatura encontrada.
      </td>
    </tr>
  }
</tbody>`;

const CODE_COMP_TOOLBAR = `<div class="nds-stack" data-spacing="sm">
  <label ndsLabel for="filtro">Buscar fatura</label>
  <input ndsInput id="filtro" type="search" (input)="filtrar($event)" />

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
// As chaves vêm do conteúdo compartilhado; o mapeamento status → variante do
// badge é o mesmo do Vanilla.

const LINHAS_DEMO: {
  key: string;
  idKey: string;
  statusKey: string;
  metodoKey: string;
  valorKey: string;
  variant: BadgeVariant;
}[] = [
  { key: '001', idKey: 'inv001', statusKey: 'paid',     metodoKey: 'creditCard',   valorKey: 'amount001', variant: 'success'     },
  { key: '002', idKey: 'inv002', statusKey: 'pending',  metodoKey: 'bankTransfer', valorKey: 'amount002', variant: 'warning'     },
  { key: '003', idKey: 'inv003', statusKey: 'canceled', metodoKey: 'pix',          valorKey: 'amount003', variant: 'destructive' },
  { key: '004', idKey: 'inv004', statusKey: 'paid',     metodoKey: 'creditCard',   valorKey: 'amount004', variant: 'success'     },
  { key: '005', idKey: 'inv005', statusKey: 'pending',  metodoKey: 'pix',          valorKey: 'amount005', variant: 'warning'     },
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
    NdsBadge, NdsButton, NdsButtonIcon, NdsCheckbox, NdsInput, NdsLabel,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- ── Previews do Do & Don't ───────────────────────────────────────────
         Os previews não usam main nem heading: a docs page já está dentro de
         um main, e marco dentro de marco é landmark-main-is-top-level no axe. -->
    <ng-template #tplDoDont1Do>
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
            @for (linha of linhasCurtas(); track linha.key) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ linha.id }}</td>
                <td ndsTableCell>{{ linha.status }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <!-- Sem caption e sem scope: a mesma grade, muda para quem não a enxerga. -->
      <div class="nds-table-wrapper">
        <table class="nds-table">
          <thead>
            <tr>
              <th>{{ t('demonstration.labels.invoice') }}</th>
              <th>{{ t('demonstration.labels.status') }}</th>
            </tr>
          </thead>
          <tbody>
            @for (linha of linhasCurtas(); track linha.key) {
              <tr>
                <td>{{ linha.id }}</td>
                <td>{{ linha.status }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Do>
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
            <tr ndsTableRow>
              <td ndsTableCell colspan="2" class="nds-text-center nds-text-muted-foreground">
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
          <caption ndsTableCaption class="nds-sr-only">{{ t('demonstration.labels.caption') }}</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              <th ndsTableHead>{{ t('demonstration.labels.invoice') }}</th>
              <th ndsTableHead>{{ t('demonstration.labels.status') }}</th>
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
            @for (linha of linhasCurtas(); track linha.key) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ linha.id }}</td>
                <td ndsTableCell>{{ linha.status }}</td>
                <td ndsTableCell class="nds-text-right">{{ linha.valor }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </ng-template>

    <ng-template #tplVarRodape>
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
          <tbody ndsTableBody>
            @for (linha of linhasCurtas(); track linha.key) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ linha.id }}</td>
                <td ndsTableCell>{{ linha.status }}</td>
                <td ndsTableCell class="nds-text-right">{{ linha.valor }}</td>
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
            @for (linha of linhasCurtas(); track linha.key) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ linha.id }}</td>
                <td ndsTableCell>{{ linha.metodo }}</td>
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
              <th ndsTableHead>
                <span class="nds-sr-only">{{ t('demonstration.labels.actions') }}</span>
              </th>
            </tr>
          </thead>
          <tbody ndsTableBody>
            @for (linha of linhasCurtas(); track linha.key) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ linha.id }}</td>
                <td ndsTableCell>
                  <span ndsBadge [variant]="linha.variant">{{ linha.status }}</span>
                </td>
                <td ndsTableCell class="nds-text-right">
                  <button ndsButton variant="ghost" size="icon-sm" [attr.aria-label]="linha.acaoLabel">
                    <svg ndsButtonIcon kind="pencil" class="nds-icon"></svg>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </ng-template>

    <ng-template #tplVarVazio>
      <div ndsTableWrapper>
        <table ndsTable>
          <caption ndsTableCaption class="nds-sr-only">{{ t('demonstration.labels.caption') }}</caption>
          <thead ndsTableHeader>
            <tr ndsTableRow>
              @for (coluna of colunasCurtas(); track coluna) {
                <th ndsTableHead>{{ coluna }}</th>
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
                class="nds-text-center nds-text-muted-foreground"
              >
                {{ t('demonstration.labels.emptyState') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-template>

    <!-- ── Previews das composições ───────────────────────────────────────── -->
    <ng-template #tplCompToolbar>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <div class="nds-stack" data-spacing="xs">
          <label ndsLabel for="docs-table-filtro">{{ t('demonstration.labels.invoice') }}</label>
          <input
            ndsInput
            id="docs-table-filtro"
            type="search"
            [value]="termo()"
            (input)="filtrar($event)"
          />
        </div>
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
              @for (linha of linhasFiltradas(); track linha.key) {
                <tr ndsTableRow>
                  <td ndsTableCell class="nds-font-medium">{{ linha.id }}</td>
                  <td ndsTableCell>{{ linha.metodo }}</td>
                </tr>
              } @empty {
                <tr ndsTableRow>
                  <td ndsTableCell colspan="2" class="nds-text-center nds-text-muted-foreground">
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
              <th ndsTableHead [sort]="direcao()">
                <button ndsButton variant="ghost" size="sm" (click)="alternarOrdem()">
                  {{ t('demonstration.labels.amount') }}
                  <svg ndsButtonIcon kind="chevron-right" class="nds-icon"></svg>
                </button>
              </th>
            </tr>
          </thead>
          <tbody ndsTableBody>
            @for (linha of linhasOrdenadas(); track linha.key) {
              <tr ndsTableRow>
                <td ndsTableCell class="nds-font-medium">{{ linha.id }}</td>
                <td ndsTableCell class="nds-text-right">{{ linha.valor }}</td>
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
              @for (linha of linhasCurtas(); track linha.key) {
                <tr ndsTableRow>
                  <td ndsTableCell class="nds-font-medium">{{ linha.id }}</td>
                  <td ndsTableCell>{{ linha.status }}</td>
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
                  [attr.aria-label]="rotuloSelecionarTudo()"
                  [checked]="todasSelecionadas()"
                  [indeterminate]="algumasSelecionadas()"
                  (checkedChange)="alternarTodas($event)"
                ></button>
              </th>
              <th ndsTableHead>{{ t('demonstration.labels.invoice') }}</th>
              <th ndsTableHead>{{ t('demonstration.labels.status') }}</th>
            </tr>
          </thead>
          <tbody ndsTableBody>
            @for (linha of linhasCurtas(); track linha.key) {
              <tr ndsTableRow [selected]="selecionadas().has(linha.key)">
                <td ndsTableCell>
                  <button
                    ndsCheckbox
                    [attr.aria-label]="linha.selecaoLabel"
                    [checked]="selecionadas().has(linha.key)"
                    (checkedChange)="alternarSelecao(linha.key, $event)"
                  ></button>
                </td>
                <td ndsTableCell class="nds-font-medium">{{ linha.id }}</td>
                <td ndsTableCell>{{ linha.status }}</td>
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
        <nds-docs-demonstration [title]="t('demonstration.title')">
          <div ndsTableWrapper>
            <table ndsTable>
              <caption ndsTableCaption>{{ t('demonstration.labels.caption') }}</caption>
              <thead ndsTableHeader>
                <tr ndsTableRow>
                  <th ndsTableHead>{{ t('demonstration.labels.invoice') }}</th>
                  <th ndsTableHead>{{ t('demonstration.labels.status') }}</th>
                  <th ndsTableHead>{{ t('demonstration.labels.method') }}</th>
                  <th ndsTableHead>{{ t('demonstration.labels.amount') }}</th>
                  <th ndsTableHead>
                    <span class="nds-sr-only">{{ t('demonstration.labels.actions') }}</span>
                  </th>
                </tr>
              </thead>
              <tbody ndsTableBody>
                @for (linha of linhasDemo(); track linha.key) {
                  <tr ndsTableRow>
                    <td ndsTableCell class="nds-font-medium">{{ linha.id }}</td>
                    <td ndsTableCell>
                      <span ndsBadge [variant]="linha.variant">{{ linha.status }}</span>
                    </td>
                    <td ndsTableCell>{{ linha.metodo }}</td>
                    <td ndsTableCell class="nds-text-right">{{ linha.valor }}</td>
                    <td ndsTableCell class="nds-text-right">
                      <button ndsButton variant="ghost" size="icon-sm" [attr.aria-label]="linha.acaoLabel">
                        <svg ndsButtonIcon kind="pencil" class="nds-icon"></svg>
                      </button>
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
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="t('anatomy.structureCode')"
          language="html"
        />

        <nds-docs-when-to-use
          [title]="t('usage.title')"
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [uxWriting]="uxWriting()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <nds-docs-import
          [title]="t('import.title')"
          [code]="importCode"
          componentSlug="table"
          language="ts"
        />

        <nds-docs-variants
          id="variantes"
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="table"
          language="html"
        />

        <nds-docs-variants
          id="composicoes"
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          componentSlug="table"
          language="html"
        />

        <nds-docs-states
          [title]="t('states.title')"
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <nds-docs-props
          [title]="t('props.title')"
          [tables]="propTables()"
          [interfaceCode]="interfaceCode"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityNotes]="t('props.extensibility')"
        />

        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="tokensCss"
        />

        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="tNav('common.keyboardNav')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="table"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="table" />

        <nds-docs-analytics
          [title]="t('analytics.title')"
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

        <nds-docs-testes
          [title]="t('testes.title')"
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
  private readonly tplVarRodape = viewChild.required<TemplateRef<unknown>>('tplVarRodape');
  private readonly tplVarCaptionSrOnly = viewChild.required<TemplateRef<unknown>>('tplVarCaptionSrOnly');
  private readonly tplVarAcoes = viewChild.required<TemplateRef<unknown>>('tplVarAcoes');
  private readonly tplVarVazio = viewChild.required<TemplateRef<unknown>>('tplVarVazio');
  private readonly tplCompToolbar = viewChild.required<TemplateRef<unknown>>('tplCompToolbar');
  private readonly tplCompOrdenacao = viewChild.required<TemplateRef<unknown>>('tplCompOrdenacao');
  private readonly tplCompPaginacao = viewChild.required<TemplateRef<unknown>>('tplCompPaginacao');
  private readonly tplCompSelecao = viewChild.required<TemplateRef<unknown>>('tplCompSelecao');

  // ─── Dados dos exemplos ─────────────────────────────────────────────────────

  /** As cinco faturas da demonstração, já traduzidas. */
  protected readonly linhasDemo = computed(() => {
    dict();
    return LINHAS_DEMO.map((linha) => ({
      key: linha.key,
      variant: linha.variant,
      id: t(`demonstration.labels.${linha.idKey}`),
      status: t(`demonstration.labels.${linha.statusKey}`),
      metodo: t(`demonstration.labels.${linha.metodoKey}`),
      valor: t(`demonstration.labels.${linha.valorKey}`),
      // O rótulo da ação carrega o identificador da linha: "Ações" sozinho, cinco
      // vezes, é indistinguível na lista de controles do leitor de tela.
      acaoLabel: `${t('demonstration.labels.actionsLabel')} ${t(`demonstration.labels.${linha.idKey}`)}`,
      selecaoLabel: `${t('demonstration.labels.selectRow')} ${t(`demonstration.labels.${linha.idKey}`)}`,
    }));
  });

  /** Três linhas para os previews dos cards, que são estreitos. */
  protected readonly linhasCurtas = computed(() => this.linhasDemo().slice(0, 3));

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
    const busca = this.termo().trim().toLowerCase();
    const linhas = this.linhasDemo();
    if (!busca) return linhas;
    return linhas.filter((l) => `${l.id} ${l.metodo}`.toLowerCase().includes(busca));
  });

  protected filtrar(evento: Event): void {
    this.termo.set((evento.target as HTMLInputElement).value);
  }

  // Composição "cabeçalhos ordenáveis".
  protected readonly direcao = signal<'ascending' | 'descending'>('ascending');
  protected readonly linhasOrdenadas = computed(() => {
    const sinal = this.direcao() === 'ascending' ? 1 : -1;
    return [...this.linhasCurtas()].sort(
      (a, b) => (valueNumerico(a.valor) - valueNumerico(b.valor)) * sinal,
    );
  });

  protected alternarOrdem(): void {
    this.direcao.update((d) => (d === 'ascending' ? 'descending' : 'ascending'));
  }

  // Composição "seleção de linhas".
  protected readonly selecionadas = signal<ReadonlySet<string>>(new Set());
  protected readonly todasSelecionadas = computed(
    () => this.selecionadas().size === this.linhasCurtas().length,
  );
  protected readonly algumasSelecionadas = computed(
    () => this.selecionadas().size > 0 && !this.todasSelecionadas(),
  );
  protected readonly rotuloSelecionarTudo = computed(() => {
    dict();
    return t('demonstration.labels.selectAll');
  });

  protected alternarSelecao(key: string, marcado: boolean): void {
    const proximo = new Set(this.selecionadas());
    if (marcado) proximo.add(key);
    else proximo.delete(key);
    this.selecionadas.set(proximo);
  }

  protected alternarTodas(marcado: boolean): void {
    this.selecionadas.set(
      marcado ? new Set(this.linhasCurtas().map((l) => l.key)) : new Set(),
    );
  }

  // ─── Seções ─────────────────────────────────────────────────────────────────

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: t(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: t(s.labelKey) })),
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
      { key: 'withFooter',         code: CODE_WITH_FOOTER,      tpl: this.tplVarRodape()          },
      { key: 'withSrOnlyCaption',  code: CODE_CAPTION_SR_ONLY, tpl: this.tplVarCaptionSrOnly()   },
      { key: 'withInlineActions',  code: CODE_ACTIONS,           tpl: this.tplVarAcoes()           },
      { key: 'withEmptyState',     code: EMPTY_CODE,           tpl: this.tplVarVazio()           },
    ].map(({ key, code, tpl }) => ({
      name: t(`variants.items.${key}.label`),
      description: t(`variants.items.${key}.description`),
      code,
      trackId: key,
      preview: tpl,
    }));
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
      description: withQuandoUsar(
        t(`variants.compositions.${key}.description`),
        t(`variants.compositions.${key}.use`),
      ),
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
    const nao = tNav('common.no');
    const classe = {
      name: 'class',
      type: 'string',
      defaultValue: '—',
      required: nao,
      description: toPlainText(t('props.items.className')),
    };
    const conteudo = {
      name: '(conteúdo)',
      type: 'HTML',
      defaultValue: '—',
      required: nao,
      description: toPlainText(t('props.items.children')),
    };

    return [
      {
        // Sem chave no conteúdo compartilhado: o wrapper explícito só existe
        // neste stack. As outras stacks o criam por dentro do componente.
        title: 'TableWrapper',
        cols,
        items: [
          { name: '(elemento)', type: 'div',    defaultValue: '—', required: nao, description: toPlainText(t('props.items.wrapper')) },
          { name: 'tabindex',   type: '"0"',    defaultValue: '"0"', required: nao, description: toPlainText(t('props.items.tabindex')) },
          classe,
          conteudo,
        ],
      },
      { title: t('props.tableTitle'),        cols, items: [classe, conteudo] },
      { title: t('props.tableHeaderTitle'),  cols, items: [classe, conteudo] },
      { title: t('props.tableBodyTitle'),    cols, items: [classe, conteudo] },
      { title: t('props.tableFooterTitle'),  cols, items: [classe, conteudo] },
      {
        title: t('props.tableRowTitle'),
        cols,
        items: [
          { name: 'selected',   type: 'boolean',    defaultValue: 'false', required: nao, description: toPlainText(t('props.items.selected')) },
          { name: 'data-state', type: '"selected"', defaultValue: '—',     required: nao, description: toPlainText(t('props.items.dataState')) },
          classe,
          conteudo,
        ],
      },
      {
        title: t('props.tableHeadTitle'),
        cols,
        items: [
          { name: 'scope', type: '"col" | "row" | "colgroup" | "rowgroup"', defaultValue: "'col'", required: nao, description: toPlainText(t('props.items.scope')) },
          { name: 'sort',  type: 'TableSortDirection',                      defaultValue: '—',     required: nao, description: toPlainText(t('props.items.sort')) },
          classe,
          conteudo,
        ],
      },
      {
        title: t('props.tableCellTitle'),
        cols,
        items: [
          { name: 'colspan', type: 'number', defaultValue: '—', required: nao, description: toPlainText(t('props.items.colSpan')) },
          { name: 'rowspan', type: 'number', defaultValue: '—', required: nao, description: toPlainText(t('props.items.rowSpan')) },
          classe,
          conteudo,
        ],
      },
      { title: t('props.tableCaptionTitle'), cols, items: [classe, conteudo] },
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
      { key: 'dataTable',    nome: 'DataTable',    path: '?path=/docs/ui-datatable--docs'    },
      { key: 'badge',        nome: 'Badge',        path: '?path=/docs/ui-badge--docs'        },
      { key: 'skeleton',     nome: 'Skeleton',     path: '?path=/docs/ui-skeleton--docs'     },
      { key: 'avatar',       nome: 'Avatar',       path: '?path=/docs/ui-avatar--docs'       },
      { key: 'pagination',   nome: 'Pagination',   path: '?path=/docs/ui-pagination--docs'   },
      { key: 'dropdownMenu', nome: 'DropdownMenu', path: '?path=/docs/ui-dropdownmenu--docs' },
    ].map(({ key, nome, path }) => ({
      name: nome,
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
function valueNumerico(valor: string): number {
  return Number(valor.replace(/[^\d,]/g, '').replace(',', '.'));
}

/**
 * Junta descrição e "quando usar" na forma que o container de variantes espera.
 *
 * O `NdsDocsCompositions` faria isto sozinho, mas ele não repassa `language`
 * para o `NdsDocsVariants` — e os snippets aqui são template Angular, não TS.
 */
function withQuandoUsar(descricao: string, quandoUsar: string): string {
  return `${descricao}<br><br><strong>${tNav('common.useWhen')}</strong> ${quandoUsar}`;
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
  const itens: string[] = [];
  for (let i = 1; ; i++) {
    const valor = d[`${base}.${prefixo}${i}`];
    if (valor === undefined) break;
    itens.push(valor);
  }
  return itens;
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
