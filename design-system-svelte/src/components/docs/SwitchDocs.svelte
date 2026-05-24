<script lang="ts">
  import { Switch } from '@/components/ui/switch';
  import { Label } from '@/components/ui/label';
  import { Button } from '@/components/ui/button';
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
  import switchTranslations from '@shared/content/switch/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(switchTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'switch',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent') as 'informational' | 'navigational',
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'switch',
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
    track('docs_section_viewed', { section_id: id, component_name: 'switch', locale: $locale });
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

  // ─── Reactive demo states ────────────────────────────────────────────────────

  let demoNotifications = $state(true);
  let demoMarketing = $state(false);
  let demoDarkMode = $state(false);
  let demoSm = $state(false);

  // Variants
  let varDefault = $state(false);
  let varWithDesc = $state(false);
  let varSm = $state(false);

  // Compositions
  let compEmail = $state(false);
  let compMarketing = $state(true);
  let compSettingsEmail = $state(true);
  let compSettingsPush = $state(false);
  let compSettingsSms = $state(false);
  let compNewsletter = $state(true);

  function handleCompFormSubmit(e: Event) {
    e.preventDefault();
  }

  // Do/Don't
  let dd1DoChecked = $state(false);
  let dd1DontChecked = $state(false);
  let dd2DoChecked = $state(false);
  let dd2DontChecked = $state(false);

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImport = `import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";`;

  const codeDefault = `<script lang="ts">
  let checked = $state(false);
<\/script>
<div class="flex items-center gap-2">
  <Switch id="notifications" bind:checked />
  <Label for="notifications">Receber notificações por email</Label>
</div>`;

  const codeWithDescription = `<script lang="ts">
  let marketing = $state(false);
<\/script>
<div class="flex items-center justify-between">
  <div class="flex flex-col gap-0.5">
    <Label for="marketing">Emails de marketing</Label>
    <p class="text-sm text-muted-foreground">
      Receba novidades e promoções da plataforma.
    </p>
  </div>
  <Switch id="marketing" bind:checked={marketing} />
</div>`;

  const codeSm = `<div class="flex items-center gap-2">
  <Switch id="compact" size="sm" />
  <Label for="compact">Tamanho compacto</Label>
</div>`;

  const interfaceCode = `// Switch (Svelte 5 — bits-ui)
interface SwitchProps {
  checked?: boolean;       // $bindable — estado controlado
  ref?: HTMLElement;       // $bindable
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;          // valor enviado no submit
  size?: "default" | "sm"; // tamanho do switch
  id?: string;             // recomendado — binding com Label
  class?: string;
}`;

  const customizationCode = `/* Cor customizada do checked */
.switch-success[data-checked] {
  @apply bg-green-500;
}

/* Tamanho customizado */
[data-slot="switch"][data-size="default"] {
  width: 40px;
  height: 24px;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="switch">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add switch"
    />
  {/snippet}

  <!-- ── Demonstração ─────────────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')} componentSlug="switch">
    {#snippet children()}
      <div class="flex flex-col gap-6 w-80">
        <!-- Default -->
        <div class="flex items-center gap-2">
          <Switch
            id="demo-notifications"
            bind:checked={demoNotifications}
            data-track="demo"
            data-track-id="switch:demo:notifications"
            data-track-label={$tStore('demonstration.labels.notifications')}
          />
          <Label for="demo-notifications">{$tStore('demonstration.labels.notifications')}</Label>
        </div>

        <!-- With description (panel) -->
        <div class="flex items-center justify-between gap-4">
          <div class="flex flex-col gap-0.5">
            <Label for="demo-marketing">{$tStore('demonstration.labels.marketing')}</Label>
            <p class="text-sm text-muted-foreground">{$tStore('demonstration.labels.marketingDesc')}</p>
          </div>
          <Switch
            id="demo-marketing"
            bind:checked={demoMarketing}
            data-track="demo"
            data-track-id="switch:demo:marketing"
            data-track-label={$tStore('demonstration.labels.marketing')}
          />
        </div>

        <!-- Dark mode (panel) -->
        <div class="flex items-center justify-between gap-4">
          <div class="flex flex-col gap-0.5">
            <Label for="demo-darkmode">{$tStore('demonstration.labels.darkMode')}</Label>
            <p class="text-sm text-muted-foreground">{$tStore('demonstration.labels.darkModeDesc')}</p>
          </div>
          <Switch
            id="demo-darkmode"
            bind:checked={demoDarkMode}
            data-track="demo"
            data-track-id="switch:demo:darkMode"
            data-track-label={$tStore('demonstration.labels.darkMode')}
          />
        </div>

        <!-- Sm -->
        <div class="flex items-center gap-2">
          <Switch
            id="demo-sm"
            size="sm"
            bind:checked={demoSm}
            data-track="demo"
            data-track-id="switch:demo:sm"
            data-track-label={$tStore('demonstration.labels.sm')}
          />
          <Label for="demo-sm">{$tStore('demonstration.labels.sm')}</Label>
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
    uxWriting={{
      title: $tStore('usage.uxWriting.title'),
      cols: {
        element: $tStore('usage.uxWriting.table.element'),
        rules: $tStore('usage.uxWriting.table.rules'),
        do: $tStore('usage.uxWriting.table.correct'),
        dont: $tStore('usage.uxWriting.table.avoid'),
      },
      items: [
        {
          element: $tStore('usage.uxWriting.table.label.name'),
          rules: $tStore('usage.uxWriting.table.label.format'),
          do: $tStore('usage.uxWriting.table.label.good'),
          dont: $tStore('usage.uxWriting.table.label.bad'),
        },
        {
          element: $tStore('usage.uxWriting.table.description.name'),
          rules: $tStore('usage.uxWriting.table.description.format'),
          do: $tStore('usage.uxWriting.table.description.good'),
          dont: $tStore('usage.uxWriting.table.description.bad'),
        },
        {
          element: $tStore('usage.uxWriting.table.panel.name'),
          rules: $tStore('usage.uxWriting.table.panel.format'),
          do: $tStore('usage.uxWriting.table.panel.good'),
          dont: $tStore('usage.uxWriting.table.panel.bad'),
        },
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
        doPreview: dd1Do,
        dontPreview: dd1Dont,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair2.do'),
        dontCaption: $tStore('doDont.pair2.dont'),
        doPreview: dd2Do,
        dontPreview: dd2Dont,
      },
    ]}
  />

  {#snippet dd1Do()}
    <div class="flex items-center gap-2">
      <Switch id="dd1-do" bind:checked={dd1DoChecked} />
      <Label for="dd1-do">Receber notificações por email</Label>
    </div>
  {/snippet}

  {#snippet dd1Dont()}
    <div class="flex items-center gap-2">
      <Switch id="dd1-dont" bind:checked={dd1DontChecked} />
      <Label for="dd1-dont">Notificações</Label>
    </div>
  {/snippet}

  {#snippet dd2Do()}
    <div class="flex items-center gap-2">
      <Switch id="dd2-do" bind:checked={dd2DoChecked} />
      <Label for="dd2-do">Modo escuro</Label>
    </div>
  {/snippet}

  {#snippet dd2Dont()}
    <div class="flex items-center gap-2">
      <Switch id="dd2-dont" bind:checked={dd2DontChecked} />
      <span class="text-sm">Modo escuro</span>
    </div>
  {/snippet}

  <!-- ── Importação ────────────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImport}
    componentSlug="switch"
  />

  <!-- ── Variantes ─────────────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    componentSlug="switch"
    items={[
      {
        name: $tStore('variants.items.default'),
        description: stripHtml($tStore('variants.styles.default')),
        code: codeDefault,
        preview: variantDefault,
      },
      {
        name: $tStore('variants.items.withDescription'),
        description: stripHtml($tStore('variants.styles.withDescription')),
        code: codeWithDescription,
        preview: variantWithDescription,
      },
      {
        name: $tStore('variants.items.sm'),
        description: stripHtml($tStore('variants.styles.sm')),
        code: codeSm,
        preview: variantSm,
      },
    ]}
  />

  {#snippet variantDefault()}
    <div class="flex items-center gap-2">
      <Switch id="var-default" bind:checked={varDefault} />
      <Label for="var-default">Receber notificações por email</Label>
    </div>
  {/snippet}

  {#snippet variantWithDescription()}
    <div class="flex items-center justify-between gap-4 w-80">
      <div class="flex flex-col gap-0.5">
        <Label for="var-with-desc">Emails de marketing</Label>
        <p class="text-sm text-muted-foreground">Receba novidades e promoções da plataforma.</p>
      </div>
      <Switch id="var-with-desc" bind:checked={varWithDesc} />
    </div>
  {/snippet}

  {#snippet variantSm()}
    <div class="flex items-center gap-2">
      <Switch id="var-sm" size="sm" bind:checked={varSm} />
      <Label for="var-sm">Tamanho compacto</Label>
    </div>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="switch"
    items={[
      {
        name: $tStore('variants.compositions.withLabel.name'),
        description: $tStore('variants.compositions.withLabel.description'),
        useWhen: $tStore('variants.compositions.withLabel.use'),
        code: `<div class="flex items-center space-x-2">\n  <Switch id="sw-email" />\n  <Label for="sw-email">Receber notificações por email</Label>\n</div>`,
        preview: compWithLabel,
      },
      {
        name: $tStore('variants.compositions.withDescription.name'),
        description: $tStore('variants.compositions.withDescription.description'),
        useWhen: $tStore('variants.compositions.withDescription.use'),
        code: `<div class="flex items-center justify-between rounded-lg border p-3 w-80">\n  <div class="flex flex-col gap-0.5 pr-3">\n    <Label for="sw-mkt">Emails de marketing</Label>\n    <p class="text-sm text-muted-foreground">Receba novidades e promoções da plataforma.</p>\n  </div>\n  <Switch id="sw-mkt" checked />\n</div>`,
        preview: compWithDescription,
      },
      {
        name: $tStore('variants.compositions.settingsList.name'),
        description: $tStore('variants.compositions.settingsList.description'),
        useWhen: $tStore('variants.compositions.settingsList.use'),
        code: `<div class="space-y-2 w-96">\n  <h4 class="text-sm font-medium">Preferências de notificação</h4>\n  <div class="flex items-center justify-between rounded-lg border p-3">\n    <div class="flex flex-col gap-0.5 pr-3">\n      <Label for="sw-list-email">Email</Label>\n      <p class="text-sm text-muted-foreground">Receba avisos importantes por email.</p>\n    </div>\n    <Switch id="sw-list-email" checked />\n  </div>\n  <!-- demais painéis: push, sms -->\n</div>`,
        preview: compSettingsList,
      },
      {
        name: $tStore('variants.compositions.inForm.name'),
        description: $tStore('variants.compositions.inForm.description'),
        useWhen: $tStore('variants.compositions.inForm.use'),
        code: `<form class="flex flex-col gap-3 w-80" on:submit|preventDefault={handleSubmit}>\n  <div class="flex items-center space-x-2">\n    <Switch id="sw-newsletter" name="newsletter" checked />\n    <Label for="sw-newsletter">Aceitar newsletter semanal</Label>\n  </div>\n  <Button type="submit">Salvar preferências</Button>\n</form>`,
        preview: compInForm,
      },
    ]}
  />

  {#snippet compWithLabel()}
    <div class="flex items-center space-x-2">
      <Switch id="comp-sw-email" bind:checked={compEmail} />
      <Label for="comp-sw-email">Receber notificações por email</Label>
    </div>
  {/snippet}

  {#snippet compWithDescription()}
    <div class="flex items-center justify-between rounded-lg border p-3 w-80">
      <div class="flex flex-col gap-0.5 pr-3">
        <Label for="comp-sw-mkt">Emails de marketing</Label>
        <p class="text-sm text-muted-foreground">Receba novidades e promoções da plataforma.</p>
      </div>
      <Switch id="comp-sw-mkt" bind:checked={compMarketing} />
    </div>
  {/snippet}

  {#snippet compSettingsList()}
    <div class="space-y-2 w-96">
      <h4 class="text-sm font-medium">Preferências de notificação</h4>
      <div class="flex items-center justify-between rounded-lg border p-3">
        <div class="flex flex-col gap-0.5 pr-3">
          <Label for="comp-sw-list-email">Email</Label>
          <p class="text-sm text-muted-foreground">Receba avisos importantes por email.</p>
        </div>
        <Switch id="comp-sw-list-email" bind:checked={compSettingsEmail} />
      </div>
      <div class="flex items-center justify-between rounded-lg border p-3">
        <div class="flex flex-col gap-0.5 pr-3">
          <Label for="comp-sw-list-push">Push</Label>
          <p class="text-sm text-muted-foreground">Notificações em tempo real no dispositivo.</p>
        </div>
        <Switch id="comp-sw-list-push" bind:checked={compSettingsPush} />
      </div>
      <div class="flex items-center justify-between rounded-lg border p-3">
        <div class="flex flex-col gap-0.5 pr-3">
          <Label for="comp-sw-list-sms">SMS</Label>
          <p class="text-sm text-muted-foreground">Alertas críticos por mensagem de texto.</p>
        </div>
        <Switch id="comp-sw-list-sms" bind:checked={compSettingsSms} />
      </div>
    </div>
  {/snippet}

  {#snippet compInForm()}
    <form class="flex flex-col gap-3 w-80" on:submit={handleCompFormSubmit}>
      <div class="flex items-center space-x-2">
        <Switch id="comp-sw-newsletter" name="newsletter" bind:checked={compNewsletter} />
        <Label for="comp-sw-newsletter">Aceitar newsletter semanal</Label>
      </div>
      <Button type="submit">Salvar preferências</Button>
    </form>
  {/snippet}

  <!-- ── Estados ──────────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: 'Estado',
      trigger: 'Disparo',
      behavior: 'Comportamento',
    }}
    items={[
      { label: $tStore('states.items.unchecked'), trigger: 'data-unchecked',         behavior: stripHtml($tStore('states.descriptions.unchecked')) },
      { label: $tStore('states.items.checked'),   trigger: 'data-checked',           behavior: stripHtml($tStore('states.descriptions.checked')) },
      { label: $tStore('states.items.hover'),     trigger: ':hover',                 behavior: stripHtml($tStore('states.descriptions.hover')) },
      { label: $tStore('states.items.focus'),     trigger: ':focus-visible',         behavior: stripHtml($tStore('states.descriptions.focus')) },
      { label: $tStore('states.items.disabled'),  trigger: 'disabled',               behavior: stripHtml($tStore('states.descriptions.disabled')) },
      { label: $tStore('states.items.invalid'),   trigger: 'aria-invalid="true"',    behavior: stripHtml($tStore('states.descriptions.invalid')) },
    ]}
  />

  <!-- ── Propriedades ─────────────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'checked',          type: $tStore('props.table.checked.type'),          defaultValue: $tStore('props.table.checked.default'),          required: $tStore('props.table.checked.required'),          description: stripHtml($tStore('props.table.checked.description')) },
          { name: 'defaultChecked',   type: $tStore('props.table.defaultChecked.type'),   defaultValue: $tStore('props.table.defaultChecked.default'),   required: $tStore('props.table.defaultChecked.required'),   description: stripHtml($tStore('props.table.defaultChecked.description')) },
          { name: 'onCheckedChange',  type: $tStore('props.table.onCheckedChange.type'),  defaultValue: $tStore('props.table.onCheckedChange.default'),  required: $tStore('props.table.onCheckedChange.required'),  description: stripHtml($tStore('props.table.onCheckedChange.description')) },
          { name: 'disabled',         type: $tStore('props.table.disabled.type'),         defaultValue: $tStore('props.table.disabled.default'),         required: $tStore('props.table.disabled.required'),         description: stripHtml($tStore('props.table.disabled.description')) },
          { name: 'name',             type: $tStore('props.table.name.type'),             defaultValue: $tStore('props.table.name.default'),             required: $tStore('props.table.name.required'),             description: stripHtml($tStore('props.table.name.description')) },
          { name: 'size',             type: $tStore('props.table.size.type'),             defaultValue: $tStore('props.table.size.default'),             required: $tStore('props.table.size.required'),             description: stripHtml($tStore('props.table.size.description')) },
          { name: 'id',               type: $tStore('props.table.id.type'),               defaultValue: $tStore('props.table.id.default'),               required: $tStore('props.table.id.required'),               description: stripHtml($tStore('props.table.id.description')) },
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
      { token: '--input',              value: $tStore('tokens.table.input.class'),             description: $tStore('tokens.table.input.part') },
      { token: '--primary',            value: $tStore('tokens.table.primary.class'),           description: $tStore('tokens.table.primary.part') },
      { token: '--background',         value: $tStore('tokens.table.background.class'),        description: $tStore('tokens.table.background.part') },
      { token: '--primary-foreground', value: $tStore('tokens.table.primaryForeground.class'), description: $tStore('tokens.table.primaryForeground.part') },
      { token: '--ring',               value: $tStore('tokens.table.ring.class'),              description: $tStore('tokens.table.ring.part') },
      { token: '--destructive',        value: $tStore('tokens.table.destructive.class'),       description: $tStore('tokens.table.destructive.part') },
      { token: '--foreground',         value: $tStore('tokens.table.foreground.class'),        description: $tStore('tokens.table.foreground.part') },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={customizationCode}
  />

  <!-- ── Acessibilidade ───────────────────────────────────────────────── -->
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
      { key: 'Tab',   description: $tStore('accessibility.keyboard.tab') },
      { key: 'Space', description: $tStore('accessibility.keyboard.space') },
      { key: 'Enter', description: $tStore('accessibility.keyboard.enter') },
    ]}
  />

  <!-- ── Relacionados ──────────────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.checkbox.name'),   description: $tStore('related.items.checkbox.description'),   path: '?path=/docs/ui-checkbox--docs' },
      { name: $tStore('related.items.toggle.name'),     description: $tStore('related.items.toggle.description'),     path: '?path=/docs/ui-toggle--docs' },
      { name: $tStore('related.items.radioGroup.name'), description: $tStore('related.items.radioGroup.description'), path: '?path=/docs/ui-radiogroup--docs' },
      { name: $tStore('related.items.form.name'),       description: $tStore('related.items.form.description'),       path: '?path=/docs/ui-form--docs' },
    ]}
  />

  <!-- ── Notas ─────────────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: $tStore('notes.item1') },
      { title: '', content: $tStore('notes.item2') },
      { title: '', content: $tStore('notes.item3') },
      { title: '', content: $tStore('notes.item4') },
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
      {
        event: 'field_change',
        trigger: $tStore('analytics.table.field_change.trigger'),
        payload: $tStore('analytics.table.field_change.payload'),
      },
    ]}
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
        { criterion: $tStore('testes.accessibility.item1'), level: 'AA',    how: 'axe-core' },
        { criterion: $tStore('testes.accessibility.item2'), level: '1.4.3', how: 'Contrast checker' },
        { criterion: $tStore('testes.accessibility.item3'), level: '2.4.7', how: 'Keyboard test' },
        { criterion: $tStore('testes.accessibility.item4'), level: '4.1.2', how: 'DevTools a11y tree' },
        { criterion: $tStore('testes.accessibility.item5'), level: '4.1.2', how: 'DevTools attribute' },
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
