import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createInput } from '@/components/ui/input';
import uiTranslations from '@/i18n/ui.json';
import inputTranslations from '@shared/content/input/translations.json';

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

// ─── Tokens do campo ──────────────────────────────────────────────────────────
//
// Token, seletor que o consome e a chave de conteúdo que o descreve. Cada linha
// foi medida com getComputedStyle antes de entrar aqui — a tabela é o que quem
// customiza copia, e a versão anterior mandava sobrescrever `--height-default` e
// `--radius-input`, dois tokens que `.nds-input` não lê. Não existe token de
// ALTURA: ela nasce de `--spacing-2` mais `--text-control` (WCAG 1.4.4).
const FIELD_TOKENS: readonly (readonly [string, string, string])[] = [
  ['--input', '.nds-input', 'border'],
  ['--ring', '.nds-input:hover', 'borderHover'],
  ['--ring', '.nds-input:focus-visible', 'borderFocus'],
  ['--destructive', '.nds-input[aria-invalid="true"]', 'borderError'],
  ['--background', '.nds-input', 'background'],
  ['--foreground', '.nds-input', 'text'],
  ['--muted-foreground', '.nds-input::placeholder', 'placeholder'],
  ['--muted', '.nds-input:disabled', 'bgDisabled'],
  ['--radius', '.nds-input', 'radius'],
  ['--spacing-2', '.nds-input', 'paddingBlock'],
  ['--text-control', '.nds-input', 'fontSize'],
  ['--muted', '.nds-input[type="file"]::file-selector-button', 'fileButton'],
] as const;

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (inputTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(inputTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

let demoInputUid = 0;

function buildDemoInput(opts: {
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  ariaInvalid?: boolean;
  labelText?: string;
  errorText?: string;
  /** Quando definido, dispara field_focus/field_blur nas interações reais do campo. */
  fieldName?: string;
}): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack nds-w-full';
  wrapper.dataset.spacing = 'xs';

  // id/htmlFor explícitos: sem o par, o <label> não nomeia o <input> (axe: label).
  const inputId = `demo-input-${++demoInputUid}`;

  if (opts.labelText) {
    const label = document.createElement('label');
    label.className = 'nds-text-body nds-font-medium';
    label.textContent = opts.labelText;
    label.htmlFor = inputId;
    wrapper.appendChild(label);
  }

  const input = createInput({
    type: opts.type ?? 'text',
    placeholder: opts.placeholder,
    disabled: opts.disabled,
    id: inputId,
  });
  if (!opts.labelText) input.setAttribute('aria-label', opts.placeholder ?? '');

  if (opts.ariaInvalid) {
    input.setAttribute('aria-invalid', 'true');
  }

  if (opts.fieldName && !opts.disabled) {
    const fieldName = opts.fieldName;
    input.addEventListener('focus', () => {
      track('field_focus', { component: 'input', field_name: fieldName, location: 'docs_demo' });
    });
    input.addEventListener('blur', () => {
      if (input.value.length > 0) {
        track('field_blur', { component: 'input', field_name: fieldName, location: 'docs_demo' });
      }
    });
  }

  wrapper.appendChild(input);

  if (opts.errorText) {
    const error = document.createElement('p');
    error.className = 'nds-text-caption nds-text-destructive';
    error.textContent = opts.errorText;
    wrapper.appendChild(error);
  }

  return wrapper;
}

// ─── createInputDocs ──────────────────────────────────────────────────────────

export function createInputDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'input',
    });
    track('docs_page_view', { component_name: 'input', locale, page_title: `${t('title')} · Design System` });
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
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.className = 'nds-w-full nds-max-w-sm nds-stack';
            wrap.dataset.spacing = 'md';

            wrap.appendChild(buildDemoInput({
              type: 'text',
              labelText: t('demonstration.labels.defaultLabel'),
              placeholder: t('demonstration.labels.defaultPlaceholder'),
              fieldName: 'default',
            }));
            wrap.appendChild(buildDemoInput({
              type: 'email',
              labelText: t('demonstration.labels.emailLabel'),
              placeholder: t('demonstration.labels.emailPlaceholder'),
              fieldName: 'email',
            }));
            wrap.appendChild(buildDemoInput({
              type: 'password',
              labelText: t('demonstration.labels.passwordLabel'),
              placeholder: t('demonstration.labels.passwordPlaceholder'),
              fieldName: 'password',
            }));
            wrap.appendChild(buildDemoInput({
              type: 'text',
              labelText: t('demonstration.labels.disabledLabel'),
              placeholder: t('demonstration.labels.disabledPlaceholder'),
              disabled: true,
            }));
            wrap.appendChild(buildDemoInput({
              type: 'email',
              labelText: t('demonstration.labels.errorLabel'),
              placeholder: t('demonstration.labels.errorPlaceholder'),
              ariaInvalid: true,
              errorText: t('demonstration.labels.errorMessage'),
              fieldName: 'error',
            }));

            return wrap;
          },
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
            items: [
              t('usage.guidelines.item1'),
              t('usage.guidelines.item2'),
              t('usage.guidelines.item3'),
              t('usage.guidelines.item4'),
              t('usage.guidelines.item5'),
            ],
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              s: t(`usage.scenarios.item${i}.s`),
              u: t(`usage.scenarios.item${i}.u`),
              a: t(`usage.scenarios.item${i}.a`),
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
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              doPreviewFactory: () => buildDemoInput({
                type: 'email',
                labelText: 'Email',
                placeholder: 'ex: joao@empresa.com',
              }),
              dontPreviewFactory: () => buildDemoInput({
                type: 'email',
                labelText: 'Email',
                placeholder: 'Digite seu email',
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => buildDemoInput({
                type: 'email',
                labelText: 'Email',
                placeholder: 'ex: joao@empresa.com',
              }),
              dontPreviewFactory: () => buildDemoInput({
                type: 'text',
                labelText: 'Email',
                placeholder: 'ex: joao@empresa.com',
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair3.do')),
              dontCaption: toPlainText(t('doDont.pair3.dont')),
              doPreviewFactory: () => buildDemoInput({
                type: 'text',
                labelText: 'Nome completo',
                placeholder: 'ex: João da Silva',
              }),
              dontPreviewFactory: () => {
                // Anti-padrão proposital (placeholder no lugar do label); o nome
                // acessível vem do aria-label para não quebrar o axe da página.
                const input = createInput({ type: 'text', placeholder: 'Nome completo' });
                input.setAttribute('aria-label', 'Nome completo');
                return input;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createInput } from '@/components/ui/input';`,
        });

      case 'variantes': {
        const codeText = `const input = createInput({ type: 'text', placeholder: 'ex: João da Silva' });`;
        const codeEmail = `const input = createInput({ type: 'email', placeholder: 'ex: joao@empresa.com' });`;
        const codePassword = `const input = createInput({ type: 'password', placeholder: '••••••••' });`;
        const codeNumber = `const input = createInput({ type: 'number', placeholder: '0' });`;
        const codeFile = `const input = createInput({ type: 'file' });`;

        // Previews de tipo não têm label visível (o card já é o rótulo visual);
        // o nome acessível vem do aria-label — sem ele o axe acusa `label`.
        const typePreview = (options: Parameters<typeof createInput>[0], ariaLabel: string) => {
          const input = createInput(options);
          input.setAttribute('aria-label', ariaLabel);
          return input;
        };

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: 'text',
              description: stripHtml(t('variants.items.types.text')),
              code: codeText,
              previewFactory: () => typePreview(
                { type: 'text', placeholder: 'ex: João da Silva' },
                t('demonstration.labels.defaultLabel'),
              ),
            },
            {
              name: 'email',
              description: stripHtml(t('variants.items.types.email')),
              code: codeEmail,
              previewFactory: () => typePreview(
                { type: 'email', placeholder: 'ex: joao@empresa.com' },
                t('demonstration.labels.emailLabel'),
              ),
            },
            {
              name: 'password',
              description: stripHtml(t('variants.items.types.password')),
              code: codePassword,
              previewFactory: () => typePreview(
                { type: 'password', placeholder: '••••••••' },
                t('demonstration.labels.passwordLabel'),
              ),
            },
            {
              name: 'number',
              description: stripHtml(t('variants.items.types.number')),
              code: codeNumber,
              previewFactory: () => typePreview(
                { type: 'number', placeholder: '0' },
                // sem chave de label própria no bloco — usa o nome do tipo do card
                'number',
              ),
            },
            {
              name: 'file',
              description: stripHtml(t('variants.items.types.file')),
              code: codeFile,
              previewFactory: () => typePreview(
                { type: 'file' },
                t('demonstration.labels.fileLabel'),
              ),
            },
          ],
        });
      }

      case 'composicoes': {
        const codeWithLabel =
          `const wrapper = document.createElement('div');\n` +
          `wrapper.className = 'nds-stack nds-w-full nds-max-w-sm';\n` +
          `const label = document.createElement('label');\n` +
          `label.htmlFor = 'input-nome';\n` +
          `label.className = 'nds-text-body nds-font-medium';\n` +
          `label.textContent = 'Nome completo';\n` +
          `const input = createInput({ type: 'text', id: 'input-nome', placeholder: 'ex: João da Silva' });\n` +
          `wrapper.append(label, input);`;

        const codeWithHint =
          `const wrapper = document.createElement('div');\n` +
          `wrapper.className = 'nds-stack nds-w-full nds-max-w-sm';\n` +
          `const label = document.createElement('label');\n` +
          `label.htmlFor = 'input-email';\n` +
          `label.className = 'nds-text-body nds-font-medium';\n` +
          `label.textContent = 'Email';\n` +
          `const input = createInput({ type: 'email', id: 'input-email', placeholder: 'ex: joao@empresa.com' });\n` +
          `const hint = document.createElement('p');\n` +
          `hint.className = 'nds-text-caption nds-text-muted-foreground';\n` +
          `hint.textContent = 'Usaremos seu email apenas para contato.';\n` +
          `wrapper.append(label, input, hint);`;

        const codeWithError =
          `const wrapper = document.createElement('div');\n` +
          `wrapper.className = 'nds-stack nds-w-full nds-max-w-sm';\n` +
          `const label = document.createElement('label');\n` +
          `label.htmlFor = 'input-email-err';\n` +
          `label.className = 'nds-text-body nds-font-medium';\n` +
          `label.textContent = 'Email';\n` +
          `const input = createInput({ type: 'email', id: 'input-email-err', placeholder: 'ex: joao@empresa.com' });\n` +
          `input.setAttribute('aria-invalid', 'true');\n` +
          `input.setAttribute('aria-describedby', 'input-email-err-msg');\n` +
          `const error = document.createElement('p');\n` +
          `error.id = 'input-email-err-msg';\n` +
          `error.className = 'nds-text-caption nds-text-destructive';\n` +
          `error.textContent = 'Informe um email válido.';\n` +
          `wrapper.append(label, input, error);`;

        const codeWithPrefix =
          `const wrapper = document.createElement('div');\n` +
          `wrapper.className = 'nds-stack nds-w-full nds-max-w-sm';\n` +
          `const label = document.createElement('label');\n` +
          `label.htmlFor = 'input-url';\n` +
          `label.className = 'nds-text-body nds-font-medium';\n` +
          `label.textContent = 'URL do site';\n` +
          `const row = document.createElement('div');\n` +
          `row.className = 'nds-input-group';\n` +
          `const prefix = document.createElement('span');\n` +
          `prefix.className = 'nds-input-group-addon';\n` +
          `prefix.dataset.align = 'inline-start';\n` +
          `prefix.textContent = 'https://';\n` +
          `const input = createInput({ type: 'url', id: 'input-url', placeholder: 'meusite.com' });\n` +
          `// classList.add, nunca className=: substituir apagaria .nds-input\n` +
          `input.classList.add('nds-input-group-control');\n` +
          `input.dataset.slot = 'input-group-control';   // o anel de foco é do GRUPO\n` +
          `row.append(prefix, input);\n` +
          `wrapper.append(label, row);`;

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'input',
          items: [
            {
              name: t('variants.compositions.withLabel.name'),
              description: t('variants.compositions.withLabel.description'),
              useWhen: t('variants.compositions.withLabel.use'),
              code: codeWithLabel,
              previewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'nds-stack nds-w-full nds-max-w-sm';
                wrapper.dataset.spacing = 'xs';
                const label = document.createElement('label');
                label.htmlFor = 'input-nome';
                label.className = 'nds-text-body nds-font-medium';
                label.textContent = 'Nome completo';
                const input = createInput({ type: 'text', id: 'input-nome', placeholder: 'ex: João da Silva' });
                wrapper.append(label, input);
                return wrapper;
              },
            },
            {
              name: t('variants.compositions.withHint.name'),
              description: t('variants.compositions.withHint.description'),
              useWhen: t('variants.compositions.withHint.use'),
              code: codeWithHint,
              previewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'nds-stack nds-w-full nds-max-w-sm';
                wrapper.dataset.spacing = 'xs';
                const label = document.createElement('label');
                label.htmlFor = 'input-email';
                label.className = 'nds-text-body nds-font-medium';
                label.textContent = 'Email';
                const input = createInput({ type: 'email', id: 'input-email', placeholder: 'ex: joao@empresa.com' });
                const hint = document.createElement('p');
                hint.className = 'nds-text-caption nds-text-muted-foreground';
                hint.textContent = 'Usaremos seu email apenas para contato.';
                wrapper.append(label, input, hint);
                return wrapper;
              },
            },
            {
              name: t('variants.compositions.errorMessage.name'),
              description: t('variants.compositions.errorMessage.description'),
              useWhen: t('variants.compositions.errorMessage.use'),
              code: codeWithError,
              previewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'nds-stack nds-w-full nds-max-w-sm';
                wrapper.dataset.spacing = 'xs';
                const label = document.createElement('label');
                label.htmlFor = 'input-email-err';
                label.className = 'nds-text-body nds-font-medium';
                label.textContent = 'Email';
                const input = createInput({ type: 'email', id: 'input-email-err', placeholder: 'ex: joao@empresa.com' });
                input.setAttribute('aria-invalid', 'true');
                input.setAttribute('aria-describedby', 'input-email-err-msg');
                const error = document.createElement('p');
                error.id = 'input-email-err-msg';
                error.className = 'nds-text-caption nds-text-destructive';
                error.textContent = 'Informe um email válido.';
                wrapper.append(label, input, error);
                return wrapper;
              },
            },
            {
              name: t('variants.compositions.withPrefix.name'),
              description: t('variants.compositions.withPrefix.description'),
              useWhen: t('variants.compositions.withPrefix.use'),
              code: codeWithPrefix,
              previewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'nds-stack nds-w-full nds-max-w-sm';
                wrapper.dataset.spacing = 'xs';
                const label = document.createElement('label');
                label.htmlFor = 'input-url';
                label.className = 'nds-text-body nds-font-medium';
                label.textContent = 'URL do site';
                const row = document.createElement('div');
                row.className = 'nds-input-group';
                const prefix = document.createElement('span');
                prefix.className = 'nds-input-group-addon';
                prefix.dataset.align = 'inline-start';
                prefix.textContent = 'https://';
                const input = createInput({ type: 'url', id: 'input-url', placeholder: 'meusite.com' });
                input.classList.add('nds-input-group-control');
                input.dataset.slot = 'input-group-control';
                row.append(prefix, input);
                wrapper.append(label, row);
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
            { label: t('states.default.label'), trigger: toPlainText(t('states.default.trigger')), behavior: toPlainText(t('states.default.behavior'))},
            { label: t('states.focus.label'),   trigger: toPlainText(t('states.focus.trigger')),   behavior: toPlainText(t('states.focus.behavior'))},
            { label: t('states.disabled.label'),trigger: toPlainText(t('states.disabled.trigger')),behavior: toPlainText(t('states.disabled.behavior'))},
            { label: t('states.error.label'),   trigger: toPlainText(t('states.error.trigger')),   behavior: toPlainText(t('states.error.behavior'))},
            { label: t('states.file.label'),    trigger: toPlainText(t('states.file.trigger')),    behavior: toPlainText(t('states.file.behavior'))},
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createInput(options)
export type InputOptions = {
  type?: string;         // HTML input type ('text' | 'email' | 'password' | 'number' | 'file' | ...)
  placeholder?: string; // Texto de exemplo do formato esperado
  disabled?: boolean;   // Desabilita o campo
  value?: string;       // Valor inicial
  class?: string;       // Classes adicionais
  id?: string;          // ID do elemento
  name?: string;        // name do campo
};`;

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
              title: t('props.inputTitle'),
              cols: propsCols,
              items: [
                { name: 'type',        type: 'string',  defaultValue: '"text"', required: 'Não', description: toPlainText(t('props.table.type_prop')) },
                { name: 'placeholder', type: 'string',  defaultValue: '—',     required: 'Não', description: t('props.table.placeholder') },
                { name: 'disabled',    type: 'boolean', defaultValue: 'false', required: 'Não', description: t('props.table.disabled') },
                { name: 'value',       type: 'string',  defaultValue: '—',     required: 'Não', description: 'Valor inicial do campo.' },
                { name: 'class',       type: 'string',  defaultValue: '—',     required: 'Não', description: t('props.table.className') },
                { name: 'id',          type: 'string',  defaultValue: '—',     required: 'Não', description: 'ID do elemento input.' },
                { name: 'name',        type: 'string',  defaultValue: '—',     required: 'Não', description: 'Atributo name do input para uso em formulários.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: 'O Input Nortear aceita todos os atributos HTML nativos do input via setAttribute() após a criação. Use a prop class para customizações pontuais com tokens do projeto.',
        });
      }

      case 'tokens': {
        // Cada linha abaixo foi conferida no navegador com getComputedStyle, não
        // lida a olho na folha. A versão anterior ensinava `--height-default` e
        // `--radius-input` (que o campo não consome) e nomes de utilitário do
        // Tailwind na coluna de seletor — customização inteiramente inerte.
        const customizationCode = `/* Em styles.css — sobrescrever os tokens que o campo consome */
:root {
  --input: 0 0% 56%;         /* borda em repouso — mantenha 3:1 contra o fundo */
  --ring: 0 0% 45%;          /* borda no hover e no foco, e a cor do halo */
  --destructive: 0 74% 42%;  /* borda e halo do estado de erro */
  --radius: 0.625rem;        /* arredondamento das quinas */
  --spacing-2: 0.5rem;       /* respiro vertical: a altura acompanha */
  --text-control: 0.875rem;  /* tipografia do campo: a altura acompanha */
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: FIELD_TOKENS.map(([token, selector, key]) => ({
            token,
            value: selector,
            description: t(`tokens.table.${key}`),
          })),
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
          keyboardTitle: tNav('common.keyboard'),
          keyboardItems: [
            { key: 'Tab',       description: t('accessibility.keyboard.tab') },
            { key: 'Shift+Tab', description: t('accessibility.keyboard.shiftTab') },
            { key: 'Typing',    description: t('accessibility.keyboard.typing') },
            { key: 'Escape',    description: t('accessibility.keyboard.escape') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Textarea',  description: toPlainText(t('related.textarea')),  path: '?path=/docs/primitives-form-textarea--docs' },
            { name: 'InputOTP',  description: toPlainText(t('related.inputOTP')),  path: '?path=/docs/primitives-form-inputotp--docs' },
            { name: 'Select',    description: toPlainText(t('related.select')),    path: '?path=/docs/primitives-form-select--docs' },
            { name: 'Form',      description: toPlainText(t('related.form')),      path: '?path=/docs/primitives-form-form--docs' },
            { name: 'Label',     description: toPlainText(t('related.label')),     path: '?path=/docs/primitives-form-label--docs' },
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
            { title: '', content: t('notes.tip5') },
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
            { event: t('analytics.table.fieldFocus'),    trigger: toPlainText(t('analytics.table.fieldFocusTrigger')),    payload: t('analytics.table.fieldFocusPayload') },
            { event: t('analytics.table.fieldBlur'),     trigger: toPlainText(t('analytics.table.fieldBlurTrigger')),     payload: t('analytics.table.fieldBlurPayload') },
            { event: t('analytics.table.fieldError'),    trigger: toPlainText(t('analytics.table.fieldErrorTrigger')),    payload: t('analytics.table.fieldErrorPayload') },
            { event: t('analytics.table.pageView'),      trigger: toPlainText(t('analytics.table.pageViewTrigger')),      payload: t('analytics.table.pageViewPayload') },
            { event: t('analytics.table.sectionViewed'), trigger: toPlainText(t('analytics.table.sectionViewedTrigger')), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),    trigger: toPlainText(t('analytics.table.langSwitchTrigger')),    payload: t('analytics.table.langSwitchPayload') },
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
            items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [1, 2, 3, 4, 5].map(i => ({
              criterion: t(`testes.accessibility.item${i}`),
              level: 'AA',
              how: 'axe-core + manual',
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
        component_name: 'input',
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
