<script lang="ts">
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardAction,
    CardContent,
    CardFooter,
  } from '@/components/ui/card';
  import { Button } from '@/components/ui/button';
  import { Badge } from '@/components/ui/badge';
  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  import cardTranslations from '@shared/content/card/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(cardTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'card',
    });
    track('docs_page_view', {
      component_name: 'card',
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
    track('docs_section_viewed', { section_id: id, component_name: 'card', locale: $locale });
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

  // ─── Image ───────────────────────────────────────────────────────────────────

  const productImage = 'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?auto=format&fit=crop&w=640&q=80';

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";`;

  const codeImportFull = `import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";`;

  const codeDefault = `<Card>
  <CardHeader>
    <CardTitle>Cadeira Gamer Pro</CardTitle>
    <CardDescription>
      Estrutura ergonômica com ajuste de altura e apoio lombar.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p class="text-sm text-muted-foreground">R$ 1.299,00 · Em estoque</p>
  </CardContent>
</Card>`;

  const codeSm = `<Card size="sm">
  <CardHeader>
    <CardDescription>Assinantes ativos</CardDescription>
    <CardTitle class="text-2xl tabular-nums">8.742</CardTitle>
  </CardHeader>
  <CardContent>
    <p class="text-xs text-emerald-600">+12% no mês</p>
  </CardContent>
</Card>`;

  const codeWithFooter = `<Card>
  <CardHeader>
    <CardTitle>Cadeira Gamer Pro</CardTitle>
    <CardDescription>Estrutura ergonômica.</CardDescription>
  </CardHeader>
  <CardContent>
    <p class="text-sm">R$ 1.299,00 · Em estoque</p>
  </CardContent>
  <CardFooter class="justify-end gap-2">
    <Button variant="outline" size="sm">Cancelar</Button>
    <Button size="sm">Salvar</Button>
  </CardFooter>
</Card>`;

  const codeWithAction = `<Card>
  <CardHeader>
    <CardTitle>Cadeira Gamer Pro</CardTitle>
    <CardDescription>Estrutura ergonômica.</CardDescription>
    <CardAction>
      <Button variant="ghost" size="sm" aria-label="Editar Cadeira Gamer Pro">
        Editar
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    <p class="text-sm">R$ 1.299,00 · Em estoque</p>
  </CardContent>
</Card>`;

  const codeWithImage = `<Card>
  <img src="/cadeira.jpg" alt="Cadeira Gamer Pro" class="aspect-[4/3] w-full object-cover" />
  <CardHeader>
    <CardTitle>Cadeira Gamer Pro</CardTitle>
    <CardDescription>Estrutura ergonômica.</CardDescription>
  </CardHeader>
  <CardContent>
    <p class="text-sm">R$ 1.299,00 · Em estoque</p>
  </CardContent>
</Card>`;

  const codeCustomizationTokens = `/* globals.css — personalize Card via tokens semânticos */
:root {
  --radius-card: 0.75rem;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --border: 240 5.9% 90%;
}

.dark {
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --border: 240 3.7% 15.9%;
}`;

  const interfaceCode = `// Card — único subcomponente com prop custom
interface CardProps {
  size?: 'default' | 'sm';
  class?: string;
  children?: Snippet;
}

// CardHeader / CardTitle / CardDescription / CardAction /
// CardContent / CardFooter — todos aceitam class + children
interface CardPartProps {
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
      installNote="npx shadcn-svelte@latest add card"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <Card>
          <img src={productImage} alt={$tStore('demonstration.labels.productTitle')} class="aspect-[4/3] w-full object-cover" />
          <CardHeader>
            <CardTitle>{$tStore('demonstration.labels.productTitle')}</CardTitle>
            <CardDescription>{$tStore('demonstration.labels.productDescription')}</CardDescription>
            <CardAction>
              <Badge variant="secondary">{$tStore('demonstration.labels.productStock')}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p class="text-base font-semibold">{$tStore('demonstration.labels.productPrice')}</p>
          </CardContent>
          <CardFooter class="justify-end gap-2">
            <Button variant="outline" size="sm" aria-label={`${$tStore('demonstration.labels.actionEdit')} ${$tStore('demonstration.labels.productTitle')}`}>
              {$tStore('demonstration.labels.actionEdit')}
            </Button>
            <Button variant="destructive" size="sm" aria-label={`${$tStore('demonstration.labels.actionDelete')} ${$tStore('demonstration.labels.productTitle')}`}>
              {$tStore('demonstration.labels.actionDelete')}
            </Button>
          </CardFooter>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardDescription>{$tStore('demonstration.labels.metricTitle')}</CardDescription>
            <CardTitle class="text-2xl font-semibold tabular-nums">{$tStore('demonstration.labels.metricValue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-xs text-emerald-600 dark:text-emerald-400">{$tStore('demonstration.labels.metricTrend')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div class="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="https://i.pravatar.cc/80?img=47" alt={$tStore('demonstration.labels.profileTitle')} />
                <AvatarFallback>MR</AvatarFallback>
              </Avatar>
              <div class="flex flex-col">
                <CardTitle>{$tStore('demonstration.labels.profileTitle')}</CardTitle>
                <CardDescription>{$tStore('demonstration.labels.profileDescription')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardFooter class="justify-end gap-2">
            <Button variant="outline" size="sm">{$tStore('demonstration.labels.actionEdit')}</Button>
          </CardFooter>
        </Card>
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
        { element: $tStore('usage.uxWriting.table.ariaLabel.name'),   rules: $tStore('usage.uxWriting.table.ariaLabel.format'),   do: $tStore('usage.uxWriting.table.ariaLabel.good'),   dont: $tStore('usage.uxWriting.table.ariaLabel.bad') },
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
        doCaption: stripHtml($tStore('doDont.pair2.do')),
        dontCaption: $tStore('doDont.pair2.dont'),
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
    ]}
  />

  {#snippet doPair1()}
    <Card class="w-full">
      <CardHeader>
        <CardTitle>{$tStore('demonstration.labels.productTitle')}</CardTitle>
        <CardDescription>{$tStore('demonstration.labels.productDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">{$tStore('demonstration.labels.productPrice')}</p>
      </CardContent>
      <CardFooter class="justify-end gap-2">
        <Button size="sm">{$tStore('demonstration.labels.actionSave')}</Button>
      </CardFooter>
    </Card>
  {/snippet}
  {#snippet dontPair1()}
    <Card class="w-full">
      <CardContent>
        <p class="text-sm text-muted-foreground py-4">—</p>
      </CardContent>
    </Card>
  {/snippet}
  {#snippet doPair2()}
    <Card class="w-full">
      <CardHeader>
        <CardTitle>{$tStore('demonstration.labels.productTitle')}</CardTitle>
      </CardHeader>
      <CardFooter class="justify-end gap-2">
        <Button variant="outline" size="sm" aria-label={`${$tStore('demonstration.labels.actionEdit')} ${$tStore('demonstration.labels.productTitle')}`}>
          {$tStore('demonstration.labels.actionEdit')}
        </Button>
        <Button variant="destructive" size="sm" aria-label={`${$tStore('demonstration.labels.actionDelete')} ${$tStore('demonstration.labels.productTitle')}`}>
          {$tStore('demonstration.labels.actionDelete')}
        </Button>
      </CardFooter>
    </Card>
  {/snippet}
  {#snippet dontPair2()}
    <Card class="w-full">
      <CardHeader>
        <CardTitle>{$tStore('demonstration.labels.productTitle')}</CardTitle>
      </CardHeader>
      <CardFooter class="justify-end gap-2">
        <Button variant="outline" size="sm">{$tStore('demonstration.labels.actionEdit')}</Button>
        <Button variant="destructive" size="sm">{$tStore('demonstration.labels.actionDelete')}</Button>
      </CardFooter>
    </Card>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryDescription={$tStore('import.full')}
    secondaryCode={codeImportFull}
  />

  <!-- ── Tamanhos e Composições ─────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.visualTitle')}
    items={[
      { name: 'default',    description: stripHtml($tStore('variants.items.default')),    code: codeDefault,    preview: variantDefault    },
      { name: 'sm',         description: stripHtml($tStore('variants.items.sm')),         code: codeSm,         preview: variantSm         },
      { name: 'withFooter', description: stripHtml($tStore('variants.items.withFooter')), code: codeWithFooter, preview: variantWithFooter },
      { name: 'withAction', description: stripHtml($tStore('variants.items.withAction')), code: codeWithAction, preview: variantWithAction },
      { name: 'withImage',  description: stripHtml($tStore('variants.items.withImage')),  code: codeWithImage,  preview: variantWithImage  },
    ]}
  />

  {#snippet variantDefault()}
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{$tStore('demonstration.labels.productTitle')}</CardTitle>
        <CardDescription>{$tStore('demonstration.labels.productDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">{$tStore('demonstration.labels.productPrice')} · {$tStore('demonstration.labels.productStock')}</p>
      </CardContent>
    </Card>
  {/snippet}
  {#snippet variantSm()}
    <Card size="sm" class="w-full max-w-sm">
      <CardHeader>
        <CardDescription>{$tStore('demonstration.labels.metricTitle')}</CardDescription>
        <CardTitle class="text-2xl font-semibold tabular-nums">{$tStore('demonstration.labels.metricValue')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-xs text-emerald-600 dark:text-emerald-400">{$tStore('demonstration.labels.metricTrend')}</p>
      </CardContent>
    </Card>
  {/snippet}
  {#snippet variantWithFooter()}
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{$tStore('demonstration.labels.productTitle')}</CardTitle>
        <CardDescription>{$tStore('demonstration.labels.productDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">{$tStore('demonstration.labels.productPrice')}</p>
      </CardContent>
      <CardFooter class="justify-end gap-2">
        <Button variant="outline" size="sm">{$tStore('demonstration.labels.actionCancel')}</Button>
        <Button size="sm">{$tStore('demonstration.labels.actionSave')}</Button>
      </CardFooter>
    </Card>
  {/snippet}
  {#snippet variantWithAction()}
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{$tStore('demonstration.labels.productTitle')}</CardTitle>
        <CardDescription>{$tStore('demonstration.labels.productDescription')}</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" aria-label={`${$tStore('demonstration.labels.actionEdit')} ${$tStore('demonstration.labels.productTitle')}`}>
            {$tStore('demonstration.labels.actionEdit')}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">{$tStore('demonstration.labels.productPrice')} · {$tStore('demonstration.labels.productStock')}</p>
      </CardContent>
    </Card>
  {/snippet}
  {#snippet variantWithImage()}
    <Card class="w-full max-w-sm">
      <img src={productImage} alt={$tStore('demonstration.labels.productTitle')} class="aspect-[4/3] w-full object-cover" />
      <CardHeader>
        <CardTitle>{$tStore('demonstration.labels.productTitle')}</CardTitle>
        <CardDescription>{$tStore('demonstration.labels.productDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">{$tStore('demonstration.labels.productPrice')}</p>
      </CardContent>
    </Card>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="card"
    items={[
      {
        name: $tStore('variants.compositions.withFooter.name'),
        description: $tStore('variants.compositions.withFooter.description'),
        useWhen: $tStore('variants.compositions.withFooter.use'),
        code: codeWithFooter,
        preview: compWithFooter,
      },
      {
        name: $tStore('variants.compositions.withAction.name'),
        description: $tStore('variants.compositions.withAction.description'),
        useWhen: $tStore('variants.compositions.withAction.use'),
        code: codeWithAction,
        preview: compWithAction,
      },
      {
        name: $tStore('variants.compositions.withImage.name'),
        description: $tStore('variants.compositions.withImage.description'),
        useWhen: $tStore('variants.compositions.withImage.use'),
        code: codeWithImage,
        preview: compWithImage,
      },
    ]}
  />

  {#snippet compWithFooter()}
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Cadeira Gamer Pro</CardTitle>
        <CardDescription>{$tStore('demonstration.labels.productDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="text-lg font-semibold">R$ 1.299,00</p>
      </CardContent>
      <CardFooter class="justify-end gap-2">
        <Button variant="outline" size="sm" aria-label={`${$tStore('demonstration.labels.actionEdit')} Cadeira Gamer Pro`}>
          {$tStore('demonstration.labels.actionEdit')}
        </Button>
        <Button variant="destructive" size="sm" aria-label={`${$tStore('demonstration.labels.actionDelete')} Cadeira Gamer Pro`}>
          {$tStore('demonstration.labels.actionDelete')}
        </Button>
      </CardFooter>
    </Card>
  {/snippet}
  {#snippet compWithAction()}
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Assinantes ativos</CardTitle>
        <CardDescription>+12% no mês</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" aria-label="Editar métrica Assinantes ativos">
            {$tStore('demonstration.labels.actionEdit')}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p class="text-2xl font-semibold">8.742</p>
      </CardContent>
    </Card>
  {/snippet}
  {#snippet compWithImage()}
    <Card class="w-full max-w-sm">
      <img src="https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=600&q=80" alt="Cadeira Gamer Pro" class="w-full h-40 object-cover" />
      <CardHeader>
        <CardTitle>Cadeira Gamer Pro</CardTitle>
        <CardDescription>Estrutura ergonômica.</CardDescription>
      </CardHeader>
    </Card>
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
      { label: $tStore('states.default.label'),     trigger: $tStore('states.default.trigger'),                behavior: stripHtml($tStore('states.default.behavior'))     },
      { label: $tStore('states.small.label'),       trigger: stripHtml($tStore('states.small.trigger')),       behavior: stripHtml($tStore('states.small.behavior'))       },
      { label: $tStore('states.interactive.label'), trigger: stripHtml($tStore('states.interactive.trigger')), behavior: stripHtml($tStore('states.interactive.behavior')) },
      { label: $tStore('states.withImage.label'),   trigger: stripHtml($tStore('states.withImage.trigger')),   behavior: stripHtml($tStore('states.withImage.behavior'))   },
      { label: $tStore('states.withFooter.label'),  trigger: stripHtml($tStore('states.withFooter.trigger')),  behavior: stripHtml($tStore('states.withFooter.behavior'))  },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: $tStore('props.cardTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'size',     type: '"default" | "sm"', defaultValue: '"default"', required: 'Não', description: stripHtml($tStore('props.table.size')) },
          { name: 'class',    type: 'string',           defaultValue: '—',         required: 'Não', description: $tStore('props.table.className')        },
          { name: 'children', type: 'Snippet',          defaultValue: '—',         required: 'Não', description: $tStore('props.table.children')         },
        ],
      },
      {
        title: $tStore('props.headerTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.table.className') },
          { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Sim', description: $tStore('props.table.children')  },
        ],
      },
      {
        title: $tStore('props.cardTitleTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.table.className') },
          { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Sim', description: $tStore('props.table.children')  },
        ],
      },
      {
        title: $tStore('props.descriptionTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.table.className') },
          { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Sim', description: $tStore('props.table.children')  },
        ],
      },
      {
        title: $tStore('props.actionTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.table.className') },
          { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Sim', description: $tStore('props.table.children')  },
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
          { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.table.className') },
          { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Sim', description: $tStore('props.table.children')  },
        ],
      },
      {
        title: $tStore('props.footerTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'class',    type: 'string',  defaultValue: '—', required: 'Não', description: $tStore('props.table.className') },
          { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Sim', description: $tStore('props.table.children')  },
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
      { token: '--radius-card',      value: 'rounded-(--radius-card)', description: $tStore('tokens.table.radiusCard')      },
      { token: '--card',             value: 'bg-card',                 description: $tStore('tokens.table.card')            },
      { token: '--card-foreground',  value: 'text-card-foreground',    description: $tStore('tokens.table.cardForeground')  },
      { token: '--muted',            value: 'bg-muted/50',             description: stripHtml($tStore('tokens.table.muted')) },
      { token: '--muted-foreground', value: 'text-muted-foreground',   description: $tStore('tokens.table.mutedForeground') },
      { token: '--foreground',       value: 'ring-foreground/10',      description: stripHtml($tStore('tokens.table.foreground')) },
      { token: '--border',           value: 'border-t',                description: $tStore('tokens.table.border')          },
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
      { key: 'Tab',   description: $tStore('accessibility.keyboard.tab')        },
      { key: 'Enter', description: $tStore('accessibility.keyboard.enter')      },
      { key: '—',     description: $tStore('accessibility.keyboard.noKeyboard') },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'Separator', description: $tStore('related.separator'), path: '?path=/docs/ui-separator--docs' },
      { name: 'Accordion', description: $tStore('related.accordion'), path: '?path=/docs/ui-accordion--docs' },
      { name: 'Alert',     description: $tStore('related.alert'),     path: '?path=/docs/ui-alert--docs'     },
      { name: 'Button',    description: stripHtml($tStore('related.button')), path: '?path=/docs/ui-button--docs' },
      { name: 'Badge',     description: stripHtml($tStore('related.badge')),  path: '?path=/docs/ui-badge--docs' },
      { name: 'Avatar',    description: stripHtml($tStore('related.avatar')), path: '?path=/docs/ui-avatar--docs' },
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
      { event: $tStore('analytics.table.buttonClick'),   trigger: $tStore('analytics.table.buttonClickTrigger'),   payload: $tStore('analytics.table.buttonClickPayload')   },
      { event: $tStore('analytics.table.cardClick'),     trigger: $tStore('analytics.table.cardClickTrigger'),     payload: $tStore('analytics.table.cardClickPayload')     },
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
        { action: $tStore('testes.functional.item1.action'), result: stripHtml($tStore('testes.functional.item1.result')), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item2.action'), result: stripHtml($tStore('testes.functional.item2.result')), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item3.action'), result: stripHtml($tStore('testes.functional.item3.result')), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item4.action'), result: stripHtml($tStore('testes.functional.item4.result')), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item5.action'), result: $tStore('testes.functional.item5.result'),            priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
        { action: stripHtml($tStore('testes.functional.item6.action')), result: stripHtml($tStore('testes.functional.item6.result')), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
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
        { criterion: $tStore('testes.accessibility.item1.criterion'),             level: $tStore('testes.accessibility.item1.level'), how: $tStore('testes.accessibility.item1.how') },
        { criterion: stripHtml($tStore('testes.accessibility.item2.criterion')),  level: $tStore('testes.accessibility.item2.level'), how: $tStore('testes.accessibility.item2.how') },
        { criterion: stripHtml($tStore('testes.accessibility.item3.criterion')),  level: $tStore('testes.accessibility.item3.level'), how: $tStore('testes.accessibility.item3.how') },
        { criterion: $tStore('testes.accessibility.item4.criterion'),             level: $tStore('testes.accessibility.item4.level'), how: $tStore('testes.accessibility.item4.how') },
        { criterion: $tStore('testes.accessibility.item5.criterion'),             level: $tStore('testes.accessibility.item5.level'), how: $tStore('testes.accessibility.item5.how') },
        { criterion: $tStore('testes.accessibility.item6.criterion'),             level: $tStore('testes.accessibility.item6.level'), how: $tStore('testes.accessibility.item6.how') },
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
        { story: $tStore('testes.visual.item5.story'), priority: localPriority($tStore('testes.visual.item5.priority'), $tNavStore) },
      ],
    }}
  />
</DocsPageLayout>
