<script lang="ts">
  import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
    PopoverClose,
  } from '@/components/ui/popover';
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
  import popoverTranslations from '@shared/content/popover/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(popoverTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'popover',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/overlay' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'popover',
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
    track('docs_section_viewed', { section_id: id, component_name: 'popover', locale: $locale });
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
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
} from "@/components/ui/popover";`;

  const codeImportUsage = `<Popover>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button {...props}>Abrir popover</Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent side="bottom" align="center">
    <PopoverHeader>
      <PopoverTitle>Configurações de exibição</PopoverTitle>
      <PopoverDescription>Ajuste a aparência do conteúdo da página.</PopoverDescription>
    </PopoverHeader>
    <!-- conteúdo interativo -->
  </PopoverContent>
</Popover>`;

  const codeDefault = `<Popover>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button {...props}>Abrir popover</Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent>
    <p class="text-sm">Conteúdo contextual livre.</p>
  </PopoverContent>
</Popover>`;

  const codeWithTitle = `<Popover>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button {...props}>Configurações</Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Configurações de exibição</PopoverTitle>
      <PopoverDescription>Ajuste a aparência do conteúdo da página.</PopoverDescription>
    </PopoverHeader>
    <div class="flex justify-end gap-2 pt-1">
      <PopoverClose>
        {#snippet child({ props })}
          <Button variant="outline" size="sm" {...props}>Cancelar</Button>
        {/snippet}
      </PopoverClose>
      <Button size="sm">Salvar</Button>
    </div>
  </PopoverContent>
</Popover>`;

  const codeForm = `<Popover>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button {...props}>Editar perfil</Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Editar perfil</PopoverTitle>
      <PopoverDescription>Atualize seu nome e e-mail.</PopoverDescription>
    </PopoverHeader>
    <form class="grid gap-3 pt-1" onsubmit={(e) => { e.preventDefault(); save(); }}>
      <Input name="name" />
      <Input name="email" type="email" />
      <Button type="submit" size="sm">Atualizar</Button>
    </form>
  </PopoverContent>
</Popover>`;

  const codeCustomizationTokens = `/* Override de tokens no escopo do componente */
[data-slot="popover-content"] {
  --popover: 220 14% 96%;
  --popover-foreground: 220 9% 10%;
}`;

  const interfaceCode = `// Popover (Root — bits-ui)
interface PopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children?: Snippet;
}

// PopoverContent
interface PopoverContentProps {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
  class?: string;
}

// PopoverTrigger / PopoverClose
interface TriggerProps { class?: string; child?: Snippet<[{ props: Record<string, any> }]> }`;

  const propsTableCols = $derived({
    prop: $tStore('props.table.prop'),
    type: $tStore('props.table.type'),
    default: $tStore('props.table.default'),
    required: $tStore('props.table.required'),
    description: $tStore('props.table.description'),
  });
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="popover">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add popover"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="flex flex-wrap items-center justify-center gap-6 w-full">
        <!-- Default -->
        <div class="flex flex-col items-center gap-2" style="contain: layout">
          <Popover>
            <PopoverTrigger>
              {#snippet child({ props })}
                <Button variant="outline" {...props}>{$tStore('demonstration.labels.trigger')}</Button>
              {/snippet}
            </PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>{$tStore('demonstration.labels.title')}</PopoverTitle>
                <PopoverDescription>{$tStore('demonstration.labels.description')}</PopoverDescription>
              </PopoverHeader>
              <div class="flex justify-end gap-2 pt-1">
                <PopoverClose>
                  {#snippet child({ props })}
                    <Button variant="outline" size="sm" {...props}>{$tStore('demonstration.labels.cancel')}</Button>
                  {/snippet}
                </PopoverClose>
                <Button size="sm">{$tStore('demonstration.labels.save')}</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <!-- Form -->
        <div class="flex flex-col items-center gap-2" style="contain: layout">
          <Popover>
            <PopoverTrigger>
              {#snippet child({ props })}
                <Button {...props}>{$tStore('demonstration.labels.form.trigger')}</Button>
              {/snippet}
            </PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>{$tStore('demonstration.labels.form.trigger')}</PopoverTitle>
                <PopoverDescription>{$tStore('demonstration.labels.description')}</PopoverDescription>
              </PopoverHeader>
              <form class="grid gap-3 pt-1" onsubmit={(e) => e.preventDefault()}>
                <label class="grid gap-1 text-sm">
                  <span>{$tStore('demonstration.labels.form.name')}</span>
                  <input
                    type="text"
                    class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm"
                    value="Maria Silva"
                  />
                </label>
                <label class="grid gap-1 text-sm">
                  <span>{$tStore('demonstration.labels.form.email')}</span>
                  <input
                    type="email"
                    class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm"
                    value="maria@exemplo.com"
                  />
                </label>
                <div class="flex justify-end pt-1">
                  <Button type="submit" size="sm">{$tStore('demonstration.labels.form.submit')}</Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>
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
      $tStore('anatomy.item5'),
      $tStore('anatomy.item6'),
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
    <Popover open>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Configurações</PopoverTitle>
          <PopoverDescription>Ajuste a aparência do conteúdo.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  {/snippet}
  {#snippet dontPair1()}
    <Popover open>
      <PopoverContent>
        <p class="text-sm">Conteúdo sem título — leitor de tela perde contexto.</p>
      </PopoverContent>
    </Popover>
  {/snippet}
  {#snippet doPair2()}
    <Button>Editar perfil</Button>
  {/snippet}
  {#snippet dontPair2()}
    <Button variant="outline">Clique aqui</Button>
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
      { name: $tStore('variants.items.default'),   description: stripHtml($tStore('variants.styles.default')),   code: codeDefault,   preview: variantDefault   },
      { name: $tStore('variants.items.withTitle'), description: stripHtml($tStore('variants.styles.withTitle')), code: codeWithTitle, preview: variantWithTitle },
      { name: $tStore('variants.items.form'),      description: stripHtml($tStore('variants.styles.form')),      code: codeForm,      preview: variantForm      },
    ]}
  />

  {#snippet variantDefault()}
    <Popover open>
      <PopoverContent>
        <p class="text-sm">Conteúdo contextual livre.</p>
      </PopoverContent>
    </Popover>
  {/snippet}
  {#snippet variantWithTitle()}
    <Popover open>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Configurações de exibição</PopoverTitle>
          <PopoverDescription>Ajuste a aparência do conteúdo da página.</PopoverDescription>
        </PopoverHeader>
        <div class="flex justify-end gap-2 pt-1">
          <PopoverClose>
            {#snippet child({ props })}
              <Button variant="outline" size="sm" {...props}>Cancelar</Button>
            {/snippet}
          </PopoverClose>
          <Button size="sm">Salvar</Button>
        </div>
      </PopoverContent>
    </Popover>
  {/snippet}
  <!-- ── Composições ────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="popover"
    items={[
      {
        name: $tStore('variants.compositions.editProfile.name'),
        description: $tStore('variants.compositions.editProfile.description'),
        useWhen: $tStore('variants.compositions.editProfile.use'),
        code: `<Popover>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Editar perfil</Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Dados do perfil</PopoverTitle>
      <PopoverDescription>As mudanças são salvas ao confirmar.</PopoverDescription>
    </PopoverHeader>
    <form class="space-y-3" onsubmit={(e) => e.preventDefault()}>
      <label class="grid gap-1 text-sm">
        <span>Nome</span>
        <input type="text" value="Joana Silva" />
      </label>
      <label class="grid gap-1 text-sm">
        <span>Email</span>
        <input type="email" value="joana@example.com" />
      </label>
      <Button type="submit" size="sm">Atualizar</Button>
    </form>
  </PopoverContent>
</Popover>`,
        preview: compEditProfile,
      },
      {
        name: $tStore('variants.compositions.tableFilter.name'),
        description: $tStore('variants.compositions.tableFilter.description'),
        useWhen: $tStore('variants.compositions.tableFilter.use'),
        code: `<Popover>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Filtros</Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Filtrar por status</PopoverTitle>
    </PopoverHeader>
    <div class="space-y-2">
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" checked /> Ativo
      </label>
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" /> Pendente
      </label>
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" /> Arquivado
      </label>
    </div>
    <div class="flex justify-end gap-2 pt-2">
      <Button variant="ghost" size="sm">Limpar</Button>
      <Button size="sm">Aplicar</Button>
    </div>
  </PopoverContent>
</Popover>`,
        preview: compTableFilter,
      },
      {
        name: $tStore('variants.compositions.colorPicker.name'),
        description: $tStore('variants.compositions.colorPicker.description'),
        useWhen: $tStore('variants.compositions.colorPicker.use'),
        code: `<Popover>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Cor</Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Selecionar cor</PopoverTitle>
    </PopoverHeader>
    <div class="grid grid-cols-6 gap-2">
      {#each swatches as s}
        <button type="button" aria-label={s.name} class={\`h-6 w-6 rounded-full ring-1 ring-foreground/10 \${s.bg}\`}></button>
      {/each}
    </div>
  </PopoverContent>
</Popover>`,
        preview: compColorPicker,
      },
      {
        name: $tStore('variants.compositions.quickSettings.name'),
        description: $tStore('variants.compositions.quickSettings.description'),
        useWhen: $tStore('variants.compositions.quickSettings.use'),
        code: `<Popover>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Configurações</Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Preferências rápidas</PopoverTitle>
    </PopoverHeader>
    <div class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <label for="cfg-notifs">Notificações</label>
        <input id="cfg-notifs" type="checkbox" checked />
      </div>
      <div class="flex items-center justify-between gap-3">
        <label for="cfg-dark">Modo escuro</label>
        <input id="cfg-dark" type="checkbox" />
      </div>
      <div class="flex items-center justify-between gap-3">
        <label for="cfg-compact">Modo compacto</label>
        <input id="cfg-compact" type="checkbox" />
      </div>
    </div>
  </PopoverContent>
</Popover>`,
        preview: compQuickSettings,
      },
    ]}
  />

  {#snippet compEditProfile()}
    <Popover open>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Dados do perfil</PopoverTitle>
          <PopoverDescription>As mudanças são salvas ao confirmar.</PopoverDescription>
        </PopoverHeader>
        <form class="space-y-3 pt-1" onsubmit={(e) => e.preventDefault()}>
          <label class="grid gap-1 text-sm">
            <span>Nome</span>
            <input
              type="text"
              class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm"
              value="Joana Silva"
            />
          </label>
          <label class="grid gap-1 text-sm">
            <span>Email</span>
            <input
              type="email"
              class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm"
              value="joana@example.com"
            />
          </label>
          <div class="flex justify-end">
            <Button type="submit" size="sm">Atualizar</Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  {/snippet}

  {#snippet compTableFilter()}
    <Popover open>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Filtrar por status</PopoverTitle>
        </PopoverHeader>
        <div class="space-y-2 pt-1">
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" checked class="h-4 w-4" />
            <span>Ativo</span>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" class="h-4 w-4" />
            <span>Pendente</span>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" class="h-4 w-4" />
            <span>Arquivado</span>
          </label>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm">Limpar</Button>
          <Button size="sm">Aplicar</Button>
        </div>
      </PopoverContent>
    </Popover>
  {/snippet}

  {#snippet compColorPicker()}
    <Popover open>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Selecionar cor</PopoverTitle>
        </PopoverHeader>
        <div class="grid grid-cols-6 gap-2 pt-1">
          {#each [
            { name: 'Vermelho', bg: 'bg-red-500' },
            { name: 'Laranja',  bg: 'bg-orange-500' },
            { name: 'Amarelo',  bg: 'bg-yellow-500' },
            { name: 'Verde',    bg: 'bg-green-500' },
            { name: 'Azul',     bg: 'bg-blue-500' },
            { name: 'Roxo',     bg: 'bg-purple-500' },
          ] as s}
            <button
              type="button"
              aria-label={s.name}
              class={`h-6 w-6 rounded-full ring-1 ring-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring ${s.bg}`}
            ></button>
          {/each}
        </div>
      </PopoverContent>
    </Popover>
  {/snippet}

  {#snippet compQuickSettings()}
    <Popover open>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Preferências rápidas</PopoverTitle>
        </PopoverHeader>
        <div class="space-y-3 pt-1">
          {#each [
            { id: 'cfg-notifs-sv',  label: 'Notificações',  checked: true  },
            { id: 'cfg-dark-sv',    label: 'Modo escuro',   checked: false },
            { id: 'cfg-compact-sv', label: 'Modo compacto', checked: false },
          ] as t}
            <div class="flex items-center justify-between gap-3">
              <label for={t.id} class="text-sm">{t.label}</label>
              <input id={t.id} type="checkbox" checked={t.checked} class="h-4 w-4" />
            </div>
          {/each}
        </div>
      </PopoverContent>
    </Popover>
  {/snippet}

  {#snippet variantForm()}
    <Popover open>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Editar perfil</PopoverTitle>
          <PopoverDescription>Atualize seu nome e e-mail.</PopoverDescription>
        </PopoverHeader>
        <form class="grid gap-2 pt-1">
          <input
            type="text"
            class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm"
            value="Maria Silva"
          />
          <div class="flex justify-end pt-1">
            <Button size="sm">Atualizar</Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
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
      { label: $tStore('states.items.closed'),        trigger: 'defaultOpen={false}',         behavior: stripHtml($tStore('states.descriptions.closed'))        },
      { label: $tStore('states.items.open'),          trigger: 'defaultOpen={true} / open',   behavior: stripHtml($tStore('states.descriptions.open'))          },
      { label: $tStore('states.items.transitioning'), trigger: 'data-open / data-closed',     behavior: stripHtml($tStore('states.descriptions.transitioning')) },
      { label: $tStore('states.items.focused'),       trigger: 'Tab dentro do Content',       behavior: stripHtml($tStore('states.descriptions.focused'))       },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        cols: propsTableCols,
        items: [
          { name: 'open',         type: $tStore('props.table.open.type'),         defaultValue: $tStore('props.table.open.default'),         required: $tStore('props.table.open.required'),         description: stripHtml($tStore('props.table.open.description'))         },
          { name: 'defaultOpen',  type: $tStore('props.table.defaultOpen.type'),  defaultValue: $tStore('props.table.defaultOpen.default'),  required: $tStore('props.table.defaultOpen.required'),  description: stripHtml($tStore('props.table.defaultOpen.description'))  },
          { name: 'onOpenChange', type: $tStore('props.table.onOpenChange.type'), defaultValue: $tStore('props.table.onOpenChange.default'), required: $tStore('props.table.onOpenChange.required'), description: stripHtml($tStore('props.table.onOpenChange.description')) },
          { name: 'modal',        type: $tStore('props.table.modal.type'),        defaultValue: $tStore('props.table.modal.default'),        required: $tStore('props.table.modal.required'),        description: stripHtml($tStore('props.table.modal.description'))        },
          { name: 'side',         type: $tStore('props.table.side.type'),         defaultValue: $tStore('props.table.side.default'),         required: $tStore('props.table.side.required'),         description: stripHtml($tStore('props.table.side.description'))         },
          { name: 'align',        type: $tStore('props.table.align.type'),        defaultValue: $tStore('props.table.align.default'),        required: $tStore('props.table.align.required'),        description: stripHtml($tStore('props.table.align.description'))        },
          { name: 'sideOffset',   type: $tStore('props.table.sideOffset.type'),   defaultValue: $tStore('props.table.sideOffset.default'),   required: $tStore('props.table.sideOffset.required'),   description: stripHtml($tStore('props.table.sideOffset.description'))   },
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
      { token: '--popover',            value: $tStore('tokens.table.popover.class'),           description: $tStore('tokens.table.popover.part')           },
      { token: '--popover-foreground', value: $tStore('tokens.table.popoverForeground.class'), description: $tStore('tokens.table.popoverForeground.part') },
      { token: '--muted-foreground',   value: $tStore('tokens.table.mutedForeground.class'),   description: $tStore('tokens.table.mutedForeground.part')   },
      { token: '--foreground/10',      value: $tStore('tokens.table.border.class'),            description: $tStore('tokens.table.border.part')            },
      { token: 'shadow',               value: $tStore('tokens.table.shadow.class'),            description: $tStore('tokens.table.shadow.part')            },
      { token: '--ring',               value: $tStore('tokens.table.ring.class'),              description: $tStore('tokens.table.ring.part')              },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeCustomizationTokens}
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
      { key: 'Tab',       description: stripHtml($tStore('accessibility.keyboard.tab'))      },
      { key: 'Shift+Tab', description: stripHtml($tStore('accessibility.keyboard.shiftTab')) },
      { key: 'Escape',    description: stripHtml($tStore('accessibility.keyboard.escape'))   },
      { key: 'Enter',     description: stripHtml($tStore('accessibility.keyboard.enter'))    },
      { key: 'Space',     description: stripHtml($tStore('accessibility.keyboard.space'))    },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.tooltip.name'),      description: $tStore('related.items.tooltip.description'),      path: '?path=/docs/ui-tooltip--docs'      },
      { name: $tStore('related.items.dropdownMenu.name'), description: $tStore('related.items.dropdownMenu.description'), path: '?path=/docs/ui-dropdownmenu--docs' },
      { name: $tStore('related.items.dialog.name'),       description: $tStore('related.items.dialog.description'),       path: '?path=/docs/ui-dialog--docs'       },
      { name: $tStore('related.items.hoverCard.name'),    description: $tStore('related.items.hoverCard.description'),    path: '?path=/docs/ui-hovercard--docs'    },
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
      { event: 'popover_open',  trigger: $tStore('analytics.table.popover_open.trigger'),  payload: $tStore('analytics.table.popover_open.payload')  },
      { event: 'popover_close', trigger: $tStore('analytics.table.popover_close.trigger'), payload: $tStore('analytics.table.popover_close.payload') },
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
        { criterion: stripHtml($tStore('testes.accessibility.item1')), level: 'AA',     how: 'axe-core'         },
        { criterion: stripHtml($tStore('testes.accessibility.item2')), level: '1.4.3',  how: 'Contrast checker' },
        { criterion: stripHtml($tStore('testes.accessibility.item3')), level: '2.4.7',  how: 'Keyboard test'    },
        { criterion: stripHtml($tStore('testes.accessibility.item4')), level: '4.1.2',  how: 'DevTools a11y'    },
        { criterion: stripHtml($tStore('testes.accessibility.item5')), level: '4.1.2',  how: 'DevTools a11y'    },
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

<!-- sanitizeHtml available para uso futuro em {@html} dinâmico -->
{#if false}
  {@html sanitizeHtml('')}
{/if}
