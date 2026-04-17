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
  } from '@/components/ui/table/index.js';
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import uiTranslations from '@/i18n/ui.json';
  import tableTranslations from '@shared/content/table/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(tableTranslations);

  // ─── SEO + page view ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: `${t('title')} — ${t('category')}`,
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

  // ─── Navigation + active section ─────────────────────────────────────────────

  let activeSection = $state('demonstracao');

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
        { id: 'exemplos',     label: tNav('nav.examples') },
        { id: 'variantes',    label: tNav('nav.variants') },
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

  $effect(() => {
    const ids = NAV_GROUPS.flatMap((g) => g.sections.map((s) => s.id));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeSection = entry.target.id;
            track('docs_section_viewed', {
              section_id: entry.target.id,
              component_name: 'table',
              locale: $locale,
            });
            break;
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  });

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─── Mock data ───────────────────────────────────────────────────────────────

  const invoices = [
    { invoice: 'INV001', statusKey: 'paid',    methodKey: 'creditCard',   amount: 'R$ 250,00' },
    { invoice: 'INV002', statusKey: 'pending', methodKey: 'paypal',       amount: 'R$ 150,00' },
    { invoice: 'INV003', statusKey: 'unpaid',  methodKey: 'bankTransfer', amount: 'R$ 350,00' },
    { invoice: 'INV004', statusKey: 'paid',    methodKey: 'creditCard',   amount: 'R$ 450,00' },
    { invoice: 'INV005', statusKey: 'paid',    methodKey: 'paypal',       amount: 'R$ 550,00' },
  ];

  // ─── Cards / tabelas ─────────────────────────────────────────────────────────

  const compositionItems = [
    { key: 'basic',       label: 'basic'       },
    { key: 'withCaption', label: 'withCaption' },
    { key: 'withFooter',  label: 'withFooter'  },
    { key: 'empty',       label: 'empty'       },
  ];

  const densityItems = [
    { key: 'compact',     label: 'compact',     headClass: 'h-8',  cellClass: 'py-1' },
    { key: 'default',     label: 'default',     headClass: '',     cellClass: ''     },
    { key: 'comfortable', label: 'comfortable', headClass: 'h-12', cellClass: 'py-4' },
  ];

  const propRows = [
    { name: 'class',      type: 'string',                                         def: '—', req: 'Não',         key: 'className' },
    { name: 'children',   type: 'Snippet (slot)',                                 def: '—', req: 'Sim',         key: 'children'  },
    { name: 'colspan',    type: 'number',                                         def: '1', req: 'Não',         key: 'colSpan'   },
    { name: 'rowspan',    type: 'number',                                         def: '1', req: 'Não',         key: 'rowSpan'   },
    { name: 'scope',      type: '"col" | "row" | "colgroup" | "rowgroup"',        def: '—', req: 'Recomendado', key: 'scope'     },
    { name: 'data-state', type: '"selected"',                                     def: '—', req: 'Não',         key: 'dataState' },
  ];

  const tokenRows = [
    { token: '--border',           cls: 'border-border',          key: 'border'          },
    { token: '--muted',            cls: 'bg-muted/50',            key: 'muted'           },
    { token: '--muted-foreground', cls: 'text-muted-foreground',  key: 'mutedForeground' },
    { token: '--foreground',       cls: 'text-foreground',        key: 'foreground'      },
    { token: '--background',       cls: 'bg-background',          key: 'background'      },
    { token: '--radius',           cls: 'rounded-md',             key: 'radius'          },
  ];

  const relatedItems = $derived.by(() => {
    const t = $tStore;
    return [
      { name: 'Card',       desc: t('related.card'),       path: '?path=/docs/ui-card--docs' },
      { name: 'DataTable',  desc: t('related.dataTable'),  path: '?path=/docs/ui-datatable--docs' },
      { name: 'Pagination', desc: t('related.pagination'), path: '?path=/docs/ui-pagination--docs' },
      { name: 'Checkbox',   desc: t('related.checkbox'),   path: '?path=/docs/ui-checkbox--docs' },
      { name: 'Badge',      desc: t('related.badge'),      path: '?path=/docs/ui-badge--docs' },
    ];
  });

  // ─── Code snippets ───────────────────────────────────────────────────────────

  const codeBasic = `<Table>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Fatura</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead class="text-right" scope="col">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell class="font-medium">INV001</TableCell>
      <TableCell>Pago</TableCell>
      <TableCell class="text-right">R$ 250,00</TableCell>
    </TableRow>
  </TableBody>
</Table>`;

  const codeWithCaption = `<Table>
  <TableCaption>Lista das faturas recentes.</TableCaption>
  <TableHeader>...</TableHeader>
  <TableBody>...</TableBody>
</Table>`;

  const codeWithSelection = `<TableRow data-state="selected">
  <TableCell>INV002</TableCell>
  <TableCell>Pendente</TableCell>
</TableRow>`;

  const codeEmpty = `<TableBody>
  <TableRow>
    <TableCell colspan={3} class="h-24 text-center text-muted-foreground">
      Nenhuma fatura encontrada. Crie a primeira para começar.
    </TableCell>
  </TableRow>
</TableBody>`;

  const codeImportBasic = `import * as Table from '@/components/ui/table';`;

  const codeImportFull = `import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';`;

  const codeInterface = `type TableProps         = HTMLTableAttributes
type TableSectionProps  = HTMLAttributes          // Header, Body, Footer
type TableRowProps      = HTMLAttributes
type TableHeadProps     = HTMLThAttributes
type TableCellProps     = HTMLTdAttributes
type TableCaptionProps  = HTMLAttributes`;

  const codeCustomTheme = `/* Em globals.css ou theme-custom.css */
html.meu-tema {
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --border: 214 32% 91%;
}
html.meu-tema.dark {
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --border: 217 33% 20%;
}`;
</script>

<div class="ds-docs p-8 max-w-5xl mx-auto">

  <!-- ── Header ──────────────────────────────────────────────────────────────── -->
  <header class="mb-12 border-b pb-8 border-border/50">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center rounded-md border border-primary/10 bg-primary/5 px-2 py-0 text-xs font-medium text-primary">
          {$tStore('category')}
        </span>
        <span class="inline-flex items-center rounded-md border border-border px-2 py-0 text-xs font-normal text-muted-foreground">
          {$tStore('type')}
        </span>
      </div>
      <LanguageSwitcher />
    </div>
    <div class="space-y-4">
      <h1 class="text-4xl font-bold tracking-tight text-foreground">{$tStore('title')}</h1>
      <p class="text-muted-foreground text-lg max-w-3xl leading-relaxed">{$tStore('description')}</p>
    </div>
    <div class="mt-6 flex items-center gap-3 text-sm text-muted-foreground/80">
      <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border/50">
        npx shadcn-svelte@latest add table
      </code>
    </div>
  </header>

  <div class="flex gap-16 items-start">

    <!-- ── Sidebar ──────────────────────────────────────────────────────────── -->
    <nav aria-label="Navegação das seções do componente" class="sticky top-8 w-52 shrink-0 self-start space-y-5">
      {#each NAV_GROUPS as group}
        <div>
          <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground mb-1 px-2">
            {group.label}
          </p>
          <ul class="list-none p-0 m-0 space-y-0.5">
            {#each group.sections as section}
              <li class="list-none">
                <button
                  type="button"
                  onclick={() => scrollTo(section.id)}
                  aria-current={activeSection === section.id ? 'location' : undefined}
                  class={[
                    'w-full text-left text-sm px-2 py-1 rounded-md transition-colors',
                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                    activeSection === section.id
                      ? 'font-semibold text-foreground bg-muted'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  ].join(' ')}
                >
                  {section.label}
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </nav>

    <!-- ── Main ──────────────────────────────────────────────────────────────── -->
    <div class="flex-1 min-w-0 space-y-12">

      <!-- ── 1. Demonstração ─────────────────────────────────────────────── -->
      <section id="demonstracao">
        <h2 class="text-xl font-semibold mb-4">{$tStore('demonstration.title')}</h2>
        <div class="p-8 border border-border rounded-xl bg-card/50">
          <Table>
            <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[100px]" scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
                <TableHead scope="col">{$tStore('demonstration.labels.status')}</TableHead>
                <TableHead scope="col">{$tStore('demonstration.labels.method')}</TableHead>
                <TableHead class="text-right" scope="col">{$tStore('demonstration.labels.amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each invoices as row (row.invoice)}
                <TableRow>
                  <TableCell class="font-medium">{row.invoice}</TableCell>
                  <TableCell>{$tStore(`demonstration.labels.${row.statusKey}`)}</TableCell>
                  <TableCell>{$tStore(`demonstration.labels.${row.methodKey}`)}</TableCell>
                  <TableCell class="text-right">{row.amount}</TableCell>
                </TableRow>
              {/each}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colspan={3}>{$tStore('demonstration.labels.total')}</TableCell>
                <TableCell class="text-right">R$ 1.750,00</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </section>

      <!-- ── 2. Anatomia ─────────────────────────────────────────────────── -->
      <section id="anatomia">
        <h2 class="text-xl font-semibold mb-4">{$tStore('anatomy.title')}</h2>
        <div class="p-8 border border-border rounded-xl bg-card/50 space-y-4">
          <ol class="space-y-3 text-sm list-none p-0 m-0">
            {#each [1, 2, 3, 4, 5, 6, 7, 8] as i}
              <li class="flex gap-3 list-none">
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{i}</span>
                <span>{@html sanitizeHtml($tStore(`anatomy.item${i}`))}</span>
              </li>
            {/each}
          </ol>
          <div class="rounded-lg bg-muted/50 border border-border/40 px-4 pt-3 pb-4">
            <p class="text-xs text-muted-foreground mb-2">{$tStore('anatomy.structureLabel')}</p>
            <pre class="text-xs font-mono leading-relaxed">{@html sanitizeHtml($tStore('anatomy.structureCode'))}</pre>
          </div>
        </div>
      </section>

      <!-- ── 3. Quando Usar ──────────────────────────────────────────────── -->
      <section id="quando-usar">
        <h2 class="text-xl font-semibold mb-4">{$tStore('usage.title')}</h2>
        <div class="border rounded-xl p-6 shadow-sm space-y-6">

          <div class="bg-muted/30 rounded-lg p-4 space-y-3">
            <h3 class="font-medium text-sm">{$tStore('usage.guidelines.title')}</h3>
            <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              {#each [1, 2, 3, 4] as i}
                <li>{@html sanitizeHtml($tStore(`usage.guidelines.item${i}`))}</li>
              {/each}
            </ul>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-border text-left bg-muted/50 font-medium">
                  <th class="p-3 border-r border-border">{$tStore('usage.scenarios.cols.scenario')}</th>
                  <th class="p-3 border-r border-border">{$tStore('usage.scenarios.cols.use')}</th>
                  <th class="p-3">{$tStore('usage.scenarios.cols.alternative')}</th>
                </tr>
              </thead>
              <tbody>
                {#each [1, 2, 3, 4, 5] as i}
                  <tr class="border-b border-border hover:bg-muted/5">
                    <td class="p-3 border-r border-border">{$tStore(`usage.scenarios.item${i}.s`)}</td>
                    <td class="p-3 border-r border-border font-medium text-primary">{$tStore(`usage.scenarios.item${i}.u`)}</td>
                    <td class="p-3 text-muted-foreground">{$tStore(`usage.scenarios.item${i}.a`)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <div class="space-y-3">
            <h3 class="font-medium text-sm">{$tStore('uxWriting.title')}</h3>
            <div class="overflow-x-auto">
              <table class="w-full border-collapse text-sm">
                <thead>
                  <tr class="border-b border-border bg-muted/70 text-left">
                    <th class="p-3 border-r border-border font-semibold">{$tStore('uxWriting.table.element')}</th>
                    <th class="p-3 border-r border-border font-semibold">{$tStore('uxWriting.table.rules')}</th>
                    <th class="p-3 border-r border-border font-semibold text-green-700 dark:text-green-400">
                      <span class="flex items-center gap-1.5">
                        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                        {$tStore('uxWriting.table.correct')}
                      </span>
                    </th>
                    <th class="p-3 font-semibold text-red-700 dark:text-red-400">
                      <span class="flex items-center gap-1.5">
                        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                        {$tStore('uxWriting.table.avoid')}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {#each ['caption', 'header', 'empty'] as key}
                    <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                      <td class="p-3 border-r border-border font-medium">{$tStore(`uxWriting.table.${key}.name`)}</td>
                      <td class="p-3 border-r border-border">{$tStore(`uxWriting.table.${key}.format`)}</td>
                      <td class="p-3 border-r border-border font-medium text-green-600 dark:text-green-500">{$tStore(`uxWriting.table.${key}.good`)}</td>
                      <td class="p-3 font-medium text-red-600 dark:text-red-500">{$tStore(`uxWriting.table.${key}.bad`)}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-card border rounded-xl p-4 shadow-sm">
              <h3 class="mb-3 text-sm font-semibold text-green-600 flex items-center gap-2">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                {$tStore('usage.do.title')}
              </h3>
              <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
                {#each [1, 2, 3, 4] as i}
                  <li>{@html sanitizeHtml($tStore(`usage.do.item${i}`))}</li>
                {/each}
              </ul>
            </div>
            <div class="bg-card border rounded-xl p-4 shadow-sm">
              <h3 class="mb-3 text-sm font-semibold text-red-600 flex items-center gap-2">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                {$tStore('usage.dont.title')}
              </h3>
              <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
                {#each [1, 2, 3] as i}
                  <li>{@html sanitizeHtml($tStore(`usage.dont.item${i}`))}</li>
                {/each}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 4. Do & Don't ───────────────────────────────────────────────── -->
      <section id="do-dont">
        <h2 class="text-xl font-semibold mb-4">{$tStore('doDont.title')}</h2>
        <div class="p-8 border border-border rounded-xl bg-card/50 space-y-8">

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-green-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.do')}</span>
              </div>
              <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
                      <TableHead class="text-right" scope="col">{$tStore('demonstration.labels.amount')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell class="font-medium">INV001</TableCell>
                      <TableCell class="text-right">R$ 250,00</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <p class="text-sm text-muted-foreground italic px-1">{@html sanitizeHtml($tStore('doDont.pair1.do'))}</p>
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-red-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.dont')}</span>
              </div>
              <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
                <table class="w-full text-sm">
                  <tbody>
                    <tr>
                      <td class="p-2 font-bold">{$tStore('demonstration.labels.invoice')}</td>
                      <td class="p-2 font-bold text-right">{$tStore('demonstration.labels.amount')}</td>
                    </tr>
                    <tr>
                      <td class="p-2">INV001</td>
                      <td class="p-2 text-right">R$ 250,00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="text-sm text-muted-foreground italic px-1">{@html sanitizeHtml($tStore('doDont.pair1.dont'))}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-green-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.do')}</span>
              </div>
              <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
                <Table>
                  <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
                      <TableHead class="text-right" scope="col">{$tStore('demonstration.labels.amount')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell class="font-medium">INV001</TableCell>
                      <TableCell class="text-right">R$ 250,00</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <p class="text-sm text-muted-foreground italic px-1">{@html sanitizeHtml($tStore('doDont.pair2.do'))}</p>
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-red-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.dont')}</span>
              </div>
              <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
                <table class="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th class="p-2 text-left">{$tStore('demonstration.labels.invoice')}</th>
                      <th class="p-2 text-left">{$tStore('demonstration.labels.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="p-2">INV001</td>
                      <td class="p-2">R$ 250,00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="text-sm text-muted-foreground italic px-1">{@html sanitizeHtml($tStore('doDont.pair2.dont'))}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 5. Importação ───────────────────────────────────────────────── -->
      <section id="importacao">
        <h2 class="text-xl font-semibold mb-4">{$tStore('import.title')}</h2>
        <div class="p-8 border border-border rounded-xl bg-card/50 space-y-4">
          <div>
            <p class="text-sm text-muted-foreground mb-3">{$tStore('import.basic')}</p>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
              <code class="whitespace-pre">{codeImportBasic}</code>
            </div>
          </div>
          <div>
            <p class="text-sm text-muted-foreground mb-3">{$tStore('import.full')}</p>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
              <code class="whitespace-pre">{codeImportFull}</code>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 6. Exemplos ─────────────────────────────────────────────────── -->
      <section id="exemplos">
        <h2 class="text-xl font-semibold mb-4">{$tStore('examples.title')}</h2>
        <div class="space-y-8">

          <div class="space-y-3">
            <h3 class="text-sm font-medium">{$tStore('examples.basic')}</h3>
            <div class="p-6 border border-border rounded-xl bg-card/50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
                    <TableHead scope="col">{$tStore('demonstration.labels.status')}</TableHead>
                    <TableHead class="text-right" scope="col">{$tStore('demonstration.labels.amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell class="font-medium">INV001</TableCell>
                    <TableCell>{$tStore('demonstration.labels.paid')}</TableCell>
                    <TableCell class="text-right">R$ 250,00</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
              <code class="whitespace-pre">{codeBasic}</code>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-medium">{$tStore('examples.withCaption')}</h3>
            <div class="p-6 border border-border rounded-xl bg-card/50">
              <Table>
                <TableCaption>{$tStore('demonstration.labels.caption')}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
                    <TableHead class="text-right" scope="col">{$tStore('demonstration.labels.amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell class="font-medium">INV001</TableCell>
                    <TableCell class="text-right">R$ 250,00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell class="font-medium">INV002</TableCell>
                    <TableCell class="text-right">R$ 150,00</TableCell>
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell>{$tStore('demonstration.labels.total')}</TableCell>
                    <TableCell class="text-right">R$ 400,00</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
              <code class="whitespace-pre">{codeWithCaption}</code>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-medium">{$tStore('examples.withSelection')}</h3>
            <div class="p-6 border border-border rounded-xl bg-card/50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
                    <TableHead scope="col">{$tStore('demonstration.labels.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell class="font-medium">INV001</TableCell>
                    <TableCell>{$tStore('demonstration.labels.paid')}</TableCell>
                  </TableRow>
                  <TableRow data-state="selected">
                    <TableCell class="font-medium">INV002</TableCell>
                    <TableCell>{$tStore('demonstration.labels.pending')}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
              <code class="whitespace-pre">{codeWithSelection}</code>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-medium">{$tStore('examples.empty')}</h3>
            <div class="p-6 border border-border rounded-xl bg-card/50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">{$tStore('demonstration.labels.invoice')}</TableHead>
                    <TableHead scope="col">{$tStore('demonstration.labels.status')}</TableHead>
                    <TableHead class="text-right" scope="col">{$tStore('demonstration.labels.amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colspan={3} class="h-24 text-center text-muted-foreground">
                      {$tStore('uxWriting.table.empty.good')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
              <code class="whitespace-pre">{codeEmpty}</code>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 7. Variantes (Composições + Densidades) ─────────────────────── -->
      <section id="variantes">
        <h2 class="text-xl font-semibold mb-6">{$tStore('variants.title')}</h2>
        <div class="space-y-12">

          <!-- Composições -->
          <div>
            <h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1">
              {$tStore('variants.visualTitle')}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {#each compositionItems as item (item.key)}
                <div class="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col transition-all hover:border-primary/30 hover:shadow-sm">
                  <div class="flex-1 flex items-center justify-center p-4 bg-muted/5 min-h-[160px]">
                    {#if item.key === 'basic'}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead scope="col">Fatura</TableHead>
                            <TableHead class="text-right" scope="col">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>INV001</TableCell>
                            <TableCell class="text-right">R$ 250</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    {:else if item.key === 'withCaption'}
                      <Table>
                        <TableCaption>Resumo</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead scope="col">Fatura</TableHead>
                            <TableHead class="text-right" scope="col">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>INV001</TableCell>
                            <TableCell class="text-right">R$ 250</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    {:else if item.key === 'withFooter'}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead scope="col">Fatura</TableHead>
                            <TableHead class="text-right" scope="col">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>INV001</TableCell>
                            <TableCell class="text-right">R$ 250</TableCell>
                          </TableRow>
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell>Total</TableCell>
                            <TableCell class="text-right">R$ 250</TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    {:else if item.key === 'empty'}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead scope="col">Fatura</TableHead>
                            <TableHead class="text-right" scope="col">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell colspan={2} class="h-16 text-center text-muted-foreground text-xs">
                              Nenhum dado
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    {/if}
                  </div>
                  <div class="p-4 border-t border-border/40 bg-muted/10 space-y-1">
                    <p class="text-[11px] uppercase font-mono text-primary font-bold tracking-wider px-1.5 py-0.5 bg-primary/5 rounded-sm inline-block mb-1">
                      {item.label}
                    </p>
                    <p class="text-xs text-muted-foreground leading-relaxed">{@html sanitizeHtml($tStore(`variants.items.${item.key}`))}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Densidades -->
          <div>
            <h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1">
              {$tStore('variants.sizeTitle')}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              {#each densityItems as item (item.key)}
                <div class="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col transition-all hover:border-primary/30 hover:shadow-sm">
                  <div class="flex-1 flex items-center justify-center p-4 bg-muted/5 min-h-[140px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead class={item.headClass} scope="col">Fatura</TableHead>
                          <TableHead class={`${item.headClass} text-right`} scope="col">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell class={item.cellClass}>INV001</TableCell>
                          <TableCell class={`${item.cellClass} text-right`}>R$ 250</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell class={item.cellClass}>INV002</TableCell>
                          <TableCell class={`${item.cellClass} text-right`}>R$ 150</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div class="p-3 border-t border-border/40 bg-muted/10 space-y-1">
                    <p class="text-[11px] uppercase font-mono text-primary font-bold block">{item.label}</p>
                    <p class="text-xs text-muted-foreground">{$tStore(`variants.sizes.${item.key}`)}</p>
                    <p class="text-xs text-muted-foreground/70 italic">{$tStore(`variants.sizes.${item.key}Use`)}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>

        </div>
      </section>

      <!-- ── 8. Estados ──────────────────────────────────────────────────── -->
      <section id="estados">
        <h2 class="text-xl font-semibold mb-4">{$tStore('states.title')}</h2>
        <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
          <table class="w-full border-collapse text-sm" style="margin:0">
            <thead>
              <tr class="border-b border-border text-left bg-muted/50">
                <th class="p-3 border-r border-border font-medium">{$tStore('states.table.state')}</th>
                <th class="p-3 border-r border-border font-medium">{$tStore('states.table.visual')}</th>
                <th class="p-3 font-medium">{$tStore('states.table.trigger')}</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border hover:bg-muted/5 transition-colors">
                <td class="p-3 border-r border-border font-medium">Default</td>
                <td class="p-3 border-r border-border text-muted-foreground italic">{$tStore('states.table.initial')}</td>
                <td class="p-3 text-muted-foreground">—</td>
              </tr>
              <tr class="border-b border-border hover:bg-muted/5 transition-colors">
                <td class="p-3 border-r border-border font-medium">Hover</td>
                <td class="p-3 border-r border-border text-muted-foreground italic">{@html sanitizeHtml($tStore('states.table.hover'))}</td>
                <td class="p-3 text-muted-foreground">{@html sanitizeHtml($tStore('states.table.hoverTrigger'))}</td>
              </tr>
              <tr class="border-b border-border hover:bg-muted/5 transition-colors">
                <td class="p-3 border-r border-border font-medium">Selected</td>
                <td class="p-3 border-r border-border text-muted-foreground italic">{@html sanitizeHtml($tStore('states.table.selected'))}</td>
                <td class="p-3 text-muted-foreground">{@html sanitizeHtml($tStore('states.table.selectedTrigger'))}</td>
              </tr>
              <tr class="border-b border-border hover:bg-muted/5 transition-colors">
                <td class="p-3 border-r border-border font-medium">Empty</td>
                <td class="p-3 border-r border-border text-muted-foreground italic">{$tStore('states.table.empty')}</td>
                <td class="p-3 text-muted-foreground">{@html sanitizeHtml($tStore('states.table.emptyTrigger'))}</td>
              </tr>
              <tr class="border-b last:border-0 hover:bg-muted/5 transition-colors">
                <td class="p-3 border-r border-border font-medium">Scroll</td>
                <td class="p-3 border-r border-border text-muted-foreground italic">{$tStore('states.table.scroll')}</td>
                <td class="p-3 text-muted-foreground">{@html sanitizeHtml($tStore('states.table.scrollTrigger'))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ── 9. Propriedades ─────────────────────────────────────────────── -->
      <section id="propriedades">
        <h2 class="text-xl font-semibold mb-4">{$tStore('props.title')}</h2>
        <div class="space-y-6">
          <div>
            <h3 class="font-medium text-sm mb-3">{$tStore('props.interface')}</h3>
            <div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto">
              <code class="whitespace-pre leading-relaxed">{codeInterface}</code>
            </div>
          </div>

          <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
            <table class="w-full border-collapse text-sm" style="margin:0">
              <thead class="bg-muted/50 border-b text-left">
                <tr>
                  <th class="p-3 border-r border-border font-semibold">{$tStore('props.table.prop')}</th>
                  <th class="p-3 border-r border-border font-semibold">{$tStore('props.table.type')}</th>
                  <th class="p-3 border-r border-border font-semibold">{$tStore('props.table.default')}</th>
                  <th class="p-3 border-r border-border font-semibold">{$tStore('props.table.required')}</th>
                  <th class="p-3 font-semibold">{$tStore('props.table.description')}</th>
                </tr>
              </thead>
              <tbody>
                {#each propRows as prop (prop.name)}
                  <tr class="border-b last:border-0 hover:bg-muted/5">
                    <td class="p-3 border-r border-border font-mono font-bold text-primary">{prop.name}</td>
                    <td class="p-3 border-r border-border font-mono text-muted-foreground">{prop.type}</td>
                    <td class="p-3 border-r border-border font-mono">{prop.def}</td>
                    <td class="p-3 border-r border-border text-muted-foreground">{prop.req}</td>
                    <td class="p-3 text-muted-foreground">{@html sanitizeHtml($tStore(`props.table.${prop.key}`))}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <div class="space-y-3">
            <h3 class="font-medium text-sm">{$tStore('props.extensibilityTitle')}</h3>
            <div class="space-y-3">
              {#each ['classNameNote', 'spreadNote'] as key}
                <p class="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 border">
                  {@html sanitizeHtml($tStore(`props.extensibility.${key}`))}
                </p>
              {/each}
            </div>
          </div>
        </div>
      </section>

      <!-- ── 10. Tokens ──────────────────────────────────────────────────── -->
      <section id="tokens">
        <h2 class="text-xl font-semibold mb-4">{$tStore('tokens.title')}</h2>
        <div class="space-y-6">
          <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
            <table class="w-full border-collapse text-sm" style="margin:0">
              <thead>
                <tr class="border-b border-border bg-muted/50 text-left">
                  <th class="p-3 border-r border-border font-medium">{$tStore('tokens.table.token')}</th>
                  <th class="p-3 border-r border-border font-medium">{$tStore('tokens.table.class')}</th>
                  <th class="p-3 font-medium">{$tStore('tokens.table.part')}</th>
                </tr>
              </thead>
              <tbody>
                {#each tokenRows as row (row.token)}
                  <tr class="border-b last:border-0 hover:bg-muted/5 transition-colors">
                    <td class="p-3 border-r border-border font-mono text-primary font-medium"><code>{row.token}</code></td>
                    <td class="p-3 border-r border-border font-mono text-primary"><code>{row.cls}</code></td>
                    <td class="p-3 text-muted-foreground">{@html sanitizeHtml($tStore(`tokens.table.${row.key}`))}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="space-y-2">
            <h3 class="font-medium text-sm">{$tStore('tokens.customizationTitle')}</h3>
            <div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto">
              <code class="whitespace-pre leading-relaxed">{codeCustomTheme}</code>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 11. Acessibilidade ──────────────────────────────────────────── -->
      <section id="acessibilidade">
        <h2 class="text-xl font-semibold mb-4">{$tStore('accessibility.title')}</h2>
        <div class="border rounded-xl p-6 shadow-sm space-y-6">
          <ul class="space-y-3 text-sm text-muted-foreground list-disc pl-5">
            {#each [1, 2, 3, 4, 5] as i}
              <li>{@html sanitizeHtml($tStore(`accessibility.item${i}`))}</li>
            {/each}
          </ul>
          <div class="space-y-4">
            <h3 class="font-medium text-sm">{$tStore('accessibility.keyboardTitle')}</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {#each ['tab', 'arrows', 'enter'] as key}
                <div class="bg-muted/30 border rounded-xl p-4">
                  <code class="text-[10px] bg-muted px-2 py-0.5 rounded-md uppercase font-bold text-primary border border-border/60 block mb-2">{key}</code>
                  <p class="text-xs text-muted-foreground leading-relaxed">{$tStore(`accessibility.keyboard.${key}`)}</p>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </section>

      <!-- ── 12. Relacionados ────────────────────────────────────────────── -->
      <section id="relacionados">
        <h2 class="text-xl font-semibold mb-4">{$tStore('related.title')}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {#each relatedItems as item (item.name)}
            <div role="link" tabindex="0"
                 onclick={() => { (window.top ?? window).location.href = item.path; }}
                 onkeydown={(e) => { if (e.key === 'Enter') (window.top ?? window).location.href = item.path; }}
                 class="border rounded-xl p-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group">
              <h4 class="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">{item.name}</h4>
              <p class="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          {/each}
        </div>
      </section>

      <!-- ── 13. Notas ───────────────────────────────────────────────────── -->
      <section id="notas">
        <h2 class="text-xl font-semibold mb-4">{$tStore('notes.title')}</h2>
        <div class="space-y-4">
          <div class="p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg">
            <p class="text-sm text-muted-foreground leading-relaxed">{$tStore('notes.tip1')}</p>
          </div>
          <div class="p-4 bg-orange-500/5 border-l-4 border-orange-500 rounded-r-lg">
            <p class="text-sm text-muted-foreground leading-relaxed">{$tStore('notes.tip2')}</p>
          </div>
        </div>
      </section>

      <!-- ── 14. Analytics ───────────────────────────────────────────────── -->
      <section id="analytics">
        <h2 class="text-xl font-semibold mb-4">{$tStore('analytics.title')}</h2>
        <div class="space-y-4">
          <p class="text-sm text-muted-foreground leading-relaxed">{$tStore('analytics.description')}</p>
          <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
            <table class="w-full border-collapse text-sm" style="margin:0">
              <thead>
                <tr class="bg-muted/50 border-b text-left">
                  <th class="p-3 border-r border-border font-semibold">{$tStore('analytics.table.event')}</th>
                  <th class="p-3 border-r border-border font-semibold">{$tStore('analytics.table.trigger')}</th>
                  <th class="p-3 font-semibold">{$tStore('analytics.table.payload')}</th>
                </tr>
              </thead>
              <tbody>
                {#each ['pageView', 'sectionViewed', 'langSwitch'] as key}
                  <tr class="border-b last:border-0 hover:bg-muted/5">
                    <td class="p-3 border-r border-border font-mono text-primary font-bold">{$tStore(`analytics.table.${key}`)}</td>
                    <td class="p-3 border-r border-border">{$tStore(`analytics.table.${key}Trigger`)}</td>
                    <td class="p-3 font-mono text-muted-foreground">{$tStore(`analytics.table.${key}Payload`)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ── 15. Testes ──────────────────────────────────────────────────── -->
      <section id="testes">
        <h2 class="text-xl font-semibold mb-6">{$tStore('testes.title')}</h2>
        <div class="space-y-8">

          <!-- Comportamento Funcional -->
          <div>
            <h3 class="font-semibold text-sm mb-1">{$tStore('testes.functional.title')}</h3>
            <p class="text-xs text-muted-foreground mb-4">{$tStore('testes.functional.description')}</p>
            <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
              <table class="w-full border-collapse text-sm">
                <thead class="bg-muted/50 border-b text-left">
                  <tr>
                    <th class="p-4 border-r border-border font-semibold">{$tNavStore('common.userAction')}</th>
                    <th class="p-4 border-r border-border font-semibold">{$tNavStore('common.expectedResult')}</th>
                    <th class="p-4 font-semibold w-24">{$tNavStore('common.priority')}</th>
                  </tr>
                </thead>
                <tbody>
                  {#each [1, 2, 3, 4, 5, 6] as i}
                    {@const isHigh = $tStore(`testes.functional.item${i}.priority`) === 'high'}
                    <tr class="border-b last:border-0 hover:bg-muted/5">
                      <td class="p-4 border-r border-border font-medium">{$tStore(`testes.functional.item${i}.action`)}</td>
                      <td class="p-4 border-r border-border text-muted-foreground">{$tStore(`testes.functional.item${i}.result`)}</td>
                      <td class="p-4">
                        <span class={isHigh
                          ? 'inline-flex items-center rounded-md border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-600 h-5'
                          : 'inline-flex items-center rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 h-5'}>
                          {isHigh ? $tNavStore('common.high') : $tNavStore('common.medium')}
                        </span>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Acessibilidade Verificável -->
          <div>
            <h3 class="font-semibold text-sm mb-1">{$tStore('testes.accessibility.title')}</h3>
            <p class="text-xs text-muted-foreground mb-4">{$tStore('testes.accessibility.description')}</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {#each [1, 2, 3, 4, 5, 6] as i}
                <div class="flex gap-3 items-start p-3 bg-muted/10 rounded-lg border border-border/40">
                  <div class="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="text-[10px] text-primary font-bold italic">axe</span>
                  </div>
                  <span class="text-xs text-muted-foreground leading-relaxed">{$tStore(`testes.accessibility.item${i}`)}</span>
                </div>
              {/each}
            </div>
          </div>

          <!-- Regressão Visual -->
          <div>
            <h3 class="font-semibold text-sm mb-1">{$tStore('testes.visual.title')}</h3>
            <p class="text-xs text-muted-foreground mb-4">{$tStore('testes.visual.description')}</p>
            <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
              <table class="w-full border-collapse text-sm">
                <thead class="bg-muted/50 border-b text-left">
                  <tr>
                    <th class="p-4 border-r border-border font-semibold">{$tNavStore('common.storyState')}</th>
                    <th class="p-4 border-r border-border font-semibold text-center w-32">{$tNavStore('common.themeLight')}</th>
                    <th class="p-4 border-r border-border font-semibold text-center w-32">{$tNavStore('common.themeDark')}</th>
                    <th class="p-4 font-semibold w-24">{$tNavStore('common.priority')}</th>
                  </tr>
                </thead>
                <tbody>
                  {#each [1, 2, 3, 4, 5, 6, 7] as i}
                    {@const isHigh = $tStore(`testes.visual.item${i}.priority`) === 'high'}
                    <tr class="border-b last:border-0 hover:bg-muted/5">
                      <td class="p-4 border-r border-border font-medium">{$tStore(`testes.visual.item${i}.story`)}</td>
                      <td class="p-4 border-r border-border text-center text-emerald-600 font-medium">{$tStore('testes.visual.required')}</td>
                      <td class="p-4 border-r border-border text-center text-emerald-600 font-medium">{$tStore('testes.visual.required')}</td>
                      <td class="p-4">
                        <span class={isHigh
                          ? 'inline-flex items-center rounded-md border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-600 h-5'
                          : 'inline-flex items-center rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 h-5'}>
                          {isHigh ? $tNavStore('common.high') : $tNavStore('common.medium')}
                        </span>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

    </div>
  </div>
</div>
