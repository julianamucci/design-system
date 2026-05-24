<script lang="ts">
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
  import { Badge } from '@/components/ui/badge';
  import { User, Settings, Shield } from 'lucide-svelte';
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
  import tabsTranslations from '@shared/content/tabs/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(tabsTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'tabs',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/navigation' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'tabs',
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

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'tabs', locale: $locale });
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

  // ─── Demo tracking ───────────────────────────────────────────────────────────

  let demoValue = $state('overview');
  let demoMounted = $state(false);

  $effect(() => {
    const next = demoValue;
    if (!demoMounted) {
      demoMounted = true;
      return;
    }
    const labels = ['overview', 'properties', 'examples'];
    track('tab_change', {
      component: 'tabs',
      label: next,
      index: labels.indexOf(next),
      total: labels.length,
      location: 'docs_demonstration',
    });
  });

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImport = `import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";`;

  const codeDefault = `<Tabs defaultValue="overview" class="w-full max-w-lg">
  <TabsList aria-label="Seções do componente">
    <TabsTrigger value="overview">Visão geral</TabsTrigger>
    <TabsTrigger value="properties">Propriedades</TabsTrigger>
    <TabsTrigger value="examples">Exemplos</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Conteúdo da visão geral</TabsContent>
  <TabsContent value="properties">Lista de propriedades</TabsContent>
  <TabsContent value="examples">Exemplos de uso</TabsContent>
</Tabs>`;

  const codeLine = `<Tabs defaultValue="preview" class="w-full max-w-lg">
  <TabsList variant="line" aria-label="Modos de visualização">
    <TabsTrigger value="preview">Preview</TabsTrigger>
    <TabsTrigger value="code">Código</TabsTrigger>
  </TabsList>
  <TabsContent value="preview">Visualização</TabsContent>
  <TabsContent value="code">&lt;Button&gt;Click&lt;/Button&gt;</TabsContent>
</Tabs>`;

  const codeVertical = `<Tabs defaultValue="profile" orientation="vertical" class="w-full max-w-xl">
  <TabsList aria-label="Configurações">
    <TabsTrigger value="profile">Perfil</TabsTrigger>
    <TabsTrigger value="account">Conta</TabsTrigger>
    <TabsTrigger value="security">Segurança</TabsTrigger>
  </TabsList>
  <TabsContent value="profile">Edite informações pessoais.</TabsContent>
  <TabsContent value="account">Email, senha e notificações.</TabsContent>
  <TabsContent value="security">2FA e sessões ativas.</TabsContent>
</Tabs>`;

  const interfaceCode = `// Tabs (Svelte 5 + bits-ui)
interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  activationMode?: 'automatic' | 'manual';
  class?: string;
}

// TabsList
interface TabsListProps {
  variant?: 'default' | 'line';
  'aria-label': string; // OBRIGATÓRIO
  class?: string;
}

// TabsTrigger
interface TabsTriggerProps {
  value: string; // OBRIGATÓRIO
  disabled?: boolean;
  class?: string;
}

// TabsContent
interface TabsContentProps {
  value: string; // OBRIGATÓRIO
  class?: string;
}`;

  const propsTableCols = $derived({
    prop: $tStore('props.table.prop'),
    type: $tStore('props.table.type'),
    default: $tStore('props.table.default'),
    required: $tStore('props.table.required'),
    description: $tStore('props.table.description'),
  });
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="tabs">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add tabs"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <Tabs bind:value={demoValue} class="w-full max-w-lg">
        <TabsList aria-label={$tStore('demonstration.title')}>
          <TabsTrigger value="overview">{$tStore('demonstration.labels.overview')}</TabsTrigger>
          <TabsTrigger value="properties">{$tStore('demonstration.labels.properties')}</TabsTrigger>
          <TabsTrigger value="examples">{$tStore('demonstration.labels.examples')}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">{$tStore('demonstration.labels.overviewContent')}</TabsContent>
        <TabsContent value="properties">{$tStore('demonstration.labels.propertiesContent')}</TabsContent>
        <TabsContent value="examples">{$tStore('demonstration.labels.examplesContent')}</TabsContent>
      </Tabs>
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
        { element: $tStore('usage.uxWriting.table.trigger.name'),   rules: $tStore('usage.uxWriting.table.trigger.format'),   do: $tStore('usage.uxWriting.table.trigger.good'),   dont: $tStore('usage.uxWriting.table.trigger.bad') },
        { element: $tStore('usage.uxWriting.table.ariaLabel.name'), rules: $tStore('usage.uxWriting.table.ariaLabel.format'), do: $tStore('usage.uxWriting.table.ariaLabel.good'), dont: $tStore('usage.uxWriting.table.ariaLabel.bad') },
        { element: $tStore('usage.uxWriting.table.order.name'),     rules: $tStore('usage.uxWriting.table.order.format'),     do: $tStore('usage.uxWriting.table.order.good'),     dont: $tStore('usage.uxWriting.table.order.bad') },
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
    <Tabs defaultValue="overview" class="w-full max-w-xs text-sm">
      <TabsList aria-label="Seções do componente">
        <TabsTrigger value="overview">Visão geral</TabsTrigger>
        <TabsTrigger value="properties">Propriedades</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Resumo do componente.</TabsContent>
      <TabsContent value="properties">Lista de props.</TabsContent>
    </Tabs>
  {/snippet}
  {#snippet dontPair1()}
    <Tabs defaultValue="t1" class="w-full max-w-xs text-sm">
      <TabsList aria-label="Tabs">
        <TabsTrigger value="t1">Aba 1</TabsTrigger>
        <TabsTrigger value="t2">Aba 2</TabsTrigger>
      </TabsList>
      <TabsContent value="t1">Conteúdo 1.</TabsContent>
      <TabsContent value="t2">Conteúdo 2.</TabsContent>
    </Tabs>
  {/snippet}
  {#snippet doPair2()}
    <Tabs defaultValue="profile" class="w-full max-w-xs text-sm">
      <TabsList aria-label="Configurações da conta">
        <TabsTrigger value="profile">Perfil</TabsTrigger>
        <TabsTrigger value="account">Conta</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">Edite informações pessoais.</TabsContent>
      <TabsContent value="account">Email e senha.</TabsContent>
    </Tabs>
  {/snippet}
  {#snippet dontPair2()}
    <Tabs defaultValue="profile" class="w-full max-w-xs text-sm">
      <TabsList>
        <TabsTrigger value="profile">Perfil</TabsTrigger>
        <TabsTrigger value="account">Conta</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">Edite informações pessoais.</TabsContent>
      <TabsContent value="account">Email e senha.</TabsContent>
    </Tabs>
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
      { name: $tStore('variants.items.default'),  description: stripHtml($tStore('variants.styles.default')),  code: codeDefault,  preview: variantDefault  },
      { name: $tStore('variants.items.line'),     description: stripHtml($tStore('variants.styles.line')),     code: codeLine,     preview: variantLine     },
      { name: $tStore('variants.items.vertical'), description: stripHtml($tStore('variants.styles.vertical')), code: codeVertical, preview: variantVertical },
    ]}
  />

  {#snippet variantDefault()}
    <Tabs defaultValue="overview" class="w-full max-w-sm text-sm">
      <TabsList aria-label="Seções do componente">
        <TabsTrigger value="overview">Visão geral</TabsTrigger>
        <TabsTrigger value="properties">Propriedades</TabsTrigger>
        <TabsTrigger value="examples">Exemplos</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Conteúdo da visão geral.</TabsContent>
      <TabsContent value="properties">Lista de propriedades.</TabsContent>
      <TabsContent value="examples">Exemplos de uso.</TabsContent>
    </Tabs>
  {/snippet}
  {#snippet variantLine()}
    <Tabs defaultValue="preview" class="w-full max-w-sm text-sm">
      <TabsList variant="line" aria-label="Modos de visualização">
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Código</TabsTrigger>
      </TabsList>
      <TabsContent value="preview">Visualização renderizada.</TabsContent>
      <TabsContent value="code">&lt;Button&gt;Click&lt;/Button&gt;</TabsContent>
    </Tabs>
  {/snippet}
  {#snippet variantVertical()}
    <Tabs defaultValue="profile" orientation="vertical" class="w-full max-w-md text-sm">
      <TabsList aria-label="Configurações">
        <TabsTrigger value="profile">Perfil</TabsTrigger>
        <TabsTrigger value="account">Conta</TabsTrigger>
        <TabsTrigger value="security">Segurança</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">Edite informações pessoais.</TabsContent>
      <TabsContent value="account">Email, senha e notificações.</TabsContent>
      <TabsContent value="security">2FA e sessões ativas.</TabsContent>
    </Tabs>
  {/snippet}

  <!-- ── Composições ────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="tabs"
    items={[
      {
        name: $tStore('variants.compositions.iconTrigger.name'),
        description: $tStore('variants.compositions.iconTrigger.description'),
        useWhen: $tStore('variants.compositions.iconTrigger.use'),
        code: `<Tabs value="profile" class="w-full max-w-xl">
  <TabsList aria-label="Configurações">
    <TabsTrigger value="profile"><span class="flex items-center gap-2"><User class="h-4 w-4" aria-hidden="true" />Perfil</span></TabsTrigger>
    <TabsTrigger value="account"><span class="flex items-center gap-2"><Settings class="h-4 w-4" aria-hidden="true" />Conta</span></TabsTrigger>
    <TabsTrigger value="security"><span class="flex items-center gap-2"><Shield class="h-4 w-4" aria-hidden="true" />Segurança</span></TabsTrigger>
  </TabsList>
  <TabsContent value="profile">…</TabsContent>
  <TabsContent value="account">…</TabsContent>
  <TabsContent value="security">…</TabsContent>
</Tabs>`,
        preview: compIconTrigger,
      },
      {
        name: $tStore('variants.compositions.badgeTrigger.name'),
        description: $tStore('variants.compositions.badgeTrigger.description'),
        useWhen: $tStore('variants.compositions.badgeTrigger.use'),
        code: `<Tabs value="inbox" class="w-full max-w-xl">
  <TabsList aria-label="Caixas de mensagem">
    <TabsTrigger value="inbox"><span class="flex items-center gap-2">Caixa de entrada<Badge>12</Badge></span></TabsTrigger>
    <TabsTrigger value="spam"><span class="flex items-center gap-2">Spam<Badge variant="destructive">3</Badge></span></TabsTrigger>
    <TabsTrigger value="trash">Lixeira</TabsTrigger>
  </TabsList>
  <TabsContent value="inbox">…</TabsContent>
  <TabsContent value="spam">…</TabsContent>
  <TabsContent value="trash">…</TabsContent>
</Tabs>`,
        preview: compBadgeTrigger,
      },
      {
        name: $tStore('variants.compositions.vertical.name'),
        description: $tStore('variants.compositions.vertical.description'),
        useWhen: $tStore('variants.compositions.vertical.use'),
        code: `<Tabs value="profile" orientation="vertical" class="w-full max-w-2xl flex gap-4">
  <TabsList class="flex flex-col h-auto items-stretch shrink-0 min-w-[10rem]" aria-label="Configurações">
    <TabsTrigger value="profile">Perfil</TabsTrigger>
    <TabsTrigger value="account">Conta</TabsTrigger>
    <TabsTrigger value="security">Segurança</TabsTrigger>
  </TabsList>
  <TabsContent value="profile">…</TabsContent>
  <TabsContent value="account">…</TabsContent>
  <TabsContent value="security">…</TabsContent>
</Tabs>`,
        preview: compVertical,
      },
      {
        name: $tStore('variants.compositions.lineSubNav.name'),
        description: $tStore('variants.compositions.lineSubNav.description'),
        useWhen: $tStore('variants.compositions.lineSubNav.use'),
        code: `<Tabs value="all" class="w-full">
  <TabsList variant="line" class="border-b rounded-none bg-transparent w-full justify-start" aria-label="Filtros de listagem">
    <TabsTrigger value="all">Tudo</TabsTrigger>
    <TabsTrigger value="active">Ativos</TabsTrigger>
    <TabsTrigger value="archived">Arquivados</TabsTrigger>
  </TabsList>
  <TabsContent value="all">…</TabsContent>
  <TabsContent value="active">…</TabsContent>
  <TabsContent value="archived">…</TabsContent>
</Tabs>`,
        preview: compLineSubNav,
      },
    ]}
  />

  {#snippet compIconTrigger()}
    <Tabs value="profile" class="w-full max-w-xl">
      <TabsList aria-label="Configurações">
        <TabsTrigger value="profile">
          <span class="flex items-center gap-2"><User class="h-4 w-4" aria-hidden="true" />Perfil</span>
        </TabsTrigger>
        <TabsTrigger value="account">
          <span class="flex items-center gap-2"><Settings class="h-4 w-4" aria-hidden="true" />Conta</span>
        </TabsTrigger>
        <TabsTrigger value="security">
          <span class="flex items-center gap-2"><Shield class="h-4 w-4" aria-hidden="true" />Segurança</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <div class="p-4 rounded-md border bg-card space-y-2">
          <h3 class="text-sm font-semibold">Perfil</h3>
          <p class="text-sm text-muted-foreground">Edite suas informações públicas.</p>
        </div>
      </TabsContent>
      <TabsContent value="account">
        <div class="p-4 rounded-md border bg-card space-y-2">
          <h3 class="text-sm font-semibold">Conta</h3>
          <p class="text-sm text-muted-foreground">Email, idioma e preferências.</p>
        </div>
      </TabsContent>
      <TabsContent value="security">
        <div class="p-4 rounded-md border bg-card space-y-2">
          <h3 class="text-sm font-semibold">Segurança</h3>
          <p class="text-sm text-muted-foreground">Senha e autenticação em dois fatores.</p>
        </div>
      </TabsContent>
    </Tabs>
  {/snippet}

  {#snippet compBadgeTrigger()}
    <Tabs value="inbox" class="w-full max-w-xl">
      <TabsList aria-label="Caixas de mensagem">
        <TabsTrigger value="inbox">
          <span class="flex items-center gap-2">Caixa de entrada<Badge>12</Badge></span>
        </TabsTrigger>
        <TabsTrigger value="spam">
          <span class="flex items-center gap-2">Spam<Badge variant="destructive">3</Badge></span>
        </TabsTrigger>
        <TabsTrigger value="trash">Lixeira</TabsTrigger>
      </TabsList>
      <TabsContent value="inbox">
        <div class="p-4 rounded-md border bg-card space-y-2">
          <h3 class="text-sm font-semibold">Caixa de entrada</h3>
          <p class="text-sm text-muted-foreground">12 mensagens não lidas.</p>
        </div>
      </TabsContent>
      <TabsContent value="spam">
        <div class="p-4 rounded-md border bg-card space-y-2">
          <h3 class="text-sm font-semibold">Spam</h3>
          <p class="text-sm text-muted-foreground">3 itens marcados como spam.</p>
        </div>
      </TabsContent>
      <TabsContent value="trash">
        <div class="p-4 rounded-md border bg-card space-y-2">
          <h3 class="text-sm font-semibold">Lixeira</h3>
          <p class="text-sm text-muted-foreground">Itens excluídos recentemente.</p>
        </div>
      </TabsContent>
    </Tabs>
  {/snippet}

  {#snippet compVertical()}
    <Tabs value="profile" orientation="vertical" class="w-full max-w-2xl flex gap-4">
      <TabsList class="flex flex-col h-auto items-stretch shrink-0 min-w-[10rem]" aria-label="Configurações">
        <TabsTrigger value="profile">Perfil</TabsTrigger>
        <TabsTrigger value="account">Conta</TabsTrigger>
        <TabsTrigger value="security">Segurança</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <div class="p-4 rounded-md border bg-card space-y-2">
          <h3 class="text-sm font-semibold">Perfil</h3>
          <p class="text-sm text-muted-foreground">Edite suas informações públicas.</p>
        </div>
      </TabsContent>
      <TabsContent value="account">
        <div class="p-4 rounded-md border bg-card space-y-2">
          <h3 class="text-sm font-semibold">Conta</h3>
          <p class="text-sm text-muted-foreground">Email, idioma e preferências.</p>
        </div>
      </TabsContent>
      <TabsContent value="security">
        <div class="p-4 rounded-md border bg-card space-y-2">
          <h3 class="text-sm font-semibold">Segurança</h3>
          <p class="text-sm text-muted-foreground">Senha e autenticação em dois fatores.</p>
        </div>
      </TabsContent>
    </Tabs>
  {/snippet}

  {#snippet compLineSubNav()}
    <Tabs value="all" class="w-full">
      <TabsList variant="line" class="border-b rounded-none bg-transparent w-full justify-start" aria-label="Filtros de listagem">
        <TabsTrigger value="all">Tudo</TabsTrigger>
        <TabsTrigger value="active">Ativos</TabsTrigger>
        <TabsTrigger value="archived">Arquivados</TabsTrigger>
      </TabsList>
      <TabsContent value="all"><p class="text-sm text-muted-foreground pt-3">Mostrando todos os itens.</p></TabsContent>
      <TabsContent value="active"><p class="text-sm text-muted-foreground pt-3">Apenas itens ativos.</p></TabsContent>
      <TabsContent value="archived"><p class="text-sm text-muted-foreground pt-3">Itens arquivados.</p></TabsContent>
    </Tabs>
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
      { label: $tStore('states.items.default'),  trigger: '—',                              behavior: stripHtml($tStore('states.descriptions.default'))  },
      { label: $tStore('states.items.active'),   trigger: 'Click / Arrow keys',             behavior: stripHtml($tStore('states.descriptions.active'))   },
      { label: $tStore('states.items.hover'),    trigger: 'Mouse over',                     behavior: stripHtml($tStore('states.descriptions.hover'))    },
      { label: $tStore('states.items.focus'),    trigger: 'Tab',                            behavior: stripHtml($tStore('states.descriptions.focus'))    },
      { label: $tStore('states.items.disabled'), trigger: 'disabled prop',                  behavior: stripHtml($tStore('states.descriptions.disabled')) },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        cols: propsTableCols,
        items: [
          { name: 'value',          type: $tStore('props.table.value.type'),          defaultValue: $tStore('props.table.value.default'),          required: $tStore('props.table.value.required'),          description: stripHtml($tStore('props.table.value.description'))          },
          { name: 'defaultValue',   type: $tStore('props.table.defaultValue.type'),   defaultValue: $tStore('props.table.defaultValue.default'),   required: $tStore('props.table.defaultValue.required'),   description: stripHtml($tStore('props.table.defaultValue.description'))   },
          { name: 'onValueChange',  type: $tStore('props.table.onValueChange.type'),  defaultValue: $tStore('props.table.onValueChange.default'),  required: $tStore('props.table.onValueChange.required'),  description: stripHtml($tStore('props.table.onValueChange.description'))  },
          { name: 'orientation',    type: $tStore('props.table.orientation.type'),    defaultValue: $tStore('props.table.orientation.default'),    required: $tStore('props.table.orientation.required'),    description: stripHtml($tStore('props.table.orientation.description'))    },
          { name: 'activationMode', type: $tStore('props.table.activationMode.type'), defaultValue: $tStore('props.table.activationMode.default'), required: $tStore('props.table.activationMode.required'), description: stripHtml($tStore('props.table.activationMode.description')) },
          { name: 'variant',        type: $tStore('props.table.variant.type'),        defaultValue: $tStore('props.table.variant.default'),        required: $tStore('props.table.variant.required'),        description: stripHtml($tStore('props.table.variant.description'))        },
          { name: 'class',          type: $tStore('props.table.className.type'),      defaultValue: $tStore('props.table.className.default'),      required: $tStore('props.table.className.required'),      description: stripHtml($tStore('props.table.className.description'))      },
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
      { token: '--muted',            value: $tStore('tokens.table.muted.class'),            description: $tStore('tokens.table.muted.part')            },
      { token: '--muted-foreground', value: $tStore('tokens.table.mutedForeground.class'),  description: $tStore('tokens.table.mutedForeground.part')  },
      { token: '--background',       value: $tStore('tokens.table.background.class'),       description: $tStore('tokens.table.background.part')       },
      { token: '--foreground',       value: $tStore('tokens.table.foreground.class'),       description: $tStore('tokens.table.foreground.part')       },
      { token: '--ring',             value: $tStore('tokens.table.ring.class'),             description: $tStore('tokens.table.ring.part')             },
      { token: '--border',           value: $tStore('tokens.table.border.class'),           description: $tStore('tokens.table.border.part')           },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.items.item1'),
      $tStore('accessibility.items.item2'),
      $tStore('accessibility.items.item3'),
      $tStore('accessibility.items.item4'),
      $tStore('accessibility.items.item5'),
      $tStore('accessibility.items.item6'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',         description: $tStore('accessibility.keyboard.tab')        },
      { key: '→',           description: $tStore('accessibility.keyboard.arrowRight') },
      { key: '←',           description: $tStore('accessibility.keyboard.arrowLeft')  },
      { key: '↓',           description: $tStore('accessibility.keyboard.arrowDown')  },
      { key: '↑',           description: $tStore('accessibility.keyboard.arrowUp')    },
      { key: 'Home',        description: $tStore('accessibility.keyboard.home')       },
      { key: 'End',         description: $tStore('accessibility.keyboard.end')        },
      { key: 'Enter',       description: stripHtml($tStore('accessibility.keyboard.enter')) },
      { key: 'Space',       description: stripHtml($tStore('accessibility.keyboard.space')) },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.stepper.name'),     description: $tStore('related.items.stepper.description'),     path: '?path=/docs/ui-stepper--docs'      },
      { name: $tStore('related.items.accordion.name'),   description: $tStore('related.items.accordion.description'),   path: '?path=/docs/ui-accordion--docs'    },
      { name: $tStore('related.items.sidebar.name'),     description: $tStore('related.items.sidebar.description'),     path: '?path=/docs/ui-sidebar--docs'      },
      { name: $tStore('related.items.toggleGroup.name'), description: $tStore('related.items.toggleGroup.description'), path: '?path=/docs/ui-togglegroup--docs'  },
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
      trigger: $tStore('analytics.table.trigger'),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: 'tab_change', trigger: $tStore('analytics.table.tab_change.trigger'), payload: $tStore('analytics.table.tab_change.payload') },
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
        action:   stripHtml($tStore(`testes.functional.item${i}.action`)),
        result:   stripHtml($tStore(`testes.functional.item${i}.result`)),
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
        { criterion: stripHtml($tStore('testes.accessibility.item1')), level: 'AA',    how: 'axe-core' },
        { criterion: stripHtml($tStore('testes.accessibility.item2')), level: '1.4.3', how: 'Contrast analyzer' },
        { criterion: stripHtml($tStore('testes.accessibility.item3')), level: '2.4.7', how: 'Keyboard test' },
        { criterion: stripHtml($tStore('testes.accessibility.item4')), level: '4.1.2', how: 'DOM inspection' },
        { criterion: stripHtml($tStore('testes.accessibility.item5')), level: '4.1.2', how: 'DOM inspection' },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4].map((i) => ({
        story:    $tStore(`testes.visual.item${i}.story`),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>

<!-- sanitizeHtml available para uso futuro em {@html} dinâmico -->
{#if false}
  {@html sanitizeHtml('')}
{/if}
