<script lang="ts">
  import { Button } from '@/components/ui/button';
  import { Badge } from '@/components/ui/badge';
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import uiTranslations from '@/i18n/ui.json';
  import buttonTranslations from '@shared/content/button/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(buttonTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: `${t('title')} — ${t('category')}`,
      description: t('seo.description'),
      locale: l,
      componentSlug: 'button',
    });
    track('docs_page_view', {
      component_name: 'button',
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
          track('docs_section_viewed', { section_id: entry.target.id, component_name: 'button', locale: $locale });
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
      <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border/50">
        npx shadcn@latest add button
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
    <div class="flex-1 min-w-0 space-y-12">

      <section id="demonstracao">
        <h2 class="text-xl font-semibold mb-4">{$tStore('demonstration.title')}</h2>
        <div class="rounded-lg border border-border p-6 bg-card/30">
          <div class="flex flex-wrap gap-3">
            <Button>{$tStore('demonstration.labels.save')}</Button>
            <Button variant="outline">{$tStore('demonstration.labels.cancel')}</Button>
            <Button variant="destructive">{$tStore('demonstration.labels.delete')}</Button>
          </div>
        </div>
      </section>

      <section id="anatomia">
        <h2 class="text-xl font-semibold mb-4">{$tStore('anatomy.title')}</h2>
        <div class="rounded-lg border border-border p-6 bg-card/30 space-y-4">
          <ol class="space-y-3 text-sm list-none p-0 m-0">
            {#each [1, 2, 3] as i}
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

      <section id="quando-usar">
        <h2 class="text-xl font-semibold mb-4">{$tStore('usage.title')}</h2>
        <div class="border rounded-xl p-6 shadow-sm space-y-6">
          <div class="bg-muted/30 rounded-lg p-4 space-y-3">
            <h3 class="font-medium text-sm">{$tStore('usage.guidelines.title')}</h3>
            <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              {#each [1, 2, 3, 4] as i}
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
                {#each [1, 2, 3] as i}
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
                  {#each ['label', 'destructive', 'cancel'] as key}
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
                  <!-- eslint-disable svelte/no-at-html-tags -->
                  <li>{@html sanitizeHtml($tStore(`usage.dont.item${i}`))}</li>
                {/each}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="do-dont">
        <h2 class="text-xl font-semibold mb-4">{$tStore('doDont.title')}</h2>
        <div class="rounded-lg border border-border p-6 bg-card/30 space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-green-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.do')}</span>
              </div>
              <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10 flex gap-2">
                <Button variant="outline">{$tStore('demonstration.labels.cancel')}</Button>
                <Button>{$tStore('demonstration.labels.save')}</Button>
              </div>
              <p class="text-sm text-muted-foreground italic px-1">{$tStore('doDont.pair1.do')}</p>
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-red-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.dont')}</span>
              </div>
              <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10 flex gap-2">
                <Button>OK</Button>
                <Button>Click here</Button>
              </div>
              <p class="text-sm text-muted-foreground italic px-1">{$tStore('doDont.pair1.dont')}</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-green-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.do')}</span>
              </div>
              <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
                <Button size="icon" aria-label="Fechar diálogo">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                </Button>
              </div>
              <!-- eslint-disable svelte/no-at-html-tags -->
              <p class="text-sm text-muted-foreground italic px-1">{@html sanitizeHtml($tStore('doDont.pair2.do'))}</p>
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-red-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.dont')}</span>
              </div>
              <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
                <Button size="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                </Button>
              </div>
              <!-- eslint-disable svelte/no-at-html-tags -->
              <p class="text-sm text-muted-foreground italic px-1">{@html sanitizeHtml($tStore('doDont.pair2.dont'))}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="importacao">
        <h2 class="text-xl font-semibold mb-4">{$tStore('import.title')}</h2>
        <div class="rounded-lg border border-border p-6 bg-card/30 space-y-4">
          <div>
            <p class="text-sm text-muted-foreground mb-3">{$tStore('import.basic')}</p>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">{"import { Button } from '@/components/ui/button';"}</code></div>
          </div>
          <div>
            <p class="text-sm text-muted-foreground mb-3">{$tStore('import.variants')}</p>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">{"import { buttonVariants } from '@/components/ui/button';"}</code></div>
          </div>
        </div>
      </section>

      <section id="exemplos">
        <h2 class="text-xl font-semibold mb-4">{$tStore('examples.title')}</h2>
        <div class="space-y-8">
          <div class="space-y-3">
            <h3 class="text-sm font-medium">{$tStore('examples.basic')}</h3>
            <div class="rounded-lg border border-border p-6 bg-card/30">
              <Button>{$tStore('demonstration.labels.save')}</Button>
            </div>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">{"<Button>Salvar</Button>"}</code></div>
          </div>
          <div class="space-y-3">
            <h3 class="text-sm font-medium">{$tStore('examples.withIcon')}</h3>
            <div class="rounded-lg border border-border p-6 bg-card/30 flex gap-4">
              <Button variant="outline">
                {$tStore('demonstration.labels.cancel')}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 ml-2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
              </Button>
              <Button>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-2" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                {$tStore('demonstration.labels.save')}
              </Button>
            </div>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">{`<Button variant="outline">
  Cancelar
  <XCircle class="h-4 w-4 ml-2" />
</Button>
<Button>
  <Mail class="h-4 w-4 mr-2" />
  Salvar
</Button>`}</code></div>
          </div>
          <div class="space-y-3">
            <h3 class="text-sm font-medium">{$tStore('examples.disabled')}</h3>
            <div class="rounded-lg border border-border p-6 bg-card/30">
              <Button disabled>{$tStore('examples.disabled')}</Button>
            </div>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">{"<Button disabled>Desabilitado</Button>"}</code></div>
          </div>
        </div>
      </section>

      <section id="variantes">
        <h2 class="text-xl font-semibold mb-6">{$tStore('variants.title')}</h2>
        <div class="space-y-12">
          <div>
            <h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1">
              {$tStore('variants.visualTitle')}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each ([
                { variant: 'default',     label: 'default'     },
                { variant: 'secondary',   label: 'secondary'   },
                { variant: 'outline',     label: 'outline'     },
                { variant: 'ghost',       label: 'ghost'       },
                { variant: 'link',        label: 'link'        },
                { variant: 'destructive', label: 'destructive' },
              ] as const) as { variant, label }}
                <div class="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col hover:border-primary/30 hover:shadow-sm transition-all">
                  <div class="flex-1 flex items-center justify-center p-8 bg-muted/5 min-h-[140px]">
                    <Button {variant}>{$tStore('title')}</Button>
                  </div>
                  <div class="p-4 border-t border-border/40 bg-muted/10 space-y-1">
                    <p class="text-[11px] uppercase font-mono text-primary font-bold tracking-wider px-1.5 py-0.5 bg-primary/5 rounded-sm inline-block mb-1">{label}</p>
                    <p class="text-xs text-muted-foreground leading-relaxed">{$tStore(`variants.items.${label}`)}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1">
              {$tStore('variants.sizeTitle')}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {#each ([
                { size: 'sm',      label: 'sm'      },
                { size: 'default', label: 'default' },
                { size: 'lg',      label: 'lg'      },
                { size: 'icon',    label: 'icon'    },
              ] as const) as { size, label }}
                <div class="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col hover:border-primary/30 hover:shadow-sm transition-all">
                  <div class="flex-1 flex items-center justify-center p-6 bg-muted/5 min-h-[100px]">
                    {#if size === 'icon'}
                      <Button {size} aria-label="Ícone">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      </Button>
                    {:else}
                      <Button {size}>{$tStore('title')}</Button>
                    {/if}
                  </div>
                  <div class="p-3 border-t border-border/40 bg-muted/10 space-y-1">
                    <p class="text-[11px] uppercase font-mono text-primary font-bold block">{label}</p>
                    <p class="text-xs text-muted-foreground">{$tStore(`variants.sizes.${label}`)}</p>
                    <p class="text-xs text-muted-foreground/70 italic">{$tStore(`variants.sizes.${label}Use`)}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </section>

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
                <td class="p-3 border-r border-border"><Button size="sm">{$tStore('demonstration.labels.save')}</Button></td>
                <td class="p-3 text-muted-foreground">{$tStore('states.table.initial')}</td>
              </tr>
              <tr class="border-b border-border hover:bg-muted/5 transition-colors">
                <td class="p-3 border-r border-border font-medium">Hover</td>
                <td class="p-3 border-r border-border text-muted-foreground italic">{$tStore('states.table.hover')}</td>
                <!-- eslint-disable svelte/no-at-html-tags -->
                <td class="p-3 text-muted-foreground">{@html sanitizeHtml($tStore('states.table.hoverTrigger'))}</td>
              </tr>
              <tr class="border-b border-border hover:bg-muted/5 transition-colors">
                <td class="p-3 border-r border-border font-medium">Focus</td>
                <td class="p-3 border-r border-border"><Button size="sm" class="ring-[3px] ring-ring/50 border-ring">{$tStore('demonstration.labels.save')}</Button></td>
                <td class="p-3 text-muted-foreground">{@html sanitizeHtml($tStore('states.table.focusTrigger'))}</td>
              </tr>
              <tr class="border-b border-border hover:bg-muted/5 transition-colors">
                <td class="p-3 border-r border-border font-medium">Disabled</td>
                <td class="p-3 border-r border-border"><Button disabled size="sm">{$tStore('demonstration.labels.save')}</Button></td>
                <td class="p-3 text-muted-foreground">{@html sanitizeHtml($tStore('states.table.disabledTrigger'))}</td>
              </tr>
              <tr class="border-b border-border hover:bg-muted/5 transition-colors">
                <td class="p-3 border-r border-border font-medium">Loading</td>
                <td class="p-3 border-r border-border">
                  <Button disabled size="sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Aguarde…
                  </Button>
                </td>
                <td class="p-3 text-muted-foreground">{@html sanitizeHtml($tStore('states.table.loadingTrigger'))}</td>
              </tr>
              <tr class="hover:bg-muted/5 transition-colors">
                <td class="p-3 border-r border-border font-medium">aria-invalid</td>
                <td class="p-3 border-r border-border"><Button size="sm" aria-invalid="true">{$tStore('demonstration.labels.save')}</Button></td>
                <td class="p-3 text-muted-foreground">{@html sanitizeHtml($tStore('states.table.invalidTrigger'))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="propriedades">
        <h2 class="text-xl font-semibold mb-4">{$tStore('props.title')}</h2>
        <div class="space-y-6">
          <div>
            <h3 class="font-medium text-sm mb-3">{$tStore('props.interface')}</h3>
            <div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed"><code>{`interface $$Props extends HTMLButtonAttributes {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  class?: string
}`}</code></div>
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
                {#each [
                  { name: 'variant',  type: '"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"', def: '"default"', req: 'Não', desc: $tStore('props.table.variant')  },
                  { name: 'size',     type: '"default" | "sm" | "lg" | "icon"',                                        def: '"default"', req: 'Não', desc: $tStore('props.table.size')     },
                  { name: 'disabled', type: 'boolean',                                                                  def: 'false',     req: 'Não', desc: $tStore('props.table.disabled') },
                  { name: 'onclick',  type: '(event: MouseEvent) => void',                                             def: '—',         req: 'Não', desc: $tStore('props.table.onClick')  },
                  { name: 'type',     type: '"button" | "submit" | "reset"',                                           def: '"button"',  req: 'Não', desc: $tStore('props.table.type')     },
                  { name: 'class',    type: 'string',                                                                   def: '—',         req: 'Não', desc: $tStore('props.table.className') },
                ] as prop}
                  <tr class="border-b last:border-0 hover:bg-muted/5">
                    <td class="p-3 border-r border-border font-mono font-bold text-primary">{prop.name}</td>
                    <td class="p-3 border-r border-border font-mono text-muted-foreground">{prop.type}</td>
                    <td class="p-3 border-r border-border font-mono">{prop.def}</td>
                    <td class="p-3 border-r border-border text-muted-foreground">{prop.req}</td>
                    <td class="p-3 text-muted-foreground">{prop.desc}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="space-y-3">
            <h3 class="font-medium text-sm">{$tStore('props.extensibilityTitle')}</h3>
            <div class="space-y-3">
              {#each ['classNameNote', 'asChildNote'] as key}
                <!-- eslint-disable svelte/no-at-html-tags -->
                <p class="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 border">{@html sanitizeHtml($tStore(`props.extensibility.${key}`))}</p>
              {/each}
            </div>
          </div>
        </div>
      </section>

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
                {#each [
                  { token: '--primary',            cls: 'bg-primary',             part: $tStore('tokens.table.primary')            },
                  { token: '--primary-foreground', cls: 'text-primary-foreground', part: $tStore('tokens.table.primaryForeground') },
                  { token: '--secondary',          cls: 'bg-secondary',           part: $tStore('tokens.table.secondary')          },
                  { token: '--destructive',        cls: 'bg-destructive',         part: $tStore('tokens.table.destructive')        },
                  { token: '--border',             cls: 'border-border',          part: $tStore('tokens.table.border')             },
                  { token: '--ring',               cls: 'ring-ring',              part: $tStore('tokens.table.ring')               },
                  { token: '--radius',             cls: 'rounded-md',             part: $tStore('tokens.table.radius')             },
                ] as row}
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
            <div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed"><code>{`/* Em globals.css ou theme-custom.css */
html.meu-tema {
  --primary: 262 80% 58%; /* Roxo — light mode */
  --primary-foreground: 0 0% 100%;
}
html.meu-tema.dark {
  --primary: 262 60% 75%; /* Roxo — dark mode */
  --primary-foreground: 0 0% 100%;
}`}</code></div>
          </div>
        </div>
      </section>

      <section id="acessibilidade">
        <h2 class="text-xl font-semibold mb-4">{$tStore('accessibility.title')}</h2>
        <div class="border rounded-xl p-6 shadow-sm space-y-6">
          <ul class="space-y-3 text-sm text-muted-foreground list-disc pl-5">
            {#each [1, 2, 3, 4, 5] as i}
              <!-- eslint-disable svelte/no-at-html-tags -->
              <li>{@html sanitizeHtml($tStore(`accessibility.item${i}`))}</li>
            {/each}
          </ul>
          <div class="space-y-4">
            <h3 class="font-medium text-sm">{$tStore('accessibility.keyboardTitle')}</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {#each ['tab', 'enter', 'space'] as key}
                <div class="bg-muted/30 border rounded-xl p-4">
                  <code class="text-[10px] bg-muted px-2 py-0.5 rounded-md uppercase font-bold text-primary border border-border/60 block mb-2">{key}</code>
                  <p class="text-xs text-muted-foreground leading-relaxed">{$tStore(`accessibility.keyboard.${key}`)}</p>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </section>

      <section id="relacionados">
        <h2 class="text-xl font-semibold mb-4">{$tStore('related.title')}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {#each [
            { name: 'Toggle',        desc: $tStore('related.toggle'),   path: '?path=/docs/ui-toggle--docs' },
            { name: 'Dropdown Menu', desc: $tStore('related.dropdown'), path: '?path=/docs/ui-dropdownmenu--docs' },
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
      </section>

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
                {#each ['pageView', 'sectionViewed', 'langSwitch', 'click'] as key}
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

      <section id="testes">
        <h2 class="text-xl font-semibold mb-6">{$tStore('testes.title')}</h2>
        <div class="space-y-8">

          <!-- Comportamento Funcional -->
          <div>
            <h3 class="font-semibold text-sm mb-1">
              {$tStore('testes.functional.title')}
            </h3>
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
                        <Badge class={isHigh
                          ? "rounded-md bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/10 font-medium text-[11px]"
                          : "rounded-md bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10 font-medium text-[11px]"}>
                          {isHigh ? $tNavStore('common.high') : $tNavStore('common.medium')}
                        </Badge>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Acessibilidade Verificável -->
          <div>
            <h3 class="font-semibold text-sm mb-1">
              {$tStore('testes.accessibility.title')}
            </h3>
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
            <h3 class="font-semibold text-sm mb-1">
              {$tStore('testes.visual.title')}
            </h3>
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
                        <Badge class={isHigh
                          ? "rounded-md bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/10 font-medium text-[11px]"
                          : "rounded-md bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10 font-medium text-[11px]"}>
                          {isHigh ? $tNavStore('common.high') : $tNavStore('common.medium')}
                        </Badge>
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
