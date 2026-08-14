import { useCallback, useEffect, useMemo } from "react";
import { MoreVertical, TrendingUp } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import cardTranslations from "@shared/content/card/translations.json";

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
import { stripHtml, toPlainText } from "@/lib/strip-html";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

// Imagem canônica para previews com imagem
const DEMO_IMAGE_PRODUCT =
  "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&h=400&fit=crop";
const DEMO_IMAGE_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces";

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

export function CardDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(cardTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = useMemo(
    () =>
      Object.values(
        (cardTranslations as unknown as Record<
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
    componentSlug: "card",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "card",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "card",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Labels reutilizáveis ───────────────────────────────────────────────────
  const productTitle       = tContent("demonstration.labels.productTitle");
  const productDescription = tContent("demonstration.labels.productDescription");
  const productPrice       = tContent("demonstration.labels.productPrice");
  const productStock       = tContent("demonstration.labels.productStock");
  const actionEdit         = tContent("demonstration.labels.actionEdit");
  const actionDelete       = tContent("demonstration.labels.actionDelete");
  const actionCancel       = tContent("demonstration.labels.actionCancel");
  const actionSave         = tContent("demonstration.labels.actionSave");
  const profileTitle       = tContent("demonstration.labels.profileTitle");
  const profileDescription = tContent("demonstration.labels.profileDescription");
  const metricTitle        = tContent("demonstration.labels.metricTitle");
  const metricValue        = tContent("demonstration.labels.metricValue");
  const metricTrend        = tContent("demonstration.labels.metricTrend");

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImportBasic = `import { Card, CardContent } from "@/components/ui/card";`;

  const codeImportFull = `import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";`;

  const codeDefault = `<Card>
  <CardHeader>
    <CardTitle>Cadeira Gamer Pro</CardTitle>
    <CardDescription>
      Estrutura ergonômica com ajuste de altura e apoio lombar.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p>R$ 1.299,00</p>
  </CardContent>
</Card>`;

  const codeSmall = `<Card size="sm">
  <CardHeader>
    <CardTitle>Assinantes ativos</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="nds-text-h4 nds-font-semibold">8.742</p>
  </CardContent>
</Card>`;

  const codeWithFooter = `<Card>
  <CardHeader>
    <CardTitle>Cadeira Gamer Pro</CardTitle>
    <CardDescription>Produto atualizado em 12/04.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>R$ 1.299,00</p>
  </CardContent>
  <CardFooter className="nds-cluster" data-justify="end" data-spacing="sm">
    <Button variant="outline">Cancelar</Button>
    <Button>Salvar</Button>
  </CardFooter>
</Card>`;

  const codeWithAction = `<Card>
  <CardHeader>
    <CardTitle>Cadeira Gamer Pro</CardTitle>
    <CardDescription>Em estoque</CardDescription>
    <CardAction>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Ações do produto Cadeira Gamer Pro"
      >
        <MoreVertical aria-hidden="true" className="nds-icon" />
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    <p>R$ 1.299,00</p>
  </CardContent>
</Card>`;

  const codeWithImage = `<Card>
  <ImageWithFallback
    src="/images/chair.jpg"
    alt="Cadeira Gamer Pro em fundo neutro"
    className="nds-w-full"
    style={{ height: "10rem", objectFit: "cover" }}
  />
  <CardHeader>
    <CardTitle>Cadeira Gamer Pro</CardTitle>
    <CardDescription>Estrutura ergonômica e apoio lombar.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>R$ 1.299,00</p>
  </CardContent>
</Card>`;

  const interfaceCode = `// Card
interface CardProps extends React.ComponentProps<"div"> {
  size?: "default" | "sm";
}

// CardHeader | CardTitle | CardDescription | CardAction | CardContent | CardFooter
// Todos estendem React.ComponentProps<"div">`;

  // ─── Previews reutilizáveis ─────────────────────────────────────────────────

  const previewProductCard = (
    <Card className="nds-w-full nds-max-w-sm">
      <CardHeader>
        <CardTitle>{productTitle}</CardTitle>
        <CardDescription>{productDescription}</CardDescription>
        <CardAction>
          <Badge variant="secondary">{productStock}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="nds-text-lead nds-font-semibold">{productPrice}</p>
      </CardContent>
      <CardFooter className="nds-cluster" data-justify="end" data-spacing="sm">
        <Button
          variant="outline"
          aria-label={`${actionEdit} ${productTitle}`}
          onClick={() =>
            track("button_click", {
              component: "button",
              variant: "outline",
              label: actionEdit,
              location: "docs_demo",
            })
          }
        >
          {actionEdit}
        </Button>
        <Button
          aria-label={`${actionSave} ${productTitle}`}
          onClick={() =>
            track("button_click", {
              component: "button",
              variant: "default",
              label: actionSave,
              location: "docs_demo",
            })
          }
        >
          {actionSave}
        </Button>
      </CardFooter>
    </Card>
  );

  const previewMetricCard = (
    <Card size="sm" className="nds-w-full nds-max-w-xs">
      <CardHeader>
        <CardDescription>{metricTitle}</CardDescription>
        <CardTitle className="nds-text-h4 nds-font-semibold">{metricValue}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="nds-text-body nds-cluster" data-spacing="xs">
          <TrendingUp aria-hidden="true" className="nds-icon-sm" />
          {metricTrend}
        </p>
      </CardContent>
    </Card>
  );

  const previewProfileCard = (
    <Card className="nds-w-full nds-max-w-sm">
      <CardHeader>
        <div className="nds-cluster" data-spacing="sm">
          <Avatar>
            <AvatarImage src={DEMO_IMAGE_AVATAR} alt={`Foto de perfil de ${profileTitle}`} />
            <AvatarFallback>MR</AvatarFallback>
          </Avatar>
          <div className="nds-min-w-0">
            <CardTitle>{profileTitle}</CardTitle>
            <CardDescription>{profileDescription}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
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
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="nds-w-full nds-grid" data-cols="2" data-spacing="md" style={{ '--grid-min': '18rem' } as React.CSSProperties}>
          {previewProductCard}
          {previewMetricCard}
          {previewProfileCard}
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
            { s: tContent("usage.scenarios.item6.s"), u: tContent("usage.scenarios.item6.u"), a: tContent("usage.scenarios.item6.a") },
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
              element: tContent("usage.uxWriting.table.action.name"),
              rules: tContent("usage.uxWriting.table.action.format"),
              do: tContent("usage.uxWriting.table.action.good"),
              dont: tContent("usage.uxWriting.table.action.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.ariaLabel.name"),
              rules: tContent("usage.uxWriting.table.ariaLabel.format"),
              do: tContent("usage.uxWriting.table.ariaLabel.good"),
              dont: tContent("usage.uxWriting.table.ariaLabel.bad"),
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
              <Card className="nds-w-full">
                <CardHeader>
                  <CardTitle>{productTitle}</CardTitle>
                  <CardDescription>{productDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="nds-text-body">{productPrice}</p>
                </CardContent>
                <CardFooter className="nds-cluster" data-justify="end" data-spacing="sm">
                  <Button
                    variant="outline"
                    aria-label={`${actionCancel} ${productTitle}`}
                  >
                    {actionCancel}
                  </Button>
                  <Button aria-label={`${actionSave} ${productTitle}`}>
                    {actionSave}
                  </Button>
                </CardFooter>
              </Card>
            ),
            dontPreview: (
              <Card className="nds-w-full">
                <CardContent>
                  <div style={{ height: "3rem" }} />
                </CardContent>
              </Card>
            ),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <Card className="nds-w-full">
                <CardHeader>
                  <CardTitle>{productTitle}</CardTitle>
                  <CardDescription>{productStock}</CardDescription>
                </CardHeader>
                <CardFooter className="nds-cluster" data-justify="end" data-spacing="sm">
                  <Button
                    variant="outline"
                    aria-label={`${actionEdit} ${productTitle}`}
                  >
                    {actionEdit}
                  </Button>
                  <Button
                    variant="destructive"
                    aria-label={`${actionDelete} ${productTitle}`}
                  >
                    {actionDelete}
                  </Button>
                </CardFooter>
              </Card>
            ),
            dontPreview: (
              <Card className="nds-w-full">
                <CardHeader>
                  <CardTitle>{productTitle}</CardTitle>
                  <CardDescription>{productStock}</CardDescription>
                </CardHeader>
                <CardFooter className="nds-cluster" data-justify="end" data-spacing="sm">
                  <Button variant="outline">{actionEdit}</Button>
                  <Button variant="destructive">{actionDelete}</Button>
                </CardFooter>
              </Card>
            ),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.full")}
        secondaryCode={codeImportFull}
      />

      {/* ── Variantes (Tamanhos e Composições) ────────────────────── */}
      <DocsVariants
        title={tContent("variants.visualTitle")}
        items={[
          {
            name: "default",
            description: stripHtml(tContent("variants.items.default")),
            code: codeDefault,
            preview: (
              <Card className="nds-w-full nds-max-w-sm">
                <CardHeader>
                  <CardTitle>{productTitle}</CardTitle>
                  <CardDescription>{productDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="nds-text-base nds-font-semibold">{productPrice}</p>
                </CardContent>
              </Card>
            ),
          },
          {
            name: "sm",
            description: stripHtml(tContent("variants.items.sm")),
            code: codeSmall,
            preview: (
              <Card size="sm" className="nds-w-full nds-max-w-xs">
                <CardHeader>
                  <CardDescription>{metricTitle}</CardDescription>
                  <CardTitle className="nds-text-lead nds-font-semibold">{metricValue}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="nds-text-caption nds-text-muted-foreground">{metricTrend}</p>
                </CardContent>
              </Card>
            ),
          },
          {
            name: "withFooter",
            description: stripHtml(tContent("variants.items.withFooter")),
            code: codeWithFooter,
            preview: (
              <Card className="nds-w-full nds-max-w-sm">
                <CardHeader>
                  <CardTitle>{productTitle}</CardTitle>
                  <CardDescription>{productDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="nds-text-body">{productPrice}</p>
                </CardContent>
                <CardFooter className="nds-cluster" data-justify="end" data-spacing="sm">
                  <Button
                    variant="outline"
                    aria-label={`${actionCancel} ${productTitle}`}
                  >
                    {actionCancel}
                  </Button>
                  <Button aria-label={`${actionSave} ${productTitle}`}>
                    {actionSave}
                  </Button>
                </CardFooter>
              </Card>
            ),
          },
          {
            name: "withAction",
            description: stripHtml(tContent("variants.items.withAction")),
            code: codeWithAction,
            preview: (
              <Card className="nds-w-full nds-max-w-sm">
                <CardHeader>
                  <CardTitle>{productTitle}</CardTitle>
                  <CardDescription>{productStock}</CardDescription>
                  <CardAction>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Ações do produto ${productTitle}`}
                    >
                      <MoreVertical aria-hidden="true" className="nds-icon" />
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p className="nds-text-body">{productPrice}</p>
                </CardContent>
              </Card>
            ),
          },
          {
            name: "withImage",
            description: stripHtml(tContent("variants.items.withImage")),
            code: codeWithImage,
            preview: (
              <Card className="nds-w-full nds-max-w-sm">
                <ImageWithFallback
                  src={DEMO_IMAGE_PRODUCT}
                  alt={`${productTitle} em fundo neutro`}
                  className="nds-w-full"
                  style={{ height: "10rem", objectFit: "cover" }}
                />
                <CardHeader>
                  <CardTitle>{productTitle}</CardTitle>
                  <CardDescription>{productDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="nds-text-body">{productPrice}</p>
                </CardContent>
              </Card>
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
            label: tContent("states.default.label"),
            trigger: toPlainText(tContent("states.default.trigger")),
            behavior: toPlainText(tContent("states.default.behavior")),
          },
          {
            label: tContent("states.small.label"),
            trigger: toPlainText(tContent("states.small.trigger")),
            behavior: toPlainText(tContent("states.small.behavior")),
          },
          {
            label: tContent("states.interactive.label"),
            trigger: toPlainText(tContent("states.interactive.trigger")),
            behavior: toPlainText(tContent("states.interactive.behavior")),
          },
        ]}
      />

      {/* ── Propriedades (7 tabelas) ──────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: tContent("props.cardTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "size",      type: '"default" | "sm"',    defaultValue: '"default"', required: "Não", description: toPlainText(tContent("props.table.size")) },
              { name: "className", type: "string",              defaultValue: "—",          required: "Não", description: tContent("props.table.className") },
              { name: "children",  type: "React.ReactNode",     defaultValue: "—",          required: "Sim", description: tContent("props.table.children") },
            ],
          },
          {
            title: tContent("props.headerTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "className", type: "string",          defaultValue: "—", required: "Não", description: tContent("props.table.className") },
              { name: "children",  type: "React.ReactNode", defaultValue: "—", required: "Sim", description: tContent("props.table.children") },
            ],
          },
          {
            title: tContent("props.cardTitleTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "className", type: "string",          defaultValue: "—", required: "Não", description: tContent("props.table.className") },
              { name: "children",  type: "React.ReactNode", defaultValue: "—", required: "Sim", description: tContent("props.table.children") },
            ],
          },
          {
            title: tContent("props.descriptionTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "className", type: "string",          defaultValue: "—", required: "Não", description: tContent("props.table.className") },
              { name: "children",  type: "React.ReactNode", defaultValue: "—", required: "Sim", description: tContent("props.table.children") },
            ],
          },
          {
            title: tContent("props.actionTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "className", type: "string",          defaultValue: "—", required: "Não", description: tContent("props.table.className") },
              { name: "children",  type: "React.ReactNode", defaultValue: "—", required: "Sim", description: tContent("props.table.children") },
            ],
          },
          {
            title: tContent("props.contentTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "className", type: "string",          defaultValue: "—", required: "Não", description: tContent("props.table.className") },
              { name: "children",  type: "React.ReactNode", defaultValue: "—", required: "Sim", description: tContent("props.table.children") },
            ],
          },
          {
            title: tContent("props.footerTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "className", type: "string",          defaultValue: "—", required: "Não", description: tContent("props.table.className") },
              { name: "children",  type: "React.ReactNode", defaultValue: "—", required: "Sim", description: tContent("props.table.children") },
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
          { token: "--radius-card",       value: "rounded-(--radius-card)",   description: tContent("tokens.table.radiusCard") },
          { token: "--card",              value: "bg-card",                   description: tContent("tokens.table.card") },
          { token: "--card-foreground",   value: "text-card-foreground",      description: tContent("tokens.table.cardForeground") },
          { token: "--muted",             value: "nds-bg-muted-50",               description: toPlainText(tContent("tokens.table.muted")) },
          { token: "--muted-foreground",  value: "nds-text-muted-foreground",     description: tContent("tokens.table.mutedForeground") },
          { token: "--foreground",        value: "ring-foreground/10",        description: toPlainText(tContent("tokens.table.foreground")) },
          { token: "--border",            value: "border-t",                  description: tContent("tokens.table.border") },
          { token: "--card-bg",           value: "hsl(var(--card))",          description: tContent("tokens.table.cardBg") },
          { token: "--card-fg",           value: "hsl(var(--card-foreground))", description: tContent("tokens.table.cardFg") },
          { token: "--card-ring",         value: "hsl(var(--foreground) / 0.1)", description: tContent("tokens.table.cardRing") },
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
          tContent("accessibility.item1"),
          tContent("accessibility.item2"),
          tContent("accessibility.item3"),
          tContent("accessibility.item4"),
          tContent("accessibility.item5"),
        ]}
        keyboardTitle={tContent("accessibility.keyboardTitle")}
        keyboardItems={[
          { key: "Tab",   description: tContent("accessibility.keyboard.tab") },
          { key: "Enter", description: tContent("accessibility.keyboard.enter") },
          { key: "—",     description: tContent("accessibility.keyboard.noKeyboard") },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          { name: "Separator", description: toPlainText(tContent("related.separator")),            path: "?path=/docs/ui-separator--docs" },
          { name: "Accordion", description: toPlainText(tContent("related.accordion")),            path: "?path=/docs/ui-accordion--docs" },
          { name: "Alert",     description: toPlainText(tContent("related.alert")),                path: "?path=/docs/ui-alert--docs" },
          { name: "Button",    description: toPlainText(tContent("related.button")),    path: "?path=/docs/ui-button--docs" },
          { name: "Badge",     description: toPlainText(tContent("related.badge")),     path: "?path=/docs/ui-badge--docs" },
          { name: "Avatar",    description: toPlainText(tContent("related.avatar")),    path: "?path=/docs/ui-avatar--docs" },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        items={[
          { title: "", content: tContent("notes.tip1") },
          { title: "", content: tContent("notes.tip2") },
          { title: "", content: tContent("notes.tip3") },
          { title: "", content: tContent("notes.tip4") },
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
            event: tContent("analytics.table.buttonClick"),
            trigger: toPlainText(tContent("analytics.table.buttonClickTrigger")),
            payload: tContent("analytics.table.buttonClickPayload"),
          },
          {
            event: tContent("analytics.table.cardClick"),
            trigger: toPlainText(tContent("analytics.table.cardClickTrigger")),
            payload: tContent("analytics.table.cardClickPayload"),
          },
          {
            event: tContent("analytics.table.pageView"),
            trigger: toPlainText(tContent("analytics.table.pageViewTrigger")),
            payload: tContent("analytics.table.pageViewPayload"),
          },
          {
            event: tContent("analytics.table.sectionViewed"),
            trigger: toPlainText(tContent("analytics.table.sectionViewedTrigger")),
            payload: tContent("analytics.table.sectionViewedPayload"),
          },
          {
            event: tContent("analytics.table.langSwitch"),
            trigger: toPlainText(tContent("analytics.table.langSwitchTrigger")),
            payload: tContent("analytics.table.langSwitchPayload"),
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
          items: [1, 2, 3, 4, 5, 6].map((i) => ({
            action: toPlainText(tContent(`testes.functional.item${i}.action`)),
            result: toPlainText(tContent(`testes.functional.item${i}.result`)),
            priority: tNav(priorityKeyMap[tContent(`testes.functional.item${i}.priority`)] ?? "common.high"),
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
            criterion: toPlainText(tContent(`testes.accessibility.item${i}.criterion`)),
            level: tContent(`testes.accessibility.item${i}.level`),
            how: toPlainText(tContent(`testes.accessibility.item${i}.how`)),
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4, 5].map((i) => ({
            story: tContent(`testes.visual.item${i}.story`),
            priority: tNav(priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ?? "common.high"),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
