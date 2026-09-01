import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  TemplateRef,
  ViewEncapsulation,
  computed,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { toPlainText } from '@/lib/strip-html';
import { NdsComputerUse, type ComputerUseLabels } from '@/components/ui/computer-use';
import {
  NdsComputerUseDemoScreen,
  computerUseLabels,
} from '@/components/ui/computer-use.fixtures';
import { NdsSeparator } from '@/components/ui/separator';
import { RUN_STATUSES, type ComputerStep } from '@shared/primitives/chat-protocol';
import {
  COMPUTER_STEPS_LOGIN,
  COMPUTER_URL,
} from '@shared/primitives/computer-use-examples';
import uiTranslations from '@/i18n/ui.json';
import computerUseTranslations from '@shared/content/computer-use/translations.json';

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

// UM ÚNICO OVERRIDE, e ele troca o TIPO — nunca a descrição.
//
// As seis entradas se chamam `url`, `screen`, `steps`, `activeIndex`, `status` e
// `labels` aqui, exatamente como no conteúdo compartilhado, e cinco delas têm o
// mesmo tipo. A que diverge é a TELA: divergência de API de framework, que se
// REGISTRA em vez de se "alinhar". Onde o conteúdo compartilhado descreve o
// elemento já montado, esta stack recebe o template que o monta — quem consome
// declara um `<ng-template>` e a peça o instancia. A descrição continua sendo a
// do conteúdo compartilhado, porque ela é API-neutra e continua verdadeira: a
// tela é de quem consome, e a peça não escreve nem apaga o texto alternativo
// dela.
const { t, dict } = useTranslation(computerUseTranslations as Record<string, unknown>, {
  '*': { 'props.table.screen.type': 'TemplateRef<unknown>' },
});

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

const INTERFACE_CODE = `// As seis entradas da peça, no <figure ndsComputerUse>
export class NdsComputerUse {
  readonly url = input.required<string>();
  readonly screen = input.required<TemplateRef<unknown>>();
  readonly steps = input<readonly ComputerStep[]>([]);
  readonly activeIndex = input<number>(0);
  readonly status = input<RunStatus>('idle');
  readonly labels = input.required<ComputerUseLabels>();

  // Não há saída nenhuma: a peça é o REGISTRO de onde o agente está tocando, e
  // não o controle. Avançar é de quem consome — ela não agenda quadro, não conta
  // tempo e não dirige nada.
}

export interface ComputerUseLabels {
  address: string;    // a palavra que apresenta o endereço, só para quem ouve
  position: string;   // molde com \`{index}\` e \`{total}\`
}

// O passo vem de \`@shared/primitives/chat-protocol\`, e é o primeiro tipo daquele
// arquivo que carrega GEOMETRIA. \`action\` e \`target\` rimam com o nome e o
// detalhe de uma chamada de ferramenta; \`x\` e \`y\` não têm par em nada que o
// vocabulário já descreva, e é essa dupla que faz a peça existir.
interface ComputerStep {
  id?: string;
  action: string;
  target: string;
  x: number;   // porcentagem da largura do quadro
  y: number;   // porcentagem da altura do quadro
}

// O ESTADO É DA SESSÃO, e não do passo. Um estado por passo faria a peça pintar
// cores sobre uma tela de terceiro, que é justamente a codificação que a legenda
// existe para não precisar.
type RunStatus = 'idle' | 'running' | 'stopped' | 'complete' | 'failed';`;

/** Uma marca do rastro, já pronta para o template dos contraexemplos. */
interface DocsMark {
  key: string;
  x: string;
  y: string;
  active: string | null;
}

/**
 * As marcas de uma janela do rastro.
 *
 * Mora aqui porque os dois contraexemplos são montados À MÃO — a peça sempre
 * desenha o rastro certo, então não há entrada que produza o erro que o par
 * mostra.
 */
function marksFor(
  steps: readonly ComputerStep[],
  activeIndex: number,
  length: number,
): DocsMark[] {
  const from = Math.max(activeIndex - (length - 1), 0);
  const marks: DocsMark[] = [];
  for (let i = from; i <= activeIndex; i++) {
    const step = steps[i]!;
    marks.push({
      key: step.id ?? String(i),
      x: String(step.x),
      y: String(step.y),
      active: i === activeIndex ? 'true' : null,
    });
  }
  return marks;
}

@Component({
  selector: 'nds-computer-use-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsComputerUse, NdsComputerUseDemoScreen, NdsSeparator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsStates, NdsDocsProps,
    NdsDocsTokens, NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes,
    NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- A TELA É NOVA A CADA INSTANCIAÇÃO, e é o que permite declarar UM
         template e projetá-lo em todas as molduras da página: cada saída de
         template monta a sua própria tela, com o próprio escopo de id. É a
         divergência de instrumento a favor — onde a tela é um elemento já
         montado, um só passado a duas peças seria movido da primeira para a
         segunda, e a primeira moldura ficaria vazia. -->
    <ng-template #tela><nds-computer-use-demo-screen></nds-computer-use-demo-screen></ng-template>

    <!-- O primeiro par é o da legenda: ela é a peça para quem ouve, e a marca
         sobre a imagem não chega a quem não vê a tela. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="lg">
        <figure
          ndsComputerUse
          [url]="url"
          [screen]="tela"
          [steps]="steps"
          [activeIndex]="3"
          status="running"
          [labels]="labels()"
        ></figure>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <!-- O contraexemplo é escrito À MÃO, e tem de ser: a peça sempre desenha a
           legenda quando há passo, então não há entrada que produza o erro. Aqui
           a legenda não existe, e sobra a marca sobre a imagem — que é
           exatamente o que não chega a quem não vê. -->
      <div class="nds-stack nds-w-full" data-spacing="lg">
        <figure class="nds-computer-use" data-status="running" aria-busy="true">
          <p class="nds-computer-use-address nds-font-mono">
            <span class="nds-sr-only">{{ addressWord() }}</span>
            <span class="nds-computer-use-url nds-truncate" lang="en">{{ url }}</span>
          </p>
          <div class="nds-computer-use-screen">
            <div class="nds-computer-use-surface">
              <nds-computer-use-demo-screen></nds-computer-use-demo-screen>
            </div>
            <span class="nds-computer-use-trail" aria-hidden="true">
              @for (mark of trailAtThird; track mark.key) {
                <span
                  class="nds-computer-use-mark"
                  [attr.data-active]="mark.active"
                  [style.--computer-use-mark-x]="mark.x"
                  [style.--computer-use-mark-y]="mark.y"
                ></span>
              }
            </span>
          </div>
        </figure>
      </div>
    </ng-template>

    <!-- O segundo par é o do rastro: três marcas desenham um caminho, e a sessão
         inteira marcada de uma vez cobre a tela que ela deveria estar
         apontando. -->
    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="lg">
        <figure
          ndsComputerUse
          [url]="url"
          [screen]="tela"
          [steps]="steps"
          [activeIndex]="5"
          status="running"
          [labels]="labels()"
        ></figure>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-stack nds-w-full" data-spacing="lg">
        <figure class="nds-computer-use" data-status="running" aria-busy="true">
          <p class="nds-computer-use-address nds-font-mono">
            <span class="nds-sr-only">{{ addressWord() }}</span>
            <span class="nds-computer-use-url nds-truncate" lang="en">{{ url }}</span>
          </p>
          <div class="nds-computer-use-screen">
            <div class="nds-computer-use-surface">
              <nds-computer-use-demo-screen></nds-computer-use-demo-screen>
            </div>
            <span class="nds-computer-use-trail" aria-hidden="true">
              @for (mark of allMarks; track mark.key) {
                <span
                  class="nds-computer-use-mark"
                  [attr.data-active]="mark.active"
                  [style.--computer-use-mark-x]="mark.x"
                  [style.--computer-use-mark-y]="mark.y"
                ></span>
              }
            </span>
          </div>
          <figcaption class="nds-computer-use-caption">
            <span class="nds-computer-use-action">{{ lastAction }}</span>
            <span class="nds-computer-use-target nds-truncate">{{ lastTarget }}</span>
            <span class="nds-computer-use-position">{{ lastPosition() }}</span>
          </figcaption>
        </figure>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="computer-use"
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
          componentSlug="computer-use"
        >
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- A legenda diz QUAL exemplo está desenhado — sem ela, quatro
                 molduras empilhadas viram uma só, e o assunto da demonstração é
                 justamente a diferença entre elas.

                 O separador é decorativo de propósito: quem dá a estrutura para
                 quem ouve é a legenda de cada exemplo, não a linha. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.running') }}</p>
              <figure
                ndsComputerUse
                [url]="url"
                [screen]="tela"
                [steps]="steps"
                [activeIndex]="3"
                status="running"
                [labels]="labels()"
              ></figure>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.finished') }}</p>
              <figure
                ndsComputerUse
                [url]="url"
                [screen]="tela"
                [steps]="steps"
                [activeIndex]="lastIndex"
                status="complete"
                [labels]="labels()"
              ></figure>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.firstStep') }}</p>
              <figure
                ndsComputerUse
                [url]="url"
                [screen]="tela"
                [steps]="steps"
                [activeIndex]="0"
                status="running"
                [labels]="labels()"
              ></figure>
            </div>

            <div ndsSeparator></div>

            <!-- A moldura antes do primeiro toque: sem passo nenhum não há
                 rastro nem legenda, e uma legenda vazia daria à figura um nome
                 em branco. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.withoutSteps') }}</p>
              <figure
                ndsComputerUse
                [url]="url"
                [screen]="tela"
                [steps]="noSteps"
                status="idle"
                [labels]="labels()"
              ></figure>
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
          componentSlug="computer-use"
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
          componentSlug="computer-use"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="computer-use"
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
export class NdsComputerUseDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;

  /** O endereço das fotos. Fictício, e é escolha: ver a folha. */
  protected readonly url = COMPUTER_URL;

  /**
   * Os passos das fotos.
   *
   * Dado, e por isso os mesmos nos três idiomas: o ponto que o agente clicou não
   * é idioma, e pontos diferentes por foto fariam as marcas caírem em lugares
   * diferentes sem que ninguém conseguisse atribuir a divergência a nada.
   */
  protected readonly steps = COMPUTER_STEPS_LOGIN;
  protected readonly lastIndex = COMPUTER_STEPS_LOGIN.length - 1;

  /** A sessão que ainda não começou. Lista estável, para não remontar a foto. */
  protected readonly noSteps: readonly ComputerStep[] = [];

  /** As marcas dos dois contraexemplos, montadas à mão. */
  protected readonly trailAtThird = marksFor(COMPUTER_STEPS_LOGIN, 3, 3);
  protected readonly allMarks = marksFor(
    COMPUTER_STEPS_LOGIN,
    COMPUTER_STEPS_LOGIN.length - 1,
    COMPUTER_STEPS_LOGIN.length,
  );

  /** O passo que a legenda do segundo contraexemplo descreve. */
  protected readonly lastAction = COMPUTER_STEPS_LOGIN[COMPUTER_STEPS_LOGIN.length - 1]!.action;
  protected readonly lastTarget = COMPUTER_STEPS_LOGIN[COMPUTER_STEPS_LOGIN.length - 1]!.target;

  /** Os rótulos são texto de interface, então acompanham a troca de idioma. */
  protected readonly labels = computed<ComputerUseLabels>(() => {
    dict();
    return computerUseLabels();
  });

  /** A palavra que apresenta o endereço, para os contraexemplos escritos à mão. */
  protected readonly addressWord = computed(() => this.labels().address);

  /** A contagem do segundo contraexemplo, escrita pelo mesmo molde da peça. */
  protected readonly lastPosition = computed(() => {
    const total = COMPUTER_STEPS_LOGIN.length;
    return this.labels()
      .position.replace('{index}', String(total))
      .replace('{total}', String(total));
  });

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
      items: ['address', 'action', 'target', 'position'].map((key) => ({
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
        title: 'NdsComputerUse',
        cols,
        items: rowsOf(['url', 'screen', 'steps', 'activeIndex', 'status', 'labels']),
      },
      {
        title: 'ComputerUseLabels',
        cols,
        items: rowsOf(['labelsAddress', 'labelsPosition']),
      },
      {
        title: 'ComputerStep',
        cols,
        items: rowsOf(['stepAction', 'stepTarget', 'stepX', 'stepY']),
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
      'textLabel', 'spacing1', 'spacing2', 'spacing3', 'muted', 'border',
      'radius', 'radiusSm', 'radiusFull', 'mutedForeground', 'foreground',
      'background', 'primary', 'fontWeightMedium', 'durationStately', 'easeStandard',
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
      { key: 'agentStatus',   path: '?path=/docs/primitives-conversational-agentstatus--docs'   },
      { key: 'toolGroup',     path: '?path=/docs/primitives-conversational-toolgroup--docs'     },
      { key: 'terminalBlock', path: '?path=/docs/primitives-conversational-terminalblock--docs' },
      { key: 'agentPlan',     path: '?path=/docs/primitives-conversational-agentplan--docs'     },
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
        componentSlug: 'computer-use',
      });
      track('docs_page_view', {
        component_name: 'computer-use',
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
          component_name: 'computer-use',
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
