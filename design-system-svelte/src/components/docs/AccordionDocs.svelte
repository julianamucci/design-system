<script lang="ts">
  import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
  import { Badge } from '@/components/ui/badge';
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import uiTranslations from '@/i18n/ui.json';
  import accordionTranslations from '@shared/content/accordion/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(accordionTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: `${t('title')} — ${t('category')}`,
      description: t('seo.description'),
      locale: l,
      componentSlug: 'accordion',
    });
    track('docs_page_view', {
      component_name: 'accordion',
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
          track('docs_section_viewed', { section_id: entry.target.id, component_name: 'accordion', locale: $locale });
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

  const modeKeys = ['single', 'multiple', 'controlled'] as const;
  const keyboardKeys = ['tab', 'shiftTab', 'enter', 'space'] as const;
  const keyboardLabels: Record<string, string> = { tab: 'Tab', shiftTab: 'Shift+Tab', enter: 'Enter', space: 'Space' };
  const relatedKeys = [1, 2, 3] as const;
  const noteKeys = [1, 2, 3] as const;
  const analyticsEventKeys = ['toggle', 'pageView', 'sectionViewed', 'langSwitch'] as const;

  const rootProps = [
    { name: 'type',          type: '"single" | "multiple"',             def: '—',       req: 'Sim', descKey: 'type_prop'     },
    { name: 'collapsible',   type: 'boolean',                            def: 'false',   req: 'Não', descKey: 'collapsible'   },
    { name: 'value',         type: 'string | string[]',                  def: '—',       req: 'Não', descKey: 'value'         },
    { name: 'defaultValue',  type: 'string | string[]',                  def: '—',       req: 'Não', descKey: 'defaultValue'  },
    { name: 'onValueChange', type: '(value: string | string[]) => void', def: '—',       req: 'Não', descKey: 'onValueChange' },
    { name: 'className',     type: 'string',                             def: '—',       req: 'Não', descKey: 'className'     },
  ];

  const tokenRows = [
    { token: '--border',          cls: 'border-border',         descKey: 'border'          },
    { token: '--foreground',       cls: 'text-foreground',       descKey: 'foreground'      },
    { token: '--muted-foreground', cls: 'text-muted-foreground', descKey: 'mutedForeground' },
    { token: '--ring',             cls: 'ring-ring',             descKey: 'ring'            },
    { token: '--radius',           cls: 'rounded-md',            descKey: 'radius'          },
  ];
  const testFunctionalKeys = [1, 2, 3, 4, 5, 6] as const;
  const testA11yKeys = [1, 2, 3, 4, 5, 6] as const;
  const testVisualKeys = [1, 2, 3, 4, 5, 6] as const;
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
        npx shadcn@latest add accordion
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
          <Accordion type="single" collapsible={true} class="w-full max-w-lg">
            <AccordionItem value="demo-1">
              <AccordionTrigger>{$tStore('demonstration.labels.trigger1')}</AccordionTrigger>
              <AccordionContent>{$tStore('demonstration.labels.content1')}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="demo-2">
              <AccordionTrigger>{$tStore('demonstration.labels.trigger2')}</AccordionTrigger>
              <AccordionContent>{$tStore('demonstration.labels.content2')}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="demo-3">
              <AccordionTrigger>{$tStore('demonstration.labels.trigger3')}</AccordionTrigger>
              <AccordionContent>{$tStore('demonstration.labels.content3')}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <!-- Anatomia -->
      <section id="anatomia">
        <h2 class="text-xl font-semibold mb-4">{$tStore('anatomy.title')}</h2>
        <div class="rounded-lg border border-border p-6 bg-card/30 space-y-4">
          <ol class="space-y-3 text-sm list-none p-0 m-0">
            {#each [1, 2, 3, 4] as i}
              <li class="flex gap-3 list-none">
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{i}</span>
                <!-- eslint-disable svelte/no-at-html-tags -->
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

      <!-- Quando Usar -->
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
                {#each [1, 2, 3, 4] as i}
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
                  {#each ['trigger', 'content'] as key}
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
                {#each [1, 2, 3, 4] as i}
                  <!-- eslint-disable svelte/no-at-html-tags -->
                  <li>{@html sanitizeHtml($tStore(`usage.dont.item${i}`))}</li>
                {/each}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Do & Don't -->
      <section id="do-dont">
        <h2 class="text-xl font-semibold mb-4">{$tStore('doDont.title')}</h2>
        <div class="rounded-lg border border-border p-6 bg-card/30 space-y-8">
          {#each [1, 2] as pair}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-green-600">
                  <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                  <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.do')}</span>
                </div>
                <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-4 bg-green-50/50 dark:bg-green-950/10">
                  {#if pair === 1}
                    <Accordion type="single" collapsible={true} class="w-full">
                      <AccordionItem value="d1">
                        <AccordionTrigger>{$tStore('demonstration.labels.trigger1')}</AccordionTrigger>
                        <AccordionContent>{$tStore('demonstration.labels.content1')}</AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  {:else}
                    <Accordion type="multiple" class="w-full">
                      <AccordionItem value="d1">
                        <AccordionTrigger>{$tStore('demonstration.labels.trigger1')}</AccordionTrigger>
                        <AccordionContent>{$tStore('demonstration.labels.content1')}</AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="d2">
                        <AccordionTrigger>{$tStore('demonstration.labels.trigger2')}</AccordionTrigger>
                        <AccordionContent>{$tStore('demonstration.labels.content2')}</AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  {/if}
                </div>
                <!-- eslint-disable svelte/no-at-html-tags -->
                <p class="text-sm text-muted-foreground italic px-1">{@html sanitizeHtml($tStore(`doDont.pair${pair}.do`))}</p>
              </div>
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-red-600">
                  <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                  <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.dont')}</span>
                </div>
                <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-4 bg-red-50/50 dark:bg-red-950/10 min-h-20 flex items-center">
                  <p class="text-sm text-muted-foreground">{@html sanitizeHtml($tStore(`doDont.pair${pair}.dontExample`))}</p>
                </div>
                <p class="text-sm text-muted-foreground italic px-1">{@html sanitizeHtml($tStore(`doDont.pair${pair}.dont`))}</p>
              </div>
            </div>
          {/each}
        </div>
      </section>

      <!-- Importação -->
      <section id="importacao">
        <h2 class="text-xl font-semibold mb-4">{$tStore('import.title')}</h2>
        <div class="rounded-lg border border-border p-6 bg-card/30 space-y-4">
          <div>
            <p class="text-sm text-muted-foreground mb-3">{$tStore('import.basic')}</p>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">{`import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';`}</code></div>
          </div>
        </div>
      </section>

      <!-- Exemplos -->
      <section id="exemplos">
        <h2 class="text-xl font-semibold mb-4">{$tStore('examples.title')}</h2>
        <div class="space-y-8">
          <div class="space-y-3">
            <h3 class="text-sm font-medium">{$tStore('examples.basic')}</h3>
            <div class="rounded-lg border border-border p-6 bg-card/30">
              <Accordion type="single" collapsible={true} class="w-full max-w-md">
                <AccordionItem value="ex-1">
                  <AccordionTrigger>{$tStore('demonstration.labels.trigger1')}</AccordionTrigger>
                  <AccordionContent>{$tStore('demonstration.labels.content1')}</AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">{`<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Título da seção</AccordionTrigger>
    <AccordionContent>Conteúdo da seção.</AccordionContent>
  </AccordionItem>
</Accordion>`}</code></div>
          </div>
          <div class="space-y-3">
            <h3 class="text-sm font-medium">{$tStore('examples.multiple')}</h3>
            <div class="rounded-lg border border-border p-6 bg-card/30">
              <Accordion type="multiple" class="w-full max-w-md">
                <AccordionItem value="ex-m1">
                  <AccordionTrigger>{$tStore('demonstration.labels.trigger1')}</AccordionTrigger>
                  <AccordionContent>{$tStore('demonstration.labels.content1')}</AccordionContent>
                </AccordionItem>
                <AccordionItem value="ex-m2">
                  <AccordionTrigger>{$tStore('demonstration.labels.trigger2')}</AccordionTrigger>
                  <AccordionContent>{$tStore('demonstration.labels.content2')}</AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">{`<Accordion type="multiple">
  <AccordionItem value="item-1">...</AccordionItem>
  <AccordionItem value="item-2">...</AccordionItem>
</Accordion>`}</code></div>
          </div>
        </div>
      </section>

      <!-- Variantes (Modos) -->
      <section id="variantes">
        <h2 class="text-xl font-semibold mb-4">{$tStore('variants.title')}</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {#each modeKeys as key}
            <div class="rounded-lg border border-border p-4 bg-card/30 space-y-2">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                  {$tStore(`variants.${key}.label`)}
                </span>
              </div>
              <p class="text-sm text-muted-foreground">{$tStore(`variants.${key}.description`)}</p>
              <p class="text-xs text-muted-foreground/70">{$tStore(`variants.${key}.use`)}</p>
            </div>
          {/each}
        </div>
      </section>

      <!-- Estados -->
      <section id="estados">
        <h2 class="text-xl font-semibold mb-4">{$tStore('states.title')}</h2>
        <div class="rounded-lg border border-border p-6 bg-card/30">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-border bg-muted/50 text-left">
                  <th class="p-3 border-r border-border font-semibold">{$tStore('states.cols.state')}</th>
                  <th class="p-3 border-r border-border font-semibold">{$tStore('states.cols.trigger')}</th>
                  <th class="p-3 font-semibold">{$tStore('states.cols.behavior')}</th>
                </tr>
              </thead>
              <tbody>
                {#each ['closed', 'open', 'disabled', 'defaultOpen'] as key}
                  <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                    <td class="p-3 border-r border-border font-medium">{$tStore(`states.${key}.label`)}</td>
                    <td class="p-3 border-r border-border text-muted-foreground">{$tStore(`states.${key}.trigger`)}</td>
                    <td class="p-3 text-muted-foreground">{$tStore(`states.${key}.behavior`)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Propriedades -->
      <section id="propriedades">
        <h2 class="text-xl font-semibold mb-4">{$tStore('props.title')}</h2>
        <div class="space-y-6">
          <div>
            <h3 class="text-sm font-semibold mb-3">{$tStore('props.rootTitle')}</h3>
            <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
              <table class="w-full border-collapse text-sm">
                  <thead>
                    <tr class="border-b border-border bg-muted/50 text-left">
                      <th class="p-3 border-r border-border font-semibold">{$tStore('props.cols.prop')}</th>
                      <th class="p-3 border-r border-border font-semibold">{$tStore('props.cols.type')}</th>
                      <th class="p-3 border-r border-border font-semibold">{$tStore('props.cols.default')}</th>
                      <th class="p-3 font-semibold">{$tStore('props.cols.description')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each rootProps as prop}
                      <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                        <td class="p-3 border-r border-border font-mono text-xs text-primary">{prop.name}</td>
                        <td class="p-3 border-r border-border font-mono text-xs text-muted-foreground">{prop.type}</td>
                        <td class="p-3 border-r border-border font-mono text-xs text-muted-foreground">{prop.def}</td>
                        <!-- eslint-disable svelte/no-at-html-tags -->
                        <td class="p-3 text-muted-foreground">{@html sanitizeHtml($tStore(`props.table.${prop.descKey}`))}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
            </div>
          </div>
          <div>
            <h3 class="text-sm font-semibold mb-3">{$tStore('props.itemTitle')}</h3>
            <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
              <table class="w-full border-collapse text-sm">
                  <thead>
                    <tr class="border-b border-border bg-muted/50 text-left">
                      <th class="p-3 border-r border-border font-semibold">{$tStore('props.cols.prop')}</th>
                      <th class="p-3 border-r border-border font-semibold">{$tStore('props.cols.type')}</th>
                      <th class="p-3 border-r border-border font-semibold">{$tStore('props.cols.default')}</th>
                      <th class="p-3 font-semibold">{$tStore('props.cols.description')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each ([
                      { name: 'value',    type: 'string',  def: '—',     descKey: 'value'    },
                      { name: 'disabled', type: 'boolean', def: 'false', descKey: 'disabled' },
                      { name: 'className',type: 'string',  def: '—',     descKey: 'className'},
                    ]) as prop}
                      <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                        <td class="p-3 border-r border-border font-mono text-xs text-primary">{prop.name}</td>
                        <td class="p-3 border-r border-border font-mono text-xs text-muted-foreground">{prop.type}</td>
                        <td class="p-3 border-r border-border font-mono text-xs text-muted-foreground">{prop.def}</td>
                        <!-- eslint-disable svelte/no-at-html-tags -->
                        <td class="p-3 text-muted-foreground">{@html sanitizeHtml($tStore(`props.table.${prop.descKey}`))}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
            </div>
          </div>
        </div>
      </section>

      <!-- Tokens -->
      <section id="tokens">
        <h2 class="text-xl font-semibold mb-4">{$tStore('tokens.title')}</h2>
        <div class="rounded-lg border border-border p-6 bg-card/30 space-y-6">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-border bg-muted/50 text-left">
                  <th class="p-3 border-r border-border font-semibold">{$tStore('tokens.cols.token')}</th>
                  <th class="p-3 border-r border-border font-semibold">{$tStore('tokens.cols.description')}</th>
                  <th class="p-3 font-semibold">{$tStore('tokens.cols.usage')}</th>
                </tr>
              </thead>
              <tbody>
                {#each tokenRows as row}
                  <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                    <td class="p-3 border-r border-border font-mono text-xs text-primary">{row.token}</td>
                    <td class="p-3 border-r border-border text-muted-foreground">{$tStore(`tokens.table.${row.descKey}`)}</td>
                    <td class="p-3 text-muted-foreground font-mono text-xs">{row.cls}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div>
            <p class="text-sm text-muted-foreground mb-3">{$tStore('tokens.customization')}</p>
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
              <code class="whitespace-pre">{`.accordion-custom {
  --border: theme(colors.violet.300);
  --radius: 0.75rem;
}`}</code>
            </div>
          </div>
        </div>
      </section>

      <!-- Acessibilidade -->
      <section id="acessibilidade">
        <h2 class="text-xl font-semibold mb-4">{$tStore('accessibility.title')}</h2>
        <div class="rounded-lg border border-border p-6 bg-card/30 space-y-6">
          <div>
            <h3 class="text-sm font-semibold mb-3">{$tStore('accessibility.summary')}</h3>
            <ul class="space-y-2 text-sm text-muted-foreground list-none p-0 m-0">
              {#each [1, 2, 3, 4, 5] as i}
                <li class="flex gap-2 items-start list-none">
                  <span class="text-primary mt-0.5 flex-shrink-0">•</span>
                  <!-- eslint-disable svelte/no-at-html-tags -->
                  <span>{@html sanitizeHtml($tStore(`accessibility.item${i}`))}</span>
                </li>
              {/each}
            </ul>
          </div>
          <div>
            <h3 class="text-sm font-semibold mb-3">{$tStore('accessibility.keyboardTitle')}</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              {#each keyboardKeys as key}
                <div class="rounded-lg border border-border p-3 bg-card/50 space-y-1">
                  <kbd class="inline-flex items-center rounded border border-border bg-muted px-2 py-0.5 text-xs font-mono font-semibold">
                    {keyboardLabels[key]}
                  </kbd>
                  <p class="text-xs text-muted-foreground">{$tStore(`accessibility.keyboard.${key}`)}</p>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </section>

      <!-- Relacionados -->
      <section id="relacionados">
        <h2 class="text-xl font-semibold mb-4">{$tStore('related.title')}</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {#each relatedKeys as i}
            <div
              role="link"
              tabindex="0"
              onclick={() => { (window.top ?? window).location.href = $tStore(`related.item${i}.path`); }}
              onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') (window.top ?? window).location.href = $tStore(`related.item${i}.path`); }}
              class="rounded-lg border border-border p-4 bg-card/30 hover:bg-card/60 transition-colors cursor-pointer group space-y-1"
            >
              <p class="text-sm font-medium group-hover:text-primary transition-colors">{$tStore(`related.item${i}.name`)}</p>
              <p class="text-xs text-muted-foreground">{$tStore(`related.item${i}.description`)}</p>
            </div>
          {/each}
        </div>
      </section>

      <!-- Notas -->
      <section id="notas">
        <h2 class="text-xl font-semibold mb-4">{$tStore('notes.title')}</h2>
        <div class="space-y-4">
          {#each noteKeys as i}
            {@const borderColors = ['border-primary/40', 'border-orange-400/40', 'border-blue-400/40']}
            {@const bgColors = ['bg-primary/5', 'bg-orange-500/5', 'bg-blue-500/5']}
            <div class={`rounded-lg border p-4 ${borderColors[i - 1]} ${bgColors[i - 1]}`}>
              <p class="text-sm font-semibold mb-1">{$tStore(`notes.tip${i}Title`)}</p>
              <!-- eslint-disable svelte/no-at-html-tags -->
              <p class="text-sm text-muted-foreground">{@html sanitizeHtml($tStore(`notes.tip${i}`))}</p>
            </div>
          {/each}
        </div>
      </section>

      <!-- Analytics -->
      <section id="analytics">
        <h2 class="text-xl font-semibold mb-4">{$tStore('analytics.title')}</h2>
        <div class="rounded-lg border border-border p-6 bg-card/30">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-border bg-muted/50 text-left">
                  <th class="p-3 border-r border-border font-semibold">{$tStore('analytics.cols.event')}</th>
                  <th class="p-3 border-r border-border font-semibold">{$tStore('analytics.cols.trigger')}</th>
                  <th class="p-3 font-semibold">{$tStore('analytics.cols.payload')}</th>
                </tr>
              </thead>
              <tbody>
                {#each analyticsEventKeys as key}
                  <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                    <td class="p-3 border-r border-border font-mono text-xs text-primary">{$tStore(`analytics.table.${key}`)}</td>
                    <td class="p-3 border-r border-border text-muted-foreground">{$tStore(`analytics.table.${key}Trigger`)}</td>
                    <td class="p-3 font-mono text-xs text-muted-foreground">{$tStore(`analytics.table.${key}Payload`)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Testes -->
      <section id="testes">
        <h2 class="text-xl font-semibold mb-4">{$tStore('testes.title')}</h2>
        <div class="space-y-8">
          <!-- Funcional -->
          <div>
            <h3 class="text-sm font-semibold mb-3">{$tStore('testes.functional.title')}</h3>
            <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
              <table class="w-full border-collapse text-sm">
                <thead>
                  <tr class="border-b border-border bg-muted/50 text-left">
                    <th class="p-3 border-r border-border font-semibold">{$tStore('testes.cols.action')}</th>
                    <th class="p-3 border-r border-border font-semibold">{$tStore('testes.cols.result')}</th>
                    <th class="p-3 font-semibold">{$tStore('testes.cols.priority')}</th>
                  </tr>
                </thead>
                <tbody>
                  {#each testFunctionalKeys as i}
                    {@const isHigh = $tStore(`testes.functional.item${i}.priority`) === 'high'}
                    <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                      <td class="p-3 border-r border-border">{$tStore(`testes.functional.item${i}.action`)}</td>
                      <td class="p-3 border-r border-border text-muted-foreground">{$tStore(`testes.functional.item${i}.result`)}</td>
                      <td class="p-3">
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
          <!-- Acessibilidade -->
          <div>
            <h3 class="text-sm font-semibold mb-3">{$tStore('testes.accessibility.title')}</h3>
            <p class="text-xs text-muted-foreground mb-3">{$tStore('testes.accessibility.description')}</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              {#each testA11yKeys as i}
                <div class="rounded-lg border border-border p-3 bg-card/30 space-y-1 flex gap-2 items-start">
                  <span class="text-primary flex-shrink-0 mt-0.5">✓</span>
                  <!-- eslint-disable svelte/no-at-html-tags -->
                  <p class="text-xs text-muted-foreground">{@html sanitizeHtml($tStore(`testes.accessibility.item${i}`))}</p>
                </div>
              {/each}
            </div>
          </div>
          <!-- Visual -->
          <div>
            <h3 class="text-sm font-semibold mb-3">{$tStore('testes.visual.title')}</h3>
            <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
              <table class="w-full border-collapse text-sm">
                <thead>
                  <tr class="border-b border-border bg-muted/50 text-left">
                    <th class="p-3 border-r border-border font-semibold">{$tStore('testes.cols.story')}</th>
                    <th class="p-3 font-semibold">{$tStore('testes.cols.priority')}</th>
                  </tr>
                </thead>
                <tbody>
                  {#each testVisualKeys as i}
                    {@const isHigh = $tStore(`testes.visual.item${i}.priority`) === 'high'}
                    <tr class="border-b border-border last:border-0 hover:bg-muted/5">
                      <td class="p-3 border-r border-border font-mono text-xs text-muted-foreground">{$tStore(`testes.visual.item${i}.story`)}</td>
                      <td class="p-3">
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
