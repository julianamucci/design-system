import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import selectTranslations from "@shared/content/select/translations.json";
import { MailIcon, PhoneIcon, MessageCircleIcon } from "lucide-react";

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

export function SelectDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(selectTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "select",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    aiIntent: tContent("seo.aiIntent") as "informational" | "navigational",
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/form" },
      { name: tContent("title") },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "select",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "select",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // Interactive demo state — não pré-seleciona
  const [stateValue, setStateValue] = useState<string>("");
  const [regionValue, setRegionValue] = useState<string>("");
  const [smValue, setSmValue] = useState<string>("");

  // ─── Code strings ───────────────────────────────────────────────────────

  const codeImport = `import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "@/components/ui/select";`;

  const codeDefault = `<Select value={value} onValueChange={setValue}>
  <SelectTrigger aria-label="Selecionar estado">
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="sp">São Paulo</SelectItem>
    <SelectItem value="rj">Rio de Janeiro</SelectItem>
    <SelectItem value="mg">Minas Gerais</SelectItem>
  </SelectContent>
</Select>`;

  const codeWithGroups = `<Select value={value} onValueChange={setValue}>
  <SelectTrigger aria-label="Selecionar região">
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Sudeste</SelectLabel>
      <SelectItem value="sp">São Paulo</SelectItem>
      <SelectItem value="rj">Rio de Janeiro</SelectItem>
    </SelectGroup>
    <SelectGroup>
      <SelectLabel>Sul</SelectLabel>
      <SelectItem value="rs">Rio Grande do Sul</SelectItem>
      <SelectItem value="sc">Santa Catarina</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>`;

  const codeWithIcon = `<Select value={value} onValueChange={setValue}>
  <SelectTrigger aria-label="Selecionar canal">
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="email">
      <MailIcon /> E-mail
    </SelectItem>
    <SelectItem value="phone">
      <PhoneIcon /> Telefone
    </SelectItem>
    <SelectItem value="chat">
      <MessageCircleIcon /> Chat
    </SelectItem>
  </SelectContent>
</Select>`;

  const interfaceCode = `// Select (@base-ui/react/select)
interface SelectRootProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
}

interface SelectTriggerProps {
  size?: "default" | "sm";
  className?: string;
  // aria-label obrigatório quando não houver Label externo
}

interface SelectContentProps {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignItemWithTrigger?: boolean; // base-ui specific
}`;

  // ─── Locale-aware column labels ─────────────────────────────────────────
  const stateCols = {
    state: locale === "en" ? "State" : "Estado",
    trigger: locale === "en" ? "Trigger" : "Disparo",
    behavior:
      locale === "en" ? "Behavior" : locale === "es" ? "Comportamiento" : "Comportamento",
  };

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="select"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
          installNote="npx shadcn@latest add select"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          {/* Default */}
          <div
            className="space-y-2"
            style={{ contain: "layout", minHeight: 120, position: "relative" }}
          >
            <p className="text-xs font-medium text-muted-foreground">
              {tContent("variants.items.default")}
            </p>
            <Select value={stateValue} onValueChange={(v) => setStateValue(v ?? "")}>
              <SelectTrigger aria-label={tContent("demonstration.labels.stateLabel")}>
                <SelectValue placeholder={tContent("demonstration.labels.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sp">{tContent("demonstration.labels.sp")}</SelectItem>
                <SelectItem value="rj">{tContent("demonstration.labels.rj")}</SelectItem>
                <SelectItem value="mg">{tContent("demonstration.labels.mg")}</SelectItem>
                <SelectItem value="es">{tContent("demonstration.labels.es")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* With groups */}
          <div
            className="space-y-2"
            style={{ contain: "layout", minHeight: 120, position: "relative" }}
          >
            <p className="text-xs font-medium text-muted-foreground">
              {tContent("variants.items.withGroups")}
            </p>
            <Select value={regionValue} onValueChange={(v) => setRegionValue(v ?? "")}>
              <SelectTrigger aria-label={tContent("demonstration.labels.regionLabel")}>
                <SelectValue placeholder={tContent("demonstration.labels.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{tContent("demonstration.labels.groupSoutheast")}</SelectLabel>
                  <SelectItem value="sp">{tContent("demonstration.labels.sp")}</SelectItem>
                  <SelectItem value="rj">{tContent("demonstration.labels.rj")}</SelectItem>
                  <SelectItem value="mg">{tContent("demonstration.labels.mg")}</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>{tContent("demonstration.labels.groupSouth")}</SelectLabel>
                  <SelectItem value="rs">{tContent("demonstration.labels.rs")}</SelectItem>
                  <SelectItem value="sc">{tContent("demonstration.labels.sc")}</SelectItem>
                  <SelectItem value="pr">{tContent("demonstration.labels.pr")}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Size sm */}
          <div
            className="space-y-2"
            style={{ contain: "layout", minHeight: 120, position: "relative" }}
          >
            <p className="text-xs font-medium text-muted-foreground">
              size="sm"
            </p>
            <Select value={smValue} onValueChange={(v) => setSmValue(v ?? "")}>
              <SelectTrigger size="sm" aria-label={tContent("demonstration.labels.stateLabel")}>
                <SelectValue placeholder={tContent("demonstration.labels.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sp">{tContent("demonstration.labels.sp")}</SelectItem>
                <SelectItem value="rj">{tContent("demonstration.labels.rj")}</SelectItem>
                <SelectItem value="mg">{tContent("demonstration.labels.mg")}</SelectItem>
              </SelectContent>
            </Select>
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
          tContent("anatomy.item6"),
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
              element: tContent("usage.uxWriting.table.placeholder.name"),
              rules: tContent("usage.uxWriting.table.placeholder.format"),
              do: tContent("usage.uxWriting.table.placeholder.good"),
              dont: tContent("usage.uxWriting.table.placeholder.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.itemLabel.name"),
              rules: tContent("usage.uxWriting.table.itemLabel.format"),
              do: tContent("usage.uxWriting.table.itemLabel.good"),
              dont: tContent("usage.uxWriting.table.itemLabel.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.groupLabel.name"),
              rules: tContent("usage.uxWriting.table.groupLabel.format"),
              do: tContent("usage.uxWriting.table.groupLabel.good"),
              dont: tContent("usage.uxWriting.table.groupLabel.bad"),
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
              <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
                <Select>
                  <SelectTrigger aria-label="Selecionar estado">
                    <SelectValue placeholder={tContent("demonstration.labels.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sp">São Paulo</SelectItem>
                    <SelectItem value="rj">Rio de Janeiro</SelectItem>
                    <SelectItem value="mg">Minas Gerais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ),
            dontPreview: (
              <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
                <Select>
                  <SelectTrigger aria-label="Selecionar estado">
                    <SelectValue placeholder={tContent("demonstration.labels.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sp">SP</SelectItem>
                    <SelectItem value="rj">Rio de Janeiro</SelectItem>
                    <SelectItem value="mg">MG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ),
            doCaption: sanitizeHtml(tContent("doDont.pair1.do")),
            dontCaption: sanitizeHtml(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
                <Select>
                  <SelectTrigger aria-label="Selecionar região">
                    <SelectValue placeholder={tContent("demonstration.labels.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{tContent("demonstration.labels.groupSoutheast")}</SelectLabel>
                      <SelectItem value="sp">São Paulo</SelectItem>
                      <SelectItem value="rj">Rio de Janeiro</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>{tContent("demonstration.labels.groupSouth")}</SelectLabel>
                      <SelectItem value="rs">Rio Grande do Sul</SelectItem>
                      <SelectItem value="sc">Santa Catarina</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            ),
            dontPreview: (
              <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
                <Select>
                  <SelectTrigger aria-label="Selecionar item">
                    <SelectValue placeholder={tContent("demonstration.labels.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{tContent("demonstration.labels.groupSoutheast")}</SelectLabel>
                      <SelectItem value="sp">São Paulo</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>{tContent("demonstration.labels.groupSouth")}</SelectLabel>
                      <SelectItem value="rs">Rio Grande do Sul</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            ),
            doCaption: sanitizeHtml(tContent("doDont.pair2.do")),
            dontCaption: sanitizeHtml(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport title={tContent("import.title")} code={codeImport} />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        componentSlug="select"
        items={[
          {
            name: tContent("variants.items.default"),
            description: stripHtml(tContent("variants.styles.default")),
            code: codeDefault,
            preview: (
              <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
                <Select>
                  <SelectTrigger aria-label="Selecionar estado">
                    <SelectValue placeholder={tContent("demonstration.labels.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sp">São Paulo</SelectItem>
                    <SelectItem value="rj">Rio de Janeiro</SelectItem>
                    <SelectItem value="mg">Minas Gerais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ),
          },
          {
            name: tContent("variants.items.withGroups"),
            description: stripHtml(tContent("variants.styles.withGroups")),
            code: codeWithGroups,
            preview: (
              <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
                <Select>
                  <SelectTrigger aria-label="Selecionar região">
                    <SelectValue placeholder={tContent("demonstration.labels.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{tContent("demonstration.labels.groupSoutheast")}</SelectLabel>
                      <SelectItem value="sp">São Paulo</SelectItem>
                      <SelectItem value="rj">Rio de Janeiro</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>{tContent("demonstration.labels.groupSouth")}</SelectLabel>
                      <SelectItem value="rs">Rio Grande do Sul</SelectItem>
                      <SelectItem value="sc">Santa Catarina</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            ),
          },
          {
            name: tContent("variants.items.withIcon"),
            description: stripHtml(tContent("variants.styles.withIcon")),
            code: codeWithIcon,
            preview: (
              <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
                <Select>
                  <SelectTrigger aria-label="Selecionar canal">
                    <SelectValue placeholder={tContent("demonstration.labels.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <MailIcon /> E-mail
                    </SelectItem>
                    <SelectItem value="phone">
                      <PhoneIcon /> {locale === "en" ? "Phone" : locale === "es" ? "Teléfono" : "Telefone"}
                    </SelectItem>
                    <SelectItem value="chat">
                      <MessageCircleIcon /> Chat
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="select"
        items={[
          {
            name: tContent("variants.compositions.states.name"),
            description: tContent("variants.compositions.states.description"),
            useWhen: tContent("variants.compositions.states.use"),
            code: `<div className="flex flex-col gap-2 w-80">
  <label htmlFor="state" className="text-sm font-semibold">Estado</label>
  <Select>
    <SelectTrigger id="state" aria-label="Estado">
      <SelectValue placeholder="Selecione..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="sp">São Paulo</SelectItem>
      <SelectItem value="rj">Rio de Janeiro</SelectItem>
      <SelectItem value="mg">Minas Gerais</SelectItem>
      <SelectItem value="rs">Rio Grande do Sul</SelectItem>
    </SelectContent>
  </Select>
</div>`,
            preview: (
              <div
                className="flex flex-col gap-2 w-80"
                style={{ contain: "layout", minHeight: 100, position: "relative" }}
              >
                <label htmlFor="comp-state" className="text-sm font-semibold">
                  {tContent("demonstration.labels.stateLabel")}
                </label>
                <Select>
                  <SelectTrigger id="comp-state" aria-label={tContent("demonstration.labels.stateLabel")}>
                    <SelectValue placeholder={tContent("demonstration.labels.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sp">{tContent("demonstration.labels.sp")}</SelectItem>
                    <SelectItem value="rj">{tContent("demonstration.labels.rj")}</SelectItem>
                    <SelectItem value="mg">{tContent("demonstration.labels.mg")}</SelectItem>
                    <SelectItem value="rs">{tContent("demonstration.labels.rs")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.regionGroups.name"),
            description: tContent("variants.compositions.regionGroups.description"),
            useWhen: tContent("variants.compositions.regionGroups.use"),
            code: `<div className="flex flex-col gap-2 w-80">
  <label htmlFor="region" className="text-sm font-semibold">Região</label>
  <Select>
    <SelectTrigger id="region" aria-label="Região">
      <SelectValue placeholder="Selecione..." />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Sudeste</SelectLabel>
        <SelectItem value="sp">São Paulo</SelectItem>
        <SelectItem value="rj">Rio de Janeiro</SelectItem>
        <SelectItem value="mg">Minas Gerais</SelectItem>
        <SelectItem value="es">Espírito Santo</SelectItem>
      </SelectGroup>
      <SelectGroup>
        <SelectLabel>Sul</SelectLabel>
        <SelectItem value="rs">Rio Grande do Sul</SelectItem>
        <SelectItem value="sc">Santa Catarina</SelectItem>
        <SelectItem value="pr">Paraná</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</div>`,
            preview: (
              <div
                className="flex flex-col gap-2 w-80"
                style={{ contain: "layout", minHeight: 100, position: "relative" }}
              >
                <label htmlFor="comp-region" className="text-sm font-semibold">
                  {tContent("demonstration.labels.regionLabel")}
                </label>
                <Select>
                  <SelectTrigger id="comp-region" aria-label={tContent("demonstration.labels.regionLabel")}>
                    <SelectValue placeholder={tContent("demonstration.labels.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{tContent("demonstration.labels.groupSoutheast")}</SelectLabel>
                      <SelectItem value="sp">{tContent("demonstration.labels.sp")}</SelectItem>
                      <SelectItem value="rj">{tContent("demonstration.labels.rj")}</SelectItem>
                      <SelectItem value="mg">{tContent("demonstration.labels.mg")}</SelectItem>
                      <SelectItem value="es">{tContent("demonstration.labels.es")}</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>{tContent("demonstration.labels.groupSouth")}</SelectLabel>
                      <SelectItem value="rs">{tContent("demonstration.labels.rs")}</SelectItem>
                      <SelectItem value="sc">{tContent("demonstration.labels.sc")}</SelectItem>
                      <SelectItem value="pr">{tContent("demonstration.labels.pr")}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.inForm.name"),
            description: tContent("variants.compositions.inForm.description"),
            useWhen: tContent("variants.compositions.inForm.use"),
            code: `<form
  className="flex flex-col gap-4 w-80 p-4 border rounded-lg"
  onSubmit={(e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    console.log("Estado:", data.get("state"));
  }}
>
  <div className="flex flex-col gap-2">
    <label htmlFor="form-state" className="text-sm font-semibold">Estado</label>
    <Select name="state" required>
      <SelectTrigger id="form-state" aria-label="Estado">
        <SelectValue placeholder="Selecione..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="sp">São Paulo</SelectItem>
        <SelectItem value="rj">Rio de Janeiro</SelectItem>
        <SelectItem value="mg">Minas Gerais</SelectItem>
      </SelectContent>
    </Select>
  </div>
  <button type="submit" className="self-end">Continuar</button>
</form>`,
            preview: (
              <form
                className="flex flex-col gap-4 w-80 p-4 border rounded-lg"
                style={{ contain: "layout", minHeight: 180, position: "relative" }}
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="flex flex-col gap-2">
                  <label htmlFor="comp-form-state" className="text-sm font-semibold">
                    {tContent("demonstration.labels.stateLabel")}
                  </label>
                  <Select name="state">
                    <SelectTrigger
                      id="comp-form-state"
                      aria-label={tContent("demonstration.labels.stateLabel")}
                    >
                      <SelectValue placeholder={tContent("demonstration.labels.placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sp">{tContent("demonstration.labels.sp")}</SelectItem>
                      <SelectItem value="rj">{tContent("demonstration.labels.rj")}</SelectItem>
                      <SelectItem value="mg">{tContent("demonstration.labels.mg")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <button
                  type="submit"
                  className="self-end inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium"
                >
                  {locale === "en" ? "Continue" : locale === "es" ? "Continuar" : "Continuar"}
                </button>
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
            label: tContent("states.items.open"),
            trigger: 'data-state="open"',
            behavior: stripHtml(tContent("states.descriptions.open")),
          },
          {
            label: tContent("states.items.selected"),
            trigger: "data-checked",
            behavior: stripHtml(tContent("states.descriptions.selected")),
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
                name: "size",
                type: tContent("props.table.size.type"),
                defaultValue: tContent("props.table.size.default"),
                required: tContent("props.table.size.required"),
                description: stripHtml(tContent("props.table.size.description")),
              },
              {
                name: "placeholder",
                type: tContent("props.table.placeholder.type"),
                defaultValue: tContent("props.table.placeholder.default"),
                required: tContent("props.table.placeholder.required"),
                description: stripHtml(tContent("props.table.placeholder.description")),
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
          { token: "--popover", value: tContent("tokens.table.popover.class"), description: tContent("tokens.table.popover.part") },
          { token: "--popover-foreground", value: tContent("tokens.table.popoverForeground.class"), description: tContent("tokens.table.popoverForeground.part") },
          { token: "--accent", value: tContent("tokens.table.accent.class"), description: tContent("tokens.table.accent.part") },
          { token: "--accent-foreground", value: tContent("tokens.table.accentForeground.class"), description: tContent("tokens.table.accentForeground.part") },
          { token: "--ring", value: tContent("tokens.table.ring.class"), description: tContent("tokens.table.ring.part") },
          { token: "--destructive", value: tContent("tokens.table.destructive.class"), description: tContent("tokens.table.destructive.part") },
          { token: "--muted-foreground", value: tContent("tokens.table.mutedForeground.class"), description: tContent("tokens.table.mutedForeground.part") },
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
          { key: "Enter", description: stripHtml(tContent("accessibility.keyboard.enter")) },
          { key: "Space", description: stripHtml(tContent("accessibility.keyboard.space")) },
          { key: "↓ ArrowDown", description: stripHtml(tContent("accessibility.keyboard.arrowDown")) },
          { key: "↑ ArrowUp", description: stripHtml(tContent("accessibility.keyboard.arrowUp")) },
          { key: "Home", description: stripHtml(tContent("accessibility.keyboard.home")) },
          { key: "End", description: stripHtml(tContent("accessibility.keyboard.end")) },
          { key: "Esc", description: stripHtml(tContent("accessibility.keyboard.escape")) },
          { key: "A–Z", description: stripHtml(tContent("accessibility.keyboard.typeAhead")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="select"
        items={[
          {
            name: tContent("related.items.combobox.name"),
            description: tContent("related.items.combobox.description"),
            path: "?path=/docs/ui-combobox--docs",
          },
          {
            name: tContent("related.items.radioGroup.name"),
            description: tContent("related.items.radioGroup.description"),
            path: "?path=/docs/ui-radiogroup--docs",
          },
          {
            name: tContent("related.items.dropdownMenu.name"),
            description: tContent("related.items.dropdownMenu.description"),
            path: "?path=/docs/ui-dropdownmenu--docs",
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
        componentSlug="select"
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
            event: "option_select",
            trigger: tContent("analytics.table.option_select.trigger"),
            payload: tContent("analytics.table.option_select.payload"),
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
          items: [1, 2, 3, 4, 5].map((i) => ({
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

export default SelectDocs;
