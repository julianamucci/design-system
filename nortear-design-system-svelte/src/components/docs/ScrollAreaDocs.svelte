<script lang="ts">
  import { untrack } from 'svelte';
  import { ScrollArea } from '@/components/ui/scroll-area';
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
  import scrollAreaTranslations from '@shared/content/scroll-area/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(scrollAreaTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = $derived(
    Object.values(
      (scrollAreaTranslations as unknown as Record<
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
      componentSlug: 'scroll-area',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/layout' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'scroll-area',
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
    track('docs_section_viewed', { section_id: id, component_name: 'scroll-area', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Demo data ───────────────────────────────────────────────────────────────

  const VERTICAL_TAGS = Array.from({ length: 30 }, (_, i) => i + 1);
  const HORIZONTAL_CARDS = Array.from({ length: 10 }, (_, i) => i + 1);
  const MATRIX_ROWS = Array.from({ length: 12 }, (_, i) => i + 1);
  const MATRIX_COLS = Array.from({ length: 12 }, (_, i) => i + 1);

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import { ScrollArea } from "@/components/ui/scroll-area";`;

  const verticalCode = `<div>
  <ScrollArea orientation="vertical" size="xl" class="nds-w-full nds-rounded-md nds-border-default">
    <div class="nds-stack nds-p-4" data-spacing="sm">
      {#each tags as tag}
        <div class="nds-text-body">Tag {tag}</div>
      {/each}
    </div>
  </ScrollArea>
</div>`;

  const horizontalCode = `<div style="width: 500px">
  <ScrollArea orientation="horizontal" size="md" class="nds-w-full nds-whitespace-nowrap nds-rounded-md nds-border-default">
    <div class="nds-cluster nds-p-4" data-spacing="md" style="width: max-content">
      {#each items as item}
        <Card {...item} />
      {/each}
    </div>
  </ScrollArea>
</div>`;

  const codeBoth = `<div style="width: 500px">
  <ScrollArea orientation="both" size="xl" class="nds-w-full nds-rounded-md nds-border-default">
    <table style="width: max-content"><!-- conteúdo amplo --></table>
  </ScrollArea>
</div>`;

  const interfaceCode = `// bits-ui ScrollArea (Svelte)
import type { ScrollArea as ScrollAreaPrimitive } from "bits-ui";

interface ScrollAreaRootProps {
  type?: "auto" | "always" | "scroll" | "hover"; // default "hover"
  scrollHideDelay?: number;                      // default 600
  orientation?: "vertical" | "horizontal" | "both"; // wrapper local
  scrollbarXClasses?: string;
  scrollbarYClasses?: string;
  class?: string;
  children: Snippet;
}

// O wrapper local emite ScrollBar(s) automaticamente conforme orientation.
// Componentes internos (Viewport, Scrollbar, Thumb, Corner) são gerenciados pela lib.`;
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
    <div class="nds-stack nds-w-full" data-spacing="xl">
      <!-- Demo 1: Vertical -->
      <div class="nds-stack" data-spacing="sm">
        <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
          {$tStore('demonstration.labels.verticalTitle')}
        </p>
        <div class="nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden" style="width: 100%; max-width: 360px;">
          <ScrollArea orientation="vertical" size="xl" class="nds-w-full">
            <div class="nds-stack nds-p-4" data-spacing="sm">
              {#each VERTICAL_TAGS as n (n)}
 <div class="nds-text-body nds-border-b nds-last-border-0 nds-pb-2">
                  {$tStore('demonstration.labels.tag')} {n}
                </div>
              {/each}
            </div>
          </ScrollArea>
        </div>
      </div>

      <!-- Demo 2: Horizontal -->
      <div class="nds-stack" data-spacing="sm">
        <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
          {$tStore('demonstration.labels.horizontalTitle')}
        </p>
        <div class="nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden" style="width: 100%; max-width: 500px;">
          <ScrollArea orientation="horizontal" size="md" class="nds-w-full nds-whitespace-nowrap">
            <div class="nds-cluster nds-p-4" data-spacing="md" style="width: max-content">
              {#each HORIZONTAL_CARDS as n (n)}
                <div class="nds-cluster nds-rounded-md nds-bg-muted nds-text-body nds-shrink-0" data-align="center" data-justify="center" style="height: 120px; width: 140px">
                  Card {n}
                </div>
              {/each}
            </div>
          </ScrollArea>
        </div>
      </div>

      <!-- Demo 3: Both -->
      <div class="nds-stack" data-spacing="sm">
        <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
          {$tStore('demonstration.labels.bothTitle')}
        </p>
        <div class="nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden" style="width: 100%; max-width: 500px;">
          <ScrollArea orientation="both" size="lg" class="nds-w-full">
            <table class="nds-border-collapse nds-text-caption" style="width: max-content">
              <tbody>
                {#each MATRIX_ROWS as r (r)}
                  <tr>
                    {#each MATRIX_COLS as c (c)}
                      <td class="nds-border-default nds-whitespace-nowrap" style="padding: 0.5rem 0.75rem">R{r}·C{c}</td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      </div>
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
        { element: $tStore('usage.uxWriting.table.container.name'),  rules: toPlainText($tStore('usage.uxWriting.table.container.format')),  do: toPlainText($tStore('usage.uxWriting.table.container.good')),  dont: toPlainText($tStore('usage.uxWriting.table.container.bad')) },
        { element: $tStore('usage.uxWriting.table.scrollArea.name'), rules: toPlainText($tStore('usage.uxWriting.table.scrollArea.format')), do: toPlainText($tStore('usage.uxWriting.table.scrollArea.good')), dont: toPlainText($tStore('usage.uxWriting.table.scrollArea.bad')) },
        { element: $tStore('usage.uxWriting.table.orientation.name'),rules: $tStore('usage.uxWriting.table.orientation.format'),          do: $tStore('usage.uxWriting.table.orientation.good'),          dont: $tStore('usage.uxWriting.table.orientation.bad') },
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
    <div class="nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden" style="width: 100%;">
      <ScrollArea orientation="vertical" size="sm" class="nds-w-full">
        <div class="nds-stack nds-text-caption nds-p-4" data-spacing="sm">
          {#each Array.from({ length: 12 }, (_, i) => i + 1) as i (i)}
            <div>Item {i}</div>
          {/each}
        </div>
      </ScrollArea>
    </div>
  {/snippet}
  <!-- Sem `size` de propósito: a legenda deste par é "não envolva conteúdo de
       altura indefinida — ScrollArea fica invisível", e o preview É a falha.
       Dar altura a ele faria a página mostrar o certo com a legenda do errado. -->
  {#snippet dontPair1()}
    <div class="nds-w-full">
      <ScrollArea orientation="vertical" class="nds-w-full nds-rounded-md nds-border-default">
        <div class="nds-stack nds-text-caption nds-p-4" data-spacing="sm">
          {#each Array.from({ length: 5 }, (_, i) => i + 1) as i (i)}
            <div>Item {i}</div>
          {/each}
        </div>
      </ScrollArea>
    </div>
  {/snippet}
  {#snippet doPair2()}
    <div class="nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden" style="width: 100%;">
      <ScrollArea orientation="vertical" size="sm" class="nds-w-full">
        <div class="nds-stack nds-text-caption nds-p-4" data-spacing="sm">
          {#each Array.from({ length: 14 }, (_, i) => i + 1) as i (i)}
            <div>Linha {i}</div>
          {/each}
        </div>
      </ScrollArea>
    </div>
  {/snippet}
  {#snippet dontPair2()}
    <div class="nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden" style="width: 100%;">
      <ScrollArea orientation="vertical" size="sm" class="nds-w-full">
        <div>
          <ScrollArea orientation="vertical" size="sm" class="nds-w-full">
            <div class="nds-stack nds-text-caption nds-p-4" data-spacing="sm">
              {#each Array.from({ length: 14 }, (_, i) => i + 1) as i (i)}
                <div>Linha {i}</div>
              {/each}
            </div>
          </ScrollArea>
        </div>
      </ScrollArea>
    </div>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport title={$tStore('import.title')} code={codeImportBasic} />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    items={[
      { name: $tStore('variants.items.vertical'),   description: stripHtml($tStore('variants.styles.vertical')),   code: verticalCode,   preview: variantVertical   },
      { name: $tStore('variants.items.horizontal'), description: stripHtml($tStore('variants.styles.horizontal')), code: horizontalCode, preview: variantHorizontal },
      { name: $tStore('variants.items.both'),       description: stripHtml($tStore('variants.styles.both')),       code: codeBoth,       preview: variantBoth       },
    ]}
  />

  {#snippet variantVertical()}
    <div class="nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden" style="width: 100%; max-width: 300px;">
      <ScrollArea orientation="vertical" size="md" class="nds-w-full">
        <div class="nds-stack nds-text-caption nds-p-4" data-spacing="sm">
          {#each VERTICAL_TAGS.slice(0, 20) as n (n)}
 <div class="nds-border-b nds-last-border-0 nds-pb-1">{$tStore('demonstration.labels.tag')} {n}</div>
          {/each}
        </div>
      </ScrollArea>
    </div>
  {/snippet}
  {#snippet variantHorizontal()}
    <div class="nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden" style="width: 100%; max-width: 420px;">
      <ScrollArea orientation="horizontal" size="sm" class="nds-w-full nds-whitespace-nowrap">
        <div class="nds-cluster nds-p-4" data-spacing="sm" style="width: max-content">
          {#each HORIZONTAL_CARDS as n (n)}
            <div class="nds-cluster nds-rounded-md nds-bg-muted nds-text-caption nds-shrink-0" data-align="center" data-justify="center" style="height: 90px; width: 120px">
              Card {n}
            </div>
          {/each}
        </div>
      </ScrollArea>
    </div>
  {/snippet}
  {#snippet variantBoth()}
    <div class="nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden" style="width: 100%; max-width: 420px;">
      <ScrollArea orientation="both" size="md" class="nds-w-full">
        <table class="nds-border-collapse nds-text-caption" style="width: max-content">
          <tbody>
            {#each MATRIX_ROWS.slice(0, 10) as r (r)}
              <tr>
                {#each MATRIX_COLS.slice(0, 10) as c (c)}
                  <td class="nds-border-default nds-px-2 nds-py-1 nds-whitespace-nowrap">R{r}·C{c}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </ScrollArea>
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
      { label: $tStore('states.idle.label'),      trigger: toPlainText($tStore('states.idle.trigger')),      behavior: toPlainText($tStore('states.idle.behavior')) },
      { label: $tStore('states.scrolling.label'), trigger: toPlainText($tStore('states.scrolling.trigger')), behavior: toPlainText($tStore('states.scrolling.behavior')) },
      { label: $tStore('states.hover.label'),     trigger: toPlainText($tStore('states.hover.trigger')),     behavior: toPlainText($tStore('states.hover.behavior')) },
      { label: $tStore('states.focus.label'),     trigger: toPlainText($tStore('states.focus.trigger')),     behavior: toPlainText($tStore('states.focus.behavior')) },
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
          { name: 'type',            type: $tStore('props.table.type_prop.type'),        defaultValue: $tStore('props.table.type_prop.default'),        required: $tStore('props.table.type_prop.required'),        description: toPlainText($tStore('props.table.type_prop.description'))        },
          { name: 'scrollHideDelay', type: $tStore('props.table.scrollHideDelay.type'),  defaultValue: $tStore('props.table.scrollHideDelay.default'),  required: $tStore('props.table.scrollHideDelay.required'),  description: toPlainText($tStore('props.table.scrollHideDelay.description'))  },
          { name: 'orientation',     type: '"vertical" | "horizontal" | "both"',         defaultValue: '"vertical"',                                    required: 'Não',                                            description: 'Direção do scroll suportada — controla quais ScrollBars o wrapper renderiza.' },
          { name: 'class',           type: $tStore('props.table.className.type'),        defaultValue: $tStore('props.table.className.default'),        required: $tStore('props.table.className.required'),        description: toPlainText($tStore('props.table.className.description'))        },
          { name: 'children',        type: 'Snippet',                                    defaultValue: '—',                                             required: 'Sim',                                            description: 'Conteúdo renderizado dentro do Viewport.' },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={$tStore('props.extensibilityCode')}
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
      // O pegador saiu de `--border` (1.25:1 contra o fundo, medido) para
      // `--muted-foreground`, que é o que torna verdadeiro o contraste de 3:1
      // do contrato de teste — ver o comentário na folha compartilhada.
      { token: '--muted-foreground', value: $tStore('tokens.table.thumb.class'),      description: $tStore('tokens.table.thumb.part')      },
      { token: '--ring',             value: $tStore('tokens.table.ring.class'),       description: $tStore('tokens.table.ring.part')       },
      // Fundo e texto do viewport são HERDADOS de quem usa o container: a
      // folha compartilhada não escreve `background-color` em regra nenhuma
      // nem `color` no viewport, então a aplicação fica em travessão — não há
      // seletor para abrir e mudar.
      { token: '--background',       value: $tStore('tokens.table.background.class'), description: $tStore('tokens.table.background.part') },
      { token: '--foreground',       value: $tStore('tokens.table.foreground.class'), description: $tStore('tokens.table.foreground.part') },
      // Sem linha de `--muted`: a trilha da barra é transparente — a regra
      // `.nds-scroll-area-scrollbar` nunca declara `background-color` —, e
      // prometer um ponto de customização que ninguém lê manda quem lê procurar
      // por um seletor que não existe.
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
      stripHtml($tStore('accessibility.items.item3')),
      $tStore('accessibility.items.item4'),
      stripHtml($tStore('accessibility.items.item5')),
      $tStore('accessibility.items.item6'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboard.title')}
    keyboardItems={[
      { key: 'Tab',       description: $tStore('accessibility.keyboard.tab')        },
      { key: 'Arrow Down',         description: $tStore('accessibility.keyboard.arrowDown')  },
      { key: 'Arrow Up',         description: $tStore('accessibility.keyboard.arrowUp')    },
      { key: 'Arrow Right',         description: $tStore('accessibility.keyboard.arrowRight') },
      { key: 'Arrow Left',         description: $tStore('accessibility.keyboard.arrowLeft')  },
      { key: 'PageDown',  description: $tStore('accessibility.keyboard.pageDown')   },
      { key: 'PageUp',    description: $tStore('accessibility.keyboard.pageUp')     },
      { key: 'Home',      description: $tStore('accessibility.keyboard.home')       },
      { key: 'End',       description: $tStore('accessibility.keyboard.end')        },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: $tStore('related.items.resizable.name'), description: $tStore('related.items.resizable.description'), path: '?path=/docs/ui-resizable--docs' },
      { name: $tStore('related.items.sheet.name'),     description: $tStore('related.items.sheet.description'),     path: '?path=/docs/ui-sheet--docs'     },
      { name: $tStore('related.items.dialog.name'),    description: $tStore('related.items.dialog.description'),    path: '?path=/docs/ui-dialog--docs'    },
      { name: $tStore('related.items.command.name'),   description: $tStore('related.items.command.description'),   path: '?path=/docs/ui-command--docs'   },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: stripHtml($tStore('notes.item1')) },
      { title: '', content: stripHtml($tStore('notes.item2')) },
      { title: '', content: stripHtml($tStore('notes.item3')) },
      { title: '', content: stripHtml($tStore('notes.item4')) },
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
      { event: 'content_scroll', trigger: toPlainText($tStore('analytics.table.content_scroll.trigger')), payload: $tStore('analytics.table.content_scroll.payload') },
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
        { criterion: $tStore('testes.accessibility.item1'), level: 'AA',     how: 'axe-core' },
        { criterion: $tStore('testes.accessibility.item2'), level: '1.4.11', how: 'Contrast checker' },
        { criterion: $tStore('testes.accessibility.item3'), level: '2.4.7',  how: 'Keyboard test' },
        { criterion: $tStore('testes.accessibility.item4'), level: '2.1.1',  how: 'Keyboard test' },
        { criterion: $tStore('testes.accessibility.item5'), level: '1.4.10', how: 'Manual mobile test' },
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
