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
    (breadcrumbTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
// O compartilhado explica a integração com roteador pela troca do elemento raiz
// do link. Aqui a factory sempre devolve um `<a href>` pronto — não há elemento
// a substituir. Divergência de API, registrada neste override em vez de virar
// ressalva por stack no texto comum. Nenhuma chave `*Code` passa por aqui.
const { t, subscribe } = createTranslation(breadcrumbTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.extensibility':
      '<code>class</code> — todas as peças aceitam <code>class</code> para customização (<code>className</code> segue aceito como apelido depreciado). Para integração com roteadores, a fábrica do link já devolve um <code>&lt;a&gt;</code> com o <code>href</code> que você passou: intercepte o clique nele e delegue ao roteador, mantendo o endereço real no atributo para abrir em nova aba e para o menu de contexto.',
  },
  en: {
    'props.extensibility':
      '<code>class</code> — every part accepts <code>class</code> for customization (<code>className</code> is still accepted as a deprecated alias). For router integration, the link factory already returns an <code>&lt;a&gt;</code> with the <code>href</code> you passed: intercept the click on it and delegate to the router, keeping the real address in the attribute so open-in-new-tab and the context menu keep working.',
  },
  es: {
    'props.extensibility':
      '<code>class</code> — todas las piezas aceptan <code>class</code> para personalización (<code>className</code> sigue aceptado como alias obsoleto). Para integración con enrutadores, la factory del enlace ya devuelve un <code>&lt;a&gt;</code> con el <code>href</code> que pasaste: intercepta el clic y delega al enrutador, manteniendo la dirección real en el atributo para abrir en pestaña nueva y para el menú contextual.',
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function buildBreadcrumb(
  crumbs: CrumbDef[],
  separator?: string | HTMLElement,
  label?: string,
): HTMLElement {
  // aria-label distinto por instância (landmark-unique): usa a string que já
  // intitula visivelmente o bloco onde o preview aparece.
  const nav = createBreadcrumb(label ? { 'aria-label': label } : {});
  const list = createBreadcrumbList();

  crumbs.forEach((crumb, index) => {
    const item = createBreadcrumbItem();

    if (crumb.type === 'link') {
      const link = createBreadcrumbLink({ href: crumb.href, text: crumb.text });
      link.addEventListener('click', () => {
        track('navigation_click', {
          component: 'breadcrumb',
          label: crumb.text,
          destination: crumb.href,
          location: 'docs_demo',
        });
      });
      item.appendChild(link);
    } else if (crumb.type === 'page') {
      item.appendChild(createBreadcrumbPage({ text: crumb.text }));
    } else {
      item.appendChild(createBreadcrumbEllipsis({ 'aria-label': t('demonstration.labels.more') }));
    }

    list.appendChild(item);

    if (index < crumbs.length - 1) {
      // Sem valor, cai no desenho padrão da factory (ChevronRight), que é o
      // que a anatomia compartilhada documenta. Só o exemplo de separador
      // customizado passa um valor.
      const sep =
        separator === undefined
          ? createBreadcrumbSeparator()
          : typeof separator === 'string'
            ? createBreadcrumbSeparator({ content: separator })
            : createBreadcrumbSeparator({ content: separator.cloneNode(true) as HTMLElement });
      list.appendChild(sep);
    }
  });

  nav.appendChild(list);
  return nav;
}

function buildDefaultBreadcrumb(label?: string): HTMLElement {
  return buildBreadcrumb(
    [
      { type: 'link', text: t('demonstration.labels.home'), href: '#' },
      { type: 'link', text: t('demonstration.labels.components'), href: '#' },
      { type: 'page', text: t('demonstration.labels.breadcrumb') },
    ],
    undefined,
    label,
  );
}

function buildWithEllipsisBreadcrumb(label?: string): HTMLElement {
  return buildBreadcrumb(
    [
      { type: 'link', text: t('demonstration.labels.home'), href: '#' },
      { type: 'ellipsis' },
      { type: 'link', text: t('demonstration.labels.components'), href: '#' },
      { type: 'page', text: t('demonstration.labels.breadcrumb') },
    ],
    undefined,
    label,
  );
}

function buildCustomSeparatorBreadcrumb(label?: string): HTMLElement {
  return buildBreadcrumb(
    [
      { type: 'link', text: t('demonstration.labels.home'), href: '#' },
      { type: 'link', text: t('demonstration.labels.components'), href: '#' },
      { type: 'page', text: t('demonstration.labels.breadcrumb') },
    ],
    '/',
    label,
  );
}

function buildResponsiveBreadcrumb(label?: string): HTMLElement {
  return buildBreadcrumb(
    [
      { type: 'link', text: t('demonstration.labels.home'), href: '#' },
      { type: 'ellipsis' },
      { type: 'link', text: t('demonstration.labels.guide'), href: '#' },
      { type: 'link', text: t('demonstration.labels.components'), href: '#' },
      { type: 'page', text: t('demonstration.labels.breadcrumb') },
    ],
    undefined,
    label,
  );
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
            wrap.className = 'nds-stack nds-w-full';
            // Três instâncias no mesmo bloco: o título da seção sozinho não
            // desambigua — sufixo com o nome visível da variante equivalente.
            wrap.append(
              buildDefaultBreadcrumb(`${t('demonstration.title')} — default`),
              buildWithEllipsisBreadcrumb(`${t('demonstration.title')} — withEllipsis`),
              buildCustomSeparatorBreadcrumb(`${t('demonstration.title')} — customSeparator`),
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
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              doPreviewFactory: () => buildDefaultBreadcrumb(stripHtml(t('doDont.pair1.do'))),
              dontPreviewFactory: () =>
                buildBreadcrumb(
                  [
                    { type: 'link', text: t('demonstration.labels.home'), href: '#' },
                    { type: 'link', text: t('demonstration.labels.components'), href: '#' },
                    { type: 'link', text: t('demonstration.labels.breadcrumb'), href: '#' },
                  ],
                  undefined,
                  toPlainText(t('doDont.pair1.dont')),
                ),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => buildWithEllipsisBreadcrumb(stripHtml(t('doDont.pair2.do'))),
              dontPreviewFactory: () =>
                buildBreadcrumb(
                  [
                    { type: 'link', text: t('demonstration.labels.home'), href: '#' },
                    { type: 'link', text: t('demonstration.labels.docs'), href: '#' },
                    { type: 'link', text: t('demonstration.labels.guide'), href: '#' },
                    { type: 'link', text: t('demonstration.labels.navigation'), href: '#' },
                    { type: 'link', text: t('demonstration.labels.components'), href: '#' },
                    { type: 'page', text: t('demonstration.labels.breadcrumb') },
                  ],
                  undefined,
                  stripHtml(t('doDont.pair2.dont')),
                ),
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
ellipsis.appendChild(createBreadcrumbEllipsis({ 'aria-label': 'Mais páginas' }));
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
ellipsisItem.appendChild(createBreadcrumbEllipsis({ 'aria-label': 'Mais páginas' }));
list.append(homeItem, createBreadcrumbSeparator(), ellipsisItem, createBreadcrumbSeparator(), pageItem);`;

        const codeCustomSeparator = `// Separador customizado via option "content"
list.appendChild(createBreadcrumbSeparator({ content: '/' }));
// ou passando um HTMLElement (ícone SVG)
list.appendChild(createBreadcrumbSeparator({ content: svgIcon }));`;

        const codeResponsive = `// No mobile, envolva o ellipsis em um DropdownMenu
// para expor os níveis ocultos ao clique.
const ellipsisItem = createBreadcrumbItem();
ellipsisItem.appendChild(createBreadcrumbEllipsis({ 'aria-label': 'Mais páginas' }));
// attach DropdownMenu trigger behavior here`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: 'default',
              description: stripHtml(t('variants.items.default')),
              code: codeDefault,
              previewFactory: () => buildDefaultBreadcrumb('default'),
            },
            {
              name: 'withEllipsis',
              description: stripHtml(t('variants.items.withEllipsis')),
              code: codeEllipsis,
              previewFactory: () => buildWithEllipsisBreadcrumb('withEllipsis'),
            },
            {
              name: 'customSeparator',
              description: stripHtml(t('variants.items.customSeparator')),
              code: codeCustomSeparator,
              previewFactory: () => buildCustomSeparatorBreadcrumb('customSeparator'),
            },
            {
              name: 'responsive',
              description: stripHtml(t('variants.items.responsive')),
              code: codeResponsive,
              previewFactory: () => buildResponsiveBreadcrumb('responsive'),
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
            {
              label: t('states.simple.label'),
              trigger: toPlainText(t('states.simple.trigger')),
              behavior: toPlainText(t('states.simple.behavior')),
            },
            {
              label: t('states.asChildLink.label'),
              trigger: toPlainText(t('states.asChildLink.trigger')),
              behavior: toPlainText(t('states.asChildLink.behavior')),
            },
          ],
        });

      case 'propriedades': {
        // A opção de classe é `class` em todas as peças. `className` continua
        // aceito como apelido depreciado; quando os dois vêm, `class` vence.
        const interfaceCode = `export interface BreadcrumbOptions {
  'aria-label'?: string;   // nome do landmark (default: "breadcrumb")
  class?: string;
}

export interface BreadcrumbListOptions { class?: string; }
export interface BreadcrumbItemOptions { class?: string; }

export interface BreadcrumbLinkOptions {
  href: string;        // obrigatório
  text?: string;
  class?: string;
}

export interface BreadcrumbPageOptions {
  text?: string;
  class?: string;
}

export interface BreadcrumbSeparatorOptions {
  content?: string | HTMLElement; // default: ChevronRight
  class?: string;
}

export interface BreadcrumbEllipsisOptions {
  'aria-label'?: string;   // sem rótulo, as reticências ficam decorativas
  class?: string;
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
                { name: 'aria-label', type: 'string', defaultValue: '"breadcrumb"', required: 'Não', description: 'Nome acessível do <nav>. Aceita também o apelido depreciado label; quando os dois vêm, aria-label vence.' },
                { name: 'class', type: 'string', defaultValue: '—', required: 'Não', description: toPlainText(t('props.table.className')) + ' Aceita também o apelido depreciado className; quando os dois vêm, class vence.' },
              ],
            },
            {
              title: t('props.listTitle'),
              cols: propsCols,
              items: [
                { name: 'class', type: 'string', defaultValue: '—', required: 'Não', description: toPlainText(t('props.table.className')) + ' Aceita também o apelido depreciado className; quando os dois vêm, class vence.' },
              ],
            },
            {
              title: t('props.itemTitle'),
              cols: propsCols,
              items: [
                { name: 'class', type: 'string', defaultValue: '—', required: 'Não', description: toPlainText(t('props.table.className')) + ' Aceita também o apelido depreciado className; quando os dois vêm, class vence.' },
              ],
            },
            {
              title: t('props.linkTitle'),
              cols: propsCols,
              items: [
                { name: 'href', type: 'string', defaultValue: '—', required: 'Sim', description: toPlainText(t('props.table.href')) },
                { name: 'text', type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.children') },
                { name: 'class', type: 'string', defaultValue: '—', required: 'Não', description: toPlainText(t('props.table.className')) + ' Aceita também o apelido depreciado className; quando os dois vêm, class vence.' },
              ],
            },
            {
              title: t('props.pageTitle'),
              cols: propsCols,
              items: [
                { name: 'text', type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.children') },
                { name: 'class', type: 'string', defaultValue: '—', required: 'Não', description: toPlainText(t('props.table.className')) + ' Aceita também o apelido depreciado className; quando os dois vêm, class vence.' },
              ],
            },
            {
              title: t('props.separatorTitle'),
              cols: propsCols,
              items: [
                { name: 'content', type: 'string | HTMLElement', defaultValue: 'ChevronRight', required: 'Não', description: 'Conteúdo do separador (texto ou ícone).' },
                { name: 'class', type: 'string', defaultValue: '—', required: 'Não', description: toPlainText(t('props.table.className')) + ' Aceita também o apelido depreciado className; quando os dois vêm, class vence.' },
              ],
            },
            {
              title: t('props.ellipsisTitle'),
              cols: propsCols,
              items: [
                { name: 'aria-label', type: 'string', defaultValue: '—', required: 'Não', description: 'Nome acessível do indicador de níveis ocultos. Com rótulo, as reticências são anunciadas; sem ele, ficam decorativas — que é o certo quando um gatilho as envolve e já carrega o próprio nome. Aceita também o apelido depreciado label; quando os dois vêm, aria-label vence.' },
                { name: 'class', type: 'string', defaultValue: '—', required: 'Não', description: toPlainText(t('props.table.className')) + ' Aceita também o apelido depreciado className; quando os dois vêm, class vence.' },
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

/* Customize apenas o separador via class */
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
            { token: '--muted-foreground', value: '.nds-breadcrumb-list', description: t('tokens.table.mutedForeground') },
            { token: '--foreground', value: '.nds-breadcrumb-link:hover · .nds-breadcrumb-page', description: t('tokens.table.foreground') },
            { token: '--ring', value: '.nds-breadcrumb-link:focus-visible', description: t('tokens.table.ring') },
            { token: '--text-control', value: '.nds-breadcrumb-list', description: t('tokens.table.textSm') },
            { token: '--spacing-1-5', value: '.nds-breadcrumb-list', description: t('tokens.table.gap') },
            { token: '0.875rem', value: '.nds-breadcrumb-separator > svg', description: t('tokens.table.sizeSeparator') },
            { token: '--spacing-4', value: '.nds-breadcrumb-ellipsis > svg', description: t('tokens.table.sizeEllipsis') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
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
            { name: 'NavigationMenu', description: toPlainText(t('related.navigationMenu')), path: '?path=/docs/ui-navigationmenu--docs' },
            { name: 'Stepper', description: toPlainText(t('related.stepper')), path: '?path=/docs/ui-stepper--docs' },
            { name: 'Tabs', description: toPlainText(t('related.tabs')), path: '?path=/docs/ui-tabs--docs' },
            { name: 'DropdownMenu', description: toPlainText(t('related.dropdownMenu')), path: '?path=/docs/ui-dropdownmenu--docs' },
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
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            {
              event: t('analytics.table.navigationClick'),
              trigger: toPlainText(t('analytics.table.navigationClickTrigger')),
              payload: t('analytics.table.navigationClickPayload'),
            },
            {
              event: t('analytics.table.ellipsisOpen'),
              trigger: toPlainText(t('analytics.table.ellipsisOpenTrigger')),
              payload: t('analytics.table.ellipsisOpenPayload'),
            },
            {
              event: t('analytics.table.pageView'),
              trigger: toPlainText(t('analytics.table.pageViewTrigger')),
              payload: t('analytics.table.pageViewPayload'),
            },
            {
              event: t('analytics.table.sectionViewed'),
              trigger: toPlainText(t('analytics.table.sectionViewedTrigger')),
              payload: t('analytics.table.sectionViewedPayload'),
            },
            {
              event: t('analytics.table.langSwitch'),
              trigger: toPlainText(t('analytics.table.langSwitchTrigger')),
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
              result: toPlainText(t(`testes.functional.item${i}.result`)),
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
              criterion: toPlainText(t(`testes.accessibility.item${i}.criterion`)),
              level: t(`testes.accessibility.item${i}.level`),
              how: toPlainText(t(`testes.accessibility.item${i}.how`)),
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
