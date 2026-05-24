<script lang="ts">
  import { Badge } from '@/components/ui/badge';
  import { Check, Tag as TagIcon, Bell } from 'lucide-svelte';
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
  import badgeTranslations from '@shared/content/badge/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(badgeTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'badge',
    });
    track('docs_page_view', {
      component_name: 'badge',
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
    track('docs_section_viewed', { section_id: id, component_name: 'badge', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function stripHtml(s: string) {
    return s.replace(/<[^>]*>/g, '');
  }

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import { Badge } from "@/components/ui/badge";`;
  const codeImportWithIcon = `import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-svelte";`;

  const codeDefault = `<Badge variant="default">Novo</Badge>`;
  const codeSecondary = `<Badge variant="secondary">Beta</Badge>`;
  const codeDestructive = `<Badge variant="destructive">Urgente</Badge>`;
  const codeOutline = `<Badge variant="outline">Rascunho</Badge>`;

  const codeWithIcon = `<Badge variant="default">
  <Check aria-hidden="true" />
  Ativo
</Badge>`;

  const codeCountBadge = `<Badge
  variant="destructive"
  aria-label="12 notificações não lidas"
>
  12
</Badge>`;

  const codeAsLink = `<Badge
  variant="secondary"
  href="/categoria/design"
  aria-label="Filtrar por categoria Design"
>
  Design
</Badge>`;

  const codeAsTrigger = `<button
  type="button"
  aria-label="Filtrar por tag React"
  onclick={() => applyFilter('react')}
>
  <Badge variant="outline">React</Badge>
</button>`;

  const codeCustomizationTokens = `/* Em globals.css — personalizar tokens do Badge */
:root {
  --primary: 222 47% 11%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 210 40% 98%;
}`;

  const interfaceCode = `// Badge
interface BadgeProps extends HTMLAnchorAttributes {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  href?: string;
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
      installNote="npx shadcn-svelte@latest add badge"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="flex flex-wrap items-center gap-3">
        <Badge variant="default">{$tStore('demonstration.labels.defaultLabel')}</Badge>
        <Badge variant="secondary">{$tStore('demonstration.labels.secondaryLabel')}</Badge>
        <Badge variant="destructive">{$tStore('demonstration.labels.destructiveLabel')}</Badge>
        <Badge variant="outline">{$tStore('demonstration.labels.outlineLabel')}</Badge>
        <Badge variant="default">
          <Check aria-hidden="true" />
          {$tStore('demonstration.labels.statusLabel')}
        </Badge>
        <Badge variant="secondary">
          <TagIcon aria-hidden="true" />
          {$tStore('demonstration.labels.tagLabel')}
        </Badge>
        <Badge variant="destructive" aria-label="12 notificações não lidas">
          {$tStore('demonstration.labels.countLabel')}
        </Badge>
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
        { element: $tStore('usage.uxWriting.table.label.name'),    rules: $tStore('usage.uxWriting.table.label.format'),    do: $tStore('usage.uxWriting.table.label.good'),    dont: $tStore('usage.uxWriting.table.label.bad') },
        { element: $tStore('usage.uxWriting.table.status.name'),   rules: $tStore('usage.uxWriting.table.status.format'),   do: $tStore('usage.uxWriting.table.status.good'),   dont: $tStore('usage.uxWriting.table.status.bad') },
        { element: $tStore('usage.uxWriting.table.count.name'),    rules: $tStore('usage.uxWriting.table.count.format'),    do: $tStore('usage.uxWriting.table.count.good'),    dont: $tStore('usage.uxWriting.table.count.bad') },
        { element: $tStore('usage.uxWriting.table.category.name'), rules: $tStore('usage.uxWriting.table.category.format'), do: $tStore('usage.uxWriting.table.category.good'), dont: $tStore('usage.uxWriting.table.category.bad') },
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
    <Badge variant="default">Ativo</Badge>
  {/snippet}
  {#snippet dontPair1()}
    <Badge variant="default">Este item está atualmente ativo no sistema</Badge>
  {/snippet}
  {#snippet doPair2()}
    <Badge variant="destructive">Expirado</Badge>
  {/snippet}
  {#snippet dontPair2()}
    <Badge variant="destructive">Novo</Badge>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryDescription={$tStore('import.withIcon')}
    secondaryCode={codeImportWithIcon}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    items={[
      { name: 'default',     description: stripHtml($tStore('variants.items.default')),     code: codeDefault,     preview: variantDefault     },
      { name: 'secondary',   description: stripHtml($tStore('variants.items.secondary')),   code: codeSecondary,   preview: variantSecondary   },
      { name: 'destructive', description: stripHtml($tStore('variants.items.destructive')), code: codeDestructive, preview: variantDestructive },
      { name: 'outline',     description: stripHtml($tStore('variants.items.outline')),     code: codeOutline,     preview: variantOutline     },
    ]}
  />

  {#snippet variantDefault()}
    <Badge variant="default">{$tStore('demonstration.labels.defaultLabel')}</Badge>
  {/snippet}
  {#snippet variantSecondary()}
    <Badge variant="secondary">{$tStore('demonstration.labels.secondaryLabel')}</Badge>
  {/snippet}
  {#snippet variantDestructive()}
    <Badge variant="destructive">{$tStore('demonstration.labels.destructiveLabel')}</Badge>
  {/snippet}
  {#snippet variantOutline()}
    <Badge variant="outline">{$tStore('demonstration.labels.outlineLabel')}</Badge>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="badge"
    items={[
      {
        name: $tStore('variants.compositions.withIcon.name'),
        description: $tStore('variants.compositions.withIcon.description'),
        useWhen: $tStore('variants.compositions.withIcon.use'),
        code: `<Badge>\n  <Check class="h-3 w-3" aria-hidden="true" />\n  Ativo\n</Badge>`,
        preview: compWithIcon,
      },
      {
        name: $tStore('variants.compositions.count.name'),
        description: $tStore('variants.compositions.count.description'),
        useWhen: $tStore('variants.compositions.count.use'),
        code: `<span role="status" aria-label="12 notificações não lidas" class="inline-flex items-center gap-2">\n  <Bell class="h-5 w-5" aria-hidden="true" />\n  <Badge variant="destructive">12</Badge>\n</span>`,
        preview: compCount,
      },
      {
        name: $tStore('variants.compositions.asLink.name'),
        description: $tStore('variants.compositions.asLink.description'),
        useWhen: $tStore('variants.compositions.asLink.use'),
        code: `<a href="#design" aria-label="Ver todos os itens da categoria Design" class="inline-flex">\n  <Badge variant="secondary">Design</Badge>\n</a>`,
        preview: compAsLink,
      },
      {
        name: $tStore('variants.compositions.asTrigger.name'),
        description: $tStore('variants.compositions.asTrigger.description'),
        useWhen: $tStore('variants.compositions.asTrigger.use'),
        code: `<button type="button" aria-label="Filtrar por React" class="inline-flex bg-transparent p-0 border-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus:outline-none rounded-md">\n  <Badge variant="outline">React</Badge>\n</button>`,
        preview: compAsTrigger,
      },
    ]}
  />

  {#snippet compWithIcon()}
    <Badge>
      <Check class="h-3 w-3" aria-hidden="true" />
      Ativo
    </Badge>
  {/snippet}
  {#snippet compCount()}
    <span role="status" aria-label="12 notificações não lidas" class="inline-flex items-center gap-2">
      <Bell class="h-5 w-5" aria-hidden="true" />
      <Badge variant="destructive">12</Badge>
    </span>
  {/snippet}
  {#snippet compAsLink()}
    <a href="#design" aria-label="Ver todos os itens da categoria Design" class="inline-flex">
      <Badge variant="secondary">Design</Badge>
    </a>
  {/snippet}
  {#snippet compAsTrigger()}
    <button type="button" aria-label="Filtrar por React" class="inline-flex bg-transparent p-0 border-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus:outline-none rounded-md">
      <Badge variant="outline">React</Badge>
    </button>
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
      { label: $tStore('states.withIcon.label'),    trigger: stripHtml($tStore('states.withIcon.trigger')),    behavior: stripHtml($tStore('states.withIcon.behavior'))    },
      { label: $tStore('states.countBadge.label'),  trigger: stripHtml($tStore('states.countBadge.trigger')),  behavior: stripHtml($tStore('states.countBadge.behavior'))  },
      { label: $tStore('states.asLink.label'),      trigger: stripHtml($tStore('states.asLink.trigger')),      behavior: stripHtml($tStore('states.asLink.behavior'))      },
      { label: $tStore('states.asTrigger.label'),   trigger: stripHtml($tStore('states.asTrigger.trigger')),   behavior: stripHtml($tStore('states.asTrigger.behavior'))   },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: $tStore('props.badgeTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'variant',  type: '"default" | "secondary" | "destructive" | "outline"', defaultValue: '"default"', required: 'Não', description: stripHtml($tStore('props.table.variant')) },
          { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.table.className') },
          { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Não', description: $tStore('props.table.children')  },
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
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      { token: '--primary',               value: 'bg-primary',               description: $tStore('tokens.table.primary')              },
      { token: '--primary-foreground',    value: 'text-primary-foreground',  description: $tStore('tokens.table.primaryForeground')    },
      { token: '--secondary',             value: 'bg-secondary',             description: $tStore('tokens.table.secondary')            },
      { token: '--secondary-foreground',  value: 'text-secondary-foreground',description: $tStore('tokens.table.secondaryForeground')  },
      { token: '--destructive',           value: 'bg-destructive',           description: $tStore('tokens.table.destructive')          },
      { token: '--destructive-foreground',value: 'text-destructive-foreground', description: $tStore('tokens.table.destructiveForeground') },
      { token: '--foreground',            value: 'text-foreground',          description: $tStore('tokens.table.foreground')           },
      { token: '--ring',                  value: 'focus:ring-ring',          description: $tStore('tokens.table.ring')                 },
      { token: '--background',            value: 'focus:ring-offset-background', description: $tStore('tokens.table.background')      },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeCustomizationTokens}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.item1'),
      $tStore('accessibility.item2'),
      $tStore('accessibility.item3'),
      $tStore('accessibility.item4'),
      $tStore('accessibility.item5'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboardTitle')}
    keyboardItems={[
      { key: '—',     description: stripHtml($tStore('keyboard.noFocus'))         },
      { key: 'Tab',   description: stripHtml($tStore('keyboard.wrappedInButton')) },
      { key: 'Enter', description: stripHtml($tStore('keyboard.wrappedInLink'))   },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'Alert',   description: $tStore('related.alert'),  path: '?path=/docs/ui-alert--docs'   },
      { name: 'Button',  description: $tStore('related.button'), path: '?path=/docs/ui-button--docs'  },
      { name: 'Chip',    description: $tStore('related.chip'),   path: '?path=/docs/ui-chip--docs'    },
      { name: 'Tag',     description: $tStore('related.tag'),    path: '?path=/docs/ui-tag--docs'     },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: $tStore('notes.tip1') },
      { title: '', content: $tStore('notes.tip2') },
      { title: '', content: $tStore('notes.tip3') },
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
      { event: $tStore('analytics.table.click'),         trigger: $tStore('analytics.table.clickTrigger'),         payload: $tStore('analytics.table.clickPayload')         },
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
      ],
    }}
  />
</DocsPageLayout>
