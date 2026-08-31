<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { FormField, Fieldset } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import uiTranslations from '@/i18n/ui.json';
import formTranslations from '@shared/content/form/translations.json';

import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.vue';
import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsCompositions  from '@/components/docs/shared/sections/DocsCompositions.vue';
import DocsStates        from '@/components/docs/shared/sections/DocsStates.vue';
import DocsProps         from '@/components/docs/shared/sections/DocsProps.vue';
import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.vue';
import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.vue';
import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.vue';
import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.vue';
import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.vue';
import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.vue';
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────
//
// O locale sai do `useTranslation`, nunca de store de estado: locale de Pinia já
// derrubou docs page em runtime neste repositório.
//
// O conteúdo compartilhado nomeia as duas peças pelas FACTORIES da stack de
// referência, e só isso é sobrescrito aqui. A prosa de extensibilidade era
// sobrescrita também, nas quatro stacks, até o texto compartilhado deixar de
// nomear uma fábrica: contorno repetido em quatro lugares é sintoma de defeito
// na origem, não de quatro necessidades diferentes.

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(formTranslations, {
  '*': {
    'props.fieldTitle': 'FormField',
    'props.fieldsetTitle': 'Fieldset',
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function localPriority(raw: string): string {
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
 * A saída só conta quando o campo tem valor: passar o foco por cima sem digitar
 * nada não é preenchimento abandonado, e contaria como se fosse.
 */
function onFieldBlur(fieldName: string, event: FocusEvent) {
  const control = event.target as HTMLInputElement | HTMLTextAreaElement | null;
  if (control && control.value.length > 0) {
    track('field_blur', { component: 'form', field_name: fieldName, location: 'docs_demo' });
  }
}

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'form',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'form',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Navigation groups ────────────────────────────────────────────────────────
//
// O conteúdo compartilhado do form não traz bloco `nav`, então os rótulos saem
// do `ui.json`. A ordem é a mesma das outras páginas deste componente.

const navGroups = computed(() => [
  {
    label: tNav('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tNav('nav.demonstration') },
      { id: 'anatomia',     label: tNav('nav.anatomy')       },
      { id: 'quando-usar',  label: tNav('nav.usage')         },
      { id: 'do-dont',      label: tNav('nav.doDont')        },
    ],
  },
  {
    label: tNav('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tNav('nav.import')       },
      { id: 'variantes',    label: tNav('nav.variants')     },
      { id: 'composicoes',  label: tNav('nav.compositions') },
      { id: 'estados',      label: tNav('nav.states')       },
      { id: 'propriedades', label: tNav('nav.props')        },
      { id: 'tokens',       label: tNav('nav.tokens')       },
    ],
  },
  {
    label: tNav('nav.context'),
    sections: [
      { id: 'acessibilidade', label: tNav('nav.accessibility') },
      { id: 'relacionados',   label: tNav('nav.related')       },
      { id: 'notas',          label: tNav('nav.notes')         },
    ],
  },
  {
    label: tNav('nav.quality'),
    sections: [
      { id: 'analytics', label: tNav('nav.analytics') },
      { id: 'testes',    label: tNav('nav.testes')    },
    ],
  },
]);

const allSectionIds = computed(() => navGroups.value.flatMap(g => g.sections.map(s => s.id)));

const { activeId: activeSection } = useActiveSection(allSectionIds, (id) => {
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'form',
    locale: locale.value,
  });
});

// ─── Code strings ─────────────────────────────────────────────────────────────

const importCode = `import { FormField, Fieldset } from '@/components/ui/form'
import { Input } from '@/components/ui/input'`;

const interfaceCode = `// <FormField> — o controle vai no slot padrão.
defineProps<{
  label?: string        // Texto do rótulo
  description?: string  // Texto de apoio
  error?: string        // Mensagem de erro (aria-live="polite")
  class?: HTMLAttributes['class']
}>()

// <Fieldset> — os campos vão no slot padrão.
defineProps<{
  legend?: string       // Texto do <legend>
  class?: HTMLAttributes['class']
}>()`;

const customizationCode = `/* Em styles.css — sobrescrever tokens do form */
:root {
  --spacing-1-5: 0.375rem;         /* gap entre label, controle, descrição e erro */
  --spacing-4: 1rem;               /* gap entre campos dentro do fieldset */
  --foreground: 222 84% 5%;        /* cor do label e da legend */
  --muted-foreground: 215 16% 47%; /* cor da descrição */
  --destructive: 0 84% 60%;        /* cor do erro */
  --font-weight-medium: 500;       /* peso do label */
}`;

// Os snippets saem dos MESMOS rótulos traduzidos que o preview mostra — se
// fossem cravados aqui, o exemplo de código ficaria em português para quem lê a
// página em inglês ou espanhol.
const codeLabelOnly = computed(() =>
  `<FormField label="${tContent('demonstration.labels.nameLabel')}">\n` +
  `  <Input type="text" placeholder="${tContent('demonstration.labels.namePlaceholder')}" />\n` +
  `</FormField>`,
);

const codeWithDescription = computed(() =>
  `<FormField\n` +
  `  label="${tContent('demonstration.labels.emailLabel')}"\n` +
  `  description="${tContent('demonstration.labels.emailDescription')}"\n` +
  `>\n` +
  `  <Input type="email" placeholder="${tContent('demonstration.labels.emailPlaceholder')}" />\n` +
  `</FormField>`,
);

const codeFieldset = computed(() =>
  `<Fieldset legend="${tContent('demonstration.labels.groupLegend')}">\n` +
  `  <FormField label="${tContent('demonstration.labels.streetLabel')}">\n` +
  `    <Input type="text" placeholder="${tContent('demonstration.labels.streetPlaceholder')}" />\n` +
  `  </FormField>\n` +
  `  <FormField label="${tContent('demonstration.labels.cityLabel')}">\n` +
  `    <Input type="text" placeholder="${tContent('demonstration.labels.cityPlaceholder')}" />\n` +
  `  </FormField>\n` +
  `</Fieldset>`,
);

// ─── Conteúdo das seções ──────────────────────────────────────────────────────

const anatomyItems = computed(() =>
  [1, 2, 3, 4, 5].map(i => tContent(`anatomy.item${i}`)),
);

const guidelines = computed(() => ({
  title: tContent('usage.guidelines.title'),
  items: [1, 2, 3, 4, 5].map(i => tContent(`usage.guidelines.item${i}`)),
}));

const scenarios = computed(() => ({
  title: tContent('usage.scenarios.title'),
  cols: {
    scenario: tContent('usage.scenarios.cols.scenario'),
    use: tContent('usage.scenarios.cols.use'),
    alternative: tContent('usage.scenarios.cols.alternative'),
  },
  items: [1, 2, 3, 4, 5, 6].map(i => ({
    s: tContent(`usage.scenarios.item${i}.s`),
    u: tContent(`usage.scenarios.item${i}.u`),
    a: toPlainText(tContent(`usage.scenarios.item${i}.a`)),
  })),
}));

const doList = computed(() => ({
  title: tContent('usage.do.title'),
  items: [1, 2, 3, 4].map(i => tContent(`usage.do.item${i}`)),
}));

const dontList = computed(() => ({
  title: tContent('usage.dont.title'),
  items: [1, 2, 3].map(i => tContent(`usage.dont.item${i}`)),
}));

const doDontPairs = computed(() => [1, 2, 3].map(i => ({
  doLabel: tNav('common.do'),
  dontLabel: tNav('common.dont'),
  doCaption: toPlainText(tContent(`doDont.pair${i}.do`)),
  dontCaption: toPlainText(tContent(`doDont.pair${i}.dont`)),
})));

// Container de composições e não o de variantes: o conteúdo traz "quando usar"
// em cada item, e só este renderiza essa linha.
const variantItems = computed(() =>
  ['labelOnly', 'withDescription'].map(k => ({
    name: tContent(`variants.items.${k}.name`),
    trackId: k,
    description: tContent(`variants.items.${k}.description`),
    useWhen: tContent(`variants.items.${k}.use`),
    code: k === 'labelOnly' ? codeLabelOnly.value : codeWithDescription.value,
  })),
);

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.fieldset.name'),
    trackId: 'fieldset',
    description: tContent('variants.compositions.fieldset.description'),
    useWhen: tContent('variants.compositions.fieldset.use'),
    code: codeFieldset.value,
  },
]);

const stateItems = computed(() =>
  ['default', 'withError', 'disabled'].map(k => ({
    label: tContent(`states.${k}.label`),
    trigger: toPlainText(tContent(`states.${k}.trigger`)),
    behavior: toPlainText(tContent(`states.${k}.behavior`)),
  })),
);

const propsCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const propsTables = computed(() => {
  const yes = tNav('common.yes');
  const no = tNav('common.no');
  return [
    {
      title: tContent('props.fieldTitle'),
      cols: propsCols.value,
      items: [
        { name: 'label',        type: 'string', defaultValue: '—', required: no,  description: toPlainText(tContent('props.table.label')) },
        { name: 'default slot', type: 'VNode',  defaultValue: '—', required: yes, description: toPlainText(tContent('props.table.input')) },
        { name: 'description',  type: 'string', defaultValue: '—', required: no,  description: toPlainText(tContent('props.table.description_prop')) },
        { name: 'error',        type: 'string', defaultValue: '—', required: no,  description: toPlainText(tContent('props.table.error')) },
        { name: 'class',        type: 'string', defaultValue: '—', required: no,  description: toPlainText(tContent('props.table.className')) },
      ],
    },
    {
      title: tContent('props.fieldsetTitle'),
      cols: propsCols.value,
      items: [
        { name: 'legend',       type: 'string', defaultValue: '—', required: no, description: toPlainText(tContent('props.table.legend')) },
        { name: 'default slot', type: 'VNode',  defaultValue: '—', required: no, description: toPlainText(tContent('props.table.children')) },
        { name: 'class',        type: 'string', defaultValue: '—', required: no, description: toPlainText(tContent('props.table.className')) },
      ],
    },
  ];
});

const tokenItems = computed(() =>
  [
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
    description: toPlainText(tContent(`tokens.table.${k}`)),
  })),
);

const accessibilityItems = computed(() =>
  [1, 2, 3, 4, 5].map(i => tContent(`accessibility.item${i}`)),
);

const keyboardItems = computed(() => [
  { key: 'Tab',       description: toPlainText(tContent('accessibility.keyboard.tab')) },
  { key: 'Shift+Tab', description: toPlainText(tContent('accessibility.keyboard.shiftTab')) },
  { key: 'A–Z / 0–9', description: toPlainText(tContent('accessibility.keyboard.typing')) },
  { key: 'Escape',    description: toPlainText(tContent('accessibility.keyboard.escape')) },
]);

const relatedItems = computed(() => [
  { name: 'Input',    description: toPlainText(tContent('related.input')),    path: '?path=/docs/primitives-form-input--docs'    },
  { name: 'Textarea', description: toPlainText(tContent('related.textarea')), path: '?path=/docs/primitives-form-textarea--docs' },
  { name: 'Select',   description: toPlainText(tContent('related.select')),   path: '?path=/docs/primitives-form-select--docs'   },
  { name: 'Checkbox', description: toPlainText(tContent('related.checkbox')), path: '?path=/docs/primitives-form-checkbox--docs' },
  { name: 'Label',    description: toPlainText(tContent('related.label')),    path: '?path=/docs/primitives-form-label--docs'    },
]);

const noteItems = computed(() =>
  [1, 2, 3, 4, 5].map(i => ({ title: '', content: tContent(`notes.tip${i}`) })),
);

const analyticsItems = computed(() =>
  ['fieldFocus', 'fieldBlur', 'fieldError', 'pageView', 'sectionViewed', 'langSwitch'].map(k => ({
    event: tContent(`analytics.table.${k}`),
    trigger: toPlainText(tContent(`analytics.table.${k}Trigger`)),
    payload: toPlainText(tContent(`analytics.table.${k}Payload`)),
  })),
);

const functionalTests = computed(() => ({
  title: tContent('testes.functional.title'),
  description: tContent('testes.functional.description'),
  cols: {
    action: tNav('common.userAction'),
    result: tNav('common.expectedResult'),
    priority: tNav('common.priority'),
  },
  // Só `toPlainText`: a célula é textNode e o item5 traz `&lt;fieldset&gt;`,
  // que sairia literal sem a decodificação.
  items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
    action: toPlainText(tContent(`testes.functional.item${i}.action`)),
    result: toPlainText(tContent(`testes.functional.item${i}.result`)),
    priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
  })),
}));

// A lista é PLANA: cada item é um critério solto, sem a trinca
// critério/nível/como.
const accessibilityTests = computed(() => ({
  title: tContent('testes.accessibility.title'),
  description: tContent('testes.accessibility.description'),
  cols: {
    criterion: tNav('common.criterion'),
    level: 'WCAG',
    how: tNav('common.howToVerify'),
  },
  items: [1, 2, 3, 4, 5].map(i => ({
    criterion: toPlainText(tContent(`testes.accessibility.item${i}`)),
    level: 'AA',
    how: 'axe-core + manual',
  })),
}));

const visualTests = computed(() => ({
  title: tContent('testes.visual.title'),
  description: tContent('testes.visual.description'),
  cols: {
    story: tNav('common.storyState'),
    priority: tNav('common.priority'),
  },
  items: [1, 2, 3, 4, 5].map(i => ({
    story: toPlainText(tContent(`testes.visual.item${i}.story`)),
    priority: localPriority(tContent(`testes.visual.item${i}.priority`)),
  })),
}));
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="form"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration
      :title="tContent('demonstration.title')"
      component-slug="form"
    >
      <div class="nds-stack nds-w-full nds-max-w-sm">
        <FormField
          :label="tContent('demonstration.labels.nameLabel')"
          :description="tContent('demonstration.labels.nameDescription')"
        >
          <Input
            type="text"
            :placeholder="tContent('demonstration.labels.namePlaceholder')"
            @focus="onFieldFocus('name')"
            @blur="onFieldBlur('name', $event)"
          />
        </FormField>

        <FormField
          :label="tContent('demonstration.labels.emailLabel')"
          :description="tContent('demonstration.labels.emailDescription')"
        >
          <Input
            type="email"
            :placeholder="tContent('demonstration.labels.emailPlaceholder')"
            @focus="onFieldFocus('email')"
            @blur="onFieldBlur('email', $event)"
          />
        </FormField>

        <FormField
          :label="tContent('demonstration.labels.passwordLabel')"
          :error="tContent('demonstration.labels.passwordError')"
        >
          <!-- `aria-invalid` é escrito à mão: o campo anuncia e pinta o erro,
               mas quem valida é a lib de formulário da aplicação. -->
          <Input
            type="password"
            autocomplete="new-password"
            aria-invalid="true"
            @focus="onFieldFocus('password')"
            @blur="onFieldBlur('password', $event)"
          />
        </FormField>

        <FormField
          :label="tContent('demonstration.labels.bioLabel')"
          :description="tContent('demonstration.labels.bioDescription')"
        >
          <Textarea
            :rows="3"
            :placeholder="tContent('demonstration.labels.bioPlaceholder')"
            @focus="onFieldFocus('bio')"
            @blur="onFieldBlur('bio', $event)"
          />
        </FormField>

        <Fieldset :legend="tContent('demonstration.labels.groupLegend')">
          <FormField :label="tContent('demonstration.labels.streetLabel')">
            <Input
              type="text"
              :placeholder="tContent('demonstration.labels.streetPlaceholder')"
            />
          </FormField>
          <FormField :label="tContent('demonstration.labels.cityLabel')">
            <Input
              type="text"
              :placeholder="tContent('demonstration.labels.cityPlaceholder')"
            />
          </FormField>
        </Fieldset>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ───────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
      language="vue"
    />

    <!-- ── Quando Usar ────────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="guidelines"
      :scenarios="scenarios"
      :do="doList"
      :dont="dontList"
    />

    <!-- ── Do &amp; Don't ─────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="doDontPairs"
    >
      <template #do-preview-0>
        <FormField
          :label="tContent('demonstration.labels.passwordLabel')"
          :description="tContent('demonstration.labels.passwordDescription')"
        >
          <Input
            type="password"
            autocomplete="new-password"
            :placeholder="tContent('demonstration.labels.passwordPlaceholder')"
          />
        </FormField>
      </template>
      <!-- O contraexemplo é o campo SEM rótulo, com o nome dele servindo de
           placeholder — por isso aqui entra o rótulo, e não o placeholder de
           pontinhos. -->
      <template #dont-preview-0>
        <Input
          type="password"
          autocomplete="new-password"
          :placeholder="tContent('demonstration.labels.passwordLabel')"
        />
      </template>

      <template #do-preview-1>
        <FormField
          :label="tContent('demonstration.labels.passwordLabel')"
          :error="tContent('demonstration.labels.passwordError')"
        >
          <Input
            type="password"
            autocomplete="new-password"
            aria-invalid="true"
          />
        </FormField>
      </template>
      <!-- A mensagem genérica mora no conteúdo compartilhado justamente para
           ser traduzida junto com a boa, em vez de ficar presa em uma língua
           dentro do código. -->
      <template #dont-preview-1>
        <FormField
          :label="tContent('demonstration.labels.passwordLabel')"
          :error="tContent('demonstration.labels.genericError')"
        >
          <Input
            type="password"
            autocomplete="new-password"
            aria-invalid="true"
          />
        </FormField>
      </template>

      <template #do-preview-2>
        <Fieldset :legend="tContent('demonstration.labels.groupLegend')">
          <FormField :label="tContent('demonstration.labels.streetLabel')">
            <Input
              type="text"
              :placeholder="tContent('demonstration.labels.streetPlaceholder')"
            />
          </FormField>
          <FormField :label="tContent('demonstration.labels.cityLabel')">
            <Input
              type="text"
              :placeholder="tContent('demonstration.labels.cityPlaceholder')"
            />
          </FormField>
        </Fieldset>
      </template>
      <!-- Os mesmos dois campos, empilhados sem agrupamento: na tela é igual,
           no leitor de tela some o rótulo do grupo. -->
      <template #dont-preview-2>
        <div class="nds-stack nds-w-full">
          <FormField :label="tContent('demonstration.labels.streetLabel')">
            <Input
              type="text"
              :placeholder="tContent('demonstration.labels.streetPlaceholder')"
            />
          </FormField>
          <FormField :label="tContent('demonstration.labels.cityLabel')">
            <Input
              type="text"
              :placeholder="tContent('demonstration.labels.cityPlaceholder')"
            />
          </FormField>
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="importCode"
      component-slug="form"
      language="ts"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsCompositions
      id="variantes"
      :title="tContent('variants.title')"
      :note="tContent('variants.note')"
      :items="variantItems"
      :use-when-label="tNav('common.useWhen')"
      component-slug="form"
    >
      <template #variant-preview-0>
        <FormField :label="tContent('demonstration.labels.nameLabel')">
          <Input
            type="text"
            :placeholder="tContent('demonstration.labels.namePlaceholder')"
          />
        </FormField>
      </template>
      <template #variant-preview-1>
        <FormField
          :label="tContent('demonstration.labels.emailLabel')"
          :description="tContent('demonstration.labels.emailDescription')"
        >
          <Input
            type="email"
            :placeholder="tContent('demonstration.labels.emailPlaceholder')"
          />
        </FormField>
      </template>
    </DocsCompositions>

    <!-- ── Composições ────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :items="compositionItems"
      :use-when-label="tNav('common.useWhen')"
      component-slug="form"
    >
      <template #variant-preview-0>
        <Fieldset :legend="tContent('demonstration.labels.groupLegend')">
          <FormField :label="tContent('demonstration.labels.streetLabel')">
            <Input
              type="text"
              :placeholder="tContent('demonstration.labels.streetPlaceholder')"
            />
          </FormField>
          <FormField :label="tContent('demonstration.labels.cityLabel')">
            <Input
              type="text"
              :placeholder="tContent('demonstration.labels.cityPlaceholder')"
            />
          </FormField>
        </Fieldset>
      </template>
    </DocsCompositions>

    <!-- ── Estados ────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('states.cols.state'),
        trigger: toPlainText(tContent('states.cols.trigger')),
        behavior: toPlainText(tContent('states.cols.behavior')),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="propsTables"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="stripHtml(tContent('props.extensibility'))"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{
        token: tContent('tokens.table.token'),
        value: tContent('tokens.table.class'),
        description: tContent('tokens.table.part'),
      }"
      :items="tokenItems"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="customizationCode"
      language="css"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tNav('common.keyboard')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
      component-slug="form"
    />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
      component-slug="form"
    />

    <!-- ── Analytics ──────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: tContent('analytics.table.trigger'),
        payload: tContent('analytics.table.payload'),
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ─────────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
      :functional="functionalTests"
      :accessibility="accessibilityTests"
      :visual="visualTests"
    />
  </DocsPageLayout>
</template>
