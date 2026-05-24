<script lang="ts">
  import {
    NavigationMenuRoot,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
    NavigationMenuLink,
  } from '@/components/ui/navigation-menu';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import navigationMenuTranslations from '@shared/content/navigation-menu/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(navigationMenuTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'navigation-menu',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: $tStore('category'), item: '/components/navigation' },
        { name: 'NavigationMenu' },
      ],
    });
    track('docs_page_view', {
      component_name: 'navigation-menu',
      locale: l,
      page_title: t('title'),
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────


  const NAV_GROUPS = $derived.by(() => {
    const tNav = $tNavStore;
    const tContent = $tStore;
    return [
      { label: tNav('nav.overview'), sections: [
        { id: 'demonstracao', label: tContent('nav.demonstration') },
        { id: 'anatomia',     label: tContent('nav.anatomy')       },
        { id: 'quando-usar',  label: tContent('nav.usage')         },
        { id: 'do-dont',      label: tContent('nav.doDont')        },
      ]},
      { label: tNav('nav.techRef'), sections: [
        { id: 'importacao',   label: tContent('nav.import')   },
        { id: 'variantes',    label: tContent('nav.variants')     },
        { id: 'composicoes',  label: tContent('nav.compositions') },
        { id: 'estados',      label: tContent('nav.states')       },
        { id: 'propriedades', label: tContent('nav.props')    },
        { id: 'tokens',       label: tContent('nav.tokens')   },
      ]},
      { label: tNav('nav.context'), sections: [
        { id: 'acessibilidade', label: tContent('nav.accessibility') },
        { id: 'relacionados',   label: tContent('nav.related')       },
        { id: 'notas',          label: tContent('nav.notes')         },
      ]},
      { label: tNav('nav.quality'), sections: [
        { id: 'analytics', label: tContent('nav.analytics') },
        { id: 'testes',    label: tContent('nav.testes')    },
      ]},
    ];
  });

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'navigation-menu', locale: $locale });
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

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  NavigationMenuRoot,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
  NavigationMenuIndicator,
} from "@/components/ui/navigation-menu";`;

  const codeImportUsage = `<NavigationMenuRoot aria-label="Navegação principal">
  <NavigationMenuList>
    <NavigationMenuItem value="home">
      <NavigationMenuLink href="/">Início</NavigationMenuLink>
    </NavigationMenuItem>
    <NavigationMenuItem value="produtos">
      <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul class="grid w-[280px] gap-1 p-2">
          <li><NavigationMenuLink href="/produtos/a">Produto A</NavigationMenuLink></li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenuRoot>`;

  const codeHorizontal = `<NavigationMenuRoot orientation="horizontal" aria-label="Navegação principal">
  <NavigationMenuList>...</NavigationMenuList>
</NavigationMenuRoot>`;
  const codeVertical = `<NavigationMenuRoot orientation="vertical" aria-label="Navegação lateral">
  <NavigationMenuList>...</NavigationMenuList>
</NavigationMenuRoot>`;

  const interfaceCode = `// NavigationMenu (Root)
interface NavigationMenuRootProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  delayDuration?: number;     // default 200
  skipDelayDuration?: number; // default 300
  orientation?: 'horizontal' | 'vertical';
  'aria-label': string; // OBRIGATÓRIO
}

// NavigationMenuItem
interface NavigationMenuItemProps {
  value?: string;
}

// NavigationMenuTrigger
interface NavigationMenuTriggerProps {
  disabled?: boolean;
}

// NavigationMenuLink
interface NavigationMenuLinkProps {
  href: string;
  'aria-current'?: 'page' | undefined;
  active?: boolean;
}`;

  const propsTableCols = $derived({
    prop: $tStore('props.table.prop'),
    type: $tStore('props.table.type'),
    default: $tStore('props.table.default'),
    required: $tStore('props.table.required'),
    description: $tStore('props.table.description'),
  });
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="navigation-menu">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add navigation-menu"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="flex items-center justify-center w-full" style="contain: layout">
        <NavigationMenuRoot defaultValue="produtos" delayDuration={80} aria-label="Navegação principal">
          <NavigationMenuList>
            <NavigationMenuItem value="home">
              <NavigationMenuLink href="/" aria-current="page">Início</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem value="produtos">
              <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="grid w-[440px] grid-cols-2 gap-2 p-3">
                  <li><NavigationMenuLink href="/produtos/a">Produto A</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="/produtos/b">Produto B</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="/produtos/c">Produto C</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="/produtos/d">Produto D</NavigationMenuLink></li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem value="solucoes">
              <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="grid w-[280px] gap-1 p-2">
                  <li><NavigationMenuLink href="/solucoes/startups">Startups</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="/solucoes/empresas">Empresas</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="/solucoes/agencias">Agências</NavigationMenuLink></li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem value="sobre">
              <NavigationMenuLink href="/sobre">Sobre</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenuRoot>
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
      $tStore('anatomy.item8'),
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
        stripHtml($tStore('usage.guidelines.item1')),
        stripHtml($tStore('usage.guidelines.item2')),
        stripHtml($tStore('usage.guidelines.item3')),
        stripHtml($tStore('usage.guidelines.item4')),
        stripHtml($tStore('usage.guidelines.item5')),
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
        { element: $tStore('usage.uxWriting.table.trigger.name'),     rules: $tStore('usage.uxWriting.table.trigger.format'),     do: $tStore('usage.uxWriting.table.trigger.good'),     dont: $tStore('usage.uxWriting.table.trigger.bad') },
        { element: $tStore('usage.uxWriting.table.link.name'),        rules: $tStore('usage.uxWriting.table.link.format'),        do: $tStore('usage.uxWriting.table.link.good'),        dont: $tStore('usage.uxWriting.table.link.bad') },
        { element: $tStore('usage.uxWriting.table.ariaLabel.name'),   rules: $tStore('usage.uxWriting.table.ariaLabel.format'),   do: $tStore('usage.uxWriting.table.ariaLabel.good'),   dont: $tStore('usage.uxWriting.table.ariaLabel.bad') },
        { element: $tStore('usage.uxWriting.table.currentPage.name'), rules: $tStore('usage.uxWriting.table.currentPage.format'), do: $tStore('usage.uxWriting.table.currentPage.good'), dont: $tStore('usage.uxWriting.table.currentPage.bad') },
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
    <div style="contain: layout">
      <NavigationMenuRoot delayDuration={80} aria-label="Navegação principal">
        <NavigationMenuList>
          <NavigationMenuItem value="home">
            <NavigationMenuLink href="/" aria-current="page">Início</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="sobre">
            <NavigationMenuLink href="/sobre">Sobre</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenuRoot>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div style="contain: layout">
      <NavigationMenuRoot delayDuration={80}>
        <NavigationMenuList>
          <NavigationMenuItem value="home">
            <NavigationMenuLink href="/">Início</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="sobre">
            <NavigationMenuLink href="/sobre">Sobre</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenuRoot>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div style="contain: layout">
      <NavigationMenuRoot defaultValue="produtos" delayDuration={80} aria-label="Navegação principal">
        <NavigationMenuList>
          <NavigationMenuItem value="produtos">
            <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="grid w-[300px] gap-1 p-2">
                <li><NavigationMenuLink href="/a">Produto A</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/b">Produto B</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/c">Produto C</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/d">Produto D</NavigationMenuLink></li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenuRoot>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div style="contain: layout">
      <NavigationMenuRoot defaultValue="produtos" delayDuration={80} aria-label="Navegação principal">
        <NavigationMenuList>
          <NavigationMenuItem value="produtos">
            <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="grid w-[260px] gap-1 p-2 max-h-40 overflow-auto">
                {#each Array(30) as _, i}
                  <li><NavigationMenuLink href={`/p/${i}`}>Item {i + 1}</NavigationMenuLink></li>
                {/each}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenuRoot>
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImportBasic}
    secondaryCode={codeImportUsage}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    items={[
      { name: $tStore('variants.items.horizontal'), description: stripHtml($tStore('variants.styles.horizontal')), code: codeHorizontal, preview: variantHorizontal },
      { name: $tStore('variants.items.vertical'),   description: stripHtml($tStore('variants.styles.vertical')),   code: codeVertical,   preview: variantVertical   },
    ]}
  />

  {#snippet variantHorizontal()}
    <div style="contain: layout">
      <NavigationMenuRoot orientation="horizontal" delayDuration={80} aria-label="Navegação principal">
        <NavigationMenuList>
          <NavigationMenuItem value="home">
            <NavigationMenuLink href="/">Início</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="produtos">
            <NavigationMenuLink href="/produtos">Produtos</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="sobre">
            <NavigationMenuLink href="/sobre">Sobre</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenuRoot>
    </div>
  {/snippet}
  {#snippet variantVertical()}
    <div style="contain: layout">
      <NavigationMenuRoot orientation="vertical" delayDuration={80} aria-label="Navegação lateral">
        <NavigationMenuList class="flex-col items-stretch">
          <NavigationMenuItem value="home">
            <NavigationMenuLink href="/">Início</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="produtos">
            <NavigationMenuLink href="/produtos">Produtos</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="sobre">
            <NavigationMenuLink href="/sobre">Sobre</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenuRoot>
    </div>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────── -->
  {#snippet compLinkSimples()}
    <div style="contain: layout; min-height: 200px;" class="w-full flex justify-center">
      <NavigationMenuRoot delayDuration={80} aria-label="Navegação principal">
        <NavigationMenuList>
          <NavigationMenuItem value="home"><NavigationMenuLink href="#">Início</NavigationMenuLink></NavigationMenuItem>
          <NavigationMenuItem value="precos"><NavigationMenuLink href="#">Preços</NavigationMenuLink></NavigationMenuItem>
          <NavigationMenuItem value="contato"><NavigationMenuLink href="#">Contato</NavigationMenuLink></NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenuRoot>
    </div>
  {/snippet}

  {#snippet compComDropdown()}
    <div style="contain: layout; min-height: 280px;" class="w-full flex justify-center">
      <NavigationMenuRoot delayDuration={80} defaultValue="produtos" aria-label="Navegação principal">
        <NavigationMenuList>
          <NavigationMenuItem value="home"><NavigationMenuLink href="#">Início</NavigationMenuLink></NavigationMenuItem>
          <NavigationMenuItem value="produtos">
            <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="grid w-[240px] gap-1 p-2">
                <li><NavigationMenuLink href="#">Plano Inicial</NavigationMenuLink></li>
                <li><NavigationMenuLink href="#">Plano Profissional</NavigationMenuLink></li>
                <li><NavigationMenuLink href="#">Plano Empresarial</NavigationMenuLink></li>
                <li><NavigationMenuLink href="#">Comparar planos</NavigationMenuLink></li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenuRoot>
    </div>
  {/snippet}

  {#snippet compMegaMenuGrid()}
    <div style="contain: layout; min-height: 320px;" class="w-full flex justify-center">
      <NavigationMenuRoot delayDuration={80} defaultValue="solucoes" aria-label="Navegação principal">
        <NavigationMenuList>
          <NavigationMenuItem value="solucoes">
            <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="grid w-[560px] grid-cols-2 gap-2 p-3">
                <li><NavigationMenuLink href="#"><div class="text-sm font-medium">Para Marketing</div><p class="text-xs text-muted-foreground">Automação, leads e campanhas.</p></NavigationMenuLink></li>
                <li><NavigationMenuLink href="#"><div class="text-sm font-medium">Para Vendas</div><p class="text-xs text-muted-foreground">Pipeline, CRM e propostas.</p></NavigationMenuLink></li>
                <li><NavigationMenuLink href="#"><div class="text-sm font-medium">Para Suporte</div><p class="text-xs text-muted-foreground">Tickets, base de conhecimento.</p></NavigationMenuLink></li>
                <li><NavigationMenuLink href="#"><div class="text-sm font-medium">Para Sucesso</div><p class="text-xs text-muted-foreground">Onboarding e retenção.</p></NavigationMenuLink></li>
                <li><NavigationMenuLink href="#"><div class="text-sm font-medium">Para Operações</div><p class="text-xs text-muted-foreground">Workflows e integrações.</p></NavigationMenuLink></li>
                <li><NavigationMenuLink href="#"><div class="text-sm font-medium">Para Analytics</div><p class="text-xs text-muted-foreground">Dashboards e relatórios.</p></NavigationMenuLink></li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenuRoot>
    </div>
  {/snippet}

  {#snippet compComCardDestacado()}
    <div style="contain: layout; min-height: 320px;" class="w-full flex justify-center">
      <NavigationMenuRoot delayDuration={80} defaultValue="recursos" aria-label="Navegação principal">
        <NavigationMenuList>
          <NavigationMenuItem value="recursos">
            <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div class="flex gap-3 w-[560px] p-3">
                <a href="#" class="flex flex-col justify-end w-[220px] rounded-md bg-gradient-to-b from-muted to-accent p-4 no-underline">
                  <div class="text-base font-semibold leading-tight">Comece em 5 minutos</div>
                  <p class="mt-2 text-sm leading-snug text-muted-foreground">
                    Crie sua primeira integração com nosso quickstart.
                  </p>
                </a>
                <ul class="flex flex-col flex-1 gap-1">
                  <li><NavigationMenuLink href="#">Documentação</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Tutoriais</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Comunidade</NavigationMenuLink></li>
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenuRoot>
    </div>
  {/snippet}

  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="navigation-menu"
    items={[
      {
        name: $tStore('variants.compositions.linkSimples.name'),
        description: $tStore('variants.compositions.linkSimples.description'),
        useWhen: $tStore('variants.compositions.linkSimples.use'),
        code: `<NavigationMenuRoot aria-label="Navegação principal">
  <NavigationMenuList>
    <NavigationMenuItem value="home"><NavigationMenuLink href="/">Início</NavigationMenuLink></NavigationMenuItem>
    <NavigationMenuItem value="precos"><NavigationMenuLink href="/precos">Preços</NavigationMenuLink></NavigationMenuItem>
    <NavigationMenuItem value="contato"><NavigationMenuLink href="/contato">Contato</NavigationMenuLink></NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenuRoot>`,
        preview: compLinkSimples,
      },
      {
        name: $tStore('variants.compositions.comDropdown.name'),
        description: $tStore('variants.compositions.comDropdown.description'),
        useWhen: $tStore('variants.compositions.comDropdown.use'),
        code: `<NavigationMenuRoot aria-label="Navegação principal">
  <NavigationMenuList>
    <NavigationMenuItem value="home"><NavigationMenuLink href="/">Início</NavigationMenuLink></NavigationMenuItem>
    <NavigationMenuItem value="produtos">
      <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul class="grid w-[240px] gap-1 p-2">
          <li><NavigationMenuLink href="/produtos/inicial">Plano Inicial</NavigationMenuLink></li>
          <li><NavigationMenuLink href="/produtos/profissional">Plano Profissional</NavigationMenuLink></li>
          <li><NavigationMenuLink href="/produtos/empresarial">Plano Empresarial</NavigationMenuLink></li>
          <li><NavigationMenuLink href="/produtos/comparar">Comparar planos</NavigationMenuLink></li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenuRoot>`,
        preview: compComDropdown,
      },
      {
        name: $tStore('variants.compositions.megaMenuGrid.name'),
        description: $tStore('variants.compositions.megaMenuGrid.description'),
        useWhen: $tStore('variants.compositions.megaMenuGrid.use'),
        code: `<NavigationMenuRoot aria-label="Navegação principal">
  <NavigationMenuList>
    <NavigationMenuItem value="solucoes">
      <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul class="grid w-[560px] grid-cols-2 gap-2 p-3">
          <li>
            <NavigationMenuLink href="/solucoes/marketing">
              <div class="text-sm font-medium">Para Marketing</div>
              <p class="text-xs text-muted-foreground">Automação, leads e campanhas.</p>
            </NavigationMenuLink>
          </li>
          <!-- ...mais 5 itens -->
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenuRoot>`,
        preview: compMegaMenuGrid,
      },
      {
        name: $tStore('variants.compositions.comCardDestacado.name'),
        description: $tStore('variants.compositions.comCardDestacado.description'),
        useWhen: $tStore('variants.compositions.comCardDestacado.use'),
        code: `<NavigationMenuRoot aria-label="Navegação principal">
  <NavigationMenuList>
    <NavigationMenuItem value="recursos">
      <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div class="flex gap-3 w-[560px] p-3">
          <a href="/quickstart" class="flex flex-col justify-end w-[220px] rounded-md bg-gradient-to-b from-muted to-accent p-4 no-underline">
            <div class="text-base font-semibold leading-tight">Comece em 5 minutos</div>
            <p class="mt-2 text-sm leading-snug text-muted-foreground">
              Crie sua primeira integração com nosso quickstart.
            </p>
          </a>
          <ul class="flex flex-col flex-1 gap-1">
            <li><NavigationMenuLink href="/docs">Documentação</NavigationMenuLink></li>
            <li><NavigationMenuLink href="/tutoriais">Tutoriais</NavigationMenuLink></li>
            <li><NavigationMenuLink href="/comunidade">Comunidade</NavigationMenuLink></li>
          </ul>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenuRoot>`,
        preview: compComCardDestacado,
      },
    ]}
  />

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('props.table.prop'),
      trigger: $tNavStore('common.userAction'),
      behavior: $tNavStore('common.expectedResult'),
    }}
    items={[
      { label: $tStore('states.items.closed'), trigger: 'defaultValue=undefined',          behavior: stripHtml($tStore('states.descriptions.closed')) },
      { label: $tStore('states.items.open'),   trigger: 'defaultValue / hover Trigger',    behavior: stripHtml($tStore('states.descriptions.open'))   },
      { label: $tStore('states.items.active'), trigger: 'aria-current="page" no Link',     behavior: stripHtml($tStore('states.descriptions.active')) },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        cols: propsTableCols,
        items: [
          { name: 'value',             type: $tStore('props.table.value.type'),             defaultValue: $tStore('props.table.value.default'),             required: $tStore('props.table.value.required'),             description: $tStore('props.table.value.description')             },
          { name: 'onValueChange',     type: $tStore('props.table.onValueChange.type'),     defaultValue: $tStore('props.table.onValueChange.default'),     required: $tStore('props.table.onValueChange.required'),     description: $tStore('props.table.onValueChange.description')     },
          { name: 'defaultValue',      type: $tStore('props.table.defaultValue.type'),      defaultValue: $tStore('props.table.defaultValue.default'),      required: $tStore('props.table.defaultValue.required'),      description: $tStore('props.table.defaultValue.description')      },
          { name: 'delayDuration',     type: $tStore('props.table.delayDuration.type'),     defaultValue: $tStore('props.table.delayDuration.default'),     required: $tStore('props.table.delayDuration.required'),     description: $tStore('props.table.delayDuration.description')     },
          { name: 'skipDelayDuration', type: $tStore('props.table.skipDelayDuration.type'), defaultValue: $tStore('props.table.skipDelayDuration.default'), required: $tStore('props.table.skipDelayDuration.required'), description: $tStore('props.table.skipDelayDuration.description') },
          { name: 'orientation',       type: $tStore('props.table.orientation.type'),       defaultValue: $tStore('props.table.orientation.default'),       required: $tStore('props.table.orientation.required'),       description: $tStore('props.table.orientation.description')       },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={$tStore('props.extensibilityCode')}
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
      { token: '--background',  value: $tStore('tokens.table.rootBg.class'),         description: $tStore('tokens.table.rootBg.part')         },
      { token: '--accent',      value: $tStore('tokens.table.triggerHover.class'),   description: $tStore('tokens.table.triggerHover.part')   },
      { token: '--accent',      value: $tStore('tokens.table.linkActive.class'),     description: $tStore('tokens.table.linkActive.part')     },
      { token: '--popover',     value: $tStore('tokens.table.viewportBg.class'),     description: $tStore('tokens.table.viewportBg.part')     },
      { token: '--foreground',  value: $tStore('tokens.table.viewportBorder.class'), description: $tStore('tokens.table.viewportBorder.part') },
      { token: '--shadow-md',   value: $tStore('tokens.table.viewportShadow.class'), description: $tStore('tokens.table.viewportShadow.part') },
      { token: '--radius-lg',   value: $tStore('tokens.table.rounded.class'),        description: $tStore('tokens.table.rounded.part')        },
      { token: '--popover',     value: $tStore('tokens.table.indicator.class'),      description: $tStore('tokens.table.indicator.part')      },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.items.item1'),
      $tStore('accessibility.items.item2'),
      $tStore('accessibility.items.item3'),
      $tStore('accessibility.items.item4'),
      $tStore('accessibility.items.item5'),
      $tStore('accessibility.items.item6'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',           description: $tStore('accessibility.keyboard.tab')     },
      { key: '← → / ↑ ↓',     description: $tStore('accessibility.keyboard.arrows')  },
      { key: 'Enter / Space', description: $tStore('accessibility.keyboard.enter')   },
      { key: 'Escape',        description: $tStore('accessibility.keyboard.escape')  },
      { key: 'Home / End',    description: $tStore('accessibility.keyboard.homeEnd') },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.menubar.name'),    description: $tStore('related.items.menubar.description'),    path: '?path=/docs/ui-menubar--docs'    },
      { name: $tStore('related.items.sidebar.name'),    description: $tStore('related.items.sidebar.description'),    path: '?path=/docs/ui-sidebar--docs'    },
      { name: $tStore('related.items.breadcrumb.name'), description: $tStore('related.items.breadcrumb.description'), path: '?path=/docs/ui-breadcrumb--docs' },
      { name: $tStore('related.items.tabs.name'),       description: $tStore('related.items.tabs.description'),       path: '?path=/docs/ui-tabs--docs'       },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: $tStore('notes.item1') },
      { title: '', content: $tStore('notes.item2') },
      { title: '', content: $tStore('notes.item3') },
      { title: '', content: $tStore('notes.item4') },
      { title: '', content: $tStore('notes.item5') },
      { title: '', content: $tStore('notes.item6') },
    ]}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: 'Evento',
      trigger: 'Trigger',
      payload: 'Payload',
    }}
    items={[
      { event: 'nav_menu_open',  trigger: 'onValueChange(item)', payload: "{ component: 'navigation-menu', label }" },
      { event: 'nav_link_click', trigger: 'onClick em Link',     payload: "{ component: 'navigation-menu', label, destination }" },
      { event: '—',              trigger: stripHtml($tStore('analytics.description')), payload: '—' },
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
      items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
        action: stripHtml($tStore(`testes.functional.item${i}.action`)),
        result: stripHtml($tStore(`testes.functional.item${i}.result`)),
        priority: localPriority($tStore(`testes.functional.item${i}.priority`), $tNavStore),
      })),
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: [
        { criterion: stripHtml($tStore('testes.accessibility.item1')), level: 'AA',    how: 'axe-core' },
        { criterion: stripHtml($tStore('testes.accessibility.item2')), level: '1.3.1', how: 'DOM inspection' },
        { criterion: stripHtml($tStore('testes.accessibility.item3')), level: '4.1.2', how: 'DOM inspection' },
        { criterion: stripHtml($tStore('testes.accessibility.item4')), level: '4.1.2', how: 'DOM inspection' },
        { criterion: stripHtml($tStore('testes.accessibility.item5')), level: '2.4.3', how: 'Keyboard test' },
        { criterion: stripHtml($tStore('testes.accessibility.item6')), level: '1.4.3', how: 'Contrast analyzer' },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4, 5].map((i) => ({
        story: $tStore(`testes.visual.item${i}.story`),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>

<!-- sanitizeHtml available para uso futuro em {@html} dinâmico -->
{#if false}
  {@html sanitizeHtml('')}
{/if}
