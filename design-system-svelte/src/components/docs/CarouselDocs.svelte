<script lang="ts">
  import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
  } from '@/components/ui/carousel';
  import Autoplay from 'embla-carousel-autoplay';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import carouselTranslations from '@shared/content/carousel/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(carouselTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'carousel',
    });
    track('docs_page_view', {
      component_name: 'carousel',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────


  const NAV_GROUPS = $derived.by(() => {
    const tNav = $tNavStore;
    return [
      { label: tNav('nav.overview'), sections: [
        { id: 'demonstracao', label: tNav('nav.demonstration') },
        { id: 'anatomia',     label: tNav('nav.anatomy')       },
        { id: 'quando-usar',  label: tNav('nav.usage')         },
        { id: 'do-dont',      label: tNav('nav.doDont')        },
      ]},
      { label: tNav('nav.techRef'), sections: [
        { id: 'importacao',   label: tNav('nav.import')   },
        { id: 'variantes',    label: tNav('nav.variants') },
        { id: 'composicoes',  label: tNav('nav.compositions') },
        { id: 'estados',      label: tNav('nav.states')   },
        { id: 'propriedades', label: tNav('nav.props')    },
        { id: 'tokens',       label: tNav('nav.tokens')   },
      ]},
      { label: tNav('nav.context'), sections: [
        { id: 'acessibilidade', label: tNav('nav.accessibility') },
        { id: 'relacionados',   label: tNav('nav.related')       },
        { id: 'notas',          label: tNav('nav.notes')         },
      ]},
      { label: tNav('nav.quality'), sections: [
        { id: 'analytics', label: tNav('nav.analytics') },
        { id: 'testes',    label: tNav('nav.testes')    },
      ]},
    ];
  });

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'carousel', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function stripHtml(s: string) {
    return s.replace(/<[^>]*>/g, '');
  }

  const priorityKeyMap: Record<string, string> = {
    high: 'common.high',
    medium: 'common.medium',
    low: 'common.low',
  };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // Dots demo — capture API to sync dots with selected slide
  let demoApi = $state<any>(undefined);
  let demoSelectedIndex = $state(0);
  let demoScrollSnaps = $state<number[]>([]);

  function setDemoApi(a: any) {
    demoApi = a;
    if (!a) return;
    demoScrollSnaps = a.scrollSnapList();
    demoSelectedIndex = a.selectedScrollSnap();
    a.on('select', () => { demoSelectedIndex = a.selectedScrollSnap(); });
    a.on('reInit', () => {
      demoScrollSnaps = a.scrollSnapList();
      demoSelectedIndex = a.selectedScrollSnap();
    });
  }

  function demoGoTo(i: number) {
    demoApi?.scrollTo(i);
  }

  // Composições — dots preview state
  let dotsApi = $state<any>(undefined);
  let dotsCurrent = $state(0);
  function setDotsApi(a: any) {
    dotsApi = a;
    if (!a) return;
    dotsCurrent = a.selectedScrollSnap();
    a.on('select', () => { dotsCurrent = a.selectedScrollSnap(); });
  }

  const galleryPhotos = [
    { title: 'Foto 1', description: 'Paisagem ao amanhecer' },
    { title: 'Foto 2', description: 'Detalhe arquitetônico' },
    { title: 'Foto 3', description: 'Cidade à noite' },
    { title: 'Foto 4', description: 'Praia vista do alto' },
  ];

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";`;

  const codeImportAutoplay = `import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";`;

  const codeHorizontal = `<Carousel aria-label="Galeria de exemplos">
  <CarouselContent>
    <CarouselItem>...</CarouselItem>
    <CarouselItem>...</CarouselItem>
    <CarouselItem>...</CarouselItem>
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`;

  const codeVertical = `<div class="h-[260px]">
  <Carousel orientation="vertical" aria-label="Galeria vertical">
    <CarouselContent class="h-[260px]">
      <CarouselItem>...</CarouselItem>
      <CarouselItem>...</CarouselItem>
    </CarouselContent>
    <CarouselPrevious aria-label="Item anterior" />
    <CarouselNext aria-label="Próximo item" />
  </Carousel>
</div>`;

  const codeSingle = `<Carousel>
  <CarouselContent>
    <CarouselItem>Slide 1</CarouselItem>
    <CarouselItem>Slide 2</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`;

  const codeMulti = `<Carousel>
  <CarouselContent>
    <CarouselItem class="md:basis-1/2 lg:basis-1/3">Card 1</CarouselItem>
    <CarouselItem class="md:basis-1/2 lg:basis-1/3">Card 2</CarouselItem>
    <CarouselItem class="md:basis-1/2 lg:basis-1/3">Card 3</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`;

  const codeCompositionWithDots = `<script lang="ts">
  let api = $state<any>(undefined);
  let current = $state(0);
  function setApi(a: any) {
    api = a;
    current = a.selectedScrollSnap();
    a.on('select', () => (current = a.selectedScrollSnap()));
  }
<\/script>

<div class="space-y-3">
  <Carousel {setApi} aria-label="Galeria de fotos do produto">
    <CarouselContent>
      {#each slides as s, i}
        <CarouselItem>{s}</CarouselItem>
      {/each}
    </CarouselContent>
    <CarouselPrevious aria-label="Item anterior" />
    <CarouselNext aria-label="Próximo item" />
  </Carousel>
  <div class="flex justify-center gap-2" aria-label="Ir para o slide">
    {#each slides as _, i}
      <button
        type="button"
        aria-label={\`Ir para o slide \${i + 1} de \${slides.length}\`}
        aria-current={i === current ? 'true' : 'false'}
        class={\`h-2 w-2 rounded-full \${i === current ? 'bg-primary' : 'bg-muted-foreground/30'}\`}
        onclick={() => api?.scrollTo(i)}
      />
    {/each}
  </div>
</div>`;

  const codeCompositionGallery = `<Carousel class="w-full max-w-md" aria-label="Galeria de fotos do produto">
  <CarouselContent>
    {#each photos as photo}
      <CarouselItem>
        <div class="overflow-hidden rounded-md border">
          <div class="aspect-video bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
            <span class="text-2xl font-semibold">{photo.title}</span>
          </div>
          <div class="p-4">
            <h3 class="font-semibold">{photo.title}</h3>
            <p class="text-sm text-muted-foreground">{photo.description}</p>
          </div>
        </div>
      </CarouselItem>
    {/each}
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`;

  const codeCompositionAutoplay = `<script lang="ts">
  import Autoplay from 'embla-carousel-autoplay';
<\/script>

<Carousel
  opts={{ loop: true }}
  plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
  aria-label="Destaques"
>
  <CarouselContent>
    {#each highlights as h, i}
      <CarouselItem>{h}</CarouselItem>
    {/each}
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`;

  const codeCompositionMultiResponsive = `<Carousel class="w-full max-w-2xl" aria-label="Cards de produto">
  <CarouselContent>
    {#each products as p}
      <CarouselItem class="md:basis-1/2 lg:basis-1/3">
        <div class="rounded-md border p-4">{p.name}</div>
      </CarouselItem>
    {/each}
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>`;

  const interfaceCode = `// Carousel
interface CarouselProps {
  opts?: EmblaOptionsType;
  plugins?: EmblaPluginType[];
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
  class?: string;
  children?: Snippet;
}

// CarouselContent / CarouselItem
interface CarouselSlotProps {
  class?: string;
  children?: Snippet;
}

// CarouselPrevious / CarouselNext
interface CarouselNavProps extends ButtonProps {
  class?: string;
}`;

  const codeCustomizationTokens = `/* Em globals.css — personalizar o Button de navegação */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --border: 240 5.9% 90%;
  --accent: 240 4.8% 95.9%;
  --ring: 240 5% 64.9%;
  --radius-button: 0.5rem;
  --primary: 240 5.9% 10%;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="carousel">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add carousel"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="w-full max-w-sm mx-auto">
        <Carousel
          opts={{ loop: false }}
          setApi={setDemoApi}
          aria-label={stripHtml($tStore('description'))}
          class="relative"
        >
          <CarouselContent>
            {#each [1, 2, 3, 4, 5] as i}
              <CarouselItem>
                <div class="p-1">
                  <div
                    class="flex aspect-square items-center justify-center rounded-md bg-muted text-3xl font-semibold text-muted-foreground select-none"
                    aria-label={`${$tStore('demonstration.labels.slide')} ${i} ${$tStore('demonstration.labels.of')} 5`}
                  >
                    {i}
                  </div>
                </div>
              </CarouselItem>
            {/each}
          </CarouselContent>
          <CarouselPrevious aria-label={$tStore('demonstration.labels.previous')} />
          <CarouselNext aria-label={$tStore('demonstration.labels.next')} />
        </Carousel>
        <div class="mt-4 flex items-center justify-center gap-2" role="tablist" aria-label="Paginação">
          {#each demoScrollSnaps as _, i}
            <button
              type="button"
              role="tab"
              aria-label={`${$tStore('demonstration.labels.goToSlide')} ${i + 1}`}
              aria-selected={demoSelectedIndex === i}
              class="h-2 w-2 rounded-full transition-colors"
              class:bg-primary={demoSelectedIndex === i}
              class:bg-muted-foreground={demoSelectedIndex !== i}
              class:opacity-40={demoSelectedIndex !== i}
              onclick={() => demoGoTo(i)}
            ></button>
          {/each}
        </div>
      </div>
    {/snippet}
  </DocsDemonstration>

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
    title={$tStore('anatomy.title')}
    items={[
      $tStore('anatomy.item1'),
      $tStore('anatomy.item2'),
      $tStore('anatomy.item3'),
      $tStore('anatomy.item4'),
    ]}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
  />

  <!-- ── Quando Usar ────────────────────────────────────────────── -->
  <DocsWhenToUse
    title={$tStore('usage.title')}
    guidelines={{
      title: $tStore('usage.guidelines.title'),
      items: [
        $tStore('usage.guidelines.item1'),
        $tStore('usage.guidelines.item2'),
        $tStore('usage.guidelines.item3'),
        $tStore('usage.guidelines.item4'),
      ],
    }}
    scenarios={{
      title: $tStore('usage.scenarios.title'),
      cols: {
        scenario: $tStore('usage.scenarios.cols.scenario'),
        use: $tStore('usage.scenarios.cols.use'),
        alternative: $tStore('usage.scenarios.cols.alternative'),
      },
      items: [
        { s: $tStore('usage.scenarios.item1.s'), u: $tStore('usage.scenarios.item1.u'), a: $tStore('usage.scenarios.item1.a') },
        { s: $tStore('usage.scenarios.item2.s'), u: $tStore('usage.scenarios.item2.u'), a: $tStore('usage.scenarios.item2.a') },
        { s: $tStore('usage.scenarios.item3.s'), u: $tStore('usage.scenarios.item3.u'), a: $tStore('usage.scenarios.item3.a') },
        { s: $tStore('usage.scenarios.item4.s'), u: $tStore('usage.scenarios.item4.u'), a: $tStore('usage.scenarios.item4.a') },
        { s: $tStore('usage.scenarios.item5.s'), u: $tStore('usage.scenarios.item5.u'), a: $tStore('usage.scenarios.item5.a') },
      ],
    }}
    uxWriting={{
      title: $tStore('usage.uxWriting.title'),
      cols: {
        element: $tStore('usage.uxWriting.table.element'),
        rules: $tStore('usage.uxWriting.table.rules'),
        do: $tStore('usage.uxWriting.table.correct'),
        dont: $tStore('usage.uxWriting.table.avoid'),
      },
      items: [
        { element: $tStore('usage.uxWriting.table.previous.name'), rules: $tStore('usage.uxWriting.table.previous.format'), do: $tStore('usage.uxWriting.table.previous.good'), dont: $tStore('usage.uxWriting.table.previous.bad') },
        { element: $tStore('usage.uxWriting.table.next.name'),     rules: $tStore('usage.uxWriting.table.next.format'),     do: $tStore('usage.uxWriting.table.next.good'),     dont: $tStore('usage.uxWriting.table.next.bad') },
        { element: $tStore('usage.uxWriting.table.dots.name'),     rules: $tStore('usage.uxWriting.table.dots.format'),     do: $tStore('usage.uxWriting.table.dots.good'),     dont: $tStore('usage.uxWriting.table.dots.bad') },
        { element: $tStore('usage.uxWriting.table.caption.name'),  rules: $tStore('usage.uxWriting.table.caption.format'),  do: $tStore('usage.uxWriting.table.caption.good'),  dont: $tStore('usage.uxWriting.table.caption.bad') },
      ],
    }}
    do={{
      title: $tStore('usage.do.title'),
      items: [
        $tStore('usage.do.item1'),
        $tStore('usage.do.item2'),
        $tStore('usage.do.item3'),
        $tStore('usage.do.item4'),
      ],
    }}
    dont={{
      title: $tStore('usage.dont.title'),
      items: [
        $tStore('usage.dont.item1'),
        $tStore('usage.dont.item2'),
        $tStore('usage.dont.item3'),
        $tStore('usage.dont.item4'),
      ],
    }}
  />

  <!-- ── Do & Don't ─────────────────────────────────────────────── -->
  <DocsDoDont
    title={$tStore('doDont.title')}
    pairs={[
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair1.do'),
        dontCaption: $tStore('doDont.pair1.dont'),
        doPreview: doPair1,
        dontPreview: dontPair1,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair2.do'),
        dontCaption: $tStore('doDont.pair2.dont'),
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
    ]}
  />

  {#snippet doPair1()}
    <div class="w-full max-w-[240px] mx-auto">
      <Carousel aria-label={stripHtml($tStore('usage.uxWriting.table.caption.good'))} class="relative">
        <CarouselContent>
          {#each [1, 2, 3] as i}
            <CarouselItem>
              <div class="p-1">
                <div class="flex aspect-square items-center justify-center rounded-md bg-muted text-2xl font-semibold text-muted-foreground">
                  {i}
                </div>
              </div>
            </CarouselItem>
          {/each}
        </CarouselContent>
        <CarouselPrevious aria-label={$tStore('demonstration.labels.previous')} />
        <CarouselNext aria-label={$tStore('demonstration.labels.next')} />
      </Carousel>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div class="w-full max-w-[240px] mx-auto">
      <Carousel class="relative">
        <CarouselContent>
          {#each [1, 2, 3] as i}
            <CarouselItem>
              <div class="p-1">
                <div class="flex aspect-square items-center justify-center rounded-md bg-muted text-2xl font-semibold text-muted-foreground">
                  {i}
                </div>
              </div>
            </CarouselItem>
          {/each}
        </CarouselContent>
      </Carousel>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div class="w-full max-w-[240px] mx-auto">
      <Carousel
        opts={{ loop: true }}
        plugins={[Autoplay({ delay: 3000, stopOnInteraction: true })]}
        aria-label={stripHtml($tStore('usage.uxWriting.table.caption.good'))}
        class="relative"
      >
        <CarouselContent>
          {#each [1, 2, 3] as i}
            <CarouselItem>
              <div class="p-1">
                <div class="flex aspect-square items-center justify-center rounded-md bg-muted text-2xl font-semibold text-muted-foreground">
                  {i}
                </div>
              </div>
            </CarouselItem>
          {/each}
        </CarouselContent>
        <CarouselPrevious aria-label={$tStore('demonstration.labels.previous')} />
        <CarouselNext aria-label={$tStore('demonstration.labels.next')} />
      </Carousel>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="w-full max-w-[240px] mx-auto">
      <Carousel
        opts={{ loop: true }}
        plugins={[Autoplay({ delay: 800, stopOnInteraction: false })]}
        class="relative"
      >
        <CarouselContent>
          {#each [1, 2, 3] as i}
            <CarouselItem>
              <div class="p-1">
                <div class="flex aspect-square items-center justify-center rounded-md bg-muted text-2xl font-semibold text-muted-foreground">
                  {i}
                </div>
              </div>
            </CarouselItem>
          {/each}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryDescription={$tStore('import.withPlugin')}
    secondaryCode={codeImportAutoplay}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    items={[
      { name: 'horizontal', description: stripHtml($tStore('variants.items.horizontal')), code: codeHorizontal, preview: variantHorizontal },
      { name: 'vertical',   description: stripHtml($tStore('variants.items.vertical')),   code: codeVertical,   preview: variantVertical   },
      { name: 'single',     description: stripHtml($tStore('variants.items.single')),     code: codeSingle,     preview: variantSingle     },
      { name: 'multi',      description: stripHtml($tStore('variants.items.multi')),      code: codeMulti,      preview: variantMulti      },
    ]}
  />

  {#snippet variantHorizontal()}
    <div class="w-full max-w-[280px]">
      <Carousel aria-label="Horizontal" class="relative">
        <CarouselContent>
          {#each [1, 2, 3, 4] as i}
            <CarouselItem>
              <div class="p-1">
                <div class="flex aspect-square items-center justify-center rounded-md bg-muted text-2xl font-semibold text-muted-foreground">
                  {i}
                </div>
              </div>
            </CarouselItem>
          {/each}
        </CarouselContent>
        <CarouselPrevious aria-label={$tStore('demonstration.labels.previous')} />
        <CarouselNext aria-label={$tStore('demonstration.labels.next')} />
      </Carousel>
    </div>
  {/snippet}
  {#snippet variantVertical()}
    <div class="w-full max-w-[200px] h-[220px]">
      <Carousel orientation="vertical" aria-label="Vertical" class="relative">
        <CarouselContent class="h-[220px]">
          {#each [1, 2, 3, 4] as i}
            <CarouselItem>
              <div class="p-1">
                <div class="flex aspect-square items-center justify-center rounded-md bg-muted text-2xl font-semibold text-muted-foreground">
                  {i}
                </div>
              </div>
            </CarouselItem>
          {/each}
        </CarouselContent>
        <CarouselPrevious aria-label={$tStore('demonstration.labels.previous')} />
        <CarouselNext aria-label={$tStore('demonstration.labels.next')} />
      </Carousel>
    </div>
  {/snippet}
  {#snippet variantSingle()}
    <div class="w-full max-w-[260px]">
      <Carousel aria-label="Single" class="relative">
        <CarouselContent>
          {#each [1, 2, 3] as i}
            <CarouselItem>
              <div class="p-1">
                <div class="flex aspect-square items-center justify-center rounded-md bg-muted text-2xl font-semibold text-muted-foreground">
                  {i}
                </div>
              </div>
            </CarouselItem>
          {/each}
        </CarouselContent>
        <CarouselPrevious aria-label={$tStore('demonstration.labels.previous')} />
        <CarouselNext aria-label={$tStore('demonstration.labels.next')} />
      </Carousel>
    </div>
  {/snippet}
  {#snippet variantMulti()}
    <div class="w-full max-w-[480px]">
      <Carousel aria-label="Multi responsivo" class="relative">
        <CarouselContent>
          {#each [1, 2, 3, 4, 5, 6] as i}
            <CarouselItem class="md:basis-1/2 lg:basis-1/3">
              <div class="p-1">
                <div class="flex aspect-square items-center justify-center rounded-md bg-muted text-xl font-semibold text-muted-foreground">
                  {i}
                </div>
              </div>
            </CarouselItem>
          {/each}
        </CarouselContent>
        <CarouselPrevious aria-label={$tStore('demonstration.labels.previous')} />
        <CarouselNext aria-label={$tStore('demonstration.labels.next')} />
      </Carousel>
    </div>
  {/snippet}

  <!-- ── Composições ────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="carousel"
    items={[
      {
        name: $tStore('variants.compositions.withDots.name'),
        description: $tStore('variants.compositions.withDots.description'),
        useWhen: $tStore('variants.compositions.withDots.use'),
        code: codeCompositionWithDots,
        preview: compWithDots,
      },
      {
        name: $tStore('variants.compositions.gallery.name'),
        description: $tStore('variants.compositions.gallery.description'),
        useWhen: $tStore('variants.compositions.gallery.use'),
        code: codeCompositionGallery,
        preview: compGallery,
      },
      {
        name: $tStore('variants.compositions.autoplay.name'),
        description: $tStore('variants.compositions.autoplay.description'),
        useWhen: $tStore('variants.compositions.autoplay.use'),
        code: codeCompositionAutoplay,
        preview: compAutoplay,
      },
      {
        name: $tStore('variants.compositions.multiResponsive.name'),
        description: $tStore('variants.compositions.multiResponsive.description'),
        useWhen: $tStore('variants.compositions.multiResponsive.use'),
        code: codeCompositionMultiResponsive,
        preview: compMultiResponsive,
      },
    ]}
  />

  {#snippet compWithDots()}
    <div class="w-full max-w-[280px] space-y-3">
      <Carousel setApi={setDotsApi} aria-label="Galeria">
        <CarouselContent>
          {#each [1, 2, 3, 4, 5] as i}
            <CarouselItem>
              <div class="p-1">
                <div class="flex aspect-square items-center justify-center rounded-md bg-muted text-2xl font-semibold text-muted-foreground">
                  {i}
                </div>
              </div>
            </CarouselItem>
          {/each}
        </CarouselContent>
        <CarouselPrevious aria-label={$tStore('demonstration.labels.previous')} />
        <CarouselNext aria-label={$tStore('demonstration.labels.next')} />
      </Carousel>
      <div class="flex items-center justify-center gap-2" aria-label={$tStore('demonstration.labels.goToSlide')}>
        {#each [1, 2, 3, 4, 5] as _, i}
          <button
            type="button"
            aria-label={`${$tStore('demonstration.labels.goToSlide')} ${i + 1} ${$tStore('demonstration.labels.of')} 5`}
            aria-current={i === dotsCurrent ? 'true' : 'false'}
            class={`h-2 w-2 rounded-full transition-colors ${i === dotsCurrent ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            onclick={() => dotsApi?.scrollTo(i)}
          ></button>
        {/each}
      </div>
    </div>
  {/snippet}

  {#snippet compGallery()}
    <div class="w-full max-w-[280px]">
      <Carousel aria-label="Galeria de fotos">
        <CarouselContent>
          {#each galleryPhotos as photo}
            <CarouselItem>
              <div class="overflow-hidden rounded-md border bg-card">
                <div class="aspect-video bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
                  <span class="text-2xl font-semibold text-foreground">{photo.title}</span>
                </div>
                <div class="p-3">
                  <h3 class="text-sm font-semibold text-foreground">{photo.title}</h3>
                  <p class="text-xs text-muted-foreground">{photo.description}</p>
                </div>
              </div>
            </CarouselItem>
          {/each}
        </CarouselContent>
        <CarouselPrevious aria-label={$tStore('demonstration.labels.previous')} />
        <CarouselNext aria-label={$tStore('demonstration.labels.next')} />
      </Carousel>
    </div>
  {/snippet}

  {#snippet compAutoplay()}
    <div class="w-full max-w-[280px]">
      <Carousel
        opts={{ loop: true }}
        plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
        aria-label="Destaques"
      >
        <CarouselContent>
          {#each [1, 2, 3, 4] as i}
            <CarouselItem>
              <div class="p-1">
                <div class="flex aspect-square items-center justify-center rounded-md bg-muted text-2xl font-semibold text-muted-foreground">
                  {i}
                </div>
              </div>
            </CarouselItem>
          {/each}
        </CarouselContent>
        <CarouselPrevious aria-label={$tStore('demonstration.labels.previous')} />
        <CarouselNext aria-label={$tStore('demonstration.labels.next')} />
      </Carousel>
    </div>
  {/snippet}

  {#snippet compMultiResponsive()}
    <div class="w-full max-w-[480px]">
      <Carousel aria-label="Multi responsivo">
        <CarouselContent>
          {#each [1, 2, 3, 4, 5, 6] as i}
            <CarouselItem class="md:basis-1/2 lg:basis-1/3">
              <div class="p-1">
                <div class="flex aspect-square items-center justify-center rounded-md bg-muted text-xl font-semibold text-muted-foreground">
                  {i}
                </div>
              </div>
            </CarouselItem>
          {/each}
        </CarouselContent>
        <CarouselPrevious aria-label={$tStore('demonstration.labels.previous')} />
        <CarouselNext aria-label={$tStore('demonstration.labels.next')} />
      </Carousel>
    </div>
  {/snippet}

  <!-- ── Estados / Configurações ───────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={[
      { label: $tStore('states.single.label'),   trigger: stripHtml($tStore('states.single.trigger')),   behavior: $tStore('states.single.behavior')   },
      { label: $tStore('states.multi.label'),    trigger: stripHtml($tStore('states.multi.trigger')),    behavior: stripHtml($tStore('states.multi.behavior')) },
      { label: $tStore('states.autoplay.label'), trigger: stripHtml($tStore('states.autoplay.trigger')), behavior: stripHtml($tStore('states.autoplay.behavior')) },
      { label: $tStore('states.vertical.label'), trigger: stripHtml($tStore('states.vertical.trigger')), behavior: $tStore('states.vertical.behavior') },
      { label: $tStore('states.disabled.label'), trigger: stripHtml($tStore('states.disabled.trigger')), behavior: stripHtml($tStore('states.disabled.behavior')) },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: $tStore('props.carouselTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'opts',        type: 'EmblaOptionsType',               defaultValue: '—',            required: 'Não', description: stripHtml($tStore('props.table.opts'))        },
          { name: 'plugins',     type: 'EmblaPluginType[]',              defaultValue: '—',            required: 'Não', description: stripHtml($tStore('props.table.plugins'))     },
          { name: 'orientation', type: '"horizontal" | "vertical"',      defaultValue: '"horizontal"', required: 'Não', description: stripHtml($tStore('props.table.orientation')) },
          { name: 'setApi',      type: '(api: CarouselApi) => void',     defaultValue: '—',            required: 'Não', description: stripHtml($tStore('props.table.setApi'))      },
          { name: 'class',       type: 'string',                         defaultValue: '—',            required: 'Não', description: $tStore('props.table.className')              },
          { name: 'children',    type: 'Snippet',                        defaultValue: '—',            required: 'Sim', description: $tStore('props.table.children')               },
        ],
      },
      {
        title: $tStore('props.contentTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.table.className') },
          { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Sim', description: $tStore('props.table.children')  },
        ],
      },
      {
        title: $tStore('props.itemTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.table.className') },
          { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Sim', description: $tStore('props.table.children')  },
        ],
      },
      {
        title: $tStore('props.navTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'variant', type: 'ButtonVariant', defaultValue: '"outline"',  required: 'Não', description: stripHtml($tStore('props.table.variant')) },
          { name: 'size',    type: 'ButtonSize',    defaultValue: '"icon-sm"',  required: 'Não', description: stripHtml($tStore('props.table.size'))    },
          { name: 'class',   type: 'string',        defaultValue: '—',           required: 'Não', description: $tStore('props.table.className')          },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={$tStore('props.extensibility')}
  />

  <!-- ── Tokens ─────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      { token: '--background',    value: 'bg-background',        description: $tStore('tokens.table.background')   },
      { token: '--foreground',    value: 'text-foreground',      description: $tStore('tokens.table.foreground')   },
      { token: '--border',        value: 'border',               description: $tStore('tokens.table.border')       },
      { token: '--accent',        value: 'hover:bg-accent',      description: $tStore('tokens.table.accent')       },
      { token: '--ring',          value: 'focus-visible:ring-ring',        description: $tStore('tokens.table.ring')         },
      { token: '--radius-button', value: 'rounded-(--radius-button)', description: $tStore('tokens.table.radiusButton') },
      { token: '--primary',       value: 'bg-primary',           description: $tStore('tokens.table.primary')      },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeCustomizationTokens}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.item1'),
      $tStore('accessibility.item2'),
      $tStore('accessibility.item3'),
      $tStore('accessibility.item4'),
      $tStore('accessibility.item5'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboardTitle')}
    keyboardItems={[
      { key: 'Tab',        description: $tStore('accessibility.keyboard.tab')        },
      { key: 'ArrowLeft',  description: $tStore('accessibility.keyboard.arrowLeft')  },
      { key: 'ArrowRight', description: $tStore('accessibility.keyboard.arrowRight') },
      { key: 'Enter',      description: $tStore('accessibility.keyboard.enter')      },
      { key: 'Space',      description: $tStore('accessibility.keyboard.space')      },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'Tabs',       description: $tStore('related.tabs'),       path: '?path=/docs/ui-tabs--docs'       },
      { name: 'ScrollArea', description: $tStore('related.scrollArea'), path: '?path=/docs/ui-scrollarea--docs' },
      { name: 'Card',       description: $tStore('related.card'),       path: '?path=/docs/ui-card--docs'       },
      { name: 'Pagination', description: $tStore('related.pagination'), path: '?path=/docs/ui-pagination--docs' },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: $tStore('notes.tip1') },
      { title: '', content: $tStore('notes.tip2') },
      { title: '', content: $tStore('notes.tip3') },
      { title: '', content: $tStore('notes.tip4') },
    ]}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: $tStore('analytics.table.trigger'),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: $tStore('analytics.table.slideChange'),   trigger: $tStore('analytics.table.slideChangeTrigger'),   payload: $tStore('analytics.table.slideChangePayload')   },
      { event: $tStore('analytics.table.autoplayPause'), trigger: $tStore('analytics.table.autoplayPauseTrigger'), payload: $tStore('analytics.table.autoplayPausePayload') },
      { event: $tStore('analytics.table.pageView'),      trigger: $tStore('analytics.table.pageViewTrigger'),      payload: $tStore('analytics.table.pageViewPayload')      },
      { event: $tStore('analytics.table.sectionViewed'), trigger: $tStore('analytics.table.sectionViewedTrigger'), payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),    trigger: $tStore('analytics.table.langSwitchTrigger'),    payload: $tStore('analytics.table.langSwitchPayload')    },
    ]}
  />

  <!-- ── Testes ─────────────────────────────────────────────────── -->
  <DocsTestes
    title={$tStore('testes.title')}
    functional={{
      title: $tStore('testes.functional.title'),
      cols: {
        action: $tNavStore('common.userAction'),
        result: $tNavStore('common.expectedResult'),
        priority: $tNavStore('common.priority'),
      },
      items: [
        { action: $tStore('testes.functional.item1.action'), result: $tStore('testes.functional.item1.result'), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item2.action'), result: $tStore('testes.functional.item2.result'), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item3.action'), result: $tStore('testes.functional.item3.result'), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item4.action'), result: $tStore('testes.functional.item4.result'), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item5.action'), result: $tStore('testes.functional.item5.result'), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item6.action'), result: $tStore('testes.functional.item6.result'), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item7.action'), result: $tStore('testes.functional.item7.result'), priority: localPriority($tStore('testes.functional.item7.priority'), $tNavStore) },
      ],
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: [
        { criterion: $tStore('testes.accessibility.item1.criterion'), level: $tStore('testes.accessibility.item1.level'), how: $tStore('testes.accessibility.item1.how') },
        { criterion: $tStore('testes.accessibility.item2.criterion'), level: $tStore('testes.accessibility.item2.level'), how: $tStore('testes.accessibility.item2.how') },
        { criterion: $tStore('testes.accessibility.item3.criterion'), level: $tStore('testes.accessibility.item3.level'), how: $tStore('testes.accessibility.item3.how') },
        { criterion: $tStore('testes.accessibility.item4.criterion'), level: $tStore('testes.accessibility.item4.level'), how: $tStore('testes.accessibility.item4.how') },
        { criterion: $tStore('testes.accessibility.item5.criterion'), level: $tStore('testes.accessibility.item5.level'), how: $tStore('testes.accessibility.item5.how') },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [
        { story: $tStore('testes.visual.item1.story'), priority: localPriority($tStore('testes.visual.item1.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item2.story'), priority: localPriority($tStore('testes.visual.item2.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item3.story'), priority: localPriority($tStore('testes.visual.item3.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item4.story'), priority: localPriority($tStore('testes.visual.item4.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item5.story'), priority: localPriority($tStore('testes.visual.item5.priority'), $tNavStore) },
      ],
    }}
  />
</DocsPageLayout>
