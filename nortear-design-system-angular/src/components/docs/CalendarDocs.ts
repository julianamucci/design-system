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
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { parseDate } from '@internationalized/date';
import { NdsCalendar } from '@/components/ui/calendar';
import uiTranslations from '@/i18n/ui.json';
import calendarTranslations from '@shared/content/calendar/translations.json';

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

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// O conteúdo descreve a API do react-day-picker. Aqui o valor é um `model`
// (`[(value)]`), não o par `selected`/`onSelect`; `classNames` não existe,
// porque o Angular mescla o `class` escrito no elemento; e o modo de intervalo
// não existe, porque o primitivo desta stack expõe uma data ou uma lista de
// datas avulsas, nunca um par início/fim.
//
// As chaves NÃO levam sufixo `.description`: neste slug a descrição mora em
// `props.table.<prop>` como string solta. Override com caminho errado não dá
// erro — só nunca vence, e a página segue mostrando o texto compartilhado.
//
// E são por idioma, não em `'*'`: override em `'*'` com texto em português faz
// quem lê a página em inglês ou espanhol receber a frase na língua errada.
const { t, dict } = useTranslation(calendarTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.mode':
      'Modo de seleção: uma data ou várias datas avulsas.',
    'props.table.selected':
      'Data ou datas escolhidas. É um model, então liga nos dois sentidos.',
    'props.table.onSelect':
      'Emitido a cada escolha, com o valor já normalizado para o modo em uso.',
    'props.table.classNames':
      'Não existe nesta stack: classes extras vão no atributo class do elemento, e o framework as mescla com a base.',
    'props.table.className':
      'Não é uma entrada: o framework mescla o class escrito no elemento com a classe base.',
    // O compartilhado deixou de listar disponibilidade stack a stack. Quem lê
    // esta página precisa saber o que ESTE pacote expõe — e é aqui que isso
    // fica registrado, não numa comparação no conteúdo comum.
    'variants.note':
      'O Calendar não tem variantes <code>cva()</code>. O que varia é a <strong>composição</strong>: modo de seleção (<code>mode</code>), layout da legenda (<code>captionLayout</code>) e variante dos botões de navegação (<code>buttonVariant</code>). Aqui o modo é <code>single</code> ou <code>multiple</code> — não há intervalo, porque o primitivo expõe uma data ou uma lista de datas avulsas, nunca um par início/fim. <code>captionLayout="dropdown"</code> e <code>numberOfMonths</code> estão disponíveis.',
  },
  en: {
    'props.table.mode': 'Selection mode: one date, or several separate dates.',
    'props.table.selected':
      'Chosen date or dates. It is a model, so it binds both ways.',
    'props.table.onSelect':
      'Emitted on every choice, with the value already normalized for the current mode.',
    'props.table.classNames':
      'Does not exist in this stack: extra classes go on the element class attribute, and the framework merges them with the base.',
    'props.table.className':
      'Not an entry: the framework merges the class written on the element with the base class.',
    'variants.note':
      'Calendar has no <code>cva()</code> variants. What varies is the <strong>composition</strong>: selection <code>mode</code>, caption layout (<code>captionLayout</code>) and navigation button variant (<code>buttonVariant</code>). Here the mode is <code>single</code> or <code>multiple</code> — there is no range, because the primitive exposes one date or a list of separate dates, never a start/end pair. <code>captionLayout="dropdown"</code> and <code>numberOfMonths</code> are available.',
  },
  es: {
    'props.table.mode': 'Modo de selección: una fecha o varias fechas sueltas.',
    'props.table.selected':
      'Fecha o fechas elegidas. Es un model, así que enlaza en ambos sentidos.',
    'props.table.onSelect':
      'Se emite en cada elección, con el valor ya normalizado para el modo en uso.',
    'props.table.classNames':
      'No existe en este stack: las clases extra van en el atributo class del elemento, y el framework las combina con la base.',
    'props.table.className':
      'No es una entrada: el framework combina el class escrito en el elemento con la clase base.',
    'variants.note':
      'Calendar no tiene variantes <code>cva()</code>. Lo que varía es la <strong>composición</strong>: modo de selección (<code>mode</code>), layout de la leyenda (<code>captionLayout</code>) y variante de los botones de navegación (<code>buttonVariant</code>). Aquí el modo es <code>single</code> o <code>multiple</code> — no hay intervalo, porque el primitivo expone una fecha o una lista de fechas sueltas, nunca un par inicio/fin. <code>captionLayout="dropdown"</code> y <code>numberOfMonths</code> están disponibles.',
  },
});

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
    { id: 'importacao',   labelKey: 'nav.import'   },
    { id: 'variantes',    labelKey: 'nav.variants' },
    { id: 'estados',      labelKey: 'nav.states'   },
    { id: 'propriedades', labelKey: 'nav.props'    },
    { id: 'tokens',       labelKey: 'nav.tokens'   },
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

const INTERFACE_CODE = `// O valor é um \`model\`, então \`[(value)]\` liga nos dois sentidos —
// em vez do par selected/onSelect que as outras stacks usam.
@Component({ selector: 'div[ndsCalendar]' })
export class NdsCalendar {
  // Sem modo de intervalo: o primitivo desta stack expõe uma data ou uma lista
  // de datas avulsas, e não um par início/fim. Divergência de API de framework.
  readonly mode = input<'single' | 'multiple'>('single');
  readonly value = model<CalendarValue>(undefined);
  readonly locale = input<string>('en-US');
  readonly disabled = input<CalendarDateMatcher | undefined>(undefined);
  readonly showOutsideDays = input(true, { transform: booleanAttribute });
  readonly captionLayout = input<'label' | 'dropdown'>('label');
  readonly numberOfMonths = input(1, { transform: numberAttribute });
}`;

const ANATOMY_CODE = `<!-- escolhido = signal<Date | undefined>(undefined) -->
<div
  ndsCalendar
  mode="single"
  [(value)]="escolhido"
  locale="pt-BR"
  [showOutsideDays]="true"
></div>

<!-- Várias datas avulsas, dois meses lado a lado -->
<div
  ndsCalendar
  mode="multiple"
  [(value)]="escolhidas"
  [numberOfMonths]="2"
  locale="pt-BR"
></div>`;

const CUSTOMIZATION_CODE = `/* A grade lê os tokens do tema — personalizar é
   redefinir o token, não sobrescrever a regra. */
.tema-compacto {
  --radius: 0.375rem;
}`;

@Component({
  selector: 'nds-calendar-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsCalendar,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- Todos os previews usam data FIXA. \`new Date()\` faria o snapshot mudar
         todo dia e o teste falhar sozinho na virada do mês. -->
    <ng-template #tplDoDont1Do>
      <div ndsCalendar mode="single" [value]="diaFixo" locale="pt-BR"></div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div ndsCalendar mode="single" [value]="diaFixo" locale="pt-BR" [showOutsideDays]="false"></div>
    </ng-template>

    <!-- O par sobre "quantos meses cabem na tela" era demonstrado com intervalo,
         que esta stack não tem. Com seleção múltipla o par diz a mesma coisa: dois
         meses lado a lado evitam a ida e volta entre páginas quando as datas de
         interesse cruzam a virada. -->
    <ng-template #tplDoDont2Do>
      <div ndsCalendar mode="multiple" [value]="diasFixos" [numberOfMonths]="2" locale="pt-BR"></div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div ndsCalendar mode="multiple" [value]="diasFixos" [numberOfMonths]="1" locale="pt-BR"></div>
    </ng-template>

    <ng-template #tplVarSingle>
      <div ndsCalendar mode="single" [value]="diaFixo" locale="pt-BR"></div>
    </ng-template>
    <ng-template #tplVarMultiple>
      <div ndsCalendar mode="multiple" [value]="diasFixos" locale="pt-BR"></div>
    </ng-template>
    <ng-template #tplVarDropdown>
      <div ndsCalendar mode="single" [value]="diaFixo" captionLayout="dropdown" locale="pt-BR"></div>
    </ng-template>
    <ng-template #tplVarDoisMeses>
      <div ndsCalendar mode="single" [value]="diaFixo" [numberOfMonths]="2" locale="pt-BR"></div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="calendar"
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
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <div class="nds-stack" data-spacing="sm">
              <span class="nds-text-caption">{{ t('demonstration.labels.singleLabel') }}</span>
              <div ndsCalendar mode="single" [value]="diaFixo" locale="pt-BR"></div>
            </div>

            <div class="nds-stack" data-spacing="sm">
              <span class="nds-text-caption">{{ t('demonstration.labels.multipleLabel') }}</span>
              <div ndsCalendar mode="multiple" [value]="diasFixos" locale="pt-BR"></div>
            </div>
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
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
          [title]="tNav('nav.import')"
          [code]="importCode"
          componentSlug="calendar"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="calendar"
          id="variantes"
          language="html"
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
          [extensibilityNotes]="t('props.extensibility')"
        />

        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="customizationCode"
        />

        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboardTitle')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="calendar"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="calendar" />

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
export class NdsCalendarDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly customizationCode = CUSTOMIZATION_CODE;
  protected readonly importCode = `import { NdsCalendar } from '@/components/ui/calendar';`;

  /**
   * Datas FIXAS.
   *
   * `new Date()` numa docs page faria a regressão visual mudar todo dia e o
   * teste reprovar sozinho na virada do mês — sem ninguém ter tocado no código.
   */
  protected readonly diaFixo = parseDate('2026-03-12');
  protected readonly diasFixos = [
    parseDate('2026-03-03'),
    parseDate('2026-03-12'),
    parseDate('2026-03-21'),
  ];

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarSingle = viewChild.required<TemplateRef<unknown>>('tplVarSingle');
  private readonly tplVarMultiple = viewChild.required<TemplateRef<unknown>>('tplVarMultiple');
  private readonly tplVarDropdown = viewChild.required<TemplateRef<unknown>>('tplVarDropdown');
  private readonly tplVarDoisMeses = viewChild.required<TemplateRef<unknown>>('tplVarDoisMeses');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: rotuloDeNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: rotuloDeNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    const d = dict();
    return itensNumerados(d, 'anatomy');
  });

  protected readonly guidelines = computed(() => {
    const d = dict();
    return { title: d['usage.guidelines.title'] ?? '', items: itensNumerados(d, 'usage.guidelines') };
  });

  protected readonly scenarios = computed(() => {
    const d = dict();
    return {
      title: d['usage.scenarios.title'] ?? '',
      cols: {
        scenario: d['usage.scenarios.cols.scenario'] ?? '',
        use: d['usage.scenarios.cols.use'] ?? '',
        alternative: d['usage.scenarios.cols.alternative'] ?? '',
      },
      items: itemsFromDict(d, 'usage.scenarios', ['s', 'u', 'a']),
    };
  });

  protected readonly uxWriting = computed(() => {
    const d = dict();
    const chaves = Object.keys(d)
      .filter((k) => /^usage\.uxWriting\.table\.[a-zA-Z]+\.name$/.test(k))
      .map((k) => k.split('.')[3]);
    return {
      title: t('usage.uxWriting.title'),
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        // O container lê `do`/`dont`; `correct`/`avoid` renderiza duas colunas
        // vazias, e o tsc não pega porque não valida template Angular.
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: chaves.map((k) => ({
        element: toPlainText(t(`usage.uxWriting.table.${k}.name`)),
        rules: toPlainText(t(`usage.uxWriting.table.${k}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${k}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${k}.bad`)),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    const d = dict();
    return { title: t('usage.do.title'), items: itensNumerados(d, 'usage.do') };
  });

  protected readonly usageDont = computed(() => {
    const d = dict();
    return { title: t('usage.dont.title'), items: itensNumerados(d, 'usage.dont') };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    const pares: [TemplateRef<unknown>, TemplateRef<unknown>][] = [
      [this.tplDoDont1Do(), this.tplDoDont1Dont()],
      [this.tplDoDont2Do(), this.tplDoDont2Dont()],
    ];
    return pares.map(([doTpl, dontTpl], i) => ({
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
      { key: 'single',          tpl: this.tplVarSingle()    },
      { key: 'multiple',        tpl: this.tplVarMultiple()  },
      { key: 'captionDropdown', tpl: this.tplVarDropdown()  },
      { key: 'numberOfMonths',  tpl: this.tplVarDoisMeses() },
    ].map(({ key, tpl }) => ({
      name: valorOuCampo(`variants.items.${key}`, 'name') || key,
      description: valorOuCampo(`variants.items.${key}`, 'description'),
      trackId: key,
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
    // Sem `rangeMiddle`: é estado de intervalo, e o intervalo não existe aqui.
    return ['default', 'selected', 'disabled', 'today', 'outside'].map((k) => ({
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
    const nao = tNav('common.no');
    // A descrição mora em `props.table.<prop>` como STRING SOLTA, e não num
    // objeto com campo `description` — a forma varia de componente para
    // componente no conteúdo compartilhado, e `t()` devolve a própria chave
    // quando erra o caminho. Era assim que "props.table.mode.description"
    // aparecia escrito dentro da tabela, sem erro nenhum.
    const linha = (name: string, chave: string, tipo: string, padrao: string) => ({
      name,
      type: tipo,
      defaultValue: padrao,
      required: nao,
      description: toPlainText(valorOuCampo(`props.table.${chave}`, 'description')),
    });

    return [
      {
        title: t('props.calendarTitle'),
        cols,
        items: [
          linha('mode', 'mode', `'single' | 'multiple'`, `'single'`),
          linha('value', 'selected', 'model<CalendarValue>', '—'),
          linha('valueChange', 'onSelect', 'output<CalendarValue>', '—'),
          linha('locale', 'locale', 'string', `'en-US'`),
          linha('disabled', 'disabled', 'CalendarDateMatcher', '—'),
          linha('showOutsideDays', 'showOutsideDays', 'boolean', 'true'),
          linha('captionLayout', 'captionLayout', `'label' | 'dropdown'`, `'label'`),
          linha('numberOfMonths', 'numberOfMonths', 'number', '1'),
          linha('class', 'className', 'string', '—'),
        ],
      },
      {
        title: t('props.dayButtonTitle'),
        cols,
        items: [linha('buttonVariant', 'buttonVariant', `'ghost' | 'outline'`, `'ghost'`)],
      },
    ];
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
    return [
      { token: '--primary',          k: 'primary',         alvo: '.nds-calendar-day' },
      { token: '--muted',            k: 'muted',           alvo: '.nds-calendar-day' },
      { token: '--muted-foreground', k: 'mutedForeground', alvo: '.nds-calendar-weekday' },
      { token: '--foreground',       k: 'foreground',      alvo: '.nds-calendar' },
      { token: '--ring',             k: 'ring',            alvo: '.nds-calendar-day' },
      { token: '--radius',           k: 'cellRadius',      alvo: '.nds-calendar-day' },
      { token: '--size-default',     k: 'cellSize',        alvo: '.nds-calendar-day-cell' },
      { token: '--accent',           k: 'pickerItem',      alvo: '.nds-calendar-caption' },
    ].map(({ token, k, alvo }) => ({
      token,
      value: alvo,
      description: toPlainText(t(`tokens.table.${k}`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    const d = dict();
    return itensNumerados(d, 'accessibility');
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: '← ↑ → ↓',        description: toPlainText(t('accessibility.keyboard.arrows')) },
      { key: 'Page Up / Down', description: toPlainText(t('accessibility.keyboard.pageUpDown')) },
      { key: 'Home / End',     description: toPlainText(t('accessibility.keyboard.homeEnd')) },
      { key: 'Enter',          description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Tab',            description: toPlainText(t('accessibility.keyboard.tab')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return ['onFocus', 'onSelect', 'onDisabled', 'nav'].map((k) =>
      t(`accessibility.screenReader.${k}`),
    );
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'datePicker', nome: 'Popover', path: '?path=/docs/ui-popover--docs' },
      { key: 'popover',    nome: 'Popover', path: '?path=/docs/ui-popover--docs' },
      { key: 'form',       nome: 'Form',    path: '?path=/docs/ui-form--docs'    },
      { key: 'input',      nome: 'Input',   path: '?path=/docs/ui-input--docs'   },
    ].map(({ key, nome, path }) => ({ name: nome, description: t(`related.${key}`), path }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4].map((i) => ({ title: '', content: t(`notes.tip${i}`) }));
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
      { e: 'fieldChange',   gatilho: 'fieldChangeTrigger',   carga: 'fieldChangePayload'   },
      { e: 'dialogOpen',    gatilho: 'dialogOpenTrigger',    carga: 'dialogOpenPayload'    },
      { e: 'pageView',      gatilho: 'pageViewTrigger',      carga: 'pageViewPayload'      },
      { e: 'sectionViewed', gatilho: 'sectionViewedTrigger', carga: 'sectionViewedPayload' },
      { e: 'langSwitch',    gatilho: 'langSwitchTrigger',    carga: 'langSwitchPayload'    },
    ].map(({ e, gatilho, carga }) => ({
      event: t(`analytics.table.${e}`),
      trigger: toPlainText(t(`analytics.table.${gatilho}`)),
      payload: toPlainText(t(`analytics.table.${carga}`)),
    }));
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
    const d = dict();
    const trinca = itemsFromDict(d, 'testes.accessibility', ['criterion', 'level', 'how']);
    // A forma varia por componente: aqui pode ser a trinca ou string solta.
    const items = trinca.length
      ? trinca.map((r) => ({
          criterion: toPlainText(r.criterion),
          level: r.level,
          how: toPlainText(r.how),
        }))
      : itensNumerados(d, 'testes.accessibility').map((texto) => ({
          criterion: toPlainText(texto),
          level: '',
          how: '',
        }));
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items,
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
        componentSlug: 'calendar',
      });
      track('docs_page_view', {
        component_name: 'calendar',
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
          component_name: 'calendar',
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

/**
 * Lê uma chave que pode ser string solta OU objeto com campos.
 *
 * `t()` devolve a própria chave quando ela aponta para um objeto — e é assim
 * que a chave crua acaba escrita na tela, sem erro nenhum.
 */
function valorOuCampo(base: string, campo: string): string {
  const direto = t(base);
  if (direto !== base) return direto;
  const chave = `${base}.${campo}`;
  const doCampo = t(chave);
  return doCampo === chave ? '' : doCampo;
}

/**
 * Rótulo do menu lateral.
 *
 * Tenta primeiro o conteúdo do componente e só então o ui.json. Alguns slugs
 * trazem o próprio bloco `nav`, outros não — e `t()` devolve a PRÓPRIA CHAVE
 * quando ela não existe, então sem esta ponte o menu de quem não traz o bloco
 * mostrava "nav.overview" escrito na tela, sem erro nenhum.
 */
function rotuloDeNav(chave: string): string {
  const doComponente = t(chave);
  return doComponente === chave ? tNav(chave) : doComponente;
}

/** Itens `base.itemN` na ordem numérica, quantos existirem. */
function itensNumerados(d: Record<string, string>, base: string): string[] {
  const itens: string[] = [];
  for (let i = 1; d[`${base}.item${i}`] !== undefined; i++) itens.push(d[`${base}.item${i}`]);
  return itens;
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
