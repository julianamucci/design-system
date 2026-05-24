<script lang="ts">
  import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
  import { Button } from '@/components/ui/button';
  import { Skeleton } from '@/components/ui/skeleton';
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
  import { ArrowUpDown, Search } from 'lucide-svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import tableTranslations from '@shared/content/table/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(tableTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'table',
    });
    track('docs_page_view', {
      component_name: 'table',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────


  const NAV_GROUPS = $derived.by(() => {
    const tNav = $tNavStore;
    return [
      { label: tNav('nav.overview'), sections: [
        { id: 'demonstracao', label: tNav('nav.demonstration') },
        { id: 'anatomia',     label: tNav('nav.anatomy')       },
        { id: 'quando-usar',  label: tNav('nav.usage')         },
        { id: 'do-dont',      label: tNav('nav.doDont')        },
      ]},
      { label: tNav('nav.techRef'), sections: [
        { id: 'importacao',   label: tNav('nav.import')   },
        { id: 'variantes',    label: tNav('nav.variants') },
        { id: 'composicoes',  label: tNav('nav.compositions') },
        { id: 'estados',      label: tNav('nav.states')   },
        { id: 'propriedades', label: tNav('nav.props')    },
        { id: 'tokens',       label: tNav('nav.tokens')   },
      ]},
      { label: tNav('nav.context'), sections: [
        { id: 'acessibilidade', label: tNav('nav.accessibility') },
        { id: 'relacionados',   label: tNav('nav.related')       },
        { id: 'notas',          label: tNav('nav.notes')         },
      ]},
      { label: tNav('nav.quality'), sections: [
        { id: 'analytics', label: tNav('nav.analytics') },
        { id: 'testes',    label: tNav('nav.testes')    },
      ]},
    ];
  });

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'table', locale: $locale });
  });
  $effect(() => section.attach());

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function stripHtml(s: string) {
    return s.replace(/<[^>]*>/g, '');
  }

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Demo data ───────────────────────────────────────────────────────────────

  const invoices = [
    { id: '#INV-001', status: 'paid',     method: 'creditCard',    amount: 'amount001' },
    { id: '#INV-002', status: 'pending',  method: 'creditCard',    amount: 'amount002' },
    { id: '#INV-003', status: 'canceled', method: 'pix',           amount: 'amount003' },
    { id: '#INV-004', status: 'paid',     method: 'creditCard',    amount: 'amount004' },
    { id: '#INV-005', status: 'pending',  method: 'bankTransfer',  amount: 'amount005' },
  ];

  const invoiceIds = ['inv001', 'inv002', 'inv003', 'inv004', 'inv005'] as const;

  const skeletonRows = [1, 2, 3, 4, 5];

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImport = `import {
  Table, TableHeader, TableBody, TableFooter,
  TableRow, TableHead, TableCell, TableCaption,
} from "@/components/ui/table";`;

  const codeBasic = `<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Método</TableHead>
      <TableHead scope="col" class="text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each invoices as invoice (invoice.id)}
      <TableRow>
        <TableCell class="font-medium">{invoice.id}</TableCell>
        <TableCell>{invoice.status}</TableCell>
        <TableCell>{invoice.method}</TableCell>
        <TableCell class="text-right">{invoice.amount}</TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>`;

  const codeWithFooter = `<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Método</TableHead>
      <TableHead scope="col" class="text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each invoices as invoice (invoice.id)}
      <TableRow>
        <TableCell class="font-medium">{invoice.id}</TableCell>
        <TableCell>{invoice.status}</TableCell>
        <TableCell>{invoice.method}</TableCell>
        <TableCell class="text-right">{invoice.amount}</TableCell>
      </TableRow>
    {/each}
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colspan={3}>Total</TableCell>
      <TableCell class="text-right">R$ 1.000,00</TableCell>
    </TableRow>
  </TableFooter>
</Table>`;

  const codeSrOnlyCaption = `<Table>
  <!-- Caption visualmente oculto — título já está acima -->
  <TableCaption class="sr-only">Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <!-- ... -->
    </TableRow>
  </TableHeader>
  <TableBody>
    <!-- ... -->
  </TableBody>
</Table>`;

  const codeInlineActions = `<Table>
  <TableCaption>Lista de faturas recentes</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <!-- ... -->
      <TableHead scope="col">Ações</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each invoices as invoice (invoice.id)}
      <TableRow>
        <TableCell class="font-medium">{invoice.id}</TableCell>
        <!-- ... -->
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Ações para fatura {invoice.id}"
          >
            &hellip;
          </Button>
        </TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>`;

  const codeEmptyState = `<TableBody>
  {#if invoices.length === 0}
    <TableRow>
      <TableCell colspan={4} class="h-24 text-center text-muted-foreground">
        Nenhuma fatura encontrada.
      </TableCell>
    </TableRow>
  {:else}
    {#each invoices as invoice (invoice.id)}
      <TableRow><!-- ... --></TableRow>
    {/each}
  {/if}
</TableBody>`;

  const codeSelected = `<TableRow data-state={isSelected ? 'selected' : undefined}>
  <!-- ... -->
</TableRow>`;

  const codeLoading = `<TableBody>
  {#each skeletonRows as row (row)}
    <TableRow>
      <TableCell><Skeleton class="h-4 w-20" /></TableCell>
      <TableCell><Skeleton class="h-4 w-16" /></TableCell>
      <TableCell><Skeleton class="h-4 w-32" /></TableCell>
      <TableCell><Skeleton class="h-4 w-16 ml-auto" /></TableCell>
    </TableRow>
  {/each}
</TableBody>`;

  const codeTokenCustomization = `/* Em globals.css — sobrescrever tokens semânticos */
:root {
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
}

.dark {
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
}`;

  const interfaceCode = `// Table — todos os subcomponentes aceitam class e ...restProps
interface TableProps {
  class?: string;
  children?: Snippet;
}

interface TableHeadProps {
  scope: 'col' | 'row';  // obrigatório
  class?: string;
  children?: Snippet;
}

interface TableCellProps {
  colspan?: number;
  rowspan?: number;
  class?: string;
  children?: Snippet;
}

interface TableRowProps {
  'data-state'?: 'selected';
  class?: string;
  children?: Snippet;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value}>
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add table"
    />
  {/snippet}

      <!-- ── Demonstração ───────────────────────────────────────────── -->
      <DocsDemonstration title={$tStore('demonstration.title')}>
        {#snippet children()}
          <Table>
            <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
                <TableHead scope="col">{$tStore('demonstration.labels.status')}</TableHead>
                <TableHead scope="col">{$tStore('demonstration.labels.method')}</TableHead>
                <TableHead scope="col" class="text-right">{$tStore('demonstration.labels.amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each invoiceIds as key, i (key)}
                <TableRow>
                  <TableCell class="font-medium">{$tStore(`demonstration.labels.${key}`)}</TableCell>
                  <TableCell>{$tStore(`demonstration.labels.${invoices[i].status}`)}</TableCell>
                  <TableCell>{$tStore(`demonstration.labels.${invoices[i].method}`)}</TableCell>
                  <TableCell class="text-right">{$tStore(`demonstration.labels.${invoices[i].amount}`)}</TableCell>
                </TableRow>
              {/each}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colspan={3}>{$tStore('demonstration.labels.total')}</TableCell>
                <TableCell class="text-right">{$tStore('demonstration.labels.totalAmount')}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        {/snippet}
      </DocsDemonstration>

      <!-- ── Anatomia ───────────────────────────────────────────────── -->
      <DocsAnatomy
        title={$tStore('anatomy.title')}
        items={[
          $tStore('anatomy.item1'),
          $tStore('anatomy.item2'),
          $tStore('anatomy.item3'),
          $tStore('anatomy.item4'),
          $tStore('anatomy.item5'),
          $tStore('anatomy.item6'),
          $tStore('anatomy.item7'),
          $tStore('anatomy.item8'),
        ]}
        structureLabel={$tStore('anatomy.structureLabel')}
        structureCode={$tStore('anatomy.structureCode')}
      />

      <!-- ── Quando Usar ────────────────────────────────────────────── -->
      <DocsWhenToUse
        title={$tStore('usage.title')}
        guidelines={{
          title: $tStore('usage.guidelines.title'),
          items: [
            $tStore('usage.guidelines.item1'),
            $tStore('usage.guidelines.item2'),
            $tStore('usage.guidelines.item3'),
            $tStore('usage.guidelines.item4'),
            $tStore('usage.guidelines.item5'),
          ],
        }}
        scenarios={{
          title: $tStore('usage.scenarios.title'),
          cols: {
            scenario: $tStore('usage.scenarios.cols.scenario'),
            use: $tStore('usage.scenarios.cols.use'),
            alternative: $tStore('usage.scenarios.cols.alternative'),
          },
          items: [
            { s: $tStore('usage.scenarios.item1.s'), u: $tStore('usage.scenarios.item1.u'), a: $tStore('usage.scenarios.item1.a') },
            { s: $tStore('usage.scenarios.item2.s'), u: $tStore('usage.scenarios.item2.u'), a: $tStore('usage.scenarios.item2.a') },
            { s: $tStore('usage.scenarios.item3.s'), u: $tStore('usage.scenarios.item3.u'), a: $tStore('usage.scenarios.item3.a') },
            { s: $tStore('usage.scenarios.item4.s'), u: $tStore('usage.scenarios.item4.u'), a: $tStore('usage.scenarios.item4.a') },
            { s: $tStore('usage.scenarios.item5.s'), u: $tStore('usage.scenarios.item5.u'), a: $tStore('usage.scenarios.item5.a') },
          ],
        }}
        uxWriting={{
          title: $tStore('usage.uxWriting.title'),
          cols: {
            element: $tStore('usage.uxWriting.table.element'),
            rules: $tStore('usage.uxWriting.table.rules'),
            do: $tStore('usage.uxWriting.table.correct'),
            dont: $tStore('usage.uxWriting.table.avoid'),
          },
          items: [
            { element: $tStore('usage.uxWriting.table.caption.name'),     rules: $tStore('usage.uxWriting.table.caption.format'),     do: $tStore('usage.uxWriting.table.caption.good'),     dont: $tStore('usage.uxWriting.table.caption.bad')     },
            { element: $tStore('usage.uxWriting.table.head.name'),        rules: $tStore('usage.uxWriting.table.head.format'),        do: $tStore('usage.uxWriting.table.head.good'),        dont: $tStore('usage.uxWriting.table.head.bad')        },
            { element: $tStore('usage.uxWriting.table.emptyState.name'),  rules: $tStore('usage.uxWriting.table.emptyState.format'),  do: $tStore('usage.uxWriting.table.emptyState.good'),  dont: $tStore('usage.uxWriting.table.emptyState.bad')  },
            { element: $tStore('usage.uxWriting.table.actionLabel.name'), rules: $tStore('usage.uxWriting.table.actionLabel.format'), do: $tStore('usage.uxWriting.table.actionLabel.good'), dont: $tStore('usage.uxWriting.table.actionLabel.bad') },
          ],
        }}
        do={{
          title: $tStore('usage.do.title'),
          items: [
            $tStore('usage.do.item1'),
            $tStore('usage.do.item2'),
            $tStore('usage.do.item3'),
            $tStore('usage.do.item4'),
          ],
        }}
        dont={{
          title: $tStore('usage.dont.title'),
          items: [
            $tStore('usage.dont.item1'),
            $tStore('usage.dont.item2'),
            $tStore('usage.dont.item3'),
          ],
        }}
      />

      <!-- ── Do & Don't ─────────────────────────────────────────────── -->
      <DocsDoDont
        title={$tStore('doDont.title')}
        pairs={[
          {
            doLabel: $tNavStore('common.do'),
            dontLabel: $tNavStore('common.dont'),
            doCaption: $tStore('doDont.pair1.do'),
            dontCaption: $tStore('doDont.pair1.dont'),
            doPreview: doPair1,
            dontPreview: dontPair1,
          },
          {
            doLabel: $tNavStore('common.do'),
            dontLabel: $tNavStore('common.dont'),
            doCaption: $tStore('doDont.pair2.do'),
            dontCaption: $tStore('doDont.pair2.dont'),
            doPreview: doPair2,
            dontPreview: dontPair2,
          },
        ]}
      />

      {#snippet doPair1()}
        <Table>
          <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="font-medium">#INV-001</TableCell>
              <TableCell>R$ 250,00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      {/snippet}
      {#snippet dontPair1()}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fatura</TableHead>
              <TableHead>Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>#INV-001</TableCell>
              <TableCell>R$ 250,00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      {/snippet}
      {#snippet doPair2()}
        <Table>
          <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colspan={2} class="h-24 text-center text-muted-foreground">
                {$tStore('demonstration.labels.emptyState')}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      {/snippet}
      {#snippet dontPair2()}
        <Table>
          <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <!-- tabela vazia sem mensagem -->
          </TableBody>
        </Table>
      {/snippet}

      <!-- ── Importação ─────────────────────────────────────────────── -->
      <DocsImport
        title={$tStore('import.title')}
        code={codeImport}
      />

      <!-- ── Variantes ──────────────────────────────────────────────── -->
      <DocsVariants
        title={$tStore('variants.title')}
        items={[
          { name: $tStore('variants.basic.label'),            description: stripHtml($tStore('variants.basic.description')),            code: codeBasic,          preview: variantBasic          },
          { name: $tStore('variants.withFooter.label'),       description: stripHtml($tStore('variants.withFooter.description')),       code: codeWithFooter,     preview: variantWithFooter     },
          { name: $tStore('variants.withSrOnlyCaption.label'),description: stripHtml($tStore('variants.withSrOnlyCaption.description')),code: codeSrOnlyCaption,  preview: variantSrOnlyCaption  },
          { name: $tStore('variants.withInlineActions.label'),description: stripHtml($tStore('variants.withInlineActions.description')),code: codeInlineActions,  preview: variantInlineActions  },
          { name: $tStore('variants.withEmptyState.label'),   description: stripHtml($tStore('variants.withEmptyState.description')),   code: codeEmptyState,     preview: variantEmptyState     },
        ]}
      />

      {#snippet variantBasic()}
        <Table>
          <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.status')}</TableHead>
              <TableHead scope="col" class="text-right">{$tStore('demonstration.labels.amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="font-medium">#INV-001</TableCell>
              <TableCell>{$tStore('demonstration.labels.paid')}</TableCell>
              <TableCell class="text-right">{$tStore('demonstration.labels.amount001')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-medium">#INV-002</TableCell>
              <TableCell>{$tStore('demonstration.labels.pending')}</TableCell>
              <TableCell class="text-right">{$tStore('demonstration.labels.amount002')}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      {/snippet}

      {#snippet variantWithFooter()}
        <Table>
          <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.status')}</TableHead>
              <TableHead scope="col" class="text-right">{$tStore('demonstration.labels.amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="font-medium">#INV-001</TableCell>
              <TableCell>{$tStore('demonstration.labels.paid')}</TableCell>
              <TableCell class="text-right">{$tStore('demonstration.labels.amount001')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-medium">#INV-002</TableCell>
              <TableCell>{$tStore('demonstration.labels.pending')}</TableCell>
              <TableCell class="text-right">{$tStore('demonstration.labels.amount002')}</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colspan={2}>{$tStore('demonstration.labels.total')}</TableCell>
              <TableCell class="text-right">{$tStore('demonstration.labels.totalAmount')}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      {/snippet}

      {#snippet variantSrOnlyCaption()}
        <div>
          <p class="text-sm font-medium mb-2">{$tStore('demonstration.labels.caption')}</p>
          <Table>
            <TableCaption class="sr-only">{$tStore('demonstration.labels.caption')}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
                <TableHead scope="col">{$tStore('demonstration.labels.status')}</TableHead>
                <TableHead scope="col" class="text-right">{$tStore('demonstration.labels.amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell class="font-medium">#INV-001</TableCell>
                <TableCell>{$tStore('demonstration.labels.paid')}</TableCell>
                <TableCell class="text-right">{$tStore('demonstration.labels.amount001')}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      {/snippet}

      {#snippet variantInlineActions()}
        <Table>
          <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.status')}</TableHead>
              <TableHead scope="col" class="text-right">{$tStore('demonstration.labels.amount')}</TableHead>
              <TableHead scope="col" class="w-[80px]">{$tStore('demonstration.labels.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each invoiceIds.slice(0, 3) as key, i (key)}
              <TableRow>
                <TableCell class="font-medium">{$tStore(`demonstration.labels.${key}`)}</TableCell>
                <TableCell>{$tStore(`demonstration.labels.${invoices[i].status}`)}</TableCell>
                <TableCell class="text-right">{$tStore(`demonstration.labels.${invoices[i].amount}`)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`${$tStore('demonstration.labels.actionsLabel')} ${$tStore(`demonstration.labels.${key}`)}`}
                  >
                    &hellip;
                  </Button>
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      {/snippet}

      {#snippet variantEmptyState()}
        <Table>
          <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.status')}</TableHead>
              <TableHead scope="col">{$tStore('demonstration.labels.method')}</TableHead>
              <TableHead scope="col" class="text-right">{$tStore('demonstration.labels.amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colspan={4} class="h-24 text-center text-muted-foreground">
                {$tStore('demonstration.labels.emptyState')}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      {/snippet}

      <!-- ── Composições ──────────────────────────────────────────────── -->
      <DocsCompositions
        title={$tStore('variants.compositionsTitle')}
        useWhenLabel={$tNavStore('common.useWhen')}
        componentSlug="table"
        items={[
          {
            name: $tStore('variants.compositions.filterableToolbar.name'),
            description: $tStore('variants.compositions.filterableToolbar.description'),
            useWhen: $tStore('variants.compositions.filterableToolbar.use'),
            code: `<div class="flex flex-col gap-3">
  <div class="flex items-center gap-2">
    <Input placeholder="Filtrar faturas..." />
    <Button variant="outline">Status</Button>
  </div>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead scope="col">Fatura</TableHead>
        <TableHead scope="col">Status</TableHead>
        <TableHead scope="col" class="text-right">Valor</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#each filtered as invoice (invoice.id)}
        <TableRow>
          <TableCell>{invoice.id}</TableCell>
          <TableCell>{invoice.status}</TableCell>
          <TableCell class="text-right">{invoice.amount}</TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>
</div>`,
            preview: compFilterableToolbar,
          },
          {
            name: $tStore('variants.compositions.sortableHeaders.name'),
            description: $tStore('variants.compositions.sortableHeaders.description'),
            useWhen: $tStore('variants.compositions.sortableHeaders.use'),
            code: `<TableHead scope="col" aria-sort="ascending">
  <Button variant="ghost" size="sm" class="-ml-2">
    Fatura
    <ArrowUpDown class="ml-2 h-4 w-4" aria-hidden="true" />
  </Button>
</TableHead>`,
            preview: compSortableHeaders,
          },
          {
            name: $tStore('variants.compositions.selectableRows.name'),
            description: $tStore('variants.compositions.selectableRows.description'),
            useWhen: $tStore('variants.compositions.selectableRows.use'),
            code: `<TableRow data-state={selected.has(invoice.id) ? 'selected' : undefined}>
  <TableCell>
    <Checkbox
      checked={selected.has(invoice.id)}
      onCheckedChange={(c) => toggle(invoice.id, c)}
      aria-label={\`Selecionar fatura \${invoice.id}\`}
    />
  </TableCell>
  <TableCell>{invoice.id}</TableCell>
  <TableCell>{invoice.status}</TableCell>
</TableRow>`,
            preview: compSelectableRows,
          },
          {
            name: $tStore('variants.compositions.withPagination.name'),
            description: $tStore('variants.compositions.withPagination.description'),
            useWhen: $tStore('variants.compositions.withPagination.use'),
            code: `<div class="flex flex-col gap-3">
  <Table><!-- linhas --></Table>
  <Pagination>
    <PaginationContent>
      <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
      <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
      <PaginationItem><PaginationLink href="#">2</PaginationLink></PaginationItem>
      <PaginationItem><PaginationNext href="#" /></PaginationItem>
    </PaginationContent>
  </Pagination>
</div>`,
            preview: compWithPagination,
          },
        ]}
      />

      {#snippet compFilterableToolbar()}
        <div class="w-full flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <div class="relative w-full max-w-sm">
              <Search class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input placeholder="Filtrar faturas..." class="pl-8" />
            </div>
            <Button variant="outline">Status</Button>
          </div>
          <Table>
            <TableCaption class="sr-only">Lista de faturas filtráveis</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Fatura</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" class="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell class="font-medium">#INV-001</TableCell>
                <TableCell>Pago</TableCell>
                <TableCell class="text-right">R$ 250,00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell class="font-medium">#INV-002</TableCell>
                <TableCell>Pendente</TableCell>
                <TableCell class="text-right">R$ 150,00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      {/snippet}

      {#snippet compSortableHeaders()}
        <Table>
          <TableCaption class="sr-only">Faturas ordenáveis</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" aria-sort="ascending">
                <Button variant="ghost" size="sm" class="-ml-2 h-8">
                  Fatura
                  <ArrowUpDown class="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </TableHead>
              <TableHead scope="col" aria-sort="none">
                <Button variant="ghost" size="sm" class="-ml-2 h-8">
                  Status
                  <ArrowUpDown class="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </TableHead>
              <TableHead scope="col" aria-sort="none" class="text-right">
                <Button variant="ghost" size="sm" class="-ml-2 h-8">
                  Valor
                  <ArrowUpDown class="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="font-medium">#INV-001</TableCell>
              <TableCell>Pago</TableCell>
              <TableCell class="text-right">R$ 250,00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-medium">#INV-002</TableCell>
              <TableCell>Pendente</TableCell>
              <TableCell class="text-right">R$ 150,00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      {/snippet}

      {#snippet compSelectableRows()}
        <Table>
          <TableCaption class="sr-only">Faturas com seleção</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" class="w-10">
                <Checkbox aria-label="Selecionar todas as linhas" />
              </TableHead>
              <TableHead scope="col">Fatura</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col" class="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow data-state="selected">
              <TableCell>
                <Checkbox checked aria-label="Selecionar fatura #INV-001" />
              </TableCell>
              <TableCell class="font-medium">#INV-001</TableCell>
              <TableCell>Pago</TableCell>
              <TableCell class="text-right">R$ 250,00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Checkbox aria-label="Selecionar fatura #INV-002" />
              </TableCell>
              <TableCell class="font-medium">#INV-002</TableCell>
              <TableCell>Pendente</TableCell>
              <TableCell class="text-right">R$ 150,00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      {/snippet}

      {#snippet compWithPagination()}
        <div class="w-full flex flex-col gap-3">
          <Table>
            <TableCaption class="sr-only">Faturas paginadas</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Fatura</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" class="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell class="font-medium">#INV-001</TableCell>
                <TableCell>Pago</TableCell>
                <TableCell class="text-right">R$ 250,00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell class="font-medium">#INV-002</TableCell>
                <TableCell>Pendente</TableCell>
                <TableCell class="text-right">R$ 150,00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Pagination count={20} perPage={5}>
            {#snippet children({ pages, currentPage })}
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious />
                </PaginationItem>
                {#each pages as page (page.key)}
                  {#if page.type === 'ellipsis'}
                    <PaginationItem>...</PaginationItem>
                  {:else}
                    <PaginationItem>
                      <PaginationLink {page} isActive={currentPage === page.value}>
                        {page.value}
                      </PaginationLink>
                    </PaginationItem>
                  {/if}
                {/each}
                <PaginationItem>
                  <PaginationNext />
                </PaginationItem>
              </PaginationContent>
            {/snippet}
          </Pagination>
        </div>
      {/snippet}

      <!-- ── Estados ────────────────────────────────────────────────── -->
      <DocsStates
        title={$tStore('states.title')}
        cols={{
          state: $tStore('states.cols.state'),
          trigger: $tStore('states.cols.trigger'),
          behavior: $tStore('states.cols.behavior'),
        }}
        items={[
          { label: $tStore('states.empty.label'),    trigger: stripHtml($tStore('states.empty.trigger')),    behavior: $tStore('states.empty.behavior')    },
          { label: $tStore('states.selected.label'), trigger: stripHtml($tStore('states.selected.trigger')), behavior: $tStore('states.selected.behavior') },
          { label: $tStore('states.loading.label'),  trigger: stripHtml($tStore('states.loading.trigger')),  behavior: $tStore('states.loading.behavior')  },
        ]}
      />

      <!-- ── Propriedades ───────────────────────────────────────────── -->
      <DocsProps
        title={$tStore('props.title')}
        tables={[
          {
            title: $tStore('props.tableTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.items.className') },
              { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Não', description: $tStore('props.items.children')  },
            ],
          },
          {
            title: $tStore('props.tableHeadTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'scope',    type: '"col" | "row"', defaultValue: '—',   required: 'Sim', description: $tStore('props.items.scope')    },
              { name: 'class',    type: 'string',        defaultValue: '—',   required: 'Não', description: $tStore('props.items.className') },
              { name: 'children', type: 'Snippet',       defaultValue: '—',   required: 'Não', description: $tStore('props.items.children')  },
            ],
          },
          {
            title: $tStore('props.tableCellTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'colspan',  type: 'number',  defaultValue: '—', required: 'Não', description: $tStore('props.items.colSpan')   },
              { name: 'rowspan',  type: 'number',  defaultValue: '—', required: 'Não', description: $tStore('props.items.rowSpan')   },
              { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.items.className') },
              { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Não', description: $tStore('props.items.children')  },
            ],
          },
          {
            title: $tStore('props.tableRowTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'data-state', type: '"selected" | undefined', defaultValue: '—', required: 'Não', description: $tStore('props.items.dataState') },
              { name: 'class',      type: 'string',                 defaultValue: '—', required: 'Não', description: $tStore('props.items.className') },
              { name: 'children',   type: 'Snippet',                defaultValue: '—', required: 'Não', description: $tStore('props.items.children')  },
            ],
          },
          {
            title: $tStore('props.tableCaptionTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.items.className') },
              { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Sim', description: $tStore('props.items.children')  },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={$tStore('props.extensibilityTitle')}
        extensibilityNotes={$tStore('props.extensibility')}
      />

      <!-- ── Tokens ─────────────────────────────────────────────────── -->
      <DocsTokens
        title={$tStore('tokens.title')}
        cols={{
          token: $tStore('tokens.table.token'),
          value: $tStore('tokens.table.part'),
          description: $tStore('tokens.table.description'),
        }}
        items={[
          { token: 'border-b',                          value: 'TableHeader / TableBody', description: $tStore('tokens.items.borderB')          },
          { token: 'bg-muted/50',                       value: 'TableFooter / TableRow',  description: $tStore('tokens.items.bgMuted')           },
          { token: 'data-[state=selected]:bg-muted',    value: 'TableRow',                description: $tStore('tokens.items.bgMutedSelected')   },
          { token: 'text-muted-foreground',             value: 'TableCaption',            description: $tStore('tokens.items.textMuted')         },
          { token: 'font-medium',                       value: 'TableHead / TableFooter', description: $tStore('tokens.items.fontMedium')        },
          { token: 'h-10',                              value: 'TableHead',               description: $tStore('tokens.items.h10')               },
          { token: 'p-2',                               value: 'TableCell',               description: $tStore('tokens.items.p2')                },
          { token: 'caption-bottom',                    value: 'Table',                   description: $tStore('tokens.items.captionBottom')     },
        ]}
        customizationTitle={$tStore('tokens.customizationTitle')}
        customizationCode={codeTokenCustomization}
      />

      <!-- ── Acessibilidade ─────────────────────────────────────────── -->
      <DocsAccessibility
        title={$tStore('accessibility.title')}
        summary={$tStore('accessibility.summary')}
        items={[
          $tStore('accessibility.aria.scope'),
          $tStore('accessibility.aria.caption'),
          $tStore('accessibility.aria.ariaLabel'),
          $tStore('accessibility.aria.ariaSort'),
          $tStore('accessibility.aria.tabIndex'),
        ]}
        keyboardTitle="Navegação por teclado"
        keyboardItems={[
          { key: 'Tab',   description: $tStore('accessibility.keyboard.tab')        },
          { key: 'Enter', description: $tStore('accessibility.keyboard.enter')      },
          { key: 'Space', description: $tStore('accessibility.keyboard.space')      },
          { key: '—',     description: $tStore('accessibility.keyboard.noKeyboard') },
        ]}
      />

      <!-- ── Relacionados ───────────────────────────────────────────── -->
      <DocsRelated
        title={$tStore('related.title')}
        items={[
          { name: 'Avatar',        description: $tStore('related.avatar'),       path: '?path=/docs/ui-avatar--docs'       },
          { name: 'Badge',         description: $tStore('related.badge'),        path: '?path=/docs/ui-badge--docs'        },
          { name: 'Pagination',    description: $tStore('related.pagination'),   path: '?path=/docs/ui-pagination--docs'   },
          { name: 'Skeleton',      description: $tStore('related.skeleton'),     path: '?path=/docs/ui-skeleton--docs'     },
          { name: 'DropdownMenu',  description: $tStore('related.dropdownMenu'), path: '?path=/docs/ui-dropdownmenu--docs' },
        ]}
      />

      <!-- ── Notas ──────────────────────────────────────────────────── -->
      <DocsNotes
        title={$tStore('notes.title')}
        items={[
          { title: '', content: $tStore('notes.tip1') },
          { title: '', content: $tStore('notes.tip2') },
          { title: '', content: $tStore('notes.tip3') },
          { title: '', content: $tStore('notes.tip4') },
          { title: '', content: $tStore('notes.tip5') },
        ]}
      />

      <!-- ── Analytics ─────────────────────────────────────────────── -->
      <DocsAnalytics
        title={$tStore('analytics.title')}
        cols={{
          event: $tStore('analytics.table.event'),
          trigger: $tStore('analytics.table.trigger'),
          payload: $tStore('analytics.table.payload'),
        }}
        items={[
          { event: $tStore('analytics.table.pageView'),      trigger: $tStore('analytics.table.pageViewTrigger'),      payload: $tStore('analytics.table.pageViewPayload')      },
          { event: $tStore('analytics.table.sectionViewed'), trigger: $tStore('analytics.table.sectionViewedTrigger'), payload: $tStore('analytics.table.sectionViewedPayload') },
          { event: $tStore('analytics.table.langSwitch'),    trigger: $tStore('analytics.table.langSwitchTrigger'),    payload: $tStore('analytics.table.langSwitchPayload')    },
        ]}
      />

      <!-- ── Testes ─────────────────────────────────────────────────── -->
      <DocsTestes
        title={$tStore('testes.title')}
        functional={{
          title: $tStore('testes.functional.title'),
          cols: {
            action: $tNavStore('common.userAction'),
            result: $tNavStore('common.expectedResult'),
            priority: $tNavStore('common.priority'),
          },
          items: [
            { action: $tStore('testes.functional.item1.action'), result: $tStore('testes.functional.item1.result'), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item2.action'), result: $tStore('testes.functional.item2.result'), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item3.action'), result: $tStore('testes.functional.item3.result'), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item4.action'), result: $tStore('testes.functional.item4.result'), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item5.action'), result: $tStore('testes.functional.item5.result'), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item6.action'), result: $tStore('testes.functional.item6.result'), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
          ],
        }}
        accessibility={{
          title: $tStore('testes.accessibility.title'),
          cols: {
            criterion: $tNavStore('common.criterion'),
            level: 'WCAG',
            how: $tNavStore('common.howToVerify'),
          },
          items: [
            { criterion: $tStore('testes.accessibility.item1.criterion'), level: $tStore('testes.accessibility.item1.level'), how: $tStore('testes.accessibility.item1.how') },
            { criterion: $tStore('testes.accessibility.item2.criterion'), level: $tStore('testes.accessibility.item2.level'), how: $tStore('testes.accessibility.item2.how') },
            { criterion: $tStore('testes.accessibility.item3.criterion'), level: $tStore('testes.accessibility.item3.level'), how: $tStore('testes.accessibility.item3.how') },
            { criterion: $tStore('testes.accessibility.item4.criterion'), level: $tStore('testes.accessibility.item4.level'), how: $tStore('testes.accessibility.item4.how') },
          ],
        }}
        visual={{
          title: $tStore('testes.visual.title'),
          cols: {
            story: $tNavStore('common.storyState'),
            priority: $tNavStore('common.priority'),
          },
          items: [
            { story: $tStore('testes.visual.item1.story'), priority: localPriority($tStore('testes.visual.item1.priority'), $tNavStore) },
            { story: $tStore('testes.visual.item2.story'), priority: localPriority($tStore('testes.visual.item2.priority'), $tNavStore) },
            { story: $tStore('testes.visual.item3.story'), priority: localPriority($tStore('testes.visual.item3.priority'), $tNavStore) },
            { story: $tStore('testes.visual.item4.story'), priority: localPriority($tStore('testes.visual.item4.priority'), $tNavStore) },
            { story: $tStore('testes.visual.item5.story'), priority: localPriority($tStore('testes.visual.item5.priority'), $tNavStore) },
          ],
        }}
      />
</DocsPageLayout>
