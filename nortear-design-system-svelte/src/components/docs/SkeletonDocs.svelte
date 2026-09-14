<script lang="ts">
  import { untrack } from 'svelte';
  import { Skeleton, SkeletonRegion } from '@/components/ui/skeleton';
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
  import skeletonTranslations from '@shared/content/skeleton/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(skeletonTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria. O
  // `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = $derived(
    Object.entries(
      (skeletonTranslations as unknown as Record<
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
      componentSlug: 'skeleton',
    });
    track('docs_page_view', {
      component_name: 'skeleton',
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
    track('docs_section_viewed', { section_id: id, component_name: 'skeleton', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };
  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // Ordem da tabela de tokens, a mesma nas cinco stacks. Lista de chaves, e não
  // linha por extenso: o nome do token mora no conteúdo compartilhado.
  const TOKEN_KEYS = ['background', 'rounded', 'roundedFull', 'animation', 'duration', 'motionReduce', 'size'] as const;

  const UX_WRITING_KEYS = ['ariaLabel', 'dimensions', 'shape', 'motionReduce'] as const;

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";`;

  // O snippet ensina o container de proporção: a classe de mídia do preview é da
  // docs page, não da API, e `fill` sozinho nasce com altura zero.
  const codeRectangle = `<AspectRatio ratio={16 / 9}>\n  <Skeleton data-shape="fill" />\n</AspectRatio>`;
  const codeCircle = `<Skeleton data-shape="avatar" />`;
  const codeLine = `<Skeleton data-shape="text" data-width="3-4" />`;

  // Sem props próprias além de class: a caixa vem de atributo, e a folha de
  // estilo continua dona das medidas. A região é peça à parte, sem tabela
  // própria: papel e estado não são sobrescrevíveis, e o nome é obrigatório.
  const interfaceCode = `interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  class?: string;
  // data-shape: "text" | "heading" | "avatar" | "fill"
  // data-width: "full" | "3-4" | "2-3" | "1-2" | "1-3"
  // data-size:  "sm" | "lg"   (só na forma de avatar)
}

// A espera é anunciada pela REGIÃO: role="status", aria-busy="true" e nome
// acessível, escritos pela peça. Quando o conteúdo chega, ela sai.
interface SkeletonRegionProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "role" | "aria-busy" | "aria-label"> {
  label: string;
  class?: string;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="skeleton">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration componentSlug="skeleton">
    <div class="nds-grid nds-w-full" data-cols="2" data-spacing="lg" style="--grid-min: 16rem">
      <!-- Card de perfil -->
      <div class="nds-stack" data-spacing="sm">
        <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">{$tStore('demonstration.labels.card')}</p>
        <SkeletonRegion
          label={$tStore('demonstration.regionLabels.card')}
          class="nds-cluster"
          data-spacing="md"
          data-align="center"
        >
          <Skeleton data-shape="avatar" />
          <div class="nds-stack nds-flex-1" data-spacing="sm">
            <Skeleton data-shape="text" data-width="2-3" />
            <Skeleton data-shape="text" data-width="1-2" />
          </div>
        </SkeletonRegion>
      </div>

      <!-- Lista -->
      <div class="nds-stack" data-spacing="sm">
        <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">{$tStore('demonstration.labels.list')}</p>
        <!-- Uma região para a lista INTEIRA: região por item repetiria o mesmo
             aviso a cada linha — cinco itens de três peças seriam quinze avisos. -->
        <SkeletonRegion label={$tStore('demonstration.regionLabels.list')} class="nds-stack" data-spacing="md">
          {#each Array.from({ length: 5 }) as _, i (i)}
            <div class="nds-cluster" data-spacing="sm" data-align="center">
              <Skeleton data-shape="avatar" data-size="sm" />
              <div class="nds-stack nds-flex-1" data-spacing="xs">
                <Skeleton data-shape="text" data-width="2-3" />
                <Skeleton data-shape="text" data-width="1-3" />
              </div>
            </div>
          {/each}
        </SkeletonRegion>
      </div>

      <!-- Imagem AspectRatio -->
      <div class="nds-stack" data-spacing="sm">
        <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">{$tStore('demonstration.labels.image')}</p>
        <SkeletonRegion label={$tStore('demonstration.regionLabels.image')}>
          <AspectRatio ratio={16 / 9}>
            <Skeleton data-shape="fill" />
          </AspectRatio>
        </SkeletonRegion>
      </div>

      <!-- Parágrafo -->
      <div class="nds-stack" data-spacing="sm">
        <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">{$tStore('demonstration.labels.paragraph')}</p>
        <SkeletonRegion label={$tStore('demonstration.regionLabels.paragraph')} class="nds-stack" data-spacing="sm">
          <Skeleton data-shape="text" data-width="full" />
          <Skeleton data-shape="text" data-width="3-4" />
          <Skeleton data-shape="text" data-width="1-2" />
        </SkeletonRegion>
      </div>
    </div>
  </DocsDemonstration>

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
    items={[
      $tStore('anatomy.item1'),
      $tStore('anatomy.item2'),
      $tStore('anatomy.item3'),
    ]}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={$tStore('anatomy.structureCode')}
  />

  <!-- ── Quando Usar ────────────────────────────────────────────── -->
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
        { s: $tStore('usage.scenarios.item1.s'), u: $tStore('usage.scenarios.item1.u'), a: toPlainText($tStore('usage.scenarios.item1.a')) },
        { s: $tStore('usage.scenarios.item2.s'), u: $tStore('usage.scenarios.item2.u'), a: toPlainText($tStore('usage.scenarios.item2.a')) },
        { s: $tStore('usage.scenarios.item3.s'), u: $tStore('usage.scenarios.item3.u'), a: toPlainText($tStore('usage.scenarios.item3.a')) },
        { s: $tStore('usage.scenarios.item4.s'), u: $tStore('usage.scenarios.item4.u'), a: toPlainText($tStore('usage.scenarios.item4.a')) },
        { s: $tStore('usage.scenarios.item5.s'), u: $tStore('usage.scenarios.item5.u'), a: toPlainText($tStore('usage.scenarios.item5.a')) },
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
      items: UX_WRITING_KEYS.map((k) => ({
        element: $tStore(`usage.uxWriting.table.${k}.name`),
        rules: $tStore(`usage.uxWriting.table.${k}.format`),
        do: $tStore(`usage.uxWriting.table.${k}.good`),
        dont: $tStore(`usage.uxWriting.table.${k}.bad`),
      })),
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
    <SkeletonRegion label={$tStore('doDont.regionLabels.pair1')} class="nds-w-full nds-max-w-sm nds-stack" data-spacing="sm">
      <Skeleton data-shape="heading" data-width="1-2" />
      <Skeleton data-shape="text" data-width="full" />
      <Skeleton data-shape="text" data-width="3-4" />
    </SkeletonRegion>
  {/snippet}
  {#snippet dontPair1()}
    <!-- O defeito deste par é a CAIXA, não a acessibilidade: a região continua
         certa, e o que falta é imitar o conteúdo — uma linha genérica só. -->
    <SkeletonRegion label={$tStore('doDont.regionLabels.pair1')} class="nds-w-full nds-max-w-sm nds-stack" data-spacing="sm">
      <Skeleton data-shape="text" data-width="1-3" />
    </SkeletonRegion>
  {/snippet}
  {#snippet doPair2()}
    <SkeletonRegion label={$tStore('doDont.regionLabels.pair2')} class="nds-cluster nds-w-full" data-spacing="sm" data-align="center">
      <Skeleton data-shape="avatar" />
      <div class="nds-stack nds-flex-1" data-spacing="xs">
        <Skeleton data-shape="text" data-width="1-2" />
        <Skeleton data-shape="text" data-width="1-3" />
      </div>
    </SkeletonRegion>
  {/snippet}
  {#snippet dontPair2()}
    <!-- Sem região: é justamente o que falta no "não faça" — o esqueleto solto
         não anuncia carregamento nenhum. -->
    <div class="nds-cluster nds-w-full" data-spacing="sm" data-align="center">
      <Skeleton data-shape="avatar" />
      <div class="nds-stack nds-flex-1" data-spacing="xs">
        <Skeleton data-shape="text" data-width="1-2" />
        <Skeleton data-shape="text" data-width="1-3" />
      </div>
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport code={codeImportBasic} componentSlug="skeleton" />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    componentSlug="skeleton"
    items={[
      { trackId: 'rectangle', name: $tStore('variants.items.rectangle'), description: stripHtml($tStore('variants.styles.rectangle')), code: codeRectangle, preview: variantRectangle },
      { trackId: 'circle',    name: $tStore('variants.items.circle'),    description: stripHtml($tStore('variants.styles.circle')),    code: codeCircle,    preview: variantCircle    },
      { trackId: 'line',      name: $tStore('variants.items.line'),      description: stripHtml($tStore('variants.styles.line')),      code: codeLine,      preview: variantLine      },
    ]}
  />

  {#snippet variantRectangle()}
    <SkeletonRegion label={$tStore('demonstration.regionLabels.rectangle')} class="nds-w-full nds-max-w-sm">
      <Skeleton data-shape="fill" class="nds-docs-skeleton-media" />
    </SkeletonRegion>
  {/snippet}
  {#snippet variantCircle()}
    <SkeletonRegion label={$tStore('demonstration.regionLabels.circle')}>
      <Skeleton data-shape="avatar" />
    </SkeletonRegion>
  {/snippet}
  {#snippet variantLine()}
    <SkeletonRegion label={$tStore('demonstration.regionLabels.line')} class="nds-w-full nds-max-w-sm nds-stack" data-spacing="sm">
      <Skeleton data-shape="text" data-width="full" />
      <Skeleton data-shape="text" data-width="3-4" />
      <Skeleton data-shape="text" data-width="1-2" />
    </SkeletonRegion>
  {/snippet}

  <!-- ── Estados ────────────────────────────────────────────────── -->
  <DocsStates
    cols={{
      state: $tStore('states.cols.state'),
      trigger: toPlainText($tStore('states.cols.trigger')),
      behavior: toPlainText($tStore('states.cols.behavior')),
    }}
    items={[
      { label: $tStore('states.default.label'),       trigger: toPlainText($tStore('states.default.trigger')),       behavior: toPlainText($tStore('states.default.behavior')) },
      { label: $tStore('states.motionReduced.label'), trigger: toPlainText($tStore('states.motionReduced.trigger')), behavior: toPlainText($tStore('states.motionReduced.behavior')) },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
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
          { name: 'class',       type: $tStore('props.table.className.type'),  defaultValue: $tStore('props.table.className.default'),  required: $tStore('props.table.className.required'),  description: $tStore('props.table.className.description')  },
          { name: 'data-shape',  type: $tStore('props.table.dataShape.type'),  defaultValue: $tStore('props.table.dataShape.default'),  required: $tStore('props.table.dataShape.required'),  description: $tStore('props.table.dataShape.description')  },
          { name: 'data-width',  type: $tStore('props.table.dataWidth.type'),  defaultValue: $tStore('props.table.dataWidth.default'),  required: $tStore('props.table.dataWidth.required'),  description: $tStore('props.table.dataWidth.description')  },
          { name: 'data-size',   type: $tStore('props.table.dataSize.type'),   defaultValue: $tStore('props.table.dataSize.default'),   required: $tStore('props.table.dataSize.required'),   description: $tStore('props.table.dataSize.description')   },
          { name: 'aria-hidden', type: $tStore('props.table.ariaHidden.type'), defaultValue: $tStore('props.table.ariaHidden.default'), required: $tStore('props.table.ariaHidden.required'), description: $tStore('props.table.ariaHidden.description') },
          { name: '...rest',     type: $tStore('props.table.rest.type'),       defaultValue: $tStore('props.table.rest.default'),       required: $tStore('props.table.rest.required'),       description: $tStore('props.table.rest.description')       },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityCode={$tStore('props.extensibilityCode')}
  />

  <!-- ── Tokens ─────────────────────────────────────────────────── -->
  <DocsTokens
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={TOKEN_KEYS.map((k) => ({
      token: $tStore(`tokens.table.${k}.token`),
      value: $tStore(`tokens.table.${k}.class`),
      description: $tStore(`tokens.table.${k}.part`),
    }))}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={$tStore('tokens.customizationCode')}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    screenReaderTitle={$tNavStore('common.screenReader')}
    screenReaderItems={screenReaderItems}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.items.item1'),
      $tStore('accessibility.items.item2'),
      $tStore('accessibility.items.item3'),
      $tStore('accessibility.items.item4'),
      $tStore('accessibility.items.item5'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: '—',   description: $tStore('accessibility.keyboard.description') },
      { key: 'Tab', description: $tStore('accessibility.keyboard.noKeyboard') },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    componentSlug="skeleton"
    items={[
      { name: $tStore('related.items.progress.name'),    description: $tStore('related.items.progress.description'),    path: '?path=/docs/components-feedback-progress--docs'    },
      { name: $tStore('related.items.aspectRatio.name'), description: $tStore('related.items.aspectRatio.description'), path: '?path=/docs/components-layout-aspectratio--docs' },
      { name: $tStore('related.items.card.name'),        description: $tStore('related.items.card.description'),        path: '?path=/docs/components-layout-card--docs'        },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    componentSlug="skeleton"
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
    cols={{
      event: $tNavStore('common.event'),
      trigger: $tNavStore('common.eventTrigger'),
      payload: $tNavStore('common.payload'),
    }}
    items={[
      { event: '—', trigger: stripHtml($tStore('analytics.description')), payload: '—' },
    ]}
  />

  <!-- ── Testes ─────────────────────────────────────────────────── -->
  <DocsTestes
    functional={{
      title: $tStore('testes.functional.title'),
      cols: {
        action: $tNavStore('common.userAction'),
        result: $tNavStore('common.expectedResult'),
        priority: $tNavStore('common.priority'),
      },
      items: [
        { action: toPlainText($tStore('testes.functional.item1.action')), result: toPlainText($tStore('testes.functional.item1.result')), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item2.action')), result: toPlainText($tStore('testes.functional.item2.result')), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item3.action')), result: toPlainText($tStore('testes.functional.item3.result')), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item4.action')), result: toPlainText($tStore('testes.functional.item4.result')), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item5.action')), result: toPlainText($tStore('testes.functional.item5.result')), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
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
        { criterion: toPlainText($tStore('testes.accessibility.item1')), level: 'AA',    how: 'axe-core' },
        { criterion: toPlainText($tStore('testes.accessibility.item2')), level: '4.1.2', how: 'DevTools a11y tree' },
        { criterion: toPlainText($tStore('testes.accessibility.item3')), level: '4.1.2', how: 'DevTools a11y tree' },
        { criterion: toPlainText($tStore('testes.accessibility.item4')), level: '2.3.3', how: 'prefers-reduced-motion' },
        // Não é critério da WCAG: o esqueleto não transmite informação, então
        // 1.4.3 e 1.4.11 não se aplicam. O que se mede é luminância.
        { criterion: toPlainText($tStore('testes.accessibility.item5')), level: '—', how: $tStore('testes.accessibility.luminanceHow') },
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
