import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import paginationTranslations from "@shared/content/pagination/translations.json";

import {
  DocsHeader,
  DocsPageLayout,
  DocsDemonstration,
  DocsAnatomy,
  DocsWhenToUse,
  DocsDoDont,
  DocsImport,
  DocsVariants,
  DocsStates,
  DocsCompositions,
  DocsProps,
  DocsTokens,
  DocsAccessibility,
  DocsRelated,
  DocsNotes,
  DocsAnalytics,
  DocsTestes,
} from "@/components/docs/shared/sections";

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

export function PaginationDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(paginationTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "pagination",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    aiIntent: tContent("seo.aiIntent") as "informational" | "navigational",
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/navigation" },
      { name: tContent("title") },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "pagination",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "pagination",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // Locale-aware labels para os demos (sem mutação de SPA)
  const lblPrev = tContent("demonstration.labels.previous");
  const lblNext = tContent("demonstration.labels.next");
  const lblPage = tContent("demonstration.labels.page");

  // ─── Code strings ────────────────────────────────────────────────────────
  const codeImport = `import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";`;

  const structureCode = tContent("anatomy.structureCode");

  const codeDefault = `<PaginationItem>
  <PaginationLink href="#" aria-label="${lblPage} 2">2</PaginationLink>
</PaginationItem>`;

  const codeActive = `<PaginationItem>
  <PaginationLink href="#" isActive aria-label="${lblPage} 1">
    1
  </PaginationLink>
</PaginationItem>`;

  const codeDirectional = `<PaginationItem>
  <PaginationPrevious href="#" text="${lblPrev}" />
</PaginationItem>
<PaginationItem>
  <PaginationNext href="#" text="${lblNext}" />
</PaginationItem>`;

  const interfaceCode = `// PaginationLink
type PaginationLinkProps = {
  isActive?: boolean;                              // default false
  size?: "default" | "sm" | "lg" | "icon";         // default "icon"
} & React.ComponentProps<"a">;

// PaginationPrevious / PaginationNext
type PaginationDirectionalProps =
  React.ComponentProps<typeof PaginationLink> & {
    text?: string;  // "Previous" / "Next"
  };

// Pagination, PaginationContent, PaginationItem, PaginationEllipsis
// herdam React.ComponentProps<"nav" | "ul" | "li" | "span">`;

  // ─── Locale-aware column labels ──────────────────────────────────────────
  const stateCols = {
    state: locale === "en" ? "State" : "Estado",
    trigger: locale === "en" ? "Trigger" : "Disparo",
    behavior:
      locale === "en"
        ? "Behavior"
        : locale === "es"
        ? "Comportamiento"
        : "Comportamento",
  };

  const analyticsCols = {
    event: locale === "en" ? "Event" : "Evento",
    trigger: locale === "en" ? "Trigger" : "Disparo",
    payload: "Payload",
  };

  // ─── Demo state ──────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [compPage, setCompPage] = useState(3);
  const compTotal = 8;
  const totalSimple = 5;
  const goTo = (next: number) => {
    setPage(next);
    track("page_change", {
      component: "pagination",
      page: next,
      total_pages: totalSimple,
      location: "docs_demo",
    });
  };

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="pagination"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
          installNote="npx shadcn@latest add pagination"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="space-y-8 w-full">
          {/* Demo 1 — paginação simples interativa */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {locale === "en"
                ? "Simple pagination · 5 pages"
                : locale === "es"
                ? "Paginación simple · 5 páginas"
                : "Paginação simples · 5 páginas"}
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    text={lblPrev}
                    aria-disabled={page === 1}
                    tabIndex={page === 1 ? -1 : 0}
                    className={page === 1 ? "pointer-events-none opacity-50" : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) goTo(page - 1);
                    }}
                  />
                </PaginationItem>
                {Array.from({ length: totalSimple }, (_, i) => i + 1).map((n) => (
                  <PaginationItem key={n}>
                    <PaginationLink
                      href="#"
                      isActive={page === n}
                      aria-label={`${lblPage} ${n}`}
                      onClick={(e) => {
                        e.preventDefault();
                        goTo(n);
                      }}
                    >
                      {n}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    text={lblNext}
                    aria-disabled={page === totalSimple}
                    tabIndex={page === totalSimple ? -1 : 0}
                    className={
                      page === totalSimple ? "pointer-events-none opacity-50" : ""
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalSimple) goTo(page + 1);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          {/* Demo 2 — com ellipsis */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {locale === "en"
                ? "Long list with ellipsis · 12 pages"
                : locale === "es"
                ? "Lista larga con ellipsis · 12 páginas"
                : "Lista longa com ellipsis · 12 páginas"}
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" text={lblPrev} />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" aria-label={`${lblPage} 1`}>
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" aria-label={`${lblPage} 5`}>
                    5
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    isActive
                    aria-label={`${lblPage} 6`}
                  >
                    6
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" aria-label={`${lblPage} 7`}>
                    7
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" aria-label={`${lblPage} 12`}>
                    12
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" text={lblNext} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          {/* Demo 3 — última página, Next desabilitado */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {locale === "en"
                ? "Last page · Next disabled"
                : locale === "es"
                ? "Última página · Next deshabilitado"
                : "Última página · Next desabilitado"}
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" text={lblPrev} />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" aria-label={`${lblPage} 8`}>
                    8
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" aria-label={`${lblPage} 9`}>
                    9
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    isActive
                    aria-label={`${lblPage} 10`}
                  >
                    10
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    text={lblNext}
                    aria-disabled
                    tabIndex={-1}
                    className="pointer-events-none opacity-50"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
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
            {
              s: tContent("usage.scenarios.item1.s"),
              u: tContent("usage.scenarios.item1.u"),
              a: tContent("usage.scenarios.item1.a"),
            },
            {
              s: tContent("usage.scenarios.item2.s"),
              u: tContent("usage.scenarios.item2.u"),
              a: tContent("usage.scenarios.item2.a"),
            },
            {
              s: tContent("usage.scenarios.item3.s"),
              u: tContent("usage.scenarios.item3.u"),
              a: tContent("usage.scenarios.item3.a"),
            },
            {
              s: tContent("usage.scenarios.item4.s"),
              u: tContent("usage.scenarios.item4.u"),
              a: tContent("usage.scenarios.item4.a"),
            },
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
              element: tContent("usage.uxWriting.table.previous.name"),
              rules: tContent("usage.uxWriting.table.previous.format"),
              do: tContent("usage.uxWriting.table.previous.good"),
              dont: tContent("usage.uxWriting.table.previous.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.next.name"),
              rules: tContent("usage.uxWriting.table.next.format"),
              do: tContent("usage.uxWriting.table.next.good"),
              dont: tContent("usage.uxWriting.table.next.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.page.name"),
              rules: tContent("usage.uxWriting.table.page.format"),
              do: tContent("usage.uxWriting.table.page.good"),
              dont: tContent("usage.uxWriting.table.page.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.ellipsis.name"),
              rules: tContent("usage.uxWriting.table.ellipsis.format"),
              do: tContent("usage.uxWriting.table.ellipsis.good"),
              dont: tContent("usage.uxWriting.table.ellipsis.bad"),
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
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationLink href="#" aria-label={`${lblPage} 1`}>
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      isActive
                      aria-label={`${lblPage} 6`}
                    >
                      6
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" aria-label={`${lblPage} 12`}>
                      12
                    </PaginationLink>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
            dontPreview: (
              <div className="text-xs font-mono text-muted-foreground italic">
                1 2 3 4 5 6 7 8 9 10 11 12
              </div>
            ),
            doCaption: sanitizeHtml(tContent("doDont.pair1.do")),
            dontCaption: sanitizeHtml(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" text={lblPrev} />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" text={lblNext} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
            dontPreview: (
              <div className="text-xs font-mono text-muted-foreground italic">
                &lt; &nbsp;&nbsp; &gt;
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
        componentSlug="pagination"
        items={[
          {
            name: tContent("variants.items.default"),
            description: stripHtml(tContent("variants.styles.default")),
            code: codeDefault,
            preview: (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationLink href="#" aria-label={`${lblPage} 2`}>
                      2
                    </PaginationLink>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
          },
          {
            name: tContent("variants.items.active"),
            description: stripHtml(tContent("variants.styles.active")),
            code: codeActive,
            preview: (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      isActive
                      aria-label={`${lblPage} 1`}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
          },
          {
            name: tContent("variants.items.directional"),
            description: stripHtml(tContent("variants.styles.directional")),
            code: codeDirectional,
            preview: (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" text={lblPrev} />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" text={lblNext} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="pagination"
        items={[
          {
            name: tContent("variants.compositions.simple.name"),
            description: tContent("variants.compositions.simple.description"),
            useWhen: tContent("variants.compositions.simple.use"),
            code: `<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" text="${lblPrev}" aria-disabled tabIndex={-1} className="pointer-events-none opacity-50" />
    </PaginationItem>
    {[1,2,3,4,5].map((n) => (
      <PaginationItem key={n}>
        <PaginationLink href="#" isActive={n === 1} aria-label={\`${lblPage} \${n}\`}>{n}</PaginationLink>
      </PaginationItem>
    ))}
    <PaginationItem>
      <PaginationNext href="#" text="${lblNext}" />
    </PaginationItem>
  </PaginationContent>
</Pagination>`,
            preview: (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      text={lblPrev}
                      aria-disabled
                      tabIndex={-1}
                      className="pointer-events-none opacity-50"
                    />
                  </PaginationItem>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <PaginationItem key={n}>
                      <PaginationLink
                        href="#"
                        isActive={n === 1}
                        aria-label={`${lblPage} ${n}`}
                      >
                        {n}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext href="#" text={lblNext} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
          },
          {
            name: tContent("variants.compositions.withEllipsis.name"),
            description: tContent("variants.compositions.withEllipsis.description"),
            useWhen: tContent("variants.compositions.withEllipsis.use"),
            code: `<Pagination>
  <PaginationContent>
    <PaginationItem><PaginationPrevious href="#" text="${lblPrev}" /></PaginationItem>
    <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationLink href="#">5</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink href="#" isActive>6</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink href="#">7</PaginationLink></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationLink href="#">12</PaginationLink></PaginationItem>
    <PaginationItem><PaginationNext href="#" text="${lblNext}" /></PaginationItem>
  </PaginationContent>
</Pagination>`,
            preview: (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" text={lblPrev} />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" aria-label={`${lblPage} 1`}>1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" aria-label={`${lblPage} 5`}>5</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive aria-label={`${lblPage} 6`}>6</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" aria-label={`${lblPage} 7`}>7</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" aria-label={`${lblPage} 12`}>12</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" text={lblNext} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
          },
          {
            name: tContent("variants.compositions.lastPage.name"),
            description: tContent("variants.compositions.lastPage.description"),
            useWhen: tContent("variants.compositions.lastPage.use"),
            code: `<Pagination>
  <PaginationContent>
    <PaginationItem><PaginationPrevious href="#" text="${lblPrev}" /></PaginationItem>
    <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationLink href="#">9</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink href="#" isActive>10</PaginationLink></PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" text="${lblNext}" aria-disabled tabIndex={-1} className="pointer-events-none opacity-50" />
    </PaginationItem>
  </PaginationContent>
</Pagination>`,
            preview: (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" text={lblPrev} />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" aria-label={`${lblPage} 1`}>1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" aria-label={`${lblPage} 9`}>9</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive aria-label={`${lblPage} 10`}>10</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      text={lblNext}
                      aria-disabled
                      tabIndex={-1}
                      className="pointer-events-none opacity-50"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
          },
          {
            name: tContent("variants.compositions.interactive.name"),
            description: tContent("variants.compositions.interactive.description"),
            useWhen: tContent("variants.compositions.interactive.use"),
            code: `const [current, setCurrent] = useState(3);
const total = 8;

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious
        href="#"
        text="${lblPrev}"
        aria-disabled={current === 1}
        tabIndex={current === 1 ? -1 : 0}
        className={current === 1 ? "pointer-events-none opacity-50" : ""}
        onClick={(e) => { e.preventDefault(); if (current > 1) setCurrent(current - 1); }}
      />
    </PaginationItem>
    {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
      <PaginationItem key={n}>
        <PaginationLink
          href="#"
          isActive={current === n}
          onClick={(e) => { e.preventDefault(); setCurrent(n); }}
        >
          {n}
        </PaginationLink>
      </PaginationItem>
    ))}
    <PaginationItem>
      <PaginationNext
        href="#"
        text="${lblNext}"
        aria-disabled={current === total}
        tabIndex={current === total ? -1 : 0}
        className={current === total ? "pointer-events-none opacity-50" : ""}
        onClick={(e) => { e.preventDefault(); if (current < total) setCurrent(current + 1); }}
      />
    </PaginationItem>
  </PaginationContent>
</Pagination>`,
            preview: (
              <div className="w-full space-y-3">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        text={lblPrev}
                        aria-disabled={compPage === 1}
                        tabIndex={compPage === 1 ? -1 : 0}
                        className={
                          compPage === 1 ? "pointer-events-none opacity-50" : ""
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          if (compPage > 1) setCompPage(compPage - 1);
                        }}
                      />
                    </PaginationItem>
                    {Array.from({ length: compTotal }, (_, i) => i + 1).map((n) => (
                      <PaginationItem key={n}>
                        <PaginationLink
                          href="#"
                          isActive={compPage === n}
                          aria-label={`${lblPage} ${n}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setCompPage(n);
                          }}
                        >
                          {n}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        text={lblNext}
                        aria-disabled={compPage === compTotal}
                        tabIndex={compPage === compTotal ? -1 : 0}
                        className={
                          compPage === compTotal
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          if (compPage < compTotal) setCompPage(compPage + 1);
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <p className="text-xs text-muted-foreground text-center">
                  {lblPage} {compPage} {locale === "en" ? "of" : "de"} {compTotal}
                </p>
              </div>
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
            label: tContent("states.items.hover"),
            trigger: ":hover",
            behavior: stripHtml(tContent("states.descriptions.hover")),
          },
          {
            label: tContent("states.items.active"),
            trigger: "isActive={true}",
            behavior: stripHtml(tContent("states.descriptions.active")),
          },
          {
            label: tContent("states.items.disabled"),
            trigger: "aria-disabled + pointer-events-none",
            behavior: stripHtml(tContent("states.descriptions.disabled")),
          },
          {
            label: tContent("states.items.focus"),
            trigger: ":focus-visible",
            behavior: stripHtml(tContent("states.descriptions.focus")),
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
                name: "isActive",
                type: tContent("props.table.isActive.type"),
                defaultValue: tContent("props.table.isActive.default"),
                required: tContent("props.table.isActive.required"),
                description: sanitizeHtml(
                  tContent("props.table.isActive.description")
                ),
              },
              {
                name: "size",
                type: tContent("props.table.size.type"),
                defaultValue: tContent("props.table.size.default"),
                required: tContent("props.table.size.required"),
                description: sanitizeHtml(tContent("props.table.size.description")),
              },
              {
                name: "text",
                type: tContent("props.table.text.type"),
                defaultValue: tContent("props.table.text.default"),
                required: tContent("props.table.text.required"),
                description: sanitizeHtml(tContent("props.table.text.description")),
              },
              {
                name: "className",
                type: tContent("props.table.className.type"),
                defaultValue: tContent("props.table.className.default"),
                required: tContent("props.table.className.required"),
                description: sanitizeHtml(
                  tContent("props.table.className.description")
                ),
              },
              {
                name: "children",
                type: tContent("props.table.children.type"),
                defaultValue: tContent("props.table.children.default"),
                required: tContent("props.table.children.required"),
                description: sanitizeHtml(
                  tContent("props.table.children.description")
                ),
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
            token: "--background",
            value: tContent("tokens.table.background.class"),
            description: tContent("tokens.table.background.part"),
          },
          {
            token: "--foreground",
            value: tContent("tokens.table.foreground.class"),
            description: tContent("tokens.table.foreground.part"),
          },
          {
            token: "--accent",
            value: tContent("tokens.table.accent.class"),
            description: tContent("tokens.table.accent.part"),
          },
          {
            token: "--accent-foreground",
            value: tContent("tokens.table.accentForeground.class"),
            description: tContent("tokens.table.accentForeground.part"),
          },
          {
            token: "--border",
            value: tContent("tokens.table.border.class"),
            description: tContent("tokens.table.border.part"),
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
          {
            key: "Shift + Tab",
            description: stripHtml(tContent("accessibility.keyboard.shiftTab")),
          },
          {
            key: "Enter",
            description: stripHtml(tContent("accessibility.keyboard.enter")),
          },
          {
            key: "Space",
            description: stripHtml(tContent("accessibility.keyboard.space")),
          },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="pagination"
        items={[
          {
            name: tContent("related.items.breadcrumb.name"),
            description: tContent("related.items.breadcrumb.description"),
            path: "?path=/docs/ui-breadcrumb--docs",
          },
          {
            name: tContent("related.items.tabs.name"),
            description: tContent("related.items.tabs.description"),
            path: "?path=/docs/ui-tabs--docs",
          },
          {
            name: tContent("related.items.button.name"),
            description: tContent("related.items.button.description"),
            path: "?path=/docs/ui-button--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="pagination"
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
            event: "page_change",
            trigger: tContent("analytics.table.page_change.trigger"),
            payload: tContent("analytics.table.page_change.payload"),
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
              priority: tNav(
                priorityKeyMap[tContent("testes.functional.item1.priority")] ??
                  "common.high"
              ),
            },
            {
              action: tContent("testes.functional.item2.action"),
              result: tContent("testes.functional.item2.result"),
              priority: tNav(
                priorityKeyMap[tContent("testes.functional.item2.priority")] ??
                  "common.high"
              ),
            },
            {
              action: tContent("testes.functional.item3.action"),
              result: tContent("testes.functional.item3.result"),
              priority: tNav(
                priorityKeyMap[tContent("testes.functional.item3.priority")] ??
                  "common.high"
              ),
            },
            {
              action: tContent("testes.functional.item4.action"),
              result: tContent("testes.functional.item4.result"),
              priority: tNav(
                priorityKeyMap[tContent("testes.functional.item4.priority")] ??
                  "common.medium"
              ),
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
            {
              criterion: tContent("testes.accessibility.item2"),
              level: "1.4.3",
              how: "Contrast checker",
            },
            {
              criterion: tContent("testes.accessibility.item3"),
              level: "2.4.7",
              how: "Keyboard test",
            },
            {
              criterion: tContent("testes.accessibility.item4"),
              level: "4.1.2",
              how: "DevTools attribute",
            },
            {
              criterion: tContent("testes.accessibility.item5"),
              level: "4.1.2",
              how: "DevTools a11y tree",
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
            {
              story: tContent("testes.visual.item1.story"),
              priority: tNav(
                priorityKeyMap[tContent("testes.visual.item1.priority")] ??
                  "common.high"
              ),
            },
            {
              story: tContent("testes.visual.item2.story"),
              priority: tNav(
                priorityKeyMap[tContent("testes.visual.item2.priority")] ??
                  "common.high"
              ),
            },
            {
              story: tContent("testes.visual.item3.story"),
              priority: tNav(
                priorityKeyMap[tContent("testes.visual.item3.priority")] ??
                  "common.high"
              ),
            },
            {
              story: tContent("testes.visual.item4.story"),
              priority: tNav(
                priorityKeyMap[tContent("testes.visual.item4.priority")] ??
                  "common.medium"
              ),
            },
          ],
        }}
      />
    </DocsPageLayout>
  );
}

export default PaginationDocs;
