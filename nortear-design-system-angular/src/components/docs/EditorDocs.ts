import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  TemplateRef,
  ViewEncapsulation,
  signal,
  viewChild,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NdsButton } from '@/components/ui/button';
import { EditorComponent, type EditorLabels, type EditorPreset } from '@/components/ui/editor';
import { EDITOR_CONTENT, EDITOR_LABELS } from '@/components/ui/editor.fixtures';
import uiTranslations from '@/i18n/ui.json';
import editorTranslations from '@shared/content/editor/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsVariants,
  NdsDocsStates,
  NdsDocsProps,
  NdsDocsTokens,
  NdsDocsAccessibility,
  NdsDocsRelated,
  NdsDocsNotes,
  NdsDocsAnalytics,
  NdsDocsTestes,
} from '@/components/docs/shared/sections';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// A saída de mudança se chama `(changed)` nesta stack — o conteúdo compartilhado
// descreve o conceito ("callback de mudança") justamente para não amarrar o
// nome. O override é o lugar certo dessa tradução: texto de prop, nunca snippet.
const { t, dict } = useTranslation(editorTranslations as Record<string, unknown>, {
  '*': { 'props.table.onChange.name': '(changed)' },
});

const SLUG = 'editor';

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

/**
 * Reconstrói linhas de tabela a partir do dicionário achatado.
 *
 * O conteúdo compartilhado numera as linhas como `item1`, `item2`… e `t()` só
 * devolve folha. Percorre até a primeira lacuna, o que evita repetir na docs
 * page um `[1,2,3…]` que envelhece quando o ux-writer acrescenta uma linha.
 */
function itemsFromDict<K extends string>(
  d: Record<string, string>,
  base: string,
  fields: readonly K[],
): Record<K, string>[] {
  const rows: Record<K, string>[] = [];
  for (let i = 1; ; i++) {
    if (d[`${base}.item${i}.${fields[0]}`] === undefined) break;
    const row = {} as Record<K, string>;
    for (const f of fields) row[f] = d[`${base}.item${i}.${f}`] ?? '';
    rows.push(row);
  }
  return rows;
}

/** As linhas numeradas de uma lista simples (`base.item1`, `base.item2`…). */
function listFromDict(d: Record<string, string>, base: string): string[] {
  const items: string[] = [];
  for (let i = 1; d[`${base}.item${i}`] !== undefined; i++) items.push(d[`${base}.item${i}`]);
  return items;
}

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
  { labelKey: 'nav.overview', sections: [
    { id: 'demonstracao', labelKey: 'nav.demonstration' },
    { id: 'anatomia',     labelKey: 'nav.anatomy'       },
    { id: 'quando-usar',  labelKey: 'nav.usage'         },
    { id: 'do-dont',      labelKey: 'nav.doDont'        },
  ]},
  { labelKey: 'nav.techRef', sections: [
    { id: 'importacao',   labelKey: 'nav.import'  },
    { id: 'variantes',    labelKey: 'nav.variants' },
    { id: 'estados',      labelKey: 'nav.states'  },
    { id: 'propriedades', labelKey: 'nav.props'   },
    { id: 'tokens',       labelKey: 'nav.tokens'  },
  ]},
  { labelKey: 'nav.context', sections: [
    { id: 'acessibilidade', labelKey: 'nav.accessibility' },
    { id: 'relacionados',   labelKey: 'nav.related'       },
    { id: 'notas',          labelKey: 'nav.notes'         },
  ]},
  { labelKey: 'nav.quality', sections: [
    { id: 'analytics', labelKey: 'nav.analytics' },
    { id: 'testes',    labelKey: 'nav.testes'    },
  ]},
];

/**
 * Rótulos do par 1 do Do & Don't.
 *
 * O contraste é só de RÓTULO: os dois editores são o mesmo conjunto básico, e o
 * que muda são os nomes acessíveis do link e da tabela — verbo da ação de um
 * lado, nome da marcação do outro. É o que o texto do par diz.
 */
function withLabels(link: string, table: string): EditorLabels {
  return {
    ...EDITOR_LABELS,
    actions: { ...EDITOR_LABELS.actions, link, table },
  };
}

const VERB_LABELS = withLabels('Inserir link', 'Inserir tabela');
const NOUN_LABELS = withLabels('Link', 'Tabela');

/** Conteúdo curto dos quatro previews do Do & Don't. */
const DO_DONT_CONTENT = '<p>Ótimo trabalho, obrigado!</p>';

@Component({
  selector: 'nds-editor-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsButton, EditorComponent,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!--
      Previews declarados antes do layout: DocsDoDont e DocsVariants recebem
      TemplateRef, então os componentes demonstrados são reais (com bindings e
      change detection), não DOM montado à mão.
    -->
    <ng-template #tplDoDont1Do>
      <nds-editor [labels]="verbLabels" [content]="doDontContent" preset="basic" />
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <nds-editor [labels]="nounLabels" [content]="doDontContent" preset="basic" />
    </ng-template>
    <ng-template #tplDoDont2Do>
      <nds-editor [labels]="labels" [content]="doDontContent" preset="basic" />
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <nds-editor [labels]="labels" [content]="doDontContent" preset="advanced" />
    </ng-template>

    <ng-template #tplVarBasic>
      <nds-editor [labels]="labels" [content]="basicContent" preset="basic" />
    </ng-template>
    <ng-template #tplVarAdvanced>
      <nds-editor [labels]="labels" [content]="advancedContent" preset="advanced" />
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="editor"
    >
      <div docsHeader>
        <nds-docs-header
          [title]="t('title')"
          [description]="t('description')"
          [category]="t('category')"
          [type]="t('type')"
        />
      </div>

      <ng-container docsMain>
        <!-- 1. Demonstração -->
        <nds-docs-demonstration [title]="t('demonstration.title')">
          <div class="nds-stack nds-w-full" data-spacing="md">
            <div class="nds-cluster" data-spacing="sm">
              @for (control of demoControls(); track control.id) {
                <button
                  ndsButton
                  variant="outline"
                  type="button"
                  [attr.aria-pressed]="control.pressed"
                  (click)="onDemoClick(control.id)"
                >{{ control.label }}</button>
              }
            </div>
            <nds-editor
              [labels]="labels"
              [content]="demoContent"
              [preset]="demoPreset()"
              [editable]="!demoReadOnly()"
            />
          </div>
        </nds-docs-demonstration>

        <!-- 2. Anatomia -->
        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="t('anatomy.structureCode')"
          language="html"
        />

        <!-- 3. Quando usar -->
        <nds-docs-when-to-use
          [title]="t('usage.title')"
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <!-- 4. Do / Don't -->
        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <!-- 5. Importação -->
        <nds-docs-import
          [title]="t('import.title')"
          [description]="t('import.basic')"
          [code]="t('import.basicCode')"
          [secondaryDescription]="t('import.withStorage')"
          [secondaryCode]="t('import.withStorageCode')"
          componentSlug="editor"
          language="ts"
        />

        <!-- 6. Conjuntos -->
        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="editor"
          id="variantes"
        />

        <!-- 7. Estados -->
        <nds-docs-states
          [title]="t('states.title')"
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <!-- 8. Propriedades -->
        <nds-docs-props
          [title]="t('props.title')"
          [tables]="propTables()"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityNotes]="t('props.extensibility')"
          [extensibilityCode]="t('props.extensibilityCode')"
        />

        <!-- 9. Tokens -->
        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="t('tokens.customizationCode')"
        />

        <!-- 10. Acessibilidade -->
        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboardTitle')"
          [keyboardItems]="keyboardItems()"
        />

        <!-- 11. Relacionados -->
        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="editor"
        />

        <!-- 12. Notas -->
        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="editor"
        />

        <!-- 13. Analytics -->
        <nds-docs-analytics
          [title]="t('analytics.title')"
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

        <!-- 14. Testes -->
        <nds-docs-testes
          [title]="t('testes.title')"
          [functional]="testesFunctional()"
          [accessibility]="testesAccessibility()"
          [visual]="testesVisual()"
        />
      </ng-container>
    </nds-docs-page-layout>
  `,
})
export class NdsEditorDocs implements AfterViewInit, OnDestroy {
  // `t` e `tNav` expostos ao template: o dicionário é reativo ao signal de
  // locale, então trocar de idioma re-renderiza a página inteira.
  protected readonly t = t;
  protected readonly tNav = tNav;

  protected readonly activeSection = signal<string | undefined>(undefined);

  // Os rótulos do editor não vêm do conteúdo compartilhado — não há chave
  // `labels.*` em idioma nenhum. Ver a nota em `editor.fixtures.ts`.
  protected readonly labels = EDITOR_LABELS;
  protected readonly verbLabels = VERB_LABELS;
  protected readonly nounLabels = NOUN_LABELS;
  protected readonly doDontContent = DO_DONT_CONTENT;
  protected readonly basicContent = EDITOR_CONTENT.basic;
  protected readonly advancedContent = EDITOR_CONTENT.advanced;
  protected readonly demoContent = EDITOR_CONTENT.playground;

  // ── Templates de preview ─────────────────────────────────────────────────
  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarBasic = viewChild.required<TemplateRef<unknown>>('tplVarBasic');
  private readonly tplVarAdvanced = viewChild.required<TemplateRef<unknown>>('tplVarAdvanced');

  // ── Navegação ────────────────────────────────────────────────────────────
  protected readonly navGroups = computed(() => {
    // Leitura do dicionário para amarrar este computed ao signal de locale:
    // `tNav` sozinho é uma função comum e não registraria a dependência.
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  // ── Demonstração ─────────────────────────────────────────────────────────
  protected readonly demoPreset = signal<EditorPreset>('advanced');
  protected readonly demoReadOnly = signal(false);

  protected readonly demoControls = computed(() => {
    dict();
    return [
      {
        id: 'basic',
        label: t('demonstration.labels.basic'),
        pressed: this.demoPreset() === 'basic',
      },
      {
        id: 'advanced',
        label: t('demonstration.labels.advanced'),
        pressed: this.demoPreset() === 'advanced',
      },
      { id: 'readOnly', label: t('demonstration.labels.readOnly'), pressed: this.demoReadOnly() },
    ];
  });

  protected onDemoClick(id: string): void {
    if (id === 'readOnly') this.demoReadOnly.update((v) => !v);
    else this.demoPreset.set(id as EditorPreset);
    // Payload com valor ESTÁVEL, nunca o texto traduzido: o rótulo dividiria um
    // evento em três no GA4.
    track('docs_demo_click', { component: SLUG, element_id: id });
  }

  // ── Anatomia ─────────────────────────────────────────────────────────────
  protected readonly anatomyItems = computed(() => {
    const d = dict();
    return listFromDict(d, 'anatomy');
  });

  // ── Quando usar ──────────────────────────────────────────────────────────
  //
  // O conteúdo do editor traz `usage.guidelines` como parágrafo único e os
  // cenários como frases soltas — sem as colunas "usar?" e "alternativa" que
  // todos os outros componentes declaram. O container é de três colunas, então a
  // resposta e a alternativa saem do que existe: o cenário é um caso de uso do
  // próprio componente, e não há alternativa por linha a nomear.
  protected readonly guidelines = computed(() => {
    dict();
    return { title: t('usage.title'), items: [t('usage.guidelines'), t('usage.uxWriting')] };
  });

  protected readonly scenarios = computed(() => {
    const d = dict();
    return {
      cols: {
        scenario: t('usage.title'),
        use: t('title'),
        alternative: t('related.alternatives'),
      },
      items: listFromDict(d, 'usage.scenarios').map((s) => ({
        s,
        u: tNav('common.yes'),
        a: '—',
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    const d = dict();
    return { title: tNav('common.do'), items: listFromDict(d, 'usage.do') };
  });

  protected readonly usageDont = computed(() => {
    const d = dict();
    return { title: tNav('common.dont'), items: listFromDict(d, 'usage.dont') };
  });

  // ── Do / Don't ───────────────────────────────────────────────────────────
  protected readonly doDontPairs = computed(() => {
    dict();
    return [
      {
        doLabel: tNav('common.do'),
        dontLabel: tNav('common.dont'),
        doCaption: toPlainText(t('doDont.pair1.do')),
        dontCaption: toPlainText(t('doDont.pair1.dont')),
        doPreview: this.tplDoDont1Do(),
        dontPreview: this.tplDoDont1Dont(),
      },
      {
        doLabel: tNav('common.do'),
        dontLabel: tNav('common.dont'),
        doCaption: toPlainText(t('doDont.pair2.do')),
        dontCaption: toPlainText(t('doDont.pair2.dont')),
        doPreview: this.tplDoDont2Do(),
        dontPreview: this.tplDoDont2Dont(),
      },
    ];
  });

  // ── Conjuntos ────────────────────────────────────────────────────────────
  protected readonly variantItems = computed(() => {
    dict();
    return [
      {
        // `name` é chave ESTÁVEL, não traduzida: é ela que vira o `snippet_id`
        // do `docs_code_copy`.
        name: t('variants.items.basic.name'),
        description: t('variants.items.basic.description'),
        trackId: 'basic',
        preview: this.tplVarBasic(),
      },
      {
        name: t('variants.items.advanced.name'),
        description: t('variants.items.advanced.description'),
        trackId: 'advanced',
        preview: this.tplVarAdvanced(),
      },
    ];
  });

  // ── Estados ──────────────────────────────────────────────────────────────
  //
  // O conteúdo declara duas colunas (`states.cols`), e o container tem três. A
  // terceira recebe o rótulo genérico do `ui.json` e a marca de "não se aplica"
  // — a mesma que as tabelas de propriedades usam para valor ausente.
  protected readonly statesCols = computed(() => {
    dict();
    return {
      state: t('states.cols.state'),
      trigger: t('states.cols.description'),
      behavior: tNav('common.stateBehavior'),
    };
  });

  protected readonly stateItems = computed(() => {
    dict();
    return ['editing', 'readOnly', 'imageSelected', 'inTable', 'fieldOpen', 'invalidValue'].map(
      (key) => {
        const line = t(`states.${key}`);
        // "Editando — o padrão. A barra reflete…": o nome do estado vem antes do
        // travessão, a descrição depois. É a forma que o conteúdo usa nas seis.
        const [stateName, ...rest] = line.split(' — ');
        return {
          label: stateName,
          trigger: rest.join(' — ') || line,
          behavior: '—',
        };
      },
    );
  });

  // ── Propriedades ─────────────────────────────────────────────────────────
  protected readonly propTables = computed(() => {
    dict();
    const cols = {
      prop: t('props.table.prop'),
      type: t('props.table.type'),
      default: t('props.table.default'),
      required: t('props.table.required'),
      description: t('props.table.description'),
    };
    const keys = [
      'content', 'editable', 'preset', 'labels',
      'onChange', 'resolveImage', 'describeImage',
    ];
    return [
      {
        title: t('props.interface'),
        cols,
        items: keys.map((k) => ({
          name: t(`props.table.${k}.name`),
          type: t(`props.table.${k}.type`),
          defaultValue: t(`props.table.${k}.default`),
          required: t(`props.table.${k}.required`),
          description: toPlainText(t(`props.table.${k}.description`)),
        })),
      },
    ];
  });

  // ── Tokens ───────────────────────────────────────────────────────────────
  protected readonly tokensCols = computed(() => {
    dict();
    return {
      token: t('tokens.table.token'),
      value: tNav('common.cssClass'),
      description: t('tokens.table.usage'),
    };
  });

  protected readonly tokenItems = computed(() => {
    dict();
    const rows: { key: string; cssClass: string }[] = [
      { key: 'border',          cssClass: '.nds-editor'         },
      { key: 'background',      cssClass: '.nds-editor'         },
      { key: 'muted',           cssClass: '.nds-editor-toolbar' },
      { key: 'mutedForeground', cssClass: '.nds-editor-content' },
      { key: 'foreground',      cssClass: '.nds-editor-content' },
      { key: 'primary',         cssClass: '.nds-editor-content' },
      { key: 'accent',          cssClass: '.nds-editor-content' },
      { key: 'ring',            cssClass: '.nds-editor'         },
      { key: 'textH1',          cssClass: '.nds-editor-content' },
    ];
    return rows.map(({ key, cssClass }) => ({
      token: t(`tokens.table.${key}.name`),
      value: cssClass,
      description: t(`tokens.table.${key}.usage`),
    }));
  });

  // ── Acessibilidade ───────────────────────────────────────────────────────
  protected readonly a11yItems = computed(() => {
    const d = dict();
    return listFromDict(d, 'accessibility');
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return ['tab', 'arrows', 'homeEnd', 'enter', 'escape'].map((k) => ({
      key: t(`accessibility.keyboard.${k}.key`),
      description: toPlainText(t(`accessibility.keyboard.${k}.action`)),
    }));
  });

  // ── Relacionados ─────────────────────────────────────────────────────────
  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { name: 'Textarea',    description: t('related.textarea'),    path: '?path=/docs/ui-textarea--docs'     },
      { name: 'Code Block',  description: t('related.codeBlock'),   path: '?path=/docs/ui-codeblock--docs'    },
      { name: 'Toggle Group', description: t('related.toggleGroup'), path: '?path=/docs/ui-togglegroup--docs' },
      { name: 'Button',      description: t('related.button'),      path: '?path=/docs/ui-button--docs'       },
    ];
  });

  // ── Notas ────────────────────────────────────────────────────────────────
  protected readonly noteItems = computed(() => {
    const d = dict();
    const tips: { title: string; content: string }[] = [];
    for (let i = 1; d[`notes.tip${i}`] !== undefined; i++) {
      tips.push({ title: '', content: d[`notes.tip${i}`] });
    }
    return tips;
  });

  // ── Analytics ────────────────────────────────────────────────────────────
  protected readonly analyticsCols = computed(() => {
    dict();
    return {
      event: t('analytics.table.event'),
      trigger: t('analytics.table.trigger'),
      payload: t('analytics.table.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    return ['pageView', 'sectionViewed', 'demoClick'].map((k) => ({
      event: t(`analytics.table.${k}`),
      trigger: t(`analytics.table.${k}Trigger`),
      payload: t(`analytics.table.${k}Payload`),
    }));
  });

  // ── Testes ───────────────────────────────────────────────────────────────
  protected readonly testesFunctional = computed(() => {
    const d = dict();
    return {
      title: t('testes.functional.title'),
      description: t('testes.functional.description'),
      cols: {
        action: tNav('common.userAction'),
        result: tNav('common.expectedResult'),
        priority: tNav('common.priority'),
      },
      // toPlainText/stripHtml: as células são texto puro (interpolação), então
      // um <code> do conteúdo apareceria como marcação literal na tabela.
      items: itemsFromDict(d, 'testes.functional', ['action', 'result', 'priority']).map((r) => ({
        action: toPlainText(r.action),
        result: stripHtml(toPlainText(r.result)),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  /**
   * A tabela de acessibilidade do container é `critério / nível / como`, e o
   * conteúdo do editor numera esta seção como `ação / resultado / prioridade`,
   * igual à funcional. O mapeamento é direto: a ação é o critério, o resultado é
   * como se verifica, e a prioridade ocupa a coluna do meio com o rótulo do
   * `ui.json`.
   */
  protected readonly testesAccessibility = computed(() => {
    const d = dict();
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: {
        criterion: tNav('common.criterion'),
        level: tNav('common.priority'),
        how: tNav('common.howToVerify'),
      },
      items: itemsFromDict(d, 'testes.accessibility', ['action', 'result', 'priority']).map((r) => ({
        criterion: toPlainText(r.action),
        level: priorityLabel(r.priority),
        how: stripHtml(toPlainText(r.result)),
      })),
    };
  });

  protected readonly testesVisual = computed(() => {
    const d = dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
      items: itemsFromDict(d, 'testes.visual', ['action', 'result', 'priority']).map((r) => ({
        story: `${toPlainText(r.action)} — ${stripHtml(toPlainText(r.result))}`,
        priority: priorityLabel(r.priority),
      })),
    };
  });

  // ── SEO + observador de seção ────────────────────────────────────────────
  private observer: { disconnect: () => void } | undefined;
  private cleanupSeo: (() => void) | undefined;

  constructor() {
    // effect e não `subscribe`: o SEO precisa ser reaplicado a cada troca de
    // idioma, e a dependência do signal de locale entra pela leitura de `dict()`.
    effect((onCleanup) => {
      dict();
      const locale = getLocale();
      const cleanup = applySeo({
        // `seo.title` vem SEM o sufixo "· Design System": quem o acrescenta é o
        // próprio hook.
        title: t('seo.title'),
        description: t('seo.description'),
        locale,
        componentSlug: SLUG,
        aiSummary: t('seo.aiSummary'),
        aiEntities: t('seo.aiEntities'),
        breadcrumb: [
          { name: 'Components', item: '/components' },
          { name: t('category'), item: '/components/form' },
          { name: t('title') },
        ],
      });
      track('docs_page_view', {
        component_name: SLUG,
        locale,
        page_title: `${t('title')} · Design System`,
      });
      onCleanup(cleanup);
    });
  }

  ngAfterViewInit(): void {
    this.observer = createActiveSectionObserver(
      [...SECTION_IDS],
      (id) => document.getElementById(id),
      (id) => this.activeSection.set(id),
      (id) =>
        track('docs_section_viewed', {
          component_name: SLUG,
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.cleanupSeo?.();
  }
}
