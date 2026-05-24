import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import {
  createBreadcrumb,
  createBreadcrumbList,
  createBreadcrumbItem,
  createBreadcrumbLink,
  createBreadcrumbPage,
  createBreadcrumbSeparator,
  createBreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import uiTranslations from '@/i18n/ui.json';
import breadcrumbTranslations from '@shared/content/breadcrumb/translations.json';

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

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(breadcrumbTranslations as Record<string, unknown>);

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

// ─── Breadcrumb preview builders ──────────────────────────────────────────────

type CrumbDef =
  | { type: 'link'; text: string; href: string }
  | { type: 'page'; text: string }
  | { type: 'ellipsis' };

function buildBreadcrumb(crumbs: CrumbDef[], separator: string | HTMLElement = '›'): HTMLElement {
  const nav = createBreadcrumb();
  const list = createBreadcrumbList();

  crumbs.forEach((crumb, index) => {
    const item = createBreadcrumbItem();

    if (crumb.type === 'link') {
      item.appendChild(createBreadcrumbLink({ href: crumb.href, text: crumb.text }));
    } else if (crumb.type === 'page') {
      item.appendChild(createBreadcrumbPage({ text: crumb.text }));
    } else {
      item.appendChild(createBreadcrumbEllipsis({ label: t('demonstration.labels.more') }));
    }

    list.appendChild(item);

    if (index < crumbs.length - 1) {
      const sep =
        typeof separator === 'string'
          ? createBreadcrumbSeparator({ content: separator })
          : createBreadcrumbSeparator({ content: separator.cloneNode(true) as HTMLElement });
      list.appendChild(sep);
    }
  });

  nav.appendChild(list);
  return nav;
}

function buildDefaultBreadcrumb(): HTMLElement {
  return buildBreadcrumb([
    { type: 'link', text: t('demonstration.labels.home'), href: '#' },
    { type: 'link', text: t('demonstration.labels.components'), href: '#' },
    { type: 'page', text: t('demonstration.labels.breadcrumb') },
  ]);
}

function buildWithEllipsisBreadcrumb(): HTMLElement {
  return buildBreadcrumb([
    { type: 'link', text: t('demonstration.labels.home'), href: '#' },
    { type: 'ellipsis' },
    { type: 'link', text: t('demonstration.labels.components'), href: '#' },
    { type: 'page', text: t('demonstration.labels.breadcrumb') },
  ]);
}

function buildCustomSeparatorBreadcrumb(): HTMLElement {
  return buildBreadcrumb(
    [
      { type: 'link', text: t('demonstration.labels.home'), href: '#' },
      { type: 'link', text: t('demonstration.labels.components'), href: '#' },
      { type: 'page', text: t('demonstration.labels.breadcrumb') },
    ],
    '/',
  );
}

function buildResponsiveBreadcrumb(): HTMLElement {
  return buildBreadcrumb([
    { type: 'link', text: t('demonstration.labels.home'), href: '#' },
    { type: 'ellipsis' },
    { type: 'link', text: t('demonstration.labels.guide'), href: '#' },
    { type: 'link', text: t('demonstration.labels.components'), href: '#' },
    { type: 'page', text: t('demonstration.labels.breadcrumb') },
  ]);
}

// ─── createBreadcrumbDocs ─────────────────────────────────────────────────────

export function createBreadcrumbDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'breadcrumb',
    });
    track('docs_page_view', {
      component_name: 'breadcrumb',
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
        { id: 'composicoes', labelKey: 'nav.compositions' },
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

  const pageLayout = createDocsPageLayout({ navGroups: buildNavGroups(), componentSlug: 'breadcrumb' });
  const root = pageLayout.root;
  const headerSlot = pageLayout.headerSlot;
  const main = pageLayout.main;

  function renderHeader() {
    const header = createDocsHeader({
      title: t('title'),
      description: t('description'),
      category: t('category'),
      type: t('type'),
      installNote: 'npx shadcn@latest add breadcrumb',
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
    'composicoes',
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
            wrap.className = 'nds-stack nds-w-full';
            wrap.append(
              buildDefaultBreadcrumb(),
              buildWithEllipsisBreadcrumb(),
              buildCustomSeparatorBreadcrumb(),
            );
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [
            t('anatomy.item1'),
            t('anatomy.item2'),
            t('anatomy.item3'),
            t('anatomy.item4'),
            t('anatomy.item5'),
            t('anatomy.item6'),
            t('anatomy.item7'),
          ],
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
            items: [1, 2, 3, 4, 5].map((i) => ({
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
            items: ['link', 'page', 'separator'].map((key) => ({
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
              doCaption: t('doDont.pair1.do'),
              dontCaption: t('doDont.pair1.dont'),
              doPreviewFactory: () => buildDefaultBreadcrumb(),
              dontPreviewFactory: () =>
                buildBreadcrumb([
                  { type: 'link', text: t('demonstration.labels.home'), href: '#' },
                  { type: 'link', text: t('demonstration.labels.components'), href: '#' },
                  { type: 'link', text: t('demonstration.labels.breadcrumb'), href: '#' },
                ]),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => buildWithEllipsisBreadcrumb(),
              dontPreviewFactory: () =>
                buildBreadcrumb([
                  { type: 'link', text: t('demonstration.labels.home'), href: '#' },
                  { type: 'link', text: t('demonstration.labels.docs'), href: '#' },
                  { type: 'link', text: t('demonstration.labels.guide'), href: '#' },
                  { type: 'link', text: t('demonstration.labels.navigation'), href: '#' },
                  { type: 'link', text: t('demonstration.labels.components'), href: '#' },
                  { type: 'page', text: t('demonstration.labels.breadcrumb') },
                ]),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import {
  createBreadcrumb,
  createBreadcrumbList,
  createBreadcrumbItem,
  createBreadcrumbLink,
  createBreadcrumbPage,
  createBreadcrumbSeparator,
  createBreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';`,
          secondaryDescription: t('import.withEllipsis'),
          secondaryCode: `const nav = createBreadcrumb();
const list = createBreadcrumbList();

const home = createBreadcrumbItem();
home.appendChild(createBreadcrumbLink({ href: '/', text: 'Início' }));
list.appendChild(home);

list.appendChild(createBreadcrumbSeparator());

const ellipsis = createBreadcrumbItem();
ellipsis.appendChild(createBreadcrumbEllipsis({ label: 'Mais páginas' }));
list.appendChild(ellipsis);

list.appendChild(createBreadcrumbSeparator());

const current = createBreadcrumbItem();
current.appendChild(createBreadcrumbPage({ text: 'Breadcrumb' }));
list.appendChild(current);

nav.appendChild(list);`,
        });

      case 'variantes': {
        const codeDefault = `const nav = createBreadcrumb();
const list = createBreadcrumbList();
const home = createBreadcrumbItem();
home.appendChild(createBreadcrumbLink({ href: '#', text: 'Início' }));
const components = createBreadcrumbItem();
components.appendChild(createBreadcrumbLink({ href: '#', text: 'Componentes' }));
const page = createBreadcrumbItem();
page.appendChild(createBreadcrumbPage({ text: 'Breadcrumb' }));
list.append(home, createBreadcrumbSeparator(), components, createBreadcrumbSeparator(), page);
nav.appendChild(list);`;

        const codeEllipsis = `const ellipsisItem = createBreadcrumbItem();
ellipsisItem.appendChild(createBreadcrumbEllipsis({ label: 'Mais páginas' }));
list.append(homeItem, createBreadcrumbSeparator(), ellipsisItem, createBreadcrumbSeparator(), pageItem);`;

        const codeCustomSeparator = `// Separador customizado via option "content"
list.appendChild(createBreadcrumbSeparator({ content: '/' }));
// ou passando um HTMLElement (ícone SVG)
list.appendChild(createBreadcrumbSeparator({ content: svgIcon }));`;

        const codeResponsive = `// No mobile, envolva o ellipsis em um DropdownMenu
// para expor os níveis ocultos ao clique.
const ellipsisItem = createBreadcrumbItem();
ellipsisItem.appendChild(createBreadcrumbEllipsis({ label: 'Mais páginas' }));
// attach DropdownMenu trigger behavior here`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: 'default',
              description: stripHtml(t('variants.items.default')),
              code: codeDefault,
              previewFactory: () => buildDefaultBreadcrumb(),
            },
            {
              name: 'withEllipsis',
              description: stripHtml(t('variants.items.withEllipsis')),
              code: codeEllipsis,
              previewFactory: () => buildWithEllipsisBreadcrumb(),
            },
            {
              name: 'customSeparator',
              description: stripHtml(t('variants.items.customSeparator')),
              code: codeCustomSeparator,
              previewFactory: () => buildCustomSeparatorBreadcrumb(),
            },
            {
              name: 'responsive',
              description: stripHtml(t('variants.items.responsive')),
              code: codeResponsive,
              previewFactory: () => buildResponsiveBreadcrumb(),
            },
          ],
        });
      }

      case 'composicoes':
        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'breadcrumb',
          items: [
            {
              name: t('variants.compositions.default.name'),
              description: t('variants.compositions.default.description'),
              useWhen: t('variants.compositions.default.use'),
              code:
                `const nav = createBreadcrumb();\n` +
                `const list = createBreadcrumbList();\n` +
                `const home = createBreadcrumbItem();\n` +
                `home.appendChild(createBreadcrumbLink({ href: '#', text: 'Início' }));\n` +
                `const components = createBreadcrumbItem();\n` +
                `components.appendChild(createBreadcrumbLink({ href: '#', text: 'Componentes' }));\n` +
                `const current = createBreadcrumbItem();\n` +
                `current.appendChild(createBreadcrumbPage({ text: 'Breadcrumb' }));\n` +
                `list.append(home, createBreadcrumbSeparator(), components, createBreadcrumbSeparator(), current);\n` +
                `nav.appendChild(list);`,
              previewFactory: () => buildDefaultBreadcrumb(),
            },
            {
              name: t('variants.compositions.withEllipsis.name'),
              description: t('variants.compositions.withEllipsis.description'),
              useWhen: t('variants.compositions.withEllipsis.use'),
              code:
                `const nav = createBreadcrumb();\n` +
                `const list = createBreadcrumbList();\n` +
                `const home = createBreadcrumbItem();\n` +
                `home.appendChild(createBreadcrumbLink({ href: '#', text: 'Início' }));\n` +
                `const ellipsis = createBreadcrumbItem();\n` +
                `ellipsis.appendChild(createBreadcrumbEllipsis({ label: 'Mais páginas' }));\n` +
                `const components = createBreadcrumbItem();\n` +
                `components.appendChild(createBreadcrumbLink({ href: '#', text: 'Componentes' }));\n` +
                `const current = createBreadcrumbItem();\n` +
                `current.appendChild(createBreadcrumbPage({ text: 'Breadcrumb' }));\n` +
                `list.append(home, createBreadcrumbSeparator(), ellipsis, createBreadcrumbSeparator(), components, createBreadcrumbSeparator(), current);\n` +
                `nav.appendChild(list);`,
              previewFactory: () => buildWithEllipsisBreadcrumb(),
            },
            {
              name: t('variants.compositions.customSeparator.name'),
              description: t('variants.compositions.customSeparator.description'),
              useWhen: t('variants.compositions.customSeparator.use'),
              code:
                `const nav = createBreadcrumb();\n` +
                `const list = createBreadcrumbList();\n` +
                `const home = createBreadcrumbItem();\n` +
                `home.appendChild(createBreadcrumbLink({ href: '#', text: 'Início' }));\n` +
                `const components = createBreadcrumbItem();\n` +
                `components.appendChild(createBreadcrumbLink({ href: '#', text: 'Componentes' }));\n` +
                `const current = createBreadcrumbItem();\n` +
                `current.appendChild(createBreadcrumbPage({ text: 'Breadcrumb' }));\n` +
                `list.append(home, createBreadcrumbSeparator({ content: '/' }), components, createBreadcrumbSeparator({ content: '/' }), current);\n` +
                `nav.appendChild(list);`,
              previewFactory: () => buildCustomSeparatorBreadcrumb(),
            },
            {
              name: t('variants.compositions.responsive.name'),
              description: t('variants.compositions.responsive.description'),
              useWhen: t('variants.compositions.responsive.use'),
              code:
                `const nav = createBreadcrumb();\n` +
                `const list = createBreadcrumbList();\n` +
                `const home = createBreadcrumbItem();\n` +
                `home.appendChild(createBreadcrumbLink({ href: '#', text: 'Início' }));\n` +
                `const ellipsis = createBreadcrumbItem();\n` +
                `ellipsis.appendChild(createBreadcrumbEllipsis({ label: 'Mais páginas' }));\n` +
                `const guide = createBreadcrumbItem();\n` +
                `guide.appendChild(createBreadcrumbLink({ href: '#', text: 'Guia' }));\n` +
                `const components = createBreadcrumbItem();\n` +
                `components.appendChild(createBreadcrumbLink({ href: '#', text: 'Componentes' }));\n` +
                `const current = createBreadcrumbItem();\n` +
                `current.appendChild(createBreadcrumbPage({ text: 'Breadcrumb' }));\n` +
                `list.append(home, createBreadcrumbSeparator(), ellipsis, createBreadcrumbSeparator(), guide, createBreadcrumbSeparator(), components, createBreadcrumbSeparator(), current);\n` +
                `nav.appendChild(list);`,
              previewFactory: () => buildResponsiveBreadcrumb(),
            },
          ],
        });

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
              label: t('states.simple.label'),
              trigger: stripHtml(t('states.simple.trigger')),
              behavior: stripHtml(t('states.simple.behavior')),
            },
            {
              label: t('states.withEllipsis.label'),
              trigger: stripHtml(t('states.withEllipsis.trigger')),
              behavior: stripHtml(t('states.withEllipsis.behavior')),
            },
            {
              label: t('states.customSeparator.label'),
              trigger: stripHtml(t('states.customSeparator.trigger')),
              behavior: stripHtml(t('states.customSeparator.behavior')),
            },
            {
              label: t('states.asChildLink.label'),
              trigger: stripHtml(t('states.asChildLink.trigger')),
              behavior: stripHtml(t('states.asChildLink.behavior')),
            },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `export interface BreadcrumbOptions {
  label?: string;      // aria-label do <nav> (default: "breadcrumb")
  className?: string;
}

export interface BreadcrumbLinkOptions {
  href: string;        // obrigatório
  text?: string;
  className?: string;
}

export interface BreadcrumbPageOptions {
  text?: string;
  className?: string;
}

export interface BreadcrumbSeparatorOptions {
  content?: string | HTMLElement; // default: "›"
  className?: string;
}

export interface BreadcrumbEllipsisOptions {
  label?: string;      // aria-label (default: "More pages")
  className?: string;
}`;

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
              title: t('props.breadcrumbTitle'),
              cols: propsCols,
              items: [
                { name: 'label', type: 'string', defaultValue: '"breadcrumb"', required: 'Não', description: 'aria-label do <nav>.' },
                { name: 'className', type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.className') },
              ],
            },
            {
              title: t('props.listTitle'),
              cols: propsCols,
              items: [
                { name: 'className', type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.className') },
              ],
            },
            {
              title: t('props.itemTitle'),
              cols: propsCols,
              items: [
                { name: 'className', type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.className') },
              ],
            },
            {
              title: t('props.linkTitle'),
              cols: propsCols,
              items: [
                { name: 'href', type: 'string', defaultValue: '—', required: 'Sim', description: stripHtml(t('props.table.href')) },
                { name: 'text', type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.children') },
                { name: 'className', type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.className') },
              ],
            },
            {
              title: t('props.pageTitle'),
              cols: propsCols,
              items: [
                { name: 'text', type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.children') },
                { name: 'className', type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.className') },
              ],
            },
            {
              title: t('props.separatorTitle'),
              cols: propsCols,
              items: [
                { name: 'content', type: 'string | HTMLElement', defaultValue: '"›"', required: 'Não', description: 'Conteúdo do separador (texto ou ícone).' },
                { name: 'className', type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.className') },
              ],
            },
            {
              title: t('props.ellipsisTitle'),
              cols: propsCols,
              items: [
                { name: 'label', type: 'string', defaultValue: '"More pages"', required: 'Não', description: 'aria-label do ellipsis.' },
                { name: 'className', type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.className') },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibility'),
        });
      }

      case 'tokens': {
        const customizationCode = `/* Em styles.css — customize os tokens do Breadcrumb */
:root {
  --muted-foreground: 215 16% 47%;  /* links inativos */
  --foreground: 222 47% 11%;         /* hover + página atual */
  --ring: 221 83% 53%;               /* focus ring */
}

/* Customize apenas o separador via className */
.my-breadcrumb-separator {
  color: hsl(var(--border));
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--muted-foreground', value: 'text-muted-foreground', description: t('tokens.table.mutedForeground') },
            { token: '--foreground', value: 'text-foreground', description: t('tokens.table.foreground') },
            { token: '--ring', value: 'focus-visible:ring-ring', description: t('tokens.table.ring') },
            { token: 'text-sm', value: 'text-sm', description: t('tokens.table.textSm') },
            { token: 'gap-1.5', value: 'gap-1.5', description: t('tokens.table.gap') },
            { token: 'size-3.5', value: '[&>svg]:size-3.5', description: t('tokens.table.sizeSeparator') },
            { token: 'size-5', value: 'size-5 [&>svg]:size-4', description: t('tokens.table.sizeEllipsis') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [
            t('accessibility.item1'),
            t('accessibility.item2'),
            t('accessibility.item3'),
            t('accessibility.item4'),
            t('accessibility.item5'),
          ],
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Tab', description: t('accessibility.keyboard.tab') },
            { key: 'Enter', description: t('accessibility.keyboard.enter') },
            { key: 'Shift + Tab', description: t('accessibility.keyboard.shiftTab') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'NavigationMenu', description: t('related.navigationMenu'), path: '?path=/docs/ui-navigationmenu--docs' },
            { name: 'Stepper', description: t('related.stepper'), path: '?path=/docs/ui-stepper--docs' },
            { name: 'Tabs', description: t('related.tabs'), path: '?path=/docs/ui-tabs--docs' },
            { name: 'DropdownMenu', description: t('related.dropdownMenu'), path: '?path=/docs/ui-dropdownmenu--docs' },
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
              event: t('analytics.table.navigationClick'),
              trigger: stripHtml(t('analytics.table.navigationClickTrigger')),
              payload: t('analytics.table.navigationClickPayload'),
            },
            {
              event: t('analytics.table.ellipsisOpen'),
              trigger: stripHtml(t('analytics.table.ellipsisOpenTrigger')),
              payload: t('analytics.table.ellipsisOpenPayload'),
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
            items: [1, 2, 3, 4, 5, 6].map((i) => ({
              criterion: t(`testes.accessibility.item${i}.criterion`),
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
            items: [1, 2, 3, 4].map((i) => ({
              story: t(`testes.visual.item${i}.story`),
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

  let activeSectionObserver: { disconnect: () => void } | null = null;

  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as keyof typeof sectionEls] ?? null,
      (id) => updateActiveNav(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'breadcrumb',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

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
