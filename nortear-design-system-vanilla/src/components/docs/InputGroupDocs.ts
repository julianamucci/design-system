import { Eye, EyeOff, Search } from 'lucide';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import {
  createInputGroup,
  createInputGroupAddon,
  createInputGroupButton,
  createInputGroupInput,
  createInputGroupText,
  createInputGroupTextarea,
  type InputGroupAlign,
} from '@/components/ui/input-group';
import { inputGroupSnippet } from '@/components/ui/input-group.source';
import uiTranslations from '@/i18n/ui.json';
import inputGroupTranslations from '@shared/content/input-group/translations.json';

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

const SLUG = 'input-group';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(inputGroupTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (inputGroupTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale]?.accessibility?.screenReader ?? {},
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// ─── Ícones ───────────────────────────────────────────────────────────────────
//
// Construídos por `createElementNS` a partir da lista `[tag, attrs]` do pacote
// agnóstico `lucide`, e não de um `d` copiado à mão — copiado, ele congela na
// versão do dia. Construir nós é imune a XSS: não há `innerHTML` no caminho.
//
// `aria-hidden` sai daqui, e não do call site: o ícone do addon é decoração, e
// deixar a decisão a cada chamada é como um deles acabaria sem.

const SVG_NS = 'http://www.w3.org/2000/svg';
type LucideIconNode = [string, Record<string, string>];

function createLucideIcon(nodes: LucideIconNode[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const [tag, attrs] of nodes) {
    const child = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

const iconSearch = () => createLucideIcon(Search as unknown as LucideIconNode[]);
const iconReveal = () => createLucideIcon(Eye as unknown as LucideIconNode[]);
const iconHide = () => createLucideIcon(EyeOff as unknown as LucideIconNode[]);

// ─── A moldura, montada com o componente real ─────────────────────────────────

interface AddonDef {
  align: InputGroupAlign;
  text?: string;
  icon?: () => SVGSVGElement;
  button?: { label?: string; accessibleName?: string; child?: SVGSVGElement };
}

interface FrameOptions {
  /** Nome acessível do grupo. Ausente, o grupo NÃO recebe nome — e é o comum. */
  'aria-label'?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  /** Marca o CAMPO como inválido e o liga ao texto que descreve o problema. */
  describedBy?: string;
  /**
   * Nome acessível do CAMPO, para o preview que não tem rótulo visível a que
   * apontar. Não confundir com `aria-label`, que nomeia a MOLDURA: o grupo
   * nomeia o conjunto campo+addons, e nomear o conjunto não nomeia o controle.
   */
  fieldLabel?: string;
  addons?: AddonDef[];
  fieldId?: string;
}

/** Uma moldura com os addons declarados. É o construtor de toda a página. */
function createFrame(options: FrameOptions): HTMLDivElement {
  const group = createInputGroup({ 'aria-label': options['aria-label'] });

  const field = options.multiline
    ? createInputGroupTextarea({
      placeholder: options.placeholder,
      disabled: options.disabled,
      rows: options.rows,
      id: options.fieldId,
    })
    : createInputGroupInput({
      placeholder: options.placeholder,
      disabled: options.disabled,
      id: options.fieldId,
    });

  if (options.fieldLabel) field.setAttribute('aria-label', options.fieldLabel);

  // Estado é palavra, nunca só cor: o atributo vai no CAMPO e aponta para o
  // texto que descreve o problema. A moldura vermelha é o eco disso.
  if (options.describedBy) {
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', options.describedBy);
  }

  const addons = (options.addons ?? []).map((def) => {
    const addon = createInputGroupAddon({ align: def.align });
    if (def.icon) addon.appendChild(def.icon());
    if (def.text) addon.appendChild(createInputGroupText({ text: def.text }));
    if (def.button) {
      addon.appendChild(createInputGroupButton({
        label: def.button.label,
        'aria-label': def.button.accessibleName,
        size: def.button.child ? 'icon-xs' : 'xs',
        children: def.button.child,
      }));
    }
    return addon;
  });

  group.append(...addons.filter((a) => a.dataset.align?.endsWith('start')));
  group.appendChild(field);
  group.append(...addons.filter((a) => a.dataset.align?.endsWith('end')));

  return group;
}

/** Rótulo visível acima da moldura. Quem nomeia o campo é ELE, e não o prefixo. */
function createLabelledFrame(id: string, labelText: string, options: FrameOptions): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack nds-w-full';
  wrapper.dataset.spacing = 'sm';

  const label = document.createElement('label');
  label.className = 'nds-label';
  label.htmlFor = id;
  label.textContent = labelText;

  wrapper.append(label, createFrame({ ...options, fieldId: id }));
  return wrapper;
}

/** Moldura inválida, com o texto do erro FORA dela. */
function createInvalidFrame(id: string, options: FrameOptions): HTMLElement {
  const errorId = `${id}-erro`;
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack nds-w-full';
  wrapper.dataset.spacing = 'sm';

  const message = document.createElement('p');
  message.id = errorId;
  message.className = 'nds-text-caption nds-text-destructive';
  message.textContent = t('demonstration.labels.invalidMsg');

  // Dentro da moldura, o texto herdaria o `cursor: text` do addon e disputaria
  // a largura com o que a pessoa digita.
  wrapper.append(createFrame({ ...options, fieldId: id, describedBy: errorId }), message);
  return wrapper;
}

/**
 * A demonstração: um campo de senha com a alternância no addon final.
 *
 * É a composição que prova a decisão que mais custa quando se erra — o que age
 * dentro da moldura é um BOTÃO, e o que ele fez é contado pela PALAVRA, não
 * pelo desenho do ícone.
 *
 * `location` distingue a demonstração da composição no GA4, e é valor estável:
 * texto traduzido ali partiria um evento em três.
 */
function buildPasswordDemo(location: 'docs_demo' | 'docs_composition'): HTMLElement {
  const id = `input-group-${location}-senha`;
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack nds-w-full';
  wrapper.dataset.spacing = 'sm';

  const label = document.createElement('label');
  label.className = 'nds-label';
  label.htmlFor = id;
  label.textContent = t('demonstration.labels.password');

  const group = createInputGroup({ 'aria-label': t('demonstration.labels.password') });
  const field = createInputGroupInput({ id, type: 'password' });

  const toggle = createInputGroupButton({
    'aria-label': t('demonstration.labels.reveal'),
    size: 'icon-xs',
    children: iconReveal(),
  });
  toggle.addEventListener('click', () => {
    const mostrando = field.type === 'text';
    field.type = mostrando ? 'password' : 'text';
    toggle.setAttribute(
      'aria-label',
      mostrando ? t('demonstration.labels.reveal') : t('demonstration.labels.hide'),
    );
    toggle.replaceChildren(mostrando ? iconReveal() : iconHide());
    track('button_click', {
      component: SLUG,
      variant: mostrando ? 'hide' : 'reveal',
      location,
    });
  });

  const addon = createInputGroupAddon({ align: 'inline-end' });
  addon.appendChild(toggle);

  group.append(field, addon);
  wrapper.append(label, group);
  return wrapper;
}

/** A composição de busca: ícone decorativo antes, atalho em texto depois. */
function buildSearchFrame(): HTMLElement {
  return createFrame({
    'aria-label': t('demonstration.labels.searchGroup'),
    placeholder: t('demonstration.labels.searchField'),
    addons: [
      { align: 'inline-start', icon: iconSearch },
      { align: 'inline-end', text: t('demonstration.labels.shortcut') },
    ],
  });
}

/** A composição de formato: prefixo e sufixo fixos, rótulo visível de fora. */
function buildAffixFrame(id: string): HTMLElement {
  return createLabelledFrame(id, t('demonstration.labels.siteGroup'), {
    placeholder: t('demonstration.labels.siteField'),
    addons: [
      { align: 'inline-start', text: t('demonstration.labels.prefix') },
      { align: 'inline-end', text: '.com' },
    ],
  });
}

/** A composição de área de texto: barra embaixo, e o grupo empilha sozinho. */
function buildTextareaFrame(): HTMLElement {
  return createFrame({
    'aria-label': t('demonstration.labels.note'),
    placeholder: t('demonstration.labels.note'),
    multiline: true,
    rows: 3,
    addons: [
      { align: 'block-end', button: { label: t('demonstration.labels.send') } },
    ],
  });
}

// ─── createInputGroupDocs ─────────────────────────────────────────────────────

export function createInputGroupDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: SLUG,
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: SLUG,
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
      { id: 'importacao',   labelKey: 'nav.import'       },
      { id: 'variantes',    labelKey: 'nav.variants'     },
      { id: 'composicoes',  labelKey: 'nav.compositions' },
      { id: 'estados',      labelKey: 'nav.states'       },
      { id: 'propriedades', labelKey: 'nav.props'        },
      { id: 'tokens',       labelKey: 'nav.tokens'       },
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
    headerSlot.replaceChildren(createDocsHeader({
      title: t('title'),
      description: t('description'),
      category: t('category'),
      type: t('type'),
    }));
  }

  function buildSidebar() {
    pageLayout.rebuildNav(buildNavGroups());
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
          componentSlug: SLUG,
          demoFactory: () => buildPasswordDemo('docs_demo'),
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6].map(i => t(`anatomy.item${i}`)),
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
            items: ['prefix', 'suffix', 'addonButton', 'groupName'].map(key => ({
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
              // O que age é um botão de verdade: recebe foco e tem nome.
              doPreviewFactory: () => createFrame({
                'aria-label': t('demonstration.labels.searchGroup'),
                placeholder: t('demonstration.labels.searchField'),
                addons: [{
                  align: 'inline-end',
                  button: {
                    accessibleName: t('demonstration.labels.clear'),
                    child: iconHide(),
                  },
                }],
              }),
              // O painel "não faça" mostra o FORMATO do defeito sem plantá-lo:
              // o acompanhamento é texto inerte, e a legenda é quem conta que a
              // forma errada é pendurar um clique num bloco desses. Plantar um
              // `onclick` num `<div>` aqui deixaria a própria página de
              // documentação com um controle inalcançável por teclado.
              dontPreviewFactory: () => createFrame({
                placeholder: t('demonstration.labels.searchField'),
                addons: [{ align: 'inline-end', text: t('demonstration.labels.clear') }],
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              // Moldura vermelha E texto ligado ao campo.
              //
              // O `fieldLabel` não é enfeite: descrever um campo sem NOMEÁ-LO é
              // o que o axe chama de `label-title-only`, e a regra dispara
              // justamente pelo `aria-describedby` — é por isso que só este
              // preview acusava, entre vários campos sem rótulo nesta página.
              // Num painel "faça", um campo sem nome contradiz a lição ao lado.
              doPreviewFactory: () => createInvalidFrame('input-group-do-dont-com-texto', {
                placeholder: t('demonstration.labels.siteField'),
                fieldLabel: t('demonstration.labels.siteGroup'),
                addons: [{ align: 'inline-start', text: t('demonstration.labels.prefix') }],
              }),
              // Só a moldura vermelha: quem não distingue a cor não fica
              // sabendo de nada. O atributo está lá — é ele que pinta —, mas
              // não há texto nenhum ligado a ele.
              dontPreviewFactory: () => {
                const group = createFrame({
                  placeholder: t('demonstration.labels.siteField'),
                  addons: [{ align: 'inline-start', text: t('demonstration.labels.prefix') }],
                });
                group.querySelector('.nds-input-group-control')!
                  .setAttribute('aria-invalid', 'true');
                return group;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair3.do')),
              dontCaption: toPlainText(t('doDont.pair3.dont')),
              // Rótulo visível acima; o prefixo só completa o formato.
              doPreviewFactory: () => buildAffixFrame('input-group-do-dont-rotulado'),
              // Sem rótulo: o campo fica sem nome, e `https://` não é o assunto
              // dele. O leitor de tela anuncia só "campo de edição".
              dontPreviewFactory: () => createFrame({
                placeholder: t('demonstration.labels.siteField'),
                addons: [
                  { align: 'inline-start', text: t('demonstration.labels.prefix') },
                  { align: 'inline-end', text: '.com' },
                ],
              }),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: stripHtml(t('description')),
          componentSlug: SLUG,
          code: `import {
  createInputGroup,
  createInputGroupAddon,
  createInputGroupText,
  createInputGroupButton,
  createInputGroupInput,
  createInputGroupTextarea,
} from '@/components/ui/input-group';`,
        });

      case 'variantes': {
        const alinhamentos: Array<{ key: string; align: InputGroupAlign }> = [
          { key: 'inlineStart', align: 'inline-start' },
          { key: 'inlineEnd', align: 'inline-end' },
          { key: 'blockStart', align: 'block-start' },
          { key: 'blockEnd', align: 'block-end' },
        ];

        return createDocsVariants({
          title: t('variants.title'),
          note: t('variants.note'),
          componentSlug: SLUG,
          items: alinhamentos.map(({ key, align }) => {
            const emBloco = align.startsWith('block');
            const addon: AddonDef = emBloco
              ? { align, button: { label: t('demonstration.labels.send') } }
              : { align, text: t('demonstration.labels.prefix') };

            return {
              name: t(`variants.items.${key}.name`),
              description: t(`variants.items.${key}.description`),
              // Chave estável de tracking: o `name` chega traduzido, e sem ela
              // o mesmo botão sairia com um valor por idioma no GA4.
              trackId: key,
              // O mesmo construtor de snippet que alimenta o painel Code das
              // stories: snippet escrito à mão aqui divergiria da demo, e cada
              // metade estaria certa sozinha.
              code: inputGroupSnippet({
                placeholder: t('demonstration.labels.siteField'),
                multiline: emBloco,
                addons: [
                  emBloco
                    ? { align, buttonLabel: t('demonstration.labels.send') }
                    : { align, text: t('demonstration.labels.prefix') },
                ],
              }),
              previewFactory: () => createFrame({
                placeholder: emBloco
                  ? t('demonstration.labels.note')
                  : t('demonstration.labels.siteField'),
                multiline: emBloco,
                rows: 2,
                addons: [addon],
              }),
            };
          }),
        });
      }

      case 'composicoes':
        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          componentSlug: SLUG,
          useWhenLabel: tNav('common.useWhen'),
          items: [
            {
              name: t('variants.compositions.search.name'),
              description: t('variants.compositions.search.description'),
              useWhen: t('variants.compositions.search.use'),
              trackId: 'search',
              code: inputGroupSnippet({
                'aria-label': t('demonstration.labels.searchGroup'),
                placeholder: t('demonstration.labels.searchField'),
                addons: [
                  { align: 'inline-start', icon: 'iconeBusca' },
                  { align: 'inline-end', text: t('demonstration.labels.shortcut') },
                ],
              }),
              previewFactory: buildSearchFrame,
            },
            {
              name: t('variants.compositions.password.name'),
              description: t('variants.compositions.password.description'),
              useWhen: t('variants.compositions.password.use'),
              trackId: 'password',
              code: inputGroupSnippet({
                'aria-label': t('demonstration.labels.password'),
                addons: [{
                  align: 'inline-end',
                  icon: 'iconeMostrar',
                  buttonAccessibleName: t('demonstration.labels.reveal'),
                }],
              }),
              previewFactory: () => buildPasswordDemo('docs_composition'),
            },
            {
              name: t('variants.compositions.affix.name'),
              description: t('variants.compositions.affix.description'),
              useWhen: t('variants.compositions.affix.use'),
              trackId: 'affix',
              code: inputGroupSnippet({
                placeholder: t('demonstration.labels.siteField'),
                addons: [
                  { align: 'inline-start', text: t('demonstration.labels.prefix') },
                  { align: 'inline-end', text: '.com' },
                ],
              }),
              previewFactory: () => buildAffixFrame('input-group-composicao-site'),
            },
            {
              name: t('variants.compositions.textareaToolbar.name'),
              description: t('variants.compositions.textareaToolbar.description'),
              useWhen: t('variants.compositions.textareaToolbar.use'),
              trackId: 'textareaToolbar',
              code: inputGroupSnippet({
                'aria-label': t('demonstration.labels.note'),
                placeholder: t('demonstration.labels.note'),
                multiline: true,
                addons: [{
                  align: 'block-end',
                  buttonLabel: t('demonstration.labels.send'),
                }],
              }),
              previewFactory: buildTextareaFrame,
            },
          ],
        });

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: ['rest', 'focus', 'invalid', 'disabled'].map(key => ({
            label: t(`states.${key}.label`),
            trigger: toPlainText(t(`states.${key}.trigger`)),
            behavior: toPlainText(t(`states.${key}.behavior`)),
          })),
        });

      case 'propriedades': {
        const interfaceCode =
`export interface InputGroupOptions {
  /** Nome acessível do grupo. OPCIONAL — ver a nota sobre nomear o grupo. */
  'aria-label'?: string;
  class?: string;
}

export interface InputGroupAddonOptions {
  align?: 'inline-start' | 'inline-end' | 'block-start' | 'block-end';
  class?: string;
}

export interface InputGroupButtonOptions {
  label?: string;            // texto VISÍVEL
  'aria-label'?: string;     // nome acessível — obrigatório no botão só de ícone
  variant?: ButtonVariant;   // default: 'ghost'
  size?: 'xs' | 'sm' | 'icon-xs' | 'icon-sm';
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
  children?: HTMLElement | SVGElement;
  class?: string;
}

export function createInputGroup(options?: InputGroupOptions): HTMLDivElement;
export function createInputGroupAddon(options?: InputGroupAddonOptions): HTMLDivElement;
export function createInputGroupText(options?: InputGroupTextOptions): HTMLSpanElement;
export function createInputGroupButton(options?: InputGroupButtonOptions): HTMLButtonElement;
export function createInputGroupInput(options?: InputOptions): HTMLInputElement;
export function createInputGroupTextarea(options?: TextareaOptions): HTMLTextAreaElement;`;

        const propsCols = {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        };

        const row = (name: string, key: string, extra = '') => ({
          name,
          type: t(`props.table.${key}.type`),
          defaultValue: t(`props.table.${key}.default`),
          required: t(`props.table.${key}.required`),
          description: toPlainText(t(`props.table.${key}.description`)) + extra,
        });

        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              title: 'createInputGroup(options)',
              cols: propsCols,
              items: [
                row("'aria-label'", 'ariaLabel'),
                row('class', 'class', ' `className` é aceito como apelido; quando os dois vêm, `class` vence.'),
              ],
            },
            {
              title: 'createInputGroupAddon(options)',
              cols: propsCols,
              items: [row('align', 'align'), row('class', 'class')],
            },
            {
              title: 'createInputGroupText(options)',
              cols: propsCols,
              items: [row('text', 'text'), row('class', 'class')],
            },
            {
              title: 'createInputGroupButton(options)',
              cols: propsCols,
              items: [row('size', 'size'), row('variant', 'variant'), row('class', 'class')],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityCode: t('props.extensibilityCode'),
          extensibilityNotes:
            'O campo e a área de texto repassam as opções das fábricas de Input e Textarea, e devolvem o elemento nativo: o que faltar se escreve nele. O estado inválido é do CAMPO, e a moldura só reage a ele.',
        });
      }

      case 'tokens': {
        // Chave do conteúdo → token, conferidos um a um contra a folha
        // `docs/shared/styles/nds/input-group.css`.
        const rows: Array<[string, string]> = [
          ['border', '--input'],
          ['radius', '--radius'],
          ['transition', '--duration-fast'],
          ['ring', '--ring'],
          ['destructive', '--destructive'],
          ['disabledBg', '--muted'],
          ['controlRadius', '--radius-none'],
          ['textareaPadding', '--spacing-2'],
          ['addonPadding', '--spacing-1-5'],
          ['addonGap', '--spacing-2'],
          ['addonSize', '--text-control'],
          ['addonWeight', '--font-weight-medium'],
          ['addonColor', '--muted-foreground'],
          ['addonInline', '--spacing-2'],
          ['addonBlock', '--spacing-2-5'],
          ['iconSize', '--spacing-4'],
          ['buttonRadius', '--radius-md'],
          ['buttonGap', '--spacing-1'],
          ['buttonPadding', '--spacing-1-5'],
        ];

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: rows.map(([key, token]) => ({
            token,
            value: t(`tokens.table.${key}.class`),
            description: toPlainText(t(`tokens.table.${key}.part`)),
          })),
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => stripHtml(t(`accessibility.items.item${i}`))),
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',         description: t('accessibility.keyboard.tab') },
            { key: 'Shift + Tab', description: t('accessibility.keyboard.shiftTab') },
            { key: 'Enter',       description: t('accessibility.keyboard.enter') },
            { key: 'Space',       description: t('accessibility.keyboard.space') },
          ],
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          componentSlug: SLUG,
          items: [
            { name: t('related.items.input.name'),    description: toPlainText(t('related.items.input.description')),    path: '?path=/docs/primitives-form-input--docs' },
            { name: t('related.items.textarea.name'), description: toPlainText(t('related.items.textarea.description')), path: '?path=/docs/primitives-form-textarea--docs' },
            { name: t('related.items.button.name'),   description: toPlainText(t('related.items.button.description')),   path: '?path=/docs/primitives-form-button--docs' },
            { name: t('related.items.form.name'),     description: toPlainText(t('related.items.form.description')),     path: '?path=/docs/primitives-form-form--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          componentSlug: SLUG,
          items: [
            ...[1, 2, 3, 4, 5].map(i => ({ title: '', content: t(`notes.item${i}`) })),
            {
              title: '',
              // Divergência idiomática desta stack: não há componente para
              // compor, há fábrica — e o que ela devolve é o elemento nativo.
              content:
                '<strong>A montagem é por fábrica, e a ordem do DOM é sua.</strong> Cada peça devolve o elemento nativo já com a classe e o <code>data-slot</code> certos; quem os junta é quem compõe. A ordem VISUAL continua sendo da folha, por <code>order</code> em <code>[data-align]</code> — pôr o campo entre os addons no DOM é o que faz a leitura sequencial bater com o desenho.',
            },
            {
              title: '',
              content:
                '<strong>Não há forma declarada para somente-leitura.</strong> A folha compartilhada não desenha esse estado, e inventar aqui uma classe que ela não tem seria cravar o valor. Use o atributo <code>readonly</code> nativo no campo: ele é anunciado pelo leitor de tela e não gasta cor nenhuma.',
            },
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
            { event: 'button_click',        trigger: toPlainText(t('analytics.table.button_click.trigger')),        payload: t('analytics.table.button_click.payload') },
            { event: 'docs_page_view',      trigger: 'Render inicial da docs page',                                  payload: '{ component_name, locale, page_title }' },
            { event: 'docs_section_viewed', trigger: toPlainText(t('analytics.table.docs_section_viewed.trigger')), payload: t('analytics.table.docs_section_viewed.payload') },
          ],
        });

      case 'testes':
        return createDocsTestes({
          title: t('testes.title'),
          functional: {
            title: t('testes.functional.title'),
            description: t('testes.functional.description'),
            cols: {
              action: tNav('common.userAction'),
              result: tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5].map(i => ({
              action: toPlainText(t(`testes.functional.item${i}.action`)),
              result: toPlainText(t(`testes.functional.item${i}.result`)),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            description: t('testes.accessibility.description'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [
              { criterion: t('testes.accessibility.item1'), level: '2.2 AA', how: 'axe-core via Storybook' },
              { criterion: t('testes.accessibility.item2'), level: '4.1.2',  how: 'play (Playground)' },
              { criterion: t('testes.accessibility.item3'), level: '4.1.2',  how: 'play (Playground)' },
              { criterion: t('testes.accessibility.item4'), level: '2.1.1',  how: 'play (Playground)' },
              { criterion: t('testes.accessibility.item5'), level: '1.4.1',  how: 'play (Invalid)' },
              { criterion: t('testes.accessibility.item6'), level: '4.1.3',  how: 'play (Playground)' },
              { criterion: t('testes.accessibility.item7'), level: '1.4.4',  how: 'play (Playground)' },
            ],
          },
          visual: {
            title: t('testes.visual.title'),
            description: t('testes.visual.description'),
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
      (id) => pageLayout.setActiveSection(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: SLUG,
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ───────────────────────────────────────────────────────

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
