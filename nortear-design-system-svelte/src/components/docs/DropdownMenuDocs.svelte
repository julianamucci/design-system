<script lang="ts">
  import { untrack } from 'svelte';
  import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuGroupHeading,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
  } from '@/components/ui/dropdown-menu';
  import { Button } from '@/components/ui/button';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DOMPurify from 'dompurify';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import dropdownMenuTranslations from '@shared/content/dropdown-menu/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(dropdownMenuTranslations);

  /**
   * Varre `base.item1`, `base.item2`, … enquanto existirem no conteúdo.
   *
   * Citar índice por índice trava a lista no tamanho de hoje: o conteúdo
   * compartilhado ganha um item e ele simplesmente não existe para quem lê —
   * sem erro, sem aviso, nos três idiomas de uma vez. Foi o que aconteceu com o
   * sétimo critério de acessibilidade deste componente.
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

  // Nível WCAG e ferramenta ficam aqui, e não no conteúdo compartilhado, porque
  // são IDENTIFICADORES (número de critério, nome do verificador) e
  // identificador não se traduz. Item além da lista cai no par padrão.
  const a11yTestLevels = ['AA', '4.1.2', '4.1.2', '4.1.2', '2.4.3', '1.4.3', '4.1.2'];
  const a11yTestHow = [
    'axe-core',
    'DOM inspection',
    'DOM inspection',
    'DOM inspection',
    'Keyboard test',
    'Contrast analyzer',
    'Keyboard test',
  ];

  /**
   * A demonstração é produto: quem abre um menu aqui dispara o mesmo evento que
   * o componente dispararia num app. O payload leva o IDENTIFICADOR do menu e do
   * item, nunca o rótulo traduzido — texto localizado partiria o mesmo evento em
   * um por idioma no GA4.
   *
   * `location` é a SEÇÃO onde o elemento está. Estes dois handlers atendem
   * apenas a demonstração, e é por isso que o valor é fixo dentro deles;
   * preview vivo de outra seção pede o `docs_<section-id>` daquela seção.
   */
  function trackMenuOpenChange(menu: string, isOpen: boolean): void {
    track(isOpen ? 'dropdown_menu_open' : 'dropdown_menu_close', {
      component: 'dropdown-menu',
      label: menu,
      location: 'docs_demo',
    });
  }

  function trackMenuItemSelect(menu: string, item: string): void {
    track('dropdown_menu_item_select', {
      component: 'dropdown-menu',
      label: item,
      menu,
      location: 'docs_demo',
    });
  }

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (dropdownMenuTranslations as unknown as Record<
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
      componentSlug: 'dropdown-menu',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: 'Overlay', item: '/components/overlay' },
        { name: 'DropdownMenu' },
      ],
    });
    track('docs_page_view', {
      component_name: 'dropdown-menu',
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
    track('docs_section_viewed', { section_id: id, component_name: 'dropdown-menu', locale: $locale });
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

  // ─── State para demos interativos ────────────────────────────────────────────

  // Os valores iniciais são os da story e os do snippet do painel Code: Nome
  // marcado, E-mail e Função não, e a aparência em "Claro". Nascia com o e-mail
  // marcado e o tema em "Sistema" — a prévia dizia uma coisa e o código logo
  // abaixo dela dizia outra, que é a deriva medida no vanilla.
  //
  // `variantCheckbox` e `variantRadio` viviam aqui sem uso: estado morto que
  // nenhum dos cinco portões abre, porque `$state` sem leitor não é erro.
  let demoShowName = $state(true);
  let demoShowEmail = $state(false);
  let demoShowRole = $state(false);
  let demoTheme = $state('light');

  // Compositions interactive state
  let compShowName = $state(true);
  let compShowEmail = $state(false);
  let compShowRole = $state(false);
  let compTheme = $state('light');

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupHeading,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";`;

  const codeImportUsage = `<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Abrir menu</Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent side="bottom" align="start">
    <DropdownMenuLabel>Conta</DropdownMenuLabel>
    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuItem>Configurações</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`;

  const codeDefault = `<DropdownMenuItem>Perfil</DropdownMenuItem>`;
  const codeDestructive = `<DropdownMenuItem variant="destructive">
  Excluir conta
</DropdownMenuItem>`;

  const interfaceCode = `// DropdownMenu (Root)
interface DropdownMenuProps {
  open?: boolean;               // bindável: também define o estado inicial
  onOpenChange?: (open: boolean) => void;
  dir?: 'ltr' | 'rtl';
}

// DropdownMenuContent
interface DropdownMenuContentProps {
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
}

// DropdownMenuItem
interface DropdownMenuItemProps {
  variant?: 'default' | 'destructive';
  inset?: boolean;
  disabled?: boolean;
  onSelect?: (e: Event) => void;
}

// DropdownMenuCheckboxItem
interface DropdownMenuCheckboxItemProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

// DropdownMenuRadioGroup
interface DropdownMenuRadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
}`;

  const propsTableCols = $derived({
    prop: $tStore('props.table.prop'),
    type: $tStore('props.table.type'),
    default: $tStore('props.table.default'),
    required: $tStore('props.table.required'),
    description: $tStore('props.table.description'),
  });
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="dropdown-menu">
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
    <div class="nds-cluster nds-w-full" data-justify="center" data-spacing="md" style="flex-wrap: wrap; contain: layout">
      <DropdownMenu onOpenChange={(o: boolean) => trackMenuOpenChange('acoes', o)}>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('demonstration.labels.basic')}</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <!--
            `Group` + `GroupHeading` é a dupla que dá NOME ao agrupamento: o
            heading vira o `aria-labelledby` do grupo, que é o que a ficha de
            `Com Label` promete a quem lê. Um `Label` solto rotula visualmente e
            não nomeia nada.
          -->
          <DropdownMenuGroup>
            <DropdownMenuGroupHeading>Conta</DropdownMenuGroupHeading>
            <DropdownMenuItem onSelect={() => trackMenuItemSelect('acoes', 'perfil')}>Perfil</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => trackMenuItemSelect('acoes', 'configuracoes')}>Configurações</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => trackMenuItemSelect('acoes', 'sair')}>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu onOpenChange={(o: boolean) => trackMenuOpenChange('colunas', o)}>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('demonstration.labels.withCheckbox')}</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <!--
            O identificador do item é o da COLUNA, não o rótulo traduzido:
            "Função"/"Role"/"Rol" partiriam o mesmo evento em três no GA4.
          -->
          <DropdownMenuCheckboxItem
            checked={demoShowName}
            onCheckedChange={(v) => (demoShowName = v)}
            onSelect={() => trackMenuItemSelect('colunas', 'nome')}
          >
            Nome
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={demoShowEmail}
            onCheckedChange={(v) => (demoShowEmail = v)}
            onSelect={() => trackMenuItemSelect('colunas', 'email')}
          >
            E-mail
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={demoShowRole}
            onCheckedChange={(v) => (demoShowRole = v)}
            onSelect={() => trackMenuItemSelect('colunas', 'funcao')}
          >
            Função
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu onOpenChange={(o: boolean) => trackMenuOpenChange('tema', o)}>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('demonstration.labels.withRadio')}</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuLabel>Aparência</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup bind:value={demoTheme}>
            <DropdownMenuRadioItem
              value="light"
              onSelect={() => trackMenuItemSelect('tema', 'light')}
            >
              Claro
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="dark"
              onSelect={() => trackMenuItemSelect('tema', 'dark')}
            >
              Escuro
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="system"
              onSelect={() => trackMenuItemSelect('tema', 'system')}
            >
              Sistema
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu onOpenChange={(o: boolean) => trackMenuOpenChange('submenu', o)}>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{$tStore('demonstration.labels.withSubmenu')}</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuItem onSelect={() => trackMenuItemSelect('submenu', 'renomear')}>Renomear</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => trackMenuItemSelect('submenu', 'pdf')}>PDF</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => trackMenuItemSelect('submenu', 'csv')}>CSV</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
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
        { element: $tStore('usage.uxWriting.table.label.name'),       rules: $tStore('usage.uxWriting.table.label.format'),       do: $tStore('usage.uxWriting.table.label.good'),       dont: $tStore('usage.uxWriting.table.label.bad') },
        { element: $tStore('usage.uxWriting.table.item.name'),        rules: $tStore('usage.uxWriting.table.item.format'),        do: $tStore('usage.uxWriting.table.item.good'),        dont: $tStore('usage.uxWriting.table.item.bad') },
        { element: $tStore('usage.uxWriting.table.destructive.name'), rules: $tStore('usage.uxWriting.table.destructive.format'), do: $tStore('usage.uxWriting.table.destructive.good'), dont: $tStore('usage.uxWriting.table.destructive.bad') },
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
      <DropdownMenu>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>Conta</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuGroupHeading>Conta</DropdownMenuGroupHeading>
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuGroupHeading>Equipe</DropdownMenuGroupHeading>
            <DropdownMenuItem>Convidar</DropdownMenuItem>
            <DropdownMenuItem>Membros</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div style="contain: layout">
      <DropdownMenu>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>Tudo</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <!--
            Dez itens planos, que é o número da legenda: com seis a lista ainda
            parece curta, e o "vira lista de scroll" não aparece.
          -->
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Configurações</DropdownMenuItem>
          <DropdownMenuItem>Convidar</DropdownMenuItem>
          <DropdownMenuItem>Membros</DropdownMenuItem>
          <DropdownMenuItem>Faturas</DropdownMenuItem>
          <DropdownMenuItem>Assinatura</DropdownMenuItem>
          <DropdownMenuItem>Notificações</DropdownMenuItem>
          <DropdownMenuItem>Integrações</DropdownMenuItem>
          <DropdownMenuItem>Suporte</DropdownMenuItem>
          <DropdownMenuItem>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div style="contain: layout">
      <DropdownMenu>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>Ações</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Editar</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div style="contain: layout">
      <DropdownMenu>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>Ações</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Editar</DropdownMenuItem>
          <DropdownMenuItem>Excluir conta</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    code={codeImportBasic}
    secondaryCode={codeImportUsage}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsCompositions
    id="variantes"
    title={$tStore('variants.title')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="dropdown-menu"
    items={[
      { trackId: 'default', name: $tStore('variants.items.default'),     description: stripHtml($tStore('variants.styles.default')),     code: codeDefault,     preview: variantDefault     },
      { trackId: 'destructive', name: $tStore('variants.items.destructive'), description: stripHtml($tStore('variants.styles.destructive')), code: codeDestructive, preview: variantDestructive },
      {
        trackId: 'withLabel',
        name: $tStore('variants.items.withLabel.name'),
        description: $tStore('variants.items.withLabel.description'),
        useWhen: $tStore('variants.items.withLabel.use'),
        code: `<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Conta</Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuGroup>
      <DropdownMenuGroupHeading>Conta</DropdownMenuGroupHeading>
      <DropdownMenuItem>Perfil</DropdownMenuItem>
      <DropdownMenuItem>Configurações</DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuGroupHeading>Suporte</DropdownMenuGroupHeading>
      <DropdownMenuItem>Documentação</DropdownMenuItem>
      <DropdownMenuItem>Sair</DropdownMenuItem>
    </DropdownMenuGroup>
  </DropdownMenuContent>
</DropdownMenu>`,
        preview: variantWithLabel,
      },
      {
        trackId: 'withCheckboxItems',
        name: $tStore('variants.items.withCheckboxItems.name'),
        description: $tStore('variants.items.withCheckboxItems.description'),
        useWhen: $tStore('variants.items.withCheckboxItems.use'),
        code: `<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Colunas</Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuCheckboxItem bind:checked={showName}>Nome</DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem bind:checked={showEmail}>E-mail</DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem bind:checked={showRole}>Função</DropdownMenuCheckboxItem>
  </DropdownMenuContent>
</DropdownMenu>`,
        preview: variantWithCheckboxItems,
      },
      {
        trackId: 'withRadioGroup',
        name: $tStore('variants.items.withRadioGroup.name'),
        description: $tStore('variants.items.withRadioGroup.description'),
        useWhen: $tStore('variants.items.withRadioGroup.use'),
        code: `<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Tema</Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Aparência</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuRadioGroup bind:value={theme}>
      <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>`,
        preview: variantWithRadioGroup,
      },
      {
        trackId: 'withShortcuts',
        name: $tStore('variants.items.withShortcuts.name'),
        description: $tStore('variants.items.withShortcuts.description'),
        useWhen: $tStore('variants.items.withShortcuts.use'),
        code: `<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Editar</Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>
      Desfazer
      <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem>
      Copiar
      <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      Colar
      <DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
        preview: variantWithShortcuts,
      },
    ]}
  />

  {#snippet variantDefault()}
    <div style="contain: layout">
      <DropdownMenu>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>Default</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Configurações</DropdownMenuItem>
          <DropdownMenuItem>Equipe</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}
  {#snippet variantDestructive()}
    <div style="contain: layout">
      <DropdownMenu>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>Destructive</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Editar</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}

  {#snippet variantWithLabel()}
    <div class="nds-min-h-60" style="contain: layout">
      <DropdownMenu>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="sm" {...props}>Conta</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuGroup>
            <DropdownMenuGroupHeading>Conta</DropdownMenuGroupHeading>
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuGroupHeading>Suporte</DropdownMenuGroupHeading>
            <DropdownMenuItem>Documentação</DropdownMenuItem>
            <DropdownMenuItem>Sair</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}

  {#snippet variantWithCheckboxItems()}
    <div class="nds-min-h-50" style="contain: layout">
      <DropdownMenu>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="sm" {...props}>Colunas</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={compShowName}
            onCheckedChange={(v) => (compShowName = v)}
          >
            Nome
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={compShowEmail}
            onCheckedChange={(v) => (compShowEmail = v)}
          >
            E-mail
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={compShowRole}
            onCheckedChange={(v) => (compShowRole = v)}
          >
            Função
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}

  {#snippet variantWithRadioGroup()}
    <div class="nds-min-h-50" style="contain: layout">
      <DropdownMenu>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="sm" {...props}>Tema</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuLabel>Aparência</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup bind:value={compTheme}>
            <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/snippet}

  {#snippet variantWithShortcuts()}
    <div class="nds-min-h-60" style="contain: layout">
      <DropdownMenu>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="sm" {...props}>Editar</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuItem>
            Desfazer
            <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Copiar
            <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            Colar
            <DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
      { label: $tStore('states.closed.label'),   trigger: toPlainText($tStore('states.closed.trigger')),   behavior: toPlainText($tStore('states.closed.behavior')) },
      { label: $tStore('states.open.label'),     trigger: toPlainText($tStore('states.open.trigger')),     behavior: toPlainText($tStore('states.open.behavior')) },
      { label: $tStore('states.disabled.label'), trigger: toPlainText($tStore('states.disabled.trigger')), behavior: toPlainText($tStore('states.disabled.behavior')) },
      { label: $tStore('states.checked.label'),  trigger: toPlainText($tStore('states.checked.trigger')),  behavior: toPlainText($tStore('states.checked.behavior')) },
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
          // `defaultOpen` e `modal` não entram: não existem na API deste stack —
          // eram aceitos e ignorados em silêncio. O estado inicial sai do
          // próprio `open`, que é bindável, e o bloqueio de interação não é
          // configurável aqui. Documentar prop que o componente ignora é
          // prometer o que o produto não cumpre.
          { name: 'side',         type: $tStore('props.table.side.type'),         defaultValue: $tStore('props.table.side.default'),         required: $tStore('props.table.side.required'),         description: $tStore('props.table.side.description')         },
          { name: 'align',        type: $tStore('props.table.align.type'),        defaultValue: $tStore('props.table.align.default'),        required: $tStore('props.table.align.required'),        description: $tStore('props.table.align.description')        },
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
      { token: '--popover',            value: $tStore('tokens.table.background.class'),  description: $tStore('tokens.table.background.part')  },
      { token: '--popover-foreground', value: $tStore('tokens.table.foreground.class'),  description: $tStore('tokens.table.foreground.part')  },
      { token: '--border',             value: $tStore('tokens.table.border.class'),      description: $tStore('tokens.table.border.part')      },
      { token: '--elevation-md',             value: $tStore('tokens.table.shadow.class'),      description: $tStore('tokens.table.shadow.part')      },
      { token: '--radius',             value: $tStore('tokens.table.rounded.class'),     description: $tStore('tokens.table.rounded.part')     },
      { token: '--accent',             value: $tStore('tokens.table.itemHover.class'),   description: $tStore('tokens.table.itemHover.part')   },
      { token: '--destructive',        value: $tStore('tokens.table.destructive.class'), description: $tStore('tokens.table.destructive.part') },
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
      $tStore('accessibility.items.item1'),
      $tStore('accessibility.items.item2'),
      $tStore('accessibility.items.item3'),
      $tStore('accessibility.items.item4'),
      $tStore('accessibility.items.item5'),
      $tStore('accessibility.items.item6'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',                description: $tStore('accessibility.keyboard.tab')       },
      { key: 'Arrow Up / Arrow Down',                description: $tStore('accessibility.keyboard.arrows')    },
      { key: 'Enter / Space',      description: $tStore('accessibility.keyboard.enter')     },
      { key: 'Escape',             description: $tStore('accessibility.keyboard.escape')    },
      { key: 'Home / End',         description: $tStore('accessibility.keyboard.homeEnd')   },
      { key: 'A-Z',                description: $tStore('accessibility.keyboard.typeahead') },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.contextMenu.name'), description: $tStore('related.items.contextMenu.description'), path: '?path=/docs/components-overlay-contextmenu--docs' },
      { name: $tStore('related.items.menubar.name'),     description: $tStore('related.items.menubar.description'),     path: '?path=/docs/components-navigation-menubar--docs'     },
      { name: $tStore('related.items.command.name'),     description: $tStore('related.items.command.description'),     path: '?path=/docs/components-overlay-command--docs'     },
      { name: $tStore('related.items.popover.name'),     description: $tStore('related.items.popover.description'),     path: '?path=/docs/components-overlay-popover--docs'     },
      { name: $tStore('related.items.select.name'),      description: $tStore('related.items.select.description'),      path: '?path=/docs/components-form-select--docs'      },
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
      { event: 'dropdown_menu_open',        trigger: 'onOpenChange(true)',  payload: "{ component: 'dropdown-menu', location, label }" },
      { event: 'dropdown_menu_close',       trigger: 'onOpenChange(false)', payload: "{ component: 'dropdown-menu', location, label }" },
      { event: 'dropdown_menu_item_select', trigger: 'onSelect',            payload: "{ component: 'dropdown-menu', location, label, menu }" },
      { event: '—',                         trigger: stripHtml($tStore('analytics.description')), payload: '—' },
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
      items: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
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
      items: stringsFromDict($tStore, 'testes.accessibility').map((criterion, i) => ({
        criterion: toPlainText(criterion),
        level: a11yTestLevels[i] ?? 'AA',
        how: a11yTestHow[i] ?? 'axe-core',
      })),
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

<!-- DOMPurify.sanitize available para uso futuro em {@html} dinâmico -->
{#if false}
  {@html DOMPurify.sanitize('')}
{/if}
