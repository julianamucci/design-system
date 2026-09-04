import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ComputerUse } from "@/components/ui/computer-use";
import { Separator } from "@/components/ui/separator";
import { DemoScreen, useComputerUseLabels } from "@/components/ui/computer-use.fixtures";
import {
  RUN_STATUSES,
  type ComputerStep,
  type RunStatus,
} from "@shared/primitives/chat-protocol";
import {
  COMPUTER_STEPS_LOGIN,
  COMPUTER_URL,
} from "@shared/primitives/computer-use-examples";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import computerUseTranslations from "@shared/content/computer-use/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsStates }        from "@/components/docs/shared/sections/DocsStates";
import { DocsProps }         from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens }        from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated }       from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes }         from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics }     from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes }        from "@/components/docs/shared/sections/DocsTestes";
import { stripHtml, toPlainText } from "@/lib/strip-html";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

// ─── Nav ─────────────────────────────────────────────────────────────────────

const getNavGroups = (t: (key: string) => string) => [
  {
    label: t("nav.overview"),
    sections: [
      { id: "demonstracao", label: t("nav.demonstration") },
      { id: "anatomia",     label: t("nav.anatomy") },
      { id: "quando-usar",  label: t("nav.usage") },
      { id: "do-dont",      label: t("nav.doDont") },
    ],
  },
  {
    label: t("nav.techRef"),
    sections: [
      { id: "importacao",   label: t("nav.import") },
      { id: "estados",      label: t("nav.states") },
      { id: "propriedades", label: t("nav.props") },
      { id: "tokens",       label: t("nav.tokens") },
    ],
  },
  {
    label: t("nav.context"),
    sections: [
      { id: "acessibilidade", label: t("nav.accessibility") },
      { id: "relacionados",   label: t("nav.related") },
      { id: "notas",          label: t("nav.notes") },
    ],
  },
  {
    label: t("nav.quality"),
    sections: [
      { id: "analytics", label: t("nav.analytics") },
      { id: "testes",    label: t("nav.testes") },
    ],
  },
];

const INTERFACE_CODE = `export interface ComputerUseLabels {
  address: string;    // a palavra que apresenta o endereço, só para quem ouve
  position: string;   // molde com \`{index}\` e \`{total}\`
}

// O passo vem de \`@shared/primitives/chat-protocol\`, e é o primeiro tipo
// daquele arquivo que carrega GEOMETRIA. \`action\` e \`target\` rimam com o nome
// e o detalhe de uma chamada de ferramenta; \`x\` e \`y\` não têm par em nada que
// o vocabulário já descreva, e é essa dupla que faz a peça existir.
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

// ─── Componente principal ─────────────────────────────────────────────────────

export function ComputerUseDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  // A TELA é o único nome cujo TIPO diverge, e a divergência é de framework: o
  // conteúdo compartilhado descreve o espaço onde não há renderer, e aqui ele é
  // um nó de React. O nome e a descrição continuam sendo os do conteúdo — o que
  // muda é a palavra que nomeia o tipo nesta stack.
  const { t: tContent, locale } = useTranslation(computerUseTranslations, {
    "*": { "props.table.screen.type": "ReactNode" },
  });

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (computerUseTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      )
        .filter(([key]) => key !== "title")
        .map(([, value]) => value),
    [locale],
  );

  // O hook, e não a função pura: é ele que subscreve a loja e faz as peças
  // desta página se redesenharem quando o idioma muda. A função pura serve à
  // `play`, onde não há componente para pendurar um hook.
  const labels = useComputerUseLabels();

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups],
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "computer-use",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "computer-use",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "computer-use",
        locale,
      });
    },
    [locale],
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  const priorityLabel = (raw: string) => tNav(priorityKeyMap[raw] ?? "common.high");

  /**
   * Uma tela, sem repetir o endereço e os rótulos em cada chamada.
   *
   * A TELA É NOVA A CADA CHAMADA, e aqui isso sai de graça: `<DemoScreen />` é
   * descrição, e não elemento — cada moldura monta a sua, com o próprio escopo
   * de id para os dois campos rotulados.
   */
  const piece = (
    status: RunStatus,
    activeIndex: number,
    steps: readonly ComputerStep[] = COMPUTER_STEPS_LOGIN,
  ) => (
    <ComputerUse
      url={COMPUTER_URL}
      screen={<DemoScreen />}
      steps={steps}
      activeIndex={activeIndex}
      status={status}
      labels={labels}
    />
  );

  /** Uma pilha de peças, para o par do certo e do errado. */
  const stackOf = (...pieces: ReactNode[]) => (
    <div className="nds-stack nds-w-full" data-spacing="lg">
      {pieces.map((el, i) => (
        <Fragment key={i}>{el}</Fragment>
      ))}
    </div>
  );

  /**
   * Uma tela, rotulada.
   *
   * A legenda diz QUAL caso está desenhado — sem ela, quatro molduras empilhadas
   * viram uma só, e o assunto da demonstração é justamente a diferença entre elas.
   */
  const example = (labelKey: string, node: ReactNode) => (
    <div className="nds-stack nds-w-full" data-spacing="xs">
      <p className="nds-text-caption nds-text-muted-foreground">
        {stripHtml(tContent(labelKey))}
      </p>
      {node}
    </div>
  );

  const examples = [
    example("demonstration.labels.running",      piece("running", 3)),
    example("demonstration.labels.finished",     piece("complete", COMPUTER_STEPS_LOGIN.length - 1)),
    example("demonstration.labels.firstStep",    piece("running", 0)),
    example("demonstration.labels.withoutSteps", piece("idle", 0, [])),
  ];

  /**
   * A moldura e o quadro, à mão — sem a legenda, e com o rastro que a story do
   * contraexemplo precisar.
   *
   * Os dois contraexemplos são montados À MÃO, e têm de ser: a peça sempre
   * desenha a legenda quando há passo, e nunca desenha mais de três marcas —
   * então não há propriedade que produza o erro.
   */
  const wrongFrame = (marks: ReactNode, caption?: ReactNode) => (
    <figure
      className="nds-computer-use"
      data-slot="computer-use"
      data-status="running"
      aria-busy
    >
      <p className="nds-computer-use-address nds-font-mono" data-slot="computer-use-address">
        <span className="nds-sr-only">{labels.address}</span>
        <span
          className="nds-computer-use-url nds-truncate"
          data-slot="computer-use-url"
          lang="en"
        >
          {COMPUTER_URL}
        </span>
      </p>
      <div className="nds-computer-use-screen" data-slot="computer-use-screen">
        <div className="nds-computer-use-surface" data-slot="computer-use-surface">
          <DemoScreen />
        </div>
        <span
          className="nds-computer-use-trail"
          data-slot="computer-use-trail"
          aria-hidden="true"
        >
          {marks}
        </span>
      </div>
      {caption}
    </figure>
  );

  /** Uma marca no ponto que o passo diz, como a peça a desenha. */
  const wrongMark = (step: ComputerStep, active: boolean) => (
    <span
      key={step.id ?? `${step.x}-${step.y}`}
      className="nds-computer-use-mark"
      data-slot="computer-use-mark"
      data-active={active ? "true" : undefined}
      // Propriedade personalizada, e não valor de desenho: é o mesmo caminho
      // pelo qual a peça posiciona as marcas dela.
      style={
        {
          "--computer-use-mark-x": step.x,
          "--computer-use-mark-y": step.y,
        } as CSSProperties
      }
    />
  );

  // O primeiro contraexemplo: a legenda é removida, e sobra a marca sobre a
  // imagem — que é exatamente o que não chega a quem não vê.
  const withoutCaption = wrongFrame(
    COMPUTER_STEPS_LOGIN.slice(1, 4).map((step, i) => wrongMark(step, i === 2)),
  );

  // O segundo: a sessão inteira marcada de uma vez. O rastro deixa de mostrar um
  // caminho e passa a cobrir a tela que ele deveria estar apontando.
  const everyMark = wrongFrame(
    COMPUTER_STEPS_LOGIN.map((step, i) => wrongMark(step, i === COMPUTER_STEPS_LOGIN.length - 1)),
    <figcaption className="nds-computer-use-caption" data-slot="computer-use-caption">
      <span className="nds-computer-use-action" data-slot="computer-use-action">
        {COMPUTER_STEPS_LOGIN[COMPUTER_STEPS_LOGIN.length - 1]!.action}
      </span>
      <span
        className="nds-computer-use-target nds-truncate"
        data-slot="computer-use-target"
      >
        {COMPUTER_STEPS_LOGIN[COMPUTER_STEPS_LOGIN.length - 1]!.target}
      </span>
      <span className="nds-computer-use-position" data-slot="computer-use-position">
        {labels.position
          .replace("{index}", String(COMPUTER_STEPS_LOGIN.length))
          .replace("{total}", String(COMPUTER_STEPS_LOGIN.length))}
      </span>
    </figcaption>,
  );

  const propsCols = {
    prop: tContent("props.table.prop"),
    type: tContent("props.table.type"),
    default: tContent("props.table.default"),
    required: tContent("props.table.required"),
    description: tContent("props.table.description"),
  };

  const rows = (keys: string[]) =>
    keys.map((k) => ({
      name: tContent(`props.table.${k}.name`),
      type: tContent(`props.table.${k}.type`),
      defaultValue: tContent(`props.table.${k}.default`),
      required: tContent(`props.table.${k}.required`),
      description: toPlainText(tContent(`props.table.${k}.description`)),
    }));

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration
        title={tContent("demonstration.title")}
        componentSlug="computer-use"
      >
        <div className="nds-stack nds-w-full" data-spacing="lg">
          {examples.map((el, i) => (
            <Fragment key={i}>
              {i > 0 && <Separator />}
              {el}
            </Fragment>
          ))}
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={[1, 2, 3, 4, 5].map((i) => tContent(`anatomy.item${i}`))}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
        language="html"
      />

      {/* ── Quando Usar ───────────────────────────────────────────── */}
      <DocsWhenToUse
        title={tContent("usage.title")}
        guidelines={{
          title: tContent("usage.guidelines.title"),
          items: [1, 2, 3, 4, 5].map((i) => tContent(`usage.guidelines.item${i}`)),
        }}
        scenarios={{
          title: tContent("usage.scenarios.title"),
          cols: {
            scenario: tContent("usage.scenarios.cols.scenario"),
            use: tContent("usage.scenarios.cols.use"),
            alternative: tContent("usage.scenarios.cols.alternative"),
          },
          items: [1, 2, 3, 4, 5].map((i) => ({
            s: tContent(`usage.scenarios.item${i}.s`),
            u: tContent(`usage.scenarios.item${i}.u`),
            a: toPlainText(tContent(`usage.scenarios.item${i}.a`)),
          })),
        }}
        uxWriting={{
          title: tContent("usage.uxWriting.title"),
          cols: {
            element: tContent("usage.uxWriting.table.element"),
            rules: tContent("usage.uxWriting.table.rules"),
            do: tContent("usage.uxWriting.table.correct"),
            dont: tContent("usage.uxWriting.table.avoid"),
          },
          items: ["address", "action", "target", "position"].map((k) => ({
            element: tContent(`usage.uxWriting.table.${k}.name`),
            rules: tContent(`usage.uxWriting.table.${k}.format`),
            do: tContent(`usage.uxWriting.table.${k}.good`),
            dont: tContent(`usage.uxWriting.table.${k}.bad`),
          })),
        }}
        do={{
          title: tContent("usage.do.title"),
          items: [1, 2, 3, 4].map((i) => tContent(`usage.do.item${i}`)),
        }}
        dont={{
          title: tContent("usage.dont.title"),
          items: [1, 2, 3, 4].map((i) => tContent(`usage.dont.item${i}`)),
        }}
      />

      {/* ── Do & Don't ────────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
            doPreview: stackOf(piece("running", 3)),
            dontPreview: stackOf(withoutCaption),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
            doPreview: stackOf(piece("running", 5)),
            dontPreview: stackOf(everyMark),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={tContent("import.basicCode")}
        secondaryDescription={tContent("import.withLabels")}
        secondaryCode={tContent("import.withLabelsCode")}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: tContent("states.cols.trigger"),
          behavior: tContent("states.cols.behavior"),
        }}
        // A ordem sai de `RUN_STATUSES`: a tabela e a story de estados leem a
        // mesma lista, e nenhuma das duas fica para trás quando o tipo cresce.
        items={RUN_STATUSES.map((k) => ({
          label: tContent(`states.${k}.label`),
          trigger: toPlainText(tContent(`states.${k}.trigger`)),
          behavior: toPlainText(tContent(`states.${k}.behavior`)),
        }))}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: "ComputerUse",
            cols: propsCols,
            items: rows(["url", "screen", "steps", "activeIndex", "status", "labels"]),
          },
          {
            title: "ComputerUseLabels",
            cols: propsCols,
            items: rows(["labelsAddress", "labelsPosition"]),
          },
          {
            title: "ComputerStep",
            cols: propsCols,
            items: rows(["stepAction", "stepTarget", "stepX", "stepY"]),
          },
        ]}
        interfaceCode={INTERFACE_CODE}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={stripHtml(tContent("props.extensibility"))}
        extensibilityCode={tContent("props.extensibilityCode")}
      />

      {/* ── Tokens ────────────────────────────────────────────────── */}
      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.value"),
          description: tContent("tokens.table.description"),
        }}
        items={[
          "textLabel", "spacing1", "spacing2", "spacing3", "muted", "border",
          "radius", "radiusSm", "radiusFull", "mutedForeground", "foreground",
          "background", "primary", "fontWeightMedium", "durationStately", "easeStandard",
        ].map((k) => ({
          token: tContent(`tokens.table.${k}.token`),
          value: tContent(`tokens.table.${k}.value`),
          description: toPlainText(tContent(`tokens.table.${k}.description`)),
        }))}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
        language="css"
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[1, 2, 3, 4, 5, 6, 7, 8].map((i) => tContent(`accessibility.items.item${i}`))}
        keyboardTitle={tContent("accessibility.keyboard.title")}
        keyboardItems={[
          { key: "Tab",   description: tContent("accessibility.keyboard.tab") },
          { key: "Enter", description: tContent("accessibility.keyboard.enter") },
          { key: "↑ ↓",   description: tContent("accessibility.keyboard.arrows") },
        ]}
        screenReaderTitle={tContent("accessibility.screenReader.title")}
        screenReaderItems={screenReaderItems}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          { name: tContent("related.items.agentStatus.name"),   description: toPlainText(tContent("related.items.agentStatus.description")),   path: "?path=/docs/components-conversational-agentstatus--docs"   },
          { name: tContent("related.items.toolGroup.name"),     description: toPlainText(tContent("related.items.toolGroup.description")),     path: "?path=/docs/components-conversational-toolgroup--docs"     },
          { name: tContent("related.items.terminalBlock.name"), description: toPlainText(tContent("related.items.terminalBlock.description")), path: "?path=/docs/components-conversational-terminalblock--docs" },
          { name: tContent("related.items.agentPlan.name"),     description: toPlainText(tContent("related.items.agentPlan.description")),     path: "?path=/docs/components-conversational-agentplan--docs"     },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="computer-use"
        items={[1, 2, 3, 4, 5, 6, 7].map((i) => ({ title: "", content: tContent(`notes.item${i}`) }))}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: tContent("analytics.table.trigger"),
          payload: tContent("analytics.table.payload"),
        }}
        items={["pageView", "sectionViewed", "demoClick"].map((k) => ({
          event: tContent(`analytics.table.${k}`),
          trigger: toPlainText(tContent(`analytics.table.${k}Trigger`)),
          payload: tContent(`analytics.table.${k}Payload`),
        }))}
      />

      {/* ── Testes ────────────────────────────────────────────────── */}
      <DocsTestes
        title={tContent("testes.title")}
        functional={{
          title: tContent("testes.functional.title"),
          description: tContent("testes.functional.description"),
          cols: {
            action: tNav("common.userAction"),
            result: tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => ({
            action: toPlainText(tContent(`testes.functional.item${i}.action`)),
            result: toPlainText(tContent(`testes.functional.item${i}.result`)),
            priority: priorityLabel(tContent(`testes.functional.item${i}.priority`)),
          })),
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          description: tContent("testes.accessibility.description"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          // A lista é PLANA: cada item é um critério, e o "como verificar" é o
          // próprio addon-a11y rodando em toda story.
          items: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
            criterion: toPlainText(tContent(`testes.accessibility.item${i}`)),
            level: "AA",
            how: "—",
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          description: tContent("testes.visual.description"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
            story: toPlainText(tContent(`testes.visual.item${i}.story`)),
            priority: priorityLabel(tContent(`testes.visual.item${i}.priority`)),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
