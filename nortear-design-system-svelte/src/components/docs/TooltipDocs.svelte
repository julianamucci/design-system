<script lang="ts">
  import { untrack } from 'svelte';
  import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
  } from '@/components/ui/tooltip';
  import { Button } from '@/components/ui/button';
  import Save from '@lucide/svelte/icons/save';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Share2 from '@lucide/svelte/icons/share-2';
  import HelpCircle from '@lucide/svelte/icons/circle-question-mark';
  import Info from '@lucide/svelte/icons/info';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DOMPurify from 'dompurify';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import tooltipTranslations from '@shared/content/tooltip/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(tooltipTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = $derived(
    Object.values(
      (tooltipTranslations as unknown as Record<
        string,
        { accessibility?: { screenReader?: Record<string, string> } }
      >)[$locale]?.accessibility?.screenReader ?? {},
    ),
  );

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'tooltip',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/overlay' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'tooltip',
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
        { id: 'composicoes',  label: tNav('nav.compositions') },
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

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'tooltip', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";`;

  const codeImportUsage = `<!-- No root da app — uma única vez -->
<TooltipProvider delayDuration={400}>
  <App />
</TooltipProvider>

<!-- Onde precisar -->
<Tooltip>
  <TooltipTrigger>
    {#snippet child({ props })}
      <Button variant="ghost" size="icon" aria-label="Salvar" {...props}>
        <Save aria-hidden="true" class="nds-icon" />
      </Button>
    {/snippet}
  </TooltipTrigger>
  <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
</Tooltip>`;

  const codeDefault = `<Tooltip>
  <TooltipTrigger>
    {#snippet child({ props })}
      <Button variant="outline" size="icon" aria-label="Salvar" {...props}>
        <Save aria-hidden="true" class="nds-icon" />
      </Button>
    {/snippet}
  </TooltipTrigger>
  <TooltipContent>Salvar item</TooltipContent>
</Tooltip>`;

  const codeWithShortcut = `<Tooltip>
  <TooltipTrigger>
    {#snippet child({ props })}
      <Button variant="outline" size="icon" aria-label="Salvar" {...props}>
        <Save aria-hidden="true" class="nds-icon" />
      </Button>
    {/snippet}
  </TooltipTrigger>
  <TooltipContent>
    Salvar
    <kbd data-slot="kbd">Ctrl</kbd>
    <kbd data-slot="kbd">S</kbd>
  </TooltipContent>
</Tooltip>`;

  const codeLongText = `<Tooltip>
  <TooltipTrigger>
    {#snippet child({ props })}
      <Button variant="outline" size="icon" aria-label="Compartilhar link" {...props}>
        <Share2 aria-hidden="true" class="nds-icon" />
      </Button>
    {/snippet}
  </TooltipTrigger>
  <TooltipContent>
    Compartilhe o link público desta página com qualquer pessoa.
  </TooltipContent>
</Tooltip>`;

  // O snippet de customização vem do conteúdo compartilhado
  // (`tokens.customizationCode`, variante svelte). A cópia local que morava
  // aqui ensinava `@apply` — diretiva de um framework utilitário que saiu do
  // projeto — e por isso era conselho inerte.

  const interfaceCode = `// TooltipProvider (bits-ui)
interface TooltipProviderProps {
  delayDuration?: number;
  disableHoverableContent?: boolean;
  children?: Snippet;
}

// Tooltip (Root)
interface TooltipProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: Snippet;
}

// TooltipContent
interface TooltipContentProps {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  class?: string;
}

// TooltipTrigger
interface TooltipTriggerProps {
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

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="tooltip">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    <TooltipProvider delayDuration={200}>
      <div class="nds-cluster nds-w-full nds-min-h-30" data-justify="center" data-align="center" data-spacing="lg" style="contain: layout; position: relative">
        <Tooltip onOpenChange={(o: boolean) => { if (o) track('tooltip_view', { component: 'tooltip', trigger_id: 'save', location: 'docs_demo' }); }}>
          <TooltipTrigger>
            {#snippet child({ props })}
              <Button variant="outline" size="icon" aria-label={$tStore('demonstration.labels.saveButton')} {...props}>
                <Save aria-hidden="true" class="nds-icon" />
              </Button>
            {/snippet}
          </TooltipTrigger>
          <TooltipContent>{$tStore('demonstration.labels.save')}</TooltipContent>
        </Tooltip>

        <Tooltip onOpenChange={(o: boolean) => { if (o) track('tooltip_view', { component: 'tooltip', trigger_id: 'delete', location: 'docs_demo' }); }}>
          <TooltipTrigger>
            {#snippet child({ props })}
              <Button variant="outline" size="icon" aria-label={$tStore('demonstration.labels.deleteButton')} {...props}>
                <Trash2 aria-hidden="true" class="nds-icon" />
              </Button>
            {/snippet}
          </TooltipTrigger>
          <TooltipContent>{$tStore('demonstration.labels.delete')}</TooltipContent>
        </Tooltip>

        <Tooltip onOpenChange={(o: boolean) => { if (o) track('tooltip_view', { component: 'tooltip', trigger_id: 'share', location: 'docs_demo' }); }}>
          <TooltipTrigger>
            {#snippet child({ props })}
              <Button variant="outline" size="icon" aria-label={$tStore('demonstration.labels.shareButton')} {...props}>
                <Share2 aria-hidden="true" class="nds-icon" />
              </Button>
            {/snippet}
          </TooltipTrigger>
          <TooltipContent>{$tStore('demonstration.labels.share')}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  </DocsDemonstration>

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
    title={$tStore('anatomy.title')}
    items={[
      $tStore('anatomy.item1'),
      $tStore('anatomy.item2'),
      $tStore('anatomy.item3'),
      $tStore('anatomy.item4'),
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
        { element: $tStore('usage.uxWriting.table.content.name'),  rules: toPlainText($tStore('usage.uxWriting.table.content.format')),  do: $tStore('usage.uxWriting.table.content.good'),  dont: $tStore('usage.uxWriting.table.content.bad') },
        { element: $tStore('usage.uxWriting.table.shortcut.name'), rules: toPlainText($tStore('usage.uxWriting.table.shortcut.format')), do: $tStore('usage.uxWriting.table.shortcut.good'), dont: $tStore('usage.uxWriting.table.shortcut.bad') },
        { element: $tStore('usage.uxWriting.table.icon.name'),     rules: toPlainText($tStore('usage.uxWriting.table.icon.format')),     do: $tStore('usage.uxWriting.table.icon.good'),     dont: $tStore('usage.uxWriting.table.icon.bad') },
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
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon" aria-label="Salvar" {...props}>
              <Save aria-hidden="true" class="nds-icon" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  {/snippet}
  {#snippet dontPair1()}
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>
          {#snippet child({ props })}
            <!-- Anti-pattern didático (tooltip no lugar do rótulo); aria-label
                 invisível mantém o botão nomeado para o axe sem mudar o visual. -->
            <Button variant="outline" size="icon" aria-label={$tStore('demonstration.labels.saveButton')} {...props}>
              <Save aria-hidden="true" class="nds-icon" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>Salvar</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  {/snippet}
  {#snippet doPair2()}
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon" aria-label="Salvar" {...props}>
              <Save aria-hidden="true" class="nds-icon" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  {/snippet}
  {#snippet dontPair2()}
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon" aria-label="Salvar" {...props}>
              <Save aria-hidden="true" class="nds-icon" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>
          Clique aqui para salvar o documento atual no servidor — pode demorar alguns segundos dependendo do tamanho.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImportBasic}
    secondaryCode={codeImportUsage}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsCompositions
    id="variantes"
    title={$tStore('variants.title')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="tooltip"
    items={[
      { trackId: 'default', name: $tStore('variants.items.default'),      description: stripHtml($tStore('variants.styles.default')),      code: codeDefault,      preview: variantDefault      },
      { trackId: 'withShortcut', name: $tStore('variants.items.withShortcut'), description: stripHtml($tStore('variants.styles.withShortcut')), code: codeWithShortcut, preview: variantWithShortcut },
      { trackId: 'longText', name: $tStore('variants.items.longText'),     description: stripHtml($tStore('variants.styles.longText')),     code: codeLongText,     preview: variantLongText     },
      {
        trackId: 'positioningSides',
        name: $tStore('variants.items.positioningSides.name'),
        description: $tStore('variants.items.positioningSides.description'),
        useWhen: $tStore('variants.items.positioningSides.use'),
        code: `<div class="nds-grid nds-w-full" data-spacing="xl" style="place-items: center">
  {#each ['top','right','bottom','left'] as s}
    <Tooltip>
      <TooltipTrigger>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>{s}</Button>
        {/snippet}
      </TooltipTrigger>
      <TooltipContent side={s}>Tooltip {s}</TooltipContent>
    </Tooltip>
  {/each}
</div>`,
        preview: variantPositioningSides,
      },
    ]}
  />

  {#snippet variantDefault()}
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon" aria-label="Salvar" {...props}>
              <Save aria-hidden="true" class="nds-icon" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>Salvar item</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  {/snippet}
  {#snippet variantWithShortcut()}
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon" aria-label="Salvar" {...props}>
              <Save aria-hidden="true" class="nds-icon" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>
          <span>Salvar</span>
          <kbd data-slot="kbd" class="nds-kbd">Ctrl</kbd>
          <kbd data-slot="kbd" class="nds-kbd">S</kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  {/snippet}
  {#snippet variantLongText()}
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon" aria-label="Compartilhar link" {...props}>
              <Share2 aria-hidden="true" class="nds-icon" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>
          Compartilhe o link público desta página com qualquer pessoa.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  {/snippet}

  <!-- ── Composições ─────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="tooltip"
    items={[
      {
        trackId: 'iconButtonWithShortcut',
        name: $tStore('variants.compositions.iconButtonWithShortcut.name'),
        description: $tStore('variants.compositions.iconButtonWithShortcut.description'),
        useWhen: $tStore('variants.compositions.iconButtonWithShortcut.use'),
        code: `<Tooltip>
  <TooltipTrigger>
    {#snippet child({ props })}
      <Button variant="ghost" size="icon" aria-label="Salvar" {...props}>
        <Save aria-hidden="true" />
      </Button>
    {/snippet}
  </TooltipTrigger>
  <TooltipContent>
    Salvar <kbd>Ctrl</kbd><kbd>S</kbd>
  </TooltipContent>
</Tooltip>`,
        preview: compIconShortcut,
      },
      {
        trackId: 'formFieldHelp',
        name: $tStore('variants.compositions.formFieldHelp.name'),
        description: $tStore('variants.compositions.formFieldHelp.description'),
        useWhen: $tStore('variants.compositions.formFieldHelp.use'),
        code: `<div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">
  <div class="nds-cluster" data-spacing="sm">
    <label for="api-token" class="nds-text-body nds-font-medium">Token de API</label>
    <Tooltip>
      <TooltipTrigger>
        {#snippet child({ props })}
          <Button variant="ghost" size="icon" aria-label="Ajuda sobre Token de API" {...props}>
            <HelpCircle aria-hidden="true" />
          </Button>
        {/snippet}
      </TooltipTrigger>
      <TooltipContent side="right" class="nds-max-w-xs">
        Cole o token gerado em Configurações &gt; Integrações.
      </TooltipContent>
    </Tooltip>
  </div>
  <input id="api-token" type="text" class="nds-input" placeholder="sk-..." />
</div>`,
        preview: compFormHelp,
      },
      {
        trackId: 'metricDescription',
        name: $tStore('variants.compositions.metricDescription.name'),
        description: $tStore('variants.compositions.metricDescription.description'),
        useWhen: $tStore('variants.compositions.metricDescription.use'),
        code: `<div class="nds-stack" data-spacing="xs">
  <div class="nds-cluster" data-spacing="sm">
    <p class="nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider">LCP</p>
    <Tooltip>
      <TooltipTrigger>
        {#snippet child({ props })}
          <Button variant="ghost" size="icon" aria-label="O que é LCP" {...props}>
            <Info aria-hidden="true" />
          </Button>
        {/snippet}
      </TooltipTrigger>
      <TooltipContent side="top" class="nds-max-w-xs">
        Largest Contentful Paint — tempo até o maior elemento visível ser renderizado.
      </TooltipContent>
    </Tooltip>
  </div>
  <p class="nds-text-h3 nds-m-0">1.8s</p>
</div>`,
        preview: compMetric,
      },
    ]}
  />

  {#snippet compIconShortcut()}
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="ghost" size="icon" aria-label="Salvar" {...props}>
              <Save aria-hidden="true" class="nds-icon" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>
          <span>Salvar</span>
          <kbd data-slot="kbd" class="nds-kbd">Ctrl</kbd>
          <kbd data-slot="kbd" class="nds-kbd">S</kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  {/snippet}

  {#snippet compFormHelp()}
    <TooltipProvider delayDuration={0}>
      <div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs" style="align-items: flex-start">
        <div class="nds-cluster" data-spacing="sm">
          <label for="api-token-svelte-comp" class="nds-text-body nds-font-medium">Token de API</label>
          <Tooltip>
            <TooltipTrigger>
              {#snippet child({ props })}
                <Button variant="ghost" size="icon" aria-label="Ajuda sobre Token de API" {...props}>
                  <HelpCircle aria-hidden="true" class="nds-icon" />
                </Button>
              {/snippet}
            </TooltipTrigger>
            <TooltipContent side="right" class="nds-max-w-xs">
              Cole o token gerado em Configurações &gt; Integrações.
            </TooltipContent>
          </Tooltip>
        </div>
        <input
          id="api-token-svelte-comp"
          type="text"
          class="nds-input"
          placeholder="sk-..."
        />
      </div>
    </TooltipProvider>
  {/snippet}

  {#snippet compMetric()}
    <TooltipProvider delayDuration={0}>
      <div class="nds-stack" data-spacing="xs" style="align-items: flex-start">
        <div class="nds-cluster" data-spacing="sm">
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider">LCP</p>
          <Tooltip>
            <TooltipTrigger>
              {#snippet child({ props })}
                <Button variant="ghost" size="icon" aria-label="O que é LCP" {...props}>
                  <Info aria-hidden="true" class="nds-icon" />
                </Button>
              {/snippet}
            </TooltipTrigger>
            <TooltipContent side="top" class="nds-max-w-xs">
              Largest Contentful Paint — tempo até o maior elemento visível ser renderizado.
            </TooltipContent>
          </Tooltip>
        </div>
        <p class="nds-text-h3 nds-m-0">1.8s</p>
      </div>
    </TooltipProvider>
  {/snippet}

  {#snippet variantPositioningSides()}
    <TooltipProvider delayDuration={0}>
      <div class="nds-grid nds-w-full nds-min-h-40" data-spacing="xl" style="contain: layout; place-items: center">
        <Tooltip>
          <TooltipTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>Top</Button>
            {/snippet}
          </TooltipTrigger>
          <TooltipContent side="top">Tooltip top</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>Right</Button>
            {/snippet}
          </TooltipTrigger>
          <TooltipContent side="right">Tooltip right</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>Bottom</Button>
            {/snippet}
          </TooltipTrigger>
          <TooltipContent side="bottom">Tooltip bottom</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>Left</Button>
            {/snippet}
          </TooltipTrigger>
          <TooltipContent side="left">Tooltip left</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: toPlainText($tStore('states.cols.trigger')),
      behavior: toPlainText($tStore('states.cols.behavior')),
    }}
    items={[
      { label: $tStore('states.closed.label'),  trigger: toPlainText($tStore('states.closed.trigger')),  behavior: toPlainText($tStore('states.closed.behavior')) },
      { label: $tStore('states.open.label'),    trigger: toPlainText($tStore('states.open.trigger')),    behavior: toPlainText($tStore('states.open.behavior')) },
      { label: $tStore('states.hover.label'),   trigger: toPlainText($tStore('states.hover.trigger')),   behavior: toPlainText($tStore('states.hover.behavior')) },
      { label: $tStore('states.focus.label'),   trigger: toPlainText($tStore('states.focus.trigger')),   behavior: toPlainText($tStore('states.focus.behavior')) },
      { label: $tStore('states.delayed.label'), trigger: toPlainText($tStore('states.delayed.trigger')), behavior: toPlainText($tStore('states.delayed.behavior')) },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        cols: propsTableCols,
        items: [
          { name: 'delay',        type: $tStore('props.table.delay.type'),        defaultValue: $tStore('props.table.delay.default'),        required: $tStore('props.table.delay.required'),        description: toPlainText($tStore('props.table.delay.description'))        },
          { name: 'open',         type: $tStore('props.table.open.type'),         defaultValue: $tStore('props.table.open.default'),         required: $tStore('props.table.open.required'),         description: toPlainText($tStore('props.table.open.description'))         },
          { name: 'defaultOpen',  type: $tStore('props.table.defaultOpen.type'),  defaultValue: $tStore('props.table.defaultOpen.default'),  required: $tStore('props.table.defaultOpen.required'),  description: toPlainText($tStore('props.table.defaultOpen.description'))  },
          { name: 'onOpenChange', type: $tStore('props.table.onOpenChange.type'), defaultValue: $tStore('props.table.onOpenChange.default'), required: $tStore('props.table.onOpenChange.required'), description: toPlainText($tStore('props.table.onOpenChange.description')) },
          { name: 'side',         type: $tStore('props.table.side.type'),         defaultValue: $tStore('props.table.side.default'),         required: $tStore('props.table.side.required'),         description: toPlainText($tStore('props.table.side.description'))         },
          { name: 'align',        type: $tStore('props.table.align.type'),        defaultValue: $tStore('props.table.align.default'),        required: $tStore('props.table.align.required'),        description: toPlainText($tStore('props.table.align.description'))        },
          { name: 'sideOffset',   type: $tStore('props.table.sideOffset.type'),   defaultValue: $tStore('props.table.sideOffset.default'),   required: $tStore('props.table.sideOffset.required'),   description: toPlainText($tStore('props.table.sideOffset.description'))   },
          { name: 'class',        type: $tStore('props.table.className.type'),    defaultValue: $tStore('props.table.className.default'),    required: $tStore('props.table.className.required'),    description: toPlainText($tStore('props.table.className.description'))    },
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
      // Os tokens são os que a folha compartilhada realmente usa
      // (docs/shared/styles/nds/tooltip.css). A tabela documentava
      // --foreground/--background e dois rótulos que nem token eram.
      { token: '--primary',         value: $tStore('tokens.table.foreground.class'), description: $tStore('tokens.table.foreground.part') },
      { token: '--primary-foreground', value: $tStore('tokens.table.background.class'), description: $tStore('tokens.table.background.part') },
      { token: '--primary',            value: $tStore('tokens.table.fill.class'),       description: $tStore('tokens.table.fill.part')       },
      { token: '--radius-sm',          value: $tStore('tokens.table.radius.class'),     description: $tStore('tokens.table.radius.part')     },
      { token: '--z-tooltip',          value: $tStore('tokens.table.zIndex.class'),     description: $tStore('tokens.table.zIndex.part')     },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    screenReaderTitle={$tNavStore('common.screenReader')}
    screenReaderItems={screenReaderItems}
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      stripHtml($tStore('accessibility.items.item1')),
      stripHtml($tStore('accessibility.items.item2')),
      stripHtml($tStore('accessibility.items.item3')),
      stripHtml($tStore('accessibility.items.item4')),
      stripHtml($tStore('accessibility.items.item5')),
      stripHtml($tStore('accessibility.items.item6')),
    ]}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',       description: toPlainText($tStore('accessibility.keyboard.tab'))      },
      { key: 'Escape',    description: toPlainText($tStore('accessibility.keyboard.escape'))   },
      { key: 'Shift+Tab', description: toPlainText($tStore('accessibility.keyboard.shiftTab')) },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.popover.name'),   description: $tStore('related.items.popover.description'),   path: '?path=/docs/primitives-overlay-popover--docs'   },
      { name: $tStore('related.items.hoverCard.name'), description: $tStore('related.items.hoverCard.description'), path: '?path=/docs/primitives-overlay-hovercard--docs' },
      { name: $tStore('related.items.button.name'),    description: $tStore('related.items.button.description'),    path: '?path=/docs/primitives-form-button--docs'    },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: $tStore('notes.item1') },
      { title: '', content: $tStore('notes.item2') },
      { title: '', content: $tStore('notes.item3') },
      { title: '', content: $tStore('notes.item4') },
    ]}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: toPlainText($tStore('analytics.table.trigger')),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: 'tooltip_view', trigger: toPlainText($tStore('analytics.table.tooltip_view.trigger')), payload: $tStore('analytics.table.tooltip_view.payload') },
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
        action: toPlainText($tStore(`testes.functional.item${i}.action`)),
        result: toPlainText($tStore(`testes.functional.item${i}.result`)),
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
        { criterion: toPlainText($tStore('testes.accessibility.item1')), level: 'AA',     how: 'axe-core'         },
        { criterion: toPlainText($tStore('testes.accessibility.item2')), level: '1.4.3',  how: 'Contrast checker' },
        { criterion: toPlainText($tStore('testes.accessibility.item3')), level: '4.1.2',  how: 'DevTools a11y'    },
        { criterion: toPlainText($tStore('testes.accessibility.item4')), level: '1.3.1',  how: 'DevTools a11y'    },
        { criterion: toPlainText($tStore('testes.accessibility.item5')), level: '4.1.2',  how: 'DevTools a11y'    },
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

<!-- DOMPurify.sanitize available para uso futuro em {@html} dinâmico -->
{#if false}
  {@html DOMPurify.sanitize('')}
{/if}
