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
import { NdsFlowGraph, type FlowGraphLabels } from '@/components/ui/flow-graph';
import {
  flowGraphLabels,
  wideFlowEdges,
  wideFlowNodes,
} from '@/components/ui/flow-graph.fixtures';
import { NdsSeparator } from '@/components/ui/separator';
import {
  TOOL_CALL_STATES,
  type FlowEdge,
  type FlowNode,
  type ToolCallState,
} from '@shared/primitives/chat-protocol';
import { resolveFlowGraph } from '@shared/primitives/flow-graph-edges';
import {
  FLOW_EDGES_ORDER,
  FLOW_NODES_FAILURE,
  FLOW_NODES_ORDER,
  FLOW_NODES_PARTIAL,
} from '@shared/primitives/flow-graph-examples';
import uiTranslations from '@/i18n/ui.json';
import flowGraphTranslations from '@shared/content/flow-graph/translations.json';

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

// NENHUM OVERRIDE, e vale registrar por quê.
//
// As quatro entradas se chamam `nodes`, `edges`, `status` e `labels` aqui,
// exatamente como no conteúdo compartilhado, e as quatro têm o mesmo tipo. A
// única divergência desta stack é de RENDERIZAÇÃO, não de assinatura — quem
// escreve o `<div ndsFlowGraph>` é quem consome, e nenhum componente do Angular
// pode recusar o próprio host —, e divergência de renderização não tem linha na
// tabela de propriedades: ela está escrita no docblock da peça e na nota de
// arquitetura desta página.
const { t, dict } = useTranslation(flowGraphTranslations as Record<string, unknown>);

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

const INTERFACE_CODE = `// As quatro entradas da peça, no <div ndsFlowGraph>
export class NdsFlowGraph {
  readonly nodes = input.required<readonly FlowNode[]>();
  readonly edges = input<readonly FlowEdge[]>([]);
  readonly status = input<RunStatus>('idle');
  readonly labels = input.required<FlowGraphLabels>();

  // Não há saída nenhuma: a peça é de leitura, não oferece ação e não avança
  // sozinha. Mostrar o grafo aos poucos é passar menos nós.
}

export interface FlowGraphLabels {
  region: string;     // o nome da camada que rola — obrigatório
  dependsOn: string;  // molde com \`{sources}\`
  state: Record<ToolCallState, string>;
}

// O nó e a ligação vêm de \`@shared/primitives/chat-protocol\`. \`FlowNode\` é o
// SEGUNDO tipo daquele arquivo que carrega geometria, e entra pelo mesmo
// critério do primeiro: ser a origem única do que cinco stacks reescreveriam.
interface FlowNode {
  id: string;
  label: string;
  column: number;  // casa da grade, relativa às demais
  row: number;     // casa da grade, relativa às demais
  state: ToolCallState;
}

// A PRIMEIRA RELAÇÃO deste vocabulário: um par de endereços diz "este depende
// daquele". Uma fila ordenada não sabe dizer isso, porque fila não se ramifica
// nem se reencontra. A ligação não carrega estado — o estado mora nos nós, e
// uma ligação com estado próprio poderia discordar das duas pontas.
interface FlowEdge {
  from: string;
  to: string;
}

type ToolCallState = 'pending' | 'running' | 'done' | 'failed';`;

/** Uma ligação já pronta para o template dos contraexemplos. */
interface DocsEdge {
  key: string;
  path: string;
}

/** Um nó já pronto para o template dos contraexemplos. */
interface DocsNode {
  key: string;
  id: string;
  state: ToolCallState;
  label: string;
  /** Cadeia, e não número: valor numérico faria o Angular anexar "px". */
  column: string;
  row: string;
  reading: string;
}

/** O grafo pronto para o template dos contraexemplos. */
interface DocsGraph {
  columns: string;
  rows: string;
  viewBox: string;
  edges: readonly DocsEdge[];
  nodes: readonly DocsNode[];
}

/**
 * O grafo desenhado à mão, para os dois contraexemplos.
 *
 * MORA AQUI porque os contraexemplos são montados À MÃO — a peça sempre escreve
 * a leitura de cada nó e sempre dá papel e nome à camada que rola, então não há
 * entrada que produza o erro que o par mostra. A conta continua sendo a do
 * primitivo compartilhado: o que esta função faz é só o arranjo para o template.
 */
function drawGraph(
  nodes: readonly FlowNode[],
  edges: readonly FlowEdge[],
  labels: FlowGraphLabels,
): DocsGraph | null {
  const drawing = resolveFlowGraph(nodes, edges);
  if (!drawing) return null;

  return {
    columns: String(drawing.columns),
    rows: String(drawing.rows),
    viewBox: `0 0 ${drawing.columns} ${drawing.rows}`,
    edges: drawing.edges.map((edge, index) => ({
      key: `${index}-${edge.from}-${edge.to}`,
      path: edge.path,
    })),
    nodes: drawing.nodes.map((drawn, index) => {
      const parts = [labels.state[drawn.node.state]];
      if (drawn.dependsOn.length > 0) {
        parts.push(labels.dependsOn.replace('{sources}', drawn.dependsOn.join(', ')));
      }
      return {
        key: `${index}-${drawn.node.id}`,
        id: drawn.node.id,
        state: drawn.node.state,
        label: drawn.node.label,
        column: String(drawn.columnLine),
        row: String(drawn.rowLine),
        reading: parts.join(' '),
      };
    }),
  };
}

@Component({
  selector: 'nds-flow-graph-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsFlowGraph, NdsSeparator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsStates, NdsDocsProps,
    NdsDocsTokens, NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes,
    NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- O primeiro par é o da leitura: cada nó diz em palavras o estado e de
         quem depende, e é isso que faz o grafo se reconstruir de ouvido. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="lg">
        <div
          ndsFlowGraph
          [nodes]="orderNodes"
          [edges]="orderEdges"
          status="running"
          [labels]="labels()"
        ></div>
      </div>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <!-- O contraexemplo é escrito À MÃO, e tem de ser: a peça sempre escreve a
           leitura de cada nó, então não há entrada que produza o erro. Aqui a
           frase não existe, e sobra a curva — que é exatamente o que não chega a
           quem lê de ouvido. -->
      <div class="nds-stack nds-w-full" data-spacing="lg">
        @if (orderGraph(); as drawn) {
          <div class="nds-flow-graph" aria-busy="true">
            <div
              class="nds-flow-graph-viewport"
              tabindex="0"
              role="group"
              [attr.aria-label]="regionName()"
            >
              <div
                class="nds-flow-graph-canvas"
                [style.--flow-graph-columns]="drawn.columns"
                [style.--flow-graph-rows]="drawn.rows"
              >
                <svg
                  class="nds-flow-graph-edges"
                  [attr.viewBox]="drawn.viewBox"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  @for (edge of drawn.edges; track edge.key) {
                    <path
                      class="nds-flow-graph-edge"
                      [attr.d]="edge.path"
                      vector-effect="non-scaling-stroke"
                    />
                  }
                </svg>
                <ol class="nds-flow-graph-nodes">
                  @for (node of drawn.nodes; track node.key) {
                    <li
                      class="nds-flow-graph-node"
                      [attr.data-state]="node.state"
                      [style.--flow-graph-node-column]="node.column"
                      [style.--flow-graph-node-row]="node.row"
                    >
                      <span class="nds-flow-graph-node-marker" aria-hidden="true"></span>
                      <span class="nds-flow-graph-node-label">{{ node.label }}</span>
                    </li>
                  }
                </ol>
              </div>
            </div>
          </div>
        }
      </div>
    </ng-template>

    <!-- O segundo par é o da camada que rola: papel, nome e parada de teclado
         andam juntos, e sem o papel o nome é descartado pelo navegador. -->
    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="lg">
        <div class="nds-max-w-md">
          <div
            ndsFlowGraph
            [nodes]="wideNodes"
            [edges]="wideEdges"
            status="running"
            [labels]="labels()"
          ></div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <!-- A camada que rola sem papel e sem nome: quem chega ali por teclado
           para numa parada anônima. É o defeito que dois componentes desta casa
           já tiveram, e o motivo pelo qual o papel e o nome andam na mesma
           linha. -->
      <div class="nds-stack nds-w-full" data-spacing="lg">
        <div class="nds-max-w-md">
          @if (wideGraph(); as drawn) {
            <div class="nds-flow-graph" aria-busy="true">
              <div class="nds-flow-graph-viewport" tabindex="0">
                <div
                  class="nds-flow-graph-canvas"
                  [style.--flow-graph-columns]="drawn.columns"
                  [style.--flow-graph-rows]="drawn.rows"
                >
                  <svg
                    class="nds-flow-graph-edges"
                    [attr.viewBox]="drawn.viewBox"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    focusable="false"
                  >
                    @for (edge of drawn.edges; track edge.key) {
                      <path
                        class="nds-flow-graph-edge"
                        [attr.d]="edge.path"
                        vector-effect="non-scaling-stroke"
                      />
                    }
                  </svg>
                  <ol class="nds-flow-graph-nodes">
                    @for (node of drawn.nodes; track node.key) {
                      <li
                        class="nds-flow-graph-node"
                        [attr.data-state]="node.state"
                        [style.--flow-graph-node-column]="node.column"
                        [style.--flow-graph-node-row]="node.row"
                      >
                        <span class="nds-flow-graph-node-marker" aria-hidden="true"></span>
                        <span class="nds-flow-graph-node-label">{{ node.label }}</span>
                        <span class="nds-sr-only">{{ node.reading }}</span>
                      </li>
                    }
                  </ol>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="flow-graph"
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
          componentSlug="flow-graph"
        >
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- A legenda diz QUAL exemplo está desenhado — sem ela, quatro
                 grades empilhadas viram uma só, e o assunto da demonstração é
                 justamente a diferença entre elas.

                 O separador é decorativo de propósito: quem dá a estrutura para
                 quem ouve é a legenda de cada exemplo, não a linha. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.order') }}</p>
              <div
                ndsFlowGraph
                [nodes]="orderNodes"
                [edges]="orderEdges"
                status="running"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.failure') }}</p>
              <div
                ndsFlowGraph
                [nodes]="failureNodes"
                [edges]="orderEdges"
                status="failed"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <!-- REVELAR É PASSAR MENOS NÓS: as três ligações que perderam uma
                 ponta somem sozinhas, sem nenhuma regra a mais. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.partial') }}</p>
              <div
                ndsFlowGraph
                [nodes]="partialNodes"
                [edges]="orderEdges"
                status="running"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.wide') }}</p>
              <div class="nds-max-w-md">
                <div
                  ndsFlowGraph
                  [nodes]="wideNodes"
                  [edges]="wideEdges"
                  status="running"
                  [labels]="labels()"
                ></div>
              </div>
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
          componentSlug="flow-graph"
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
          componentSlug="flow-graph"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="flow-graph"
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
export class NdsFlowGraphDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;

  /**
   * Os grafos das fotos.
   *
   * Dado, e por isso os mesmos nos três idiomas: a forma do grafo não é idioma,
   * e coordenadas diferentes por foto mostrariam desenhos diferentes sem que
   * ninguém conseguisse atribuir a divergência a nada.
   */
  protected readonly orderNodes = FLOW_NODES_ORDER;
  protected readonly orderEdges = FLOW_EDGES_ORDER;
  protected readonly failureNodes = FLOW_NODES_FAILURE;
  protected readonly partialNodes = FLOW_NODES_PARTIAL;
  protected readonly wideNodes = wideFlowNodes();
  protected readonly wideEdges = wideFlowEdges();

  /** Os rótulos são texto de interface, então acompanham a troca de idioma. */
  protected readonly labels = computed<FlowGraphLabels>(() => {
    dict();
    return flowGraphLabels();
  });

  /** O nome da camada que rola, para o contraexemplo escrito à mão. */
  protected readonly regionName = computed(() => this.labels().region);

  /** Os dois grafos dos contraexemplos, montados à mão. */
  protected readonly orderGraph = computed(() =>
    drawGraph(FLOW_NODES_ORDER, FLOW_EDGES_ORDER, this.labels()),
  );
  protected readonly wideGraph = computed(() =>
    drawGraph(this.wideNodes, this.wideEdges, this.labels()),
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
      items: ['region', 'label', 'dependsOn', 'state'].map((key) => ({
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
        title: 'NdsFlowGraph',
        cols,
        items: rowsOf(['nodes', 'edges', 'status', 'labels']),
      },
      {
        title: 'FlowGraphLabels',
        cols,
        items: rowsOf(['labelsRegion', 'labelsDependsOn', 'labelsState']),
      },
      {
        title: 'FlowNode',
        cols,
        items: rowsOf(['nodeId', 'nodeLabel', 'nodeColumn', 'nodeRow', 'nodeState']),
      },
      {
        title: 'FlowEdge',
        cols,
        items: rowsOf(['edgeFrom', 'edgeTo']),
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
      'textLabel', 'lineHeightNormal', 'spacing2', 'spacing3', 'spacing16',
      'spacing24', 'muted', 'background', 'foreground', 'mutedForeground',
      'border', 'primary', 'success', 'destructive', 'ring', 'radius',
      'radiusSm', 'radiusFull',
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
      { key: '← →',   description: toPlainText(t('accessibility.keyboard.arrows')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return [1, 2, 3].map((i) => t(`accessibility.screenReader.item${i}`));
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'agentPlan',   path: '?path=/docs/components-conversational-agentplan--docs'   },
      { key: 'toolGroup',   path: '?path=/docs/components-conversational-toolgroup--docs'   },
      { key: 'agentStatus', path: '?path=/docs/components-conversational-agentstatus--docs' },
      { key: 'chart',       path: '?path=/docs/components-display-chart--docs'              },
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
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
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
      items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
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
      items: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
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
        componentSlug: 'flow-graph',
      });
      track('docs_page_view', {
        component_name: 'flow-graph',
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
          component_name: 'flow-graph',
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
