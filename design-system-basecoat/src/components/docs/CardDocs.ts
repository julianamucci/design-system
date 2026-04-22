import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import {
  createCard,
  createCardHeader,
  createCardTitle,
  createCardDescription,
  createCardContent,
  createCardFooter,
} from '@/components/ui/card';
import { createButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import cardTranslations from '@shared/content/card/translations.json';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
  createDocsVariants,
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

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(cardTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// ─── Card preview builders ───────────────────────────────────────────────────
//
// Ciência: o vanilla `createCard` atual NÃO suporta:
//   - prop `size` (e portanto não propaga `data-size` nem altera padding/título).
//   - `data-slot="card"` no root (classes modernas Shadcn/Tailwind 4).
//   - `createCardAction` (slot à direita no header via grid `[1fr_auto]`).
//   - detecção automática de CardFooter (pb-0), imagem first/last child, etc.
// Os previews abaixo compõem a API existente (createCard, createCardHeader,
// createCardTitle, createCardDescription, createCardContent, createCardFooter)
// e usam classes Tailwind soltas quando a API não tem primitiva dedicada.

function buildProductCardPreview(): HTMLElement {
  const card = createCard({ className: 'w-full max-w-sm' });

  const header = createCardHeader();
  header.appendChild(createCardTitle({ text: t('demonstration.labels.productTitle'), level: 3 }));
  header.appendChild(createCardDescription({ text: t('demonstration.labels.productDescription') }));

  const content = createCardContent();
  const price = document.createElement('p');
  price.className = 'text-lg font-semibold';
  price.textContent = t('demonstration.labels.productPrice');
  const stock = document.createElement('p');
  stock.className = 'text-sm text-muted-foreground mt-1';
  stock.textContent = t('demonstration.labels.productStock');
  content.append(price, stock);

  const footer = createCardFooter({ className: 'justify-end gap-2' });
  footer.appendChild(
    createButton({
      variant: 'outline',
      label: t('demonstration.labels.actionEdit'),
      ariaLabel: `${t('demonstration.labels.actionEdit')} ${t('demonstration.labels.productTitle')}`,
    }),
  );
  footer.appendChild(
    createButton({
      variant: 'destructive',
      label: t('demonstration.labels.actionDelete'),
      ariaLabel: `${t('demonstration.labels.actionDelete')} ${t('demonstration.labels.productTitle')}`,
    }),
  );

  card.append(header, content, footer);
  return card;
}

function buildProfileCardPreview(): HTMLElement {
  const card = createCard({ className: 'w-full max-w-sm' });
  const header = createCardHeader();
  header.appendChild(createCardTitle({ text: t('demonstration.labels.profileTitle'), level: 3 }));
  header.appendChild(createCardDescription({ text: t('demonstration.labels.profileDescription') }));
  card.appendChild(header);
  return card;
}

function buildMetricCardPreview(): HTMLElement {
  const card = createCard({ className: 'w-full max-w-xs' });
  const header = createCardHeader();
  header.appendChild(createCardTitle({ text: t('demonstration.labels.metricTitle'), level: 3 }));
  const content = createCardContent();
  const value = document.createElement('p');
  value.className = 'text-2xl font-semibold';
  value.textContent = t('demonstration.labels.metricValue');
  const trend = document.createElement('p');
  trend.className = 'text-sm text-muted-foreground mt-1';
  trend.textContent = t('demonstration.labels.metricTrend');
  content.append(value, trend);
  card.append(header, content);
  return card;
}

function buildSmallCardPreview(): HTMLElement {
  // Ciência: vanilla não suporta size="sm"; simulamos compactando via className.
  const card = createCard({ className: 'w-full max-w-xs p-3 gap-2' });
  const header = createCardHeader({ className: 'p-0' });
  header.appendChild(createCardTitle({ text: t('demonstration.labels.metricTitle'), level: 4, className: 'text-sm' }));
  const content = createCardContent({ className: 'p-0' });
  const value = document.createElement('p');
  value.className = 'text-lg font-semibold';
  value.textContent = t('demonstration.labels.metricValue');
  content.appendChild(value);
  card.append(header, content);
  return card;
}

function buildDefaultCardPreview(): HTMLElement {
  return buildProductCardPreview();
}

function buildWithFooterPreview(): HTMLElement {
  return buildProductCardPreview();
}

function buildWithActionPreview(): HTMLElement {
  // Ciência: sem createCardAction; emulamos um slot de ação no header via flex.
  const card = createCard({ className: 'w-full max-w-sm' });

  const header = createCardHeader({ className: 'flex flex-row items-start justify-between' });
  const titleWrap = document.createElement('div');
  titleWrap.className = 'flex flex-col space-y-1.5';
  titleWrap.appendChild(createCardTitle({ text: t('demonstration.labels.metricTitle'), level: 3 }));
  titleWrap.appendChild(createCardDescription({ text: t('demonstration.labels.metricTrend') }));
  header.appendChild(titleWrap);
  header.appendChild(
    createButton({
      variant: 'outline',
      size: 'sm',
      label: t('demonstration.labels.actionEdit'),
      ariaLabel: `${t('demonstration.labels.actionEdit')} ${t('demonstration.labels.metricTitle')}`,
    }),
  );

  const content = createCardContent();
  const value = document.createElement('p');
  value.className = 'text-2xl font-semibold';
  value.textContent = t('demonstration.labels.metricValue');
  content.appendChild(value);

  card.append(header, content);
  return card;
}

function buildWithImagePreview(): HTMLElement {
  // Ciência: sem detecção automática de img-first-child no vanilla. Aplicamos
  // a classe de arredondamento manualmente no <img>.
  const card = createCard({ className: 'w-full max-w-sm p-0' });
  const img = document.createElement('img');
  img.src = 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80';
  img.alt = t('demonstration.labels.productTitle');
  img.className = 'w-full h-40 object-cover rounded-t-md';

  const header = createCardHeader();
  header.appendChild(createCardTitle({ text: t('demonstration.labels.productTitle'), level: 3 }));
  header.appendChild(createCardDescription({ text: t('demonstration.labels.productDescription') }));

  card.append(img, header);
  return card;
}

// ─── createCardDocs ──────────────────────────────────────────────────────────

export function createCardDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'card',
    });
    track('docs_page_view', {
      component_name: 'card',
      locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(
    subscribe(() => {
      cleanupSeo();
      cleanupSeo = updateSeo();
    }),
  );

  // ── Nav groups ───────────────────────────────────────────────────────────

  const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
    {
      labelKey: 'nav.overview',
      sections: [
        { id: 'demonstracao', labelKey: 'nav.demonstration' },
        { id: 'anatomia', labelKey: 'nav.anatomy' },
        { id: 'quando-usar', labelKey: 'nav.usage' },
        { id: 'do-dont', labelKey: 'nav.doDont' },
      ],
    },
    {
      labelKey: 'nav.techRef',
      sections: [
        { id: 'importacao', labelKey: 'nav.import' },
        { id: 'variantes', labelKey: 'nav.variants' },
        { id: 'estados', labelKey: 'nav.states' },
        { id: 'propriedades', labelKey: 'nav.props' },
        { id: 'tokens', labelKey: 'nav.tokens' },
      ],
    },
    {
      labelKey: 'nav.context',
      sections: [
        { id: 'acessibilidade', labelKey: 'nav.accessibility' },
        { id: 'relacionados', labelKey: 'nav.related' },
        { id: 'notas', labelKey: 'nav.notes' },
      ],
    },
    {
      labelKey: 'nav.quality',
      sections: [
        { id: 'analytics', labelKey: 'nav.analytics' },
        { id: 'testes', labelKey: 'nav.testes' },
      ],
    },
  ];

  function buildNavGroups() {
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
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
      installNote: 'npx shadcn@latest add card',
    });
    headerSlot.replaceChildren(header);
  }

  function buildSidebar() {
    pageLayout.rebuildNav(buildNavGroups());
  }

  function updateActiveNav(activeId: string) {
    pageLayout.setActiveSection(activeId);
  }

  // ── Sections (rebuilt on locale change) ───────────────────────────────────

  const sectionOrder = [
    'demonstracao',
    'anatomia',
    'quando-usar',
    'do-dont',
    'importacao',
    'variantes',
    'estados',
    'propriedades',
    'tokens',
    'acessibilidade',
    'relacionados',
    'notas',
    'analytics',
    'testes',
  ] as const;
  type SectionId = (typeof sectionOrder)[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.className = 'w-full flex flex-wrap items-start gap-4';
            wrap.append(buildProductCardPreview(), buildProfileCardPreview(), buildMetricCardPreview());
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6, 7].map((i) => t(`anatomy.item${i}`)),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4, 5].map((i) => t(`usage.guidelines.item${i}`)),
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4, 5, 6].map((i) => ({
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
            items: ['title', 'description', 'action', 'ariaLabel'].map((key) => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3, 4].map((i) => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3, 4].map((i) => t(`usage.dont.item${i}`)),
          },
        });

      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: stripHtml(t('doDont.pair1.do')),
              dontCaption: stripHtml(t('doDont.pair1.dont')),
              doPreviewFactory: () => buildProductCardPreview(),
              dontPreviewFactory: () => {
                const card = createCard({ className: 'w-full max-w-sm' });
                const content = createCardContent({ className: 'p-4' });
                const p = document.createElement('p');
                p.className = 'text-sm text-muted-foreground';
                p.textContent = '—';
                content.appendChild(p);
                card.appendChild(content);
                return card;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: stripHtml(t('doDont.pair2.do')),
              dontCaption: stripHtml(t('doDont.pair2.dont')),
              doPreviewFactory: () => buildProductCardPreview(),
              dontPreviewFactory: () => {
                const card = createCard({ className: 'w-full max-w-sm' });
                const header = createCardHeader();
                header.appendChild(createCardTitle({ text: t('demonstration.labels.productTitle'), level: 3 }));
                const footer = createCardFooter({ className: 'justify-end gap-2' });
                footer.appendChild(createButton({ variant: 'outline', label: t('demonstration.labels.actionEdit') }));
                footer.appendChild(createButton({ variant: 'destructive', label: t('demonstration.labels.actionDelete') }));
                card.append(header, footer);
                return card;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import {
  createCard,
  createCardHeader,
  createCardTitle,
  createCardDescription,
  createCardContent,
  createCardFooter,
} from '@/components/ui/card';`,
          secondaryDescription: t('import.full'),
          secondaryCode: `const card = createCard({ className: 'w-full max-w-sm' });

const header = createCardHeader();
header.appendChild(createCardTitle({ text: 'Cadeira Gamer Pro', level: 3 }));
header.appendChild(createCardDescription({ text: 'Estrutura ergonômica.' }));

const content = createCardContent();
content.textContent = 'R$ 1.299,00';

const footer = createCardFooter({ className: 'justify-end' });
// footer.appendChild(createButton({ ... }))

card.append(header, content, footer);`,
        });

      case 'variantes': {
        // DocsVariants title: "Tamanhos e Composições" conforme translations.
        const codeDefault = `const card = createCard({ className: 'w-full max-w-sm' });
const header = createCardHeader();
header.appendChild(createCardTitle({ text: 'Cadeira Gamer Pro', level: 3 }));
header.appendChild(createCardDescription({ text: 'Descrição curta.' }));
const content = createCardContent();
content.textContent = 'R$ 1.299,00';
card.append(header, content);`;

        const codeSm = `// Ciência: vanilla não suporta prop size. Compacte via className.
const card = createCard({ className: 'w-full max-w-xs p-3 gap-2' });
const header = createCardHeader({ className: 'p-0' });
header.appendChild(createCardTitle({ text: 'Compacto', level: 4, className: 'text-sm' }));`;

        const codeWithFooter = `// Ciência: vanilla NÃO aplica pb-0 automático ao detectar footer.
// O padding do Card já é p-6; mantenha o footer com p-6 pt-0 (default).
const card = createCard();
card.append(header, content, createCardFooter({ className: 'justify-end' }));`;

        const codeWithAction = `// Ciência: sem createCardAction. Emule com flex no CardHeader.
const header = createCardHeader({ className: 'flex flex-row items-start justify-between' });
header.appendChild(titleWrap);
header.appendChild(createButton({ variant: 'outline', size: 'sm', label: 'Editar' }));`;

        const codeWithImage = `// Ciência: vanilla NÃO detecta img-first-child.
// Aplique rounded-t-md + remova padding-top manualmente.
const card = createCard({ className: 'p-0' });
const img = document.createElement('img');
img.src = '/produto.jpg';
img.className = 'w-full h-40 object-cover rounded-t-md';
card.append(img, header);`;

        return createDocsVariants({
          title: t('variants.visualTitle'),
          items: [
            {
              name: 'default',
              description: stripHtml(t('variants.items.default')),
              code: codeDefault,
              previewFactory: () => buildDefaultCardPreview(),
            },
            {
              name: 'sm',
              description: stripHtml(t('variants.items.sm')),
              code: codeSm,
              previewFactory: () => buildSmallCardPreview(),
            },
            {
              name: 'withFooter',
              description: stripHtml(t('variants.items.withFooter')),
              code: codeWithFooter,
              previewFactory: () => buildWithFooterPreview(),
            },
            {
              name: 'withAction',
              description: stripHtml(t('variants.items.withAction')),
              code: codeWithAction,
              previewFactory: () => buildWithActionPreview(),
            },
            {
              name: 'withImage',
              description: stripHtml(t('variants.items.withImage')),
              code: codeWithImage,
              previewFactory: () => buildWithImagePreview(),
            },
          ],
        });
      }

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          items: [
            {
              label: t('states.default.label'),
              trigger: stripHtml(t('states.default.trigger')),
              behavior: stripHtml(t('states.default.behavior')),
            },
            {
              label: t('states.small.label'),
              trigger: stripHtml(t('states.small.trigger')),
              behavior: stripHtml(t('states.small.behavior')),
            },
            {
              label: t('states.interactive.label'),
              trigger: stripHtml(t('states.interactive.trigger')),
              behavior: stripHtml(t('states.interactive.behavior')),
            },
            {
              label: t('states.withImage.label'),
              trigger: stripHtml(t('states.withImage.trigger')),
              behavior: stripHtml(t('states.withImage.behavior')),
            },
            {
              label: t('states.withFooter.label'),
              trigger: stripHtml(t('states.withFooter.trigger')),
              behavior: stripHtml(t('states.withFooter.behavior')),
            },
          ],
        });

      case 'propriedades': {
        // Interface atual da API vanilla (sem size, sem action).
        const interfaceCode = `// Ciência: API vanilla enxuta. Sem prop "size", sem CardAction.
export interface CardOptions          { className?: string; }
export interface CardHeaderOptions    { className?: string; }
export interface CardTitleOptions     { text?: string; level?: 1|2|3|4|5|6; className?: string; }
export interface CardDescriptionOptions { text?: string; className?: string; }
export interface CardContentOptions   { className?: string; }
export interface CardFooterOptions    { className?: string; }`;

        const propsCols = {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        };

        const classNameItem = {
          name: 'className',
          type: 'string',
          defaultValue: '—',
          required: 'Não',
          description: t('props.table.className'),
        };

        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              title: t('props.cardTitle'),
              cols: propsCols,
              items: [
                {
                  name: 'size',
                  type: '— (não implementado)',
                  defaultValue: '—',
                  required: '—',
                  description:
                    'Ciência: a API vanilla atual não expõe prop size. Use className (p-3 + gap-2) para simular o size=sm.',
                },
                classNameItem,
              ],
            },
            {
              title: t('props.headerTitle'),
              cols: propsCols,
              items: [classNameItem],
            },
            {
              title: t('props.cardTitleTitle'),
              cols: propsCols,
              items: [
                { name: 'text', type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.children') },
                {
                  name: 'level',
                  type: '1 | 2 | 3 | 4 | 5 | 6',
                  defaultValue: '3',
                  required: 'Não',
                  description: 'Nível do heading (h1..h6) renderizado pelo CardTitle.',
                },
                classNameItem,
              ],
            },
            {
              title: t('props.descriptionTitle'),
              cols: propsCols,
              items: [
                { name: 'text', type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.children') },
                classNameItem,
              ],
            },
            {
              title: t('props.actionTitle'),
              cols: propsCols,
              items: [
                {
                  name: '—',
                  type: '— (não implementado)',
                  defaultValue: '—',
                  required: '—',
                  description:
                    'Ciência: não existe createCardAction no vanilla. Emule com um flex no CardHeader (items-start justify-between) e coloque o botão como segundo filho.',
                },
              ],
            },
            {
              title: t('props.contentTitle'),
              cols: propsCols,
              items: [classNameItem],
            },
            {
              title: t('props.footerTitle'),
              cols: propsCols,
              items: [classNameItem],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibility'),
        });
      }

      case 'tokens': {
        const customizationCode = `/* Em styles.css — tokens padrão do Card */
:root {
  --radius-card: 0.75rem;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --border: 214 32% 91%;
}

.dark {
  --card: 222 47% 11%;
  --card-foreground: 210 40% 98%;
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--radius-card', value: 'rounded-(--radius-card)', description: t('tokens.table.radiusCard') },
            { token: '--card', value: 'bg-card', description: t('tokens.table.card') },
            { token: '--card-foreground', value: 'text-card-foreground', description: t('tokens.table.cardForeground') },
            { token: '--muted', value: 'bg-muted/50', description: stripHtml(t('tokens.table.muted')) },
            { token: '--muted-foreground', value: 'text-muted-foreground', description: t('tokens.table.mutedForeground') },
            { token: '--foreground', value: 'ring-foreground/10', description: stripHtml(t('tokens.table.foreground')) },
            { token: '--border', value: 'border-t', description: t('tokens.table.border') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: stripHtml(t('accessibility.summary')),
          items: [1, 2, 3, 4, 5].map((i) => t(`accessibility.item${i}`)),
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Tab', description: t('accessibility.keyboard.tab') },
            { key: 'Enter', description: t('accessibility.keyboard.enter') },
            { key: '—', description: t('accessibility.keyboard.noKeyboard') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Separator', description: t('related.separator'), path: '?path=/docs/ui-separator--docs' },
            { name: 'Accordion', description: t('related.accordion'), path: '?path=/docs/ui-accordion--docs' },
            { name: 'Alert', description: t('related.alert'), path: '?path=/docs/ui-alert--docs' },
            { name: 'Button', description: stripHtml(t('related.button')), path: '?path=/docs/ui-button--docs' },
            { name: 'Badge', description: stripHtml(t('related.badge')), path: '?path=/docs/ui-badge--docs' },
            { name: 'Avatar', description: stripHtml(t('related.avatar')), path: '?path=/docs/ui-avatar--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
            { title: '', content: t('notes.tip4') },
          ],
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: t('analytics.table.event'),
            trigger: t('analytics.table.trigger'),
            payload: t('analytics.table.payload'),
          },
          items: [
            {
              event: t('analytics.table.buttonClick'),
              trigger: t('analytics.table.buttonClickTrigger'),
              payload: t('analytics.table.buttonClickPayload'),
            },
            {
              event: t('analytics.table.cardClick'),
              trigger: t('analytics.table.cardClickTrigger'),
              payload: t('analytics.table.cardClickPayload'),
            },
            {
              event: t('analytics.table.pageView'),
              trigger: t('analytics.table.pageViewTrigger'),
              payload: t('analytics.table.pageViewPayload'),
            },
            {
              event: t('analytics.table.sectionViewed'),
              trigger: t('analytics.table.sectionViewedTrigger'),
              payload: t('analytics.table.sectionViewedPayload'),
            },
            {
              event: t('analytics.table.langSwitch'),
              trigger: t('analytics.table.langSwitchTrigger'),
              payload: t('analytics.table.langSwitchPayload'),
            },
          ],
        });

      case 'testes': {
        return createDocsTestes({
          title: t('testes.title'),
          functional: {
            title: t('testes.functional.title'),
            cols: {
              action: tNav('common.userAction'),
              result: tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6].map((i) => ({
              action: stripHtml(t(`testes.functional.item${i}.action`)),
              result: stripHtml(t(`testes.functional.item${i}.result`)),
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
            items: [1, 2, 3, 4, 5, 6].map((i) => ({
              criterion: stripHtml(t(`testes.accessibility.item${i}.criterion`)),
              level: t(`testes.accessibility.item${i}.level`),
              how: stripHtml(t(`testes.accessibility.item${i}.how`)),
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story: tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5].map((i) => ({
              story: stripHtml(t(`testes.visual.item${i}.story`)),
              priority: priorityLabel(t(`testes.visual.item${i}.priority`)),
            })),
          },
        });
      }
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

  let observer: IntersectionObserver | null = null;

  function attachObserver() {
    observer?.disconnect();
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            updateActiveNav(id);
            track('docs_section_viewed', {
              section_id: id,
              component_name: 'card',
              locale: getLocale(),
            });
            break;
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );

    for (const id of sectionOrder) {
      const el = sectionEls[id];
      if (el) observer.observe(el);
    }
  }
  cleanups.push(() => observer?.disconnect());

  // ── Initial render ────────────────────────────────────────────────────────

  renderHeader();
  buildSidebar();
  renderAllSections();

  cleanups.push(
    subscribe(() => {
      renderHeader();
      buildSidebar();
      renderAllSections();
    }),
  );
  cleanups.push(
    onLocaleChange(() => {
      renderHeader();
      buildSidebar();
      renderAllSections();
    }),
  );

  // ── Cleanup on disconnect ────────────────────────────────────────────────

  const mo = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      cleanups.forEach((fn) => fn());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
