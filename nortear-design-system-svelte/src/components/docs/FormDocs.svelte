<script lang="ts">
  import { untrack } from 'svelte';
  import { FormField, Fieldset } from '@/components/ui/form';
  import { Input } from '@/components/ui/input';
  import { Textarea } from '@/components/ui/textarea';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import formTranslations from '@shared/content/form/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);

  // O conteúdo compartilhado nomeia as duas peças pelas FACTORIES da stack de
  // referência, e só isso é sobrescrito aqui. A prosa de extensibilidade era
  // sobrescrita também, nas quatro stacks, até o texto compartilhado deixar de
  // nomear uma fábrica: contorno repetido em quatro lugares é sintoma de defeito
  // na origem, não de quatro necessidades diferentes.
  const { tStore } = useTranslation(formTranslations, {
    '*': {
      'props.fieldTitle': 'FormField',
      'props.fieldsetTitle': 'Fieldset',
    },
  });

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'form',
    });
    track('docs_page_view', {
      component_name: 'form',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────
  //
  // O conteúdo compartilhado do form não traz bloco `nav`, então os rótulos saem
  // do `ui.json`. A ordem é a mesma das outras páginas deste componente.

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
        { id: 'importacao',   label: tNav('nav.import')       },
        { id: 'variantes',    label: tNav('nav.variants')     },
        { id: 'composicoes',  label: tNav('nav.compositions') },
        { id: 'estados',      label: tNav('nav.states')       },
        { id: 'propriedades', label: tNav('nav.props')        },
        { id: 'tokens',       label: tNav('nav.tokens')       },
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
    track('docs_section_viewed', {
      section_id: id,
      component_name: 'form',
      locale: $locale,
    });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  /**
   * Os dois eventos de campo que a tabela de analytics documenta, ligados no
   * controle da demonstração.
   */
  function onFieldFocus(fieldName: string) {
    track('field_focus', { component: 'form', field_name: fieldName, location: 'docs_demo' });
  }

  /**
   * A saída só conta quando o campo tem valor: passar o foco por cima sem
   * digitar nada não é preenchimento abandonado, e contaria como se fosse.
   */
  function onFieldBlur(fieldName: string, event: FocusEvent) {
    const control = event.currentTarget as HTMLInputElement | HTMLTextAreaElement | null;
    if (control && control.value.length > 0) {
      track('field_blur', { component: 'form', field_name: fieldName, location: 'docs_demo' });
    }
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const importCode = `import { FormField, Fieldset } from '@/components/ui/form';
import { Input } from '@/components/ui/input';`;

  const interfaceCode = `// <FormField> — o controle é o snippet children.
type FormFieldProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;       // Texto do rótulo
  description?: string; // Texto de apoio
  error?: string;       // Mensagem de erro (aria-live="polite")
  children: Snippet;    // O controle: Input, Textarea, Select…
};

// <Fieldset> — os campos são o snippet children.
type FieldsetProps = HTMLAttributes<HTMLFieldSetElement> & {
  legend?: string;      // Texto do <legend>
  children: Snippet;
};`;

  const customizationCode = `/* Em styles.css — sobrescrever tokens do form */
:root {
  --spacing-1-5: 0.375rem;         /* gap entre label, controle, descrição e erro */
  --spacing-4: 1rem;               /* gap entre campos dentro do fieldset */
  --foreground: 222 84% 5%;        /* cor do label e da legend */
  --muted-foreground: 215 16% 47%; /* cor da descrição */
  --destructive: 0 84% 60%;        /* cor do erro */
  --font-weight-medium: 500;       /* peso do label */
}`;

  // Os snippets de código saem dos MESMOS rótulos traduzidos que o preview
  // mostra — se fossem cravados aqui, o exemplo ficaria em português para quem
  // lê a página em inglês ou espanhol.
  const codeLabelOnly = $derived(
    `<FormField label="${$tStore('demonstration.labels.nameLabel')}">\n` +
    `  <Input type="text" placeholder="${$tStore('demonstration.labels.namePlaceholder')}" />\n` +
    `</FormField>`,
  );

  const codeWithDescription = $derived(
    `<FormField\n` +
    `  label="${$tStore('demonstration.labels.emailLabel')}"\n` +
    `  description="${$tStore('demonstration.labels.emailDescription')}"\n` +
    `>\n` +
    `  <Input type="email" placeholder="${$tStore('demonstration.labels.emailPlaceholder')}" />\n` +
    `</FormField>`,
  );

  const codeFieldset = $derived(
    `<Fieldset legend="${$tStore('demonstration.labels.groupLegend')}">\n` +
    `  <FormField label="${$tStore('demonstration.labels.streetLabel')}">\n` +
    `    <Input type="text" placeholder="${$tStore('demonstration.labels.streetPlaceholder')}" />\n` +
    `  </FormField>\n` +
    `  <FormField label="${$tStore('demonstration.labels.cityLabel')}">\n` +
    `    <Input type="text" placeholder="${$tStore('demonstration.labels.cityPlaceholder')}" />\n` +
    `  </FormField>\n` +
    `</Fieldset>`,
  );
</script>

<!-- ── Previews reaproveitados ──────────────────────────────────────── -->

{#snippet addressFieldset()}
  <Fieldset legend={$tStore('demonstration.labels.groupLegend')}>
    <FormField label={$tStore('demonstration.labels.streetLabel')}>
      <Input type="text" placeholder={$tStore('demonstration.labels.streetPlaceholder')} />
    </FormField>
    <FormField label={$tStore('demonstration.labels.cityLabel')}>
      <Input type="text" placeholder={$tStore('demonstration.labels.cityPlaceholder')} />
    </FormField>
  </Fieldset>
{/snippet}

{#snippet doPair1()}
  <FormField
    label={$tStore('demonstration.labels.passwordLabel')}
    description={$tStore('demonstration.labels.passwordDescription')}
  >
    <Input
      type="password"
      autocomplete="new-password"
      placeholder={$tStore('demonstration.labels.passwordPlaceholder')}
    />
  </FormField>
{/snippet}

<!-- O contraexemplo é o campo SEM rótulo, com o nome dele servindo de
     placeholder — por isso aqui entra o rótulo, e não o placeholder de
     pontinhos. -->
{#snippet dontPair1()}
  <Input
    type="password"
    autocomplete="new-password"
    placeholder={$tStore('demonstration.labels.passwordLabel')}
  />
{/snippet}

{#snippet doPair2()}
  <FormField
    label={$tStore('demonstration.labels.passwordLabel')}
    error={$tStore('demonstration.labels.passwordError')}
  >
    <Input type="password" autocomplete="new-password" aria-invalid="true" />
  </FormField>
{/snippet}

<!-- A mensagem genérica mora no conteúdo compartilhado justamente para ser
     traduzida junto com a boa, em vez de ficar presa em uma língua dentro do
     código. -->
{#snippet dontPair2()}
  <FormField
    label={$tStore('demonstration.labels.passwordLabel')}
    error={$tStore('demonstration.labels.genericError')}
  >
    <Input type="password" autocomplete="new-password" aria-invalid="true" />
  </FormField>
{/snippet}

<!-- Os mesmos dois campos, empilhados sem agrupamento: na tela é igual, no
     leitor de tela some o rótulo do grupo. -->
{#snippet dontPair3()}
  <div class="nds-stack nds-w-full">
    <FormField label={$tStore('demonstration.labels.streetLabel')}>
      <Input type="text" placeholder={$tStore('demonstration.labels.streetPlaceholder')} />
    </FormField>
    <FormField label={$tStore('demonstration.labels.cityLabel')}>
      <Input type="text" placeholder={$tStore('demonstration.labels.cityPlaceholder')} />
    </FormField>
  </div>
{/snippet}

{#snippet previewLabelOnly()}
  <FormField label={$tStore('demonstration.labels.nameLabel')}>
    <Input type="text" placeholder={$tStore('demonstration.labels.namePlaceholder')} />
  </FormField>
{/snippet}

{#snippet previewWithDescription()}
  <FormField
    label={$tStore('demonstration.labels.emailLabel')}
    description={$tStore('demonstration.labels.emailDescription')}
  >
    <Input type="email" placeholder={$tStore('demonstration.labels.emailPlaceholder')} />
  </FormField>
{/snippet}

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="form">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')} componentSlug="form">
    <div class="nds-stack nds-w-full nds-max-w-sm">
      <FormField
        label={$tStore('demonstration.labels.nameLabel')}
        description={$tStore('demonstration.labels.nameDescription')}
      >
        <Input
          type="text"
          placeholder={$tStore('demonstration.labels.namePlaceholder')}
          onfocus={() => onFieldFocus('name')}
          onblur={(event) => onFieldBlur('name', event)}
        />
      </FormField>

      <FormField
        label={$tStore('demonstration.labels.emailLabel')}
        description={$tStore('demonstration.labels.emailDescription')}
      >
        <Input
          type="email"
          placeholder={$tStore('demonstration.labels.emailPlaceholder')}
          onfocus={() => onFieldFocus('email')}
          onblur={(event) => onFieldBlur('email', event)}
        />
      </FormField>

      <FormField
        label={$tStore('demonstration.labels.passwordLabel')}
        error={$tStore('demonstration.labels.passwordError')}
      >
        <!-- `aria-invalid` é escrito à mão: o campo anuncia e pinta o erro, mas
             quem valida é a lib de formulário da aplicação. -->
        <Input
          type="password"
          autocomplete="new-password"
          aria-invalid="true"
          onfocus={() => onFieldFocus('password')}
          onblur={(event) => onFieldBlur('password', event)}
        />
      </FormField>

      <FormField
        label={$tStore('demonstration.labels.bioLabel')}
        description={$tStore('demonstration.labels.bioDescription')}
      >
        <Textarea
          rows={3}
          placeholder={$tStore('demonstration.labels.bioPlaceholder')}
          onfocus={() => onFieldFocus('bio')}
          onblur={(event) => onFieldBlur('bio', event)}
        />
      </FormField>

      {@render addressFieldset()}
    </div>
  </DocsDemonstration>

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
    title={$tStore('anatomy.title')}
    items={[1, 2, 3, 4, 5].map(i => $tStore(`anatomy.item${i}`))}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
    language="svelte"
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
      items: [1, 2, 3, 4, 5, 6].map(i => ({
        s: $tStore(`usage.scenarios.item${i}.s`),
        u: $tStore(`usage.scenarios.item${i}.u`),
        a: toPlainText($tStore(`usage.scenarios.item${i}.a`)),
      })),
    }}
    do={{
      title: $tStore('usage.do.title'),
      items: [1, 2, 3, 4].map(i => $tStore(`usage.do.item${i}`)),
    }}
    dont={{
      title: $tStore('usage.dont.title'),
      items: [1, 2, 3].map(i => $tStore(`usage.dont.item${i}`)),
    }}
  />

  <!-- ── Do & Don't ─────────────────────────────────────────────── -->
  <DocsDoDont
    title={$tStore('doDont.title')}
    pairs={[
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair1.do')),
        dontCaption: toPlainText($tStore('doDont.pair1.dont')),
        doPreview: doPair1,
        dontPreview: dontPair1,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair2.do')),
        dontCaption: toPlainText($tStore('doDont.pair2.dont')),
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair3.do')),
        dontCaption: toPlainText($tStore('doDont.pair3.dont')),
        doPreview: addressFieldset,
        dontPreview: dontPair3,
      },
    ]}
  />

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={importCode}
    componentSlug="form"
    language="ts"
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <!-- Container de composições e não o de variantes: o conteúdo traz "quando
       usar" em cada item, e só este renderiza essa linha. -->
  <DocsCompositions
    id="variantes"
    title={$tStore('variants.title')}
    note={$tStore('variants.note')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="form"
    items={[
      {
        name: $tStore('variants.items.labelOnly.name'),
        trackId: 'labelOnly',
        description: $tStore('variants.items.labelOnly.description'),
        useWhen: $tStore('variants.items.labelOnly.use'),
        code: codeLabelOnly,
        preview: previewLabelOnly,
      },
      {
        name: $tStore('variants.items.withDescription.name'),
        trackId: 'withDescription',
        description: $tStore('variants.items.withDescription.description'),
        useWhen: $tStore('variants.items.withDescription.use'),
        code: codeWithDescription,
        preview: previewWithDescription,
      },
    ]}
  />

  <!-- ── Composições ────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="form"
    items={[
      {
        name: $tStore('variants.compositions.fieldset.name'),
        trackId: 'fieldset',
        description: $tStore('variants.compositions.fieldset.description'),
        useWhen: $tStore('variants.compositions.fieldset.use'),
        code: codeFieldset,
        preview: addressFieldset,
      },
    ]}
  />

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: toPlainText($tStore('states.cols.trigger')),
      behavior: toPlainText($tStore('states.cols.behavior')),
    }}
    items={['default', 'withError', 'disabled'].map(k => ({
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
        title: $tStore('props.fieldTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'label',       type: 'string',  defaultValue: '—', required: $tNavStore('common.no'),  description: toPlainText($tStore('props.table.label')) },
          { name: 'children',    type: 'Snippet', defaultValue: '—', required: $tNavStore('common.yes'), description: toPlainText($tStore('props.table.input')) },
          { name: 'description', type: 'string',  defaultValue: '—', required: $tNavStore('common.no'),  description: toPlainText($tStore('props.table.description_prop')) },
          { name: 'error',       type: 'string',  defaultValue: '—', required: $tNavStore('common.no'),  description: toPlainText($tStore('props.table.error')) },
          { name: 'class',       type: 'string',  defaultValue: '—', required: $tNavStore('common.no'),  description: toPlainText($tStore('props.table.className')) },
        ],
      },
      {
        title: $tStore('props.fieldsetTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'legend',   type: 'string',  defaultValue: '—', required: $tNavStore('common.no'),  description: toPlainText($tStore('props.table.legend')) },
          { name: 'children', type: 'Snippet', defaultValue: '—', required: $tNavStore('common.yes'), description: toPlainText($tStore('props.table.children')) },
          { name: 'class',    type: 'string',  defaultValue: '—', required: $tNavStore('common.no'),  description: toPlainText($tStore('props.table.className')) },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={stripHtml($tStore('props.extensibility'))}
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
      { token: '--spacing-1-5',        value: '.nds-form-field',       k: 'fieldGap'         },
      { token: '--foreground',         value: '.nds-form-label',       k: 'labelColor'       },
      { token: '--font-weight-medium', value: '.nds-form-label',       k: 'labelWeight'      },
      { token: '--muted-foreground',   value: '.nds-form-description', k: 'descriptionColor' },
      { token: '--destructive',        value: '.nds-form-error',       k: 'errorColor'       },
      { token: '--spacing-4',          value: '.nds-form-fieldset',    k: 'fieldsetGap'      },
      { token: '--foreground',         value: '.nds-form-legend',      k: 'legendColor'      },
    ].map(({ token, value, k }) => ({
      token,
      value,
      description: toPlainText($tStore(`tokens.table.${k}`)),
    }))}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={customizationCode}
    language="css"
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[1, 2, 3, 4, 5].map(i => $tStore(`accessibility.item${i}`))}
    keyboardTitle={$tNavStore('common.keyboard')}
    keyboardItems={[
      { key: 'Tab',       description: toPlainText($tStore('accessibility.keyboard.tab')) },
      { key: 'Shift+Tab', description: toPlainText($tStore('accessibility.keyboard.shiftTab')) },
      { key: 'A–Z / 0–9', description: toPlainText($tStore('accessibility.keyboard.typing')) },
      { key: 'Escape',    description: toPlainText($tStore('accessibility.keyboard.escape')) },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    componentSlug="form"
    items={[
      { name: 'Input',    description: toPlainText($tStore('related.input')),    path: '?path=/docs/primitives-form-input--docs'    },
      { name: 'Textarea', description: toPlainText($tStore('related.textarea')), path: '?path=/docs/primitives-form-textarea--docs' },
      { name: 'Select',   description: toPlainText($tStore('related.select')),   path: '?path=/docs/primitives-form-select--docs'   },
      { name: 'Checkbox', description: toPlainText($tStore('related.checkbox')), path: '?path=/docs/primitives-form-checkbox--docs' },
      { name: 'Label',    description: toPlainText($tStore('related.label')),    path: '?path=/docs/primitives-form-label--docs'    },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    componentSlug="form"
    items={[1, 2, 3, 4, 5].map(i => ({ title: '', content: $tStore(`notes.tip${i}`) }))}
  />

  <!-- ── Analytics ──────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: $tStore('analytics.table.trigger'),
      payload: $tStore('analytics.table.payload'),
    }}
    items={['fieldFocus', 'fieldBlur', 'fieldError', 'pageView', 'sectionViewed', 'langSwitch'].map(k => ({
      event: $tStore(`analytics.table.${k}`),
      trigger: toPlainText($tStore(`analytics.table.${k}Trigger`)),
      payload: toPlainText($tStore(`analytics.table.${k}Payload`)),
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
      // Só `toPlainText`: a célula é textNode e o item5 traz
      // `&lt;fieldset&gt;`, que sairia literal sem a decodificação.
      items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
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
      // A lista é PLANA: cada item é um critério solto, sem a trinca
      // critério/nível/como.
      items: [1, 2, 3, 4, 5].map(i => ({
        criterion: toPlainText($tStore(`testes.accessibility.item${i}`)),
        level: 'AA',
        how: 'axe-core + manual',
      })),
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      description: $tStore('testes.visual.description'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4, 5].map(i => ({
        story: toPlainText($tStore(`testes.visual.item${i}.story`)),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>
