<script lang="ts">
  import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from '@/components/ui/dialog';
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
  import dialogTranslations from '@shared/content/dialog/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(dialogTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'dialog',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: 'Overlay', item: '/components/overlay' },
        { name: 'Dialog' },
      ],
    });
    track('docs_page_view', {
      component_name: 'dialog',
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

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'dialog', locale: $locale });
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";`;

  const codeImportWithScroll = `// Em Svelte/React não existe DialogScrollContent.
// Aplique max-h + overflow-y-auto manualmente no body do DialogContent:
<DialogContent>
  <DialogHeader>...</DialogHeader>
  <div class="max-h-[80vh] overflow-y-auto">
    {/* conteúdo longo */}
  </div>
  <DialogFooter>...</DialogFooter>
</DialogContent>`;

  const codeDefault = `<Dialog>
  <DialogTrigger>
    {#snippet child({ props })}
      <Button {...props}>Editar perfil</Button>
    {/snippet}
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogDescription>
        Atualize suas informações pessoais. As mudanças são salvas ao confirmar.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>Cancelar</Button>
        {/snippet}
      </DialogClose>
      <Button>Salvar alterações</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

  const codeWithForm = `<Dialog>
  <DialogTrigger>
    {#snippet child({ props })}
      <Button {...props}>Editar dados</Button>
    {/snippet}
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar dados pessoais</DialogTitle>
      <DialogDescription>Atualize seu nome e e-mail.</DialogDescription>
    </DialogHeader>
    <form class="grid gap-3" onsubmit={onSave}>
      <Input name="name" defaultValue="Maria Silva" />
      <Input name="email" type="email" />
    </form>
    <DialogFooter>
      <DialogClose>...</DialogClose>
      <Button type="submit">Salvar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

  const codeNoFooter = `<Dialog>
  <DialogTrigger>...</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Sobre este produto</DialogTitle>
      <DialogDescription>
        Plataforma de design system multi-stack.
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>`;

  const codeDestructive = `<Dialog>
  <DialogTrigger>...</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Remover item da lista</DialogTitle>
      <DialogDescription>
        Você pode adicioná-lo novamente depois.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose>...</DialogClose>
      <Button class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
        Remover item
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

  const codeNoCloseBtn = `<DialogContent showCloseButton={false}>
  <DialogHeader>...</DialogHeader>
  <DialogFooter>...</DialogFooter>
</DialogContent>`;

  const codeCustomizationTokens = `/* Em globals.css — override do Dialog via tokens */
:root {
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --foreground: 240 10% 3.9%;
  --muted: 240 4.8% 95.9%;
  --border: 240 5.9% 90%;
  --radius-xl: 0.75rem;
}

.dark {
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --border: 240 3.7% 15.9%;
}`;

  const interfaceCode = `// Dialog (Root)
interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: Snippet;
}

// DialogContent
interface DialogContentProps extends BitsContentProps {
  showCloseButton?: boolean;
  class?: string;
  children: Snippet;
}

// DialogTrigger / DialogClose
interface TriggerProps { class?: string; child?: Snippet<[{ props: Record<string, any> }]> }`;

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
      installNote="npx shadcn-svelte@latest add dialog"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="flex flex-wrap items-center justify-center gap-4 w-full">
        <Dialog>
          <DialogTrigger>
            {#snippet child({ props })}
              <Button {...props}>{$tStore('demonstration.labels.triggerLabel')}</Button>
            {/snippet}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{$tStore('demonstration.labels.title')}</DialogTitle>
              <DialogDescription>{$tStore('demonstration.labels.description')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose>
                {#snippet child({ props })}
                  <Button variant="outline" {...props}>{$tStore('demonstration.labels.cancel')}</Button>
                {/snippet}
              </DialogClose>
              <Button>{$tStore('demonstration.labels.action')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
      $tStore('anatomy.item10'),
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
        $tStore('usage.guidelines.item6'),
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
        { element: $tStore('usage.uxWriting.table.action.name'),      rules: $tStore('usage.uxWriting.table.action.format'),      do: $tStore('usage.uxWriting.table.action.good'),      dont: $tStore('usage.uxWriting.table.action.bad') },
        { element: $tStore('usage.uxWriting.table.cancel.name'),      rules: $tStore('usage.uxWriting.table.cancel.format'),      do: $tStore('usage.uxWriting.table.cancel.good'),      dont: $tStore('usage.uxWriting.table.cancel.bad') },
        { element: $tStore('usage.uxWriting.table.srOnly.name'),      rules: $tStore('usage.uxWriting.table.srOnly.format'),      do: $tStore('usage.uxWriting.table.srOnly.good'),      dont: $tStore('usage.uxWriting.table.srOnly.bad') },
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
        dontCaption: stripHtml($tStore('doDont.pair2.dont')),
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
    ]}
  />

  {#snippet doPair1()}
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>Atualize seus dados. As mudanças são salvas ao confirmar.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>
            {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
          </DialogClose>
          <Button>Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  {/snippet}
  {#snippet dontPair1()}
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atenção</DialogTitle>
          <DialogDescription>&nbsp;</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>
            {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
          </DialogClose>
          <Button>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  {/snippet}
  {#snippet doPair2()}
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>Atualize suas informações pessoais.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>
            {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
          </DialogClose>
          <Button>Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  {/snippet}
  {#snippet dontPair2()}
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir conta</DialogTitle>
          <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>
            {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
          </DialogClose>
          <Button class="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir conta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryDescription={$tStore('import.withScroll')}
    secondaryCode={codeImportWithScroll}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    note={stripHtml($tStore('variants.note'))}
    items={[
      { name: 'default',               description: stripHtml($tStore('variants.items.default')),               code: codeDefault,     preview: variantDefault     },
      { name: 'withForm',              description: stripHtml($tStore('variants.items.withForm')),              code: codeWithForm,    preview: variantWithForm    },
      { name: 'withScrollContent',     description: stripHtml($tStore('variants.items.withScrollContent')),     code: codeImportWithScroll, preview: variantWithScroll },
      { name: 'noFooter',              description: stripHtml($tStore('variants.items.noFooter')),              code: codeNoFooter,    preview: variantNoFooter    },
      { name: 'withDestructiveAction', description: stripHtml($tStore('variants.items.withDestructiveAction')), code: codeDestructive, preview: variantDestructive },
      { name: 'customCloseInFooter',   description: stripHtml($tStore('variants.items.customCloseInFooter')),   code: codeNoCloseBtn,  preview: variantNoClose     },
    ]}
  />

  {#snippet variantDefault()}
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>Atualize suas informações pessoais.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>
            {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
          </DialogClose>
          <Button>Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  {/snippet}
  {#snippet variantWithForm()}
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar dados pessoais</DialogTitle>
          <DialogDescription>Atualize seu nome e e-mail.</DialogDescription>
        </DialogHeader>
        <form class="grid gap-3">
          <label class="grid gap-1 text-sm">
            <span>Nome</span>
            <input type="text" class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm" defaultValue="Maria Silva" />
          </label>
        </form>
        <DialogFooter>
          <DialogClose>
            {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
          </DialogClose>
          <Button>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  {/snippet}
  {#snippet variantWithScroll()}
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Termos de uso</DialogTitle>
          <DialogDescription>Leia atentamente antes de aceitar.</DialogDescription>
        </DialogHeader>
        <div class="max-h-[40vh] overflow-y-auto pr-2 text-sm text-muted-foreground space-y-2">
          {#each Array.from({ length: 10 }) as _, i}
            <p>Parágrafo {i + 1}: conteúdo extenso para demonstrar scroll interno.</p>
          {/each}
        </div>
        <DialogFooter>
          <DialogClose>
            {#snippet child({ props })}<Button variant="outline" {...props}>Recusar</Button>{/snippet}
          </DialogClose>
          <Button>Aceitar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  {/snippet}
  {#snippet variantNoFooter()}
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sobre este produto</DialogTitle>
          <DialogDescription>Plataforma de design system multi-stack.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  {/snippet}
  {#snippet variantDestructive()}
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover item da lista</DialogTitle>
          <DialogDescription>Você pode adicioná-lo novamente depois.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>
            {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
          </DialogClose>
          <Button class="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  {/snippet}
  {#snippet variantNoClose()}
    <Dialog open>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Convidar para o time</DialogTitle>
          <DialogDescription>Envie um convite por e-mail.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>
            {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
          </DialogClose>
          <Button>Enviar convite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  {/snippet}

  <!-- ── Composições ────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="dialog"
    items={[
      {
        name: $tStore('variants.compositions.confirmEmail.name'),
        description: $tStore('variants.compositions.confirmEmail.description'),
        useWhen: $tStore('variants.compositions.confirmEmail.use'),
        code: `<Dialog>
  <DialogTrigger>...</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirmar e-mail</DialogTitle>
      <DialogDescription>Verifique o endereço antes de enviar o link de acesso.</DialogDescription>
    </DialogHeader>
    <p class="text-sm text-muted-foreground">Vamos enviar um link para maria@exemplo.com.</p>
    <DialogFooter>
      <DialogClose>...</DialogClose>
      <Button>Enviar link</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
        preview: compConfirmEmail,
      },
      {
        name: $tStore('variants.compositions.profileEdit.name'),
        description: $tStore('variants.compositions.profileEdit.description'),
        useWhen: $tStore('variants.compositions.profileEdit.use'),
        code: `<Dialog>
  <DialogTrigger>...</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogDescription>Atualize suas informações pessoais.</DialogDescription>
    </DialogHeader>
    <form class="grid gap-3">
      <Input name="name" defaultValue="Maria Souza" />
      <Input name="role" defaultValue="Designer" />
    </form>
    <DialogFooter>
      <DialogClose>...</DialogClose>
      <Button>Salvar alterações</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
        preview: compProfileEdit,
      },
      {
        name: $tStore('variants.compositions.mediaPreview.name'),
        description: $tStore('variants.compositions.mediaPreview.description'),
        useWhen: $tStore('variants.compositions.mediaPreview.use'),
        code: `<Dialog>
  <DialogTrigger>...</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Capa do post</DialogTitle>
      <DialogDescription>Pré-visualização em tamanho real.</DialogDescription>
    </DialogHeader>
    <div class="aspect-video w-full bg-muted rounded-md grid place-items-center text-xs text-muted-foreground">
      Pré-visualização da mídia
    </div>
  </DialogContent>
</Dialog>`,
        preview: compMediaPreview,
      },
    ]}
  />

  {#snippet compConfirmEmail()}
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar e-mail</DialogTitle>
          <DialogDescription>Verifique o endereço antes de enviar o link de acesso.</DialogDescription>
        </DialogHeader>
        <p class="text-sm text-muted-foreground">Vamos enviar um link para maria@exemplo.com.</p>
        <DialogFooter>
          <DialogClose>
            {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
          </DialogClose>
          <Button>Enviar link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  {/snippet}
  {#snippet compProfileEdit()}
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>Atualize suas informações pessoais.</DialogDescription>
        </DialogHeader>
        <form class="grid gap-3">
          <label class="grid gap-1 text-sm">
            <span>Nome de exibição</span>
            <input type="text" class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm" defaultValue="Maria Souza" />
          </label>
          <label class="grid gap-1 text-sm">
            <span>Função</span>
            <input type="text" class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm" defaultValue="Designer" />
          </label>
        </form>
        <DialogFooter>
          <DialogClose>
            {#snippet child({ props })}<Button variant="outline" {...props}>Cancelar</Button>{/snippet}
          </DialogClose>
          <Button>Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  {/snippet}
  {#snippet compMediaPreview()}
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Capa do post</DialogTitle>
          <DialogDescription>Pré-visualização em tamanho real.</DialogDescription>
        </DialogHeader>
        <div class="aspect-video w-full bg-muted rounded-md grid place-items-center text-xs text-muted-foreground">
          Pré-visualização da mídia
        </div>
      </DialogContent>
    </Dialog>
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
      { label: $tStore('states.closed.label'),                trigger: stripHtml($tStore('states.closed.trigger')),                behavior: $tStore('states.closed.behavior')                },
      { label: $tStore('states.opening.label'),               trigger: stripHtml($tStore('states.opening.trigger')),               behavior: stripHtml($tStore('states.opening.behavior'))     },
      { label: $tStore('states.open.label'),                  trigger: stripHtml($tStore('states.open.trigger')),                  behavior: $tStore('states.open.behavior')                  },
      { label: $tStore('states.closing.label'),               trigger: stripHtml($tStore('states.closing.trigger')),               behavior: stripHtml($tStore('states.closing.behavior'))    },
      { label: $tStore('states.withCloseButtonHidden.label'), trigger: stripHtml($tStore('states.withCloseButtonHidden.trigger')), behavior: $tStore('states.withCloseButtonHidden.behavior') },
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
          { name: 'open',         type: 'boolean',                 defaultValue: '—',     required: 'Não', description: stripHtml($tStore('props.table.open'))         },
          { name: 'defaultOpen',  type: 'boolean',                 defaultValue: 'false', required: 'Não', description: $tStore('props.table.defaultOpen')             },
          { name: 'onOpenChange', type: '(open: boolean) => void', defaultValue: '—',     required: 'Não', description: $tStore('props.table.onOpenChange')            },
          { name: 'children',     type: 'Snippet',                 defaultValue: '—',     required: 'Sim', description: $tStore('props.table.children')                },
        ],
      },
      {
        title: $tStore('props.contentTitle'),
        cols: propsTableCols,
        items: [
          { name: 'showCloseButton', type: 'boolean', defaultValue: 'true', required: 'Não', description: $tStore('props.table.showCloseButtonContent') },
          { name: 'class',           type: 'string',  defaultValue: '—',    required: 'Não', description: $tStore('props.table.className')              },
          { name: 'children',        type: 'Snippet', defaultValue: '—',    required: 'Sim', description: $tStore('props.table.children')               },
        ],
      },
      {
        title: $tStore('props.footerTitle'),
        cols: propsTableCols,
        items: [
          { name: 'showCloseButton', type: 'boolean', defaultValue: 'false', required: 'Não', description: $tStore('props.table.showCloseButtonFooter') },
          { name: 'class',           type: 'string',  defaultValue: '—',     required: 'Não', description: $tStore('props.table.className')             },
        ],
      },
      {
        title: $tStore('props.titleDescriptionTitle'),
        cols: propsTableCols,
        items: [
          { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.table.className')   },
          { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Sim', description: $tStore('props.table.children')    },
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
      { token: '--popover',            value: 'bg-popover',            description: $tStore('tokens.table.popover')           },
      { token: '--popover-foreground', value: 'text-popover-foreground', description: $tStore('tokens.table.popoverForeground') },
      { token: '--foreground',         value: 'ring-foreground/10',    description: $tStore('tokens.table.foreground')        },
      { token: '--muted',              value: 'bg-muted/50',           description: $tStore('tokens.table.muted')             },
      { token: '--border',             value: 'border-t',              description: $tStore('tokens.table.border')            },
      { token: '--radius-xl',          value: 'rounded-xl',            description: $tStore('tokens.table.radius')            },
      { token: 'z-50',                 value: 'z-50',                  description: $tStore('tokens.table.zIndex')            },
      { token: 'duration-100',         value: 'duration-100',          description: $tStore('tokens.table.duration')          },
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
      { key: 'Tab',       description: $tStore('keyboard.tab')      },
      { key: 'Shift+Tab', description: $tStore('keyboard.shiftTab') },
      { key: 'Enter',     description: $tStore('keyboard.enter')    },
      { key: 'Escape',    description: $tStore('keyboard.escape')   },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'AlertDialog', description: stripHtml($tStore('related.alertDialog')), path: '?path=/docs/ui-alertdialog--docs' },
      { name: 'Sheet',       description: $tStore('related.sheet'),                  path: '?path=/docs/ui-sheet--docs'       },
      { name: 'Popover',     description: $tStore('related.popover'),                path: '?path=/docs/ui-popover--docs'     },
      { name: 'Form',        description: $tStore('related.form'),                   path: '?path=/docs/ui-form--docs'        },
      { name: 'Drawer',      description: $tStore('related.drawer'),                 path: '?path=/docs/ui-drawer--docs'      },
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
      { event: $tStore('analytics.table.close'),         trigger: $tStore('analytics.table.closeTrigger'),         payload: $tStore('analytics.table.closePayload')         },
      { event: $tStore('analytics.table.action'),        trigger: $tStore('analytics.table.actionTrigger'),        payload: $tStore('analytics.table.actionPayload')        },
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
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
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
