<script lang="ts">
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog';
  import { Button } from '@/components/ui/button';
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
  import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(alertDialogTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'alert-dialog',
    });
    track('docs_page_view', {
      component_name: 'alert-dialog',
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
    track('docs_section_viewed', { section_id: id, component_name: 'alert-dialog', locale: $locale });
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";`;

  const codeImportWithTrigger = `import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  // ...
} from "@/components/ui/alert-dialog";`;

  const codeDestructive = `<AlertDialog>
  <AlertDialogTrigger>
    {#snippet child({ props })}
      <Button variant="destructive" {...props}>Excluir conta</Button>
    {/snippet}
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
      <AlertDialogDescription>
        Todos os dados serão removidos. Esta ação não pode ser desfeita.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
        Excluir conta
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

  const codeDefault = `<AlertDialog>
  <AlertDialogTrigger>
    {#snippet child({ props })}
      <Button {...props}>Sair da conta</Button>
    {/snippet}
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
      <AlertDialogDescription>
        Você precisará entrar novamente para acessar seus dados.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction>Sair</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

  const codeCustomizationTokens = `/* Em globals.css — override do AlertDialog via tokens */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --border: 240 5.9% 90%;
  --destructive: 0 84% 60%;
  --radius: 0.5rem;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --destructive: 0 62.8% 30.6%;
}`;

  const interfaceCode = `// AlertDialog (Root)
interface AlertDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: Snippet;
}

// AlertDialogTrigger / AlertDialogAction / AlertDialogCancel
interface TriggerProps { class?: string; child?: Snippet<[{ props: Record<string, any> }]> }
interface ActionProps  { onclick?: (e: MouseEvent) => void; class?: string }
interface CancelProps  { onclick?: (e: MouseEvent) => void; class?: string }`;

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
      installNote="npx shadcn-svelte@latest add alert-dialog"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="flex flex-wrap items-center justify-center gap-4 w-full">
        <AlertDialog>
          <AlertDialogTrigger>
            {#snippet child({ props })}
              <Button variant="destructive" {...props}>{$tStore('demonstration.labels.triggerLabel')}</Button>
            {/snippet}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{$tStore('demonstration.labels.title')}</AlertDialogTitle>
              <AlertDialogDescription>{$tStore('demonstration.labels.description')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{$tStore('demonstration.labels.cancel')}</AlertDialogCancel>
              <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {$tStore('demonstration.labels.action')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger>
            {#snippet child({ props })}
              <Button {...props}>{$tStore('demonstration.labels.neutralTriggerLabel')}</Button>
            {/snippet}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{$tStore('demonstration.labels.neutralTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{$tStore('demonstration.labels.neutralDescription')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{$tStore('demonstration.labels.cancel')}</AlertDialogCancel>
              <AlertDialogAction>{$tStore('demonstration.labels.neutralAction')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
        { element: $tStore('usage.uxWriting.table.title.name'),       rules: $tStore('usage.uxWriting.table.title.format'),       do: $tStore('usage.uxWriting.table.title.good'),       dont: $tStore('usage.uxWriting.table.title.bad') },
        { element: $tStore('usage.uxWriting.table.description.name'), rules: $tStore('usage.uxWriting.table.description.format'), do: $tStore('usage.uxWriting.table.description.good'), dont: $tStore('usage.uxWriting.table.description.bad') },
        { element: $tStore('usage.uxWriting.table.action.name'),      rules: $tStore('usage.uxWriting.table.action.format'),      do: $tStore('usage.uxWriting.table.action.good'),      dont: $tStore('usage.uxWriting.table.action.bad') },
        { element: $tStore('usage.uxWriting.table.cancel.name'),      rules: $tStore('usage.uxWriting.table.cancel.format'),      do: $tStore('usage.uxWriting.table.cancel.good'),      dont: $tStore('usage.uxWriting.table.cancel.bad') },
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
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir conta</AlertDialogTitle>
          <AlertDialogDescription>Todos os dados serão removidos. Esta ação não pode ser desfeita.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  {/snippet}
  {#snippet dontPair1()}
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>Deseja continuar?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Não</AlertDialogCancel>
          <AlertDialogAction>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  {/snippet}
  {#snippet doPair2()}
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir projeto</AlertDialogTitle>
          <AlertDialogDescription>O projeto será removido permanentemente.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  {/snippet}
  {#snippet dontPair2()}
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir projeto</AlertDialogTitle>
          <AlertDialogDescription>O projeto será removido permanentemente.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryDescription={$tStore('import.withTrigger')}
    secondaryCode={codeImportWithTrigger}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    note={stripHtml($tStore('variants.note'))}
    items={[
      { name: 'destructive', description: stripHtml($tStore('variants.items.destructive')), code: codeDestructive, preview: variantDestructive },
      { name: 'default',     description: stripHtml($tStore('variants.items.default')),     code: codeDefault,     preview: variantDefault     },
    ]}
  />

  {#snippet variantDestructive()}
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir conta</AlertDialogTitle>
          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  {/snippet}
  {#snippet variantDefault()}
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sair da conta</AlertDialogTitle>
          <AlertDialogDescription>Você precisará entrar novamente.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction>Sair</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="alert-dialog"
    items={[
      {
        name: $tStore('variants.compositions.destructive.name'),
        description: $tStore('variants.compositions.destructive.description'),
        useWhen: $tStore('variants.compositions.destructive.use'),
        code: `<AlertDialog>
  <AlertDialogTrigger>
    {#snippet child({ props })}
      <Button variant="destructive" {...props}>Excluir conta</Button>
    {/snippet}
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
      <AlertDialogDescription>
        Essa ação é permanente. Todos os dados, arquivos e histórico serão removidos.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
        Excluir conta
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
        preview: compDestructive,
      },
      {
        name: $tStore('variants.compositions.neutral.name'),
        description: $tStore('variants.compositions.neutral.description'),
        useWhen: $tStore('variants.compositions.neutral.use'),
        code: `<AlertDialog>
  <AlertDialogTrigger>
    {#snippet child({ props })}
      <Button {...props}>Publicar agora</Button>
    {/snippet}
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Publicar este conteúdo?</AlertDialogTitle>
      <AlertDialogDescription>
        Ao publicar, o conteúdo fica visível para todos os usuários.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Voltar</AlertDialogCancel>
      <AlertDialogAction>Publicar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
        preview: compNeutral,
      },
    ]}
  />

  {#snippet compDestructive()}
    <AlertDialog>
      <AlertDialogTrigger>
        {#snippet child({ props })}
          <Button variant="destructive" {...props}>Excluir conta</Button>
        {/snippet}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
          <AlertDialogDescription>Essa ação é permanente. Todos os dados, arquivos e histórico serão removidos.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir conta</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  {/snippet}
  {#snippet compNeutral()}
    <AlertDialog>
      <AlertDialogTrigger>
        {#snippet child({ props })}
          <Button {...props}>Publicar agora</Button>
        {/snippet}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publicar este conteúdo?</AlertDialogTitle>
          <AlertDialogDescription>Ao publicar, o conteúdo fica visível para todos os usuários.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction>Publicar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
      { label: $tStore('states.closed.label'),     trigger: stripHtml($tStore('states.closed.trigger')),     behavior: $tStore('states.closed.behavior')     },
      { label: $tStore('states.open.label'),       trigger: stripHtml($tStore('states.open.trigger')),       behavior: $tStore('states.open.behavior')       },
      { label: $tStore('states.confirmed.label'),  trigger: stripHtml($tStore('states.confirmed.trigger')),  behavior: $tStore('states.confirmed.behavior')  },
      { label: $tStore('states.cancelled.label'),  trigger: stripHtml($tStore('states.cancelled.trigger')),  behavior: $tStore('states.cancelled.behavior') },
      { label: $tStore('states.controlled.label'), trigger: stripHtml($tStore('states.controlled.trigger')), behavior: $tStore('states.controlled.behavior') },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: $tStore('props.rootTitle'),
        cols: propsTableCols,
        items: [
          { name: 'open',         type: 'boolean',                     defaultValue: '—',      required: 'Não', description: stripHtml($tStore('props.table.open'))         },
          { name: 'defaultOpen',  type: 'boolean',                     defaultValue: 'false',  required: 'Não', description: stripHtml($tStore('props.table.defaultOpen')) },
          { name: 'onOpenChange', type: '(open: boolean) => void',     defaultValue: '—',      required: 'Não', description: stripHtml($tStore('props.table.onOpenChange'))},
          { name: 'children',     type: 'Snippet',                     defaultValue: '—',      required: 'Sim', description: stripHtml($tStore('props.table.children'))    },
        ],
      },
      {
        title: $tStore('props.triggerTitle'),
        cols: propsTableCols,
        items: [
          { name: 'child',    type: 'Snippet<[{ props }]>', defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.table.asChild'))  },
          { name: 'class',    type: 'string',               defaultValue: '—', required: 'Não', description: $tStore('props.table.className')            },
          { name: 'children', type: 'Snippet',              defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.table.children')) },
        ],
      },
      {
        title: $tStore('props.contentTitle'),
        cols: propsTableCols,
        items: [
          { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.table.className')            },
          { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Sim', description: stripHtml($tStore('props.table.children')) },
        ],
      },
      {
        title: $tStore('props.actionTitle'),
        cols: propsTableCols,
        items: [
          { name: 'onclick',  type: '(e: MouseEvent) => void', defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.table.onClick'))  },
          { name: 'class',    type: 'string',                  defaultValue: '—', required: 'Não', description: $tStore('props.table.className')            },
          { name: 'children', type: 'Snippet',                 defaultValue: '—', required: 'Sim', description: stripHtml($tStore('props.table.children')) },
        ],
      },
      {
        title: $tStore('props.cancelTitle'),
        cols: propsTableCols,
        items: [
          { name: 'onclick',  type: '(e: MouseEvent) => void', defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.table.onClick'))  },
          { name: 'class',    type: 'string',                  defaultValue: '—', required: 'Não', description: $tStore('props.table.className')            },
          { name: 'children', type: 'Snippet',                 defaultValue: '—', required: 'Sim', description: stripHtml($tStore('props.table.children')) },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={stripHtml($tStore('props.extensibility'))}
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
      { token: '--background',             value: 'bg-black/80',                 description: $tStore('tokens.table.overlayBg')             },
      { token: '--background',             value: 'bg-background',               description: $tStore('tokens.table.contentBg')             },
      { token: '--foreground',             value: 'text-foreground',             description: $tStore('tokens.table.contentForeground')     },
      { token: '--border',                 value: 'border',                      description: $tStore('tokens.table.border')                },
      { token: '--muted-foreground',       value: 'text-muted-foreground',       description: $tStore('tokens.table.mutedForeground')       },
      { token: '--destructive',            value: 'bg-destructive',              description: $tStore('tokens.table.destructive')           },
      { token: '--destructive-foreground', value: 'text-destructive-foreground', description: $tStore('tokens.table.destructiveForeground') },
      { token: '--radius',                 value: 'sm:rounded-lg',               description: $tStore('tokens.table.radius')                },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeCustomizationTokens}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={stripHtml($tStore('accessibility.summary'))}
    items={[
      $tStore('accessibility.item1'),
      $tStore('accessibility.item2'),
      $tStore('accessibility.item3'),
      $tStore('accessibility.item4'),
      $tStore('accessibility.item5'),
      $tStore('accessibility.item6'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboardTitle')}
    keyboardItems={[
      { key: 'Tab',       description: $tStore('accessibility.keyboard.tab')       },
      { key: 'Shift+Tab', description: $tStore('accessibility.keyboard.shiftTab')  },
      { key: 'Enter',     description: $tStore('accessibility.keyboard.enter')     },
      { key: 'Space',     description: $tStore('accessibility.keyboard.space')     },
      { key: 'Escape',    description: $tStore('accessibility.keyboard.escape')    },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'Dialog', description: $tStore('related.dialog'), path: '?path=/docs/ui-dialog--docs' },
      { name: 'Sonner', description: $tStore('related.sonner'), path: '?path=/docs/ui-sonner--docs' },
      { name: 'Alert',  description: $tStore('related.alert'),  path: '?path=/docs/ui-alert--docs'  },
      { name: 'Button', description: $tStore('related.button'), path: '?path=/docs/ui-button--docs' },
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
      { event: $tStore('analytics.table.open'),          trigger: $tStore('analytics.table.openTrigger'),          payload: $tStore('analytics.table.openPayload')          },
      { event: $tStore('analytics.table.confirm'),       trigger: $tStore('analytics.table.confirmTrigger'),       payload: $tStore('analytics.table.confirmPayload')       },
      { event: $tStore('analytics.table.close'),         trigger: $tStore('analytics.table.closeTrigger'),         payload: $tStore('analytics.table.closePayload')         },
      { event: $tStore('analytics.table.pageView'),      trigger: $tStore('analytics.table.pageViewTrigger'),      payload: $tStore('analytics.table.pageViewPayload')      },
      { event: $tStore('analytics.table.sectionViewed'), trigger: $tStore('analytics.table.sectionViewedTrigger'), payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),    trigger: $tStore('analytics.table.langSwitchTrigger'),    payload: $tStore('analytics.table.langSwitchPayload')    },
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
      items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
        criterion: $tStore(`testes.accessibility.item${i}.criterion`),
        level: $tStore(`testes.accessibility.item${i}.level`),
        how: $tStore(`testes.accessibility.item${i}.how`),
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
