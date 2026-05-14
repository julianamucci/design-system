<script lang="ts">
  import { toast } from 'svelte-sonner';
  import { Toaster } from '@/components/ui/sonner';
  import { Button } from '@/components/ui/button';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import sonnerTranslations from '@shared/content/sonner/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(sonnerTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
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
        { id: 'importacao',   label: tNav('nav.import')   },
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

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'sonner', locale: $locale });
  });
  $effect(() => section.attach());

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function stripHtml(s: string) {
    return s.replace(/<[^>]*>/g, '');
  }

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Toast triggers ───────────────────────────────────────────────────────────

  function fireDefault() { toast($tStore('demonstration.labels.default')); }
  function fireSuccess() { toast.success($tStore('demonstration.labels.success')); }
  function fireError()   { toast.error($tStore('demonstration.labels.error')); }
  function fireWarning() { toast.warning($tStore('demonstration.labels.warning')); }
  function fireInfo()    { toast.info($tStore('demonstration.labels.info')); }
  function fireLoading() { toast.loading($tStore('demonstration.labels.loading')); }

  function fireWithDescription() {
    toast.success($tStore('demonstration.labels.withDescription'), {
      description: $tStore('demonstration.labels.withDescriptionDesc'),
    });
  }

  function fireWithAction() {
    toast($tStore('demonstration.labels.withAction'), {
      action: {
        label: $tStore('demonstration.labels.withActionLabel'),
        onClick: () => track('toast_action_click', { label: $tStore('demonstration.labels.withActionLabel'), component: 'toast', location: 'docs-demonstration' }),
      },
    });
  }

  function firePromise() {
    const promise = new Promise<void>((resolve) => setTimeout(resolve, 2000));
    toast.promise(promise, {
      loading: $tStore('demonstration.labels.promiseLoading'),
      success: $tStore('demonstration.labels.promise'),
      error: $tStore('demonstration.labels.promiseError'),
    });
  }

  function firePersistent() {
    toast.error($tStore('demonstration.labels.persistent'), { duration: Infinity, dismissible: true });
  }

  // ─── Code strings ─────────────────────────────────────────────────────────────

  const codeImport = `import { Toaster } from "@/components/ui/sonner";
import { toast } from "svelte-sonner";`;

  const codeSetup = `<!-- App.svelte — adicionar uma única vez no root -->
<Toaster position="top-right" richColors />`;

  const codeDefault = `toast("Código copiado.")`;
  const codeSuccess = `toast.success("Alterações salvas.")`;
  const codeError   = `toast.error("Não foi possível salvar. Tente novamente.")`;
  const codeWarning = `toast.warning("Sua sessão expira em 5 minutos.")`;
  const codeInfo    = `toast.info("Nova versão disponível.")`;

  const codeWithDescription = `toast.success("Preferências atualizadas.", {
  description: "Suas configurações foram salvas e entrarão em vigor na próxima sessão.",
})`;

  const codeWithAction = `toast("Item excluído.", {
  action: {
    label: "Desfazer",
    onClick: () => { /* restaurar item */ },
  },
})`;

  const codePromise = `const promise = uploadFile(file);

toast.promise(promise, {
  loading: "Enviando arquivo...",
  success: "Arquivo enviado com sucesso.",
  error: "Erro ao enviar. Tente novamente.",
})`;

  const codePersistent = `toast.error("Falha crítica no servidor.", {
  duration: Infinity,
  dismissible: true,
})`;

  const codeTokens = `/* Customizar via CSS variables no globals.css */
:root {
  --normal-bg: var(--popover);
  --normal-text: var(--popover-foreground);
  --normal-border: var(--border);
  --border-radius: var(--radius);
}`;

  const interfaceCode = `interface ToasterProps {
  position?:     "top-right" | "top-left" | "top-center" | "bottom-right" | "bottom-left" | "bottom-center";
  richColors?:   boolean;
  expand?:       boolean;
  duration?:     number;
  theme?:        "light" | "dark" | "system";
  icons?:        ToastIcons;
  toastOptions?: ToastOptions;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value}>
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add sonner"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div style="contain: layout" class="flex flex-wrap gap-2">
        <Toaster position="top-right" richColors />
        <Button variant="outline" onclick={fireDefault}
          data-track="docs_demo_click"
          data-track-component="sonner"
          data-track-element-id="trigger-default"
          data-track-label={$tStore('demonstration.labels.triggerDefault')}>
          {$tStore('demonstration.labels.triggerDefault')}
        </Button>
        <Button variant="outline" onclick={fireSuccess}
          data-track="docs_demo_click"
          data-track-component="sonner"
          data-track-element-id="trigger-success"
          data-track-label={$tStore('demonstration.labels.triggerSuccess')}>
          {$tStore('demonstration.labels.triggerSuccess')}
        </Button>
        <Button variant="outline" onclick={fireError}
          data-track="docs_demo_click"
          data-track-component="sonner"
          data-track-element-id="trigger-error"
          data-track-label={$tStore('demonstration.labels.triggerError')}>
          {$tStore('demonstration.labels.triggerError')}
        </Button>
        <Button variant="outline" onclick={fireWarning}
          data-track="docs_demo_click"
          data-track-component="sonner"
          data-track-element-id="trigger-warning"
          data-track-label={$tStore('demonstration.labels.triggerWarning')}>
          {$tStore('demonstration.labels.triggerWarning')}
        </Button>
        <Button variant="outline" onclick={fireInfo}
          data-track="docs_demo_click"
          data-track-component="sonner"
          data-track-element-id="trigger-info"
          data-track-label={$tStore('demonstration.labels.triggerInfo')}>
          {$tStore('demonstration.labels.triggerInfo')}
        </Button>
        <Button variant="outline" onclick={fireLoading}
          data-track="docs_demo_click"
          data-track-component="sonner"
          data-track-element-id="trigger-loading"
          data-track-label={$tStore('demonstration.labels.triggerLoading')}>
          {$tStore('demonstration.labels.triggerLoading')}
        </Button>
        <Button variant="outline" onclick={fireWithDescription}
          data-track="docs_demo_click"
          data-track-component="sonner"
          data-track-element-id="trigger-with-description"
          data-track-label={$tStore('demonstration.labels.triggerWithDescription')}>
          {$tStore('demonstration.labels.triggerWithDescription')}
        </Button>
        <Button variant="outline" onclick={fireWithAction}
          data-track="docs_demo_click"
          data-track-component="sonner"
          data-track-element-id="trigger-with-action"
          data-track-label={$tStore('demonstration.labels.triggerWithAction')}>
          {$tStore('demonstration.labels.triggerWithAction')}
        </Button>
        <Button variant="outline" onclick={firePromise}
          data-track="docs_demo_click"
          data-track-component="sonner"
          data-track-element-id="trigger-promise"
          data-track-label={$tStore('demonstration.labels.triggerPromise')}>
          {$tStore('demonstration.labels.triggerPromise')}
        </Button>
        <Button variant="outline" onclick={firePersistent}
          data-track="docs_demo_click"
          data-track-component="sonner"
          data-track-element-id="trigger-persistent"
          data-track-label={$tStore('demonstration.labels.triggerPersistent')}>
          {$tStore('demonstration.labels.triggerPersistent')}
        </Button>
      </div>
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
      $tStore('anatomy.item5'),
      $tStore('anatomy.item6'),
      $tStore('anatomy.item7'),
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
        $tStore('usage.guidelines.item1'),
        $tStore('usage.guidelines.item2'),
        $tStore('usage.guidelines.item3'),
        $tStore('usage.guidelines.item4'),
        $tStore('usage.guidelines.item5'),
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
        { element: $tStore('usage.uxWriting.table.title.name'),       rules: $tStore('usage.uxWriting.table.title.format'),       do: $tStore('usage.uxWriting.table.title.good'),       dont: $tStore('usage.uxWriting.table.title.bad') },
        { element: $tStore('usage.uxWriting.table.description.name'), rules: $tStore('usage.uxWriting.table.description.format'), do: $tStore('usage.uxWriting.table.description.good'), dont: $tStore('usage.uxWriting.table.description.bad') },
        { element: $tStore('usage.uxWriting.table.action.name'),      rules: $tStore('usage.uxWriting.table.action.format'),      do: $tStore('usage.uxWriting.table.action.good'),      dont: $tStore('usage.uxWriting.table.action.bad') },
        { element: $tStore('usage.uxWriting.table.error.name'),       rules: $tStore('usage.uxWriting.table.error.format'),       do: $tStore('usage.uxWriting.table.error.good'),       dont: $tStore('usage.uxWriting.table.error.bad') },
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
    <div style="contain: layout" class="relative flex min-h-16 items-center justify-center">
      <Button variant="outline" onclick={() => toast.success('Alterações salvas.')}>
        toast.success
      </Button>
      <Toaster position="top-right" richColors />
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div style="contain: layout" class="relative flex min-h-16 items-center justify-center">
      <Button variant="outline" onclick={() => toast.error('Erro crítico! O sistema falhou completamente.')}>
        toast.error (erro crítico)
      </Button>
      <Toaster position="top-right" richColors />
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div style="contain: layout" class="relative flex min-h-16 items-center justify-center">
      <Button variant="outline" onclick={() => {
        const p = new Promise<void>((r) => setTimeout(r, 1500));
        toast.promise(p, { loading: 'Salvando...', success: 'Salvo.', error: 'Erro.' });
      }}>
        toast.promise
      </Button>
      <Toaster position="top-right" richColors />
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div style="contain: layout" class="relative flex min-h-16 items-center justify-center">
      <Button variant="outline" onclick={() => toast.error('Campo obrigatório não preenchido.')}>
        toast (erro de campo)
      </Button>
      <Toaster position="top-right" richColors />
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImport}
    secondaryDescription={null}
    secondaryCode={codeSetup}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    items={[
      { name: 'default', description: stripHtml($tStore('variants.items.default')), code: codeDefault, preview: variantDefault },
      { name: 'success', description: stripHtml($tStore('variants.items.success')), code: codeSuccess, preview: variantSuccess },
      { name: 'error',   description: stripHtml($tStore('variants.items.error')),   code: codeError,   preview: variantError   },
      { name: 'warning', description: stripHtml($tStore('variants.items.warning')), code: codeWarning, preview: variantWarning },
      { name: 'info',    description: stripHtml($tStore('variants.items.info')),    code: codeInfo,    preview: variantInfo    },
    ]}
  />

  {#snippet variantDefault()}
    <div style="contain: layout" class="relative flex min-h-16 items-center justify-center">
      <Button variant="outline" onclick={() => toast('Código copiado.')}>Disparar</Button>
      <Toaster position="top-right" />
    </div>
  {/snippet}
  {#snippet variantSuccess()}
    <div style="contain: layout" class="relative flex min-h-16 items-center justify-center">
      <Button variant="outline" onclick={() => toast.success('Alterações salvas.')}>Disparar</Button>
      <Toaster position="top-right" richColors />
    </div>
  {/snippet}
  {#snippet variantError()}
    <div style="contain: layout" class="relative flex min-h-16 items-center justify-center">
      <Button variant="outline" onclick={() => toast.error('Não foi possível salvar. Tente novamente.')}>Disparar</Button>
      <Toaster position="top-right" richColors />
    </div>
  {/snippet}
  {#snippet variantWarning()}
    <div style="contain: layout" class="relative flex min-h-16 items-center justify-center">
      <Button variant="outline" onclick={() => toast.warning('Sua sessão expira em 5 minutos.')}>Disparar</Button>
      <Toaster position="top-right" richColors />
    </div>
  {/snippet}
  {#snippet variantInfo()}
    <div style="contain: layout" class="relative flex min-h-16 items-center justify-center">
      <Button variant="outline" onclick={() => toast.info('Nova versão disponível.')}>Disparar</Button>
      <Toaster position="top-right" richColors />
    </div>
  {/snippet}

  <!-- ── Composições ───────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tNavStore('common.state') ?? 'Estado',
      trigger: $tNavStore('common.trigger') ?? 'Gatilho',
      behavior: $tNavStore('common.behavior') ?? 'Comportamento',
    }}
    items={[
      { label: $tStore('states.items.withDescription.label'), trigger: 'toast.success(msg, { description })', behavior: $tStore('states.items.withDescription.description') },
      { label: $tStore('states.items.withAction.label'),      trigger: 'toast(msg, { action: { label, onClick } })',   behavior: stripHtml($tStore('states.items.withAction.description'))      },
      { label: $tStore('states.items.promise.label'),         trigger: 'toast.promise(promise, { loading, success, error })', behavior: stripHtml($tStore('states.items.promise.description'))         },
      { label: $tStore('states.items.persistent.label'),      trigger: 'toast.error(msg, { duration: Infinity })',   behavior: stripHtml($tStore('states.items.persistent.description'))      },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: $tStore('props.toasterTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'position',     type: '"top-right" | "top-left" | "top-center" | "bottom-right" | "bottom-left" | "bottom-center"', defaultValue: '"bottom-right"', required: 'Não', description: stripHtml($tStore('props.table.position'))     },
          { name: 'richColors',   type: 'boolean',                                                                                    defaultValue: 'false',         required: 'Não', description: stripHtml($tStore('props.table.richColors'))   },
          { name: 'expand',       type: 'boolean',                                                                                    defaultValue: 'false',         required: 'Não', description: stripHtml($tStore('props.table.expand'))       },
          { name: 'duration',     type: 'number',                                                                                     defaultValue: '4000',          required: 'Não', description: stripHtml($tStore('props.table.duration'))     },
          { name: 'theme',        type: '"light" | "dark" | "system"',                                                               defaultValue: '"system"',      required: 'Não', description: stripHtml($tStore('props.table.theme'))        },
          { name: 'icons',        type: 'ToastIcons',                                                                                 defaultValue: '—',             required: 'Não', description: stripHtml($tStore('props.table.icons'))        },
          { name: 'toastOptions', type: 'ToastOptions',                                                                               defaultValue: '—',             required: 'Não', description: stripHtml($tStore('props.table.toastOptions')) },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
  />

  <!-- ── Tokens ─────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.value'),
      description: $tStore('tokens.table.description'),
    }}
    items={[
      { token: '--normal-bg',     value: 'var(--color-popover)',            description: $tStore('tokens.table.normalBg')     },
      { token: '--normal-text',   value: 'var(--color-popover-foreground)', description: $tStore('tokens.table.normalText')   },
      { token: '--normal-border', value: 'var(--color-border)',             description: $tStore('tokens.table.normalBorder') },
      { token: '--border-radius', value: 'var(--radius)',                   description: $tStore('tokens.table.borderRadius') },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeTokens}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
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
    keyboardTitle={$tStore('accessibility.keyboardTitle')}
    keyboardItems={[
      { key: 'Tab',    description: $tStore('accessibility.keyboard.tab')         },
      { key: 'Enter',  description: $tStore('accessibility.keyboard.enter')       },
      { key: 'Escape', description: $tStore('accessibility.keyboard.escape')      },
      { key: '—',      description: $tStore('accessibility.keyboard.noKeyboard')  },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'Alert',        description: $tStore('related.alert'),        path: '?path=/docs/ui-alert--docs'        },
      { name: 'AlertDialog',  description: $tStore('related.alertDialog'),  path: '?path=/docs/ui-alertdialog--docs'  },
      { name: 'Badge',        description: $tStore('related.badge'),        path: '?path=/docs/ui-badge--docs'        },
      { name: 'Progress',     description: $tStore('related.progress'),     path: '?path=/docs/ui-progress--docs'     },
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
      { title: '', content: $tStore('notes.item5') },
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
      { event: $tStore('analytics.table.actionClick'),   trigger: $tStore('analytics.table.actionClickTrigger'),   payload: $tStore('analytics.table.actionClickPayload')   },
      { event: $tStore('analytics.table.pageView'),      trigger: $tStore('analytics.table.pageViewTrigger'),      payload: $tStore('analytics.table.pageViewPayload')      },
      { event: $tStore('analytics.table.sectionViewed'), trigger: $tStore('analytics.table.sectionViewedTrigger'), payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),    trigger: $tStore('analytics.table.langSwitchTrigger'),    payload: $tStore('analytics.table.langSwitchPayload')    },
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
      items: [
        { action: $tStore('testes.functional.item1.action'), result: $tStore('testes.functional.item1.result'), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item2.action'), result: $tStore('testes.functional.item2.result'), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item3.action'), result: $tStore('testes.functional.item3.result'), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item4.action'), result: $tStore('testes.functional.item4.result'), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item5.action'), result: $tStore('testes.functional.item5.result'), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item6.action'), result: $tStore('testes.functional.item6.result'), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item7.action'), result: $tStore('testes.functional.item7.result'), priority: localPriority($tStore('testes.functional.item7.priority'), $tNavStore) },
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
        { criterion: $tStore('testes.accessibility.item1.criterion'), level: $tStore('testes.accessibility.item1.level'), how: $tStore('testes.accessibility.item1.how') },
        { criterion: $tStore('testes.accessibility.item2.criterion'), level: $tStore('testes.accessibility.item2.level'), how: $tStore('testes.accessibility.item2.how') },
        { criterion: $tStore('testes.accessibility.item3.criterion'), level: $tStore('testes.accessibility.item3.level'), how: $tStore('testes.accessibility.item3.how') },
        { criterion: $tStore('testes.accessibility.item4.criterion'), level: $tStore('testes.accessibility.item4.level'), how: $tStore('testes.accessibility.item4.how') },
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
