<script lang="ts">
  import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
  } from '@/components/ui/alert-dialog';
  import { Button } from '@/components/ui/button';
  import { Badge } from '@/components/ui/badge';
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import uiTranslations from '@/i18n/ui.json';
  import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(alertDialogTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: `${t('title')} — ${t('category')}`,
      description: t('seo.description'),
      locale: l,
      componentSlug: 'alert-dialog',
    });
    track('docs_page_view', {
      component_name: 'alert-dialog',
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
          track('docs_section_viewed', { section_id: entry.target.id, component_name: 'alert-dialog', locale: $locale });
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

  // ─── Data ─────────────────────────────────────────────────────────────────────

  const TOKEN_ROWS = [
    { token: '--background',       cls: 'bg-background',         key: 'background'       },
    { token: '--border',           cls: 'border-border',         key: 'border'           },
    { token: '--foreground',       cls: 'text-foreground',       key: 'foreground'       },
    { token: '--muted-foreground', cls: 'text-muted-foreground', key: 'mutedForeground'  },
    { token: '--primary',          cls: 'bg-primary',            key: 'primary'          },
    { token: '--destructive',      cls: 'bg-destructive',        key: 'destructive'      },
    { token: '--radius',           cls: 'rounded-lg',            key: 'radius'           },
    { token: '--ring',             cls: 'ring-ring',             key: 'ring'             },
  ];

  const PROP_ROWS = [
    { name: 'open',         type: 'boolean',                 def: 'undefined', req: 'Não', key: 'open'         },
    { name: 'defaultOpen',  type: 'boolean',                 def: 'false',     req: 'Não', key: 'defaultOpen'  },
    { name: 'onOpenChange', type: '(open: boolean) => void', def: '—',         req: 'Não', key: 'onOpenChange' },
    { name: 'asChild',      type: 'boolean',                 def: 'false',     req: 'Não', key: 'asChild'      },
    { name: 'class',        type: 'string',                  def: '—',         req: 'Não', key: 'className'    },
  ];

  const RELATED_ITEMS = [
    { name: 'Dialog',  key: 'dialog', path: '?path=/docs/ui-dialog--docs'  },
    { name: 'Drawer',  key: 'drawer', path: '?path=/docs/ui-drawer--docs'  },
    { name: 'Sonner',  key: 'sonner', path: '?path=/docs/ui-sonner--docs'  },
    { name: 'Button',  key: 'button', path: '?path=/docs/ui-button--docs'  },
  ];

  const KEYBOARD_KEYS = [
    { key: 'Tab',    tkey: 'tab'    },
    { key: 'Enter',  tkey: 'enter'  },
    { key: 'Space',  tkey: 'space'  },
    { key: 'Escape', tkey: 'escape' },
  ];

  const ARIA_KEYS = [
    { attr: 'role="alertdialog"', tkey: 'role'        },
    { attr: 'aria-labelledby',    tkey: 'labelledby'  },
    { attr: 'aria-describedby',   tkey: 'describedby' },
    { attr: 'aria-modal="true"',  tkey: 'modal'       },
  ];

  const ANALYTICS_ROWS = [
    { event: 'pageView',      trigger: 'pageViewTrigger',      payload: 'pageViewPayload'      },
    { event: 'sectionViewed', trigger: 'sectionViewedTrigger', payload: 'sectionViewedPayload' },
    { event: 'langSwitch',    trigger: 'langSwitchTrigger',    payload: 'langSwitchPayload'    },
    { event: 'open',          trigger: 'openTrigger',          payload: 'openPayload'          },
    { event: 'confirm',       trigger: 'confirmTrigger',       payload: 'confirmPayload'       },
    { event: 'cancel',        trigger: 'cancelTrigger',        payload: 'cancelPayload'        },
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
      <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border/50">
        {$tStore('installation')}
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

      <!-- Demonstração -->
      <section id="demonstracao">
        <h2 class="text-xl font-semibold mb-4">{$tStore('demonstration.title')}</h2>
        <div class="rounded-lg border border-border p-6 bg-card/30">
          <div class="flex flex-wrap gap-4 justify-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">{$tStore('demonstration.labels.trigger')}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{$tStore('demonstration.labels.title')}</AlertDialogTitle>
                  <AlertDialogDescription>{$tStore('demonstration.labels.description')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{$tStore('demonstration.labels.cancel')}</AlertDialogCancel>
                  <AlertDialogAction>{$tStore('demonstration.labels.confirm')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button>{$tStore('demonstration.labels.triggerNeutral')}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{$tStore('demonstration.labels.titleNeutral')}</AlertDialogTitle>
                  <AlertDialogDescription>{$tStore('demonstration.labels.descriptionNeutral')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{$tStore('demonstration.labels.cancel')}</AlertDialogCancel>
                  <AlertDialogAction>{$tStore('demonstration.labels.confirmNeutral')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </section>

      <!-- Anatomia -->
      <section id="anatomia">
        <h2 class="text-xl font-semibold mb-4">{$tStore('anatomy.title')}</h2>
        <ol class="space-y-2 mb-6 list-none p-0 m-0">
          {#each [1,2,3,4,5,6,7,8,9] as i}
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
                {#each [1,2,3,4,5] as i}
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
            <h3 class="font-medium text-sm mb-3">{$tStore('uxWriting.title')}</h3>
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-border bg-muted/70 text-left">
                  <th class="p-3 border-r border-border font-semibold">{$tStore('uxWriting.table.element')}</th>
                  <th class="p-3 border-r border-border font-semibold">{$tStore('uxWriting.table.rules')}</th>
                  <th class="p-3 border-r border-border font-semibold text-green-700 dark:text-green-400">{$tStore('uxWriting.table.correct')}</th>
                  <th class="p-3 font-semibold text-red-700 dark:text-red-400">{$tStore('uxWriting.table.avoid')}</th>
                </tr>
              </thead>
              <tbody>
                {#each ['title', 'description', 'action'] as key}
                  <tr class="border-b border-border last:border-0">
                    <td class="p-3 border-r border-border font-medium">{$tStore(`uxWriting.table.${key}.name`)}</td>
                    <td class="p-3 border-r border-border text-muted-foreground">{$tStore(`uxWriting.table.${key}.format`)}</td>
                    <td class="p-3 border-r border-border text-green-600 dark:text-green-500">{$tStore(`uxWriting.table.${key}.good`)}</td>
                    <td class="p-3 text-red-600 dark:text-red-500">{$tStore(`uxWriting.table.${key}.bad`)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-card border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 shadow-sm">
              <h3 class="font-medium text-sm text-emerald-700 dark:text-emerald-400 mb-2">{$tStore('usage.do.title')}</h3>
              <ul class="space-y-2 list-none p-0 m-0">
                {#each [1,2,3] as i}
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
          <!-- Pair 1: Botões -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-green-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.do')}</span>
              </div>
              <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10 flex gap-2 justify-end">
                <Button variant="outline" size="sm">{$tStore('demonstration.labels.cancel')}</Button>
                <Button variant="destructive" size="sm">{$tStore('demonstration.labels.confirm')}</Button>
              </div>
              <p class="text-sm text-muted-foreground italic px-1">{$tStore('doDont.pair1.do')}</p>
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-red-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.dont')}</span>
              </div>
              <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10 flex gap-2 justify-end">
                <Button size="sm">OK</Button>
              </div>
              <p class="text-sm text-muted-foreground italic px-1">{$tStore('doDont.pair1.dont')}</p>
            </div>
          </div>

          <!-- Pair 2: Textos -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-green-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.do')}</span>
              </div>
              <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10 space-y-1">
                <p class="text-sm font-semibold">{$tStore('demonstration.labels.title')}</p>
                <p class="text-xs text-muted-foreground">{$tStore('demonstration.labels.description')}</p>
              </div>
              <p class="text-sm text-muted-foreground italic px-1">{$tStore('doDont.pair2.do')}</p>
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-red-600">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.dont')}</span>
              </div>
              <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10 space-y-1">
                <p class="text-sm font-semibold">Tem certeza?</p>
                <p class="text-xs text-muted-foreground">Isso vai apagar TUDO!</p>
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
          <code class="whitespace-pre">import &#123;
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
&#125; from '@/components/ui/alert-dialog';</code>
        </div>
      </section>

      <!-- Exemplos -->
      <section id="exemplos">
        <h2 class="text-xl font-semibold mb-4">{$tStore('examples.title')}</h2>

        <div class="mb-8">
          <h3 class="text-base font-medium mb-3">{$tStore('examples.basic')}</h3>
          <div class="flex justify-center p-6 border rounded-t-lg bg-muted/20">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">{$tStore('demonstration.labels.triggerDestructive')}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{$tStore('demonstration.labels.titleDestructive')}</AlertDialogTitle>
                  <AlertDialogDescription>{$tStore('demonstration.labels.descriptionDestructive')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{$tStore('demonstration.labels.cancel')}</AlertDialogCancel>
                  <AlertDialogAction>{$tStore('demonstration.labels.confirm')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div class="bg-muted p-4 rounded-b-lg font-mono text-sm border border-t-0 overflow-x-auto">
            <code class="whitespace-pre">&lt;AlertDialog&gt;
  &lt;AlertDialogTrigger asChild&gt;
    &lt;Button variant="destructive"&gt;Excluir item&lt;/Button&gt;
  &lt;/AlertDialogTrigger&gt;
  &lt;AlertDialogContent&gt;
    &lt;AlertDialogHeader&gt;
      &lt;AlertDialogTitle&gt;Excluir item selecionado&lt;/AlertDialogTitle&gt;
      &lt;AlertDialogDescription&gt;O item será removido permanentemente.&lt;/AlertDialogDescription&gt;
    &lt;/AlertDialogHeader&gt;
    &lt;AlertDialogFooter&gt;
      &lt;AlertDialogCancel&gt;Cancelar&lt;/AlertDialogCancel&gt;
      &lt;AlertDialogAction&gt;Excluir&lt;/AlertDialogAction&gt;
    &lt;/AlertDialogFooter&gt;
  &lt;/AlertDialogContent&gt;
&lt;/AlertDialog&gt;</code>
          </div>
        </div>
      </section>

      <!-- Variantes -->
      <section id="variantes">
        <h2 class="text-xl font-semibold mb-4">{$tStore('variants.title')}</h2>
        <p class="text-sm text-muted-foreground mb-4">{$tStore('variants.visualTitle')}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {#each ['destructive', 'neutral'] as key}
            <div class="rounded-lg border border-border p-4 bg-muted/20 space-y-3">
              <p class="text-xs font-mono font-medium text-muted-foreground">{key}</p>
              <p class="text-sm text-muted-foreground">{$tStore(`variants.items.${key}`)}</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant={key === 'destructive' ? 'destructive' : 'default'} size="sm">
                    {key === 'destructive' ? $tStore('demonstration.labels.triggerDestructive') : $tStore('demonstration.labels.triggerNeutral')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {key === 'destructive' ? $tStore('demonstration.labels.titleDestructive') : $tStore('demonstration.labels.titleNeutral')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {key === 'destructive' ? $tStore('demonstration.labels.descriptionDestructive') : $tStore('demonstration.labels.descriptionNeutral')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{$tStore('demonstration.labels.cancel')}</AlertDialogCancel>
                    <AlertDialogAction>
                      {key === 'destructive' ? $tStore('demonstration.labels.confirm') : $tStore('demonstration.labels.confirmNeutral')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          {/each}
        </div>
      </section>

      <!-- Estados -->
      <section id="estados">
        <h2 class="text-xl font-semibold mb-4">{$tStore('states.title')}</h2>
        <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left p-3 text-muted-foreground font-medium">{$tStore('states.table.state')}</th>
                <th class="text-left p-3 text-muted-foreground font-medium">{$tStore('states.table.visual')}</th>
                <th class="text-left p-3 text-muted-foreground font-medium">{$tStore('states.table.trigger')}</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border/50">
                <td class="p-3 border-r border-border font-medium">Fechado</td>
                <td class="p-3 border-r border-border text-muted-foreground">{$tStore('states.closed')}</td>
                <td class="p-3 text-muted-foreground">{$tStore('states.closedTrigger')}</td>
              </tr>
              <tr>
                <td class="p-3 border-r border-border font-medium">Aberto</td>
                <td class="p-3 border-r border-border text-muted-foreground">{$tStore('states.open')}</td>
                <td class="p-3 text-muted-foreground">{$tStore('states.openTrigger')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Propriedades -->
      <section id="propriedades">
        <h2 class="text-xl font-semibold mb-4">{$tStore('props.title')}</h2>
        <h3 class="text-base font-medium mb-3">{$tStore('props.interface')}</h3>
        <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-6">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left p-3 text-muted-foreground font-medium">{$tStore('props.table.prop')}</th>
                <th class="text-left p-3 text-muted-foreground font-medium">{$tStore('props.table.type')}</th>
                <th class="text-left p-3 text-muted-foreground font-medium">{$tStore('props.table.default')}</th>
                <th class="text-left p-3 text-muted-foreground font-medium">{$tStore('props.table.required')}</th>
                <th class="text-left p-3 text-muted-foreground font-medium">{$tStore('props.table.description')}</th>
              </tr>
            </thead>
            <tbody>
              {#each PROP_ROWS as row}
                <tr class="border-b border-border/50 last:border-0">
                  <td class="p-3 font-mono text-xs">{row.name}</td>
                  <td class="p-3 font-mono text-xs text-muted-foreground">{row.type}</td>
                  <td class="p-3 font-mono text-xs text-muted-foreground">{row.def}</td>
                  <td class="p-3 text-muted-foreground">{row.req}</td>
                  <!-- eslint-disable svelte/no-at-html-tags -->
                  <td class="p-3 text-muted-foreground">{$tStore(`props.rows.${row.key}`)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <h3 class="text-base font-medium mb-3">{$tStore('props.extensibilityTitle')}</h3>
        <div class="space-y-2">
          <!-- eslint-disable svelte/no-at-html-tags -->
          <p class="text-sm text-muted-foreground">{@html sanitizeHtml($tStore('props.extensibility.classNameNote'))}</p>
          <p class="text-sm text-muted-foreground">{@html sanitizeHtml($tStore('props.extensibility.asChildNote'))}</p>
        </div>
      </section>

      <!-- Tokens -->
      <section id="tokens">
        <h2 class="text-xl font-semibold mb-4">{$tStore('tokens.title')}</h2>
        <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-6">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left p-3 text-muted-foreground font-medium">{$tStore('tokens.table.token')}</th>
                <th class="text-left p-3 text-muted-foreground font-medium">{$tStore('tokens.table.class')}</th>
                <th class="text-left p-3 text-muted-foreground font-medium">{$tStore('tokens.table.part')}</th>
              </tr>
            </thead>
            <tbody>
              {#each TOKEN_ROWS as row}
                <tr class="border-b border-border/50 last:border-0">
                  <td class="p-3 font-mono text-xs">{row.token}</td>
                  <td class="p-3 font-mono text-xs text-muted-foreground">{row.cls}</td>
                  <td class="p-3 text-muted-foreground">{$tStore(`tokens.rows.${row.key}`)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <h3 class="text-base font-medium mb-3">{$tStore('tokens.customizationTitle')}</h3>
        <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
          <code class="whitespace-pre">/* Override no seu CSS */
[data-slot="alert-dialog-content"] &#123;
  --radius: 1rem;
  --background: hsl(var(--popover));
&#125;</code>
        </div>
      </section>

      <!-- Acessibilidade -->
      <section id="acessibilidade">
        <h2 class="text-xl font-semibold mb-4">{$tStore('accessibility.title')}</h2>
        <!-- eslint-disable svelte/no-at-html-tags -->
        <p class="text-sm text-muted-foreground mb-4">{@html sanitizeHtml($tStore('accessibility.summary'))}</p>
        <ul class="space-y-2 mb-8 list-none p-0 m-0">
          {#each [1,2,3,4,5] as i}
            <li class="flex gap-2 items-start list-none">
              <span class="text-primary font-bold mt-0.5">→</span>
              <!-- eslint-disable svelte/no-at-html-tags -->
              <span class="text-sm text-muted-foreground">{@html sanitizeHtml($tStore(`accessibility.item${i}`))}</span>
            </li>
          {/each}
        </ul>
        <h3 class="text-base font-medium mb-3">{$tStore('accessibility.keyboardTitle')}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {#each KEYBOARD_KEYS as kb}
            <div class="flex items-start gap-3 rounded-lg border border-border p-3 bg-muted/20">
              <kbd class="flex-shrink-0 px-2 py-0.5 rounded border border-border bg-background font-mono text-xs font-semibold">{kb.key}</kbd>
              <span class="text-sm text-muted-foreground">{$tStore(`accessibility.keyboard.${kb.tkey}`)}</span>
            </div>
          {/each}
        </div>
        <h3 class="text-base font-medium mb-3">{$tStore('accessibility.ariaTitle')}</h3>
        <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left p-3 text-muted-foreground font-medium">Atributo</th>
                <th class="text-left p-3 text-muted-foreground font-medium">Descrição</th>
              </tr>
            </thead>
            <tbody>
              {#each ARIA_KEYS as row}
                <tr class="border-b border-border/50 last:border-0">
                  <!-- eslint-disable svelte/no-at-html-tags -->
                  <td class="p-3 font-mono text-xs">{row.attr}</td>
                  <td class="p-3 text-muted-foreground">{@html sanitizeHtml($tStore(`accessibility.aria.${row.tkey}`))}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Relacionados -->
      <section id="relacionados">
        <h2 class="text-xl font-semibold mb-4">{$tStore('related.title')}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {#each RELATED_ITEMS as item}
            <button
              type="button"
              class="text-left rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
              onclick={() => { (window.top ?? window).location.href = item.path; }}
            >
              <p class="font-medium text-sm mb-1">{item.name}</p>
              <p class="text-xs text-muted-foreground">{$tStore(`related.${item.key}`)}</p>
            </button>
          {/each}
        </div>
      </section>

      <!-- Notas -->
      <section id="notas">
        <h2 class="text-xl font-semibold mb-4">{$tStore('notes.title')}</h2>
        <div class="space-y-3">
          {#each ['tip1', 'tip2'] as key}
            <div class="rounded-lg border border-border bg-muted/20 p-4">
              <!-- eslint-disable svelte/no-at-html-tags -->
              <p class="text-sm text-muted-foreground">{@html sanitizeHtml($tStore(`notes.${key}`))}</p>
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
              <tr class="border-b border-border">
                <th class="text-left p-3 text-muted-foreground font-medium">{$tStore('analytics.table.event')}</th>
                <th class="text-left p-3 text-muted-foreground font-medium">{$tStore('analytics.table.trigger')}</th>
                <th class="text-left p-3 text-muted-foreground font-medium">{$tStore('analytics.table.payload')}</th>
              </tr>
            </thead>
            <tbody>
              {#each ANALYTICS_ROWS as row}
                <tr class="border-b border-border/50 last:border-0">
                  <td class="p-3 font-mono text-xs">{$tStore(`analytics.table.${row.event}`)}</td>
                  <td class="p-3 text-muted-foreground">{$tStore(`analytics.table.${row.trigger}`)}</td>
                  <td class="p-3 font-mono text-xs text-muted-foreground">{$tStore(`analytics.table.${row.payload}`)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Testes -->
      <section id="testes">
        <h2 class="text-xl font-semibold mb-4">{$tStore('testes.title')}</h2>

        <h3 class="text-base font-medium mb-3">{$tStore('testes.functional.title')}</h3>
        <p class="text-sm text-muted-foreground mb-4">{$tStore('testes.functional.description')}</p>
        <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-8">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left p-3 text-muted-foreground font-medium">Ação</th>
                <th class="text-left p-3 text-muted-foreground font-medium">Resultado esperado</th>
                <th class="text-left p-3 text-muted-foreground font-medium">Prioridade</th>
              </tr>
            </thead>
            <tbody>
              {#each [1,2,3,4,5,6] as i}
                <tr class="border-b border-border/50 last:border-0">
                  <td class="p-3">{$tStore(`testes.functional.item${i}.action`)}</td>
                  <td class="p-3 text-muted-foreground">{$tStore(`testes.functional.item${i}.result`)}</td>
                  <td class="p-3">
                    <span class={$tStore(`testes.functional.item${i}.priority`) === 'high' ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                      {$tStore(`testes.functional.item${i}.priority`)}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <h3 class="text-base font-medium mb-3">{$tStore('testes.accessibility.title')}</h3>
        <p class="text-sm text-muted-foreground mb-4">{$tStore('testes.accessibility.description')}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {#each [1,2,3,4,5,6] as i}
            <div class="rounded-lg border border-border p-3 bg-muted/20 flex gap-2 items-start">
              <span class="text-emerald-500 font-bold mt-0.5">✓</span>
              <span class="text-sm text-muted-foreground">{$tStore(`testes.accessibility.item${i}`)}</span>
            </div>
          {/each}
        </div>

        <h3 class="text-base font-medium mb-3">{$tStore('testes.visual.title')}</h3>
        <p class="text-sm text-muted-foreground mb-4">{$tStore('testes.visual.description')}</p>
        <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left p-3 text-muted-foreground font-medium">Story</th>
                <th class="text-left p-3 text-muted-foreground font-medium">{$tStore('testes.visual.required')}</th>
              </tr>
            </thead>
            <tbody>
              {#each [1,2,3,4,5] as i}
                <tr class="border-b border-border/50 last:border-0">
                  <td class="p-3">{$tStore(`testes.visual.item${i}.story`)}</td>
                  <td class="p-3">
                    <span class={$tStore(`testes.visual.item${i}.priority`) === 'high' ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                      {$tStore(`testes.visual.item${i}.priority`)}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>

    </div><!-- /main content -->
  </div><!-- /flex layout -->
</div><!-- /ds-docs -->
