<script lang="ts">
  import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
  } from '@/components/ui/breadcrumb';
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
  import { Slash } from 'lucide-svelte';
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
  import breadcrumbTranslations from '@shared/content/breadcrumb/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(breadcrumbTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'breadcrumb',
    });
    track('docs_page_view', {
      component_name: 'breadcrumb',
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
    track('docs_section_viewed', { section_id: id, component_name: 'breadcrumb', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function stripHtml(s: string) {
    return s.replace(/<[^>]*>/g, '');
  }

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";`;

  const codeImportWithEllipsis = `import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";`;

  const codeDefault = `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/componentes">Componentes</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

  const codeWithEllipsis = `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbEllipsis />
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/componentes">Componentes</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

  const codeCustomSeparator = `<script lang="ts">
  import { Slash } from 'lucide-svelte';
<\/script>

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator>
      <Slash />
    </BreadcrumbSeparator>
    <BreadcrumbItem>
      <BreadcrumbLink href="/docs">Documentação</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator>
      <Slash />
    </BreadcrumbSeparator>
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

  const codeResponsive = `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          class="flex items-center gap-1 hover:text-foreground transition-colors"
          aria-label="Expandir níveis ocultos"
        >
          <BreadcrumbEllipsis />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem>Documentação</DropdownMenuItem>
          <DropdownMenuItem>Guia</DropdownMenuItem>
          <DropdownMenuItem>Navegação</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

  const codeCustomizationTokens = `/* globals.css — personalize as cores do Breadcrumb via tokens semânticos */
:root {
  --muted-foreground: 240 3.8% 46.1%;
  --foreground: 240 10% 3.9%;
  --ring: 240 5% 64.9%;
}

.dark {
  --muted-foreground: 240 5% 64.9%;
  --foreground: 0 0% 98%;
  --ring: 240 4.9% 83.9%;
}`;

  const interfaceCode = `// Breadcrumb (nav)
interface BreadcrumbProps {
  class?: string;
  children?: Snippet;
}

// BreadcrumbLink — aceita child snippet para integração com routers
interface BreadcrumbLinkProps {
  href?: string;
  class?: string;
  child?: Snippet<[{ props: HTMLAnchorAttributes }]>;
  children?: Snippet;
}

// BreadcrumbSeparator — aceita children para separador customizado
interface BreadcrumbSeparatorProps {
  class?: string;
  children?: Snippet;
}

// BreadcrumbEllipsis — indicador de níveis colapsados
interface BreadcrumbEllipsisProps {
  class?: string;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="breadcrumb">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add breadcrumb"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="w-full">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">{$tStore('demonstration.labels.home')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">{$tStore('demonstration.labels.components')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">{$tStore('demonstration.labels.navigation')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{$tStore('demonstration.labels.breadcrumb')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
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
      $tStore('anatomy.item5'),
      $tStore('anatomy.item6'),
      $tStore('anatomy.item7'),
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
        $tStore('usage.guidelines.item5'),
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
        { element: $tStore('usage.uxWriting.table.link.name'),      rules: stripHtml($tStore('usage.uxWriting.table.link.format')),      do: $tStore('usage.uxWriting.table.link.good'),               dont: $tStore('usage.uxWriting.table.link.bad') },
        { element: $tStore('usage.uxWriting.table.page.name'),      rules: stripHtml($tStore('usage.uxWriting.table.page.format')),      do: stripHtml($tStore('usage.uxWriting.table.page.good')),    dont: $tStore('usage.uxWriting.table.page.bad') },
        { element: $tStore('usage.uxWriting.table.separator.name'), rules: stripHtml($tStore('usage.uxWriting.table.separator.format')), do: stripHtml($tStore('usage.uxWriting.table.separator.good')), dont: $tStore('usage.uxWriting.table.separator.bad') },
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
        doCaption: stripHtml($tStore('doDont.pair1.do')),
        dontCaption: stripHtml($tStore('doDont.pair1.dont')),
        doPreview: doPair1,
        dontPreview: dontPair1,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: stripHtml($tStore('doDont.pair2.do')),
        dontCaption: $tStore('doDont.pair2.dont'),
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
    ]}
  />

  {#snippet doPair1()}
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.home')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.components')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{$tStore('demonstration.labels.breadcrumb')}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  {/snippet}
  {#snippet dontPair1()}
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.home')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.components')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.breadcrumb')}</BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  {/snippet}
  {#snippet doPair2()}
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.home')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.components')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{$tStore('demonstration.labels.breadcrumb')}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  {/snippet}
  {#snippet dontPair2()}
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.home')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.docs')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.guide')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.navigation')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.components')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{$tStore('demonstration.labels.breadcrumb')}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryDescription={$tStore('import.withEllipsis')}
    secondaryCode={codeImportWithEllipsis}
  />

  <!-- ── Variantes (Configurações Disponíveis) ──────────────────── -->
  <DocsVariants
    title={$tStore('variants.visualTitle')}
    items={[
      { name: 'default',         description: stripHtml($tStore('variants.items.default')),         code: codeDefault,         preview: variantDefault         },
      { name: 'withEllipsis',    description: stripHtml($tStore('variants.items.withEllipsis')),    code: codeWithEllipsis,    preview: variantWithEllipsis    },
      { name: 'customSeparator', description: stripHtml($tStore('variants.items.customSeparator')), code: codeCustomSeparator, preview: variantCustomSeparator },
      { name: 'responsive',      description: stripHtml($tStore('variants.items.responsive')),      code: codeResponsive,      preview: variantResponsive      },
    ]}
  />

  {#snippet variantDefault()}
    <Breadcrumb class="w-full">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.home')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.components')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{$tStore('demonstration.labels.breadcrumb')}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  {/snippet}
  {#snippet variantWithEllipsis()}
    <Breadcrumb class="w-full">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.home')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.components')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{$tStore('demonstration.labels.breadcrumb')}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  {/snippet}
  {#snippet variantCustomSeparator()}
    <Breadcrumb class="w-full">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.home')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <Slash />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.docs')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <Slash />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>{$tStore('demonstration.labels.breadcrumb')}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  {/snippet}
  {#snippet variantResponsive()}
    <Breadcrumb class="w-full">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.home')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              class="flex items-center gap-1 hover:text-foreground transition-colors"
              aria-label={$tStore('demonstration.labels.more')}
            >
              <BreadcrumbEllipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>{$tStore('demonstration.labels.docs')}</DropdownMenuItem>
              <DropdownMenuItem>{$tStore('demonstration.labels.guide')}</DropdownMenuItem>
              <DropdownMenuItem>{$tStore('demonstration.labels.navigation')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{$tStore('demonstration.labels.breadcrumb')}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="breadcrumb"
    items={[
      {
        name: $tStore('variants.compositions.default.name'),
        description: $tStore('variants.compositions.default.description'),
        useWhen: $tStore('variants.compositions.default.use'),
        code: codeDefault,
        preview: compDefault,
      },
      {
        name: $tStore('variants.compositions.withEllipsis.name'),
        description: $tStore('variants.compositions.withEllipsis.description'),
        useWhen: $tStore('variants.compositions.withEllipsis.use'),
        code: codeWithEllipsis,
        preview: compWithEllipsis,
      },
      {
        name: $tStore('variants.compositions.customSeparator.name'),
        description: $tStore('variants.compositions.customSeparator.description'),
        useWhen: $tStore('variants.compositions.customSeparator.use'),
        code: codeCustomSeparator,
        preview: compCustomSeparator,
      },
      {
        name: $tStore('variants.compositions.responsive.name'),
        description: $tStore('variants.compositions.responsive.description'),
        useWhen: $tStore('variants.compositions.responsive.use'),
        code: codeResponsive,
        preview: compResponsive,
      },
    ]}
  />

  {#snippet compDefault()}
    <Breadcrumb class="w-full">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.home')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.components')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{$tStore('demonstration.labels.breadcrumb')}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  {/snippet}
  {#snippet compWithEllipsis()}
    <Breadcrumb class="w-full">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.home')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.components')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{$tStore('demonstration.labels.breadcrumb')}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  {/snippet}
  {#snippet compCustomSeparator()}
    <Breadcrumb class="w-full">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.home')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.components')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>{$tStore('demonstration.labels.breadcrumb')}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  {/snippet}
  {#snippet compResponsive()}
    <Breadcrumb class="w-full">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.home')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.guide')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{$tStore('demonstration.labels.components')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{$tStore('demonstration.labels.breadcrumb')}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  {/snippet}

  <!-- ── Configurações (States) ─────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={[
      { label: $tStore('states.simple.label'),          trigger: stripHtml($tStore('states.simple.trigger')),          behavior: stripHtml($tStore('states.simple.behavior'))          },
      { label: $tStore('states.withEllipsis.label'),    trigger: stripHtml($tStore('states.withEllipsis.trigger')),    behavior: stripHtml($tStore('states.withEllipsis.behavior'))    },
      { label: $tStore('states.customSeparator.label'), trigger: stripHtml($tStore('states.customSeparator.trigger')), behavior: stripHtml($tStore('states.customSeparator.behavior')) },
      { label: $tStore('states.asChildLink.label'),     trigger: stripHtml($tStore('states.asChildLink.trigger')),     behavior: stripHtml($tStore('states.asChildLink.behavior'))     },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: $tStore('props.breadcrumbTitle'),
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
        title: $tStore('props.listTitle'),
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
        title: $tStore('props.linkTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'href',     type: 'string',                                 defaultValue: '—', required: 'Sim', description: stripHtml($tStore('props.table.href'))    },
          { name: 'child',    type: 'Snippet<[{ props: HTMLAnchorAttributes }]>', defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.table.asChild')) },
          { name: 'class',    type: 'string',                                 defaultValue: '—', required: 'Não', description: $tStore('props.table.className')          },
          { name: 'children', type: 'Snippet',                                defaultValue: '—', required: 'Sim', description: $tStore('props.table.children')           },
        ],
      },
      {
        title: $tStore('props.pageTitle'),
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
        title: $tStore('props.separatorTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'class',    type: 'string',  defaultValue: '—',                   required: 'Não', description: $tStore('props.table.className') },
          { name: 'children', type: 'Snippet', defaultValue: '<ChevronRightIcon />', required: 'Não', description: $tStore('props.table.children')  },
        ],
      },
      {
        title: $tStore('props.ellipsisTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'class', type: 'string', defaultValue: '—', required: 'Não', description: $tStore('props.table.className') },
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
      { token: '--muted-foreground', value: 'text-muted-foreground',   description: $tStore('tokens.table.mutedForeground') },
      { token: '--foreground',       value: 'hover:text-foreground',   description: $tStore('tokens.table.foreground')      },
      { token: '--ring',             value: 'focus-visible:ring-ring', description: $tStore('tokens.table.ring')            },
      { token: 'font-size',          value: 'text-sm',                 description: $tStore('tokens.table.textSm')          },
      { token: 'gap',                value: 'gap-1.5',                 description: $tStore('tokens.table.gap')             },
      { token: 'icon-size',          value: '[&>svg]:size-3.5',        description: $tStore('tokens.table.sizeSeparator')   },
      { token: 'icon-size',          value: 'size-5',                  description: $tStore('tokens.table.sizeEllipsis')    },
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
      { key: 'Tab',       description: $tStore('accessibility.keyboard.tab')      },
      { key: 'Enter',     description: $tStore('accessibility.keyboard.enter')    },
      { key: 'Shift+Tab', description: $tStore('accessibility.keyboard.shiftTab') },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'NavigationMenu', description: $tStore('related.navigationMenu'), path: '?path=/docs/ui-navigationmenu--docs' },
      { name: 'Stepper',        description: $tStore('related.stepper'),        path: '?path=/docs/ui-stepper--docs'        },
      { name: 'Tabs',           description: $tStore('related.tabs'),           path: '?path=/docs/ui-tabs--docs'           },
      { name: 'DropdownMenu',   description: $tStore('related.dropdownMenu'),   path: '?path=/docs/ui-dropdownmenu--docs'   },
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
      { event: $tStore('analytics.table.navigationClick'), trigger: stripHtml($tStore('analytics.table.navigationClickTrigger')), payload: $tStore('analytics.table.navigationClickPayload') },
      { event: $tStore('analytics.table.ellipsisOpen'),    trigger: stripHtml($tStore('analytics.table.ellipsisOpenTrigger')),    payload: $tStore('analytics.table.ellipsisOpenPayload')    },
      { event: $tStore('analytics.table.pageView'),        trigger: $tStore('analytics.table.pageViewTrigger'),                   payload: $tStore('analytics.table.pageViewPayload')        },
      { event: $tStore('analytics.table.sectionViewed'),   trigger: $tStore('analytics.table.sectionViewedTrigger'),              payload: $tStore('analytics.table.sectionViewedPayload')   },
      { event: $tStore('analytics.table.langSwitch'),      trigger: $tStore('analytics.table.langSwitchTrigger'),                 payload: $tStore('analytics.table.langSwitchPayload')      },
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
        { action: $tStore('testes.functional.item1.action'), result: stripHtml($tStore('testes.functional.item1.result')), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item2.action'), result: stripHtml($tStore('testes.functional.item2.result')), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item3.action'), result: stripHtml($tStore('testes.functional.item3.result')), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item4.action'), result: stripHtml($tStore('testes.functional.item4.result')), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item5.action'), result: stripHtml($tStore('testes.functional.item5.result')), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item6.action'), result: stripHtml($tStore('testes.functional.item6.result')), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
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
        { criterion: stripHtml($tStore('testes.accessibility.item1.criterion')), level: $tStore('testes.accessibility.item1.level'), how: $tStore('testes.accessibility.item1.how') },
        { criterion: stripHtml($tStore('testes.accessibility.item2.criterion')), level: $tStore('testes.accessibility.item2.level'), how: $tStore('testes.accessibility.item2.how') },
        { criterion: stripHtml($tStore('testes.accessibility.item3.criterion')), level: $tStore('testes.accessibility.item3.level'), how: $tStore('testes.accessibility.item3.how') },
        { criterion: $tStore('testes.accessibility.item4.criterion'),            level: $tStore('testes.accessibility.item4.level'), how: $tStore('testes.accessibility.item4.how') },
        { criterion: $tStore('testes.accessibility.item5.criterion'),            level: $tStore('testes.accessibility.item5.level'), how: stripHtml($tStore('testes.accessibility.item5.how')) },
        { criterion: $tStore('testes.accessibility.item6.criterion'),            level: $tStore('testes.accessibility.item6.level'), how: $tStore('testes.accessibility.item6.how') },
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
      ],
    }}
  />
</DocsPageLayout>
