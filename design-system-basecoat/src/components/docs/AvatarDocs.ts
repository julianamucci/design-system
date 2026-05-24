import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { User } from 'lucide';
import {
  createAvatar,
  createAvatarFallback,
  createAvatarImage,
  createAvatarRoot,
} from '@/components/ui/avatar';
import uiTranslations from '@/i18n/ui.json';
import avatarTranslations from '@shared/content/avatar/translations.json';

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
const { t, subscribe } = createTranslation(avatarTranslations as Record<string, unknown>);

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

// Preview image source — same shadcn avatar used across stacks.
const PREVIEW_SRC = 'https://github.com/shadcn.png';

function buildUserIconSvg(): SVGSVGElement {
  type LucideIconNode = [string, Record<string, string>];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'nds-icon nds-text-muted-foreground');

  for (const [tag, attrs] of User as unknown as LucideIconNode[]) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

function buildImageAvatar(className = ''): HTMLElement {
  return createAvatar({
    src: PREVIEW_SRC,
    alt: t('demonstration.labels.withImageAlt'),
    fallbackText: 'MR',
    className,
  });
}

function buildInitialsAvatar(className = '', initials = 'JP'): HTMLElement {
  const root = createAvatarRoot({ className });
  root.appendChild(createAvatarFallback({ text: initials }));
  return root;
}

function buildIconAvatar(className = ''): HTMLElement {
  const root = createAvatarRoot({ className });
  const fallback = createAvatarFallback();
  fallback.setAttribute('aria-label', stripHtml(t('demonstration.labels.withIcon')));
  fallback.appendChild(buildUserIconSvg());
  root.appendChild(fallback);
  return root;
}

function buildGroupAvatar(): HTMLElement {
  const group = document.createElement('div');
  group.style.display = 'flex';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', stripHtml(t('demonstration.labels.groupTitle')));

  const ringStyle = 'box-shadow: 0 0 0 2px var(--background);';
  const applyRing = (el: HTMLElement, offset: boolean) => {
    el.style.cssText += ringStyle;
    if (offset) el.style.marginLeft = '-0.5rem';
  };

  const a1 = createAvatar({
    src: PREVIEW_SRC,
    alt: t('demonstration.labels.withImageAlt'),
    fallbackText: 'MR',
  });
  applyRing(a1, false);
  group.appendChild(a1);

  const initialsA = createAvatarRoot();
  initialsA.appendChild(createAvatarFallback({ text: 'JP' }));
  applyRing(initialsA, true);
  group.appendChild(initialsA);

  const initialsB = createAvatarRoot();
  initialsB.appendChild(createAvatarFallback({ text: 'AL' }));
  applyRing(initialsB, true);
  group.appendChild(initialsB);

  const more = createAvatarRoot();
  more.appendChild(createAvatarFallback({ text: '+3', className: 'nds-text-caption' }));
  applyRing(more, true);
  group.appendChild(more);

  return group;
}

function buildStatusAvatar(): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.display = 'inline-block';

  const avatar = createAvatar({
    src: PREVIEW_SRC,
    alt: t('demonstration.labels.withImageAlt'),
    fallbackText: 'MR',
  });

  const status = document.createElement('span');
  status.className = 'nds-rounded-full nds-bg-primary';
  status.style.cssText = 'position:absolute;bottom:0;right:0;height:0.625rem;width:0.625rem;box-shadow:0 0 0 2px var(--background);';
  status.setAttribute('aria-label', stripHtml(t('demonstration.labels.statusOnline')));

  wrapper.append(avatar, status);
  return wrapper;
}

// ─── createAvatarDocs ─────────────────────────────────────────────────────────

export function createAvatarDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'avatar',
    });
    track('docs_page_view', {
      component_name: 'avatar',
      locale,
      page_title: `${t('title')} · Design System`,
    });
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
      { id: 'variantes',    labelKey: 'nav.variants' },
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
      installNote: 'npx shadcn@latest add avatar',
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
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.className = 'nds-cluster';
            wrap.dataset.justify = 'center';
            wrap.dataset.spacing = 'xl';
            wrap.style.alignItems = 'flex-end';
            wrap.style.flexWrap = 'wrap';

            const withLabel = (child: HTMLElement, labelKey: string): HTMLElement => {
              const item = document.createElement('div');
              item.className = 'nds-stack';
              item.dataset.spacing = 'xs';
              item.style.alignItems = 'center';
              const label = document.createElement('span');
              label.className = 'nds-text-caption nds-text-muted-foreground';
              label.textContent = stripHtml(t(labelKey));
              item.append(child, label);
              return item;
            };

            wrap.append(
              withLabel(buildImageAvatar(),              'demonstration.labels.withImage'),
              withLabel(buildInitialsAvatar('', 'JP'),   'demonstration.labels.withFallback'),
              withLabel(buildIconAvatar(),               'demonstration.labels.withIcon'),
              withLabel(buildGroupAvatar(),              'demonstration.labels.groupTitle'),
              withLabel(buildStatusAvatar(),             'demonstration.labels.statusTitle'),
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
          ],
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [
              t('usage.guidelines.item1'),
              t('usage.guidelines.item2'),
              t('usage.guidelines.item3'),
              t('usage.guidelines.item4'),
            ],
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4].map(i => ({
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
            items: ['alt', 'initials', 'status', 'decorative'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [
              t('usage.do.item1'),
              t('usage.do.item2'),
              t('usage.do.item3'),
              t('usage.do.item4'),
            ],
          },
          dont: {
            title: t('usage.dont.title'),
            items: [
              t('usage.dont.item1'),
              t('usage.dont.item2'),
              t('usage.dont.item3'),
            ],
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
              doPreviewFactory: () => buildImageAvatar(),
              dontPreviewFactory: () => {
                // Avatar sem fallback: apenas <img>, quebra se falhar.
                const root = createAvatarRoot();
                root.appendChild(
                  createAvatarImage({
                    src: 'https://invalid.example.com/broken.png',
                    alt: 'Foto',
                  }),
                );
                return root;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: stripHtml(t('doDont.pair2.do')),
              dontCaption: stripHtml(t('doDont.pair2.dont')),
              doPreviewFactory: () => buildInitialsAvatar('', 'MR'),
              dontPreviewFactory: () => buildInitialsAvatar('', 'mar'),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createAvatar, createAvatarRoot, createAvatarImage, createAvatarFallback } from '@/components/ui/avatar';`,
          secondaryDescription: t('import.withIcon'),
          secondaryCode: `import { createAvatarRoot, createAvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide';

const root = createAvatarRoot();
const fallback = createAvatarFallback();
fallback.setAttribute('aria-label', 'Usuário genérico');
// ...append a User icon SVG to fallback
root.appendChild(fallback);`,
        });

      case 'variantes': {
        const codeImage = `createAvatar({
  src: 'https://github.com/shadcn.png',
  alt: 'Foto de perfil de Maria Rodrigues',
  fallbackText: 'MR',
});`;

        const codeInitials = `const root = createAvatarRoot();
root.appendChild(createAvatarFallback({ text: 'JP' }));`;

        const codeIcon = `const root = createAvatarRoot();
const fallback = createAvatarFallback();
fallback.setAttribute('aria-label', 'Usuário genérico');
// ...append User icon SVG
root.appendChild(fallback);`;

        const codeGroup = `const group = document.createElement('div');
group.style.display = 'flex';
group.setAttribute('role', 'group');
group.setAttribute('aria-label', 'Participantes');

const av = createAvatar({ src, alt, fallbackText: 'MR' });
av.style.cssText = 'box-shadow:0 0 0 2px var(--background);';
group.appendChild(av);`;

        const codeStatus = `const wrapper = document.createElement('div');
wrapper.style.position = 'relative';
wrapper.style.display = 'inline-block';

wrapper.appendChild(createAvatar({ src, alt, fallbackText: 'MR' }));

const status = document.createElement('span');
status.className = 'nds-rounded-full nds-bg-primary';
status.style.cssText = 'position:absolute;bottom:0;right:0;height:0.625rem;width:0.625rem;box-shadow:0 0 0 2px var(--background);';
status.setAttribute('aria-label', 'online');
wrapper.appendChild(status);`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: 'com imagem',
              description: stripHtml(t('variants.items.image')),
              code: codeImage,
              previewFactory: () => buildImageAvatar(),
            },
            {
              name: 'com iniciais',
              description: stripHtml(t('variants.items.initials')),
              code: codeInitials,
              previewFactory: () => buildInitialsAvatar('', 'JP'),
            },
            {
              name: 'com ícone',
              description: stripHtml(t('variants.items.icon')),
              code: codeIcon,
              previewFactory: () => buildIconAvatar(),
            },
            {
              name: 'agrupamento',
              description: stripHtml(t('variants.items.group')),
              code: codeGroup,
              previewFactory: () => buildGroupAvatar(),
            },
            {
              name: 'com status',
              description: stripHtml(t('variants.items.withStatus')),
              code: codeStatus,
              previewFactory: () => buildStatusAvatar(),
            },
          ],
        });
      }

      case 'composicoes':
        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'avatar',
          items: [
            {
              name: t('variants.compositions.withImage.name'),
              description: t('variants.compositions.withImage.description'),
              useWhen: t('variants.compositions.withImage.use'),
              code:
                `const av = createAvatar({\n` +
                `  src: 'https://github.com/shadcn.png',\n` +
                `  alt: 'Foto de perfil de Maria Rodrigues',\n` +
                `  fallbackText: 'MR',\n` +
                `});`,
              previewFactory: () => buildImageAvatar(),
            },
            {
              name: t('variants.compositions.withInitials.name'),
              description: t('variants.compositions.withInitials.description'),
              useWhen: t('variants.compositions.withInitials.use'),
              code:
                `const root = createAvatarRoot();\n` +
                `root.appendChild(createAvatarFallback({ text: 'JP' }));`,
              previewFactory: () => buildInitialsAvatar('', 'JP'),
            },
            {
              name: t('variants.compositions.withIcon.name'),
              description: t('variants.compositions.withIcon.description'),
              useWhen: t('variants.compositions.withIcon.use'),
              code:
                `const root = createAvatarRoot();\n` +
                `const fallback = createAvatarFallback();\n` +
                `fallback.setAttribute('role', 'img');\n` +
                `fallback.setAttribute('aria-label', 'Usuário genérico');\n` +
                `const svg = createUserIconSvg(); // nds-icon nds-text-muted-foreground, aria-hidden\n` +
                `fallback.appendChild(svg);\n` +
                `root.appendChild(fallback);`,
              previewFactory: () => {
                const root = createAvatarRoot();
                const fallback = createAvatarFallback();
                fallback.setAttribute('role', 'img');
                fallback.setAttribute('aria-label', 'Usuário genérico');
                fallback.appendChild(buildUserIconSvg());
                root.appendChild(fallback);
                return root;
              },
            },
            {
              name: t('variants.compositions.group.name'),
              description: t('variants.compositions.group.description'),
              useWhen: t('variants.compositions.group.use'),
              code:
                `const group = document.createElement('div');\n` +
                `group.style.display = 'flex';\n` +
                `group.setAttribute('role', 'group');\n` +
                `group.setAttribute('aria-label', 'Participantes');\n` +
                `const members = [\n` +
                `  { src: 'https://github.com/shadcn.png', alt: 'Foto de perfil de Maria Rodrigues', fallback: 'MR' },\n` +
                `  { alt: '', fallback: 'JP' },\n` +
                `  { alt: '', fallback: 'AL' },\n` +
                `  { alt: '', fallback: '+3' },\n` +
                `];\n` +
                `members.forEach((m, i) => {\n` +
                `  const av = createAvatar({ src: m.src, alt: m.alt, fallbackText: m.fallback });\n` +
                `  av.style.cssText = 'box-shadow:0 0 0 2px var(--background);' + (i > 0 ? 'margin-left:-0.5rem;' : '');\n` +
                `  group.appendChild(av);\n` +
                `});`,
              previewFactory: () => {
                const group = document.createElement('div');
                group.style.display = 'flex';
                group.setAttribute('role', 'group');
                group.setAttribute('aria-label', 'Participantes');
                const members: Array<{ src?: string; alt: string; fallback: string }> = [
                  { src: PREVIEW_SRC, alt: 'Foto de perfil de Maria Rodrigues', fallback: 'MR' },
                  { alt: '', fallback: 'JP' },
                  { alt: '', fallback: 'AL' },
                  { alt: '', fallback: '+3' },
                ];
                members.forEach((m, i) => {
                  const av = createAvatar({
                    src: m.src,
                    alt: m.alt,
                    fallbackText: m.fallback,
                  });
                  av.style.cssText = 'box-shadow:0 0 0 2px var(--background);' + (i > 0 ? 'margin-left:-0.5rem;' : '');
                  group.appendChild(av);
                });
                return group;
              },
            },
            {
              name: t('variants.compositions.withStatus.name'),
              description: t('variants.compositions.withStatus.description'),
              useWhen: t('variants.compositions.withStatus.use'),
              code:
                `const wrapper = document.createElement('div');\n` +
                `wrapper.style.position = 'relative';\n` +
                `wrapper.style.display = 'inline-block';\n` +
                `const av = createAvatar({\n` +
                `  src: 'https://github.com/shadcn.png',\n` +
                `  alt: 'Foto de perfil de Maria Rodrigues',\n` +
                `  fallbackText: 'MR',\n` +
                `});\n` +
                `const status = document.createElement('span');\n` +
                `status.className = 'nds-rounded-full nds-bg-primary';\n` +
                `status.style.cssText = 'position:absolute;bottom:0;right:0;height:0.625rem;width:0.625rem;box-shadow:0 0 0 2px var(--background);';\n` +
                `status.setAttribute('role', 'status');\n` +
                `status.setAttribute('aria-label', 'online');\n` +
                `wrapper.append(av, status);`,
              previewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.style.position = 'relative';
                wrapper.style.display = 'inline-block';
                const av = createAvatar({
                  src: PREVIEW_SRC,
                  alt: 'Foto de perfil de Maria Rodrigues',
                  fallbackText: 'MR',
                });
                const status = document.createElement('span');
                status.className = 'nds-rounded-full nds-bg-primary';
                status.style.cssText = 'position:absolute;bottom:0;right:0;height:0.625rem;width:0.625rem;box-shadow:0 0 0 2px var(--background);';
                status.setAttribute('role', 'status');
                status.setAttribute('aria-label', 'online');
                wrapper.append(av, status);
                return wrapper;
              },
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
            { label: t('states.loaded.label'),  trigger: stripHtml(t('states.loaded.trigger')),  behavior: t('states.loaded.behavior') },
            { label: t('states.loading.label'), trigger: stripHtml(t('states.loading.trigger')), behavior: t('states.loading.behavior') },
            { label: t('states.failed.label'),  trigger: stripHtml(t('states.failed.trigger')),  behavior: t('states.failed.behavior') },
            { label: t('states.noImage.label'), trigger: stripHtml(t('states.noImage.trigger')), behavior: t('states.noImage.behavior') },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createAvatar(options)
export interface AvatarComposedOptions {
  src?: string;
  alt?: string;
  fallbackText?: string;
  className?: string;
}

// createAvatarRoot(options)
export interface AvatarOptions {
  className?: string;
}

// createAvatarImage(options)
export interface AvatarImageOptions {
  src: string;
  alt?: string;
  className?: string;
}

// createAvatarFallback(options)
export interface AvatarFallbackOptions {
  text?: string;
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
              title: t('props.avatarTitle'),
              cols: propsCols,
              items: [
                { name: 'className', type: 'string', defaultValue: '—', required: 'Não', description: stripHtml(t('props.table.className')) },
              ],
            },
            {
              title: t('props.avatarImageTitle'),
              cols: propsCols,
              items: [
                { name: 'src',       type: 'string', defaultValue: '—', required: 'Sim', description: stripHtml(t('props.table.src')) },
                { name: 'alt',       type: 'string', defaultValue: '—', required: 'Sim', description: stripHtml(t('props.table.alt')) },
                { name: 'className', type: 'string', defaultValue: '—', required: 'Não', description: stripHtml(t('props.table.className')) },
              ],
            },
            {
              title: t('props.avatarFallbackTitle'),
              cols: propsCols,
              items: [
                { name: 'text',      type: 'string', defaultValue: '—', required: 'Não', description: stripHtml(t('props.table.children')) },
                { name: 'className', type: 'string', defaultValue: '—', required: 'Não', description: stripHtml(t('props.table.className')) },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibility'),
        });
      }

      case 'tokens': {
        const customizationCode = `/* globals.css */
:root {
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --background: 0 0% 100%;
  --primary: 221.2 83.2% 53.3%;
  --radius: 9999px; /* Avatar sempre rounded-full */
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--muted',            value: 'bg-muted',                 description: stripHtml(t('tokens.table.muted')) },
            { token: '--muted-foreground', value: 'text-muted-foreground',    description: stripHtml(t('tokens.table.mutedForeground')) },
            { token: '--background',       value: 'ring-background',          description: stripHtml(t('tokens.table.background')) },
            { token: '--border',           value: 'border',                   description: stripHtml(t('tokens.table.border')) },
            { token: '--primary',          value: 'bg-primary',               description: stripHtml(t('tokens.table.primary')) },
            { token: '--radius',           value: 'rounded-full',             description: stripHtml(t('tokens.table.radius')) },
            { token: '--ring',             value: 'focus-visible:ring-ring',  description: stripHtml(t('tokens.table.ring')) },
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
            { key: 'Tab', description: 'Foca o Avatar quando ele está dentro de um link ou botão.' },
            { key: 'Enter', description: 'Ativa o link ou botão que envolve o Avatar.' },
            { key: '—', description: 'Avatar isolado não é interativo e não recebe foco.' },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Badge',       description: t('related.badge'),       path: '?path=/docs/ui-badge--docs' },
            { name: 'AspectRatio', description: t('related.aspectRatio'), path: '?path=/docs/ui-aspectratio--docs' },
            { name: 'Tooltip',     description: t('related.tooltip'),     path: '?path=/docs/ui-tooltip--docs' },
            { name: 'Card',        description: t('related.card'),        path: '?path=/docs/ui-card--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
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
            { event: t('analytics.table.profileClick'),  trigger: t('analytics.table.profileClickTrigger'),  payload: t('analytics.table.profileClickPayload') },
            { event: t('analytics.table.pageView'),      trigger: t('analytics.table.pageViewTrigger'),      payload: t('analytics.table.pageViewPayload') },
            { event: t('analytics.table.sectionViewed'), trigger: t('analytics.table.sectionViewedTrigger'), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),    trigger: t('analytics.table.langSwitchTrigger'),    payload: t('analytics.table.langSwitchPayload') },
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
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [1, 2, 3, 4].map(i => ({
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
            items: [1, 2, 3, 4].map(i => ({
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
        component_name: 'avatar',
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
