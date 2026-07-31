<script lang="ts">
  import { untrack } from 'svelte';
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from '@/components/ui/accordion';
  import Info from '@lucide/svelte/icons/info';
  import AlertTriangle from '@lucide/svelte/icons/triangle-alert';
  import CheckCircle2 from '@lucide/svelte/icons/circle-check-big';
  import { Badge } from '@/components/ui/badge';
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
  import accordionTranslations from '@shared/content/accordion/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(accordionTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'accordion',
    });
    track('docs_page_view', {
      component_name: 'accordion',
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
        { id: 'variantes',        label: tNav('nav.variants') },
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

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'accordion', locale: $locale });
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

  // ─── Demo tracking ───────────────────────────────────────────────────────────

  function handleDemoTriggerClick(e: MouseEvent, label: string) {
    const target = e.currentTarget as HTMLElement;
    const isOpen = target.getAttribute('data-state') === 'closed';
    track(isOpen ? 'accordion_expand' : 'accordion_collapse', {
      component: 'accordion',
      label,
      location: 'docs_demo',
    });
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImport = `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";`;

  const codeSingle = `<Accordion type="single" value="item-1">
  <AccordionItem value="item-1">
    <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
    <AccordionContent>
      Acesse a tela de login e clique em "Esqueci minha senha".
    </AccordionContent>
  </AccordionItem>
</Accordion>`;

  const codeMultiple = `<Accordion type="multiple">
  <AccordionItem value="especificacoes">
    <AccordionTrigger>Especificações técnicas</AccordionTrigger>
    <AccordionContent>CPU: Intel Core i7-12700, RAM: 16GB DDR5</AccordionContent>
  </AccordionItem>
  <AccordionItem value="garantia">
    <AccordionTrigger>Garantia e suporte</AccordionTrigger>
    <AccordionContent>24 meses de garantia de fábrica.</AccordionContent>
  </AccordionItem>
</Accordion>`;

  const codeControlled = `<script lang="ts">
  import { writable } from 'svelte/store';
  let value = $state('item-1');
<\/script>

<Accordion type="single" bind:value>
  <AccordionItem value="item-1">
    <AccordionTrigger>Item 1 — controlado</AccordionTrigger>
    <AccordionContent>Estado gerenciado externamente.</AccordionContent>
  </AccordionItem>
</Accordion>`;


  // Bloco de tipo, não de argumentação: a divergência em relação a outras
  // stacks (ausência de collapsible/defaultValue) é explicada uma única vez,
  // na linha correspondente da tabela de props — ver ADJUSTED abaixo.
  const interfaceCode = `// Accordion (raiz) — bits-ui
type AccordionProps = {
  type: 'single' | 'multiple';               // obrigatório
  value?: string | string[];                 // bindable
  onValueChange?: (value: string | string[]) => void;
  disabled?: boolean;                        // default: false
  loop?: boolean;                            // default: true
  orientation?: 'vertical' | 'horizontal';   // default: 'vertical'
  class?: string;
};`;

  // ─── Props: override stack-específico (bits-ui) ─────────────────────────────
  // A tabela compartilhada em translations.json descreve a API do Radix/shadcn,
  // então listava props que esta stack não tem. O que sai e o que entra está em
  // ABSENT_PROPS / EXTRA_PROPS / ADJUSTED abaixo; o texto exibido ao leitor vive
  // só em ADJUSTED, para a explicação não se espalhar por vários lugares.

  type PropRow = { name: string; type: string; defaultValue: string; required: string; description: string };
  type Loc = Record<string, string>;

  /** Props da tabela compartilhada que o bits-ui não tem. */
  const ABSENT_PROPS = new Set(['collapsible', 'defaultValue', 'asChild']);

  const pick = (m: Loc) => m[$locale] ?? m['pt-BR'];
  const no = () => pick({ 'pt-BR': 'Não', en: 'No', es: 'No' });

  /** Props que existem no bits-ui e faltam na tabela compartilhada. */
  const EXTRA_PROPS: Record<string, Array<{ name: string; type: string; defaultValue: string; description: Loc }>> = {
    accordion: [
      { name: 'disabled', type: 'boolean', defaultValue: 'false', description: {
        'pt-BR': 'Desabilita todos os itens de uma vez.',
        en: 'Disables every item at once.',
        es: 'Deshabilita todos los ítems a la vez.' } },
      { name: 'loop', type: 'boolean', defaultValue: 'true', description: {
        'pt-BR': 'Faz a navegação por setas voltar ao primeiro item após o último.',
        en: 'Wraps arrow-key navigation from the last item back to the first.',
        es: 'Hace que la navegación por flechas vuelva al primer ítem tras el último.' } },
      { name: 'orientation', type: "'vertical' | 'horizontal'", defaultValue: "'vertical'", description: {
        'pt-BR': 'Eixo de navegação por teclado.',
        en: 'Keyboard navigation axis.',
        es: 'Eje de navegación por teclado.' } },
    ],
    trigger: [
      { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', defaultValue: '3', description: {
        'pt-BR': 'Nível do cabeçalho que envolve o gatilho, aplicado em aria-level.',
        en: 'Heading level wrapping the trigger, applied to aria-level.',
        es: 'Nivel del encabezado que envuelve el disparador, aplicado en aria-level.' } },
    ],
    content: [
      { name: 'hiddenUntilFound', type: 'boolean', defaultValue: 'false', description: {
        'pt-BR': 'Permite que a busca nativa do navegador expanda o conteúdo fechado. Tem precedência sobre forceMount.',
        en: "Lets the browser's native find-in-page expand collapsed content. Takes precedence over forceMount.",
        es: 'Permite que la búsqueda nativa del navegador expanda el contenido cerrado. Tiene precedencia sobre forceMount.' } },
    ],
  };

  /**
   * Ajustes de nome/tipo/default sobre linhas que existem nas duas APIs.
   *
   * Esta tabela é o ÚNICO lugar que explica as duas ausências desta stack:
   * `collapsible` (na linha `type`) e `defaultValue` (na linha `value`). Cada
   * fato aparece na linha onde o leitor vai procurá-lo — quem quer estado
   * inicial olha `value`, quem quer fechar o item ativo olha `type`. O
   * `interfaceCode` acima não repete, e a API Reference (argTypes na story)
   * também não.
   */
  const ADJUSTED: Record<string, { name?: string; type?: string; defaultValue?: string; description?: Loc }> = {
    className: { name: 'class' },
    type: {
      description: {
        'pt-BR': 'Define se um ou múltiplos itens podem ser abertos simultaneamente. No modo único, fechar o item ativo é sempre permitido — não existe prop separada para isso.',
        en: 'Defines whether one or multiple items can be open simultaneously. In single mode, closing the active item is always allowed — there is no separate prop for it.',
        es: 'Define si uno o múltiples ítems pueden estar abiertos simultáneamente. En modo único, cerrar el ítem activo siempre está permitido — no existe una prop separada para eso.',
      },
    },
    value: {
      type: 'string | string[]',
      defaultValue: "'' | []",
      description: {
        'pt-BR': 'Item(ns) aberto(s), bindable com <code>bind:value</code>. É também onde se define o estado inicial: não existe uma prop de valor padrão separada.',
        en: 'Open item(s), bindable via <code>bind:value</code>. It is also where the initial state is set: there is no separate default-value prop.',
        es: 'Ítem(s) abierto(s), bindable con <code>bind:value</code>. Es también donde se define el estado inicial: no existe una prop de valor predeterminado separada.',
      },
    },
    forceMount: { defaultValue: 'true' },
  };

  function buildPropRows(group: string): PropRow[] {
    const raw = (accordionTranslations as unknown as Record<string, Record<string, Record<string, Record<string, Record<string, Record<string, string>>>>>>)[$locale]?.props?.[group]?.items ?? {};
    const rows = Object.values(raw)
      .filter((v) => !ABSENT_PROPS.has(v.name))
      .map((v) => {
        const adj = ADJUSTED[v.name];
        return {
          name: adj?.name ?? v.name,
          type: adj?.type ?? v.type,
          defaultValue: adj?.defaultValue ?? v.default,
          required: v.required,
          description: stripHtml(adj?.description ? pick(adj.description) : v.description),
        };
      });
    const extra = (EXTRA_PROPS[group] ?? []).map((e) => ({
      name: e.name,
      type: e.type,
      defaultValue: e.defaultValue,
      required: no(),
      description: pick(e.description),
    }));
    return [...rows, ...extra];
  }

  const propRows = $derived({
    accordion: buildPropRows('accordion'),
    item: buildPropRows('item'),
    trigger: buildPropRows('trigger'),
    content: buildPropRows('content'),
  });

  const demoItems = $derived([
    { value: 'q1', q: $tStore('demonstration.labels.q1'), a: $tStore('demonstration.labels.a1') },
    { value: 'q2', q: $tStore('demonstration.labels.q2'), a: $tStore('demonstration.labels.a2') },
    { value: 'q3', q: $tStore('demonstration.labels.q3'), a: $tStore('demonstration.labels.a3') },
    { value: 'q4', q: $tStore('demonstration.labels.q4'), a: $tStore('demonstration.labels.a4') },
  ]);
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
        <Accordion type="single" value="q1" class="nds-max-w-lg">
          {#each demoItems as item (item.value)}
            <AccordionItem value={item.value}>
              <AccordionTrigger onclick={(e: MouseEvent) => handleDemoTriggerClick(e, item.q)}>
                {item.q}
              </AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          {/each}
        </Accordion>
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
            { element: $tStore('usage.uxWriting.table.trigger.name'),    rules: $tStore('usage.uxWriting.table.trigger.format'),    do: $tStore('usage.uxWriting.table.trigger.good'),    dont: $tStore('usage.uxWriting.table.trigger.bad') },
            { element: $tStore('usage.uxWriting.table.triggerDoc.name'), rules: $tStore('usage.uxWriting.table.triggerDoc.format'), do: $tStore('usage.uxWriting.table.triggerDoc.good'), dont: $tStore('usage.uxWriting.table.triggerDoc.bad') },
            { element: $tStore('usage.uxWriting.table.content.name'),    rules: $tStore('usage.uxWriting.table.content.format'),    do: $tStore('usage.uxWriting.table.content.good'),    dont: $tStore('usage.uxWriting.table.content.bad') },
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
        <Accordion type="single" class="nds-max-w-xs nds-text-body">
          <AccordionItem value="faq">
            <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
            <AccordionContent>Acesse a tela de login e clique em "Esqueci minha senha".</AccordionContent>
          </AccordionItem>
        </Accordion>
      {/snippet}
      {#snippet dontPair1()}
        <Accordion type="single" class="nds-max-w-xs nds-text-body">
          <AccordionItem value="faq">
            <AccordionTrigger>Senha</AccordionTrigger>
            <AccordionContent>Informações sobre redefinição.</AccordionContent>
          </AccordionItem>
        </Accordion>
      {/snippet}
      {#snippet doPair2()}
        <Accordion type="multiple" class="nds-max-w-xs nds-text-body">
          <AccordionItem value="s1">
            <AccordionTrigger>Especificações técnicas</AccordionTrigger>
            <AccordionContent>CPU, RAM, SSD.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="s2">
            <AccordionTrigger>Compatibilidade</AccordionTrigger>
            <AccordionContent>Windows 11, macOS, Linux.</AccordionContent>
          </AccordionItem>
        </Accordion>
      {/snippet}
      {#snippet dontPair2()}
        <Accordion type="single" class="nds-max-w-xs nds-text-body">
          <AccordionItem value="s1">
            <AccordionTrigger>Expandir</AccordionTrigger>
            <AccordionContent>Conteúdo único.</AccordionContent>
          </AccordionItem>
        </Accordion>
      {/snippet}

      <!-- ── Importação ─────────────────────────────────────────────── -->
      <DocsImport
        title={$tStore('import.title')}
        description={$tStore('import.note')}
        code={codeImport}
      />

      <!-- ── Modos de Operação ──────────────────────────────────────── -->
      <DocsVariants
        id="variantes"
        title={$tStore('variants.title')}
        items={[
          { name: $tStore('variants.items.single.label'),      description: stripHtml($tStore('variants.items.single.description')),      code: codeSingle,      preview: modeSingle      },
          { name: $tStore('variants.items.multiple.label'),    description: stripHtml($tStore('variants.items.multiple.description')),    code: codeMultiple,    preview: modeMultiple    },
          { name: $tStore('variants.items.controlled.label'),  description: stripHtml($tStore('variants.items.controlled.description')),  code: codeControlled,  preview: modeControlled  },
          { name: $tStore('variants.items.defaultOpen.label'), description: stripHtml($tStore('variants.items.defaultOpen.description')), code: codeSingle,      preview: modeDefaultOpen },
        ]}
      />

      {#snippet modeSingle()}
        <Accordion type="single" value="item-1" class="nds-max-w-sm nds-text-body">
          <AccordionItem value="item-1">
            <AccordionTrigger>Pergunta 1</AccordionTrigger>
            <AccordionContent>Resposta objetiva em 1–2 linhas.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Pergunta 2</AccordionTrigger>
            <AccordionContent>Outro conteúdo aqui.</AccordionContent>
          </AccordionItem>
        </Accordion>
      {/snippet}
      {#snippet modeMultiple()}
        <Accordion type="multiple" class="nds-max-w-sm nds-text-body">
          <AccordionItem value="s1">
            <AccordionTrigger>Especificações técnicas</AccordionTrigger>
            <AccordionContent>CPU, RAM, SSD.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="s2">
            <AccordionTrigger>Compatibilidade</AccordionTrigger>
            <AccordionContent>Windows 11, macOS, Linux.</AccordionContent>
          </AccordionItem>
        </Accordion>
      {/snippet}
      {#snippet modeControlled()}
        <Accordion type="single" value="item-1" class="nds-max-w-sm nds-text-body">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1 — controlado</AccordionTrigger>
            <AccordionContent>Estado gerenciado externamente via bind:value.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2 — controlado</AccordionTrigger>
            <AccordionContent>Útil para sincronizar com URL ou outro estado.</AccordionContent>
          </AccordionItem>
        </Accordion>
      {/snippet}
      {#snippet modeDefaultOpen()}
        <Accordion type="single" value="item-1" class="nds-max-w-sm nds-text-body">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item aberto por padrão</AccordionTrigger>
            <AccordionContent>Este item inicia expandido.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item fechado por padrão</AccordionTrigger>
            <AccordionContent>Este item inicia colapsado.</AccordionContent>
          </AccordionItem>
        </Accordion>
      {/snippet}

      <!-- ── Composições ──────────────────────────────────────────────── -->
      <DocsCompositions
        title={$tStore('variants.compositionsTitle')}
        useWhenLabel={$tNavStore('common.useWhen')}
        componentSlug="accordion"
        items={[
          {
            name: $tStore('variants.compositions.iconTrigger.name'),
            description: $tStore('variants.compositions.iconTrigger.description'),
            useWhen: $tStore('variants.compositions.iconTrigger.use'),
            code: `<Accordion type="single">
  <AccordionItem value="info">
    <AccordionTrigger>
      <Info class="nds-icon-sm nds-shrink-0" aria-hidden="true" />
      Informações gerais
    </AccordionTrigger>
    <AccordionContent>Conteúdo informativo.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="warn">
    <AccordionTrigger>
      <AlertTriangle class="nds-icon-sm nds-shrink-0" aria-hidden="true" />
      Avisos importantes
    </AccordionTrigger>
    <AccordionContent>Atenção aos detalhes.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="ok">
    <AccordionTrigger>
      <CheckCircle2 class="nds-icon-sm nds-shrink-0" aria-hidden="true" />
      Confirmações
    </AccordionTrigger>
    <AccordionContent>Tudo certo por aqui.</AccordionContent>
  </AccordionItem>
</Accordion>`,
            preview: compIconTrigger,
          },
          {
            name: $tStore('variants.compositions.badgeTrigger.name'),
            description: $tStore('variants.compositions.badgeTrigger.description'),
            useWhen: $tStore('variants.compositions.badgeTrigger.use'),
            code: `<Accordion type="single">
  <AccordionItem value="news">
    <AccordionTrigger>
      Novidades
      <Badge>Novo</Badge>
    </AccordionTrigger>
    <AccordionContent>Confira as novidades da versão.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="beta">
    <AccordionTrigger>
      Funcionalidades em beta
      <Badge variant="secondary">Beta</Badge>
    </AccordionTrigger>
    <AccordionContent>Recursos experimentais.</AccordionContent>
  </AccordionItem>
</Accordion>`,
            preview: compBadgeTrigger,
          },
          {
            name: $tStore('variants.compositions.richContent.name'),
            description: $tStore('variants.compositions.richContent.description'),
            useWhen: $tStore('variants.compositions.richContent.use'),
            code: `<Accordion type="multiple" class="nds-max-w-lg nds-text-body">
  <AccordionItem value="specs">
    <AccordionTrigger>Especificações técnicas</AccordionTrigger>
    <AccordionContent>
      <table class="nds-w-full nds-text-body nds-border-collapse">
        <tbody>
          <tr class="nds-border-b">
            <td class="nds-py-1">CPU</td><td class="nds-py-1">Intel Core i7-12700</td>
          </tr>
          <tr class="nds-border-b">
            <td class="nds-py-1">RAM</td><td class="nds-py-1">16GB DDR5</td>
          </tr>
        </tbody>
      </table>
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="inclui">
    <AccordionTrigger>O que está incluso</AccordionTrigger>
    <AccordionContent>
      <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="xs">
        <li>Cabo de alimentação</li>
        <li>Manual do usuário</li>
      </ul>
    </AccordionContent>
  </AccordionItem>
</Accordion>`,
            preview: compRichContent,
          },
          {
            name: $tStore('variants.compositions.faq.name'),
            description: $tStore('variants.compositions.faq.description'),
            useWhen: $tStore('variants.compositions.faq.use'),
            code: `<section>
  <h2 class="nds-text-base nds-font-semibold nds-mb-4">Perguntas frequentes</h2>
  <Accordion type="single">
    <AccordionItem value="senha">
      <AccordionTrigger>Como redefinir minha senha?</AccordionTrigger>
      <AccordionContent>Use a opção "Esqueci minha senha" na tela de login.</AccordionContent>
    </AccordionItem>
    <AccordionItem value="pagamento">
      <AccordionTrigger>Quais formas de pagamento aceitam?</AccordionTrigger>
      <AccordionContent>Cartão, Pix e boleto.</AccordionContent>
    </AccordionItem>
    <AccordionItem value="cancelamento">
      <AccordionTrigger>Como cancelar minha assinatura?</AccordionTrigger>
      <AccordionContent>Acesse Configurações > Plano > Cancelar.</AccordionContent>
    </AccordionItem>
    <AccordionItem value="dados">
      <AccordionTrigger>Meus dados estão seguros?</AccordionTrigger>
      <AccordionContent>Seguimos LGPD e criptografia em repouso e em trânsito.</AccordionContent>
    </AccordionItem>
  </Accordion>
</section>`,
            preview: compFaq,
          },
        ]}
      />

      {#snippet compIconTrigger()}
        <Accordion type="single" class="nds-max-w-sm nds-text-body">
          <AccordionItem value="info">
            <AccordionTrigger>
              <Info class="nds-icon-sm nds-shrink-0" aria-hidden="true" />
              Informações gerais
            </AccordionTrigger>
            <AccordionContent>Conteúdo informativo.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="warn">
            <AccordionTrigger>
              <AlertTriangle class="nds-icon-sm nds-shrink-0" aria-hidden="true" />
              Avisos importantes
            </AccordionTrigger>
            <AccordionContent>Atenção aos detalhes.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="ok">
            <AccordionTrigger>
              <CheckCircle2 class="nds-icon-sm nds-shrink-0" aria-hidden="true" />
              Confirmações
            </AccordionTrigger>
            <AccordionContent>Tudo certo por aqui.</AccordionContent>
          </AccordionItem>
        </Accordion>
      {/snippet}
      {#snippet compBadgeTrigger()}
        <Accordion type="single" class="nds-max-w-sm nds-text-body">
          <AccordionItem value="news">
            <AccordionTrigger>
              <span class="nds-cluster" data-spacing="xs">Novidades <Badge>Novo</Badge></span>
            </AccordionTrigger>
            <AccordionContent>Confira as novidades da versão.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="beta">
            <AccordionTrigger>
              <span class="nds-cluster" data-spacing="xs">Funcionalidades em beta <Badge variant="secondary">Beta</Badge></span>
            </AccordionTrigger>
            <AccordionContent>Recursos experimentais.</AccordionContent>
          </AccordionItem>
        </Accordion>
      {/snippet}
      {#snippet compRichContent()}
        <Accordion type="multiple" class="nds-max-w-lg nds-text-body">
          <AccordionItem value="specs">
            <AccordionTrigger>Especificações técnicas</AccordionTrigger>
            <AccordionContent>
              <!-- Tabela de verdade, não grid: `.nds-grid[data-cols="2"]` exige
                   18rem por coluna e colapsa para uma dentro do accordion. Dado
                   tabular também pede <table> semântico. -->
              <table class="nds-w-full nds-text-body nds-border-collapse">
                <tbody>
                  <tr class="nds-border-b">
                    <td class="nds-py-1 nds-pr-4">CPU</td>
                    <td class="nds-py-1">Intel Core i7-12700</td>
                  </tr>
                  <tr class="nds-border-b">
                    <td class="nds-py-1 nds-pr-4">RAM</td>
                    <td class="nds-py-1">16GB DDR5</td>
                  </tr>
                  <tr>
                    <td class="nds-py-1 nds-pr-4">SSD</td>
                    <td class="nds-py-1">512GB NVMe</td>
                  </tr>
                </tbody>
              </table>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="inclui">
            <AccordionTrigger>O que está incluso</AccordionTrigger>
            <AccordionContent>
              <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="xs">
                <li>Cabo de alimentação</li>
                <li>Manual do usuário</li>
                <li>Garantia de 24 meses</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      {/snippet}
      {#snippet compFaq()}
        <section class="nds-w-full nds-max-w-sm nds-text-body">
          <h2 class="nds-text-base nds-font-semibold nds-mb-4">Perguntas frequentes</h2>
          <Accordion type="single">
            <AccordionItem value="senha">
              <AccordionTrigger>Como redefinir minha senha?</AccordionTrigger>
              <AccordionContent>Use a opção "Esqueci minha senha" na tela de login.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="pagamento">
              <AccordionTrigger>Quais formas de pagamento aceitam?</AccordionTrigger>
              <AccordionContent>Cartão, Pix e boleto.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="cancelamento">
              <AccordionTrigger>Como cancelar minha assinatura?</AccordionTrigger>
              <AccordionContent>Acesse Configurações &gt; Plano &gt; Cancelar.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="dados">
              <AccordionTrigger>Meus dados estão seguros?</AccordionTrigger>
              <AccordionContent>Seguimos LGPD e criptografia em repouso e em trânsito.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      {/snippet}

      <!-- ── Estados ───────────────────────────────────────────────── -->
      <DocsStates
        title={$tStore('states.title')}
        cols={{
          state: $tStore('states.cols.state'),
          trigger: $tStore('states.cols.trigger'),
          behavior: $tStore('states.cols.behavior'),
        }}
        items={[
          { label: $tStore('states.closed.label'),   trigger: $tStore('states.closed.trigger'),   behavior: stripHtml($tStore('states.closed.behavior')) },
          { label: $tStore('states.open.label'),     trigger: $tStore('states.open.trigger'),     behavior: stripHtml($tStore('states.open.behavior')) },
          { label: $tStore('states.disabled.label'), trigger: $tStore('states.disabled.trigger'), behavior: stripHtml($tStore('states.disabled.behavior')) },
          { label: $tStore('states.focused.label'),  trigger: $tStore('states.focused.trigger'),  behavior: stripHtml($tStore('states.focused.behavior')) },
        ]}
      />

      <!-- ── Propriedades ───────────────────────────────────────────── -->
      <DocsProps
        title={$tStore('props.title')}
        tables={[
          {
            title: $tStore('props.accordion.title'),
            cols: {
              prop: $tStore('props.accordion.prop'),
              type: $tStore('props.accordion.type'),
              default: $tStore('props.accordion.default'),
              required: $tStore('props.accordion.required'),
              description: $tStore('props.accordion.description'),
            },
            items: propRows.accordion,
          },
          {
            title: $tStore('props.item.title'),
            cols: {
              prop: $tStore('props.accordion.prop'),
              type: $tStore('props.accordion.type'),
              default: $tStore('props.accordion.default'),
              required: $tStore('props.accordion.required'),
              description: $tStore('props.accordion.description'),
            },
            items: propRows.item,
          },
          {
            title: $tStore('props.trigger.title'),
            cols: {
              prop: $tStore('props.accordion.prop'),
              type: $tStore('props.accordion.type'),
              default: $tStore('props.accordion.default'),
              required: $tStore('props.accordion.required'),
              description: $tStore('props.accordion.description'),
            },
            items: propRows.trigger,
          },
          {
            title: $tStore('props.content.title'),
            cols: {
              prop: $tStore('props.accordion.prop'),
              type: $tStore('props.accordion.type'),
              default: $tStore('props.accordion.default'),
              required: $tStore('props.accordion.required'),
              description: $tStore('props.accordion.description'),
            },
            items: propRows.content,
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
        items={Object.values(
          (accordionTranslations as unknown as Record<string, Record<string, Record<string, Record<string, Record<string, string>>>>>)[$locale]?.tokens?.items ?? {}
        ).map(v => ({ token: v.token, value: v.class, description: v.part }))}
        customizationTitle={$tStore('tokens.customizationTitle')}
        customizationCode={$tStore('tokens.customizationCode')}
      />

      <!-- ── Acessibilidade ─────────────────────────────────────────── -->
      <DocsAccessibility
        title={$tStore('accessibility.title')}
        summary={$tStore('accessibility.summary')}
        items={[
          $tStore('accessibility.aria.ariaExpanded'),
          $tStore('accessibility.aria.ariaControls'),
          $tStore('accessibility.aria.role'),
          $tStore('accessibility.aria.ariaLabelledBy'),
        ]}
        keyboardTitle={$tStore('accessibility.keyboardTitle')}
        keyboardItems={[
          { key: 'Tab',       description: $tStore('accessibility.keyboard.tab')       },
          { key: 'Shift+Tab', description: $tStore('accessibility.keyboard.shiftTab')  },
          { key: 'Enter',     description: $tStore('accessibility.keyboard.enter')     },
          { key: 'Space',     description: $tStore('accessibility.keyboard.space')     },
          { key: 'Arrow Down',         description: $tStore('accessibility.keyboard.arrowDown') },
          { key: 'Arrow Up',         description: $tStore('accessibility.keyboard.arrowUp')   },
          { key: 'Home',      description: $tStore('accessibility.keyboard.home')      },
          { key: 'End',       description: $tStore('accessibility.keyboard.end')       },
        ]}
      />

      <!-- ── Relacionados ───────────────────────────────────────────── -->
      <DocsRelated
        title={$tStore('related.title')}
        items={[
          { name: $tStore('related.collapsible.name'), description: $tStore('related.collapsible.description'), path: `?path=/docs/${$tStore('related.collapsible.href')}` },
          { name: $tStore('related.tabs.name'),        description: $tStore('related.tabs.description'),        path: `?path=/docs/${$tStore('related.tabs.href')}`        },
          { name: $tStore('related.sidebar.name'),     description: $tStore('related.sidebar.description'),     path: `?path=/docs/${$tStore('related.sidebar.href')}`     },
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
          event: $tStore('analytics.table.event'),
          trigger: $tStore('analytics.table.trigger'),
          payload: $tStore('analytics.table.payload'),
        }}
        items={[
          { event: $tStore('analytics.events.expand.event'),   trigger: $tStore('analytics.events.expand.trigger'),   payload: $tStore('analytics.events.expand.payload')   },
          { event: $tStore('analytics.events.collapse.event'), trigger: $tStore('analytics.events.collapse.trigger'), payload: $tStore('analytics.events.collapse.payload') },
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
          items: [1, 2, 3, 4, 5, 6].map(i => ({
            action:   stripHtml($tStore(`testes.functional.item${i}.action`)),
            result:   stripHtml($tStore(`testes.functional.item${i}.result`)),
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
          items: [1, 2, 3, 4, 5, 6].map(i => ({
            criterion: stripHtml($tStore(`testes.accessibility.item${i}.criterion`)),
            level:     $tStore(`testes.accessibility.item${i}.level`),
            how:       $tStore(`testes.accessibility.item${i}.how`),
          })),
        }}
        visual={{
          title: $tStore('testes.visual.title'),
          cols: {
            story: $tNavStore('common.storyState'),
            priority: $tNavStore('common.priority'),
          },
          items: [1, 2, 3, 4, 5].map(i => ({
            story:    $tStore(`testes.visual.item${i}.story`),
            priority: localPriority($tStore(`testes.visual.item${i}.priority`), $tNavStore),
          })),
        }}
      />
</DocsPageLayout>
