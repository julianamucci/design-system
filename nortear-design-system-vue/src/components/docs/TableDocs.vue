<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ArrowUpDown, ChevronDown, Search } from 'lucide-vue-next';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import tableTranslations from '@shared/content/table/translations.json';

import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.vue';
import DocsCompositions  from '@/components/docs/shared/sections/DocsCompositions.vue';
import DocsStates        from '@/components/docs/shared/sections/DocsStates.vue';
import DocsProps         from '@/components/docs/shared/sections/DocsProps.vue';
import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.vue';
import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.vue';
import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.vue';
import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.vue';
import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.vue';
import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.vue';
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(tableTranslations);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
// O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (tableTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale.value]?.accessibility?.screenReader ?? {},
  )
    .filter(([key]) => key !== 'title')
    .map(([, value]) => value),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function localPriority(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

/**
 * Quantos itens a seção publica HOJE, perguntado ao dicionário.
 *
 * Lista cravada à mão envelhece em SILÊNCIO: o conteúdo compartilhado cresce nos
 * três idiomas e a tela fica para trás sem nada ficar vermelho — foi assim que
 * um teste funcional, um visual e um de acessibilidade ficaram escritos e
 * invisíveis nesta página. Trocar `item1..item6` por `item1..item8` repetiria
 * o defeito no item seguinte, então quem decide o fim da lista é o dicionário.
 *
 * A parada é no primeiro índice AUSENTE, e não no tamanho do objeto: item
 * numerado fora de ordem é defeito de conteúdo, e tolerá-lo aqui o esconderia.
 * Mesma forma do PaginationDocs desta stack.
 */
function entriesFromDict<K extends string>(
  base: string,
  fields: readonly K[],
): Array<Record<K, string>> {
  const out: Array<Record<K, string>> = [];
  for (let i = 1; ; i++) {
    if (!tContent(`${base}.item${i}.${fields[0]}`, '')) break;
    out.push(
      Object.fromEntries(
        fields.map((field) => [field, tContent(`${base}.item${i}.${field}`, '')]),
      ) as Record<K, string>,
    );
  }
  return out;
}

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'table',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'table',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Analytics — section view ─────────────────────────────────────────────────

// ─── Navigation groups ────────────────────────────────────────────────────────

const navGroups = computed(() => [
  {
    label: tNav('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tNav('nav.demonstration') },
      { id: 'anatomia',     label: tNav('nav.anatomy')      },
      { id: 'quando-usar',  label: tNav('nav.usage')        },
      { id: 'do-dont',      label: tNav('nav.doDont')       },
    ],
  },
  {
    label: tNav('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tNav('nav.import')   },
      { id: 'variantes',    label: tNav('nav.variants') },
      { id: 'composicoes',  label: tNav('nav.compositions') },
      { id: 'estados',      label: tNav('nav.states')   },
      { id: 'propriedades', label: tNav('nav.props')    },
      { id: 'tokens',       label: tNav('nav.tokens')   },
    ],
  },
  {
    label: tNav('nav.context'),
    sections: [
      { id: 'acessibilidade', label: tNav('nav.accessibility') },
      { id: 'relacionados',   label: tNav('nav.related')       },
      { id: 'notas',          label: tNav('nav.notes')         },
    ],
  },
  {
    label: tNav('nav.quality'),
    sections: [
      { id: 'analytics', label: tNav('nav.analytics') },
      { id: 'testes',    label: tNav('nav.testes')    },
    ],
  },
]);

const allSectionIds = computed(() => navGroups.value.flatMap(g => g.sections.map(s => s.id)));

const { activeId: activeSection } = useActiveSection(allSectionIds, (id) => {
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'table',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";`;

const codeBasic = `<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col" class="nds-text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell class="nds-font-medium">#INV-001</TableCell>
      <TableCell>Pago</TableCell>
      <TableCell class="nds-text-right">R$ 250,00</TableCell>
    </TableRow>
  </TableBody>
</Table>`;

const codeWithFooter = `<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col" class="nds-text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>#INV-001</TableCell>
      <TableCell class="nds-text-right">R$ 250,00</TableCell>
    </TableRow>
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell>Total</TableCell>
      <TableCell class="nds-text-right">R$ 250,00</TableCell>
    </TableRow>
  </TableFooter>
</Table>`;

const codeWithSrOnlyCaption = `<Table>
  <TableCaption class="nds-sr-only">Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col" class="nds-text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>#INV-001</TableCell>
      <TableCell class="nds-text-right">R$ 250,00</TableCell>
    </TableRow>
  </TableBody>
</Table>`;

const codeWithActions = `<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col" class="nds-text-right">Ações</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>#INV-001</TableCell>
      <TableCell class="nds-text-right">
        <Button variant="ghost" size="sm" aria-label="Ações para fatura #INV-001">
          Ações
        </Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>`;

const codeEmpty = `<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableEmpty :colspan="2">
      Nenhuma fatura encontrada.
    </TableEmpty>
  </TableBody>
</Table>`;

const codeWithExpandableRows = `<Table>
  <TableCaption class="nds-sr-only">Faturas recentes com detalhes</TableCaption>
  <TableHeader>
    <TableRow>
      <!-- A coluna do disclosure vem primeiro e tem cabeçalho: o rótulo sai da
           tela num span, e não por classe no th, que desmontaria a grade. -->
      <TableHead scope="col"><span class="nds-sr-only">Detalhes</span></TableHead>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col" class="nds-text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <template v-for="invoice in invoices" :key="invoice.id">
      <TableRow :data-state="invoice.id === selected ? 'selected' : null">
        <TableCell>
          <Button
            variant="ghost"
            size="icon-sm"
            :aria-expanded="open[invoice.id] ? 'true' : 'false'"
            :aria-controls="\`detalhe-\${invoice.id}\`"
            :aria-label="\`Detalhes da fatura \${invoice.id}\`"
            @click="toggle(invoice.id)"
          >
            <ChevronDown class="nds-chevron" aria-hidden="true" />
          </Button>
        </TableCell>
        <TableCell class="nds-font-medium">{{ invoice.id }}</TableCell>
        <TableCell class="nds-text-right">{{ invoice.amount }}</TableCell>
      </TableRow>
      <!-- A linha revelada é IRMÃ e está sempre no DOM: \`hidden\` a tira da
           tela, da árvore de acessibilidade e da tabulação de uma vez. O
           colspan cobre as colunas de dado MAIS a do disclosure. -->
      <TableRow :id="\`detalhe-\${invoice.id}\`" :hidden="!open[invoice.id]">
        <TableCell :colspan="3">
          <div class="nds-stack" data-spacing="sm">
            <p class="nds-text-muted-foreground">Emitida em 03/09/2026.</p>
            <Button variant="outline" size="sm" :aria-label="\`Baixar recibo da fatura \${invoice.id}\`">
              Baixar recibo
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </template>
  </TableBody>
</Table>`;

const codeCustomizationTokens = `/* Em globals.css — ajustar tokens para customizar a tabela */
:root {
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
}

.dark {
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
}`;

const interfaceCode = `// Table
interface TableProps {
  class?: string;
}

// TableHead — scope obrigatório
interface TableHeadProps {
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
  class?: string;
}

// TableCell
interface TableCellProps {
  colSpan?: number;
  rowSpan?: number;
  class?: string;
}

// TableRow
interface TableRowProps {
  'data-state'?: 'selected';
  class?: string;
}

// TableEmpty (Vue extra)
interface TableEmptyProps {
  colspan?: number;
  class?: string;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
  tContent('anatomy.item5'),
  tContent('anatomy.item6'),
  tContent('anatomy.item7'),
  tContent('anatomy.item8'),
]);

/**
 * Os três primeiros registros da demonstração, para as prévias VIVAS.
 *
 * Cada campo chama `tContent` com o caminho POR EXTENSO, nunca interpolado: a
 * varredura que compara as cinco demonstrações procura a string literal
 * `demonstration.labels.<chave>` no arquivo, e chave montada em template
 * literal não aparece para ela. Prévia de Variantes e de Do & Don't renderiza
 * componente vivo — rótulo de coluna, dado de célula e legenda saem daqui, como
 * o vanilla já faz. Texto cravado em pt-BR dentro de template literal é
 * snippet, código que a página ensina, e continua cravado.
 */
const previewRows = computed(() => [
  { key: 'inv001', id: tContent('demonstration.labels.inv001'), status: tContent('demonstration.labels.paid'),     method: tContent('demonstration.labels.creditCard'),   amount: tContent('demonstration.labels.amount001') },
  { key: 'inv002', id: tContent('demonstration.labels.inv002'), status: tContent('demonstration.labels.pending'),  method: tContent('demonstration.labels.bankTransfer'), amount: tContent('demonstration.labels.amount002') },
  { key: 'inv003', id: tContent('demonstration.labels.inv003'), status: tContent('demonstration.labels.canceled'), method: tContent('demonstration.labels.pix'),          amount: tContent('demonstration.labels.amount003') },
]);

// ─── Prévia da linha expansível ───────────────────────────────────────────────

/**
 * O estado do disclosure vive no CONTROLE (`aria-expanded` no botão), nunca na
 * linha: a linha já usa `data-state` para a seleção, e as duas coisas acontecem
 * juntas. A segunda prévia nasce marcada E abre, que é o contrato protegido por
 * `:not([data-state="selected"])` na folha compartilhada.
 */
const expandedRows = ref<Record<string, boolean>>({});

function toggleExpanded(key: string) {
  expandedRows.value = { ...expandedRows.value, [key]: !expandedRows.value[key] };
}

/** Id da linha revelada — alvo do `aria-controls`, estável por registro. */
function detailRowId(key: string): string {
  return `table-docs-detail-${key}`;
}

/** A linha que nasce marcada: aberta e selecionada ao mesmo tempo. */
const selectedPreviewKey = 'inv002';

/** Colunas de dado MAIS a do disclosure. */
const detailColspan = 5;

const variantItems = computed(() => [
  { trackId: 'basic', name: tContent('variants.items.basic.label'),           description: tContent('variants.items.basic.description'),           code: codeBasic           },
  { trackId: 'withFooter', name: tContent('variants.items.withFooter.label'),      description: tContent('variants.items.withFooter.description'),      code: codeWithFooter      },
  { trackId: 'withSrOnlyCaption', name: tContent('variants.items.withSrOnlyCaption.label'), description: tContent('variants.items.withSrOnlyCaption.description'), code: codeWithSrOnlyCaption },
  { trackId: 'withInlineActions', name: tContent('variants.items.withInlineActions.label'), description: tContent('variants.items.withInlineActions.description'), code: codeWithActions   },
  { trackId: 'withEmptyState', name: tContent('variants.items.withEmptyState.label'),  description: tContent('variants.items.withEmptyState.description'),  code: codeEmpty           },
  { trackId: 'withExpandableRows', name: tContent('variants.items.withExpandableRows.label'), description: tContent('variants.items.withExpandableRows.description'), code: codeWithExpandableRows },
]);

const codeCompFilterableToolbar = `<div class="nds-stack" data-spacing="sm">
  <div class="nds-cluster" data-align="center" data-spacing="md">
    <div class="nds-w-full nds-max-w-sm" style="position: relative">
      <Search class="nds-icon-input-start nds-icon nds-text-muted-foreground" aria-hidden="true" />
      <Input
        v-model="search"
        aria-label="Filtrar faturas"
        placeholder="Filtrar faturas..."
        class="nds-pl-8"
      />
    </div>
    <Button variant="outline">Status</Button>
  </div>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead scope="col">Fatura</TableHead>
        <TableHead scope="col">Status</TableHead>
        <TableHead scope="col" class="nds-text-right">Valor</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="invoice in filtered" :key="invoice.id">
        <TableCell>{{ invoice.id }}</TableCell>
        <TableCell>{{ invoice.status }}</TableCell>
        <TableCell class="nds-text-right">{{ invoice.amount }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>`;

const codeCompSortableHeaders = `<Table>
  <TableHeader>
    <TableRow>
      <TableHead scope="col" aria-sort="ascending">
        <Button variant="ghost" size="sm">
          Fatura
          <ArrowUpDown class="nds-ml-2 nds-icon" aria-hidden="true" />
        </Button>
      </TableHead>
      <TableHead scope="col" aria-sort="none">
        <Button variant="ghost" size="sm">
          Valor
          <ArrowUpDown class="nds-ml-2 nds-icon" aria-hidden="true" />
        </Button>
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody><!-- linhas --></TableBody>
</Table>`;

const codeCompSelectableRows = `<Table>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">
        <Checkbox aria-label="Selecionar todas as faturas" />
      </TableHead>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow v-for="invoice in invoices" :key="invoice.id" :data-state="selected.has(invoice.id) ? 'selected' : undefined">
      <TableCell>
        <Checkbox :model-value="selected.has(invoice.id)" @update:model-value="toggle(invoice.id)" :aria-label="\`Selecionar fatura \${invoice.id}\`" />
      </TableCell>
      <TableCell>{{ invoice.id }}</TableCell>
      <TableCell>{{ invoice.status }}</TableCell>
    </TableRow>
  </TableBody>
</Table>`;

const codeCompWithPagination = `<div class="nds-stack" data-spacing="sm">
  <Table><!-- linhas --></Table>
  <Pagination>
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious href="#" />
      </PaginationItem>
      <PaginationItem>
        <PaginationLink href="#" is-active>1</PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationLink href="#">2</PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationNext href="#" />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
</div>`;

const compositionItems = computed(() => [
  {
    trackId: 'filterableToolbar',
    name: tContent('variants.compositions.filterableToolbar.name'),
    description: tContent('variants.compositions.filterableToolbar.description'),
    useWhen: tContent('variants.compositions.filterableToolbar.use'),
    code: codeCompFilterableToolbar,
  },
  {
    trackId: 'sortableHeaders',
    name: tContent('variants.compositions.sortableHeaders.name'),
    description: tContent('variants.compositions.sortableHeaders.description'),
    useWhen: tContent('variants.compositions.sortableHeaders.use'),
    code: codeCompSortableHeaders,
  },
  {
    trackId: 'selectableRows',
    name: tContent('variants.compositions.selectableRows.name'),
    description: tContent('variants.compositions.selectableRows.description'),
    useWhen: tContent('variants.compositions.selectableRows.use'),
    code: codeCompSelectableRows,
  },
  {
    trackId: 'withPagination',
    name: tContent('variants.compositions.withPagination.name'),
    description: tContent('variants.compositions.withPagination.description'),
    useWhen: tContent('variants.compositions.withPagination.use'),
    code: codeCompWithPagination,
  },
]);

const stateItems = computed(() => [
  {
    label:    tContent('states.empty.label'),
    trigger:  toPlainText(tContent('states.empty.trigger')),
    behavior: toPlainText(tContent('states.empty.behavior')),
  },
  {
    label:    tContent('states.selected.label'),
    trigger:  toPlainText(tContent('states.selected.trigger')),
    behavior: toPlainText(tContent('states.selected.behavior')),
  },
  {
    label:    tContent('states.loading.label'),
    trigger:  toPlainText(tContent('states.loading.trigger')),
    behavior: toPlainText(tContent('states.loading.behavior')),
  },
]);

const propCols = computed(() => ({
  prop:        tContent('props.table.prop'),
  type:        tContent('props.table.type'),
  default:     tContent('props.table.default'),
  required:    tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const tablePropItems = computed(() => [
  { name: 'class', type: 'string', defaultValue: '—', required: 'Não', description: tContent('props.items.className') },
]);

const tableHeadPropItems = computed(() => [
  { name: 'scope',  type: '"col" | "row" | "colgroup" | "rowgroup"', defaultValue: '—',  required: 'Sim', description: stripHtml(tContent('props.items.scope'))     },
  { name: 'class',  type: 'string',                                   defaultValue: '—',  required: 'Não', description: tContent('props.items.className')             },
]);

const tableCellPropItems = computed(() => [
  { name: 'colSpan', type: 'number', defaultValue: '—', required: 'Não', description: tContent('props.items.colSpan') },
  { name: 'rowSpan', type: 'number', defaultValue: '—', required: 'Não', description: tContent('props.items.rowSpan') },
  { name: 'class',   type: 'string', defaultValue: '—', required: 'Não', description: tContent('props.items.className') },
]);

const tableRowPropItems = computed(() => [
  { name: 'data-state', type: '"selected"', defaultValue: '—',  required: 'Não', description: stripHtml(tContent('props.items.dataState')) },
  { name: 'class',      type: 'string',     defaultValue: '—',  required: 'Não', description: tContent('props.items.className') },
]);

const tableEmptyPropItems = computed(() => [
  { name: 'colspan', type: 'number', defaultValue: '1', required: 'Não', description: tContent('props.items.colSpan') },
  { name: 'class',   type: 'string', defaultValue: '—', required: 'Não', description: tContent('props.items.className') },
]);

const tokenRows = computed(() => [
  { token: '--border',                       value: 'TableHeader / TableBody', description: stripHtml(tContent('tokens.items.borderB'))       },
  { token: '--muted',                    value: 'TableFooter / TableRow',  description: stripHtml(tContent('tokens.items.bgMuted'))        },
  { token: '--muted', value: 'TableRow',               description: stripHtml(tContent('tokens.items.bgMutedSelected')) },
  { token: '--muted-foreground',          value: 'TableCaption',            description: stripHtml(tContent('tokens.items.textMuted'))       },
  { token: '--font-weight-medium',                    value: 'TableHead / TableFooter', description: stripHtml(tContent('tokens.items.fontMedium'))      },
  { token: '--spacing-10',                           value: 'TableHead',               description: stripHtml(tContent('tokens.items.h10'))             },
  { token: '--spacing-2',                            value: 'TableCell',               description: stripHtml(tContent('tokens.items.p2'))              },
  { token: 'caption-side',                 value: 'TableCaption',            description: stripHtml(tContent('tokens.items.captionBottom'))   },
]);

const keyboardItems = computed(() => [
  { key: 'Tab',   description: tContent('accessibility.keyboard.tab')        },
  { key: 'Enter', description: tContent('accessibility.keyboard.enter')      },
  { key: 'Space', description: tContent('accessibility.keyboard.space')      },
  { key: '—',     description: tContent('accessibility.keyboard.noKeyboard') },
]);

const relatedItems = computed(() => [
  { name: 'Badge',        description: toPlainText(tContent('related.badge')),        path: '?path=/docs/components-feedback-badge--docs'         },
  { name: 'Skeleton',     description: toPlainText(tContent('related.skeleton')),     path: '?path=/docs/components-feedback-skeleton--docs'      },
  { name: 'Pagination',   description: toPlainText(tContent('related.pagination')),   path: '?path=/docs/components-navigation-pagination--docs'    },
  { name: 'Avatar',       description: toPlainText(tContent('related.avatar')),       path: '?path=/docs/components-display-avatar--docs'        },
  { name: 'DropdownMenu', description: toPlainText(tContent('related.dropdownMenu')), path: '?path=/docs/components-navigation-dropdownmenu--docs'  },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
  { title: '', content: tContent('notes.tip4') },
  { title: '', content: tContent('notes.tip5') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.pageView'),      trigger: toPlainText(tContent('analytics.table.pageViewTrigger')),      payload: tContent('analytics.table.pageViewPayload')      },
  { event: tContent('analytics.table.sectionViewed'), trigger: toPlainText(tContent('analytics.table.sectionViewedTrigger')), payload: tContent('analytics.table.sectionViewedPayload') },
  { event: tContent('analytics.table.langSwitch'),    trigger: toPlainText(tContent('analytics.table.langSwitchTrigger')),    payload: tContent('analytics.table.langSwitchPayload')    },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const functionalTestItems = computed(() =>
  entriesFromDict('testes.functional', ['action', 'result', 'priority']).map((row) => ({
    action: toPlainText(row.action),
    result: toPlainText(row.result),
    priority: localPriority(row.priority),
  })),
);

const a11yTestItems = computed(() =>
  entriesFromDict('testes.accessibility', ['criterion', 'level', 'how']).map((row) => ({
    criterion: toPlainText(row.criterion),
    level: row.level,
    how: toPlainText(row.how),
  })),
);

const visualTestItems = computed(() =>
  entriesFromDict('testes.visual', ['story', 'priority']).map((row) => ({
    story: row.story,
    priority: localPriority(row.priority),
  })),
);
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration>
      <div class="nds-w-full">
        <Table>
          <TableCaption>{{ tContent('demonstration.labels.caption') }}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.invoice') }}
              </TableHead>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.status') }}
              </TableHead>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.method') }}
              </TableHead>
              <TableHead
                scope="col"
                class="nds-text-right"
              >
                {{ tContent('demonstration.labels.amount') }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="nds-font-medium">
                {{ tContent('demonstration.labels.inv001') }}
              </TableCell>
              <TableCell>{{ tContent('demonstration.labels.paid') }}</TableCell>
              <TableCell>{{ tContent('demonstration.labels.creditCard') }}</TableCell>
              <TableCell class="nds-text-right">
                {{ tContent('demonstration.labels.amount001') }}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="nds-font-medium">
                {{ tContent('demonstration.labels.inv002') }}
              </TableCell>
              <TableCell>{{ tContent('demonstration.labels.pending') }}</TableCell>
              <TableCell>{{ tContent('demonstration.labels.bankTransfer') }}</TableCell>
              <TableCell class="nds-text-right">
                {{ tContent('demonstration.labels.amount002') }}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="nds-font-medium">
                {{ tContent('demonstration.labels.inv003') }}
              </TableCell>
              <TableCell>{{ tContent('demonstration.labels.canceled') }}</TableCell>
              <TableCell>{{ tContent('demonstration.labels.pix') }}</TableCell>
              <TableCell class="nds-text-right">
                {{ tContent('demonstration.labels.amount003') }}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="nds-font-medium">
                {{ tContent('demonstration.labels.inv004') }}
              </TableCell>
              <TableCell>{{ tContent('demonstration.labels.paid') }}</TableCell>
              <TableCell>{{ tContent('demonstration.labels.creditCard') }}</TableCell>
              <TableCell class="nds-text-right">
                {{ tContent('demonstration.labels.amount004') }}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="nds-font-medium">
                {{ tContent('demonstration.labels.inv005') }}
              </TableCell>
              <TableCell>{{ tContent('demonstration.labels.pending') }}</TableCell>
              <TableCell>{{ tContent('demonstration.labels.pix') }}</TableCell>
              <TableCell class="nds-text-right">
                {{ tContent('demonstration.labels.amount005') }}
              </TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colspan="3">
                {{ tContent('demonstration.labels.total') }}
              </TableCell>
              <TableCell class="nds-text-right">
                {{ tContent('demonstration.labels.totalAmount') }}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ───────────────────────────────────────────────── -->
    <DocsAnatomy
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <!-- ── Quando Usar ────────────────────────────────────────────── -->
    <DocsWhenToUse
      :guidelines="{
        title: tContent('usage.guidelines.title'),
        items: [
          tContent('usage.guidelines.item1'),
          tContent('usage.guidelines.item2'),
          tContent('usage.guidelines.item3'),
          tContent('usage.guidelines.item4'),
          tContent('usage.guidelines.item5'),
        ],
      }"
      :scenarios="{
        title: tContent('usage.scenarios.title'),
        cols: {
          scenario: tContent('usage.scenarios.cols.scenario'),
          use: tContent('usage.scenarios.cols.use'),
          alternative: tContent('usage.scenarios.cols.alternative'),
        },
        items: [
          { s: tContent('usage.scenarios.item1.s'), u: tContent('usage.scenarios.item1.u'), a: tContent('usage.scenarios.item1.a') },
          { s: tContent('usage.scenarios.item2.s'), u: tContent('usage.scenarios.item2.u'), a: tContent('usage.scenarios.item2.a') },
          { s: tContent('usage.scenarios.item3.s'), u: tContent('usage.scenarios.item3.u'), a: tContent('usage.scenarios.item3.a') },
          { s: tContent('usage.scenarios.item4.s'), u: tContent('usage.scenarios.item4.u'), a: tContent('usage.scenarios.item4.a') },
          { s: tContent('usage.scenarios.item5.s'), u: tContent('usage.scenarios.item5.u'), a: tContent('usage.scenarios.item5.a') },
        ],
      }"
      :ux-writing="{
        title: tContent('usage.uxWriting.title'),
        cols: {
          element: tContent('usage.uxWriting.table.element'),
          rules: tContent('usage.uxWriting.table.rules'),
          do: tContent('usage.uxWriting.table.correct'),
          dont: tContent('usage.uxWriting.table.avoid'),
        },
        items: [
          { element: tContent('usage.uxWriting.table.caption.name'), rules: tContent('usage.uxWriting.table.caption.format'), do: tContent('usage.uxWriting.table.caption.good'), dont: tContent('usage.uxWriting.table.caption.bad') },
          { element: tContent('usage.uxWriting.table.head.name'), rules: tContent('usage.uxWriting.table.head.format'), do: tContent('usage.uxWriting.table.head.good'), dont: tContent('usage.uxWriting.table.head.bad') },
          { element: tContent('usage.uxWriting.table.emptyState.name'), rules: tContent('usage.uxWriting.table.emptyState.format'), do: tContent('usage.uxWriting.table.emptyState.good'), dont: tContent('usage.uxWriting.table.emptyState.bad') },
          { element: tContent('usage.uxWriting.table.actionLabel.name'), rules: tContent('usage.uxWriting.table.actionLabel.format'), do: tContent('usage.uxWriting.table.actionLabel.good'), dont: tContent('usage.uxWriting.table.actionLabel.bad') },
        ],
      }"
      :do="{ title: tContent('usage.do.title'), items: [tContent('usage.do.item1'), tContent('usage.do.item2'), tContent('usage.do.item3'), tContent('usage.do.item4')] }"
      :dont="{ title: tContent('usage.dont.title'), items: [tContent('usage.dont.item1'), tContent('usage.dont.item2'), tContent('usage.dont.item3')] }"
    />

    <!-- ── Do & Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
      ]"
    >
      <!-- O par 1 é sobre a LEGENDA, e só sobre ela: as duas prévias são
           idênticas, o `do` tem `TableCaption` e o `dont` não tem nenhuma.
           O `scope` não aparece em nenhuma das duas de propósito — a peça de
           cabeçalho já nasce com `scope="col"`, e escrevê-lo vazio para forçar
           um contraste ensinaria a desarmar um default seguro. -->
      <template #do-preview-0>
        <Table>
          <TableCaption>{{ tContent('demonstration.labels.caption') }}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>{{ tContent('demonstration.labels.invoice') }}</TableHead>
              <TableHead class="nds-text-right">
                {{ tContent('demonstration.labels.amount') }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{{ tContent('demonstration.labels.inv001') }}</TableCell>
              <TableCell class="nds-text-right">
                {{ tContent('demonstration.labels.amount001') }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
      <template #dont-preview-0>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ tContent('demonstration.labels.invoice') }}</TableHead>
              <TableHead class="nds-text-right">
                {{ tContent('demonstration.labels.amount') }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{{ tContent('demonstration.labels.inv001') }}</TableCell>
              <TableCell class="nds-text-right">
                {{ tContent('demonstration.labels.amount001') }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
      <template #do-preview-1>
        <Table>
          <TableCaption>{{ tContent('demonstration.labels.caption') }}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.invoice') }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmpty :colspan="1">
              {{ tContent('demonstration.labels.emptyState') }}
            </TableEmpty>
          </TableBody>
        </Table>
      </template>
      <template #dont-preview-1>
        <Table>
          <TableCaption>{{ tContent('demonstration.labels.caption') }}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.invoice') }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody />
        </Table>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :code="codeImportBasic"
      component-slug="table"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsVariants
      :items="variantItems"
    >
      <!-- Básica -->
      <template #variant-preview-0>
        <Table>
          <TableCaption>{{ tContent('demonstration.labels.caption') }}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.invoice') }}
              </TableHead>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.status') }}
              </TableHead>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.method') }}
              </TableHead>
              <TableHead
                scope="col"
                class="nds-text-right"
              >
                {{ tContent('demonstration.labels.amount') }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="row in previewRows"
              :key="row.key"
            >
              <TableCell class="nds-font-medium">
                {{ row.id }}
              </TableCell>
              <TableCell>{{ row.status }}</TableCell>
              <TableCell>{{ row.method }}</TableCell>
              <TableCell class="nds-text-right">
                {{ row.amount }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
      <!-- Com rodapé -->
      <template #variant-preview-1>
        <Table>
          <TableCaption>{{ tContent('demonstration.labels.caption') }}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.invoice') }}
              </TableHead>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.status') }}
              </TableHead>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.method') }}
              </TableHead>
              <TableHead
                scope="col"
                class="nds-text-right"
              >
                {{ tContent('demonstration.labels.amount') }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="row in previewRows"
              :key="row.key"
            >
              <TableCell class="nds-font-medium">
                {{ row.id }}
              </TableCell>
              <TableCell>{{ row.status }}</TableCell>
              <TableCell>{{ row.method }}</TableCell>
              <TableCell class="nds-text-right">
                {{ row.amount }}
              </TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colspan="3">
                {{ tContent('demonstration.labels.total') }}
              </TableCell>
              <TableCell class="nds-text-right">
                {{ tContent('demonstration.labels.totalAmount') }}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </template>
      <!-- Caption sr-only -->
      <template #variant-preview-2>
        <Table>
          <TableCaption class="nds-sr-only">
            {{ tContent('demonstration.labels.caption') }}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.invoice') }}
              </TableHead>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.status') }}
              </TableHead>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.method') }}
              </TableHead>
              <TableHead
                scope="col"
                class="nds-text-right"
              >
                {{ tContent('demonstration.labels.amount') }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="row in previewRows"
              :key="row.key"
            >
              <TableCell class="nds-font-medium">
                {{ row.id }}
              </TableCell>
              <TableCell>{{ row.status }}</TableCell>
              <TableCell>{{ row.method }}</TableCell>
              <TableCell class="nds-text-right">
                {{ row.amount }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
      <!-- Ações por linha -->
      <template #variant-preview-3>
        <Table>
          <TableCaption>{{ tContent('demonstration.labels.caption') }}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.invoice') }}
              </TableHead>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.status') }}
              </TableHead>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.method') }}
              </TableHead>
              <TableHead
                scope="col"
                class="nds-text-right"
              >
                {{ tContent('demonstration.labels.amount') }}
              </TableHead>
              <!-- O rótulo da coluna de ações é VISÍVEL: quem lê a tabela com a
                   vista precisa saber o que a última coluna guarda tanto quanto
                   quem a ouve. -->
              <TableHead
                scope="col"
                class="nds-text-right"
              >
                {{ tContent('demonstration.labels.actions') }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="row in previewRows"
              :key="row.key"
            >
              <TableCell class="nds-font-medium">
                {{ row.id }}
              </TableCell>
              <TableCell>{{ row.status }}</TableCell>
              <TableCell>{{ row.method }}</TableCell>
              <TableCell class="nds-text-right">
                {{ row.amount }}
              </TableCell>
              <TableCell class="nds-text-right">
                <!-- Conteúdo visível `…`, e o nome acessível no `aria-label`: o
                     rótulo "Ações" é o do CABEÇALHO da coluna, e repeti-lo em
                     cada botão daria três controles com o mesmo nome e nenhum
                     dizendo de qual fatura é. -->
                <Button
                  variant="ghost"
                  size="sm"
                  :aria-label="`${tContent('demonstration.labels.actionsLabel')} ${row.id}`"
                >
                  …
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
      <!-- Estado vazio -->
      <template #variant-preview-4>
        <Table>
          <TableCaption>{{ tContent('demonstration.labels.caption') }}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.invoice') }}
              </TableHead>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.status') }}
              </TableHead>
              <TableHead
                scope="col"
                class="nds-text-right"
              >
                {{ tContent('demonstration.labels.amount') }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmpty :colspan="3">
              {{ tContent('demonstration.labels.emptyState') }}
            </TableEmpty>
          </TableBody>
        </Table>
      </template>
      <!-- Linha expansível -->
      <template #variant-preview-5>
        <Table>
          <TableCaption class="nds-sr-only">
            {{ tContent('demonstration.labels.caption') }}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <!-- A coluna do disclosure vem primeiro e TEM cabeçalho: o rótulo
                   sai da tela num span, e não por classe no `th`, que tiraria a
                   célula da grade e desmontaria as colunas. -->
              <TableHead scope="col">
                <span class="nds-sr-only">{{ tContent('demonstration.labels.detailsColumn') }}</span>
              </TableHead>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.invoice') }}
              </TableHead>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.status') }}
              </TableHead>
              <TableHead scope="col">
                {{ tContent('demonstration.labels.method') }}
              </TableHead>
              <TableHead
                scope="col"
                class="nds-text-right"
              >
                {{ tContent('demonstration.labels.amount') }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template
              v-for="row in previewRows"
              :key="row.key"
            >
              <TableRow :data-state="row.key === selectedPreviewKey ? 'selected' : null">
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    :aria-expanded="expandedRows[row.key] ? 'true' : 'false'"
                    :aria-controls="detailRowId(row.key)"
                    :aria-label="`${tContent('demonstration.labels.detailsLabel')} ${row.id}`"
                    @click="toggleExpanded(row.key)"
                  >
                    <ChevronDown
                      class="nds-chevron"
                      aria-hidden="true"
                    />
                  </Button>
                </TableCell>
                <TableCell class="nds-font-medium">
                  {{ row.id }}
                </TableCell>
                <TableCell>{{ row.status }}</TableCell>
                <TableCell>{{ row.method }}</TableCell>
                <TableCell class="nds-text-right">
                  {{ row.amount }}
                </TableCell>
              </TableRow>
              <!-- A revelada é IRMÃ e está sempre no DOM: `hidden` a tira da
                   tela, da árvore de acessibilidade e da tabulação de uma vez —
                   por isso o botão do detalhe só existe para o teclado quando a
                   linha abre. -->
              <TableRow
                :id="detailRowId(row.key)"
                :hidden="!expandedRows[row.key]"
              >
                <TableCell :colspan="detailColspan">
                  <div
                    class="nds-stack"
                    data-spacing="sm"
                  >
                    <p class="nds-text-muted-foreground">
                      {{ tContent('demonstration.labels.detailText') }}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      :aria-label="`${tContent('demonstration.labels.receiptLabel')} ${row.id}`"
                    >
                      {{ tContent('demonstration.labels.receipt') }}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
      </template>
    </DocsVariants>

    <!-- ── Composições ────────────────────────────────────────────── -->
    <DocsCompositions
      :use-when-label="tNav('common.useWhen')"
      component-slug="table"
      :items="compositionItems"
    >
      <!-- Toolbar de filtros -->
      <template #variant-preview-0>
        <div
          class="nds-w-full nds-stack"
          data-spacing="sm"
        >
          <div
            class="nds-cluster"
            data-align="center"
            data-spacing="md"
          >
            <div
              class="nds-w-full nds-max-w-sm"
              style="position: relative"
            >
              <Search
                class="nds-icon-input-start nds-icon nds-text-muted-foreground"
                aria-hidden="true"
              />
              <!-- `nds-pl-8` e não `padding-left` inline: o inline era contorno
                   de um defeito de cascata já consertado — `spacing.css` passou
                   a ser importada depois de `input.css`, e a utilitária vence o
                   empate. Valor de desenho cravado no atributo `style` deixa o
                   tema, a densidade e a escala de tipo para trás.

                   O `aria-label` espelha o placeholder porque placeholder NÃO é
                   nome acessível: ele some ao digitar, e o campo passaria a ser
                   um controle mudo justo quando tem conteúdo. Mesma forma do
                   campo de filtro do DataTable. -->
              <Input
                :aria-label="tContent('demonstration.labels.filterLabel')"
                placeholder="Filtrar faturas..."
                class="nds-pl-8"
              />
            </div>
            <Button variant="outline">
              Status
            </Button>
          </div>
          <Table>
            <TableCaption class="nds-sr-only">
              Lista de faturas filtráveis
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">
                  Fatura
                </TableHead>
                <TableHead scope="col">
                  Status
                </TableHead>
                <TableHead
                  scope="col"
                  class="nds-text-right"
                >
                  Valor
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell class="nds-font-medium">
                  #INV-001
                </TableCell>
                <TableCell>Pago</TableCell>
                <TableCell class="nds-text-right">
                  R$ 250,00
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell class="nds-font-medium">
                  #INV-002
                </TableCell>
                <TableCell>Pendente</TableCell>
                <TableCell class="nds-text-right">
                  R$ 150,00
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </template>
      <!-- Cabeçalhos ordenáveis -->
      <template #variant-preview-1>
        <Table>
          <TableCaption class="nds-sr-only">
            Faturas ordenáveis
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead
                scope="col"
                aria-sort="ascending"
              >
                <Button
                  variant="ghost"
                  size="sm"
                >
                  Fatura
                  <ArrowUpDown
                    class="nds-ml-2 nds-icon"
                    aria-hidden="true"
                  />
                </Button>
              </TableHead>
              <TableHead
                scope="col"
                aria-sort="none"
              >
                <Button
                  variant="ghost"
                  size="sm"
                >
                  Status
                  <ArrowUpDown
                    class="nds-ml-2 nds-icon"
                    aria-hidden="true"
                  />
                </Button>
              </TableHead>
              <TableHead
                scope="col"
                aria-sort="none"
                class="nds-text-right"
              >
                <Button
                  variant="ghost"
                  size="sm"
                >
                  Valor
                  <ArrowUpDown
                    class="nds-ml-2 nds-icon"
                    aria-hidden="true"
                  />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="nds-font-medium">
                #INV-001
              </TableCell>
              <TableCell>Pago</TableCell>
              <TableCell class="nds-text-right">
                R$ 250,00
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="nds-font-medium">
                #INV-002
              </TableCell>
              <TableCell>Pendente</TableCell>
              <TableCell class="nds-text-right">
                R$ 150,00
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
      <!-- Seleção de linhas -->
      <template #variant-preview-2>
        <Table>
          <TableCaption class="nds-sr-only">
            Faturas com seleção
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead
                scope="col"
              >
                <!-- O nome acessível é texto de tela: sai do dicionário, nos
                     três idiomas, como o rótulo de qualquer coluna. -->
                <Checkbox :aria-label="tContent('demonstration.labels.selectAll')" />
              </TableHead>
              <TableHead scope="col">
                Fatura
              </TableHead>
              <TableHead scope="col">
                Status
              </TableHead>
              <TableHead
                scope="col"
                class="nds-text-right"
              >
                Valor
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow data-state="selected">
              <TableCell>
                <!-- Prefixo do dicionário MAIS o identificador do registro: sem
                     ele, duas caixas na mesma tabela teriam o mesmo nome e
                     nenhuma diria de qual fatura é. -->
                <Checkbox
                  :model-value="true"
                  :aria-label="`${tContent('demonstration.labels.selectRow')} ${tContent('demonstration.labels.inv001')}`"
                />
              </TableCell>
              <TableCell class="nds-font-medium">
                #INV-001
              </TableCell>
              <TableCell>Pago</TableCell>
              <TableCell class="nds-text-right">
                R$ 250,00
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Checkbox :aria-label="`${tContent('demonstration.labels.selectRow')} ${tContent('demonstration.labels.inv002')}`" />
              </TableCell>
              <TableCell class="nds-font-medium">
                #INV-002
              </TableCell>
              <TableCell>Pendente</TableCell>
              <TableCell class="nds-text-right">
                R$ 150,00
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
      <!-- Com paginação -->
      <template #variant-preview-3>
        <div
          class="nds-w-full nds-stack"
          data-spacing="sm"
        >
          <Table>
            <TableCaption class="nds-sr-only">
              Faturas paginadas
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">
                  Fatura
                </TableHead>
                <TableHead scope="col">
                  Status
                </TableHead>
                <TableHead
                  scope="col"
                  class="nds-text-right"
                >
                  Valor
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell class="nds-font-medium">
                  #INV-001
                </TableCell>
                <TableCell>Pago</TableCell>
                <TableCell class="nds-text-right">
                  R$ 250,00
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell class="nds-font-medium">
                  #INV-002
                </TableCell>
                <TableCell>Pendente</TableCell>
                <TableCell class="nds-text-right">
                  R$ 150,00
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  href="#"
                  :is-active="true"
                >
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </template>
    </DocsCompositions>

    <!-- ── Estados ────────────────────────────────────────────────── -->
    <DocsStates
      :cols="{
        state: tContent('states.cols.state'),
        trigger: toPlainText(tContent('states.cols.trigger')),
        behavior: toPlainText(tContent('states.cols.behavior')),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :tables="[
        { title: tContent('props.tableTitle'), cols: propCols, items: tablePropItems },
        { title: tContent('props.tableHeadTitle'), cols: propCols, items: tableHeadPropItems },
        { title: tContent('props.tableCellTitle'), cols: propCols, items: tableCellPropItems },
        { title: tContent('props.tableRowTitle'), cols: propCols, items: tableRowPropItems },
        { title: 'TableEmpty', cols: propCols, items: tableEmptyPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :cols="{
        token: tContent('tokens.table.token'),
        value: tContent('tokens.table.part'),
        description: tContent('tokens.table.description'),
      }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="codeCustomizationTokens"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
      :summary="tContent('accessibility.summary')"
      :keyboard-title="tNav('nav.accessibility')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated
      :items="relatedItems"
      component-slug="table"
    />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes
      :items="noteItems"
      component-slug="table"
    />

    <!-- ── Analytics ─────────────────────────────────────────────── -->
    <DocsAnalytics
      :description="tContent('analytics.description')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: toPlainText(tContent('analytics.table.trigger')),
        payload: tContent('analytics.table.payload'),
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ─────────────────────────────────────────────────── -->
    <DocsTestes
      :functional="{
        title: tContent('testes.functional.title'),
        cols: { action: tNav('common.userAction'), result: tNav('common.expectedResult'), priority: tNav('common.priority') },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        cols: a11yCritCols,
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
