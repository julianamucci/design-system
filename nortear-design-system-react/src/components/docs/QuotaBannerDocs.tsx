import { Fragment, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { QuotaBanner } from "@/components/ui/quota-banner";
import { Separator } from "@/components/ui/separator";
import {
  quotaBannerAction,
  quotaOf,
  renewalOf,
  useQuotaBannerLabels,
  type QuotaBannerCase,
} from "@/components/ui/quota-banner.fixtures";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import quotaTranslations from "@shared/content/quota-banner/translations.json";

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

const SLUG = "quota-banner";

// ─── Nav ─────────────────────────────────────────────────────────────────────
//
// Não há grupo de variantes: esta peça tem uma forma só. O que muda entre as
// fotos é o que a conta devolve — o nível, a cota esgotada, a ausência do
// horizonte —, e nada disso é uma forma escolhida por quem monta.

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

const INTERFACE_CODE = `export interface QuotaBannerProps {
  quota: QuotaAllowance;      // o uso e o teto
  renewsIn?: string;          // quando renova, JÁ ESCRITO; ausente é "não renova"
  actions?: ReactNode;        // os controles, prontos de quem consome
  labels: QuotaBannerLabels;
}

// O teto é OBRIGATÓRIO aqui, ao contrário das medições irmãs: a cota É o teto,
// e "quanto ainda resta" não tem resposta sem ele. Quem não tem teto não monta
// a faixa.
export interface QuotaAllowance {
  used: number;               // quanto já foi usado
  limit: number;              // o teto da cota
}

export interface QuotaBannerLabels {
  title: string;                      // de qual cota se trata; só para quem ouve
  unit: string;                       // o que está sendo contado
  left: string;                       // a palavra que acompanha o resto
  exhausted: string;                  // o que dizer quando não sobra nada
  renews: string;                     // a palavra que antecede o horizonte
  of: string;                         // liga o usado ao teto na razão
  level: Record<BudgetLevel, string>; // a palavra de cada nível
}

// A conta vem de \`@shared/primitives/token-budget\`, e é a MESMA que as outras
// medições leem — é isso que faz a palavra do nível querer dizer o mesmo em
// todas elas:
//   remainingUnits(uso, teto)    // o resto, nunca negativo
//   spentFraction(uso, teto)     // de 0 a 1, ou \`null\` quando o teto não é teto
//   fractionLevel(fracao)        // 'normal' | 'warning' | 'critical'
//   fractionPercent(fracao)      // inteiro travado nas duas pontas`;

// ─── Componente principal ─────────────────────────────────────────────────────

export function QuotaBannerDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  // A ÚNICA linha sobrescrita é o TIPO de `actions`, e por um motivo de API: o
  // conteúdo compartilhado descreve o tipo na API do Vanilla, onde os controles
  // chegam como lista de elementos do documento. Aqui eles chegam como nó, e o
  // que se passa é qualquer coisa que o renderizador saiba desenhar. O nome da
  // prop é o mesmo nas duas, então só o tipo diverge — mesma divergência que o
  // cartão de autorização já registrou para os controles da resposta.
  const { t: tContent, locale } = useTranslation(quotaTranslations, {
    "*": { "props.table.actions.type": "ReactNode" },
  });

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (quotaTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      )
        .filter(([key]) => key !== "title")
        .map(([, value]) => value),
    [locale],
  );

  // O hook, e não a função pura: é ele que subscreve a loja e faz os blocos
  // desta página se redesenharem quando o idioma muda. A função pura serve à
  // `play`, onde não há componente para pendurar um hook.
  const labels = useQuotaBannerLabels();

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups],
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: SLUG,
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: SLUG,
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: SLUG,
        locale,
      });
    },
    [locale],
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  const priorityLabel = (raw: string) => tNav(priorityKeyMap[raw] ?? "common.high");

  /**
   * A faixa daquele exemplo, com o horizonte já escrito quando ele existe.
   *
   * O controle entra só onde ele muda alguma coisa — a cota esgotada —, e é de
   * propósito: repeti-lo nas quatro faria a demonstração parecer que a faixa
   * nasce com um botão, quando o botão é de quem a monta.
   */
  const banner = (name: QuotaBannerCase, actions?: ReactNode) => (
    <QuotaBanner
      quota={quotaOf(name)}
      renewsIn={renewalOf(name)}
      actions={actions}
      labels={labels}
    />
  );

  /**
   * Uma faixa, rotulada.
   *
   * A legenda diz QUAL exemplo está desenhado — sem ela, quatro caixas
   * empilhadas viram uma só, e o assunto da demonstração é justamente a
   * diferença entre elas.
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
    example("demonstration.labels.normal",    banner("normal")),
    example("demonstration.labels.threshold", banner("threshold")),
    example("demonstration.labels.exhausted", banner("exhausted", [quotaBannerAction()])),
    example("demonstration.labels.noRenewal", banner("noRenewal")),
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
      <DocsDemonstration title={tContent("demonstration.title")} componentSlug={SLUG}>
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
        items={[1, 2, 3, 4, 5, 6].map((i) => tContent(`anatomy.item${i}`))}
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
          items: ["title", "unit", "left", "exhausted"].map((k) => ({
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
            // O MESMO uso nos dois lados: o que muda é o horizonte chegar.
            doPreview: banner("warning"),
            // O contraexemplo: a cota renova, mas o horizonte não é passado. A
            // faixa só pode dizer que está no fim, e esperar vira aposta — sem
            // que nada pareça errado na tela.
            dontPreview: <QuotaBanner quota={quotaOf("warning")} labels={labels} />,
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
            doPreview: banner("warning"),
            // O contraexemplo: o horizonte escrito à mão. Ponto decimal,
            // unidade por extenso e nenhuma das duas trocando com o idioma de
            // quem lê — que é exatamente o que a peça não tem como consertar.
            dontPreview: (
              <QuotaBanner
                quota={quotaOf("warning")}
                renewsIn="3.2 hours"
                labels={labels}
              />
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
        // Nenhum destes é um estado que a peça guarda: são as cinco respostas
        // que a mesma faixa dá conforme o que a conta devolve.
        items={["normal", "warning", "critical", "exhausted", "noRenewal"].map((k) => ({
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
            title: "QuotaBanner",
            cols: propsCols,
            items: propsRows(["quota", "renewsIn", "actions", "labels"]),
          },
          {
            title: "QuotaAllowance",
            cols: propsCols,
            items: propsRows(["quotaUsed", "quotaLimit"]),
          },
          {
            title: "QuotaBannerLabels",
            cols: propsCols,
            items: propsRows([
              "labelsTitle", "labelsUnit", "labelsLeft", "labelsExhausted",
              "labelsRenews", "labelsOf", "labelsLevel",
            ]),
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
          "textLabel", "mutedForeground", "foreground", "fontWeightMedium",
          "primary", "warning", "destructive", "muted",
          "spacing2", "spacing3", "spacing6", "radius", "radiusFull",
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
        items={[1, 2, 3, 4, 5, 6, 7].map((i) => tContent(`accessibility.items.item${i}`))}
        keyboardTitle={tContent("accessibility.keyboard.title")}
        // Duas linhas, e as duas são honestas: a faixa em si não tem controle,
        // mas os controles que chegam de fora entram na ordem de foco — e é aí
        // que o teclado tem o que fazer.
        keyboardItems={[
          { key: "Tab", description: tContent("accessibility.keyboard.tab") },
          { key: "Enter", description: tContent("accessibility.keyboard.enter") },
        ]}
        screenReaderTitle={tContent("accessibility.screenReader.title")}
        screenReaderItems={screenReaderItems}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          { name: tContent("related.items.contextDisplay.name"), description: toPlainText(tContent("related.items.contextDisplay.description")), path: "?path=/docs/components-conversational-contextdisplay--docs" },
          { name: tContent("related.items.costMeter.name"),      description: toPlainText(tContent("related.items.costMeter.description")),      path: "?path=/docs/components-conversational-costmeter--docs" },
          { name: tContent("related.items.alert.name"),          description: toPlainText(tContent("related.items.alert.description")),          path: "?path=/docs/components-feedback-alert--docs" },
          { name: tContent("related.items.progress.name"),       description: toPlainText(tContent("related.items.progress.description")),       path: "?path=/docs/components-feedback-progress--docs" },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug={SLUG}
        items={[1, 2, 3, 4, 5, 6, 7].map((i) => ({
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
          items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
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
          items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
            story: toPlainText(tContent(`testes.visual.item${i}.story`)),
            priority: priorityLabel(tContent(`testes.visual.item${i}.priority`)),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
