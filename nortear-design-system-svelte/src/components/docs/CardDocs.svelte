<script lang="ts">
  import { untrack } from 'svelte';
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
    DocsImport, DocsVariants, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import cardTranslations from '@shared/content/card/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(cardTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = $derived(
    Object.values(
      (cardTranslations as unknown as Record<
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
    track('docs_section_viewed', { section_id: id, component_name: 'card', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

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
    <p class="nds-text-body">R$ 1.299,00 · Em estoque</p>
  </CardContent>
</Card>`;

  const codeSm = `<Card size="sm">
  <CardHeader>
    <CardDescription>Assinantes ativos</CardDescription>
    <CardTitle style="font-size: 1.5rem; line-height: 2rem; font-variant-numeric: tabular-nums">8.742</CardTitle>
  </CardHeader>
  <CardContent>
    <p class="nds-text-caption nds-text-success">+12% no mês</p>
  </CardContent>
</Card>`;

  const codeWithFooter = `<Card>
  <CardHeader>
    <CardTitle>Cadeira Gamer Pro</CardTitle>
    <CardDescription>Estrutura ergonômica.</CardDescription>
  </CardHeader>
  <CardContent>
    <p class="nds-text-body">R$ 1.299,00 · Em estoque</p>
  </CardContent>
  <CardFooter class="nds-cluster" data-justify="end" data-spacing="sm">
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
    <p class="nds-text-body">R$ 1.299,00 · Em estoque</p>
  </CardContent>
</Card>`;

  const codeWithImage = `<Card>
  <img src="/cadeira.jpg" alt="Cadeira Gamer Pro" class="nds-w-full" style="aspect-ratio: 4 / 3; object-fit: cover" />
  <CardHeader>
    <CardTitle>Cadeira Gamer Pro</CardTitle>
    <CardDescription>Estrutura ergonômica.</CardDescription>
  </CardHeader>
  <CardContent>
    <p class="nds-text-body">R$ 1.299,00 · Em estoque</p>
  </CardContent>
</Card>`;

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
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    <div class="nds-grid nds-w-full" data-cols="2" data-spacing="md" style="align-items: start">
      <Card>
        <img src={productImage} alt={$tStore('demonstration.labels.productTitle')} class="nds-w-full" style="aspect-ratio: 4 / 3; object-fit: cover" />
        <CardHeader>
          <CardTitle>{$tStore('demonstration.labels.productTitle')}</CardTitle>
          <CardDescription>{$tStore('demonstration.labels.productDescription')}</CardDescription>
          <CardAction>
            <Badge variant="success">{$tStore('demonstration.labels.productStock')}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p class="nds-text-base nds-font-semibold">{$tStore('demonstration.labels.productPrice')}</p>
        </CardContent>
        <CardFooter class="nds-cluster" data-justify="end" data-spacing="sm">
          <Button variant="outline" size="sm" aria-label={`${$tStore('demonstration.labels.actionEdit')} ${$tStore('demonstration.labels.productTitle')}`} onclick={() => track('button_click', { component: 'button', label: 'action-edit', variant: 'outline', location: 'docs_demo' })}>
            {$tStore('demonstration.labels.actionEdit')}
          </Button>
          <Button variant="destructive" size="sm" aria-label={`${$tStore('demonstration.labels.actionDelete')} ${$tStore('demonstration.labels.productTitle')}`} onclick={() => track('button_click', { component: 'button', label: 'action-delete', variant: 'destructive', location: 'docs_demo' })}>
            {$tStore('demonstration.labels.actionDelete')}
          </Button>
        </CardFooter>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardDescription>{$tStore('demonstration.labels.metricTitle')}</CardDescription>
          <CardTitle class="nds-font-semibold" style="font-size: 1.5rem; line-height: 2rem; font-variant-numeric: tabular-nums">{$tStore('demonstration.labels.metricValue')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="nds-text-caption nds-text-success">{$tStore('demonstration.labels.metricTrend')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div class="nds-cluster" data-spacing="sm">
            <Avatar>
              <AvatarImage src="https://i.pravatar.cc/80?img=47" alt={$tStore('demonstration.labels.profileTitle')} />
              <AvatarFallback>MR</AvatarFallback>
            </Avatar>
            <div class="nds-stack" data-spacing="sm">
              <CardTitle>{$tStore('demonstration.labels.profileTitle')}</CardTitle>
              <CardDescription>{$tStore('demonstration.labels.profileDescription')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardFooter class="nds-cluster" data-justify="end" data-spacing="sm">
          <Button variant="outline" size="sm" onclick={() => track('button_click', { component: 'button', label: 'action-edit', variant: 'outline', location: 'docs_demo' })}>{$tStore('demonstration.labels.actionEdit')}</Button>
        </CardFooter>
      </Card>
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
        doCaption: toPlainText($tStore('doDont.pair1.do')),
        dontCaption: toPlainText($tStore('doDont.pair1.dont')),
        doPreview: doPair1,
        dontPreview: dontPair1,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair2.do')),
        dontCaption: toPlainText($tStore('doDont.pair2.dont')),
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
    ]}
  />

  {#snippet doPair1()}
    <Card class="nds-w-full">
      <CardHeader>
        <CardTitle>{$tStore('demonstration.labels.productTitle')}</CardTitle>
        <CardDescription>{$tStore('demonstration.labels.productDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="nds-text-body">{$tStore('demonstration.labels.productPrice')}</p>
      </CardContent>
      <CardFooter class="nds-cluster" data-justify="end" data-spacing="sm">
        <Button size="sm">{$tStore('demonstration.labels.actionSave')}</Button>
      </CardFooter>
    </Card>
  {/snippet}
  {#snippet dontPair1()}
    <Card class="nds-w-full">
      <CardContent>
 <p class="nds-text-body nds-py-4">—</p>
      </CardContent>
    </Card>
  {/snippet}
  {#snippet doPair2()}
    <Card class="nds-w-full">
      <CardHeader>
        <CardTitle>{$tStore('demonstration.labels.productTitle')}</CardTitle>
      </CardHeader>
      <CardFooter class="nds-cluster" data-justify="end" data-spacing="sm">
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
    <Card class="nds-w-full">
      <CardHeader>
        <CardTitle>{$tStore('demonstration.labels.productTitle')}</CardTitle>
      </CardHeader>
      <CardFooter class="nds-cluster" data-justify="end" data-spacing="sm">
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
    <Card class="nds-w-full nds-max-w-sm">
      <CardHeader>
        <CardTitle>{$tStore('demonstration.labels.productTitle')}</CardTitle>
        <CardDescription>{$tStore('demonstration.labels.productDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="nds-text-body">{$tStore('demonstration.labels.productPrice')} · {$tStore('demonstration.labels.productStock')}</p>
      </CardContent>
    </Card>
  {/snippet}
  {#snippet variantSm()}
    <Card size="sm" class="nds-w-full nds-max-w-sm">
      <CardHeader>
        <CardDescription>{$tStore('demonstration.labels.metricTitle')}</CardDescription>
        <CardTitle class="nds-font-semibold" style="font-size: 1.5rem; line-height: 2rem; font-variant-numeric: tabular-nums">{$tStore('demonstration.labels.metricValue')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="nds-text-caption nds-text-success">{$tStore('demonstration.labels.metricTrend')}</p>
      </CardContent>
    </Card>
  {/snippet}
  {#snippet variantWithFooter()}
    <Card class="nds-w-full nds-max-w-sm">
      <CardHeader>
        <CardTitle>{$tStore('demonstration.labels.productTitle')}</CardTitle>
        <CardDescription>{$tStore('demonstration.labels.productDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="nds-text-body">{$tStore('demonstration.labels.productPrice')}</p>
      </CardContent>
      <CardFooter class="nds-cluster" data-justify="end" data-spacing="sm">
        <Button variant="outline" size="sm">{$tStore('demonstration.labels.actionCancel')}</Button>
        <Button size="sm">{$tStore('demonstration.labels.actionSave')}</Button>
      </CardFooter>
    </Card>
  {/snippet}
  {#snippet variantWithAction()}
    <Card class="nds-w-full nds-max-w-sm">
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
        <p class="nds-text-body">{$tStore('demonstration.labels.productPrice')} · {$tStore('demonstration.labels.productStock')}</p>
      </CardContent>
    </Card>
  {/snippet}
  {#snippet variantWithImage()}
    <Card class="nds-w-full nds-max-w-sm">
      <img src={productImage} alt={$tStore('demonstration.labels.productTitle')} class="nds-w-full" style="aspect-ratio: 4 / 3; object-fit: cover" />
      <CardHeader>
        <CardTitle>{$tStore('demonstration.labels.productTitle')}</CardTitle>
        <CardDescription>{$tStore('demonstration.labels.productDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="nds-text-body">{$tStore('demonstration.labels.productPrice')}</p>
      </CardContent>
    </Card>
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
      { label: $tStore('states.default.label'),     trigger: toPlainText($tStore('states.default.trigger')),                behavior: toPlainText($tStore('states.default.behavior'))     },
      { label: $tStore('states.small.label'),       trigger: toPlainText($tStore('states.small.trigger')),       behavior: toPlainText($tStore('states.small.behavior'))       },
      { label: $tStore('states.interactive.label'), trigger: toPlainText($tStore('states.interactive.trigger')), behavior: toPlainText($tStore('states.interactive.behavior')) },
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
          { name: 'size',     type: '"default" | "sm"', defaultValue: '"default"', required: 'Não', description: toPlainText($tStore('props.table.size')) },
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
      { token: '--radius-card',      value: '.nds-card',               description: $tStore('tokens.table.radiusCard')      },
      { token: '--card',             value: '.nds-card',               description: $tStore('tokens.table.card')            },
      { token: '--card-foreground',  value: '.nds-card',               description: $tStore('tokens.table.cardForeground')  },
      { token: '--muted',            value: '.nds-card-footer',        description: toPlainText($tStore('tokens.table.muted')) },
      { token: '--muted-foreground', value: '.nds-card-description',   description: $tStore('tokens.table.mutedForeground') },
      { token: '--foreground',       value: '.nds-card',               description: toPlainText($tStore('tokens.table.foreground')) },
      { token: '--border',           value: '.nds-card-footer',        description: $tStore('tokens.table.border')          },
      { token: '--card-bg',          value: 'hsl(var(--card))',        description: $tStore('tokens.table.cardBg')          },
      { token: '--card-fg',          value: 'hsl(var(--card-foreground))', description: $tStore('tokens.table.cardFg')      },
      { token: '--card-ring',        value: 'hsl(var(--foreground) / 0.1)', description: $tStore('tokens.table.cardRing')   },
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
      { name: 'Separator', description: $tStore('related.separator'), path: '?path=/docs/primitives-layout-separator--docs' },
      { name: 'Accordion', description: $tStore('related.accordion'), path: '?path=/docs/primitives-disclosure-accordion--docs' },
      { name: 'Alert',     description: $tStore('related.alert'),     path: '?path=/docs/primitives-feedback-alert--docs'     },
      { name: 'Button',    description: toPlainText($tStore('related.button')), path: '?path=/docs/primitives-form-button--docs' },
      { name: 'Badge',     description: toPlainText($tStore('related.badge')),  path: '?path=/docs/primitives-feedback-badge--docs' },
      { name: 'Avatar',    description: toPlainText($tStore('related.avatar')), path: '?path=/docs/primitives-display-avatar--docs' },
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
      trigger: toPlainText($tStore('analytics.table.trigger')),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: $tStore('analytics.table.buttonClick'),   trigger: toPlainText($tStore('analytics.table.buttonClickTrigger')),   payload: $tStore('analytics.table.buttonClickPayload')   },
      { event: $tStore('analytics.table.cardClick'),     trigger: toPlainText($tStore('analytics.table.cardClickTrigger')),     payload: $tStore('analytics.table.cardClickPayload')     },
      { event: $tStore('analytics.table.pageView'),      trigger: toPlainText($tStore('analytics.table.pageViewTrigger')),      payload: $tStore('analytics.table.pageViewPayload')      },
      { event: $tStore('analytics.table.sectionViewed'), trigger: toPlainText($tStore('analytics.table.sectionViewedTrigger')), payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),    trigger: toPlainText($tStore('analytics.table.langSwitchTrigger')),    payload: $tStore('analytics.table.langSwitchPayload')    },
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
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
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
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
        criterion: toPlainText($tStore(`testes.accessibility.item${i}.criterion`)),
        level: $tStore(`testes.accessibility.item${i}.level`),
        how: toPlainText($tStore(`testes.accessibility.item${i}.how`)),
      })),
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [1, 2, 3, 4, 5].map((i) => ({
        story: toPlainText($tStore(`testes.visual.item${i}.story`)),
        priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
      })),
    }}
  />
</DocsPageLayout>
