import { useCallback, useEffect, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import DOMPurify from 'dompurify';
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import popoverTranslations from "@shared/content/popover/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsVariants }      from "@/components/docs/shared/sections/DocsVariants";
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

// ─── Componente principal ─────────────────────────────────────────────────────

export function PopoverDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(popoverTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = useMemo(
    () =>
      Object.values(
        (popoverTranslations as unknown as Record<
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
    componentSlug: "popover",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/overlay" },
      { name: tContent("title") },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "popover",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "popover",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImport = `import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "@/components/ui/popover";`;

  const structureCode = tContent("anatomy.structureCode");

  const codeDefault = `<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Abrir popover</Button>
  </PopoverTrigger>
  <PopoverContent>
    <p className="nds-text-body">Conteúdo livre.</p>
  </PopoverContent>
</Popover>`;

  const codeWithTitle = `<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Configurações</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Configurações de exibição</PopoverTitle>
      <PopoverDescription>
        Ajuste a aparência do conteúdo da página.
      </PopoverDescription>
    </PopoverHeader>
  </PopoverContent>
</Popover>`;

  const codeForm = `<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Editar perfil</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Editar perfil</PopoverTitle>
    </PopoverHeader>
    <form className="nds-stack" data-spacing="sm">
      <Label htmlFor="name">Nome</Label>
      <Input id="name" />
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" />
      <Button type="submit">Atualizar</Button>
    </form>
  </PopoverContent>
</Popover>`;

  const interfaceCode = `// Popover (base-ui/react/popover)
interface PopoverRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
}

interface PopoverContentProps {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  className?: string;
}`;

  // ─── Locale-aware column labels ─────────────────────────────────────────────

  const analyticsCols = {
    event: tContent("analytics.table.event"),
    trigger: toPlainText(tContent("analytics.table.trigger")),
    payload: tContent("analytics.table.payload"),
  };

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="popover"
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
        <div
          className="nds-grid nds-w-full"
          data-cols="3"
          data-spacing="lg"
          style={{ contain: "layout", minHeight: 180 }}
        >
          {/* Default */}
          <div
            className="nds-stack"
            data-spacing="xs"
            style={{ contain: "layout", minHeight: 120, position: "relative" }}
          >
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {tContent("variants.items.default")}
            </p>
            <Popover
              onOpenChange={(open) =>
                track(open ? "popover_open" : "popover_close", {
                  component: "popover",
                  ...(open ? { trigger_label: "trigger" } : { reason: "user" }),
                  location: "docs_demo",
                })
              }
            >
              <PopoverTrigger asChild>
                <Button variant="outline">
                  {tContent("demonstration.labels.trigger")}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverTitle className="nds-text-body nds-font-medium">
                  {tContent("demonstration.labels.title")}
                </PopoverTitle>
                <p className="nds-text-caption nds-text-muted-foreground">
                  {tContent("demonstration.labels.description")}
                </p>
              </PopoverContent>
            </Popover>
          </div>

          {/* With title */}
          <div
            className="nds-stack"
            data-spacing="xs"
            style={{ contain: "layout", minHeight: 120, position: "relative" }}
          >
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {tContent("variants.items.withTitle")}
            </p>
            <Popover
              onOpenChange={(open) =>
                track(open ? "popover_open" : "popover_close", {
                  component: "popover",
                  ...(open ? { trigger_label: "title" } : { reason: "user" }),
                  location: "docs_demo",
                })
              }
            >
              <PopoverTrigger asChild>
                <Button variant="outline">
                  {tContent("demonstration.labels.title")}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverHeader>
                  <PopoverTitle>
                    {tContent("demonstration.labels.title")}
                  </PopoverTitle>
                  <PopoverDescription>
                    {tContent("demonstration.labels.description")}
                  </PopoverDescription>
                </PopoverHeader>
                <div className="nds-cluster" data-spacing="xs" data-justify="end">
                  <Button variant="ghost" size="sm">
                    {tContent("demonstration.labels.cancel")}
                  </Button>
                  <Button size="sm">
                    {tContent("demonstration.labels.save")}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Form */}
          <div
            className="nds-stack"
            data-spacing="xs"
            style={{ contain: "layout", minHeight: 120, position: "relative" }}
          >
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {tContent("variants.items.form")}
            </p>
            <Popover
              onOpenChange={(open) =>
                track(open ? "popover_open" : "popover_close", {
                  component: "popover",
                  ...(open ? { trigger_label: "trigger" } : { reason: "user" }),
                  location: "docs_demo",
                })
              }
            >
              <PopoverTrigger asChild>
                <Button variant="outline">
                  {tContent("demonstration.labels.form.trigger")}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverHeader>
                  <PopoverTitle>
                    {tContent("demonstration.labels.form.trigger")}
                  </PopoverTitle>
                </PopoverHeader>
                <form
                  className="nds-stack"
                  data-spacing="sm"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <Label htmlFor="popover-demo-name" className="nds-text-caption">
                    {tContent("demonstration.labels.form.name")}
                  </Label>
                  <Input id="popover-demo-name" defaultValue="Joana" />
                  <Label htmlFor="popover-demo-email" className="nds-text-caption">
                    {tContent("demonstration.labels.form.email")}
                  </Label>
                  <Input
                    id="popover-demo-email"
                    type="email"
                    defaultValue="joana@example.com"
                  />
                  <Button type="submit" size="sm" className="nds-mt-1">
                    {tContent("demonstration.labels.form.submit")}
                  </Button>
                </form>
              </PopoverContent>
            </Popover>
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
        structureCode={structureCode}
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
              element: tContent("usage.uxWriting.table.title.name"),
              rules: tContent("usage.uxWriting.table.title.format"),
              do: tContent("usage.uxWriting.table.title.good"),
              dont: tContent("usage.uxWriting.table.title.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.description.name"),
              rules: tContent("usage.uxWriting.table.description.format"),
              do: tContent("usage.uxWriting.table.description.good"),
              dont: tContent("usage.uxWriting.table.description.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.trigger.name"),
              rules: tContent("usage.uxWriting.table.trigger.format"),
              do: tContent("usage.uxWriting.table.trigger.good"),
              dont: tContent("usage.uxWriting.table.trigger.bad"),
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
              <div className="nds-text-body nds-stack" data-spacing="xs">
                <div className="nds-font-medium">
                  {tContent("demonstration.labels.title")}
                </div>
                <div className="nds-text-caption nds-text-muted-foreground">
                  {tContent("demonstration.labels.description")}
                </div>
              </div>
            ),
            dontPreview: (
              <div className="nds-text-body">
                <div className="nds-text-caption nds-text-muted-foreground nds-italic">
                  (sem PopoverTitle)
                </div>
                <div>{tContent("demonstration.labels.description")}</div>
              </div>
            ),
            doCaption: DOMPurify.sanitize(tContent("doDont.pair1.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="nds-text-body nds-font-medium">
                {tContent("demonstration.labels.form.trigger")}
              </div>
            ),
            dontPreview: (
              <div className="nds-text-body nds-font-medium nds-italic nds-text-muted-foreground">
                {locale === "en"
                  ? "Click here"
                  : locale === "es"
                  ? "Haz clic aquí"
                  : "Clique aqui"}
              </div>
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
        componentSlug="popover"
        items={[
          {
            name: tContent("variants.items.default"),
            description: stripHtml(tContent("variants.styles.default")),
            code: codeDefault,
            preview: (
              <div
                style={{ contain: "layout", minHeight: 60, position: "relative" }}
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      {tContent("demonstration.labels.trigger")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverTitle className="nds-text-body nds-font-medium">
                      {tContent("demonstration.labels.title")}
                    </PopoverTitle>
                    <p className="nds-text-caption nds-text-muted-foreground">
                      {tContent("demonstration.labels.description")}
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
            ),
          },
          {
            name: tContent("variants.items.withTitle"),
            description: stripHtml(tContent("variants.styles.withTitle")),
            code: codeWithTitle,
            preview: (
              <div
                style={{ contain: "layout", minHeight: 60, position: "relative" }}
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      {tContent("demonstration.labels.title")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverHeader>
                      <PopoverTitle>
                        {tContent("demonstration.labels.title")}
                      </PopoverTitle>
                      <PopoverDescription>
                        {tContent("demonstration.labels.description")}
                      </PopoverDescription>
                    </PopoverHeader>
                  </PopoverContent>
                </Popover>
              </div>
            ),
          },
          {
            name: tContent("variants.items.form"),
            description: stripHtml(tContent("variants.styles.form")),
            code: codeForm,
            preview: (
              <div
                style={{ contain: "layout", minHeight: 60, position: "relative" }}
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      {tContent("demonstration.labels.form.trigger")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverHeader>
                      <PopoverTitle>
                        {tContent("demonstration.labels.form.trigger")}
                      </PopoverTitle>
                    </PopoverHeader>
                    <form
                      className="nds-stack"
                      data-spacing="sm"
                      onSubmit={(e) => e.preventDefault()}
                    >
                      <Label htmlFor="popover-var-name" className="nds-text-caption">
                        {tContent("demonstration.labels.form.name")}
                      </Label>
                      <Input id="popover-var-name" defaultValue="Joana" />
                      <Button type="submit" size="sm">
                        {tContent("demonstration.labels.form.submit")}
                      </Button>
                    </form>
                  </PopoverContent>
                </Popover>
              </div>
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="popover"
        items={[
          {
            name: tContent("variants.compositions.editProfile.name"),
            description: tContent("variants.compositions.editProfile.description"),
            useWhen: tContent("variants.compositions.editProfile.use"),
            code: `<Popover defaultOpen>
  <PopoverTrigger asChild>
    <Button variant="outline">Editar perfil</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Dados do perfil</PopoverTitle>
      <PopoverDescription>
        As mudanças são salvas ao confirmar.
      </PopoverDescription>
    </PopoverHeader>
    <form
      className="nds-stack"
      data-spacing="sm"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="nds-stack" data-spacing="xs">
        <Label htmlFor="pc-name">Nome</Label>
        <Input id="pc-name" defaultValue="Joana Silva" />
      </div>
      <div className="nds-stack" data-spacing="xs">
        <Label htmlFor="pc-email">Email</Label>
        <Input id="pc-email" type="email" defaultValue="joana@example.com" />
      </div>
      <Button type="submit" size="sm">Atualizar</Button>
    </form>
  </PopoverContent>
</Popover>`,
            preview: (
              <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      {tContent("demonstration.labels.form.trigger")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverHeader>
                      <PopoverTitle>
                        {tContent("demonstration.labels.form.trigger")}
                      </PopoverTitle>
                    </PopoverHeader>
                    <form
                      className="nds-stack"
                      data-spacing="xs"
                      onSubmit={(e) => e.preventDefault()}
                    >
                      <div className="nds-stack" data-spacing="xs">
                        <Label htmlFor="pc-name" className="nds-text-caption">
                          {tContent("demonstration.labels.form.name")}
                        </Label>
                        <Input id="pc-name" defaultValue="Joana Silva" />
                      </div>
                      <div className="nds-stack" data-spacing="xs">
                        <Label htmlFor="pc-email" className="nds-text-caption">
                          {tContent("demonstration.labels.form.email")}
                        </Label>
                        <Input id="pc-email" type="email" defaultValue="joana@example.com" />
                      </div>
                      <Button type="submit" size="sm">
                        {tContent("demonstration.labels.form.submit")}
                      </Button>
                    </form>
                  </PopoverContent>
                </Popover>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.tableFilter.name"),
            description: tContent("variants.compositions.tableFilter.description"),
            useWhen: tContent("variants.compositions.tableFilter.use"),
            code: `<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Filtros</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Filtrar por status</PopoverTitle>
    </PopoverHeader>
    <div className="nds-stack" data-spacing="xs">
      <label className="nds-cluster nds-text-body" data-spacing="xs">
        <input type="checkbox" defaultChecked className="nds-icon-sm" />
        Ativo
      </label>
      <label className="nds-cluster nds-text-body" data-spacing="xs">
        <input type="checkbox" className="nds-icon-sm" />
        Pendente
      </label>
      <label className="nds-cluster nds-text-body" data-spacing="xs">
        <input type="checkbox" className="nds-icon-sm" />
        Arquivado
      </label>
    </div>
    <div className="nds-cluster nds-pt-2" data-spacing="xs" data-justify="end">
      <Button variant="ghost" size="sm">Limpar</Button>
      <Button size="sm">Aplicar</Button>
    </div>
  </PopoverContent>
</Popover>`,
            preview: (
              <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">Filtros</Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverHeader>
                      <PopoverTitle>Filtrar por status</PopoverTitle>
                    </PopoverHeader>
                    <div className="nds-stack" data-spacing="xs">
                      {["Ativo", "Pendente", "Arquivado"].map((opt) => (
                        <label key={opt} className="nds-cluster nds-text-body" data-spacing="xs">
                          <input
                            type="checkbox"
                            defaultChecked={opt === "Ativo"}
                            className="nds-icon-sm"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                    <div className="nds-cluster nds-pt-2" data-spacing="xs" data-justify="end">
                      <Button variant="ghost" size="sm">Limpar</Button>
                      <Button size="sm">Aplicar</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.colorPicker.name"),
            description: tContent("variants.compositions.colorPicker.description"),
            useWhen: tContent("variants.compositions.colorPicker.use"),
            code: `<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Cor</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Selecionar cor</PopoverTitle>
    </PopoverHeader>
    <div className="nds-grid" data-cols="6" data-spacing="xs">
      {[
        { name: "Vermelho", color: "#ef4444" },
        { name: "Laranja",  color: "#f97316" },
        { name: "Amarelo",  color: "#eab308" },
        { name: "Verde",    color: "#22c55e" },
        { name: "Azul",     color: "#3b82f6" },
        { name: "Roxo",     color: "#a855f7" },
      ].map((s) => (
        <button
          key={s.name}
          type="button"
          aria-label={s.name}
          className="nds-rounded-full nds-size-6"
          style={{ background: s.color }}
        />
      ))}
    </div>
  </PopoverContent>
</Popover>`,
            preview: (
              <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">Cor</Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverHeader>
                      <PopoverTitle>Selecionar cor</PopoverTitle>
                    </PopoverHeader>
                    <div className="nds-grid" data-cols="6" data-spacing="xs">
                      {[
                        { name: "Vermelho", color: "#ef4444" },
                        { name: "Laranja", color: "#f97316" },
                        { name: "Amarelo", color: "#eab308" },
                        { name: "Verde", color: "#22c55e" },
                        { name: "Azul", color: "#3b82f6" },
                        { name: "Roxo", color: "#a855f7" },
                      ].map((s) => (
                        <button
                          key={s.name}
                          type="button"
                          aria-label={s.name}
                          className="nds-rounded-full nds-size-6"
                          style={{
                            background: s.color,
                            boxShadow: "0 0 0 1px color-mix(in oklch, var(--foreground) 10%, transparent)",
                          }}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.quickSettings.name"),
            description: tContent("variants.compositions.quickSettings.description"),
            useWhen: tContent("variants.compositions.quickSettings.use"),
            code: `<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Configurações</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Preferências rápidas</PopoverTitle>
    </PopoverHeader>
    <div className="nds-stack" data-spacing="sm">
      <div className="nds-cluster" data-spacing="sm" data-justify="between">
        <Label htmlFor="cfg-notifs">Notificações</Label>
        <input id="cfg-notifs" type="checkbox" defaultChecked className="nds-icon-sm" />
      </div>
      <div className="nds-cluster" data-spacing="sm" data-justify="between">
        <Label htmlFor="cfg-dark">Modo escuro</Label>
        <input id="cfg-dark" type="checkbox" className="nds-icon-sm" />
      </div>
      <div className="nds-cluster" data-spacing="sm" data-justify="between">
        <Label htmlFor="cfg-compact">Modo compacto</Label>
        <input id="cfg-compact" type="checkbox" className="nds-icon-sm" />
      </div>
    </div>
  </PopoverContent>
</Popover>`,
            preview: (
              <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">Configurações</Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverHeader>
                      <PopoverTitle>Preferências rápidas</PopoverTitle>
                    </PopoverHeader>
                    <div className="nds-stack" data-spacing="sm">
                      {[
                        { id: "cfg-notifs", label: "Notificações", checked: true },
                        { id: "cfg-dark", label: "Modo escuro", checked: false },
                        { id: "cfg-compact", label: "Modo compacto", checked: false },
                      ].map((t) => (
                        <div key={t.id} className="nds-cluster" data-spacing="sm" data-justify="between">
                          <Label htmlFor={t.id}>{t.label}</Label>
                          <input
                            id={t.id}
                            type="checkbox"
                            defaultChecked={t.checked}
                            className="nds-icon-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            ),
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
            label: tContent("states.closed.label"),
            trigger: toPlainText(tContent("states.closed.trigger")),
            behavior: toPlainText(tContent("states.closed.behavior")),
          },
          {
            label: tContent("states.open.label"),
            trigger: toPlainText(tContent("states.open.trigger")),
            behavior: toPlainText(tContent("states.open.behavior")),
          },
          {
            label: tContent("states.transitioning.label"),
            trigger: toPlainText(tContent("states.transitioning.trigger")),
            behavior: toPlainText(tContent("states.transitioning.behavior")),
          },
          {
            label: tContent("states.focused.label"),
            trigger: toPlainText(tContent("states.focused.trigger")),
            behavior: toPlainText(tContent("states.focused.behavior")),
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
                name: "open",
                type: tContent("props.table.open.type"),
                defaultValue: tContent("props.table.open.default"),
                required: tContent("props.table.open.required"),
                description: toPlainText(tContent("props.table.open.description")),
              },
              {
                name: "defaultOpen",
                type: tContent("props.table.defaultOpen.type"),
                defaultValue: tContent("props.table.defaultOpen.default"),
                required: tContent("props.table.defaultOpen.required"),
                description: toPlainText(tContent("props.table.defaultOpen.description")),
              },
              {
                name: "onOpenChange",
                type: tContent("props.table.onOpenChange.type"),
                defaultValue: tContent("props.table.onOpenChange.default"),
                required: tContent("props.table.onOpenChange.required"),
                description: toPlainText(tContent("props.table.onOpenChange.description")),
              },
              {
                name: "modal",
                type: tContent("props.table.modal.type"),
                defaultValue: tContent("props.table.modal.default"),
                required: tContent("props.table.modal.required"),
                description: toPlainText(tContent("props.table.modal.description")),
              },
              {
                name: "side",
                type: tContent("props.table.side.type"),
                defaultValue: tContent("props.table.side.default"),
                required: tContent("props.table.side.required"),
                description: toPlainText(tContent("props.table.side.description")),
              },
              {
                name: "align",
                type: tContent("props.table.align.type"),
                defaultValue: tContent("props.table.align.default"),
                required: tContent("props.table.align.required"),
                description: toPlainText(tContent("props.table.align.description")),
              },
              {
                name: "sideOffset",
                type: tContent("props.table.sideOffset.type"),
                defaultValue: tContent("props.table.sideOffset.default"),
                required: tContent("props.table.sideOffset.required"),
                description: toPlainText(tContent("props.table.sideOffset.description")),
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
            token: "--popover",
            value: tContent("tokens.table.popover.class"),
            description: tContent("tokens.table.popover.part"),
          },
          {
            token: "--popover-foreground",
            value: tContent("tokens.table.popoverForeground.class"),
            description: tContent("tokens.table.popoverForeground.part"),
          },
          {
            token: "--muted-foreground",
            value: tContent("tokens.table.mutedForeground.class"),
            description: tContent("tokens.table.mutedForeground.part"),
          },
          {
            token: "--border",
            value: tContent("tokens.table.border.class"),
            description: tContent("tokens.table.border.part"),
          },
          {
            token: "--elevation-md",
            value: tContent("tokens.table.shadow.class"),
            description: tContent("tokens.table.shadow.part"),
          },
          {
            token: "--ring",
            value: tContent("tokens.table.ring.class"),
            description: tContent("tokens.table.ring.part"),
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
          { key: "Tab", description: toPlainText(tContent("accessibility.keyboard.tab")) },
          { key: "Shift+Tab", description: toPlainText(tContent("accessibility.keyboard.shiftTab")) },
          { key: "Esc", description: toPlainText(tContent("accessibility.keyboard.escape")) },
          { key: "Enter", description: toPlainText(tContent("accessibility.keyboard.enter")) },
          { key: "Space", description: toPlainText(tContent("accessibility.keyboard.space")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="popover"
        items={[
          {
            name: tContent("related.items.tooltip.name"),
            description: toPlainText(tContent("related.items.tooltip.description")),
            path: "?path=/docs/ui-tooltip--docs",
          },
          {
            name: tContent("related.items.dropdownMenu.name"),
            description: toPlainText(tContent("related.items.dropdownMenu.description")),
            path: "?path=/docs/ui-dropdownmenu--docs",
          },
          {
            name: tContent("related.items.dialog.name"),
            description: toPlainText(tContent("related.items.dialog.description")),
            path: "?path=/docs/ui-dialog--docs",
          },
          {
            name: tContent("related.items.hoverCard.name"),
            description: toPlainText(tContent("related.items.hoverCard.description")),
            path: "?path=/docs/ui-hovercard--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="popover"
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
        cols={analyticsCols}
        items={[
          {
            event: "popover_open",
            trigger: toPlainText(tContent("analytics.table.popover_open.trigger")),
            payload: tContent("analytics.table.popover_open.payload"),
          },
          {
            event: "popover_close",
            trigger: toPlainText(tContent("analytics.table.popover_close.trigger")),
            payload: tContent("analytics.table.popover_close.payload"),
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
            { criterion: tContent("testes.accessibility.item1"), level: "AA", how: "axe-core" },
            { criterion: tContent("testes.accessibility.item2"), level: "1.4.3", how: "Contrast checker" },
            { criterion: tContent("testes.accessibility.item3"), level: "2.4.7", how: "Keyboard test" },
            { criterion: tContent("testes.accessibility.item4"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item5"), level: "1.3.1", how: "DevTools a11y tree" },
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

export default PopoverDocs;
