import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createCombobox, type ComboboxItem } from '@/components/ui/combobox';
import { createButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import comboboxTranslations from '@shared/content/combobox/translations.json';

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

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (comboboxTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(comboboxTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

/**
 * Nomes acessíveis e mensagens que TODA instância desta página compartilha.
 *
 * Nenhum deles tem um padrão útil em três idiomas: a fábrica traz um texto em
 * português e nada mais. Passá-los sempre é o que faz a página inteira mudar de
 * idioma junto com a barra de idiomas, inclusive nos botões que só o leitor de
 * tela alcança.
 */
function sharedOptions(): {
  emptyMessage: string;
  clearLabel: string;
  triggerLabel: string;
  removeLabel: string;
  removedAnnouncement: (label: string) => string;
} {
  return {
    emptyMessage: t('demonstration.labels.empty'),
    clearLabel: t('demonstration.labels.clear'),
    triggerLabel: t('demonstration.labels.openList'),
    removeLabel: t('demonstration.labels.remove'),
    // Sem esta linha a região viva fala português em `en` e em `es`: o padrão
    // da fábrica é pt, como o de `emptyMessage` e `clearLabel` — a diferença é
    // que estes dois a página já traduzia, e o anúncio não.
    removedAnnouncement: (label: string) => `${label} ${t('demonstration.labels.removed')}`,
  };
}

/** Os nove países da spec de exemplos — os mesmos que as stories mostram. */
const COUNTRY_KEYS: { value: string; key: string }[] = [
  { value: 'brasil', key: 'brazil' },
  { value: 'argentina', key: 'argentina' },
  { value: 'chile', key: 'chile' },
  { value: 'colombia', key: 'colombia' },
  { value: 'mexico', key: 'mexico' },
  { value: 'peru', key: 'peru' },
  { value: 'portugal', key: 'portugal' },
  { value: 'espanha', key: 'spain' },
  { value: 'uruguai', key: 'uruguay' },
];

function countryItems(): ComboboxItem[] {
  return COUNTRY_KEYS.map((entry) => ({
    value: entry.value,
    label: t(`demonstration.labels.${entry.key}`),
  }));
}

/**
 * As quatro tecnologias do exemplo múltiplo. Ficam no código, e não no conteúdo
 * compartilhado, porque são nomes próprios: não mudam de idioma, e uma chave de
 * tradução por nome próprio só acrescentaria um lugar onde divergir.
 */
const TECHNOLOGY_ITEMS: ComboboxItem[] = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'angular', label: 'Angular' },
];

/** Frutas e Legumes — o exemplo agrupado da spec. */
const GROCERY_KEYS: { value: string; key: string; groupKey: string }[] = [
  { value: 'maca', key: 'apple', groupKey: 'groupFruits' },
  { value: 'banana', key: 'banana', groupKey: 'groupFruits' },
  { value: 'laranja', key: 'orange', groupKey: 'groupFruits' },
  { value: 'cenoura', key: 'carrot', groupKey: 'groupVegetables' },
  { value: 'batata', key: 'potato', groupKey: 'groupVegetables' },
  { value: 'abobrinha', key: 'zucchini', groupKey: 'groupVegetables' },
];

function groceryItems(): ComboboxItem[] {
  return GROCERY_KEYS.map((entry) => ({
    value: entry.value,
    label: t(`demonstration.labels.${entry.key}`),
    group: t(`demonstration.labels.${entry.groupKey}`),
  }));
}

/**
 * Rótulo ESTÁVEL de cada valor, para o payload do GA4.
 *
 * Não sai do `t()` de propósito: o texto traduzido faria a mesma escolha virar
 * três eventos diferentes no relatório, um por idioma. O que a tela mostra vem
 * do conteúdo; o que o evento carrega vem daqui.
 */
const TRACK_LABELS: Record<string, string> = {
  brasil: 'Brazil',
  argentina: 'Argentina',
  chile: 'Chile',
  colombia: 'Colombia',
  mexico: 'Mexico',
  peru: 'Peru',
  portugal: 'Portugal',
  espanha: 'Spain',
  uruguai: 'Uruguay',
  react: 'React',
  vue: 'Vue',
  svelte: 'Svelte',
  angular: 'Angular',
};

/**
 * Campo montado pela fábrica, dentro de um contêiner de coluna.
 *
 * A raiz da fábrica é `display: contents`, então quem organiza rótulo e caixa em
 * duas linhas é este contêiner — sem ele os dois herdariam o layout de quem
 * receber a demonstração, que muda de seção para seção.
 */
function buildField(opts: {
  labelText: string;
  placeholder: string;
  items: ComboboxItem[];
  id?: string;
  name?: string;
  multiple?: boolean;
  defaultValue?: string[];
  disabled?: boolean;
  invalid?: boolean;
  onValueChange?: (value: string[]) => void;
}): HTMLElement {
  const column = document.createElement('div');
  column.className = 'nds-stack nds-w-full';
  column.dataset.spacing = 'xs';

  column.appendChild(
    createCombobox({
      ...sharedOptions(),
      items: opts.items,
      label: opts.labelText,
      placeholder: opts.placeholder,
      id: opts.id,
      name: opts.name,
      multiple: opts.multiple,
      defaultValue: opts.defaultValue,
      disabled: opts.disabled,
      invalid: opts.invalid,
      onValueChange: opts.onValueChange,
    }),
  );

  return column;
}

// ─── createComboboxDocs ───────────────────────────────────────────────────────

export function createComboboxDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'combobox',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', { component_name: 'combobox', locale, page_title: `${t('title')} · Design System` });
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
    return NAV_GROUPS.map(group => ({
      label: tNav(group.labelKey),
      sections: group.sections.map(section => ({ id: section.id, label: tNav(section.labelKey) })),
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
          componentSlug: 'combobox',
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.className = 'nds-stack nds-w-sm';
            wrap.dataset.spacing = 'lg';

            const countryField = buildField({
              id: 'demo-country',
              name: 'country',
              labelText: t('demonstration.labels.countryLabel'),
              placeholder: t('demonstration.labels.countryPlaceholder'),
              items: countryItems(),
              onValueChange: (value) => {
                const chosen = value[0];
                if (!chosen) {
                  // Campo zerado pelo botão de limpar: não houve escolha a
                  // registrar, e sim uma mudança de valor.
                  track('field_change', {
                    component: 'combobox',
                    field_name: 'country',
                    value: '',
                    location: 'docs_demo',
                  });
                  return;
                }
                track('option_select', {
                  component: 'combobox',
                  field_name: 'country',
                  value: chosen,
                  label: TRACK_LABELS[chosen],
                  location: 'docs_demo',
                });
              },
            });
            wrap.appendChild(countryField);

            // O modo múltiplo entrega a lista INTEIRA a cada mudança, então quem
            // separa "escolheu" de "removeu" é a comparação com a lista anterior.
            // Sem ela, remover um chip sairia no relatório como uma escolha.
            let previousTechnologies: string[] = ['react', 'vue'];

            const technologyField = buildField({
              id: 'demo-technologies',
              name: 'technologies',
              labelText: t('demonstration.labels.techLabel'),
              placeholder: t('demonstration.labels.techPlaceholder'),
              items: TECHNOLOGY_ITEMS,
              multiple: true,
              defaultValue: [...previousTechnologies],
              onValueChange: (value) => {
                const added = value.find((entry) => !previousTechnologies.includes(entry));
                previousTechnologies = [...value];
                if (added) {
                  track('option_select', {
                    component: 'combobox',
                    field_name: 'technologies',
                    value: added,
                    label: TRACK_LABELS[added],
                    location: 'docs_demo',
                  });
                  return;
                }
                track('field_change', {
                  component: 'combobox',
                  field_name: 'technologies',
                  value: value.join(','),
                  location: 'docs_demo',
                });
              },
            });
            wrap.appendChild(technologyField);

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
            t('anatomy.item8'),
            t('anatomy.item9'),
            t('anatomy.item10'),
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
              t('usage.guidelines.item5'),
              t('usage.guidelines.item6'),
              t('usage.guidelines.item7'),
            ],
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4, 5, 6].map(index => ({
              s: toPlainText(t(`usage.scenarios.item${index}.s`)),
              u: toPlainText(t(`usage.scenarios.item${index}.u`)),
              a: toPlainText(t(`usage.scenarios.item${index}.a`)),
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
            items: ['placeholder', 'itemLabel', 'chipRemove', 'emptyMessage'].map(key => ({
              element: toPlainText(t(`usage.uxWriting.table.${key}.name`)),
              rules: toPlainText(t(`usage.uxWriting.table.${key}.format`)),
              do: toPlainText(t(`usage.uxWriting.table.${key}.good`)),
              dont: toPlainText(t(`usage.uxWriting.table.${key}.bad`)),
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
              t('usage.dont.item4'),
            ],
          },
        });

      case 'do-dont': {
        /** O lado certo: cada botão de remover já nasce com o nome do chip. */
        const buildNamedRemove = () =>
          buildField({
            labelText: t('demonstration.labels.countryLabel'),
            placeholder: t('demonstration.labels.countryPlaceholder'),
            items: countryItems(),
            multiple: true,
            defaultValue: ['brasil', 'argentina', 'chile'],
          });

        /**
         * O contraexemplo, montado apagando o nome que a fábrica dá.
         *
         * A diferença é INVISÍVEL na tela — os dois lados desenham os mesmos
         * três chips —, e é justamente esse o ponto: quem enxerga não percebe o
         * defeito, e quem navega por lista de controles ouve três botões
         * idênticos. Sem construir o lado errado, a legenda ficaria sozinha.
         */
        const buildGenericRemove = () => {
          const column = buildNamedRemove();
          const generic = t('demonstration.labels.remove');
          column
            .querySelectorAll('[data-slot="combobox-chip-remove"]')
            .forEach((button) => button.setAttribute('aria-label', generic));
          return column;
        };

        /** O lado certo do gesto: o Backspace da fábrica remove o último chip. */
        const buildBackspaceWorks = () =>
          buildField({
            labelText: t('demonstration.labels.techLabel'),
            placeholder: t('demonstration.labels.techPlaceholder'),
            items: TECHNOLOGY_ITEMS,
            multiple: true,
            defaultValue: ['react', 'vue'],
          });

        /**
         * O contraexemplo: o Backspace é engolido antes de chegar ao campo.
         *
         * O ouvinte entra na CAPTURA da caixa, que é ancestral do campo de
         * texto — assim ele roda antes do ouvinte da fábrica e a propagação
         * morre ali. O apagamento do texto continua, porque quem apaga é o
         * navegador, e não este código: sobra exatamente o defeito da legenda,
         * desfazer uma escolha só com o ponteiro.
         */
        const buildBackspaceBlocked = () => {
          const column = buildBackspaceWorks();
          const box = column.querySelector<HTMLElement>('[data-slot="combobox-input-wrapper"]');
          box?.addEventListener(
            'keydown',
            (event) => {
              if ((event as KeyboardEvent).key === 'Backspace') event.stopPropagation();
            },
            true,
          );
          return column;
        };

        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              doPreviewFactory: buildNamedRemove,
              dontPreviewFactory: buildGenericRemove,
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: buildBackspaceWorks,
              dontPreviewFactory: buildBackspaceBlocked,
            },
          ],
        });
      }

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          componentSlug: 'combobox',
          description: 'Importação da fábrica:',
          code: `import { createCombobox, type ComboboxOptions, type ComboboxItem } from '@/components/ui/combobox';`,
          secondaryDescription: 'Uso básico:',
          secondaryCode: `const field = createCombobox({
  id: 'country',
  name: 'country',
  label: 'País',
  placeholder: 'Buscar país',
  items: [
    { value: 'brasil', label: 'Brasil' },
    { value: 'portugal', label: 'Portugal' },
  ],
  // Sem estes quatro, os textos que só o leitor de tela alcança ficam presos ao
  // padrão da fábrica, que é português — e a tela muda de idioma sem eles.
  emptyMessage: 'Nenhum resultado',
  clearLabel: 'Limpar',
  triggerLabel: 'Abrir lista',
  removeLabel: 'Remover',
  onValueChange: (value) => console.log('escolhido:', value),
});

document.querySelector('#campo')?.append(field);

// Ao desmontar a tela, solte o ouvinte de documento e a lista aberta. Chamar
// duas vezes não faz nada na segunda, e sair do documento já dispara.
field.destroy();`,
        });

      case 'variantes': {
        return createDocsVariants({
          id: 'variantes',
          title: t('variants.title'),
          componentSlug: 'combobox',
          items: [
            {
              name: stripHtml(t('variants.items.single')),
              description: stripHtml(t('variants.styles.single')),
              trackId: 'single',
              code: `createCombobox({
  label: 'País',
  placeholder: 'Buscar país',
  emptyMessage: 'Nenhum resultado',
  items: [
    { value: 'brasil', label: 'Brasil' },
    { value: 'argentina', label: 'Argentina' },
    { value: 'chile', label: 'Chile' },
  ],
});`,
              previewFactory: () =>
                buildField({
                  labelText: t('demonstration.labels.countryLabel'),
                  placeholder: t('demonstration.labels.countryPlaceholder'),
                  items: countryItems(),
                }),
            },
            {
              name: stripHtml(t('variants.items.multiple')),
              description: stripHtml(t('variants.styles.multiple')),
              trackId: 'multiple',
              code: `createCombobox({
  label: 'Tecnologias',
  placeholder: 'Adicionar tecnologia',
  multiple: true,
  defaultValue: ['react', 'vue'],
  // Prefixo do nome de cada botão de remover: a fábrica acrescenta o rótulo do
  // chip, porque "Remover" repetido cinco vezes não diz qual sai.
  removeLabel: 'Remover',
  items: [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'angular', label: 'Angular' },
  ],
});`,
              previewFactory: () =>
                buildField({
                  labelText: t('demonstration.labels.techLabel'),
                  placeholder: t('demonstration.labels.techPlaceholder'),
                  items: TECHNOLOGY_ITEMS,
                  multiple: true,
                  defaultValue: ['react', 'vue'],
                }),
            },
            {
              name: stripHtml(t('variants.items.grouped')),
              description: stripHtml(t('variants.styles.grouped')),
              trackId: 'grouped',
              code: `createCombobox({
  label: 'Ingrediente',
  placeholder: 'Buscar ingrediente',
  // O cabeçalho sai do próprio item: entradas com o mesmo grupo saem sob o
  // mesmo título, na ordem em que aparecem na lista.
  items: [
    { value: 'maca', label: 'Maçã', group: 'Frutas' },
    { value: 'banana', label: 'Banana', group: 'Frutas' },
    { value: 'cenoura', label: 'Cenoura', group: 'Legumes' },
    { value: 'batata', label: 'Batata', group: 'Legumes' },
  ],
});`,
              previewFactory: () =>
                buildField({
                  labelText: t('demonstration.labels.groupedLabel'),
                  placeholder: t('demonstration.labels.groupedPlaceholder'),
                  items: groceryItems(),
                }),
            },
          ],
        });
      }

      case 'composicoes':
        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'combobox',
          items: [
            {
              name: stripHtml(t('variants.compositions.inForm.name')),
              description: stripHtml(t('variants.compositions.inForm.description')),
              useWhen: stripHtml(t('variants.compositions.inForm.use')),
              trackId: 'in-form',
              code: `const form = document.createElement('form');
form.className = 'nds-stack nds-border-default nds-rounded-lg nds-w-sm nds-p-4';
form.dataset.spacing = 'md';

const field = createCombobox({
  id: 'form-country',
  name: 'country',
  label: 'País',
  placeholder: 'Buscar país',
  emptyMessage: 'Nenhum resultado',
  items: [
    { value: 'brasil', label: 'Brasil' },
    { value: 'portugal', label: 'Portugal' },
  ],
});
form.appendChild(field);

// A fábrica do design system, e não classes montadas à mão: fora dela o botão
// sai sem estilo e o contraste do texto fica entregue ao acaso do tema.
const actions = document.createElement('div');
actions.className = 'nds-cluster';
actions.dataset.justify = 'end';
actions.appendChild(createButton({ type: 'submit', label: 'Continuar' }));
form.appendChild(actions);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  // O campo escondido da fábrica carrega o valor: a serialização é nativa.
  // No modo múltiplo os escolhidos viajam separados por vírgula.
  const data = new FormData(form);
  console.log('País:', data.get('country'));
});`,
              previewFactory: () => {
                const form = document.createElement('form');
                form.className = 'nds-stack nds-border-default nds-rounded-lg nds-w-sm nds-p-4';
                form.dataset.spacing = 'md';
                form.noValidate = true;

                form.appendChild(
                  buildField({
                    id: 'composition-form-country',
                    name: 'country',
                    labelText: t('demonstration.labels.countryLabel'),
                    placeholder: t('demonstration.labels.countryPlaceholder'),
                    items: countryItems(),
                  }),
                );

                const actions = document.createElement('div');
                actions.className = 'nds-cluster';
                actions.dataset.justify = 'end';
                actions.appendChild(createButton({ type: 'submit', label: 'Continuar' }));
                form.appendChild(actions);

                form.addEventListener('submit', (event) => {
                  event.preventDefault();
                });

                return form;
              },
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
          items: [
            { label: t('states.default.label'),   trigger: toPlainText(t('states.default.trigger')),   behavior: toPlainText(t('states.default.behavior')) },
            { label: t('states.open.label'),      trigger: toPlainText(t('states.open.trigger')),      behavior: toPlainText(t('states.open.behavior')) },
            { label: t('states.filtering.label'), trigger: toPlainText(t('states.filtering.trigger')), behavior: toPlainText(t('states.filtering.behavior')) },
            { label: t('states.selected.label'),  trigger: toPlainText(t('states.selected.trigger')),  behavior: toPlainText(t('states.selected.behavior')) },
            { label: t('states.focus.label'),     trigger: toPlainText(t('states.focus.trigger')),     behavior: toPlainText(t('states.focus.behavior')) },
            { label: t('states.empty.label'),     trigger: toPlainText(t('states.empty.trigger')),     behavior: toPlainText(t('states.empty.behavior')) },
            { label: t('states.disabled.label'),  trigger: toPlainText(t('states.disabled.trigger')),  behavior: toPlainText(t('states.disabled.behavior')) },
            { label: t('states.invalid.label'),   trigger: toPlainText(t('states.invalid.trigger')),   behavior: toPlainText(t('states.invalid.behavior')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createCombobox(options) → raiz com destroy()
export interface ComboboxItem {
  value: string;
  label: string;
  disabled?: boolean;
  /** Rótulo do grupo. Itens com o mesmo texto saem sob o mesmo cabeçalho. */
  group?: string;
}

export interface ComboboxOptions {
  items: ComboboxItem[];
  label?: string;
  'aria-label'?: string;
  placeholder?: string;
  multiple?: boolean;
  defaultValue?: string[];
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  id?: string;
  emptyMessage?: string;
  clearLabel?: string;
  triggerLabel?: string;
  removeLabel?: string;
  onValueChange?: (value: string[]) => void;
  onInputValueChange?: (text: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
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
              title: 'createCombobox(options)',
              cols: propsCols,
              items: [
                { name: 'items', type: 'ComboboxItem[]', defaultValue: '—', required: 'Sim', description: toPlainText(t('props.table.items.description')) + ' O cabeçalho de grupo sai do próprio item: entradas com o mesmo grupo saem sob o mesmo título.' },
                { name: 'label', type: 'string', defaultValue: '—', required: 'Não', description: 'Rótulo visível, amarrado ao campo de texto. Sem ele, o nome acessível tem de vir por `aria-label`.' },
                { name: 'aria-label', type: 'string', defaultValue: '—', required: 'Não', description: 'Nome acessível quando não há rótulo visível. O papel de combobox não aceita nome vindo do próprio conteúdo, e o conteúdo aqui é o texto digitado.' },
                { name: 'placeholder', type: 'string', defaultValue: '""', required: 'Não', description: toPlainText(t('props.table.placeholder.description')) },
                { name: 'multiple', type: 'boolean', defaultValue: 'false', required: 'Não', description: toPlainText(t('props.table.multiple.description')) },
                { name: 'defaultValue', type: 'string[]', defaultValue: '[]', required: 'Não', description: toPlainText(t('props.table.defaultValue.description')) + ' Em escolha única, só o primeiro é considerado.' },
                { name: 'disabled', type: 'boolean', defaultValue: 'false', required: 'Não', description: toPlainText(t('props.table.disabled.description')) + ' Os chips existentes perdem o botão de remover.' },
                { name: 'invalid', type: 'boolean', defaultValue: 'false', required: 'Não', description: 'Marca a caixa do campo como inválida. A borda e o anel de erro vêm da folha compartilhada: a página não pinta nada por fora.' },
                { name: 'name', type: 'string', defaultValue: '—', required: 'Não', description: toPlainText(t('props.table.name.description')) + ' O valor viaja por um campo escondido dentro da raiz, separado por vírgula quando há mais de um.' },
                { name: 'id', type: 'string', defaultValue: 'gerado', required: 'Não', description: 'Base dos identificadores internos — campo de texto, lista e opções. Sem ele a fábrica gera um por instância.' },
                { name: 'emptyMessage', type: 'string', defaultValue: '"Nenhum resultado"', required: 'Não', description: 'Texto exibido quando o filtro não casa com nada. Passe sempre: o padrão da fábrica não muda de idioma.' },
                { name: 'clearLabel', type: 'string', defaultValue: '"Limpar"', required: 'Não', description: 'Nome acessível do botão que zera a escolha, e também o que a região viva anuncia depois de limpar.' },
                { name: 'triggerLabel', type: 'string', defaultValue: '"Abrir list"', required: 'Não', description: 'Nome acessível do botão que abre e fecha a lista. O padrão da fábrica está com erro de digitação — passe o rótulo explicitamente.' },
                { name: 'removeLabel', type: 'string', defaultValue: '"Remover"', required: 'Não', description: 'Prefixo do nome acessível de cada botão de remover chip: a fábrica acrescenta o rótulo do escolhido, porque a palavra sozinha não diz qual chip sai.' },
                { name: 'onValueChange', type: '(value: string[]) => void', defaultValue: '—', required: 'Não', description: toPlainText(t('props.table.onValueChange.description')) + ' Recebe sempre a lista inteira, também em escolha única.' },
                { name: 'onInputValueChange', type: '(text: string) => void', defaultValue: '—', required: 'Não', description: toPlainText(t('props.table.onInputValueChange.description')) },
                { name: 'onOpenChange', type: '(isOpen: boolean) => void', defaultValue: '—', required: 'Não', description: 'Avisado a cada abertura e fechamento da lista.' },
                { name: 'className', type: 'string', defaultValue: '—', required: 'Não', description: 'Classes .nds-* adicionais na raiz do campo.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: 'Extensibilidade e limpeza',
          extensibilityNotes:
            'A fábrica devolve a <strong>raiz</strong> do campo, e não o campo de texto: dentro dela ficam o rótulo, a caixa com chips e texto, a região viva que anuncia o chip removido e o campo escondido que serializa o valor. A raiz é <code>display: contents</code>, então quem organiza rótulo e caixa em duas linhas é o contêiner que a recebe. Três pontos que a plataforma exige e nenhuma lib resolve por aqui: (1) a raiz aceita <code>destroy()</code>, <strong>idempotente</strong>, que solta o ouvinte de clique-fora registrado em <code>document</code> e remove a lista aberta — ele também dispara sozinho quando a raiz sai do documento, então esquecer de chamá-lo não vaza; (2) a fábrica é <strong>não-controlada</strong> — passe <code>defaultValue</code> e acompanhe a escolha pelo callback de mudança; (3) o filtro é <strong>fixo</strong>: compara o rótulo ignorando acentos e diferença entre maiúsculas e minúsculas. Para casar por sinônimo ou por código interno, filtre a lista de itens antes de entregá-la.',
        });
      }

      case 'tokens': {
        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--input', value: toPlainText(t('tokens.table.input.class')), description: toPlainText(t('tokens.table.input.part')) },
            { token: '--input-background', value: toPlainText(t('tokens.table.inputBackground.class')), description: toPlainText(t('tokens.table.inputBackground.part')) },
            { token: '--foreground', value: toPlainText(t('tokens.table.foreground.class')), description: toPlainText(t('tokens.table.foreground.part')) },
            { token: '--muted-foreground', value: toPlainText(t('tokens.table.mutedForeground.class')), description: toPlainText(t('tokens.table.mutedForeground.part')) },
            { token: '--muted', value: toPlainText(t('tokens.table.muted.class')), description: toPlainText(t('tokens.table.muted.part')) },
            { token: '--secondary', value: toPlainText(t('tokens.table.secondary.class')), description: toPlainText(t('tokens.table.secondary.part')) },
            { token: '--secondary-foreground', value: toPlainText(t('tokens.table.secondaryForeground.class')), description: toPlainText(t('tokens.table.secondaryForeground.part')) },
            { token: '--popover', value: toPlainText(t('tokens.table.popover.class')), description: toPlainText(t('tokens.table.popover.part')) },
            { token: '--popover-foreground', value: toPlainText(t('tokens.table.popoverForeground.class')), description: toPlainText(t('tokens.table.popoverForeground.part')) },
            { token: '--accent', value: toPlainText(t('tokens.table.accent.class')), description: toPlainText(t('tokens.table.accent.part')) },
            { token: '--accent-foreground', value: toPlainText(t('tokens.table.accentForeground.class')), description: toPlainText(t('tokens.table.accentForeground.part')) },
            { token: '--primary', value: toPlainText(t('tokens.table.primary.class')), description: toPlainText(t('tokens.table.primary.part')) },
            { token: '--border', value: toPlainText(t('tokens.table.border.class')), description: toPlainText(t('tokens.table.border.part')) },
            { token: '--ring', value: toPlainText(t('tokens.table.ring.class')), description: toPlainText(t('tokens.table.ring.part')) },
            { token: '--destructive', value: toPlainText(t('tokens.table.destructive.class')), description: toPlainText(t('tokens.table.destructive.part')) },
            { token: '--radius', value: toPlainText(t('tokens.table.radius.class')), description: toPlainText(t('tokens.table.radius.part')) },
            { token: '--radius-full', value: toPlainText(t('tokens.table.radiusFull.class')), description: toPlainText(t('tokens.table.radiusFull.part')) },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          title: t('accessibility.title'),
          summary: stripHtml(t('accessibility.summary')),
          items: [
            t('accessibility.items.item1'),
            t('accessibility.items.item2'),
            t('accessibility.items.item3'),
            t('accessibility.items.item4'),
            t('accessibility.items.item5'),
            t('accessibility.items.item6'),
            t('accessibility.items.item7'),
          ],
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Typing',     description: toPlainText(t('accessibility.keyboard.typing'))    },
            { key: 'Arrow Down', description: toPlainText(t('accessibility.keyboard.arrowDown')) },
            { key: 'Arrow Up',   description: toPlainText(t('accessibility.keyboard.arrowUp'))   },
            { key: 'Enter',      description: toPlainText(t('accessibility.keyboard.enter'))     },
            { key: 'Escape',     description: toPlainText(t('accessibility.keyboard.escape'))    },
            { key: 'Tab',        description: toPlainText(t('accessibility.keyboard.tab'))       },
            { key: 'Backspace',  description: toPlainText(t('accessibility.keyboard.backspace')) },
            { key: 'Home',       description: toPlainText(t('accessibility.keyboard.home'))      },
            { key: 'End',        description: toPlainText(t('accessibility.keyboard.end'))       },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.select.name'),  description: stripHtml(t('related.items.select.description')),  path: '?path=/docs/ui-select--docs'  },
            { name: t('related.items.command.name'), description: stripHtml(t('related.items.command.description')), path: '?path=/docs/ui-command--docs' },
            { name: t('related.items.input.name'),   description: stripHtml(t('related.items.input.description')),   path: '?path=/docs/ui-input--docs'   },
            { name: t('related.items.form.name'),    description: stripHtml(t('related.items.form.description')),    path: '?path=/docs/ui-form--docs'    },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: DOMPurify.sanitize(t('notes.item1')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item2')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item3')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item4')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item5') + ' A raiz aceita <code>destroy()</code>, e ele também dispara sozinho quando a raiz sai do documento — sem isso a lista aberta sobreviveria por cima da tela seguinte, junto com o ouvinte de clique-fora.') },
            { title: '', content: DOMPurify.sanitize(t('notes.item6')) },
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
            { event: 'option_select',       trigger: toPlainText(t('analytics.table.option_select.trigger')), payload: toPlainText(t('analytics.table.option_select.payload')) },
            { event: 'field_change',        trigger: toPlainText(t('analytics.table.field_change.trigger')),  payload: toPlainText(t('analytics.table.field_change.payload')) },
            { event: 'docs_page_view',      trigger: 'Carregamento da docs page', payload: '{ component_name, locale, page_title }' },
            { event: 'docs_section_viewed', trigger: 'Seção visível no viewport', payload: '{ section_id, component_name, locale }' },
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
            items: [1, 2, 3, 4, 5, 6, 7].map(index => ({
              action: toPlainText(t(`testes.functional.item${index}.action`)),
              result: toPlainText(t(`testes.functional.item${index}.result`)),
              priority: priorityLabel(t(`testes.functional.item${index}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: {
              criterion: tNav('common.criterion'),
              level: 'WCAG',
              how: tNav('common.howToVerify'),
            },
            items: [1, 2, 3, 4, 5, 6, 7].map(index => ({
              criterion: toPlainText(t(`testes.accessibility.item${index}`)),
              level: 'AA',
              how: '—',
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story: tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6, 7].map(index => ({
              story: toPlainText(t(`testes.visual.item${index}.story`)),
              priority: priorityLabel(t(`testes.visual.item${index}.priority`)),
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
        component_name: 'combobox',
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
