import { Fragment, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { InlineCitation } from "@/components/ui/inline-citation";
import { Separator } from "@/components/ui/separator";
import {
  citationOf,
  sentenceCitations,
  sentenceParts,
  useInlineCitationLabels,
  type InlineCitationCase,
} from "@/components/ui/inline-citation.fixtures";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import inlineCitationTranslations from "@shared/content/inline-citation/translations.json";

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

const INTERFACE_CODE = `export interface InlineCitationProps {
  citation: Citation;                    // a fonte, o trecho e onde dentro dela
  index: number;                         // o número que a marca mostra
  defaultOpen?: boolean;                 // nasce com a prévia aberta
  onOpenChange?: (open: boolean) => void;
  labels: InlineCitationLabels;
}

// O VOCABULÁRIO NÃO É DAQUI. \`Citation\` e \`ChatSource\` vêm de
// \`@shared/primitives/chat-protocol\`, e é lá que está escrito por que o trecho
// mora na CITAÇÃO e não na fonte: a mesma fonte apoia afirmações diferentes.
export interface Citation {
  source: ChatSource;         // o documento
  excerpt?: string;           // o texto citado, como saiu da fonte
  anchor?: string;            // onde dentro dele — página, âncora, linhas
}

export interface InlineCitationLabels {
  marker: string;             // o nome acessível, já escrito, com o número dentro
  unsafeSource: string;       // o que se diz no lugar de um endereço recusado
}

// A MARCA É CONTROLÁVEL POR COMANDO, e o comando é o que resolve a exclusão
// mútua entre duas prévias — a peça não conhece as vizinhas, e não conhecê-las
// é o que permite que duas marcas da mesma frase venham de lugares diferentes.
export type InlineCitationHandle = {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
};`;

// ─── Exemplos ────────────────────────────────────────────────────────────────

/**
 * Uma frase com uma marca, que é a única forma em que esta peça existe.
 *
 * A frase é montada AQUI, e não pelo componente: é a demonstração do contrato —
 * quem escreve a frase decide onde a afirmação precisa de apoio. Nenhum pedaço
 * termina em espaço, e é isso que mantém a marca colada à palavra na quebra de
 * linha.
 */
function CitationSentence({ name, open = false }: { name: InlineCitationCase; open?: boolean }) {
  const labelsOf = useInlineCitationLabels();
  const parts = sentenceParts();
  const citation = citationOf(name);

  return (
    <p>
      {parts[0]}
      <InlineCitation
        citation={citation}
        index={1}
        defaultOpen={open}
        labels={labelsOf(1, citation)}
      />
      {parts[1] + parts[2]}
    </p>
  );
}

/** A frase com as DUAS marcas, cada uma com a própria numeração. */
function SentenceWithTwo() {
  const labelsOf = useInlineCitationLabels();
  const parts = sentenceParts();
  const citations = sentenceCitations();

  return (
    <p>
      {parts[0]}
      {citations.map((citation, i) => (
        <Fragment key={i}>
          <InlineCitation
            citation={citation}
            index={i + 1}
            labels={labelsOf(i + 1, citation)}
          />
          {parts[i + 1]}
        </Fragment>
      ))}
    </p>
  );
}

/**
 * O contraexemplo: o nome acessível é o número.
 *
 * Quem vê não nota diferença nenhuma, e é esse o ponto — "1" não descreve fonte
 * nenhuma para quem ouve.
 */
function NumberNamedSentence({ unsafeSource }: { unsafeSource: string }) {
  const parts = sentenceParts();
  const citation = citationOf("full");

  return (
    <p>
      {parts[0]}
      <InlineCitation
        citation={citation}
        index={1}
        labels={{ marker: "1", unsafeSource }}
      />
      {parts[1] + parts[2]}
    </p>
  );
}

/**
 * O contraexemplo: um traço no lugar do trecho que não veio.
 *
 * A prévia passa a afirmar que existe um trecho vazio, que é pior do que não
 * dizer nada.
 */
function DashedSentence() {
  const labelsOf = useInlineCitationLabels();
  const parts = sentenceParts();
  const plain = citationOf("minimal");

  return (
    <p>
      {parts[0]}
      <InlineCitation
        citation={{ source: plain.source, excerpt: "—", anchor: "—" }}
        index={1}
        defaultOpen
        labels={labelsOf(1, plain)}
      />
      {parts[1] + parts[2]}
    </p>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function InlineCitationDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(inlineCitationTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (inlineCitationTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      )
        .filter(([key]) => key !== "title")
        .map(([, value]) => value),
    [locale],
  );

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups],
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "inline-citation",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "inline-citation",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "inline-citation",
        locale,
      });
    },
    [locale],
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  const priorityLabel = (raw: string) => tNav(priorityKeyMap[raw] ?? "common.high");

  /**
   * Uma frase, rotulada.
   *
   * A legenda diz QUAL exemplo está desenhado — sem ela, quatro frases quase
   * iguais viram uma só, e o assunto da demonstração é justamente a diferença
   * entre elas.
   *
   * `reserve` dá altura ao exemplo cuja prévia nasce aberta: a caixa é
   * posicionada fora do fluxo, então sem folga ela cobriria a legenda do
   * exemplo seguinte.
   */
  const example = (labelKey: string, node: ReactNode, reserve = false) => (
    <div className="nds-stack nds-w-full" data-spacing="xs">
      <p className="nds-text-caption nds-text-muted-foreground">
        {stripHtml(tContent(labelKey))}
      </p>
      <div className={reserve ? "nds-min-h-50" : undefined}>{node}</div>
    </div>
  );

  const examples = [
    // O primeiro é o único fechado, e é ele que mostra a peça como ela vive:
    // duas marcas dentro de uma frase, à espera de quem lê.
    example("demonstration.labels.inSentence", <SentenceWithTwo />),
    example("demonstration.labels.open", <CitationSentence name="full" open />, true),
    example("demonstration.labels.minimal", <CitationSentence name="minimal" open />, true),
    example("demonstration.labels.unsafe", <CitationSentence name="unsafe" open />, true),
  ];

  const propsCols = {
    prop: tContent("props.table.prop"),
    type: tContent("props.table.type"),
    default: tContent("props.table.default"),
    required: tContent("props.table.required"),
    description: tContent("props.table.description"),
  };

  const propsRows = (keys: string[]) =>
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
        componentSlug="inline-citation"
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
          items: [1, 2, 3, 4, 5, 6].map((i) => tContent(`usage.guidelines.item${i}`)),
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
          items: ["marker", "unsafeSource", "sourceTitle", "anchor"].map((k) => ({
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
            // A MESMA citação nos dois lados: o que muda é o nome acessível.
            doPreview: <CitationSentence name="full" />,
            dontPreview: (
              <NumberNamedSentence unsafeSource={tContent("labels.unsafeSource")} />
            ),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
            doPreview: <CitationSentence name="minimal" open />,
            dontPreview: <DashedSentence />,
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
        // Só os dois primeiros são estados que a peça guarda — recolhida e
        // expandida. Os outros dois são o que a mesma prévia faz conforme o que
        // a citação trouxe.
        items={["closed", "open", "minimal", "unsafe"].map((k) => ({
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
            title: "InlineCitation",
            cols: propsCols,
            items: propsRows(["citation", "index", "defaultOpen", "onOpenChange", "labels"]),
          },
          {
            title: "Citation",
            cols: propsCols,
            items: propsRows(["citationSource", "citationExcerpt", "citationAnchor"]),
          },
          {
            title: "ChatSource",
            cols: propsCols,
            items: propsRows(["sourceTitle", "sourceUrl"]),
          },
          {
            title: "InlineCitationLabels",
            cols: propsCols,
            items: propsRows(["labelsMarker", "labelsUnsafeSource"]),
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
          "muted", "foreground", "primary", "primaryForeground", "ring",
          "sizeXs", "radiusSm", "textLabel",
          "textControlSm", "spacing2", "mutedForeground", "border",
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
          { key: "Tab",            description: tContent("accessibility.keyboard.tab") },
          { key: "Enter / Space",  description: tContent("accessibility.keyboard.enter") },
          { key: "Escape",         description: tContent("accessibility.keyboard.escape") },
        ]}
        screenReaderTitle={tContent("accessibility.screenReader.title")}
        screenReaderItems={screenReaderItems}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          { name: tContent("related.items.chatThread.name"), description: toPlainText(tContent("related.items.chatThread.description")), path: "?path=/docs/primitives-conversational-chatthread--docs" },
          { name: tContent("related.items.hoverCard.name"),  description: toPlainText(tContent("related.items.hoverCard.description")),  path: "?path=/docs/primitives-overlay-hovercard--docs"        },
          { name: tContent("related.items.popover.name"),    description: toPlainText(tContent("related.items.popover.description")),    path: "?path=/docs/primitives-overlay-popover--docs"          },
          { name: tContent("related.items.tooltip.name"),    description: toPlainText(tContent("related.items.tooltip.description")),    path: "?path=/docs/primitives-overlay-tooltip--docs"          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="inline-citation"
        items={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
          title: "",
          content: tContent(`notes.item${i}`),
        }))}
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
          items: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
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
          items: [1, 2, 3, 4, 5, 6].map((i) => ({
            story: toPlainText(tContent(`testes.visual.item${i}.story`)),
            priority: priorityLabel(tContent(`testes.visual.item${i}.priority`)),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
