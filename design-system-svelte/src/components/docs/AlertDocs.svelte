<script lang="ts">
  import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
  import { Info, AlertCircle, CheckCircle2, TriangleAlert } from 'lucide-svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import DocsNav from '@/components/docs/shared/DocsNav.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
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

  // ─── Active section ──────────────────────────────────────────────────────────

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

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";`;
  const codeImportWithIcon = `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-svelte";`;

  const codeDefault = `<Alert>
  <Info aria-hidden="true" class="h-4 w-4" />
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>
    Suas alterações serão aplicadas na próxima sessão.
  </AlertDescription>
</Alert>`;

  const codeDestructive = `<Alert variant="destructive">
  <AlertCircle aria-hidden="true" class="h-4 w-4" />
  <AlertTitle>Erro ao salvar</AlertTitle>
  <AlertDescription>
    Não foi possível salvar. Verifique sua conexão e tente novamente.
  </AlertDescription>
</Alert>`;

  const codeSuccess = `<Alert class="bg-success/10 text-success border-success/30">
  <CheckCircle2 aria-hidden="true" class="h-4 w-4" />
  <AlertTitle>Perfil atualizado</AlertTitle>
  <AlertDescription>
    Suas informações foram salvas com sucesso.
  </AlertDescription>
</Alert>`;

  const codeWarning = `<Alert class="bg-warning/10 text-warning border-warning/30">
  <TriangleAlert aria-hidden="true" class="h-4 w-4" />
  <AlertTitle>Assinatura expirando</AlertTitle>
  <AlertDescription>
    Sua assinatura expira em 3 dias. Renove para evitar interrupções.
  </AlertDescription>
</Alert>`;

  const codeWithoutTitle = `<Alert>
  <Info aria-hidden="true" class="h-4 w-4" />
  <AlertDescription>
    Suas alterações serão aplicadas na próxima sessão.
  </AlertDescription>
</Alert>`;

  const codeCustomizationTokens = `/* Em globals.css — definir tokens semânticos */
:root {
  --success: 142 76% 36%;
  --warning: 38 92% 50%;
}

.dark {
  --success: 142 69% 58%;
  --warning: 48 96% 53%;
}`;

  const interfaceCode = `// Alert
interface AlertProps {
  variant?: 'default' | 'destructive';
  class?: string;
  children?: Snippet;
}

// AlertTitle / AlertDescription aceitam atributos HTML nativos via spread`;
</script>

<div class="ds-docs p-8 max-w-5xl mx-auto">

  <DocsHeader
    title={$tStore('title')}
    description={$tStore('description')}
    category={$tStore('category')}
    type={$tStore('type')}
    installNote="npx shadcn-svelte@latest add alert"
  />

  <div class="flex gap-16 items-start">
    <nav
      aria-label="Navegação das seções do componente"
      class="sticky top-8 w-52 shrink-0 self-start space-y-5"
    >
      <DocsNav
        groups={NAV_GROUPS}
        {activeSection}
      />
    </nav>

    <div class="ds-docs flex-1 min-w-0 space-y-12">

      <!-- ── Demonstração ───────────────────────────────────────────── -->
      <DocsDemonstration title={$tStore('demonstration.title')}>
        {#snippet children()}
          <div class="w-full space-y-3">
            <Alert>
              <Info class="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{$tStore('demonstration.labels.infoTitle')}</AlertTitle>
              <AlertDescription>{$tStore('demonstration.labels.infoDesc')}</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertCircle class="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{$tStore('demonstration.labels.errorTitle')}</AlertTitle>
              <AlertDescription>{$tStore('demonstration.labels.errorDesc')}</AlertDescription>
            </Alert>
            <Alert class="bg-success/10 text-success border-success/30">
              <CheckCircle2 class="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{$tStore('demonstration.labels.successTitle')}</AlertTitle>
              <AlertDescription>{$tStore('demonstration.labels.successDesc')}</AlertDescription>
            </Alert>
            <Alert class="bg-warning/10 text-warning border-warning/30">
              <TriangleAlert class="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{$tStore('demonstration.labels.warningTitle')}</AlertTitle>
              <AlertDescription>{$tStore('demonstration.labels.warningDesc')}</AlertDescription>
            </Alert>
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
            { element: $tStore('usage.uxWriting.table.error.name'),       rules: $tStore('usage.uxWriting.table.error.format'),       do: $tStore('usage.uxWriting.table.error.good'),       dont: $tStore('usage.uxWriting.table.error.bad') },
            { element: $tStore('usage.uxWriting.table.warning.name'),     rules: $tStore('usage.uxWriting.table.warning.format'),     do: $tStore('usage.uxWriting.table.warning.good'),     dont: $tStore('usage.uxWriting.table.warning.bad') },
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
        <Alert>
          <AlertCircle class="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Erro ao salvar</AlertTitle>
          <AlertDescription>Não foi possível salvar. Verifique sua conexão.</AlertDescription>
        </Alert>
      {/snippet}
      {#snippet dontPair1()}
        <Alert><AlertDescription>Salvo!</AlertDescription></Alert>
      {/snippet}
      {#snippet doPair2()}
        <Alert variant="destructive">
          <AlertCircle class="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Erro ao salvar</AlertTitle>
          <AlertDescription>Verifique sua conexão.</AlertDescription>
        </Alert>
      {/snippet}
      {#snippet dontPair2()}
        <Alert variant="destructive">
          <AlertTitle>Erro ao salvar</AlertTitle>
          <AlertDescription>Verifique sua conexão.</AlertDescription>
        </Alert>
      {/snippet}

      <!-- ── Importação ─────────────────────────────────────────────── -->
      <DocsImport
        title={$tStore('import.title')}
        description={$tStore('import.basic')}
        code={codeImportBasic}
        secondaryDescription={$tStore('import.withIcon')}
        secondaryCode={codeImportWithIcon}
      />

      <!-- ── Variantes ──────────────────────────────────────────────── -->
      <DocsVariants
        title={$tStore('variants.title')}
        items={[
          { name: 'default',     description: $tStore('variants.items.default'),                 code: codeDefault,      preview: variantDefault      },
          { name: 'destructive', description: stripHtml($tStore('variants.items.destructive')),  code: codeDestructive,  preview: variantDestructive  },
          { name: 'success',     description: stripHtml($tStore('variants.items.success')),      code: codeSuccess,      preview: variantSuccess      },
          { name: 'warning',     description: stripHtml($tStore('variants.items.warning')),      code: codeWarning,      preview: variantWarning      },
          { name: $tStore('states.withoutTitle.label'), description: $tStore('states.withoutTitle.behavior'), code: codeWithoutTitle, preview: variantWithoutTitle },
        ]}
      />

      {#snippet variantDefault()}
        <Alert class="w-full">
          <Info class="h-4 w-4" aria-hidden="true" />
          <AlertTitle>{$tStore('demonstration.labels.infoTitle')}</AlertTitle>
          <AlertDescription>{$tStore('demonstration.labels.infoDesc')}</AlertDescription>
        </Alert>
      {/snippet}
      {#snippet variantDestructive()}
        <Alert variant="destructive" class="w-full">
          <AlertCircle class="h-4 w-4" aria-hidden="true" />
          <AlertTitle>{$tStore('demonstration.labels.errorTitle')}</AlertTitle>
          <AlertDescription>{$tStore('demonstration.labels.errorDesc')}</AlertDescription>
        </Alert>
      {/snippet}
      {#snippet variantSuccess()}
        <Alert class="w-full bg-success/10 text-success border-success/30">
          <CheckCircle2 class="h-4 w-4" aria-hidden="true" />
          <AlertTitle>{$tStore('demonstration.labels.successTitle')}</AlertTitle>
          <AlertDescription>{$tStore('demonstration.labels.successDesc')}</AlertDescription>
        </Alert>
      {/snippet}
      {#snippet variantWarning()}
        <Alert class="w-full bg-warning/10 text-warning border-warning/30">
          <TriangleAlert class="h-4 w-4" aria-hidden="true" />
          <AlertTitle>{$tStore('demonstration.labels.warningTitle')}</AlertTitle>
          <AlertDescription>{$tStore('demonstration.labels.warningDesc')}</AlertDescription>
        </Alert>
      {/snippet}
      {#snippet variantWithoutTitle()}
        <Alert class="w-full">
          <Info class="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{$tStore('demonstration.labels.infoDesc')}</AlertDescription>
        </Alert>
      {/snippet}

      <!-- ── Estados ────────────────────────────────────────────────── -->
      <DocsStates
        title={$tStore('states.title')}
        cols={{
          state: $tStore('states.cols.state'),
          trigger: $tStore('states.cols.trigger'),
          behavior: $tStore('states.cols.behavior'),
        }}
        items={[
          { label: $tStore('states.complete.label'),      trigger: stripHtml($tStore('states.complete.trigger')),      behavior: $tStore('states.complete.behavior')             },
          { label: $tStore('states.withoutTitle.label'),  trigger: stripHtml($tStore('states.withoutTitle.trigger')),  behavior: $tStore('states.withoutTitle.behavior')         },
          { label: $tStore('states.withoutIcon.label'),   trigger: $tStore('states.withoutIcon.trigger'),              behavior: $tStore('states.withoutIcon.behavior')          },
          { label: $tStore('states.dynamicInsert.label'), trigger: $tStore('states.dynamicInsert.trigger'),            behavior: stripHtml($tStore('states.dynamicInsert.behavior')) },
        ]}
      />

      <!-- ── Propriedades ───────────────────────────────────────────── -->
      <DocsProps
        title={$tStore('props.title')}
        tables={[
          {
            title: $tStore('props.alertTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'variant',  type: '"default" | "destructive"', defaultValue: '"default"', required: 'Não', description: stripHtml($tStore('props.table.variant')) },
              { name: 'class',    type: 'string',                    defaultValue: '—',         required: 'Não', description: $tStore('props.table.className')           },
              { name: 'children', type: 'Snippet',                   defaultValue: '—',         required: 'Não', description: $tStore('props.table.children')            },
            ],
          },
          {
            title: $tStore('props.alertTitleTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Sim', description: $tStore('props.table.children') },
            ],
          },
          {
            title: $tStore('props.alertDescTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Sim', description: $tStore('props.table.children') },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={$tStore('props.extensibilityTitle')}
        extensibilityNotes={$tStore('props.extensibility')}
      />

      <!-- ── Tokens ─────────────────────────────────────────────────── -->
      <DocsTokens
        title={$tStore('tokens.title')}
        cols={{
          token: $tStore('tokens.table.token'),
          value: $tStore('tokens.table.class'),
          description: $tStore('tokens.table.part'),
        }}
        items={[
          { token: '--background',  value: 'bg-background',                                description: $tStore('tokens.table.background')        },
          { token: '--foreground',  value: 'text-foreground',                              description: $tStore('tokens.table.foreground')        },
          { token: '--border',      value: 'border',                                       description: $tStore('tokens.table.border')            },
          { token: '--destructive', value: 'border-destructive/50',                        description: $tStore('tokens.table.destructiveBorder') },
          { token: '--destructive', value: 'text-destructive',                             description: $tStore('tokens.table.destructiveText')   },
          { token: '--success',     value: 'bg-success/10 text-success border-success/30', description: $tStore('tokens.table.success')           },
          { token: '--warning',     value: 'bg-warning/10 text-warning border-warning/30', description: $tStore('tokens.table.warning')           },
          { token: '--radius',      value: 'rounded-lg',                                   description: $tStore('tokens.table.radius')            },
        ]}
        customizationTitle={$tStore('tokens.customizationTitle')}
        customizationCode={codeCustomizationTokens}
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
          { key: 'Tab',   description: $tStore('accessibility.keyboard.tab')        },
          { key: 'Enter', description: $tStore('accessibility.keyboard.enter')      },
          { key: '—',     description: $tStore('accessibility.keyboard.noKeyboard') },
        ]}
      />

      <!-- ── Relacionados ───────────────────────────────────────────── -->
      <DocsRelated
        title={$tStore('related.title')}
        items={[
          { name: 'Sonner',      description: $tStore('related.sonner'),      path: '?path=/docs/ui-sonner--docs'      },
          { name: 'AlertDialog', description: $tStore('related.alertDialog'), path: '?path=/docs/ui-alertdialog--docs' },
          { name: 'Badge',       description: $tStore('related.badge'),       path: '?path=/docs/ui-badge--docs'       },
          { name: 'Progress',    description: $tStore('related.progress'),    path: '?path=/docs/ui-progress--docs'    },
        ]}
      />

      <!-- ── Notas ──────────────────────────────────────────────────── -->
      <DocsNotes
        title={$tStore('notes.title')}
        items={[
          { title: '', content: $tStore('notes.tip1') },
          { title: '', content: $tStore('notes.tip2') },
          { title: '', content: $tStore('notes.tip3') },
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
          { event: $tStore('analytics.table.dismiss'),       trigger: $tStore('analytics.table.dismissTrigger'),       payload: $tStore('analytics.table.dismissPayload')       },
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

    </div>
  </div>
</div>
