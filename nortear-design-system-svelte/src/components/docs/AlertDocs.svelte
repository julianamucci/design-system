<script lang="ts">
  import { untrack } from 'svelte';
  import { Alert, AlertTitle, AlertDescription, AlertAction } from '@/components/ui/alert';
  import { Button } from '@/components/ui/button';
  import Info from '@lucide/svelte/icons/info';
  import AlertCircle from '@lucide/svelte/icons/circle-alert';
  import CheckCircle2 from '@lucide/svelte/icons/circle-check-big';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import alertTranslations from '@shared/content/alert/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(alertTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = $derived(
    Object.values(
      (alertTranslations as unknown as Record<
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
      componentSlug: 'alert',
    });
    track('docs_page_view', {
      component_name: 'alert',
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

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'alert', locale: $locale });
  });
  $effect(() => section.attach());

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";`;
  const codeImportWithIcon = `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Info from '@lucide/svelte/icons/info';`;

  const codeDefault = `<Alert>
  <Info aria-hidden="true" />
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>
    Suas alterações serão aplicadas na próxima sessão.
  </AlertDescription>
</Alert>`;

  const codeDestructive = `<Alert variant="destructive">
  <AlertCircle aria-hidden="true" />
  <AlertTitle>Erro ao salvar</AlertTitle>
  <AlertDescription>
    Não foi possível salvar. Verifique sua conexão e tente novamente.
  </AlertDescription>
</Alert>`;

  const codeSuccess = `<Alert variant="success">
  <CheckCircle2 aria-hidden="true" />
  <AlertTitle>Perfil atualizado</AlertTitle>
  <AlertDescription>
    Suas informações foram salvas com sucesso.
  </AlertDescription>
</Alert>`;

  const codeWarning = `<Alert variant="warning">
  <TriangleAlert aria-hidden="true" />
  <AlertTitle>Assinatura expirando</AlertTitle>
  <AlertDescription>
    Sua assinatura expira em 3 dias. Renove para evitar interrupções.
  </AlertDescription>
</Alert>`;

  const codeInfo = `<Alert variant="info">
  <Info aria-hidden="true" />
  <AlertTitle>Dica</AlertTitle>
  <AlertDescription>
    Você pode fixar seus filtros favoritos para acessá-los mais rápido.
  </AlertDescription>
</Alert>`;

  const codeDismissible = `<Alert dismissible onDismiss={() => console.log("fechado")}>
  <Info aria-hidden="true" />
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>
    Suas alterações serão aplicadas na próxima sessão.
  </AlertDescription>
</Alert>`;

  const codeWithoutTitle = `<Alert>
  <Info aria-hidden="true" />
  <AlertDescription>
    Suas alterações serão aplicadas na próxima sessão.
  </AlertDescription>
</Alert>`;

  const interfaceCode = `// Alert
interface AlertProps {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  role?: 'alert' | 'status' | 'note'; // semântica de anúncio, default 'alert'
  class?: string;
  children?: Snippet;
  dismissible?: boolean;       // botão de fechar no canto superior direito
  onDismiss?: () => void;      // callback de fechamento, dispara uma vez
  dismissLabel?: string;       // aria-label do botão ('Fechar alerta')
}

// AlertTitle
interface AlertTitleProps {
  as?: string;                 // nível do heading (h1..h6), default 'h5'
  class?: string;
  children?: Snippet;
}

// AlertTitle / AlertDescription aceitam atributos HTML nativos via spread`;
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
        <div class="nds-w-full nds-stack" data-spacing="sm">
          <!-- default: sem título — só ícone + descrição -->
          <Alert>
            <Info aria-hidden="true" />
            <AlertDescription>{$tStore('demonstration.labels.infoDesc')}</AlertDescription>
          </Alert>
          <!-- destructive: com título -->
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle as="h3">{$tStore('demonstration.labels.errorTitle')}</AlertTitle>
            <AlertDescription>{$tStore('demonstration.labels.errorDesc')}</AlertDescription>
          </Alert>
          <!-- success: com título + dismissible -->
          <Alert
            variant="success"
            dismissible
            onDismiss={() => track('alert_dismiss', { component: 'alert', label: 'demonstration', location: 'docs_demo' })}
          >
            <CheckCircle2 aria-hidden="true" />
            <AlertTitle as="h3">{$tStore('demonstration.labels.successTitle')}</AlertTitle>
            <AlertDescription>{$tStore('demonstration.labels.successDesc')}</AlertDescription>
          </Alert>
          <!-- warning: com título + ação no slot AlertAction.
               `.nds-alert-action` é position:absolute no canto superior direito
               (alert.css) — é o "alinhado à direita" que o conteúdo descreve.
               Empilhar o botão dentro da descrição o joga para a linha de baixo,
               à esquerda, divergindo da story ComAcao, que sempre usou o slot. -->
          <Alert variant="warning">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle as="h3">{$tStore('demonstration.labels.warningTitle')}</AlertTitle>
            <AlertDescription>{$tStore('demonstration.labels.warningDesc')}</AlertDescription>
            <AlertAction>
              <Button size="sm" variant="default">{$tStore('demonstration.labels.warningAction')}</Button>
            </AlertAction>
          </Alert>
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
            { element: $tStore('usage.uxWriting.table.title.name'),       rules: $tStore('usage.uxWriting.table.title.format'),       do: $tStore('usage.uxWriting.table.title.good'),       dont: $tStore('usage.uxWriting.table.title.bad') },
            { element: $tStore('usage.uxWriting.table.description.name'), rules: $tStore('usage.uxWriting.table.description.format'), do: $tStore('usage.uxWriting.table.description.good'), dont: $tStore('usage.uxWriting.table.description.bad') },
            { element: $tStore('usage.uxWriting.table.error.name'),       rules: $tStore('usage.uxWriting.table.error.format'),       do: $tStore('usage.uxWriting.table.error.good'),       dont: $tStore('usage.uxWriting.table.error.bad') },
            { element: $tStore('usage.uxWriting.table.warning.name'),     rules: $tStore('usage.uxWriting.table.warning.format'),     do: $tStore('usage.uxWriting.table.warning.good'),     dont: $tStore('usage.uxWriting.table.warning.bad') },
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
        <Alert>
          <AlertCircle aria-hidden="true" />
          <AlertTitle as="h3">Erro ao salvar</AlertTitle>
          <AlertDescription>Não foi possível salvar. Verifique sua conexão.</AlertDescription>
        </Alert>
      {/snippet}
      {#snippet dontPair1()}
        <Alert><AlertDescription>Salvo!</AlertDescription></Alert>
      {/snippet}
      {#snippet doPair2()}
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle as="h3">Erro ao salvar</AlertTitle>
          <AlertDescription>Verifique sua conexão.</AlertDescription>
        </Alert>
      {/snippet}
      {#snippet dontPair2()}
        <Alert variant="destructive">
          <AlertTitle as="h3">Erro ao salvar</AlertTitle>
          <AlertDescription>Verifique sua conexão.</AlertDescription>
        </Alert>
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
      <DocsCompositions
        id="variantes"
        title={$tStore('variants.title')}
        useWhenLabel={$tNavStore('common.useWhen')}
        componentSlug="alert"
        items={[
          { name: 'default',     description: $tStore('variants.items.default'),                 code: codeDefault,      preview: variantDefault      },
          { name: 'destructive', description: stripHtml($tStore('variants.items.destructive')),  code: codeDestructive,  preview: variantDestructive  },
          { name: 'success',     description: stripHtml($tStore('variants.items.success')),      code: codeSuccess,      preview: variantSuccess      },
          { name: 'warning',     description: stripHtml($tStore('variants.items.warning')),      code: codeWarning,      preview: variantWarning      },
          { name: 'info',        description: stripHtml($tStore('variants.items.info')),         code: codeInfo,         preview: variantInfo         },
          { name: $tStore('variants.items.dismissible.name'), description: $tStore('variants.items.dismissible.description'), useWhen: $tStore('variants.items.dismissible.use'), trackId: 'dismissible', code: codeDismissible, preview: variantDismissible },
          { trackId: 'withoutTitle', name: $tStore('states.withoutTitle.label'), description: $tStore('states.withoutTitle.behavior'), code: codeWithoutTitle, preview: variantWithoutTitle },
        ]}
      />

      {#snippet variantDefault()}
        <Alert class="nds-w-full">
          <Info aria-hidden="true" />
          <AlertTitle as="h3">{$tStore('demonstration.labels.infoTitle')}</AlertTitle>
          <AlertDescription>{$tStore('demonstration.labels.infoDesc')}</AlertDescription>
        </Alert>
      {/snippet}
      {#snippet variantDestructive()}
        <Alert variant="destructive" class="nds-w-full">
          <AlertCircle aria-hidden="true" />
          <AlertTitle as="h3">{$tStore('demonstration.labels.errorTitle')}</AlertTitle>
          <AlertDescription>{$tStore('demonstration.labels.errorDesc')}</AlertDescription>
        </Alert>
      {/snippet}
      {#snippet variantSuccess()}
        <Alert variant="success" class="nds-w-full">
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle as="h3">{$tStore('demonstration.labels.successTitle')}</AlertTitle>
          <AlertDescription>{$tStore('demonstration.labels.successDesc')}</AlertDescription>
        </Alert>
      {/snippet}
      {#snippet variantWarning()}
        <Alert variant="warning" class="nds-w-full">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle as="h3">{$tStore('demonstration.labels.warningTitle')}</AlertTitle>
          <AlertDescription>{$tStore('demonstration.labels.warningDesc')}</AlertDescription>
        </Alert>
      {/snippet}
      {#snippet variantInfo()}
        <Alert variant="info" class="nds-w-full">
          <Info aria-hidden="true" />
          <AlertTitle as="h3">Dica</AlertTitle>
          <AlertDescription>Você pode fixar seus filtros favoritos para acessá-los mais rápido.</AlertDescription>
        </Alert>
      {/snippet}
      {#snippet variantDismissible()}
        <Alert
          dismissible
          class="nds-w-full"
          onDismiss={() => track('alert_dismiss', { component: 'alert', label: 'dismissible', location: 'docs_demo' })}
        >
          <Info aria-hidden="true" />
          <AlertTitle as="h3">{$tStore('demonstration.labels.infoTitle')}</AlertTitle>
          <AlertDescription>{$tStore('demonstration.labels.infoDesc')}</AlertDescription>
        </Alert>
      {/snippet}
      {#snippet variantWithoutTitle()}
        <Alert class="nds-w-full">
          <Info aria-hidden="true" />
          <AlertDescription>{$tStore('demonstration.labels.infoDesc')}</AlertDescription>
        </Alert>
      {/snippet}
      <!-- ── Composições ──────────────────────────────────────────────── -->
      <DocsCompositions
        title={$tStore('variants.compositionsTitle')}
        useWhenLabel={$tNavStore('common.useWhen')}
        componentSlug="alert"
        items={[
          {
            trackId: 'withIcon',
            name: $tStore('variants.compositions.withIcon.name'),
            description: $tStore('variants.compositions.withIcon.description'),
            useWhen: $tStore('variants.compositions.withIcon.use'),
            code: `<Alert><Info aria-hidden="true" /><AlertTitle>Informação</AlertTitle><AlertDescription>Ícone SVG posicionado automaticamente.</AlertDescription></Alert>`,
            preview: compWithIcon,
          },
          {
            trackId: 'withAction',
            name: $tStore('variants.compositions.withAction.name'),
            description: $tStore('variants.compositions.withAction.description'),
            useWhen: $tStore('variants.compositions.withAction.use'),
            // Slot AlertAction, igual à story ComAcao. O markup anterior
            // empilhava o botão dentro da descrição e ele caía na linha de
            // baixo — divergia da story e do "alinhado à direita" do texto.
            code: `<Alert>\n  <Info aria-hidden="true" />\n  <AlertTitle>Sessão expira em 5 minutos</AlertTitle>\n  <AlertDescription>Salve seu trabalho para não perder as alterações.</AlertDescription>\n  <AlertAction>\n    <Button size="sm" variant="default">Salvar agora</Button>\n  </AlertAction>\n</Alert>`,
            preview: compWithAction,
          },
        ]}
      />

      {#snippet compWithIcon()}
        <Alert class="nds-w-full">
          <Info aria-hidden="true" />
          <AlertTitle as="h3">{$tStore('demonstration.labels.infoTitle')}</AlertTitle>
          <AlertDescription>{$tStore('demonstration.labels.infoDesc')}</AlertDescription>
        </Alert>
      {/snippet}
      {#snippet compWithAction()}
        <Alert class="nds-w-full">
          <Info aria-hidden="true" />
          <AlertTitle as="h3">Sessão expira em 5 minutos</AlertTitle>
          <AlertDescription>Salve seu trabalho para não perder as alterações.</AlertDescription>
          <AlertAction>
            <Button size="sm" variant="default">Salvar agora</Button>
          </AlertAction>
        </Alert>
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
          { label: $tStore('states.complete.label'),      trigger: toPlainText($tStore('states.complete.trigger')),      behavior: toPlainText($tStore('states.complete.behavior'))},
          { label: $tStore('states.withoutTitle.label'),  trigger: toPlainText($tStore('states.withoutTitle.trigger')),  behavior: toPlainText($tStore('states.withoutTitle.behavior'))},
          { label: $tStore('states.withoutIcon.label'),   trigger: toPlainText($tStore('states.withoutIcon.trigger')),              behavior: toPlainText($tStore('states.withoutIcon.behavior'))},
          { label: $tStore('states.dynamicInsert.label'), trigger: toPlainText($tStore('states.dynamicInsert.trigger')),            behavior: toPlainText($tStore('states.dynamicInsert.behavior')) },
          { label: $tStore('states.dismissed.label'),     trigger: toPlainText($tStore('states.dismissed.trigger')),                behavior: toPlainText($tStore('states.dismissed.behavior'))},
        ]}
      />

      <!-- ── Propriedades ───────────────────────────────────────────── -->
      <DocsProps
        title={$tStore('props.title')}
        tables={[
          {
            title: $tStore('props.alertTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'variant',  type: '"default" | "destructive" | "success" | "warning" | "info"', defaultValue: '"default"', required: 'Não', description: toPlainText($tStore('props.table.variant')) },
              { name: 'role',     type: '"alert" | "status" | "note"', defaultValue: '"alert"', required: 'Não', description: toPlainText($tStore('props.table.role')) },
              { name: 'class',    type: 'string',                    defaultValue: '—',         required: 'Não', description: toPlainText($tStore('props.table.className'))           },
              { name: 'children', type: 'Snippet',                   defaultValue: '—',         required: 'Não', description: $tStore('props.table.children')            },
              { name: 'dismissible',  type: 'boolean',    defaultValue: 'false',            required: 'Não', description: $tStore('props.table.dismissible')  },
              { name: 'onDismiss',    type: '() => void', defaultValue: '—',                required: 'Não', description: $tStore('props.table.onDismiss')    },
              { name: 'dismissLabel', type: 'string',     defaultValue: "'Fechar alerta'",  required: 'Não', description: $tStore('props.table.dismissLabel') },
            ],
          },
          {
            title: $tStore('props.alertTitleTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'as', type: 'string', defaultValue: "'h5'", required: 'Não', description: toPlainText($tStore('props.table.titleAs')) },
              { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Sim', description: $tStore('props.table.children') },
            ],
          },
          {
            title: $tStore('props.alertDescTitle'),
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: [
              { name: 'children', type: 'Snippet', defaultValue: '—', required: 'Sim', description: $tStore('props.table.children') },
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
          { token: '--muted',        value: 'hsl(var(--muted))',             description: $tStore('tokens.table.background')        },
          { token: '--foreground',   value: 'hsl(var(--foreground))',        description: $tStore('tokens.table.foreground')        },
          { token: '--border',       value: 'hsl(var(--border))',            description: $tStore('tokens.table.border')            },
          { token: '--destructive',  value: 'hsl(var(--destructive) / 0.3)', description: $tStore('tokens.table.destructiveBorder') },
          { token: '--destructive',  value: 'hsl(var(--destructive))',       description: $tStore('tokens.table.destructiveText')   },
          { token: '--success',      value: '.nds-alert-success',            description: $tStore('tokens.table.success')           },
          { token: '--warning',      value: '.nds-alert-warning',            description: $tStore('tokens.table.warning')           },
          { token: '--info',         value: '.nds-alert-info',               description: $tStore('tokens.table.info')              },
          { token: '--radius-alert', value: 'var(--radius-alert)',           description: $tStore('tokens.table.radius')            },
          { token: '--alert-bg',     value: 'hsl(var(--muted))',             description: $tStore('tokens.table.alertBg')           },
          { token: '--alert-bg-alpha', value: '0.1',                         description: $tStore('tokens.table.alertBgAlpha')      },
          { token: '--alert-fg',     value: 'hsl(var(--card-foreground))',   description: $tStore('tokens.table.alertFg')           },
          { token: '--alert-body-fg', value: 'hsl(var(--foreground))',       description: $tStore('tokens.table.alertBodyFg')       },
          { token: '--alert-border', value: 'hsl(var(--border))',            description: $tStore('tokens.table.alertBorder')       },
          { token: '--alert-border-alpha', value: '0.3',                     description: $tStore('tokens.table.alertBorderAlpha')  },
          { token: '--alert-glow',   value: 'hsl(var(--border))',            description: $tStore('tokens.table.alertGlow')         },
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
          { name: 'Sonner',      description: $tStore('related.sonner'),      path: '?path=/docs/primitives-feedback-sonner--docs'      },
          { name: 'AlertDialog', description: $tStore('related.alertDialog'), path: '?path=/docs/primitives-overlay-alertdialog--docs' },
          { name: 'Badge',       description: $tStore('related.badge'),       path: '?path=/docs/primitives-feedback-badge--docs'       },
          { name: 'Progress',    description: $tStore('related.progress'),    path: '?path=/docs/primitives-feedback-progress--docs'    },
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
          trigger: toPlainText($tStore('analytics.table.trigger')),
          payload: $tStore('analytics.table.payload'),
        }}
        items={[
          { event: $tStore('analytics.table.dismiss'),       trigger: toPlainText($tStore('analytics.table.dismissTrigger')),       payload: $tStore('analytics.table.dismissPayload')       },
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
          items: [
            { action: $tStore('testes.functional.item1.action'), result: $tStore('testes.functional.item1.result'), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item2.action'), result: $tStore('testes.functional.item2.result'), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item3.action'), result: $tStore('testes.functional.item3.result'), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item4.action'), result: $tStore('testes.functional.item4.result'), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item5.action'), result: $tStore('testes.functional.item5.result'), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item6.action'), result: $tStore('testes.functional.item6.result'), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item7.action'), result: $tStore('testes.functional.item7.result'), priority: localPriority($tStore('testes.functional.item7.priority'), $tNavStore) },
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
            { story: $tStore('testes.visual.item5.story'), priority: localPriority($tStore('testes.visual.item5.priority'), $tNavStore) },
          ],
        }}
      />
</DocsPageLayout>
