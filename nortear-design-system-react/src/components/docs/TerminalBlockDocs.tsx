import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  type ReactNode,
} from "react";
import { TerminalBlock, type TerminalBlockLabels } from "@/components/ui/terminal-block";
import { Separator } from "@/components/ui/separator";
import {
  exitCodeFor,
  linesFor,
  useTerminalBlockLabels,
} from "@/components/ui/terminal-block.fixtures";
import { RUN_STATUSES, type RunStatus } from "@shared/primitives/chat-protocol";
import { TERMINAL_COMMAND } from "@shared/primitives/terminal-block-examples";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import terminalTranslations from "@shared/content/terminal-block/translations.json";

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

const INTERFACE_CODE = `export interface TerminalBlockLabels {
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

// ─── Componente principal ─────────────────────────────────────────────────────

export function TerminalBlockDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(terminalTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (terminalTranslations as unknown as Record<
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
  const labels = useTerminalBlockLabels();

  // O id do contraexemplo é por INSTÂNCIA, como no primitivo: `aria-labelledby`
  // resolve para o PRIMEIRO id do documento, e esta página desenha vários
  // blocos com o mesmo comando.
  const wrongCommandId = `nds-terminal-block-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}-command`;

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups],
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "terminal-block",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "terminal-block",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "terminal-block",
        locale,
      });
    },
    [locale],
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  const priorityLabel = (raw: string) => tNav(priorityKeyMap[raw] ?? "common.high");

  /**
   * Um bloco de terminal, sem repetir o comando e os rótulos em cada chamada.
   *
   * A saída de exemplo ACOMPANHA o estado, e é o vocabulário compartilhado que
   * decide o resto: se há cursor, se a peça se declara ocupada e se o código de
   * saída já existe.
   */
  const piece = (
    status: RunStatus,
    lines: readonly string[] = linesFor(status),
    custom: TerminalBlockLabels = labels,
  ) => (
    <TerminalBlock
      command={TERMINAL_COMMAND}
      lines={lines}
      status={status}
      exitCode={exitCodeFor(status)}
      labels={custom}
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
   * Um bloco de terminal, rotulado.
   *
   * A legenda diz QUAL caso está desenhado — sem ela, quatro blocos empilhados
   * viram um só, e o assunto da demonstração é justamente a diferença entre
   * eles.
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
    example("demonstration.labels.running",       piece("running")),
    example("demonstration.labels.complete",      piece("complete")),
    example("demonstration.labels.failed",        piece("failed")),
    example("demonstration.labels.withoutOutput", piece("complete", [])),
  ];

  // O contraexemplo do primeiro par é montado À MÃO, e tem de ser: a peça
  // preserva o espaçamento por construção, então não há propriedade que produza
  // o erro. Aqui a caixa passa a quebrar a linha, e a tabela que alinhava os
  // números vira um parágrafo.
  const wrapped = (
    <div className="nds-terminal-block" data-slot="terminal-block" data-status="complete">
      <p className="nds-terminal-block-command nds-font-mono" data-slot="terminal-block-command">
        <span
          className="nds-terminal-block-sigil"
          data-slot="terminal-block-sigil"
          aria-hidden="true"
        >
          $
        </span>
        <code
          className="nds-terminal-block-command-text"
          data-slot="terminal-block-command-text"
          id={wrongCommandId}
          lang="en"
        >
          {TERMINAL_COMMAND}
        </code>
      </p>
      <pre
        className="nds-terminal-block-output nds-font-mono"
        data-slot="terminal-block-output"
        lang="en"
        tabIndex={0}
        role="group"
        aria-labelledby={wrongCommandId}
        // Mecânico, e não valor de desenho: o que se está mostrando é o efeito
        // de trocar o modo de quebra, e ele não tem token.
        style={{ whiteSpace: "pre-wrap", overflowX: "hidden" }}
      >
        {linesFor("complete").join("\n")}
      </pre>
      <p className="nds-terminal-block-result" data-slot="terminal-block-result">
        <span
          className="nds-terminal-block-dot"
          data-slot="terminal-block-dot"
          aria-hidden="true"
        />
        <span className="nds-terminal-block-status" data-slot="terminal-block-status">
          {labels.status.complete}
        </span>
        <span className="nds-terminal-block-exit" data-slot="terminal-block-exit">
          {labels.exitCode.replace("{code}", "0")}
        </span>
      </p>
    </div>
  );

  // O contraexemplo do segundo par: as palavras apagadas, e a diferença entre o
  // que terminou e o que quebrou passa a existir só na cor do ponto.
  const mute: TerminalBlockLabels = {
    ...labels,
    status: RUN_STATUSES.reduce((acc, status) => {
      acc[status] = "";
      return acc;
    }, {} as Record<RunStatus, string>),
  };

  const propsCols = {
    prop: tContent("props.table.prop"),
    type: tContent("props.table.type"),
    default: tContent("props.table.default"),
    required: tContent("props.table.required"),
    description: tContent("props.table.description"),
  };

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
        componentSlug="terminal-block"
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
          items: ["command", "output", "status", "exitCode"].map((k) => ({
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
            doPreview: stackOf(piece("complete")),
            dontPreview: stackOf(wrapped),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
            // O par é o MESMO par de estados, e os dois pontos são o que se vê:
            // o que muda é se a palavra chega a quem não distingue verde de
            // vermelho.
            doPreview: stackOf(piece("complete"), piece("failed")),
            dontPreview: stackOf(
              piece("complete", linesFor("complete"), mute),
              piece("failed", linesFor("failed"), mute),
            ),
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
            title: "TerminalBlock",
            cols: propsCols,
            items: ["command", "lines", "status", "exitCode", "labels"].map((k) => ({
              name: tContent(`props.table.${k}.name`),
              type: tContent(`props.table.${k}.type`),
              defaultValue: tContent(`props.table.${k}.default`),
              required: tContent(`props.table.${k}.required`),
              description: toPlainText(tContent(`props.table.${k}.description`)),
            })),
          },
          {
            title: "TerminalBlockLabels",
            cols: propsCols,
            items: ["labelsStatus", "labelsExitCode"].map((k) => ({
              name: tContent(`props.table.${k}.name`),
              type: tContent(`props.table.${k}.type`),
              defaultValue: tContent(`props.table.${k}.default`),
              required: tContent(`props.table.${k}.required`),
              description: toPlainText(tContent(`props.table.${k}.description`)),
            })),
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
          "textLabel", "spacing2", "spacing3", "muted", "border", "radius", "radiusSm",
          "mutedForeground", "foreground", "fontWeightMedium", "ring", "durationStately",
          "primary", "success", "destructive",
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
          { name: tContent("related.items.codeBlock.name"),   description: toPlainText(tContent("related.items.codeBlock.description")),   path: "?path=/docs/primitives-display-codeblock--docs"           },
          { name: tContent("related.items.agentStatus.name"), description: toPlainText(tContent("related.items.agentStatus.description")), path: "?path=/docs/primitives-conversational-agentstatus--docs" },
          { name: tContent("related.items.toolGroup.name"),   description: toPlainText(tContent("related.items.toolGroup.description")),   path: "?path=/docs/primitives-conversational-toolgroup--docs"   },
          { name: tContent("related.items.jobProgress.name"), description: toPlainText(tContent("related.items.jobProgress.description")), path: "?path=/docs/primitives-conversational-jobprogress--docs" },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="terminal-block"
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
