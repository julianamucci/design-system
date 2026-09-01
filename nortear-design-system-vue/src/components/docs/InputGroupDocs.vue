<script setup lang="ts">
import { computed, ref, watch, type Ref } from 'vue';
import { Eye, EyeOff, Search } from 'lucide-vue-next';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import inputGroupTranslations from '@shared/content/input-group/translations.json';

import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.vue';
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
// O snippet de cada variante e de cada composição sai da MESMA transform que
// alimenta o painel Code das stories — duas cópias do mesmo exemplo divergem
// sem ninguém ver, e cada metade fica certa sozinha.
import { inputGroupSnippet } from '@/components/ui/input-group/input-group.source';

const SLUG = 'input-group';

/** Onde o botão de revelar a senha vive. Valor ESTÁVEL: nunca texto traduzido. */
type DemoLocation = 'docs_demo' | 'docs_composition';

// ─── i18n ─────────────────────────────────────────────────────────────────────

// O locale vem de `useTranslation`, nunca de Pinia — a leitura pela store já
// derrubou docs page desta stack em runtime.
const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(inputGroupTranslations);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
const screenReaderItems = computed(() =>
  Object.values(
    (inputGroupTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale.value]?.accessibility?.screenReader ?? {},
  ),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function localPriority(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: SLUG,
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/form' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: SLUG,
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Navigation groups ────────────────────────────────────────────────────────

// Com Variantes E Composições: o conteúdo compartilhado deste componente traz
// `variants.items` (as quatro posições do addon) e `variants.compositions` (as
// quatro montagens canônicas), e as duas seções são obrigatórias por isso.
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
    component_name: SLUG,
    locale: locale.value,
  });
});

// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImport = `import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";`;

const interfaceCode = `// InputGroup (a moldura)
interface InputGroupProps {
  class?: string;
}
// o nome acessível entra como atributo: aria-label="…" — OPCIONAL,
// ver a nota sobre nomear o grupo

// InputGroupAddon (o compartimento do acompanhamento)
interface InputGroupAddonProps {
  align?: 'inline-start' | 'inline-end' | 'block-start' | 'block-end';
  class?: string;
}

// InputGroupText — só o conteúdo do slot e os atributos nativos de <span>.

// InputGroupButton (compõe Button)
interface InputGroupButtonProps {
  size?: 'xs' | 'sm' | 'icon-xs' | 'icon-sm';   // repassada ao Button
  variant?: ButtonVariants['variant'];          // padrão 'ghost'
  type?: 'button' | 'submit' | 'reset';         // padrão 'button'
  class?: string;
}

// InputGroupInput / InputGroupTextarea — repassam todo atributo nativo de
// <input> e de <textarea>. O estado inválido é do CAMPO, e a moldura reage
// a ele por :has().`;

// ─── Rótulos da página ────────────────────────────────────────────────────────

const labels = computed(() => ({
  searchGroup: tContent('demonstration.labels.searchGroup'),
  searchField: tContent('demonstration.labels.searchField'),
  clear: tContent('demonstration.labels.clear'),
  password: tContent('demonstration.labels.password'),
  reveal: tContent('demonstration.labels.reveal'),
  hide: tContent('demonstration.labels.hide'),
  siteGroup: tContent('demonstration.labels.siteGroup'),
  siteField: tContent('demonstration.labels.siteField'),
  prefix: tContent('demonstration.labels.prefix'),
  paste: tContent('demonstration.labels.paste'),
  note: tContent('demonstration.labels.note'),
  send: tContent('demonstration.labels.send'),
  invalidMsg: tContent('demonstration.labels.invalidMsg'),
  shortcut: tContent('demonstration.labels.shortcut'),
  suffix: '.com',
}));

// ─── Ids do markup ────────────────────────────────────────────────────────────
//
// Constantes nomeadas, e não literais soltos: rótulo e campo se ligam por eles,
// e um literal divergente quebra a ligação sem erro nenhum na tela.

const DEMO_PASSWORD_ID = 'input-group-docs-demo-password';
const COMPOSITION_PASSWORD_ID = 'input-group-docs-composition-password';
const COMPOSITION_SITE_ID = 'input-group-docs-composition-site';
const DO_DONT_SITE_ID = 'input-group-docs-do-dont-site';
const DO_DONT_INVALID_ID = 'input-group-docs-do-dont-invalid';
const DO_DONT_INVALID_ERROR_ID = `${DO_DONT_INVALID_ID}-error`;

// ─── Demonstração ─────────────────────────────────────────────────────────────
//
// A demonstração é o campo de senha: é a composição que prova a decisão que
// mais custa quando se erra — o que age dentro da moldura é um BOTÃO, e o que
// ele fez é contado pela PALAVRA, não pelo desenho do ícone.
//
// Os dois campos de senha da página têm estado PRÓPRIO: um `ref` só faria os
// dois alternarem juntos, e quem lê acharia que clicou no errado.

const demoPasswordVisible = ref(false);
const compositionPasswordVisible = ref(false);

/**
 * O payload carrega só valor estável (slug, variante, lugar); texto traduzido
 * ali partiria um evento em três no GA4.
 *
 * Os dois invólucros existem porque o template DESEMBRULHA o `ref`: passado
 * daqui de dentro do template, `demoPasswordVisible` chegaria como booleano e a
 * alternância não escreveria em lugar nenhum. Chamado do script, o `ref` chega
 * inteiro.
 */
function togglePassword(visible: Ref<boolean>, location: DemoLocation) {
  track('button_click', {
    component: SLUG,
    variant: visible.value ? 'hide' : 'reveal',
    location,
  });
  visible.value = !visible.value;
}

function toggleDemoPassword() {
  togglePassword(demoPasswordVisible, 'docs_demo');
}

function toggleCompositionPassword() {
  togglePassword(compositionPasswordVisible, 'docs_composition');
}

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [1, 2, 3, 4, 5, 6].map(i => tContent(`anatomy.item${i}`)));

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
  items: [1, 2, 3, 4].map(i => ({
    s: tContent(`usage.scenarios.item${i}.s`),
    u: tContent(`usage.scenarios.item${i}.u`),
    a: tContent(`usage.scenarios.item${i}.a`),
  })),
}));

const uxWriting = computed(() => ({
  title: tContent('usage.uxWriting.title'),
  cols: {
    element: tContent('usage.uxWriting.table.element'),
    rules: tContent('usage.uxWriting.table.rules'),
    do: tContent('usage.uxWriting.table.correct'),
    dont: tContent('usage.uxWriting.table.avoid'),
  },
  items: ['prefix', 'suffix', 'addonButton', 'groupName'].map(k => ({
    element: tContent(`usage.uxWriting.table.${k}.name`),
    rules: tContent(`usage.uxWriting.table.${k}.format`),
    do: tContent(`usage.uxWriting.table.${k}.good`),
    dont: tContent(`usage.uxWriting.table.${k}.bad`),
  })),
}));

const doList = computed(() => ({
  title: tContent('usage.do.title'),
  items: [1, 2, 3, 4].map(i => tContent(`usage.do.item${i}`)),
}));

const dontList = computed(() => ({
  title: tContent('usage.dont.title'),
  items: [1, 2, 3, 4].map(i => tContent(`usage.dont.item${i}`)),
}));

const doDontPairs = computed(() => [1, 2, 3].map(i => ({
  doLabel: tNav('common.do'),
  dontLabel: tNav('common.dont'),
  doCaption: toPlainText(tContent(`doDont.pair${i}.do`)),
  dontCaption: toPlainText(tContent(`doDont.pair${i}.dont`)),
})));

// ─── Variantes ────────────────────────────────────────────────────────────────
//
// As quatro posições do addon. `trackId` é a CHAVE do item no conteúdo
// compartilhado, literal: o `name` chega traduzido, e sem ela o mesmo botão
// sairia com um valor por idioma no GA4.

const alignmentItems = computed(() =>
  ([
    ['inlineStart', 'inline-start'],
    ['inlineEnd', 'inline-end'],
    ['blockStart', 'block-start'],
    ['blockEnd', 'block-end'],
  ] as const).map(([key, align]) => {
    const stacked = align.startsWith('block');
    return {
      name: tContent(`variants.items.${key}.name`),
      description: tContent(`variants.items.${key}.description`),
      trackId: key,
      code: inputGroupSnippet({
        placeholder: stacked ? labels.value.note : labels.value.siteField,
        multiline: stacked,
        rows: stacked ? 2 : undefined,
        addons: [
          stacked
            ? { align, buttonLabel: labels.value.send }
            : { align, label: labels.value.prefix },
        ],
      }),
    };
  }),
);

// ─── Composições ──────────────────────────────────────────────────────────────

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.search.name'),
    description: tContent('variants.compositions.search.description'),
    useWhen: tContent('variants.compositions.search.use'),
    trackId: 'search',
    code: inputGroupSnippet({
      'aria-label': labels.value.searchGroup,
      'placeholder': labels.value.searchField,
      'addons': [
        { align: 'inline-start', icon: 'Search' },
        { align: 'inline-end', label: labels.value.shortcut },
      ],
    }),
  },
  {
    name: tContent('variants.compositions.password.name'),
    description: tContent('variants.compositions.password.description'),
    useWhen: tContent('variants.compositions.password.use'),
    trackId: 'password',
    code: inputGroupSnippet({
      'aria-label': labels.value.password,
      'addons': [
        {
          align: 'inline-end',
          buttonAccessibleName: labels.value.reveal,
          buttonIcon: 'Eye',
        },
      ],
    }),
  },
  {
    name: tContent('variants.compositions.affix.name'),
    description: tContent('variants.compositions.affix.description'),
    useWhen: tContent('variants.compositions.affix.use'),
    trackId: 'affix',
    code: inputGroupSnippet({
      placeholder: labels.value.siteField,
      visibleLabel: labels.value.siteGroup,
      addons: [
        { align: 'inline-start', label: labels.value.prefix },
        { align: 'inline-end', label: labels.value.suffix },
      ],
    }),
  },
  {
    name: tContent('variants.compositions.textareaToolbar.name'),
    description: tContent('variants.compositions.textareaToolbar.description'),
    useWhen: tContent('variants.compositions.textareaToolbar.use'),
    trackId: 'textareaToolbar',
    code: inputGroupSnippet({
      'aria-label': labels.value.note,
      'placeholder': labels.value.note,
      'multiline': true,
      'rows': 3,
      'addons': [{ align: 'block-end', buttonLabel: labels.value.send }],
    }),
  },
]);

// ─── Estados ──────────────────────────────────────────────────────────────────

const stateCols = computed(() => ({
  state: tContent('states.cols.state'),
  trigger: toPlainText(tContent('states.cols.trigger')),
  behavior: toPlainText(tContent('states.cols.behavior')),
}));

const stateItems = computed(() => ['rest', 'focus', 'invalid', 'disabled'].map(k => ({
  label: tContent(`states.${k}.label`),
  trigger: toPlainText(tContent(`states.${k}.trigger`)),
  behavior: toPlainText(tContent(`states.${k}.behavior`)),
})));

// ─── Propriedades ─────────────────────────────────────────────────────────────

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

/**
 * Uma linha da tabela de props.
 *
 * O NOME é desta stack (`class`, o slot padrão); a descrição vem do conteúdo
 * compartilhado, que a escreve sem citar API nenhuma.
 */
function propRow(name: string, key: string) {
  return {
    name,
    type: tContent(`props.table.${key}.type`),
    defaultValue: tContent(`props.table.${key}.default`),
    required: tContent(`props.table.${key}.required`),
    description: toPlainText(tContent(`props.table.${key}.description`)),
  };
}

const groupPropItems = computed(() => [propRow('aria-label', 'ariaLabel'), propRow('class', 'class')]);
const addonPropItems = computed(() => [propRow('align', 'align'), propRow('class', 'class')]);
const textPropItems = computed(() => [propRow('slot', 'text'), propRow('class', 'class')]);
const buttonPropItems = computed(() => [
  propRow('size', 'size'),
  propRow('variant', 'variant'),
  propRow('class', 'class'),
]);

// ─── Tokens ───────────────────────────────────────────────────────────────────
//
// Chave do conteúdo → token, conferidos um a um contra a folha
// `docs/shared/styles/nds/input-group.css`.

const tokenRows = computed(() => ([
  ['border',          '--input'],
  ['radius',          '--radius'],
  ['transition',      '--duration-fast'],
  ['ring',            '--ring'],
  ['destructive',     '--destructive'],
  ['disabledBg',      '--muted'],
  ['controlRadius',   '--radius-none'],
  ['textareaPadding', '--spacing-2'],
  ['addonPadding',    '--spacing-1-5'],
  ['addonGap',        '--spacing-2'],
  ['addonSize',       '--text-control'],
  ['addonWeight',     '--font-weight-medium'],
  ['addonColor',      '--muted-foreground'],
  ['addonInline',     '--spacing-2'],
  ['addonBlock',      '--spacing-2-5'],
  ['iconSize',        '--spacing-4'],
  ['buttonRadius',    '--radius-md'],
  ['buttonGap',       '--spacing-1'],
  ['buttonPadding',   '--spacing-1-5'],
] as const).map(([key, token]) => ({
  token,
  value: tContent(`tokens.table.${key}.class`),
  description: toPlainText(tContent(`tokens.table.${key}.part`)),
})));

// ─── Acessibilidade ───────────────────────────────────────────────────────────

const accessibilityItems = computed(() =>
  [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => tContent(`accessibility.items.item${i}`)),
);

const keyboardItems = computed(() => [
  { key: 'Tab',       description: toPlainText(tContent('accessibility.keyboard.tab'))      },
  { key: 'Shift+Tab', description: toPlainText(tContent('accessibility.keyboard.shiftTab')) },
  { key: 'Enter',     description: toPlainText(tContent('accessibility.keyboard.enter'))    },
  { key: 'Space',     description: toPlainText(tContent('accessibility.keyboard.space'))    },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.input.name'),    description: toPlainText(tContent('related.items.input.description')),    path: '?path=/docs/primitives-form-input--docs'    },
  { name: tContent('related.items.textarea.name'), description: toPlainText(tContent('related.items.textarea.description')), path: '?path=/docs/primitives-form-textarea--docs' },
  { name: tContent('related.items.button.name'),   description: toPlainText(tContent('related.items.button.description')),   path: '?path=/docs/primitives-form-button--docs'   },
  { name: tContent('related.items.form.name'),     description: toPlainText(tContent('related.items.form.description')),     path: '?path=/docs/primitives-form-form--docs'     },
]);

const noteItems = computed(() => [
  ...[1, 2, 3, 4, 5].map(i => ({ title: '', content: tContent(`notes.item${i}`) })),
  {
    title: '',
    // Não há forma declarada para somente-leitura, e a ausência é registrada:
    // inventar aqui uma classe que a folha não tem seria cravar o valor.
    content:
      '<strong>Não há forma declarada para somente-leitura.</strong> A folha compartilhada não desenha esse estado. Use o atributo <code>readonly</code> nativo no campo: ele é anunciado pelo leitor de tela e não gasta cor nenhuma.',
  },
]);

const analyticsItems = computed(() => [
  { event: 'button_click',        trigger: toPlainText(tContent('analytics.table.button_click.trigger')),        payload: tContent('analytics.table.button_click.payload')        },
  { event: 'docs_section_viewed', trigger: toPlainText(tContent('analytics.table.docs_section_viewed.trigger')), payload: tContent('analytics.table.docs_section_viewed.payload') },
]);

// ─── Testes ───────────────────────────────────────────────────────────────────

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const functionalTestItems = computed(() => [1, 2, 3, 4, 5].map(i => ({
  action:   toPlainText(tContent(`testes.functional.item${i}.action`)),
  result:   toPlainText(tContent(`testes.functional.item${i}.result`)),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() =>
  ([
    [1, '2.2 AA', 'axe-core via Storybook'],
    [2, '4.1.2', 'play (Playground)'],
    [3, '4.1.2', 'play (Playground)'],
    [4, '2.1.1', 'play (Playground)'],
    [5, '1.4.1', 'play (Invalid)'],
    [6, '4.1.3', 'play (Playground)'],
    [7, '1.4.4', 'play (Playground)'],
  ] as const).map(([i, level, how]) => ({
    criterion: toPlainText(tContent(`testes.accessibility.item${i}`)),
    level,
    how,
  })),
);

const visualTestItems = computed(() => [1, 2, 3, 4].map(i => ({
  story:    tContent(`testes.visual.item${i}.story`),
  priority: localPriority(tContent(`testes.visual.item${i}.priority`)),
})));
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    :component-slug="SLUG"
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
      :component-slug="SLUG"
    >
      <div
        class="nds-stack nds-w-full"
        data-spacing="sm"
      >
        <label
          class="nds-label"
          :for="DEMO_PASSWORD_ID"
        >{{ labels.password }}</label>
        <InputGroup :aria-label="labels.password">
          <InputGroupInput
            :id="DEMO_PASSWORD_ID"
            :type="demoPasswordVisible ? 'text' : 'password'"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              :aria-label="demoPasswordVisible ? labels.hide : labels.reveal"
              @click="toggleDemoPassword"
            >
              <EyeOff
                v-if="demoPasswordVisible"
                aria-hidden="true"
              />
              <Eye
                v-else
                aria-hidden="true"
              />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ───────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <!-- ── Quando Usar ────────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="guidelines"
      :scenarios="scenarios"
      :ux-writing="uxWriting"
      :do="doList"
      :dont="dontList"
    />

    <!-- ── Do & Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="doDontPairs"
    >
      <!-- Par 1 — o acompanhamento que age é um botão de verdade -->
      <template #do-preview-0>
        <InputGroup :aria-label="labels.searchGroup">
          <InputGroupInput :placeholder="labels.searchField" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              :aria-label="labels.clear"
            >
              <EyeOff aria-hidden="true" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </template>
      <template #dont-preview-0>
        <!-- O painel "não faça" mostra o FORMATO do defeito sem plantá-lo: o
             acompanhamento é texto inerte, e a legenda é quem conta que a forma
             errada é pendurar um clique num bloco desses. Plantar um `@click`
             num `<div>` aqui deixaria a própria página de documentação com um
             controle inalcançável por teclado. -->
        <InputGroup>
          <InputGroupInput :placeholder="labels.searchField" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>{{ labels.clear }}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </template>

      <!-- Par 2 — o erro aparece na moldura E em texto ligado ao campo -->
      <template #do-preview-1>
        <div
          class="nds-stack nds-w-full"
          data-spacing="sm"
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <InputGroupText>{{ labels.prefix }}</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              :id="DO_DONT_INVALID_ID"
              :placeholder="labels.siteField"
              aria-invalid="true"
              :aria-describedby="DO_DONT_INVALID_ERROR_ID"
            />
          </InputGroup>
          <!-- Dentro da moldura, o texto herdaria o `cursor: text` do addon e
               disputaria a largura com o que a pessoa digita. -->
          <p
            :id="DO_DONT_INVALID_ERROR_ID"
            class="nds-text-caption nds-text-destructive"
          >
            {{ labels.invalidMsg }}
          </p>
        </div>
      </template>
      <template #dont-preview-1>
        <!-- Só a moldura vermelha: quem não distingue a cor não fica sabendo de
             nada. O atributo está lá — é ele que pinta —, mas não há texto
             nenhum ligado a ele. -->
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>{{ labels.prefix }}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            :placeholder="labels.siteField"
            aria-invalid="true"
          />
        </InputGroup>
      </template>

      <!-- Par 3 — o rótulo visível nomeia; o prefixo só completa o formato -->
      <template #do-preview-2>
        <div
          class="nds-stack nds-w-full"
          data-spacing="sm"
        >
          <label
            class="nds-label"
            :for="DO_DONT_SITE_ID"
          >{{ labels.siteGroup }}</label>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <InputGroupText>{{ labels.prefix }}</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              :id="DO_DONT_SITE_ID"
              :placeholder="labels.siteField"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>{{ labels.suffix }}</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </template>
      <template #dont-preview-2>
        <!-- Sem rótulo: o campo fica sem nome, e `https://` não é o assunto
             dele. O leitor de tela anuncia só "campo de edição". -->
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>{{ labels.prefix }}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput :placeholder="labels.siteField" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>{{ labels.suffix }}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="stripHtml(tContent('description'))"
      :code="codeImport"
      :component-slug="SLUG"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsVariants
      :title="tContent('variants.title')"
      :note="tContent('variants.note')"
      :component-slug="SLUG"
      :items="alignmentItems"
    >
      <template #variant-preview-0>
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>{{ labels.prefix }}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput :placeholder="labels.siteField" />
        </InputGroup>
      </template>

      <template #variant-preview-1>
        <InputGroup>
          <InputGroupInput :placeholder="labels.siteField" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>{{ labels.prefix }}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </template>

      <template #variant-preview-2>
        <InputGroup>
          <InputGroupAddon align="block-start">
            <InputGroupButton>{{ labels.send }}</InputGroupButton>
          </InputGroupAddon>
          <InputGroupTextarea
            :rows="2"
            :placeholder="labels.note"
          />
        </InputGroup>
      </template>

      <template #variant-preview-3>
        <InputGroup>
          <InputGroupTextarea
            :rows="2"
            :placeholder="labels.note"
          />
          <InputGroupAddon align="block-end">
            <InputGroupButton>{{ labels.send }}</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </template>
    </DocsVariants>

    <!-- ── Composições ────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      :component-slug="SLUG"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <InputGroup :aria-label="labels.searchGroup">
          <InputGroupAddon align="inline-start">
            <Search aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput :placeholder="labels.searchField" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>{{ labels.shortcut }}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </template>

      <template #variant-preview-1>
        <div
          class="nds-stack nds-w-full"
          data-spacing="sm"
        >
          <label
            class="nds-label"
            :for="COMPOSITION_PASSWORD_ID"
          >{{ labels.password }}</label>
          <InputGroup :aria-label="labels.password">
            <InputGroupInput
              :id="COMPOSITION_PASSWORD_ID"
              :type="compositionPasswordVisible ? 'text' : 'password'"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                :aria-label="compositionPasswordVisible ? labels.hide : labels.reveal"
                @click="toggleCompositionPassword"
              >
                <EyeOff
                  v-if="compositionPasswordVisible"
                  aria-hidden="true"
                />
                <Eye
                  v-else
                  aria-hidden="true"
                />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </template>

      <template #variant-preview-2>
        <div
          class="nds-stack nds-w-full"
          data-spacing="sm"
        >
          <label
            class="nds-label"
            :for="COMPOSITION_SITE_ID"
          >{{ labels.siteGroup }}</label>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <InputGroupText>{{ labels.prefix }}</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              :id="COMPOSITION_SITE_ID"
              :placeholder="labels.siteField"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>{{ labels.suffix }}</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </template>

      <template #variant-preview-3>
        <InputGroup :aria-label="labels.note">
          <InputGroupTextarea
            :rows="3"
            :placeholder="labels.note"
          />
          <InputGroupAddon align="block-end">
            <InputGroupButton>{{ labels.send }}</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </template>
    </DocsCompositions>

    <!-- ── Estados ────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="stateCols"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: 'InputGroup', cols: propCols, items: groupPropItems },
        { title: 'InputGroupAddon', cols: propCols, items: addonPropItems },
        { title: 'InputGroupText', cols: propCols, items: textPropItems },
        { title: 'InputGroupButton', cols: propCols, items: buttonPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-code="tContent('props.extensibilityCode')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{ token: tContent('tokens.table.token'), value: tContent('tokens.table.class'), description: tContent('tokens.table.part') }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="tContent('tokens.customizationCode')"
      language="css"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboard.title')"
      :keyboard-items="keyboardItems"
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
      :component-slug="SLUG"
    />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
      :component-slug="SLUG"
    />

    <!-- ── Analytics ──────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{ event: tContent('analytics.table.event'), trigger: toPlainText(tContent('analytics.table.trigger')), payload: tContent('analytics.table.payload') }"
      :items="analyticsItems"
    />

    <!-- ── Testes ─────────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
      :functional="{
        title: tContent('testes.functional.title'),
        description: tContent('testes.functional.description'),
        cols: { action: tNav('common.userAction'), result: tNav('common.expectedResult'), priority: tNav('common.priority') },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        description: tContent('testes.accessibility.description'),
        cols: a11yCritCols,
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        description: tContent('testes.visual.description'),
        cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
