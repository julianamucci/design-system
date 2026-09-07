<script lang="ts">
  import { untrack } from 'svelte';
  import * as ContextMenu from '@/components/ui/context-menu';
  import { AREA_CLICK_DIREITO } from '@shared/primitives/context-menu-area';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.svelte';
  import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.svelte';
  import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.svelte';
  import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.svelte';
  import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.svelte';
  import DocsImport        from '@/components/docs/shared/sections/DocsImport.svelte';
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
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(componentTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = $derived(
    Object.values(
      (componentTranslations as unknown as Record<
        string,
        { accessibility?: { screenReader?: Record<string, string> } }
      >)[$locale]?.accessibility?.screenReader ?? {},
    ),
  );

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

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'context-menu', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  // A moldura tracejada da área vem da constante COMPARTILHADA. Esta página
  // escrevia a cadeia à mão em treze lugares, e com `nds-w-full nds-max-w-xs`
  // no lugar de `nds-w-xs` — a divergência que a constante existe justamente
  // para impedir (o docblock dela registra a rodada em que as cinco stacks
  // desenhavam molduras diferentes).
  const areaClasse = AREA_CLICK_DIREITO;

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  /**
   * Varre `base.item1`, `base.item2`, … enquanto existirem no conteúdo.
   *
   * Citar índice por índice trava a lista no tamanho de hoje: o conteúdo
   * compartilhado ganha um item e ele simplesmente não existe para quem lê —
   * sem erro, sem aviso, nos três idiomas de uma vez. Foi o que aconteceu com o
   * nono critério de acessibilidade deste componente, o que registra que a seta
   * POUSA no item desabilitado em vez de pulá-lo.
   */
  function stringsFromDict(
    t: (key: string, defaultValue?: string) => string,
    base: string,
  ): string[] {
    const out: string[] = [];
    for (let i = 1; ; i++) {
      const value = t(`${base}.item${i}`, '');
      if (!value) break;
      out.push(value);
    }
    return out;
  }

  /**
   * A mesma varredura para a lista cujo item é um OBJETO — cenário, critério
   * funcional, story de regressão visual. O primeiro campo é quem decide se o
   * item existe, e os demais acompanham.
   */
  function entriesFromDict<K extends string>(
    t: (key: string, defaultValue?: string) => string,
    base: string,
    fields: readonly K[],
  ): Array<Record<K, string>> {
    const out: Array<Record<K, string>> = [];
    for (let i = 1; ; i++) {
      if (!t(`${base}.item${i}.${fields[0]}`, '')) break;
      out.push(
        Object.fromEntries(
          fields.map((field) => [field, t(`${base}.item${i}.${field}`, '')]),
        ) as Record<K, string>,
      );
    }
    return out;
  }

  // Ferramenta de verificação fica aqui, e não no conteúdo compartilhado,
  // porque é IDENTIFICADOR de ferramenta — e identificador não se traduz.
  // Critério além desta lista cai no padrão.
  const a11yTestHow = [
    'axe-core',
    'DOM inspection',
    'DOM inspection',
    'DOM inspection',
    'DOM inspection',
    'DOM inspection',
    'Keyboard test',
    'Contrast analyzer',
    'Keyboard test',
  ];

  /**
   * `location` é a SEÇÃO onde o elemento está, e é por isso que ele chega por
   * parâmetro em vez de sair de uma constante no topo do arquivo.
   *
   * A página inteira mandava `docs_demo`: um clique no preview de Variantes ou
   * do Do & Don't é tão real quanto o da Demonstração, e chegava ao GA4 com o
   * carimbo da seção errada. O `menu` nomeia o preview; o rótulo traduzido
   * nunca entra, sob pena de partir o mesmo evento em um por idioma.
   */
  function trackMenuOpen(menu: string, location: string, open: boolean): void {
    if (!open) return;
    track('menu_open', { component: 'context_menu', menu, location });
  }

  // ─── State para demos interativos ────────────────────────────────────────────

  let checkboxShowBookmarks = $state(true);
  let checkboxShowFullUrls = $state(false);
  let radioValue = $state('pedro');

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
      <ContextMenu.Shortcut>Ctrl+E</ContextMenu.Shortcut>
    </ContextMenu.Item>
    <ContextMenu.Item>Duplicar</ContextMenu.Item>
    <ContextMenu.Separator />
    <ContextMenu.Item variant="destructive">
      Excluir
      <ContextMenu.Shortcut>Delete</ContextMenu.Shortcut>
    </ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu.Root>`;

  const codeDestructive = `<ContextMenu.Item variant="destructive">
  Excluir
  <ContextMenu.Shortcut>Delete</ContextMenu.Shortcut>
</ContextMenu.Item>`;

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
      <ContextMenu.Shortcut>Ctrl+E</ContextMenu.Shortcut>
    </ContextMenu.Item>
    <ContextMenu.Item>
      Duplicar
      <ContextMenu.Shortcut>Ctrl+D</ContextMenu.Shortcut>
    </ContextMenu.Item>
    <ContextMenu.Separator />
    <ContextMenu.Item variant="destructive">
      Excluir
      <ContextMenu.Shortcut>Delete</ContextMenu.Shortcut>
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
    />
  {/snippet}

  <!-- ── Demonstração ──────────────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    <div class="nds-cluster nds-w-full nds-p-8" data-align="center" data-justify="center">
      <ContextMenu.Root onOpenChange={(o: boolean) => trackMenuOpen('demo', 'docs_demo', o)}>
        <ContextMenu.Trigger
          class={areaClasse}
          data-align="center"
          data-justify="center"
         
        >
          {$tStore('demonstration.labels.triggerLabel')}
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item onSelect={() => track('menu_item_click', { label: 'edit', menu: 'demo', location: 'docs_demo' })}>
            {$tStore('demonstration.labels.edit')}
            <ContextMenu.Shortcut>{$tStore('demonstration.labels.editShortcut')}</ContextMenu.Shortcut>
          </ContextMenu.Item>
          <ContextMenu.Item onSelect={() => track('menu_item_click', { label: 'duplicate', menu: 'demo', location: 'docs_demo' })}>{$tStore('demonstration.labels.duplicate')}</ContextMenu.Item>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>{$tStore('demonstration.labels.share')}</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item onSelect={() => track('menu_item_click', { label: 'share-email', menu: 'demo', location: 'docs_demo' })}>{$tStore('demonstration.labels.shareEmail')}</ContextMenu.Item>
              <ContextMenu.Item onSelect={() => track('menu_item_click', { label: 'share-link', menu: 'demo', location: 'docs_demo' })}>{$tStore('demonstration.labels.shareLink')}</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
          <ContextMenu.Separator />
          <ContextMenu.Item variant="destructive" onSelect={() => track('menu_item_click', { label: 'delete', menu: 'demo', location: 'docs_demo' })}>
            {$tStore('demonstration.labels.delete')}
            <ContextMenu.Shortcut>{$tStore('demonstration.labels.deleteShortcut')}</ContextMenu.Shortcut>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>
    </div>
  </DocsDemonstration>

  <!-- ── Anatomia ──────────────────────────────────────────────────────── -->
  <DocsAnatomy
    title={$tStore('anatomy.title')}
    items={stringsFromDict($tStore, 'anatomy')}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
  />

  <!-- ── Quando Usar ───────────────────────────────────────────────────── -->
  <DocsWhenToUse
    title={$tStore('usage.title')}
    guidelines={{
      title: $tStore('usage.guidelines.title'),
      items: stringsFromDict($tStore, 'usage.guidelines'),
    }}
    scenarios={{
      title: $tStore('usage.scenarios.title'),
      cols: {
        scenario: $tStore('usage.scenarios.cols.scenario'),
        use: $tStore('usage.scenarios.cols.use'),
        alternative: $tStore('usage.scenarios.cols.alternative'),
      },
      items: entriesFromDict($tStore, 'usage.scenarios', ['s', 'u', 'a']),
    }}
    do={{
      title: $tStore('usage.do.title'),
      items: stringsFromDict($tStore, 'usage.do'),
    }}
    dont={{
      title: $tStore('usage.dont.title'),
      items: stringsFromDict($tStore, 'usage.dont'),
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

  <!--
    O par 1 monta o COMPONENTE, como os pares 2 e 3 ao lado e como as outras
    quatro stacks. Antes ele desenhava caixas à mão, com `padding` cravado em
    `style` inline: o exemplo saía do tema, da densidade e da escala de tipo, e
    ensinava markup que o design system não emite.
  -->
  {#snippet doPair1()}
    <div class="nds-cluster" data-spacing="sm">
      <ContextMenu.Root onOpenChange={(o: boolean) => trackMenuOpen('par1-do', 'docs_do_dont', o)}>
        <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
          Área com menu
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Editar</ContextMenu.Item>
          <ContextMenu.Item variant="destructive">Excluir</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>
      <span class="nds-text-body nds-text-muted-foreground">+ botão visível</span>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <ContextMenu.Root onOpenChange={(o: boolean) => trackMenuOpen('par1-dont', 'docs_do_dont', o)}>
      <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
        Área (sem botão)
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item variant="destructive">Excluir</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}

  {#snippet doPair2()}
    <ContextMenu.Root onOpenChange={(o: boolean) => trackMenuOpen('par2-do', 'docs_do_dont', o)}>
      <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
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
    <ContextMenu.Root onOpenChange={(o: boolean) => trackMenuOpen('par2-dont', 'docs_do_dont', o)}>
      <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
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

  <!--
    Os dois lados montam o MESMO menu; o que os separa é a DICA VISUAL, que é o
    assunto da legenda deste par. O "faça" traz a moldura tracejada da constante
    compartilhada e uma linha que diz o gesto; o "evite" é a mesma área sem
    contorno, sem cursor e sem aviso — o menu existe e ninguém tem como saber.

    O lado direito era um `<div>` desenhado à mão, com `border-style` e
    `text-align` em `style` inline: ensinava markup que o design system não
    emite, e a guideline 08 §15 pede componente VIVO em toda seção com exemplo.
  -->
  {#snippet doPair3()}
    <ContextMenu.Root onOpenChange={(o: boolean) => trackMenuOpen('par3-do', 'docs_do_dont', o)}>
      <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
        {$tStore('demonstration.labels.triggerLabel')}
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item>{$tStore('demonstration.labels.edit')}</ContextMenu.Item>
        <ContextMenu.Item>{$tStore('demonstration.labels.duplicate')}</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/snippet}
  {#snippet dontPair3()}
    <ContextMenu.Root onOpenChange={(o: boolean) => trackMenuOpen('par3-dont', 'docs_do_dont', o)}>
      <ContextMenu.Trigger
        class="nds-cluster nds-w-xs nds-p-8 nds-rounded-md nds-text-body nds-text-muted-foreground"
        data-align="center"
        data-justify="center"
      >
        {$tStore('demonstration.labels.areaNoHint')}
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item>{$tStore('demonstration.labels.edit')}</ContextMenu.Item>
        <ContextMenu.Item>{$tStore('demonstration.labels.duplicate')}</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
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
  <DocsCompositions
    id="variantes"
    title={$tStore('variants.title')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="context-menu"
    items={[
      { name: 'default',      description: stripHtml($tStore('variants.items.default')),      code: codeDefault,           preview: variantDefault      },
      { name: 'destructive',  description: stripHtml($tStore('variants.items.destructive')),  code: codeDestructive,       preview: variantDestructive  },
      { name: 'Label + Inset',description: stripHtml($tStore('variants.items.label')),        code: codeVariantLabel,      preview: variantLabel        },
      {
        trackId: 'withCheckbox',
        name: $tStore('variants.items.withCheckbox.name'),
        description: $tStore('variants.items.withCheckbox.description'),
        useWhen: $tStore('variants.items.withCheckbox.use'),
        code: codeCompCheckbox,
        preview: variantWithCheckbox,
      },
      {
        trackId: 'withRadio',
        name: $tStore('variants.items.withRadio.name'),
        description: $tStore('variants.items.withRadio.description'),
        useWhen: $tStore('variants.items.withRadio.use'),
        code: codeCompRadio,
        preview: variantWithRadio,
      },
      {
        trackId: 'withSubmenu',
        name: $tStore('variants.items.withSubmenu.name'),
        description: $tStore('variants.items.withSubmenu.description'),
        useWhen: $tStore('variants.items.withSubmenu.use'),
        code: codeCompSubmenu,
        preview: variantWithSubmenu,
      },
      {
        trackId: 'withShortcuts',
        name: $tStore('variants.items.withShortcuts.name'),
        description: $tStore('variants.items.withShortcuts.description'),
        useWhen: $tStore('variants.items.withShortcuts.use'),
        code: codeCompShortcuts,
        preview: variantWithShortcuts,
      },
    ]}
  />

  {#snippet variantDefault()}
    <ContextMenu.Root onOpenChange={(o: boolean) => trackMenuOpen('default', 'docs_variantes', o)}>
      <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
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
    <ContextMenu.Root onOpenChange={(o: boolean) => trackMenuOpen('destructive', 'docs_variantes', o)}>
      <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
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

  {#snippet variantLabel()}
    <ContextMenu.Root onOpenChange={(o: boolean) => trackMenuOpen('label-inset', 'docs_variantes', o)}>
      <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
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

  {#snippet variantWithCheckbox()}
    <ContextMenu.Root onOpenChange={(o: boolean) => trackMenuOpen('with-checkbox', 'docs_variantes', o)}>
      <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
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

  {#snippet variantWithRadio()}
    <ContextMenu.Root onOpenChange={(o: boolean) => trackMenuOpen('with-radio', 'docs_variantes', o)}>
      <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
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

  {#snippet variantWithSubmenu()}
    <ContextMenu.Root onOpenChange={(o: boolean) => trackMenuOpen('with-submenu', 'docs_variantes', o)}>
      <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
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

  {#snippet variantWithShortcuts()}
    <ContextMenu.Root onOpenChange={(o: boolean) => trackMenuOpen('with-shortcuts', 'docs_variantes', o)}>
      <ContextMenu.Trigger class={areaClasse} data-align="center" data-justify="center">
        {$tStore('demonstration.labels.triggerLabel')}
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item>
          {$tStore('demonstration.labels.edit')}
          <ContextMenu.Shortcut>{$tStore('demonstration.labels.editShortcut')}</ContextMenu.Shortcut>
        </ContextMenu.Item>
        <ContextMenu.Item>
          {$tStore('demonstration.labels.duplicate')}
          <ContextMenu.Shortcut>Ctrl+D</ContextMenu.Shortcut>
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
      trigger: toPlainText($tStore('states.cols.trigger')),
      behavior: toPlainText($tStore('states.cols.behavior')),
    }}
    items={[
      { label: $tStore('states.closed.label'),   trigger: toPlainText($tStore('states.closed.trigger')),   behavior: toPlainText($tStore('states.closed.behavior'))},
      { label: $tStore('states.open.label'),      trigger: toPlainText($tStore('states.open.trigger')),      behavior: toPlainText($tStore('states.open.behavior'))},
      { label: $tStore('states.focused.label'),   trigger: toPlainText($tStore('states.focused.trigger')),   behavior: toPlainText($tStore('states.focused.behavior'))},
      { label: $tStore('states.disabled.label'),  trigger: toPlainText($tStore('states.disabled.trigger')),  behavior: toPlainText($tStore('states.disabled.behavior'))},
      { label: $tStore('states.checked.label'),   trigger: toPlainText($tStore('states.checked.trigger')),   behavior: toPlainText($tStore('states.checked.behavior'))},
      { label: $tStore('states.subOpen.label'),   trigger: toPlainText($tStore('states.subOpen.trigger')),   behavior: toPlainText($tStore('states.subOpen.behavior'))},
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
      // A coluna do meio é "Classe .nds-*" e trazia nome de utilitária do
      // Tailwind — vocabulário morto desde a migração. Cada linha aponta agora o
      // seletor que o CSS realmente usa, e cada token foi medido no navegador:
      // só `--elevation-md` muda a sombra (`--shadow` e `--shadow-md` não movem
      // nada), o separador é `--muted` e não `--border`, e o raio do item é
      // `--radius-sm`, não `--radius`.
      { token: '--popover',            value: '.nds-dropdown-menu-content',    description: $tStore('tokens.table.popoverBg')        },
      { token: '--popover-foreground', value: '.nds-dropdown-menu-content',    description: $tStore('tokens.table.popoverFg')        },
      { token: '--accent',             value: '.nds-dropdown-menu-item',       description: $tStore('tokens.table.accentBg')         },
      { token: '--accent-foreground',  value: '.nds-dropdown-menu-item',       description: $tStore('tokens.table.accentFg')         },
      { token: '--destructive',        value: '[data-variant="destructive"]',  description: $tStore('tokens.table.destructive')      },
      { token: '--destructive',        value: '.nds-dropdown-menu-item[data-variant="destructive"]:focus', description: $tStore('tokens.table.destructiveFocus') },
      { token: '--muted-foreground',   value: '.nds-dropdown-menu-shortcut',   description: $tStore('tokens.table.mutedFg')          },
      { token: '--muted-foreground',   value: '.nds-dropdown-menu-label',      description: $tStore('tokens.table.mutedFgLabel')     },
      { token: '--muted',              value: '.nds-dropdown-menu-separator',  description: $tStore('tokens.table.border')           },
      { token: '--border',             value: '.nds-dropdown-menu-content',    description: $tStore('tokens.table.popupBorder')      },
      { token: '--elevation-md',       value: '.nds-dropdown-menu-content',    description: $tStore('tokens.table.shadow')           },
      { token: '--radius',             value: '.nds-dropdown-menu-content',    description: $tStore('tokens.table.radius')           },
      { token: '--radius-sm',          value: '.nds-dropdown-menu-item',       description: $tStore('tokens.table.radiusItem')       },
      { token: '--z-popover',          value: '.nds-dropdown-menu-positioner', description: $tStore('tokens.table.zIndex')           },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeCustomizationTokens}
  />

  <!-- ── Acessibilidade ───────────────────────────────────────────────── -->
  <DocsAccessibility
    screenReaderTitle={$tNavStore('common.screenReader')}
    screenReaderItems={screenReaderItems}
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
      { key: 'Right-click / Menu / Shift+F10', description: $tStore('accessibility.keyboard.rightClick') },
      { key: 'Arrow Down',  description: $tStore('accessibility.keyboard.arrowDown')  },
      { key: 'Arrow Up',    description: $tStore('accessibility.keyboard.arrowUp')    },
      { key: 'Arrow Right', description: $tStore('accessibility.keyboard.arrowRight') },
      { key: 'Arrow Left',  description: $tStore('accessibility.keyboard.arrowLeft')  },
      { key: 'Home / End',  description: $tStore('accessibility.keyboard.homeEnd')    },
      { key: 'A–Z',         description: $tStore('accessibility.keyboard.typeahead')  },
      { key: 'Enter',       description: $tStore('accessibility.keyboard.enter')      },
      { key: 'Space',       description: $tStore('accessibility.keyboard.space')      },
      { key: 'Esc',         description: $tStore('accessibility.keyboard.escape')     },
      { key: 'Tab',         description: $tStore('accessibility.keyboard.tab')        },
    ]}
  />

  <!-- ── Relacionados ─────────────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'DropdownMenu', description: $tStore('related.dropdownMenu'), path: '?path=/docs/components-overlay-dropdownmenu--docs' },
      { name: 'Menubar',      description: $tStore('related.menubar'),      path: '?path=/docs/components-navigation-menubar--docs'      },
      { name: 'Dialog',       description: $tStore('related.dialog'),       path: '?path=/docs/components-overlay-dialog--docs'       },
      { name: 'AlertDialog',  description: $tStore('related.alertDialog'),  path: '?path=/docs/components-overlay-alertdialog--docs'  },
      { name: 'Tooltip',      description: $tStore('related.tooltip'),      path: '?path=/docs/components-overlay-tooltip--docs'      },
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
      trigger: toPlainText($tStore('analytics.table.trigger')),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: $tStore('analytics.table.menuOpen'),      trigger: toPlainText($tStore('analytics.table.menuOpenTrigger')),      payload: $tStore('analytics.table.menuOpenPayload')      },
      { event: $tStore('analytics.table.itemClick'),     trigger: toPlainText($tStore('analytics.table.itemClickTrigger')),     payload: $tStore('analytics.table.itemClickPayload')     },
      { event: $tStore('analytics.table.pageView'),      trigger: toPlainText($tStore('analytics.table.pageViewTrigger')),      payload: $tStore('analytics.table.pageViewPayload')      },
      { event: $tStore('analytics.table.sectionViewed'), trigger: toPlainText($tStore('analytics.table.sectionViewedTrigger')), payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),    trigger: toPlainText($tStore('analytics.table.langSwitchTrigger')),    payload: $tStore('analytics.table.langSwitchPayload')    },
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
      items: entriesFromDict($tStore, 'testes.functional', ['action', 'result', 'priority']).map(
        (entry) => ({ ...entry, priority: localPriority(entry.priority, $tNavStore) }),
      ),
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level:     'WCAG',
        how:       $tNavStore('common.howToVerify'),
      },
      items: stringsFromDict($tStore, 'testes.accessibility').map((criterion, i) => ({
        criterion,
        level: 'AA',
        how: a11yTestHow[i] ?? 'axe-core',
      })),
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story:    $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: entriesFromDict($tStore, 'testes.visual', ['story', 'priority']).map((entry) => ({
        ...entry,
        priority: localPriority(entry.priority, $tNavStore),
      })),
    }}
  />
</DocsPageLayout>
