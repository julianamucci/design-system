import { useCallback, useEffect, useMemo } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import DOMPurify from 'dompurify';
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import navigationMenuTranslations from "@shared/content/navigation-menu/translations.json";

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

export function NavigationMenuDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(navigationMenuTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "navigation-menu",
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
      component_name: "navigation-menu",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "navigation-menu",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────
  const codeImport = `import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuIndicator,
} from "@/components/ui/navigation-menu";`;

  const structureCode = tContent("anatomy.structureCode");

  const codeHorizontal = `<NavigationMenu aria-label="Navegação principal">
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuLink href="/">Início</NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`;

  const codeVertical = `<NavigationMenu orientation="vertical" aria-label="Navegação principal">
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuLink href="/">Início</NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`;

  const interfaceCode = `// NavigationMenu (base-ui/navigation-menu)
interface NavigationMenuRootProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  delayDuration?: number;       // default 200
  skipDelayDuration?: number;   // default 300
  orientation?: "horizontal" | "vertical";
}

interface NavigationMenuTriggerProps {
  disabled?: boolean;
}

interface NavigationMenuContentProps {
  forceMount?: boolean;
}

interface NavigationMenuLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
}`;

  // ─── Locale-aware column labels ─────────────────────────────────────────

  const analyticsCols = {
    event: locale === "en" ? "Event" : locale === "es" ? "Evento" : "Evento",
    trigger: locale === "en" ? "Trigger" : locale === "es" ? "Disparo" : "Disparo",
    payload: "Payload",
  };

  const wrapperStyle: React.CSSProperties = {
    contain: "layout",
    minHeight: 280,
    position: "relative",
  };

  const ariaLabelMain =
    locale === "en"
      ? "Main navigation"
      : locale === "es"
      ? "Navegación principal"
      : "Navegação principal";

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="navigation-menu"
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
          {/* Demo 1: simple link */}
          <div className="nds-stack" data-spacing="sm" style={wrapperStyle}>
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {DOMPurify.sanitize(tContent("demonstration.labels.simpleLink"))}
            </p>
            <NavigationMenu aria-label={`${tContent("demonstration.title")} — ${stripHtml(tContent("demonstration.labels.simpleLink"))}`}>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink href="#">Início</NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink href="#">Sobre</NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink href="#">Contato</NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Demo 2: with dropdown */}
          <div className="nds-stack" data-spacing="sm" style={wrapperStyle}>
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {DOMPurify.sanitize(tContent("demonstration.labels.withDropdown"))}
            </p>
            <NavigationMenu aria-label={`${tContent("demonstration.title")} — ${stripHtml(tContent("demonstration.labels.withDropdown"))}`} defaultValue="produtos">
              <NavigationMenuList>
                <NavigationMenuItem value="produtos">
                  <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="nds-grid nds-p-2" data-spacing="xs" style={{ width: "260px" }}>
                      <li>
                        <NavigationMenuLink href="#">
                          Plano Starter
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink href="#">
                          Plano Pro
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink href="#">
                          Plano Empresarial
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Demo 3: with grid */}
          <div className="nds-stack" data-spacing="sm" style={wrapperStyle}>
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {DOMPurify.sanitize(tContent("demonstration.labels.withGrid"))}
            </p>
            <NavigationMenu aria-label={`${tContent("demonstration.title")} — ${stripHtml(tContent("demonstration.labels.withGrid"))}`} defaultValue="solucoes">
              <NavigationMenuList>
                <NavigationMenuItem value="solucoes">
                  <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="nds-grid nds-p-4" data-cols="2" data-spacing="sm" style={{ width: "420px" }}>
                      <li>
                        <NavigationMenuLink href="#">
                          <div>
                            <div className="nds-text-body nds-font-medium">Para Times</div>
                            <p className="nds-text-caption nds-text-muted-foreground">
                              Colaboração em tempo real.
                            </p>
                          </div>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink href="#">
                          <div>
                            <div className="nds-text-body nds-font-medium">Para Devs</div>
                            <p className="nds-text-caption nds-text-muted-foreground">
                              SDK e API públicos.
                            </p>
                          </div>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink href="#">
                          <div>
                            <div className="nds-text-body nds-font-medium">Para Design</div>
                            <p className="nds-text-caption nds-text-muted-foreground">
                              Tokens e componentes.
                            </p>
                          </div>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink href="#">
                          <div>
                            <div className="nds-text-body nds-font-medium">Para Marketing</div>
                            <p className="nds-text-caption nds-text-muted-foreground">
                              Landing pages prontas.
                            </p>
                          </div>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Demo 4: featured card */}
          <div className="nds-stack" data-spacing="sm" style={wrapperStyle}>
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {DOMPurify.sanitize(tContent("demonstration.labels.withFeatured"))}
            </p>
            <NavigationMenu aria-label={`${tContent("demonstration.title")} — ${stripHtml(tContent("demonstration.labels.withFeatured"))}`} defaultValue="recursos">
              <NavigationMenuList>
                <NavigationMenuItem value="recursos">
                  <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="nds-grid nds-p-4" data-spacing="md" style={{ width: "460px", gridTemplateColumns: "1fr 180px" }}>
                      <ul className="nds-grid" data-spacing="xs">
                        <li>
                          <NavigationMenuLink href="#">
                            Documentação
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink href="#">
                            Blog
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink href="#">
                            Comunidade
                          </NavigationMenuLink>
                        </li>
                      </ul>
                      <div className="nds-rounded-md nds-bg-accent nds-p-4 nds-text-caption">
                        <div className="nds-text-body nds-font-medium nds-mb-1">Novo</div>
                        <p className="nds-text-muted-foreground">
                          Conheça os tokens v2.
                        </p>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
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
          tContent("anatomy.item7"),
          tContent("anatomy.item8"),
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
              element: tContent("usage.uxWriting.table.trigger.name"),
              rules: tContent("usage.uxWriting.table.trigger.format"),
              do: tContent("usage.uxWriting.table.trigger.good"),
              dont: tContent("usage.uxWriting.table.trigger.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.link.name"),
              rules: tContent("usage.uxWriting.table.link.format"),
              do: tContent("usage.uxWriting.table.link.good"),
              dont: tContent("usage.uxWriting.table.link.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.ariaLabel.name"),
              rules: tContent("usage.uxWriting.table.ariaLabel.format"),
              do: tContent("usage.uxWriting.table.ariaLabel.good"),
              dont: tContent("usage.uxWriting.table.ariaLabel.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.currentPage.name"),
              rules: tContent("usage.uxWriting.table.currentPage.format"),
              do: tContent("usage.uxWriting.table.currentPage.good"),
              dont: tContent("usage.uxWriting.table.currentPage.bad"),
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
              <div className="nds-text-caption nds-font-mono nds-text-muted-foreground">
                aria-label · aria-current
              </div>
            ),
            dontPreview: (
              <div className="nds-text-caption nds-font-mono nds-text-muted-foreground nds-italic">
                role=navigation (sozinho)
              </div>
            ),
            doCaption: DOMPurify.sanitize(tContent("doDont.pair1.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="nds-text-caption nds-font-mono nds-text-muted-foreground">
                4-6 sub-links
              </div>
            ),
            dontPreview: (
              <div className="nds-text-caption nds-font-mono nds-text-muted-foreground nds-italic">
                30+ links sem grupo
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
      <DocsCompositions
        id="variantes"
        title={tContent("variants.title")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="navigation-menu"
        items={[
          {
            name: tContent("variants.items.horizontal"),
            description: stripHtml(tContent("variants.styles.horizontal")),
            code: codeHorizontal,
            preview: (
              <div className="nds-text-caption nds-font-mono nds-text-muted-foreground">
                orientation=&quot;horizontal&quot;
              </div>
            ),
          },
          {
            name: tContent("variants.items.vertical"),
            description: stripHtml(tContent("variants.styles.vertical")),
            code: codeVertical,
            preview: (
              <div className="nds-text-caption nds-font-mono nds-text-muted-foreground">
                orientation=&quot;vertical&quot;
              </div>
            ),
          },
          {
            name: tContent("variants.items.linkSimples.name"),
            description: tContent("variants.items.linkSimples.description"),
            useWhen: tContent("variants.items.linkSimples.use"),
            code: `<NavigationMenu aria-label="${ariaLabelMain}">
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuLink href="/">Início</NavigationMenuLink>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink href="/precos">Preços</NavigationMenuLink>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink href="/contato">Contato</NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`,
            preview: (
              <div style={wrapperStyle}>
                <NavigationMenu aria-label={tContent("variants.items.linkSimples.name")}>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuLink href="#">Início</NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink href="#">Preços</NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink href="#">Contato</NavigationMenuLink>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            ),
          },
          {
            name: tContent("variants.items.comDropdown.name"),
            description: tContent("variants.items.comDropdown.description"),
            useWhen: tContent("variants.items.comDropdown.use"),
            code: `<NavigationMenu aria-label="${ariaLabelMain}">
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuLink href="/">Início</NavigationMenuLink>
    </NavigationMenuItem>
    <NavigationMenuItem value="produtos">
      <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="nds-grid nds-p-2" data-spacing="xs" style={{ width: "240px" }}>
          <li><NavigationMenuLink href="/produtos/inicial">Plano Inicial</NavigationMenuLink></li>
          <li><NavigationMenuLink href="/produtos/profissional">Plano Profissional</NavigationMenuLink></li>
          <li><NavigationMenuLink href="/produtos/empresarial">Plano Empresarial</NavigationMenuLink></li>
          <li><NavigationMenuLink href="/produtos/comparar">Comparar planos</NavigationMenuLink></li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`,
            preview: (
              <div style={wrapperStyle}>
                <NavigationMenu aria-label={tContent("variants.items.comDropdown.name")} defaultValue="produtos">
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuLink href="#">Início</NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem value="produtos">
                      <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="nds-grid nds-p-2" data-spacing="xs" style={{ width: "240px" }}>
                          <li><NavigationMenuLink href="#">Plano Inicial</NavigationMenuLink></li>
                          <li><NavigationMenuLink href="#">Plano Profissional</NavigationMenuLink></li>
                          <li><NavigationMenuLink href="#">Plano Empresarial</NavigationMenuLink></li>
                          <li><NavigationMenuLink href="#">Comparar planos</NavigationMenuLink></li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            ),
          },
          {
            name: tContent("variants.items.megaMenuGrid.name"),
            description: tContent("variants.items.megaMenuGrid.description"),
            useWhen: tContent("variants.items.megaMenuGrid.use"),
            code: `<NavigationMenu aria-label="${ariaLabelMain}">
  <NavigationMenuList>
    <NavigationMenuItem value="solucoes">
      <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="nds-grid nds-p-4" data-cols="2" data-spacing="sm" style={{ width: "560px" }}>
          <li>
            <NavigationMenuLink href="/solucoes/marketing">
              <div className="nds-text-body nds-font-medium">Para Marketing</div>
              <p className="nds-text-caption nds-text-muted-foreground">Automação, leads e campanhas.</p>
            </NavigationMenuLink>
          </li>
          <li>
            <NavigationMenuLink href="/solucoes/vendas">
              <div className="nds-text-body nds-font-medium">Para Vendas</div>
              <p className="nds-text-caption nds-text-muted-foreground">Pipeline, CRM e propostas.</p>
            </NavigationMenuLink>
          </li>
          {/* ...mais 4 itens */}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`,
            preview: (
              <div style={{ ...wrapperStyle, minHeight: 320 }}>
                <NavigationMenu aria-label={tContent("variants.items.megaMenuGrid.name")} defaultValue="solucoes">
                  <NavigationMenuList>
                    <NavigationMenuItem value="solucoes">
                      <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="nds-grid nds-p-4" data-cols="2" data-spacing="sm" style={{ width: "560px" }}>
                          <li>
                            <NavigationMenuLink href="#">
                              <div className="nds-text-body nds-font-medium">Para Marketing</div>
                              <p className="nds-text-caption nds-text-muted-foreground">Automação, leads e campanhas.</p>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink href="#">
                              <div className="nds-text-body nds-font-medium">Para Vendas</div>
                              <p className="nds-text-caption nds-text-muted-foreground">Pipeline, CRM e propostas.</p>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink href="#">
                              <div className="nds-text-body nds-font-medium">Para Suporte</div>
                              <p className="nds-text-caption nds-text-muted-foreground">Tickets, base de conhecimento.</p>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink href="#">
                              <div className="nds-text-body nds-font-medium">Para Sucesso</div>
                              <p className="nds-text-caption nds-text-muted-foreground">Onboarding e retenção.</p>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink href="#">
                              <div className="nds-text-body nds-font-medium">Para Operações</div>
                              <p className="nds-text-caption nds-text-muted-foreground">Workflows e integrações.</p>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink href="#">
                              <div className="nds-text-body nds-font-medium">Para Analytics</div>
                              <p className="nds-text-caption nds-text-muted-foreground">Dashboards e relatórios.</p>
                            </NavigationMenuLink>
                          </li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            ),
          },
          {
            name: tContent("variants.items.comCardDestacado.name"),
            description: tContent("variants.items.comCardDestacado.description"),
            useWhen: tContent("variants.items.comCardDestacado.use"),
            code: `<NavigationMenu aria-label="${ariaLabelMain}">
  <NavigationMenuList>
    <NavigationMenuItem value="recursos">
      <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="nds-cluster nds-p-4" data-spacing="md" style={{ width: "560px" }}>
          <a href="/quickstart" className="nds-stack nds-rounded-md nds-p-4" style={{ width: "220px", justifyContent: "flex-end", textDecoration: "none", background: "linear-gradient(to bottom, hsl(var(--muted)), hsl(var(--accent)))" }}>
            <div className="nds-text-base nds-font-semibold nds-leading-tight">Comece em 5 minutos</div>
            <p className="nds-mt-2 nds-text-body nds-leading-tight">
              Crie sua primeira integração com nosso quickstart.
            </p>
          </a>
          <ul className="nds-stack nds-flex-1" data-spacing="xs">
            <li><NavigationMenuLink href="/docs">Documentação</NavigationMenuLink></li>
            <li><NavigationMenuLink href="/tutoriais">Tutoriais</NavigationMenuLink></li>
            <li><NavigationMenuLink href="/comunidade">Comunidade</NavigationMenuLink></li>
          </ul>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`,
            preview: (
              <div style={{ ...wrapperStyle, minHeight: 320 }}>
                <NavigationMenu aria-label={tContent("variants.items.comCardDestacado.name")} defaultValue="recursos">
                  <NavigationMenuList>
                    <NavigationMenuItem value="recursos">
                      <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="nds-cluster nds-p-4" data-spacing="md" style={{ width: "560px" }}>
                          <a
                            href="#"
                            className="nds-stack nds-rounded-md nds-p-4" style={{ width: "220px", justifyContent: "flex-end", textDecoration: "none", background: "linear-gradient(to bottom, hsl(var(--muted)), hsl(var(--accent)))" }}
                          >
                            <div className="nds-text-base nds-font-semibold nds-leading-tight">Comece em 5 minutos</div>
                            <p className="nds-mt-2 nds-text-body nds-leading-tight">
                              Crie sua primeira integração com nosso quickstart.
                            </p>
                          </a>
                          <ul className="nds-stack nds-flex-1" data-spacing="xs">
                            <li><NavigationMenuLink href="#">Documentação</NavigationMenuLink></li>
                            <li><NavigationMenuLink href="#">Tutoriais</NavigationMenuLink></li>
                            <li><NavigationMenuLink href="#">Comunidade</NavigationMenuLink></li>
                          </ul>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
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
          trigger: tContent("states.cols.trigger"),
          behavior: tContent("states.cols.behavior"),
        }}
        items={[
          {
            label: tContent("states.closed.label"),
            trigger: tContent("states.closed.trigger"),
            behavior: stripHtml(tContent("states.closed.behavior")),
          },
          {
            label: tContent("states.open.label"),
            trigger: tContent("states.open.trigger"),
            behavior: stripHtml(tContent("states.open.behavior")),
          },
          {
            label: tContent("states.active.label"),
            trigger: tContent("states.active.trigger"),
            behavior: stripHtml(tContent("states.active.behavior")),
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
                description: DOMPurify.sanitize(tContent("props.table.value.description")),
              },
              {
                name: "onValueChange",
                type: tContent("props.table.onValueChange.type"),
                defaultValue: tContent("props.table.onValueChange.default"),
                required: tContent("props.table.onValueChange.required"),
                description: DOMPurify.sanitize(tContent("props.table.onValueChange.description")),
              },
              {
                name: "defaultValue",
                type: tContent("props.table.defaultValue.type"),
                defaultValue: tContent("props.table.defaultValue.default"),
                required: tContent("props.table.defaultValue.required"),
                description: DOMPurify.sanitize(tContent("props.table.defaultValue.description")),
              },
              {
                name: "delayDuration",
                type: tContent("props.table.delayDuration.type"),
                defaultValue: tContent("props.table.delayDuration.default"),
                required: tContent("props.table.delayDuration.required"),
                description: DOMPurify.sanitize(tContent("props.table.delayDuration.description")),
              },
              {
                name: "skipDelayDuration",
                type: tContent("props.table.skipDelayDuration.type"),
                defaultValue: tContent("props.table.skipDelayDuration.default"),
                required: tContent("props.table.skipDelayDuration.required"),
                description: DOMPurify.sanitize(tContent("props.table.skipDelayDuration.description")),
              },
              {
                name: "orientation",
                type: tContent("props.table.orientation.type"),
                defaultValue: tContent("props.table.orientation.default"),
                required: tContent("props.table.orientation.required"),
                description: DOMPurify.sanitize(tContent("props.table.orientation.description")),
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
            value: tContent("tokens.table.rootBg.class"),
            description: tContent("tokens.table.rootBg.part"),
          },
          {
            token: "--accent",
            value: tContent("tokens.table.triggerHover.class"),
            description: tContent("tokens.table.triggerHover.part"),
          },
          {
            token: "--accent",
            value: tContent("tokens.table.linkActive.class"),
            description: tContent("tokens.table.linkActive.part"),
          },
          {
            token: "--popover",
            value: tContent("tokens.table.viewportBg.class"),
            description: tContent("tokens.table.viewportBg.part"),
          },
          {
            token: "--foreground/10",
            value: tContent("tokens.table.viewportBorder.class"),
            description: tContent("tokens.table.viewportBorder.part"),
          },
          {
            token: "--shadow",
            value: tContent("tokens.table.viewportShadow.class"),
            description: tContent("tokens.table.viewportShadow.part"),
          },
          {
            token: "--radius",
            value: tContent("tokens.table.rounded.class"),
            description: tContent("tokens.table.rounded.part"),
          },
          {
            token: "--popover",
            value: tContent("tokens.table.indicator.class"),
            description: tContent("tokens.table.indicator.part"),
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
          { key: "Arrow Up / Arrow Down / Arrow Left / Arrow Right", description: stripHtml(tContent("accessibility.keyboard.arrows")) },
          { key: "Enter / Space", description: stripHtml(tContent("accessibility.keyboard.enter")) },
          { key: "Esc", description: stripHtml(tContent("accessibility.keyboard.escape")) },
          { key: "Home / End", description: stripHtml(tContent("accessibility.keyboard.homeEnd")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="navigation-menu"
        items={[
          {
            name: tContent("related.items.menubar.name"),
            description: tContent("related.items.menubar.description"),
            path: "?path=/docs/ui-menubar--docs",
          },
          {
            name: tContent("related.items.sidebar.name"),
            description: tContent("related.items.sidebar.description"),
            path: "?path=/docs/ui-sidebar--docs",
          },
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
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="navigation-menu"
        items={[
          { title: "", content: tContent("notes.item1") },
          { title: "", content: tContent("notes.item2") },
          { title: "", content: tContent("notes.item3") },
          { title: "", content: tContent("notes.item4") },
          { title: "", content: tContent("notes.item5") },
          { title: "", content: tContent("notes.item6") },
        ]}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={analyticsCols}
        items={[
          {
            event: "nav_menu_open / nav_link_click",
            trigger: DOMPurify.sanitize(tContent("analytics.description")),
            payload: "component, label, destination",
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
              priority: tNav(priorityKeyMap[tContent("testes.functional.item4.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item5.action"),
              result: tContent("testes.functional.item5.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item5.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item6.action"),
              result: tContent("testes.functional.item6.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item6.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item7.action"),
              result: tContent("testes.functional.item7.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item7.priority")] ?? "common.medium"),
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
            { criterion: tContent("testes.accessibility.item2"), level: "1.3.1", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item3"), level: "4.1.2", how: "DevTools attribute" },
            { criterion: tContent("testes.accessibility.item4"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item5"), level: "2.4.3", how: "Keyboard test" },
            { criterion: tContent("testes.accessibility.item6"), level: "1.4.3", how: "Contrast checker" },
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

export default NavigationMenuDocs;
