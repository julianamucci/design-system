<script lang="ts">
  import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from '@/components/ui/sheet';
  import { Button } from '@/components/ui/button';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import sheetTranslations from '@shared/content/sheet/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(sheetTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'sheet',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/overlay' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'sheet',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────


  const NAV_GROUPS = $derived.by(() => {
    const tNav = $tNavStore;
    const tContent = $tStore;
    return [
      { label: tNav('nav.overview'), sections: [
        { id: 'demonstracao', label: tContent('nav.demonstration') },
        { id: 'anatomia',     label: tContent('nav.anatomy')       },
        { id: 'quando-usar',  label: tContent('nav.usage')         },
        { id: 'do-dont',      label: tContent('nav.doDont')        },
      ]},
      { label: tNav('nav.techRef'), sections: [
        { id: 'importacao',   label: tContent('nav.import')   },
        { id: 'variantes',    label: tContent('nav.variants') },
        { id: 'composicoes',  label: tContent('nav.compositions') },
        { id: 'estados',      label: tContent('nav.states')   },
        { id: 'propriedades', label: tContent('nav.props')    },
        { id: 'tokens',       label: tContent('nav.tokens')   },
      ]},
      { label: tNav('nav.context'), sections: [
        { id: 'acessibilidade', label: tContent('nav.accessibility') },
        { id: 'relacionados',   label: tContent('nav.related')       },
        { id: 'notas',          label: tContent('nav.notes')         },
      ]},
      { label: tNav('nav.quality'), sections: [
        { id: 'analytics', label: tContent('nav.analytics') },
        { id: 'testes',    label: tContent('nav.testes')    },
      ]},
    ];
  });

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'sheet', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function stripHtml(s: string) {
    return s.replace(/<[^>]*>/g, '');
  }

  const priorityKeyMap: Record<string, string> = {
    high: 'common.high',
    medium: 'common.medium',
    low: 'common.low',
  };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";`;

  const codeImportUsage = `<Sheet>
  <SheetTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Abrir filtros</Button>
    {/snippet}
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Filtros avançados</SheetTitle>
      <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
    </SheetHeader>
    <SheetFooter>
      <SheetClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>Cancelar</Button>
        {/snippet}
      </SheetClose>
      <Button>Aplicar filtros</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`;

  const codeRight = `<SheetContent side="right">...</SheetContent>`;
  const codeLeft = `<SheetContent side="left">...</SheetContent>`;
  const codeTop = `<SheetContent side="top">...</SheetContent>`;
  const codeBottom = `<SheetContent side="bottom">...</SheetContent>`;

  const interfaceCode = `// Sheet (Root) — bits-ui Dialog
interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: Snippet;
}

// SheetContent
interface SheetContentProps {
  side?: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton?: boolean;
  class?: string;
  children: Snippet;
}

// SheetTrigger / SheetClose
interface TriggerProps {
  class?: string;
  child?: Snippet<[{ props: Record<string, any> }]>;
}`;

  const propsTableCols = $derived({
    prop: $tStore('props.table.prop'),
    type: $tStore('props.table.type'),
    default: $tStore('props.table.default'),
    required: $tStore('props.table.required'),
    description: $tStore('props.table.description'),
  });
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value}>
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add sheet"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="flex flex-wrap items-center justify-center gap-3 w-full" style="contain: layout">
        <Sheet>
          <SheetTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>{$tStore('demonstration.labels.rightLabel')}</Button>
            {/snippet}
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>{$tStore('demonstration.labels.title')}</SheetTitle>
              <SheetDescription>{$tStore('demonstration.labels.description')}</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose>
                {#snippet child({ props })}
                  <Button variant="outline" {...props}>{$tStore('demonstration.labels.cancel')}</Button>
                {/snippet}
              </SheetClose>
              <Button>{$tStore('demonstration.labels.apply')}</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>{$tStore('demonstration.labels.leftLabel')}</Button>
            {/snippet}
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>{$tStore('demonstration.labels.title')}</SheetTitle>
              <SheetDescription>{$tStore('demonstration.labels.description')}</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose>
                {#snippet child({ props })}
                  <Button variant="outline" {...props}>{$tStore('demonstration.labels.cancel')}</Button>
                {/snippet}
              </SheetClose>
              <Button>{$tStore('demonstration.labels.apply')}</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>{$tStore('demonstration.labels.topLabel')}</Button>
            {/snippet}
          </SheetTrigger>
          <SheetContent side="top">
            <SheetHeader>
              <SheetTitle>{$tStore('demonstration.labels.title')}</SheetTitle>
              <SheetDescription>{$tStore('demonstration.labels.description')}</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose>
                {#snippet child({ props })}
                  <Button variant="outline" {...props}>{$tStore('demonstration.labels.cancel')}</Button>
                {/snippet}
              </SheetClose>
              <Button>{$tStore('demonstration.labels.apply')}</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>{$tStore('demonstration.labels.bottomLabel')}</Button>
            {/snippet}
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>{$tStore('demonstration.labels.title')}</SheetTitle>
              <SheetDescription>{$tStore('demonstration.labels.description')}</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose>
                {#snippet child({ props })}
                  <Button variant="outline" {...props}>{$tStore('demonstration.labels.cancel')}</Button>
                {/snippet}
              </SheetClose>
              <Button>{$tStore('demonstration.labels.apply')}</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
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
        stripHtml($tStore('usage.guidelines.item1')),
        stripHtml($tStore('usage.guidelines.item2')),
        stripHtml($tStore('usage.guidelines.item3')),
        stripHtml($tStore('usage.guidelines.item4')),
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
        { s: $tStore('usage.scenarios.item6.s'), u: $tStore('usage.scenarios.item6.u'), a: $tStore('usage.scenarios.item6.a') },
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
        { element: $tStore('usage.uxWriting.table.title.name'),       rules: $tStore('usage.uxWriting.table.title.format'),       do: $tStore('usage.uxWriting.table.title.good'),       dont: $tStore('usage.uxWriting.table.title.bad') },
        { element: $tStore('usage.uxWriting.table.description.name'), rules: $tStore('usage.uxWriting.table.description.format'), do: $tStore('usage.uxWriting.table.description.good'), dont: $tStore('usage.uxWriting.table.description.bad') },
        { element: $tStore('usage.uxWriting.table.trigger.name'),     rules: $tStore('usage.uxWriting.table.trigger.format'),     do: $tStore('usage.uxWriting.table.trigger.good'),     dont: $tStore('usage.uxWriting.table.trigger.bad') },
        { element: $tStore('usage.uxWriting.table.primary.name'),     rules: $tStore('usage.uxWriting.table.primary.format'),     do: $tStore('usage.uxWriting.table.primary.good'),     dont: $tStore('usage.uxWriting.table.primary.bad') },
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
        stripHtml($tStore('usage.dont.item1')),
        stripHtml($tStore('usage.dont.item2')),
        stripHtml($tStore('usage.dont.item3')),
        stripHtml($tStore('usage.dont.item4')),
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
    <div style="contain: layout">
      <Sheet open>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filtros avançados</SheetTitle>
            <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </SheetClose>
            <Button>Aplicar filtros</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div style="contain: layout">
      <Sheet open>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle class="sr-only">Atenção</SheetTitle>
            <SheetDescription class="sr-only">Sem descrição visível.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <Button>OK</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div style="contain: layout">
      <Sheet open>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filtros avançados</SheetTitle>
            <SheetDescription>Painel lateral à direita para desktop.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </SheetClose>
            <Button>Aplicar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div style="contain: layout">
      <Sheet open>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Filtros avançados</SheetTitle>
            <SheetDescription>Side fixo independente do contexto.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <Button>Aplicar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImportBasic}
    secondaryCode={codeImportUsage}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    items={[
      { name: $tStore('variants.items.right'),  description: stripHtml($tStore('variants.styles.right')),  code: codeRight,  preview: variantRight  },
      { name: $tStore('variants.items.left'),   description: stripHtml($tStore('variants.styles.left')),   code: codeLeft,   preview: variantLeft   },
      { name: $tStore('variants.items.top'),    description: stripHtml($tStore('variants.styles.top')),    code: codeTop,    preview: variantTop    },
      { name: $tStore('variants.items.bottom'), description: stripHtml($tStore('variants.styles.bottom')), code: codeBottom, preview: variantBottom },
    ]}
  />

  {#snippet variantRight()}
    <div style="contain: layout">
      <Sheet open>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Right</SheetTitle>
            <SheetDescription>Desliza da direita (padrão desktop).</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </SheetClose>
            <Button>Aplicar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}
  {#snippet variantLeft()}
    <div style="contain: layout">
      <Sheet open>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Left</SheetTitle>
            <SheetDescription>Desliza da esquerda — útil para navegação secundária.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </SheetClose>
            <Button>Aplicar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}
  {#snippet variantTop()}
    <div style="contain: layout">
      <Sheet open>
        <SheetContent side="top">
          <SheetHeader>
            <SheetTitle>Top</SheetTitle>
            <SheetDescription>Desliza do topo com altura automática.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </SheetClose>
            <Button>Aplicar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}
  {#snippet variantBottom()}
    <div style="contain: layout">
      <Sheet open>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Bottom</SheetTitle>
            <SheetDescription>Desliza de baixo — equivalente a Drawer sem gesto.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </SheetClose>
            <Button>Aplicar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="sheet"
    items={[
      {
        name: $tStore('variants.compositions.advancedFilters.name'),
        description: $tStore('variants.compositions.advancedFilters.description'),
        useWhen: $tStore('variants.compositions.advancedFilters.use'),
        code: `<Sheet>
  <SheetTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Abrir filtros</Button>
    {/snippet}
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Filtros avançados</SheetTitle>
      <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
    </SheetHeader>
    <SheetFooter>
      <SheetClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>Cancelar</Button>
        {/snippet}
      </SheetClose>
      <Button>Aplicar filtros</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`,
        preview: compAdvancedFilters,
      },
      {
        name: $tStore('variants.compositions.secondaryNavigation.name'),
        description: $tStore('variants.compositions.secondaryNavigation.description'),
        useWhen: $tStore('variants.compositions.secondaryNavigation.use'),
        code: `<SheetContent side="left">
  <SheetHeader>
    <SheetTitle>Menu</SheetTitle>
    <SheetDescription>Navegue entre as áreas do sistema.</SheetDescription>
  </SheetHeader>
  <nav aria-label="Navegação secundária" class="flex flex-col gap-1 px-4">
    <a href="#" class="px-3 py-2 rounded-md text-sm hover:bg-accent">Dashboard</a>
    <a href="#" class="px-3 py-2 rounded-md text-sm hover:bg-accent">Projetos</a>
    <a href="#" class="px-3 py-2 rounded-md text-sm hover:bg-accent">Equipe</a>
  </nav>
</SheetContent>`,
        preview: compSecondaryNav,
      },
      {
        name: $tStore('variants.compositions.mobileActions.name'),
        description: $tStore('variants.compositions.mobileActions.description'),
        useWhen: $tStore('variants.compositions.mobileActions.use'),
        code: `<SheetContent side="bottom">
  <SheetHeader>
    <SheetTitle>Ações rápidas</SheetTitle>
    <SheetDescription>Escolha o que fazer com este item.</SheetDescription>
  </SheetHeader>
  <div class="grid grid-cols-3 gap-3 px-4 text-sm">
    <button type="button" class="p-3 rounded-md border hover:bg-accent">Compartilhar</button>
    <button type="button" class="p-3 rounded-md border hover:bg-accent">Editar</button>
    <button type="button" class="p-3 rounded-md border hover:bg-accent">Excluir</button>
  </div>
</SheetContent>`,
        preview: compMobileActions,
      },
      {
        name: $tStore('variants.compositions.longScrollBody.name'),
        description: $tStore('variants.compositions.longScrollBody.description'),
        useWhen: $tStore('variants.compositions.longScrollBody.use'),
        code: `<SheetContent side="right">
  <SheetHeader>
    <SheetTitle>Termos de uso</SheetTitle>
    <SheetDescription>Leia atentamente antes de aceitar.</SheetDescription>
  </SheetHeader>
  <div class="space-y-3 px-4 text-sm text-muted-foreground">
    {#each Array(12) as _, i}
      <p>Parágrafo {i + 1}: termos longos…</p>
    {/each}
  </div>
  <SheetFooter>
    <Button>Aceitar termos</Button>
  </SheetFooter>
</SheetContent>`,
        preview: compLongScroll,
      },
    ]}
  />

  {#snippet compAdvancedFilters()}
    <div style="contain: layout">
      <Sheet open>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filtros avançados</SheetTitle>
            <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </SheetClose>
            <Button>Aplicar filtros</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}

  {#snippet compSecondaryNav()}
    <div style="contain: layout">
      <Sheet open>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Navegue entre as áreas do sistema.</SheetDescription>
          </SheetHeader>
          <nav aria-label="Navegação secundária" class="flex flex-col gap-1 px-4">
            <a href="#" class="px-3 py-2 rounded-md text-sm hover:bg-accent">Dashboard</a>
            <a href="#" class="px-3 py-2 rounded-md text-sm hover:bg-accent">Projetos</a>
            <a href="#" class="px-3 py-2 rounded-md text-sm hover:bg-accent">Equipe</a>
            <a href="#" class="px-3 py-2 rounded-md text-sm hover:bg-accent">Configurações</a>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}

  {#snippet compMobileActions()}
    <div style="contain: layout">
      <Sheet open>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Ações rápidas</SheetTitle>
            <SheetDescription>Escolha o que fazer com este item.</SheetDescription>
          </SheetHeader>
          <div class="grid grid-cols-3 gap-3 px-4 text-sm">
            <button type="button" class="p-3 rounded-md border hover:bg-accent">Compartilhar</button>
            <button type="button" class="p-3 rounded-md border hover:bg-accent">Editar</button>
            <button type="button" class="p-3 rounded-md border hover:bg-accent">Excluir</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}

  {#snippet compLongScroll()}
    <div style="contain: layout">
      <Sheet open>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Termos de uso</SheetTitle>
            <SheetDescription>Leia atentamente antes de aceitar.</SheetDescription>
          </SheetHeader>
          <div class="space-y-3 px-4 text-sm text-muted-foreground max-h-64 overflow-auto">
            {#each Array(12) as _, i}
              <p>Parágrafo {i + 1}: termos de uso longos para garantir que o body precise rolar internamente sem expandir o painel.</p>
            {/each}
          </div>
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </SheetClose>
            <Button>Aceitar termos</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('props.table.prop'),
      trigger: $tNavStore('common.userAction'),
      behavior: $tNavStore('common.expectedResult'),
    }}
    items={[
      { label: $tStore('states.items.closed'),         trigger: 'defaultOpen=false',  behavior: stripHtml($tStore('states.descriptions.closed'))         },
      { label: $tStore('states.items.open'),           trigger: 'click trigger',       behavior: stripHtml($tStore('states.descriptions.open'))           },
      { label: $tStore('states.items.transitioning'),  trigger: 'open ↔ closed',       behavior: stripHtml($tStore('states.descriptions.transitioning')) },
      { label: $tStore('states.items.focused'),        trigger: 'Tab',                 behavior: stripHtml($tStore('states.descriptions.focused'))        },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        cols: propsTableCols,
        items: [
          { name: 'open',            type: $tStore('props.table.open.type'),            defaultValue: $tStore('props.table.open.default'),            required: $tStore('props.table.open.required'),            description: stripHtml($tStore('props.table.open.description'))            },
          { name: 'defaultOpen',     type: $tStore('props.table.defaultOpen.type'),     defaultValue: $tStore('props.table.defaultOpen.default'),     required: $tStore('props.table.defaultOpen.required'),     description: $tStore('props.table.defaultOpen.description')                },
          { name: 'onOpenChange',    type: $tStore('props.table.onOpenChange.type'),    defaultValue: $tStore('props.table.onOpenChange.default'),    required: $tStore('props.table.onOpenChange.required'),    description: $tStore('props.table.onOpenChange.description')               },
          { name: 'side',            type: $tStore('props.table.side.type'),            defaultValue: $tStore('props.table.side.default'),            required: $tStore('props.table.side.required'),            description: stripHtml($tStore('props.table.side.description'))            },
          { name: 'showCloseButton', type: $tStore('props.table.showCloseButton.type'), defaultValue: $tStore('props.table.showCloseButton.default'), required: $tStore('props.table.showCloseButton.required'), description: stripHtml($tStore('props.table.showCloseButton.description')) },
          { name: 'class',           type: $tStore('props.table.className.type'),       defaultValue: $tStore('props.table.className.default'),       required: $tStore('props.table.className.required'),       description: stripHtml($tStore('props.table.className.description'))       },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={$tStore('props.extensibilityCode')}
  />

  <!-- ── Tokens ─────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      { token: '--popover',            value: $tStore('tokens.table.popover.class'),           description: $tStore('tokens.table.popover.part')           },
      { token: '--popover-foreground', value: $tStore('tokens.table.popoverForeground.class'), description: $tStore('tokens.table.popoverForeground.part') },
      { token: '--foreground',         value: $tStore('tokens.table.foreground.class'),        description: $tStore('tokens.table.foreground.part')        },
      { token: '--muted-foreground',   value: $tStore('tokens.table.mutedForeground.class'),   description: $tStore('tokens.table.mutedForeground.part')   },
      { token: '--border',             value: $tStore('tokens.table.border.class'),            description: $tStore('tokens.table.border.part')            },
      { token: '--ring',               value: $tStore('tokens.table.ring.class'),              description: $tStore('tokens.table.ring.part')              },
      { token: 'overlay',              value: $tStore('tokens.table.overlay.class'),           description: $tStore('tokens.table.overlay.part')           },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      stripHtml($tStore('accessibility.items.item1')),
      stripHtml($tStore('accessibility.items.item2')),
      stripHtml($tStore('accessibility.items.item3')),
      $tStore('accessibility.items.item4'),
      stripHtml($tStore('accessibility.items.item5')),
      $tStore('accessibility.items.item6'),
      $tStore('accessibility.items.item7'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',       description: $tStore('accessibility.keyboard.tab')      },
      { key: 'Shift+Tab', description: $tStore('accessibility.keyboard.shiftTab') },
      { key: 'Escape',    description: $tStore('accessibility.keyboard.escape')   },
      { key: 'Enter',     description: $tStore('accessibility.keyboard.enter')    },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.drawer.name'),      description: $tStore('related.items.drawer.description'),      path: '?path=/docs/ui-drawer--docs'      },
      { name: $tStore('related.items.dialog.name'),      description: $tStore('related.items.dialog.description'),      path: '?path=/docs/ui-dialog--docs'      },
      { name: $tStore('related.items.alertDialog.name'), description: $tStore('related.items.alertDialog.description'), path: '?path=/docs/ui-alertdialog--docs' },
      { name: $tStore('related.items.popover.name'),     description: $tStore('related.items.popover.description'),     path: '?path=/docs/ui-popover--docs'     },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: stripHtml($tStore('notes.item1')) },
      { title: '', content: stripHtml($tStore('notes.item2')) },
      { title: '', content: stripHtml($tStore('notes.item3')) },
      { title: '', content: stripHtml($tStore('notes.item4')) },
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
      { event: 'dialog_open',    trigger: $tStore('analytics.table.dialog_open.trigger'),    payload: $tStore('analytics.table.dialog_open.payload')    },
      { event: 'dialog_close',   trigger: $tStore('analytics.table.dialog_close.trigger'),   payload: $tStore('analytics.table.dialog_close.payload')   },
      { event: 'dialog_confirm', trigger: $tStore('analytics.table.dialog_confirm.trigger'), payload: $tStore('analytics.table.dialog_confirm.payload') },
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
      items: [1, 2, 3, 4].map((i) => ({
        action: $tStore(`testes.functional.item${i}.action`),
        result: $tStore(`testes.functional.item${i}.result`),
        priority: localPriority($tStore(`testes.functional.item${i}.priority`), $tNavStore),
      })),
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: [
        { criterion: $tStore('testes.accessibility.item1'), level: 'AA',    how: '—' },
        { criterion: $tStore('testes.accessibility.item2'), level: '1.4.3', how: '—' },
        { criterion: $tStore('testes.accessibility.item3'), level: '4.1.2', how: '—' },
        { criterion: $tStore('testes.accessibility.item4'), level: '4.1.2', how: '—' },
        { criterion: $tStore('testes.accessibility.item5'), level: '4.1.2', how: '—' },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4].map((i) => ({
        story: $tStore(`testes.visual.item${i}.story`),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>

<!-- sanitizeHtml available para uso futuro em {@html} dinâmico -->
{#if false}
  {@html sanitizeHtml('')}
{/if}
