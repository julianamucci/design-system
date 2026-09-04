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
import {
  NdsTerminalBlock,
  type TerminalBlockLabels,
} from '@/components/ui/terminal-block';
import {
  exitCodeFor,
  linesFor,
  terminalBlockLabels,
} from '@/components/ui/terminal-block.fixtures';
import { NdsSeparator } from '@/components/ui/separator';
import { RUN_STATUSES, type RunStatus } from '@shared/primitives/chat-protocol';
import { TERMINAL_COMMAND } from '@shared/primitives/terminal-block-examples';
import uiTranslations from '@/i18n/ui.json';
import terminalTranslations from '@shared/content/terminal-block/translations.json';

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

// SEM OVERRIDE, e é o registro de que não há divergência a registrar: as cinco
// entradas se chamam `command`, `lines`, `status`, `exitCode` e `labels` nesta
// stack, exatamente como no conteúdo compartilhado, e os tipos da tabela já são
// os que se escrevem aqui. A peça também não tem saída — não oferece ação, e
// portanto não há callback que trocasse de nome ao virar `output()`. Override
// que não muda nada é linha que envelhece sozinha.
const { t, dict } = useTranslation(terminalTranslations as Record<string, unknown>);

// Esta peça não tem eixo de forma, e o conteúdo compartilhado não traz seção de
// variantes: ela não existe nem na navegação nem na página.
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

const INTERFACE_CODE = `// As cinco entradas da peça, no <div ndsTerminalBlock>
export class NdsTerminalBlock {
  readonly command = input.required<string>();
  readonly lines = input<readonly string[]>([]);
  readonly status = input<RunStatus>('idle');
  readonly exitCode = input<number | undefined>(undefined);
  readonly labels = input.required<TerminalBlockLabels>();

  // Não há saída nenhuma: a peça é o REGISTRO do que rodou, e não o controle.
  // Parar e repetir são do estado da execução, que já os carrega — dois botões
  // de parar para uma execução só fariam quem apertasse um deles não saber qual
  // parou.
}

export interface TerminalBlockLabels {
  status: Record<RunStatus, string>;   // a palavra de cada estado
  exitCode: string;                    // molde com \`{code}\`
}

// O estado vem de \`@shared/primitives/chat-protocol\`, e serve inteiro: um
// comando fica na fila, corre, é interrompido, termina ou quebra. O
// interrompido daqui é o Ctrl-C — escolha de pessoa, e não falha de máquina.
type RunStatus = 'idle' | 'running' | 'stopped' | 'complete' | 'failed';

// É ela que decide se já existe código de saída para mostrar. Mora no
// vocabulário, e não na tela, porque a resposta tem de ser a mesma nas cinco
// stacks — e a que discordaria é a do comando interrompido.
declare function isRunFinished(status: RunStatus): boolean;`;

@Component({
  selector: 'nds-terminal-block-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsTerminalBlock, NdsSeparator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsStates, NdsDocsProps,
    NdsDocsTokens, NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes,
    NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- O primeiro par é o do espaçamento preservado, que é a decisão 7 da
         folha: as colunas da tabela de arquivos só ficam alinhadas com avanço
         fixo e sem quebra automática. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="lg">
        <div
          ndsTerminalBlock
          [command]="command"
          [lines]="completeLines"
          status="complete"
          [exitCode]="completeExitCode"
          [labels]="labels()"
        ></div>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <!-- O contraexemplo é escrito À MÃO, e tem de ser: a peça preserva o
           espaçamento por construção, então não há entrada que produza o erro.
           Aqui a caixa passa a quebrar a linha, e a tabela que alinhava os
           números vira um parágrafo.

           As duas declarações são MECÂNICAS — é o modo de quebra que está sendo
           demonstrado, e ele não tem token. Nada de valor de desenho aqui.

           O conteúdo do bloco pré-formatado encosta nas tags de propósito: o
           compilador não apara espaço dentro de pre, e recuo de template viraria
           saída visível que ninguém escreveu. -->
      <div class="nds-stack nds-w-full" data-spacing="lg">
        <div class="nds-terminal-block" data-status="complete">
          <p class="nds-terminal-block-command nds-font-mono">
            <span class="nds-terminal-block-sigil" aria-hidden="true">$</span>
            <code
              class="nds-terminal-block-command-text"
              id="nds-terminal-block-do-dont-command"
              lang="en"
            >{{ command }}</code>
          </p>
          <pre
            class="nds-terminal-block-output nds-font-mono"
            role="group"
            tabindex="0"
            lang="en"
            aria-labelledby="nds-terminal-block-do-dont-command"
            style="white-space: pre-wrap; overflow-x: hidden"
          >{{ completeText }}</pre>
          <p class="nds-terminal-block-result">
            <span class="nds-terminal-block-dot" aria-hidden="true"></span>
            <span class="nds-terminal-block-status">{{ completeWord() }}</span>
            <span class="nds-terminal-block-exit">{{ completeExitText() }}</span>
          </p>
        </div>
      </div>
    </ng-template>

    <!-- O segundo par é o MESMO par de estados, e os dois pontos são o que se
         vê: o que muda é se a palavra chega a quem não distingue verde de
         vermelho. -->
    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="lg">
        <div
          ndsTerminalBlock
          [command]="command"
          [lines]="completeLines"
          status="complete"
          [exitCode]="completeExitCode"
          [labels]="labels()"
        ></div>
        <div
          ndsTerminalBlock
          [command]="command"
          [lines]="failedLines"
          status="failed"
          [exitCode]="failedExitCode"
          [labels]="labels()"
        ></div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-stack nds-w-full" data-spacing="lg">
        <div
          ndsTerminalBlock
          [command]="command"
          [lines]="completeLines"
          status="complete"
          [exitCode]="completeExitCode"
          [labels]="wordless()"
        ></div>
        <div
          ndsTerminalBlock
          [command]="command"
          [lines]="failedLines"
          status="failed"
          [exitCode]="failedExitCode"
          [labels]="wordless()"
        ></div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="terminal-block"
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
          componentSlug="terminal-block"
        >
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- A legenda diz QUAL exemplo está desenhado — sem ela, quatro
                 blocos empilhados viram um só, e o assunto da demonstração é
                 justamente a diferença entre eles.

                 O separador é decorativo de propósito: quem dá a estrutura para
                 quem ouve é a legenda de cada exemplo, não a linha. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.running') }}</p>
              <div
                ndsTerminalBlock
                [command]="command"
                [lines]="runningLines"
                status="running"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.complete') }}</p>
              <div
                ndsTerminalBlock
                [command]="command"
                [lines]="completeLines"
                status="complete"
                [exitCode]="completeExitCode"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.failed') }}</p>
              <div
                ndsTerminalBlock
                [command]="command"
                [lines]="failedLines"
                status="failed"
                [exitCode]="failedExitCode"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <!-- O comando que terminou sem escrever nada: sem linha nenhuma não
                 há caixa de saída, e caixa vazia com parada de tabulação dentro
                 seria dar foco a lugar nenhum. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.withoutOutput') }}</p>
              <div
                ndsTerminalBlock
                [command]="command"
                status="complete"
                [exitCode]="completeExitCode"
                [labels]="labels()"
              ></div>
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
          componentSlug="terminal-block"
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
          componentSlug="terminal-block"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="terminal-block"
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
export class NdsTerminalBlockDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;

  /** O comando das fotos. É também o nome acessível de cada caixa de saída. */
  protected readonly command = TERMINAL_COMMAND;

  /**
   * A saída de exemplo de cada estado.
   *
   * Dado, e por isso a mesma nos três idiomas: o que a máquina escreveu não é
   * idioma, e saída diferente por foto faria as alturas divergirem sem que
   * ninguém conseguisse atribuir a divergência a nada.
   */
  protected readonly runningLines = linesFor('running');
  protected readonly completeLines = linesFor('complete');
  protected readonly failedLines = linesFor('failed');

  /** O número de cada estado, ou nada onde ele ainda não existe. */
  protected readonly completeExitCode = exitCodeFor('complete');
  protected readonly failedExitCode = exitCodeFor('failed');

  /** Os rótulos são texto de interface, então acompanham a troca de idioma. */
  protected readonly labels = computed<TerminalBlockLabels>(() => {
    dict();
    return terminalBlockLabels();
  });

  /**
   * O contraexemplo do segundo par: o estado que só existe em cor.
   *
   * As palavras saem de `RUN_STATUSES`, e não de cinco linhas escritas à mão —
   * mesma razão da tabela de estados logo abaixo.
   */
  protected readonly wordless = computed<TerminalBlockLabels>(() => ({
    ...this.labels(),
    status: RUN_STATUSES.reduce((acc, status) => {
      acc[status] = '';
      return acc;
    }, {} as Record<RunStatus, string>),
  }));

  /** O que o contraexemplo do primeiro par escreve à mão. */
  protected readonly completeText = this.completeLines.join('\n');
  protected readonly completeWord = computed(() => this.labels().status.complete);
  protected readonly completeExitText = computed(() =>
    this.labels().exitCode.replace('{code}', String(this.completeExitCode)),
  );

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
      items: ['command', 'output', 'status', 'exitCode'].map((key) => ({
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
    // A ordem sai de `RUN_STATUSES`: a tabela e a story de estados leem a mesma
    // lista, e nenhuma das duas fica para trás quando o tipo cresce.
    return RUN_STATUSES.map((k) => ({
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
        title: 'NdsTerminalBlock',
        cols,
        items: rowsOf(['command', 'lines', 'status', 'exitCode', 'labels']),
      },
      {
        title: 'TerminalBlockLabels',
        cols,
        items: rowsOf(['labelsStatus', 'labelsExitCode']),
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
      'textLabel', 'spacing2', 'spacing3', 'muted', 'border', 'radius', 'radiusSm',
      'mutedForeground', 'foreground', 'fontWeightMedium', 'ring', 'durationStately',
      'primary', 'success', 'destructive',
    ].map((k) => ({
      token: t(`tokens.table.${k}.token`),
      value: t(`tokens.table.${k}.value`),
      description: toPlainText(t(`tokens.table.${k}.description`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7, 8].map((i) => t(`accessibility.items.item${i}`));
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
      { key: 'codeBlock',   path: '?path=/docs/components-display-codeblock--docs'          },
      { key: 'agentStatus', path: '?path=/docs/components-conversational-agentstatus--docs' },
      { key: 'toolGroup',   path: '?path=/docs/components-conversational-toolgroup--docs'   },
      { key: 'jobProgress', path: '?path=/docs/components-conversational-jobprogress--docs' },
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
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => ({
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
      items: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
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
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
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
        componentSlug: 'terminal-block',
      });
      track('docs_page_view', {
        component_name: 'terminal-block',
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
          component_name: 'terminal-block',
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
