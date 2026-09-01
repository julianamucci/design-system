import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import {
  stepperWithDescriptionsSource,
  stepperWizardSource,
} from "@/components/ui/stepper.source";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import stepperTranslations from "@shared/content/stepper/translations.json";

import { DocsHeader } from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout } from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy } from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse } from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont } from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport } from "@/components/docs/shared/sections/DocsImport";
import { DocsCompositions } from "@/components/docs/shared/sections/DocsCompositions";
import { DocsStates } from "@/components/docs/shared/sections/DocsStates";
import { DocsProps } from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens } from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated } from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes } from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics } from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes } from "@/components/docs/shared/sections/DocsTestes";
import { toPlainText } from "@/lib/strip-html";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SLUG = "stepper";
const TOTAL_STEPS = 4;

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

// ─── Nav ─────────────────────────────────────────────────────────────────────
//
// Sem "Variantes": o conteúdo compartilhado deste componente não tem
// `variants.items` — o Stepper tem uma forma só, e o que varia são os modos de
// uso, que moram em Composições.
const getNavGroups = (t: (key: string) => string) => [
  {
    label: t("nav.overview"),
    sections: [
      { id: "demonstracao", label: t("nav.demonstration") },
      { id: "anatomia", label: t("nav.anatomy") },
      { id: "quando-usar", label: t("nav.usage") },
      { id: "do-dont", label: t("nav.doDont") },
    ],
  },
  {
    label: t("nav.techRef"),
    sections: [
      { id: "importacao", label: t("nav.import") },
      { id: "composicoes", label: t("nav.compositions") },
      { id: "estados", label: t("nav.states") },
      { id: "propriedades", label: t("nav.props") },
      { id: "tokens", label: t("nav.tokens") },
    ],
  },
  {
    label: t("nav.context"),
    sections: [
      { id: "acessibilidade", label: t("nav.accessibility") },
      { id: "relacionados", label: t("nav.related") },
      { id: "notas", label: t("nav.notes") },
    ],
  },
  {
    label: t("nav.quality"),
    sections: [
      { id: "analytics", label: t("nav.analytics") },
      { id: "testes", label: t("nav.testes") },
    ],
  },
];

// ─── Componente principal ─────────────────────────────────────────────────────

export function StepperDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(stepperTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = useMemo(
    () =>
      Object.values(
        (stepperTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      ),
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
    componentSlug: SLUG,
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/navigation" },
      { name: tContent("title") },
    ],
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

  // O payload carrega só valor estável — número da etapa e total. O título é
  // traduzido, e mandá-lo dividiria um evento em três no GA4.
  const handleStepChange = useCallback((step: number) => {
    track("step_change", {
      component: SLUG,
      step,
      total: TOTAL_STEPS,
      location: "docs_demo",
    });
  }, []);

  // ─── Fixtures do fluxo demonstrado ──────────────────────────────────────────

  const stepLabels = useMemo(
    () => [
      { title: tContent("demonstration.labels.account"), hint: tContent("demonstration.labels.accountHint") },
      { title: tContent("demonstration.labels.address"), hint: tContent("demonstration.labels.addressHint") },
      { title: tContent("demonstration.labels.payment"), hint: tContent("demonstration.labels.paymentHint") },
      { title: tContent("demonstration.labels.review"), hint: tContent("demonstration.labels.reviewHint") },
    ],
    [tContent],
  );

  const stateLabels = useMemo(
    () => ({
      completed: tContent("demonstration.labels.completed"),
      current: tContent("demonstration.labels.current"),
    }),
    [tContent],
  );

  const flowLabel = tContent("demonstration.labels.flow");

  const [demoStep, setDemoStep] = useState(2);

  const goToStep = useCallback(
    (step: number) => {
      setDemoStep(step);
      handleStepChange(step);
    },
    [handleStepChange],
  );

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImport = `import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
} from "@/components/ui/stepper";`;

  // Os dois blocos das Composições saem das MESMAS transforms que o painel Code
  // do Storybook mostra. Escritos à mão aqui, a docs page e a story ensinariam
  // fluxos diferentes — e cada metade estaria certa sozinha.
  const codeWizard = stepperWizardSource();
  const codeWithDescriptions = stepperWithDescriptionsSource();

  const interfaceCode = `// Stepper (raiz)
interface StepperProps {
  value?: number;                                        // default 1
  "aria-label": string;                                  // OBRIGATÓRIO
  labels?: { completed?: string; current?: string };
  onStepSelect?: (step: number) => void;
  className?: string;
}

// StepperItem
interface StepperItemProps {
  step: number;                                          // OBRIGATÓRIO — conta de 1
  completed?: boolean;                                   // default false
  disabled?: boolean;                                    // default false
  className?: string;
}

// StepperTrigger, StepperIndicator, StepperTitle,
// StepperDescription, StepperSeparator
// — só className, além dos atributos nativos do elemento que cada um renderiza.
// O estado de cada peça vem do item por contexto: nada é passado à mão.`;

  // Props da raiz. `aria-label` e `className` são os nomes desta stack: o
  // conteúdo compartilhado descreve a opção de classe pelo nome neutro, e aqui
  // ela chega com o nome que o React usa.
  const propsRootItems = [
    { key: "value", name: "value" },
    { key: "ariaLabel", name: "aria-label" },
    { key: "labels", name: "labels" },
    { key: "onStepSelect", name: "onStepSelect" },
    { key: "class", name: "className" },
  ];

  const propsItemItems = [
    { key: "step", name: "step" },
    { key: "completed", name: "completed" },
    { key: "disabled", name: "disabled" },
    { key: "class", name: "className" },
  ];

  // Tokens — chave do conteúdo → token, conferidos contra a folha
  // `docs/shared/styles/nds/stepper.css`.
  const tokenItems = [
    { key: "gap", token: "--spacing-2" },
    { key: "itemGap", token: "--spacing-2" },
    { key: "triggerGap", token: "--spacing-1" },
    { key: "triggerRadius", token: "--radius-md" },
    { key: "ring", token: "--ring" },
    { key: "ringHalo", token: "--background" },
    { key: "indicatorSize", token: "--spacing-8" },
    { key: "indicatorRadius", token: "--radius-full" },
    { key: "indicatorBg", token: "--muted" },
    { key: "indicatorFg", token: "--muted-foreground" },
    { key: "activeBg", token: "--primary" },
    { key: "activeFg", token: "--primary-foreground" },
    { key: "completedBg", token: "--accent" },
    { key: "completedFg", token: "--accent-foreground" },
    { key: "titleSize", token: "--text-control-lg" },
    { key: "titleWeight", token: "--font-weight-semi-bold" },
    { key: "descriptionSize", token: "--text-control-sm" },
    { key: "descriptionColor", token: "--muted-foreground" },
    { key: "separator", token: "--border" },
    { key: "separatorLength", token: "--spacing-8" },
    { key: "separatorCompleted", token: "--accent" },
    { key: "separatorDisabled", token: "--muted" },
  ];

  // ─── Previews reutilizados ──────────────────────────────────────────────────

  /**
   * Trilha de quatro etapas, sem fiação — serve aos previews de Do & Don't e de
   * Composições. Os previews não recebem `onStepSelect`: quem seleciona etapa
   * na página é a Demonstração, e um evento disparado por preview inflaria o
   * relatório com cliques que ninguém deu no produto.
   */
  const stepperTrail = (options: {
    value: number;
    labels?: { completed?: string; current?: string };
    disabledFrom?: number;
    alwaysNumber?: boolean;
    withHints?: boolean;
  }) => (
    <Stepper
      value={options.value}
      aria-label={flowLabel}
      labels={options.labels}
      className="nds-w-full"
    >
      {stepLabels.map((stepLabel, i) => {
        const position = i + 1;
        return (
          <StepperItem
            key={stepLabel.title}
            step={position}
            disabled={
              options.disabledFrom !== undefined && position >= options.disabledFrom
                ? true
                : undefined
            }
          >
            <StepperTrigger>
              {/* `alwaysNumber` mantém o número mesmo na etapa concluída: é o
                  desenho que deixa a diferença só na cor, e é justamente o que
                  o par de Do & Don't existe para mostrar. */}
              {options.alwaysNumber ? (
                <StepperIndicator>{position}</StepperIndicator>
              ) : (
                <StepperIndicator />
              )}
              <StepperTitle>{stepLabel.title}</StepperTitle>
              {options.withHints && (
                <StepperDescription>{stepLabel.hint}</StepperDescription>
              )}
            </StepperTrigger>
            {i < stepLabels.length - 1 && <StepperSeparator />}
          </StepperItem>
        );
      })}
    </Stepper>
  );

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug={SLUG}
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
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="nds-stack nds-w-full" data-spacing="lg">
          <Stepper
            value={demoStep}
            aria-label={flowLabel}
            labels={stateLabels}
            onStepSelect={goToStep}
            className="nds-w-full"
          >
            {stepLabels.map((stepLabel, i) => (
              <StepperItem key={stepLabel.title} step={i + 1}>
                <StepperTrigger>
                  <StepperIndicator />
                  <StepperTitle>{stepLabel.title}</StepperTitle>
                  <StepperDescription>{stepLabel.hint}</StepperDescription>
                </StepperTrigger>
                {i < stepLabels.length - 1 && <StepperSeparator />}
              </StepperItem>
            ))}
          </Stepper>

          {/* Quem conta que o fluxo avançou é este painel, e não uma região
              viva: um indicador que se reanuncia a cada avanço atropelaria a
              leitura do resto da página. */}
          <div
            className="nds-stack nds-p-4 nds-rounded-md nds-border-default"
            data-spacing="sm"
          >
            <h3 className="nds-text-h3">{stepLabels[demoStep - 1].title}</h3>
            <p className="nds-text-body">{stepLabels[demoStep - 1].hint}</p>
          </div>

          <div className="nds-cluster" data-spacing="md">
            <Button
              variant="outline"
              disabled={demoStep === 1}
              onClick={() => goToStep(demoStep - 1)}
            >
              {tContent("demonstration.labels.back")}
            </Button>
            <Button
              disabled={demoStep === stepLabels.length}
              onClick={() => goToStep(demoStep + 1)}
            >
              {tContent("demonstration.labels.next")}
            </Button>
          </div>
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={[1, 2, 3, 4, 5, 6, 7].map((i) => tContent(`anatomy.item${i}`))}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
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
            a: tContent(`usage.scenarios.item${i}.a`),
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
          items: ["title", "description", "stateLabel", "flowName"].map((key) => ({
            element: tContent(`usage.uxWriting.table.${key}.name`),
            rules: tContent(`usage.uxWriting.table.${key}.format`),
            do: tContent(`usage.uxWriting.table.${key}.good`),
            dont: tContent(`usage.uxWriting.table.${key}.bad`),
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
            // Forma e palavra: a concluída troca o número pela marca de
            // verificação, e os rótulos levam o estado a quem não a vê.
            doPreview: stepperTrail({ value: 3, labels: stateLabels }),
            // Sem rótulos e com o número preservado na concluída: sobra a cor.
            dontPreview: stepperTrail({ value: 3, alwaysNumber: true }),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: stepperTrail({ value: 2, labels: stateLabels }),
            dontPreview: (
              <div className="nds-stack nds-w-full" data-spacing="sm">
                {/* Ilustração da forma errada, e ela NÃO é uma região viva de
                    verdade: uma live region com conteúdo estático se anuncia no
                    carregamento da página e atropela a leitura. O que o par
                    ensina está na legenda; o desenho só mostra o formato. */}
                <p className="nds-text-caption nds-text-muted-foreground">
                  {`${tContent("demonstration.labels.current")} — ${stepLabels[1].title}`}
                </p>
                {stepperTrail({ value: 2, labels: stateLabels })}
              </div>
            ),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            // As etapas que ainda não podem ser abertas saem da tabulação.
            doPreview: stepperTrail({ value: 2, labels: stateLabels, disabledFrom: 3 }),
            // Todas focáveis, inclusive as que não levam a lugar nenhum.
            dontPreview: stepperTrail({ value: 2, labels: stateLabels }),
            doCaption: toPlainText(tContent("doDont.pair3.do")),
            dontCaption: toPlainText(tContent("doDont.pair3.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        code={codeImport}
        componentSlug={SLUG}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.title")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug={SLUG}
        items={[
          {
            name: tContent("variants.compositions.wizard.name"),
            description: tContent("variants.compositions.wizard.description"),
            useWhen: tContent("variants.compositions.wizard.use"),
            // Chave estável de tracking: o `name` chega traduzido, e sem ela o
            // mesmo evento sairia com um valor por idioma no GA4.
            trackId: "wizard",
            code: codeWizard,
            preview: (
              <div className="nds-stack nds-w-full" data-spacing="lg">
                {stepperTrail({ value: 2, labels: stateLabels })}
                <div
                  className="nds-stack nds-p-4 nds-rounded-md nds-border-default"
                  data-spacing="sm"
                >
                  <h3 className="nds-text-h3">{stepLabels[1].title}</h3>
                  <p className="nds-text-body">{stepLabels[1].hint}</p>
                </div>
                <div className="nds-cluster" data-spacing="md">
                  <Button variant="outline">
                    {tContent("demonstration.labels.back")}
                  </Button>
                  <Button>{tContent("demonstration.labels.next")}</Button>
                </div>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.withDescriptions.name"),
            description: tContent(
              "variants.compositions.withDescriptions.description",
            ),
            useWhen: tContent("variants.compositions.withDescriptions.use"),
            trackId: "with-descriptions",
            code: codeWithDescriptions,
            preview: stepperTrail({ value: 2, labels: stateLabels, withHints: true }),
          },
        ]}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: toPlainText(tContent("states.cols.trigger")),
          behavior: toPlainText(tContent("states.cols.behavior")),
        }}
        items={["inactive", "active", "completed", "disabled"].map((key) => ({
          label: tContent(`states.${key}.label`),
          trigger: toPlainText(tContent(`states.${key}.trigger`)),
          behavior: toPlainText(tContent(`states.${key}.behavior`)),
        }))}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: "Stepper",
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: propsRootItems.map(({ key, name }) => ({
              name,
              type: tContent(`props.table.${key}.type`),
              defaultValue: tContent(`props.table.${key}.default`),
              required: tContent(`props.table.${key}.required`),
              description: toPlainText(tContent(`props.table.${key}.description`)),
            })),
          },
          {
            title: "StepperItem",
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: propsItemItems.map(({ key, name }) => ({
              name,
              type: tContent(`props.table.${key}.type`),
              defaultValue: tContent(`props.table.${key}.default`),
              required: tContent(`props.table.${key}.required`),
              description: toPlainText(tContent(`props.table.${key}.description`)),
            })),
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityCode={tContent("props.extensibilityCode")}
      />

      {/* ── Tokens ────────────────────────────────────────────────── */}
      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={tokenItems.map(({ key, token }) => ({
          token,
          value: tContent(`tokens.table.${key}.class`),
          description: tContent(`tokens.table.${key}.part`),
        }))}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[1, 2, 3, 4, 5, 6, 7].map((i) =>
          tContent(`accessibility.items.item${i}`),
        )}
        keyboardTitle={tContent("accessibility.keyboard.title")}
        keyboardItems={[
          { key: "Tab", description: tContent("accessibility.keyboard.tab") },
          {
            key: "Shift + Tab",
            description: tContent("accessibility.keyboard.shiftTab"),
          },
          { key: "Enter", description: tContent("accessibility.keyboard.enter") },
          { key: "Space", description: tContent("accessibility.keyboard.space") },
        ]}
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug={SLUG}
        items={[
          {
            name: tContent("related.items.tabs.name"),
            description: toPlainText(tContent("related.items.tabs.description")),
            path: "?path=/docs/primitives-navigation-tabs--docs",
          },
          {
            name: tContent("related.items.breadcrumb.name"),
            description: toPlainText(
              tContent("related.items.breadcrumb.description"),
            ),
            path: "?path=/docs/primitives-navigation-breadcrumb--docs",
          },
          {
            name: tContent("related.items.progress.name"),
            description: toPlainText(tContent("related.items.progress.description")),
            path: "?path=/docs/primitives-feedback-progress--docs",
          },
          {
            name: tContent("related.items.form.name"),
            description: toPlainText(tContent("related.items.form.description")),
            path: "?path=/docs/primitives-form-form--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug={SLUG}
        items={[1, 2, 3, 4, 5].map((i) => ({
          title: "",
          content: tContent(`notes.item${i}`),
        }))}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: "step_change",
            trigger: toPlainText(tContent("analytics.table.step_change.trigger")),
            payload: tContent("analytics.table.step_change.payload"),
          },
          {
            event: "docs_page_view",
            trigger: tNav("common.pageMount"),
            payload: `{ component_name: "${SLUG}", locale, page_title }`,
          },
          {
            event: "docs_section_viewed",
            trigger: toPlainText(
              tContent("analytics.table.docs_section_viewed.trigger"),
            ),
            payload: `{ component_name: "${SLUG}", section_id, locale }`,
          },
        ]}
      />

      {/* ── Testes ────────────────────────────────────────────────── */}
      <DocsTestes
        title={tContent("testes.title")}
        functional={{
          title: tContent("testes.functional.title"),
          cols: {
            action: tNav("common.userAction"),
            result: tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4].map((i) => ({
            action: toPlainText(tContent(`testes.functional.item${i}.action`)),
            result: toPlainText(tContent(`testes.functional.item${i}.result`)),
            priority: tNav(
              priorityKeyMap[tContent(`testes.functional.item${i}.priority`)] ??
                "common.high",
            ),
          })),
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          items: [1, 2, 3, 4, 5, 6].map((i) => ({
            criterion: toPlainText(tContent(`testes.accessibility.item${i}`)),
            level: "AA",
            how: "—",
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4].map((i) => ({
            story: tContent(`testes.visual.item${i}.story`),
            priority: tNav(
              priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ??
                "common.high",
            ),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
