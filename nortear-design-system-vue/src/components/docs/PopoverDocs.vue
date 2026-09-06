<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import componentTranslations from '@shared/content/popover/translations.json';
import uiTranslations from '@/i18n/ui.json';

import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.vue';
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

const { t: tContent, locale } = useTranslation(componentTranslations);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
const screenReaderItems = computed(() =>
  Object.values(
    (componentTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale.value]?.accessibility?.screenReader ?? {},
  ),
);
const { t: tNav } = useTranslation(uiTranslations);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

function localPriority(raw: string): string {
  return priorityKeyMap[raw] ?? raw;
}

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'popover',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: 'Overlay', item: '/components/overlay' },
    { name: 'Popover' },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'popover',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Analytics — section view ─────────────────────────────────────────────────

// ─── Navigation groups ────────────────────────────────────────────────────────

const navGroups = computed(() => [
  {
    label: tContent('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tContent('nav.demonstration') },
      { id: 'anatomia',     label: tContent('nav.anatomy')       },
      { id: 'quando-usar',  label: tContent('nav.usage')         },
      { id: 'do-dont',      label: tContent('nav.doDont')        },
    ],
  },
  {
    label: tContent('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tContent('nav.import')   },
      { id: 'variantes',    label: tContent('nav.variants') },
      { id: 'composicoes',  label: tNav('nav.compositions') },
      { id: 'estados',      label: tContent('nav.states')   },
      { id: 'propriedades', label: tContent('nav.props')    },
      { id: 'tokens',       label: tContent('nav.tokens')   },
    ],
  },
  {
    label: tContent('nav.context'),
    sections: [
      { id: 'acessibilidade', label: tContent('nav.accessibility') },
      { id: 'relacionados',   label: tContent('nav.related')       },
      { id: 'notas',          label: tContent('nav.notes')         },
    ],
  },
  {
    label: tContent('nav.quality'),
    sections: [
      { id: 'analytics', label: tContent('nav.analytics') },
      { id: 'testes',    label: tContent('nav.testes')    },
    ],
  },
]);

const allSectionIds = computed(() => navGroups.value.flatMap((g) => g.sections.map((s) => s.id)));

const { activeId: activeSection } = useActiveSection(allSectionIds, (id) => {
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'popover',
    locale: locale.value,
  });
});

// ─── Analytics — demo events ──────────────────────────────────────────────────

/**
 * Abertura e fechamento de qualquer popover VIVO desta página.
 *
 * `triggerLabel` é um id estável em kebab-case (`demo`, `par1-do`, `with-title`,
 * …), fixado igual nas cinco stacks para que a série JUNTE no GA4, e nunca o
 * texto traduzido: o rótulo traduzido partiria o mesmo evento em três valores.
 * `location` diz de qual seção o exemplo saiu — a demonstração herda
 * `docs_demo`, e as demais seções se nomeiam, senão todo preview da página
 * chegaria ao relatório como se fosse a demonstração.
 */
function handlePopoverOpenChange(triggerLabel: string, location: string, open: boolean) {
  if (open) {
    track('popover_open', {
      component: 'popover',
      trigger_label: triggerLabel,
      location,
    });
  } else {
    // Sem `reason`: a reka-ui não publica o motivo do fechamento em
    // `@update:open`, e o campo é opcional no tipo. Cravar 'user' aqui seria
    // fingir um dado — o mesmo defeito que o react carregava e que esta rodada
    // removeu. Campo ausente é honesto; campo inventado contamina a série.
    track('popover_close', {
      component: 'popover',
      location,
    });
  }
}
// ─── Code strings ─────────────────────────────────────────────────────────────

// A cor sai de TOKEN do tema, nunca de hexadecimal: trocar de marca reescreve
// a paleta sem tocar no exemplo, e a amostra continua legível no tema escuro.
// Mesma paleta das cinco stories, mais `nds-ring-selected`: o anel da ESCOLHA,
// estático, que casa o próprio `aria-pressed` do botão — não há classe de
// estado a alternar. A lista guarda a CHAVE, não
// o rótulo: o nome acessível sai de `variants.compositions.colorPicker.<chave>`,
// então a prévia fala o idioma da página em vez de mostrar português em `en`.
const SWATCH_CLASSES = 'nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-ring-selected';
const swatches = [
  { key: 'primary',     className: 'nds-bg-primary'     },
  { key: 'secondary',   className: 'nds-bg-secondary'   },
  { key: 'success',     className: 'nds-bg-success'     },
  { key: 'warning',     className: 'nds-bg-warning'     },
  { key: 'info',        className: 'nds-bg-info'        },
  { key: 'destructive', className: 'nds-bg-destructive' },
];

// A seção de composições renderiza componente VIVO, e um seletor onde a escolha
// não acontece documenta um desenho, não um componente. Seleção única, anunciada
// por `aria-pressed` — o atributo de botão alternador que o `toggle` deste
// sistema já usa. Uma amostra nasce escolhida para o estado ser legível sem
// interação. O `label` do evento é a CHAVE da cor, nunca o texto traduzido, que
// dividiria uma série em três no GA4.
const selectedColor = ref('primary');
function selectColor(key: string) {
  selectedColor.value = key;
  track('option_select', {
    component: 'popover',
    field_name: 'label_color',
    value: key,
    label: key,
    location: 'docs_composicoes',
  });
}

const codeImportBasic = `import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "@/components/ui/popover";`;

const codeDefault = `<Popover>
  <PopoverTrigger as-child>
    <Button>Abrir popover</Button>
  </PopoverTrigger>
  <PopoverContent aria-label="Informações adicionais">
    <p>Conteúdo livre.</p>
  </PopoverContent>
</Popover>`;

const codeWithTitle = `<Popover>
  <PopoverTrigger as-child>
    <Button>Configurações</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Configurações de exibição</PopoverTitle>
      <PopoverDescription>Ajuste a aparência do conteúdo.</PopoverDescription>
    </PopoverHeader>
  </PopoverContent>
</Popover>`;

const codeForm = `<Popover>
  <PopoverTrigger as-child>
    <Button>Editar perfil</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Editar perfil</PopoverTitle>
    </PopoverHeader>
    <form class="nds-stack" data-spacing="sm">
      <Label for="name">Nome</Label>
      <Input id="name" />
      <Label for="email">Email</Label>
      <Input id="email" type="email" />
      <Button type="submit">Atualizar</Button>
    </form>
  </PopoverContent>
</Popover>`;

const interfaceCode = `// Popover (reka-ui)
interface PopoverRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
}

interface PopoverContentProps {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyStructure = computed(() => tContent('anatomy.structureCode'));

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
  tContent('anatomy.item5'),
  tContent('anatomy.item6'),
]);

const variantItems = computed(() => [
  { trackId: 'default', name: tContent('variants.items.default'),   description: stripHtml(tContent('variants.styles.default')),   code: codeDefault   },
  { trackId: 'withTitle', name: tContent('variants.items.withTitle'), description: stripHtml(tContent('variants.styles.withTitle')), code: codeWithTitle },
  { trackId: 'form', name: tContent('variants.items.form'),      description: stripHtml(tContent('variants.styles.form')),      code: codeForm      },
]);

const codeEditProfile = `<Popover>
  <PopoverTrigger as-child>
    <Button variant="outline">Editar perfil</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Dados do perfil</PopoverTitle>
      <PopoverDescription>As mudanças são salvas ao confirmar.</PopoverDescription>
    </PopoverHeader>
    <form class="nds-stack" data-spacing="md" @submit.prevent>
      <div class="nds-stack" data-spacing="xs">
        <Label for="pc-name">Nome</Label>
        <Input id="pc-name" model-value="Joana Silva" />
      </div>
      <div class="nds-stack" data-spacing="xs">
        <Label for="pc-email">Email</Label>
        <Input id="pc-email" type="email" model-value="joana@example.com" />
      </div>
      <Button type="submit" size="sm">Atualizar</Button>
    </form>
  </PopoverContent>
</Popover>`;

const codeTableFilter = `<Popover>
  <PopoverTrigger as-child>
    <Button variant="outline">Filtros</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Filtrar por status</PopoverTitle>
    </PopoverHeader>
    <div class="nds-stack" data-spacing="xs">
      <label class="nds-cluster nds-text-body" data-spacing="xs">
        <input type="checkbox" checked class="nds-icon-sm" /> Ativo
      </label>
      <label class="nds-cluster nds-text-body" data-spacing="xs">
        <input type="checkbox" class="nds-icon-sm" /> Pendente
      </label>
      <label class="nds-cluster nds-text-body" data-spacing="xs">
        <input type="checkbox" class="nds-icon-sm" /> Arquivado
      </label>
    </div>
    <div class="nds-cluster nds-pt-2" data-spacing="sm" data-justify="end">
      <Button variant="ghost" size="sm">Limpar</Button>
      <Button size="sm">Aplicar</Button>
    </div>
  </PopoverContent>
</Popover>`;

const codeColorPicker = `<script setup>
import { ref } from 'vue';

// A cor sai de token do tema, nunca de style inline.
const SWATCH_CLASSES = 'nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-ring-selected';
const swatches = [
  { key: 'primary',     name: 'Primária',   className: 'nds-bg-primary'     },
  { key: 'secondary',   name: 'Secundária', className: 'nds-bg-secondary'   },
  { key: 'success',     name: 'Sucesso',    className: 'nds-bg-success'     },
  { key: 'warning',     name: 'Atenção',    className: 'nds-bg-warning'     },
  { key: 'info',        name: 'Informação', className: 'nds-bg-info'        },
  { key: 'destructive', name: 'Destrutiva', className: 'nds-bg-destructive' },
];

// Seleção única: a escolhida se anuncia por \`aria-pressed\`, e uma nasce
// escolhida para o estado ser legível sem interação.
const selectedColor = ref('primary');
<\/script>

<Popover>
  <PopoverTrigger as-child>
    <Button variant="outline">Escolher cor da etiqueta</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Cor da etiqueta</PopoverTitle>
    </PopoverHeader>
    <!-- \`data-fixed\` é o que faz o grid respeitar as seis colunas: sem ele,
         \`data-cols\` cai no auto-fit e o painel estreito rende UMA coluna. -->
    <div class="nds-grid" data-cols="6" data-fixed data-spacing="xs">
      <button
        v-for="s in swatches"
        :key="s.key"
        type="button"
        :aria-label="s.name"
        :aria-pressed="selectedColor === s.key ? 'true' : 'false'"
        :class="[SWATCH_CLASSES, s.className]"
        @click="selectedColor = s.key"
      />
    </div>
  </PopoverContent>
</Popover>`;

const codeQuickSettings = `<Popover>
  <PopoverTrigger as-child>
    <Button variant="outline">Configurações</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Preferências rápidas</PopoverTitle>
    </PopoverHeader>
    <div class="nds-stack" data-spacing="sm">
      <div class="nds-cluster" data-spacing="sm" data-justify="between">
        <Label for="cfg-notifs">Notificações</Label>
        <input id="cfg-notifs" type="checkbox" checked class="nds-icon-sm" />
      </div>
      <div class="nds-cluster" data-spacing="sm" data-justify="between">
        <Label for="cfg-dark">Modo escuro</Label>
        <input id="cfg-dark" type="checkbox" class="nds-icon-sm" />
      </div>
      <div class="nds-cluster" data-spacing="sm" data-justify="between">
        <Label for="cfg-compact">Modo compacto</Label>
        <input id="cfg-compact" type="checkbox" class="nds-icon-sm" />
      </div>
    </div>
  </PopoverContent>
</Popover>`;

const compositionItems = computed(() => [
  { trackId: 'editProfile', name: tContent('variants.compositions.editProfile.name'),   description: tContent('variants.compositions.editProfile.description'),   useWhen: tContent('variants.compositions.editProfile.use'),   code: codeEditProfile   },
  { trackId: 'tableFilter', name: tContent('variants.compositions.tableFilter.name'),   description: tContent('variants.compositions.tableFilter.description'),   useWhen: tContent('variants.compositions.tableFilter.use'),   code: codeTableFilter   },
  { trackId: 'colorPicker', name: tContent('variants.compositions.colorPicker.name'),   description: tContent('variants.compositions.colorPicker.description'),   useWhen: tContent('variants.compositions.colorPicker.use'),   code: codeColorPicker   },
  { trackId: 'quickSettings', name: tContent('variants.compositions.quickSettings.name'), description: tContent('variants.compositions.quickSettings.description'), useWhen: tContent('variants.compositions.quickSettings.use'), code: codeQuickSettings },
]);

const stateItems = computed(() => [
  { label: tContent('states.closed.label'),        trigger: toPlainText(tContent('states.closed.trigger')),        behavior: toPlainText(tContent('states.closed.behavior')) },
  { label: tContent('states.open.label'),          trigger: toPlainText(tContent('states.open.trigger')),          behavior: toPlainText(tContent('states.open.behavior')) },
  { label: tContent('states.transitioning.label'), trigger: toPlainText(tContent('states.transitioning.trigger')), behavior: toPlainText(tContent('states.transitioning.behavior')) },
  { label: tContent('states.focused.label'),       trigger: toPlainText(tContent('states.focused.trigger')),       behavior: toPlainText(tContent('states.focused.behavior')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const popoverRootPropItems = computed(() => [
  { name: 'open',          type: tContent('props.table.open.type'),         defaultValue: tContent('props.table.open.default'),         required: tContent('props.table.open.required'),         description: toPlainText(tContent('props.table.open.description'))         },
  { name: 'defaultOpen',   type: tContent('props.table.defaultOpen.type'),  defaultValue: tContent('props.table.defaultOpen.default'),  required: tContent('props.table.defaultOpen.required'),  description: toPlainText(tContent('props.table.defaultOpen.description'))  },
  { name: 'onUpdate:open', type: tContent('props.table.onOpenChange.type'), defaultValue: tContent('props.table.onOpenChange.default'), required: tContent('props.table.onOpenChange.required'), description: toPlainText(tContent('props.table.onOpenChange.description')) },
  { name: 'modal',         type: tContent('props.table.modal.type'),        defaultValue: tContent('props.table.modal.default'),        required: tContent('props.table.modal.required'),        description: toPlainText(tContent('props.table.modal.description'))        },
]);

const popoverContentPropItems = computed(() => [
  { name: 'side',       type: tContent('props.table.side.type'),       defaultValue: tContent('props.table.side.default'),       required: tContent('props.table.side.required'),       description: toPlainText(tContent('props.table.side.description'))       },
  { name: 'align',      type: tContent('props.table.align.type'),      defaultValue: tContent('props.table.align.default'),      required: tContent('props.table.align.required'),      description: toPlainText(tContent('props.table.align.description'))      },
  { name: 'sideOffset', type: tContent('props.table.sideOffset.type'), defaultValue: tContent('props.table.sideOffset.default'), required: tContent('props.table.sideOffset.required'), description: toPlainText(tContent('props.table.sideOffset.description')) },
]);

const tokenRows = computed(() => [
  { token: '--popover',            value: tContent('tokens.table.popover.class'),           description: tContent('tokens.table.popover.part')           },
  { token: '--popover-foreground', value: tContent('tokens.table.popoverForeground.class'), description: tContent('tokens.table.popoverForeground.part') },
  { token: '--muted-foreground',   value: tContent('tokens.table.mutedForeground.class'),   description: tContent('tokens.table.mutedForeground.part')   },
  { token: '--border',             value: tContent('tokens.table.border.class'),            description: tContent('tokens.table.border.part')            },
  { token: '--elevation-md',       value: tContent('tokens.table.shadow.class'),            description: tContent('tokens.table.shadow.part')            },
  { token: '--ring',               value: tContent('tokens.table.ring.class'),              description: tContent('tokens.table.ring.part')              },
]);

// Os itens da lista mais o bloco `aria`: o container tem uma lista só, e deixar
// os quatro atributos de fora perde a metade verificável da seção.
const accessibilityItems = computed(() => [
  tContent('accessibility.items.item1'),
  tContent('accessibility.items.item2'),
  tContent('accessibility.items.item3'),
  tContent('accessibility.items.item4'),
  tContent('accessibility.items.item5'),
  tContent('accessibility.items.item6'),
  tContent('accessibility.aria.role'),
  tContent('accessibility.aria.labelledBy'),
  tContent('accessibility.aria.describedBy'),
  tContent('accessibility.aria.expanded'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',       description: toPlainText(tContent('accessibility.keyboard.tab'))      },
  { key: 'Shift+Tab', description: toPlainText(tContent('accessibility.keyboard.shiftTab')) },
  { key: 'Esc',       description: toPlainText(tContent('accessibility.keyboard.escape'))   },
  { key: 'Enter',     description: toPlainText(tContent('accessibility.keyboard.enter'))    },
  { key: 'Space',     description: toPlainText(tContent('accessibility.keyboard.space'))    },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.tooltip.name'),      description: toPlainText(tContent('related.items.tooltip.description')),      path: '?path=/docs/components-overlay-tooltip--docs'      },
  { name: tContent('related.items.dropdownMenu.name'), description: toPlainText(tContent('related.items.dropdownMenu.description')), path: '?path=/docs/components-overlay-dropdownmenu--docs' },
  { name: tContent('related.items.dialog.name'),       description: toPlainText(tContent('related.items.dialog.description')),       path: '?path=/docs/components-overlay-dialog--docs'       },
  { name: tContent('related.items.hoverCard.name'),    description: toPlainText(tContent('related.items.hoverCard.description')),    path: '?path=/docs/components-overlay-hovercard--docs'    },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: 'popover_open',  trigger: stripHtml(tContent('analytics.table.popover_open.trigger')),  payload: tContent('analytics.table.popover_open.payload')  },
  { event: 'popover_close', trigger: stripHtml(tContent('analytics.table.popover_close.trigger')), payload: tContent('analytics.table.popover_close.payload') },
]);

const functionalTestItems = computed(() => [1, 2, 3, 4].map((i) => ({
  action: toPlainText(tContent(`testes.functional.item${i}.action`)),
  result: toPlainText(tContent(`testes.functional.item${i}.result`)),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1'), level: 'AA',     how: 'axe-core'           },
  { criterion: tContent('testes.accessibility.item2'), level: '1.4.3',  how: 'Contrast checker'   },
  { criterion: tContent('testes.accessibility.item3'), level: '2.4.7',  how: 'Keyboard test'      },
  { criterion: tContent('testes.accessibility.item4'), level: '4.1.2',  how: 'DevTools a11y tree' },
  { criterion: tContent('testes.accessibility.item5'), level: '4.1.2',  how: 'DevTools a11y tree' },
]);

const visualTestItems = computed(() => [1, 2, 3, 4].map((i) => ({
  story: tContent(`testes.visual.item${i}.story`),
  priority: localPriority(tContent(`testes.visual.item${i}.priority`)),
})));

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="popover"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────── -->
    <!--
      UM exemplo, o mesmo do Playground da story: as outras duas variações não
      somem da página — elas SÃO as variantes `default` e `form`, que têm seção
      própria logo abaixo. Repeti-las aqui fazia a demonstração competir com a
      seção que existe para isso.
    -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div
        class="nds-cluster"
        data-justify="center"
        data-spacing="sm"
      >
        <Popover @update:open="(open: boolean) => handlePopoverOpenChange('demo', 'docs_demo', open)">
          <PopoverTrigger as-child>
            <Button variant="outline">
              {{ tContent('demonstration.labels.trigger') }}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center">
            <PopoverHeader>
              <PopoverTitle>
                {{ tContent('demonstration.labels.title') }}
              </PopoverTitle>
              <PopoverDescription>
                {{ tContent('demonstration.labels.description') }}
              </PopoverDescription>
            </PopoverHeader>
            <div
              class="nds-cluster"
              data-spacing="sm"
              data-justify="end"
            >
              <Button
                variant="ghost"
                size="sm"
              >
                {{ tContent('demonstration.labels.cancel') }}
              </Button>
              <Button size="sm">
                {{ tContent('demonstration.labels.save') }}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </DocsDemonstration>


    <!-- ── Anatomia ─────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="anatomyStructure"
    />

    <!-- ── Quando Usar ──────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="{
        title: tContent('usage.guidelines.title'),
        items: [
          stripHtml(tContent('usage.guidelines.item1')),
          stripHtml(tContent('usage.guidelines.item2')),
          stripHtml(tContent('usage.guidelines.item3')),
          stripHtml(tContent('usage.guidelines.item4')),
        ],
      }"
      :scenarios="{
        title: tContent('usage.scenarios.title'),
        cols: {
          scenario: tContent('usage.scenarios.cols.scenario'),
          use: tContent('usage.scenarios.cols.use'),
          alternative: tContent('usage.scenarios.cols.alternative'),
        },
        items: [
          { s: tContent('usage.scenarios.item1.s'), u: tContent('usage.scenarios.item1.u'), a: tContent('usage.scenarios.item1.a') },
          { s: tContent('usage.scenarios.item2.s'), u: tContent('usage.scenarios.item2.u'), a: tContent('usage.scenarios.item2.a') },
          { s: tContent('usage.scenarios.item3.s'), u: tContent('usage.scenarios.item3.u'), a: tContent('usage.scenarios.item3.a') },
          { s: tContent('usage.scenarios.item4.s'), u: tContent('usage.scenarios.item4.u'), a: tContent('usage.scenarios.item4.a') },
          { s: tContent('usage.scenarios.item5.s'), u: tContent('usage.scenarios.item5.u'), a: tContent('usage.scenarios.item5.a') },
          { s: tContent('usage.scenarios.item6.s'), u: tContent('usage.scenarios.item6.u'), a: tContent('usage.scenarios.item6.a') },
        ],
      }"
      :ux-writing="{
        title: tContent('usage.uxWriting.title'),
        cols: {
          element: tContent('usage.uxWriting.table.element'),
          rules: tContent('usage.uxWriting.table.rules'),
          do: tContent('usage.uxWriting.table.correct'),
          dont: tContent('usage.uxWriting.table.avoid'),
        },
        items: [
          { element: tContent('usage.uxWriting.table.title.name'), rules: tContent('usage.uxWriting.table.title.format'), do: tContent('usage.uxWriting.table.title.good'), dont: tContent('usage.uxWriting.table.title.bad') },
          { element: tContent('usage.uxWriting.table.description.name'), rules: tContent('usage.uxWriting.table.description.format'), do: tContent('usage.uxWriting.table.description.good'), dont: tContent('usage.uxWriting.table.description.bad') },
          { element: tContent('usage.uxWriting.table.trigger.name'), rules: tContent('usage.uxWriting.table.trigger.format'), do: tContent('usage.uxWriting.table.trigger.good'), dont: tContent('usage.uxWriting.table.trigger.bad') },
        ],
      }"
      :do="{
        title: tContent('usage.do.title'),
        items: [
          tContent('usage.do.item1'),
          tContent('usage.do.item2'),
          tContent('usage.do.item3'),
          tContent('usage.do.item4'),
        ],
      }"
      :dont="{
        title: tContent('usage.dont.title'),
        items: [
          stripHtml(tContent('usage.dont.item1')),
          stripHtml(tContent('usage.dont.item2')),
          stripHtml(tContent('usage.dont.item3')),
          stripHtml(tContent('usage.dont.item4')),
        ],
      }"
    />

    <!-- ── Do & Don't ───────────────────────────────────────────── -->
    <!--
      Os quatro previews são popovers VIVOS, nascendo fechados — e o lado
      "evite" carrega o defeito DE VERDADE (painel sem `PopoverTitle`, gatilho
      sem objeto), porque é ele a lição. Descrever o erro em texto estático
      ensina a frase e esconde o efeito; abrir o painel sem título mostra ao
      leitor o que sobra para quem usa leitor de tela. Os rótulos saem do
      conteúdo compartilhado, nunca de literal em português cravado aqui.
    -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
      ]"
    >
      <template #do-preview-0>
        <Popover @update:open="(open: boolean) => handlePopoverOpenChange('par1-do', 'docs_do_dont', open)">
          <PopoverTrigger as-child>
            <Button variant="outline">
              {{ tContent('demonstration.labels.trigger') }}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center">
            <PopoverHeader>
              <PopoverTitle>
                {{ tContent('demonstration.labels.title') }}
              </PopoverTitle>
              <PopoverDescription>
                {{ tContent('demonstration.labels.description') }}
              </PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </template>
      <template #dont-preview-0>
        <!--
          Sem `PopoverTitle`: o painel cai no nome de reserva herdado do
          gatilho, que mantém o axe verde e ainda assim devolve ao leitor o
          rótulo do botão em vez do assunto do painel — exatamente o que a
          legenda ao lado critica.
        -->
        <Popover @update:open="(open: boolean) => handlePopoverOpenChange('par1-dont', 'docs_do_dont', open)">
          <PopoverTrigger as-child>
            <Button variant="outline">
              {{ tContent('demonstration.labels.trigger') }}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center">
            <p>
              {{ tContent('doDont.pair1.dontBody') }}
            </p>
          </PopoverContent>
        </Popover>
      </template>
      <template #do-preview-1>
        <Popover @update:open="(open: boolean) => handlePopoverOpenChange('par2-do', 'docs_do_dont', open)">
          <PopoverTrigger as-child>
            <Button variant="outline">
              {{ tContent('demonstration.labels.form.trigger') }}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start">
            <PopoverHeader>
              <PopoverTitle>
                {{ tContent('demonstration.labels.form.trigger') }}
              </PopoverTitle>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </template>
      <template #dont-preview-1>
        <!-- Mesmo painel do lado bom: o que muda é só o rótulo do gatilho. -->
        <Popover @update:open="(open: boolean) => handlePopoverOpenChange('par2-dont', 'docs_do_dont', open)">
          <PopoverTrigger as-child>
            <Button variant="outline">
              {{ tContent('doDont.pair2.dontTrigger') }}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start">
            <PopoverHeader>
              <PopoverTitle>
                {{ tContent('demonstration.labels.form.trigger') }}
              </PopoverTitle>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ────────────────────────────────────────────── -->
    <DocsVariants
      :title="tContent('variants.title')"
      :items="variantItems"
    >
      <!--
        As três variantes são componentes VIVOS, nascendo fechadas. O que havia
        aqui era imitação estática — texto monoespaçado nomeando as peças —, e
        imitação não mostra posicionamento, foco nem dispensa: só o nome do que
        deveria estar acontecendo.
      -->
      <template #variant-preview-0>
        <Popover @update:open="(open: boolean) => handlePopoverOpenChange('default', 'docs_variantes', open)">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              size="sm"
            >
              {{ tContent('demonstration.labels.trigger') }}
            </Button>
          </PopoverTrigger>
          <!-- Painel de conteúdo LIVRE: sem título, nomeado por `aria-label`.
               Sem ele o painel herdaria o rótulo do gatilho, que é o defeito
               que o anti-exemplo do Do & Don't existe para mostrar. -->
          <PopoverContent
            align="center"
            :aria-label="tContent('variants.panelLabels.default')"
          >
            <p>
              {{ tContent('demonstration.labels.description') }}
            </p>
          </PopoverContent>
        </Popover>
      </template>
      <template #variant-preview-1>
        <Popover @update:open="(open: boolean) => handlePopoverOpenChange('with-title', 'docs_variantes', open)">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              size="sm"
            >
              {{ tContent('demonstration.labels.title') }}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center">
            <PopoverHeader>
              <PopoverTitle>
                {{ tContent('demonstration.labels.title') }}
              </PopoverTitle>
              <PopoverDescription>
                {{ tContent('demonstration.labels.description') }}
              </PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </template>
      <template #variant-preview-2>
        <Popover @update:open="(open: boolean) => handlePopoverOpenChange('form', 'docs_variantes', open)">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              size="sm"
            >
              {{ tContent('demonstration.labels.form.trigger') }}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center">
            <PopoverHeader>
              <PopoverTitle>
                {{ tContent('demonstration.labels.form.trigger') }}
              </PopoverTitle>
            </PopoverHeader>
            <form
              class="nds-stack"
              data-spacing="md"
              @submit.prevent
            >
              <div
                class="nds-stack"
                data-spacing="xs"
              >
                <Label
                  for="pv-name-vue"
                  class="nds-text-caption"
                >{{ tContent('demonstration.labels.form.name') }}</Label>
                <Input id="pv-name-vue" />
              </div>
              <div
                class="nds-stack"
                data-spacing="xs"
              >
                <Label
                  for="pv-email-vue"
                  class="nds-text-caption"
                >{{ tContent('demonstration.labels.form.email') }}</Label>
                <Input
                  id="pv-email-vue"
                  type="email"
                />
              </div>
              <div
                class="nds-cluster"
                data-spacing="sm"
                data-justify="end"
              >
                <Button
                  variant="ghost"
                  size="sm"
                >
                  {{ tContent('demonstration.labels.cancel') }}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                >
                  {{ tContent('demonstration.labels.form.submit') }}
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      </template>
    </DocsVariants>

    <!-- ── Composições ──────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="popover"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-16"
        >
          <Popover @update:open="(open: boolean) => handlePopoverOpenChange('edit-profile', 'docs_composicoes', open)">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                size="sm"
              >
                {{ tContent('demonstration.labels.form.trigger') }}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
            >
              <PopoverHeader>
                <PopoverTitle>{{ tContent('demonstration.labels.form.trigger') }}</PopoverTitle>
              </PopoverHeader>
              <form
                class="nds-stack"
                data-spacing="md"
                @submit.prevent
              >
                <div
                  class="nds-stack"
                  data-spacing="xs"
                >
                  <Label
                    for="pc-name-vue"
                    class="nds-text-caption"
                  >{{ tContent('demonstration.labels.form.name') }}</Label>
                  <Input
                    id="pc-name-vue"
                    model-value="Joana Silva"
                  />
                </div>
                <div
                  class="nds-stack"
                  data-spacing="xs"
                >
                  <Label
                    for="pc-email-vue"
                    class="nds-text-caption"
                  >{{ tContent('demonstration.labels.form.email') }}</Label>
                  <Input
                    id="pc-email-vue"
                    type="email"
                    model-value="joana@example.com"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                >
                  {{ tContent('demonstration.labels.form.submit') }}
                </Button>
              </form>
            </PopoverContent>
          </Popover>
        </div>
      </template>
      <template #variant-preview-1>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-16"
        >
          <Popover @update:open="(open: boolean) => handlePopoverOpenChange('table-filter', 'docs_composicoes', open)">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                size="sm"
              >
                {{ tContent('variants.compositions.tableFilter.trigger') }}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
            >
              <PopoverHeader>
                <PopoverTitle>{{ tContent('variants.compositions.tableFilter.title') }}</PopoverTitle>
              </PopoverHeader>
              <div
                class="nds-stack"
                data-spacing="xs"
              >
                <label
                  class="nds-cluster nds-text-body"
                  data-spacing="xs"
                >
                  <input
                    type="checkbox"
                    checked
                    class="nds-icon-sm"
                  > {{ tContent('variants.compositions.tableFilter.active') }}
                </label>
                <label
                  class="nds-cluster nds-text-body"
                  data-spacing="xs"
                >
                  <input
                    type="checkbox"
                    class="nds-icon-sm"
                  > {{ tContent('variants.compositions.tableFilter.pending') }}
                </label>
                <label
                  class="nds-cluster nds-text-body"
                  data-spacing="xs"
                >
                  <input
                    type="checkbox"
                    class="nds-icon-sm"
                  > {{ tContent('variants.compositions.tableFilter.archived') }}
                </label>
              </div>
              <div
                class="nds-cluster nds-pt-2"
                data-spacing="sm"
                data-justify="end"
              >
                <Button
                  variant="ghost"
                  size="sm"
                >
                  {{ tContent('variants.compositions.tableFilter.clear') }}
                </Button>
                <Button size="sm">
                  {{ tContent('variants.compositions.tableFilter.apply') }}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </template>
      <template #variant-preview-2>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-16"
        >
          <Popover @update:open="(open: boolean) => handlePopoverOpenChange('color-picker', 'docs_composicoes', open)">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                size="sm"
              >
                {{ tContent('variants.compositions.colorPicker.trigger') }}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
            >
              <PopoverHeader>
                <PopoverTitle>{{ tContent('variants.compositions.colorPicker.title') }}</PopoverTitle>
              </PopoverHeader>
              <div
                class="nds-grid"
                data-cols="6"
                data-fixed
                data-spacing="xs"
              >
                <button
                  v-for="s in swatches"
                  :key="s.key"
                  type="button"
                  :aria-label="tContent(`variants.compositions.colorPicker.${s.key}`)"
                  :aria-pressed="selectedColor === s.key ? 'true' : 'false'"
                  :class="[SWATCH_CLASSES, s.className]"
                  @click="selectColor(s.key)"
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </template>
      <template #variant-preview-3>
        <div
          style="contain: layout"
          class="nds-w-full nds-min-h-16"
        >
          <Popover @update:open="(open: boolean) => handlePopoverOpenChange('quick-settings', 'docs_composicoes', open)">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                size="sm"
              >
                {{ tContent('variants.compositions.quickSettings.trigger') }}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
            >
              <PopoverHeader>
                <PopoverTitle>{{ tContent('variants.compositions.quickSettings.title') }}</PopoverTitle>
              </PopoverHeader>
              <div
                class="nds-stack"
                data-spacing="sm"
              >
                <div
                  class="nds-cluster"
                  data-spacing="sm"
                  data-justify="between"
                >
                  <Label for="cfg-notifs-vue">{{ tContent('variants.compositions.quickSettings.notifications') }}</Label>
                  <input
                    id="cfg-notifs-vue"
                    type="checkbox"
                    checked
                    class="nds-icon-sm"
                  >
                </div>
                <div
                  class="nds-cluster"
                  data-spacing="sm"
                  data-justify="between"
                >
                  <Label for="cfg-dark-vue">{{ tContent('variants.compositions.quickSettings.darkMode') }}</Label>
                  <input
                    id="cfg-dark-vue"
                    type="checkbox"
                    class="nds-icon-sm"
                  >
                </div>
                <div
                  class="nds-cluster"
                  data-spacing="sm"
                  data-justify="between"
                >
                  <Label for="cfg-compact-vue">{{ tContent('variants.compositions.quickSettings.compactMode') }}</Label>
                  <input
                    id="cfg-compact-vue"
                    type="checkbox"
                    class="nds-icon-sm"
                  >
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </template>
    </DocsCompositions>

    <!-- ── Estados ──────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('states.cols.state'),
        trigger: toPlainText(tContent('states.cols.trigger')),
        behavior: toPlainText(tContent('states.cols.behavior')),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: 'Popover', cols: propCols, items: popoverRootPropItems },
        { title: 'PopoverContent', cols: propCols, items: popoverContentPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibilityCode')"
    />

    <!-- ── Tokens ───────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{
        token: tContent('tokens.table.token'),
        value: tContent('tokens.table.class'),
        description: tContent('tokens.table.part'),
      }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="tContent('tokens.customizationCode')"
    />

    <!-- ── Acessibilidade ───────────────────────────────────────── -->
    <DocsAccessibility
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboard.title')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ─────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
    />

    <!-- ── Notas ────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
    />

    <!-- ── Analytics ────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: toPlainText(tContent('analytics.table.trigger')),
        payload: tContent('analytics.table.payload'),
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ───────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
      :functional="{
        title: tContent('testes.functional.title'),
        cols: { action: tNav('common.userAction'), result: tNav('common.expectedResult'), priority: tNav('common.priority') },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        cols: a11yCritCols,
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
