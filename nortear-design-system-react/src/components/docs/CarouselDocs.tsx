import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
// O MESMO slide que as stories renderizam. A docs page DEMONSTRA o componente e
// a story é a referência de uso: quando as duas divergem, quem lê a página
// aprende um exemplo que o Chromatic não fotografa e que ninguém testa.
import { SlideCard } from "@/components/ui/carousel.fixtures";
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

// ─── Helpers de slide ─────────────────────────────────────────────────────────

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
    // Embla expõe API imperativa via .on() — setState dentro do callback é o
    // padrão recomendado pelo lib pra sincronizar React state com o carrossel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(api.selectedScrollSnap());
     
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <div className="nds-w-full nds-max-w-md nds-stack" data-spacing="sm">
      <Carousel className="nds-w-full" aria-label={ariaLabel} setApi={setApi}>
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
      {/* Toda a forma sai de `.nds-carousel-dot`: o atual vira pílula com o
          rótulo à vista, os demais continuam pontos, e o alvo tem piso de 24px
          nos dois estados. O ponto desenhado à mão com 8px de lado, que estava
          aqui, reprova no `target-size` (WCAG 2.5.8) — e medida cravada em
          `style` inline ainda vence a folha e sai do tema.

          `aria-current` SOME no inativo em vez de virar "false": a string
          "false" casaria com o seletor de presença. */}
      <div className="nds-cluster" data-spacing="sm" data-justify="center">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            type="button"
            className="nds-carousel-dot"
            aria-label={`${goToLabel} ${i + 1} ${ofLabel} ${total}`}
            aria-current={i === current ? "true" : undefined}
            onClick={() => api?.scrollTo(i)}
          >
            <span className="nds-carousel-dot-label">{`${slidePrefix} ${i + 1}`}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CarouselDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(carouselTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = useMemo(
    () =>
      Object.values(
        (carouselTranslations as unknown as Record<
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

  // Slide change tracking na demonstração — embla expõe a API imperativa via
  // setApi, mas não informa a ORIGEM do select; a modalidade é registrada em
  // capture phase no wrapper da demo antes de o select disparar.
  const [demoApi, setDemoApi] = useState<CarouselApi>();
  const demoNavModality = useRef<"button" | "swipe" | "keyboard">("button");

  useEffect(() => {
    if (!demoApi) return;
    const onSelect = () => {
      track("slide_change", {
        component: "carousel",
        index: demoApi.selectedScrollSnap(),
        total: demoApi.scrollSnapList().length,
        trigger: demoNavModality.current,
        location: "docs_demo",
      });
    };
    demoApi.on("select", onSelect);
    return () => {
      demoApi.off("select", onSelect);
    };
  }, [demoApi]);

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

  const horizontalCode = `<Carousel className="nds-w-full nds-max-w-md" aria-label="Galeria de exemplos">
  <CarouselContent>
    {Array.from({ length: 5 }).map((_, i) => (
      <CarouselItem key={i}>
        <Card>
          <CardContent className="nds-cluster" data-justify="center" data-align="center">
            Slide {i + 1}
          </CardContent>
        </Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`;

  const verticalCode = `<Carousel
  orientation="vertical"
  className="nds-w-full nds-max-w-xs"
  aria-label="Galeria vertical"
>
  <CarouselContent style={{ height: "200px" }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <CarouselItem key={i}>
        <Card>
          <CardContent className="nds-cluster" data-justify="center" data-align="center">
            Slide {i + 1}
          </CardContent>
        </Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`;

  const codeSingle = `<Carousel className="nds-w-full nds-max-w-md">
  <CarouselContent>
    <CarouselItem>...</CarouselItem>
    <CarouselItem>...</CarouselItem>
    <CarouselItem>...</CarouselItem>
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`;

  const codeMulti = `<Carousel className="nds-w-full" style={{ maxWidth: "42rem" }}>
  <CarouselContent>
    {items.map((item) => (
      <CarouselItem key={item.id} className="nds-md-basis-half nds-lg-basis-third">
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
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        {/* Listeners no wrapper (não no Carousel): o root do Carousel espalha
            {...props} após o onKeyDownCapture interno — um listener externo o
            sobrescreveria e quebraria a navegação por setas. */}
        <div
          className="nds-w-full nds-cluster"
          data-justify="center"
          data-align="center"
          onPointerDownCapture={(e) => {
            demoNavModality.current = (e.target as HTMLElement).closest(
              '[data-slot="carousel-previous"], [data-slot="carousel-next"]',
            )
              ? "button"
              : "swipe";
          }}
          onKeyDownCapture={() => {
            demoNavModality.current = "keyboard";
          }}
        >
          <Carousel
            className="nds-w-full nds-max-w-md"
            aria-label={toPlainText(tContent("usage.uxWriting.table.caption.good"))}
            setApi={setDemoApi}
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
              dont: toPlainText(tContent("usage.uxWriting.table.previous.bad")),
            },
            {
              element: tContent("usage.uxWriting.table.next.name"),
              rules: tContent("usage.uxWriting.table.next.format"),
              do: tContent("usage.uxWriting.table.next.good"),
              dont: toPlainText(tContent("usage.uxWriting.table.next.bad")),
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
              <Carousel className="nds-w-full nds-max-w-sm" aria-label={stripHtml(tContent("doDont.pair1.do"))}>
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
              <Carousel className="nds-w-full nds-max-w-sm" aria-label={stripHtml(tContent("doDont.pair1.dont"))}>
                <CarouselContent>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CarouselItem key={i}>
                      <SlideCard label={`${tContent("demonstration.labels.slide")} ${i + 1}`} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            ),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <Carousel className="nds-w-full nds-max-w-sm" aria-label={stripHtml(tContent("doDont.pair2.do"))}>
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
              <Carousel className="nds-w-full nds-max-w-sm" aria-label={stripHtml(tContent("doDont.pair2.dont"))}>
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
        secondaryDescription={tContent("import.withPlugin")}
        secondaryCode={codeImportWithPlugin}
      />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsCompositions
        id="variantes"
        title={tContent("variants.title")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="carousel"
        items={[
          {
            name: "horizontal",
            description: stripHtml(tContent("variants.items.horizontal")),
            code: horizontalCode,
            preview: (
              <Carousel className="nds-w-full nds-max-w-md" aria-label="horizontal">
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
            code: verticalCode,
            preview: (
              <Carousel
                orientation="vertical"
                className="nds-w-full nds-max-w-xs"
                aria-label="vertical"
              >
                <CarouselContent style={{ height: "200px" }}>
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
            name: "single",
            description: stripHtml(tContent("variants.items.single")),
            code: codeSingle,
            preview: (
              <Carousel className="nds-w-full nds-max-w-md" aria-label="single">
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
              <Carousel
                className="nds-w-full"
                style={{ maxWidth: "42rem" }}
                aria-label="multi"
              >
                <CarouselContent>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CarouselItem key={i} className="nds-md-basis-half nds-lg-basis-third">
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
            name: tContent("variants.items.autoplay.name"),
            description: tContent("variants.items.autoplay.description"),
            useWhen: tContent("variants.items.autoplay.use"),
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
                className="nds-w-full nds-max-w-md"
                opts={{ loop: true }}
                aria-label={tContent("variants.items.autoplay.name")}
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
    // Embla expõe API imperativa via .on() — setState dentro do callback é o
    // padrão recomendado pelo lib pra sincronizar React state com o carrossel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(api.selectedScrollSnap());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <div className="nds-stack" data-spacing="sm">
      <Carousel setApi={setApi} aria-label="Galeria de fotos do produto">
        <CarouselContent>
          {slides.map((s, i) => (
            <CarouselItem key={i}>{s}</CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious aria-label="Item anterior" />
        <CarouselNext aria-label="Próximo item" />
      </Carousel>
      {/* O atual vira pílula rotulada; os demais continuam pontos. Tudo em
          .nds-carousel-dot — nenhuma medida cravada aqui. */}
      <div className="nds-cluster" data-spacing="sm" data-justify="center">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            className="nds-carousel-dot"
            aria-label={\`Ir para o slide \${i + 1} de \${slides.length}\`}
            aria-current={i === current ? "true" : undefined}
            onClick={() => api?.scrollTo(i)}
          >
            <span className="nds-carousel-dot-label">{\`Slide \${i + 1}\`}</span>
          </button>
        ))}
      </div>
    </div>
  );
}`,
            preview: (
              <DotsCarouselPreview
                total={5}
                ariaLabel={tContent("variants.compositions.withDots.name")}
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
            code: `<Carousel className="nds-w-full nds-max-w-md" aria-label="Galeria de fotos do produto">
  <CarouselContent>
    {photos.map((photo) => (
      <CarouselItem key={photo.id}>
        <Card className="nds-w-full nds-overflow-hidden">
          <div
            className="nds-w-full nds-cluster nds-aspect-16-9 nds-bg-muted-soft"
            data-justify="center"
            data-align="center"
          >
            <span className="nds-text-h3 nds-font-semibold nds-text-foreground">
              {photo.title}
            </span>
          </div>
          <CardContent className="nds-p-4">
            <h3 className="nds-text-body nds-font-semibold">{photo.title}</h3>
            <p className="nds-text-caption nds-text-muted-foreground">{photo.description}</p>
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
                className="nds-w-full nds-max-w-md"
                aria-label={tContent("variants.compositions.gallery.name")}
              >
                <CarouselContent>
                  {[
                    { title: "Foto 1", description: "Paisagem ao amanhecer" },
                    { title: "Foto 2", description: "Detalhe arquitetônico" },
                    { title: "Foto 3", description: "Cidade à noite" },
                    { title: "Foto 4", description: "Praia vista do alto" },
                  ].map((photo, i) => (
                    <CarouselItem key={i}>
                      <Card className="nds-w-full nds-overflow-hidden nds-shadow-none">
                        <div
                          className="nds-w-full nds-cluster nds-aspect-16-9 nds-bg-muted-soft"
                          data-justify="center"
                          data-align="center"
                        >
                          <span className="nds-text-h3 nds-font-semibold nds-text-foreground">
                            {photo.title}
                          </span>
                        </div>
                        <CardContent className="nds-p-4">
                          <h3 className="nds-text-body nds-font-semibold">{photo.title}</h3>
                          <p className="nds-text-caption nds-text-muted-foreground">{photo.description}</p>
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
        ]}
      />

      {/* ── Configurações (States) ────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: toPlainText(tContent("states.cols.trigger")),
          behavior: toPlainText(tContent("states.cols.behavior")),
        }}
        items={[
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
                description: toPlainText(tContent("props.table.opts")),
              },
              {
                name: "plugins",
                type: "EmblaPluginType[]",
                defaultValue: "—",
                required: "Não",
                description: toPlainText(tContent("props.table.plugins")),
              },
              {
                name: "orientation",
                type: '"horizontal" | "vertical"',
                defaultValue: '"horizontal"',
                required: "Não",
                description: toPlainText(tContent("props.table.orientation")),
              },
              {
                name: "setApi",
                type: "(api: CarouselApi) => void",
                defaultValue: "—",
                required: "Não",
                description: toPlainText(tContent("props.table.setApi")),
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
                description: toPlainText(tContent("props.table.variant")),
              },
              {
                name: "size",
                type: '"default" | "sm" | "lg" | "icon" | "icon-sm"',
                defaultValue: '"icon-sm"',
                required: "Não",
                description: toPlainText(tContent("props.table.size")),
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
          { token: "--background",    value: ".nds-button-outline", description: tContent("tokens.table.background") },
          { token: "--foreground",    value: ".nds-button-outline", description: tContent("tokens.table.foreground") },
          { token: "--border",        value: ".nds-button-outline", description: tContent("tokens.table.border") },
          { token: "--accent",        value: ".nds-button-outline:hover", description: tContent("tokens.table.accent") },
          { token: "--ring",          value: ".nds-carousel-dot:focus-visible", description: tContent("tokens.table.ring") },
          { token: "--radius-full",   value: ".nds-carousel-arrow", description: tContent("tokens.table.radiusButton") },
          { token: "--primary",       value: ".nds-carousel-dot[aria-current=\"true\"]", description: tContent("tokens.table.primary") },
          { token: "--nds-carousel-slide-scale", value: ".nds-carousel-slide", description: tContent("tokens.table.slideScale") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeCustomizationTokens}
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
          { key: "Tab",        description: tContent("accessibility.keyboard.tab") },
          { key: "Arrow Left",  description: tContent("accessibility.keyboard.arrowLeft") },
          { key: "Arrow Right", description: tContent("accessibility.keyboard.arrowRight") },
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
            description: toPlainText(tContent("related.tabs")),
            path: "?path=/docs/ui-tabs--docs",
          },
          {
            name: "ScrollArea",
            description: toPlainText(tContent("related.scrollArea")),
            path: "?path=/docs/ui-scrollarea--docs",
          },
          {
            name: "Card",
            description: toPlainText(tContent("related.card")),
            path: "?path=/docs/ui-card--docs",
          },
          {
            name: "Pagination",
            description: toPlainText(tContent("related.pagination")),
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
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: tContent("analytics.table.slideChange"),
            trigger: toPlainText(tContent("analytics.table.slideChangeTrigger")),
            payload: tContent("analytics.table.slideChangePayload"),
          },
          {
            event: tContent("analytics.table.autoplayPause"),
            trigger: toPlainText(tContent("analytics.table.autoplayPauseTrigger")),
            payload: tContent("analytics.table.autoplayPausePayload"),
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
            {
              action: tContent("testes.functional.item8.action"),
              result: tContent("testes.functional.item8.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item8.priority")] ?? "common.medium"),
            },
            {
              action: tContent("testes.functional.item9.action"),
              result: tContent("testes.functional.item9.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item9.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item10.action"),
              result: tContent("testes.functional.item10.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item10.priority")] ?? "common.high"),
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
            {
              criterion: tContent("testes.accessibility.item6.criterion"),
              level: tContent("testes.accessibility.item6.level"),
              how: tContent("testes.accessibility.item6.how"),
            },
            {
              criterion: tContent("testes.accessibility.item7.criterion"),
              level: tContent("testes.accessibility.item7.level"),
              how: tContent("testes.accessibility.item7.how"),
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
            { story: tContent("testes.visual.item6.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item6.priority")] ?? "common.medium") },
          ],
        }}
      />
    </DocsPageLayout>
  );
}

export default CarouselDocs;
