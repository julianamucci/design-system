<script lang="ts">
  import { onDestroy } from 'svelte';
  import Button from '@/components/ui/Button.svelte';
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
      description: t('description'),
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

  let observers: IntersectionObserver[] = [];

  $effect(() => {
    observers.forEach(o => o.disconnect());
    observers = [];
    const ids = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          activeSection = id;
          track('docs_section_viewed', { section_id: id, component_name: 'button', locale: $locale });
        }
      }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
      obs.observe(el);
      observers.push(obs);
    }
    return () => observers.forEach(o => o.disconnect());
  });

  onDestroy(() => observers.forEach(o => o.disconnect()));

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
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
    <div class="flex-1 space-y-12">

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
        <div class="rounded-lg border border-border p-6 bg-card/30">
          <ol class="space-y-3 text-sm list-none p-0 m-0">
            {#each [1, 2, 3] as i}
              <li class="flex gap-3 list-none">
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{i}</span>
                <!-- eslint-disable svelte/no-at-html-tags -->
                <span>{@html sanitizeHtml($tStore(`anatomy.item${i}`))}</span>
              </li>
            {/each}
          </ol>
        </div>
      </section>

      <section id="quando-usar">
        <h2 class="text-xl font-semibold mb-4">{$tStore('usage.title')}</h2>
        <div class="space-y-8">
          <div class="bg-muted/30 border p-4 rounded-lg space-y-3">
            <h4 class="font-medium text-sm">{$tStore('usage.guidelines.title')}</h4>
            <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              {#each [1, 2, 3, 4] as i}
                <!-- eslint-disable svelte/no-at-html-tags -->
                <li>{@html sanitizeHtml($tStore(`usage.guidelines.item${i}`))}</li>
              {/each}
            </ul>
          </div>
          <div class="rounded-lg border border-border p-6 bg-card/30 overflow-x-auto">
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
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-card border rounded-xl p-4 shadow-sm">
              <h4 class="mb-3 text-sm font-semibold text-green-600 flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">✓</span>
                {$tStore('usage.do.title')}
              </h4>
              <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
                {#each [1, 2, 3, 4] as i}<li>{$tStore(`usage.do.item${i}`)}</li>{/each}
              </ul>
            </div>
            <div class="bg-card border rounded-xl p-4 shadow-sm">
              <h4 class="mb-3 text-sm font-semibold text-red-600 flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center">✗</span>
                {$tStore('usage.dont.title')}
              </h4>
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
                <span class="font-bold text-lg">✓</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.do')}</span>
              </div>
              <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10 flex gap-2">
                <Button>{$tStore('demonstration.labels.save')}</Button>
                <Button variant="outline">{$tStore('demonstration.labels.cancel')}</Button>
              </div>
              <p class="text-sm text-muted-foreground italic px-1">{$tStore('doDont.pair1.do')}</p>
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-red-600">
                <span class="font-bold text-lg">✗</span>
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
                <span class="font-bold text-lg">✓</span>
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
                <span class="font-bold text-lg">✗</span>
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
            <pre class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code>{"import Button from '@/components/ui/Button.svelte';"}</code></pre>
          </div>
          <div>
            <p class="text-sm text-muted-foreground mb-3">{$tStore('import.variants')}</p>
            <pre class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code>{"import { buttonVariants } from '@/components/ui/Button.svelte';"}</code></pre>
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
          </div>
          <div class="space-y-3">
            <h3 class="text-sm font-medium">{$tStore('examples.withIcon')}</h3>
            <div class="rounded-lg border border-border p-6 bg-card/30 flex gap-4">
              <Button>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                {$tStore('demonstration.labels.save')}
              </Button>
            </div>
          </div>
          <div class="space-y-3">
            <h3 class="text-sm font-medium">{$tStore('examples.disabled')}</h3>
            <div class="rounded-lg border border-border p-6 bg-card/30">
              <Button disabled>{$tStore('examples.disabled')}</Button>
            </div>
          </div>
        </div>
      </section>

      <section id="variantes">
        <h2 class="text-xl font-semibold mb-6">{$tStore('variants.title')}</h2>
        <div class="space-y-12">
          <div>
            <h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1 border-l-2 border-primary/20 pl-3">
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
                    <p class="text-[10px] uppercase font-mono text-primary font-bold tracking-wider px-1.5 py-0.5 bg-primary/5 rounded-sm inline-block mb-1">{label}</p>
                    <p class="text-xs text-muted-foreground leading-relaxed">{$tStore(`variants.items.${label}`)}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1 border-l-2 border-primary/20 pl-3">
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
                  <div class="p-3 border-t border-border/40 bg-muted/10">
                    <p class="text-[10px] uppercase font-mono text-primary font-bold block mb-1">{label}</p>
                    <p class="text-[11px] text-muted-foreground">{$tStore(`variants.sizes.${label}`)}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </section>

      <section id="estados">
        <h2 class="text-xl font-semibold mb-4">{$tStore('states.title')}</h2>
        <div class="rounded-lg border border-border p-6 bg-card/30 overflow-x-auto">
          <table class="w-full border-collapse text-sm">
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
              <tr class="border-b border-border bg-muted/20 hover:bg-muted/5 transition-colors">
                <td class="p-3 border-r border-border font-medium">Hover</td>
                <td class="p-3 border-r border-border text-muted-foreground text-xs">{$tStore('states.table.hover')}</td>
                <td class="p-3 text-muted-foreground">CSS automático: <code class="bg-muted px-1 rounded text-xs">hover:bg-primary/90</code></td>
              </tr>
              <tr class="hover:bg-muted/5 transition-colors">
                <td class="p-3 border-r border-border font-medium">Disabled</td>
                <td class="p-3 border-r border-border"><Button disabled size="sm">{$tStore('demonstration.labels.save')}</Button></td>
                <td class="p-3 text-muted-foreground">{$tStore('states.table.disabled')}</td>
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
            <pre class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed"><code>{`interface $$Props extends HTMLButtonAttributes {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
  class?: string;
}`}</code></pre>
          </div>
          <div class="border rounded-lg overflow-hidden shadow-sm">
            <table class="w-full border-collapse text-sm">
              <thead class="bg-muted/50 border-b text-left">
                <tr>
                  <th class="p-3 border-r border-border font-semibold">{$tStore('props.table.prop')}</th>
                  <th class="p-3 border-r border-border font-semibold">{$tStore('props.table.type')}</th>
                  <th class="p-3 border-r border-border font-semibold">{$tStore('props.table.default')}</th>
                  <th class="p-3 font-semibold">{$tStore('props.table.description')}</th>
                </tr>
              </thead>
              <tbody>
                {#each [
                  { name: 'variant', type: '"default" | "destructive" | …', def: '"default"', desc: $tStore('props.table.variant') },
                  { name: 'size',    type: '"default" | "sm" | "lg" | "icon"', def: '"default"', desc: $tStore('props.table.size') },
                  { name: 'disabled', type: 'boolean', def: 'false', desc: $tStore('props.table.disabled') },
                  { name: 'class',   type: 'string', def: '—', desc: $tStore('props.table.className') },
                ] as prop}
                  <tr class="border-b last:border-0 hover:bg-muted/5">
                    <td class="p-3 border-r border-border font-mono text-xs font-bold text-primary">{prop.name}</td>
                    <td class="p-3 border-r border-border font-mono text-[10px] text-muted-foreground">{prop.type}</td>
                    <td class="p-3 border-r border-border font-mono text-[10px]">{prop.def}</td>
                    <td class="p-3 text-xs text-muted-foreground">{prop.desc}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="tokens">
        <h2 class="text-xl font-semibold mb-4">{$tStore('tokens.title')}</h2>
        <div class="border rounded-lg overflow-hidden shadow-sm">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="border-b border-border bg-muted/50 text-left">
                <th class="p-3 border-r border-border font-medium">{$tStore('tokens.table.token')}</th>
                <th class="p-3 border-r border-border font-medium">{$tStore('tokens.table.class')}</th>
                <th class="p-3 font-medium">{$tStore('tokens.table.part')}</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border hover:bg-muted/5 transition-colors">
                <td class="p-3 border-r border-border font-mono text-xs text-primary font-medium"><code>--primary</code></td>
                <td class="p-3 border-r border-border font-mono text-xs text-primary"><code>bg-primary</code></td>
                <td class="p-3 text-xs text-muted-foreground">{$tStore('tokens.table.primary')}</td>
              </tr>
              <tr class="hover:bg-muted/5 transition-colors">
                <td class="p-3 border-r border-border font-mono text-xs text-primary font-medium"><code>--radius</code></td>
                <td class="p-3 border-r border-border font-mono text-xs text-primary"><code>rounded-md</code></td>
                <td class="p-3 text-xs text-muted-foreground">{$tStore('tokens.table.radius')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="acessibilidade">
        <h2 class="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
          <span class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">♿</span>
          {$tStore('accessibility.title')}
        </h2>
        <div class="space-y-6">
          <div class="bg-muted/30 border p-6 rounded-xl space-y-4">
            <h4 class="font-semibold text-sm">{$tStore('accessibility.featuresTitle')}</h4>
            <ul class="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0 m-0">
              {#each [1, 2, 3] as i}
                <li class="flex gap-3 text-sm text-muted-foreground bg-card p-3 rounded-lg border border-border/40 list-none">
                  <span class="text-primary font-bold">✓</span>
                  <!-- eslint-disable svelte/no-at-html-tags -->
                  <span>{@html sanitizeHtml($tStore(`accessibility.item${i}`))}</span>
                </li>
              {/each}
            </ul>
          </div>
          <div class="space-y-4">
            <h4 class="font-semibold text-sm flex items-center gap-2">
              <span class="w-5 h-5 rounded-md bg-muted flex items-center justify-center">⌨️</span>
              {$tStore('accessibility.keyboardTitle')}
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {#each ['tab', 'enter', 'space'] as key}
                <div class="bg-card border rounded-xl p-4 shadow-sm hover:border-primary/20 transition-colors">
                  <div class="flex items-center gap-2 mb-2">
                    <code class="text-[10px] bg-muted px-2 py-0.5 rounded-md uppercase font-bold text-primary border border-border/60">{key}</code>
                  </div>
                  <p class="text-xs text-muted-foreground leading-relaxed italic">{$tStore(`accessibility.keyboard.${key}`)}</p>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </section>

      <section id="relacionados">
        <h2 class="text-xl font-semibold mb-4">{$tStore('related.title')}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="border rounded-xl p-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group">
            <h4 class="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">Toggle</h4>
            <p class="text-xs text-muted-foreground">{$tStore('related.toggle')}</p>
          </div>
          <div class="border rounded-xl p-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group">
            <h4 class="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">Dropdown Menu</h4>
            <p class="text-xs text-muted-foreground">{$tStore('related.dropdown')}</p>
          </div>
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
        <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
          <span class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-lg">📊</span>
          {$tStore('analytics.title')}
        </h2>
        <div class="space-y-4">
          <p class="text-sm text-muted-foreground leading-relaxed">{$tStore('analytics.description')}</p>
          <div class="border rounded-xl overflow-hidden shadow-sm">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="bg-muted/50 border-b text-left">
                  <th class="p-4 border-r border-border font-semibold w-1/4">{$tStore('analytics.table.event')}</th>
                  <th class="p-4 border-r border-border font-semibold w-1/4">{$tStore('analytics.table.trigger')}</th>
                  <th class="p-4 font-semibold">{$tStore('analytics.table.payload')}</th>
                </tr>
              </thead>
              <tbody>
                <tr class="hover:bg-muted/5">
                  <td class="p-4 border-r border-border font-mono text-xs text-primary font-bold">{$tStore('analytics.table.click')}</td>
                  <td class="p-4 border-r border-border text-xs">{$tStore('analytics.table.clickTrigger')}</td>
                  <td class="p-4 font-mono text-[11px] text-muted-foreground bg-muted/10 tracking-tight">{$tStore('analytics.table.clickPayload')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="testes">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <span class="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-lg">🧪</span>
          {$tStore('testes.title')}
        </h2>
        <div class="space-y-8">
          <div>
            <h3 class="font-semibold text-sm mb-4 text-muted-foreground flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
              {$tStore('testes.functional')}
            </h3>
            <div class="border rounded-xl overflow-hidden shadow-sm">
              <table class="w-full border-collapse text-sm">
                <thead class="bg-muted/50 border-b text-left">
                  <tr>
                    <th class="p-4 border-r border-border font-semibold">{$tNavStore('common.userAction')}</th>
                    <th class="p-4 border-r border-border font-semibold">{$tNavStore('common.expectedResult')}</th>
                    <th class="p-4 font-semibold w-24">{$tNavStore('common.priority')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="hover:bg-muted/5">
                    <td class="p-4 border-r border-border text-xs font-medium">{$tStore('testes.action')}</td>
                    <td class="p-4 border-r border-border text-xs text-muted-foreground">{$tStore('testes.result')}</td>
                    <td class="p-4">
                      <span class="inline-flex items-center rounded-md border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold text-orange-600 h-5">
                        {$tStore('testes.priority')}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="space-y-4">
            <h3 class="font-semibold text-sm mb-4 text-muted-foreground flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
              {$tStore('testes.accessibility')}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {#each [1, 2, 3, 4] as i}
                <div class="flex gap-3 items-start p-3 bg-muted/10 rounded-lg border border-border/40">
                  <div class="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="text-[10px] text-primary font-bold italic">axe</span>
                  </div>
                  <span class="text-xs text-muted-foreground leading-relaxed">{$tStore(`testes.a11yItem${i}`)}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</div>
