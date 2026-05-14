import { useCallback, useEffect, useMemo } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import aspectRatioTranslations from "@shared/content/aspect-ratio/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsVariants }      from "@/components/docs/shared/sections/DocsVariants";
import { DocsStates }        from "@/components/docs/shared/sections/DocsStates";
import { DocsProps }         from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens }        from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated }       from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes }         from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics }     from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes }        from "@/components/docs/shared/sections/DocsTestes";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

const LANDSCAPE_SRC =
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=1200&q=80";
const PRODUCT_SRC =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80";
const SQUARE_SRC =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80";
const PORTRAIT_SRC =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80";

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


// ─── Componente principal ─────────────────────────────────────────────────────

export function AspectRatioDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(aspectRatioTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "aspect-ratio",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "aspect-ratio",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "aspect-ratio",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImportBasic = `import { AspectRatio } from "@/components/ui/aspect-ratio";`;

  const codeImportWithFallback = `import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";`;

  const codeSixteenNine = `<AspectRatio ratio={16 / 9}>
  <img
    src="/hero.jpg"
    alt="Paisagem ao entardecer"
    className="rounded-md object-cover w-full h-full"
  />
</AspectRatio>`;

  const codeFourThree = `<AspectRatio ratio={4 / 3}>
  <img
    src="/produto.jpg"
    alt="Tênis de corrida"
    className="rounded-md object-cover w-full h-full"
  />
</AspectRatio>`;

  const codeSquare = `<AspectRatio ratio={1}>
  <img
    src="/avatar.jpg"
    alt="Avatar de Maria Silva"
    className="rounded-md object-cover w-full h-full"
  />
</AspectRatio>`;

  const codeThreeFour = `<AspectRatio ratio={3 / 4}>
  <img
    src="/capa.jpg"
    alt="Capa do livro O Pequeno Príncipe"
    className="rounded-md object-cover w-full h-full"
  />
</AspectRatio>`;

  const codeUltraWide = `<AspectRatio ratio={21 / 9}>
  <img
    src="/panoramica.jpg"
    alt="Panorâmica da cordilheira"
    className="rounded-md object-cover w-full h-full"
  />
</AspectRatio>`;

  const codeCustomizationTokens = `/* Aplicar tokens ao filho, nunca ao wrapper */
<AspectRatio ratio={16 / 9}>
  <img
    className="rounded-md object-cover w-full h-full"
    src="..."
    alt="..."
  />
</AspectRatio>`;

  const structureCode = `AspectRatio (ratio)
├── div (wrapper com padding-bottom calculado)
│   └── div (inner absolute inset-0)
│       └── [children] — img | video | iframe`;

  const interfaceCode = `// AspectRatio (Radix)
interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio?: number;        // largura / altura — padrão 1
  asChild?: boolean;     // mescla props no primeiro filho
  children?: React.ReactNode;
}`;

  // ─── Previews reutilizáveis ─────────────────────────────────────────────────

  const renderRatioDemo = (
    ratio: number,
    src: string,
    alt: string,
    className = ""
  ) => (
    <AspectRatio ratio={ratio} className={className}>
      <ImageWithFallback
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="rounded-md object-cover w-full h-full"
      />
    </AspectRatio>
  );

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
          installNote="npx shadcn@latest add aspect-ratio"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {tContent("demonstration.labels.sixteenNine")}
            </p>
            {renderRatioDemo(16 / 9, LANDSCAPE_SRC, "Paisagem ao entardecer")}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {tContent("demonstration.labels.fourThree")}
            </p>
            {renderRatioDemo(4 / 3, PRODUCT_SRC, "Tênis de corrida")}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {tContent("demonstration.labels.square")}
            </p>
            <div className="max-w-[220px]">
              {renderRatioDemo(1, SQUARE_SRC, "Avatar de Maria Silva")}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {tContent("demonstration.labels.threeFour")}
            </p>
            <div className="max-w-[260px]">
              {renderRatioDemo(3 / 4, PORTRAIT_SRC, "Capa de retrato vertical")}
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
        ]}
        structureCode={structureCode}
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
            tContent("usage.guidelines.item5"),
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
            { s: tContent("usage.scenarios.item1.s"), u: tContent("usage.scenarios.item1.u"), a: stripHtml(tContent("usage.scenarios.item1.a")) },
            { s: tContent("usage.scenarios.item2.s"), u: tContent("usage.scenarios.item2.u"), a: tContent("usage.scenarios.item2.a") },
            { s: tContent("usage.scenarios.item3.s"), u: tContent("usage.scenarios.item3.u"), a: tContent("usage.scenarios.item3.a") },
            { s: tContent("usage.scenarios.item4.s"), u: tContent("usage.scenarios.item4.u"), a: tContent("usage.scenarios.item4.a") },
            { s: tContent("usage.scenarios.item5.s"), u: tContent("usage.scenarios.item5.u"), a: tContent("usage.scenarios.item5.a") },
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
              <AspectRatio ratio={16 / 9}>
                <ImageWithFallback
                  src={LANDSCAPE_SRC}
                  alt="Paisagem ao entardecer"
                  loading="lazy"
                  decoding="async"
                  className="rounded-md object-cover w-full h-full"
                />
              </AspectRatio>
            ),
            dontPreview: (
              <AspectRatio ratio={16 / 9}>
                <ImageWithFallback
                  src={LANDSCAPE_SRC}
                  alt="Paisagem ao entardecer"
                  loading="lazy"
                  decoding="async"
                  className="rounded-md object-contain w-full h-full bg-muted"
                />
              </AspectRatio>
            ),
            doCaption: stripHtml(tContent("doDont.pair1.do")),
            dontCaption: stripHtml(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <AspectRatio ratio={4 / 3}>
                <ImageWithFallback
                  src={PRODUCT_SRC}
                  alt="Tênis de corrida"
                  loading="lazy"
                  decoding="async"
                  className="rounded-md object-cover w-full h-full"
                />
              </AspectRatio>
            ),
            dontPreview: (
              <AspectRatio ratio={4 / 3} className="rounded-md overflow-hidden border">
                <ImageWithFallback
                  src={PRODUCT_SRC}
                  alt="Tênis de corrida"
                  loading="lazy"
                  decoding="async"
                  className="object-cover w-full h-full"
                />
              </AspectRatio>
            ),
            doCaption: stripHtml(tContent("doDont.pair2.do")),
            dontCaption: stripHtml(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        code={codeImportBasic}
        secondaryCode={codeImportWithFallback}
      />

      {/* ── Variantes (Ratios Canônicos) ──────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        items={[
          {
            name: "16 / 9",
            description: tContent("variants.items.sixteenNine"),
            code: codeSixteenNine,
            preview: (
              <div className="w-full max-w-md">
                {renderRatioDemo(16 / 9, LANDSCAPE_SRC, "Paisagem ao entardecer")}
              </div>
            ),
          },
          {
            name: "4 / 3",
            description: tContent("variants.items.fourThree"),
            code: codeFourThree,
            preview: (
              <div className="w-full max-w-sm">
                {renderRatioDemo(4 / 3, PRODUCT_SRC, "Tênis de corrida")}
              </div>
            ),
          },
          {
            name: "1 / 1",
            description: tContent("variants.items.square"),
            code: codeSquare,
            preview: (
              <div className="w-56">
                {renderRatioDemo(1, SQUARE_SRC, "Avatar de Maria Silva")}
              </div>
            ),
          },
          {
            name: "3 / 4",
            description: tContent("variants.items.threeFour"),
            code: codeThreeFour,
            preview: (
              <div className="w-60">
                {renderRatioDemo(3 / 4, PORTRAIT_SRC, "Capa de retrato vertical")}
              </div>
            ),
          },
          {
            name: "21 / 9",
            description: tContent("variants.items.ultraWide"),
            code: codeUltraWide,
            preview: (
              <div className="w-full max-w-xl">
                {renderRatioDemo(21 / 9, LANDSCAPE_SRC, "Panorâmica da cordilheira")}
              </div>
            ),
          },
        ]}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: locale === "en" ? "State" : locale === "es" ? "Estado" : "Estado",
          trigger: locale === "en" ? "Trigger" : locale === "es" ? "Disparo" : "Disparo",
          behavior: locale === "en" ? "Behavior" : locale === "es" ? "Comportamiento" : "Comportamento",
        }}
        items={[
          {
            label: tContent("states.item1.label"),
            trigger: tContent("states.item1.trigger"),
            behavior: tContent("states.item1.behavior"),
          },
          {
            label: tContent("states.item2.label"),
            trigger: tContent("states.item2.trigger"),
            behavior: tContent("states.item2.behavior"),
          },
          {
            label: tContent("states.item3.label"),
            trigger: tContent("states.item3.trigger"),
            behavior: stripHtml(tContent("states.item3.behavior")),
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
                name: "ratio",
                type: "number",
                defaultValue: "1",
                required: "Não",
                description: stripHtml(tContent("props.table.ratio")),
              },
              {
                name: "children",
                type: "React.ReactNode",
                defaultValue: "—",
                required: "Sim",
                description: stripHtml(tContent("props.table.children")),
              },
              {
                name: "asChild",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: stripHtml(tContent("props.table.asChild")),
              },
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: stripHtml(tContent("props.table.className")),
              },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibility")}
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
          { token: "--radius", value: "rounded-md", description: tContent("tokens.table.radius") },
          { token: "--border", value: "border border-border", description: tContent("tokens.table.border") },
          { token: "--muted", value: "bg-muted", description: tContent("tokens.table.muted") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeCustomizationTokens}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[
          tContent("accessibility.aria.item1"),
          tContent("accessibility.aria.item2"),
          tContent("accessibility.aria.item3"),
          tContent("accessibility.aria.item4"),
          tContent("accessibility.aria.item5"),
        ]}
        keyboardTitle={tContent("accessibility.keyboard.title")}
        keyboardItems={[
          { key: "—", description: tContent("accessibility.keyboard.item1") },
          { key: "Tab", description: tContent("accessibility.keyboard.note") },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: "Card",
            description: tContent("related.card"),
            path: "?path=/docs/ui-card--docs",
          },
          {
            name: "Avatar",
            description: tContent("related.avatar"),
            path: "?path=/docs/ui-avatar--docs",
          },
          {
            name: "Skeleton",
            description: tContent("related.skeleton"),
            path: "?path=/docs/ui-skeleton--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
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
            event: "—",
            trigger: tContent("analytics.note"),
            payload: "—",
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
              action: stripHtml(tContent("testes.functional.item1.action")),
              result: stripHtml(tContent("testes.functional.item1.result")),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item1.priority")] ?? "common.high"),
            },
            {
              action: stripHtml(tContent("testes.functional.item2.action")),
              result: stripHtml(tContent("testes.functional.item2.result")),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item2.priority")] ?? "common.high"),
            },
            {
              action: stripHtml(tContent("testes.functional.item3.action")),
              result: tContent("testes.functional.item3.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item3.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item4.action"),
              result: tContent("testes.functional.item4.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item4.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item5.action"),
              result: tContent("testes.functional.item5.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item5.priority")] ?? "common.medium"),
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
            {
              criterion: stripHtml(tContent("testes.accessibility.item1.criterion")),
              level: tContent("testes.accessibility.item1.level"),
              how: tContent("testes.accessibility.item1.how"),
            },
            {
              criterion: stripHtml(tContent("testes.accessibility.item2.criterion")),
              level: tContent("testes.accessibility.item2.level"),
              how: tContent("testes.accessibility.item2.how"),
            },
            {
              criterion: stripHtml(tContent("testes.accessibility.item3.criterion")),
              level: tContent("testes.accessibility.item3.level"),
              how: tContent("testes.accessibility.item3.how"),
            },
            {
              criterion: tContent("testes.accessibility.item4.criterion"),
              level: tContent("testes.accessibility.item4.level"),
              how: stripHtml(tContent("testes.accessibility.item4.how")),
            },
            {
              criterion: tContent("testes.accessibility.item5.criterion"),
              level: tContent("testes.accessibility.item5.level"),
              how: tContent("testes.accessibility.item5.how"),
            },
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
            { story: tContent("testes.visual.item5.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item5.priority")] ?? "common.medium") },
          ],
        }}
      />
    </DocsPageLayout>
  );
}

export default AspectRatioDocs;
