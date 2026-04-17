<script lang="ts">
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import uiTranslations from '@/i18n/ui.json';
  import sonnerTranslations from '@shared/content/sonner/translations.json';
  import { toast } from 'svelte-sonner';
  import Sonner from '@/components/ui/Sonner.svelte';
  import Button from '@/components/ui/Button.svelte';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(sonnerTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: `${t('title')} — ${t('category')}`,
      description: t('seo.description'),
      locale: l,
      componentSlug: 'sonner',
    });
    track('docs_page_view', {
      component_name: 'sonner',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Seção ativa (IntersectionObserver) ──────────────────────────────────────

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
    const ids = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection = entry.target.id;
          track('docs_section_viewed', { section_id: entry.target.id, component_name: 'sonner', locale: $locale });
          break;
        }
      }
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  });

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleDemoClick(toastType: string) {
    track('toast_demo_triggered', { toast_type: toastType, component_name: 'sonner' });
  }

  // ─── Data ─────────────────────────────────────────────────────────────────────

  const TOAST_TYPES = [
    { type: 'default', color: 'bg-background border' },
    { type: 'success', color: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' },
    { type: 'error',   color: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' },
    { type: 'warning', color: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800' },
    { type: 'info',    color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' },
    { type: 'loading', color: 'bg-background border' },
  ] as const;

  const POSITIONS = ['top-right', 'top-center', 'top-left', 'bottom-right', 'bottom-center', 'bottom-left'] as const;

  function positionClass(pos: string) {
    const map: Record<string, string> = {
      'top-right': 'top-1 right-1', 'top-center': 'top-1 left-1/2 -translate-x-1/2', 'top-left': 'top-1 left-1',
      'bottom-right': 'bottom-1 right-1', 'bottom-center': 'bottom-1 left-1/2 -translate-x-1/2', 'bottom-left': 'bottom-1 left-1',
    };
    return map[pos] ?? '';
  }

  function typeLabel(type: string) {
    if (type === 'default') return 'Notificação';
    if (type === 'loading') return 'Processando...';
    return type;
  }

  const STATES_ROWS = $derived.by(() => {
    const t = $tStore;
    return [
      { state: 'Visible',     visual: t('states.table.visible'),    trigger: t('states.table.visibleTrigger') },
      { state: 'Expanded',    visual: t('states.table.expanded'),   trigger: t('states.table.expandedTrigger') },
      { state: 'Dismissing',  visual: t('states.table.dismissing'), trigger: t('states.table.dismissingTrigger') },
      { state: 'Action',      visual: t('states.table.action'),     trigger: t('states.table.actionTrigger') },
      { state: 'Rich Colors', visual: t('states.table.richColors'), trigger: t('states.table.richColorsTrigger') },
    ];
  });

  const TOASTER_PROPS = $derived.by(() => {
    const t = $tStore;
    return [
      { name: 'position',              type: 'Position',              def: '"bottom-right"', desc: t('props.table.position') },
      { name: 'theme',                 type: '"light" | "dark" | "system"', def: '"system"', desc: t('props.table.theme') },
      { name: 'richColors',            type: 'boolean',               def: 'false',          desc: t('props.table.richColors') },
      { name: 'expand',                type: 'boolean',               def: 'false',          desc: t('props.table.expand') },
      { name: 'duration',              type: 'number',                def: '4000',           desc: t('props.table.duration') },
      { name: 'closeButton',           type: 'boolean',               def: 'false',          desc: t('props.table.closeButton') },
      { name: 'offset',                type: 'string | number',       def: '"32px"',         desc: t('props.table.offset') },
      { name: 'visibleToasts',         type: 'number',                def: '3',              desc: t('props.table.visibleToasts') },
      { name: 'toastOptions',          type: 'ToastOptions',          def: '{}',             desc: t('props.table.toastOptions') },
      { name: 'dir',                   type: '"ltr" | "rtl"',         def: '"ltr"',          desc: t('props.table.dir') },
      { name: 'gap',                   type: 'number',                def: '14',             desc: t('props.table.gap') },
      { name: 'pauseWhenPageIsHidden', type: 'boolean',               def: 'false',          desc: t('props.table.pauseWhenPageIsHidden') },
      { name: 'className',             type: 'string',                def: '—',              desc: t('props.table.className') },
    ];
  });

  const TOAST_OPTIONS = $derived.by(() => {
    const t = $tStore;
    return [
      { name: 'description', type: 'string',                                 desc: t('props.toastTable.description') },
      { name: 'action',      type: '{ label: string; onClick: () => void }', desc: t('props.toastTable.action') },
      { name: 'cancel',      type: '{ label: string; onClick: () => void }', desc: t('props.toastTable.cancel') },
      { name: 'duration',    type: 'number',                                 desc: t('props.toastTable.duration') },
      { name: 'id',          type: 'string | number',                        desc: t('props.toastTable.id') },
      { name: 'onDismiss',   type: '(toast: ExternalToast) => void',         desc: t('props.toastTable.onDismiss') },
      { name: 'onAutoClose', type: '(toast: ExternalToast) => void',         desc: t('props.toastTable.onAutoClose') },
      { name: 'important',   type: 'boolean',                                desc: t('props.toastTable.important') },
    ];
  });

  const TOKEN_ROWS = $derived.by(() => {
    const t = $tStore;
    return [
      { token: '--background',         cls: 'bg-background',          part: t('tokens.table.background') },
      { token: '--foreground',         cls: 'text-foreground',         part: t('tokens.table.foreground') },
      { token: '--border',             cls: 'border-border',           part: t('tokens.table.border') },
      { token: '--primary',            cls: 'bg-primary',              part: t('tokens.table.primary') },
      { token: '--primary-foreground', cls: 'text-primary-foreground', part: t('tokens.table.primaryForeground') },
      { token: '--muted',              cls: 'bg-muted',                part: t('tokens.table.muted') },
      { token: '--muted-foreground',   cls: 'text-muted-foreground',   part: t('tokens.table.mutedForeground') },
      { token: '--destructive',        cls: 'bg-destructive',          part: t('tokens.table.destructive') },
      { token: '--radius',             cls: 'rounded-lg',              part: t('tokens.table.radius') },
    ];
  });

  const ANALYTICS_KEYS = ['pageView', 'sectionViewed', 'langSwitch', 'toastTriggered'] as const;
</script>

<div class="ds-docs p-8 max-w-5xl mx-auto">
  <Sonner position="top-right" richColors closeButton />

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
        npx shadcn@latest add sonner
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

    <!-- ── Conteúdo principal ────────────────────────────────────────────────── -->
    <div class="flex-1 space-y-12">

      <!-- ── Demonstração ─────────────────────────────────────────── -->
      <section id="demonstracao">
        <h2 class="text-xl font-semibold mb-4">{$tStore('demonstration.title')}</h2>
        <div class="border rounded-xl p-6 shadow-sm bg-background">
          <div class="flex flex-wrap gap-3">
            <Button onclick={() => { handleDemoClick('default'); toast($tStore('demonstration.labels.default')); }}>
              {$tStore('demonstration.labels.default')}
            </Button>
            <Button variant="outline" onclick={() => { handleDemoClick('success'); toast.success($tStore('demonstration.labels.success')); }}>
              {$tStore('demonstration.labels.success')}
            </Button>
            <Button variant="outline" onclick={() => { handleDemoClick('error'); toast.error($tStore('demonstration.labels.error')); }}>
              {$tStore('demonstration.labels.error')}
            </Button>
            <Button variant="outline" onclick={() => { handleDemoClick('warning'); toast.warning($tStore('demonstration.labels.warning')); }}>
              {$tStore('demonstration.labels.warning')}
            </Button>
            <Button variant="outline" onclick={() => { handleDemoClick('info'); toast.info($tStore('demonstration.labels.info')); }}>
              {$tStore('demonstration.labels.info')}
            </Button>
            <Button variant="outline" onclick={() => { handleDemoClick('loading'); toast.loading($tStore('demonstration.labels.loading')); }}>
              {$tStore('demonstration.labels.loading')}
            </Button>
            <Button variant="secondary" onclick={() => { handleDemoClick('dismiss'); toast.dismiss(); }}>
              {$tStore('demonstration.labels.dismiss')}
            </Button>
          </div>
        </div>
      </section>

      <!-- ── Anatomia ─────────────────────────────────────────────── -->
      <section id="anatomia">
        <h2 class="text-xl font-semibold mb-4">{$tStore('anatomy.title')}</h2>
        <div class="border rounded-xl p-6 shadow-sm bg-background space-y-4">
          <ol class="space-y-3 text-sm list-none p-0 m-0">
            {#each [1, 2, 3, 4, 5, 6, 7] as i}
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

      <!-- ── Quando Usar ──────────────────────────────────────────── -->
      <section id="quando-usar">
        <h2 class="text-xl font-semibold mb-4">{$tStore('usage.title')}</h2>
        <div class="border rounded-xl p-6 shadow-sm space-y-6">
          <div class="bg-muted/30 rounded-lg p-4 space-y-3">
            <h3 class="font-medium text-sm">{$tStore('usage.guidelines.title')}</h3>
            <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              {#each [1, 2, 3, 4, 5] as i}
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
                  {#each ['title', 'description', 'action', 'error'] as key}
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
                {#each [1, 2, 3, 4] as i}<li>{$tStore(`usage.do.item${i}`)}</li>{/each}
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

      <!-- ── Do & Don't ───────────────────────────────────────────── -->
      <section id="do-dont">
        <h2 class="text-xl font-semibold mb-4">{$tStore('doDont.title')}</h2>
        <div class="border rounded-xl p-6 shadow-sm bg-background space-y-8">
          <!-- Pair 1 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-green-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.do')}</span>
              </div>
              <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
                <div class="bg-background border rounded-lg p-3 shadow-sm flex items-start gap-3 max-w-xs">
                  <span class="text-green-500 text-lg mt-0.5">✓</span>
                  <div>
                    <p class="text-sm font-medium">Item salvo</p>
                    <p class="text-xs text-muted-foreground">As alterações foram aplicadas.</p>
                  </div>
                </div>
              </div>
              <p class="text-sm text-muted-foreground italic px-1">{$tStore('doDont.pair1.do')}</p>
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-red-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.dont')}</span>
              </div>
              <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
                <div class="bg-background border rounded-lg p-3 shadow-sm max-w-xs">
                  <p class="text-sm font-medium">Sucesso!</p>
                </div>
              </div>
              <p class="text-sm text-muted-foreground italic px-1">{$tStore('doDont.pair1.dont')}</p>
            </div>
          </div>
          <!-- Pair 2 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-green-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.do')}</span>
              </div>
              <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
                <div class="bg-background border border-red-200 dark:border-red-800 rounded-lg p-3 shadow-sm max-w-xs">
                  <p class="text-sm font-medium text-red-600">Falha ao salvar</p>
                  <p class="text-xs text-muted-foreground">Verifique sua conexão e tente novamente.</p>
                  <button class="mt-2 text-xs font-medium text-primary hover:underline">Tentar novamente</button>
                </div>
              </div>
              <p class="text-sm text-muted-foreground italic px-1">{$tStore('doDont.pair2.do')}</p>
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-red-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.dont')}</span>
              </div>
              <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
                <div class="bg-background border rounded-lg p-3 shadow-sm max-w-xs">
                  <p class="text-sm font-medium">Erro 500</p>
                </div>
              </div>
              <p class="text-sm text-muted-foreground italic px-1">{$tStore('doDont.pair2.dont')}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Importação ───────────────────────────────────────────── -->
      <section id="importacao">
        <h2 class="text-xl font-semibold mb-4">{$tStore('import.title')}</h2>
        <div class="border rounded-xl p-6 shadow-sm bg-background space-y-4">
          <div>
            <p class="text-sm text-muted-foreground mb-3">{$tStore('import.basic')}</p>
            <pre class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code>{"import Sonner from '@/components/ui/Sonner.svelte';"}</code></pre>
          </div>
          <div>
            <p class="text-sm text-muted-foreground mb-3">{$tStore('import.usage')}</p>
            <pre class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code>{"import { toast } from 'svelte-sonner';"}</code></pre>
          </div>
        </div>
      </section>

      <!-- ── Exemplos de Código ────────────────────────────────────── -->
      <section id="exemplos">
        <h2 class="text-xl font-semibold mb-4">{$tStore('examples.title')}</h2>
        <div class="space-y-8">
          <div class="space-y-3">
            <h3 class="text-sm font-medium">{$tStore('examples.basic')}</h3>
            <div class="border rounded-xl p-6 shadow-sm bg-background">
              <Button onclick={() => toast('Item salvo com sucesso')}>{$tStore('demonstration.labels.default')}</Button>
            </div>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">{'toast("Item salvo com sucesso")'}</code></div>
          </div>
          <div class="space-y-3">
            <h3 class="text-sm font-medium">{$tStore('examples.types')}</h3>
            <div class="border rounded-xl p-6 shadow-sm bg-background">
              <div class="flex flex-wrap gap-3">
                <Button variant="outline" onclick={() => toast.success('Salvo com sucesso')}>{$tStore('demonstration.labels.success')}</Button>
                <Button variant="outline" onclick={() => toast.error('Falha ao salvar')}>{$tStore('demonstration.labels.error')}</Button>
                <Button variant="outline" onclick={() => toast.warning('Conexão instável')}>{$tStore('demonstration.labels.warning')}</Button>
                <Button variant="outline" onclick={() => toast.info('Nova versão disponível')}>{$tStore('demonstration.labels.info')}</Button>
              </div>
            </div>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">{`toast.success("Salvo com sucesso")
toast.error("Falha ao salvar")
toast.warning("Conexão instável")
toast.info("Nova versão disponível")
toast.loading("Processando...")`}</code></div>
          </div>
          <div class="space-y-3">
            <h3 class="text-sm font-medium">{$tStore('examples.withAction')}</h3>
            <div class="border rounded-xl p-6 shadow-sm bg-background">
              <Button variant="outline" onclick={() => toast('Item excluído', { action: { label: 'Desfazer', onClick: () => toast.success('Desfeito!') } })}>
                {$tStore('demonstration.labels.action')}
              </Button>
            </div>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">{`toast("Item excluído", {
  action: {
    label: "Desfazer",
    onClick: () => handleUndo(),
  },
})`}</code></div>
          </div>
          <div class="space-y-3">
            <h3 class="text-sm font-medium">{$tStore('examples.withDescription')}</h3>
            <div class="border rounded-xl p-6 shadow-sm bg-background">
              <Button variant="outline" onclick={() => toast('Relatório gerado', { description: 'O arquivo estará disponível em instantes.' })}>
                {$tStore('demonstration.labels.description')}
              </Button>
            </div>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">{`toast("Relatório gerado", {
  description: "O arquivo estará disponível em instantes.",
})`}</code></div>
          </div>
          <div class="space-y-3">
            <h3 class="text-sm font-medium">{$tStore('examples.promise')}</h3>
            <div class="border rounded-xl p-6 shadow-sm bg-background">
              <Button variant="outline" onclick={() => toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), { loading: 'Salvando...', success: 'Dados salvos!', error: 'Erro ao salvar' })}>
                {$tStore('demonstration.labels.promise')}
              </Button>
            </div>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">{`toast.promise(saveData(), {
  loading: "Salvando...",
  success: "Dados salvos!",
  error: "Erro ao salvar",
})`}</code></div>
          </div>
          <div class="space-y-3">
            <h3 class="text-sm font-medium">{$tStore('examples.custom')}</h3>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">{'<Sonner position="bottom-center" richColors />'}</code></div>
          </div>
        </div>
      </section>

      <!-- ── Tipos de Toast (Variantes) ────────────────────────────── -->
      <section id="variantes">
        <h2 class="text-xl font-semibold mb-6">{$tStore('variants.title')}</h2>
        <div class="space-y-12">
          <div>
            <h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1">
              {$tStore('variants.typesTitle')}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {#each TOAST_TYPES as item}
                <div class="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col transition-all hover:border-primary/30 hover:shadow-sm">
                  <div class="flex-1 flex items-center justify-center p-8 bg-muted/5 min-h-[140px]">
                    <div class={`rounded-lg p-3 shadow-sm border max-w-[200px] w-full ${item.color}`}>
                      <p class="text-sm font-medium">{typeLabel(item.type)}</p>
                    </div>
                  </div>
                  <div class="p-4 border-t border-border/40 bg-muted/10 space-y-1">
                    <p class="text-[11px] uppercase font-mono text-primary font-bold tracking-wider px-1.5 py-0.5 bg-primary/5 rounded-sm inline-block mb-1">
                      {item.type}
                    </p>
                    <p class="text-xs text-muted-foreground leading-relaxed">{$tStore(`variants.items.${item.type}`)}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1">
              {$tStore('variants.positionTitle')}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {#each POSITIONS as pos}
                <div class="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col transition-all hover:border-primary/30 hover:shadow-sm">
                  <div class="flex-1 flex items-center justify-center p-6 bg-muted/5 min-h-[100px]">
                    <div class="w-24 h-16 border border-border/60 rounded-md relative bg-muted/20">
                      <div class={`absolute w-8 h-2 bg-primary/60 rounded-sm ${positionClass(pos)}`}></div>
                    </div>
                  </div>
                  <div class="p-3 border-t border-border/40 bg-muted/10 space-y-1">
                    <p class="text-[11px] uppercase font-mono text-primary font-bold block">{$tStore(`variants.positions.${pos}`)}</p>
                    <p class="text-xs text-muted-foreground/70 italic">{$tStore(`variants.positions.${pos}Use`)}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </section>

      <!-- ── Estados ───────────────────────────────────────────────── -->
      <section id="estados">
        <h2 class="text-xl font-semibold mb-4">{$tStore('states.title')}</h2>
        <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="border-b border-border text-left bg-muted/50">
                <th class="p-3 border-r border-border font-medium">{$tStore('states.table.state')}</th>
                <th class="p-3 border-r border-border font-medium">{$tStore('states.table.visual')}</th>
                <th class="p-3 font-medium">{$tStore('states.table.trigger')}</th>
              </tr>
            </thead>
            <tbody>
              {#each STATES_ROWS as row}
                <tr class="border-b border-border hover:bg-muted/5 transition-colors">
                  <td class="p-3 border-r border-border font-medium">{row.state}</td>
                  <td class="p-3 border-r border-border text-muted-foreground">{row.visual}</td>
                  <td class="p-3 text-muted-foreground">{@html sanitizeHtml(row.trigger)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>

      <!-- ── Propriedades ──────────────────────────────────────────── -->
      <section id="propriedades">
        <h2 class="text-xl font-semibold mb-4">{$tStore('props.title')}</h2>
        <div class="space-y-6">
          <div>
            <h3 class="font-medium text-sm mb-3">{$tStore('props.interface')}</h3>
            <div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed">{`type ToasterProps = ComponentProps<typeof Sonner>

// Opções por toast
toast("Título", {
  description?: string
  action?: { label: string; onClick: () => void }
  cancel?: { label: string; onClick: () => void }
  duration?: number
  id?: string | number
  onDismiss?: (toast: ExternalToast) => void
  onAutoClose?: (toast: ExternalToast) => void
  important?: boolean
})`}</div>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-muted-foreground mb-4 px-1">
              {$tStore('props.toasterTitle')}
            </h3>
            <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
              <table class="w-full border-collapse text-sm" style="margin: 0">
                <thead class="bg-muted/50 border-b text-left">
                  <tr>
                    <th class="p-3 border-r border-border font-semibold">{$tStore('props.table.prop')}</th>
                    <th class="p-3 border-r border-border font-semibold">{$tStore('props.table.type')}</th>
                    <th class="p-3 border-r border-border font-semibold">{$tStore('props.table.default')}</th>
                    <th class="p-3 font-semibold">{$tStore('props.table.description')}</th>
                  </tr>
                </thead>
                <tbody>
                  {#each TOASTER_PROPS as prop}
                    <tr class="border-b last:border-0 hover:bg-muted/5">
                      <td class="p-3 border-r border-border font-mono font-bold text-primary">{prop.name}</td>
                      <td class="p-3 border-r border-border font-mono text-muted-foreground">{prop.type}</td>
                      <td class="p-3 border-r border-border font-mono">{prop.def}</td>
                      <td class="p-3 text-muted-foreground">{prop.desc}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-muted-foreground mb-4 px-1">
              {$tStore('props.toastTitle')}
            </h3>
            <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
              <table class="w-full border-collapse text-sm" style="margin: 0">
                <thead class="bg-muted/50 border-b text-left">
                  <tr>
                    <th class="p-3 border-r border-border font-semibold">{$tStore('props.table.prop')}</th>
                    <th class="p-3 border-r border-border font-semibold">{$tStore('props.table.type')}</th>
                    <th class="p-3 font-semibold">{$tStore('props.table.description')}</th>
                  </tr>
                </thead>
                <tbody>
                  {#each TOAST_OPTIONS as prop}
                    <tr class="border-b last:border-0 hover:bg-muted/5">
                      <td class="p-3 border-r border-border font-mono font-bold text-primary">{prop.name}</td>
                      <td class="p-3 border-r border-border font-mono text-muted-foreground">{prop.type}</td>
                      <td class="p-3 text-muted-foreground">{prop.desc}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="font-medium text-sm">{$tStore('props.extensibilityTitle')}</h3>
            <div class="space-y-3">
              {#each ['classNameNote', 'themeNote'] as key}
                <p class="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 border">
                  {@html sanitizeHtml($tStore(`props.extensibility.${key}`))}
                </p>
              {/each}
            </div>
          </div>
        </div>
      </section>

      <!-- ── Tokens ───────────────────────────────────────────────── -->
      <section id="tokens">
        <h2 class="text-xl font-semibold mb-4">{$tStore('tokens.title')}</h2>
        <div class="space-y-6">
          <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
            <table class="w-full border-collapse text-sm" style="margin: 0">
              <thead>
                <tr class="border-b border-border bg-muted/50 text-left">
                  <th class="p-3 border-r border-border font-medium">{$tStore('tokens.table.token')}</th>
                  <th class="p-3 border-r border-border font-medium">{$tStore('tokens.table.class')}</th>
                  <th class="p-3 font-medium">{$tStore('tokens.table.part')}</th>
                </tr>
              </thead>
              <tbody>
                {#each TOKEN_ROWS as row}
                  <tr class="border-b last:border-0 hover:bg-muted/5 transition-colors">
                    <td class="p-3 border-r border-border font-mono text-primary font-medium"><code>{row.token}</code></td>
                    <td class="p-3 border-r border-border font-mono text-primary"><code>{row.cls}</code></td>
                    <td class="p-3 text-muted-foreground">{row.part}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="space-y-2">
            <h3 class="font-medium text-sm">{$tStore('tokens.customizationTitle')}</h3>
            <div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed">{`/* Em globals.css ou theme-custom.css */
html.meu-tema {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --border: 214 32% 91%;
}
html.meu-tema.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --border: 217 33% 18%;
}`}</div>
          </div>
        </div>
      </section>

      <!-- ── Acessibilidade ────────────────────────────────────────── -->
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
              {#each ['escape', 'tab', 'enter'] as key}
                <div class="bg-muted/30 border rounded-xl p-4">
                  <code class="text-[10px] bg-muted px-2 py-0.5 rounded-md uppercase font-bold text-primary border border-border/60 block mb-2">
                    {key}
                  </code>
                  <p class="text-xs text-muted-foreground leading-relaxed">{$tStore(`accessibility.keyboard.${key}`)}</p>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </section>

      <!-- ── Relacionados ──────────────────────────────────────────── -->
      <section id="relacionados">
        <h2 class="text-xl font-semibold mb-4">{$tStore('related.title')}</h2>
        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-muted-foreground">{$tStore('related.alternatives')}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {#each [
              { name: 'AlertDialog', desc: $tStore('related.alertDialog'), path: '?path=/docs/ui-alertdialog--docs' },
              { name: 'Alert',       desc: $tStore('related.alert'),       path: '?path=/docs/ui-alert--docs' },
            ] as item}
              <div role="link" tabindex="0"
                   onclick={() => { (window.top ?? window).location.href = item.path; }}
                   onkeydown={(e) => { if (e.key === 'Enter') (window.top ?? window).location.href = item.path; }}
                   class="border rounded-xl p-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group">
                <h4 class="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">{item.name}</h4>
                <p class="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            {/each}
          </div>
          <h3 class="text-sm font-semibold text-muted-foreground mt-6">{$tStore('related.usedWith')}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {#each [
              { name: 'Form',   desc: $tStore('related.form'),   path: '?path=/docs/ui-form--docs' },
              { name: 'Button', desc: $tStore('related.button'), path: '?path=/docs/ui-button--docs' },
            ] as item}
              <div role="link" tabindex="0"
                   onclick={() => { (window.top ?? window).location.href = item.path; }}
                   onkeydown={(e) => { if (e.key === 'Enter') (window.top ?? window).location.href = item.path; }}
                   class="border rounded-xl p-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group">
                <h4 class="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">{item.name}</h4>
                <p class="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            {/each}
          </div>
        </div>
      </section>

      <!-- ── Notas ────────────────────────────────────────────────── -->
      <section id="notas">
        <h2 class="text-xl font-semibold mb-4">{$tStore('notes.title')}</h2>
        <div class="space-y-4">
          <div class="p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg">
            <p class="text-sm text-muted-foreground leading-relaxed">{@html sanitizeHtml($tStore('notes.tip1'))}</p>
          </div>
          <div class="p-4 bg-orange-500/5 border-l-4 border-orange-500 rounded-r-lg">
            <p class="text-sm text-muted-foreground leading-relaxed">{@html sanitizeHtml($tStore('notes.tip2'))}</p>
          </div>
          <div class="p-4 bg-red-500/5 border-l-4 border-red-500 rounded-r-lg">
            <p class="text-sm text-muted-foreground leading-relaxed">{@html sanitizeHtml($tStore('notes.tip3'))}</p>
          </div>
        </div>
      </section>

      <!-- ── Analytics ────────────────────────────────────────────── -->
      <section id="analytics">
        <h2 class="text-xl font-semibold mb-4">{$tStore('analytics.title')}</h2>
        <div class="space-y-4">
          <p class="text-sm text-muted-foreground leading-relaxed">{$tStore('analytics.description')}</p>
          <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
            <table class="w-full border-collapse text-sm" style="margin: 0">
              <thead>
                <tr class="bg-muted/50 border-b text-left">
                  <th class="p-3 border-r border-border font-semibold">{$tStore('analytics.table.event')}</th>
                  <th class="p-3 border-r border-border font-semibold">{$tStore('analytics.table.trigger')}</th>
                  <th class="p-3 font-semibold">{$tStore('analytics.table.payload')}</th>
                </tr>
              </thead>
              <tbody>
                {#each ANALYTICS_KEYS as key}
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

      <!-- ── Testes ───────────────────────────────────────────────── -->
      <section id="testes">
        <h2 class="text-xl font-semibold mb-6">{$tStore('testes.title')}</h2>
        <div class="space-y-8">

          <!-- Funcional -->
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
                  {#each [1, 2, 3, 4, 5, 6, 7, 8] as i}
                    {@const priority = $tStore(`testes.functional.item${i}.priority`)}
                    <tr class="border-b last:border-0 hover:bg-muted/5">
                      <td class="p-4 border-r border-border font-medium">{$tStore(`testes.functional.item${i}.action`)}</td>
                      <td class="p-4 border-r border-border text-muted-foreground">{$tStore(`testes.functional.item${i}.result`)}</td>
                      <td class="p-4">
                        <span class={priority === 'high'
                          ? 'inline-flex items-center rounded-md border bg-orange-500/10 text-orange-600 border-orange-500/20 h-5 font-medium text-[11px] px-2'
                          : 'inline-flex items-center rounded-md border bg-blue-500/10 text-blue-600 border-blue-500/20 h-5 font-medium text-[11px] px-2'}>
                          {priority === 'high' ? $tNavStore('common.high') : $tNavStore('common.medium')}
                        </span>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Acessibilidade -->
          <div>
            <h3 class="font-semibold text-sm mb-1">{$tStore('testes.accessibility.title')}</h3>
            <p class="text-xs text-muted-foreground mb-4">{$tStore('testes.accessibility.description')}</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {#each [1, 2, 3, 4, 5, 6] as i}
                <div class="flex gap-3 items-start p-4 bg-muted/10 rounded-lg border border-border/40">
                  <div class="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="text-[10px] text-primary font-bold italic">axe</span>
                  </div>
                  <span class="text-xs text-muted-foreground leading-relaxed">{$tStore(`testes.accessibility.item${i}`)}</span>
                </div>
              {/each}
            </div>
          </div>

          <!-- Visual -->
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
                    {@const priority = $tStore(`testes.visual.item${i}.priority`)}
                    <tr class="border-b last:border-0 hover:bg-muted/5">
                      <td class="p-4 border-r border-border font-medium">{$tStore(`testes.visual.item${i}.story`)}</td>
                      <td class="p-4 border-r border-border text-center text-emerald-600 font-medium">{$tStore('testes.visual.required')}</td>
                      <td class="p-4 border-r border-border text-center text-emerald-600 font-medium">{$tStore('testes.visual.required')}</td>
                      <td class="p-4">
                        <span class={priority === 'high'
                          ? 'inline-flex items-center rounded-md border bg-orange-500/10 text-orange-600 border-orange-500/20 h-5 font-medium text-[11px] px-2'
                          : 'inline-flex items-center rounded-md border bg-blue-500/10 text-blue-600 border-blue-500/20 h-5 font-medium text-[11px] px-2'}>
                          {priority === 'high' ? $tNavStore('common.high') : $tNavStore('common.medium')}
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
