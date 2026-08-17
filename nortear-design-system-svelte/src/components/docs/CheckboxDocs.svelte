<script lang="ts">
  import { untrack } from 'svelte';
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
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(checkboxTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = $derived(
    Object.values(
      (checkboxTranslations as unknown as Record<
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

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'checkbox', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImport = `import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";`;

  const codeDefault = `<Checkbox id="termos" />`;

  const codeWithLabel = `<div class="nds-cluster" data-spacing="xs">
  <Checkbox id="termos" />
  <Label for="termos">Aceito os termos e condições</Label>
</div>`;

  const codeWithDescription = `<div class="nds-cluster" data-spacing="xs" data-align="start">
  <Checkbox id="newsletter" aria-describedby="newsletter-desc" style="margin-top: 0.125rem" />
  <div class="nds-stack" data-spacing="xs">
    <Label for="newsletter">Receber novidades por email</Label>
    <p id="newsletter-desc" class="nds-text-body">
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
//   checked                = $bindable(false)   — estado controlado
//   indeterminate          = $bindable(false)   — estado indeterminado (seleção parcial de grupo)
//   onCheckedChange        — callback de mudança do estado marcado
//   onIndeterminateChange  — callback de mudança do estado indeterminado
//   disabled               — desabilita o componente
//   required               — propaga aria-required
//   readonly               — focável, mas não alterável por interação
//   name                   — nome do campo para formulários nativos
//   value                  — valor enviado no submit (padrão "on")
//   class                  — classes .nds-* mescladas via cn()`;

  // ─── Reactive checked states for demo ────────────────────────────────────────

  let demoChecked1 = $state(false);
  let demoChecked2 = $state(true);
  let demoChecked3 = $state(false);
  let demoCheckedAll = $state(false);
  let demoIndeterminate = $state(true);

  // variant previews
  let varDefaultChecked = $state(false);
  let varWithLabelChecked = $state(false);
  let varWithDescChecked = $state(false);

  // do/dont
  let doPair1Checked = $state(false);
  let doPair2Checked1 = $state(false);
  let doPair2Checked2 = $state(false);
  let doPair2Checked3 = $state(false);

  // ─── Compositions state ──────────────────────────────────────────────────────
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

  const codeCompFieldset = `<fieldset class="nds-border-default nds-rounded-lg nds-p-4 nds-stack" data-spacing="sm" style="width: 18rem">
  <legend class="nds-text-body nds-font-semibold nds-px-1">Notificações</legend>
  <div class="nds-cluster" data-spacing="xs">
    <Checkbox id="notif-email" bind:checked={email} />
    <Label for="notif-email">Email</Label>
  </div>
  <div class="nds-cluster" data-spacing="xs">
    <Checkbox id="notif-push" bind:checked={push} />
    <Label for="notif-push">Push</Label>
  </div>
  <div class="nds-cluster" data-spacing="xs">
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

<div class="nds-stack" data-spacing="sm" style="width: 18rem">
  <div class="nds-cluster" data-spacing="xs">
    <Checkbox id="sa-parent" checked={parent} {indeterminate} onCheckedChange={toggleAll} />
    <Label for="sa-parent">Selecionar todos</Label>
  </div>
  <div class="nds-stack" data-spacing="xs" style="padding-left: 1.5rem">
    <div class="nds-cluster" data-spacing="xs"><Checkbox id="sa-1" bind:checked={c1} /><Label for="sa-1">Opção 1</Label></div>
    <div class="nds-cluster" data-spacing="xs"><Checkbox id="sa-2" bind:checked={c2} /><Label for="sa-2">Opção 2</Label></div>
    <div class="nds-cluster" data-spacing="xs"><Checkbox id="sa-3" bind:checked={c3} /><Label for="sa-3">Opção 3</Label></div>
  </div>
</div>`;

  const codeCompInList = `<div class="nds-stack" data-spacing="xs" style="width: 20rem">
  <h3 class="nds-text-body nds-font-semibold">Preferências de contato</h3>
  <div class="nds-cluster nds-rounded-md nds-border-default" data-spacing="xs" style="padding: 0.75rem">
    <Checkbox id="list-email" bind:checked={email} />
    <Label for="list-email">Email</Label>
  </div>
  <div class="nds-cluster nds-rounded-md nds-border-default" data-spacing="xs" style="padding: 0.75rem">
    <Checkbox id="list-push" bind:checked={push} />
    <Label for="list-push">Push</Label>
  </div>
  <div class="nds-cluster nds-rounded-md nds-border-default" data-spacing="xs" style="padding: 0.75rem">
    <Checkbox id="list-sms" bind:checked={sms} />
    <Label for="list-sms">SMS</Label>
  </div>
  <div class="nds-cluster nds-rounded-md nds-border-default" data-spacing="xs" style="padding: 0.75rem">
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
    />
  {/snippet}

  <!-- ── Demonstração ─────────────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')} componentSlug="checkbox">
    <div class="nds-stack" data-spacing="sm">
      <div class="nds-cluster" data-spacing="xs">
        <Checkbox id="demo-1" bind:checked={demoChecked1} onCheckedChange={(v: boolean) => track('field_change', { component: 'checkbox', field_name: 'acceptTerms', value: String(v), location: 'docs_demo' })} data-track="demo" data-track-id="checkbox:demo:acceptTerms" data-track-label={$tStore('demonstration.labels.acceptTerms')} />
        <Label for="demo-1">{$tStore('demonstration.labels.acceptTerms')}</Label>
      </div>
      <div class="nds-cluster" data-spacing="xs">
        <Checkbox id="demo-2" bind:checked={demoChecked2} onCheckedChange={(v: boolean) => track('field_change', { component: 'checkbox', field_name: 'newsletter', value: String(v), location: 'docs_demo' })} data-track="demo" data-track-id="checkbox:demo:newsletter" data-track-label={$tStore('demonstration.labels.newsletter')} />
        <Label for="demo-2">{$tStore('demonstration.labels.newsletter')}</Label>
      </div>
      <div class="nds-cluster" data-spacing="xs">
        <Checkbox id="demo-3" bind:checked={demoChecked3} onCheckedChange={(v: boolean) => track('field_change', { component: 'checkbox', field_name: 'rememberMe', value: String(v), location: 'docs_demo' })} data-track="demo" data-track-id="checkbox:demo:rememberMe" data-track-label={$tStore('demonstration.labels.rememberMe')} />
        <Label for="demo-3">{$tStore('demonstration.labels.rememberMe')}</Label>
      </div>
      <div class="nds-cluster" data-spacing="xs">
        <Checkbox id="demo-indeterminate" bind:checked={demoCheckedAll} bind:indeterminate={demoIndeterminate} onCheckedChange={(v: boolean) => track('field_change', { component: 'checkbox', field_name: 'selectAll', value: demoIndeterminate ? 'indeterminate' : String(v), location: 'docs_demo' })} data-track="demo" data-track-id="checkbox:demo:selectAll" data-track-label={$tStore('demonstration.labels.selectAll')} />
        <Label for="demo-indeterminate">{$tStore('demonstration.labels.selectAll')}</Label>
      </div>
    </div>
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
        doCaption: toPlainText($tStore('doDont.pair2.do')),
        dontCaption: toPlainText($tStore('doDont.pair2.dont')),
        doPreview: doPair2Do,
        dontPreview: doPair2Dont,
      },
    ]}
  />

  {#snippet doPair1Do()}
    <div class="nds-cluster" data-spacing="xs">
      <Checkbox id="do-pair1-do" bind:checked={doPair1Checked} />
      <Label for="do-pair1-do">Receber notificações por email</Label>
    </div>
  {/snippet}

  {#snippet doPair1Dont()}
    <div class="nds-cluster" data-spacing="xs">
      <Checkbox id="do-pair1-dont" />
      <Label for="do-pair1-dont">Email</Label>
    </div>
  {/snippet}

  {#snippet doPair2Do()}
    <fieldset class="nds-border-default nds-rounded-lg nds-stack nds-w-full" data-spacing="xs" style="padding: 0.75rem">
      <legend class="nds-text-caption nds-font-semibold nds-px-1">Preferências</legend>
      <div class="nds-cluster" data-spacing="xs">
        <Checkbox id="do-pair2-do-1" bind:checked={doPair2Checked1} />
        <Label for="do-pair2-do-1">Newsletter semanal</Label>
      </div>
      <div class="nds-cluster" data-spacing="xs">
        <Checkbox id="do-pair2-do-2" bind:checked={doPair2Checked2} />
        <Label for="do-pair2-do-2">Atualizações de produto</Label>
      </div>
    </fieldset>
  {/snippet}

  {#snippet doPair2Dont()}
    <div class="nds-stack nds-w-full" data-spacing="xs">
      <div class="nds-cluster" data-spacing="xs">
        <Checkbox id="do-pair2-dont-1" bind:checked={doPair2Checked3} />
        <Label for="do-pair2-dont-1">Newsletter semanal</Label>
      </div>
      <div class="nds-cluster" data-spacing="xs">
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
    <!-- Variante sem Label visível — aria-label invisível dá o accessible name. -->
    <Checkbox id="var-default" bind:checked={varDefaultChecked} aria-label={$tStore('demonstration.labels.acceptTerms')} />
  {/snippet}

  {#snippet variantWithLabel()}
    <div class="nds-cluster" data-spacing="xs">
      <Checkbox id="var-with-label" bind:checked={varWithLabelChecked} />
      <Label for="var-with-label">Aceito os termos e condições</Label>
    </div>
  {/snippet}

  {#snippet variantWithDescription()}
    <div class="nds-cluster" data-spacing="xs" data-align="start">
      <Checkbox id="var-with-desc" bind:checked={varWithDescChecked} aria-describedby="var-with-desc-text" style="margin-top: 0.125rem" />
      <div class="nds-stack" data-spacing="xs">
        <Label for="var-with-desc">Receber novidades por email</Label>
        <p id="var-with-desc-text" class="nds-text-body">
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

  {#snippet compFieldset()}
    <fieldset class="nds-border-default nds-rounded-lg nds-p-4 nds-stack" data-spacing="sm" style="width: 18rem">
      <legend class="nds-text-body nds-font-semibold nds-px-1">Notificações</legend>
      <div class="nds-cluster" data-spacing="xs">
        <Checkbox id="notif-email" bind:checked={compFieldsetEmail} />
        <Label for="notif-email">Email</Label>
      </div>
      <div class="nds-cluster" data-spacing="xs">
        <Checkbox id="notif-push" bind:checked={compFieldsetPush} />
        <Label for="notif-push">Push</Label>
      </div>
      <div class="nds-cluster" data-spacing="xs">
        <Checkbox id="notif-sms" bind:checked={compFieldsetSms} />
        <Label for="notif-sms">SMS</Label>
      </div>
    </fieldset>
  {/snippet}

  {#snippet compSelectAll()}
    <div class="nds-stack" data-spacing="sm" style="width: 18rem">
      <div class="nds-cluster" data-spacing="xs">
        <Checkbox
          id="sa-parent"
          checked={compSelectAllParent}
          indeterminate={compSelectAllIndeterminate}
          onCheckedChange={(v) => toggleSelectAll(Boolean(v))}
        />
        <Label for="sa-parent">Selecionar todos</Label>
      </div>
      <div class="nds-stack" data-spacing="xs" style="padding-left: 1.5rem">
        <div class="nds-cluster" data-spacing="xs">
          <Checkbox id="sa-1" bind:checked={compSelectAllChild1} />
          <Label for="sa-1">Opção 1</Label>
        </div>
        <div class="nds-cluster" data-spacing="xs">
          <Checkbox id="sa-2" bind:checked={compSelectAllChild2} />
          <Label for="sa-2">Opção 2</Label>
        </div>
        <div class="nds-cluster" data-spacing="xs">
          <Checkbox id="sa-3" bind:checked={compSelectAllChild3} />
          <Label for="sa-3">Opção 3</Label>
        </div>
      </div>
    </div>
  {/snippet}

  {#snippet compInList()}
    <div class="nds-stack" data-spacing="xs" style="width: 20rem">
      <h3 class="nds-text-body nds-font-semibold">Preferências de contato</h3>
      <div class="nds-cluster nds-rounded-md nds-border-default" data-spacing="xs" style="padding: 0.75rem">
        <Checkbox id="list-email" bind:checked={compInListEmail} />
        <Label for="list-email">Email</Label>
      </div>
      <div class="nds-cluster nds-rounded-md nds-border-default" data-spacing="xs" style="padding: 0.75rem">
        <Checkbox id="list-push" bind:checked={compInListPush} />
        <Label for="list-push">Push</Label>
      </div>
      <div class="nds-cluster nds-rounded-md nds-border-default" data-spacing="xs" style="padding: 0.75rem">
        <Checkbox id="list-sms" bind:checked={compInListSms} />
        <Label for="list-sms">SMS</Label>
      </div>
      <div class="nds-cluster nds-rounded-md nds-border-default" data-spacing="xs" style="padding: 0.75rem">
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
      trigger: toPlainText($tStore('states.cols.trigger')),
      behavior: toPlainText($tStore('states.cols.behavior')),
    }}
    items={[
      { label: $tStore('states.unchecked.label'),     trigger: toPlainText($tStore('states.unchecked.trigger')),     behavior: toPlainText($tStore('states.unchecked.behavior'))},
      { label: $tStore('states.checked.label'),       trigger: toPlainText($tStore('states.checked.trigger')), behavior: toPlainText($tStore('states.checked.behavior'))},
      { label: $tStore('states.indeterminate.label'), trigger: toPlainText($tStore('states.indeterminate.trigger')), behavior: toPlainText($tStore('states.indeterminate.behavior'))},
      { label: $tStore('states.disabled.label'),      trigger: toPlainText($tStore('states.disabled.trigger')), behavior: toPlainText($tStore('states.disabled.behavior')) },
      { label: $tStore('states.error.label'),         trigger: toPlainText($tStore('states.error.trigger')), behavior: toPlainText($tStore('states.error.behavior')) },
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
          { name: 'checked',                type: 'boolean',                    defaultValue: 'false', required: 'Não', description: stripHtml($tStore('props.items.checked')) },
          { name: 'indeterminate',          type: 'boolean',                    defaultValue: 'false', required: 'Não', description: stripHtml($tStore('props.items.indeterminate')) },
          { name: 'onCheckedChange',        type: '(checked: boolean) => void', defaultValue: '—',     required: 'Não', description: stripHtml($tStore('props.items.onCheckedChange')) },
          { name: 'disabled',               type: 'boolean',                    defaultValue: 'false', required: 'Não', description: stripHtml($tStore('props.items.disabled')) },
          { name: 'required',               type: 'boolean',                    defaultValue: 'false', required: 'Não', description: stripHtml($tStore('props.items.required')) },
          { name: 'name',                   type: 'string',                     defaultValue: '—',     required: 'Não', description: stripHtml($tStore('props.items.name')) },
          { name: 'value',                  type: 'string',                     defaultValue: '"on"',  required: 'Não', description: stripHtml($tStore('props.items.value')) },
          { name: 'class',                  type: 'string',                     defaultValue: '—',     required: 'Não', description: stripHtml($tStore('props.items.className')) },
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
      { token: '--primary',            value: '.nds-checkbox[data-state="checked"]', description: $tStore('tokens.table.primary') },
      { token: '--primary-foreground', value: '.nds-checkbox-indicator',             description: $tStore('tokens.table.primaryForeground') },
      { token: '--input',              value: '.nds-checkbox',                       description: $tStore('tokens.table.input') },
      { token: '--ring',               value: '.nds-checkbox:focus-visible',         description: toPlainText($tStore('tokens.table.ring')) },
      { token: '--destructive',        value: '.nds-checkbox[aria-invalid="true"]',  description: $tStore('tokens.table.destructive') },
      { token: '--border',             value: '.nds-checkbox',                       description: $tStore('tokens.table.border') },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeTokens}
  />

  <!-- ── Acessibilidade ───────────────────────────────────────────────── -->
  <DocsAccessibility
    screenReaderTitle={$tNavStore('common.screenReader')}
    screenReaderItems={screenReaderItems}
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
      { key: 'Space',     description: toPlainText($tStore('accessibility.keyboard.space')) },
      { key: 'Shift+Tab', description: $tStore('accessibility.keyboard.shiftTab') },
      { key: '—',         description: toPlainText($tStore('accessibility.keyboard.disabled')) },
    ]}
  />

  <!-- ── Relacionados ──────────────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'Switch',      description: toPlainText($tStore('related.switch')),      path: '?path=/docs/ui-switch--docs' },
      { name: 'RadioGroup',  description: toPlainText($tStore('related.radioGroup')),  path: '?path=/docs/ui-radiogroup--docs' },
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
      trigger: toPlainText($tStore('analytics.table.trigger')),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: $tStore('analytics.table.fieldChange'),    trigger: toPlainText($tStore('analytics.table.fieldChangeTrigger')),    payload: $tStore('analytics.table.fieldChangePayload') },
      { event: $tStore('analytics.table.pageView'),       trigger: toPlainText($tStore('analytics.table.pageViewTrigger')),       payload: $tStore('analytics.table.pageViewPayload') },
      { event: $tStore('analytics.table.sectionViewed'),  trigger: toPlainText($tStore('analytics.table.sectionViewedTrigger')),  payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),     trigger: toPlainText($tStore('analytics.table.langSwitchTrigger')),     payload: $tStore('analytics.table.langSwitchPayload') },
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
        { action: toPlainText($tStore('testes.functional.item1.action')), result: toPlainText($tStore('testes.functional.item1.result')), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item2.action')), result: toPlainText($tStore('testes.functional.item2.result')), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item3.action')), result: toPlainText($tStore('testes.functional.item3.result')), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item4.action')), result: toPlainText($tStore('testes.functional.item4.result')), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item5.action')), result: toPlainText($tStore('testes.functional.item5.result')), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item6.action')), result: toPlainText($tStore('testes.functional.item6.result')), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item7.action')), result: toPlainText($tStore('testes.functional.item7.result')), priority: localPriority($tStore('testes.functional.item7.priority'), $tNavStore) },
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
        { criterion: toPlainText($tStore('testes.accessibility.item1.criterion')), level: $tStore('testes.accessibility.item1.level'), how: $tStore('testes.accessibility.item1.how') },
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
