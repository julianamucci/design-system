import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  viewChild,
  TemplateRef,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { RdxTabsValue } from '@radix-ng/primitives/tabs';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import {
  NdsTabs,
  NdsTabsList,
  NdsTabsTrigger,
  NdsTabsContent,
  NdsTabsIcon,
} from '@/components/ui/tabs';
import { NdsBadge } from '@/components/ui/badge';
import uiTranslations from '@/i18n/ui.json';
import tabsTranslations from '@shared/content/tabs/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsVariants,
  NdsDocsCompositions,
  NdsDocsStates,
  NdsDocsProps,
  NdsDocsTokens,
  NdsDocsAccessibility,
  NdsDocsRelated,
  NdsDocsNotes,
  NdsDocsAnalytics,
  NdsDocsTestes,
} from '@/components/docs/shared/sections';

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// Overrides: só texto DESCRITIVO que muda (ou nasce) nesta stack. Nenhum
// snippet `*Code` entra aqui — snippet em override fica preso a um stack e
// some do conteúdo compartilhado; os que divergem viram const neste arquivo,
// com a divergência reportada.
//
// `notes.item1` NÃO entra mais: o texto compartilhado deixou de listar lib por
// nome e passou a descrever a separação entre camada de comportamento e camada
// visual, que vale igual aqui. Override que só repete o conteúdo compartilhado
// é conteúdo preso a uma stack.
// `notes.item5` — comportamento que só existe aqui.
// `props.*` — nomes de prop deste stack e as duas props que o conteúdo
// compartilhado não descreve (o `value` obrigatório do trigger e do painel, e o
// `disabled` do trigger).
const { t, dict } = useTranslation(tabsTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.className.description':
      'Classes extras escritas no elemento são mescladas com as do componente; não há prop de classe.',
    'props.triggerValue.description':
      'Identificador da aba. É ele que amarra a aba ao painel de mesmo valor.',
    'props.contentValue.description':
      'Identificador do painel. Precisa ser igual ao da aba correspondente.',
    'props.triggerDisabled.description':
      'Bloqueia a interação com a aba. A aba continua alcançável pelas setas, para ser anunciada como desabilitada.',
    'props.loopFocus.description':
      'Quando verdadeiro (padrão), a seta dá a volta da última aba para a primeira.',
    'notes.item5':
      '<strong>Aba desabilitada</strong> — marcada com <code>aria-disabled</code>, sem o atributo <code>disabled</code> nativo: o padrão WAI-ARIA pede que a seta possa pousar nela para ser anunciada, e um botão nativamente desabilitado sai do alcance do foco. Nem o clique nem Enter/Espaço ativam a aba.',
  },
  en: {
    'props.table.className.description':
      'Extra classes written on the element are merged with the component ones; there is no class prop.',
    'props.triggerValue.description':
      'Tab identifier. It is what ties the tab to the panel with the same value.',
    'props.contentValue.description':
      'Panel identifier. Must match the corresponding tab.',
    'props.triggerDisabled.description':
      'Blocks interaction with the tab. The tab stays reachable by arrow keys so it can be announced as disabled.',
    'props.loopFocus.description':
      'When true (default), arrow keys wrap from the last tab back to the first.',
    'notes.item5':
      '<strong>Disabled tab</strong> — marked with <code>aria-disabled</code>, without the native <code>disabled</code> attribute: the WAI-ARIA pattern asks that arrow keys can land on it so it gets announced, and a natively disabled button leaves the focus order. Neither click nor Enter/Space activates the tab.',
  },
  es: {
    'props.table.className.description':
      'Las clases extra escritas en el elemento se combinan con las del componente; no hay prop de clase.',
    'props.triggerValue.description':
      'Identificador de la tab. Es lo que la vincula al panel del mismo valor.',
    'props.contentValue.description':
      'Identificador del panel. Debe coincidir con el de la tab correspondiente.',
    'props.triggerDisabled.description':
      'Bloquea la interacción con la tab. La tab sigue alcanzable por las flechas para ser anunciada como deshabilitada.',
    'props.loopFocus.description':
      'Cuando es verdadero (por defecto), la flecha da la vuelta de la última tab a la primera.',
    'notes.item5':
      '<strong>Tab deshabilitada</strong> — marcada con <code>aria-disabled</code>, sin el atributo <code>disabled</code> nativo: el patrón WAI-ARIA pide que las flechas puedan posarse en ella para anunciarla, y un botón nativamente deshabilitado sale del orden de foco. Ni el clic ni Enter/Espacio activan la tab.',
  },
});

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

// Os rótulos de navegação saem do `ui.json`, não do conteúdo do componente:
// `tabs/translations.json` não tem `nav.compositions`, e ler de lá deixaria a
// seção Composições com a própria chave impressa como título no menu.
const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
  { labelKey: 'nav.overview', sections: [
    { id: 'demonstracao', labelKey: 'nav.demonstration' },
    { id: 'anatomia',     labelKey: 'nav.anatomy'       },
    { id: 'quando-usar',  labelKey: 'nav.usage'         },
    { id: 'do-dont',      labelKey: 'nav.doDont'        },
  ]},
  { labelKey: 'nav.techRef', sections: [
    { id: 'importacao',   labelKey: 'nav.import'       },
    { id: 'variantes',    labelKey: 'nav.variants'     },
    { id: 'composicoes',  labelKey: 'nav.compositions' },
    { id: 'estados',      labelKey: 'nav.states'       },
    { id: 'propriedades', labelKey: 'nav.props'        },
    { id: 'tokens',       labelKey: 'nav.tokens'       },
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

// Hardcoded, e não `t('anatomy.structureCode')`: a variante `angular` do
// conteúdo compartilhado descreve um elemento `<nds-tabs>` que este stack não
// usa — aqui o seletor é de atributo, sobre `<div>` e `<button>` nativos, para o
// markup e o CSS `.nds-*` baterem com o das outras stacks. Mesmo caminho do
// SwitchDocs e do RadioGroupDocs. A correção do conteúdo está reportada.
const ANATOMY_CODE = `<div ndsTabs defaultValue="overview">
  <div ndsTabsList aria-label="Seções do componente">
    <button ndsTabsTrigger value="overview">Visão geral</button>
    <button ndsTabsTrigger value="properties">Propriedades</button>
    <button ndsTabsTrigger value="examples">Exemplos</button>
  </div>
  <div ndsTabsContent value="overview">Conteúdo da visão geral</div>
  <div ndsTabsContent value="properties">Lista de propriedades</div>
  <div ndsTabsContent value="examples">Exemplos de uso</div>
</div>`;

const INTERFACE_CODE = `// <div ndsTabs> + <div ndsTabsList> + <button ndsTabsTrigger> + <div ndsTabsContent>
@Directive({
  selector: 'div[ndsTabs]',
  hostDirectives: [
    { directive: RdxTabsRoot,
      inputs: ['value', 'defaultValue', 'orientation'],
      outputs: ['valueChange', 'onValueChange'] },
  ],
})
export class NdsTabs {}

@Directive({
  selector: 'div[ndsTabsList]',
  hostDirectives: [{ directive: RdxTabsList, inputs: ['loopFocus'] }],
})
export class NdsTabsList {
  readonly variant = input<'default' | 'line'>('default');
  readonly activationMode = input<'automatic' | 'manual'>('automatic');
}

@Directive({
  selector: 'button[ndsTabsTrigger]',
  hostDirectives: [
    { directive: RdxTabsTab, inputs: ['value', 'disabled', 'id'] },
  ],
})
export class NdsTabsTrigger {}

@Directive({
  selector: 'div[ndsTabsContent]',
  hostDirectives: [
    { directive: RdxTabsPanel, inputs: ['value', 'keepMounted'] },
  ],
})
export class NdsTabsContent {}`;

// Também hardcoded: a variante `angular` de `props.extensibilityCode` descreve
// `<nds-tabs>`. Aqui o exemplo é o que compila neste stack.
const EXTENSIBILITY_CODE = `<!-- Tabs controladas com analytics -->
<div ndsTabs [value]="ativa()" (valueChange)="onTabChange($event)">
  <div ndsTabsList aria-label="Seções do componente">
    @for (aba of abas; track aba.value) {
      <button ndsTabsTrigger [value]="aba.value">{{ aba.label }}</button>
    }
  </div>
  @for (aba of abas; track aba.value) {
    <div ndsTabsContent [value]="aba.value">{{ aba.content }}</div>
  }
</div>

// no componente
readonly ativa = signal('overview');

onTabChange(proxima: string) {
  // O payload leva o VALOR da aba, nunca o rótulo traduzido: o rótulo
  // partiria um evento em três no GA4, um por idioma.
  track('tab_change', {
    component: 'tabs',
    label: proxima,
    index: this.abas.findIndex((a) => a.value === proxima),
    total: this.abas.length,
    location: 'docs',
  });
  this.ativa.set(proxima);
}`;

/** Ordem das abas da demonstração — base estável de index/total no analytics. */
const ABAS_DEMO = ['overview', 'properties', 'examples'] as const;

@Component({
  selector: 'nds-tabs-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsTabs, NdsTabsList, NdsTabsTrigger, NdsTabsContent, NdsTabsIcon, NdsBadge,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <div ndsTabs class="nds-w-full" defaultValue="overview">
        <div ndsTabsList [attr.aria-label]="t('demonstration.labels.settings')">
          <button ndsTabsTrigger value="overview">{{ t('demonstration.labels.overview') }}</button>
          <button ndsTabsTrigger value="properties">{{ t('demonstration.labels.properties') }}</button>
        </div>
        <div ndsTabsContent value="overview" class="nds-text-body">
          {{ t('demonstration.labels.overviewContent') }}
        </div>
        <div ndsTabsContent value="properties" class="nds-text-body">
          {{ t('demonstration.labels.propertiesContent') }}
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div ndsTabs class="nds-w-full" defaultValue="tab1">
        <div ndsTabsList [attr.aria-label]="t('demonstration.labels.settings')">
          <button ndsTabsTrigger value="tab1">Tab 1</button>
          <button ndsTabsTrigger value="tab2">Tab 2</button>
        </div>
        <div ndsTabsContent value="tab1" class="nds-text-body">
          {{ t('demonstration.labels.overviewContent') }}
        </div>
        <div ndsTabsContent value="tab2" class="nds-text-body">
          {{ t('demonstration.labels.propertiesContent') }}
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div ndsTabs class="nds-w-full" defaultValue="profile">
        <div ndsTabsList [attr.aria-label]="t('demonstration.labels.settings')">
          <button ndsTabsTrigger value="profile">{{ t('demonstration.labels.profile') }}</button>
          <button ndsTabsTrigger value="security">{{ t('demonstration.labels.security') }}</button>
        </div>
        <div ndsTabsContent value="profile" class="nds-text-body">
          {{ t('demonstration.labels.overviewContent') }}
        </div>
        <div ndsTabsContent value="security" class="nds-text-body">
          {{ t('demonstration.labels.propertiesContent') }}
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div ndsTabs class="nds-w-full" defaultValue="profile">
        <div ndsTabsList>
          <button ndsTabsTrigger value="profile">{{ t('demonstration.labels.profile') }}</button>
          <button ndsTabsTrigger value="security">{{ t('demonstration.labels.security') }}</button>
        </div>
        <div ndsTabsContent value="profile" class="nds-text-body">
          {{ t('demonstration.labels.overviewContent') }}
        </div>
        <div ndsTabsContent value="security" class="nds-text-body">
          {{ t('demonstration.labels.propertiesContent') }}
        </div>
      </div>
    </ng-template>

    <ng-template #tplVarDefault>
      <div ndsTabs class="nds-max-w-md" defaultValue="overview">
        <div ndsTabsList [attr.aria-label]="t('demonstration.labels.settings')">
          <button ndsTabsTrigger value="overview">{{ t('demonstration.labels.overview') }}</button>
          <button ndsTabsTrigger value="properties">{{ t('demonstration.labels.properties') }}</button>
          <button ndsTabsTrigger value="examples">{{ t('demonstration.labels.examples') }}</button>
        </div>
        <div ndsTabsContent value="overview" class="nds-text-body">
          {{ t('demonstration.labels.overviewContent') }}
        </div>
        <div ndsTabsContent value="properties" class="nds-text-body">
          {{ t('demonstration.labels.propertiesContent') }}
        </div>
        <div ndsTabsContent value="examples" class="nds-text-body">
          {{ t('demonstration.labels.examplesContent') }}
        </div>
      </div>
    </ng-template>
    <ng-template #tplVarLine>
      <div ndsTabs class="nds-max-w-md" defaultValue="preview">
        <div ndsTabsList variant="line" [attr.aria-label]="t('demonstration.labels.settings')">
          <button ndsTabsTrigger value="preview">{{ t('demonstration.labels.preview') }}</button>
          <button ndsTabsTrigger value="code">{{ t('demonstration.labels.code') }}</button>
        </div>
        <div ndsTabsContent value="preview" class="nds-text-body">
          {{ t('demonstration.labels.overviewContent') }}
        </div>
        <div ndsTabsContent value="code" class="nds-text-body">
          {{ t('demonstration.labels.examplesContent') }}
        </div>
      </div>
    </ng-template>
    <ng-template #tplVarVertical>
      <div ndsTabs class="nds-max-w-md" orientation="vertical" defaultValue="profile">
        <div ndsTabsList [attr.aria-label]="t('demonstration.labels.settings')">
          <button ndsTabsTrigger value="profile">{{ t('demonstration.labels.profile') }}</button>
          <button ndsTabsTrigger value="account">{{ t('demonstration.labels.account') }}</button>
          <button ndsTabsTrigger value="security">{{ t('demonstration.labels.security') }}</button>
        </div>
        <div ndsTabsContent value="profile" class="nds-text-body">
          {{ t('demonstration.labels.overviewContent') }}
        </div>
        <div ndsTabsContent value="account" class="nds-text-body">
          {{ t('demonstration.labels.propertiesContent') }}
        </div>
        <div ndsTabsContent value="security" class="nds-text-body">
          {{ t('demonstration.labels.examplesContent') }}
        </div>
      </div>
    </ng-template>

    <ng-template #tplCompIcones>
      <div ndsTabs class="nds-max-w-md" defaultValue="profile">
        <div ndsTabsList [attr.aria-label]="t('demonstration.labels.settings')">
          <button ndsTabsTrigger value="profile">
            <svg ndsTabsIcon kind="user"></svg>
            {{ t('demonstration.labels.profile') }}
          </button>
          <button ndsTabsTrigger value="account">
            <svg ndsTabsIcon kind="settings"></svg>
            {{ t('demonstration.labels.account') }}
          </button>
          <button ndsTabsTrigger value="security">
            <svg ndsTabsIcon kind="shield"></svg>
            {{ t('demonstration.labels.security') }}
          </button>
        </div>
        <div ndsTabsContent value="profile" class="nds-text-body">
          {{ t('demonstration.labels.overviewContent') }}
        </div>
        <div ndsTabsContent value="account" class="nds-text-body">
          {{ t('demonstration.labels.propertiesContent') }}
        </div>
        <div ndsTabsContent value="security" class="nds-text-body">
          {{ t('demonstration.labels.examplesContent') }}
        </div>
      </div>
    </ng-template>
    <ng-template #tplCompBadge>
      <div ndsTabs class="nds-max-w-md" defaultValue="overview">
        <div ndsTabsList [attr.aria-label]="t('demonstration.labels.settings')">
          <button ndsTabsTrigger value="overview">{{ t('demonstration.labels.overview') }}</button>
          <button ndsTabsTrigger value="properties">
            {{ t('demonstration.labels.properties') }}
            <span ndsBadge variant="secondary">12</span>
          </button>
          <button ndsTabsTrigger value="examples">
            {{ t('demonstration.labels.examples') }}
            <span ndsBadge variant="info">Beta</span>
          </button>
        </div>
        <div ndsTabsContent value="overview" class="nds-text-body">
          {{ t('demonstration.labels.overviewContent') }}
        </div>
        <div ndsTabsContent value="properties" class="nds-text-body">
          {{ t('demonstration.labels.propertiesContent') }}
        </div>
        <div ndsTabsContent value="examples" class="nds-text-body">
          {{ t('demonstration.labels.examplesContent') }}
        </div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="tabs"
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
        <nds-docs-demonstration [title]="t('demonstration.title')">
          <div
            ndsTabs
            class="nds-w-full"
            defaultValue="overview"
            (valueChange)="onTabChange($event)"
          >
            <div ndsTabsList [attr.aria-label]="t('demonstration.labels.settings')">
              <button ndsTabsTrigger value="overview">
                {{ t('demonstration.labels.overview') }}
              </button>
              <button ndsTabsTrigger value="properties">
                {{ t('demonstration.labels.properties') }}
              </button>
              <button ndsTabsTrigger value="examples">
                {{ t('demonstration.labels.examples') }}
              </button>
            </div>
            <div ndsTabsContent value="overview" class="nds-text-body">
              {{ t('demonstration.labels.overviewContent') }}
            </div>
            <div ndsTabsContent value="properties" class="nds-text-body">
              {{ t('demonstration.labels.propertiesContent') }}
            </div>
            <div ndsTabsContent value="examples" class="nds-text-body">
              {{ t('demonstration.labels.examplesContent') }}
            </div>
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="anatomyCode"
          language="html"
        />

        <nds-docs-when-to-use
          [title]="t('usage.title')"
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [uxWriting]="uxWriting()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <nds-docs-import
          [title]="t('import.title')"
          [code]="importCode"
          componentSlug="tabs"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="tabs"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="tabs"
        />

        <nds-docs-states
          [title]="t('states.title')"
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <nds-docs-props
          [title]="t('props.title')"
          [tables]="propTables()"
          [interfaceCode]="interfaceCode"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityCode]="extensibilityCode"
        />

        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="t('tokens.customizationCode')"
        />

        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboard.title')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="t('accessibility.screenReader.title')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="tabs"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="tabs" />

        <nds-docs-analytics
          [title]="t('analytics.title')"
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

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
export class NdsTabsDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly extensibilityCode = EXTENSIBILITY_CODE;
  protected readonly importCode =
    `import { NdsTabs, NdsTabsList, NdsTabsTrigger, NdsTabsContent } from '@/components/ui/tabs';`;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarLine = viewChild.required<TemplateRef<unknown>>('tplVarLine');
  private readonly tplVarVertical = viewChild.required<TemplateRef<unknown>>('tplVarVertical');
  private readonly tplCompIcones = viewChild.required<TemplateRef<unknown>>('tplCompIcones');
  private readonly tplCompBadge = viewChild.required<TemplateRef<unknown>>('tplCompBadge');

  /**
   * A demonstração é produto: quem troca de aba aqui dispara o mesmo evento que
   * o componente dispararia num app. O payload leva o VALOR da aba, nunca o
   * rótulo traduzido — o rótulo partiria um evento em três no GA4.
   */
  /**
   * O primitivo declara o valor da aba como texto, número ou vazio — assinar só
   * `string` deixava o compilador de templates sem como provar a chamada. A
   * normalização é aqui e não no template porque o payload que vai ao GA4 tem
   * que ser estável: `null` viraria uma categoria a mais no relatório.
   */
  protected onTabChange(value: RdxTabsValue | undefined): void {
    const aba = typeof value === 'string' ? value : '';
    track('tab_change', {
      component: 'tabs',
      label: aba,
      index: ABAS_DEMO.indexOf(aba as (typeof ABAS_DEMO)[number]),
      total: ABAS_DEMO.length,
      location: 'docs-demonstration',
    });
  }

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [1, 2, 3, 4].map((i) => t(`anatomy.item${i}`));
  });

  protected readonly guidelines = computed(() => {
    dict();
    return {
      title: t('usage.guidelines.title'),
      items: [1, 2, 3, 4].map((i) => t(`usage.guidelines.item${i}`)),
    };
  });

  protected readonly scenarios = computed(() => {
    const d = dict();
    return {
      title: t('usage.scenarios.title'),
      cols: {
        scenario: t('usage.scenarios.cols.scenario'),
        use: t('usage.scenarios.cols.use'),
        alternative: t('usage.scenarios.cols.alternative'),
      },
      items: itemsFromDict(d, 'usage.scenarios', ['s', 'u', 'a']),
    };
  });

  protected readonly uxWriting = computed(() => {
    dict();
    return {
      title: t('usage.uxWriting.title'),
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: ['trigger', 'ariaLabel', 'order'].map((key) => ({
        element: toPlainText(t(`usage.uxWriting.table.${key}.name`)),
        rules: toPlainText(t(`usage.uxWriting.table.${key}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${key}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${key}.bad`)),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    dict();
    return { title: t('usage.do.title'), items: [1, 2, 3, 4].map((i) => t(`usage.do.item${i}`)) };
  });

  protected readonly usageDont = computed(() => {
    dict();
    return { title: t('usage.dont.title'), items: [1, 2, 3, 4].map((i) => t(`usage.dont.item${i}`)) };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    const pairs: [TemplateRef<unknown>, TemplateRef<unknown>][] = [
      [this.tplDoDont1Do(), this.tplDoDont1Dont()],
      [this.tplDoDont2Do(), this.tplDoDont2Dont()],
    ];
    return pairs.map(([doTpl, dontTpl], i) => ({
      doLabel: tNav('common.do'),
      dontLabel: tNav('common.dont'),
      doCaption: toPlainText(t(`doDont.pair${i + 1}.do`)),
      dontCaption: toPlainText(t(`doDont.pair${i + 1}.dont`)),
      doPreview: doTpl,
      dontPreview: dontTpl,
    }));
  });

  protected readonly variantItems = computed(() => {
    dict();
    return [
      { key: 'default',  tpl: this.tplVarDefault()  },
      { key: 'line',     tpl: this.tplVarLine()     },
      { key: 'vertical', tpl: this.tplVarVertical() },
    ].map(({ key, tpl }) => ({
      name: t(`variants.items.${key}`),
      description: t(`variants.styles.${key}`),
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly compositionItems = computed(() => {
    dict();
    return [
      { key: 'iconTrigger',  trackId: 'icon-trigger',  tpl: this.tplCompIcones() },
      { key: 'badgeTrigger', trackId: 'badge-trigger', tpl: this.tplCompBadge()  },
    ].map(({ key, trackId, tpl }) => ({
      name: t(`variants.compositions.${key}.name`),
      description: t(`variants.compositions.${key}.description`),
      useWhen: t(`variants.compositions.${key}.use`),
      trackId,
      preview: tpl,
    }));
  });

  protected readonly statesCols = computed(() => {
    dict();
    return {
      state: t('states.cols.state'),
      trigger: t('states.cols.trigger'),
      behavior: t('states.cols.behavior'),
    };
  });

  protected readonly stateItems = computed(() => {
    dict();
    return ['default', 'active', 'hover', 'focus', 'disabled'].map((k) => ({
      label: t(`states.${k}.label`),
      trigger: toPlainText(t(`states.${k}.trigger`)),
      behavior: toPlainText(t(`states.${k}.behavior`)),
    }));
  });

  protected readonly propTables = computed(() => {
    dict();
    const cols = {
      prop: t('props.table.prop'),
      type: t('props.table.type'),
      default: t('props.table.default'),
      required: t('props.table.required'),
      description: t('props.table.description'),
    };
    const not = tNav('common.no');
    const line = (name: string, key: string, type?: string, padrao?: string) => ({
      name: name,
      type: type ?? toPlainText(t(`props.table.${key}.type`)),
      defaultValue: padrao ?? toPlainText(t(`props.table.${key}.default`)),
      required: toPlainText(t(`props.table.${key}.required`)),
      description: toPlainText(t(`props.table.${key}.description`)),
    });
    return [
      {
        title: 'NdsTabs',
        cols,
        items: [
          line('value', 'value', 'model<string>'),
          line('defaultValue', 'defaultValue'),
          line('valueChange', 'onValueChange', 'output<string>'),
          line('orientation', 'orientation'),
          line('class', 'className'),
        ],
      },
      {
        title: 'NdsTabsList',
        cols,
        items: [
          line('variant', 'variant'),
          line('activationMode', 'activationMode'),
          {
            name: 'loopFocus',
            type: 'boolean',
            defaultValue: 'true',
            required: not,
            description: toPlainText(t('props.loopFocus.description')),
          },
          line('class', 'className'),
        ],
      },
      {
        title: 'NdsTabsTrigger',
        cols,
        items: [
          {
            name: 'value',
            type: 'string',
            defaultValue: '—',
            required: tNav('common.yes'),
            description: toPlainText(t('props.triggerValue.description')),
          },
          {
            name: 'disabled',
            type: 'boolean',
            defaultValue: 'false',
            required: not,
            description: toPlainText(t('props.triggerDisabled.description')),
          },
          line('class', 'className'),
        ],
      },
      {
        title: 'NdsTabsContent',
        cols,
        items: [
          {
            name: 'value',
            type: 'string',
            defaultValue: '—',
            required: tNav('common.yes'),
            description: toPlainText(t('props.contentValue.description')),
          },
          line('class', 'className'),
        ],
      },
    ].map((table) => ({
      ...table,
      items: table.items.map((item) => ({ ...item, required: item.required || not })),
    }));
  });

  protected readonly tokensCols = computed(() => {
    dict();
    return {
      token: t('tokens.table.token'),
      value: t('tokens.table.class'),
      description: t('tokens.table.part'),
    };
  });

  protected readonly tokenItems = computed(() => {
    dict();
    // A coluna do meio mostra a classe `.nds-*` real, não a classe utilitária
    // que o conteúdo compartilhado guarda — é o que existe no CSS deste sistema.
    return [
      { token: '--muted',            k: 'muted',            className: '.nds-tabs-list'    },
      { token: '--muted-foreground', k: 'mutedForeground',  className: '.nds-tabs-list'    },
      { token: '--background',       k: 'background',       className: '.nds-tabs-trigger' },
      { token: '--foreground',       k: 'foreground',       className: '.nds-tabs-trigger' },
      { token: '--ring',             k: 'ring',             className: '.nds-tabs-trigger' },
      { token: '--radius',           k: 'radius',           className: '.nds-tabs-list'    },
    ].map(({ token, k, className }) => ({
      token,
      value: className,
      description: toPlainText(t(`tokens.table.${k}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7].map((i) => t(`accessibility.items.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',        description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'ArrowRight', description: toPlainText(t('accessibility.keyboard.arrowRight')) },
      { key: 'ArrowLeft',  description: toPlainText(t('accessibility.keyboard.arrowLeft')) },
      { key: 'ArrowDown',  description: toPlainText(t('accessibility.keyboard.arrowDown')) },
      { key: 'ArrowUp',    description: toPlainText(t('accessibility.keyboard.arrowUp')) },
      { key: 'Home',       description: toPlainText(t('accessibility.keyboard.home')) },
      { key: 'End',        description: toPlainText(t('accessibility.keyboard.end')) },
      { key: 'Enter',      description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Space',      description: toPlainText(t('accessibility.keyboard.space')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = tabsTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    const sr = { ...(byLocale[locale]?.accessibility?.screenReader ?? {}) };
    // `title` é rótulo da subseção, não anúncio — entraria como item da lista.
    delete sr['title'];
    return Object.values(sr);
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'stepper',     path: '?path=/docs/ui-stepper--docs'     },
      { key: 'accordion',   path: '?path=/docs/ui-accordion--docs'   },
      { key: 'sidebar',     path: '?path=/docs/ui-sidebar--docs'     },
      { key: 'toggleGroup', path: '?path=/docs/ui-togglegroup--docs' },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: t(`related.items.${key}.description`),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    // 1–4 vêm do conteúdo compartilhado; o 5 é o override desta stack. O antigo
    // item 6 registrava a altura cravada do trilho na folha compartilhada, que
    // deixou de existir.
    return [1, 2, 3, 4, 5].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
  });

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
    return [
      {
        event: 'tab_change',
        trigger: toPlainText(t('analytics.table.tab_change.trigger')),
        payload: toPlainText(t('analytics.table.tab_change.payload')),
      },
      {
        event: 'docs_page_view',
        trigger: toPlainText(t('analytics.description')),
        payload: 'component_name, locale, page_title',
      },
    ];
  });

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
      items: itemsFromDict(d, 'testes.functional', ['action', 'result', 'priority']).map((r) => ({
        action: toPlainText(r.action),
        result: stripHtml(toPlainText(r.result)),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    dict();
    // Critério como frase única, não {criterion, level, how} — mesma forma do
    // radio-group e do separator.
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
        criterion: toPlainText(t(`testes.accessibility.item${i}`)),
        level: '—',
        how: 'axe + play',
      })),
    };
  });

  protected readonly testesVisual = computed(() => {
    const d = dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
      items: itemsFromDict(d, 'testes.visual', ['story', 'priority']).map((r) => ({
        story: toPlainText(r.story),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  private observer: { disconnect: () => void } | undefined;

  constructor() {
    effect((onCleanup) => {
      dict();
      const locale = getLocale();
      const cleanup = applySeo({
        title: t('seo.title'),
        description: t('seo.description'),
        locale,
        componentSlug: 'tabs',
      });
      track('docs_page_view', {
        component_name: 'tabs',
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
          component_name: 'tabs',
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

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
