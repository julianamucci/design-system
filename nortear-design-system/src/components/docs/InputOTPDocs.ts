import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createInputOTP } from '@/components/ui/input-otp';
import { createButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import inputOtpTranslations from '@shared/content/input-otp/translations.json';

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
const { t, subscribe } = createTranslation(inputOtpTranslations as Record<string, unknown>);

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

// ─── Demo builders ────────────────────────────────────────────────────────────

function buildDemoCell(labelKey: string, factory: () => HTMLElement): HTMLElement {
  const col = document.createElement('div');
  col.className = 'nds-stack';
  col.dataset.spacing = 'sm';
  col.style.contain = 'layout';

  const label = document.createElement('p');
  label.className = 'nds-text-caption nds-font-medium nds-text-muted-foreground';
  label.innerHTML = sanitizeHtml(t(labelKey));

  col.appendChild(label);
  col.appendChild(factory());
  return col;
}

function buildSixDigits(): HTMLElement {
  return createInputOTP({ length: 6 });
}

function buildFourDigits(): HTMLElement {
  return createInputOTP({ length: 4 });
}

function buildWithSeparator(): HTMLElement {
  return createInputOTP({ length: 6, separator: [3] });
}

function buildAlphanumeric(): HTMLElement {
  // Divergência idiomática: factory Nortear suporta apenas dígitos.
  // Renderiza fallback numérico com nota inline.
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack';
  wrapper.dataset.spacing = 'sm';
  const otp = createInputOTP({ length: 6 });
  const note = document.createElement('p');
  note.className = 'nds-text-muted-foreground nds-italic';
  note.style.fontSize = '10px';
  note.textContent = 'Nortear: apenas dígitos (fallback)';
  wrapper.append(otp, note);
  return wrapper;
}

// ─── createInputOTPDocs ───────────────────────────────────────────────────────

export function createInputOTPDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'input-otp',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'input-otp',
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
      installNote: 'npx shadcn@latest add input-otp',
    });
    headerSlot.replaceChildren(header);
  }
  function buildSidebar() { pageLayout.rebuildNav(buildNavGroups()); }
  function updateActiveNav(id: string) { pageLayout.setActiveSection(id); }

  // ── Sections ──────────────────────────────────────────────────────────────
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
            wrap.style.contain = 'layout';
            wrap.className = 'nds-grid nds-w-full';
            wrap.dataset.spacing = 'lg';
            wrap.dataset.min = '18rem';
            wrap.style.minHeight = '160px';
            wrap.appendChild(buildDemoCell('demonstration.labels.sixDigits',     buildSixDigits));
            wrap.appendChild(buildDemoCell('demonstration.labels.fourDigits',    buildFourDigits));
            wrap.appendChild(buildDemoCell('demonstration.labels.withSeparator', buildWithSeparator));
            wrap.appendChild(buildDemoCell('demonstration.labels.alphanumeric',  buildAlphanumeric));
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4].map(i => sanitizeHtml(t(`anatomy.item${i}`))),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4, 5].map(i => sanitizeHtml(t(`usage.guidelines.item${i}`))),
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
            items: ['label', 'helpText', 'errorText', 'resend'].map(key => ({
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
            items: [1, 2, 3, 4].map(i => sanitizeHtml(t(`usage.dont.item${i}`))),
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
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-text-caption nds-font-mono nds-text-muted-foreground';
                wrap.textContent = 'autoComplete="one-time-code"';
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-text-caption nds-font-mono nds-text-muted-foreground nds-italic';
                wrap.textContent = '(sem autoComplete)';
                return wrap;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-text-caption';
                const lbl = document.createElement('p');
                lbl.className = 'nds-text-caption nds-font-medium nds-mb-1';
                lbl.textContent = 'Código de verificação';
                const otp = createInputOTP({ length: 4 });
                wrap.append(lbl, otp);
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-text-caption';
                const otp = createInputOTP({ length: 4 });
                wrap.append(otp);
                return wrap;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { createInputOTP } from '@/components/ui/input-otp';`,
        });

      case 'variantes': {
        const codeSix = `const otp = createInputOTP({ length: 6 });`;
        const codeFour = `const otp = createInputOTP({ length: 4 });`;
        const codeSep = `// separator: array de índices ANTES dos quais inserir o divisor visual.
const otp = createInputOTP({ length: 6, separator: [3] });`;
        const codeAlpha = `// DIVERGÊNCIA IDIOMÁTICA:
// O factory Nortear aceita apenas dígitos (inputMode=numeric, paste filtra \\D).
// 'pattern' alfanumérico não é suportado — use as stacks React/Vue/Svelte
// ou estenda o factory custom em src/components/ui/input-otp.ts.
const otp = createInputOTP({ length: 6 });`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: t('variants.items.sixDigits'),
              description: stripHtml(t('variants.styles.sixDigits')),
              code: codeSix,
              previewFactory: () => buildSixDigits(),
            },
            {
              name: t('variants.items.fourDigits'),
              description: stripHtml(t('variants.styles.fourDigits')),
              code: codeFour,
              previewFactory: () => buildFourDigits(),
            },
            {
              name: t('variants.items.withSeparator'),
              description: stripHtml(t('variants.styles.withSeparator')),
              code: codeSep,
              previewFactory: () => buildWithSeparator(),
            },
            {
              name: t('variants.items.alphanumeric'),
              description:
                stripHtml(t('variants.styles.alphanumeric')) +
                ' (Não suportado pelo factory Nortear — fallback numérico.)',
              code: codeAlpha,
              previewFactory: () => buildAlphanumeric(),
            },
          ],
        });
      }

      case 'composicoes': {
        function setAriaDescribedBy(otp: HTMLElement, id: string): void {
          const inputs = Array.from(otp.querySelectorAll('input')) as HTMLInputElement[];
          for (const input of inputs) input.setAttribute('aria-describedby', id);
        }
        function applyError(otp: HTMLElement): void {
          const inputs = Array.from(otp.querySelectorAll('input')) as HTMLInputElement[];
          for (const input of inputs) {
            input.setAttribute('aria-invalid', 'true');
            input.classList.add('nds-border-destructive', 'ring-destructive/20'); input.style.boxShadow = '0 0 0 2px var(--nds-ring, currentColor)';
          }
        }

        const codeLabel = `const root = document.createElement('div');
root.className = 'nds-stack';
root.dataset.spacing = 'sm';

const label = document.createElement('label');
label.id = 'otp-label';
label.className = 'nds-text-body nds-font-medium';
label.textContent = 'Código de verificação';

const otp = createInputOTP({ length: 6 });
otp.setAttribute('aria-labelledby', 'otp-label');

root.append(label, otp);`;

        const codeHelp = `const root = document.createElement('div');
root.className = 'nds-stack';
root.dataset.spacing = 'sm';

const label = document.createElement('label');
label.className = 'nds-text-body nds-font-medium';
label.textContent = 'Código de verificação';

const otp = createInputOTP({ length: 6 });
// aplicar aria-describedby em cada input interno
otp.querySelectorAll('input').forEach(i => i.setAttribute('aria-describedby', 'otp-help'));

const help = document.createElement('p');
help.id = 'otp-help';
help.className = 'nds-text-caption nds-text-muted-foreground';
help.textContent = 'Enviamos por SMS, expira em 5 min.';

root.append(label, otp, help);`;

        const codeError = `const otp = createInputOTP({ length: 6 });
otp.querySelectorAll('input').forEach(i => {
  i.setAttribute('aria-invalid', 'true');
  i.setAttribute('aria-describedby', 'otp-error');
  i.classList.add('nds-border-destructive');
});

const err = document.createElement('p');
err.id = 'otp-error';
err.className = 'nds-text-caption nds-text-destructive';
err.textContent = 'Código incorreto. Verifique e tente novamente.';`;

        const codeResend = `const otp = createInputOTP({ length: 6 });

const row = document.createElement('div');
row.className = 'nds-cluster';
row.dataset.spacing = 'sm';
row.dataset.align = 'center';
row.dataset.justify = 'between';

const note = document.createElement('p');
note.className = 'nds-text-caption nds-text-muted-foreground';
note.textContent = 'Não recebeu?';

const btn = createButton({ variant: 'link', label: 'Reenviar código' });

row.append(note, btn);`;

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'input-otp',
          items: [
            {
              name: t('variants.compositions.withLabel.name'),
              description: stripHtml(t('variants.compositions.withLabel.description')),
              useWhen: stripHtml(t('variants.compositions.withLabel.use')),
              code: codeLabel,
              previewFactory: () => {
                const root = document.createElement('div');
                root.className = 'nds-stack';
                root.dataset.spacing = 'sm';
                root.style.contain = 'layout';
                const label = document.createElement('label');
                label.id = 'comp-otp-label';
                label.className = 'nds-text-body nds-font-medium';
                label.textContent = 'Código de verificação';
                const otp = createInputOTP({ length: 6 });
                otp.setAttribute('aria-labelledby', 'comp-otp-label');
                root.append(label, otp);
                return root;
              },
            },
            {
              name: t('variants.compositions.withHelpText.name'),
              description: stripHtml(t('variants.compositions.withHelpText.description')),
              useWhen: stripHtml(t('variants.compositions.withHelpText.use')),
              code: codeHelp,
              previewFactory: () => {
                const root = document.createElement('div');
                root.className = 'nds-stack';
                root.dataset.spacing = 'sm';
                root.style.contain = 'layout';
                const label = document.createElement('label');
                label.className = 'nds-text-body nds-font-medium';
                label.textContent = 'Código de verificação';
                const otp = createInputOTP({ length: 6 });
                setAriaDescribedBy(otp, 'comp-otp-help');
                const help = document.createElement('p');
                help.id = 'comp-otp-help';
                help.className = 'nds-text-caption nds-text-muted-foreground';
                help.textContent = 'Enviamos por SMS, expira em 5 min.';
                root.append(label, otp, help);
                return root;
              },
            },
            {
              name: t('variants.compositions.withErrorMessage.name'),
              description: stripHtml(t('variants.compositions.withErrorMessage.description')),
              useWhen: stripHtml(t('variants.compositions.withErrorMessage.use')),
              code: codeError,
              previewFactory: () => {
                const root = document.createElement('div');
                root.className = 'nds-stack';
                root.dataset.spacing = 'sm';
                root.style.contain = 'layout';
                const label = document.createElement('label');
                label.className = 'nds-text-body nds-font-medium';
                label.textContent = 'Código de verificação';
                const otp = createInputOTP({ length: 6 });
                applyError(otp);
                setAriaDescribedBy(otp, 'comp-otp-error');
                const err = document.createElement('p');
                err.id = 'comp-otp-error';
                err.className = 'nds-text-caption nds-text-destructive';
                err.textContent = 'Código incorreto. Verifique e tente novamente.';
                root.append(label, otp, err);
                return root;
              },
            },
            {
              name: t('variants.compositions.withResendButton.name'),
              description: stripHtml(t('variants.compositions.withResendButton.description')),
              useWhen: stripHtml(t('variants.compositions.withResendButton.use')),
              code: codeResend,
              previewFactory: () => {
                const root = document.createElement('div');
                root.className = 'nds-stack';
                root.dataset.spacing = 'sm';
                root.style.contain = 'layout';
                const label = document.createElement('label');
                label.className = 'nds-text-body nds-font-medium';
                label.textContent = 'Código de verificação';
                const otp = createInputOTP({ length: 6 });
                const row = document.createElement('div');
                row.className = 'nds-cluster';
                row.dataset.spacing = 'sm';
                row.dataset.align = 'center';
                row.dataset.justify = 'between';
                const note = document.createElement('p');
                note.className = 'nds-text-caption nds-text-muted-foreground';
                note.textContent = 'Não recebeu?';
                const btn = createButton({ variant: 'link', label: 'Reenviar código' });
                row.append(note, btn);
                root.append(label, otp, row);
                return root;
              },
            },
          ],
        });
      }

      case 'estados': {
        const locale = getLocale();
        const cols = locale === 'en'
          ? { state: 'State',  trigger: 'Trigger', behavior: 'Behavior' }
          : locale === 'es'
          ? { state: 'Estado', trigger: 'Disparo', behavior: 'Comportamiento' }
          : { state: 'Estado', trigger: 'Disparo', behavior: 'Comportamento' };

        return createDocsStates({
          title: t('states.title'),
          cols,
          items: [
            { label: t('states.items.empty'),      trigger: 'inicial',                 behavior: stripHtml(t('states.descriptions.empty'))    },
            { label: t('states.items.filling'),    trigger: 'input em slot',           behavior: stripHtml(t('states.descriptions.filling'))  },
            { label: t('states.items.complete'),   trigger: 'último slot preenchido',  behavior: stripHtml(t('states.descriptions.complete')) },
            { label: t('states.items.disabled'),   trigger: 'prop disabled=true',      behavior: stripHtml(t('states.descriptions.disabled')) },
            { label: t('states.items.error'),      trigger: 'aria-invalid=true',       behavior: stripHtml(t('states.descriptions.error'))    },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createInputOTP(options)
export type InputOTPOptions = {
  length: number;
  separator?: string | number[];
  onComplete?: (value: string) => void;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  class?: string;
};

export function createInputOTP(options: InputOTPOptions): HTMLElement;`;

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
              title: 'createInputOTP(options)',
              cols: propsCols,
              items: [
                { name: 'length',        type: 'number',                          defaultValue: '—',     required: 'Sim', description: 'Número total de slots/caracteres do código.' },
                { name: 'separator',     type: 'string | number[]',               defaultValue: '—',     required: 'Não', description: 'Índices antes dos quais inserir um separator visual; ou string com caractere customizado.' },
                { name: 'onValueChange', type: '(value: string) => void',         defaultValue: '—',     required: 'Não', description: 'Callback chamado a cada alteração do valor.' },
                { name: 'onComplete',    type: '(value: string) => void',         defaultValue: '—',     required: 'Não', description: 'Callback chamado quando todos os slots estão preenchidos.' },
                { name: 'disabled',      type: 'boolean',                         defaultValue: 'false', required: 'Não', description: 'Bloqueia interação e aplica opacity-50.' },
                { name: 'class',         type: 'string',                          defaultValue: '—',     required: 'Não', description: 'Classes adicionais aplicadas ao container.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes:
            t('props.extensibilityCode') +
            '\n\n// NOTA Nortear: props pattern, value, onChange e autoFocus do contrato\n// React/Vue/Svelte não existem no factory custom. Use onValueChange/onComplete\n// e ajuste o filtro de paste para suportar alfanumérico.',
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
          items: [
            { token: 'size',        value: t('tokens.table.slotSize.class'), description: t('tokens.table.slotSize.part') },
            { token: '--input',     value: t('tokens.table.border.class'),   description: t('tokens.table.border.part')   },
            { token: '--radius',    value: t('tokens.table.rounded.class'),  description: t('tokens.table.rounded.part')  },
            { token: '--ring',      value: t('tokens.table.active.class'),   description: t('tokens.table.active.part')   },
            { token: '--destructive', value: t('tokens.table.invalid.class'), description: t('tokens.table.invalid.part') },
            { token: 'opacity',     value: t('tokens.table.disabled.class'), description: t('tokens.table.disabled.part') },
            { token: 'animation',   value: t('tokens.table.caret.class'),    description: t('tokens.table.caret.part')    },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [1, 2, 3, 4, 5, 6].map(i => sanitizeHtml(t(`accessibility.items.item${i}`))),
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',         description: stripHtml(t('accessibility.keyboard.tab'))       },
            { key: '← / →',       description: stripHtml(t('accessibility.keyboard.arrows'))    },
            { key: 'Backspace',   description: stripHtml(t('accessibility.keyboard.backspace')) },
            { key: 'Ctrl/Cmd+V',  description: stripHtml(t('accessibility.keyboard.paste'))     },
            { key: '0-9',         description: stripHtml(t('accessibility.keyboard.digit'))     },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.input.name'),  description: t('related.items.input.description'),  path: '?path=/docs/ui-input--docs'  },
            { name: t('related.items.form.name'),   description: t('related.items.form.description'),   path: '?path=/docs/ui-form--docs'   },
            { name: t('related.items.label.name'),  description: t('related.items.label.description'),  path: '?path=/docs/ui-label--docs'  },
            { name: t('related.items.button.name'), description: t('related.items.button.description'), path: '?path=/docs/ui-button--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [1, 2, 3, 4, 5].map(i => ({ title: '', content: sanitizeHtml(t(`notes.item${i}`)) })),
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: tNav('analytics.table.event') || 'Evento',
            trigger: tNav('analytics.table.trigger') || 'Gatilho',
            payload: tNav('analytics.table.payload') || 'Payload',
          },
          items: [
            {
              event: 'otp_complete',
              trigger: 'onComplete(value)',
              payload: "{ component: 'input-otp', location, length }",
            },
            {
              event: 'otp_paste',
              trigger: 'paste event no input',
              payload: "{ component: 'input-otp', location, length }",
            },
            {
              event: 'otp_resend',
              trigger: 'click no botão Reenviar',
              payload: "{ component: 'input-otp', location }",
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
            items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
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
        component_name: 'input-otp',
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
