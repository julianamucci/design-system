<script lang="ts">
  import { AspectRatio } from '@/components/ui/aspect-ratio';
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
  import aspectRatioTranslations from '@shared/content/aspect-ratio/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(aspectRatioTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'aspect-ratio',
    });
    track('docs_page_view', {
      component_name: 'aspect-ratio',
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

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'aspect-ratio', locale: $locale });
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

  const IMG_LANDSCAPE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop&q=60';
  const IMG_PRODUCT = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=60';
  const IMG_AVATAR = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=60';
  const IMG_PORTRAIT = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&auto=format&fit=crop&q=60';
  const IMG_ULTRA = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&auto=format&fit=crop&q=60';

  // ─── Anatomy ASCII ───────────────────────────────────────────────────────────

  const anatomyStructureCode = `<AspectRatio ratio={16 / 9}>
  <!-- padding-bottom: 56.25% -->
  <div class="absolute inset-0">
    <img class="w-full h-full object-cover" alt="..." />
  </div>
</AspectRatio>`;

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import { AspectRatio } from "@/components/ui/aspect-ratio";`;

  const codeImportWithImage = `import { AspectRatio } from "@/components/ui/aspect-ratio";

<AspectRatio ratio={16 / 9}>
  <img
    src="/hero.jpg"
    alt="Gráfico de vendas 2025"
    class="w-full h-full object-cover rounded-md"
  />
</AspectRatio>`;

  const codeSixteenNine = `<AspectRatio ratio={16 / 9}>
  <img src="/video-cover.jpg" alt="Tutorial" loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
</AspectRatio>`;

  const codeFourThree = `<AspectRatio ratio={4 / 3}>
  <img src="/product.jpg" alt="Sapato azul tamanho 42" loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
</AspectRatio>`;

  const codeSquare = `<AspectRatio ratio={1}>
  <img src="/avatar.jpg" alt="Avatar do usuário" loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
</AspectRatio>`;

  const codeThreeFour = `<AspectRatio ratio={3 / 4}>
  <img src="/cover.jpg" alt="Capa do livro" loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
</AspectRatio>`;

  const codeUltraWide = `<AspectRatio ratio={21 / 9}>
  <img src="/hero-wide.jpg" alt="Hero panorâmico" loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
</AspectRatio>`;

  const interfaceCode = `interface AspectRatioProps {
  ratio?: number;
  asChild?: boolean;
  class?: string;
  children?: Snippet;
}`;

  const codeCustomizationTokens = `/* AspectRatio herda tokens do filho — aplique no <img>, <video>, <iframe> */
<AspectRatio ratio={16 / 9}>
  <img class="w-full h-full object-cover rounded-md" alt="..." />
</AspectRatio>`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value}>
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npx shadcn-svelte@latest add aspect-ratio"
    />
  {/snippet}

      <!-- ── Demonstração ───────────────────────────────────────────── -->
      <DocsDemonstration title={$tStore('demonstration.title')}>
        {#snippet children()}
          <div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="space-y-2">
              <p class="text-xs font-medium text-muted-foreground">{$tStore('demonstration.labels.sixteenNine')}</p>
              <AspectRatio ratio={16 / 9}>
                <img src={IMG_LANDSCAPE} alt="Paisagem ao entardecer" loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
              </AspectRatio>
            </div>
            <div class="space-y-2">
              <p class="text-xs font-medium text-muted-foreground">{$tStore('demonstration.labels.fourThree')}</p>
              <AspectRatio ratio={4 / 3}>
                <img src={IMG_PRODUCT} alt="Produto em destaque" loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
              </AspectRatio>
            </div>
            <div class="space-y-2">
              <p class="text-xs font-medium text-muted-foreground">{$tStore('demonstration.labels.square')}</p>
              <AspectRatio ratio={1}>
                <img src={IMG_AVATAR} alt="Avatar de usuário" loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
              </AspectRatio>
            </div>
            <div class="space-y-2">
              <p class="text-xs font-medium text-muted-foreground">{$tStore('demonstration.labels.threeFour')}</p>
              <AspectRatio ratio={3 / 4}>
                <img src={IMG_PORTRAIT} alt="Retrato vertical" loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
              </AspectRatio>
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
        ]}
        structureCode={anatomyStructureCode}
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
            { s: $tStore('usage.scenarios.item1.s'), u: $tStore('usage.scenarios.item1.u'), a: stripHtml($tStore('usage.scenarios.item1.a')) },
            { s: $tStore('usage.scenarios.item2.s'), u: $tStore('usage.scenarios.item2.u'), a: stripHtml($tStore('usage.scenarios.item2.a')) },
            { s: $tStore('usage.scenarios.item3.s'), u: $tStore('usage.scenarios.item3.u'), a: stripHtml($tStore('usage.scenarios.item3.a')) },
            { s: $tStore('usage.scenarios.item4.s'), u: $tStore('usage.scenarios.item4.u'), a: stripHtml($tStore('usage.scenarios.item4.a')) },
            { s: $tStore('usage.scenarios.item5.s'), u: $tStore('usage.scenarios.item5.u'), a: stripHtml($tStore('usage.scenarios.item5.a')) },
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
        <div class="w-full max-w-xs">
          <AspectRatio ratio={16 / 9}>
            <img src={IMG_LANDSCAPE} alt="Paisagem com object-cover" loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
          </AspectRatio>
        </div>
      {/snippet}
      {#snippet dontPair1()}
        <div class="w-full max-w-xs">
          <AspectRatio ratio={16 / 9}>
            <img src={IMG_LANDSCAPE} alt="Paisagem com object-contain" loading="lazy" decoding="async" class="w-full h-full object-contain rounded-md bg-muted" />
          </AspectRatio>
        </div>
      {/snippet}
      {#snippet doPair2()}
        <div class="w-full max-w-xs">
          <AspectRatio ratio={1}>
            <img src={IMG_AVATAR} alt="Avatar arredondado no filho" loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
          </AspectRatio>
        </div>
      {/snippet}
      {#snippet dontPair2()}
        <div class="w-full max-w-xs rounded-md overflow-hidden">
          <AspectRatio ratio={1}>
            <img src={IMG_AVATAR} alt="Radius aplicado ao container" loading="lazy" decoding="async" class="w-full h-full object-cover" />
          </AspectRatio>
        </div>
      {/snippet}

      <!-- ── Importação ─────────────────────────────────────────────── -->
      <DocsImport
        title={$tStore('import.title')}
        code={codeImportBasic}
        secondaryCode={codeImportWithImage}
      />

      <!-- ── Variantes ──────────────────────────────────────────────── -->
      <DocsVariants
        title={$tStore('variants.title')}
        items={[
          { name: '16 / 9', description: $tStore('variants.items.sixteenNine'), code: codeSixteenNine, preview: variantSixteenNine },
          { name: '4 / 3',  description: $tStore('variants.items.fourThree'),  code: codeFourThree,   preview: variantFourThree   },
          { name: '1 / 1',  description: $tStore('variants.items.square'),     code: codeSquare,      preview: variantSquare      },
          { name: '3 / 4',  description: $tStore('variants.items.threeFour'),  code: codeThreeFour,   preview: variantThreeFour   },
          { name: '21 / 9', description: $tStore('variants.items.ultraWide'),  code: codeUltraWide,   preview: variantUltraWide   },
        ]}
      />

      {#snippet variantSixteenNine()}
        <div class="w-full max-w-md">
          <AspectRatio ratio={16 / 9}>
            <img src={IMG_LANDSCAPE} alt="Paisagem 16:9" loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
          </AspectRatio>
        </div>
      {/snippet}
      {#snippet variantFourThree()}
        <div class="w-full max-w-md">
          <AspectRatio ratio={4 / 3}>
            <img src={IMG_PRODUCT} alt="Imagem de produto 4:3" loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
          </AspectRatio>
        </div>
      {/snippet}
      {#snippet variantSquare()}
        <div class="w-52">
          <AspectRatio ratio={1}>
            <img src={IMG_AVATAR} alt="Avatar quadrado 1:1" loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
          </AspectRatio>
        </div>
      {/snippet}
      {#snippet variantThreeFour()}
        <div class="w-52">
          <AspectRatio ratio={3 / 4}>
            <img src={IMG_PORTRAIT} alt="Retrato 3:4" loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
          </AspectRatio>
        </div>
      {/snippet}
      {#snippet variantUltraWide()}
        <div class="w-full max-w-xl">
          <AspectRatio ratio={21 / 9}>
            <img src={IMG_ULTRA} alt="Hero ultra-wide 21:9" loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
          </AspectRatio>
        </div>
      {/snippet}

      <!-- ── Estados ────────────────────────────────────────────────── -->
      <DocsStates
        title={$tStore('states.title')}
        cols={{
          state: $tStore('props.table.prop'),
          trigger: $tNavStore('common.userAction'),
          behavior: $tNavStore('common.expectedResult'),
        }}
        items={[
          { label: $tStore('states.item1.label'), trigger: $tStore('states.item1.trigger'), behavior: $tStore('states.item1.behavior')             },
          { label: $tStore('states.item2.label'), trigger: $tStore('states.item2.trigger'), behavior: $tStore('states.item2.behavior')             },
          { label: $tStore('states.item3.label'), trigger: $tStore('states.item3.trigger'), behavior: stripHtml($tStore('states.item3.behavior')) },
        ]}
      />

      <!-- ── Propriedades ───────────────────────────────────────────── -->
      <DocsProps
        title={$tStore('props.title')}
        tables={[
          {
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'ratio',    type: 'number',  defaultValue: '1',       required: 'Não', description: stripHtml($tStore('props.table.ratio'))     },
              { name: 'children', type: 'Snippet', defaultValue: '—',       required: 'Sim', description: stripHtml($tStore('props.table.children'))  },
              { name: 'asChild',  type: 'boolean', defaultValue: 'false',   required: 'Não', description: stripHtml($tStore('props.table.asChild'))   },
              { name: 'class',    type: 'string',  defaultValue: '—',       required: 'Não', description: stripHtml($tStore('props.table.className')) },
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
          { token: '--radius', value: 'rounded-md',    description: $tStore('tokens.table.radius') },
          { token: '--border', value: 'border',        description: $tStore('tokens.table.border') },
          { token: '--muted',  value: 'bg-muted',      description: $tStore('tokens.table.muted')  },
        ]}
        customizationTitle={$tStore('tokens.customizationTitle')}
        customizationCode={codeCustomizationTokens}
      />

      <!-- ── Acessibilidade ─────────────────────────────────────────── -->
      <DocsAccessibility
        title={$tStore('accessibility.title')}
        summary={$tStore('accessibility.summary')}
        items={[
          $tStore('accessibility.aria.item1'),
          $tStore('accessibility.aria.item2'),
          $tStore('accessibility.aria.item3'),
          $tStore('accessibility.aria.item4'),
          $tStore('accessibility.aria.item5'),
        ]}
        keyboardTitle={$tStore('accessibility.keyboard.title')}
        keyboardItems={[
          { key: '—', description: $tStore('accessibility.keyboard.item1') },
          { key: 'Tab', description: $tStore('accessibility.keyboard.note') },
        ]}
      />

      <!-- ── Relacionados ───────────────────────────────────────────── -->
      <DocsRelated
        title={$tStore('related.title')}
        items={[
          { name: 'Avatar',     description: $tStore('related.avatar'),   path: '?path=/docs/ui-avatar--docs'     },
          { name: 'Card',       description: $tStore('related.card'),     path: '?path=/docs/ui-card--docs'       },
          { name: 'Skeleton',   description: $tStore('related.skeleton'), path: '?path=/docs/ui-skeleton--docs'   },
          { name: 'ScrollArea', description: $tStore('related.aspectRatio'), path: '?path=/docs/ui-scrollarea--docs' },
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
          trigger: $tStore('analytics.table.trigger'),
          payload: $tStore('analytics.table.payload'),
        }}
        items={[
          { event: '—', trigger: stripHtml($tStore('analytics.note')), payload: '—' },
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
            { action: stripHtml($tStore('testes.functional.item1.action')), result: stripHtml($tStore('testes.functional.item1.result')), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
            { action: stripHtml($tStore('testes.functional.item2.action')), result: stripHtml($tStore('testes.functional.item2.result')), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
            { action: stripHtml($tStore('testes.functional.item3.action')), result: stripHtml($tStore('testes.functional.item3.result')), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
            { action: stripHtml($tStore('testes.functional.item4.action')), result: stripHtml($tStore('testes.functional.item4.result')), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
            { action: stripHtml($tStore('testes.functional.item5.action')), result: stripHtml($tStore('testes.functional.item5.result')), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
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
            { criterion: stripHtml($tStore('testes.accessibility.item1.criterion')), level: $tStore('testes.accessibility.item1.level'), how: $tStore('testes.accessibility.item1.how') },
            { criterion: stripHtml($tStore('testes.accessibility.item2.criterion')), level: $tStore('testes.accessibility.item2.level'), how: $tStore('testes.accessibility.item2.how') },
            { criterion: stripHtml($tStore('testes.accessibility.item3.criterion')), level: $tStore('testes.accessibility.item3.level'), how: $tStore('testes.accessibility.item3.how') },
            { criterion: stripHtml($tStore('testes.accessibility.item4.criterion')), level: $tStore('testes.accessibility.item4.level'), how: stripHtml($tStore('testes.accessibility.item4.how')) },
            { criterion: stripHtml($tStore('testes.accessibility.item5.criterion')), level: $tStore('testes.accessibility.item5.level'), how: stripHtml($tStore('testes.accessibility.item5.how')) },
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
