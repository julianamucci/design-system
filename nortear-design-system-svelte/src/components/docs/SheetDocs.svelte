<script lang="ts">
  import { untrack } from 'svelte';
  import {
    Sheet,
    SheetBody,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from '@/components/ui/sheet';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DOMPurify from 'dompurify';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import sheetTranslations from '@shared/content/sheet/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(sheetTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = $derived(
    Object.values(
      (sheetTranslations as unknown as Record<
        string,
        { accessibility?: { screenReader?: Record<string, string> } }
      >)[$locale]?.accessibility?.screenReader ?? {},
    ),
  );

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'sheet',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/overlay' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'sheet',
      locale: l,
      page_title: `${t('title')} · Design System`,
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
        { id: 'variantes',    label: tContent('nav.variants') },
        { id: 'composicoes',  label: tContent('nav.compositions') },
        { id: 'estados',      label: tContent('nav.states')   },
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

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'sheet', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = {
    high: 'common.high',
    medium: 'common.medium',
    low: 'common.low',
  };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  /**
   * Lista que mora inteira no conteúdo compartilhado.
   *
   * O achatamento do dicionário não desmonta array: o caminho da chave devolve
   * a lista, e é dela que saem as seções do menu e a fileira de ações.
   */
  function contentList(t: (k: string) => string, key: string): string[] {
    const value = t(key) as unknown;
    return Array.isArray(value) ? (value as string[]) : [];
  }

  // ─── Analytics — motivo do fechamento ───────────────────────────────────────

  // O `onOpenChange` da lib avisa QUE o painel fechou, nunca POR QUÊ — e o
  // payload de `dialog_close` promete `reason`. Os dois caminhos que a lib
  // anuncia por evento próprio ficam anotados aqui; o que sobra é o botão,
  // tanto o X do canto quanto a saída do rodapé, que fecham pelo mesmo
  // `SheetClose`.
  //
  // Uma variável para a página inteira basta: o painel é modal, e nunca há dois
  // abertos ao mesmo tempo.
  type SheetCloseReason = 'escape' | 'overlay' | 'close-button';
  let pendingCloseReason: SheetCloseReason | null = null;

  /** Ouvintes prontos para espalhar no conteúdo, que os repassa ao primitivo. */
  const closeWatch = {
    onEscapeKeydown: () => { pendingCloseReason = 'escape'; },
    onInteractOutside: () => { pendingCloseReason = 'overlay'; },
  };

  /**
   * Abertura e fechamento de qualquer painel VIVO desta página.
   *
   * `label` carrega o SIDE (valor estável, não localizado) — texto traduzido
   * partiria o mesmo evento em três valores no GA4. `location` vem de QUEM
   * CHAMA, porque ele existe para dizer de ONDE veio o clique.
   */
  function trackSheet(location: string, side: string, open: boolean): void {
    if (open) {
      pendingCloseReason = null;
      track('dialog_open', { component: 'sheet', label: side, location });
      return;
    }
    track('dialog_close', {
      component: 'sheet',
      label: side,
      reason: pendingCloseReason ?? 'close-button',
      location,
    });
    pendingCloseReason = null;
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";`;

  const codeImportUsage = `<Sheet>
  <SheetTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Abrir filtros</Button>
    {/snippet}
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Filtros avançados</SheetTitle>
      <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
    </SheetHeader>
    <SheetFooter>
      <SheetClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>Cancelar</Button>
        {/snippet}
      </SheetClose>
      <Button>Aplicar filtros</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`;

  /**
   * Snippet de uma direção, montado a partir das MESMAS chaves que o preview ao
   * lado renderiza.
   *
   * Antes os quatro eram `<SheetContent side="…">...</SheetContent>`, com as
   * reticências literais: o preview mostrava um painel vivo e completo, e o
   * código ao lado não era copiável — as reticências não são sintaxe, são um
   * pedido para o leitor adivinhar o resto.
   */
  function codeSide(side: string, title: string, t: (key: string) => string): string {
    return `<Sheet>
  <SheetTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>${t('demonstration.labels.trigger')}</Button>
    {/snippet}
  </SheetTrigger>
  <SheetContent side="${side}">
    <SheetHeader>
      <SheetTitle>${title}</SheetTitle>
      <SheetDescription>${t('demonstration.labels.description')}</SheetDescription>
    </SheetHeader>
    <SheetBody>
      <p class="nds-text-body nds-text-muted-foreground">${t('demonstration.labels.body')}</p>
    </SheetBody>
    <SheetFooter>
      <SheetClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>${t('demonstration.labels.cancel')}</Button>
        {/snippet}
      </SheetClose>
      <Button>${t('demonstration.labels.apply')}</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`;
  }

  // Os quatro snippets de composição saem das MESMAS chaves que o preview ao
  // lado renderiza — nome de campo, rótulo de ação e item de menu inclusive.
  // Literal em português mostrava português no meio de uma seção em inglês.

  function codeAdvancedFilters(t: (key: string) => string): string {
    return `<Sheet>
  <SheetTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>${t('demonstration.labels.trigger')}</Button>
    {/snippet}
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>${t('demonstration.labels.title')}</SheetTitle>
      <SheetDescription>${t('demonstration.labels.description')}</SheetDescription>
    </SheetHeader>
    <SheetBody>
      <form id="filters" class="nds-stack" data-spacing="sm">
        <div class="nds-stack" data-spacing="xs">
          <Label for="category">${t('variants.compositions.advancedFilters.fieldCategory')}</Label>
          <Input id="category" value="${t('variants.compositions.advancedFilters.categoryValue')}" />
        </div>
        <div class="nds-stack" data-spacing="xs">
          <Label for="min-price">${t('variants.compositions.advancedFilters.fieldMinPrice')}</Label>
          <Input id="min-price" type="number" value="100" />
        </div>
      </form>
    </SheetBody>
    <SheetFooter>
      <SheetClose>
        {#snippet child({ props })}
          <Button type="button" variant="outline" {...props}>${t('demonstration.labels.cancel')}</Button>
        {/snippet}
      </SheetClose>
      <Button type="submit" form="filters">${t('demonstration.labels.apply')}</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`;
  }

  function codeSecondaryNav(t: (key: string) => string): string {
    // Os links saem escritos, um a um, e não por laço: o exemplo tem de ser
    // copiável inteiro, e um `{#each}` pediria uma lista que ele não declara.
    const links = contentList(t, 'variants.compositions.secondaryNavigation.items')
      .map(
        (item) =>
          `        <a href="#" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">${item}</a>`,
      )
      .join('\n');
    return `<Sheet>
  <SheetTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>${t('variants.compositions.secondaryNavigation.trigger')}</Button>
    {/snippet}
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>${t('variants.compositions.secondaryNavigation.panelTitle')}</SheetTitle>
      <SheetDescription>${t('variants.compositions.secondaryNavigation.panelDescription')}</SheetDescription>
    </SheetHeader>
    <SheetBody>
      <nav aria-label="${t('variants.compositions.secondaryNavigation.navLabel')}" class="nds-stack" data-spacing="xs">
${links}
      </nav>
    </SheetBody>
  </SheetContent>
</Sheet>`;
  }

  function codeProfileEdit(t: (key: string) => string): string {
    return `<Sheet>
  <SheetTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>${t('variants.compositions.profileEdit.trigger')}</Button>
    {/snippet}
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>${t('variants.compositions.profileEdit.panelTitle')}</SheetTitle>
      <SheetDescription>${t('variants.compositions.profileEdit.panelDescription')}</SheetDescription>
    </SheetHeader>
    <SheetBody>
      <form id="profile" class="nds-stack" data-spacing="sm">
        <div class="nds-stack" data-spacing="xs">
          <Label for="profile-name">${t('variants.compositions.profileEdit.fieldName')}</Label>
          <Input id="profile-name" value="${t('variants.compositions.profileEdit.fieldNameValue')}" />
        </div>
        <div class="nds-stack" data-spacing="xs">
          <Label for="profile-handle">${t('variants.compositions.profileEdit.fieldHandle')}</Label>
          <Input id="profile-handle" value="${t('variants.compositions.profileEdit.fieldHandleValue')}" />
        </div>
        <div class="nds-stack" data-spacing="xs">
          <Label for="profile-bio">${t('variants.compositions.profileEdit.fieldBio')}</Label>
          <Input id="profile-bio" value="${t('variants.compositions.profileEdit.fieldBioValue')}" />
        </div>
      </form>
    </SheetBody>
    <SheetFooter>
      <SheetClose>
        {#snippet child({ props })}
          <Button type="button" variant="outline" {...props}>${t('demonstration.labels.cancel')}</Button>
        {/snippet}
      </SheetClose>
      <Button type="submit" form="profile">${t('variants.compositions.profileEdit.submit')}</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`;
  }

  function codeBottomPanel(t: (key: string) => string): string {
    const actions = panelActions(t)
      .map(
        (action) =>
          `        <Button variant="${action.variant}">${action.label}</Button>`,
      )
      .join('\n');
    return `<Sheet>
  <SheetTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>${t('variants.compositions.bottomPanel.trigger')}</Button>
    {/snippet}
  </SheetTrigger>
  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>${t('variants.compositions.bottomPanel.panelTitle')}</SheetTitle>
      <SheetDescription>${t('variants.compositions.bottomPanel.panelDescription')}</SheetDescription>
    </SheetHeader>
    <SheetBody>
      <div class="nds-cluster" data-spacing="md">
${actions}
      </div>
    </SheetBody>
    <SheetFooter>
      <SheetClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>${t('variants.compositions.bottomPanel.close')}</Button>
        {/snippet}
      </SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`;
  }

  /**
   * A fileira de ações do painel inferior.
   *
   * A última é a destrutiva — é o conteúdo que decide quantas ações existem, e
   * a posição é o que decide a variante, para que acrescentar uma quarta ação
   * não exija mexer aqui.
   */
  function panelActions(t: (key: string) => string) {
    const actions = contentList(t, 'variants.compositions.bottomPanel.actions');
    return actions.map((label, index) => ({
      label,
      variant: index === actions.length - 1 ? ('destructive' as const) : ('outline' as const),
    }));
  }

  const interfaceCode = `// Sheet (Root) — bits-ui Dialog
interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: Snippet;
}

// SheetContent
interface SheetContentProps {
  side?: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton?: boolean;
  class?: string;
  children: Snippet;
}

// SheetTrigger / SheetClose
interface TriggerProps {
  class?: string;
  child?: Snippet<[{ props: Record<string, any> }]>;
}`;

  const propsTableCols = $derived({
    prop: $tStore('props.table.prop'),
    type: $tStore('props.table.type'),
    default: $tStore('props.table.default'),
    required: $tStore('props.table.required'),
    description: $tStore('props.table.description'),
  });
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value}>
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    <!--
      UM gatilho só. Os quatro `side` viviam aqui e repetiam integralmente a
      seção Variantes logo abaixo — quem lê via o mesmo exemplo duas vezes.
      O `label` do evento carrega o SIDE (valor estável), nunca texto
      traduzido, que partiria o mesmo evento em três valores no GA4.
    -->
    <div class="nds-cluster" data-justify="center" data-spacing="sm" style="contain: layout">
      <Sheet onOpenChange={(o: boolean) => trackSheet('docs_demo', 'right', o)}>
        <SheetTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('demonstration.labels.trigger')}</Button>
          {/snippet}
        </SheetTrigger>
        <SheetContent side="right" {...closeWatch}>
          <SheetHeader>
            <SheetTitle>{$tStore('demonstration.labels.title')}</SheetTitle>
            <SheetDescription>{$tStore('demonstration.labels.description')}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <p class="nds-text-body nds-text-muted-foreground">{$tStore('demonstration.labels.body')}</p>
          </SheetBody>
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}
                <Button variant="outline" {...props}>{$tStore('demonstration.labels.cancel')}</Button>
              {/snippet}
            </SheetClose>
            <Button onclick={() => track('dialog_confirm', { component: 'sheet', action: 'apply', location: 'docs_demo' })}>{$tStore('demonstration.labels.apply')}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
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
      $tStore('anatomy.item9'),
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
        { s: $tStore('usage.scenarios.item6.s'), u: $tStore('usage.scenarios.item6.u'), a: $tStore('usage.scenarios.item6.a') },
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
        { element: $tStore('usage.uxWriting.table.title.name'),       rules: $tStore('usage.uxWriting.table.title.format'),       do: $tStore('usage.uxWriting.table.title.good'),       dont: $tStore('usage.uxWriting.table.title.bad') },
        { element: $tStore('usage.uxWriting.table.description.name'), rules: $tStore('usage.uxWriting.table.description.format'), do: $tStore('usage.uxWriting.table.description.good'), dont: $tStore('usage.uxWriting.table.description.bad') },
        { element: $tStore('usage.uxWriting.table.trigger.name'),     rules: $tStore('usage.uxWriting.table.trigger.format'),     do: $tStore('usage.uxWriting.table.trigger.good'),     dont: $tStore('usage.uxWriting.table.trigger.bad') },
        { element: $tStore('usage.uxWriting.table.primary.name'),     rules: $tStore('usage.uxWriting.table.primary.format'),     do: $tStore('usage.uxWriting.table.primary.good'),     dont: $tStore('usage.uxWriting.table.primary.bad') },
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
        stripHtml($tStore('usage.dont.item1')),
        stripHtml($tStore('usage.dont.item2')),
        stripHtml($tStore('usage.dont.item3')),
        stripHtml($tStore('usage.dont.item4')),
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
      <Sheet onOpenChange={(o: boolean) => trackSheet('docs_do_dont', 'right', o)}>
        <SheetTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('demonstration.labels.trigger')}</Button>
          {/snippet}
        </SheetTrigger>
        <SheetContent side="right" {...closeWatch}>
          <SheetHeader>
            <SheetTitle>{$tStore('demonstration.labels.title')}</SheetTitle>
            <SheetDescription>{$tStore('demonstration.labels.description')}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <p class="nds-text-body nds-text-muted-foreground">{$tStore('demonstration.labels.body')}</p>
          </SheetBody>
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>{$tStore('demonstration.labels.cancel')}</Button>{/snippet}
            </SheetClose>
            <Button onclick={() => track('dialog_confirm', { component: 'sheet', action: 'apply', location: 'docs_do_dont' })}>{$tStore('demonstration.labels.apply')}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div style="contain: layout">
      <Sheet onOpenChange={(o: boolean) => trackSheet('docs_do_dont', 'right', o)}>
        <SheetTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('doDont.pair1.dontTrigger')}</Button>
          {/snippet}
        </SheetTrigger>
        <SheetContent side="right" {...closeWatch}>
          <!-- Cabeçalho só para leitor de tela: é ESTE o defeito ilustrado —
               quem enxerga fica sem título e sem descrição visíveis. -->
          <SheetHeader>
            <SheetTitle class="nds-sr-only">{$tStore('doDont.pair1.dontTitle')}</SheetTitle>
            <SheetDescription class="nds-sr-only">{$tStore('doDont.pair1.dontDescription')}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <p class="nds-text-body nds-text-muted-foreground">{$tStore('doDont.pair1.dontBody')}</p>
          </SheetBody>
          <SheetFooter>
            <Button onclick={() => track('dialog_confirm', { component: 'sheet', action: 'apply', location: 'docs_do_dont' })}>{$tStore('demonstration.labels.apply')}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div style="contain: layout">
      <Sheet onOpenChange={(o: boolean) => trackSheet('docs_do_dont', 'right', o)}>
        <SheetTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('demonstration.labels.trigger')}</Button>
          {/snippet}
        </SheetTrigger>
        <SheetContent side="right" {...closeWatch}>
          <SheetHeader>
            <SheetTitle>{$tStore('demonstration.labels.title')}</SheetTitle>
            <SheetDescription>{$tStore('demonstration.labels.description')}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <p class="nds-text-body nds-text-muted-foreground">{$tStore('demonstration.labels.body')}</p>
          </SheetBody>
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>{$tStore('demonstration.labels.cancel')}</Button>{/snippet}
            </SheetClose>
            <Button onclick={() => track('dialog_confirm', { component: 'sheet', action: 'apply', location: 'docs_do_dont' })}>{$tStore('demonstration.labels.apply')}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div style="contain: layout">
      <Sheet onOpenChange={(o: boolean) => trackSheet('docs_do_dont', 'top', o)}>
        <SheetTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('demonstration.labels.trigger')}</Button>
          {/snippet}
        </SheetTrigger>
        <SheetContent side="top" {...closeWatch}>
          <SheetHeader>
            <SheetTitle>{$tStore('demonstration.labels.title')}</SheetTitle>
            <SheetDescription>{$tStore('demonstration.labels.description')}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <p class="nds-text-body nds-text-muted-foreground">{$tStore('demonstration.labels.body')}</p>
          </SheetBody>
          <SheetFooter>
            <Button onclick={() => track('dialog_confirm', { component: 'sheet', action: 'apply', location: 'docs_do_dont' })}>{$tStore('demonstration.labels.apply')}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
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
      { trackId: 'right',  name: $tStore('variants.items.right'),  description: stripHtml($tStore('variants.styles.right')),  code: codeSide('right',  $tStore('demonstration.labels.rightLabel'),  $tStore), preview: variantRight  },
      { trackId: 'left',   name: $tStore('variants.items.left'),   description: stripHtml($tStore('variants.styles.left')),   code: codeSide('left',   $tStore('demonstration.labels.leftLabel'),   $tStore), preview: variantLeft   },
      { trackId: 'top',    name: $tStore('variants.items.top'),    description: stripHtml($tStore('variants.styles.top')),    code: codeSide('top',    $tStore('demonstration.labels.topLabel'),    $tStore), preview: variantTop    },
      { trackId: 'bottom', name: $tStore('variants.items.bottom'), description: stripHtml($tStore('variants.styles.bottom')), code: codeSide('bottom', $tStore('demonstration.labels.bottomLabel'), $tStore), preview: variantBottom },
    ]}
  />

  {#snippet variantRight()}
    <div style="contain: layout">
      <Sheet onOpenChange={(o: boolean) => trackSheet('docs_variantes', 'right', o)}>
        <SheetTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('demonstration.labels.trigger')}</Button>
          {/snippet}
        </SheetTrigger>
        <SheetContent side="right" {...closeWatch}>
          <SheetHeader>
            <SheetTitle>{$tStore('demonstration.labels.rightLabel')}</SheetTitle>
            <SheetDescription>{$tStore('demonstration.labels.description')}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <p class="nds-text-body nds-text-muted-foreground">{$tStore('demonstration.labels.body')}</p>
          </SheetBody>
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>{$tStore('demonstration.labels.cancel')}</Button>{/snippet}
            </SheetClose>
            <Button onclick={() => track('dialog_confirm', { component: 'sheet', action: 'apply', label: 'right', location: 'docs_variantes' })}>{$tStore('demonstration.labels.apply')}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}
  {#snippet variantLeft()}
    <div style="contain: layout">
      <Sheet onOpenChange={(o: boolean) => trackSheet('docs_variantes', 'left', o)}>
        <SheetTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('demonstration.labels.trigger')}</Button>
          {/snippet}
        </SheetTrigger>
        <SheetContent side="left" {...closeWatch}>
          <SheetHeader>
            <SheetTitle>{$tStore('demonstration.labels.leftLabel')}</SheetTitle>
            <SheetDescription>{$tStore('demonstration.labels.description')}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <p class="nds-text-body nds-text-muted-foreground">{$tStore('demonstration.labels.body')}</p>
          </SheetBody>
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>{$tStore('demonstration.labels.cancel')}</Button>{/snippet}
            </SheetClose>
            <Button onclick={() => track('dialog_confirm', { component: 'sheet', action: 'apply', label: 'left', location: 'docs_variantes' })}>{$tStore('demonstration.labels.apply')}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}
  {#snippet variantTop()}
    <div style="contain: layout">
      <Sheet onOpenChange={(o: boolean) => trackSheet('docs_variantes', 'top', o)}>
        <SheetTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('demonstration.labels.trigger')}</Button>
          {/snippet}
        </SheetTrigger>
        <SheetContent side="top" {...closeWatch}>
          <SheetHeader>
            <SheetTitle>{$tStore('demonstration.labels.topLabel')}</SheetTitle>
            <SheetDescription>{$tStore('demonstration.labels.description')}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <p class="nds-text-body nds-text-muted-foreground">{$tStore('demonstration.labels.body')}</p>
          </SheetBody>
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>{$tStore('demonstration.labels.cancel')}</Button>{/snippet}
            </SheetClose>
            <Button onclick={() => track('dialog_confirm', { component: 'sheet', action: 'apply', label: 'top', location: 'docs_variantes' })}>{$tStore('demonstration.labels.apply')}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}
  {#snippet variantBottom()}
    <div style="contain: layout">
      <Sheet onOpenChange={(o: boolean) => trackSheet('docs_variantes', 'bottom', o)}>
        <SheetTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('demonstration.labels.trigger')}</Button>
          {/snippet}
        </SheetTrigger>
        <SheetContent side="bottom" {...closeWatch}>
          <SheetHeader>
            <SheetTitle>{$tStore('demonstration.labels.bottomLabel')}</SheetTitle>
            <SheetDescription>{$tStore('demonstration.labels.description')}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <p class="nds-text-body nds-text-muted-foreground">{$tStore('demonstration.labels.body')}</p>
          </SheetBody>
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>{$tStore('demonstration.labels.cancel')}</Button>{/snippet}
            </SheetClose>
            <Button onclick={() => track('dialog_confirm', { component: 'sheet', action: 'apply', label: 'bottom', location: 'docs_variantes' })}>{$tStore('demonstration.labels.apply')}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="sheet"
    items={[
      {
        trackId: 'advancedFilters',
        name: $tStore('variants.compositions.advancedFilters.name'),
        description: $tStore('variants.compositions.advancedFilters.description'),
        useWhen: $tStore('variants.compositions.advancedFilters.use'),
        code: codeAdvancedFilters($tStore),
        preview: compAdvancedFilters,
      },
      {
        trackId: 'secondaryNavigation',
        name: $tStore('variants.compositions.secondaryNavigation.name'),
        description: $tStore('variants.compositions.secondaryNavigation.description'),
        useWhen: $tStore('variants.compositions.secondaryNavigation.use'),
        code: codeSecondaryNav($tStore),
        preview: compSecondaryNav,
      },
      {
        trackId: 'profileEdit',
        name: $tStore('variants.compositions.profileEdit.name'),
        description: $tStore('variants.compositions.profileEdit.description'),
        useWhen: $tStore('variants.compositions.profileEdit.use'),
        code: codeProfileEdit($tStore),
        preview: compProfileEdit,
      },
      {
        trackId: 'bottomPanel',
        name: $tStore('variants.compositions.bottomPanel.name'),
        description: $tStore('variants.compositions.bottomPanel.description'),
        useWhen: $tStore('variants.compositions.bottomPanel.use'),
        code: codeBottomPanel($tStore),
        preview: compBottomPanel,
      },
    ]}
  />

  <!--
    Os quatro previews montam o corpo dentro do SheetBody, e não solto no
    conteúdo com um recuo à mão: é ele que traz a área que rola, o `tabindex`
    que a região rolável exige e o `role="group"` que dá nome a ela. Sem ele o
    rodapé rola junto e as ações somem de alcance.

    O texto vem TODO de chave: literal em português mostrava português nas
    páginas em inglês e espanhol, no meio de uma seção traduzida.
  -->
  {#snippet compAdvancedFilters()}
    <div style="contain: layout">
      <Sheet onOpenChange={(o: boolean) => trackSheet('docs_composicoes', 'right', o)}>
        <SheetTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('demonstration.labels.trigger')}</Button>
          {/snippet}
        </SheetTrigger>
        <SheetContent side="right" {...closeWatch}>
          <SheetHeader>
            <SheetTitle>{$tStore('demonstration.labels.title')}</SheetTitle>
            <SheetDescription>{$tStore('demonstration.labels.description')}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <form id="docs-sheet-filters" class="nds-stack" data-spacing="sm"
                  onsubmit={(e: SubmitEvent) => {
                    e.preventDefault();
                    track('dialog_confirm', { component: 'sheet', action: 'apply', label: 'right', location: 'docs_composicoes' });
                  }}>
              <div class="nds-stack" data-spacing="xs">
                <Label for="docs-sheet-category">{$tStore('variants.compositions.advancedFilters.fieldCategory')}</Label>
                <Input id="docs-sheet-category" value={$tStore('variants.compositions.advancedFilters.categoryValue')} />
              </div>
              <div class="nds-stack" data-spacing="xs">
                <Label for="docs-sheet-min-price">{$tStore('variants.compositions.advancedFilters.fieldMinPrice')}</Label>
                <Input id="docs-sheet-min-price" type="number" value="100" />
              </div>
            </form>
          </SheetBody>
          <!-- O rodapé fica FORA do corpo: é ele que continua visível quando o
               conteúdo rola. O `form` religa o botão ao formulário. -->
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}<Button type="button" variant="outline" {...props}>{$tStore('demonstration.labels.cancel')}</Button>{/snippet}
            </SheetClose>
            <Button type="submit" form="docs-sheet-filters">{$tStore('demonstration.labels.apply')}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}

  {#snippet compSecondaryNav()}
    <div style="contain: layout">
      <Sheet onOpenChange={(o: boolean) => trackSheet('docs_composicoes', 'left', o)}>
        <SheetTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('variants.compositions.secondaryNavigation.trigger')}</Button>
          {/snippet}
        </SheetTrigger>
        <SheetContent side="left" {...closeWatch}>
          <SheetHeader>
            <SheetTitle>{$tStore('variants.compositions.secondaryNavigation.panelTitle')}</SheetTitle>
            <SheetDescription>{$tStore('variants.compositions.secondaryNavigation.panelDescription')}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <nav aria-label={$tStore('variants.compositions.secondaryNavigation.navLabel')} class="nds-stack" data-spacing="xs">
              {#each contentList($tStore, 'variants.compositions.secondaryNavigation.items') as item (item)}
                <a href="#" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">{item}</a>
              {/each}
            </nav>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}

  {#snippet compProfileEdit()}
    <div style="contain: layout">
      <Sheet onOpenChange={(o: boolean) => trackSheet('docs_composicoes', 'right', o)}>
        <SheetTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('variants.compositions.profileEdit.trigger')}</Button>
          {/snippet}
        </SheetTrigger>
        <SheetContent side="right" {...closeWatch}>
          <SheetHeader>
            <SheetTitle>{$tStore('variants.compositions.profileEdit.panelTitle')}</SheetTitle>
            <SheetDescription>{$tStore('variants.compositions.profileEdit.panelDescription')}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <!-- Mesmo guard do preview de filtros, e pela mesma razão: o botão
                 do rodapé é `type="submit"` religado por `form`, então o clique
                 — e o Enter dentro de um campo — DISPARA envio de verdade, e sem
                 `preventDefault` a docs page tentaria navegar. O rastreio mora
                 no envio, e não no clique, para valer também pelo Enter. -->
            <form id="docs-sheet-profile" class="nds-stack" data-spacing="sm"
                  onsubmit={(e: SubmitEvent) => {
                    e.preventDefault();
                    track('dialog_confirm', { component: 'sheet', action: 'save', label: 'right', location: 'docs_composicoes' });
                  }}>
              <div class="nds-stack" data-spacing="xs">
                <Label for="docs-sheet-profile-name">{$tStore('variants.compositions.profileEdit.fieldName')}</Label>
                <Input id="docs-sheet-profile-name" value={$tStore('variants.compositions.profileEdit.fieldNameValue')} />
              </div>
              <div class="nds-stack" data-spacing="xs">
                <Label for="docs-sheet-profile-handle">{$tStore('variants.compositions.profileEdit.fieldHandle')}</Label>
                <Input id="docs-sheet-profile-handle" value={$tStore('variants.compositions.profileEdit.fieldHandleValue')} />
              </div>
              <div class="nds-stack" data-spacing="xs">
                <Label for="docs-sheet-profile-bio">{$tStore('variants.compositions.profileEdit.fieldBio')}</Label>
                <Input id="docs-sheet-profile-bio" value={$tStore('variants.compositions.profileEdit.fieldBioValue')} />
              </div>
            </form>
          </SheetBody>
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}<Button type="button" variant="outline" {...props}>{$tStore('demonstration.labels.cancel')}</Button>{/snippet}
            </SheetClose>
            <Button type="submit" form="docs-sheet-profile">{$tStore('variants.compositions.profileEdit.submit')}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}

  {#snippet compBottomPanel()}
    <div style="contain: layout">
      <Sheet onOpenChange={(o: boolean) => trackSheet('docs_composicoes', 'bottom', o)}>
        <SheetTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('variants.compositions.bottomPanel.trigger')}</Button>
          {/snippet}
        </SheetTrigger>
        <SheetContent side="bottom" {...closeWatch}>
          <SheetHeader>
            <SheetTitle>{$tStore('variants.compositions.bottomPanel.panelTitle')}</SheetTitle>
            <SheetDescription>{$tStore('variants.compositions.bottomPanel.panelDescription')}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <div class="nds-cluster" data-spacing="md">
              {#each panelActions($tStore) as action (action.label)}
                <Button variant={action.variant}>{action.label}</Button>
              {/each}
            </div>
          </SheetBody>
          <SheetFooter>
            <SheetClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>{$tStore('variants.compositions.bottomPanel.close')}</Button>{/snippet}
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: toPlainText($tStore('states.cols.trigger')),
      behavior: toPlainText($tStore('states.cols.behavior')),
    }}
    items={[
      { label: $tStore('states.closed.label'),         trigger: toPlainText($tStore('states.closed.trigger')),                    behavior: toPlainText($tStore('states.closed.behavior')) },
      { label: $tStore('states.open.label'),           trigger: toPlainText($tStore('states.open.trigger')),                      behavior: toPlainText($tStore('states.open.behavior')) },
      { label: $tStore('states.transitioning.label'),  trigger: toPlainText($tStore('states.transitioning.trigger')),             behavior: toPlainText($tStore('states.transitioning.behavior')) },
      { label: $tStore('states.focused.label'),        trigger: toPlainText($tStore('states.focused.trigger')),                   behavior: toPlainText($tStore('states.focused.behavior')) },
      { label: $tStore('states.longScrollBody.label'), trigger: toPlainText($tStore('states.longScrollBody.trigger')), behavior: toPlainText($tStore('states.longScrollBody.behavior')) },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        cols: propsTableCols,
        items: [
          { name: 'open',            type: $tStore('props.table.open.type'),            defaultValue: $tStore('props.table.open.default'),            required: $tStore('props.table.open.required'),            description: toPlainText($tStore('props.table.open.description'))            },
          { name: 'defaultOpen',     type: $tStore('props.table.defaultOpen.type'),     defaultValue: $tStore('props.table.defaultOpen.default'),     required: $tStore('props.table.defaultOpen.required'),     description: $tStore('props.table.defaultOpen.description')                },
          { name: 'onOpenChange',    type: $tStore('props.table.onOpenChange.type'),    defaultValue: $tStore('props.table.onOpenChange.default'),    required: $tStore('props.table.onOpenChange.required'),    description: $tStore('props.table.onOpenChange.description')               },
          { name: 'side',            type: $tStore('props.table.side.type'),            defaultValue: $tStore('props.table.side.default'),            required: $tStore('props.table.side.required'),            description: toPlainText($tStore('props.table.side.description'))            },
          { name: 'showCloseButton', type: $tStore('props.table.showCloseButton.type'), defaultValue: $tStore('props.table.showCloseButton.default'), required: $tStore('props.table.showCloseButton.required'), description: toPlainText($tStore('props.table.showCloseButton.description')) },
          { name: 'class',           type: $tStore('props.table.className.type'),       defaultValue: $tStore('props.table.className.default'),       required: $tStore('props.table.className.required'),       description: toPlainText($tStore('props.table.className.description'))       },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityCode={$tStore('props.extensibilityCode')}
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
      { token: '--background', value: $tStore('tokens.table.background.class'), description: $tStore('tokens.table.background.part') },
      { token: '--foreground', value: $tStore('tokens.table.foreground.class'), description: $tStore('tokens.table.foreground.part') },
      { token: '--muted-foreground', value: $tStore('tokens.table.mutedForeground.class'), description: $tStore('tokens.table.mutedForeground.part') },
      { token: '--border', value: $tStore('tokens.table.border.class'), description: $tStore('tokens.table.border.part') },
      { token: '--overlay', value: $tStore('tokens.table.overlay.class'), description: $tStore('tokens.table.overlay.part') },
      { token: '--ring', value: $tStore('tokens.table.ring.class'), description: $tStore('tokens.table.ring.part') },
      { token: '--sheet-width', value: $tStore('tokens.table.width.class'), description: $tStore('tokens.table.width.part') },
      { token: '--sheet-max-width', value: $tStore('tokens.table.maxWidth.class'), description: $tStore('tokens.table.maxWidth.part') },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    screenReaderTitle={$tNavStore('common.screenReader')}
    screenReaderItems={screenReaderItems}
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      stripHtml($tStore('accessibility.items.item1')),
      stripHtml($tStore('accessibility.items.item2')),
      stripHtml($tStore('accessibility.items.item3')),
      $tStore('accessibility.items.item4'),
      stripHtml($tStore('accessibility.items.item5')),
      $tStore('accessibility.items.item6'),
      $tStore('accessibility.items.item7'),
      $tStore('accessibility.items.item8'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',       description: $tStore('accessibility.keyboard.tab')      },
      { key: 'Shift+Tab', description: $tStore('accessibility.keyboard.shiftTab') },
      { key: 'Escape',    description: $tStore('accessibility.keyboard.escape')   },
      { key: 'Enter',     description: $tStore('accessibility.keyboard.enter')    },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.drawer.name'),      description: $tStore('related.items.drawer.description'),      path: '?path=/docs/components-overlay-drawer--docs'      },
      { name: $tStore('related.items.dialog.name'),      description: $tStore('related.items.dialog.description'),      path: '?path=/docs/components-overlay-dialog--docs'      },
      { name: $tStore('related.items.alertDialog.name'), description: $tStore('related.items.alertDialog.description'), path: '?path=/docs/components-overlay-alertdialog--docs' },
      { name: $tStore('related.items.popover.name'),     description: $tStore('related.items.popover.description'),     path: '?path=/docs/components-overlay-popover--docs'     },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: stripHtml($tStore('notes.item1')) },
      { title: '', content: stripHtml($tStore('notes.item2')) },
      { title: '', content: stripHtml($tStore('notes.item3')) },
      { title: '', content: stripHtml($tStore('notes.item4')) },
    ]}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: toPlainText($tStore('analytics.table.trigger')),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: 'dialog_open',    trigger: toPlainText($tStore('analytics.table.dialog_open.trigger')),    payload: $tStore('analytics.table.dialog_open.payload')    },
      { event: 'dialog_close',   trigger: toPlainText($tStore('analytics.table.dialog_close.trigger')),   payload: $tStore('analytics.table.dialog_close.payload')   },
      { event: 'dialog_confirm', trigger: toPlainText($tStore('analytics.table.dialog_confirm.trigger')), payload: $tStore('analytics.table.dialog_confirm.payload') },
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
      items: [1, 2, 3, 4].map((i) => ({
        action: $tStore(`testes.functional.item${i}.action`),
        result: $tStore(`testes.functional.item${i}.result`),
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
        { criterion: $tStore('testes.accessibility.item1'), level: 'AA',    how: '—' },
        { criterion: $tStore('testes.accessibility.item2'), level: '1.4.3', how: '—' },
        { criterion: $tStore('testes.accessibility.item3'), level: '4.1.2', how: '—' },
        { criterion: $tStore('testes.accessibility.item4'), level: '4.1.2', how: '—' },
        { criterion: $tStore('testes.accessibility.item5'), level: '4.1.2', how: '—' },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4].map((i) => ({
        story: $tStore(`testes.visual.item${i}.story`),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>

<!-- DOMPurify.sanitize available para uso futuro em {@html} dinâmico -->
{#if false}
  {@html DOMPurify.sanitize('')}
{/if}
