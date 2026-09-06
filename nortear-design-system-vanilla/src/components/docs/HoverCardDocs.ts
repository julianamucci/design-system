import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createHoverCard } from '@/components/ui/hover-card';
import { createAvatar } from '@/components/ui/avatar';
import { CLASSES_TRIGGER_LINK, construirButton, construirLink } from '@/components/ui/hover-card.fixtures';
import uiTranslations from '@/i18n/ui.json';
import hoverCardTranslations from '@shared/content/hover-card/translations.json';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
  createDocsCompositions,
  createDocsStates,
  createDocsProps,
  createDocsTokens,
  createDocsAccessibility,
  createDocsRelated,
  createDocsNotes,
  createDocsAnalytics,
  createDocsTestes,
  createDocsPageLayout,
} from '@/components/docs/shared/sections';
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (hoverCardTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(hoverCardTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};
function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// ─── Analytics dos previews ───────────────────────────────────────────────────
//
// Todo preview VIVO desta página anuncia abertura e fechamento. `trigger_label`
// carrega um id ESTÁVEL (`user-profile`, `link-preview`…), nunca o texto do
// gatilho: o texto é traduzido, e mandá-lo partiria um evento em três no GA4.
function trackHoverCard(triggerLabel: string, location: string) {
  return (open: boolean) => {
    if (open) {
      track('hover_card_open', { component: 'hover-card', trigger_label: triggerLabel, location });
    } else {
      track('hover_card_close', { component: 'hover-card', location });
    }
  };
}

// ─── Preview builders ─────────────────────────────────────────────────────────
//
// Os gatilhos saem da fixture das stories (`construirLink`, `construirButton`):
// uma fonte só para o Playground e para a docs page. O miolo dos cartões é
// montado aqui porque o texto vem do conteúdo compartilhado — a
// fixture não fala i18n.
//
// O espaçamento é o da fixture: `data-align="start"` no cluster e
// `data-spacing="xs"` no stack. Sem os dois, o vão entre nome e subtítulo pula
// de 4px para 16px.

/** Cartão de perfil — avatar, nome e uma métrica curta. */
function buildProfileCard(): HTMLElement {
  const root = document.createElement('div');
  root.className = 'nds-cluster';
  root.dataset.spacing = 'sm';
  root.dataset.align = 'start';

  const info = document.createElement('div');
  info.className = 'nds-stack';
  info.dataset.spacing = 'xs';

  const name = document.createElement('p');
  name.className = 'nds-text-body nds-font-medium nds-leading-none';
  name.textContent = t('variants.items.userProfile.cardName');

  const meta = document.createElement('p');
  meta.className = 'nds-text-caption nds-text-muted-foreground';
  meta.textContent = t('variants.items.userProfile.cardMeta');

  info.append(name, meta);
  root.append(createAvatar({ fallbackText: 'JS' }), info);
  return root;
}

function buildProfilePreview(
  location: string,
  delays?: { openDelay?: number; closeDelay?: number },
): HTMLElement {
  return createHoverCard({
    trigger: construirLink(t('demonstration.mention'), '#joana'),
    content: buildProfileCard(),
    side: 'bottom',
    align: 'start',
    ...delays,
    onOpenChange: trackHoverCard('user-profile', location),
  });
}

/**
 * Gatilho do "don't" do par 1: uma menção que NÃO navega.
 *
 * `<span>` sem `href` e sem papel de link, de propósito — é o defeito que a
 * legenda descreve. Quem usa toque não tem para onde ir, e a informação do
 * cartão fica inalcançável. As classes são as mesmas do gatilho certo: o que
 * separa os dois lados do par é o comportamento, não a aparência.
 */
function buildPlainMention(): HTMLElement {
  const span = document.createElement('span');
  span.className = CLASSES_TRIGGER_LINK;
  span.textContent = t('demonstration.mention');
  return span;
}

/**
 * Preview de um lado do Do & Don't — componente VIVO e FECHADO (guideline 08
 * §15). Muda só o gatilho e as esperas, que é o que cada par contrasta.
 */
function buildDoDontPreview(
  triggerId: string,
  trigger: HTMLElement,
  delays: { openDelay?: number; closeDelay?: number },
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-min-h-40';
  // Mecânica de layout, não valor de design: o painel abre em portal, e a
  // reserva de altura mais o `relative` impedem que ele empurre o par seguinte.
  wrap.style.contain = 'layout';
  wrap.style.position = 'relative';
  wrap.append(
    createHoverCard({
      trigger,
      content: buildProfileCard(),
      side: 'bottom',
      align: 'start',
      ...delays,
      onOpenChange: trackHoverCard(triggerId, 'docs_do_dont'),
    }),
  );
  return wrap;
}

function buildLinkPreview(location: string): HTMLElement {
  const domain = t('variants.items.linkPreview.cardDomain');

  const content = document.createElement('div');
  content.className = 'nds-stack';
  content.dataset.spacing = 'sm';

  const meta = document.createElement('div');
  meta.className = 'nds-cluster nds-text-caption nds-text-muted-foreground';
  meta.dataset.spacing = 'xs';
  meta.dataset.align = 'center';

  const favicon = document.createElement('span');
  favicon.className = 'nds-rounded-sm nds-bg-muted nds-px-1';
  favicon.setAttribute('aria-hidden', 'true');
  favicon.textContent = 'D';

  const url = document.createElement('span');
  url.className = 'nds-truncate';
  url.textContent = domain;
  meta.append(favicon, url);

  const title = document.createElement('p');
  title.className = 'nds-text-body nds-font-medium nds-leading-none';
  title.textContent = t('variants.items.linkPreview.cardTitle');

  content.append(meta, title);

  return createHoverCard({
    trigger: construirLink(domain, '#link'),
    content,
    side: 'bottom',
    align: 'start',
    onOpenChange: trackHoverCard('link-preview', location),
  });
}

function buildDefinitionPreview(location: string): HTMLElement {
  const term = t('variants.items.definitionTooltip.cardTerm');

  const content = document.createElement('div');
  content.className = 'nds-stack';
  content.dataset.spacing = 'xs';

  const title = document.createElement('p');
  title.className = 'nds-text-body nds-font-medium nds-leading-none';
  title.textContent = term;

  const desc = document.createElement('p');
  desc.className = 'nds-text-caption nds-text-muted-foreground';
  desc.textContent = t('variants.items.definitionTooltip.cardMeaning');

  content.append(title, desc);

  return createHoverCard({
    // Gatilho que NÃO navega: botão sem moldura, sublinhado pontilhado e cursor
    // de ajuda. O glossário continua sendo o caminho alternativo obrigatório.
    trigger: construirButton(term),
    content,
    side: 'bottom',
    align: 'start',
    onOpenChange: trackHoverCard('definition-tooltip', location),
  });
}

function buildMetricPreview(location: string): HTMLElement {
  const content = document.createElement('div');
  content.className = 'nds-stack';
  content.dataset.spacing = 'xs';

  const head = document.createElement('div');
  head.className = 'nds-cluster';
  head.dataset.spacing = 'sm';
  head.dataset.justify = 'between';
  head.dataset.align = 'baseline';

  const label = document.createElement('p');
  label.className = 'nds-text-body nds-font-medium';
  label.textContent = t('variants.items.metricExplainer.cardMetric');

  const value = document.createElement('span');
  value.className = 'nds-text-caption nds-font-medium nds-text-success';
  value.textContent = '3,42%';
  head.append(label, value);

  const desc = document.createElement('p');
  desc.className = 'nds-text-caption nds-text-muted-foreground';
  desc.textContent = t('variants.items.metricExplainer.cardFormula');

  content.append(head, desc);

  return createHoverCard({
    trigger: construirButton('3,42%'),
    content,
    side: 'bottom',
    align: 'start',
    onOpenChange: trackHoverCard('metric-explainer', location),
  });
}


// ─── createHoverCardDocs ──────────────────────────────────────────────────────

export function createHoverCardDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'hover-card',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/overlay' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'hover-card',
      locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(subscribe(() => { cleanupSeo(); cleanupSeo = updateSeo(); }));

  // ── Nav groups ────────────────────────────────────────────────────────────
  const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
    { labelKey: 'nav.overview', sections: [
      { id: 'demonstracao', labelKey: 'nav.demonstration' },
      { id: 'anatomia',     labelKey: 'nav.anatomy'       },
      { id: 'quando-usar',  labelKey: 'nav.usage'         },
      { id: 'do-dont',      labelKey: 'nav.doDont'        },
    ]},
    { labelKey: 'nav.techRef', sections: [
      { id: 'importacao',   labelKey: 'nav.import'        },
      { id: 'variantes',    labelKey: 'nav.variants'      },
      { id: 'estados',      labelKey: 'nav.states'        },
      { id: 'propriedades', labelKey: 'nav.props'    },
      { id: 'tokens',       labelKey: 'nav.tokens'   },
    ]},
    { labelKey: 'nav.context', sections: [
      { id: 'acessibilidade', labelKey: 'nav.accessibility' },
      { id: 'relacionados',   labelKey: 'nav.related'       },
      { id: 'notas',          labelKey: 'nav.notes'         },
    ]},
    { labelKey: 'nav.quality', sections: [
      { id: 'analytics', labelKey: 'nav.analytics' },
      { id: 'testes',    labelKey: 'nav.testes'    },
    ]},
  ];

  function buildNavGroups() {
    return NAV_GROUPS.map(g => ({
      label: tNav(g.labelKey),
      sections: g.sections.map(s => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  }

  const pageLayout = createDocsPageLayout({ navGroups: buildNavGroups() });
  const root = pageLayout.root;
  const headerSlot = pageLayout.headerSlot;
  const main = pageLayout.main;

  function renderHeader() {
    const header = createDocsHeader({
      title: t('title'),
      description: t('description'),
      category: t('category'),
      type: t('type'),
    });
    headerSlot.replaceChildren(header);
  }
  function buildSidebar() { pageLayout.rebuildNav(buildNavGroups()); }
  function updateActiveNav(id: string) { pageLayout.setActiveSection(id); }

  // ── Sections ──────────────────────────────────────────────────────────────
  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];
  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {

      case 'demonstracao':
        // UM exemplo, o MESMO do Playground da story (guideline 08 §15): a
        // menção dentro da frase que o rótulo traduzido forma. Os outros três
        // gatilhos que moravam aqui não sumiram da página — são as variantes
        // `linkPreview`, `definitionTooltip` e `metricExplainer`, logo abaixo.
        return createDocsDemonstration({
          title: t('demonstration.title'),
          componentSlug: 'hover-card',
          demoFactory: () => {
            // A frase inteira vem do conteúdo compartilhado (`sentenceBefore` +
            // `mention` + `sentenceAfter`) — a MESMA que o Playground monta.
            // Prosa em português fixa aqui reapareceria em `en` e `es`. E o
            // cerco não é enfeite: é ele que dispensa o alvo em linha do mínimo
            // de 24px da WCAG 2.5.8; um link solto de 20px seria violação.
            const sentence = document.createElement('p');
            sentence.className = 'nds-text-body nds-max-w-sm nds-min-h-50';
            // Mecânica de layout, não valor de design: o painel abre num portal,
            // e a reserva de altura mais o `relative` impedem que ele empurre a
            // seção seguinte ao abrir.
            sentence.style.contain = 'layout';
            sentence.style.position = 'relative';

            sentence.append(
              document.createTextNode(`${t('demonstration.sentenceBefore')} `),
              buildProfilePreview('docs_demo', { openDelay: 150, closeDelay: 100 }),
              document.createTextNode(` ${t('demonstration.sentenceAfter')}`),
            );

            return sentence;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3].map(i => DOMPurify.sanitize(t(`anatomy.item${i}`))),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4, 5].map(i => DOMPurify.sanitize(t(`usage.guidelines.item${i}`))),
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4, 5].map(i => ({
              s: t(`usage.scenarios.item${i}.s`),
              u: t(`usage.scenarios.item${i}.u`),
              a: t(`usage.scenarios.item${i}.a`),
            })),
          },
          uxWriting: {
            title: t('usage.uxWriting.title'),
            cols: {
              element: t('usage.uxWriting.table.element'),
              rules: t('usage.uxWriting.table.rules'),
              do: t('usage.uxWriting.table.correct'),
              dont: t('usage.uxWriting.table.avoid'),
            },
            items: ['trigger', 'content', 'delay'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.dont.item${i}`)),
          },
        });

      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              // Gatilho que é LINK de verdade: navegável por clique e por
              // teclado, com o cartão apenas complementando o caminho.
              doPreviewFactory: () =>
                buildDoDontPreview(
                  'par1-do',
                  construirLink(t('demonstration.mention'), '#joana'),
                  { openDelay: 150, closeDelay: 100 },
                ),
              // O defeito FICA: menção sem link nenhum. É o que a legenda
              // ensina, e imitação em markup não ensinaria.
              dontPreviewFactory: () =>
                buildDoDontPreview('par1-dont', buildPlainMention(), {
                  openDelay: 150,
                  closeDelay: 100,
                }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              // A espera é o assunto do par, então cada lado CARREGA o valor
              // que a legenda descreve — 500ms contra zero.
              doPreviewFactory: () =>
                buildDoDontPreview(
                  'par2-do',
                  construirLink(t('demonstration.mention'), '#joana'),
                  { openDelay: 500, closeDelay: 200 },
                ),
              dontPreviewFactory: () =>
                buildDoDontPreview(
                  'par2-dont',
                  construirLink(t('demonstration.mention'), '#joana'),
                  { openDelay: 0, closeDelay: 200 },
                ),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { createHoverCard } from '@/components/ui/hover-card';`,
        });

      case 'variantes': {
        // As duas variantes de TEMPO mostram o componente vivo, e não um par de
        // números em monoespaçado: imitação não recebe as classes reais, não
        // responde a tema nem a densidade, e não dispara evento (guideline 08
        // §15). Nascem fechadas — quem lê é que abre, e é a espera que se compara.
        const codeDefault = `const trigger = document.createElement('a');
trigger.href = '/users/joana';
trigger.className = 'nds-text-primary nds-font-medium nds-hover-underline';
trigger.textContent = '@joana';

// Sem \`openDelay\`/\`closeDelay\`: a factory usa a espera padrão do design
// system — 600ms para abrir, 300ms para fechar.
createHoverCard({ trigger, content, side: 'bottom', align: 'start' });`;

        const codeWithDelay = `const trigger = document.createElement('a');
trigger.href = '/users/joana';
trigger.className = 'nds-text-primary nds-font-medium nds-hover-underline';
trigger.textContent = '@joana';

createHoverCard({
  trigger,
  content,
  side: 'bottom',
  align: 'start',
  openDelay: 500,
  closeDelay: 200,
});`;

        return createDocsCompositions({
          id: 'variantes',
          title: t('variants.title'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'hover-card',
          items: [
            {
              trackId: 'default',
              name: t('variants.items.default'),
              description: stripHtml(t('variants.styles.default')),
              code: codeDefault,
              previewFactory: () => buildProfilePreview('docs_variantes'),
            },
            {
              trackId: 'withDelay',
              name: t('variants.items.withDelay'),
              description: stripHtml(t('variants.styles.withDelay')),
              code: codeWithDelay,
              previewFactory: () =>
                buildProfilePreview('docs_variantes', { openDelay: 500, closeDelay: 200 }),
            },
            {
              name: stripHtml(t('variants.items.userProfile.name')),
              trackId: 'userProfile',
              description: stripHtml(t('variants.items.userProfile.description')),
              useWhen: stripHtml(t('variants.items.userProfile.use')),
              code: `const trigger = document.createElement('a');
trigger.href = '/users/joana';
trigger.className = 'nds-text-primary nds-font-medium nds-hover-underline';
trigger.textContent = '@joana';

const content = document.createElement('div');
content.className = 'nds-cluster';
content.dataset.spacing = 'sm';
content.dataset.align = 'start';

const info = document.createElement('div');
info.className = 'nds-stack';
info.dataset.spacing = 'xs';
const name = document.createElement('p');
name.className = 'nds-text-body nds-font-medium nds-leading-none';
name.textContent = 'Joana Silva';
const meta = document.createElement('p');
meta.className = 'nds-text-caption nds-text-muted-foreground';
meta.textContent = 'Designer · 142 seguidores';
info.append(name, meta);
content.append(createAvatar({ fallbackText: 'JS' }), info);

const el = createHoverCard({ trigger, content, side: 'bottom', align: 'start' });`,
              previewFactory: () => buildProfilePreview('docs_variantes'),
            },
            {
              name: stripHtml(t('variants.items.linkPreview.name')),
              trackId: 'linkPreview',
              description: stripHtml(t('variants.items.linkPreview.description')),
              useWhen: stripHtml(t('variants.items.linkPreview.use')),
              code: `const trigger = document.createElement('a');
trigger.href = 'https://design-system.dev';
trigger.className = 'nds-text-primary nds-font-medium nds-hover-underline';
trigger.textContent = 'design-system.dev';

const content = document.createElement('div');
content.className = 'nds-stack';
content.dataset.spacing = 'sm';

const meta = document.createElement('div');
meta.className = 'nds-cluster nds-text-caption nds-text-muted-foreground';
meta.dataset.spacing = 'xs';
meta.dataset.align = 'center';
const favicon = document.createElement('span');
favicon.className = 'nds-rounded-sm nds-bg-muted nds-px-1';
favicon.setAttribute('aria-hidden', 'true');
favicon.textContent = 'D';
const url = document.createElement('span');
url.className = 'nds-truncate';
url.textContent = 'design-system.dev';
meta.append(favicon, url);

const title = document.createElement('p');
title.className = 'nds-text-body nds-font-medium nds-leading-none';
title.textContent = 'Guia de overlays acessíveis';

content.append(meta, title);

const el = createHoverCard({ trigger, content, side: 'bottom', align: 'start' });`,
              previewFactory: () => buildLinkPreview('docs_variantes'),
            },
            {
              name: stripHtml(t('variants.items.definitionTooltip.name')),
              trackId: 'definitionTooltip',
              description: stripHtml(t('variants.items.definitionTooltip.description')),
              useWhen: stripHtml(t('variants.items.definitionTooltip.use')),
              code: `const trigger = document.createElement('button');
trigger.type = 'button';
trigger.className =
  'nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help nds-bg-transparent nds-border-none nds-p-0';
trigger.textContent = 'WCAG 2.2';

const content = document.createElement('div');
content.className = 'nds-stack';
content.dataset.spacing = 'xs';
const term = document.createElement('p');
term.className = 'nds-text-body nds-font-medium nds-leading-none';
term.textContent = 'WCAG 2.2';
const def = document.createElement('p');
def.className = 'nds-text-caption nds-text-muted-foreground';
def.textContent =
  'Web Content Accessibility Guidelines: padrão internacional de acessibilidade para conteúdo web.';
content.append(term, def);

const el = createHoverCard({ trigger, content, side: 'bottom', align: 'start' });`,
              previewFactory: () => buildDefinitionPreview('docs_variantes'),
            },
            {
              name: stripHtml(t('variants.items.metricExplainer.name')),
              trackId: 'metricExplainer',
              description: stripHtml(t('variants.items.metricExplainer.description')),
              useWhen: stripHtml(t('variants.items.metricExplainer.use')),
              code: `const trigger = document.createElement('button');
trigger.type = 'button';
trigger.className =
  'nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help nds-bg-transparent nds-border-none nds-p-0';
trigger.textContent = '3,42%';

const content = document.createElement('div');
content.className = 'nds-stack';
content.dataset.spacing = 'xs';

const head = document.createElement('div');
head.className = 'nds-cluster';
head.dataset.spacing = 'sm';
head.dataset.justify = 'between';
head.dataset.align = 'baseline';
const metric = document.createElement('p');
metric.className = 'nds-text-body nds-font-medium';
metric.textContent = 'Conversão (últimos 30d)';
const value = document.createElement('span');
value.className = 'nds-text-caption nds-font-medium nds-text-success';
value.textContent = '3,42%';
head.append(metric, value);

const desc = document.createElement('p');
desc.className = 'nds-text-caption nds-text-muted-foreground';
desc.textContent = 'Cliques no CTA / usuários únicos';
content.append(head, desc);

const el = createHoverCard({ trigger, content, side: 'bottom', align: 'start' });`,
              previewFactory: () => buildMetricPreview('docs_variantes'),
            },
          ],
        });
      }

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            { label: t('states.closed.label'),     trigger: toPlainText(t('states.closed.trigger')),     behavior: toPlainText(t('states.closed.behavior')) },
            { label: t('states.open.label'),       trigger: toPlainText(t('states.open.trigger')),       behavior: toPlainText(t('states.open.behavior')) },
            { label: t('states.controlled.label'), trigger: toPlainText(t('states.controlled.trigger')), behavior: toPlainText(t('states.controlled.behavior')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createHoverCard(options)
export type HoverCardSide = 'top' | 'bottom' | 'left' | 'right';
export type HoverCardAlign = 'start' | 'center' | 'end';

export type HoverCardOptions = {
  trigger: HTMLElement;
  content: HTMLElement;
  side?: HoverCardSide;
  align?: HoverCardAlign;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

export function createHoverCard(options: HoverCardOptions): HTMLElement;`;

        const propsCols = {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        };

        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              title: 'createHoverCard(options)',
              cols: propsCols,
              items: [
                { name: 'trigger',      type: 'HTMLElement',                              defaultValue: '—',         required: 'Sim', description: 'Elemento que dispara o hover (link, botão, texto).' },
                { name: 'content',      type: 'HTMLElement',                              defaultValue: '—',         required: 'Sim', description: 'Conteúdo flutuante exibido após o delay.' },
                { name: 'side',         type: "'top' | 'bottom' | 'left' | 'right'",      defaultValue: "'bottom'",  required: 'Não', description: toPlainText(t('props.table.side.description')) },
                { name: 'align',        type: "'start' | 'center' | 'end'",               defaultValue: "'center'",  required: 'Não', description: toPlainText(t('props.table.align.description')) },
                { name: 'onOpenChange', type: '(open: boolean) => void',                  defaultValue: '—',         required: 'Não', description: toPlainText(t('props.table.onOpenChange.description')) },
                { name: 'class',        type: 'string',                                   defaultValue: '—',         required: 'Não', description: 'Classes adicionais aplicadas ao painel flutuante.' },
                { name: 'openDelay',    type: 'number',                                   defaultValue: '300',       required: 'Não', description: toPlainText(t('props.table.openDelay.description')) + ' NOTA: factory Nortear usa constante interna SHOW_DELAY (não-prop).' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibilityCode'),
        });
      }

      case 'tokens':
        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          // A coluna do meio traz a PROPRIEDADE CSS que consome o token, lida
          // linha a linha de `docs/shared/styles/nds/hover-card.css`. Todas
          // moram em `.nds-hover-card-content`, menos a camada, do positioner.
          items: [
            { token: '--popover',            value: 'background-color', description: t('tokens.table.background.part') },
            { token: '--popover-foreground', value: 'color',            description: t('tokens.table.foreground.part') },
            { token: '--border',             value: 'border',           description: t('tokens.table.border.part')     },
            { token: '--elevation-xl',       value: 'box-shadow',       description: t('tokens.table.shadow.part')     },
            { token: '--radius',             value: 'border-radius',    description: t('tokens.table.rounded.part')    },
            { token: '--spacing-4',          value: 'padding',          description: t('tokens.table.padding.part')    },
            { token: '--hover-card-width',   value: 'width',            description: t('tokens.table.width.part')      },
            { token: '--z-popover',          value: 'z-index',          description: t('tokens.table.layer.part')      },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });

      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [1, 2, 3, 4, 5, 6].map(i => DOMPurify.sanitize(t(`accessibility.items.item${i}`))),
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',       description: toPlainText(t('accessibility.keyboard.tab'))      },
            { key: 'Esc',       description: toPlainText(t('accessibility.keyboard.escape'))   },
            { key: 'Shift+Tab', description: toPlainText(t('accessibility.keyboard.shiftTab')) },
            { key: 'Enter',     description: toPlainText(t('accessibility.keyboard.enter'))    },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.tooltip.name'),      description: toPlainText(t('related.items.tooltip.description')),      path: '?path=/docs/components-overlay-tooltip--docs'      },
            { name: t('related.items.popover.name'),      description: toPlainText(t('related.items.popover.description')),      path: '?path=/docs/components-overlay-popover--docs'      },
            { name: t('related.items.dropdownMenu.name'), description: toPlainText(t('related.items.dropdownMenu.description')), path: '?path=/docs/components-overlay-dropdownmenu--docs' },
            { name: t('related.items.card.name'),         description: toPlainText(t('related.items.card.description')),         path: '?path=/docs/components-layout-card--docs'         },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [1, 2, 3, 4, 5].map(i => ({ title: '', content: DOMPurify.sanitize(t(`notes.item${i}`)) })),
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: tNav('common.event'),
            trigger: tNav('common.eventTrigger'),
            payload: tNav('common.payload'),
          },
          items: [
            {
              event: 'hover_card_open',
              trigger: 'onOpenChange(true)',
              payload: "{ component: 'hover-card', trigger_label, location }",
            },
            {
              event: 'hover_card_close',
              trigger: 'onOpenChange(false)',
              payload: "{ component: 'hover-card', location }",
            },
            {
              event: '—',
              trigger: stripHtml(t('analytics.description')),
              payload: '—',
            },
          ],
        });

      case 'testes':
        return createDocsTestes({
          title: t('testes.title'),
          functional: {
            title: t('testes.functional.title'),
            cols: {
              action: tNav('common.userAction'),
              result: tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: {
              criterion: tNav('common.criterion'),
              level: 'WCAG',
              how: tNav('common.howToVerify'),
            },
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              criterion: t(`testes.accessibility.item${i}`),
              level: 'AA',
              how: 'axe-core / manual',
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story: tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5].map(i => ({
              story: t(`testes.visual.item${i}.story`),
              priority: priorityLabel(t(`testes.visual.item${i}.priority`)),
            })),
          },
        });
    }
  }

  function renderAllSections() {
    for (const id of sectionOrder) {
      const fresh = buildSection(id);
      const existing = sectionEls[id];
      if (existing && existing.parentNode) existing.replaceWith(fresh);
      else main.appendChild(fresh);
      sectionEls[id] = fresh;
    }
    attachObserver();
  }

  // ── IntersectionObserver ─────────────────────────────────────────────────
  let activeSectionObserver: { disconnect: () => void } | null = null;

  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as keyof typeof sectionEls] ?? null,
      (id) => updateActiveNav(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'hover-card',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ────────────────────────────────────────────────────────
  renderHeader();
  buildSidebar();
  renderAllSections();

  cleanups.push(subscribe(() => { renderHeader(); buildSidebar(); renderAllSections(); }));
  cleanups.push(onLocaleChange(() => { renderHeader(); buildSidebar(); renderAllSections(); }));

  // ── Cleanup on disconnect ─────────────────────────────────────────────────
  const mo = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      cleanups.forEach(fn => fn());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
