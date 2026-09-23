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
import DOMPurify from 'dompurify';
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
import { stripHtml, toPlainText } from "@/lib/strip-html";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

/**
 * Índices dos `item<N>` que a seção publica, tirados das PRÓPRIAS chaves.
 *
 * Contar à mão envelhece em silêncio: o conteúdo compartilhado cresce nos três
 * idiomas e a lista da tela fica para trás sem nada ficar vermelho — foi assim
 * que o sexto critério de acessibilidade ficou escrito em pt-BR, en e es e
 * nunca chegou à tela. Cravar o número novo repete o defeito daqui a um item.
 */
const itemIndices = (section: unknown): number[] =>
  Object.keys((section ?? {}) as Record<string, unknown>)
    .map((key) => /^item(\d+)$/.exec(key)?.[1])
    .filter((digits): digits is string => digits !== undefined)
    .map(Number)
    .sort((a, b) => a - b);

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

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (paginationTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      )
        .filter(([key]) => key !== "title")
        .map(([, value]) => value),
    [locale],
  );

  // Quantos itens cada lista de testes publica hoje, perguntado ao dicionário.
  const testesIndices = useMemo(() => {
    const testes = (paginationTranslations as unknown as Record<
      string,
      { testes?: Record<string, unknown> }
    >)[locale]?.testes;
    return {
      functional: itemIndices(testes?.functional),
      accessibility: itemIndices(testes?.accessibility),
      visual: itemIndices(testes?.visual),
    };
  }, [locale]);

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
  // Texto VISÍVEL e NOME ACESSÍVEL são chaves diferentes: "Anterior" some abaixo
  // de 40rem, e o que o leitor de tela anuncia é a frase inteira. Sem estas três
  // o nome acessível caía no padrão em português do componente, e as páginas
  // `en` e `es` anunciavam "Ir para a página anterior" em português.
  const lblPrevLabel = tContent("demonstration.labels.previousLabel");
  const lblNextLabel = tContent("demonstration.labels.nextLabel");
  const lblNav = tContent("demonstration.labels.navigationLabel");
  // Leitor do estado que vive FORA do componente. Sem ele a demo parece guardar
  // a página sozinha, que é o oposto do que a seção ensina.
  const lblCurrent = tContent("demonstration.labels.current");

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
  <PaginationLink aria-label="${lblPage} 2">2</PaginationLink>
</PaginationItem>`;

  const codeDirectional = `<PaginationItem>
  <PaginationPrevious text="${lblPrev}" />
</PaginationItem>
<PaginationItem>
  <PaginationNext text="${lblNext}" />
</PaginationItem>`;

  const interfaceCode = `// PaginationLink
type PaginationLinkProps = {
  isActive?: boolean;                              // default false
  size?: "default" | "sm" | "lg" | "icon";         // default "icon"
  href?: string;                                   // com endereço: <a>; sem: <button>
  disabled?: boolean;                              // default false
} & React.HTMLAttributes<HTMLElement>;

// PaginationPrevious / PaginationNext
type PaginationDirectionalProps =
  React.ComponentProps<typeof PaginationLink> & {
    text?: string;  // "Previous" / "Next"
  };

// Pagination, PaginationContent, PaginationItem, PaginationEllipsis
// herdam React.ComponentProps<"nav" | "ul" | "li" | "span">`;

  // ─── Locale-aware column labels ──────────────────────────────────────────

  const analyticsCols = {
    event: locale === "en" ? "Event" : "Evento",
    trigger: locale === "en" ? "Trigger" : "Disparo",
    payload: "Payload",
  };

  // ─── Rótulos visíveis das demos (reusados como aria-label — landmark-unique)
  const demoSimpleLabel =
    locale === "en"
      ? "Simple pagination · 5 pages"
      : locale === "es"
      ? "Paginación simple · 5 páginas"
      : "Paginação simples · 5 páginas";
  const demoEllipsisLabel =
    locale === "en"
      ? "Long list with ellipsis · 12 pages"
      : locale === "es"
      ? "Lista larga con ellipsis · 12 páginas"
      : "Lista longa com ellipsis · 12 páginas";
  const demoLastPageLabel =
    locale === "en"
      ? "Last page · Next disabled"
      : locale === "es"
      ? "Última página · Next deshabilitado"
      : "Última página · Next desabilitado";

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
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration >
        <div className="nds-stack nds-w-full" data-spacing="xl">
          {/* Demo 1 — paginação simples interativa */}
          <div className="nds-stack" data-spacing="sm" style={{ contain: "layout" }}>
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {demoSimpleLabel}
            </p>
            <Pagination aria-label={lblNav}>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    text={lblPrev}
                    aria-label={lblPrevLabel}
                    disabled={page === 1}
                    onClick={() => {
                      if (page > 1) goTo(page - 1);
                    }}
                  />
                </PaginationItem>
                {Array.from({ length: totalSimple }, (_, i) => i + 1).map((n) => (
                  <PaginationItem key={n}>
                    <PaginationLink
                      isActive={page === n}
                      aria-label={`${lblPage} ${n}`}
                      onClick={() => {
                        goTo(n);
                      }}
                    >
                      {n}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    text={lblNext}
                    aria-label={lblNextLabel}
                    disabled={page === totalSimple}
                    onClick={() => {
                      if (page < totalSimple) goTo(page + 1);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            {/* A página não mora no componente: quem a guarda é esta página, e
                a legenda é o leitor desse estado. */}
            <p className="nds-text-body nds-text-muted-foreground">
              {lblCurrent}: {page} / {totalSimple}
            </p>
          </div>

          {/* Demo 2 — com ellipsis */}
          <div className="nds-stack" data-spacing="sm" style={{ contain: "layout" }}>
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {demoEllipsisLabel}
            </p>
            <Pagination aria-label={demoEllipsisLabel}>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious text={lblPrev} aria-label={lblPrevLabel} />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink aria-label={`${lblPage} 1`}>
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink aria-label={`${lblPage} 5`}>
                    5
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    isActive
                    aria-label={`${lblPage} 6`}
                  >
                    6
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink aria-label={`${lblPage} 7`}>
                    7
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink aria-label={`${lblPage} 12`}>
                    12
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext text={lblNext} aria-label={lblNextLabel} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          {/* Demo 3 — última página, Next desabilitado */}
          <div className="nds-stack" data-spacing="sm" style={{ contain: "layout" }}>
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {demoLastPageLabel}
            </p>
            <Pagination aria-label={demoLastPageLabel}>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious text={lblPrev} aria-label={lblPrevLabel} />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink aria-label={`${lblPage} 8`}>
                    8
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink aria-label={`${lblPage} 9`}>
                    9
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    isActive
                    aria-label={`${lblPage} 10`}
                  >
                    10
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext text={lblNext} aria-label={lblNextLabel} disabled />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
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
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <Pagination aria-label={stripHtml(tContent("doDont.pair1.do"))}>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationLink aria-label={`${lblPage} 1`}>
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
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
                    <PaginationLink aria-label={`${lblPage} 12`}>
                      12
                    </PaginationLink>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
            // Componente VIVO também no lado errado (guideline 08 §15): a
            // imitação em monoespaçado não mostrava o que a faixa faz quando a
            // lista não colapsa — mostrava uma linha de texto.
            //
            // SEIS números, e a contagem é medida: cada link numerado é um
            // quadrado de `var(--size-lg)` (36px) com `flex-shrink: 0`, a
            // moldura do par ocupa metade da largura da seção (menos de 280px
            // na docs page) e a lista TRANSBORDA em vez de encolher. Seis pedem
            // 6 × 36 + 5 × 4 = 236px e cabem; a nove o axe reprova em
            // `target-size`, com o último controle sobrando poucos pixels
            // visíveis. A legenda é que fala das dezenas — a moldura não tem
            // largura para elas.
            dontPreview: (
              <Pagination aria-label={stripHtml(tContent("doDont.pair1.dont"))}>
                <PaginationContent>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <PaginationItem key={n}>
                      <PaginationLink
                        isActive={n === 3}
                        aria-label={`${lblPage} ${n}`}
                      >
                        {n}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                </PaginationContent>
              </Pagination>
            ),
            doCaption: DOMPurify.sanitize(tContent("doDont.pair1.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <Pagination aria-label={stripHtml(tContent("doDont.pair2.do"))}>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious text={lblPrev} aria-label={lblPrevLabel} />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext text={lblNext} aria-label={lblNextLabel} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
            // O defeito é o CONTROLE de direção sem nome, então ele precisa ser
            // um controle: `PaginationLink` cru, com a seta como único texto e
            // sem `aria-label` — é exatamente o que `PaginationPrevious` e
            // `PaginationNext` evitam ao escreverem o nome acessível sozinhos.
            // Usá-los aqui apagaria o defeito que a legenda descreve.
            dontPreview: (
              <Pagination aria-label={stripHtml(tContent("doDont.pair2.dont"))}>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationLink>&lt;</PaginationLink>
                  </PaginationItem>
                  {[1, 2, 3].map((n) => (
                    <PaginationItem key={n}>
                      <PaginationLink isActive={n === 2}>
                        {n}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationLink>&gt;</PaginationLink>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
            doCaption: DOMPurify.sanitize(tContent("doDont.pair2.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport componentSlug="pagination" code={codeImport} />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsCompositions
        id="variantes"
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="pagination"
        items={[
          {
            trackId: "default",
            name: tContent("variants.items.default"),
            description: stripHtml(tContent("variants.styles.default")),
            code: codeDefault,
            preview: (
              <Pagination aria-label={tContent("variants.items.default")}>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationLink aria-label={`${lblPage} 2`}>
                      2
                    </PaginationLink>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
          },
          {
            trackId: "directional",
            name: tContent("variants.items.directional"),
            description: stripHtml(tContent("variants.styles.directional")),
            code: codeDirectional,
            preview: (
              <Pagination aria-label={tContent("variants.items.directional")}>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious text={lblPrev} aria-label={lblPrevLabel} />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext text={lblNext} aria-label={lblNextLabel} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
          },
          {
            trackId: "simple",
            name: tContent("variants.items.simple.name"),
            description: tContent("variants.items.simple.description"),
            useWhen: tContent("variants.items.simple.use"),
            code: `<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious text="${lblPrev}" disabled />
    </PaginationItem>
    {[1,2,3,4,5].map((n) => (
      <PaginationItem key={n}>
        <PaginationLink isActive={n === 1} aria-label={\`${lblPage} \${n}\`}>{n}</PaginationLink>
      </PaginationItem>
    ))}
    <PaginationItem>
      <PaginationNext text="${lblNext}" />
    </PaginationItem>
  </PaginationContent>
</Pagination>`,
            preview: (
              <Pagination aria-label={tContent("variants.items.simple.name")}>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious text={lblPrev} aria-label={lblPrevLabel} disabled />
                  </PaginationItem>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <PaginationItem key={n}>
                      <PaginationLink
                        isActive={n === 1}
                        aria-label={`${lblPage} ${n}`}
                      >
                        {n}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext text={lblNext} aria-label={lblNextLabel} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
          },
          {
            trackId: "withEllipsis",
            name: tContent("variants.items.withEllipsis.name"),
            description: tContent("variants.items.withEllipsis.description"),
            useWhen: tContent("variants.items.withEllipsis.use"),
            code: `<Pagination>
  <PaginationContent>
    <PaginationItem><PaginationPrevious text="${lblPrev}" /></PaginationItem>
    <PaginationItem><PaginationLink>1</PaginationLink></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationLink>5</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink isActive>6</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink>7</PaginationLink></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationLink>12</PaginationLink></PaginationItem>
    <PaginationItem><PaginationNext text="${lblNext}" /></PaginationItem>
  </PaginationContent>
</Pagination>`,
            preview: (
              <Pagination aria-label={tContent("variants.items.withEllipsis.name")}>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious text={lblPrev} aria-label={lblPrevLabel} />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink aria-label={`${lblPage} 1`}>1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink aria-label={`${lblPage} 5`}>5</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink isActive aria-label={`${lblPage} 6`}>6</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink aria-label={`${lblPage} 7`}>7</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink aria-label={`${lblPage} 12`}>12</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext text={lblNext} aria-label={lblNextLabel} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
          },
          {
            trackId: "interactive",
            name: tContent("variants.items.interactive.name"),
            description: tContent("variants.items.interactive.description"),
            useWhen: tContent("variants.items.interactive.use"),
            code: `const [current, setCurrent] = useState(3);
const total = 8;

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious
        text="${lblPrev}"
        disabled={current === 1}
        onClick={() => { if (current > 1) setCurrent(current - 1); }}
      />
    </PaginationItem>
    {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
      <PaginationItem key={n}>
        <PaginationLink
          isActive={current === n}
          onClick={() => { setCurrent(n); }}
        >
          {n}
        </PaginationLink>
      </PaginationItem>
    ))}
    <PaginationItem>
      <PaginationNext
        text="${lblNext}"
        disabled={current === total}
        onClick={() => { if (current < total) setCurrent(current + 1); }}
      />
    </PaginationItem>
  </PaginationContent>
</Pagination>`,
            preview: (
              <div className="nds-stack nds-w-full" data-spacing="sm" style={{ alignItems: 'center' }}>
                <Pagination aria-label={tContent("variants.items.interactive.name")}>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        text={lblPrev}
                        aria-label={lblPrevLabel}
                        disabled={compPage === 1}
                        onClick={() => {
                          if (compPage > 1) setCompPage(compPage - 1);
                        }}
                      />
                    </PaginationItem>
                    {Array.from({ length: compTotal }, (_, i) => i + 1).map((n) => (
                      <PaginationItem key={n}>
                        <PaginationLink
                          isActive={compPage === n}
                          aria-label={`${lblPage} ${n}`}
                          onClick={() => {
                            setCompPage(n);
                          }}
                        >
                          {n}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        text={lblNext}
                        aria-label={lblNextLabel}
                        disabled={compPage === compTotal}
                        onClick={() => {
                          if (compPage < compTotal) setCompPage(compPage + 1);
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <p className="nds-text-body nds-text-muted-foreground">
                  {lblCurrent}: {compPage} / {compTotal}
                </p>
              </div>
            ),
          },
        ]}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
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
            label: tContent("states.active.label"),
            trigger: toPlainText(tContent("states.active.trigger")),
            behavior: toPlainText(tContent("states.active.behavior")),
          },
          {
            label: tContent("states.disabled.label"),
            trigger: toPlainText(tContent("states.disabled.trigger")),
            behavior: toPlainText(tContent("states.disabled.behavior")),
          },
          {
            label: tContent("states.focus.label"),
            trigger: toPlainText(tContent("states.focus.trigger")),
            behavior: toPlainText(tContent("states.focus.behavior")),
          },
          {
            label: tContent("states.lastPage.label"),
            trigger: toPlainText(tContent("states.lastPage.trigger")),
            behavior: toPlainText(tContent("states.lastPage.behavior")),
          },
        ]}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
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
              // `toPlainText` e não `DOMPurify.sanitize`: a célula de descrição
              // escreve um textNode, então o `<code>` sanitizado aparecia
              // literalmente na tela. As outras stacks já faziam assim.
              {
                name: "isActive",
                type: tContent("props.table.isActive.type"),
                defaultValue: tContent("props.table.isActive.default"),
                required: tContent("props.table.isActive.required"),
                description: toPlainText(tContent("props.table.isActive.description")),
              },
              {
                name: "size",
                type: tContent("props.table.size.type"),
                defaultValue: tContent("props.table.size.default"),
                required: tContent("props.table.size.required"),
                description: toPlainText(tContent("props.table.size.description")),
              },
              {
                name: "text",
                type: tContent("props.table.text.type"),
                defaultValue: tContent("props.table.text.default"),
                required: tContent("props.table.text.required"),
                description: toPlainText(tContent("props.table.text.description")),
              },
              {
                name: "className",
                type: tContent("props.table.className.type"),
                defaultValue: tContent("props.table.className.default"),
                required: tContent("props.table.className.required"),
                description: toPlainText(tContent("props.table.className.description")),
              },
              {
                name: "children",
                type: tContent("props.table.children.type"),
                defaultValue: tContent("props.table.children.default"),
                required: tContent("props.table.children.required"),
                description: toPlainText(tContent("props.table.children.description")),
              },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityCode={tContent("props.extensibilityCode")}
      />

      {/* ── Tokens ────────────────────────────────────────────────── */}
      <DocsTokens
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={[
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
            token: "--ring",
            value: tContent("tokens.table.ring.class"),
            description: tContent("tokens.table.ring.part"),
          },
          {
            token: "--muted-foreground",
            value: tContent("tokens.table.ellipsis.class"),
            description: tContent("tokens.table.ellipsis.part"),
          },
          {
            token: "--radius",
            value: tContent("tokens.table.radius.class"),
            description: tContent("tokens.table.radius.part"),
          },
          {
            token: "--spacing-1",
            value: tContent("tokens.table.gap.class"),
            description: tContent("tokens.table.gap.part"),
          },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
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
          {
            key: "Shift + Tab",
            description: toPlainText(tContent("accessibility.keyboard.shiftTab")),
          },
          {
            key: "Enter",
            description: toPlainText(tContent("accessibility.keyboard.enter")),
          },
          {
            key: "Space",
            description: toPlainText(tContent("accessibility.keyboard.space")),
          },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        componentSlug="pagination"
        items={[
          {
            name: tContent("related.items.breadcrumb.name"),
            description: toPlainText(tContent("related.items.breadcrumb.description")),
            path: "?path=/docs/components-navigation-breadcrumb--docs",
          },
          {
            name: tContent("related.items.tabs.name"),
            description: toPlainText(tContent("related.items.tabs.description")),
            path: "?path=/docs/components-navigation-tabs--docs",
          },
          {
            name: tContent("related.items.button.name"),
            description: toPlainText(tContent("related.items.button.description")),
            path: "?path=/docs/components-form-button--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
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
        cols={analyticsCols}
        items={[
          {
            event: "page_change",
            trigger: toPlainText(tContent("analytics.table.page_change.trigger")),
            payload: tContent("analytics.table.page_change.payload"),
          },
        ]}
      />

      {/* ── Testes ────────────────────────────────────────────────── */}
      <DocsTestes
        functional={{
          title: tContent("testes.functional.title"),
          cols: {
            action: tNav("common.userAction"),
            result: tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: testesIndices.functional.map((n) => ({
            action: tContent(`testes.functional.item${n}.action`),
            result: tContent(`testes.functional.item${n}.result`),
            priority: tNav(
              priorityKeyMap[tContent(`testes.functional.item${n}.priority`)] ??
                "common.medium"
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
          items: testesIndices.accessibility.map((n) => ({
            // As três colunas vêm do dicionário compartilhado: faltando `level`
            // e `how` ali, cada stack cravava os seus e o mesmo campo saía com
            // quatro valores diferentes entre as cinco páginas.
            criterion: toPlainText(
              tContent(`testes.accessibility.item${n}.criterion`),
            ),
            level: tContent(`testes.accessibility.item${n}.level`),
            how: toPlainText(tContent(`testes.accessibility.item${n}.how`)),
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: testesIndices.visual.map((n) => ({
            story: tContent(`testes.visual.item${n}.story`),
            priority: tNav(
              priorityKeyMap[tContent(`testes.visual.item${n}.priority`)] ??
                "common.medium"
            ),
          })),
        }}
      />
    </DocsPageLayout>
  );
}

export default PaginationDocs;
