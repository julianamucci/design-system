<script lang="ts">
  import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  } from '@/components/ui/drawer';
  import { Button } from '@/components/ui/button';
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
  import drawerTranslations from '@shared/content/drawer/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(drawerTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'drawer',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: 'Disclosure', item: '/components/disclosure' },
        { name: 'Drawer' },
      ],
    });
    track('docs_page_view', {
      component_name: 'drawer',
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
        { id: 'variantes',    label: tContent('nav.variants') },
        { id: 'composicoes',  label: tNav('nav.compositions') },
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

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'drawer', locale: $locale });
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";`;

  const codeImportUsage = `<Drawer direction="bottom">
  <DrawerTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Abrir</Button>
    {/snippet}
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Editar perfil</DrawerTitle>
      <DrawerDescription>Atualize seus dados.</DrawerDescription>
    </DrawerHeader>
    <DrawerFooter>
      <Button>Salvar</Button>
      <DrawerClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>Cancelar</Button>
        {/snippet}
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`;

  const codeBottom = `<Drawer direction="bottom">...</Drawer>`;
  const codeTop = `<Drawer direction="top">...</Drawer>`;
  const codeLeft = `<Drawer direction="left">...</Drawer>`;
  const codeRight = `<Drawer direction="right">...</Drawer>`;

  const interfaceCode = `// Drawer (Root)
interface DrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  direction?: 'bottom' | 'top' | 'left' | 'right';
  modal?: boolean;
  dismissible?: boolean;
  shouldScaleBackground?: boolean;
  children?: Snippet;
}

// DrawerContent
interface DrawerContentProps {
  class?: string;
  children: Snippet;
}

// DrawerTrigger / DrawerClose
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
      installNote="npx shadcn-svelte@latest add drawer"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="flex flex-wrap items-center justify-center gap-3 w-full" style="contain: layout">
        <Drawer direction="bottom">
          <DrawerTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>{$tStore('demonstration.labels.bottom')}</Button>
            {/snippet}
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{$tStore('title')}</DrawerTitle>
              <DrawerDescription>{$tStore('description')}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button>OK</Button>
              <DrawerClose>
                {#snippet child({ props })}
                  <Button variant="outline" {...props}>Cancelar</Button>
                {/snippet}
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <Drawer direction="right">
          <DrawerTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>{$tStore('demonstration.labels.right')}</Button>
            {/snippet}
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{$tStore('title')}</DrawerTitle>
              <DrawerDescription>{$tStore('description')}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button>OK</Button>
              <DrawerClose>
                {#snippet child({ props })}
                  <Button variant="outline" {...props}>Cancelar</Button>
                {/snippet}
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <Drawer direction="left">
          <DrawerTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>{$tStore('demonstration.labels.left')}</Button>
            {/snippet}
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{$tStore('title')}</DrawerTitle>
              <DrawerDescription>{$tStore('description')}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button>OK</Button>
              <DrawerClose>
                {#snippet child({ props })}
                  <Button variant="outline" {...props}>Cancelar</Button>
                {/snippet}
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <Drawer direction="top">
          <DrawerTrigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>{$tStore('demonstration.labels.top')}</Button>
            {/snippet}
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{$tStore('title')}</DrawerTitle>
              <DrawerDescription>{$tStore('description')}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button>OK</Button>
              <DrawerClose>
                {#snippet child({ props })}
                  <Button variant="outline" {...props}>Cancelar</Button>
                {/snippet}
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
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
        { element: $tStore('usage.uxWriting.table.title.name'),       rules: $tStore('usage.uxWriting.table.title.format'),       do: $tStore('usage.uxWriting.table.title.good'),       dont: $tStore('usage.uxWriting.table.title.bad') },
        { element: $tStore('usage.uxWriting.table.description.name'), rules: $tStore('usage.uxWriting.table.description.format'), do: $tStore('usage.uxWriting.table.description.good'), dont: $tStore('usage.uxWriting.table.description.bad') },
        { element: $tStore('usage.uxWriting.table.trigger.name'),     rules: $tStore('usage.uxWriting.table.trigger.format'),     do: $tStore('usage.uxWriting.table.trigger.good'),     dont: $tStore('usage.uxWriting.table.trigger.bad') },
        { element: $tStore('usage.uxWriting.table.close.name'),       rules: $tStore('usage.uxWriting.table.close.format'),       do: $tStore('usage.uxWriting.table.close.good'),       dont: $tStore('usage.uxWriting.table.close.bad') },
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
      <Drawer direction="bottom" defaultOpen={true}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar perfil</DrawerTitle>
            <DrawerDescription>Atualize seus dados.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button>Salvar</Button>
            <DrawerClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div style="contain: layout">
      <Drawer direction="bottom" defaultOpen={true}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerDescription>Atualize seus dados.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button>OK</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div style="contain: layout">
      <Drawer direction="bottom" defaultOpen={true}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Filtros</DrawerTitle>
            <DrawerDescription>Refine os resultados.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button>Aplicar</Button>
            <DrawerClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div style="contain: layout">
      <Drawer direction="bottom" defaultOpen={true}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Externo</DrawerTitle>
            <DrawerDescription>Drawer aninhado quebra focus trap.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button>Confirmar</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
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
      { name: $tStore('variants.items.bottom'), description: $tStore('variants.styles.bottom'), code: codeBottom, preview: variantBottom },
      { name: $tStore('variants.items.top'),    description: $tStore('variants.styles.top'),    code: codeTop,    preview: variantTop    },
      { name: $tStore('variants.items.left'),   description: $tStore('variants.styles.left'),   code: codeLeft,   preview: variantLeft   },
      { name: $tStore('variants.items.right'),  description: $tStore('variants.styles.right'),  code: codeRight,  preview: variantRight  },
    ]}
  />

  {#snippet variantBottom()}
    <div style="contain: layout">
      <Drawer direction="bottom" defaultOpen={true}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Bottom</DrawerTitle>
            <DrawerDescription>Drawer mobile padrão com handle de drag.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button>OK</Button>
            <DrawerClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  {/snippet}
  {#snippet variantTop()}
    <div style="contain: layout">
      <Drawer direction="top" defaultOpen={true}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Top</DrawerTitle>
            <DrawerDescription>Drawer entra por cima.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button>OK</Button>
            <DrawerClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  {/snippet}
  {#snippet variantLeft()}
    <div style="contain: layout">
      <Drawer direction="left" defaultOpen={true}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Left</DrawerTitle>
            <DrawerDescription>Painel lateral à esquerda.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button>OK</Button>
            <DrawerClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  {/snippet}
  {#snippet variantRight()}
    <div style="contain: layout">
      <Drawer direction="right" defaultOpen={true}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Right</DrawerTitle>
            <DrawerDescription>Painel lateral à direita (padrão desktop).</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button>OK</Button>
            <DrawerClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  {/snippet}

  <!-- ── Composições ────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="drawer"
    items={[
      {
        name: $tStore('variants.compositions.withForm.name'),
        description: $tStore('variants.compositions.withForm.description'),
        useWhen: $tStore('variants.compositions.withForm.use'),
        code: `<Drawer>
  <DrawerTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Editar perfil</Button>
    {/snippet}
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Editar perfil</DrawerTitle>
      <DrawerDescription>Atualize seus dados pessoais.</DrawerDescription>
    </DrawerHeader>
    <form class="grid gap-3 px-4">
      <label class="grid gap-1 text-sm">
        <span class="font-medium">Nome</span>
        <input class="border rounded-md px-3 py-2" value="Maria Souza" />
      </label>
      <label class="grid gap-1 text-sm">
        <span class="font-medium">E-mail</span>
        <input type="email" class="border rounded-md px-3 py-2" value="maria@exemplo.com" />
      </label>
    </form>
    <DrawerFooter>
      <Button>Salvar alterações</Button>
      <DrawerClose>
        {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
        preview: compWithForm,
      },
      {
        name: $tStore('variants.compositions.withConfirmation.name'),
        description: $tStore('variants.compositions.withConfirmation.description'),
        useWhen: $tStore('variants.compositions.withConfirmation.use'),
        code: `<Drawer>
  <DrawerTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Remover item</Button>
    {/snippet}
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Remover item da lista?</DrawerTitle>
      <DrawerDescription>Você poderá adicioná-lo novamente a qualquer momento.</DrawerDescription>
    </DrawerHeader>
    <DrawerFooter>
      <Button variant="destructive">Remover</Button>
      <DrawerClose>
        {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
        preview: compWithConfirmation,
      },
      {
        name: $tStore('variants.compositions.withScroll.name'),
        description: $tStore('variants.compositions.withScroll.description'),
        useWhen: $tStore('variants.compositions.withScroll.use'),
        code: `<Drawer>
  <DrawerTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Ler termos</Button>
    {/snippet}
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Termos de uso</DrawerTitle>
      <DrawerDescription>Leia atentamente antes de aceitar.</DrawerDescription>
    </DrawerHeader>
    <div class="text-sm text-muted-foreground max-h-64 overflow-y-auto px-4 space-y-3">
      {#each Array.from({ length: 12 }) as _, i}
        <p>Parágrafo {i + 1}: termos longos para garantir scroll interno.</p>
      {/each}
    </div>
    <DrawerFooter>
      <Button>Aceitar termos</Button>
      <DrawerClose>
        {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
        preview: compWithScroll,
      },
      {
        name: $tStore('variants.compositions.rightPanel.name'),
        description: $tStore('variants.compositions.rightPanel.description'),
        useWhen: $tStore('variants.compositions.rightPanel.use'),
        code: `<Drawer direction="right">
  <DrawerTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Abrir filtros</Button>
    {/snippet}
  </DrawerTrigger>
  <DrawerContent class="max-w-md">
    <DrawerHeader>
      <DrawerTitle>Filtros</DrawerTitle>
      <DrawerDescription>Refine os resultados.</DrawerDescription>
    </DrawerHeader>
    <div class="px-4 text-sm text-muted-foreground">Conteúdo dos filtros…</div>
    <DrawerFooter>
      <Button>Aplicar</Button>
      <DrawerClose>
        {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
        preview: compRightPanel,
      },
    ]}
  />

  {#snippet compWithForm()}
    <div style="contain: layout">
      <Drawer defaultOpen={true}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar perfil</DrawerTitle>
            <DrawerDescription>Atualize seus dados pessoais.</DrawerDescription>
          </DrawerHeader>
          <form class="grid gap-3 px-4">
            <label class="grid gap-1 text-sm">
              <span class="font-medium">Nome</span>
              <input class="border rounded-md px-3 py-2" value="Maria Souza" />
            </label>
            <label class="grid gap-1 text-sm">
              <span class="font-medium">E-mail</span>
              <input type="email" class="border rounded-md px-3 py-2" value="maria@exemplo.com" />
            </label>
          </form>
          <DrawerFooter>
            <Button>Salvar alterações</Button>
            <DrawerClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  {/snippet}
  {#snippet compWithConfirmation()}
    <div style="contain: layout">
      <Drawer defaultOpen={true}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Remover item da lista?</DrawerTitle>
            <DrawerDescription>Você poderá adicioná-lo novamente a qualquer momento.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button variant="destructive">Remover</Button>
            <DrawerClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  {/snippet}
  {#snippet compWithScroll()}
    <div style="contain: layout">
      <Drawer defaultOpen={true}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Termos de uso</DrawerTitle>
            <DrawerDescription>Leia atentamente antes de aceitar.</DrawerDescription>
          </DrawerHeader>
          <div class="text-sm text-muted-foreground max-h-64 overflow-y-auto px-4 space-y-3">
            {#each Array.from({ length: 12 }) as _, i}
              <p>Parágrafo {i + 1}: termos longos para garantir scroll interno.</p>
            {/each}
          </div>
          <DrawerFooter>
            <Button>Aceitar termos</Button>
            <DrawerClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  {/snippet}
  {#snippet compRightPanel()}
    <div style="contain: layout">
      <Drawer direction="right" defaultOpen={true}>
        <DrawerContent class="max-w-md">
          <DrawerHeader>
            <DrawerTitle>Filtros</DrawerTitle>
            <DrawerDescription>Refine os resultados.</DrawerDescription>
          </DrawerHeader>
          <div class="px-4 text-sm text-muted-foreground">Conteúdo dos filtros…</div>
          <DrawerFooter>
            <Button>Aplicar</Button>
            <DrawerClose>
              {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('props.table.prop'),
      trigger: $tNavStore('common.userAction'),
      behavior: $tNavStore('common.expectedResult'),
    }}
    items={[
      { label: $tStore('states.items.closed'),     trigger: 'defaultOpen=false',                behavior: stripHtml($tStore('states.descriptions.closed'))     },
      { label: $tStore('states.items.open'),       trigger: 'defaultOpen=true / click trigger', behavior: stripHtml($tStore('states.descriptions.open'))       },
      { label: $tStore('states.items.controlled'), trigger: 'bind:open',                        behavior: stripHtml($tStore('states.descriptions.controlled')) },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        cols: propsTableCols,
        items: [
          { name: 'open',         type: $tStore('props.table.open.type'),         defaultValue: $tStore('props.table.open.default'),         required: $tStore('props.table.open.required'),         description: $tStore('props.table.open.description')         },
          { name: 'onOpenChange', type: $tStore('props.table.onOpenChange.type'), defaultValue: $tStore('props.table.onOpenChange.default'), required: $tStore('props.table.onOpenChange.required'), description: $tStore('props.table.onOpenChange.description') },
          { name: 'defaultOpen',  type: $tStore('props.table.defaultOpen.type'),  defaultValue: $tStore('props.table.defaultOpen.default'),  required: $tStore('props.table.defaultOpen.required'),  description: $tStore('props.table.defaultOpen.description')  },
          { name: 'direction',    type: $tStore('props.table.direction.type'),    defaultValue: $tStore('props.table.direction.default'),    required: $tStore('props.table.direction.required'),    description: $tStore('props.table.direction.description')    },
          { name: 'modal',        type: $tStore('props.table.modal.type'),        defaultValue: $tStore('props.table.modal.default'),        required: $tStore('props.table.modal.required'),        description: $tStore('props.table.modal.description')        },
          { name: 'dismissible',  type: $tStore('props.table.dismissible.type'),  defaultValue: $tStore('props.table.dismissible.default'),  required: $tStore('props.table.dismissible.required'),  description: $tStore('props.table.dismissible.description')  },
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
      { token: '--popover',            value: $tStore('tokens.table.background.class'), description: $tStore('tokens.table.background.part') },
      { token: '--popover-foreground', value: $tStore('tokens.table.foreground.class'), description: $tStore('tokens.table.foreground.part') },
      { token: '--border',             value: $tStore('tokens.table.border.class'),     description: $tStore('tokens.table.border.part')     },
      { token: 'overlay',              value: $tStore('tokens.table.overlay.class'),    description: $tStore('tokens.table.overlay.part')    },
      { token: '--muted',              value: $tStore('tokens.table.handle.class'),     description: $tStore('tokens.table.handle.part')     },
      { token: '--radius-xl',          value: $tStore('tokens.table.rounded.class'),    description: $tStore('tokens.table.rounded.part')    },
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
      { key: 'Tab / Shift+Tab', description: $tStore('accessibility.keyboard.tab')    },
      { key: 'Escape',          description: $tStore('accessibility.keyboard.escape') },
      { key: 'Enter / Space',   description: $tStore('accessibility.keyboard.enter')  },
      { key: 'Swipe',           description: $tStore('accessibility.keyboard.swipe')  },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.sheet.name'),       description: $tStore('related.items.sheet.description'),       path: '?path=/docs/ui-sheet--docs'       },
      { name: $tStore('related.items.dialog.name'),      description: $tStore('related.items.dialog.description'),      path: '?path=/docs/ui-dialog--docs'      },
      { name: $tStore('related.items.alertDialog.name'), description: $tStore('related.items.alertDialog.description'), path: '?path=/docs/ui-alertdialog--docs' },
      { name: $tStore('related.items.sidebar.name'),     description: $tStore('related.items.sidebar.description'),     path: '?path=/docs/ui-sidebar--docs'     },
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
      { event: 'drawer_open',  trigger: 'onOpenChange(true)',  payload: "{ component: 'drawer', location, label }" },
      { event: 'drawer_close', trigger: 'onOpenChange(false)', payload: "{ component: 'drawer', location, label }" },
      { event: '—',            trigger: stripHtml($tStore('analytics.description')), payload: '—' },
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
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
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
        { criterion: stripHtml($tStore('testes.accessibility.item1')), level: 'AA',     how: '—' },
        { criterion: stripHtml($tStore('testes.accessibility.item2')), level: '4.1.2',  how: '—' },
        { criterion: stripHtml($tStore('testes.accessibility.item3')), level: '4.1.2',  how: '—' },
        { criterion: stripHtml($tStore('testes.accessibility.item4')), level: '2.1.2',  how: '—' },
        { criterion: stripHtml($tStore('testes.accessibility.item5')), level: '2.1.1',  how: '—' },
        { criterion: stripHtml($tStore('testes.accessibility.item6')), level: '1.4.3',  how: '—' },
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
