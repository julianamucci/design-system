import { useCallback, useEffect, useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import sliderTranslations from "@shared/content/slider/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsCompositions }  from "@/components/docs/shared/sections/DocsCompositions";
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
      { id: "variantes",    label: t("nav.variants") },
      { id: "composicoes",  label: t("nav.compositions") },
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

// ─── Demo helpers ────────────────────────────────────────────────────────────

function VolumeDemo({ label }: { label: string }) {
  const [value, setValue] = useState<number[]>([50]);
  return (
    <div className="nds-stack nds-w-full" data-spacing="xs">
      <div className="nds-cluster" data-justify="between">
        <Label>{label}</Label>
        <span aria-live="polite" className="nds-text-body" style={{ fontVariantNumeric: "tabular-nums" }}>
          {value[0]}%
        </span>
      </div>
      <Slider
        value={value}
        onValueChange={(v) => setValue(v as number[])}
        onValueCommitted={(v) =>
          track("slider_change", {
            component: "slider",
            field_name: "volume",
            value: (v as number[])[0],
            min: 0,
            max: 100,
            location: "docs_demo",
          })
        }
        min={0}
        max={100}
        aria-label={label}
      />
    </div>
  );
}

function PriceRangeDemo({ label }: { label: string }) {
  const [value, setValue] = useState<number[]>([100, 400]);
  return (
    <div className="nds-stack nds-w-full" data-spacing="sm">
      <div className="nds-cluster" data-justify="between">
        <Label>{label}</Label>
        <span aria-live="polite" className="nds-text-body" style={{ fontVariantNumeric: "tabular-nums" }}>
          R$ {value[0]} — R$ {value[1]}
        </span>
      </div>
      <Slider
        value={value}
        onValueChange={(v) => setValue(v as number[])}
        onValueCommitted={(v) =>
          track("slider_change", {
            component: "slider",
            field_name: "price_range",
            value: (v as number[]).join("-"),
            min: 0,
            max: 500,
            location: "docs_demo",
          })
        }
        min={0}
        max={500}
        step={10}
        aria-label={label}
      />
    </div>
  );
}

function VerticalDemo({ label }: { label: string }) {
  const [value, setValue] = useState<number[]>([60]);
  return (
    <div className="nds-stack nds-demo-box" data-spacing="sm" data-size="sm" style={{ alignItems: "center", width: "8rem" }}>
      <span aria-live="polite" className="nds-text-body" style={{ fontVariantNumeric: "tabular-nums" }}>
        {value[0]}%
      </span>
      <Slider
        value={value}
        onValueChange={(v) => setValue(v as number[])}
        onValueCommitted={(v) =>
          track("slider_change", {
            component: "slider",
            field_name: "brightness",
            value: (v as number[])[0],
            min: 0,
            max: 100,
            location: "docs_demo",
          })
        }
        orientation="vertical"
        min={0}
        max={100}
        aria-label={label}
      />
    </div>
  );
}

function BrightnessCompDemo() {
  const [value, setValue] = useState<number[]>([75]);
  return (
    <div className="nds-stack nds-w-full nds-max-w-xs" data-spacing="sm">
      <div className="nds-cluster" data-justify="between">
        <Label>Brilho</Label>
        <span aria-live="polite" className="nds-text-body" style={{ fontVariantNumeric: "tabular-nums" }}>
          {value[0]}%
        </span>
      </div>
      <Slider
        value={value}
        onValueChange={(v) => setValue(v as number[])}
        min={0}
        max={100}
        step={5}
        aria-label="Brilho"
      />
    </div>
  );
}

function FormCompDemo() {
  const [value, setValue] = useState<number[]>([60]);
  const [committed, setCommitted] = useState<number>(60);
  return (
    <form
      aria-label="Configurações de áudio"
      className="nds-stack nds-w-full nds-max-w-xs" data-spacing="md"
      onSubmit={(e) => {
        e.preventDefault();
        setCommitted(value[0]);
      }}
    >
      <div className="nds-stack" data-spacing="sm">
        <div className="nds-cluster" data-justify="between">
          <Label>Volume</Label>
          <span aria-live="polite" className="nds-text-body" style={{ fontVariantNumeric: "tabular-nums" }}>
            {value[0]}%
          </span>
        </div>
        <Slider
          value={value}
          onValueChange={(v) => setValue(v as number[])}
          onValueCommitted={(v) => setCommitted((v as number[])[0])}
          min={0}
          max={100}
          aria-label="Volume"
        />
      </div>
      <Button type="submit" size="sm" style={{ alignSelf: "flex-start" }}>Salvar</Button>
      <p className="nds-text-caption nds-text-muted-foreground" aria-live="polite">
        Último commit: {committed}%
      </p>
    </form>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export function SliderDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(sliderTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = useMemo(
    () =>
      Object.values(
        (sliderTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      ),
    [locale],
  );

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "slider",
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
      component_name: "slider",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "slider",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ──────────────────────────────────────────────────────────

  const codeImport = `import { Slider } from "@/components/ui/slider";`;

  const codeSingle = `<Slider
  value={[50]}
  onValueChange={setValue}
  min={0}
  max={100}
  aria-label="Volume"
/>`;

  const codeRange = `<Slider
  value={[20, 80]}
  onValueChange={setRange}
  min={0}
  max={100}
  aria-label="Faixa de preço"
/>`;

  const codeVertical = `<div className="nds-demo-box" data-size="sm">
  <Slider
    value={[60]}
    onValueChange={setValue}
    orientation="vertical"
    aria-label="Brilho"
  />
</div>`;

  const interfaceCode = `// Slider (root)
interface SliderProps {
  value?: number[];                              // SEMPRE array (single: [50])
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;     // durante arrasto
  onValueCommitted?: (value: number[]) => void;  // ao soltar (use p/ analytics)
  min?: number;
  max?: number;
  step?: number;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  "aria-label": string;                          // OBRIGATÓRIO
}`;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="slider"
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
          <div className="nds-p-4 nds-border-default nds-rounded-md">
            <VolumeDemo label={tContent("demonstration.labels.volume")} />
          </div>
          <div className="nds-p-4 nds-border-default nds-rounded-md">
            <PriceRangeDemo label={tContent("demonstration.labels.priceRange")} />
          </div>
          <div className="nds-p-4 nds-border-default nds-rounded-md nds-cluster" data-justify="center">
            <VerticalDemo label={tContent("demonstration.labels.brightness")} />
          </div>
          <div className="nds-p-4 nds-border-default nds-rounded-md">
            <div className="nds-stack nds-w-full" data-spacing="sm">
              <div className="nds-cluster" data-justify="between">
                <Label>{tContent("demonstration.labels.single")}</Label>
                <span aria-live="polite" className="nds-text-body" style={{ fontVariantNumeric: "tabular-nums" }}>
                  25
                </span>
              </div>
              <Slider
                defaultValue={[25]}
                onValueCommitted={(v) =>
                  track("slider_change", {
                    component: "slider",
                    field_name: "single",
                    value: (v as number[])[0],
                    min: 0,
                    max: 100,
                    location: "docs_demo",
                  })
                }
                min={0}
                max={100}
                aria-label={tContent("demonstration.labels.single")}
              />
            </div>
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
          tContent("anatomy.item5"),
        ]}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

      {/* ── Quando Usar ───────────────────────────────────────────── */}
      <DocsWhenToUse
        title={tContent("usage.title")}
        guidelines={{
          title: tContent("usage.guidelines.title"),
          items: [
            stripHtml(tContent("usage.guidelines.item1")),
            stripHtml(tContent("usage.guidelines.item2")),
            stripHtml(tContent("usage.guidelines.item3")),
            stripHtml(tContent("usage.guidelines.item4")),
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
              element: tContent("usage.uxWriting.table.ariaLabel.name"),
              rules: tContent("usage.uxWriting.table.ariaLabel.format"),
              do: tContent("usage.uxWriting.table.ariaLabel.good"),
              dont: tContent("usage.uxWriting.table.ariaLabel.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.valueDisplay.name"),
              rules: tContent("usage.uxWriting.table.valueDisplay.format"),
              do: tContent("usage.uxWriting.table.valueDisplay.good"),
              dont: tContent("usage.uxWriting.table.valueDisplay.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.range.name"),
              rules: tContent("usage.uxWriting.table.range.format"),
              do: tContent("usage.uxWriting.table.range.good"),
              dont: tContent("usage.uxWriting.table.range.bad"),
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
            stripHtml(tContent("usage.dont.item1")),
            stripHtml(tContent("usage.dont.item2")),
            stripHtml(tContent("usage.dont.item3")),
            stripHtml(tContent("usage.dont.item4")),
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
              <div className="nds-stack nds-w-full" data-spacing="sm">
                <div className="nds-cluster" data-justify="between">
                  <span className="nds-text-body">Volume</span>
                  <span aria-live="polite" className="nds-text-body" style={{ fontVariantNumeric: "tabular-nums" }}>
                    75%
                  </span>
                </div>
                <Slider defaultValue={[75]} min={0} max={100} aria-label="Volume" />
              </div>
            ),
            dontPreview: (
              <div className="nds-w-full">
                <Slider defaultValue={[75]} min={0} max={100} aria-label="Volume" />
              </div>
            ),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="nds-w-full">
                <Slider defaultValue={[50]} min={0} max={100} aria-label="Volume" />
              </div>
            ),
            dontPreview: (
              <div className="nds-w-full">
                <Slider defaultValue={[50]} min={0} max={100} aria-label="Slider" />
              </div>
            ),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport title={tContent("import.title")} code={codeImport} />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsCompositions
        id="variantes"
        title={tContent("variants.title")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="slider"
        items={[
          {
            name: tContent("variants.items.single"),
            description: stripHtml(tContent("variants.styles.single")),
            code: codeSingle,
            preview: (
              <div className="nds-w-full nds-max-w-xs">
                <Slider defaultValue={[50]} min={0} max={100} aria-label="Volume" />
              </div>
            ),
          },
          {
            name: tContent("variants.items.range"),
            description: stripHtml(tContent("variants.styles.range")),
            code: codeRange,
            preview: (
              <div className="nds-w-full nds-max-w-xs">
                <Slider
                  defaultValue={[20, 80]}
                  min={0}
                  max={100}
                  aria-label="Faixa de preço"
                />
              </div>
            ),
          },
          {
            name: tContent("variants.items.vertical"),
            description: stripHtml(tContent("variants.styles.vertical")),
            code: codeVertical,
            preview: (
              <div className="nds-cluster nds-w-full nds-demo-box" data-justify="center" data-size="sm">
                <Slider
                  defaultValue={[60]}
                  orientation="vertical"
                  min={0}
                  max={100}
                  aria-label="Brilho"
                />
              </div>
            ),
          },
          {
            name: tContent("variants.items.brightness.name"),
            description: tContent("variants.items.brightness.description"),
            useWhen: tContent("variants.items.brightness.use"),
            code: `<Slider
  value={value}
  onValueChange={setValue}
  min={0}
  max={100}
  step={5}
  aria-label="Brilho"
/>`,
            preview: <BrightnessCompDemo />,
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="slider"
        items={[
          {
            name: tContent("variants.compositions.volume.name"),
            description: tContent("variants.compositions.volume.description"),
            useWhen: tContent("variants.compositions.volume.use"),
            code: `const [value, setValue] = useState([50]);

<div className="nds-stack" data-spacing="sm">
  <div className="nds-cluster" data-justify="between">
    <Label>Volume</Label>
    <span aria-live="polite" className="nds-text-body" style={{ fontVariantNumeric: "tabular-nums" }}>{value[0]}%</span>
  </div>
  <Slider
    value={value}
    onValueChange={setValue}
    min={0}
    max={100}
    aria-label="Volume"
  />
</div>`,
            preview: <VolumeDemo label="Volume" />,
          },
          {
            name: tContent("variants.compositions.form.name"),
            description: tContent("variants.compositions.form.description"),
            useWhen: tContent("variants.compositions.form.use"),
            code: `<form aria-label="Configurações de áudio" onSubmit={handleSubmit}>
  <Label>Volume</Label>
  <Slider
    value={value}
    onValueChange={setValue}
    onValueCommitted={(v) => {
      track("slider_change", {
        component: "slider",
        field_name: "volume",
        value: v[0],
      });
    }}
    min={0}
    max={100}
    aria-label="Volume"
  />
  <Button type="submit">Salvar</Button>
</form>`,
            preview: <FormCompDemo />,
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
        items={[
          {
            label: tContent("states.default.label"),
            trigger: toPlainText(tContent("states.default.trigger")),
            behavior: toPlainText(tContent("states.default.behavior")),
          },
          {
            label: tContent("states.hover.label"),
            trigger: toPlainText(tContent("states.hover.trigger")),
            behavior: toPlainText(tContent("states.hover.behavior")),
          },
          {
            label: tContent("states.focus.label"),
            trigger: toPlainText(tContent("states.focus.trigger")),
            behavior: toPlainText(tContent("states.focus.behavior")),
          },
          {
            label: tContent("states.active.label"),
            trigger: toPlainText(tContent("states.active.trigger")),
            behavior: toPlainText(tContent("states.active.behavior")),
          },
          {
            label: tContent("states.disabled.label"),
            trigger: toPlainText(tContent("states.disabled.trigger")),
            behavior: toPlainText(tContent("states.disabled.behavior")),
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
                description: tContent("props.table.value.description"),
              },
              {
                name: "defaultValue",
                type: tContent("props.table.defaultValue.type"),
                defaultValue: tContent("props.table.defaultValue.default"),
                required: tContent("props.table.defaultValue.required"),
                description: tContent("props.table.defaultValue.description"),
              },
              {
                name: "onValueChange",
                type: tContent("props.table.onValueChange.type"),
                defaultValue: tContent("props.table.onValueChange.default"),
                required: tContent("props.table.onValueChange.required"),
                description: tContent("props.table.onValueChange.description"),
              },
              {
                name: "onValueCommitted",
                type: tContent("props.table.onValueCommitted.type"),
                defaultValue: tContent("props.table.onValueCommitted.default"),
                required: tContent("props.table.onValueCommitted.required"),
                description: tContent("props.table.onValueCommitted.description"),
              },
              {
                name: "min",
                type: tContent("props.table.min.type"),
                defaultValue: tContent("props.table.min.default"),
                required: tContent("props.table.min.required"),
                description: tContent("props.table.min.description"),
              },
              {
                name: "max",
                type: tContent("props.table.max.type"),
                defaultValue: tContent("props.table.max.default"),
                required: tContent("props.table.max.required"),
                description: tContent("props.table.max.description"),
              },
              {
                name: "step",
                type: tContent("props.table.step.type"),
                defaultValue: tContent("props.table.step.default"),
                required: tContent("props.table.step.required"),
                description: tContent("props.table.step.description"),
              },
              {
                name: "orientation",
                type: tContent("props.table.orientation.type"),
                defaultValue: tContent("props.table.orientation.default"),
                required: tContent("props.table.orientation.required"),
                description: tContent("props.table.orientation.description"),
              },
              {
                name: "disabled",
                type: tContent("props.table.disabled.type"),
                defaultValue: tContent("props.table.disabled.default"),
                required: tContent("props.table.disabled.required"),
                description: tContent("props.table.disabled.description"),
              },
              {
                name: "aria-label",
                type: "string",
                defaultValue: "—",
                required: "Sim",
                description:
                  locale === "en"
                    ? "Required. Describes the controlled value for screen readers."
                    : locale === "es"
                    ? "Obligatorio. Describe el valor controlado para lectores de pantalla."
                    : "Obrigatório. Descreve o valor controlado para leitores de tela.",
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
          {
            token: "--primary / 0.2",
            value: tContent("tokens.table.track.class"),
            description: tContent("tokens.table.track.part"),
          },
          {
            token: "--primary",
            value: tContent("tokens.table.range.class"),
            description: tContent("tokens.table.range.part"),
          },
          {
            token: "--primary",
            value: tContent("tokens.table.thumbBorder.class"),
            description: tContent("tokens.table.thumbBorder.part"),
          },
          {
            token: "--background",
            value: tContent("tokens.table.thumbBackground.class"),
            description: tContent("tokens.table.thumbBackground.part"),
          },
          {
            token: "--ring",
            value: tContent("tokens.table.focusRing.class"),
            description: tContent("tokens.table.focusRing.part"),
          },
          {
            token: "--radius-full",
            value: tContent("tokens.table.radius.class"),
            description: tContent("tokens.table.radius.part"),
          },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
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
          { key: "Tab",         description: tContent("accessibility.keyboard.tab") },
          { key: "Arrow Right",  description: toPlainText(tContent("accessibility.keyboard.arrowRight")) },
          { key: "Arrow Left",   description: toPlainText(tContent("accessibility.keyboard.arrowLeft")) },
          { key: "Arrow Up",     description: toPlainText(tContent("accessibility.keyboard.arrowUp")) },
          { key: "Arrow Down",   description: toPlainText(tContent("accessibility.keyboard.arrowDown")) },
          { key: "Home",        description: toPlainText(tContent("accessibility.keyboard.home")) },
          { key: "End",         description: toPlainText(tContent("accessibility.keyboard.end")) },
          { key: "PageUp",      description: toPlainText(tContent("accessibility.keyboard.pageUp")) },
          { key: "PageDown",    description: toPlainText(tContent("accessibility.keyboard.pageDown")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="slider"
        items={[
          {
            name: tContent("related.items.input.name"),
            description: toPlainText(tContent("related.items.input.description")),
            path: "?path=/docs/ui-input--docs",
          },
          {
            name: tContent("related.items.switch.name"),
            description: toPlainText(tContent("related.items.switch.description")),
            path: "?path=/docs/ui-switch--docs",
          },
          {
            name: tContent("related.items.progress.name"),
            description: toPlainText(tContent("related.items.progress.description")),
            path: "?path=/docs/ui-progress--docs",
          },
          {
            name: tContent("related.items.radioGroup.name"),
            description: toPlainText(tContent("related.items.radioGroup.description")),
            path: "?path=/docs/ui-radiogroup--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="slider"
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
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: "slider_change",
            trigger: stripHtml(tContent("analytics.table.slider_change.trigger")),
            payload: tContent("analytics.table.slider_change.payload"),
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
          items: [
            {
              action: tContent("testes.functional.item1.action"),
              result: tContent("testes.functional.item1.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item1.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item2.action"),
              result: tContent("testes.functional.item2.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item2.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item3.action"),
              result: tContent("testes.functional.item3.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item3.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item4.action"),
              result: tContent("testes.functional.item4.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item4.priority")] ?? "common.medium"),
            },
          ],
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          items: [
            { criterion: tContent("testes.accessibility.item1"), level: "AA",    how: "axe-core" },
            { criterion: tContent("testes.accessibility.item2"), level: "1.4.11", how: "Contrast checker" },
            { criterion: tContent("testes.accessibility.item3"), level: "2.4.7", how: "DevTools" },
            { criterion: tContent("testes.accessibility.item4"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item5"), level: "4.1.2", how: "DevTools a11y tree" },
          ],
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [
            { story: tContent("testes.visual.item1.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item1.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item2.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item2.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item3.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item3.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item4.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item4.priority")] ?? "common.medium") },
          ],
        }}
      />
    </DocsPageLayout>
  );
}

export default SliderDocs;
