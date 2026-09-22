<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { Alert, AlertAction, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-vue-next';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import alertTranslations from '@shared/content/alert/translations.json';

import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsCompositions  from '@/components/docs/shared/sections/DocsCompositions.vue';
import DocsStates        from '@/components/docs/shared/sections/DocsStates.vue';
import DocsProps         from '@/components/docs/shared/sections/DocsProps.vue';
import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.vue';
import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.vue';
import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.vue';
import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.vue';
import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.vue';
import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.vue';
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(alertTranslations);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
// O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (alertTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale.value]?.accessibility?.screenReader ?? {},
  )
    .filter(([key]) => key !== 'title')
    .map(([, value]) => value),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

// O dicionário do locale vigente, para as listas que se derivam do conteúdo em
// vez de repetir os índices à mão.
const localeContent = computed(
  () =>
    (alertTranslations as unknown as Record<
      string,
      {
        anatomy?: Record<string, unknown>;
        accessibility?: Record<string, unknown>;
        notes?: Record<string, unknown>;
        testes?: Record<string, Record<string, unknown>>;
        usage?: {
          guidelines?: Record<string, unknown>;
          scenarios?: Record<string, unknown>;
          do?: Record<string, unknown>;
          dont?: Record<string, unknown>;
        };
      }
    >)[locale.value],
);

// Índices das chaves numeradas de um dicionário, em ordem numérica. O prefixo é
// parâmetro porque nem todo grupo do conteúdo usa `itemN`: as notas publicam
// `tipN`, e o teto cravado seria o mesmo se a função só soubesse um prefixo.
function itemIndexes(dict: Record<string, unknown> | undefined, prefix = 'item'): number[] {
  return Object.keys(dict ?? {})
    .map((key) => new RegExp(`^${prefix}(\\d+)$`).exec(key)?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number)
    .sort((a, b) => a - b);
}

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function localPriority(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'alert',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'alert',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Analytics — section view ─────────────────────────────────────────────────

// ─── Navigation groups ────────────────────────────────────────────────────────

const navGroups = computed(() => [
  {
    label: tNav('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tNav('nav.demonstration') },
      { id: 'anatomia',     label: tNav('nav.anatomy')      },
      { id: 'quando-usar',  label: tNav('nav.usage')        },
      { id: 'do-dont',      label: tNav('nav.doDont')       },
    ],
  },
  {
    label: tNav('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tNav('nav.import')   },
      { id: 'variantes',    label: tNav('nav.variants') },
      { id: 'composicoes',  label: tNav('nav.compositions') },
      { id: 'estados',      label: tNav('nav.states')   },
      { id: 'propriedades', label: tNav('nav.props')    },
      { id: 'tokens',       label: tNav('nav.tokens')   },
    ],
  },
  {
    label: tNav('nav.context'),
    sections: [
      { id: 'acessibilidade', label: tNav('nav.accessibility') },
      { id: 'relacionados',   label: tNav('nav.related')       },
      { id: 'notas',          label: tNav('nav.notes')         },
    ],
  },
  {
    label: tNav('nav.quality'),
    sections: [
      { id: 'analytics', label: tNav('nav.analytics') },
      { id: 'testes',    label: tNav('nav.testes')    },
    ],
  },
]);

const allSectionIds = computed(() => navGroups.value.flatMap(g => g.sections.map(s => s.id)));

const { activeId: activeSection } = useActiveSection(allSectionIds, (id) => {
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'alert',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";`;
const codeImportWithIcon = `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-vue-next";`;

const codeDefault = `<Alert>
  <Info aria-hidden="true" />
  <AlertTitle as="h4">Atenção</AlertTitle>
  <AlertDescription>
    Suas alterações serão aplicadas na próxima sessão.
  </AlertDescription>
</Alert>`;

const codeDestructive = `<Alert variant="destructive">
  <AlertCircle aria-hidden="true" />
  <AlertTitle as="h4">Erro ao salvar</AlertTitle>
  <AlertDescription>
    Não foi possível salvar. Verifique sua conexão e tente novamente.
  </AlertDescription>
</Alert>`;

const codeSuccess = `<Alert variant="success">
  <CheckCircle2 aria-hidden="true" />
  <AlertTitle as="h4">Perfil atualizado</AlertTitle>
  <AlertDescription>
    Suas informações foram salvas com sucesso.
  </AlertDescription>
</Alert>`;

const codeWarning = `<Alert variant="warning">
  <TriangleAlert aria-hidden="true" />
  <AlertTitle as="h4">Assinatura expirando</AlertTitle>
  <AlertDescription>
    Sua assinatura expira em 3 dias. Renove para evitar interrupções.
  </AlertDescription>
</Alert>`;

const codeInfo = `<Alert variant="info">
  <Info aria-hidden="true" />
  <AlertTitle as="h4">Atenção</AlertTitle>
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

const codeDismissible = `<Alert dismissible dismiss-label="Fechar alerta" @dismiss="onDismiss">
  <Info aria-hidden="true" />
  <AlertTitle as="h4">Atenção</AlertTitle>
  <AlertDescription>
    Suas alterações serão aplicadas na próxima sessão.
  </AlertDescription>
</Alert>`;

const interfaceCode = `// Alert
interface AlertProps {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  role?: 'alert' | 'status' | 'note';  // semântica de anúncio — padrão: 'alert'
  class?: string;
  dismissible?: boolean;   // exibe o botão de fechar
  dismissLabel?: string;   // rótulo acessível do botão — padrão: 'Fechar alerta'
}

// Emits
// @dismiss — disparado uma única vez ao acionar o botão de fechar

// AlertTitle
interface AlertTitleProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';  // nível pela hierarquia da página — padrão: 'h5'
  class?: string;
}

// AlertAction — container do slot de ação; o botão entra pelo slot padrão
interface AlertActionProps {
  class?: string;
}

// AlertTitle / AlertDescription / AlertAction aceitam atributos HTML nativos`;

// ─── Computed data ────────────────────────────────────────────────────────────

// Os itens saem das chaves `itemN` do dicionário do locale vigente: item novo no
// conteúdo aparece na página sem ninguém lembrar de estender uma lista à mão.
// Lista cravada já perdeu `functional.item8` e `visual.item6` antes de perder
// `anatomy.item5` (AlertAction) e `anatomy.item6` (botão de fechar).
const anatomyItems = computed(() =>
  itemIndexes(localeContent.value?.anatomy).map((i) => tContent(`anatomy.item${i}`)),
);

// Mesmo teto latente da anatomia, nas listas de "Quando usar": hoje elas casam
// com o dicionário, e é exatamente assim que a lista cravada some sem avisar —
// item novo no conteúdo simplesmente não chega à tela.
const usageGuidelineItems = computed(() =>
  itemIndexes(localeContent.value?.usage?.guidelines).map((i) => tContent(`usage.guidelines.item${i}`)),
);

const usageDoItems = computed(() =>
  itemIndexes(localeContent.value?.usage?.do).map((i) => tContent(`usage.do.item${i}`)),
);

const usageDontItems = computed(() =>
  itemIndexes(localeContent.value?.usage?.dont).map((i) => tContent(`usage.dont.item${i}`)),
);

// A tabela de cenários tinha o mesmo teto cravado das listas acima: quatro
// linhas escritas à mão no template, que um `item5` no conteúdo não alcançaria.
const usageScenarioItems = computed(() =>
  itemIndexes(localeContent.value?.usage?.scenarios).map((i) => ({
    s: tContent(`usage.scenarios.item${i}.s`),
    u: tContent(`usage.scenarios.item${i}.u`),
    a: tContent(`usage.scenarios.item${i}.a`),
  })),
);

const variantItems = computed(() => [
  { name: 'default',     description: tContent('variants.items.default'),                code: codeDefault      },
  { name: 'destructive', description: stripHtml(tContent('variants.items.destructive')), code: codeDestructive  },
  { name: 'success',     description: stripHtml(tContent('variants.items.success')),     code: codeSuccess      },
  { name: 'warning',     description: stripHtml(tContent('variants.items.warning')),     code: codeWarning      },
  { name: 'info',        description: stripHtml(tContent('variants.items.info')),        code: codeInfo         },
  { trackId: 'dismissible', name: tContent('variants.items.dismissible.name'), description: tContent('variants.items.dismissible.description'), useWhen: tContent('variants.items.dismissible.use'), code: codeDismissible },
  { trackId: 'withoutTitle', name: tContent('states.withoutTitle.label'), description: tContent('states.withoutTitle.behavior'), code: codeWithoutTitle },
]);

// Fechamento do card "Dispensável" em Variantes. O primitivo não importa
// analytics; o tracking é responsabilidade do consumidor via emit @dismiss.
function onVariantDismiss() {
  track('alert_dismiss', {
    component: 'alert',
    label: 'dismissible',
    location: 'docs_variantes',
  });
}

// Dismiss do alert de sucesso da seção Demonstração.
function onDemonstrationDismiss() {
  track('alert_dismiss', {
    component: 'alert',
    label: 'demonstration',
    location: 'docs_demo',
  });
}

const compositionItems = computed(() => [
  {
    trackId: 'withIcon',
    name: tContent('variants.compositions.withIcon.name'),
    description: tContent('variants.compositions.withIcon.description'),
    useWhen: tContent('variants.compositions.withIcon.use'),
    code: `<Alert>\n  <Info aria-hidden="true" />\n  <AlertTitle as="h4">Informação</AlertTitle>\n  <AlertDescription>Ícone SVG posicionado automaticamente.</AlertDescription>\n</Alert>`,
  },
  {
    trackId: 'withAction',
    name: tContent('variants.compositions.withAction.name'),
    description: tContent('variants.compositions.withAction.description'),
    useWhen: tContent('variants.compositions.withAction.use'),
    // Slot AlertAction, igual à story ComAcao. O markup anterior empilhava o
    // botão dentro da descrição e ele caía na linha de baixo, à esquerda —
    // divergia da story e do "alinhado à direita" do texto.
    code: `<Alert>\n  <Info aria-hidden="true" />\n  <AlertTitle as="h4">Sessão expira em 5 minutos</AlertTitle>\n  <AlertDescription>Salve seu trabalho para não perder as alterações.</AlertDescription>\n  <AlertAction>\n    <Button size="sm" variant="default">Salvar agora</Button>\n  </AlertAction>\n</Alert>`,
  },
  {
    trackId: 'withActionAndDismiss',
    name: tContent('variants.compositions.withActionAndDismiss.name'),
    description: tContent('variants.compositions.withActionAndDismiss.description'),
    useWhen: tContent('variants.compositions.withActionAndDismiss.use'),
    // Mesma composição da story WithActionAndDismiss: nenhuma prop de layout, a
    // ação ocupa a própria coluna do grid e o botão de fechar fica na calha dele.
    code: `<Alert dismissible>\n  <Info aria-hidden="true" />\n  <AlertTitle as="h4">Sessão expira em 5 minutos</AlertTitle>\n  <AlertDescription>Salve seu trabalho para não perder as alterações.</AlertDescription>\n  <AlertAction>\n    <Button size="sm" variant="default">Salvar agora</Button>\n  </AlertAction>\n</Alert>`,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.complete.label'),      trigger: toPlainText(tContent('states.complete.trigger')),      behavior: toPlainText(tContent('states.complete.behavior'))},
  { label: tContent('states.withoutTitle.label'),  trigger: toPlainText(tContent('states.withoutTitle.trigger')),  behavior: toPlainText(tContent('states.withoutTitle.behavior'))},
  { label: tContent('states.withoutIcon.label'),   trigger: toPlainText(tContent('states.withoutIcon.trigger')),              behavior: toPlainText(tContent('states.withoutIcon.behavior'))},
  { label: tContent('states.withoutAnnouncement.label'), trigger: toPlainText(tContent('states.withoutAnnouncement.trigger')), behavior: toPlainText(tContent('states.withoutAnnouncement.behavior'))},
  { label: tContent('states.dynamicInsert.label'), trigger: toPlainText(tContent('states.dynamicInsert.trigger')),            behavior: toPlainText(tContent('states.dynamicInsert.behavior'))    },
  { label: tContent('states.dismissed.label'),     trigger: toPlainText(tContent('states.dismissed.trigger')),                behavior: toPlainText(tContent('states.dismissed.behavior'))},
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'), type: tContent('props.table.type'),
  default: tContent('props.table.default'), required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const slotPropItem = computed(() => (
  { name: 'default slot', type: 'VNode', defaultValue: '—', required: tNav('common.yes'), description: tContent('props.table.children') }
));

const classPropItem = computed(() => (
  { name: 'class', type: 'string', defaultValue: '—', required: tNav('common.no'), description: toPlainText(tContent('props.table.className')) }
));

const alertPropItems = computed(() => [
  { name: 'variant', type: '"default" | "destructive" | "success" | "warning" | "info"', defaultValue: '"default"', required: tNav('common.no'), description: toPlainText(tContent('props.table.variant'))  },
  { name: 'role',    type: '"alert" | "status" | "note"', defaultValue: '"alert"', required: tNav('common.no'), description: toPlainText(tContent('props.table.role'))                  },
  { name: 'class',   type: 'string',                    defaultValue: '—',         required: tNav('common.no'), description: toPlainText(tContent('props.table.className'))             },
  // O conteúdo é linha de tabela como qualquer outra: é o slot que recebe
  // ícone, título, descrição e ação, e sem ele a tabela da raiz descrevia uma
  // peça a menos que as de AlertTitle e AlertDescription.
  slotPropItem.value,
  { name: 'dismissible',  type: 'boolean',           defaultValue: 'false',             required: tNav('common.no'), description: toPlainText(tContent('props.table.dismissible'))  },
  { name: '@dismiss',     type: 'emit — () => void', defaultValue: '—',                 required: tNav('common.no'), description: toPlainText(tContent('props.table.onDismiss'))    },
  { name: 'dismissLabel', type: 'string',            defaultValue: "'Fechar alerta'",   required: tNav('common.no'), description: toPlainText(tContent('props.table.dismissLabel')) },
]);

const alertTitlePropItems = computed(() => [
  { name: 'as', type: "'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'", defaultValue: "'h5'", required: tNav('common.no'), description: toPlainText(tContent('props.table.titleAs')) },
  classPropItem.value,
  slotPropItem.value,
]);

const alertDescriptionPropItems = computed(() => [
  classPropItem.value,
  slotPropItem.value,
]);

// A descrição do slot é a de `props.table.alertAction` — o que entra aqui é o
// controle que resolve o alerta, não o conteúdo do Alert de `table.children`.
const alertActionPropItems = computed(() => [
  classPropItem.value,
  { name: 'default slot', type: 'VNode', defaultValue: '—', required: tNav('common.yes'), description: toPlainText(tContent('props.table.alertAction')) },
]);

const tokenRows = computed(() => [
  { token: '--muted',        value: 'hsl(var(--muted))',                description: tContent('tokens.table.background')        },
  { token: '--foreground',   value: 'hsl(var(--foreground))',           description: tContent('tokens.table.foreground')        },
  { token: '--border',       value: 'hsl(var(--border))',               description: tContent('tokens.table.border')            },
  { token: '--destructive',  value: 'hsl(var(--destructive) / 0.3)',    description: tContent('tokens.table.destructiveBorder') },
  { token: '--destructive',  value: 'hsl(var(--destructive))',          description: tContent('tokens.table.destructiveText')   },
  { token: '--success',      value: '.nds-alert-success',               description: tContent('tokens.table.success')           },
  { token: '--warning',      value: '.nds-alert-warning',               description: tContent('tokens.table.warning')           },
  { token: '--info',         value: '.nds-alert-info',                  description: tContent('tokens.table.info')              },
  { token: '--radius-alert', value: 'var(--radius-alert)',              description: tContent('tokens.table.radius')            },
  { token: '--alert-bg',     value: 'hsl(var(--muted))',                description: tContent('tokens.table.alertBg')           },
  { token: '--alert-bg-alpha', value: '0.1',                            description: tContent('tokens.table.alertBgAlpha')      },
  { token: '--alert-fg',     value: 'hsl(var(--card-foreground))',      description: tContent('tokens.table.alertFg')           },
  { token: '--alert-body-fg', value: 'hsl(var(--foreground))',          description: tContent('tokens.table.alertBodyFg')       },
  { token: '--alert-border', value: 'hsl(var(--border))',               description: tContent('tokens.table.alertBorder')       },
  { token: '--alert-border-alpha', value: '0.3',                        description: tContent('tokens.table.alertBorderAlpha')  },
  { token: '--alert-glow',   value: 'hsl(var(--border))',               description: tContent('tokens.table.alertGlow')         },
]);

// Mesmo teto cravado: a sexta regra de acessibilidade escrita no conteúdo não
// chegaria à página, e nenhum portão reprovaria a omissão.
const accessibilityItems = computed(() =>
  itemIndexes(localeContent.value?.accessibility).map((i) => tContent(`accessibility.item${i}`)),
);

const keyboardItems = computed(() => [
  { key: 'Tab',   description: tContent('accessibility.keyboard.tab')        },
  { key: 'Enter', description: tContent('accessibility.keyboard.enter')      },
  { key: '—',     description: tContent('accessibility.keyboard.noKeyboard') },
]);

const relatedItems = computed(() => [
  { name: 'Sonner',      description: toPlainText(tContent('related.sonner')),      path: '?path=/docs/components-feedback-sonner--docs'      },
  { name: 'AlertDialog', description: toPlainText(tContent('related.alertDialog')), path: '?path=/docs/components-overlay-alertdialog--docs' },
  { name: 'Badge',       description: toPlainText(tContent('related.badge')),       path: '?path=/docs/components-feedback-badge--docs'       },
  { name: 'Progress',    description: toPlainText(tContent('related.progress')),    path: '?path=/docs/components-feedback-progress--docs'    },
]);

// Mesmo teto cravado das demais listas: uma quarta nota escrita no conteúdo
// compartilhado não chegaria à página, e nenhum portão reprovaria a omissão.
// Aqui a chave é `tipN`, não `itemN` — daí o prefixo explícito.
const noteItems = computed(() =>
  itemIndexes(localeContent.value?.notes, 'tip').map((i) => ({
    title: '',
    content: tContent(`notes.tip${i}`),
  })),
);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.dismiss'),       trigger: toPlainText(tContent('analytics.table.dismissTrigger')),       payload: tContent('analytics.table.dismissPayload')       },
  { event: tContent('analytics.table.pageView'),      trigger: toPlainText(tContent('analytics.table.pageViewTrigger')),      payload: tContent('analytics.table.pageViewPayload')      },
  { event: tContent('analytics.table.sectionViewed'), trigger: toPlainText(tContent('analytics.table.sectionViewedTrigger')), payload: tContent('analytics.table.sectionViewedPayload') },
  { event: tContent('analytics.table.langSwitch'),    trigger: toPlainText(tContent('analytics.table.langSwitchTrigger')),    payload: tContent('analytics.table.langSwitchPayload')    },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

function testItemIndexes(group: 'functional' | 'accessibility' | 'visual'): number[] {
  return itemIndexes(localeContent.value?.testes?.[group]);
}

const functionalTestItems = computed(() =>
  testItemIndexes('functional').map((i) => ({
    action: tContent(`testes.functional.item${i}.action`),
    result: tContent(`testes.functional.item${i}.result`),
    priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
  })),
);

const a11yTestItems = computed(() =>
  testItemIndexes('accessibility').map((i) => ({
    criterion: tContent(`testes.accessibility.item${i}.criterion`),
    level: tContent(`testes.accessibility.item${i}.level`),
    how: tContent(`testes.accessibility.item${i}.how`),
  })),
);

const visualTestItems = computed(() =>
  testItemIndexes('visual').map((i) => ({
    story: tContent(`testes.visual.item${i}.story`),
    priority: localPriority(tContent(`testes.visual.item${i}.priority`)),
  })),
);
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration>
      <div
        class="nds-w-full nds-stack"
        data-spacing="sm"
      >
        <!-- default — sem título: só ícone + descrição -->
        <Alert role="note">
          <Info aria-hidden="true" />
          <AlertDescription>{{ tContent('demonstration.labels.infoDesc') }}</AlertDescription>
        </Alert>
        <!-- destructive — título + descrição -->
        <Alert
          role="note"
          variant="destructive"
        >
          <AlertCircle aria-hidden="true" />
          <AlertTitle as="h3">
            {{ tContent('demonstration.labels.errorTitle') }}
          </AlertTitle>
          <AlertDescription>{{ tContent('demonstration.labels.errorDesc') }}</AlertDescription>
        </Alert>
        <!-- success — dismissible: o fechamento emite dismiss -->
        <Alert
          role="note"
          variant="success"
          dismissible
          @dismiss="onDemonstrationDismiss"
        >
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle as="h3">
            {{ tContent('demonstration.labels.successTitle') }}
          </AlertTitle>
          <AlertDescription>{{ tContent('demonstration.labels.successDesc') }}</AlertDescription>
        </Alert>
        <!-- warning — ação no slot AlertAction (mesmo markup da composição withAction) -->
        <Alert
          role="note"
          variant="warning"
        >
          <TriangleAlert aria-hidden="true" />
          <AlertTitle as="h3">
            {{ tContent('demonstration.labels.warningTitle') }}
          </AlertTitle>
          <!-- Slot AlertAction — NÃO botão inline dentro da descrição.
               .nds-alert-action é a coluna à direita do texto (alert.css), que
               é o "alinhado à direita" que o conteúdo descreve.
               Empilhar o botão dentro da descrição o joga para a linha de baixo,
               à esquerda, divergindo da story ComAcao. -->
          <AlertDescription>{{ tContent('demonstration.labels.warningDesc') }}</AlertDescription>
          <AlertAction>
            <Button
              size="sm"
              variant="default"
            >
              {{ tContent('demonstration.labels.warningAction') }}
            </Button>
          </AlertAction>
        </Alert>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ───────────────────────────────────────────────── -->
    <DocsAnatomy
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <!-- ── Quando Usar ────────────────────────────────────────────── -->
    <DocsWhenToUse
      :guidelines="{
        title: tContent('usage.guidelines.title'),
        items: usageGuidelineItems,
      }"
      :scenarios="{
        title: tContent('usage.scenarios.title'),
        cols: { scenario: tContent('usage.scenarios.cols.scenario'), use: tContent('usage.scenarios.cols.use'), alternative: tContent('usage.scenarios.cols.alternative') },
        items: usageScenarioItems,
      }"
      :ux-writing="{
        title: tContent('usage.uxWriting.title'),
        cols: { element: tContent('usage.uxWriting.table.element'), rules: tContent('usage.uxWriting.table.rules'), do: tContent('usage.uxWriting.table.correct'), dont: tContent('usage.uxWriting.table.avoid') },
        items: [
          { element: tContent('usage.uxWriting.table.title.name'), rules: tContent('usage.uxWriting.table.title.format'), do: tContent('usage.uxWriting.table.title.good'), dont: tContent('usage.uxWriting.table.title.bad') },
          { element: tContent('usage.uxWriting.table.description.name'), rules: tContent('usage.uxWriting.table.description.format'), do: tContent('usage.uxWriting.table.description.good'), dont: tContent('usage.uxWriting.table.description.bad') },
          { element: tContent('usage.uxWriting.table.error.name'), rules: tContent('usage.uxWriting.table.error.format'), do: tContent('usage.uxWriting.table.error.good'), dont: tContent('usage.uxWriting.table.error.bad') },
          { element: tContent('usage.uxWriting.table.warning.name'), rules: tContent('usage.uxWriting.table.warning.format'), do: tContent('usage.uxWriting.table.warning.good'), dont: tContent('usage.uxWriting.table.warning.bad') },
        ],
      }"
      :do="{ title: tContent('usage.do.title'), items: usageDoItems }"
      :dont="{ title: tContent('usage.dont.title'), items: usageDontItems }"
    />

    <!-- ── Do & Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
      ]"
    >
      <!-- A prévia é da variante `default`: o ícone é o informativo e a mensagem
           é de atualização disponível. "Erro ao salvar" com `AlertCircle` num
           alerta sem cor semântica ensinava o desalinho que o par condena. -->
      <template #do-preview-0>
        <Alert role="note">
          <Info aria-hidden="true" />
          <AlertTitle as="h3">
            {{ tContent('demonstration.labels.defaultTitle') }}
          </AlertTitle>
          <AlertDescription>{{ tContent('demonstration.labels.defaultDesc') }}</AlertDescription>
        </Alert>
      </template>
      <template #dont-preview-0>
        <Alert role="note">
          <AlertDescription>{{ tContent('demonstration.labels.savedLabel') }}</AlertDescription>
        </Alert>
      </template>
      <template #do-preview-1>
        <Alert
          role="note"
          variant="destructive"
        >
          <AlertCircle aria-hidden="true" />
          <AlertTitle as="h3">
            {{ tContent('demonstration.labels.errorTitle') }}
          </AlertTitle>
          <AlertDescription>{{ tContent('demonstration.labels.errorDesc') }}</AlertDescription>
        </Alert>
      </template>
      <template #dont-preview-1>
        <Alert
          role="note"
          variant="destructive"
        >
          <AlertTitle as="h3">
            {{ tContent('demonstration.labels.errorTitle') }}
          </AlertTitle>
          <AlertDescription>{{ tContent('demonstration.labels.errorDesc') }}</AlertDescription>
        </Alert>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.withIcon')"
      :secondary-code="codeImportWithIcon"
      component-slug="alert"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsCompositions
      id="variantes"
      :use-when-label="tNav('common.useWhen')"
      component-slug="alert"
      :note="tContent('variants.note')"
      :items="variantItems"
    >
      <template #variant-preview-0>
        <Alert role="note">
          <Info aria-hidden="true" />
          <AlertTitle as="h4">
            {{ tContent('demonstration.labels.infoTitle') }}
          </AlertTitle>
          <AlertDescription>{{ tContent('demonstration.labels.infoDesc') }}</AlertDescription>
        </Alert>
      </template>
      <template #variant-preview-1>
        <Alert
          role="note"
          variant="destructive"
        >
          <AlertCircle aria-hidden="true" />
          <AlertTitle as="h4">
            {{ tContent('demonstration.labels.errorTitle') }}
          </AlertTitle>
          <AlertDescription>{{ tContent('demonstration.labels.errorDesc') }}</AlertDescription>
        </Alert>
      </template>
      <template #variant-preview-2>
        <Alert
          role="note"
          variant="success"
        >
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle as="h4">
            {{ tContent('demonstration.labels.successTitle') }}
          </AlertTitle>
          <AlertDescription>{{ tContent('demonstration.labels.successDesc') }}</AlertDescription>
        </Alert>
      </template>
      <template #variant-preview-3>
        <Alert
          role="note"
          variant="warning"
        >
          <TriangleAlert aria-hidden="true" />
          <AlertTitle as="h4">
            {{ tContent('demonstration.labels.warningTitle') }}
          </AlertTitle>
          <AlertDescription>{{ tContent('demonstration.labels.warningDesc') }}</AlertDescription>
        </Alert>
      </template>
      <template #variant-preview-4>
        <Alert
          role="note"
          variant="info"
        >
          <Info aria-hidden="true" />
          <AlertTitle as="h4">
            {{ tContent('demonstration.labels.infoTitle') }}
          </AlertTitle>
          <AlertDescription>{{ tContent('demonstration.labels.infoDesc') }}</AlertDescription>
        </Alert>
      </template>
      <template #variant-preview-5>
        <Alert
          role="note"
          dismissible
          @dismiss="onVariantDismiss"
        >
          <Info aria-hidden="true" />
          <AlertTitle as="h4">
            {{ tContent('demonstration.labels.infoTitle') }}
          </AlertTitle>
          <AlertDescription>{{ tContent('demonstration.labels.infoDesc') }}</AlertDescription>
        </Alert>
      </template>
      <template #variant-preview-6>
        <Alert role="note">
          <Info aria-hidden="true" />
          <AlertDescription>{{ tContent('demonstration.labels.infoDesc') }}</AlertDescription>
        </Alert>
      </template>
    </DocsCompositions>

    <!-- ── Composições ─────────────────────────────────────────────── -->
    <DocsCompositions
      :use-when-label="tNav('common.useWhen')"
      component-slug="alert"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <Alert role="note">
          <Info aria-hidden="true" />
          <AlertTitle as="h4">
            {{ tContent('demonstration.labels.infoTitle') }}
          </AlertTitle>
          <AlertDescription>{{ tContent('demonstration.labels.infoDesc') }}</AlertDescription>
        </Alert>
      </template>
      <template #variant-preview-1>
        <Alert role="note">
          <Info aria-hidden="true" />
          <AlertTitle as="h4">
            {{ tContent('demonstration.labels.sessionTitle') }}
          </AlertTitle>
          <AlertDescription>{{ tContent('demonstration.labels.sessionDesc') }}</AlertDescription>
          <AlertAction>
            <Button
              size="sm"
              variant="default"
            >
              {{ tContent('demonstration.labels.saveNow') }}
            </Button>
          </AlertAction>
        </Alert>
      </template>
      <template #variant-preview-2>
        <Alert
          role="note"
          dismissible
        >
          <Info aria-hidden="true" />
          <AlertTitle as="h4">
            {{ tContent('demonstration.labels.sessionTitle') }}
          </AlertTitle>
          <AlertDescription>{{ tContent('demonstration.labels.sessionDesc') }}</AlertDescription>
          <AlertAction>
            <Button
              size="sm"
              variant="default"
            >
              {{ tContent('demonstration.labels.saveNow') }}
            </Button>
          </AlertAction>
        </Alert>
      </template>
    </DocsCompositions>

    <!-- ── Configurações (States) ──────────────────────────────────── -->
    <DocsStates
      :cols="{ state: tContent('states.cols.state'), trigger: toPlainText(tContent('states.cols.trigger')), behavior: toPlainText(tContent('states.cols.behavior'))}"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :tables="[
        { title: tContent('props.alertTitle'), cols: propCols, items: alertPropItems },
        { title: tContent('props.alertTitleTitle'), cols: propCols, items: alertTitlePropItems },
        { title: tContent('props.alertDescTitle'), cols: propCols, items: alertDescriptionPropItems },
        { title: tContent('props.alertActionTitle'), cols: propCols, items: alertActionPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :cols="{ token: tContent('tokens.table.token'), value: tContent('tokens.table.class'), description: tContent('tokens.table.part') }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="tContent('tokens.customizationCode')"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboardTitle')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated
      :items="relatedItems"
      component-slug="alert"
    />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes
      :items="noteItems"
      component-slug="alert"
    />

    <!-- ── Analytics ─────────────────────────────────────────────── -->
    <DocsAnalytics
      :cols="{ event: tContent('analytics.table.event'), trigger: toPlainText(tContent('analytics.table.trigger')), payload: tContent('analytics.table.payload') }"
      :items="analyticsItems"
    />

    <!-- ── Testes ─────────────────────────────────────────────────── -->
    <DocsTestes
      :functional="{
        title: tContent('testes.functional.title'),
        description: tContent('testes.functional.description'),
        cols: { action: tNav('common.userAction'), result: tNav('common.expectedResult'), priority: tNav('common.priority') },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        description: tContent('testes.accessibility.description'),
        cols: a11yCritCols,
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        description: tContent('testes.visual.description'),
        cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
