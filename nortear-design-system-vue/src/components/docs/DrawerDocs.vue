<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import componentTranslations from '@shared/content/drawer/translations.json';
import uiTranslations from '@/i18n/ui.json';

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

const { t: tContent, locale } = useTranslation(componentTranslations);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
// O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (componentTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale.value]?.accessibility?.screenReader ?? {},
  )
    .filter(([key]) => key !== 'title')
    .map(([, value]) => value),
);
const { t: tNav } = useTranslation(uiTranslations);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

// A prioridade vem do dicionário de navegação, não de literal em pt-BR: com o
// mapa cravado, "Alta/Média/Baixa" apareciam também em `en` e `es`.
function localPriority(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

/**
 * Varre `base.item1`, `base.item2`, … enquanto existirem no conteúdo.
 *
 * Citar índice por índice trava a lista no tamanho de hoje: o conteúdo
 * compartilhado ganha um item e ele simplesmente não existe para quem lê — sem
 * erro, sem aviso, nos três idiomas de uma vez. Foi o que aconteceu aqui com os
 * dois últimos critérios funcionais (o arraste que dispensa e o arraste curto
 * que volta ao repouso) e com o oitavo de acessibilidade, o da WCAG 2.5.7.
 *
 * Trocar 7 por 9 não resolveria: o total cravado É o defeito, e ele volta no
 * item seguinte.
 */
function stringsFromDict(base: string, prefix = 'item'): string[] {
  const out: string[] = [];
  for (let i = 1; ; i++) {
    const value = tContent(`${base}.${prefix}${i}`, '');
    if (!value) break;
    out.push(value);
  }
  return out;
}

/**
 * A mesma varredura para a lista cujo item é um OBJETO — cenário, critério
 * funcional, story de regressão visual. O primeiro campo é quem decide se o
 * item existe, e os demais acompanham.
 */
function entriesFromDict<K extends string>(
  base: string,
  fields: readonly K[],
): Array<Record<K, string>> {
  const out: Array<Record<K, string>> = [];
  for (let i = 1; ; i++) {
    if (!tContent(`${base}.item${i}.${fields[0]}`, '')) break;
    out.push(
      Object.fromEntries(
        fields.map((field) => [field, tContent(`${base}.item${i}.${field}`, '')]),
      ) as Record<K, string>,
    );
  }
  return out;
}

/**
 * Nível WCAG e ferramenta de cada critério de acessibilidade, por índice.
 * Ficam aqui, e não no conteúdo compartilhado, porque são IDENTIFICADORES
 * (número de critério, nome do verificador) e identificador não se traduz.
 * Item novo que chegue além da lista cai no par padrão em vez de sumir.
 */
const A11Y_TEST_LEVELS = ['AA', '4.1.2', '1.3.1', '2.1.1', '2.4.3', '1.4.3', '2.1.1', '2.5.7'];
const A11Y_TEST_HOW = [
  'axe-core',
  'DevTools a11y tree',
  'DevTools a11y tree',
  'Keyboard test',
  'Keyboard test',
  'Contrast checker',
  'Keyboard test',
  'Keyboard test',
];

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'drawer',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: 'Disclosure', item: '/components/disclosure' },
    { name: 'Drawer' },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'drawer',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Analytics — section view ─────────────────────────────────────────────────

// ─── Analytics — painéis vivos ────────────────────────────────────────────────

// `label` leva a DIREÇÃO (valor estável), nunca o título: título é texto
// traduzido e partiria a mesma série em três valores no GA4.
//
// `location` vem de QUEM CHAMA, nunca de constante no topo do arquivo: ele
// responde de ONDE saiu a interação, e cravá-lo em 'docs_demo' faria a página
// inteira responder a mesma coisa. Do & Dont, Variantes e Composições
// renderizam painéis VIVOS — abrir um ali é tão real quanto na demonstração.
// Vocabulário em `docs/shared/guidelines/07-analytics.md`.
//
// O `update:open` da lib avisa QUE o painel fechou, nunca POR QUÊ — e o payload
// de `drawer_close` promete `reason`, com o vocabulário fechado do design
// system. Cada caminho que a lib anuncia por evento próprio deixa o motivo
// anotado abaixo antes de o fechamento chegar; o que sobra é a saída do rodapé,
// que é o default.
//
// Uma variável para a página inteira basta: os painéis são modais, e nunca há
// dois abertos ao mesmo tempo.
type DrawerCloseReason = 'escape' | 'overlay' | 'close-button' | 'api';
let pendingCloseReason: DrawerCloseReason | null = null;

function markCloseReason(reason: DrawerCloseReason) {
  pendingCloseReason = reason;
}

// Arrastar o painel para fora fecha por `overlay` — para quem usa, é a mesma
// decisão de "saí sem decidir nada" do clique no véu.
//
// O motivo é anotado no ARRASTE, e não na soltura, porque a lib fecha antes de
// anunciar a soltura (`closeDrawer(); emit('release', false)`): anotado ali, o
// `update:open` já teria passado. A soltura que MANTÉM o painel aberto (arraste
// curto, que volta ao repouso) limpa a anotação — sem isso, o próximo
// fechamento pelo botão herdaria um motivo que não é o dele.
function onDragRelease(open: boolean) {
  if (open) pendingCloseReason = null;
}

function trackDrawer(location: string, direction: DrawerDirection, open: boolean) {
  if (open) {
    pendingCloseReason = null;
    track('drawer_open', { component: 'drawer', label: direction, location });
    return;
  }
  track('drawer_close', {
    component: 'drawer',
    label: direction,
    reason: pendingCloseReason ?? 'close-button',
    location,
  });
  pendingCloseReason = null;
}

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
    component_name: 'drawer',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";`;

// ─── Exemplo por direção — uma fonte só para a prévia e para o snippet ───────
//
// As duas superfícies leem as MESMAS chaves: o rótulo curto nomeia o painel, o
// rótulo longo da demonstração o descreve, e a saída do rodapé usa o verbo de
// cancelamento que o próprio UX writing desta página prescreve. Antes o snippet
// de Top e de Left saía do corpo de `codeBottom` ("Editar perfil", "Salvar") e a
// prévia mostrava outro painel: nenhum dos dois era o outro.
type DrawerDirection = 'bottom' | 'top' | 'left' | 'right';

// As chaves de rótulo ficam ESCRITAS por extenso, e não montadas em template: o
// guarda de divergência da demonstração procura `demonstration.labels.<dir>` no
// texto do arquivo, e a chave interpolada o deixaria cego.
const directionLabelKeys = {
  bottom: 'demonstration.labels.bottom',
  top: 'demonstration.labels.top',
  left: 'demonstration.labels.left',
  right: 'demonstration.labels.right',
} as const;

function directionExample(dir: DrawerDirection) {
  return {
    title: tContent(`variants.items.${dir}`),
    description: tContent(directionLabelKeys[dir]),
    // Falta chave própria para o corpo do painel de exemplo (o `sheet` tem
    // `demonstration.labels.body`); até ela existir, o corpo empresta a
    // descrição do componente em vez de cravar literal em pt-BR.
    body: tContent('description'),
    close: tContent('usage.uxWriting.table.close.good'),
  };
}

function directionCode(dir: DrawerDirection): string {
  const ex = directionExample(dir);
  return `<Drawer direction="${dir}">
  <DrawerTrigger as-child>
    <Button variant="outline">${ex.title}</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>${ex.title}</DrawerTitle>
      <DrawerDescription>${ex.description}</DrawerDescription>
    </DrawerHeader>
    <DrawerBody class="nds-text-body nds-text-muted-foreground">
      ${ex.body}
    </DrawerBody>
    <DrawerFooter>
      <DrawerClose as-child>
        <Button variant="outline">${ex.close}</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`;
}

// `shouldScaleBackground` saiu da interface publicada: a `props.table`
// compartilhada não a conhece, e o wrapper desta stack deixou de ligá-la — ver
// o comentário no `Drawer.vue`.
const interfaceCode = `// Drawer (root) — props vindas de vaul-vue
interface DrawerRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  direction?: 'bottom' | 'top' | 'left' | 'right';
  modal?: boolean;
  dismissible?: boolean;
}

// DrawerContent — class + slot
interface DrawerContentProps { class?: string }

// DrawerTitle / DrawerDescription
interface DrawerTitleProps       { class?: string }
interface DrawerDescriptionProps { class?: string }`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyStructure = computed(() => tContent('anatomy.structureCode'));

const anatomyItems = computed(() => stringsFromDict('anatomy'));

const directionsExamples = computed<Record<DrawerDirection, ReturnType<typeof directionExample>>>(() => ({
  bottom: directionExample('bottom'),
  top: directionExample('top'),
  left: directionExample('left'),
  right: directionExample('right'),
}));

// A demonstração mostrava só a direção de baixo — as outras três, que são o que
// distingue este componente, ficavam de fora da primeira dobra da página.
const demonstrationDirections: DrawerDirection[] = ['bottom', 'right', 'left', 'top'];

const variantItems = computed(() => [
  { trackId: 'bottom', name: tContent('variants.items.bottom'), description: stripHtml(tContent('variants.styles.bottom')), code: directionCode('bottom') },
  { trackId: 'top', name: tContent('variants.items.top'),    description: stripHtml(tContent('variants.styles.top')),    code: directionCode('top') },
  { trackId: 'left', name: tContent('variants.items.left'),   description: stripHtml(tContent('variants.styles.left')),   code: directionCode('left') },
  { trackId: 'right', name: tContent('variants.items.right'),  description: stripHtml(tContent('variants.styles.right')),  code: directionCode('right') },
  {
    trackId: 'withScroll',
    name: tContent('variants.items.withScroll.name'),
    description: tContent('variants.items.withScroll.description'),
    useWhen: tContent('variants.items.withScroll.use'),
    code: codeCompWithScroll,
  },
]);

const codeCompWithForm = `<Drawer>
  <DrawerTrigger as-child>
    <Button variant="outline">Editar perfil</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Editar perfil</DrawerTitle>
      <DrawerDescription>Atualize seus dados.</DrawerDescription>
    </DrawerHeader>
    <form id="drawer-form" class="nds-stack nds-px-4" data-spacing="sm" @submit.prevent>
      <Label class="nds-stack nds-text-body" data-spacing="xs">
        Nome
        <Input default-value="Maria Souza" />
      </Label>
      <Label class="nds-stack nds-text-body" data-spacing="xs">
        E-mail
        <Input type="email" default-value="maria@exemplo.com" />
      </Label>
    </form>
    <!-- O rodapé é irmão do formulário: é o par id ↔ form que religa a ação
         primária. Sem ele, com dois campos o Enter não dispara nada. -->
    <DrawerFooter>
      <DrawerClose as-child>
        <Button type="button" variant="outline">Cancelar</Button>
      </DrawerClose>
      <Button type="submit" form="drawer-form">Salvar alterações</Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`;

// Os rótulos da prévia saem de `demonstration.labels`: gatilho, título e ação
// destrutiva são o mesmo verbo (`destroy`), e o aviso é `destroyMessage`. É o
// conjunto que as cinco docs pages leem — o guarda
// `demonstration_labels_divergent` compara exatamente as chaves usadas na
// página. A story `WithConfirmation` segue com "Remover anexo": é ela a
// superfície testada, e o texto dela é o que o `drawer.source.ts` publica no
// painel Code.
//
// Este snippet NÃO interpola tradução: é o código que a pessoa copia, e uma
// chave no lugar da string ensinaria a coisa errada. O que ele faz é repetir,
// literal, o mesmo texto que a prévia ao lado mostra em pt-BR.
const codeCompWithConfirmation = `<Drawer>
  <DrawerTrigger as-child>
    <Button variant="outline">Excluir</Button>
  </DrawerTrigger>
  <!-- A decisão É a tela: o foco entra na saída segura, e não no painel. -->
  <DrawerContent initial-focus="close">
    <DrawerHeader>
      <DrawerTitle>Excluir</DrawerTitle>
      <DrawerDescription>
        Você pode desfazer esta ação nos próximos 30 dias.
      </DrawerDescription>
    </DrawerHeader>
    <DrawerFooter>
      <DrawerClose as-child>
        <Button variant="outline">Cancelar</Button>
      </DrawerClose>
      <Button variant="destructive">Excluir</Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`;

const codeCompWithScroll = `<Drawer>
  <DrawerTrigger as-child>
    <Button variant="outline">Ler termos</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Termos de uso</DrawerTitle>
      <DrawerDescription>Leia atentamente antes de aceitar.</DrawerDescription>
    </DrawerHeader>
    <DrawerBody
      class="nds-stack nds-text-body nds-text-muted-foreground"
      data-spacing="sm"
      aria-label="Termos de uso"
    >
      <p v-for="i in 12" :key="i">{{ i }}. Termos longos, para o corpo do painel passar da altura visível e rolar sozinho.</p>
    </DrawerBody>
    <DrawerFooter>
      <DrawerClose as-child>
        <Button variant="outline">Cancelar</Button>
      </DrawerClose>
      <Button>Aceitar termos</Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`;

const compositionItems = computed(() => [
  {
    trackId: 'withForm',
    name: tContent('variants.compositions.withForm.name'),
    description: tContent('variants.compositions.withForm.description'),
    useWhen: tContent('variants.compositions.withForm.use'),
    code: codeCompWithForm,
  },
  {
    trackId: 'withConfirmation',
    name: tContent('variants.compositions.withConfirmation.name'),
    description: tContent('variants.compositions.withConfirmation.description'),
    useWhen: tContent('variants.compositions.withConfirmation.use'),
    code: codeCompWithConfirmation,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.closed.label'),     trigger: toPlainText(tContent('states.closed.trigger')),     behavior: toPlainText(tContent('states.closed.behavior')) },
  { label: tContent('states.open.label'),       trigger: toPlainText(tContent('states.open.trigger')),       behavior: toPlainText(tContent('states.open.behavior')) },
  { label: tContent('states.controlled.label'), trigger: toPlainText(tContent('states.controlled.trigger')), behavior: toPlainText(tContent('states.controlled.behavior')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const drawerPropItems = computed(() => [
  { name: 'open',          type: tContent('props.table.open.type'),         defaultValue: tContent('props.table.open.default'),         required: tContent('props.table.open.required'),         description: toPlainText(tContent('props.table.open.description'))         },
  { name: 'onUpdate:open', type: tContent('props.table.onOpenChange.type'), defaultValue: tContent('props.table.onOpenChange.default'), required: tContent('props.table.onOpenChange.required'), description: toPlainText(tContent('props.table.onOpenChange.description')) },
  { name: 'defaultOpen',   type: tContent('props.table.defaultOpen.type'),  defaultValue: tContent('props.table.defaultOpen.default'),  required: tContent('props.table.defaultOpen.required'),  description: toPlainText(tContent('props.table.defaultOpen.description'))  },
  { name: 'direction',     type: tContent('props.table.direction.type'),   defaultValue: tContent('props.table.direction.default'),    required: tContent('props.table.direction.required'),    description: toPlainText(tContent('props.table.direction.description'))    },
  { name: 'modal',         type: tContent('props.table.modal.type'),       defaultValue: tContent('props.table.modal.default'),        required: tContent('props.table.modal.required'),        description: toPlainText(tContent('props.table.modal.description'))        },
  { name: 'dismissible',   type: tContent('props.table.dismissible.type'), defaultValue: tContent('props.table.dismissible.default'),  required: tContent('props.table.dismissible.required'),  description: toPlainText(tContent('props.table.dismissible.description'))  },
]);

const tokenRows = computed(() => [
  { token: '--background',         value: tContent('tokens.table.background.class'), description: tContent('tokens.table.background.part') },
  { token: '--foreground',         value: tContent('tokens.table.foreground.class'), description: tContent('tokens.table.foreground.part') },
  { token: '--border',             value: tContent('tokens.table.border.class'),     description: tContent('tokens.table.border.part')     },
  { token: '--overlay',   value: tContent('tokens.table.overlay.class'),    description: tContent('tokens.table.overlay.part')    },
  { token: '--muted',              value: tContent('tokens.table.handle.class'),     description: tContent('tokens.table.handle.part')     },
  { token: '--radius-xl',          value: tContent('tokens.table.rounded.class'),    description: tContent('tokens.table.rounded.part')    },
  { token: '--drawer-width',       value: tContent('tokens.table.width.class'),      description: tContent('tokens.table.width.part')      },
  { token: '--drawer-max-width',   value: tContent('tokens.table.maxWidth.class'),   description: tContent('tokens.table.maxWidth.part')   },
]);

const accessibilityItems = computed(() => stringsFromDict('accessibility.items'));

// Sem linha de "Swipe": a tabela é de teclado, e arrastar é gesto de ponteiro.
// O que se sabe sobre o arraste (nunca é o único caminho) está em
// `accessibility.items.item5`, que é onde a WCAG 2.5.7 mora.
const keyboardItems = computed(() => [
  { key: 'Tab / Shift+Tab', description: toPlainText(tContent('accessibility.keyboard.tab'))    },
  { key: 'Escape',          description: toPlainText(tContent('accessibility.keyboard.escape')) },
  { key: 'Enter / Space',   description: toPlainText(tContent('accessibility.keyboard.enter'))  },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.sheet.name'),       description: toPlainText(tContent('related.items.sheet.description')),       path: '?path=/docs/components-overlay-sheet--docs'       },
  { name: tContent('related.items.dialog.name'),      description: toPlainText(tContent('related.items.dialog.description')),      path: '?path=/docs/components-overlay-dialog--docs'      },
  { name: tContent('related.items.alertDialog.name'), description: toPlainText(tContent('related.items.alertDialog.description')), path: '?path=/docs/components-overlay-alertdialog--docs' },
  { name: tContent('related.items.sidebar.name'),     description: toPlainText(tContent('related.items.sidebar.description')),     path: '?path=/docs/components-layout-sidebar--docs'     },
]);

const noteItems = computed(() => stringsFromDict('notes').map((content) => ({ title: '', content })));

// Só o FECHAMENTO leva `reason`: as duas linhas anunciavam o mesmo payload, e o
// motivo — o que separa "saiu sem decidir" de "usou a saída do rodapé" — não
// aparecia para quem lê.
const analyticsItems = computed(() => [
  { event: 'drawer_open',  trigger: toPlainText(tContent('states.open.trigger')),        payload: "{ component: 'drawer', location, label }" },
  { event: 'drawer_close', trigger: toPlainText(tContent('accessibility.keyboard.escape')), payload: "{ component: 'drawer', location, label, reason }" },
]);

const functionalTestItems = computed(() =>
  entriesFromDict('testes.functional', ['action', 'result', 'priority']).map((entry) => ({
    action: toPlainText(entry.action),
    result: toPlainText(entry.result),
    priority: localPriority(entry.priority),
  })),
);

// A coluna "como verificar" repetia o próprio critério — mesma frase duas vezes
// na linha, e nenhuma informação sobre a ferramenta.
const a11yTestItems = computed(() =>
  stringsFromDict('testes.accessibility').map((criterion, i) => ({
    criterion,
    level: A11Y_TEST_LEVELS[i] ?? 'AA',
    how: A11Y_TEST_HOW[i] ?? 'axe-core',
  })),
);

const visualTestItems = computed(() =>
  entriesFromDict('testes.visual', ['story', 'priority']).map((entry) => ({
    story: entry.story,
    priority: localPriority(entry.priority),
  })),
);

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
    component-slug="drawer"
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
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div
        class="nds-cluster nds-w-full"
        data-justify="center"
        data-spacing="md"
        style="contain: layout; flex-wrap: wrap"
      >
        <div
          v-for="dir in demonstrationDirections"
          :key="dir"
          class="nds-stack"
          data-spacing="xs"
          style="contain: layout; position: relative"
        >
          <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
            {{ directionsExamples[dir].description }}
          </p>
          <Drawer
            :direction="dir"
            @update:open="(open: boolean) => trackDrawer('docs_demo', dir, open)"
            @drag="() => markCloseReason('overlay')"
            @release="onDragRelease"
          >
            <DrawerTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                class="nds-w-full"
              >
                {{ directionsExamples[dir].title }}
              </Button>
            </DrawerTrigger>
            <DrawerContent
              @escape-key-down="() => markCloseReason('escape')"
              @pointer-down-outside="() => markCloseReason('overlay')"
            >
              <DrawerHeader>
                <DrawerTitle>{{ directionsExamples[dir].title }}</DrawerTitle>
                <DrawerDescription>{{ directionsExamples[dir].description }}</DrawerDescription>
              </DrawerHeader>
              <DrawerBody class="nds-text-body nds-text-muted-foreground">
                {{ directionsExamples[dir].body }}
              </DrawerBody>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline">
                    {{ directionsExamples[dir].close }}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
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
        items: stringsFromDict('usage.guidelines').map(stripHtml),
      }"
      :scenarios="{
        title: tContent('usage.scenarios.title'),
        cols: {
          scenario: tContent('usage.scenarios.cols.scenario'),
          use: tContent('usage.scenarios.cols.use'),
          alternative: tContent('usage.scenarios.cols.alternative'),
        },
        items: entriesFromDict('usage.scenarios', ['s', 'u', 'a']),
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
          { element: tContent('usage.uxWriting.table.close.name'), rules: tContent('usage.uxWriting.table.close.format'), do: tContent('usage.uxWriting.table.close.good'), dont: tContent('usage.uxWriting.table.close.bad') },
        ],
      }"
      :do="{
        title: tContent('usage.do.title'),
        items: stringsFromDict('usage.do'),
      }"
      :dont="{
        title: tContent('usage.dont.title'),
        items: stringsFromDict('usage.dont'),
      }"
    />

    <!-- ── Do & Don't ───────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
      ]"
    >
      <template #do-preview-0>
        <div
          style="contain: layout"
          class="nds-w-full"
        >
          <Drawer
            @update:open="(open: boolean) => trackDrawer('docs_do_dont', 'bottom', open)"
            @drag="() => markCloseReason('overlay')"
            @release="onDragRelease"
          >
            <DrawerTrigger as-child>
              <Button variant="outline">
                {{ tContent('usage.uxWriting.table.trigger.good') }}
              </Button>
            </DrawerTrigger>
            <DrawerContent
              @escape-key-down="() => markCloseReason('escape')"
              @pointer-down-outside="() => markCloseReason('overlay')"
            >
              <DrawerHeader>
                <DrawerTitle>{{ tContent('usage.uxWriting.table.title.good') }}</DrawerTitle>
                <DrawerDescription>{{ tContent('usage.uxWriting.table.description.good') }}</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline">
                    {{ tContent('usage.uxWriting.table.close.good') }}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
      <!--
        O anti-exemplo MANTÉM o nome acessível: um painel realmente sem
        `DrawerTitle` reprovaria o axe da própria docs page, e o conteúdo
        compartilhado (`usage.guidelines.item3`) diz que o título oculto é a
        forma CORRETA — o anti-exemplo estava, portanto, fazendo a coisa certa.
        A lição passou para o CORPO do painel: o que se evita é o painel sem
        título nenhum, não o título visualmente oculto.
      -->
      <template #dont-preview-0>
        <div
          style="contain: layout"
          class="nds-w-full"
        >
          <Drawer
            @update:open="(open: boolean) => trackDrawer('docs_do_dont', 'bottom', open)"
            @drag="() => markCloseReason('overlay')"
            @release="onDragRelease"
          >
            <DrawerTrigger as-child>
              <Button variant="outline">
                {{ tContent('usage.uxWriting.table.trigger.good') }}
              </Button>
            </DrawerTrigger>
            <DrawerContent
              @escape-key-down="() => markCloseReason('escape')"
              @pointer-down-outside="() => markCloseReason('overlay')"
            >
              <DrawerHeader>
                <DrawerTitle class="nds-sr-only">
                  {{ tContent('usage.uxWriting.table.title.good') }}
                </DrawerTitle>
                <DrawerDescription class="nds-sr-only">
                  {{ tContent('usage.uxWriting.table.description.good') }}
                </DrawerDescription>
              </DrawerHeader>
              <DrawerBody class="nds-text-body nds-text-muted-foreground">
                {{ toPlainText(tContent('doDont.pair1.dont')) }}
              </DrawerBody>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline">
                    {{ tContent('usage.uxWriting.table.close.good') }}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
      <template #do-preview-1>
        <div
          style="contain: layout"
          class="nds-w-full"
        >
          <Drawer
            direction="bottom"
            @update:open="(open: boolean) => trackDrawer('docs_do_dont', 'bottom', open)"
            @drag="() => markCloseReason('overlay')"
            @release="onDragRelease"
          >
            <DrawerTrigger as-child>
              <Button variant="outline">
                {{ directionsExamples.bottom.title }}
              </Button>
            </DrawerTrigger>
            <DrawerContent
              @escape-key-down="() => markCloseReason('escape')"
              @pointer-down-outside="() => markCloseReason('overlay')"
            >
              <DrawerHeader>
                <DrawerTitle>{{ directionsExamples.bottom.title }}</DrawerTitle>
                <DrawerDescription>{{ directionsExamples.bottom.description }}</DrawerDescription>
              </DrawerHeader>
              <DrawerBody class="nds-text-body nds-text-muted-foreground">
                {{ directionsExamples.bottom.body }}
              </DrawerBody>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline">
                    {{ directionsExamples.bottom.close }}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
      <!--
        Aninhar de verdade quebraria o foco preso da PRÓPRIA docs page — que é
        exatamente o que a legenda condena. O painel é um só, e o que ele
        explica no corpo é o motivo de não haver um segundo.
      -->
      <template #dont-preview-1>
        <div
          style="contain: layout"
          class="nds-w-full"
        >
          <Drawer
            @update:open="(open: boolean) => trackDrawer('docs_do_dont', 'bottom', open)"
            @drag="() => markCloseReason('overlay')"
            @release="onDragRelease"
          >
            <DrawerTrigger as-child>
              <Button variant="outline">
                {{ tContent('usage.uxWriting.table.trigger.good') }}
              </Button>
            </DrawerTrigger>
            <DrawerContent
              @escape-key-down="() => markCloseReason('escape')"
              @pointer-down-outside="() => markCloseReason('overlay')"
            >
              <DrawerHeader>
                <DrawerTitle>{{ tContent('usage.uxWriting.table.title.good') }}</DrawerTitle>
                <DrawerDescription>{{ tContent('usage.uxWriting.table.description.good') }}</DrawerDescription>
              </DrawerHeader>
              <DrawerBody class="nds-text-body nds-text-muted-foreground">
                {{ toPlainText(tContent('doDont.pair2.dont')) }}
              </DrawerBody>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline">
                    {{ tContent('usage.uxWriting.table.close.good') }}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ────────────────────────────────────────────── -->
    <DocsCompositions
      id="variantes"
      :title="tContent('variants.title')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="drawer"
      :items="variantItems"
    >
      <template #variant-preview-0>
        <div
          style="contain: layout"
          class="nds-w-full"
        >
          <Drawer
            direction="bottom"
            @update:open="(open: boolean) => trackDrawer('docs_variantes', 'bottom', open)"
            @drag="() => markCloseReason('overlay')"
            @release="onDragRelease"
          >
            <DrawerTrigger as-child>
              <Button variant="outline">
                {{ directionsExamples.bottom.title }}
              </Button>
            </DrawerTrigger>
            <DrawerContent
              @escape-key-down="() => markCloseReason('escape')"
              @pointer-down-outside="() => markCloseReason('overlay')"
            >
              <DrawerHeader>
                <DrawerTitle>{{ directionsExamples.bottom.title }}</DrawerTitle>
                <DrawerDescription>{{ directionsExamples.bottom.description }}</DrawerDescription>
              </DrawerHeader>
              <DrawerBody class="nds-text-body nds-text-muted-foreground">
                {{ directionsExamples.bottom.body }}
              </DrawerBody>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline">
                    {{ directionsExamples.bottom.close }}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
      <template #variant-preview-1>
        <div
          style="contain: layout"
          class="nds-w-full"
        >
          <Drawer
            direction="top"
            @update:open="(open: boolean) => trackDrawer('docs_variantes', 'top', open)"
            @drag="() => markCloseReason('overlay')"
            @release="onDragRelease"
          >
            <DrawerTrigger as-child>
              <Button variant="outline">
                {{ directionsExamples.top.title }}
              </Button>
            </DrawerTrigger>
            <DrawerContent
              @escape-key-down="() => markCloseReason('escape')"
              @pointer-down-outside="() => markCloseReason('overlay')"
            >
              <DrawerHeader>
                <DrawerTitle>{{ directionsExamples.top.title }}</DrawerTitle>
                <DrawerDescription>{{ directionsExamples.top.description }}</DrawerDescription>
              </DrawerHeader>
              <DrawerBody class="nds-text-body nds-text-muted-foreground">
                {{ directionsExamples.top.body }}
              </DrawerBody>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline">
                    {{ directionsExamples.top.close }}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
      <template #variant-preview-2>
        <div
          style="contain: layout"
          class="nds-w-full"
        >
          <Drawer
            direction="left"
            @update:open="(open: boolean) => trackDrawer('docs_variantes', 'left', open)"
            @drag="() => markCloseReason('overlay')"
            @release="onDragRelease"
          >
            <DrawerTrigger as-child>
              <Button variant="outline">
                {{ directionsExamples.left.title }}
              </Button>
            </DrawerTrigger>
            <DrawerContent
              @escape-key-down="() => markCloseReason('escape')"
              @pointer-down-outside="() => markCloseReason('overlay')"
            >
              <DrawerHeader>
                <DrawerTitle>{{ directionsExamples.left.title }}</DrawerTitle>
                <DrawerDescription>{{ directionsExamples.left.description }}</DrawerDescription>
              </DrawerHeader>
              <DrawerBody class="nds-text-body nds-text-muted-foreground">
                {{ directionsExamples.left.body }}
              </DrawerBody>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline">
                    {{ directionsExamples.left.close }}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
      <template #variant-preview-3>
        <div
          style="contain: layout"
          class="nds-w-full"
        >
          <Drawer
            direction="right"
            @update:open="(open: boolean) => trackDrawer('docs_variantes', 'right', open)"
            @drag="() => markCloseReason('overlay')"
            @release="onDragRelease"
          >
            <DrawerTrigger as-child>
              <Button variant="outline">
                {{ directionsExamples.right.title }}
              </Button>
            </DrawerTrigger>
            <DrawerContent
              @escape-key-down="() => markCloseReason('escape')"
              @pointer-down-outside="() => markCloseReason('overlay')"
            >
              <DrawerHeader>
                <DrawerTitle>{{ directionsExamples.right.title }}</DrawerTitle>
                <DrawerDescription>{{ directionsExamples.right.description }}</DrawerDescription>
              </DrawerHeader>
              <DrawerBody class="nds-text-body nds-text-muted-foreground">
                {{ directionsExamples.right.body }}
              </DrawerBody>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline">
                    {{ directionsExamples.right.close }}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
      <template #variant-preview-4>
        <div
          style="contain: layout"
          class="nds-w-full"
        >
          <Drawer
            @update:open="(open: boolean) => trackDrawer('docs_variantes', 'bottom', open)"
            @drag="() => markCloseReason('overlay')"
            @release="onDragRelease"
          >
            <DrawerTrigger as-child>
              <Button variant="outline">
                Ler termos
              </Button>
            </DrawerTrigger>
            <DrawerContent
              @escape-key-down="() => markCloseReason('escape')"
              @pointer-down-outside="() => markCloseReason('overlay')"
            >
              <DrawerHeader>
                <DrawerTitle>Termos de uso</DrawerTitle>
                <DrawerDescription>Leia atentamente antes de aceitar.</DrawerDescription>
              </DrawerHeader>
              <DrawerBody
                class="nds-stack nds-text-body nds-text-muted-foreground"
                data-spacing="sm"
                aria-label="Termos de uso"
              >
                <!-- O corpo longo é EXEMPLO, e sai de
                     `demonstration.labels.scrollBody` — não de
                     `variants.items.withScroll.use`, que responde "quando usar
                     esta variante" e, repetida doze vezes, faria o painel exibir
                     a própria recomendação como se fosse o termo a ler. -->
                <p
                  v-for="i in 12"
                  :key="i"
                >
                  {{ i }}. {{ tContent('demonstration.labels.scrollBody') }}
                </p>
              </DrawerBody>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline">
                    {{ tContent('demonstration.labels.cancel') }}
                  </Button>
                </DrawerClose>
                <Button>Aceitar termos</Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
    </DocsCompositions>

    <!-- ── Composições ──────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="drawer"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <div
          style="contain: layout"
          class="nds-w-full"
        >
          <Drawer
            @update:open="(open: boolean) => trackDrawer('docs_composicoes', 'bottom', open)"
            @drag="() => markCloseReason('overlay')"
            @release="onDragRelease"
          >
            <DrawerTrigger as-child>
              <Button variant="outline">
                {{ tContent('demonstration.labels.trigger') }}
              </Button>
            </DrawerTrigger>
            <DrawerContent
              @escape-key-down="() => markCloseReason('escape')"
              @pointer-down-outside="() => markCloseReason('overlay')"
            >
              <DrawerHeader>
                <DrawerTitle>{{ tContent('demonstration.labels.title') }}</DrawerTitle>
                <DrawerDescription>{{ tContent('demonstration.labels.description') }}</DrawerDescription>
              </DrawerHeader>
              <form
                id="docs-drawer-form"
                class="nds-stack nds-px-4"
                data-spacing="sm"
                @submit.prevent
              >
                <Label
                  class="nds-stack nds-text-body"
                  data-spacing="xs"
                >
                  {{ tContent('demonstration.labels.fieldName') }}
                  <!-- O valor é DADO de exemplo, não rótulo: fica literal. -->
                  <Input default-value="Maria Souza" />
                </Label>
                <Label
                  class="nds-stack nds-text-body"
                  data-spacing="xs"
                >
                  {{ tContent('demonstration.labels.fieldEmail') }}
                  <Input
                    type="email"
                    default-value="maria@exemplo.com"
                  />
                </Label>
              </form>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button
                    type="button"
                    variant="outline"
                  >
                    {{ tContent('demonstration.labels.cancel') }}
                  </Button>
                </DrawerClose>
                <Button
                  type="submit"
                  form="docs-drawer-form"
                >
                  {{ tContent('demonstration.labels.confirm') }}
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
      <template #variant-preview-1>
        <div
          style="contain: layout"
          class="nds-w-full"
        >
          <Drawer
            @update:open="(open: boolean) => trackDrawer('docs_composicoes', 'bottom', open)"
            @drag="() => markCloseReason('overlay')"
            @release="onDragRelease"
          >
            <DrawerTrigger as-child>
              <Button variant="outline">
                {{ tContent('demonstration.labels.destroy') }}
              </Button>
            </DrawerTrigger>
            <!-- A decisão É a tela: o foco entra na saída segura, e não no painel. -->
            <DrawerContent
              initial-focus="close"
              @escape-key-down="() => markCloseReason('escape')"
              @pointer-down-outside="() => markCloseReason('overlay')"
            >
              <DrawerHeader>
                <DrawerTitle>{{ tContent('demonstration.labels.destroy') }}</DrawerTitle>
                <DrawerDescription>{{ tContent('demonstration.labels.destroyMessage') }}</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline">
                    {{ tContent('demonstration.labels.cancel') }}
                  </Button>
                </DrawerClose>
                <Button variant="destructive">
                  {{ tContent('demonstration.labels.destroy') }}
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
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
        { title: 'Drawer', cols: propCols, items: drawerPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-code="tContent('props.extensibilityCode')"
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
        event: 'Evento',
        trigger: 'Quando dispara',
        payload: 'Payload',
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
