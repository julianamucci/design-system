<script lang="ts">
  import { Checkbox } from '@/components/ui/checkbox';
  import { Label } from '@/components/ui/label';
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
  import checkboxTranslations from '@shared/content/checkbox/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(checkboxTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'checkbox',
    });
    track('docs_page_view', {
      component_name: 'checkbox',
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
        { id: 'importacao',   label: tNav('nav.import')    },
        { id: 'variantes',    label: tNav('nav.variants')  },
        { id: 'composicoes',  label: tNav('nav.compositions') },
        { id: 'estados',      label: tNav('nav.states')    },
        { id: 'propriedades', label: tNav('nav.props')     },
        { id: 'tokens',       label: tNav('nav.tokens')    },
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
    track('docs_section_viewed', { section_id: id, component_name: 'checkbox', locale: $locale });
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

  const codeImport = `import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";`;

  const codeDefault = `<Checkbox id="termos" />`;

  const codeChecked = `<script lang="ts">
  let checked = $state(true);
<\/script>
<Checkbox id="termos" bind:checked />`;

  const codeIndeterminate = `<script lang="ts">
  let indeterminate = $state(true);
<\/script>
<Checkbox id="selecionar-todos" bind:indeterminate />`;

  const codeWithLabel = `<div class="flex items-center gap-2">
  <Checkbox id="termos" />
  <Label for="termos">Aceito os termos e condições</Label>
</div>`;

  const codeWithDescription = `<div class="flex gap-3">
  <Checkbox id="newsletter" aria-describedby="newsletter-desc" class="mt-0.5" />
  <div class="flex flex-col gap-1">
    <Label for="newsletter">Receber novidades por email</Label>
    <p id="newsletter-desc" class="text-sm text-muted-foreground">
      Ao marcar esta opção, você concorda em receber comunicações de marketing.
    </p>
  </div>
</div>`;

  const codeTokens = `/* Em globals.css — tokens do Checkbox */
:root {
  --primary: 222 47% 11%;
  --primary-foreground: 210 40% 98%;
  --input: 214 32% 91%;
  --ring: 222 47% 11%;
  --destructive: 0 84% 60%;
}`;

  const interfaceCode = `// Checkbox (Svelte 5 — bits-ui)
// Props disponíveis (além de todos os atributos HTML nativos):
//   checked        = $bindable(false)   — estado controlado
//   indeterminate  = $bindable(false)   — estado indeterminado (Svelte only)
//   disabled       — desabilita o componente
//   required       — propaga aria-required
//   name           — nome do campo para formulários nativos
//   value          — valor enviado no submit (padrão "on")
//   class          — classes Tailwind mescladas via cn()`;

  // ─── Reactive checked states for demo ────────────────────────────────────────

  let demoChecked1 = $state(false);
  let demoChecked2 = $state(true);
  let demoChecked3 = $state(false);
  let demoCheckedAll = $state(false);
  let demoIndeterminate = $state(true);

  // variant previews
  let varDefaultChecked = $state(false);
  let varCheckedVal = $state(true);
  let varIndeterminateVal = $state(false);
  let varIndeterminateFlag = $state(true);
  let varWithLabelChecked = $state(false);
  let varWithDescChecked = $state(false);

  // do/dont
  let doPair1Checked = $state(false);
  let doPair2Checked1 = $state(false);
  let doPair2Checked2 = $state(false);
  let doPair2Checked3 = $state(false);

  // ─── Compositions state ──────────────────────────────────────────────────────
  let compWithLabelChecked = $state(false);
  let compWithDescChecked = $state(false);
  let compFieldsetEmail = $state(true);
  let compFieldsetPush = $state(false);
  let compFieldsetSms = $state(false);

  let compSelectAllChild1 = $state(true);
  let compSelectAllChild2 = $state(false);
  let compSelectAllChild3 = $state(true);
  let compSelectAllParent = $state(false);
  let compSelectAllIndeterminate = $state(false);

  $effect(() => {
    const all = compSelectAllChild1 && compSelectAllChild2 && compSelectAllChild3;
    const none = !compSelectAllChild1 && !compSelectAllChild2 && !compSelectAllChild3;
    compSelectAllParent = all;
    compSelectAllIndeterminate = !all && !none;
  });

  function toggleSelectAll(v: boolean) {
    compSelectAllChild1 = v;
    compSelectAllChild2 = v;
    compSelectAllChild3 = v;
  }

  let compInListEmail = $state(true);
  let compInListPush = $state(false);
  let compInListSms = $state(false);
  let compInListNewsletter = $state(true);

  // ─── Composition code strings ────────────────────────────────────────────────
  const codeCompWithLabel = `<div class="flex items-center gap-2">
  <Checkbox id="cb-tos" bind:checked />
  <Label for="cb-tos">Aceito os termos e condições</Label>
</div>`;

  const codeCompWithDescription = `<div class="flex gap-2 items-start">
  <Checkbox id="cb-newsletter" bind:checked class="mt-0.5" aria-describedby="cb-newsletter-desc" />
  <div class="flex flex-col gap-1">
    <Label for="cb-newsletter">Receber novidades por email</Label>
    <p id="cb-newsletter-desc" class="text-sm text-muted-foreground">
      Enviaremos atualizações ocasionais sobre novos produtos.
    </p>
  </div>
</div>`;

  const codeCompFieldset = `<fieldset class="border rounded-lg p-4 space-y-3 w-72">
  <legend class="text-sm font-medium px-1">Notificações</legend>
  <div class="flex items-center gap-2">
    <Checkbox id="notif-email" bind:checked={email} />
    <Label for="notif-email">Email</Label>
  </div>
  <div class="flex items-center gap-2">
    <Checkbox id="notif-push" bind:checked={push} />
    <Label for="notif-push">Push</Label>
  </div>
  <div class="flex items-center gap-2">
    <Checkbox id="notif-sms" bind:checked={sms} />
    <Label for="notif-sms">SMS</Label>
  </div>
</fieldset>`;

  const codeCompSelectAll = `<script lang="ts">
  let c1 = $state(false);
  let c2 = $state(false);
  let c3 = $state(false);
  let parent = $state(false);
  let indeterminate = $state(false);

  $effect(() => {
    const all = c1 && c2 && c3;
    const none = !c1 && !c2 && !c3;
    parent = all;
    indeterminate = !all && !none;
  });

  function toggleAll(v: boolean) { c1 = v; c2 = v; c3 = v; }
<\/script>

<div class="space-y-3 w-72">
  <div class="flex items-center gap-2">
    <Checkbox id="sa-parent" checked={parent} {indeterminate} onCheckedChange={toggleAll} />
    <Label for="sa-parent">Selecionar todos</Label>
  </div>
  <div class="pl-6 space-y-2">
    <div class="flex items-center gap-2"><Checkbox id="sa-1" bind:checked={c1} /><Label for="sa-1">Opção 1</Label></div>
    <div class="flex items-center gap-2"><Checkbox id="sa-2" bind:checked={c2} /><Label for="sa-2">Opção 2</Label></div>
    <div class="flex items-center gap-2"><Checkbox id="sa-3" bind:checked={c3} /><Label for="sa-3">Opção 3</Label></div>
  </div>
</div>`;

  const codeCompInList = `<div class="space-y-2 w-80">
  <h3 class="text-sm font-medium">Preferências de contato</h3>
  <div class="flex items-center gap-2 border rounded-md p-3">
    <Checkbox id="list-email" bind:checked={email} />
    <Label for="list-email">Email</Label>
  </div>
  <div class="flex items-center gap-2 border rounded-md p-3">
    <Checkbox id="list-push" bind:checked={push} />
    <Label for="list-push">Push</Label>
  </div>
  <div class="flex items-center gap-2 border rounded-md p-3">
    <Checkbox id="list-sms" bind:checked={sms} />
    <Label for="list-sms">SMS</Label>
  </div>
  <div class="flex items-center gap-2 border rounded-md p-3">
    <Checkbox id="list-newsletter" bind:checked={newsletter} />
    <Label for="list-newsletter">Newsletter</Label>
  </div>
</div>`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="checkbox">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add checkbox"
    />
  {/snippet}

  <!-- ── Demonstração ─────────────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')} componentSlug="checkbox">
    {#snippet children()}
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <Checkbox id="demo-1" bind:checked={demoChecked1} data-track="demo" data-track-id="checkbox:demo:acceptTerms" data-track-label={$tStore('demonstration.labels.acceptTerms')} />
          <Label for="demo-1">{$tStore('demonstration.labels.acceptTerms')}</Label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox id="demo-2" bind:checked={demoChecked2} data-track="demo" data-track-id="checkbox:demo:newsletter" data-track-label={$tStore('demonstration.labels.newsletter')} />
          <Label for="demo-2">{$tStore('demonstration.labels.newsletter')}</Label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox id="demo-3" bind:checked={demoChecked3} data-track="demo" data-track-id="checkbox:demo:rememberMe" data-track-label={$tStore('demonstration.labels.rememberMe')} />
          <Label for="demo-3">{$tStore('demonstration.labels.rememberMe')}</Label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox id="demo-indeterminate" bind:checked={demoCheckedAll} bind:indeterminate={demoIndeterminate} data-track="demo" data-track-id="checkbox:demo:selectAll" data-track-label={$tStore('demonstration.labels.selectAll')} />
          <Label for="demo-indeterminate">{$tStore('demonstration.labels.selectAll')}</Label>
        </div>
      </div>
    {/snippet}
  </DocsDemonstration>

  <!-- ── Anatomia ──────────────────────────────────────────────────────── -->
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

  <!-- ── Quando Usar ───────────────────────────────────────────────────── -->
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
        { s: $tStore('usage.scenarios.item5.s'), u: $tStore('usage.scenarios.item5.u'), a: $tStore('usage.scenarios.item5.a') },
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
        $tStore('usage.dont.item4'),
      ],
    }}
  />

  <!-- ── Do & Don't ───────────────────────────────────────────────────── -->
  <DocsDoDont
    title={$tStore('doDont.title')}
    pairs={[
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair1.do'),
        dontCaption: $tStore('doDont.pair1.dont'),
        doPreview: doPair1Do,
        dontPreview: doPair1Dont,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: stripHtml($tStore('doDont.pair2.do')),
        dontCaption: $tStore('doDont.pair2.dont'),
        doPreview: doPair2Do,
        dontPreview: doPair2Dont,
      },
    ]}
  />

  {#snippet doPair1Do()}
    <div class="flex items-center gap-2">
      <Checkbox id="do-pair1-do" bind:checked={doPair1Checked} />
      <Label for="do-pair1-do">Receber notificações por email</Label>
    </div>
  {/snippet}

  {#snippet doPair1Dont()}
    <div class="flex items-center gap-2">
      <Checkbox id="do-pair1-dont" />
      <Label for="do-pair1-dont">Email</Label>
    </div>
  {/snippet}

  {#snippet doPair2Do()}
    <fieldset class="border border-border rounded-md p-3 space-y-2">
      <legend class="text-xs font-medium px-1">Preferências</legend>
      <div class="flex items-center gap-2">
        <Checkbox id="do-pair2-do-1" bind:checked={doPair2Checked1} />
        <Label for="do-pair2-do-1">Newsletter semanal</Label>
      </div>
      <div class="flex items-center gap-2">
        <Checkbox id="do-pair2-do-2" bind:checked={doPair2Checked2} />
        <Label for="do-pair2-do-2">Atualizações de produto</Label>
      </div>
    </fieldset>
  {/snippet}

  {#snippet doPair2Dont()}
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <Checkbox id="do-pair2-dont-1" bind:checked={doPair2Checked3} />
        <Label for="do-pair2-dont-1">Newsletter semanal</Label>
      </div>
      <div class="flex items-center gap-2">
        <Checkbox id="do-pair2-dont-2" />
        <Label for="do-pair2-dont-2">Atualizações de produto</Label>
      </div>
    </div>
  {/snippet}

  <!-- ── Importação ────────────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.svelte')}
    code={codeImport}
    componentSlug="checkbox"
  />

  <!-- ── Variantes ─────────────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    componentSlug="checkbox"
    items={[
      {
        name: 'default',
        description: stripHtml($tStore('variants.items.default')),
        code: codeDefault,
        preview: variantDefault,
      },
      {
        name: 'checked',
        description: stripHtml($tStore('variants.items.checked')),
        code: codeChecked,
        preview: variantChecked,
      },
      {
        name: 'indeterminate',
        description: stripHtml($tStore('variants.items.indeterminate')),
        code: codeIndeterminate,
        preview: variantIndeterminate,
      },
      {
        name: 'withLabel',
        description: stripHtml($tStore('variants.items.withLabel')),
        code: codeWithLabel,
        preview: variantWithLabel,
      },
      {
        name: 'withDescription',
        description: stripHtml($tStore('variants.items.withDescription')),
        code: codeWithDescription,
        preview: variantWithDescription,
      },
    ]}
  />

  {#snippet variantDefault()}
    <Checkbox id="var-default" bind:checked={varDefaultChecked} />
  {/snippet}

  {#snippet variantChecked()}
    <Checkbox id="var-checked" bind:checked={varCheckedVal} />
  {/snippet}

  {#snippet variantIndeterminate()}
    <Checkbox id="var-indeterminate" bind:checked={varIndeterminateVal} bind:indeterminate={varIndeterminateFlag} />
  {/snippet}

  {#snippet variantWithLabel()}
    <div class="flex items-center gap-2">
      <Checkbox id="var-with-label" bind:checked={varWithLabelChecked} />
      <Label for="var-with-label">Aceito os termos e condições</Label>
    </div>
  {/snippet}

  {#snippet variantWithDescription()}
    <div class="flex gap-3">
      <Checkbox id="var-with-desc" bind:checked={varWithDescChecked} aria-describedby="var-with-desc-text" class="mt-0.5" />
      <div class="flex flex-col gap-1">
        <Label for="var-with-desc">Receber novidades por email</Label>
        <p id="var-with-desc-text" class="text-sm text-muted-foreground">
          Ao marcar esta opção, você concorda em receber comunicações de marketing.
        </p>
      </div>
    </div>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="checkbox"
    items={[
      {
        name: $tStore('variants.compositions.withLabel.name'),
        description: $tStore('variants.compositions.withLabel.description'),
        useWhen: $tStore('variants.compositions.withLabel.use'),
        code: codeCompWithLabel,
        preview: compWithLabel,
      },
      {
        name: $tStore('variants.compositions.withDescription.name'),
        description: $tStore('variants.compositions.withDescription.description'),
        useWhen: $tStore('variants.compositions.withDescription.use'),
        code: codeCompWithDescription,
        preview: compWithDescription,
      },
      {
        name: $tStore('variants.compositions.fieldset.name'),
        description: $tStore('variants.compositions.fieldset.description'),
        useWhen: $tStore('variants.compositions.fieldset.use'),
        code: codeCompFieldset,
        preview: compFieldset,
      },
      {
        name: $tStore('variants.compositions.selectAll.name'),
        description: $tStore('variants.compositions.selectAll.description'),
        useWhen: $tStore('variants.compositions.selectAll.use'),
        code: codeCompSelectAll,
        preview: compSelectAll,
      },
      {
        name: $tStore('variants.compositions.inList.name'),
        description: $tStore('variants.compositions.inList.description'),
        useWhen: $tStore('variants.compositions.inList.use'),
        code: codeCompInList,
        preview: compInList,
      },
    ]}
  />

  {#snippet compWithLabel()}
    <div class="flex items-center gap-2">
      <Checkbox id="comp-tos" bind:checked={compWithLabelChecked} />
      <Label for="comp-tos">Aceito os termos e condições</Label>
    </div>
  {/snippet}

  {#snippet compWithDescription()}
    <div class="flex gap-2 items-start">
      <Checkbox id="comp-newsletter" bind:checked={compWithDescChecked} class="mt-0.5" aria-describedby="comp-newsletter-desc" />
      <div class="flex flex-col gap-1">
        <Label for="comp-newsletter">Receber novidades por email</Label>
        <p id="comp-newsletter-desc" class="text-sm text-muted-foreground">
          Enviaremos atualizações ocasionais sobre novos produtos.
        </p>
      </div>
    </div>
  {/snippet}

  {#snippet compFieldset()}
    <fieldset class="border rounded-lg p-4 space-y-3 w-72">
      <legend class="text-sm font-medium px-1">Notificações</legend>
      <div class="flex items-center gap-2">
        <Checkbox id="notif-email" bind:checked={compFieldsetEmail} />
        <Label for="notif-email">Email</Label>
      </div>
      <div class="flex items-center gap-2">
        <Checkbox id="notif-push" bind:checked={compFieldsetPush} />
        <Label for="notif-push">Push</Label>
      </div>
      <div class="flex items-center gap-2">
        <Checkbox id="notif-sms" bind:checked={compFieldsetSms} />
        <Label for="notif-sms">SMS</Label>
      </div>
    </fieldset>
  {/snippet}

  {#snippet compSelectAll()}
    <div class="space-y-3 w-72">
      <div class="flex items-center gap-2">
        <Checkbox
          id="sa-parent"
          checked={compSelectAllParent}
          indeterminate={compSelectAllIndeterminate}
          onCheckedChange={(v) => toggleSelectAll(Boolean(v))}
        />
        <Label for="sa-parent">Selecionar todos</Label>
      </div>
      <div class="pl-6 space-y-2">
        <div class="flex items-center gap-2">
          <Checkbox id="sa-1" bind:checked={compSelectAllChild1} />
          <Label for="sa-1">Opção 1</Label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox id="sa-2" bind:checked={compSelectAllChild2} />
          <Label for="sa-2">Opção 2</Label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox id="sa-3" bind:checked={compSelectAllChild3} />
          <Label for="sa-3">Opção 3</Label>
        </div>
      </div>
    </div>
  {/snippet}

  {#snippet compInList()}
    <div class="space-y-2 w-80">
      <h3 class="text-sm font-medium">Preferências de contato</h3>
      <div class="flex items-center gap-2 border rounded-md p-3">
        <Checkbox id="list-email" bind:checked={compInListEmail} />
        <Label for="list-email">Email</Label>
      </div>
      <div class="flex items-center gap-2 border rounded-md p-3">
        <Checkbox id="list-push" bind:checked={compInListPush} />
        <Label for="list-push">Push</Label>
      </div>
      <div class="flex items-center gap-2 border rounded-md p-3">
        <Checkbox id="list-sms" bind:checked={compInListSms} />
        <Label for="list-sms">SMS</Label>
      </div>
      <div class="flex items-center gap-2 border rounded-md p-3">
        <Checkbox id="list-newsletter" bind:checked={compInListNewsletter} />
        <Label for="list-newsletter">Newsletter</Label>
      </div>
    </div>
  {/snippet}

  <!-- ── Estados ──────────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={[
      { label: $tStore('states.unchecked.label'),     trigger: $tStore('states.unchecked.trigger'),     behavior: $tStore('states.unchecked.behavior') },
      { label: $tStore('states.checked.label'),       trigger: stripHtml($tStore('states.checked.trigger')), behavior: $tStore('states.checked.behavior') },
      { label: $tStore('states.indeterminate.label'), trigger: stripHtml($tStore('states.indeterminate.trigger')), behavior: $tStore('states.indeterminate.behavior') },
      { label: $tStore('states.disabled.label'),      trigger: stripHtml($tStore('states.disabled.trigger')), behavior: stripHtml($tStore('states.disabled.behavior')) },
      { label: $tStore('states.error.label'),         trigger: stripHtml($tStore('states.error.trigger')), behavior: stripHtml($tStore('states.error.behavior')) },
    ]}
  />

  <!-- ── Propriedades ─────────────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: $tStore('props.svelteTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'checked',       type: 'boolean',                    defaultValue: 'false', required: 'Não', description: stripHtml($tStore('props.items.checked')) },
          { name: 'indeterminate', type: 'boolean',                    defaultValue: 'false', required: 'Não', description: stripHtml($tStore('props.items.indeterminate')) },
          { name: 'disabled',      type: 'boolean',                    defaultValue: 'false', required: 'Não', description: stripHtml($tStore('props.items.disabled')) },
          { name: 'required',      type: 'boolean',                    defaultValue: 'false', required: 'Não', description: stripHtml($tStore('props.items.required')) },
          { name: 'name',          type: 'string',                     defaultValue: '—',     required: 'Não', description: stripHtml($tStore('props.items.name')) },
          { name: 'value',         type: 'string',                     defaultValue: '"on"',  required: 'Não', description: stripHtml($tStore('props.items.value')) },
          { name: 'class',         type: 'string',                     defaultValue: '—',     required: 'Não', description: stripHtml($tStore('props.items.className')) },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
  />

  <!-- ── Tokens ────────────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      { token: '--primary',            value: 'bg-primary / border-primary',         description: $tStore('tokens.table.primary') },
      { token: '--primary-foreground', value: 'text-primary-foreground',             description: $tStore('tokens.table.primaryForeground') },
      { token: '--input',              value: 'border-input',                        description: $tStore('tokens.table.input') },
      { token: '--ring',               value: 'focus-visible:ring-ring/50',          description: $tStore('tokens.table.ring') },
      { token: '--destructive',        value: 'border-destructive ring-destructive', description: $tStore('tokens.table.destructive') },
      { token: '--border',             value: 'border',                              description: $tStore('tokens.table.border') },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeTokens}
  />

  <!-- ── Acessibilidade ───────────────────────────────────────────────── -->
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
    keyboardItems={[
      { key: 'Tab',       description: $tStore('accessibility.keyboard.tab') },
      { key: 'Space',     description: stripHtml($tStore('accessibility.keyboard.space')) },
      { key: 'Shift+Tab', description: $tStore('accessibility.keyboard.shiftTab') },
      { key: '—',         description: stripHtml($tStore('accessibility.keyboard.disabled')) },
    ]}
  />

  <!-- ── Relacionados ──────────────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'Switch',      description: stripHtml($tStore('related.switch')),      path: '?path=/docs/ui-switch--docs' },
      { name: 'RadioGroup',  description: stripHtml($tStore('related.radioGroup')),  path: '?path=/docs/ui-radiogroup--docs' },
      { name: 'Form',        description: $tStore('related.form'),                   path: '?path=/docs/ui-form--docs' },
      { name: 'Select',      description: stripHtml($tStore('related.select')),      path: '?path=/docs/ui-select--docs' },
    ]}
  />

  <!-- ── Notas ─────────────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: $tStore('notes.tip1') },
      { title: '', content: $tStore('notes.tip2') },
      { title: '', content: $tStore('notes.tip3') },
      { title: '', content: $tStore('notes.tip4') },
    ]}
  />

  <!-- ── Analytics ────────────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: $tStore('analytics.table.trigger'),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: $tStore('analytics.table.fieldChange'),    trigger: $tStore('analytics.table.fieldChangeTrigger'),    payload: $tStore('analytics.table.fieldChangePayload') },
      { event: $tStore('analytics.table.pageView'),       trigger: $tStore('analytics.table.pageViewTrigger'),       payload: $tStore('analytics.table.pageViewPayload') },
      { event: $tStore('analytics.table.sectionViewed'),  trigger: $tStore('analytics.table.sectionViewedTrigger'),  payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),     trigger: $tStore('analytics.table.langSwitchTrigger'),     payload: $tStore('analytics.table.langSwitchPayload') },
    ]}
    note={$tStore('analytics.note')}
  />

  <!-- ── Testes ────────────────────────────────────────────────────────── -->
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
        { action: stripHtml($tStore('testes.functional.item1.action')), result: stripHtml($tStore('testes.functional.item1.result')), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: stripHtml($tStore('testes.functional.item2.action')), result: stripHtml($tStore('testes.functional.item2.result')), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: stripHtml($tStore('testes.functional.item3.action')), result: stripHtml($tStore('testes.functional.item3.result')), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: stripHtml($tStore('testes.functional.item4.action')), result: stripHtml($tStore('testes.functional.item4.result')), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
        { action: stripHtml($tStore('testes.functional.item5.action')), result: stripHtml($tStore('testes.functional.item5.result')), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
        { action: stripHtml($tStore('testes.functional.item6.action')), result: stripHtml($tStore('testes.functional.item6.result')), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
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
        { criterion: stripHtml($tStore('testes.accessibility.item1.criterion')), level: $tStore('testes.accessibility.item1.level'), how: $tStore('testes.accessibility.item1.how') },
        { criterion: $tStore('testes.accessibility.item2.criterion'),            level: $tStore('testes.accessibility.item2.level'), how: $tStore('testes.accessibility.item2.how') },
        { criterion: $tStore('testes.accessibility.item3.criterion'),            level: $tStore('testes.accessibility.item3.level'), how: $tStore('testes.accessibility.item3.how') },
        { criterion: $tStore('testes.accessibility.item4.criterion'),            level: $tStore('testes.accessibility.item4.level'), how: $tStore('testes.accessibility.item4.how') },
        { criterion: $tStore('testes.accessibility.item5.criterion'),            level: $tStore('testes.accessibility.item5.level'), how: $tStore('testes.accessibility.item5.how') },
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
        { story: $tStore('testes.visual.item5.story'), priority: localPriority($tStore('testes.visual.item5.priority'), $tNavStore) },
      ],
    }}
  />
</DocsPageLayout>
