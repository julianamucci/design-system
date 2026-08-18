import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createAccordion } from '@/components/ui/accordion';
import { createBadge } from '@/components/ui/badge';
import DOMPurify from 'dompurify';
import uiTranslations from '@/i18n/ui.json';
import accordionTranslations from '@shared/content/accordion/translations.json';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
  createDocsVariants,
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
const { t, subscribe } = createTranslation(accordionTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

function buildDemoAccordion(): HTMLElement {
  return createAccordion({
    type: 'single',
    defaultValue: 'q1',
    class: 'nds-max-w-lg',
    items: [
      {
        value: 'q1',
        trigger: t('demonstration.labels.q1'),
        content: t('demonstration.labels.a1'),
      },
      {
        value: 'q2',
        trigger: t('demonstration.labels.q2'),
        content: t('demonstration.labels.a2'),
      },
      {
        value: 'q3',
        trigger: t('demonstration.labels.q3'),
        content: t('demonstration.labels.a3'),
      },
      {
        value: 'q4',
        trigger: t('demonstration.labels.q4'),
        content: t('demonstration.labels.a4'),
      },
    ],
    onValueChange: (val) => {
      if (val) {
        track('accordion_expand', { component: 'accordion', location: 'docs_demo' });
      } else {
        track('accordion_collapse', { component: 'accordion', location: 'docs_demo' });
      }
    },
  });
}

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (accordionTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}

function getTokenItems(): Array<{ token: string; value: string; description: string }> {
  type AT = typeof accordionTranslations;
  type LK = keyof AT;
  const locale = getLocale() as LK;
  const items = (accordionTranslations as unknown as Record<string, { tokens?: { items?: Record<string, { token: string; class: string; part: string }> } }>)[locale]?.tokens?.items ?? {};
  return Object.values(items).map(v => ({ token: v.token, value: v.class, description: v.part }));
}

function getPropItems(tableKey: string): Array<{ name: string; type: string; defaultValue: string; required: string; description: string }> {
  type AT = typeof accordionTranslations;
  type LK = keyof AT;
  const locale = getLocale() as LK;
  type PropItem = { name: string; type: string; default: string; required: string; description: string };
  const items = (accordionTranslations as unknown as Record<string, { props?: Record<string, { items?: Record<string, PropItem> }> }>)[locale]?.props?.[tableKey]?.items ?? {};
  return Object.values(items).map(v => ({
    name: v.name,
    type: v.type,
    defaultValue: v.default,
    required: v.required,
    description: stripHtml(v.description),
  }));
}

// ─── createAccordionDocs ──────────────────────────────────────────────────────

export function createAccordionDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'accordion',
    });
    track('docs_page_view', { component_name: 'accordion', locale, page_title: `${t('title')} · Design System` });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(subscribe(() => { cleanupSeo(); cleanupSeo = updateSeo(); }));

  // ── Nav groups ───────────────────────────────────────────────────────────

  const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
    { labelKey: 'nav.overview', sections: [
      { id: 'demonstracao', labelKey: 'nav.demonstration' },
      { id: 'anatomia',     labelKey: 'nav.anatomy'       },
      { id: 'quando-usar',  labelKey: 'nav.usage'         },
      { id: 'do-dont',      labelKey: 'nav.doDont'        },
    ]},
    { labelKey: 'nav.techRef', sections: [
      { id: 'importacao',   labelKey: 'nav.import'   },
      { id: 'variantes',        labelKey: 'nav.variants' },
      { id: 'composicoes',  labelKey: 'nav.compositions' },
      { id: 'estados',      labelKey: 'nav.states'   },
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

  function buildSidebar() {
    pageLayout.rebuildNav(buildNavGroups());
  }

  function updateActiveNav(activeId: string) {
    pageLayout.setActiveSection(activeId);
  }

  // ── Sections ─────────────────────────────────────────────────────────────

  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: buildDemoAccordion,
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [t('anatomy.item1'), t('anatomy.item2'), t('anatomy.item3'), t('anatomy.item4')],
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4, 5].map(i => t(`usage.guidelines.item${i}`)),
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
            items: ['trigger', 'triggerDoc', 'content'].map(key => ({
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
              doPreviewFactory: () => createAccordion({
                type: 'single', class: 'nds-max-w-xs nds-text-body',
                items: [{ value: 'faq', trigger: 'Como faço para redefinir minha senha?', content: 'Acesse a tela de login e clique em "Esqueci minha senha".' }],
              }),
              dontPreviewFactory: () => createAccordion({
                type: 'single', class: 'nds-max-w-xs nds-text-body',
                items: [{ value: 'faq', trigger: 'Senha', content: 'Informações sobre redefinição.' }],
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => createAccordion({
                type: 'multiple', class: 'nds-max-w-xs nds-text-body',
                items: [
                  { value: 's1', trigger: 'Especificações técnicas', content: 'CPU, RAM, SSD.' },
                  { value: 's2', trigger: 'Compatibilidade', content: 'Windows 11, macOS, Linux.' },
                ],
              }),
              dontPreviewFactory: () => createAccordion({
                type: 'single', class: 'nds-max-w-xs nds-text-body',
                items: [{ value: 's1', trigger: 'Expandir', content: 'Conteúdo único.' }],
              }),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.note'),
          code: `import { createAccordion } from '@/components/ui/accordion';`,
        });

      case 'variantes': {
        const codeSingle = `createAccordion({\n  type: 'single',\n  items: [{ value: 'item-1', trigger: 'Pergunta', content: 'Resposta' }],\n});`;
        const codeMultiple = `createAccordion({\n  type: 'multiple',\n  items: [{ value: 's1', trigger: 'Especificações', content: 'CPU, RAM...' }],\n});`;
        const codeControlled = `createAccordion({\n  type: 'single',\n  defaultValue: 'item-1',\n  onValueChange: (val) => console.log(val),\n  items: [...],\n});`;

        return createDocsVariants({
          id: 'variantes',
          title: t('variants.title'),
          items: [
            {
              name: t('variants.items.single.label'),
              description: stripHtml(t('variants.items.single.description')),
              code: codeSingle,
              previewFactory: () => createAccordion({
                type: 'single', defaultValue: 'item-1', class: 'nds-max-w-sm nds-text-body',
                items: [
                  { value: 'item-1', trigger: 'Pergunta 1', content: 'Resposta objetiva em 1–2 linhas.' },
                  { value: 'item-2', trigger: 'Pergunta 2', content: 'Outro conteúdo aqui.' },
                ],
              }),
            },
            {
              name: t('variants.items.multiple.label'),
              description: stripHtml(t('variants.items.multiple.description')),
              code: codeMultiple,
              previewFactory: () => createAccordion({
                type: 'multiple', class: 'nds-max-w-sm nds-text-body',
                items: [
                  { value: 's1', trigger: 'Especificações técnicas', content: 'CPU, RAM, SSD.' },
                  { value: 's2', trigger: 'Compatibilidade', content: 'Windows 11, macOS, Linux.' },
                ],
              }),
            },
            {
              name: t('variants.items.controlled.label'),
              description: stripHtml(t('variants.items.controlled.description')),
              code: codeControlled,
              previewFactory: () => createAccordion({
                type: 'single', defaultValue: 'item-1', class: 'nds-max-w-sm nds-text-body',
                items: [
                  { value: 'item-1', trigger: 'Item 1 — controlado', content: 'Estado gerenciado externamente.' },
                  { value: 'item-2', trigger: 'Item 2 — controlado', content: 'Útil para sincronizar com URL.' },
                ],
              }),
            },
            {
              name: t('variants.items.defaultOpen.label'),
              description: stripHtml(t('variants.items.defaultOpen.description')),
              code: codeSingle,
              previewFactory: () => createAccordion({
                type: 'single', defaultValue: 'item-1', class: 'nds-max-w-sm nds-text-body',
                items: [
                  { value: 'item-1', trigger: 'Item aberto por padrão', content: 'Este item inicia expandido via defaultValue.' },
                  { value: 'item-2', trigger: 'Item fechado por padrão', content: 'Este item inicia colapsado.' },
                ],
              }),
            },
          ],
        });
      }

      case 'composicoes': {
        // ── Helpers locais ───────────────────────────────────────────────
        type IconNode = [string, Record<string, string>];
        const makeIcon = (nodes: IconNode[]): SVGSVGElement => {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('viewBox', '0 0 24 24');
          svg.setAttribute('fill', 'none');
          svg.setAttribute('stroke', 'currentColor');
          svg.setAttribute('stroke-width', '2');
          svg.setAttribute('stroke-linecap', 'round');
          svg.setAttribute('stroke-linejoin', 'round');
          svg.setAttribute('aria-hidden', 'true');
          svg.setAttribute('width', '16');
          svg.setAttribute('height', '16');
          svg.setAttribute('class', 'nds-icon-sm nds-shrink-0');
          for (const [tag, attrs] of nodes) {
            const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
            for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
            svg.appendChild(child);
          }
          return svg;
        };

        const INFO_ICON: IconNode[] = [
          ['circle', { cx: '12', cy: '12', r: '10' }],
          ['line',   { x1: '12', y1: '16', x2: '12', y2: '12' }],
          ['line',   { x1: '12', y1: '8',  x2: '12.01', y2: '8' }],
        ];
        const WARNING_ICON: IconNode[] = [
          ['path', { d: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }],
          ['line', { x1: '12', y1: '9',  x2: '12', y2: '13' }],
          ['line', { x1: '12', y1: '17', x2: '12.01', y2: '17' }],
        ];
        const SUCCESS_ICON: IconNode[] = [
          ['circle', { cx: '12', cy: '12', r: '10' }],
          ['path',   { d: 'm9 12 2 2 4-4' }],
        ];

        const makeIconTrigger = (nodes: IconNode[], text: string): HTMLElement => {
          const span = document.createElement('span');
          span.className = 'nds-cluster';
          span.dataset.spacing = 'xs';
          span.appendChild(makeIcon(nodes));
          const label = document.createElement('span');
          label.textContent = text;
          span.appendChild(label);
          return span;
        };

        // ── Códigos ──────────────────────────────────────────────────────
        const codeIconTrigger =
          `const items = [\n` +
          `  { value: 'info',    label: 'Informação',  nodes: Info },\n` +
          `  { value: 'warning', label: 'Aviso',       nodes: AlertTriangle },\n` +
          `  { value: 'success', label: 'Confirmação', nodes: CheckCircle2 },\n` +
          `];\n` +
          `const accordion = createAccordion({\n` +
          `  type: 'single',\n` +
          `  items: items.map(({ value, label }) => ({ value, trigger: label, content: '...' })),\n` +
          `});\n` +
          `items.forEach(({ value, nodes, label }) => {\n` +
          `  const span = accordion.querySelector(\`[data-value="\${value}"] span\`);\n` +
          `  span?.replaceWith(makeIconTrigger(nodes, label));\n` +
          `});`;

        const codeBadgeTrigger =
          `const items = [\n` +
          `  { value: 'novo', label: 'Novidades da versão 3.0', badge: 'Novo', variant: 'default' },\n` +
          `  { value: 'beta', label: 'Funcionalidades em beta',   badge: 'Beta', variant: 'secondary' },\n` +
          `];\n` +
          `const accordion = createAccordion({\n` +
          `  type: 'single',\n` +
          `  items: items.map(({ value, label }) => ({ value, trigger: label, content: '...' })),\n` +
          `});\n` +
          `items.forEach(({ value, label, badge, variant }) => {\n` +
          `  const span = accordion.querySelector(\`[data-value="\${value}"] span\`);\n` +
          `  const wrapper = document.createElement('span');\n` +
          `  wrapper.className = 'nds-cluster';\n` +
          `  wrapper.dataset.spacing = 'xs';\n` +
          `  wrapper.textContent = label;\n` +
          `  wrapper.appendChild(createBadge({ text: badge, variant }));\n` +
          `  span?.replaceWith(wrapper);\n` +
          `});`;

        const codeRichContent =
          `const accordion = createAccordion({\n` +
          `  type: 'multiple',\n` +
          `  items: [\n` +
          `    { value: 'specs',  trigger: 'Especificações técnicas', content: '' },\n` +
          `    { value: 'inclui', trigger: 'O que está incluso',      content: '' },\n` +
          `  ],\n` +
          `});\n` +
          `const specs = accordion.querySelector('[data-content-for="specs"] div');\n` +
          `if (specs) specs.innerHTML = DOMPurify.sanitize(specsTableHtml);`;

        const codeFAQ =
          `const wrapper = document.createElement('div');\n` +
          `const heading = document.createElement('h2');\n` +
          `heading.textContent = 'Perguntas frequentes';\n` +
          `wrapper.append(heading, createAccordion({\n` +
          `  type: 'single',\n` +
          `  items: [\n` +
          `    { value: 'senha',        trigger: 'Como faço para redefinir minha senha?', content: '...' },\n` +
          `    { value: 'pagamento',    trigger: 'Quais formas de pagamento são aceitas?', content: '...' },\n` +
          `    { value: 'cancelamento', trigger: 'Como cancelo minha assinatura?',         content: '...' },\n` +
          `    { value: 'dados',        trigger: 'Onde encontro meus dados de acesso?',    content: '...' },\n` +
          `  ],\n` +
          `}));`;

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'accordion',
          items: [
            {
              name: t('variants.compositions.iconTrigger.name'),
              description: stripHtml(t('variants.compositions.iconTrigger.description')),
              useWhen: stripHtml(t('variants.compositions.iconTrigger.use')),
              code: codeIconTrigger,
              previewFactory: () => {
                const root = document.createElement('div');
                root.className = 'nds-w-full nds-max-w-lg';
                const iconItems = [
                  { value: 'info',    nodes: INFO_ICON,    label: 'Informação',  content: 'Ícones facilitam a identificação rápida do tipo de conteúdo. Adicione aria-hidden="true" no ícone.' },
                  { value: 'warning', nodes: WARNING_ICON, label: 'Aviso',       content: 'Sinalize categorias distintas com ícones semânticos. O texto do trigger já descreve para leitores de tela.' },
                  { value: 'success', nodes: SUCCESS_ICON, label: 'Confirmação', content: 'Use ícones consistentes entre itens do mesmo accordion para criar padrão visual.' },
                ];
                const accordion = createAccordion({
                  type: 'single', items: iconItems.map(({ value, label, content }) => ({ value, trigger: label, content })),
                });
                iconItems.forEach(({ value, nodes, label }) => {
                  const trigger = accordion.querySelector<HTMLButtonElement>(`[data-value="${value}"]`);
                  const span = trigger?.querySelector('span');
                  if (span) span.replaceWith(makeIconTrigger(nodes, label));
                });
                root.appendChild(accordion);
                return root;
              },
            },
            {
              name: t('variants.compositions.badgeTrigger.name'),
              description: stripHtml(t('variants.compositions.badgeTrigger.description')),
              useWhen: stripHtml(t('variants.compositions.badgeTrigger.use')),
              code: codeBadgeTrigger,
              previewFactory: () => {
                const root = document.createElement('div');
                root.className = 'nds-w-full nds-max-w-lg';
                const badgeItems = [
                  { value: 'novo', label: 'Novidades da versão 3.0', badge: 'Novo', variant: 'default' as const,   content: 'Conteúdo das novidades. Use badges para sinalizar status sem alterar o trigger textual.' },
                  { value: 'beta', label: 'Funcionalidades em beta', badge: 'Beta', variant: 'secondary' as const, content: 'Funcionalidades beta podem mudar. Feedback é bem-vindo.' },
                ];
                const accordion = createAccordion({
                  type: 'single', items: badgeItems.map(({ value, label, content }) => ({ value, trigger: label, content })),
                });
                badgeItems.forEach(({ value, label, badge, variant }) => {
                  const trigger = accordion.querySelector<HTMLButtonElement>(`[data-value="${value}"]`);
                  const span = trigger?.querySelector('span');
                  if (!span) return;
                  const wrapper = document.createElement('span');
                  wrapper.className = 'nds-cluster';
                  wrapper.dataset.spacing = 'xs';
                  wrapper.textContent = label;
                  const badgeEl = createBadge({ text: badge, variant });
                  wrapper.appendChild(badgeEl);
                  span.replaceWith(wrapper);
                });
                root.appendChild(accordion);
                return root;
              },
            },
            {
              name: t('variants.compositions.richContent.name'),
              description: stripHtml(t('variants.compositions.richContent.description')),
              useWhen: stripHtml(t('variants.compositions.richContent.use')),
              code: codeRichContent,
              previewFactory: () => {
                const root = document.createElement('div');
                root.className = 'nds-w-full nds-max-w-lg';
                const accordion = createAccordion({
                  type: 'multiple',
                  items: [
                    { value: 'specs',  trigger: 'Especificações técnicas', content: '' },
                    { value: 'inclui', trigger: 'O que está incluso',      content: '' },
                  ],
                });
                // Tabela de verdade, não grid: `.nds-grid[data-cols="2"]` exige
                // 18rem por coluna e colapsa para uma dentro do accordion. Dado
                // tabular também pede <table> semântico.
                const specsHtml = `
                  <table class="nds-w-full nds-text-body nds-border-collapse">
                    <tbody>
                      <tr class="nds-border-b"><td class="nds-py-1 nds-pr-4">CPU</td><td class="nds-py-1">Intel Core i7-12700</td></tr>
                      <tr class="nds-border-b"><td class="nds-py-1 nds-pr-4">RAM</td><td class="nds-py-1">16GB DDR5</td></tr>
                      <tr><td class="nds-py-1 nds-pr-4">SSD</td><td class="nds-py-1">512GB NVMe</td></tr>
                    </tbody>
                  </table>`;
                const incluiHtml = `
                  <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="xs">
                    <li>Cabo de alimentação</li>
                    <li>Manual do usuário</li>
                    <li>Garantia de 24 meses</li>
                  </ul>`;
                const specsContent = accordion.querySelector<HTMLElement>('[data-content-for="specs"] div');
                if (specsContent) specsContent.innerHTML = DOMPurify.sanitize(specsHtml);
                const incluiContent = accordion.querySelector<HTMLElement>('[data-content-for="inclui"] div');
                if (incluiContent) incluiContent.innerHTML = DOMPurify.sanitize(incluiHtml);
                root.appendChild(accordion);
                return root;
              },
            },
            {
              name: t('variants.compositions.faq.name'),
              description: stripHtml(t('variants.compositions.faq.description')),
              useWhen: stripHtml(t('variants.compositions.faq.use')),
              code: codeFAQ,
              previewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'nds-stack nds-w-full nds-max-w-lg';
                wrapper.dataset.spacing = 'xs';
                const heading = document.createElement('h2');
                heading.className = 'nds-text-base nds-font-semibold';
                heading.textContent = 'Perguntas frequentes';
                wrapper.append(heading, createAccordion({
                  type: 'single', items: [
                    { value: 'senha',        trigger: 'Como faço para redefinir minha senha?', content: 'Acesse a tela de login e clique em "Esqueci minha senha". Você receberá um link de redefinição no email cadastrado, válido por 24 horas.' },
                    { value: 'pagamento',    trigger: 'Quais formas de pagamento são aceitas?', content: 'Aceitamos cartão de crédito, Pix e boleto bancário. Parcelamento disponível em até 12 vezes sem juros no cartão.' },
                    { value: 'cancelamento', trigger: 'Como cancelo minha assinatura?',         content: 'Você pode cancelar a qualquer momento em Configurações → Assinatura. O acesso permanece ativo até o fim do período já pago.' },
                    { value: 'dados',        trigger: 'Onde encontro meus dados de acesso?',    content: 'Seus dados de acesso estão disponíveis em Configurações → Conta.' },
                  ],
                }));
                return wrapper;
              },
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
            { label: t('states.closed.label'),   trigger: toPlainText(t('states.closed.trigger')),   behavior: toPlainText(t('states.closed.behavior')) },
            { label: t('states.open.label'),     trigger: toPlainText(t('states.open.trigger')),     behavior: toPlainText(t('states.open.behavior')) },
            { label: t('states.disabled.label'), trigger: toPlainText(t('states.disabled.trigger')), behavior: toPlainText(t('states.disabled.behavior')) },
            { label: t('states.focused.label'),  trigger: toPlainText(t('states.focused.trigger')),  behavior: toPlainText(t('states.focused.behavior')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `export type AccordionOptions = {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  items: Array<{ value: string; trigger: string; content: string; disabled?: boolean }>;
  class?: string;
  onValueChange?: (value: string | string[]) => void;
};`;

        const propsCols = {
          prop: t('props.accordion.prop'),
          type: t('props.accordion.type'),
          default: t('props.accordion.default'),
          required: t('props.accordion.required'),
          description: t('props.accordion.description'),
        };

        return createDocsProps({
          title: t('props.title'),
          tables: [
            { title: t('props.accordion.title'), cols: propsCols, items: getPropItems('accordion') },
            { title: t('props.item.title'),      cols: propsCols, items: getPropItems('item')      },
            { title: t('props.trigger.title'),   cols: propsCols, items: getPropItems('trigger')   },
            { title: t('props.content.title'),   cols: propsCols, items: getPropItems('content')   },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: stripHtml(t('props.extensibility')),
        });
      }

      case 'tokens': {
        const customizationCode = t('tokens.customizationCode');
        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: getTokenItems(),
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [
            t('accessibility.aria.ariaExpanded'),
            t('accessibility.aria.ariaControls'),
            t('accessibility.aria.hiddenUntilFound'),
            t('accessibility.aria.noRegion'),
          ],
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Tab',       description: t('accessibility.keyboard.tab')       },
            { key: 'Shift+Tab', description: t('accessibility.keyboard.shiftTab')  },
            { key: 'Enter',     description: t('accessibility.keyboard.enter')     },
            { key: 'Space',     description: t('accessibility.keyboard.space')     },
            { key: 'Arrow Down',         description: t('accessibility.keyboard.arrowDown') },
            { key: 'Arrow Up',         description: t('accessibility.keyboard.arrowUp')   },
            { key: 'Home',      description: t('accessibility.keyboard.home')      },
            { key: 'End',       description: t('accessibility.keyboard.end')       },
          ],
          contrast: t('accessibility.contrast'),
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.collapsible.name'), description: toPlainText(t('related.collapsible.description')), path: `?path=/docs/${t('related.collapsible.href')}` },
            { name: t('related.tabs.name'),        description: toPlainText(t('related.tabs.description')),        path: `?path=/docs/${t('related.tabs.href')}`        },
            { name: t('related.sidebar.name'),     description: toPlainText(t('related.sidebar.description')),     path: `?path=/docs/${t('related.sidebar.href')}`     },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [1, 2, 3, 4, 5].map(i => ({ title: '', content: t(`notes.item${i}`) })),
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: t('analytics.table.event'),
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            { event: t('analytics.events.expand.event'),   trigger: toPlainText(t('analytics.events.expand.trigger')),   payload: t('analytics.events.expand.payload')   },
            { event: t('analytics.events.collapse.event'), trigger: toPlainText(t('analytics.events.collapse.trigger')), payload: t('analytics.events.collapse.payload') },
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
              action: toPlainText(t(`testes.functional.item${i}.action`)),
              result: toPlainText(t(`testes.functional.item${i}.result`)),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
              criterion: toPlainText(t(`testes.accessibility.item${i}.criterion`)),
              level: t(`testes.accessibility.item${i}.level`),
              how: t(`testes.accessibility.item${i}.how`),
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
      if (existing && existing.parentNode) {
        existing.replaceWith(fresh);
      } else {
        main.appendChild(fresh);
      }
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
        component_name: 'accordion',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ────────────────────────────────────────────────────────

  renderHeader();
  buildSidebar();
  renderAllSections();

  cleanups.push(subscribe(() => {
    renderHeader();
    buildSidebar();
    renderAllSections();
  }));
  cleanups.push(onLocaleChange(() => {
    renderHeader();
    buildSidebar();
    renderAllSections();
  }));

  // ── Cleanup on disconnect ────────────────────────────────────────────────

  const mo = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      cleanups.forEach(fn => fn());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
