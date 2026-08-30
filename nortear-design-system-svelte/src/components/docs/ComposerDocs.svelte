<script lang="ts">
  import { untrack } from 'svelte';
  import { Composer, type ComposerLabels } from '@/components/ui/composer';
  import {
    attachLabelFor,
    composerLabelsFor,
    textOfLength,
  } from '@/components/ui/composer/composer.fixtures';
  import { Button } from '@/components/ui/button';
  import { Separator } from '@/components/ui/separator';
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
  import composerTranslations from '@shared/content/composer/translations.json';
  import { toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  // A ÚNICA linha sobrescrita é o TIPO de `railStart`, e por um motivo de API: o
  // conteúdo compartilhado descreve o trilho na API do primitivo de referência,
  // onde os controles chegam como lista de elementos. Aqui eles chegam como
  // trecho de marcação. O nome da prop é o mesmo nas duas, então só o tipo
  // diverge.
  const { tStore } = useTranslation(composerTranslations, {
    '*': {
      'props.table.railStart.type': 'Snippet',
      // Aqui o aviso de mudança não é um callback: é a metade de escrita do
      // vínculo, e quem consome o declara como vínculo.
      'props.table.onInput.name': 'bind:value',
      'props.table.onInput.type': 'string',
    },
  });

  const labels = $derived(composerLabelsFor($locale));
  const attach = $derived(attachLabelFor($locale));

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (composerTranslations as unknown as Record<
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
      componentSlug: 'composer',
    });
    track('docs_page_view', {
      component_name: 'composer',
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

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'composer', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Exemplos ────────────────────────────────────────────────────────────────

  const DEMO_LIMIT = 120;
  const NEAR_LIMIT_TEXT = textOfLength(Math.ceil(DEMO_LIMIT * 0.95));

  const SUBMIT_MODES = ['enter', 'modifier'] as const;

  /** O contraexemplo do primeiro par: o botão que muda de forma sem mudar de nome. */
  const WORDLESS_STOP: ComposerLabels = $derived({ ...labels, stop: labels.submit });

  /** O contraexemplo do segundo par: o limite que fica só para os olhos. */
  const SILENT_LIMIT: ComposerLabels = $derived({ ...labels, limit: '' });

  // ─── Code strings ────────────────────────────────────────────────────────────

  const interfaceCode = `interface ComposerProps {
  labels: ComposerLabels;
  value?: string;
  rows?: number;
  maxLength?: number;
  submitOn?: 'enter' | 'modifier';
  running?: boolean;
  disabled?: boolean;
  class?: string;
}

// O TEXTO é uma prop VINCULÁVEL, e não um método: \`bind:value\`. Sem vínculo o
// componente funciona sozinho; com ele, é por ali que um rascunho volta.
// O estado de geração é a prop \`running\` — quem sabe é quem consome.

// O que sai do componente:
//   onSubmit — o texto pedido, sem espaços nas pontas
//   onStop   — alguém pediu para interromper a geração

// A marcação que quem consome fornece entra por trecho:
//   railStart — os controles do início do trilho`;
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
  {#snippet demoRail()}
    <Button variant="ghost" size="sm">{attach}</Button>
  {/snippet}

  <DocsDemonstration title={$tStore('demonstration.title')} componentSlug="composer">
    <div class="nds-stack nds-w-full" data-spacing="lg">
      <!--
        Separador ENTRE os exemplos, e não em volta de cada um: o composer não
        tem moldura externa, e quatro empilhados sem linha viram um formulário
        só. A estrutura para quem ouve vem da legenda de cada exemplo, não da
        linha.
      -->
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.basic')}
        </p>
        <Composer {labels} />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.running')}
        </p>
        <Composer {labels} value={$tStore('labels.placeholder')} running />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.limit')}
        </p>
        <Composer {labels} maxLength={DEMO_LIMIT} value={NEAR_LIMIT_TEXT} />
      </div>

      <Separator />

      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p class="nds-text-caption nds-text-muted-foreground">
          {$tStore('demonstration.labels.rail')}
        </p>
        <Composer {labels} railStart={demoRail} />
      </div>
    </div>
  </DocsDemonstration>

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
    title={$tStore('anatomy.title')}
    items={[1, 2, 3, 4, 5].map(i => $tStore(`anatomy.item${i}`))}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
    language="html"
  />

  <!-- ── Quando Usar ────────────────────────────────────────────── -->
  <DocsWhenToUse
    title={$tStore('usage.title')}
    guidelines={{
      title: $tStore('usage.guidelines.title'),
      items: [1, 2, 3, 4, 5].map(i => $tStore(`usage.guidelines.item${i}`)),
    }}
    scenarios={{
      title: $tStore('usage.scenarios.title'),
      cols: {
        scenario: $tStore('usage.scenarios.cols.scenario'),
        use: $tStore('usage.scenarios.cols.use'),
        alternative: $tStore('usage.scenarios.cols.alternative'),
      },
      items: [1, 2, 3, 4, 5].map(i => ({
        s: $tStore(`usage.scenarios.item${i}.s`),
        u: $tStore(`usage.scenarios.item${i}.u`),
        a: toPlainText($tStore(`usage.scenarios.item${i}.a`)),
      })),
    }}
    uxWriting={{
      title: $tStore('usage.uxWriting.title'),
      cols: {
        element: $tStore('usage.uxWriting.table.element'),
        rules: $tStore('usage.uxWriting.table.rules'),
        do: $tStore('usage.uxWriting.table.correct'),
        dont: $tStore('usage.uxWriting.table.avoid'),
      },
      items: ['placeholder', 'submit', 'stop', 'hint'].map(k => ({
        element: $tStore(`usage.uxWriting.table.${k}.name`),
        rules: $tStore(`usage.uxWriting.table.${k}.format`),
        do: $tStore(`usage.uxWriting.table.${k}.good`),
        dont: $tStore(`usage.uxWriting.table.${k}.bad`),
      })),
    }}
    do={{
      title: $tStore('usage.do.title'),
      items: [1, 2, 3, 4].map(i => $tStore(`usage.do.item${i}`)),
    }}
    dont={{
      title: $tStore('usage.dont.title'),
      items: [1, 2, 3, 4].map(i => $tStore(`usage.dont.item${i}`)),
    }}
  />

  <!-- ── Do & Don't ─────────────────────────────────────────────── -->
  {#snippet doPair1()}
    <Composer {labels} value="…" running />
  {/snippet}
  {#snippet dontPair1()}
    <Composer labels={WORDLESS_STOP} value="…" running />
  {/snippet}
  {#snippet doPair2()}
    <Composer {labels} maxLength={DEMO_LIMIT} value={NEAR_LIMIT_TEXT} />
  {/snippet}
  {#snippet dontPair2()}
    <Composer labels={SILENT_LIMIT} maxLength={DEMO_LIMIT} value={NEAR_LIMIT_TEXT} />
  {/snippet}

  <DocsDoDont
    title={$tStore('doDont.title')}
    pairs={[
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair1.do')),
        dontCaption: toPlainText($tStore('doDont.pair1.dont')),
        // O par é o MESMO composer gerando: o que muda é se o botão troca de
        // nome junto com a forma.
        doPreview: doPair1,
        dontPreview: dontPair1,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair2.do')),
        dontCaption: toPlainText($tStore('doDont.pair2.dont')),
        // O contraexemplo: o mesmo campo sem o limite anunciado na descrição —
        // o número fica só para os olhos, e some para quem não os usa.
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
    ]}
  />

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={$tStore('import.basicCode')}
    secondaryDescription={$tStore('import.withRunning')}
    secondaryCode={$tStore('import.withRunningCode')}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  {#snippet variantEnter()}
    <Composer {labels} submitOn="enter" />
  {/snippet}
  {#snippet variantModifier()}
    <Composer {labels} submitOn="modifier" />
  {/snippet}

  <DocsVariants
    title={$tStore('variants.title')}
    note={$tStore('variants.note')}
    componentSlug="composer"
    items={[
      {
        name: SUBMIT_MODES[0],
        description: $tStore('variants.items.enter.description'),
        code: $tStore('variants.items.enter.code'),
        preview: variantEnter,
      },
      {
        name: SUBMIT_MODES[1],
        description: $tStore('variants.items.modifier.description'),
        code: $tStore('variants.items.modifier.code'),
        preview: variantModifier,
      },
    ]}
  />

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={['empty', 'filled', 'running', 'nearLimit', 'disabled'].map(k => ({
      label: $tStore(`states.${k}.label`),
      trigger: toPlainText($tStore(`states.${k}.trigger`)),
      behavior: toPlainText($tStore(`states.${k}.behavior`)),
    }))}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: 'Composer',
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          'labels', 'value', 'rows', 'maxLength', 'submitOn',
          'running', 'disabled', 'railStart', 'onSubmit', 'onStop', 'onInput', 'class',
        ].map(k => ({
          name: $tStore(`props.table.${k}.name`),
          type: $tStore(`props.table.${k}.type`),
          defaultValue: $tStore(`props.table.${k}.default`),
          required: $tStore(`props.table.${k}.required`),
          description: toPlainText($tStore(`props.table.${k}.description`)),
        })),
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={$tStore('props.extensibility')}
    extensibilityCode={$tStore('props.extensibilityCode')}
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
      'background', 'input', 'border', 'ring', 'radius',
      'foreground', 'mutedForeground', 'muted', 'destructive',
    ].map(k => ({
      token: $tStore(`tokens.table.${k}.token`),
      value: $tStore(`tokens.table.${k}.value`),
      description: toPlainText($tStore(`tokens.table.${k}.description`)),
    }))}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
    language="css"
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[1, 2, 3, 4, 5].map(i => $tStore(`accessibility.items.item${i}`))}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',   description: $tStore('accessibility.keyboard.tab') },
      { key: 'Enter', description: $tStore('accessibility.keyboard.enter') },
      { key: '↑ ↓',   description: $tStore('accessibility.keyboard.arrows') },
    ]}
    screenReaderTitle={$tStore('accessibility.screenReader.title')}
    screenReaderItems={screenReaderItems}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.chatThread.name'), description: toPlainText($tStore('related.items.chatThread.description')), path: '?path=/docs/ui-chatthread--docs' },
      { name: $tStore('related.items.textarea.name'),   description: toPlainText($tStore('related.items.textarea.description')),   path: '?path=/docs/ui-textarea--docs' },
      { name: $tStore('related.items.button.name'),     description: toPlainText($tStore('related.items.button.description')),     path: '?path=/docs/ui-button--docs' },
      { name: $tStore('related.items.editor.name'),     description: toPlainText($tStore('related.items.editor.description')),     path: '?path=/docs/ui-editor--docs' },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug="composer"
    items={[1, 2, 3, 4, 5].map(i => ({ title: '', content: $tStore(`notes.item${i}`) }))}
  />

  <!-- ── Analytics ──────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: $tStore('analytics.table.trigger'),
      payload: $tStore('analytics.table.payload'),
    }}
    items={['pageView', 'sectionViewed', 'demoClick'].map(k => ({
      event: $tStore(`analytics.table.${k}`),
      trigger: toPlainText($tStore(`analytics.table.${k}Trigger`)),
      payload: $tStore(`analytics.table.${k}Payload`),
    }))}
  />

  <!-- ── Testes ─────────────────────────────────────────────────── -->
  <DocsTestes
    title={$tStore('testes.title')}
    functional={{
      title: $tStore('testes.functional.title'),
      description: $tStore('testes.functional.description'),
      cols: {
        action: $tNavStore('common.userAction'),
        result: $tNavStore('common.expectedResult'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({
        action: toPlainText($tStore(`testes.functional.item${i}.action`)),
        result: toPlainText($tStore(`testes.functional.item${i}.result`)),
        priority: localPriority($tStore(`testes.functional.item${i}.priority`), $tNavStore),
      })),
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      description: $tStore('testes.accessibility.description'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: [1, 2, 3, 4, 5, 6].map(i => ({
        criterion: toPlainText($tStore(`testes.accessibility.item${i}`)),
        level: 'AA',
        how: '—',
      })),
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      description: $tStore('testes.visual.description'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
        story: toPlainText($tStore(`testes.visual.item${i}.story`)),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>
