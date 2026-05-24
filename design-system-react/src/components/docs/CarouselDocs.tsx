import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import carouselTranslations from "@shared/content/carousel/translations.json";

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


// ─── Helpers de slide ─────────────────────────────────────────────────────────

function SlideCard({ label, className = "" }: { label: string; className?: string }) {
  return (
    <Card className={`h-40 shadow-none ${className}`}>
      <CardContent className="flex h-full items-center justify-center">
        <span className="text-2xl font-semibold text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

function DotsCarouselPreview({ total, ariaLabel, previousLabel, nextLabel, slidePrefix, goToLabel, ofLabel }: {
  total: number;
  ariaLabel: string;
  previousLabel: string;
  nextLabel: string;
  slidePrefix: string;
  goToLabel: string;
  ofLabel: string;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <div className="w-full max-w-md space-y-3">
      <Carousel className="w-full" aria-label={ariaLabel} setApi={setApi}>
        <CarouselContent>
          {Array.from({ length: total }).map((_, i) => (
            <CarouselItem key={i}>
              <SlideCard label={`${slidePrefix} ${i + 1}`} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious aria-label={previousLabel} />
        <CarouselNext aria-label={nextLabel} />
      </Carousel>
      <div className="flex items-center justify-center gap-2" aria-label={goToLabel}>
        {Array.from({ length: total }).map((_, i) => {
          const active = i === current;
          return (
            <button
              key={i}
              type="button"
              aria-label={`${goToLabel} ${i + 1} ${ofLabel} ${total}`}
              aria-current={active ? "true" : "false"}
              onClick={() => api?.scrollTo(i)}
              className={`h-2 w-2 rounded-full transition-colors ${active ? "bg-primary" : "bg-muted-foreground/30"}`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CarouselDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(carouselTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "carousel",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "carousel",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "carousel",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  const previousLabel = tContent("demonstration.labels.previous");
  const nextLabel = tContent("demonstration.labels.next");

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";`;

  const codeImportWithPlugin = `import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";`;

  const codeHorizontal = `<Carousel className="w-full max-w-md" aria-label="Galeria de exemplos">
  <CarouselContent>
    {Array.from({ length: 5 }).map((_, i) => (
      <CarouselItem key={i}>
        <Card>
          <CardContent className="flex h-40 items-center justify-center">
            Slide {i + 1}
          </CardContent>
        </Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`;

  const codeVertical = `<Carousel
  orientation="vertical"
  className="w-full max-w-xs"
  aria-label="Galeria vertical"
>
  <CarouselContent className="h-[200px]">
    {Array.from({ length: 5 }).map((_, i) => (
      <CarouselItem key={i} className="basis-full">
        <Card>
          <CardContent className="flex h-40 items-center justify-center">
            Slide {i + 1}
          </CardContent>
        </Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`;

  const codeSingle = `<Carousel className="w-full max-w-md">
  <CarouselContent>
    <CarouselItem>...</CarouselItem>
    <CarouselItem>...</CarouselItem>
    <CarouselItem>...</CarouselItem>
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`;

  const codeMulti = `<Carousel className="w-full max-w-2xl">
  <CarouselContent>
    {items.map((item) => (
      <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
        <Card>
          <CardContent>{item.label}</CardContent>
        </Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`;

  const codeCustomizationTokens = `/* Personalização de tokens no tema */
:root {
  --primary: 222.2 47.4% 11.2%;
  --ring: 222.2 84% 4.9%;
  --radius-button: 0.5rem;
}

.dark {
  --primary: 210 40% 98%;
  --ring: 212.7 26.8% 83.9%;
}`;

  const interfaceCode = `// Carousel
interface CarouselProps extends React.ComponentProps<"div"> {
  opts?: EmblaOptionsType;
  plugins?: EmblaPluginType[];
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
}

// CarouselContent / CarouselItem
interface CarouselContentProps extends React.ComponentProps<"div"> {}
interface CarouselItemProps extends React.ComponentProps<"div"> {}

// CarouselPrevious / CarouselNext
interface CarouselNavProps extends React.ComponentProps<typeof Button> {}`;

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="carousel"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
          installNote="npx shadcn@latest add carousel"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="flex w-full items-center justify-center">
          <Carousel
            className="w-full max-w-md"
            aria-label={stripHtml(tContent("usage.uxWriting.table.caption.good"))}
          >
            <CarouselContent>
              {Array.from({ length: 5 }).map((_, i) => (
                <CarouselItem key={i}>
                  <SlideCard label={`${tContent("demonstration.labels.slide")} ${i + 1}`} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious aria-label={previousLabel} />
            <CarouselNext aria-label={nextLabel} />
          </Carousel>
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
              element: tContent("usage.uxWriting.table.previous.name"),
              rules: tContent("usage.uxWriting.table.previous.format"),
              do: tContent("usage.uxWriting.table.previous.good"),
              dont: stripHtml(tContent("usage.uxWriting.table.previous.bad")),
            },
            {
              element: tContent("usage.uxWriting.table.next.name"),
              rules: tContent("usage.uxWriting.table.next.format"),
              do: tContent("usage.uxWriting.table.next.good"),
              dont: stripHtml(tContent("usage.uxWriting.table.next.bad")),
            },
            {
              element: tContent("usage.uxWriting.table.dots.name"),
              rules: tContent("usage.uxWriting.table.dots.format"),
              do: tContent("usage.uxWriting.table.dots.good"),
              dont: tContent("usage.uxWriting.table.dots.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.caption.name"),
              rules: tContent("usage.uxWriting.table.caption.format"),
              do: tContent("usage.uxWriting.table.caption.good"),
              dont: tContent("usage.uxWriting.table.caption.bad"),
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
              <Carousel className="w-full" aria-label={stripHtml(tContent("usage.uxWriting.table.caption.good"))}>
                <CarouselContent>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CarouselItem key={i}>
                      <SlideCard label={`${tContent("demonstration.labels.slide")} ${i + 1}`} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious aria-label={previousLabel} />
                <CarouselNext aria-label={nextLabel} />
              </Carousel>
            ),
            dontPreview: (
              <Carousel className="w-full" aria-label={stripHtml(tContent("usage.uxWriting.table.caption.good"))}>
                <CarouselContent>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CarouselItem key={i}>
                      <SlideCard label={`${tContent("demonstration.labels.slide")} ${i + 1}`} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            ),
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <Carousel className="w-full" aria-label={stripHtml(tContent("usage.uxWriting.table.caption.good"))}>
                <CarouselContent>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CarouselItem key={i}>
                      <SlideCard label={`${tContent("demonstration.labels.slide")} ${i + 1}`} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious aria-label={previousLabel} />
                <CarouselNext aria-label={nextLabel} />
              </Carousel>
            ),
            dontPreview: (
              <Carousel className="w-full" aria-label={stripHtml(tContent("usage.uxWriting.table.caption.good"))}>
                <CarouselContent>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CarouselItem key={i}>
                      <SlideCard label={`${tContent("demonstration.labels.slide")} ${i + 1}`} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious aria-label={previousLabel} />
                <CarouselNext aria-label={nextLabel} />
              </Carousel>
            ),
            doCaption: tContent("doDont.pair2.do"),
            dontCaption: tContent("doDont.pair2.dont"),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withPlugin")}
        secondaryCode={codeImportWithPlugin}
      />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        componentSlug="carousel"
        items={[
          {
            name: "horizontal",
            description: stripHtml(tContent("variants.items.horizontal")),
            code: codeHorizontal,
            preview: (
              <Carousel className="w-full max-w-md" aria-label={stripHtml(tContent("usage.uxWriting.table.caption.good"))}>
                <CarouselContent>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <CarouselItem key={i}>
                      <SlideCard label={`${tContent("demonstration.labels.slide")} ${i + 1}`} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious aria-label={previousLabel} />
                <CarouselNext aria-label={nextLabel} />
              </Carousel>
            ),
          },
          {
            name: "vertical",
            description: stripHtml(tContent("variants.items.vertical")),
            code: codeVertical,
            preview: (
              <Carousel
                orientation="vertical"
                className="w-full max-w-xs"
                aria-label={stripHtml(tContent("usage.uxWriting.table.caption.good"))}
              >
                <CarouselContent className="h-[200px]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <CarouselItem key={i} className="basis-full">
                      <SlideCard label={`${tContent("demonstration.labels.slide")} ${i + 1}`} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious aria-label={previousLabel} />
                <CarouselNext aria-label={nextLabel} />
              </Carousel>
            ),
          },
          {
            name: "single",
            description: stripHtml(tContent("variants.items.single")),
            code: codeSingle,
            preview: (
              <Carousel className="w-full max-w-md" aria-label={stripHtml(tContent("usage.uxWriting.table.caption.good"))}>
                <CarouselContent>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CarouselItem key={i}>
                      <SlideCard label={`${tContent("demonstration.labels.slide")} ${i + 1}`} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious aria-label={previousLabel} />
                <CarouselNext aria-label={nextLabel} />
              </Carousel>
            ),
          },
          {
            name: "multi",
            description: stripHtml(tContent("variants.items.multi")),
            code: codeMulti,
            preview: (
              <Carousel className="w-full max-w-2xl" aria-label={stripHtml(tContent("usage.uxWriting.table.caption.good"))}>
                <CarouselContent>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                      <SlideCard label={`${tContent("demonstration.labels.slide")} ${i + 1}`} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious aria-label={previousLabel} />
                <CarouselNext aria-label={nextLabel} />
              </Carousel>
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="carousel"
        items={[
          {
            name: tContent("variants.compositions.withDots.name"),
            description: tContent("variants.compositions.withDots.description"),
            useWhen: tContent("variants.compositions.withDots.use"),
            code: `function GalleryWithDots() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <div className="space-y-3">
      <Carousel setApi={setApi} aria-label="Galeria de fotos do produto">
        <CarouselContent>
          {slides.map((s, i) => (
            <CarouselItem key={i}>{s}</CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious aria-label="Item anterior" />
        <CarouselNext aria-label="Próximo item" />
      </Carousel>
      <div className="flex justify-center gap-2" aria-label="Ir para o slide">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={\`Ir para o slide \${i + 1} de \${slides.length}\`}
            aria-current={i === current ? "true" : "false"}
            onClick={() => api?.scrollTo(i)}
            className={\`h-2 w-2 rounded-full \${i === current ? "bg-primary" : "bg-muted-foreground/30"}\`}
          />
        ))}
      </div>
    </div>
  );
}`,
            preview: (
              <DotsCarouselPreview
                total={5}
                ariaLabel={stripHtml(tContent("usage.uxWriting.table.caption.good"))}
                previousLabel={previousLabel}
                nextLabel={nextLabel}
                slidePrefix={tContent("demonstration.labels.slide")}
                goToLabel={tContent("demonstration.labels.goToSlide")}
                ofLabel={tContent("demonstration.labels.of")}
              />
            ),
          },
          {
            name: tContent("variants.compositions.gallery.name"),
            description: tContent("variants.compositions.gallery.description"),
            useWhen: tContent("variants.compositions.gallery.use"),
            code: `<Carousel className="w-full max-w-md" aria-label="Galeria de fotos do produto">
  <CarouselContent>
    {photos.map((photo) => (
      <CarouselItem key={photo.id}>
        <Card className="overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
            <span className="text-2xl font-semibold">{photo.title}</span>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold">{photo.title}</h3>
            <p className="text-sm text-muted-foreground">{photo.description}</p>
          </CardContent>
        </Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`,
            preview: (
              <Carousel
                className="w-full max-w-md"
                aria-label={stripHtml(tContent("usage.uxWriting.table.caption.good"))}
              >
                <CarouselContent>
                  {[
                    { title: "Foto 1", description: "Paisagem ao amanhecer" },
                    { title: "Foto 2", description: "Detalhe arquitetônico" },
                    { title: "Foto 3", description: "Cidade à noite" },
                    { title: "Foto 4", description: "Praia vista do alto" },
                  ].map((photo, i) => (
                    <CarouselItem key={i}>
                      <Card className="overflow-hidden shadow-none">
                        <div className="aspect-video bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
                          <span className="text-2xl font-semibold text-foreground">{photo.title}</span>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-foreground">{photo.title}</h3>
                          <p className="text-sm text-muted-foreground">{photo.description}</p>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious aria-label={previousLabel} />
                <CarouselNext aria-label={nextLabel} />
              </Carousel>
            ),
          },
          {
            name: tContent("variants.compositions.autoplay.name"),
            description: tContent("variants.compositions.autoplay.description"),
            useWhen: tContent("variants.compositions.autoplay.use"),
            code: `import Autoplay from "embla-carousel-autoplay";

<Carousel
  opts={{ loop: true }}
  plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
  aria-label="Destaques"
>
  <CarouselContent>
    {highlights.map((h, i) => (
      <CarouselItem key={i}>{h}</CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`,
            preview: (
              <Carousel
                className="w-full max-w-md"
                opts={{ loop: true }}
                aria-label={stripHtml(tContent("usage.uxWriting.table.caption.good"))}
              >
                <CarouselContent>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <CarouselItem key={i}>
                      <SlideCard label={`${tContent("demonstration.labels.slide")} ${i + 1}`} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious aria-label={previousLabel} />
                <CarouselNext aria-label={nextLabel} />
              </Carousel>
            ),
          },
          {
            name: tContent("variants.compositions.multiResponsive.name"),
            description: tContent("variants.compositions.multiResponsive.description"),
            useWhen: tContent("variants.compositions.multiResponsive.use"),
            code: `<Carousel className="w-full max-w-2xl" aria-label="Cards de produto">
  <CarouselContent>
    {products.map((p) => (
      <CarouselItem key={p.id} className="md:basis-1/2 lg:basis-1/3">
        <Card>
          <CardContent>{p.name}</CardContent>
        </Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`,
            preview: (
              <Carousel
                className="w-full max-w-2xl"
                aria-label={stripHtml(tContent("usage.uxWriting.table.caption.good"))}
              >
                <CarouselContent>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                      <SlideCard label={`${tContent("demonstration.labels.slide")} ${i + 1}`} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious aria-label={previousLabel} />
                <CarouselNext aria-label={nextLabel} />
              </Carousel>
            ),
          },
        ]}
      />

      {/* ── Configurações (States) ────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: tContent("states.cols.trigger"),
          behavior: tContent("states.cols.behavior"),
        }}
        items={[
          {
            label: tContent("states.single.label"),
            trigger: stripHtml(tContent("states.single.trigger")),
            behavior: tContent("states.single.behavior"),
          },
          {
            label: tContent("states.multi.label"),
            trigger: stripHtml(tContent("states.multi.trigger")),
            behavior: stripHtml(tContent("states.multi.behavior")),
          },
          {
            label: tContent("states.autoplay.label"),
            trigger: stripHtml(tContent("states.autoplay.trigger")),
            behavior: stripHtml(tContent("states.autoplay.behavior")),
          },
          {
            label: tContent("states.vertical.label"),
            trigger: stripHtml(tContent("states.vertical.trigger")),
            behavior: tContent("states.vertical.behavior"),
          },
          {
            label: tContent("states.disabled.label"),
            trigger: stripHtml(tContent("states.disabled.trigger")),
            behavior: stripHtml(tContent("states.disabled.behavior")),
          },
        ]}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: tContent("props.carouselTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "opts",
                type: "EmblaOptionsType",
                defaultValue: "—",
                required: "Não",
                description: stripHtml(tContent("props.table.opts")),
              },
              {
                name: "plugins",
                type: "EmblaPluginType[]",
                defaultValue: "—",
                required: "Não",
                description: stripHtml(tContent("props.table.plugins")),
              },
              {
                name: "orientation",
                type: '"horizontal" | "vertical"',
                defaultValue: '"horizontal"',
                required: "Não",
                description: stripHtml(tContent("props.table.orientation")),
              },
              {
                name: "setApi",
                type: "(api: CarouselApi) => void",
                defaultValue: "—",
                required: "Não",
                description: stripHtml(tContent("props.table.setApi")),
              },
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.table.className"),
              },
              {
                name: "children",
                type: "React.ReactNode",
                defaultValue: "—",
                required: "Sim",
                description: tContent("props.table.children"),
              },
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
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.table.className"),
              },
              {
                name: "children",
                type: "React.ReactNode",
                defaultValue: "—",
                required: "Sim",
                description: tContent("props.table.children"),
              },
            ],
          },
          {
            title: tContent("props.itemTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.table.className"),
              },
              {
                name: "children",
                type: "React.ReactNode",
                defaultValue: "—",
                required: "Sim",
                description: tContent("props.table.children"),
              },
            ],
          },
          {
            title: tContent("props.navTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "variant",
                type: '"default" | "outline" | "ghost" | ...',
                defaultValue: '"outline"',
                required: "Não",
                description: stripHtml(tContent("props.table.variant")),
              },
              {
                name: "size",
                type: '"default" | "sm" | "lg" | "icon" | "icon-sm"',
                defaultValue: '"icon-sm"',
                required: "Não",
                description: stripHtml(tContent("props.table.size")),
              },
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.table.className"),
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
          { token: "--background",    value: "bg-background",  description: tContent("tokens.table.background") },
          { token: "--foreground",    value: "text-foreground", description: tContent("tokens.table.foreground") },
          { token: "--border",        value: "border",          description: tContent("tokens.table.border") },
          { token: "--accent",        value: "hover:bg-accent", description: tContent("tokens.table.accent") },
          { token: "--ring",          value: "focus-visible:ring-ring", description: tContent("tokens.table.ring") },
          { token: "--radius-button", value: "rounded-(--radius-button)", description: tContent("tokens.table.radiusButton") },
          { token: "--primary",       value: "bg-primary",      description: tContent("tokens.table.primary") },
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
          { key: "Tab",        description: tContent("accessibility.keyboard.tab") },
          { key: "ArrowLeft",  description: tContent("accessibility.keyboard.arrowLeft") },
          { key: "ArrowRight", description: tContent("accessibility.keyboard.arrowRight") },
          { key: "Enter",      description: tContent("accessibility.keyboard.enter") },
          { key: "Space",      description: tContent("accessibility.keyboard.space") },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="carousel"
        items={[
          {
            name: "Tabs",
            description: tContent("related.tabs"),
            path: "?path=/docs/ui-tabs--docs",
          },
          {
            name: "ScrollArea",
            description: tContent("related.scrollArea"),
            path: "?path=/docs/ui-scrollarea--docs",
          },
          {
            name: "Card",
            description: tContent("related.card"),
            path: "?path=/docs/ui-card--docs",
          },
          {
            name: "Pagination",
            description: tContent("related.pagination"),
            path: "?path=/docs/ui-pagination--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="carousel"
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
            event: tContent("analytics.table.slideChange"),
            trigger: tContent("analytics.table.slideChangeTrigger"),
            payload: tContent("analytics.table.slideChangePayload"),
          },
          {
            event: tContent("analytics.table.autoplayPause"),
            trigger: tContent("analytics.table.autoplayPauseTrigger"),
            payload: tContent("analytics.table.autoplayPausePayload"),
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
              priority: tNav(priorityKeyMap[tContent("testes.functional.item5.priority")] ?? "common.medium"),
            },
            {
              action: tContent("testes.functional.item6.action"),
              result: tContent("testes.functional.item6.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item6.priority")] ?? "common.medium"),
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
            {
              criterion: tContent("testes.accessibility.item1.criterion"),
              level: tContent("testes.accessibility.item1.level"),
              how: tContent("testes.accessibility.item1.how"),
            },
            {
              criterion: tContent("testes.accessibility.item2.criterion"),
              level: tContent("testes.accessibility.item2.level"),
              how: tContent("testes.accessibility.item2.how"),
            },
            {
              criterion: tContent("testes.accessibility.item3.criterion"),
              level: tContent("testes.accessibility.item3.level"),
              how: tContent("testes.accessibility.item3.how"),
            },
            {
              criterion: tContent("testes.accessibility.item4.criterion"),
              level: tContent("testes.accessibility.item4.level"),
              how: tContent("testes.accessibility.item4.how"),
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
            { story: tContent("testes.visual.item3.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item3.priority")] ?? "common.medium") },
            { story: tContent("testes.visual.item4.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item4.priority")] ?? "common.medium") },
            { story: tContent("testes.visual.item5.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item5.priority")] ?? "common.medium") },
          ],
        }}
      />
    </DocsPageLayout>
  );
}

export default CarouselDocs;
