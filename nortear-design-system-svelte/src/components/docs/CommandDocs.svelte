<script lang="ts">
  import { untrack } from 'svelte';
  import * as Command from '@/components/ui/command';
  import { Button } from '@/components/ui/button';

  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';

  import uiTranslations from '@/i18n/ui.json';
  import componentTranslations from '@shared/content/command/translations.json';

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
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);

  // Override só para o que é peça ou prop DESTA stack e não tem casa no
  // conteúdo compartilhado: as duas peças que só o bits-ui tem (anatomia 10 e
  // 11) e o `value` ligável do campo. Rótulo e descrição, nunca `*Code`.
  const { tStore } = useTranslation(componentTranslations, {
    'pt-BR': {
      'anatomy.item10': '<strong>CommandLinkItem</strong> — variante de <code>CommandItem</code> que renderiza como <code>&lt;a&gt;</code>, para o comando que navega. Aceita <code>href</code> e <code>target</code>.',
      'anatomy.item11': '<strong>CommandLoading</strong> — indicador de carregamento enquanto os resultados remotos chegam. Fica fora da <code>CommandList</code>, entre o campo e a lista: ele se anuncia como progresso, e a lista só aceita opções e grupos.',
      'props.table.inputValue': 'Texto da busca — é com ele que o filtro compara cada item. Aceita ligação nos dois sentidos.',
    },
    en: {
      'anatomy.item10': '<strong>CommandLinkItem</strong> — a <code>CommandItem</code> variant that renders as <code>&lt;a&gt;</code>, for commands that navigate. Accepts <code>href</code> and <code>target</code>.',
      'anatomy.item11': '<strong>CommandLoading</strong> — loading indicator while remote results arrive. It sits outside <code>CommandList</code>, between the field and the list: it announces itself as progress, and the list only accepts options and groups.',
      'props.table.inputValue': 'Search text — the filter matches each item against it. Supports two-way binding.',
    },
    es: {
      'anatomy.item10': '<strong>CommandLinkItem</strong> — variante de <code>CommandItem</code> que se renderiza como <code>&lt;a&gt;</code>, para el comando que navega. Acepta <code>href</code> y <code>target</code>.',
      'anatomy.item11': '<strong>CommandLoading</strong> — indicador de carga mientras llegan los resultados remotos. Queda fuera de la <code>CommandList</code>, entre el campo y la lista: se anuncia como progreso, y la lista solo acepta opciones y grupos.',
      'props.table.inputValue': 'Texto de la búsqueda — el filtro compara cada ítem con él. Admite enlace en los dos sentidos.',
    },
  });

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (componentTranslations as unknown as Record<
        string,
        { accessibility?: { screenReader?: Record<string, string> } }
      >)[$locale]?.accessibility?.screenReader ?? {},
    )
      .filter(([key]) => key !== 'title')
      .map(([, value]) => value),
  );

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'command',
    });
    track('docs_page_view', {
      component_name: 'command',
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
    track('docs_section_viewed', { section_id: id, component_name: 'command', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Analytics dos exemplos vivos ──────────────────────────────────────────
  //
  // `label` é o VALOR estável do item e `group` a chave estável do grupo —
  // nunca o texto traduzido, que partiria um evento em três no GA4. `location`
  // é a seção onde o elemento está (guideline 07): a demonstração, os cards de
  // Variantes e os previews do Do & Don't renderizam paleta viva, e um clique
  // ali é tão real quanto o outro.

  type GroupKey = 'components' | 'utils';
  type DocsLocation = 'docs_demo' | 'docs_variantes' | 'docs_do_dont';
  type Pattern = 'inline' | 'palette';

  function trackItemSelect(label: string, group: GroupKey, pattern: Pattern, location: DocsLocation) {
    track('command_item_select', { component: 'command', label, group, pattern, location });
  }

  function trackInlineSelect(label: string, group: GroupKey, location: DocsLocation) {
    trackItemSelect(label, group, 'inline', location);
  }

  // ─── Paleta da demonstração ──────────────────────────────────────────────────
  //
  // Só a demonstração abre paleta de verdade — pelo gatilho ou pelo Ctrl+K. O
  // card "palette" de Variantes é retrato estático (gatilho que não abre nada
  // e a paleta desenhada embaixo), como no Vanilla: por isso a abertura e a
  // escolha dentro do Dialog são sempre `docs_demo`.

  let paletteOpen = $state(false);

  /** Só ABRE — nunca alterna. Repetir o gesto não pode fechar o que se pediu. */
  function openPalette(trigger: 'keyboard' | 'button') {
    if (paletteOpen) return;
    paletteOpen = true;
    track('command_palette_open', { component: 'command', trigger, location: 'docs_demo' });
  }

  /** Escolher executa E fecha: a lib não fecha o hospedeiro sozinha. */
  function selectPaletteItem(label: string, group: GroupKey) {
    paletteOpen = false;
    trackItemSelect(label, group, 'palette', 'docs_demo');
  }

  /** O card "palette" de Variantes: a mesma paleta, desenhada inline, sem Dialog. */
  function selectPaletteCardItem(label: string, group: GroupKey) {
    trackItemSelect(label, group, 'palette', 'docs_variantes');
  }

  // A dica do atalho está no gatilho, então a página honra o atalho enquanto
  // está montada — dica que a página não cumpre é promessa falsa na frente de
  // quem está aprendendo o componente. O `$effect` remove o ouvinte ao
  // desmontar.
  $effect(() => {
    function onKeydown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return;
      // Sem isto o navegador leva o atalho para a barra de endereço.
      event.preventDefault();
      openPalette('keyboard');
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  });

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import * as Command from "@/components/ui/command";`;

  const codeImportWithDialog = `import * as Command from "@/components/ui/command";
// CommandDialog já está incluído no namespace Command`;

  const codeVariantInline = `<Command.Root>
  <Command.Input placeholder="Buscar componente..." />
  <Command.List>
    <Command.Group heading="Componentes">
      <Command.Item value="button">Button</Command.Item>
      <Command.Item value="input">Input</Command.Item>
    </Command.Group>
    <Command.Separator />
    <Command.Group heading="Utilitários">
      <Command.Item value="separator">Separator</Command.Item>
    </Command.Group>
  </Command.List>
  <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
</Command.Root>`;

  const codeVariantPalette = `<script lang="ts">
  import * as Command from "@/components/ui/command";
  import { Button } from "@/components/ui/button";

  let open = $state(false);

  function runCommand(value: string) {
    // roda o comando; fechar a paleta faz parte do gesto
    open = false;
  }

  $effect(() => {
    function onKeydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        // Só abre: repetir a tecla não fecha o que se acabou de pedir.
        open = true;
      }
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  });
<\/script>

<Button
  variant="outline"
  aria-haspopup="dialog"
  aria-expanded={open}
  onclick={() => (open = true)}
>
  Buscar
  <kbd class="nds-kbd">Ctrl+K</kbd>
</Button>

<Command.Dialog bind:open title="Command Palette" description="Busque por um comando ou ação...">
  <Command.Input placeholder="Buscar componente..." />
  <Command.List>
    <Command.Group heading="Componentes">
      <Command.Item value="button" onSelect={() => runCommand("button")}>
        Button
        <Command.Shortcut>Ctrl+B</Command.Shortcut>
      </Command.Item>
      <Command.Item value="input" onSelect={() => runCommand("input")}>
        Input
        <Command.Shortcut>Ctrl+I</Command.Shortcut>
      </Command.Item>
    </Command.Group>
    <Command.Separator />
    <Command.Group heading="Utilitários">
      <Command.Item value="separator" onSelect={() => runCommand("separator")}>Separator</Command.Item>
    </Command.Group>
  </Command.List>
  <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
</Command.Dialog>`;

  const codeVariantWithGroups = `<Command.Root>
  <Command.Input placeholder="Buscar componente..." />
  <Command.List>
    <Command.Group heading="Componentes">
      <Command.Item value="button">Button</Command.Item>
      <Command.Item value="input">Input</Command.Item>
      <Command.Item value="badge">Badge</Command.Item>
      <Command.Item value="separator">Separator</Command.Item>
    </Command.Group>
    <Command.Separator />
    <Command.Group heading="Utilitários">
      <Command.Item value="cn">cn()</Command.Item>
      <Command.Item value="clsx">clsx()</Command.Item>
      <Command.Item value="twmerge">twMerge()</Command.Item>
    </Command.Group>
  </Command.List>
  <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
</Command.Root>`;

  const interfaceCode = `// Command
interface CommandRootProps {
  value?: string;           // item em destaque (bindable)
  filter?: (value: string, search: string, keywords?: string[]) => number; // keywords já traz o rótulo
  shouldFilter?: boolean;   // padrão: true
  loop?: boolean;           // navegação em loop; padrão: false
  vimBindings?: boolean;    // Ctrl+N/J/P/K movem o destaque; padrão: false
  class?: string;
  children?: Snippet;
}

// CommandInput
interface CommandInputProps {
  value?: string;           // texto da busca (bindable)
  placeholder?: string;     // nomeia também a lista
  class?: string;
}

// CommandItem
interface CommandItemProps {
  value: string;            // obrigatório para o filtro
  disabled?: boolean;
  checked?: boolean;        // ausente = não marcável
  onSelect?: () => void;
  keywords?: string[];      // palavras extras; o rótulo (sem o atalho) já entra
  class?: string;
  children?: Snippet;
}

// CommandDialog
interface CommandDialogProps {
  open?: boolean;           // bindable
  onOpenChange?: (open: boolean) => void;
  title?: string;           // sr-only
  description?: string;     // sr-only
  showCloseButton?: boolean;
  class?: string;
  children: Snippet;
}

// CommandLinkItem
interface CommandLinkItemProps {
  href: string;
  target?: string;
  value?: string;
  disabled?: boolean;
  class?: string;
  children?: Snippet;
}

// CommandLoading
interface CommandLoadingProps {
  children?: Snippet;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="command">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ─────────────────────────────────────────────── -->
  <!-- Duas montagens e nada além: a inline e a paleta de verdade num Dialog.
       Todo rótulo sai de `demonstration.labels`; os atalhos dos comandos da
       paleta são teclas, iguais nos três idiomas. -->
  <DocsDemonstration componentSlug="command">
    <div class="nds-w-full nds-stack" data-spacing="xl" data-align="center">

      <!-- Demo 1: Inline -->
      <div class="nds-w-full nds-max-w-sm nds-rounded-md nds-border-default nds-shadow-md">
        <Command.Root>
          <Command.Input placeholder={$tStore('demonstration.labels.searchPlaceholder')} />
          <Command.List>
            <Command.Group heading={$tStore('demonstration.labels.groupComponents')}>
              <Command.Item value="button" onSelect={() => trackInlineSelect('button', 'components', 'docs_demo')}>{$tStore('demonstration.labels.itemButton')}</Command.Item>
              <Command.Item value="input" onSelect={() => trackInlineSelect('input', 'components', 'docs_demo')}>{$tStore('demonstration.labels.itemInput')}</Command.Item>
            </Command.Group>
            <Command.Separator />
            <Command.Group heading={$tStore('demonstration.labels.groupUtils')}>
              <Command.Item value="separator" onSelect={() => trackInlineSelect('separator', 'utils', 'docs_demo')}>{$tStore('demonstration.labels.itemSeparator')}</Command.Item>
            </Command.Group>
          </Command.List>
          <Command.Empty>{$tStore('demonstration.labels.emptyMessage')}</Command.Empty>
        </Command.Root>
      </div>

      <!-- Demo 2: a paleta real, aberta pelo gatilho ou pelo Ctrl+K -->
      {@render paletteTrigger(true, () => openPalette('button'))}
      <Command.Dialog
        bind:open={paletteOpen}
        title={$tStore('demonstration.labels.dialogTitle')}
        description={$tStore('demonstration.labels.dialogDescription')}
      >
        {@render paletteCommands(selectPaletteItem)}
      </Command.Dialog>

    </div>
  </DocsDemonstration>

  <!--
    Gatilho da paleta — a forma da story `CommandPalette` do Vanilla: botão
    outline com o texto `openPalette` e, DENTRO dele, a tecla. Sem
    `aria-label`: o nome acessível sai do texto visível (WCAG 2.5.3), e é o
    que quem usa comando de voz vai falar. `withHint = false` é o lado "não
    faça" do par 2 de Do & Don't — o mesmo botão sem a tecla.

    Só o gatilho que ABRE a paleta (o da demonstração, com `onclick`) anuncia
    o diálogo: `aria-haspopup` e `aria-expanded`, escritos à mão porque o
    CommandDialog não expõe gatilho — é o par que o Dialog do Vanilla escreve.
    Os estáticos (Do & Don't e o card de Variantes) ficam sem os dois: anunciar
    um diálogo que não existe seria promessa falsa.
  -->
  {#snippet paletteTrigger(withHint: boolean, onclick?: () => void)}
    <Button
      variant="outline"
      aria-haspopup={onclick ? 'dialog' : undefined}
      aria-expanded={onclick ? (paletteOpen ? 'true' : 'false') : undefined}
      {onclick}
    >
      {$tStore('demonstration.labels.openPalette')}
      {#if withHint}
        <kbd class="nds-kbd">{$tStore('demonstration.labels.shortcutKey')}</kbd>
      {/if}
    </Button>
  {/snippet}

  <!--
    O miolo da paleta — os comandos da demonstração, com o atalho de cada um
    (só desenho, C5). Um snippet só para o Dialog da demonstração e para o
    card "palette" de Variantes: os dois mostram a MESMA paleta, e o que muda
    é quem mede a escolha (e, no Dialog, quem fecha).
  -->
  {#snippet paletteCommands(select: (label: string, group: GroupKey) => void)}
    <Command.Input placeholder={$tStore('demonstration.labels.searchPlaceholder')} />
    <Command.List>
      <Command.Group heading={$tStore('demonstration.labels.groupComponents')}>
        <Command.Item value="button" onSelect={() => select('button', 'components')}>
          {$tStore('demonstration.labels.itemButton')}
          <Command.Shortcut>Ctrl+B</Command.Shortcut>
        </Command.Item>
        <Command.Item value="input" onSelect={() => select('input', 'components')}>
          {$tStore('demonstration.labels.itemInput')}
          <Command.Shortcut>Ctrl+I</Command.Shortcut>
        </Command.Item>
      </Command.Group>
      <Command.Separator />
      <Command.Group heading={$tStore('demonstration.labels.groupUtils')}>
        <Command.Item value="separator" onSelect={() => select('separator', 'utils')}>
          {$tStore('demonstration.labels.itemSeparator')}
        </Command.Item>
      </Command.Group>
    </Command.List>
    <Command.Empty>{$tStore('demonstration.labels.emptyMessage')}</Command.Empty>
  {/snippet}

  <!-- ── Anatomia ─────────────────────────────────────────────────── -->
  <DocsAnatomy
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

  <!-- ── Quando Usar ──────────────────────────────────────────────── -->
  <DocsWhenToUse
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
    do={{
      title: $tStore('usage.do.title'),
      items: [
        $tStore('usage.do.item1'),
        $tStore('usage.do.item2'),
        $tStore('usage.do.item3'),
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

  <!-- ── Do & Don't ───────────────────────────────────────────────── -->
  <DocsDoDont
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

  <!--
    Par 1: os dois lados JÁ nascem com a mesma busca sem correspondência — a do
    `emptyBuildDemo` do Vanilla. O que muda é haver ou não a frase: sem busca
    digitada, os dois lados mostravam a mesma lista cheia e o "não faça" não
    ilustrava coisa nenhuma.

    Os dois comandos não têm cabeçalho, e mesmo assim moram num grupo: é ele
    que dá o respiro de 4px, e sem nome ele não se anuncia como grupo (ver
    `command-group.svelte`). A escolha é medida como nas outras seções, com a
    chave do grupo a que os comandos pertencem na demonstração.
  -->
  {#snippet emptySearchDemo(withEmptyMessage: boolean)}
    <div class="nds-w-full nds-max-w-sm nds-rounded-md nds-border-default">
      <Command.Root>
        <Command.Input placeholder={$tStore('demonstration.labels.searchPlaceholder')} value="xyz" />
        <Command.List>
          <Command.Group>
            <Command.Item value="button" onSelect={() => trackInlineSelect('button', 'components', 'docs_do_dont')}>{$tStore('demonstration.labels.itemButton')}</Command.Item>
            <Command.Item value="input" onSelect={() => trackInlineSelect('input', 'components', 'docs_do_dont')}>{$tStore('demonstration.labels.itemInput')}</Command.Item>
          </Command.Group>
        </Command.List>
        {#if withEmptyMessage}
          <Command.Empty>{$tStore('demonstration.labels.emptyMessage')}</Command.Empty>
        {/if}
      </Command.Root>
    </div>
  {/snippet}
  {#snippet doPair1()}
    {@render emptySearchDemo(true)}
  {/snippet}
  {#snippet dontPair1()}
    {@render emptySearchDemo(false)}
  {/snippet}
  <!-- Par 2: o mesmo gatilho, com e sem a tecla dentro. -->
  {#snippet doPair2()}
    {@render paletteTrigger(true)}
  {/snippet}
  {#snippet dontPair2()}
    {@render paletteTrigger(false)}
  {/snippet}

  <!-- ── Importação ───────────────────────────────────────────────── -->
  <DocsImport
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryDescription={$tStore('import.withDialog')}
    secondaryCode={codeImportWithDialog}
  />

  <!-- ── Variantes ────────────────────────────────────────────────── -->
  <DocsCompositions
    id="variantes"
    note={$tStore('variants.note')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="command"
    items={[
      {
        trackId: 'inline',
        name: $tStore('variants.items.inline.name'),
        description: stripHtml($tStore('variants.items.inline.description')),
        code: codeVariantInline,
        preview: variantInline,
      },
      {
        trackId: 'palette',
        name: $tStore('variants.items.palette.name'),
        description: stripHtml($tStore('variants.items.palette.description')),
        code: codeVariantPalette,
        preview: variantPalette,
      },
      {
        trackId: 'withGroups',
        name: $tStore('variants.items.withGroups.name'),
        description: stripHtml($tStore('variants.items.withGroups.description')),
        useWhen: stripHtml($tStore('variants.items.withGroups.use')),
        code: codeVariantWithGroups,
        preview: variantWithGroups,
      },
    ]}
  />

  {#snippet variantInline()}
    <div class="nds-w-full nds-max-w-sm nds-rounded-md nds-border-default nds-shadow-md">
      <Command.Root>
        <Command.Input placeholder={$tStore('demonstration.labels.searchPlaceholder')} />
        <Command.List>
          <Command.Group heading={$tStore('demonstration.labels.groupComponents')}>
            <Command.Item value="button" onSelect={() => trackInlineSelect('button', 'components', 'docs_variantes')}>{$tStore('demonstration.labels.itemButton')}</Command.Item>
            <Command.Item value="input" onSelect={() => trackInlineSelect('input', 'components', 'docs_variantes')}>{$tStore('demonstration.labels.itemInput')}</Command.Item>
          </Command.Group>
          <Command.Separator />
          <Command.Group heading={$tStore('demonstration.labels.groupUtils')}>
            <Command.Item value="separator" onSelect={() => trackInlineSelect('separator', 'utils', 'docs_variantes')}>{$tStore('demonstration.labels.itemSeparator')}</Command.Item>
          </Command.Group>
        </Command.List>
        <Command.Empty>{$tStore('demonstration.labels.emptyMessage')}</Command.Empty>
      </Command.Root>
    </div>
  {/snippet}
  <!-- Retrato do padrão, na forma do Vanilla: o gatilho e, embaixo, o que ele
       abre. O gatilho é estático (sem `onclick`, sem anunciar diálogo) e nada
       abre aqui — a paleta que abre de verdade é a da demonstração, e só ela
       emite `command_palette_open`. A escolha na paleta desenhada é medida
       nesta seção, com `pattern: 'palette'`. -->
  {#snippet variantPalette()}
    <div class="nds-stack nds-p-2" data-spacing="xs" data-align="start">
      {@render paletteTrigger(true)}
      <div class="nds-w-full nds-max-w-sm nds-rounded-md nds-border-default nds-shadow-md">
        <Command.Root>
          {@render paletteCommands(selectPaletteCardItem)}
        </Command.Root>
      </div>
    </div>
  {/snippet}
  {#snippet variantWithGroups()}
    <div class="nds-w-full nds-max-w-sm nds-rounded-md nds-border-default nds-shadow-md">
      <Command.Root>
        <Command.Input placeholder={$tStore('demonstration.labels.searchPlaceholder')} />
        <Command.List>
          <Command.Group heading={$tStore('demonstration.labels.groupComponents')}>
            <Command.Item value="button" onSelect={() => trackInlineSelect('button', 'components', 'docs_variantes')}>{$tStore('demonstration.labels.itemButton')}</Command.Item>
            <Command.Item value="input" onSelect={() => trackInlineSelect('input', 'components', 'docs_variantes')}>{$tStore('demonstration.labels.itemInput')}</Command.Item>
            <Command.Item value="badge" onSelect={() => trackInlineSelect('badge', 'components', 'docs_variantes')}>Badge</Command.Item>
            <Command.Item value="separator" onSelect={() => trackInlineSelect('separator', 'components', 'docs_variantes')}>{$tStore('demonstration.labels.itemSeparator')}</Command.Item>
          </Command.Group>
          <Command.Separator />
          <Command.Group heading={$tStore('demonstration.labels.groupUtils')}>
            <Command.Item value="cn" onSelect={() => trackInlineSelect('cn', 'utils', 'docs_variantes')}>cn()</Command.Item>
            <Command.Item value="clsx" onSelect={() => trackInlineSelect('clsx', 'utils', 'docs_variantes')}>clsx()</Command.Item>
            <Command.Item value="twmerge" onSelect={() => trackInlineSelect('twmerge', 'utils', 'docs_variantes')}>twMerge()</Command.Item>
          </Command.Group>
        </Command.List>
        <Command.Empty>{$tStore('demonstration.labels.emptyMessage')}</Command.Empty>
      </Command.Root>
    </div>
  {/snippet}

  <!-- ── Estados ──────────────────────────────────────────────────── -->
  <DocsStates
    cols={{
      state: $tStore('states.cols.state'),
      trigger: toPlainText($tStore('states.cols.trigger')),
      behavior: toPlainText($tStore('states.cols.behavior')),
    }}
    items={[
      { label: $tStore('states.empty.label'),       trigger: toPlainText($tStore('states.empty.trigger')),       behavior: toPlainText($tStore('states.empty.behavior'))       },
      { label: $tStore('states.highlighted.label'), trigger: toPlainText($tStore('states.highlighted.trigger')), behavior: toPlainText($tStore('states.highlighted.behavior')) },
      { label: $tStore('states.selected.label'),    trigger: toPlainText($tStore('states.selected.trigger')),    behavior: toPlainText($tStore('states.selected.behavior'))    },
      { label: $tStore('states.disabled.label'),    trigger: toPlainText($tStore('states.disabled.trigger')),    behavior: toPlainText($tStore('states.disabled.behavior'))    },
      { label: $tStore('states.loading.label'),     trigger: toPlainText($tStore('states.loading.trigger')),     behavior: toPlainText($tStore('states.loading.behavior'))     },
      { label: $tStore('states.longList.label'),    trigger: toPlainText($tStore('states.longList.trigger')),    behavior: toPlainText($tStore('states.longList.behavior'))    },
    ]}
  />

  <!-- ── Propriedades ─────────────────────────────────────────────── -->
  <DocsProps
    tables={[
      {
        title: $tStore('props.commandTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'value',          type: 'string',                                   defaultValue: '""',  required: $tNavStore('common.no'), description: toPlainText($tStore('props.table.commandValue'))         },
          { name: 'filter',         type: '(value, search, keywords?) => number',     defaultValue: '—',   required: $tNavStore('common.no'), description: toPlainText($tStore('props.table.commandFilter'))        },
          { name: 'onValueChange',  type: '(value: string) => void',                  defaultValue: '—',   required: $tNavStore('common.no'), description: toPlainText($tStore('props.table.commandOnValueChange')) },
          { name: 'class',          type: 'string',                                   defaultValue: '—',   required: $tNavStore('common.no'), description: toPlainText($tStore('props.table.className'))            },
          { name: 'children',       type: 'Snippet',                                  defaultValue: '—',   required: $tNavStore('common.no'), description: toPlainText($tStore('props.table.children'))             },
        ],
      },
      {
        title: $tStore('props.commandInputTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'placeholder', type: 'string',  defaultValue: '—',    required: $tNavStore('common.no'), description: toPlainText($tStore('props.table.inputPlaceholder')) },
          { name: 'value',       type: 'string',  defaultValue: '""',   required: $tNavStore('common.no'), description: toPlainText($tStore('props.table.inputValue'))       },
          { name: 'class',       type: 'string',  defaultValue: '—',    required: $tNavStore('common.no'), description: toPlainText($tStore('props.table.className'))        },
        ],
      },
      {
        title: $tStore('props.commandItemTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'value',    type: 'string',   defaultValue: '—',     required: $tNavStore('common.yes'), description: toPlainText($tStore('props.table.itemValue'))    },
          { name: 'disabled', type: 'boolean',  defaultValue: 'false', required: $tNavStore('common.no'),  description: toPlainText($tStore('props.table.itemDisabled')) },
          { name: 'checked',  type: 'boolean',  defaultValue: '—',     required: $tNavStore('common.no'),  description: toPlainText($tStore('props.table.checked'))      },
          // `onSelect` (camelCase) e sem argumento: o valor escolhido é o
          // `value` do próprio item, que o call site já tem em mãos.
          { name: 'onSelect', type: '() => void', defaultValue: '—',   required: $tNavStore('common.no'),  description: toPlainText($tStore('props.table.itemOnSelect')) },
          { name: 'class',    type: 'string',   defaultValue: '—',     required: $tNavStore('common.no'),  description: toPlainText($tStore('props.table.className'))    },
          { name: 'children', type: 'Snippet',  defaultValue: '—',     required: $tNavStore('common.no'),  description: toPlainText($tStore('props.table.children'))     },
        ],
      },
      {
        title: $tStore('props.commandDialogTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'open',             type: 'boolean',                 defaultValue: 'false',                            required: $tNavStore('common.no'),  description: toPlainText($tStore('props.table.open'))                  },
          { name: 'onOpenChange',     type: '(open: boolean) => void', defaultValue: '—',                                required: $tNavStore('common.no'),  description: toPlainText($tStore('props.table.onOpenChange'))          },
          { name: 'title',            type: 'string',                  defaultValue: '"Command Palette"',                required: $tNavStore('common.no'),  description: toPlainText($tStore('props.table.dialogTitle'))           },
          { name: 'description',      type: 'string',                  defaultValue: '"Search for a command to run..."', required: $tNavStore('common.no'),  description: toPlainText($tStore('props.table.dialogDescription'))     },
          { name: 'showCloseButton',  type: 'boolean',                 defaultValue: 'false',                            required: $tNavStore('common.no'),  description: toPlainText($tStore('props.table.dialogShowCloseButton')) },
          { name: 'class',            type: 'string',                  defaultValue: '—',                                required: $tNavStore('common.no'),  description: toPlainText($tStore('props.table.className'))             },
          { name: 'children',         type: 'Snippet',                 defaultValue: '—',                                required: $tNavStore('common.yes'), description: toPlainText($tStore('props.table.children'))              },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={$tStore('props.extensibility')}
  />

  <!-- ── Tokens ───────────────────────────────────────────────────── -->
  <!-- A coluna do meio é o SELETOR REAL da folha compartilhada
       (`docs/shared/styles/nds/command.css`). O raio do item é o aninhado
       (`--radius-sm`), não o da paleta. -->
  <DocsTokens
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      { token: '--popover',            value: '.nds-command',                            description: toPlainText($tStore('tokens.table.popoverBg'))   },
      { token: '--popover-foreground', value: '.nds-command',                            description: toPlainText($tStore('tokens.table.popoverFg'))   },
      { token: '--foreground',         value: '.nds-command-group',                      description: toPlainText($tStore('tokens.table.groupFg'))     },
      { token: '--muted-foreground',   value: '.nds-command-group-heading',              description: toPlainText($tStore('tokens.table.mutedFg'))     },
      { token: '--border',             value: '.nds-command-input-wrapper',              description: toPlainText($tStore('tokens.table.inputBorder')) },
      { token: '--accent',             value: '.nds-command-item[aria-selected="true"]', description: toPlainText($tStore('tokens.table.selectedBg'))  },
      { token: '--accent-foreground',  value: '.nds-command-item[aria-selected="true"]', description: toPlainText($tStore('tokens.table.selectedFg'))  },
      { token: '--border',             value: '.nds-command-separator',                  description: toPlainText($tStore('tokens.table.border'))      },
      { token: '--radius',             value: '.nds-command',                            description: toPlainText($tStore('tokens.table.radius'))      },
      { token: '--radius-sm',          value: '.nds-command-item',                       description: toPlainText($tStore('tokens.table.radiusSm'))    },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ───────────────────────────────────────────── -->
  <DocsAccessibility
    screenReaderTitle={$tNavStore('common.screenReader')}
    screenReaderItems={screenReaderItems}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.item1'),
      $tStore('accessibility.item2'),
      $tStore('accessibility.item3'),
    ]}
    keyboardTitle={$tNavStore('common.keyboardNav')}
    keyboardItems={[
      { key: 'Arrow Down', description: toPlainText($tStore('accessibility.keyboard.arrowDown')) },
      { key: 'Arrow Up',   description: toPlainText($tStore('accessibility.keyboard.arrowUp'))   },
      { key: 'Enter',      description: toPlainText($tStore('accessibility.keyboard.enter'))     },
      { key: 'Escape',     description: toPlainText($tStore('accessibility.keyboard.escape'))    },
      { key: 'Tab',        description: toPlainText($tStore('accessibility.keyboard.tab'))       },
      { key: 'Ctrl+K',     description: toPlainText($tStore('accessibility.keyboard.cmdK'))      },
    ]}
  />

  <!-- ── Relacionados ─────────────────────────────────────────────── -->
  <DocsRelated
    items={[
      { name: 'Select',        description: $tStore('related.select'),       path: '?path=/docs/components-form-select--docs'       },
      { name: 'DropdownMenu',  description: $tStore('related.dropdownMenu'), path: '?path=/docs/components-overlay-dropdownmenu--docs' },
      { name: 'Dialog',        description: $tStore('related.dialog'),       path: '?path=/docs/components-overlay-dialog--docs'       },
    ]}
  />

  <!-- ── Notas ────────────────────────────────────────────────────── -->
  <DocsNotes
    items={[
      { title: '', content: $tStore('notes.tip1') },
      { title: '', content: $tStore('notes.tip2') },
      { title: '', content: $tStore('notes.tip3') },
    ]}
  />

  <!-- ── Analytics ────────────────────────────────────────────────── -->
  <DocsAnalytics
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: toPlainText($tStore('analytics.table.trigger')),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: $tStore('analytics.table.itemSelect'),    trigger: toPlainText($tStore('analytics.table.itemSelectTrigger')),    payload: $tStore('analytics.table.itemSelectPayload')    },
      { event: $tStore('analytics.table.paletteOpen'),   trigger: toPlainText($tStore('analytics.table.paletteOpenTrigger')),   payload: $tStore('analytics.table.paletteOpenPayload')   },
      { event: $tStore('analytics.table.pageView'),      trigger: toPlainText($tStore('analytics.table.pageViewTrigger')),      payload: $tStore('analytics.table.pageViewPayload')      },
      { event: $tStore('analytics.table.sectionViewed'), trigger: toPlainText($tStore('analytics.table.sectionViewedTrigger')), payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),    trigger: toPlainText($tStore('analytics.table.langSwitchTrigger')),    payload: $tStore('analytics.table.langSwitchPayload')    },
    ]}
  />

  <!-- ── Testes ───────────────────────────────────────────────────── -->
  <DocsTestes
    functional={{
      title: $tStore('testes.functional.title'),
      description: $tStore('testes.functional.description'),
      cols: {
        action: $tNavStore('common.userAction'),
        result: $tNavStore('common.expectedResult'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
        action: $tStore(`testes.functional.item${i}.action`),
        result: $tStore(`testes.functional.item${i}.result`),
        priority: localPriority($tStore(`testes.functional.item${i}.priority`), $tNavStore),
      })),
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      description: $tStore('testes.accessibility.description'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      // Nível e método iguais nos três idiomas, como na stack de referência:
      // "manual" não se traduz nas três línguas, e o nome da ferramenta também não.
      items: [1, 2, 3, 4].map((i) => ({
        criterion: $tStore(`testes.accessibility.item${i}`),
        level: 'AA',
        how: 'axe-core / manual',
      })),
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      description: $tStore('testes.visual.description'),
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
