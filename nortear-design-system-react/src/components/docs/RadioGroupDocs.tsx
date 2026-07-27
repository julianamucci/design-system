import { useCallback, useEffect, useMemo, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import DOMPurify from 'dompurify';
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import radioGroupTranslations from "@shared/content/radio-group/translations.json";

import { DocsHeader } from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout } from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy } from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse } from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont } from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport } from "@/components/docs/shared/sections/DocsImport";
import { DocsVariants } from "@/components/docs/shared/sections/DocsVariants";
import { DocsCompositions } from "@/components/docs/shared/sections/DocsCompositions";
import { DocsStates } from "@/components/docs/shared/sections/DocsStates";
import { DocsProps } from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens } from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated } from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes } from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics } from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes } from "@/components/docs/shared/sections/DocsTestes";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

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
      { id: "anatomia", label: t("nav.anatomy") },
      { id: "quando-usar", label: t("nav.usage") },
      { id: "do-dont", label: t("nav.doDont") },
    ],
  },
  {
    label: t("nav.techRef"),
    sections: [
      { id: "importacao", label: t("nav.import") },
      { id: "variantes", label: t("nav.variants") },
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


// ─── Componente principal ────────────────────────────────────────────────────

export function RadioGroupDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(radioGroupTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "radio-group",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/form" },
      { name: tContent("title") },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "radio-group",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "radio-group",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // Interactive demo state — não pré-seleciona
  const [paymentValue, setPaymentValue] = useState<string>("");
  const [deliveryValue, setDeliveryValue] = useState<string>("");
  const [descValue, setDescValue] = useState<string>("");
  const [formOutput, setFormOutput] = useState<string>("—");

  // ─── Code strings ───────────────────────────────────────────────────────

  const codeImport = `import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";`;

  const codeVertical = `<RadioGroup aria-label="Forma de pagamento">
  <div className="nds-cluster" data-spacing="xs">
    <RadioGroupItem value="cartao" id="v-cartao" />
    <Label htmlFor="v-cartao">Cartão de crédito</Label>
  </div>
  <div className="nds-cluster" data-spacing="xs">
    <RadioGroupItem value="pix" id="v-pix" />
    <Label htmlFor="v-pix">Pix</Label>
  </div>
  <div className="nds-cluster" data-spacing="xs">
    <RadioGroupItem value="boleto" id="v-boleto" />
    <Label htmlFor="v-boleto">Boleto bancário</Label>
  </div>
</RadioGroup>`;

  const codeHorizontal = `<RadioGroup className="nds-cluster" data-spacing="lg" aria-label="Forma de entrega">
  <div className="nds-cluster" data-spacing="xs">
    <RadioGroupItem value="padrao" id="h-padrao" />
    <Label htmlFor="h-padrao">Padrão</Label>
  </div>
  <div className="nds-cluster" data-spacing="xs">
    <RadioGroupItem value="expressa" id="h-expressa" />
    <Label htmlFor="h-expressa">Expressa</Label>
  </div>
  <div className="nds-cluster" data-spacing="xs">
    <RadioGroupItem value="retirar" id="h-retirar" />
    <Label htmlFor="h-retirar">Retirar</Label>
  </div>
</RadioGroup>`;

  const codeWithDescription = `<RadioGroup aria-label="Forma de entrega">
  <div className="nds-cluster" data-spacing="xs" data-align="start">
    <RadioGroupItem value="padrao" id="d-padrao" className="nds-mt-0-5" />
    <div className="nds-stack" data-spacing="xs">
      <Label htmlFor="d-padrao">Padrão</Label>
      <p className="nds-text-body">Entrega em até 5 dias úteis.</p>
    </div>
  </div>
  <div className="nds-cluster" data-spacing="xs" data-align="start">
    <RadioGroupItem value="expressa" id="d-expressa" className="nds-mt-0-5" />
    <div className="nds-stack" data-spacing="xs">
      <Label htmlFor="d-expressa">Expressa</Label>
      <p className="nds-text-body">Entrega em 1 dia útil.</p>
    </div>
  </div>
</RadioGroup>`;

  const interfaceCode = `// RadioGroup (@base-ui/react/radio-group)
interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

interface RadioGroupItemProps {
  value: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}`;

  // ─── Locale-aware column labels ─────────────────────────────────────────
  const stateCols = {
    state: locale === "en" ? "State" : "Estado",
    trigger: locale === "en" ? "Trigger" : locale === "es" ? "Disparo" : "Disparo",
    behavior:
      locale === "en" ? "Behavior" : locale === "es" ? "Comportamiento" : "Comportamento",
  };

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="radio-group"
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
        <div className="nds-grid nds-w-full" data-cols="2" data-spacing="lg">
          {/* Demo 1: vertical */}
          <div className="nds-stack" data-spacing="sm">
            <p className="nds-text-body nds-font-semibold">
              {tContent("demonstration.labels.groupLabel")}
            </p>
            <RadioGroup
              value={paymentValue}
              onValueChange={(value: string) => {
                track("radio_change", {
                  component: "radio_group",
                  name: "payment_method",
                  value,
                  previous_value: paymentValue || undefined,
                  location: "docs_demo",
                });
                setPaymentValue(value);
              }}
              aria-label={tContent("demonstration.labels.groupLabel")}
            >
              <div className="nds-cluster" data-spacing="xs">
                <RadioGroupItem value="cartao" id="demo-cartao" />
                <Label htmlFor="demo-cartao">
                  {tContent("demonstration.labels.card")}
                </Label>
              </div>
              <div className="nds-cluster" data-spacing="xs">
                <RadioGroupItem value="pix" id="demo-pix" />
                <Label htmlFor="demo-pix">
                  {tContent("demonstration.labels.pix")}
                </Label>
              </div>
              <div className="nds-cluster" data-spacing="xs">
                <RadioGroupItem value="boleto" id="demo-boleto" />
                <Label htmlFor="demo-boleto">
                  {tContent("demonstration.labels.boleto")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Demo 2: horizontal */}
          <div className="nds-stack" data-spacing="sm">
            <p className="nds-text-body nds-font-semibold">
              {tContent("demonstration.labels.deliveryLabel")}
            </p>
            <RadioGroup
              value={deliveryValue}
              onValueChange={(value: string) => {
                track("radio_change", {
                  component: "radio_group",
                  name: "delivery_method",
                  value,
                  previous_value: deliveryValue || undefined,
                  location: "docs_demo",
                });
                setDeliveryValue(value);
              }}
              style={{ gridAutoFlow: "column", gridAutoColumns: "max-content", gap: "1.5rem" }}
              aria-label={tContent("demonstration.labels.deliveryLabel")}
            >
              <div className="nds-cluster" data-spacing="xs">
                <RadioGroupItem value="standard" id="demo-standard" />
                <Label htmlFor="demo-standard">
                  {tContent("demonstration.labels.standard")}
                </Label>
              </div>
              <div className="nds-cluster" data-spacing="xs">
                <RadioGroupItem value="express" id="demo-express" />
                <Label htmlFor="demo-express">
                  {tContent("demonstration.labels.express")}
                </Label>
              </div>
              <div className="nds-cluster" data-spacing="xs">
                <RadioGroupItem value="pickup" id="demo-pickup" />
                <Label htmlFor="demo-pickup">
                  {tContent("demonstration.labels.pickup")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Demo 3: with description */}
          <div className="nds-stack" data-spacing="sm" style={{ gridColumn: '1 / -1' }}>
            <p className="nds-text-body nds-font-semibold">
              {tContent("demonstration.labels.deliveryLabel")}
            </p>
            <RadioGroup
              value={descValue}
              onValueChange={setDescValue}
              aria-label={tContent("demonstration.labels.deliveryLabel")}
            >
              <div className="nds-cluster" data-spacing="xs" data-align="start">
                <RadioGroupItem
                  value="standard"
                  id="demo-desc-standard"
                  className="nds-mt-0-5"
                />
                <div className="nds-stack" data-spacing="xs">
                  <Label htmlFor="demo-desc-standard">
                    {tContent("demonstration.labels.standard")}
                  </Label>
                  <p className="nds-text-body">
                    {locale === "en"
                      ? "Free shipping in 5 business days."
                      : locale === "es"
                      ? "Envío gratuito en 5 días hábiles."
                      : "Frete grátis em até 5 dias úteis."}
                  </p>
                </div>
              </div>
              <div className="nds-cluster" data-spacing="xs" data-align="start">
                <RadioGroupItem
                  value="express"
                  id="demo-desc-express"
                  className="nds-mt-0-5"
                />
                <div className="nds-stack" data-spacing="xs">
                  <Label htmlFor="demo-desc-express">
                    {tContent("demonstration.labels.express")}
                  </Label>
                  <p className="nds-text-body">
                    {locale === "en"
                      ? "Delivery in 1 business day."
                      : locale === "es"
                      ? "Entrega en 1 día hábil."
                      : "Entrega em 1 dia útil."}
                  </p>
                </div>
              </div>
              <div className="nds-cluster" data-spacing="xs" data-align="start">
                <RadioGroupItem
                  value="pickup"
                  id="demo-desc-pickup"
                  className="nds-mt-0-5"
                />
                <div className="nds-stack" data-spacing="xs">
                  <Label htmlFor="demo-desc-pickup">
                    {tContent("demonstration.labels.pickup")}
                  </Label>
                  <p className="nds-text-body">
                    {locale === "en"
                      ? "Available within 2 hours."
                      : locale === "es"
                      ? "Disponible en 2 horas."
                      : "Disponível em 2 horas."}
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={[
          tContent("anatomy.item1"),
          tContent("anatomy.item2"),
          tContent("anatomy.item3"),
          tContent("anatomy.item4"),
        ]}
        structureCode={tContent("anatomy.structureCode")}
        structureLabel={tContent("anatomy.structureLabel")}
      />

      {/* ── Quando Usar ───────────────────────────────────────────── */}
      <DocsWhenToUse
        title={tContent("usage.title")}
        guidelines={{
          title: tContent("usage.guidelines.title"),
          items: [
            tContent("usage.guidelines.item1"),
            tContent("usage.guidelines.item2"),
            tContent("usage.guidelines.item3"),
            tContent("usage.guidelines.item4"),
          ],
        }}
        scenarios={{
          title: tContent("usage.scenarios.title"),
          cols: {
            scenario: tContent("usage.scenarios.cols.scenario"),
            use: tContent("usage.scenarios.cols.use"),
            alternative: tContent("usage.scenarios.cols.alternative"),
          },
          items: [
            { s: tContent("usage.scenarios.item1.s"), u: tContent("usage.scenarios.item1.u"), a: tContent("usage.scenarios.item1.a") },
            { s: tContent("usage.scenarios.item2.s"), u: tContent("usage.scenarios.item2.u"), a: tContent("usage.scenarios.item2.a") },
            { s: tContent("usage.scenarios.item3.s"), u: tContent("usage.scenarios.item3.u"), a: tContent("usage.scenarios.item3.a") },
            { s: tContent("usage.scenarios.item4.s"), u: tContent("usage.scenarios.item4.u"), a: tContent("usage.scenarios.item4.a") },
            { s: tContent("usage.scenarios.item5.s"), u: tContent("usage.scenarios.item5.u"), a: tContent("usage.scenarios.item5.a") },
          ],
        }}
        uxWriting={{
          title: tContent("usage.uxWriting.title"),
          cols: {
            element: tContent("usage.uxWriting.table.element"),
            rules: tContent("usage.uxWriting.table.rules"),
            do: tContent("usage.uxWriting.table.correct"),
            dont: tContent("usage.uxWriting.table.avoid"),
          },
          items: [
            {
              element: tContent("usage.uxWriting.table.groupLabel.name"),
              rules: tContent("usage.uxWriting.table.groupLabel.format"),
              do: tContent("usage.uxWriting.table.groupLabel.good"),
              dont: tContent("usage.uxWriting.table.groupLabel.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.itemLabel.name"),
              rules: tContent("usage.uxWriting.table.itemLabel.format"),
              do: tContent("usage.uxWriting.table.itemLabel.good"),
              dont: tContent("usage.uxWriting.table.itemLabel.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.order.name"),
              rules: tContent("usage.uxWriting.table.order.format"),
              do: tContent("usage.uxWriting.table.order.good"),
              dont: tContent("usage.uxWriting.table.order.bad"),
            },
          ],
        }}
        do={{
          title: tContent("usage.do.title"),
          items: [
            tContent("usage.do.item1"),
            tContent("usage.do.item2"),
            tContent("usage.do.item3"),
            tContent("usage.do.item4"),
          ],
        }}
        dont={{
          title: tContent("usage.dont.title"),
          items: [
            tContent("usage.dont.item1"),
            tContent("usage.dont.item2"),
            tContent("usage.dont.item3"),
            tContent("usage.dont.item4"),
          ],
        }}
      />

      {/* ── Do & Don't ────────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <RadioGroup aria-label="Forma de pagamento" defaultValue="pix">
                <div className="nds-cluster" data-spacing="xs">
                  <RadioGroupItem value="cartao" id="dd1-do-cartao" />
                  <Label htmlFor="dd1-do-cartao">Cartão de crédito</Label>
                </div>
                <div className="nds-cluster" data-spacing="xs">
                  <RadioGroupItem value="pix" id="dd1-do-pix" />
                  <Label htmlFor="dd1-do-pix">Pix</Label>
                </div>
              </RadioGroup>
            ),
            dontPreview: (
              <RadioGroup aria-label="Forma de pagamento" defaultValue="pix">
                <div className="nds-cluster" data-spacing="xs">
                  <RadioGroupItem value="cartao" id="dd1-dont-cartao" />
                  <span className="nds-text-body">Cartão de crédito</span>
                </div>
                <div className="nds-cluster" data-spacing="xs">
                  <RadioGroupItem value="pix" id="dd1-dont-pix" />
                  <span className="nds-text-body">Pix</span>
                </div>
              </RadioGroup>
            ),
            doCaption: DOMPurify.sanitize(tContent("doDont.pair1.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <RadioGroup aria-label="Forma de entrega">
                <div className="nds-cluster" data-spacing="xs">
                  <RadioGroupItem value="standard" id="dd2-do-standard" />
                  <Label htmlFor="dd2-do-standard">Padrão</Label>
                </div>
                <div className="nds-cluster" data-spacing="xs">
                  <RadioGroupItem value="express" id="dd2-do-express" />
                  <Label htmlFor="dd2-do-express">Expressa</Label>
                </div>
              </RadioGroup>
            ),
            dontPreview: (
              <RadioGroup aria-label="Forma de entrega" defaultValue="express">
                <div className="nds-cluster" data-spacing="xs">
                  <RadioGroupItem value="standard" id="dd2-dont-standard" />
                  <Label htmlFor="dd2-dont-standard">Padrão</Label>
                </div>
                <div className="nds-cluster" data-spacing="xs">
                  <RadioGroupItem value="express" id="dd2-dont-express" />
                  <Label htmlFor="dd2-dont-express">Expressa</Label>
                </div>
              </RadioGroup>
            ),
            doCaption: DOMPurify.sanitize(tContent("doDont.pair2.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport title={tContent("import.title")} code={codeImport} />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        componentSlug="radio-group"
        items={[
          {
            name: tContent("variants.items.vertical"),
            description: stripHtml(tContent("variants.styles.vertical")),
            code: codeVertical,
            preview: (
              <RadioGroup aria-label="Forma de pagamento">
                <div className="nds-cluster" data-spacing="xs">
                  <RadioGroupItem value="cartao" id="var-v-cartao" />
                  <Label htmlFor="var-v-cartao">Cartão de crédito</Label>
                </div>
                <div className="nds-cluster" data-spacing="xs">
                  <RadioGroupItem value="pix" id="var-v-pix" />
                  <Label htmlFor="var-v-pix">Pix</Label>
                </div>
                <div className="nds-cluster" data-spacing="xs">
                  <RadioGroupItem value="boleto" id="var-v-boleto" />
                  <Label htmlFor="var-v-boleto">Boleto bancário</Label>
                </div>
              </RadioGroup>
            ),
          },
          {
            name: tContent("variants.items.horizontal"),
            description: stripHtml(tContent("variants.styles.horizontal")),
            code: codeHorizontal,
            preview: (
              <RadioGroup
                style={{ gridAutoFlow: "column", gridAutoColumns: "max-content", gap: "1.5rem" }}
                aria-label="Forma de entrega"
              >
                <div className="nds-cluster" data-spacing="xs">
                  <RadioGroupItem value="padrao" id="var-h-padrao" />
                  <Label htmlFor="var-h-padrao">Padrão</Label>
                </div>
                <div className="nds-cluster" data-spacing="xs">
                  <RadioGroupItem value="expressa" id="var-h-expressa" />
                  <Label htmlFor="var-h-expressa">Expressa</Label>
                </div>
                <div className="nds-cluster" data-spacing="xs">
                  <RadioGroupItem value="retirar" id="var-h-retirar" />
                  <Label htmlFor="var-h-retirar">Retirar</Label>
                </div>
              </RadioGroup>
            ),
          },
          {
            name: tContent("variants.items.withDescription"),
            description: stripHtml(tContent("variants.styles.withDescription")),
            code: codeWithDescription,
            preview: (
              <RadioGroup aria-label="Forma de entrega">
                <div className="nds-cluster" data-spacing="xs" data-align="start">
                  <RadioGroupItem
                    value="padrao"
                    id="var-d-padrao"
                    className="nds-mt-0-5"
                  />
                  <div className="nds-stack" data-spacing="xs">
                    <Label htmlFor="var-d-padrao">Padrão</Label>
                    <p className="nds-text-body">
                      Entrega em até 5 dias úteis.
                    </p>
                  </div>
                </div>
                <div className="nds-cluster" data-spacing="xs" data-align="start">
                  <RadioGroupItem
                    value="expressa"
                    id="var-d-expressa"
                    className="nds-mt-0-5"
                  />
                  <div className="nds-stack" data-spacing="xs">
                    <Label htmlFor="var-d-expressa">Expressa</Label>
                    <p className="nds-text-body">
                      Entrega em 1 dia útil.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="radio-group"
        items={[
          {
            name: tContent("variants.compositions.vertical.name"),
            description: tContent("variants.compositions.vertical.description"),
            useWhen: tContent("variants.compositions.vertical.use"),
            code: codeVertical,
            preview: (
              <div className="nds-stack" data-spacing="sm">
                <p id="comp-payment-legend" className="nds-text-body nds-font-semibold">
                  Forma de pagamento
                </p>
                <RadioGroup name="payment" aria-labelledby="comp-payment-legend">
                  <div className="nds-cluster" data-spacing="xs">
                    <RadioGroupItem value="card" id="r-card" />
                    <Label htmlFor="r-card">Cartão de crédito</Label>
                  </div>
                  <div className="nds-cluster" data-spacing="xs">
                    <RadioGroupItem value="pix" id="r-pix" />
                    <Label htmlFor="r-pix">Pix</Label>
                  </div>
                  <div className="nds-cluster" data-spacing="xs">
                    <RadioGroupItem value="boleto" id="r-boleto" />
                    <Label htmlFor="r-boleto">Boleto bancário</Label>
                  </div>
                </RadioGroup>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.horizontal.name"),
            description: tContent("variants.compositions.horizontal.description"),
            useWhen: tContent("variants.compositions.horizontal.use"),
            code: codeHorizontal,
            preview: (
              <div className="nds-stack" data-spacing="sm">
                <p id="comp-delivery-legend" className="nds-text-body nds-font-semibold">
                  Forma de entrega
                </p>
                <RadioGroup
                  name="delivery"
                  aria-labelledby="comp-delivery-legend"
                  className="nds-cluster"
                  data-spacing="lg"
                >
                  <div className="nds-cluster" data-spacing="xs">
                    <RadioGroupItem value="standard" id="r-standard" />
                    <Label htmlFor="r-standard">Padrão (5 dias)</Label>
                  </div>
                  <div className="nds-cluster" data-spacing="xs">
                    <RadioGroupItem value="express" id="r-express" />
                    <Label htmlFor="r-express">Expressa (1 dia)</Label>
                  </div>
                  <div className="nds-cluster" data-spacing="xs">
                    <RadioGroupItem value="pickup" id="r-pickup" />
                    <Label htmlFor="r-pickup">Retirar na loja</Label>
                  </div>
                </RadioGroup>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.withDescription.name"),
            description: tContent("variants.compositions.withDescription.description"),
            useWhen: tContent("variants.compositions.withDescription.use"),
            code: codeWithDescription,
            preview: (
              <div className="nds-stack nds-w-sm" data-spacing="sm">
                <p id="comp-delivery-desc-legend" className="nds-text-body nds-font-semibold">
                  Forma de entrega
                </p>
                <RadioGroup
                  name="delivery-desc"
                  aria-labelledby="comp-delivery-desc-legend"
                >
                  <div className="nds-cluster" data-spacing="xs" data-align="start">
                    <RadioGroupItem value="standard" id="rd-standard" className="nds-mt-1" />
                    <div className="nds-stack" data-spacing="xs">
                      <Label htmlFor="rd-standard">Padrão</Label>
                      <p className="nds-text-body">
                        Entrega em 5 dias úteis — frete grátis acima de R$ 199.
                      </p>
                    </div>
                  </div>
                  <div className="nds-cluster" data-spacing="xs" data-align="start">
                    <RadioGroupItem value="express" id="rd-express" className="nds-mt-1" />
                    <div className="nds-stack" data-spacing="xs">
                      <Label htmlFor="rd-express">Expressa</Label>
                      <p className="nds-text-body">
                        Receba em 1 dia útil — taxa adicional de R$ 19,90.
                      </p>
                    </div>
                  </div>
                  <div className="nds-cluster" data-spacing="xs" data-align="start">
                    <RadioGroupItem value="pickup" id="rd-pickup" className="nds-mt-1" />
                    <div className="nds-stack" data-spacing="xs">
                      <Label htmlFor="rd-pickup">Retirar na loja</Label>
                      <p className="nds-text-body">
                        Disponível em 2h — sem custo de frete.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.inForm.name"),
            description: tContent("variants.compositions.inForm.description"),
            useWhen: tContent("variants.compositions.inForm.use"),
            code: codeVertical,
            preview: (
              <form
                className="nds-stack nds-w-sm nds-p-4 nds-border-default nds-rounded-lg" data-spacing="md"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  const selected = (data.get("payment") as string) ?? "—";
                  setFormOutput(selected);
                }}
              >
                <fieldset className="nds-stack nds-border-none nds-p-0 nds-m-0" data-spacing="sm">
                  <legend className="nds-text-body nds-font-semibold nds-mb-2">
                    Forma de pagamento
                  </legend>
                  <RadioGroup name="payment">
                    <div className="nds-cluster" data-spacing="xs">
                      <RadioGroupItem value="card" id="rf-card" />
                      <Label htmlFor="rf-card">Cartão de crédito</Label>
                    </div>
                    <div className="nds-cluster" data-spacing="xs">
                      <RadioGroupItem value="pix" id="rf-pix" />
                      <Label htmlFor="rf-pix">Pix</Label>
                    </div>
                    <div className="nds-cluster" data-spacing="xs">
                      <RadioGroupItem value="boleto" id="rf-boleto" />
                      <Label htmlFor="rf-boleto">Boleto bancário</Label>
                    </div>
                  </RadioGroup>
                </fieldset>
                <Button type="submit" style={{ alignSelf: 'flex-end' }}>
                  Continuar
                </Button>
                <p className="nds-text-body">
                  Selecionado: {formOutput}
                </p>
              </form>
            ),
          },
        ]}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={stateCols}
        items={[
          {
            label: tContent("states.items.default"),
            trigger: "—",
            behavior: stripHtml(tContent("states.descriptions.default")),
          },
          {
            label: tContent("states.items.checked"),
            trigger: 'value="cartao"',
            behavior: stripHtml(tContent("states.descriptions.checked")),
          },
          {
            label: tContent("states.items.hover"),
            trigger: ":hover",
            behavior: stripHtml(tContent("states.descriptions.hover")),
          },
          {
            label: tContent("states.items.focus"),
            trigger: ":focus-visible",
            behavior: stripHtml(tContent("states.descriptions.focus")),
          },
          {
            label: tContent("states.items.disabled"),
            trigger: "disabled",
            behavior: stripHtml(tContent("states.descriptions.disabled")),
          },
          {
            label: tContent("states.items.invalid"),
            trigger: 'aria-invalid="true"',
            behavior: stripHtml(tContent("states.descriptions.invalid")),
          },
        ]}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "value",
                type: tContent("props.table.value.type"),
                defaultValue: tContent("props.table.value.default"),
                required: tContent("props.table.value.required"),
                description: stripHtml(tContent("props.table.value.description")),
              },
              {
                name: "defaultValue",
                type: tContent("props.table.defaultValue.type"),
                defaultValue: tContent("props.table.defaultValue.default"),
                required: tContent("props.table.defaultValue.required"),
                description: stripHtml(tContent("props.table.defaultValue.description")),
              },
              {
                name: "onValueChange",
                type: tContent("props.table.onValueChange.type"),
                defaultValue: tContent("props.table.onValueChange.default"),
                required: tContent("props.table.onValueChange.required"),
                description: stripHtml(tContent("props.table.onValueChange.description")),
              },
              {
                name: "disabled",
                type: tContent("props.table.disabled.type"),
                defaultValue: tContent("props.table.disabled.default"),
                required: tContent("props.table.disabled.required"),
                description: stripHtml(tContent("props.table.disabled.description")),
              },
              {
                name: "name",
                type: tContent("props.table.name.type"),
                defaultValue: tContent("props.table.name.default"),
                required: tContent("props.table.name.required"),
                description: stripHtml(tContent("props.table.name.description")),
              },
              {
                name: "orientation",
                type: tContent("props.table.orientation.type"),
                defaultValue: tContent("props.table.orientation.default"),
                required: tContent("props.table.orientation.required"),
                description: stripHtml(tContent("props.table.orientation.description")),
              },
              {
                name: "className",
                type: tContent("props.table.className.type"),
                defaultValue: tContent("props.table.className.default"),
                required: tContent("props.table.className.required"),
                description: stripHtml(tContent("props.table.className.description")),
              },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibilityCode")}
      />

      {/* ── Tokens ────────────────────────────────────────────────── */}
      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={[
          { token: "--input", value: tContent("tokens.table.input.class"), description: tContent("tokens.table.input.part") },
          { token: "--primary", value: tContent("tokens.table.primary.class"), description: tContent("tokens.table.primary.part") },
          { token: "--primary-foreground", value: tContent("tokens.table.primaryForeground.class"), description: tContent("tokens.table.primaryForeground.part") },
          { token: "--ring", value: tContent("tokens.table.ring.class"), description: tContent("tokens.table.ring.part") },
          { token: "--destructive", value: tContent("tokens.table.destructive.class"), description: tContent("tokens.table.destructive.part") },
          { token: "--foreground", value: tContent("tokens.table.foreground.class"), description: tContent("tokens.table.foreground.part") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[
          tContent("accessibility.items.item1"),
          tContent("accessibility.items.item2"),
          tContent("accessibility.items.item3"),
          tContent("accessibility.items.item4"),
          tContent("accessibility.items.item5"),
          tContent("accessibility.items.item6"),
        ]}
        keyboardTitle={tContent("accessibility.keyboard.title")}
        keyboardItems={[
          { key: "Tab", description: stripHtml(tContent("accessibility.keyboard.tab")) },
          { key: "↓ ArrowDown", description: stripHtml(tContent("accessibility.keyboard.arrowDown")) },
          { key: "↑ ArrowUp", description: stripHtml(tContent("accessibility.keyboard.arrowUp")) },
          { key: "→ ArrowRight", description: stripHtml(tContent("accessibility.keyboard.arrowRight")) },
          { key: "← ArrowLeft", description: stripHtml(tContent("accessibility.keyboard.arrowLeft")) },
          { key: "Space", description: stripHtml(tContent("accessibility.keyboard.space")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="radio-group"
        items={[
          {
            name: tContent("related.items.checkbox.name"),
            description: tContent("related.items.checkbox.description"),
            path: "?path=/docs/ui-checkbox--docs",
          },
          {
            name: tContent("related.items.switch.name"),
            description: tContent("related.items.switch.description"),
            path: "?path=/docs/ui-switch--docs",
          },
          {
            name: tContent("related.items.select.name"),
            description: tContent("related.items.select.description"),
            path: "?path=/docs/ui-select--docs",
          },
          {
            name: tContent("related.items.form.name"),
            description: tContent("related.items.form.description"),
            path: "?path=/docs/ui-form--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="radio-group"
        items={[
          { title: "", content: tContent("notes.item1") },
          { title: "", content: tContent("notes.item2") },
          { title: "", content: tContent("notes.item3") },
          { title: "", content: tContent("notes.item4") },
        ]}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: tContent("analytics.table.trigger"),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: "radio_change",
            trigger: tContent("analytics.table.radio_change.trigger"),
            payload: tContent("analytics.table.radio_change.payload"),
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
            action: stripHtml(tContent(`testes.functional.item${i}.action`)),
            result: stripHtml(tContent(`testes.functional.item${i}.result`)),
            priority: tNav(
              priorityKeyMap[tContent(`testes.functional.item${i}.priority`)] ?? "common.high"
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
          items: [
            { criterion: tContent("testes.accessibility.item1"), level: "AA", how: "axe-core" },
            { criterion: tContent("testes.accessibility.item2"), level: "1.4.3", how: "Contrast checker" },
            { criterion: tContent("testes.accessibility.item3"), level: "2.4.7", how: "Keyboard test" },
            { criterion: tContent("testes.accessibility.item4"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item5"), level: "4.1.2", how: "DevTools attribute" },
          ],
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
              priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ?? "common.high"
            ),
          })),
        }}
      />
    </DocsPageLayout>
  );
}

export default RadioGroupDocs;
