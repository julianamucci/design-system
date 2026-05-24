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
import { DocsCompositions } from "@/components/docs/shared/sections/DocsCompositions";
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

export function CardDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(cardTranslations);

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
    <p className="text-2xl font-semibold">8.742</p>
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
  <CardFooter className="justify-end gap-2">
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
        <MoreVertical aria-hidden="true" className="h-4 w-4" />
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
    className="h-40 w-full object-cover"
  />
  <CardHeader>
    <CardTitle>Cadeira Gamer Pro</CardTitle>
    <CardDescription>Estrutura ergonômica e apoio lombar.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>R$ 1.299,00</p>
  </CardContent>
</Card>`;

  const codeCustomizationTokens = `/* Em globals.css — tokens do Card */
:root {
  --radius-card: 0.75rem;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
}

.dark {
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
}`;

  const interfaceCode = `// Card
interface CardProps extends React.ComponentProps<"div"> {
  size?: "default" | "sm";
}

// CardHeader | CardTitle | CardDescription | CardAction | CardContent | CardFooter
// Todos estendem React.ComponentProps<"div">`;

  // ─── Previews reutilizáveis ─────────────────────────────────────────────────

  const previewProductCard = (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{productTitle}</CardTitle>
        <CardDescription>{productDescription}</CardDescription>
        <CardAction>
          <Badge variant="secondary">{productStock}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">{productPrice}</p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button
          variant="outline"
          aria-label={`${actionEdit} ${productTitle}`}
        >
          {actionEdit}
        </Button>
        <Button aria-label={`${actionSave} ${productTitle}`}>{actionSave}</Button>
      </CardFooter>
    </Card>
  );

  const previewMetricCard = (
    <Card size="sm" className="w-full max-w-xs">
      <CardHeader>
        <CardDescription>{metricTitle}</CardDescription>
        <CardTitle className="text-2xl">{metricValue}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <TrendingUp aria-hidden="true" className="h-3.5 w-3.5" />
          {metricTrend}
        </p>
      </CardContent>
    </Card>
  );

  const previewProfileCard = (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={DEMO_IMAGE_AVATAR} alt={`Foto de perfil de ${profileTitle}`} />
            <AvatarFallback>MR</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
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
          installNote="npx shadcn@latest add card"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
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
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>{productTitle}</CardTitle>
                  <CardDescription>{productDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{productPrice}</p>
                </CardContent>
                <CardFooter className="justify-end gap-2">
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
              <Card className="w-full">
                <CardContent>
                  <div className="h-12" />
                </CardContent>
              </Card>
            ),
            doCaption: stripHtml(tContent("doDont.pair1.do")),
            dontCaption: stripHtml(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>{productTitle}</CardTitle>
                  <CardDescription>{productStock}</CardDescription>
                </CardHeader>
                <CardFooter className="justify-end gap-2">
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
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>{productTitle}</CardTitle>
                  <CardDescription>{productStock}</CardDescription>
                </CardHeader>
                <CardFooter className="justify-end gap-2">
                  <Button variant="outline">{actionEdit}</Button>
                  <Button variant="destructive">{actionDelete}</Button>
                </CardFooter>
              </Card>
            ),
            doCaption: stripHtml(tContent("doDont.pair2.do")),
            dontCaption: stripHtml(tContent("doDont.pair2.dont")),
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
              <Card className="w-full max-w-sm">
                <CardHeader>
                  <CardTitle>{productTitle}</CardTitle>
                  <CardDescription>{productDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-base font-semibold">{productPrice}</p>
                </CardContent>
              </Card>
            ),
          },
          {
            name: "sm",
            description: stripHtml(tContent("variants.items.sm")),
            code: codeSmall,
            preview: (
              <Card size="sm" className="w-full max-w-xs">
                <CardHeader>
                  <CardDescription>{metricTitle}</CardDescription>
                  <CardTitle className="text-xl">{metricValue}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{metricTrend}</p>
                </CardContent>
              </Card>
            ),
          },
          {
            name: "withFooter",
            description: stripHtml(tContent("variants.items.withFooter")),
            code: codeWithFooter,
            preview: (
              <Card className="w-full max-w-sm">
                <CardHeader>
                  <CardTitle>{productTitle}</CardTitle>
                  <CardDescription>{productDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{productPrice}</p>
                </CardContent>
                <CardFooter className="justify-end gap-2">
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
              <Card className="w-full max-w-sm">
                <CardHeader>
                  <CardTitle>{productTitle}</CardTitle>
                  <CardDescription>{productStock}</CardDescription>
                  <CardAction>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Ações do produto ${productTitle}`}
                    >
                      <MoreVertical aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{productPrice}</p>
                </CardContent>
              </Card>
            ),
          },
          {
            name: "withImage",
            description: stripHtml(tContent("variants.items.withImage")),
            code: codeWithImage,
            preview: (
              <Card className="w-full max-w-sm">
                <ImageWithFallback
                  src={DEMO_IMAGE_PRODUCT}
                  alt={`${productTitle} em fundo neutro`}
                  className="h-40 w-full object-cover"
                />
                <CardHeader>
                  <CardTitle>{productTitle}</CardTitle>
                  <CardDescription>{productDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{productPrice}</p>
                </CardContent>
              </Card>
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        componentSlug="card"
        useWhenLabel={tNav("common.useWhen")}
        items={[
          {
            name: tContent("variants.compositions.withFooter.name"),
            description: tContent("variants.compositions.withFooter.description"),
            useWhen: tContent("variants.compositions.withFooter.use"),
            code: `<Card className="w-full max-w-sm">\n  <CardHeader>\n    <CardTitle>Cadeira Gamer Pro</CardTitle>\n    <CardDescription>Estrutura ergonômica com ajuste de altura.</CardDescription>\n  </CardHeader>\n  <CardContent>\n    <p className="text-lg font-semibold">R$ 1.299,00</p>\n  </CardContent>\n  <CardFooter className="justify-end gap-2">\n    <Button variant="outline" aria-label="Editar produto Cadeira Gamer Pro">Editar</Button>\n    <Button variant="destructive" aria-label="Excluir produto Cadeira Gamer Pro">Excluir</Button>\n  </CardFooter>\n</Card>`,
            preview: (
              <Card className="w-full max-w-sm">
                <CardHeader>
                  <CardTitle>Cadeira Gamer Pro</CardTitle>
                  <CardDescription>Estrutura ergonômica com ajuste de altura.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">R$ 1.299,00</p>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                  <Button variant="outline" aria-label="Editar produto Cadeira Gamer Pro">Editar</Button>
                  <Button variant="destructive" aria-label="Excluir produto Cadeira Gamer Pro">Excluir</Button>
                </CardFooter>
              </Card>
            ),
          },
          {
            name: tContent("variants.compositions.withAction.name"),
            description: tContent("variants.compositions.withAction.description"),
            useWhen: tContent("variants.compositions.withAction.use"),
            code: `<Card className="w-full max-w-sm">\n  <CardHeader>\n    <CardTitle>Assinantes ativos</CardTitle>\n    <CardDescription>+12% no mês</CardDescription>\n    <CardAction>\n      <Button variant="outline" size="sm" aria-label="Editar métrica Assinantes ativos">Editar</Button>\n    </CardAction>\n  </CardHeader>\n  <CardContent>\n    <p className="text-2xl font-semibold">8.742</p>\n  </CardContent>\n</Card>`,
            preview: (
              <Card className="w-full max-w-sm">
                <CardHeader>
                  <CardTitle>Assinantes ativos</CardTitle>
                  <CardDescription>+12% no mês</CardDescription>
                  <CardAction>
                    <Button variant="outline" size="sm" aria-label="Editar métrica Assinantes ativos">Editar</Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">8.742</p>
                </CardContent>
              </Card>
            ),
          },
          {
            name: tContent("variants.compositions.withImage.name"),
            description: tContent("variants.compositions.withImage.description"),
            useWhen: tContent("variants.compositions.withImage.use"),
            code: `<Card className="w-full max-w-sm">\n  <img\n    src="https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80"\n    alt="Cadeira Gamer Pro"\n    className="w-full h-40 object-cover"\n  />\n  <CardHeader>\n    <CardTitle>Cadeira Gamer Pro</CardTitle>\n    <CardDescription>Estrutura ergonômica.</CardDescription>\n  </CardHeader>\n</Card>`,
            preview: (
              <Card className="w-full max-w-sm">
                <img
                  src="https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80"
                  alt="Cadeira Gamer Pro"
                  className="w-full h-40 object-cover"
                />
                <CardHeader>
                  <CardTitle>Cadeira Gamer Pro</CardTitle>
                  <CardDescription>Estrutura ergonômica.</CardDescription>
                </CardHeader>
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
          trigger: tContent("states.cols.trigger"),
          behavior: tContent("states.cols.behavior"),
        }}
        items={[
          {
            label: tContent("states.default.label"),
            trigger: stripHtml(tContent("states.default.trigger")),
            behavior: stripHtml(tContent("states.default.behavior")),
          },
          {
            label: tContent("states.small.label"),
            trigger: stripHtml(tContent("states.small.trigger")),
            behavior: stripHtml(tContent("states.small.behavior")),
          },
          {
            label: tContent("states.interactive.label"),
            trigger: stripHtml(tContent("states.interactive.trigger")),
            behavior: stripHtml(tContent("states.interactive.behavior")),
          },
          {
            label: tContent("states.withImage.label"),
            trigger: stripHtml(tContent("states.withImage.trigger")),
            behavior: stripHtml(tContent("states.withImage.behavior")),
          },
          {
            label: tContent("states.withFooter.label"),
            trigger: stripHtml(tContent("states.withFooter.trigger")),
            behavior: stripHtml(tContent("states.withFooter.behavior")),
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
              { name: "size",      type: '"default" | "sm"',    defaultValue: '"default"', required: "Não", description: stripHtml(tContent("props.table.size")) },
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
          { token: "--muted",             value: "bg-muted/50",               description: stripHtml(tContent("tokens.table.muted")) },
          { token: "--muted-foreground",  value: "text-muted-foreground",     description: tContent("tokens.table.mutedForeground") },
          { token: "--foreground",        value: "ring-foreground/10",        description: stripHtml(tContent("tokens.table.foreground")) },
          { token: "--border",            value: "border-t",                  description: tContent("tokens.table.border") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeCustomizationTokens}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
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
          { name: "Separator", description: tContent("related.separator"),            path: "?path=/docs/ui-separator--docs" },
          { name: "Accordion", description: tContent("related.accordion"),            path: "?path=/docs/ui-accordion--docs" },
          { name: "Alert",     description: tContent("related.alert"),                path: "?path=/docs/ui-alert--docs" },
          { name: "Button",    description: stripHtml(tContent("related.button")),    path: "?path=/docs/ui-button--docs" },
          { name: "Badge",     description: stripHtml(tContent("related.badge")),     path: "?path=/docs/ui-badge--docs" },
          { name: "Avatar",    description: stripHtml(tContent("related.avatar")),    path: "?path=/docs/ui-avatar--docs" },
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
          trigger: tContent("analytics.table.trigger"),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: tContent("analytics.table.buttonClick"),
            trigger: tContent("analytics.table.buttonClickTrigger"),
            payload: tContent("analytics.table.buttonClickPayload"),
          },
          {
            event: tContent("analytics.table.cardClick"),
            trigger: stripHtml(tContent("analytics.table.cardClickTrigger")),
            payload: tContent("analytics.table.cardClickPayload"),
          },
          {
            event: tContent("analytics.table.pageView"),
            trigger: tContent("analytics.table.pageViewTrigger"),
            payload: tContent("analytics.table.pageViewPayload"),
          },
          {
            event: tContent("analytics.table.sectionViewed"),
            trigger: tContent("analytics.table.sectionViewedTrigger"),
            payload: tContent("analytics.table.sectionViewedPayload"),
          },
          {
            event: tContent("analytics.table.langSwitch"),
            trigger: tContent("analytics.table.langSwitchTrigger"),
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
            action: stripHtml(tContent(`testes.functional.item${i}.action`)),
            result: stripHtml(tContent(`testes.functional.item${i}.result`)),
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
            criterion: stripHtml(tContent(`testes.accessibility.item${i}.criterion`)),
            level: tContent(`testes.accessibility.item${i}.level`),
            how: stripHtml(tContent(`testes.accessibility.item${i}.how`)),
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
