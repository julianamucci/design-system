<script lang="ts">
  import { untrack } from 'svelte';
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
  import popoverTranslations from '@shared/content/popover/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  // A cor sai de TOKEN do tema, nunca de hexadecimal em style inline: trocar de
  // marca reescreve a paleta sem tocar no exemplo, e a amostra continua legível
  // no tema escuro. Mesma paleta e mesmas classes das stories. A lista guarda a
  // CHAVE, não o rótulo: o nome acessível sai de
  // `variants.compositions.colorPicker.<chave>`, então a prévia fala o idioma da
  // página em vez de mostrar português em `en` e `es`.
  const SWATCH_CLASSES = 'nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring';
  const SWATCH_COLORS = [
    { key: 'primary',     className: 'nds-bg-primary'     },
    { key: 'secondary',   className: 'nds-bg-secondary'   },
    { key: 'success',     className: 'nds-bg-success'     },
    { key: 'warning',     className: 'nds-bg-warning'     },
    { key: 'info',        className: 'nds-bg-info'        },
    { key: 'destructive', className: 'nds-bg-destructive' },
  ];

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(popoverTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = $derived(
    Object.values(
      (popoverTranslations as unknown as Record<
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
      componentSlug: 'popover',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
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

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'popover', locale: $locale });
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
  <PopoverContent aria-label="Informações adicionais">
    <p class="nds-text-body">Conteúdo contextual livre.</p>
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
    </PopoverHeader>
    <form class="nds-stack" data-spacing="sm" onsubmit={(e) => e.preventDefault()}>
      <div class="nds-stack" data-spacing="xs">
        <Label for="perfil-nome">Nome</Label>
        <Input id="perfil-nome" value="Maria Silva" />
      </div>
      <div class="nds-stack" data-spacing="xs">
        <Label for="perfil-email">Email</Label>
        <Input id="perfil-email" type="email" value="maria@example.com" />
      </div>
      <div class="nds-cluster" data-spacing="sm" data-justify="end">
        <PopoverClose>
          {#snippet child({ props })}
            <Button variant="ghost" size="sm" {...props}>Cancelar</Button>
          {/snippet}
        </PopoverClose>
        <Button type="submit" size="sm">Atualizar</Button>
      </div>
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
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    <div class="nds-cluster" data-spacing="sm" data-justify="center">
      <Popover onOpenChange={(o: boolean) => (o
        ? track('popover_open', { component: 'popover', trigger_label: 'demo', location: 'docs_demo' })
        : track('popover_close', { component: 'popover', location: 'docs_demo' }))}>
        <PopoverTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('demonstration.labels.trigger')}</Button>
          {/snippet}
        </PopoverTrigger>
        <PopoverContent align="center">
          <PopoverHeader>
            <PopoverTitle>{$tStore('demonstration.labels.title')}</PopoverTitle>
            <PopoverDescription>{$tStore('demonstration.labels.description')}</PopoverDescription>
          </PopoverHeader>
          <div class="nds-cluster" data-spacing="sm" data-justify="end">
            <PopoverClose>
              {#snippet child({ props })}
                <Button variant="ghost" size="sm" {...props}>{$tStore('demonstration.labels.cancel')}</Button>
              {/snippet}
            </PopoverClose>
            <Button size="sm">{$tStore('demonstration.labels.save')}</Button>
          </div>
        </PopoverContent>
      </Popover>
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
    <Popover onOpenChange={(o: boolean) => (o
      ? track('popover_open', { component: 'popover', trigger_label: 'par1-do', location: 'docs_do_dont' })
      : track('popover_close', { component: 'popover', location: 'docs_do_dont' }))}>
      <PopoverTrigger>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>{$tStore('demonstration.labels.trigger')}</Button>
        {/snippet}
      </PopoverTrigger>
      <PopoverContent align="center">
        <PopoverHeader>
          <PopoverTitle>{$tStore('demonstration.labels.title')}</PopoverTitle>
          <PopoverDescription>{$tStore('demonstration.labels.description')}</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  {/snippet}
  {#snippet dontPair1()}
    <!-- Sem título: o painel cai no nome de reserva herdado do gatilho, que
         mantém o axe verde mas devolve ao leitor o rótulo do botão em vez do
         assunto do painel — exatamente o que a legenda critica. -->
    <Popover onOpenChange={(o: boolean) => (o
      ? track('popover_open', { component: 'popover', trigger_label: 'par1-dont', location: 'docs_do_dont' })
      : track('popover_close', { component: 'popover', location: 'docs_do_dont' }))}>
      <PopoverTrigger>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>{$tStore('demonstration.labels.trigger')}</Button>
        {/snippet}
      </PopoverTrigger>
      <PopoverContent align="center">
        <p class="nds-text-body">{$tStore('doDont.pair1.dontBody')}</p>
      </PopoverContent>
    </Popover>
  {/snippet}
  {#snippet doPair2()}
    <Popover onOpenChange={(o: boolean) => (o
      ? track('popover_open', { component: 'popover', trigger_label: 'par2-do', location: 'docs_do_dont' })
      : track('popover_close', { component: 'popover', location: 'docs_do_dont' }))}>
      <PopoverTrigger>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>{$tStore('demonstration.labels.form.trigger')}</Button>
        {/snippet}
      </PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>{$tStore('demonstration.labels.form.trigger')}</PopoverTitle>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  {/snippet}
  {#snippet dontPair2()}
    <!-- Painel idêntico ao do par correto: o que reprova aqui é só o rótulo do
         gatilho, que não diz o que o clique faz. -->
    <Popover onOpenChange={(o: boolean) => (o
      ? track('popover_open', { component: 'popover', trigger_label: 'par2-dont', location: 'docs_do_dont' })
      : track('popover_close', { component: 'popover', location: 'docs_do_dont' }))}>
      <PopoverTrigger>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>{$tStore('doDont.pair2.dontTrigger')}</Button>
        {/snippet}
      </PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>{$tStore('demonstration.labels.form.trigger')}</PopoverTitle>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
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
      { trackId: 'default', name: $tStore('variants.items.default'),   description: stripHtml($tStore('variants.styles.default')),   code: codeDefault,   preview: variantDefault   },
      { trackId: 'withTitle', name: $tStore('variants.items.withTitle'), description: stripHtml($tStore('variants.styles.withTitle')), code: codeWithTitle, preview: variantWithTitle },
      { trackId: 'form', name: $tStore('variants.items.form'),      description: stripHtml($tStore('variants.styles.form')),      code: codeForm,      preview: variantForm      },
    ]}
  />

  {#snippet variantDefault()}
    <Popover onOpenChange={(o: boolean) => (o
      ? track('popover_open', { component: 'popover', trigger_label: 'default', location: 'docs_variantes' })
      : track('popover_close', { component: 'popover', location: 'docs_variantes' }))}>
      <PopoverTrigger>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>{$tStore('demonstration.labels.trigger')}</Button>
        {/snippet}
      </PopoverTrigger>
      <!-- Painel de conteúdo LIVRE: sem título, nomeado por `aria-label`. O
           efeito do PopoverContent só age quando ninguém nomeou, então o
           rótulo declarado aqui vence a herança do texto do gatilho. -->
      <PopoverContent aria-label={$tStore('variants.panelLabels.default')}>
        <p class="nds-text-body">{$tStore('demonstration.labels.description')}</p>
      </PopoverContent>
    </Popover>
  {/snippet}
  {#snippet variantWithTitle()}
    <Popover onOpenChange={(o: boolean) => (o
      ? track('popover_open', { component: 'popover', trigger_label: 'with-title', location: 'docs_variantes' })
      : track('popover_close', { component: 'popover', location: 'docs_variantes' }))}>
      <PopoverTrigger>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>{$tStore('demonstration.labels.title')}</Button>
        {/snippet}
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>{$tStore('demonstration.labels.title')}</PopoverTitle>
          <PopoverDescription>{$tStore('demonstration.labels.description')}</PopoverDescription>
        </PopoverHeader>
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
        trackId: 'editProfile',
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
    <form class="nds-stack" data-spacing="sm" onsubmit={(e) => e.preventDefault()}>
      <div class="nds-stack" data-spacing="xs">
        <Label for="perfil-nome">Nome</Label>
        <Input id="perfil-nome" value="Joana Silva" />
      </div>
      <div class="nds-stack" data-spacing="xs">
        <Label for="perfil-email">Email</Label>
        <Input id="perfil-email" type="email" value="joana@example.com" />
      </div>
      <Button type="submit" size="sm">Atualizar</Button>
    </form>
  </PopoverContent>
</Popover>`,
        preview: compEditProfile,
      },
      {
        trackId: 'tableFilter',
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
    <div class="nds-stack" data-spacing="sm">
      <label class="nds-cluster nds-text-body" data-spacing="sm">
        <input type="checkbox" checked /> Ativo
      </label>
      <label class="nds-cluster nds-text-body" data-spacing="sm">
        <input type="checkbox" /> Pendente
      </label>
      <label class="nds-cluster nds-text-body" data-spacing="sm">
        <input type="checkbox" /> Arquivado
      </label>
    </div>
 <div class="nds-cluster nds-pt-2" data-spacing="sm" data-justify="end">
      <Button variant="ghost" size="sm">Limpar</Button>
      <Button size="sm">Aplicar</Button>
    </div>
  </PopoverContent>
</Popover>`,
        preview: compTableFilter,
      },
      {
        trackId: 'colorPicker',
        name: $tStore('variants.compositions.colorPicker.name'),
        description: $tStore('variants.compositions.colorPicker.description'),
        useWhen: $tStore('variants.compositions.colorPicker.use'),
        code: `<Popover>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Escolher cor da etiqueta</Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Cor da etiqueta</PopoverTitle>
    </PopoverHeader>
    <div class="nds-grid" data-cols="6" data-spacing="xs">
      {#each swatches as s}
        <button type="button" aria-label={s.name} class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring {s.className}"></button>
      {/each}
    </div>
  </PopoverContent>
</Popover>`,
        preview: compColorPicker,
      },
      {
        trackId: 'quickSettings',
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
    <div class="nds-stack" data-spacing="sm">
      <div class="nds-cluster" data-spacing="sm" data-justify="between">
        <label for="cfg-notifs">Notificações</label>
        <input id="cfg-notifs" type="checkbox" checked />
      </div>
      <div class="nds-cluster" data-spacing="sm" data-justify="between">
        <label for="cfg-dark">Modo escuro</label>
        <input id="cfg-dark" type="checkbox" />
      </div>
      <div class="nds-cluster" data-spacing="sm" data-justify="between">
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
    <Popover onOpenChange={(o: boolean) => (o
      ? track('popover_open', { component: 'popover', trigger_label: 'edit-profile', location: 'docs_composicoes' })
      : track('popover_close', { component: 'popover', location: 'docs_composicoes' }))}>
      <PopoverTrigger>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>{$tStore('demonstration.labels.form.trigger')}</Button>
        {/snippet}
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>{$tStore('variants.compositions.editProfile.name')}</PopoverTitle>
        </PopoverHeader>
        <form class="nds-stack nds-pt-1" data-spacing="sm" onsubmit={(e) => e.preventDefault()}>
          <div class="nds-stack" data-spacing="xs">
            <Label for="popover-comp-nome">{$tStore('demonstration.labels.form.name')}</Label>
            <Input id="popover-comp-nome" value="Joana Silva" />
          </div>
          <div class="nds-stack" data-spacing="xs">
            <Label for="popover-comp-email">{$tStore('demonstration.labels.form.email')}</Label>
            <Input id="popover-comp-email" type="email" value="joana@example.com" />
          </div>
          <div class="nds-cluster" data-justify="end">
            <Button type="submit" size="sm">{$tStore('demonstration.labels.form.submit')}</Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  {/snippet}

  {#snippet compTableFilter()}
    <Popover onOpenChange={(o: boolean) => (o
      ? track('popover_open', { component: 'popover', trigger_label: 'table-filter', location: 'docs_composicoes' })
      : track('popover_close', { component: 'popover', location: 'docs_composicoes' }))}>
      <PopoverTrigger>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>{$tStore('variants.compositions.tableFilter.trigger')}</Button>
        {/snippet}
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>{$tStore('variants.compositions.tableFilter.title')}</PopoverTitle>
        </PopoverHeader>
 <div class="nds-stack nds-pt-1" data-spacing="sm">
          <label class="nds-cluster nds-text-body" data-spacing="sm">
            <input type="checkbox" checked class="nds-size-4" />
            <span>{$tStore('variants.compositions.tableFilter.active')}</span>
          </label>
          <label class="nds-cluster nds-text-body" data-spacing="sm">
            <input type="checkbox" class="nds-size-4" />
            <span>{$tStore('variants.compositions.tableFilter.pending')}</span>
          </label>
          <label class="nds-cluster nds-text-body" data-spacing="sm">
            <input type="checkbox" class="nds-size-4" />
            <span>{$tStore('variants.compositions.tableFilter.archived')}</span>
          </label>
        </div>
 <div class="nds-cluster nds-pt-2" data-spacing="sm" data-justify="end">
          <Button variant="ghost" size="sm">{$tStore('variants.compositions.tableFilter.clear')}</Button>
          <Button size="sm">{$tStore('variants.compositions.tableFilter.apply')}</Button>
        </div>
      </PopoverContent>
    </Popover>
  {/snippet}

  {#snippet compColorPicker()}
    <Popover onOpenChange={(o: boolean) => (o
      ? track('popover_open', { component: 'popover', trigger_label: 'color-picker', location: 'docs_composicoes' })
      : track('popover_close', { component: 'popover', location: 'docs_composicoes' }))}>
      <PopoverTrigger>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>{$tStore('variants.compositions.colorPicker.trigger')}</Button>
        {/snippet}
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>{$tStore('variants.compositions.colorPicker.title')}</PopoverTitle>
        </PopoverHeader>
 <div class="nds-grid nds-pt-1" data-cols="6" data-spacing="xs">
          {#each SWATCH_COLORS as s (s.key)}
            <button
              type="button"
              aria-label={$tStore(`variants.compositions.colorPicker.${s.key}`)}
              class="{SWATCH_CLASSES} {s.className}"
            ></button>
          {/each}
        </div>
      </PopoverContent>
    </Popover>
  {/snippet}

  {#snippet compQuickSettings()}
    <Popover onOpenChange={(o: boolean) => (o
      ? track('popover_open', { component: 'popover', trigger_label: 'quick-settings', location: 'docs_composicoes' })
      : track('popover_close', { component: 'popover', location: 'docs_composicoes' }))}>
      <PopoverTrigger>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>{$tStore('variants.compositions.quickSettings.trigger')}</Button>
        {/snippet}
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>{$tStore('variants.compositions.quickSettings.title')}</PopoverTitle>
        </PopoverHeader>
 <div class="nds-stack nds-pt-1" data-spacing="sm">
          {#each [
            { id: 'cfg-notifs-sv',  key: 'notifications', checked: true  },
            { id: 'cfg-dark-sv',    key: 'darkMode',      checked: false },
            { id: 'cfg-compact-sv', key: 'compactMode',   checked: false },
          ] as pref (pref.id)}
            <div class="nds-cluster" data-spacing="sm" data-justify="between">
              <label for={pref.id} class="nds-text-body">{$tStore(`variants.compositions.quickSettings.${pref.key}`)}</label>
              <input id={pref.id} type="checkbox" checked={pref.checked} class="nds-size-4" />
            </div>
          {/each}
        </div>
      </PopoverContent>
    </Popover>
  {/snippet}

  {#snippet variantForm()}
    <Popover onOpenChange={(o: boolean) => (o
      ? track('popover_open', { component: 'popover', trigger_label: 'form', location: 'docs_variantes' })
      : track('popover_close', { component: 'popover', location: 'docs_variantes' }))}>
      <PopoverTrigger>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>{$tStore('demonstration.labels.form.trigger')}</Button>
        {/snippet}
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>{$tStore('demonstration.labels.form.trigger')}</PopoverTitle>
        </PopoverHeader>
        <form class="nds-stack nds-pt-1" data-spacing="sm" onsubmit={(e: SubmitEvent) => e.preventDefault()}>
          <div class="nds-stack" data-spacing="xs">
            <Label for="popover-var-nome">{$tStore('demonstration.labels.form.name')}</Label>
            <Input id="popover-var-nome" value="Maria Silva" />
          </div>
          <div class="nds-stack" data-spacing="xs">
            <Label for="popover-var-email">{$tStore('demonstration.labels.form.email')}</Label>
            <Input id="popover-var-email" type="email" value="maria@example.com" />
          </div>
          <div class="nds-cluster nds-pt-1" data-spacing="sm" data-justify="end">
            <PopoverClose>
              {#snippet child({ props })}
                <Button variant="ghost" size="sm" {...props}>{$tStore('demonstration.labels.cancel')}</Button>
              {/snippet}
            </PopoverClose>
            <Button type="submit" size="sm">{$tStore('demonstration.labels.form.submit')}</Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
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
      { label: $tStore('states.closed.label'),        trigger: toPlainText($tStore('states.closed.trigger')),        behavior: toPlainText($tStore('states.closed.behavior')) },
      { label: $tStore('states.open.label'),          trigger: toPlainText($tStore('states.open.trigger')),          behavior: toPlainText($tStore('states.open.behavior')) },
      { label: $tStore('states.transitioning.label'), trigger: toPlainText($tStore('states.transitioning.trigger')), behavior: toPlainText($tStore('states.transitioning.behavior')) },
      { label: $tStore('states.focused.label'),       trigger: toPlainText($tStore('states.focused.trigger')),       behavior: toPlainText($tStore('states.focused.behavior')) },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        cols: propsTableCols,
        items: [
          { name: 'open',         type: $tStore('props.table.open.type'),         defaultValue: $tStore('props.table.open.default'),         required: $tStore('props.table.open.required'),         description: toPlainText($tStore('props.table.open.description'))         },
          { name: 'defaultOpen',  type: $tStore('props.table.defaultOpen.type'),  defaultValue: $tStore('props.table.defaultOpen.default'),  required: $tStore('props.table.defaultOpen.required'),  description: toPlainText($tStore('props.table.defaultOpen.description'))  },
          { name: 'onOpenChange', type: $tStore('props.table.onOpenChange.type'), defaultValue: $tStore('props.table.onOpenChange.default'), required: $tStore('props.table.onOpenChange.required'), description: toPlainText($tStore('props.table.onOpenChange.description')) },
          { name: 'modal',        type: $tStore('props.table.modal.type'),        defaultValue: $tStore('props.table.modal.default'),        required: $tStore('props.table.modal.required'),        description: toPlainText($tStore('props.table.modal.description'))        },
          { name: 'side',         type: $tStore('props.table.side.type'),         defaultValue: $tStore('props.table.side.default'),         required: $tStore('props.table.side.required'),         description: toPlainText($tStore('props.table.side.description'))         },
          { name: 'align',        type: $tStore('props.table.align.type'),        defaultValue: $tStore('props.table.align.default'),        required: $tStore('props.table.align.required'),        description: toPlainText($tStore('props.table.align.description'))        },
          { name: 'sideOffset',   type: $tStore('props.table.sideOffset.type'),   defaultValue: $tStore('props.table.sideOffset.default'),   required: $tStore('props.table.sideOffset.required'),   description: toPlainText($tStore('props.table.sideOffset.description'))   },
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
      { token: '--border',             value: $tStore('tokens.table.border.class'),            description: $tStore('tokens.table.border.part')            },
      { token: '--elevation-md',       value: $tStore('tokens.table.shadow.class'),            description: $tStore('tokens.table.shadow.part')            },
      { token: '--ring',               value: $tStore('tokens.table.ring.class'),              description: $tStore('tokens.table.ring.part')              },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeCustomizationTokens}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    screenReaderTitle={$tNavStore('common.screenReader')}
    screenReaderItems={screenReaderItems}
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
      { key: 'Tab',       description: toPlainText($tStore('accessibility.keyboard.tab'))      },
      { key: 'Shift+Tab', description: toPlainText($tStore('accessibility.keyboard.shiftTab')) },
      { key: 'Escape',    description: toPlainText($tStore('accessibility.keyboard.escape'))   },
      { key: 'Enter',     description: toPlainText($tStore('accessibility.keyboard.enter'))    },
      { key: 'Space',     description: toPlainText($tStore('accessibility.keyboard.space'))    },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.tooltip.name'),      description: $tStore('related.items.tooltip.description'),      path: '?path=/docs/components-overlay-tooltip--docs'      },
      { name: $tStore('related.items.dropdownMenu.name'), description: $tStore('related.items.dropdownMenu.description'), path: '?path=/docs/components-overlay-dropdownmenu--docs' },
      { name: $tStore('related.items.dialog.name'),       description: $tStore('related.items.dialog.description'),       path: '?path=/docs/components-overlay-dialog--docs'       },
      { name: $tStore('related.items.hoverCard.name'),    description: $tStore('related.items.hoverCard.description'),    path: '?path=/docs/components-overlay-hovercard--docs'    },
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
      trigger: toPlainText($tStore('analytics.table.trigger')),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: 'popover_open',  trigger: toPlainText($tStore('analytics.table.popover_open.trigger')),  payload: $tStore('analytics.table.popover_open.payload')  },
      { event: 'popover_close', trigger: toPlainText($tStore('analytics.table.popover_close.trigger')), payload: $tStore('analytics.table.popover_close.payload') },
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
        action: toPlainText($tStore(`testes.functional.item${i}.action`)),
        result: toPlainText($tStore(`testes.functional.item${i}.result`)),
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
        { criterion: toPlainText($tStore('testes.accessibility.item1')), level: 'AA',     how: 'axe-core'         },
        { criterion: toPlainText($tStore('testes.accessibility.item2')), level: '1.4.3',  how: 'Contrast checker' },
        { criterion: toPlainText($tStore('testes.accessibility.item3')), level: '2.4.7',  how: 'Keyboard test'    },
        { criterion: toPlainText($tStore('testes.accessibility.item4')), level: '4.1.2',  how: 'DevTools a11y'    },
        { criterion: toPlainText($tStore('testes.accessibility.item5')), level: '4.1.2',  how: 'DevTools a11y'    },
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
