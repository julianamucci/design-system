import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  signal,
  TemplateRef,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { toPlainText } from '@/lib/strip-html';
import { NdsToolGroup, type ToolGroupLabels } from '@/components/ui/tool-group';
import { toolGroupLabels } from '@/components/ui/tool-group.fixtures';
import { NdsSeparator } from '@/components/ui/separator';
import { TOOL_CALL_STATES, type ToolCallState } from '@shared/primitives/chat-protocol';
import { splitWaitingCalls } from '@shared/primitives/tool-group-summary';
import {
  TOOL_CALL_WAITING,
  TOOL_CALLS_ALL_DONE,
  TOOL_CALLS_RUNNING,
  TOOL_CALLS_WITH_FAILURE,
} from '@shared/primitives/tool-group-examples';
import uiTranslations from '@/i18n/ui.json';
import groupTranslations from '@shared/content/tool-group/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
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

// O RETORNO É UM `output()` NESTA STACK, e não um callback passado como
// propriedade. Divergência de API entre frameworks não se "alinha": cada stack
// usa a sua, e o conteúdo compartilhado descreve o CONCEITO. A linha da tabela
// nomeia o que se escreve AQUI, senão quem copia procura por um nome que não
// existe. As outras três entradas — `calls`, `labels`, `open` — têm o mesmo
// nome nas cinco, e por isso não aparecem aqui.
const { t, dict } = useTranslation(groupTranslations as Record<string, unknown>, {
  '*': {
    'props.table.onOpenChange.name': 'openChange',
    'props.table.onOpenChange.type': 'OutputEmitterRef<boolean>',
  },
  // A descrição vai junto com o nome e o tipo, e nos três idiomas: a do
  // conteúdo compartilhado fala de um retorno, e aqui o que existe é uma saída
  // que, ao lado de `open`, ainda dá o atalho de duas vias. Descrição que ficou
  // para trás do nome é a linha da tabela discordando de si mesma.
  'pt-BR': {
    'props.table.onOpenChange.description':
      'Alguém abriu ou fechou a caixa, e o novo estado vem junto. Ao lado de open, ela dá o atalho de duas vias.',
  },
  en: {
    'props.table.onOpenChange.description':
      'Someone opened or closed the box, and the new state comes along. Next to open, it gives the two-way shortcut.',
  },
  es: {
    'props.table.onOpenChange.description':
      'Alguien abrió o cerró la caja, y el nuevo estado viene con el aviso. Junto a open, da el atajo de dos vías.',
  },
});

// Esta peça não tem eixo de forma, e o conteúdo compartilhado não traz seção de
// variantes: ela não existe nem na navegação nem na página. O que muda é o que
// aconteceu dentro da caixa, e isso é a seção de estados.
const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'estados', 'propriedades', 'tokens',
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

const INTERFACE_CODE = `// As entradas do <details ndsToolGroup>, e o aviso que sai dele.
export class NdsToolGroup {
  readonly calls = input.required<ChatToolCall[]>();
  readonly labels = input.required<ToolGroupLabels>();
  readonly open = input(false);
  readonly openChange = output<boolean>();
}

// A RAIZ É O PRÓPRIO <details>: é dele que vêm o botão, o estado de expansão e
// o teclado, sem uma linha de ARIA escrita à mão.
//
//   <details ndsToolGroup [calls]="calls" [labels]="labels"></details>

export interface ToolGroupLabels {
  // O título é FUNÇÃO porque plural é decisão de idioma.
  title: (count: number) => string;
  // As mesmas quatro chaves nos dois: um fala do CONJUNTO, o outro de cada linha.
  summary: Record<ToolCallState, string>;
  call: Record<ToolCallState, string>;
}

// A chamada e os quatro estados vêm de @shared/primitives/chat-protocol:
type ToolCallState = 'pending' | 'running' | 'done' | 'failed';

interface ChatToolCall {
  id?: string;
  name: string;
  state: ToolCallState;
  detail?: string;   // argumento, resultado ou motivo da falha
}`;

@Component({
  selector: 'nds-tool-group-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsToolGroup, NdsSeparator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsStates, NdsDocsProps,
    NdsDocsTokens, NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes,
    NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- O primeiro par é o MESMO grupo: o que muda é se a falha chega a quem
         não abriu a caixa. -->
    <ng-template #tplDoDont1Do>
      <details ndsToolGroup [calls]="failureCalls" [labels]="labels()"></details>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <!-- O contraexemplo: o resumo do conjunto emudecido, e a caixa fechada
           passa a contar as ferramentas sem dizer o que houve. -->
      <details ndsToolGroup [calls]="failureCallsPlantedDefect" [labels]="wordless()"></details>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <details ndsToolGroup [calls]="waitingCalls" [labels]="labels()" [open]="true"></details>
        <details ndsToolGroup [calls]="groupedCalls" [labels]="labels()"></details>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <!-- O contraexemplo: a que espera por uma pessoa fica DENTRO da caixa
           fechada, e o pedido nunca chega a quem devia responder. -->
      <details ndsToolGroup [calls]="allCalls" [labels]="labels()"></details>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="tool-group"
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
        <nds-docs-demonstration
          [title]="t('demonstration.title')"
          componentSlug="tool-group"
        >
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- OS QUATRO CASOS, e a legenda diz QUAL está desenhado: sem ela,
                 quatro caixas fechadas empilhadas viram uma só, e o assunto da
                 demonstração é justamente a diferença entre o que cada resumo
                 diz. O separador é decorativo de propósito — quem dá a
                 estrutura a quem ouve é a legenda. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.failure') }}</p>
              <details ndsToolGroup [calls]="failureCalls" [labels]="labels()"></details>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.done') }}</p>
              <details ndsToolGroup [calls]="doneCalls" [labels]="labels()"></details>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.running') }}</p>
              <details ndsToolGroup [calls]="runningCalls" [labels]="labels()"></details>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.waiting') }}</p>
              <!-- À vista e aberta: é o que a decisão 3 da folha manda fazer com
                   a chamada que espera por uma pessoa. -->
              <details ndsToolGroup [calls]="waitingCalls" [labels]="labels()" [open]="true"></details>
            </div>
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="t('anatomy.structureCode')"
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
          [description]="t('import.basic')"
          [code]="t('import.basicCode')"
          [secondaryDescription]="t('import.withLabels')"
          [secondaryCode]="t('import.withLabelsCode')"
          componentSlug="tool-group"
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
          [extensibilityCode]="t('props.extensibilityCode')"
          language="ts"
        />

        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="t('tokens.customizationCode')"
          language="css"
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
          componentSlug="tool-group"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="tool-group"
        />

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
export class NdsToolGroupDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;

  // As chamadas são DADO, e por isso não acompanham a troca de idioma: o nome
  // de uma ferramenta é o nome que o agente chamou, e traduzi-lo faria a mesma
  // lista mudar de largura conforme o idioma da página.
  protected readonly failureCalls = TOOL_CALLS_WITH_FAILURE;
  protected readonly doneCalls = TOOL_CALLS_ALL_DONE;
  protected readonly runningCalls = TOOL_CALLS_RUNNING;

  /** Tudo junto — inclusive a que espera por alguém. É o contraexemplo. */
  protected readonly allCalls = [TOOL_CALL_WAITING, ...TOOL_CALLS_WITH_FAILURE];

  /**
   * A separação vem do vocabulário compartilhado, e não de um filtro escrito
   * aqui: um filtro local seria a quinta cópia do mesmo literal solto.
   */
  private readonly split = splitWaitingCalls(this.allCalls);
  protected readonly waitingCalls = this.split.waiting;
  protected readonly groupedCalls = this.split.grouped;

  /** Os rótulos são texto de interface, então acompanham a troca de idioma. */
  protected readonly labels = computed<ToolGroupLabels>(() => {
    dict();
    return toolGroupLabels();
  });

  /**
   * O contraexemplo do primeiro par: o resumo do conjunto sem palavra nenhuma.
   *
   * A caixa fechada passa a contar as ferramentas sem dizer que algo falhou. As
   * chaves saem de `TOOL_CALL_STATES`, e não de quatro linhas escritas à mão —
   * mesma razão da tabela de estados logo abaixo. Só o mapa do CONJUNTO é
   * esvaziado: a palavra de cada linha continua lá, e é o que torna o
   * contraexemplo exato — a informação existe, mas só para quem abriu.
   */
  protected readonly wordless = computed<ToolGroupLabels>(() => ({
    ...this.labels(),
    summary: TOOL_CALL_STATES.reduce((acc, state) => {
      acc[state] = '';
      return acc;
    }, {} as Record<ToolCallState, string>),
  }));

  protected readonly activeSection = signal<string | undefined>(undefined);
  private observer: { disconnect: () => void } | undefined;

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => t(`anatomy.item${i}`));
  });

  protected readonly guidelines = computed(() => {
    dict();
    return {
      title: t('usage.guidelines.title'),
      items: [1, 2, 3, 4, 5].map((i) => t(`usage.guidelines.item${i}`)),
    };
  });

  protected readonly scenarios = computed(() => {
    dict();
    return {
      title: t('usage.scenarios.title'),
      cols: {
        scenario: t('usage.scenarios.cols.scenario'),
        use: t('usage.scenarios.cols.use'),
        alternative: t('usage.scenarios.cols.alternative'),
      },
      items: [1, 2, 3, 4, 5].map((i) => ({
        s: t(`usage.scenarios.item${i}.s`),
        u: t(`usage.scenarios.item${i}.u`),
        a: toPlainText(t(`usage.scenarios.item${i}.a`)),
      })),
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
      items: ['groupTitle', 'summaryState', 'callState', 'detail'].map((key) => ({
        element: t(`usage.uxWriting.table.${key}.name`),
        rules: t(`usage.uxWriting.table.${key}.format`),
        do: t(`usage.uxWriting.table.${key}.good`),
        dont: t(`usage.uxWriting.table.${key}.bad`),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    dict();
    return { title: t('usage.do.title'), items: [1, 2, 3, 4].map((i) => t(`usage.do.item${i}`)) };
  });

  protected readonly usageDont = computed(() => {
    dict();
    return {
      title: t('usage.dont.title'),
      items: [1, 2, 3, 4].map((i) => t(`usage.dont.item${i}`)),
    };
  });

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
    // A ordem sai de `TOOL_CALL_STATES`: a tabela e a story de estados leem a
    // mesma lista, e nenhuma das duas fica para trás quando o tipo cresce.
    return TOOL_CALL_STATES.map((k) => ({
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
    const rowsOf = (keys: string[]) =>
      keys.map((k) => ({
        name: t(`props.table.${k}.name`),
        type: t(`props.table.${k}.type`),
        defaultValue: t(`props.table.${k}.default`),
        required: t(`props.table.${k}.required`),
        description: toPlainText(t(`props.table.${k}.description`)),
      }));
    return [
      {
        title: 'NdsToolGroup',
        cols,
        items: rowsOf(['calls', 'labels', 'open', 'onOpenChange']),
      },
      {
        title: 'ToolGroupLabels',
        cols,
        items: rowsOf(['labelsTitle', 'labelsSummary', 'labelsCall']),
      },
    ];
  });

  protected readonly tokensCols = computed(() => {
    dict();
    return {
      token: t('tokens.table.token'),
      value: t('tokens.table.value'),
      description: t('tokens.table.description'),
    };
  });

  protected readonly tokenItems = computed(() => {
    dict();
    return [
      'textLabel', 'border', 'muted', 'radius', 'foreground',
      'mutedForeground', 'ring', 'spacing3', 'spacing6', 'fontWeightMedium',
    ].map((k) => ({
      token: t(`tokens.table.${k}.token`),
      value: t(`tokens.table.${k}.value`),
      description: toPlainText(t(`tokens.table.${k}.description`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => t(`accessibility.items.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',   description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Enter', description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: '↑ ↓',   description: toPlainText(t('accessibility.keyboard.arrows')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return [1, 2, 3].map((i) => t(`accessibility.screenReader.item${i}`));
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'chatThread',  path: '?path=/docs/primitives-conversational-chatthread--docs'  },
      { key: 'agentStatus', path: '?path=/docs/primitives-conversational-agentstatus--docs' },
      { key: 'badge',       path: '?path=/docs/primitives-feedback-badge--docs'             },
      { key: 'accordion',   path: '?path=/docs/primitives-disclosure-accordion--docs'       },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: toPlainText(t(`related.items.${key}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
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
    return ['pageView', 'sectionViewed', 'demoClick'].map((k) => ({
      event: t(`analytics.table.${k}`),
      trigger: toPlainText(t(`analytics.table.${k}Trigger`)),
      payload: t(`analytics.table.${k}Payload`),
    }));
  });

  protected readonly testesFunctional = computed(() => {
    dict();
    return {
      title: t('testes.functional.title'),
      description: t('testes.functional.description'),
      cols: {
        action: tNav('common.userAction'),
        result: tNav('common.expectedResult'),
        priority: tNav('common.priority'),
      },
      items: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
        action: toPlainText(t(`testes.functional.item${i}.action`)),
        result: toPlainText(t(`testes.functional.item${i}.result`)),
        priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    dict();
    // A lista é PLANA: cada item é um critério, e o "como verificar" é o próprio
    // addon-a11y rodando em toda story.
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: {
        criterion: tNav('common.criterion'),
        level: 'WCAG',
        how: tNav('common.howToVerify'),
      },
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
        criterion: toPlainText(t(`testes.accessibility.item${i}`)),
        level: 'AA',
        how: '—',
      })),
    };
  });

  protected readonly testesVisual = computed(() => {
    dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: {
        story: tNav('common.storyState'),
        priority: tNav('common.priority'),
      },
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
        story: toPlainText(t(`testes.visual.item${i}.story`)),
        priority: priorityLabel(t(`testes.visual.item${i}.priority`)),
      })),
    };
  });

  constructor() {
    effect((onCleanup) => {
      dict();
      const locale = getLocale();
      const cleanup = applySeo({
        title: t('seo.title'),
        description: t('seo.description'),
        locale,
        componentSlug: 'tool-group',
      });
      track('docs_page_view', {
        component_name: 'tool-group',
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
          component_name: 'tool-group',
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
