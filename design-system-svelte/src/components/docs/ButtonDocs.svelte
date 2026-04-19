<script lang="ts">
  import { Button } from '@/components/ui/button';
  import { Plus, Trash2, Pencil, ChevronRight } from 'lucide-svelte';
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
  import buttonTranslations from '@shared/content/button/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(buttonTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'button',
    });
    track('docs_page_view', {
      component_name: 'button',
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
        { id: 'variantes',    label: tNav('nav.variants') },
        { id: 'tamanhos',     label: tNav('nav.sizes')    },
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
          track('docs_section_viewed', { section_id: entry.target.id, component_name: 'button', locale: $locale });
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

  function handleDemoClick(variant: string) {
    track('button_click', { component: 'button', variant, location: 'docs_demo' });
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import { Button } from "@/components/ui/button";`;
  const codeImportWithIcon = `import { Button } from "@/components/ui/button";
import { Plus } from "lucide-svelte";`;

  const codeDefault = `<Button>Salvar</Button>`;
  const codeDestructive = `<Button variant="destructive">Excluir item</Button>`;
  const codeOutline = `<Button variant="outline">Ver detalhes</Button>`;
  const codeSecondary = `<Button variant="secondary">Cancelar</Button>`;
  const codeGhost = `<Button variant="ghost">Editar</Button>`;
  const codeLink = `<Button variant="link">Saiba mais</Button>`;

  const codeSizeDefault = `<Button>Salvar</Button>`;
  const codeSizeSm = `<Button size="sm">Salvar</Button>`;
  const codeSizeLg = `<Button size="lg">Salvar</Button>`;
  const codeSizeIcon = `<Button size="icon" aria-label="Excluir item">
  <Trash2 aria-hidden="true" />
</Button>`;
  const codeSizeIconSm = `<Button size="icon-sm" aria-label="Editar">
  <Pencil aria-hidden="true" />
</Button>`;
  const codeSizeIconLg = `<Button size="icon-lg" aria-label="Adicionar">
  <Plus aria-hidden="true" />
</Button>`;

  const codeCustomizationTokens = `/* Em globals.css — tokens do Button */
:root {
  --primary: 222 47% 11%;
  --primary-foreground: 210 40% 98%;
  --radius: 0.5rem;
}

.dark {
  --primary: 210 40% 98%;
  --primary-foreground: 222 47% 11%;
}`;

  const interfaceCode = `// Button (Svelte 5)
export type ButtonVariant =
  | 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

export type ButtonSize =
  | 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';

export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
  WithElementRef<HTMLAnchorAttributes> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  };

// Quando \`href\` é fornecido, renderiza <a> com role/tabindex
// adequados se \`disabled\`. Caso contrário, renderiza <button>.`;
</script>

<div class="ds-docs p-8 max-w-5xl mx-auto">

  <DocsHeader
    title={$tStore('title')}
    description={$tStore('description')}
    category={$tStore('category')}
    type={$tStore('type')}
    installNote="npx shadcn-svelte@latest add button"
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
          <div class="flex flex-wrap gap-3">
            <Button onclick={() => handleDemoClick('default')}>{$tStore('demonstration.labels.primary')}</Button>
            <Button variant="secondary" onclick={() => handleDemoClick('secondary')}>{$tStore('demonstration.labels.secondary')}</Button>
            <Button variant="destructive" onclick={() => handleDemoClick('destructive')}>{$tStore('demonstration.labels.destructive')}</Button>
            <Button variant="outline" onclick={() => handleDemoClick('outline')}>{$tStore('demonstration.labels.outline')}</Button>
            <Button variant="ghost" onclick={() => handleDemoClick('ghost')}>{$tStore('demonstration.labels.ghost')}</Button>
            <Button variant="link" onclick={() => handleDemoClick('link')}>{$tStore('demonstration.labels.link')}</Button>
            <Button variant="outline" onclick={() => handleDemoClick('outline-icon')}>
              <Plus class="h-4 w-4" aria-hidden="true" />
              {$tStore('demonstration.labels.withIcon')}
            </Button>
            <Button size="icon" aria-label={$tStore('demonstration.labels.iconOnly')} onclick={() => handleDemoClick('icon-only')}>
              <Trash2 class="h-4 w-4" aria-hidden="true" />
            </Button>
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
            { s: $tStore('usage.scenarios.item5.s'), u: $tStore('usage.scenarios.item5.u'), a: stripHtml($tStore('usage.scenarios.item5.a')) },
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
            { element: $tStore('usage.uxWriting.table.label.name'),     rules: $tStore('usage.uxWriting.table.label.format'),     do: $tStore('usage.uxWriting.table.label.good'),     dont: $tStore('usage.uxWriting.table.label.bad') },
            { element: $tStore('usage.uxWriting.table.ariaLabel.name'), rules: $tStore('usage.uxWriting.table.ariaLabel.format'), do: $tStore('usage.uxWriting.table.ariaLabel.good'), dont: $tStore('usage.uxWriting.table.ariaLabel.bad') },
            { element: $tStore('usage.uxWriting.table.iconOnly.name'),  rules: $tStore('usage.uxWriting.table.iconOnly.format'),  do: stripHtml($tStore('usage.uxWriting.table.iconOnly.good')),  dont: stripHtml($tStore('usage.uxWriting.table.iconOnly.bad')) },
            { element: $tStore('usage.uxWriting.table.loading.name'),   rules: $tStore('usage.uxWriting.table.loading.format'),   do: $tStore('usage.uxWriting.table.loading.good'),   dont: $tStore('usage.uxWriting.table.loading.bad') },
          ],
        }}
        do={{
          title: $tStore('usage.do.title'),
          items: [
            $tStore('usage.do.item1'),
            $tStore('usage.do.item2'),
            stripHtml($tStore('usage.do.item3')),
            stripHtml($tStore('usage.do.item4')),
          ],
        }}
        dont={{
          title: $tStore('usage.dont.title'),
          items: [
            stripHtml($tStore('usage.dont.item1')),
            $tStore('usage.dont.item2'),
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
            doCaption: stripHtml($tStore('doDont.pair2.do')),
            dontCaption: $tStore('doDont.pair2.dont'),
            doPreview: doPair2,
            dontPreview: dontPair2,
          },
        ]}
      />

      {#snippet doPair1()}
        <Button>Salvar</Button>
      {/snippet}
      {#snippet dontPair1()}
        <Button>Clique aqui</Button>
      {/snippet}
      {#snippet doPair2()}
        <div class="flex gap-2">
          <Button variant="outline">Cancelar</Button>
          <Button>Salvar</Button>
        </div>
      {/snippet}
      {#snippet dontPair2()}
        <div class="flex gap-2">
          <Button>Salvar</Button>
          <Button>Enviar</Button>
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

      <!-- ── Variantes ──────────────────────────────────────────────── -->
      <DocsVariants
        title={$tStore('variants.title')}
        items={[
          { name: 'default',     description: stripHtml($tStore('variants.items.default')),     code: codeDefault,     preview: variantDefault     },
          { name: 'destructive', description: stripHtml($tStore('variants.items.destructive')), code: codeDestructive, preview: variantDestructive },
          { name: 'outline',     description: stripHtml($tStore('variants.items.outline')),     code: codeOutline,     preview: variantOutline     },
          { name: 'secondary',   description: stripHtml($tStore('variants.items.secondary')),   code: codeSecondary,   preview: variantSecondary   },
          { name: 'ghost',       description: stripHtml($tStore('variants.items.ghost')),       code: codeGhost,       preview: variantGhost       },
          { name: 'link',        description: stripHtml($tStore('variants.items.link')),        code: codeLink,        preview: variantLink        },
        ]}
      />

      {#snippet variantDefault()}
        <Button>{$tStore('demonstration.labels.primary')}</Button>
      {/snippet}
      {#snippet variantDestructive()}
        <Button variant="destructive">{$tStore('demonstration.labels.destructive')}</Button>
      {/snippet}
      {#snippet variantOutline()}
        <Button variant="outline">{$tStore('demonstration.labels.outline')}</Button>
      {/snippet}
      {#snippet variantSecondary()}
        <Button variant="secondary">{$tStore('demonstration.labels.secondary')}</Button>
      {/snippet}
      {#snippet variantGhost()}
        <Button variant="ghost">{$tStore('demonstration.labels.ghost')}</Button>
      {/snippet}
      {#snippet variantLink()}
        <Button variant="link">{$tStore('demonstration.labels.link')}</Button>
      {/snippet}

      <!-- ── Tamanhos ───────────────────────────────────────────────── -->
      <DocsVariants
        id="tamanhos"
        title={$tStore('variants.sizesTitle')}
        items={[
          { name: 'default', description: stripHtml($tStore('variants.sizes.default')), code: codeSizeDefault, preview: sizeDefault },
          { name: 'sm',      description: stripHtml($tStore('variants.sizes.sm')),      code: codeSizeSm,      preview: sizeSm      },
          { name: 'lg',      description: stripHtml($tStore('variants.sizes.lg')),      code: codeSizeLg,      preview: sizeLg      },
          { name: 'icon',    description: stripHtml($tStore('variants.sizes.icon')),    code: codeSizeIcon,    preview: sizeIcon    },
          { name: 'icon-sm', description: stripHtml($tStore('variants.sizes.icon-sm')), code: codeSizeIconSm,  preview: sizeIconSm  },
          { name: 'icon-lg', description: stripHtml($tStore('variants.sizes.icon-lg')), code: codeSizeIconLg,  preview: sizeIconLg  },
        ]}
      />

      {#snippet sizeDefault()}
        <Button>{$tStore('demonstration.labels.primary')}</Button>
      {/snippet}
      {#snippet sizeSm()}
        <Button size="sm">{$tStore('demonstration.labels.primary')}</Button>
      {/snippet}
      {#snippet sizeLg()}
        <Button size="lg">{$tStore('demonstration.labels.primary')}</Button>
      {/snippet}
      {#snippet sizeIcon()}
        <Button size="icon" aria-label={$tStore('demonstration.labels.iconOnly')}>
          <Trash2 class="h-4 w-4" aria-hidden="true" />
        </Button>
      {/snippet}
      {#snippet sizeIconSm()}
        <Button size="icon-sm" aria-label={$tStore('demonstration.labels.ghost')}>
          <Pencil class="h-4 w-4" aria-hidden="true" />
        </Button>
      {/snippet}
      {#snippet sizeIconLg()}
        <Button size="icon-lg" aria-label={$tStore('demonstration.labels.withIcon')}>
          <Plus class="h-4 w-4" aria-hidden="true" />
        </Button>
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
          { label: $tStore('states.default.label'),      trigger: $tStore('states.default.trigger'),                behavior: $tStore('states.default.behavior') },
          { label: $tStore('states.hover.label'),        trigger: $tStore('states.hover.trigger'),                  behavior: stripHtml($tStore('states.hover.behavior')) },
          { label: $tStore('states.focusVisible.label'), trigger: $tStore('states.focusVisible.trigger'),           behavior: stripHtml($tStore('states.focusVisible.behavior')) },
          { label: $tStore('states.disabled.label'),     trigger: stripHtml($tStore('states.disabled.trigger')),    behavior: stripHtml($tStore('states.disabled.behavior')) },
          { label: $tStore('states.loading.label'),      trigger: stripHtml($tStore('states.loading.trigger')),     behavior: $tStore('states.loading.behavior') },
          { label: $tStore('states.invalid.label'),      trigger: stripHtml($tStore('states.invalid.trigger')),     behavior: stripHtml($tStore('states.invalid.behavior')) },
        ]}
      />

      <!-- ── Propriedades ───────────────────────────────────────────── -->
      <DocsProps
        title={$tStore('props.title')}
        tables={[
          {
            title: $tStore('props.buttonTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'variant',  type: '"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"', defaultValue: '"default"', required: 'Não', description: stripHtml($tStore('props.table.variant')) },
              { name: 'size',     type: '"default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"',               defaultValue: '"default"', required: 'Não', description: stripHtml($tStore('props.table.size')) },
              { name: 'href',     type: 'string',                                                                 defaultValue: '—',         required: 'Não', description: 'Quando fornecido, renderiza como <a> mantendo os estilos. Equivalente ao asChild no React.' },
              { name: 'disabled', type: 'boolean',                                                                defaultValue: 'false',     required: 'Não', description: stripHtml($tStore('props.table.disabled')) },
              { name: 'type',     type: '"button" | "submit" | "reset"',                                          defaultValue: '"button"',  required: 'Não', description: stripHtml($tStore('props.table.type')) },
              { name: 'onclick',  type: '(e: MouseEvent) => void',                                                defaultValue: '—',         required: 'Não', description: stripHtml($tStore('props.table.onClick')) },
              { name: 'class',    type: 'string',                                                                 defaultValue: '—',         required: 'Não', description: $tStore('props.table.className') },
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
          { token: '--primary',            value: 'bg-primary',                  description: $tStore('tokens.table.primary') },
          { token: '--primary-foreground', value: 'text-primary-foreground',     description: $tStore('tokens.table.primaryForeground') },
          { token: '--secondary',          value: 'bg-secondary',                description: $tStore('tokens.table.secondary') },
          { token: '--destructive',        value: 'bg-destructive text-white',   description: $tStore('tokens.table.destructive') },
          { token: '--border',             value: 'border',                      description: $tStore('tokens.table.border') },
          { token: '--accent',             value: 'hover:bg-accent',             description: $tStore('tokens.table.accent') },
          { token: '--ring',               value: 'focus-visible:ring-ring/50',  description: $tStore('tokens.table.ring') },
          { token: '--radius',             value: 'rounded-lg',                  description: $tStore('tokens.table.radius') },
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
          { key: 'Tab',   description: $tStore('accessibility.keyboard.tab') },
          { key: 'Enter', description: stripHtml($tStore('accessibility.keyboard.enter')) },
          { key: 'Space', description: stripHtml($tStore('accessibility.keyboard.space')) },
          { key: '—',     description: stripHtml($tStore('accessibility.keyboard.disabled')) },
        ]}
      />

      <!-- ── Relacionados ───────────────────────────────────────────── -->
      <DocsRelated
        title={$tStore('related.title')}
        items={[
          { name: 'Toggle',      description: stripHtml($tStore('related.toggle')),     path: '?path=/docs/ui-toggle--docs' },
          { name: 'Switch',      description: $tStore('related.switch'),                path: '?path=/docs/ui-switch--docs' },
          { name: 'Link',        description: $tStore('related.link'),                  path: '?path=/docs/ui-link--docs' },
          { name: 'Form',        description: $tStore('related.form'),                  path: '?path=/docs/ui-form--docs' },
          { name: 'Dialog',      description: $tStore('related.dialog'),                path: '?path=/docs/ui-dialog--docs' },
          { name: 'AlertDialog', description: $tStore('related.alertDialog'),           path: '?path=/docs/ui-alertdialog--docs' },
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
          { event: $tStore('analytics.table.click'),         trigger: stripHtml($tStore('analytics.table.clickTrigger')),    payload: $tStore('analytics.table.clickPayload') },
          { event: $tStore('analytics.table.pageView'),      trigger: $tStore('analytics.table.pageViewTrigger'),            payload: $tStore('analytics.table.pageViewPayload') },
          { event: $tStore('analytics.table.sectionViewed'), trigger: $tStore('analytics.table.sectionViewedTrigger'),       payload: $tStore('analytics.table.sectionViewedPayload') },
          { event: $tStore('analytics.table.langSwitch'),    trigger: $tStore('analytics.table.langSwitchTrigger'),          payload: $tStore('analytics.table.langSwitchPayload') },
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
            { action: stripHtml($tStore('testes.functional.item5.action')), result: $tStore('testes.functional.item5.result'),            priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item6.action'),            result: stripHtml($tStore('testes.functional.item6.result')), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
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
            { criterion: $tStore('testes.accessibility.item2.criterion'),            level: $tStore('testes.accessibility.item2.level'), how: $tStore('testes.accessibility.item2.how') },
            { criterion: $tStore('testes.accessibility.item3.criterion'),            level: $tStore('testes.accessibility.item3.level'), how: $tStore('testes.accessibility.item3.how') },
            { criterion: $tStore('testes.accessibility.item4.criterion'),            level: $tStore('testes.accessibility.item4.level'), how: $tStore('testes.accessibility.item4.how') },
            { criterion: $tStore('testes.accessibility.item5.criterion'),            level: $tStore('testes.accessibility.item5.level'), how: $tStore('testes.accessibility.item5.how') },
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

    </div>
  </div>
</div>
