<script lang="ts">
  import * as ContextMenu from '@/components/ui/context-menu';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.svelte';
  import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.svelte';
  import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.svelte';
  import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.svelte';
  import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.svelte';
  import DocsImport        from '@/components/docs/shared/sections/DocsImport.svelte';
  import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.svelte';
  import DocsCompositions  from '@/components/docs/shared/sections/DocsCompositions.svelte';
  import DocsStates        from '@/components/docs/shared/sections/DocsStates.svelte';
  import DocsProps         from '@/components/docs/shared/sections/DocsProps.svelte';
  import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.svelte';
  import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.svelte';
  import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.svelte';
  import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.svelte';
  import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.svelte';
  import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.svelte';

  import uiTranslations from '@/i18n/ui.json';
  import componentTranslations from '@shared/content/context-menu/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(componentTranslations);

  // ─── SEO + Analytics ────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'context-menu',
    });
    track('docs_page_view', {
      component_name: 'context-menu',
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
    track('docs_section_viewed', { section_id: id, component_name: 'context-menu', locale: $locale });
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

  // ─── State para demos interativos ────────────────────────────────────────────

  let checkboxShowBookmarks = $state(true);
  let checkboxShowFullUrls = $state(false);
  let radioValue = $state('pedro');
  let variantCheckboxChecked = $state(false);
  let variantRadioValue = $state('system');

  // Composições — estado
  let compShowGrid = $state(true);
  let compShowRulers = $state(false);
  let compZoom = $state('100');

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import * as ContextMenu from "@/components/ui/context-menu";`;

  const codeImportWithSub = `import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";`;

  const codeImportWithCheckbox = `import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
} from "@/components/ui/context-menu";`;

  const codeDefault = `<ContextMenu.Root>
  <ContextMenu.Trigger class="...">
    Clique com o botão direito aqui
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item>
      Editar
      <ContextMenu.Shortcut>⌘E</ContextMenu.Shortcut>
    </ContextMenu.Item>
    <ContextMenu.Item>Duplicar</ContextMenu.Item>
    <ContextMenu.Separator />
    <ContextMenu.Item variant="destructive">
      Excluir
      <ContextMenu.Shortcut>⌫</ContextMenu.Shortcut>
    </ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu.Root>`;

  const codeDestructive = `<ContextMenu.Item variant="destructive">
  Excluir
  <ContextMenu.Shortcut>⌫</ContextMenu.Shortcut>
</ContextMenu.Item>`;

  const codeVariantCheckbox = `<script lang="ts">
  import * as ContextMenu from "@/components/ui/context-menu";
  let checked = $state(false);
<\/script>
<ContextMenu.Root>
  <ContextMenu.Trigger class="...">Right-click aqui</ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.CheckboxItem bind:checked>
      Modo escuro
    </ContextMenu.CheckboxItem>
  </ContextMenu.Content>
</ContextMenu.Root>`;

  const codeVariantRadio = `<script lang="ts">
  import * as ContextMenu from "@/components/ui/context-menu";
  let theme = $state("system");
<\/script>
<ContextMenu.Root>
  <ContextMenu.Trigger class="...">Right-click aqui</ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.RadioGroup bind:value={theme}>
      <ContextMenu.RadioItem value="light">Claro</ContextMenu.RadioItem>
      <ContextMenu.RadioItem value="dark">Escuro</ContextMenu.RadioItem>
      <ContextMenu.RadioItem value="system">Sistema</ContextMenu.RadioItem>
    </ContextMenu.RadioGroup>
  </ContextMenu.Content>
</ContextMenu.Root>`;

  const codeVariantSubTrigger = `<ContextMenu.Root>
  <ContextMenu.Trigger class="...">Right-click aqui</ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Sub>
      <ContextMenu.SubTrigger>Compartilhar</ContextMenu.SubTrigger>
      <ContextMenu.SubContent>
        <ContextMenu.Item>Por e-mail</ContextMenu.Item>
        <ContextMenu.Item>Por link</ContextMenu.Item>
      </ContextMenu.SubContent>
    </ContextMenu.Sub>
  </ContextMenu.Content>
</ContextMenu.Root>`;

  const codeVariantLabel = `<ContextMenu.Root>
  <ContextMenu.Trigger class="...">Right-click aqui</ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Group>
      <ContextMenu.Label>Grupo de ações</ContextMenu.Label>
      <ContextMenu.Item inset>Editar</ContextMenu.Item>
      <ContextMenu.Item inset>Duplicar</ContextMenu.Item>
    </ContextMenu.Group>
  </ContextMenu.Content>
</ContextMenu.Root>`;

  const codeCustomizationTokens = `/* Customizar tokens do Context Menu via tema */
:root {
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
}`;

  const codeCompCheckbox = `<script lang="ts">
  import * as ContextMenu from "@/components/ui/context-menu";
  let showGrid = $state(true);
  let showRulers = $state(false);
<\/script>
<ContextMenu.Root>
  <ContextMenu.Trigger class="...">Right-click aqui</ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Group>
      <ContextMenu.Label inset>Visualização</ContextMenu.Label>
      <ContextMenu.CheckboxItem bind:checked={showGrid}>Mostrar grade</ContextMenu.CheckboxItem>
      <ContextMenu.CheckboxItem bind:checked={showRulers}>Mostrar réguas</ContextMenu.CheckboxItem>
    </ContextMenu.Group>
  </ContextMenu.Content>
</ContextMenu.Root>`;

  const codeCompRadio = `<script lang="ts">
  import * as ContextMenu from "@/components/ui/context-menu";
  let zoom = $state("100");
<\/script>
<ContextMenu.Root>
  <ContextMenu.Trigger class="...">Right-click aqui</ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Group>
      <ContextMenu.Label inset>Zoom</ContextMenu.Label>
      <ContextMenu.RadioGroup bind:value={zoom}>
        <ContextMenu.RadioItem value="75">75%</ContextMenu.RadioItem>
        <ContextMenu.RadioItem value="100">100%</ContextMenu.RadioItem>
        <ContextMenu.RadioItem value="150">150%</ContextMenu.RadioItem>
      </ContextMenu.RadioGroup>
    </ContextMenu.Group>
  </ContextMenu.Content>
</ContextMenu.Root>`;

  const codeCompSubmenu = `<ContextMenu.Root>
  <ContextMenu.Trigger class="...">Right-click aqui</ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item>Editar</ContextMenu.Item>
    <ContextMenu.Item>Duplicar</ContextMenu.Item>
    <ContextMenu.Sub>
      <ContextMenu.SubTrigger>Compartilhar</ContextMenu.SubTrigger>
      <ContextMenu.SubContent>
        <ContextMenu.Item>Por e-mail</ContextMenu.Item>
        <ContextMenu.Item>Por link</ContextMenu.Item>
      </ContextMenu.SubContent>
    </ContextMenu.Sub>
  </ContextMenu.Content>
</ContextMenu.Root>`;

  const codeCompShortcuts = `<ContextMenu.Root>
  <ContextMenu.Trigger class="...">Right-click aqui</ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item>
      Editar
      <ContextMenu.Shortcut>⌘E</ContextMenu.Shortcut>
    </ContextMenu.Item>
    <ContextMenu.Item>
      Duplicar
      <ContextMenu.Shortcut>⌘D</ContextMenu.Shortcut>
    </ContextMenu.Item>
    <ContextMenu.Separator />
    <ContextMenu.Item variant="destructive">
      Excluir
      <ContextMenu.Shortcut>⌫</ContextMenu.Shortcut>
    </ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu.Root>`;

  const interfaceCode = `// ContextMenuItem
interface ContextMenuItemProps {
  variant?: 'default' | 'destructive';
  inset?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  class?: string;
}

// ContextMenuCheckboxItem
interface ContextMenuCheckboxItemProps {
  checked?: boolean;
  inset?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

// ContextMenuRadioItem
interface ContextMenuRadioItemProps {
  value: string;
  inset?: boolean;
  disabled?: boolean;
}

// ContextMenuRadioGroup
interface ContextMenuRadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="context-menu">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add context-menu"
    />
  {/snippet}

  <!-- ── Demonstração ──────────────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="flex flex-wrap gap-8 items-center justify-center">
        <ContextMenu.Root>
          <ContextMenu.Trigger
            class="flex h-32 w-64 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground select-none cursor-default"
          >
            {$tStore('demonstration.labels.triggerLabel')}
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item>
              {$tStore('demonstration.labels.edit')}
              <ContextMenu.Shortcut>{$tStore('demonstration.labels.editShortcut')}</ContextMenu.Shortcut>
            </ContextMenu.Item>
            <ContextMenu.Item>{$tStore('demonstration.labels.duplicate')}</ContextMenu.Item>
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger>{$tStore('demonstration.labels.share')}</ContextMenu.SubTrigger>
              <ContextMenu.SubContent>
                <ContextMenu.Item>{$tStore('demonstration.labels.shareEmail')}</ContextMenu.Item>
                <ContextMenu.Item>{$tStore('demonstration.labels.shareLink')}</ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Sub>
            <ContextMenu.Separator />
            <ContextMenu.Item variant="destructive">
              {$tStore('demonstration.labels.delete')}
              <ContextMenu.Shortcut>{$tStore('demonstration.labels.deleteShortcut')}</ContextMenu.Shortcut>
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
      </div>
    {/snippet}
  </DocsDemonstration>

  <!-- ── Anatomia ──────────────────────────────────────────────────────── -->
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
      $tStore('anatomy.item10'),
      $tStore('anatomy.item11'),
    ]}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
  />

  <!-- ── Quando Usar ───────────────────────────────────────────────────── -->
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
      ],
    }}
  />

  <!-- ── Do & Don't ───────────────────────────────────────────────────── -->
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
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair3.do'),
        dontCaption: $tStore('doDont.pair3.dont'),
        doPreview: doPair3,
        dontPreview: dontPair3,
      },
    ]}
  />

  {#snippet doPair1()}
    <div class="flex flex-col gap-2 items-start">
      <p class="text-xs text-muted-foreground">Menu contextual + botão alternativo visível</p>
      <div class="flex gap-2">
        <div class="rounded border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">Área com right-click</div>
        <button class="rounded border border-border px-3 py-1.5 text-xs hover:bg-accent">Ações</button>
      </div>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div class="flex flex-col gap-2 items-start">
      <p class="text-xs text-muted-foreground">Apenas right-click, sem alternativa visível</p>
      <div class="rounded border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">Área com right-click</div>
    </div>
  {/snippet}

  {#snippet doPair2()}
    <ContextMenu.Root>
      <ContextMenu.Trigger class="flex h-16 w-48 items-center justify-center rounded border-2 border-dashed border-border text-xs text-muted-foreground cursor-default">
        Right-click aqui
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item>Editar</ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item variant="destructive">Excluir</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}
  {#snippet dontPair2()}
    <ContextMenu.Root>
      <ContextMenu.Trigger class="flex h-16 w-48 items-center justify-center rounded border-2 border-dashed border-border text-xs text-muted-foreground cursor-default">
        Right-click aqui
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item>Editar</ContextMenu.Item>
        <ContextMenu.Sub>
          <ContextMenu.SubTrigger>Mais</ContextMenu.SubTrigger>
          <ContextMenu.SubContent>
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger>Avançado</ContextMenu.SubTrigger>
              <ContextMenu.SubContent>
                <ContextMenu.Item>Opção profunda</ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Sub>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}

  {#snippet doPair3()}
    <ContextMenu.Root>
      <ContextMenu.Trigger class="flex h-16 w-48 items-center justify-center rounded border-2 border-dashed border-border text-xs text-muted-foreground cursor-default">
        Right-click aqui
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item>
          Editar
          <ContextMenu.Shortcut>⌘E</ContextMenu.Shortcut>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}
  {#snippet dontPair3()}
    <div class="flex h-16 w-48 items-center justify-center rounded border-2 border-dashed border-border text-xs text-muted-foreground cursor-default">
      Área sem nenhuma pista visual
    </div>
  {/snippet}

  <!-- ── Importação ────────────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryDescription={$tStore('import.withSub')}
    secondaryCode={codeImportWithSub}
  />

  <!-- ── Variantes ─────────────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    items={[
      { name: 'default',      description: stripHtml($tStore('variants.items.default')),      code: codeDefault,           preview: variantDefault      },
      { name: 'destructive',  description: stripHtml($tStore('variants.items.destructive')),  code: codeDestructive,       preview: variantDestructive  },
      { name: 'CheckboxItem', description: stripHtml($tStore('variants.checkboxItem')),       code: codeVariantCheckbox,   preview: variantCheckbox     },
      { name: 'RadioItem',    description: stripHtml($tStore('variants.radioItem')),          code: codeVariantRadio,      preview: variantRadio        },
      { name: 'SubTrigger',   description: stripHtml($tStore('variants.subTrigger')),         code: codeVariantSubTrigger, preview: variantSubTrigger   },
      { name: 'Label + Inset',description: stripHtml($tStore('variants.label')),             code: codeVariantLabel,      preview: variantLabel        },
    ]}
  />

  {#snippet variantDefault()}
    <ContextMenu.Root>
      <ContextMenu.Trigger class="flex h-24 w-56 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground select-none cursor-default">
        {$tStore('demonstration.labels.triggerLabel')}
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item>
          {$tStore('demonstration.labels.edit')}
          <ContextMenu.Shortcut>{$tStore('demonstration.labels.editShortcut')}</ContextMenu.Shortcut>
        </ContextMenu.Item>
        <ContextMenu.Item>{$tStore('demonstration.labels.duplicate')}</ContextMenu.Item>
        <ContextMenu.Item>{$tStore('demonstration.labels.share')}</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}

  {#snippet variantDestructive()}
    <ContextMenu.Root>
      <ContextMenu.Trigger class="flex h-24 w-56 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground select-none cursor-default">
        {$tStore('demonstration.labels.triggerLabel')}
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item>{$tStore('demonstration.labels.edit')}</ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item variant="destructive">
          {$tStore('demonstration.labels.delete')}
          <ContextMenu.Shortcut>{$tStore('demonstration.labels.deleteShortcut')}</ContextMenu.Shortcut>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}

  {#snippet variantCheckbox()}
    <ContextMenu.Root>
      <ContextMenu.Trigger class="flex h-24 w-56 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground select-none cursor-default">
        {$tStore('demonstration.labels.triggerLabel')}
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.CheckboxItem
          checked={variantCheckboxChecked}
          onCheckedChange={(v: boolean) => { variantCheckboxChecked = v; }}
        >
          Modo escuro
        </ContextMenu.CheckboxItem>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}

  {#snippet variantRadio()}
    <ContextMenu.Root>
      <ContextMenu.Trigger class="flex h-24 w-56 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground select-none cursor-default">
        {$tStore('demonstration.labels.triggerLabel')}
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.RadioGroup value={variantRadioValue} onValueChange={(v: string) => { variantRadioValue = v; }}>
          <ContextMenu.RadioItem value="light">Claro</ContextMenu.RadioItem>
          <ContextMenu.RadioItem value="dark">Escuro</ContextMenu.RadioItem>
          <ContextMenu.RadioItem value="system">Sistema</ContextMenu.RadioItem>
        </ContextMenu.RadioGroup>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}

  {#snippet variantSubTrigger()}
    <ContextMenu.Root>
      <ContextMenu.Trigger class="flex h-24 w-56 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground select-none cursor-default">
        {$tStore('demonstration.labels.triggerLabel')}
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Sub>
          <ContextMenu.SubTrigger>Compartilhar</ContextMenu.SubTrigger>
          <ContextMenu.SubContent>
            <ContextMenu.Item>Por e-mail</ContextMenu.Item>
            <ContextMenu.Item>Por link</ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}

  {#snippet variantLabel()}
    <ContextMenu.Root>
      <ContextMenu.Trigger class="flex h-24 w-56 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground select-none cursor-default">
        {$tStore('demonstration.labels.triggerLabel')}
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Group>
          <ContextMenu.Label>Grupo de ações</ContextMenu.Label>
          <ContextMenu.Item inset>Editar</ContextMenu.Item>
          <ContextMenu.Item inset>Duplicar</ContextMenu.Item>
        </ContextMenu.Group>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}

  <!-- ── Composições ───────────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="context-menu"
    items={[
      {
        name: $tStore('variants.compositions.withCheckbox.name'),
        description: $tStore('variants.compositions.withCheckbox.description'),
        useWhen: $tStore('variants.compositions.withCheckbox.use'),
        code: codeCompCheckbox,
        preview: compCheckboxPreview,
      },
      {
        name: $tStore('variants.compositions.withRadio.name'),
        description: $tStore('variants.compositions.withRadio.description'),
        useWhen: $tStore('variants.compositions.withRadio.use'),
        code: codeCompRadio,
        preview: compRadioPreview,
      },
      {
        name: $tStore('variants.compositions.withSubmenu.name'),
        description: $tStore('variants.compositions.withSubmenu.description'),
        useWhen: $tStore('variants.compositions.withSubmenu.use'),
        code: codeCompSubmenu,
        preview: compSubmenuPreview,
      },
      {
        name: $tStore('variants.compositions.withShortcuts.name'),
        description: $tStore('variants.compositions.withShortcuts.description'),
        useWhen: $tStore('variants.compositions.withShortcuts.use'),
        code: codeCompShortcuts,
        preview: compShortcutsPreview,
      },
    ]}
  />

  {#snippet compCheckboxPreview()}
    <ContextMenu.Root>
      <ContextMenu.Trigger class="flex h-24 w-56 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground select-none cursor-default">
        {$tStore('demonstration.labels.triggerLabel')}
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Group>
          <ContextMenu.Label inset>Visualização</ContextMenu.Label>
          <ContextMenu.CheckboxItem
            checked={compShowGrid}
            onCheckedChange={(v: boolean) => { compShowGrid = v; }}
          >
            Mostrar grade
          </ContextMenu.CheckboxItem>
          <ContextMenu.CheckboxItem
            checked={compShowRulers}
            onCheckedChange={(v: boolean) => { compShowRulers = v; }}
          >
            Mostrar réguas
          </ContextMenu.CheckboxItem>
        </ContextMenu.Group>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}

  {#snippet compRadioPreview()}
    <ContextMenu.Root>
      <ContextMenu.Trigger class="flex h-24 w-56 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground select-none cursor-default">
        {$tStore('demonstration.labels.triggerLabel')}
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Group>
          <ContextMenu.Label inset>Zoom</ContextMenu.Label>
          <ContextMenu.RadioGroup value={compZoom} onValueChange={(v: string) => { compZoom = v; }}>
            <ContextMenu.RadioItem value="75">75%</ContextMenu.RadioItem>
            <ContextMenu.RadioItem value="100">100%</ContextMenu.RadioItem>
            <ContextMenu.RadioItem value="150">150%</ContextMenu.RadioItem>
          </ContextMenu.RadioGroup>
        </ContextMenu.Group>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}

  {#snippet compSubmenuPreview()}
    <ContextMenu.Root>
      <ContextMenu.Trigger class="flex h-24 w-56 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground select-none cursor-default">
        {$tStore('demonstration.labels.triggerLabel')}
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item>{$tStore('demonstration.labels.edit')}</ContextMenu.Item>
        <ContextMenu.Item>{$tStore('demonstration.labels.duplicate')}</ContextMenu.Item>
        <ContextMenu.Sub>
          <ContextMenu.SubTrigger>{$tStore('demonstration.labels.share')}</ContextMenu.SubTrigger>
          <ContextMenu.SubContent>
            <ContextMenu.Item>{$tStore('demonstration.labels.shareEmail')}</ContextMenu.Item>
            <ContextMenu.Item>{$tStore('demonstration.labels.shareLink')}</ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}

  {#snippet compShortcutsPreview()}
    <ContextMenu.Root>
      <ContextMenu.Trigger class="flex h-24 w-56 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground select-none cursor-default">
        {$tStore('demonstration.labels.triggerLabel')}
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item>
          {$tStore('demonstration.labels.edit')}
          <ContextMenu.Shortcut>{$tStore('demonstration.labels.editShortcut')}</ContextMenu.Shortcut>
        </ContextMenu.Item>
        <ContextMenu.Item>
          {$tStore('demonstration.labels.duplicate')}
          <ContextMenu.Shortcut>⌘D</ContextMenu.Shortcut>
        </ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item variant="destructive">
          {$tStore('demonstration.labels.delete')}
          <ContextMenu.Shortcut>{$tStore('demonstration.labels.deleteShortcut')}</ContextMenu.Shortcut>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}

  <!-- ── Estados ───────────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={[
      { label: $tStore('states.closed.label'),   trigger: $tStore('states.closed.trigger'),   behavior: $tStore('states.closed.behavior')   },
      { label: $tStore('states.open.label'),      trigger: $tStore('states.open.trigger'),      behavior: $tStore('states.open.behavior')      },
      { label: $tStore('states.focused.label'),   trigger: stripHtml($tStore('states.focused.trigger')),   behavior: $tStore('states.focused.behavior')   },
      { label: $tStore('states.disabled.label'),  trigger: stripHtml($tStore('states.disabled.trigger')),  behavior: $tStore('states.disabled.behavior')  },
      { label: $tStore('states.checked.label'),   trigger: stripHtml($tStore('states.checked.trigger')),   behavior: $tStore('states.checked.behavior')   },
      { label: $tStore('states.subOpen.label'),   trigger: $tStore('states.subOpen.trigger'),   behavior: $tStore('states.subOpen.behavior')   },
    ]}
  />

  <!-- ── Propriedades ──────────────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: $tStore('props.rootTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'onOpenChange', type: '(open: boolean) => void', defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.items.onOpenChange')) },
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
          { name: 'align',       type: '"start" | "center" | "end"', defaultValue: '"start"', required: 'Não', description: stripHtml($tStore('props.items.align'))       },
          { name: 'alignOffset', type: 'number',                      defaultValue: '4',       required: 'Não', description: stripHtml($tStore('props.items.alignOffset')) },
          { name: 'side',        type: '"top" | "right" | "bottom" | "left"', defaultValue: '"right"', required: 'Não', description: stripHtml($tStore('props.items.side')) },
          { name: 'sideOffset', type: 'number',                       defaultValue: '0',       required: 'Não', description: stripHtml($tStore('props.items.sideOffset'))  },
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
          { name: 'variant',  type: '"default" | "destructive"', defaultValue: '"default"', required: 'Não', description: stripHtml($tStore('props.items.variant'))  },
          { name: 'inset',    type: 'boolean',                   defaultValue: 'false',     required: 'Não', description: stripHtml($tStore('props.items.inset'))    },
          { name: 'disabled', type: 'boolean',                   defaultValue: 'false',     required: 'Não', description: stripHtml($tStore('props.items.disabled')) },
          { name: 'onSelect', type: '() => void',                defaultValue: '—',         required: 'Não', description: stripHtml($tStore('props.items.onSelect')) },
        ],
      },
      {
        title: $tStore('props.checkboxItemTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'checked',         type: 'boolean',               defaultValue: 'false', required: 'Não', description: stripHtml($tStore('props.items.checked'))         },
          { name: 'onCheckedChange', type: '(checked: boolean) => void', defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.items.onCheckedChange')) },
          { name: 'disabled',        type: 'boolean',               defaultValue: 'false', required: 'Não', description: stripHtml($tStore('props.items.disabled'))        },
        ],
      },
      {
        title: $tStore('props.radioGroupTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'value',         type: 'string',                  defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.items.value'))         },
          { name: 'onValueChange', type: '(value: string) => void', defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.items.onValueChange')) },
        ],
      },
      {
        title: $tStore('props.radioItemTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'value',    type: 'string',  defaultValue: '—',     required: 'Sim', description: stripHtml($tStore('props.items.value'))    },
          { name: 'disabled', type: 'boolean', defaultValue: 'false', required: 'Não', description: stripHtml($tStore('props.items.disabled')) },
        ],
      },
      {
        title: $tStore('props.labelTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'inset', type: 'boolean', defaultValue: 'false', required: 'Não', description: stripHtml($tStore('props.items.inset')) },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={$tStore('props.extensibility')}
  />

  <!-- ── Tokens ────────────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      { token: '--popover',            value: 'bg-popover',              description: $tStore('tokens.table.popoverBg')        },
      { token: '--popover-foreground', value: 'text-popover-foreground', description: $tStore('tokens.table.popoverFg')        },
      { token: '--accent',             value: 'bg-accent',               description: $tStore('tokens.table.accentBg')         },
      { token: '--accent-foreground',  value: 'text-accent-foreground',  description: $tStore('tokens.table.accentFg')         },
      { token: '--destructive',        value: 'text-destructive',        description: $tStore('tokens.table.destructive')      },
      { token: '--destructive',        value: 'bg-destructive/10',       description: $tStore('tokens.table.destructiveFocus') },
      { token: '--muted-foreground',   value: 'text-muted-foreground',   description: $tStore('tokens.table.mutedFg')          },
      { token: '--border',             value: 'bg-border',               description: $tStore('tokens.table.border')           },
      { token: '--shadow',             value: 'shadow-md',               description: $tStore('tokens.table.shadow')           },
      { token: '--radius',             value: 'rounded-lg',              description: $tStore('tokens.table.radius')           },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeCustomizationTokens}
  />

  <!-- ── Acessibilidade ───────────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.aria.roleMenu'),
      $tStore('accessibility.aria.roleMenuItem'),
      $tStore('accessibility.aria.roleMenuitemCheckbox'),
      $tStore('accessibility.aria.roleMenuitemRadio'),
      $tStore('accessibility.aria.ariaChecked'),
      $tStore('accessibility.aria.ariaDisabled'),
      $tStore('accessibility.aria.ariaHaspopup'),
      $tStore('accessibility.warning'),
    ]}
    keyboardTitle={$tStore('accessibility.title')}
    keyboardItems={[
      { key: 'Right-click / Menu', description: $tStore('accessibility.keyboard.rightClick') },
      { key: '↓ Arrow Down',       description: $tStore('accessibility.keyboard.arrowDown')  },
      { key: '↑ Arrow Up',         description: $tStore('accessibility.keyboard.arrowUp')    },
      { key: '→ Arrow Right',      description: $tStore('accessibility.keyboard.arrowRight') },
      { key: '← Arrow Left',       description: $tStore('accessibility.keyboard.arrowLeft')  },
      { key: 'Enter',              description: $tStore('accessibility.keyboard.enter')      },
      { key: 'Space',              description: $tStore('accessibility.keyboard.space')      },
      { key: 'Escape',             description: $tStore('accessibility.keyboard.escape')     },
      { key: 'Tab',                description: $tStore('accessibility.keyboard.tab')        },
    ]}
  />

  <!-- ── Relacionados ─────────────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'DropdownMenu', description: $tStore('related.dropdownMenu'), path: '?path=/docs/ui-dropdownmenu--docs' },
      { name: 'Menubar',      description: $tStore('related.menubar'),      path: '?path=/docs/ui-menubar--docs'      },
      { name: 'Dialog',       description: $tStore('related.dialog'),       path: '?path=/docs/ui-dialog--docs'       },
      { name: 'AlertDialog',  description: $tStore('related.alertDialog'),  path: '?path=/docs/ui-alertdialog--docs'  },
      { name: 'Tooltip',      description: $tStore('related.tooltip'),      path: '?path=/docs/ui-tooltip--docs'      },
    ]}
  />

  <!-- ── Notas ────────────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: $tStore('notes.tip1') },
      { title: '', content: $tStore('notes.tip2') },
      { title: '', content: $tStore('notes.tip3') },
      { title: '', content: $tStore('notes.tip4') },
      { title: '', content: $tStore('notes.tip5') },
    ]}
  />

  <!-- ── Analytics ────────────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event:   $tStore('analytics.table.event'),
      trigger: $tStore('analytics.table.trigger'),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: $tStore('analytics.table.menuOpen'),      trigger: $tStore('analytics.table.menuOpenTrigger'),      payload: $tStore('analytics.table.menuOpenPayload')      },
      { event: $tStore('analytics.table.itemClick'),     trigger: $tStore('analytics.table.itemClickTrigger'),     payload: $tStore('analytics.table.itemClickPayload')     },
      { event: $tStore('analytics.table.pageView'),      trigger: $tStore('analytics.table.pageViewTrigger'),      payload: $tStore('analytics.table.pageViewPayload')      },
      { event: $tStore('analytics.table.sectionViewed'), trigger: $tStore('analytics.table.sectionViewedTrigger'), payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),    trigger: $tStore('analytics.table.langSwitchTrigger'),    payload: $tStore('analytics.table.langSwitchPayload')    },
    ]}
  />

  <!-- ── Testes ────────────────────────────────────────────────────────── -->
  <DocsTestes
    title={$tStore('testes.title')}
    functional={{
      title: $tStore('testes.functional.title'),
      cols: {
        action:   $tNavStore('common.userAction'),
        result:   $tNavStore('common.expectedResult'),
        priority: $tNavStore('common.priority'),
      },
      items: [
        { action: $tStore('testes.functional.item1.action'),  result: $tStore('testes.functional.item1.result'),  priority: localPriority($tStore('testes.functional.item1.priority'),  $tNavStore) },
        { action: $tStore('testes.functional.item2.action'),  result: $tStore('testes.functional.item2.result'),  priority: localPriority($tStore('testes.functional.item2.priority'),  $tNavStore) },
        { action: $tStore('testes.functional.item3.action'),  result: $tStore('testes.functional.item3.result'),  priority: localPriority($tStore('testes.functional.item3.priority'),  $tNavStore) },
        { action: $tStore('testes.functional.item4.action'),  result: $tStore('testes.functional.item4.result'),  priority: localPriority($tStore('testes.functional.item4.priority'),  $tNavStore) },
        { action: $tStore('testes.functional.item5.action'),  result: $tStore('testes.functional.item5.result'),  priority: localPriority($tStore('testes.functional.item5.priority'),  $tNavStore) },
        { action: $tStore('testes.functional.item6.action'),  result: $tStore('testes.functional.item6.result'),  priority: localPriority($tStore('testes.functional.item6.priority'),  $tNavStore) },
        { action: $tStore('testes.functional.item7.action'),  result: $tStore('testes.functional.item7.result'),  priority: localPriority($tStore('testes.functional.item7.priority'),  $tNavStore) },
        { action: $tStore('testes.functional.item8.action'),  result: $tStore('testes.functional.item8.result'),  priority: localPriority($tStore('testes.functional.item8.priority'),  $tNavStore) },
        { action: $tStore('testes.functional.item9.action'),  result: $tStore('testes.functional.item9.result'),  priority: localPriority($tStore('testes.functional.item9.priority'),  $tNavStore) },
        { action: $tStore('testes.functional.item10.action'), result: $tStore('testes.functional.item10.result'), priority: localPriority($tStore('testes.functional.item10.priority'), $tNavStore) },
      ],
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level:     'WCAG',
        how:       $tNavStore('common.howToVerify'),
      },
      items: [
        { criterion: $tStore('testes.accessibility.item1'), level: 'AA', how: 'axe-core' },
        { criterion: $tStore('testes.accessibility.item2'), level: 'AA', how: 'DOM inspection' },
        { criterion: $tStore('testes.accessibility.item3'), level: 'AA', how: 'DOM inspection' },
        { criterion: $tStore('testes.accessibility.item4'), level: 'AA', how: 'DOM inspection' },
        { criterion: $tStore('testes.accessibility.item5'), level: 'AA', how: 'DOM inspection' },
        { criterion: $tStore('testes.accessibility.item6'), level: 'AA', how: 'DOM inspection' },
        { criterion: $tStore('testes.accessibility.item7'), level: 'AA', how: 'Keyboard test' },
        { criterion: $tStore('testes.accessibility.item8'), level: 'AA', how: 'Contrast analyzer' },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story:    $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [
        { story: $tStore('testes.visual.item1.story'), priority: localPriority($tStore('testes.visual.item1.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item2.story'), priority: localPriority($tStore('testes.visual.item2.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item3.story'), priority: localPriority($tStore('testes.visual.item3.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item4.story'), priority: localPriority($tStore('testes.visual.item4.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item5.story'), priority: localPriority($tStore('testes.visual.item5.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item6.story'), priority: localPriority($tStore('testes.visual.item6.priority'), $tNavStore) },
      ],
    }}
  />
</DocsPageLayout>
