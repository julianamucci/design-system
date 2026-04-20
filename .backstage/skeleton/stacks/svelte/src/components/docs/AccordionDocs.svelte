<script lang="ts">
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from '@/components/ui/accordion';
  import { Info, AlertTriangle, CheckCircle } from 'lucide-svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import DocsNav from '@/components/docs/shared/DocsNav.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsStates, DocsProps, DocsTokens,
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

  let activeSection = $state('demonstracao');

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
        { id: 'modos',        label: tNav('nav.variants') },
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

  $effect(() => {
    const ids = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection = entry.target.id;
          track('docs_section_viewed', { section_id: entry.target.id, component_name: 'accordion', locale: $locale });
          break;
        }
      }
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  });

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
      location: 'docs_demonstration',
    });
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImport = `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";`;

  const codeSingle = `<Accordion type="single" collapsible defaultValue="item-1" class="w-full">
  <AccordionItem value="item-1">
    <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
    <AccordionContent>
      Acesse a tela de login e clique em "Esqueci minha senha".
    </AccordionContent>
  </AccordionItem>
</Accordion>`;

  const codeMultiple = `<Accordion type="multiple" class="w-full">
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

<Accordion type="single" collapsible bind:value>
  <AccordionItem value="item-1">
    <AccordionTrigger>Item 1 — controlado</AccordionTrigger>
    <AccordionContent>Estado gerenciado externamente.</AccordionContent>
  </AccordionItem>
</Accordion>`;

  const codeCustomization = `/* Aumentar separador entre itens */
.my-accordion .accordion-item {
  border-bottom-width: 2px;
  border-color: hsl(var(--border) / 60%);
}`;

  const interfaceCode = `// Accordion (Svelte 5 + Bits UI)
type AccordionProps = Accordion.RootProps & {
  type: 'single' | 'multiple';
  collapsible?: boolean;
  defaultValue?: string | string[];
  value?: string | string[];
  class?: string;
};`;

  const demoItems = $derived([
    { value: 'q1', q: $tStore('demonstration.labels.q1'), a: $tStore('demonstration.labels.a1') },
    { value: 'q2', q: $tStore('demonstration.labels.q2'), a: $tStore('demonstration.labels.a2') },
    { value: 'q3', q: $tStore('demonstration.labels.q3'), a: $tStore('demonstration.labels.a3') },
    { value: 'q4', q: $tStore('demonstration.labels.q4'), a: $tStore('demonstration.labels.a4') },
  ]);
</script>

<div class="ds-docs p-8 max-w-5xl mx-auto">

  <DocsHeader
    title={$tStore('title')}
    description={$tStore('description')}
    category={$tStore('category')}
    type={$tStore('type')}
    installNote="npx shadcn-svelte@latest add accordion"
  />

  <div class="flex gap-16 items-start">
    <nav
      aria-label="Navegação das seções do componente"
      class="sticky top-8 w-52 shrink-0 self-start space-y-5"
    >
      <DocsNav
        groups={NAV_GROUPS}
        {activeSection}
      />
    </nav>

    <div class="ds-docs flex-1 min-w-0 space-y-12">

      <!-- ── Demonstração ───────────────────────────────────────────── -->
      <DocsDemonstration title={$tStore('demonstration.title')}>
        {#snippet children()}
          <Accordion type="single" collapsible class="w-full max-w-lg">
            {#each demoItems as item (item.value)}
              <AccordionItem value={item.value}>
                <AccordionTrigger onclick={(e) => handleDemoTriggerClick(e, item.q)}>
                  {item.q}
                </AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            {/each}
          </Accordion>
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
        <Accordion type="single" collapsible class="w-full max-w-xs text-sm">
          <AccordionItem value="faq">
            <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
            <AccordionContent>Acesse a tela de login e clique em "Esqueci minha senha".</AccordionContent>
          </AccordionItem>
        </Accordion>
      {/snippet}
      {#snippet dontPair1()}
        <Accordion type="single" collapsible class="w-full max-w-xs text-sm">
          <AccordionItem value="faq">
            <AccordionTrigger>Senha</AccordionTrigger>
            <AccordionContent>Informações sobre redefinição.</AccordionContent>
          </AccordionItem>
        </Accordion>
      {/snippet}
      {#snippet doPair2()}
        <Accordion type="multiple" class="w-full max-w-xs text-sm">
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
        <Accordion type="single" collapsible class="w-full max-w-xs text-sm">
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
        id="modos"
        title={$tStore('variants.title')}
        items={[
          { name: $tStore('variants.single.label'),      description: stripHtml($tStore('variants.single.description')),      code: codeSingle,      preview: modeSingle      },
          { name: $tStore('variants.multiple.label'),    description: stripHtml($tStore('variants.multiple.description')),    code: codeMultiple,    preview: modeMultiple    },
          { name: $tStore('variants.controlled.label'),  description: stripHtml($tStore('variants.controlled.description')),  code: codeControlled,  preview: modeControlled  },
          { name: $tStore('variants.defaultOpen.label'), description: stripHtml($tStore('variants.defaultOpen.description')), code: codeSingle,      preview: modeDefaultOpen },
        ]}
      />

      {#snippet modeSingle()}
        <Accordion type="single" collapsible defaultValue="item-1" class="w-full max-w-sm text-sm">
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
        <Accordion type="multiple" class="w-full max-w-sm text-sm">
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
        <Accordion type="single" collapsible defaultValue="item-1" class="w-full max-w-sm text-sm">
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
        <Accordion type="single" collapsible defaultValue="item-1" class="w-full max-w-sm text-sm">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item aberto por padrão</AccordionTrigger>
            <AccordionContent>Este item inicia expandido via defaultValue.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item fechado por padrão</AccordionTrigger>
            <AccordionContent>Este item inicia colapsado.</AccordionContent>
          </AccordionItem>
        </Accordion>
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
          { label: $tStore('states.closed.label'),   trigger: $tStore('states.closed.description'),   behavior: $tStore('states.closed.description')   },
          { label: $tStore('states.open.label'),     trigger: $tStore('states.open.description'),     behavior: $tStore('states.open.description')     },
          { label: $tStore('states.disabled.label'), trigger: stripHtml($tStore('states.disabled.description')), behavior: stripHtml($tStore('states.disabled.description')) },
          { label: $tStore('states.focused.label'),  trigger: $tStore('states.focused.description'),  behavior: $tStore('states.focused.description')  },
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
            items: Object.values(
              (accordionTranslations as Record<string, Record<string, Record<string, Record<string, Record<string, string>>>>>)[$locale]?.props?.accordion?.items ?? {}
            ).map(v => ({ name: v.name, type: v.type, defaultValue: v.default, required: v.required, description: stripHtml(v.description) })),
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
            items: Object.values(
              (accordionTranslations as Record<string, Record<string, Record<string, Record<string, Record<string, string>>>>>)[$locale]?.props?.item?.items ?? {}
            ).map(v => ({ name: v.name, type: v.type, defaultValue: v.default, required: v.required, description: stripHtml(v.description) })),
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
            items: Object.values(
              (accordionTranslations as Record<string, Record<string, Record<string, Record<string, Record<string, string>>>>>)[$locale]?.props?.trigger?.items ?? {}
            ).map(v => ({ name: v.name, type: v.type, defaultValue: v.default, required: v.required, description: stripHtml(v.description) })),
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
            items: Object.values(
              (accordionTranslations as Record<string, Record<string, Record<string, Record<string, Record<string, string>>>>>)[$locale]?.props?.content?.items ?? {}
            ).map(v => ({ name: v.name, type: v.type, defaultValue: v.default, required: v.required, description: stripHtml(v.description) })),
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
          (accordionTranslations as Record<string, Record<string, Record<string, Record<string, string>>>>)[$locale]?.tokens?.items ?? {}
        ).map(v => ({ token: v.token, value: v.class, description: v.part }))}
        customizationTitle={$tStore('tokens.customizationTitle')}
        customizationCode={codeCustomization}
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
          { key: '↓',         description: $tStore('accessibility.keyboard.arrowDown') },
          { key: '↑',         description: $tStore('accessibility.keyboard.arrowUp')   },
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
          items: [1, 2, 3, 4, 5].map(i => ({
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

    </div>
  </div>
</div>
