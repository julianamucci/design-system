<script lang="ts">
  import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
  import { User } from 'lucide-svelte';
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
  import avatarTranslations from '@shared/content/avatar/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(avatarTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'avatar',
    });
    track('docs_page_view', {
      component_name: 'avatar',
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
    track('docs_section_viewed', { section_id: id, component_name: 'avatar', locale: $locale });
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

  // ─── Image URLs ──────────────────────────────────────────────────────────────

  const IMG_MARIA = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60';
  const IMG_JOAO = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=60';
  const IMG_ANA = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=60';

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";`;
  const codeImportWithIcon = `import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-svelte";`;

  const codeImage = `<Avatar>
  <AvatarImage src="/maria.jpg" alt="Foto de perfil de Maria Rodrigues" />
  <AvatarFallback delayMs={600}>MR</AvatarFallback>
</Avatar>`;

  const codeInitials = `<Avatar>
  <AvatarFallback>JP</AvatarFallback>
</Avatar>`;

  const codeIcon = `<Avatar>
  <AvatarFallback aria-label="Usuário genérico">
    <User class="h-4 w-4 text-muted-foreground" aria-hidden="true" />
  </AvatarFallback>
</Avatar>`;

  const codeGroup = `<div class="flex -space-x-2" role="group" aria-label="Participantes">
  <Avatar class="ring-2 ring-background">
    <AvatarImage src="/maria.jpg" alt="" />
    <AvatarFallback class="text-xs">MR</AvatarFallback>
  </Avatar>
  <Avatar class="ring-2 ring-background">
    <AvatarImage src="/joao.jpg" alt="" />
    <AvatarFallback class="text-xs">JP</AvatarFallback>
  </Avatar>
  <Avatar class="ring-2 ring-background">
    <AvatarFallback class="text-xs">+2</AvatarFallback>
  </Avatar>
</div>`;

  const codeStatus = `<div class="relative inline-block">
  <Avatar>
    <AvatarImage src="/maria.jpg" alt="Foto de perfil de Maria Rodrigues" />
    <AvatarFallback>MR</AvatarFallback>
  </Avatar>
  <span
    aria-label="online"
    class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background"
  />
</div>`;

  const codeCustomizationTokens = `/* Em globals.css — tokens semânticos usados pelo Avatar */
:root {
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --primary: 221 83% 53%;
  --background: 0 0% 100%;
}`;

  const interfaceCode = `// Avatar
interface AvatarProps {
  class?: string;
  children?: Snippet;
  loadingStatus?: 'idle' | 'loading' | 'loaded' | 'error';
}

// AvatarImage
interface AvatarImageProps {
  src: string;
  alt: string;
  class?: string;
  onLoadingStatusChange?: (status: 'idle' | 'loading' | 'loaded' | 'error') => void;
}

// AvatarFallback
interface AvatarFallbackProps {
  delayMs?: number;
  class?: string;
  children?: Snippet;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value}>
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add avatar"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="flex flex-wrap items-end justify-center gap-8">
        <div class="flex flex-col items-center gap-2">
          <Avatar>
            <AvatarImage src={IMG_MARIA} alt={$tStore('demonstration.labels.withImageAlt')} />
            <AvatarFallback delayMs={600}>MR</AvatarFallback>
          </Avatar>
          <span class="text-xs text-muted-foreground">{$tStore('demonstration.labels.withImage')}</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <Avatar>
            <AvatarFallback>{$tStore('demonstration.labels.withFallbackInitials')}</AvatarFallback>
          </Avatar>
          <span class="text-xs text-muted-foreground">{$tStore('demonstration.labels.withFallback')}</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <Avatar>
            <AvatarFallback aria-label={$tStore('demonstration.labels.withIcon')}>
              <User class="h-5 w-5" aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
          <span class="text-xs text-muted-foreground">{$tStore('demonstration.labels.withIcon')}</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div class="flex -space-x-2" role="group" aria-label={$tStore('demonstration.labels.groupTitle')}>
            <Avatar class="ring-2 ring-background">
              <AvatarImage src={IMG_MARIA} alt="" />
              <AvatarFallback class="text-xs">MR</AvatarFallback>
            </Avatar>
            <Avatar class="ring-2 ring-background">
              <AvatarImage src={IMG_JOAO} alt="" />
              <AvatarFallback class="text-xs">JP</AvatarFallback>
            </Avatar>
            <Avatar class="ring-2 ring-background">
              <AvatarImage src={IMG_ANA} alt="" />
              <AvatarFallback class="text-xs">AS</AvatarFallback>
            </Avatar>
            <Avatar class="ring-2 ring-background">
              <AvatarFallback class="text-xs">+2</AvatarFallback>
            </Avatar>
          </div>
          <span class="text-xs text-muted-foreground">{$tStore('demonstration.labels.groupTitle')}</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div class="relative inline-block">
            <Avatar>
              <AvatarImage src={IMG_MARIA} alt={$tStore('demonstration.labels.withImageAlt')} />
              <AvatarFallback>MR</AvatarFallback>
            </Avatar>
            <span
              aria-label={$tStore('demonstration.labels.statusOnline')}
              class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background"
            ></span>
          </div>
          <span class="text-xs text-muted-foreground">{$tStore('demonstration.labels.statusTitle')}</span>
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
    uxWriting={{
      title: $tStore('usage.uxWriting.title'),
      cols: {
        element: $tStore('usage.uxWriting.table.element'),
        rules: $tStore('usage.uxWriting.table.rules'),
        do: $tStore('usage.uxWriting.table.correct'),
        dont: $tStore('usage.uxWriting.table.avoid'),
      },
      items: [
        { element: $tStore('usage.uxWriting.table.alt.name'),        rules: $tStore('usage.uxWriting.table.alt.format'),        do: $tStore('usage.uxWriting.table.alt.good'),        dont: $tStore('usage.uxWriting.table.alt.bad') },
        { element: $tStore('usage.uxWriting.table.initials.name'),   rules: $tStore('usage.uxWriting.table.initials.format'),   do: $tStore('usage.uxWriting.table.initials.good'),   dont: $tStore('usage.uxWriting.table.initials.bad') },
        { element: $tStore('usage.uxWriting.table.status.name'),     rules: $tStore('usage.uxWriting.table.status.format'),     do: $tStore('usage.uxWriting.table.status.good'),     dont: $tStore('usage.uxWriting.table.status.bad') },
        { element: $tStore('usage.uxWriting.table.decorative.name'), rules: $tStore('usage.uxWriting.table.decorative.format'), do: $tStore('usage.uxWriting.table.decorative.good'), dont: $tStore('usage.uxWriting.table.decorative.bad') },
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
    <div class="flex items-center justify-center w-full">
      <Avatar>
        <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
        <AvatarFallback delayMs={600}>MR</AvatarFallback>
      </Avatar>
    </div>
  {/snippet}
  {#snippet dontPair1()}
    <div class="flex items-center justify-center w-full">
      <Avatar>
        <AvatarImage src="https://invalid.example.com/x.jpg" alt="Avatar" />
      </Avatar>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div class="flex items-center justify-center w-full">
      <Avatar>
        <AvatarFallback>MR</AvatarFallback>
      </Avatar>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="flex items-center justify-center w-full">
      <Avatar>
        <AvatarFallback>mar</AvatarFallback>
      </Avatar>
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryDescription={$tStore('import.withIcon')}
    secondaryCode={codeImportWithIcon}
  />

  <!-- ── Variantes (composições) ────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    items={[
      { name: 'image',      description: stripHtml($tStore('variants.items.image')),      code: codeImage,    preview: variantImage },
      { name: 'initials',   description: stripHtml($tStore('variants.items.initials')),   code: codeInitials, preview: variantInitials },
      { name: 'icon',       description: stripHtml($tStore('variants.items.icon')),       code: codeIcon,     preview: variantIcon },
      { name: 'group',      description: stripHtml($tStore('variants.items.group')),      code: codeGroup,    preview: variantGroup },
      { name: 'withStatus', description: stripHtml($tStore('variants.items.withStatus')), code: codeStatus,   preview: variantStatus },
    ]}
  />

  {#snippet variantImage()}
    <Avatar>
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback delayMs={600}>MR</AvatarFallback>
    </Avatar>
  {/snippet}
  {#snippet variantInitials()}
    <Avatar>
      <AvatarFallback>JP</AvatarFallback>
    </Avatar>
  {/snippet}
  {#snippet variantIcon()}
    <Avatar>
      <AvatarFallback aria-label="Usuário genérico">
        <User class="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
  {/snippet}
  {#snippet variantGroup()}
    <div class="flex -space-x-2" role="group" aria-label="Participantes">
      <Avatar class="ring-2 ring-background">
        <AvatarImage src={IMG_MARIA} alt="" />
        <AvatarFallback class="text-xs">MR</AvatarFallback>
      </Avatar>
      <Avatar class="ring-2 ring-background">
        <AvatarImage src={IMG_JOAO} alt="" />
        <AvatarFallback class="text-xs">JP</AvatarFallback>
      </Avatar>
      <Avatar class="ring-2 ring-background">
        <AvatarImage src={IMG_ANA} alt="" />
        <AvatarFallback class="text-xs">AS</AvatarFallback>
      </Avatar>
      <Avatar class="ring-2 ring-background">
        <AvatarFallback class="text-xs">+2</AvatarFallback>
      </Avatar>
    </div>
  {/snippet}
  {#snippet variantStatus()}
    <div class="relative inline-block">
      <Avatar>
        <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
        <AvatarFallback>MR</AvatarFallback>
      </Avatar>
      <span
        aria-label="online"
        class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background"
      ></span>
    </div>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="avatar"
    items={[
      {
        name: $tStore('variants.compositions.withImage.name'),
        description: $tStore('variants.compositions.withImage.description'),
        useWhen: $tStore('variants.compositions.withImage.use'),
        code: `<Avatar>
  <AvatarImage src="https://github.com/shadcn.png" alt="Foto de perfil de Maria Rodrigues" />
  <AvatarFallback>MR</AvatarFallback>
</Avatar>`,
        preview: compWithImage,
      },
      {
        name: $tStore('variants.compositions.withInitials.name'),
        description: $tStore('variants.compositions.withInitials.description'),
        useWhen: $tStore('variants.compositions.withInitials.use'),
        code: `<Avatar>
  <AvatarFallback>JP</AvatarFallback>
</Avatar>`,
        preview: compWithInitials,
      },
      {
        name: $tStore('variants.compositions.withIcon.name'),
        description: $tStore('variants.compositions.withIcon.description'),
        useWhen: $tStore('variants.compositions.withIcon.use'),
        code: `<Avatar>
  <AvatarFallback role="img" aria-label="Usuário genérico">
    <User aria-hidden="true" class="h-5 w-5 text-muted-foreground" />
  </AvatarFallback>
</Avatar>`,
        preview: compWithIcon,
      },
      {
        name: $tStore('variants.compositions.group.name'),
        description: $tStore('variants.compositions.group.description'),
        useWhen: $tStore('variants.compositions.group.use'),
        code: `<div class="flex -space-x-2" role="group" aria-label="Participantes">
  <Avatar class="ring-2 ring-background">
    <AvatarImage src="https://github.com/shadcn.png" alt="Foto de perfil de Maria Rodrigues" />
    <AvatarFallback>MR</AvatarFallback>
  </Avatar>
  <Avatar class="ring-2 ring-background">
    <AvatarFallback>JP</AvatarFallback>
  </Avatar>
  <Avatar class="ring-2 ring-background">
    <AvatarFallback>AL</AvatarFallback>
  </Avatar>
  <Avatar class="ring-2 ring-background">
    <AvatarFallback>+3</AvatarFallback>
  </Avatar>
</div>`,
        preview: compGroup,
      },
      {
        name: $tStore('variants.compositions.withStatus.name'),
        description: $tStore('variants.compositions.withStatus.description'),
        useWhen: $tStore('variants.compositions.withStatus.use'),
        code: `<div class="relative inline-block">
  <Avatar>
    <AvatarImage src="https://github.com/shadcn.png" alt="Foto de perfil de Maria Rodrigues" />
    <AvatarFallback>MR</AvatarFallback>
  </Avatar>
  <span
    role="status"
    aria-label="online"
    class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background"
  ></span>
</div>`,
        preview: compWithStatus,
      },
    ]}
  />

  {#snippet compWithImage()}
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback>MR</AvatarFallback>
    </Avatar>
  {/snippet}
  {#snippet compWithInitials()}
    <Avatar>
      <AvatarFallback>JP</AvatarFallback>
    </Avatar>
  {/snippet}
  {#snippet compWithIcon()}
    <Avatar>
      <AvatarFallback role="img" aria-label="Usuário genérico">
        <User aria-hidden="true" class="h-5 w-5 text-muted-foreground" />
      </AvatarFallback>
    </Avatar>
  {/snippet}
  {#snippet compGroup()}
    <div class="flex -space-x-2" role="group" aria-label="Participantes">
      <Avatar class="ring-2 ring-background">
        <AvatarImage src="https://github.com/shadcn.png" alt="Foto de perfil de Maria Rodrigues" />
        <AvatarFallback>MR</AvatarFallback>
      </Avatar>
      <Avatar class="ring-2 ring-background">
        <AvatarFallback>JP</AvatarFallback>
      </Avatar>
      <Avatar class="ring-2 ring-background">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar class="ring-2 ring-background">
        <AvatarFallback>+3</AvatarFallback>
      </Avatar>
    </div>
  {/snippet}
  {#snippet compWithStatus()}
    <div class="relative inline-block">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="Foto de perfil de Maria Rodrigues" />
        <AvatarFallback>MR</AvatarFallback>
      </Avatar>
      <span
        role="status"
        aria-label="online"
        class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background"
      ></span>
    </div>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={[
      { label: $tStore('states.loaded.label'),  trigger: stripHtml($tStore('states.loaded.trigger')),  behavior: $tStore('states.loaded.behavior')  },
      { label: $tStore('states.loading.label'), trigger: stripHtml($tStore('states.loading.trigger')), behavior: $tStore('states.loading.behavior') },
      { label: $tStore('states.failed.label'),  trigger: stripHtml($tStore('states.failed.trigger')),  behavior: $tStore('states.failed.behavior')  },
      { label: $tStore('states.noImage.label'), trigger: stripHtml($tStore('states.noImage.trigger')), behavior: $tStore('states.noImage.behavior') },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: $tStore('props.avatarTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.table.className')) },
          { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Não', description: $tStore('props.table.children') },
        ],
      },
      {
        title: $tStore('props.avatarImageTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'src',                   type: 'string',   defaultValue: '—', required: 'Sim', description: $tStore('props.table.src') },
          { name: 'alt',                   type: 'string',   defaultValue: '—', required: 'Sim', description: $tStore('props.table.alt') },
          { name: 'onLoadingStatusChange', type: '(status) => void', defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.table.onLoadingStatusChange')) },
          { name: 'class',                 type: 'string',   defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.table.className')) },
        ],
      },
      {
        title: $tStore('props.avatarFallbackTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'delayMs',  type: 'number',  defaultValue: '—', required: 'Não', description: $tStore('props.table.delayMs') },
          { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.table.className')) },
          { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Não', description: $tStore('props.table.children') },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={$tStore('props.extensibility')}
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
      { token: '--muted',            value: 'bg-muted',             description: $tStore('tokens.table.muted')           },
      { token: '--muted-foreground', value: 'text-muted-foreground', description: $tStore('tokens.table.mutedForeground') },
      { token: '--background',       value: 'ring-background',      description: stripHtml($tStore('tokens.table.background')) },
      { token: '--border',           value: 'border',               description: $tStore('tokens.table.border')          },
      { token: '--primary',          value: 'bg-primary',           description: $tStore('tokens.table.primary')         },
      { token: '--radius',           value: 'rounded-full',         description: stripHtml($tStore('tokens.table.radius')) },
      { token: '--ring',             value: 'ring-ring',            description: $tStore('tokens.table.ring')            },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeCustomizationTokens}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.item1'),
      $tStore('accessibility.item2'),
      $tStore('accessibility.item3'),
      $tStore('accessibility.item4'),
      $tStore('accessibility.item5'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboardTitle')}
    keyboardItems={[
      { key: 'Tab',   description: 'Avatar como link ou botão recebe foco via Tab.' },
      { key: 'Enter', description: 'Ativa a navegação quando Avatar é trigger.' },
      { key: '—',     description: 'Avatar puramente visual não é focável.' },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'Badge',        description: $tStore('related.badge'),        path: '?path=/docs/ui-badge--docs'        },
      { name: 'AspectRatio',  description: $tStore('related.aspectRatio'),  path: '?path=/docs/ui-aspectratio--docs'  },
      { name: 'Tooltip',      description: $tStore('related.tooltip'),      path: '?path=/docs/ui-tooltip--docs'      },
      { name: 'Card',         description: $tStore('related.card'),         path: '?path=/docs/ui-card--docs'         },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: $tStore('notes.tip1') },
      { title: '', content: $tStore('notes.tip2') },
      { title: '', content: $tStore('notes.tip3') },
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
      { event: $tStore('analytics.table.profileClick'),  trigger: $tStore('analytics.table.profileClickTrigger'),  payload: $tStore('analytics.table.profileClickPayload')  },
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
      items: [
        { action: $tStore('testes.functional.item1.action'), result: $tStore('testes.functional.item1.result'), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item2.action'), result: $tStore('testes.functional.item2.result'), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item3.action'), result: $tStore('testes.functional.item3.result'), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item4.action'), result: $tStore('testes.functional.item4.result'), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item5.action'), result: $tStore('testes.functional.item5.result'), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item6.action'), result: $tStore('testes.functional.item6.result'), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
      ],
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: [
        { criterion: $tStore('testes.accessibility.item1.criterion'), level: $tStore('testes.accessibility.item1.level'), how: $tStore('testes.accessibility.item1.how') },
        { criterion: $tStore('testes.accessibility.item2.criterion'), level: $tStore('testes.accessibility.item2.level'), how: $tStore('testes.accessibility.item2.how') },
        { criterion: $tStore('testes.accessibility.item3.criterion'), level: $tStore('testes.accessibility.item3.level'), how: $tStore('testes.accessibility.item3.how') },
        { criterion: $tStore('testes.accessibility.item4.criterion'), level: $tStore('testes.accessibility.item4.level'), how: $tStore('testes.accessibility.item4.how') },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [
        { story: $tStore('testes.visual.item1.story'), priority: localPriority($tStore('testes.visual.item1.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item2.story'), priority: localPriority($tStore('testes.visual.item2.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item3.story'), priority: localPriority($tStore('testes.visual.item3.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item4.story'), priority: localPriority($tStore('testes.visual.item4.priority'), $tNavStore) },
      ],
    }}
  />
</DocsPageLayout>
