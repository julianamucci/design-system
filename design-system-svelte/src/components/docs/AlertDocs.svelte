<script lang="ts">
  import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
  import { Badge } from '@/components/ui/badge';
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import uiTranslations from '@/i18n/ui.json';
  import alertTranslations from '@shared/content/alert/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(alertTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'alert',
    });
    track('docs_page_view', {
      component_name: 'alert',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section (IntersectionObserver) ────────────────────────────────────

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
          track('docs_section_viewed', { section_id: entry.target.id, component_name: 'alert', locale: $locale });
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

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function stripHtml(s: string) {
    return s.replace(/<[^>]*>/g, '');
  }

  function priorityLabel(raw: string): string {
    const map: Record<string, string> = { high: 'Alta', medium: 'Média', low: 'Baixa', High: 'High', Medium: 'Medium', Low: 'Low' };
    return map[raw] ?? raw;
  }

  function priorityColor(label: string): string {
    if (label === 'Alta' || label === 'High') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (label === 'Média' || label === 'Medium') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  }

  // ─── Data ─────────────────────────────────────────────────────────────────────

  const VARIANT_KEYS = ['default', 'destructive', 'success', 'warning'] as const;

  const STATE_KEYS = ['complete', 'withoutTitle', 'withoutIcon', 'dynamicInsert'] as const;

  const PROP_ROWS = [
    { name: 'variant', type: '"default" | "destructive"', def: '"default"', req: 'Não', key: 'variant' },
    { name: 'class',   type: 'string',                    def: '—',         req: 'Não', key: 'className' },
    { name: 'children', type: 'Snippet',                  def: '—',         req: 'Não', key: 'children' },
  ];

  const TOKEN_ROWS = [
    { token: '--background',  key: 'background'      },
    { token: '--foreground',  key: 'foreground'       },
    { token: '--border',      key: 'border'           },
    { token: '--destructive', key: 'destructiveBorder' },
    { token: '--success',     key: 'success'          },
    { token: '--warning',     key: 'warning'          },
    { token: '--radius',      key: 'radius'           },
  ];

  const KEYBOARD_KEYS = ['tab', 'enter', 'noKeyboard'] as const;

  const ARIA_KEYS = ['role', 'ariaLive', 'ariaLiveAssertive', 'ariaHidden'] as const;

  const RELATED_ITEMS = [
    { name: 'Sonner',       key: 'sonner',      path: '?path=/docs/ui-sonner--docs'       },
    { name: 'AlertDialog',  key: 'alertDialog', path: '?path=/docs/ui-alertdialog--docs'  },
    { name: 'Badge',        key: 'badge',       path: '?path=/docs/ui-badge--docs'        },
    { name: 'Progress',     key: 'progress',    path: '?path=/docs/ui-progress--docs'     },
  ];
</script>

<div class="ds-docs p-8 max-w-5xl mx-auto">

  <!-- ── Header ──────────────────────────────────────────────────────────────── -->
  <header class="mb-12 border-b pb-8 border-border/50">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <Badge variant="secondary" class="rounded-md bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 font-medium px-2 py-0">
          {$tStore('category')}
        </Badge>
        <Badge variant="outline" class="rounded-md text-muted-foreground font-normal px-2 py-0">
          {$tStore('type')}
        </Badge>
      </div>
      <LanguageSwitcher />
    </div>
    <div class="space-y-4">
      <h1 class="text-4xl font-bold tracking-tight text-foreground">{$tStore('title')}</h1>
      <p class="text-muted-foreground text-lg max-w-3xl leading-relaxed">{$tStore('description')}</p>
    </div>
    <div class="mt-6 flex items-center gap-3 text-sm text-muted-foreground/80">
      <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border/50">shadcn/ui</code>
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
    <div class="flex-1 min-w-0 space-y-12">

      <!-- Demonstração -->
      <section id="demonstracao">
        <h2 class="text-xl font-semibold mb-4">{$tStore('demonstration.title')}</h2>
        <div class="flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm">
          <div class="space-y-3 w-full max-w-lg">
            <Alert>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
              </svg>
              <AlertTitle>{$tStore('demonstration.labels.infoTitle')}</AlertTitle>
              <AlertDescription>{$tStore('demonstration.labels.infoDesc')}</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <AlertTitle>{$tStore('demonstration.labels.errorTitle')}</AlertTitle>
              <AlertDescription>{$tStore('demonstration.labels.errorDesc')}</AlertDescription>
            </Alert>
          </div>
        </div>
      </section>

      <!-- Anatomia -->
      <section id="anatomia">
        <h2 class="text-xl font-semibold mb-4">{$tStore('anatomy.title')}</h2>
        <ol class="space-y-2 mb-6 list-none p-0 m-0">
          {#each [1,2,3,4] as i}
            <li class="flex gap-3 items-start list-none">
              <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{i}</span>
              <!-- eslint-disable svelte/no-at-html-tags -->
              <span class="text-sm text-muted-foreground leading-relaxed">{@html sanitizeHtml($tStore(`anatomy.item${i}`))}</span>
            </li>
          {/each}
        </ol>
        <div class="rounded-lg bg-muted/50 border border-border/40 px-4 pt-3 pb-4 overflow-x-auto">
          <p class="text-xs text-muted-foreground mb-2">{$tStore('anatomy.structureLabel')}</p>
          <pre class="text-xs font-mono leading-relaxed">{$tStore('anatomy.structureCode')}</pre>
        </div>
      </section>

      <!-- Quando Usar -->
      <section id="quando-usar">
        <h2 class="text-xl font-semibold mb-4">{$tStore('usage.title')}</h2>
        <div class="border rounded-xl p-6 shadow-sm space-y-6">
          <div class="bg-muted/30 rounded-lg p-4 space-y-3">
            <h3 class="font-medium text-sm">{$tStore('usage.guidelines.title')}</h3>
            <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              {#each [1,2,3,4] as i}
                <!-- eslint-disable svelte/no-at-html-tags -->
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
                {#each [1,2,3,4] as i}
                  <tr class="border-b border-border hover:bg-muted/5">
                    <td class="p-3 border-r border-border">{$tStore(`usage.scenarios.item${i}.s`)}</td>
                    <td class="p-3 border-r border-border font-medium text-primary">{$tStore(`usage.scenarios.item${i}.u`)}</td>
                    <td class="p-3 text-muted-foreground">{$tStore(`usage.scenarios.item${i}.a`)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="overflow-x-auto">
            <h3 class="font-medium text-sm mb-3">{$tStore('usage.uxWriting.title')}</h3>
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-border bg-muted/70 text-left">
                  <th class="p-3 border-r border-border font-semibold">{$tStore('usage.uxWriting.table.element')}</th>
                  <th class="p-3 border-r border-border font-semibold">{$tStore('usage.uxWriting.table.rules')}</th>
                  <th class="p-3 border-r border-border font-semibold text-green-700 dark:text-green-400">{$tStore('usage.uxWriting.table.correct')}</th>
                  <th class="p-3 font-semibold text-red-700 dark:text-red-400">{$tStore('usage.uxWriting.table.avoid')}</th>
                </tr>
              </thead>
              <tbody>
                {#each ['title', 'description', 'error', 'warning'] as key}
                  <tr class="border-b border-border last:border-0">
                    <td class="p-3 border-r border-border font-medium">{$tStore(`usage.uxWriting.table.${key}.name`)}</td>
                    <td class="p-3 border-r border-border text-muted-foreground">{$tStore(`usage.uxWriting.table.${key}.format`)}</td>
                    <td class="p-3 border-r border-border text-green-600 dark:text-green-500">{$tStore(`usage.uxWriting.table.${key}.good`)}</td>
                    <td class="p-3 text-red-600 dark:text-red-500">{$tStore(`usage.uxWriting.table.${key}.bad`)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-card border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 shadow-sm">
              <h3 class="font-medium text-sm text-emerald-700 dark:text-emerald-400 mb-2">{$tStore('usage.do.title')}</h3>
              <ul class="space-y-2 list-none p-0 m-0">
                {#each [1,2,3,4] as i}
                  <li class="flex gap-2 items-start text-sm text-muted-foreground list-none">
                    <span class="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                    {$tStore(`usage.do.item${i}`)}
                  </li>
                {/each}
              </ul>
            </div>
            <div class="bg-card border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-sm">
              <h3 class="font-medium text-sm text-red-700 dark:text-red-400 mb-2">{$tStore('usage.dont.title')}</h3>
              <ul class="space-y-2 list-none p-0 m-0">
                {#each [1,2,3] as i}
                  <li class="flex gap-2 items-start text-sm text-muted-foreground list-none">
                    <span class="text-destructive font-bold">✗</span>
                    {$tStore(`usage.dont.item${i}`)}
                  </li>
                {/each}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Do & Don't -->
      <section id="do-dont">
        <h2 class="text-xl font-semibold mb-4">{$tStore('doDont.title')}</h2>
        <div class="flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm">
          <div class="space-y-8 w-full">
            <!-- Pair 1 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-green-600">
                  <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                  <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.do')}</span>
                </div>
                <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
                  <Alert>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                    </svg>
                    <AlertTitle>{$tStore('demonstration.labels.infoTitle')}</AlertTitle>
                    <AlertDescription>{$tStore('demonstration.labels.infoDesc')}</AlertDescription>
                  </Alert>
                </div>
                <p class="text-sm text-muted-foreground italic px-1">{$tStore('doDont.pair1.do')}</p>
              </div>
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-red-600">
                  <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                  <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.dont')}</span>
                </div>
                <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
                  <Alert variant="destructive">
                    <AlertTitle>{$tStore('demonstration.labels.infoTitle')}</AlertTitle>
                    <AlertDescription>{$tStore('demonstration.labels.infoDesc')}</AlertDescription>
                  </Alert>
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
                  <Alert class="bg-success/10 text-success border-success/30">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <AlertTitle>{$tStore('demonstration.labels.successTitle')}</AlertTitle>
                    <AlertDescription>{$tStore('demonstration.labels.successDesc')}</AlertDescription>
                  </Alert>
                </div>
                <p class="text-sm text-muted-foreground italic px-1">{$tStore('doDont.pair2.do')}</p>
              </div>
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-red-600">
                  <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                  <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.dont')}</span>
                </div>
                <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
                  <Alert class="bg-green-100 text-green-900 border-green-300">
                    <AlertTitle>{$tStore('demonstration.labels.successTitle')}</AlertTitle>
                    <AlertDescription>{$tStore('demonstration.labels.successDesc')}</AlertDescription>
                  </Alert>
                </div>
                <p class="text-sm text-muted-foreground italic px-1">{$tStore('doDont.pair2.dont')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Importação -->
      <section id="importacao">
        <h2 class="text-xl font-semibold mb-4">{$tStore('import.title')}</h2>
        <p class="text-sm text-muted-foreground mb-3">{$tStore('import.basic')}</p>
        <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
          <code class="whitespace-pre">import &#123; Alert, AlertTitle, AlertDescription &#125; from '@/components/ui/alert';</code>
        </div>
        <p class="text-sm text-muted-foreground mb-3 mt-4">{$tStore('import.withIcon')}</p>
        <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
          <code class="whitespace-pre">import &#123; Info &#125; from 'lucide-svelte';</code>
        </div>
      </section>

      <!-- Exemplos -->
      <section id="exemplos">
        <h2 class="text-xl font-semibold mb-4">{$tStore('examples.title')}</h2>
        <div class="space-y-6">
          {#each (['default', 'destructive', 'success', 'warning', 'withoutTitle'] as const) as key}
            <h3 class="font-medium text-sm mb-2 mt-4">{$tStore(`examples.${key}`)}</h3>
            <div class="rounded-lg border border-border">
              <div class="flex items-center justify-center p-8 border-b border-border bg-muted/5">
                {#if key === 'default'}
                  <Alert class="max-w-md">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                    </svg>
                    <AlertTitle>{$tStore('demonstration.labels.infoTitle')}</AlertTitle>
                    <AlertDescription>{$tStore('demonstration.labels.infoDesc')}</AlertDescription>
                  </Alert>
                {:else if key === 'destructive'}
                  <Alert variant="destructive" class="max-w-md">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <AlertTitle>{$tStore('demonstration.labels.errorTitle')}</AlertTitle>
                    <AlertDescription>{$tStore('demonstration.labels.errorDesc')}</AlertDescription>
                  </Alert>
                {:else if key === 'success'}
                  <Alert class="max-w-md bg-success/10 text-success border-success/30">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <AlertTitle>{$tStore('demonstration.labels.successTitle')}</AlertTitle>
                    <AlertDescription>{$tStore('demonstration.labels.successDesc')}</AlertDescription>
                  </Alert>
                {:else if key === 'warning'}
                  <Alert class="max-w-md bg-warning/10 text-warning border-warning/30">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
                    </svg>
                    <AlertTitle>{$tStore('demonstration.labels.warningTitle')}</AlertTitle>
                    <AlertDescription>{$tStore('demonstration.labels.warningDesc')}</AlertDescription>
                  </Alert>
                {:else}
                  <Alert class="max-w-md">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <AlertDescription>{$tStore('demonstration.labels.infoDesc')}</AlertDescription>
                  </Alert>
                {/if}
              </div>
              <div class="bg-muted p-4 font-mono text-xs border-t overflow-x-auto">
                <code class="whitespace-pre">{$tStore(`examples.${key}`)}</code>
              </div>
            </div>
          {/each}
        </div>
      </section>

      <!-- Variantes -->
      <section id="variantes">
        <h2 class="text-xl font-semibold mb-4">{$tStore('variants.title')}</h2>
        <p class="text-sm text-muted-foreground mb-4">{$tStore('variants.visualTitle')}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {#each VARIANT_KEYS as key}
            <div class="rounded-xl border border-border p-4 space-y-3 shadow-sm">
              <div class="flex items-center justify-center p-4 bg-muted/20 rounded-lg min-h-16">
                {#if key === 'default'}
                  <Alert>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                    </svg>
                    <AlertTitle>Default</AlertTitle>
                    <AlertDescription>{$tStore('variants.items.default')}</AlertDescription>
                  </Alert>
                {:else if key === 'destructive'}
                  <Alert variant="destructive">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <AlertTitle>Destructive</AlertTitle>
                    <AlertDescription>{$tStore('variants.items.destructive')}</AlertDescription>
                  </Alert>
                {:else if key === 'success'}
                  <Alert class="bg-success/10 text-success border-success/30">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <AlertTitle>Success</AlertTitle>
                  </Alert>
                {:else}
                  <Alert class="bg-warning/10 text-warning border-warning/30">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
                    </svg>
                    <AlertTitle>Warning</AlertTitle>
                  </Alert>
                {/if}
              </div>
              <div>
                <p class="font-medium text-sm font-mono">{key}</p>
                <!-- eslint-disable svelte/no-at-html-tags -->
                <p class="text-xs text-muted-foreground mt-0.5">{@html sanitizeHtml($tStore(`variants.items.${key}`))}</p>
              </div>
            </div>
          {/each}
        </div>
        <p class="text-xs text-muted-foreground mt-4 bg-muted/30 rounded-lg p-3">{$tStore('variants.note')}</p>
      </section>

      <!-- Estados -->
      <section id="estados">
        <h2 class="text-xl font-semibold mb-4">{$tStore('states.title')}</h2>
        <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border bg-muted/50 text-left">
                <th class="p-3 border-r border-border font-semibold">{$tStore('states.cols.state')}</th>
                <th class="p-3 border-r border-border font-semibold">{$tStore('states.cols.trigger')}</th>
                <th class="p-3 font-semibold">{$tStore('states.cols.behavior')}</th>
              </tr>
            </thead>
            <tbody>
              {#each STATE_KEYS as key}
                <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                  <td class="p-3 border-r border-border font-medium">{$tStore(`states.${key}.label`)}</td>
                  <td class="p-3 border-r border-border text-muted-foreground">{stripHtml($tStore(`states.${key}.trigger`))}</td>
                  <td class="p-3 text-muted-foreground">{stripHtml($tStore(`states.${key}.behavior`))}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Propriedades -->
      <section id="propriedades">
        <h2 class="text-xl font-semibold mb-4">{$tStore('props.title')}</h2>
        <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-4">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border bg-muted/50 text-left">
                <th class="p-3 border-r border-border font-semibold">{$tStore('props.table.prop')}</th>
                <th class="p-3 border-r border-border font-semibold">Tipo</th>
                <th class="p-3 border-r border-border font-semibold">Padrão</th>
                <th class="p-3 border-r border-border font-semibold">Obrig.</th>
                <th class="p-3 font-semibold">Descrição</th>
              </tr>
            </thead>
            <tbody>
              {#each PROP_ROWS as row}
                <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                  <td class="p-3 border-r border-border font-mono font-bold text-primary text-xs">{row.name}</td>
                  <td class="p-3 border-r border-border font-mono text-muted-foreground text-xs">{row.type}</td>
                  <td class="p-3 border-r border-border font-mono text-xs">{row.def}</td>
                  <td class="p-3 border-r border-border text-xs">{row.req}</td>
                  <!-- eslint-disable svelte/no-at-html-tags -->
                  <td class="p-3 text-xs text-muted-foreground">{@html sanitizeHtml($tStore(`props.table.${row.key}`))}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto">
          <code class="whitespace-pre">{$tStore('props.interface')}</code>
        </div>
        <div class="mt-4 bg-muted/30 rounded-lg p-4 text-sm">
          <p class="font-medium mb-1">{$tStore('props.extensibilityTitle')}</p>
          <!-- eslint-disable svelte/no-at-html-tags -->
          <p class="text-muted-foreground">{@html sanitizeHtml($tStore('props.extensibility'))}</p>
        </div>
      </section>

      <!-- Tokens -->
      <section id="tokens">
        <h2 class="text-xl font-semibold mb-4">{$tStore('tokens.title')}</h2>
        <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-4">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border bg-muted/50 text-left">
                <th class="p-3 border-r border-border font-semibold">{$tStore('tokens.table.token')}</th>
                <th class="p-3 border-r border-border font-semibold">{$tStore('tokens.table.class')}</th>
                <th class="p-3 font-semibold">{$tStore('tokens.table.part')}</th>
              </tr>
            </thead>
            <tbody>
              {#each TOKEN_ROWS as row}
                <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                  <td class="p-3 border-r border-border font-mono text-primary text-xs">{row.token}</td>
                  <td class="p-3 border-r border-border font-mono text-xs text-muted-foreground">{row.token}</td>
                  <td class="p-3 text-xs text-muted-foreground">{$tStore(`tokens.table.${row.key}`)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <p class="text-sm font-medium mb-2">{$tStore('tokens.customizationTitle')}</p>
        <div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto">
          <code class="whitespace-pre">.dark [data-slot="alert"] &#123;
  /* override tokens per theme */
  --success: var(--chart-2);
&#125;</code>
        </div>
      </section>

      <!-- Acessibilidade -->
      <section id="acessibilidade">
        <h2 class="text-xl font-semibold mb-4">{$tStore('accessibility.title')}</h2>
        <!-- eslint-disable svelte/no-at-html-tags -->
        <p class="text-sm text-muted-foreground mb-4">{@html sanitizeHtml($tStore('accessibility.summary'))}</p>
        <ul class="space-y-2 list-none p-0 m-0 mb-6">
          {#each [1,2,3,4,5] as i}
            <li class="flex gap-2 items-start text-sm list-none">
              <span class="text-primary mt-0.5">•</span>
              {@html sanitizeHtml($tStore(`accessibility.item${i}`))}
            </li>
          {/each}
        </ul>
        <h3 class="font-medium text-sm mb-3">{$tStore('accessibility.keyboardTitle')}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {#each KEYBOARD_KEYS as key}
            <div class="flex gap-3 items-start rounded-lg border border-border p-3">
              <kbd class="bg-muted border border-border rounded px-1.5 py-0.5 text-xs font-mono shrink-0">{key === 'noKeyboard' ? '—' : key.charAt(0).toUpperCase() + key.slice(1)}</kbd>
              <p class="text-xs text-muted-foreground">{$tStore(`accessibility.keyboard.${key}`)}</p>
            </div>
          {/each}
        </div>
        <h3 class="font-medium text-sm mb-3">ARIA</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {#each ARIA_KEYS as key}
            <div class="flex gap-3 items-start rounded-lg border border-border p-3">
              <code class="bg-muted border border-border rounded px-1.5 py-0.5 text-xs font-mono shrink-0 text-primary">{key}</code>
              <p class="text-xs text-muted-foreground">{$tStore(`accessibility.aria.${key}`)}</p>
            </div>
          {/each}
        </div>
      </section>

      <!-- Relacionados -->
      <section id="relacionados">
        <h2 class="text-xl font-semibold mb-4">{$tStore('related.title')}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {#each RELATED_ITEMS as item}
            <button
              type="button"
              onclick={() => { (window.top ?? window).location.href = item.path; }}
              class="text-left rounded-xl border border-border p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors group"
            >
              <p class="font-semibold text-sm group-hover:text-primary transition-colors">{item.name}</p>
              <p class="text-xs text-muted-foreground mt-0.5">{$tStore(`related.${item.key}`)}</p>
            </button>
          {/each}
        </div>
      </section>

      <!-- Notas -->
      <section id="notas">
        <h2 class="text-xl font-semibold mb-4">{$tStore('notes.title')}</h2>
        <div class="space-y-3">
          {#each [1,2,3] as i}
            <div class="bg-muted/30 rounded-lg border-l-4 border-primary/40 p-4">
              <!-- eslint-disable svelte/no-at-html-tags -->
              <p class="text-sm text-muted-foreground">{@html sanitizeHtml($tStore(`notes.tip${i}`))}</p>
            </div>
          {/each}
        </div>
      </section>

      <!-- Analytics -->
      <section id="analytics">
        <h2 class="text-xl font-semibold mb-4">{$tStore('analytics.title')}</h2>
        <p class="text-sm text-muted-foreground mb-4">{$tStore('analytics.description')}</p>
        <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border bg-muted/50 text-left">
                <th class="p-3 border-r border-border font-semibold">{$tStore('analytics.table.event')}</th>
                <th class="p-3 border-r border-border font-semibold">{$tStore('analytics.table.trigger')}</th>
                <th class="p-3 font-semibold">{$tStore('analytics.table.payload')}</th>
              </tr>
            </thead>
            <tbody>
              {#each (['pageView', 'sectionViewed', 'langSwitch', 'dismiss'] as const) as key}
                <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                  <td class="p-3 border-r border-border font-mono text-primary text-xs">{$tStore(`analytics.table.${key}`)}</td>
                  <td class="p-3 border-r border-border text-xs text-muted-foreground">{$tStore(`analytics.table.${key}Trigger`)}</td>
                  <td class="p-3 font-mono text-xs text-muted-foreground">{$tStore(`analytics.table.${key}Payload`)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Testes -->
      <section id="testes">
        <h2 class="text-xl font-semibold mb-4">{$tStore('testes.title')}</h2>

        <!-- Testes funcionais -->
        <h3 class="font-medium text-sm mb-3">{$tStore('testes.functional.title')}</h3>
        <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-6">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border bg-muted/50 text-left">
                <th class="p-3 border-r border-border font-semibold">Ação</th>
                <th class="p-3 border-r border-border font-semibold">Resultado</th>
                <th class="p-3 font-semibold">Prioridade</th>
              </tr>
            </thead>
            <tbody>
              {#each [1,2,3,4,5,6] as i}
                {#if $tStore(`testes.functional.item${i}.action`)}
                  {@const raw = $tStore(`testes.functional.item${i}.priority`)}
                  {@const label = priorityLabel(raw)}
                  <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                    <td class="p-3 border-r border-border text-xs">{$tStore(`testes.functional.item${i}.action`)}</td>
                    <td class="p-3 border-r border-border text-xs text-muted-foreground">{$tStore(`testes.functional.item${i}.result`)}</td>
                    <td class="p-3">
                      <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium {priorityColor(label)}">{label}</span>
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Testes de acessibilidade -->
        <h3 class="font-medium text-sm mb-3">{$tStore('testes.accessibility.title')}</h3>
        <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-6">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border bg-muted/50 text-left">
                <th class="p-3 border-r border-border font-semibold">Critério</th>
                <th class="p-3 border-r border-border font-semibold">Nível</th>
                <th class="p-3 font-semibold">Como testar</th>
              </tr>
            </thead>
            <tbody>
              {#each [1,2,3,4] as i}
                {#if $tStore(`testes.accessibility.item${i}.criterion`)}
                  <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                    <td class="p-3 border-r border-border text-xs">{$tStore(`testes.accessibility.item${i}.criterion`)}</td>
                    <td class="p-3 border-r border-border">
                      <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{$tStore(`testes.accessibility.item${i}.level`)}</span>
                    </td>
                    <td class="p-3 text-xs text-muted-foreground">{$tStore(`testes.accessibility.item${i}.how`)}</td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Testes visuais -->
        <h3 class="font-medium text-sm mb-3">{$tStore('testes.visual.title')}</h3>
        <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border bg-muted/50 text-left">
                <th class="p-3 border-r border-border font-semibold">Story</th>
                <th class="p-3 font-semibold">Prioridade</th>
              </tr>
            </thead>
            <tbody>
              {#each [1,2,3,4] as i}
                {#if $tStore(`testes.visual.item${i}.story`)}
                  {@const raw = $tStore(`testes.visual.item${i}.priority`)}
                  {@const label = priorityLabel(raw)}
                  <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                    <td class="p-3 border-r border-border text-xs">{$tStore(`testes.visual.item${i}.story`)}</td>
                    <td class="p-3">
                      <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium {priorityColor(label)}">{label}</span>
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  </div>
</div>
