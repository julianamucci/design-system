<script lang="ts">
  import { untrack } from 'svelte';
  import AlertDialogDemo from '@/components/docs/AlertDialogDemo.svelte';
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
  import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(alertDialogTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (alertDialogTranslations as unknown as Record<
        string,
        { accessibility?: { screenReader?: Record<string, string> } }
      >)[$locale]?.accessibility?.screenReader ?? {},
    )
      .filter(([key]) => key !== 'title')
      .map(([, value]) => value),
  );

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
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

  // ─── Active section ──────────────────────────────────────────────────────────

  const NAV_GROUPS = $derived.by(() => {
    const tNav = $tNavStore;
    const tContent = $tStore;
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

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'alert-dialog', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";`;

  const codeImportWithTrigger = `import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  // ...
} from "@/components/ui/alert-dialog";`;

  // Os trechos das Variantes mostram o MESMO exemplo do preview ao lado, no
  // idioma da página: rótulos de `demonstration.labels`, nada escrito aqui.
  const codeDestructive = $derived(`<AlertDialog>
  <AlertDialogTrigger>
    {#snippet child({ props })}
      <Button {...props} variant="destructive">${$tStore('demonstration.labels.triggerLabel')}</Button>
    {/snippet}
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>${$tStore('demonstration.labels.title')}</AlertDialogTitle>
      <AlertDialogDescription>
        ${$tStore('demonstration.labels.description')}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>${$tStore('demonstration.labels.cancel')}</AlertDialogCancel>
      <AlertDialogAction variant="destructive">${$tStore('demonstration.labels.action')}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`);

  const codeDefault = $derived(`<AlertDialog>
  <AlertDialogTrigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline">${$tStore('demonstration.labels.neutralTriggerLabel')}</Button>
    {/snippet}
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>${$tStore('demonstration.labels.neutralTitle')}</AlertDialogTitle>
      <AlertDialogDescription>
        ${$tStore('demonstration.labels.neutralDescription')}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>${$tStore('demonstration.labels.cancel')}</AlertDialogCancel>
      <AlertDialogAction>${$tStore('demonstration.labels.neutralAction')}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`);

  // `defaultOpen` não entra: a raiz desta stack não tem a prop — ela seria
  // aceita e ignorada em silêncio. O estado inicial sai do próprio `open`, que
  // é bindável. Snippet didático é o que o leitor copia: uma prop inexistente
  // aqui vira bug de quem consome, não erro de compilação.
  const interfaceCode = `// AlertDialog (Root)
interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  children?: Snippet;
}

// AlertDialogTitle: <h1>…<h6>, aria-level = level
interface TitleProps { level?: 1 | 2 | 3 | 4 | 5 | 6 /* = 2 */; class?: string }

// AlertDialogTrigger / AlertDialogAction / AlertDialogCancel
interface TriggerProps { class?: string; child?: Snippet<[{ props: Record<string, unknown> }]> }
interface ActionProps  { variant?: ButtonVariant /* = "default" */; size?: ButtonSize; onclick?: (e: MouseEvent) => void; class?: string }
interface CancelProps  { variant?: ButtonVariant /* = "outline" */; size?: ButtonSize; onclick?: (e: MouseEvent) => void; class?: string }`;

  const propsTableCols = $derived({
    prop: $tStore('props.table.prop'),
    type: $tStore('props.table.type'),
    default: $tStore('props.table.default'),
    required: $tStore('props.table.required'),
    description: $tStore('props.table.description'),
  });

  // Os dois exemplos da página, só com os rótulos de `demonstration.labels`.
  // Todo preview VIVO — Demonstração, Variantes e Do & Don't — é o
  // `AlertDialogDemo`, que rastreia abertura, confirmação e fechamento; a SEÇÃO
  // (`location`) e a variante dos botões ficam com quem monta cada um.
  const destructiveLabels = $derived({
    triggerLabel: $tStore('demonstration.labels.triggerLabel'),
    title: $tStore('demonstration.labels.title'),
    description: $tStore('demonstration.labels.description'),
    cancelLabel: $tStore('demonstration.labels.cancel'),
    actionLabel: $tStore('demonstration.labels.action'),
  });
  const neutralLabels = $derived({
    triggerLabel: $tStore('demonstration.labels.neutralTriggerLabel'),
    title: $tStore('demonstration.labels.neutralTitle'),
    description: $tStore('demonstration.labels.neutralDescription'),
    cancelLabel: $tStore('demonstration.labels.cancel'),
    actionLabel: $tStore('demonstration.labels.neutralAction'),
  });
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value}>
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration>
    <div class="nds-cluster nds-w-full" data-justify="center" data-spacing="md">
      <AlertDialogDemo {...destructiveLabels} location="docs_demo" triggerVariant="destructive" tone="destructive" />
      <AlertDialogDemo {...neutralLabels} location="docs_demo" triggerVariant="outline" tone="default" />
    </div>
  </DocsDemonstration>

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
    items={[
      $tStore('anatomy.item1'),
      $tStore('anatomy.item2'),
      $tStore('anatomy.item3'),
      $tStore('anatomy.item4'),
      $tStore('anatomy.item5'),
      $tStore('anatomy.item6'),
      $tStore('anatomy.item7'),
      $tStore('anatomy.item8'),
      $tStore('anatomy.item9'),
      $tStore('anatomy.item10'),
    ]}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
  />

  <!-- ── Quando Usar ────────────────────────────────────────────── -->
  <DocsWhenToUse
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
        { element: $tStore('usage.uxWriting.table.cancel.name'),      rules: $tStore('usage.uxWriting.table.cancel.format'),      do: $tStore('usage.uxWriting.table.cancel.good'),      dont: $tStore('usage.uxWriting.table.cancel.bad') },
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
        stripHtml($tStore('usage.dont.item1')),
        stripHtml($tStore('usage.dont.item2')),
        stripHtml($tStore('usage.dont.item3')),
        $tStore('usage.dont.item4'),
      ],
    }}
  />

  <!-- ── Do & Don't ─────────────────────────────────────────────── -->
  <DocsDoDont
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


  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryDescription={$tStore('import.withTrigger')}
    secondaryCode={codeImportWithTrigger}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    note={stripHtml($tStore('variants.note'))}
    items={[
      { name: 'destructive', description: stripHtml($tStore('variants.items.destructive')), code: codeDestructive, preview: variantDestructive },
      { name: 'default',     description: stripHtml($tStore('variants.items.default')),     code: codeDefault,     preview: variantDefault     },
    ]}
  />


  <!-- ── Configurações (States) ─────────────────────────────────── -->
  <DocsStates
    cols={{
      state: $tStore('states.cols.state'),
      trigger: toPlainText($tStore('states.cols.trigger')),
      behavior: toPlainText($tStore('states.cols.behavior')),
    }}
    items={[
      { label: $tStore('states.closed.label'),     trigger: toPlainText($tStore('states.closed.trigger')),     behavior: toPlainText($tStore('states.closed.behavior'))},
      { label: $tStore('states.open.label'),       trigger: toPlainText($tStore('states.open.trigger')),       behavior: toPlainText($tStore('states.open.behavior'))},
      { label: $tStore('states.confirmed.label'),  trigger: toPlainText($tStore('states.confirmed.trigger')),  behavior: toPlainText($tStore('states.confirmed.behavior'))},
      { label: $tStore('states.cancelled.label'),  trigger: toPlainText($tStore('states.cancelled.trigger')),  behavior: toPlainText($tStore('states.cancelled.behavior'))},
      { label: $tStore('states.controlled.label'), trigger: toPlainText($tStore('states.controlled.trigger')), behavior: toPlainText($tStore('states.controlled.behavior'))},
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    tables={[
      {
        title: $tStore('props.rootTitle'),
        cols: propsTableCols,
        items: [
          { name: 'open',         type: 'boolean',                     defaultValue: '—',      required: $tNavStore('common.no'), description: toPlainText($tStore('props.table.open'))         },
          // `defaultOpen` não entra: não existe na API desta stack — a raiz
          // expõe `open`, `onOpenChange` e `onOpenChangeComplete`, e a prop era
          // aceita e ignorada em silêncio. O estado inicial sai do próprio
          // `open`, que é bindável. Documentar prop que o componente ignora é
          // prometer o que o produto não cumpre.
          { name: 'onOpenChange', type: '(open: boolean) => void',     defaultValue: '—',      required: $tNavStore('common.no'), description: toPlainText($tStore('props.table.onOpenChange'))},
          { name: 'children',     type: 'Snippet',                     defaultValue: '—',      required: $tNavStore('common.yes'), description: toPlainText($tStore('props.table.children'))    },
        ],
      },
      {
        title: $tStore('props.triggerTitle'),
        cols: propsTableCols,
        items: [
          { name: 'child',    type: 'Snippet<[{ props }]>', defaultValue: '—', required: $tNavStore('common.no'), description: toPlainText($tStore('props.table.asChild'))  },
          { name: 'class',    type: 'string',               defaultValue: '—', required: $tNavStore('common.no'), description: $tStore('props.table.className')            },
          { name: 'children', type: 'Snippet',              defaultValue: '—', required: $tNavStore('common.no'), description: toPlainText($tStore('props.table.children')) },
        ],
      },
      {
        title: $tStore('props.contentTitle'),
        cols: propsTableCols,
        items: [
          { name: 'class',    type: 'string',  defaultValue: '—', required: $tNavStore('common.no'), description: $tStore('props.table.className')            },
          { name: 'children', type: 'Snippet', defaultValue: '—', required: $tNavStore('common.yes'), description: toPlainText($tStore('props.table.children')) },
        ],
      },
      {
        title: $tStore('props.actionTitle'),
        cols: propsTableCols,
        items: [
          { name: 'onclick',  type: '(e: MouseEvent) => void', defaultValue: '—', required: $tNavStore('common.no'), description: toPlainText($tStore('props.table.onClick'))  },
          { name: 'class',    type: 'string',                  defaultValue: '—', required: $tNavStore('common.no'), description: $tStore('props.table.className')            },
          { name: 'children', type: 'Snippet',                 defaultValue: '—', required: $tNavStore('common.yes'), description: toPlainText($tStore('props.table.children')) },
        ],
      },
      {
        title: $tStore('props.cancelTitle'),
        cols: propsTableCols,
        items: [
          { name: 'onclick',  type: '(e: MouseEvent) => void', defaultValue: '—', required: $tNavStore('common.no'), description: toPlainText($tStore('props.table.onClick'))  },
          { name: 'class',    type: 'string',                  defaultValue: '—', required: $tNavStore('common.no'), description: $tStore('props.table.className')            },
          { name: 'children', type: 'Snippet',                 defaultValue: '—', required: $tNavStore('common.yes'), description: toPlainText($tStore('props.table.children')) },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={stripHtml($tStore('props.extensibility'))}
  />

  <!-- ── Tokens ─────────────────────────────────────────────────── -->
  <DocsTokens
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      // O véu lê `--overlay`, o token de cor da camada; o alfa de 0.8 é do uso.
      { token: '--overlay',                      value: '.nds-alert-dialog-overlay',     description: $tStore('tokens.table.overlayBg')             },
      { token: '--background',             value: '.nds-alert-dialog-content',     description: $tStore('tokens.table.contentBg')             },
      { token: '--foreground',             value: '.nds-alert-dialog-content',     description: $tStore('tokens.table.contentForeground')     },
      { token: '--border',                 value: '.nds-alert-dialog-content',     description: $tStore('tokens.table.border')                },
      { token: '--radius-card',            value: '.nds-alert-dialog-content',     description: $tStore('tokens.table.radius')                },
      { token: '--elevation-xl',           value: '.nds-alert-dialog-content',     description: $tStore('tokens.table.elevation')             },
      { token: '--spacing-6',              value: '.nds-alert-dialog-content',     description: $tStore('tokens.table.padding')               },
      { token: '--muted-foreground',       value: '.nds-alert-dialog-description', description: $tStore('tokens.table.mutedForeground')       },
      { token: '--muted',                  value: '.nds-alert-dialog-media',       description: $tStore('tokens.table.mediaBg')               },
      { token: '--radius-md',              value: '.nds-alert-dialog-media',       description: $tStore('tokens.table.mediaRadius')           },
      // `--destructive-foreground` não tem linha porque não tem leitor: a variante
      // destrutiva é soft (fundo suave com o rótulo na PRÓPRIA cor semântica), e
      // nenhuma regra de button.css lê o par `-foreground`. Ver button.css:16-18.
      { token: '--destructive',            value: '.nds-button-destructive',       description: $tStore('tokens.table.destructive')           },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    screenReaderTitle={$tNavStore('common.screenReader')}
    screenReaderItems={screenReaderItems}
    summary={stripHtml($tStore('accessibility.summary'))}
    items={[
      $tStore('accessibility.item1'),
      $tStore('accessibility.item2'),
      $tStore('accessibility.item3'),
      $tStore('accessibility.item4'),
      $tStore('accessibility.item5'),
      $tStore('accessibility.item6'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboardTitle')}
    keyboardItems={[
      { key: 'Tab',       description: $tStore('accessibility.keyboard.tab')       },
      { key: 'Shift+Tab', description: $tStore('accessibility.keyboard.shiftTab')  },
      { key: 'Enter',     description: $tStore('accessibility.keyboard.enter')     },
      { key: 'Space',     description: $tStore('accessibility.keyboard.space')     },
      { key: 'Escape',    description: $tStore('accessibility.keyboard.escape')    },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    items={[
      { name: 'Dialog', description: $tStore('related.dialog'), path: '?path=/docs/components-overlay-dialog--docs' },
      { name: 'Sonner', description: $tStore('related.sonner'), path: '?path=/docs/components-feedback-sonner--docs' },
      { name: 'Alert',  description: $tStore('related.alert'),  path: '?path=/docs/components-feedback-alert--docs'  },
      { name: 'Button', description: $tStore('related.button'), path: '?path=/docs/components-form-button--docs' },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    items={[
      { title: '', content: $tStore('notes.tip1') },
      { title: '', content: $tStore('notes.tip2') },
      { title: '', content: $tStore('notes.tip3') },
      { title: '', content: $tStore('notes.tip4') },
    ]}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <DocsAnalytics
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: toPlainText($tStore('analytics.table.trigger')),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: $tStore('analytics.table.open'),          trigger: toPlainText($tStore('analytics.table.openTrigger')),          payload: $tStore('analytics.table.openPayload')          },
      { event: $tStore('analytics.table.confirm'),       trigger: toPlainText($tStore('analytics.table.confirmTrigger')),       payload: $tStore('analytics.table.confirmPayload')       },
      { event: $tStore('analytics.table.close'),         trigger: toPlainText($tStore('analytics.table.closeTrigger')),         payload: $tStore('analytics.table.closePayload')         },
      { event: $tStore('analytics.table.pageView'),      trigger: toPlainText($tStore('analytics.table.pageViewTrigger')),      payload: $tStore('analytics.table.pageViewPayload')      },
      { event: $tStore('analytics.table.sectionViewed'), trigger: toPlainText($tStore('analytics.table.sectionViewedTrigger')), payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),    trigger: toPlainText($tStore('analytics.table.langSwitchTrigger')),    payload: $tStore('analytics.table.langSwitchPayload')    },
    ]}
  />

  <!-- ── Testes ─────────────────────────────────────────────────── -->
  <DocsTestes
    functional={{
      title: $tStore('testes.functional.title'),
      cols: {
        action: $tNavStore('common.userAction'),
        result: $tNavStore('common.expectedResult'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
        action: $tStore(`testes.functional.item${i}.action`),
        result: $tStore(`testes.functional.item${i}.result`),
        priority: localPriority($tStore(`testes.functional.item${i}.priority`), $tNavStore),
      })),
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => ({
        criterion: $tStore(`testes.accessibility.item${i}.criterion`),
        level: $tStore(`testes.accessibility.item${i}.level`),
        how: $tStore(`testes.accessibility.item${i}.how`),
      })),
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
        story: $tStore(`testes.visual.item${i}.story`),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />

  <!--
    Previews do Do & Don't e das Variantes: o `AlertDialogDemo`, vivo e
    rastreado, com a seção de cada um.
  -->
  <!-- Par 1 — só a REDAÇÃO muda; a severidade é a mesma dos dois lados. -->
  {#snippet doPair1()}
    <AlertDialogDemo {...destructiveLabels} location="docs_do_dont" triggerId="pair1-do" triggerVariant="destructive" tone="destructive" />
  {/snippet}
  {#snippet dontPair1()}
    <AlertDialogDemo
      triggerLabel={destructiveLabels.triggerLabel}
      title={$tStore('doDont.pair1.dontExample.title')}
      description={$tStore('doDont.pair1.dontExample.description')}
      cancelLabel={$tStore('doDont.pair1.dontExample.cancel')}
      actionLabel={$tStore('doDont.pair1.dontExample.action')}
      location="docs_do_dont"
      triggerId="pair1-dont"
      triggerVariant="destructive"
      tone="destructive"
    />
  {/snippet}
  <!--
    Par 2 — só a VARIANTE da ação muda; texto igual e Cancelar nos dois lados,
    porque rodapé sem Cancelar violaria o contrato (C7), e não é o que o par
    ensina.
  -->
  {#snippet doPair2()}
    <AlertDialogDemo {...destructiveLabels} location="docs_do_dont" triggerId="pair2-do" triggerVariant="destructive" tone="destructive" />
  {/snippet}
  {#snippet dontPair2()}
    <AlertDialogDemo {...destructiveLabels} location="docs_do_dont" triggerId="pair2-dont" triggerVariant="destructive" tone="default" />
  {/snippet}
  {#snippet variantDestructive()}
    <AlertDialogDemo {...destructiveLabels} location="docs_variantes" triggerVariant="destructive" tone="destructive" />
  {/snippet}
  {#snippet variantDefault()}
    <AlertDialogDemo {...neutralLabels} location="docs_variantes" triggerVariant="outline" tone="default" />
  {/snippet}
</DocsPageLayout>
