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
/**
 * Texto que só existe nesta stack, escrito nos três idiomas.
 *
 * A tabela de propriedades descreve uma FÁBRICA, e não um componente de
 * framework: linhas inteiras (`label`, `invalid`, `id`, os quatro rótulos de
 * acessibilidade) não têm correspondente no conteúdo compartilhado, e outras
 * somam uma frase ao que vem de lá. Cravar essas frases em português fazia a
 * tabela sair bilíngue em `en` e em `es` — descrição traduzida ao lado de frase
 * portuguesa. O override é o lugar sancionado para isso: o conteúdo
 * compartilhado continua vindo do `t()`, e só a parte local mora aqui.
 *
 * Sufixo `.extra` é a frase que se soma à descrição compartilhada;
 * `.description` é a linha que existe só aqui; `.default` é valor de coluna que
 * é texto de pessoa, e não literal de código.
 */
const localOverrides = {
  'pt-BR': {
    'props.local.items.extra': 'O cabeçalho de grupo sai do próprio item: entradas com o mesmo grupo saem sob o mesmo título.',
    'props.local.value.extra': 'A fábrica passa a só anunciar: a tela muda quando setValue() for chamado na raiz devolvida.',
    'props.local.defaultValue.extra': 'Em escolha única, só o primeiro é considerado.',
    'props.local.inputValue.extra': 'Digitar apenas anuncia; o texto na tela muda em setInputValue().',
    'props.local.filter.extra': 'Recebe o texto digitado cru, para casar por sinônimo ou por código interno.',
    'props.local.disabled.extra': 'Os chips existentes perdem o botão de remover.',
    'props.local.name.extra': 'O valor viaja por um campo escondido dentro da raiz, separado por vírgula quando há mais de um.',
    'props.local.onValueChange.extra': 'Recebe sempre a lista inteira, também em escolha única.',
    'props.local.label.description': 'Rótulo visível, amarrado ao campo de texto. Sem ele, o nome acessível tem de vir por `aria-label`.',
    'props.local.ariaLabel.description': 'Nome acessível quando não há rótulo visível. O papel de combobox não aceita nome vindo do próprio conteúdo, e o conteúdo aqui é o texto digitado.',
    'props.local.invalid.description': 'Marca a caixa do campo como inválida. A borda e o anel de erro vêm da folha compartilhada: a página não pinta nada por fora.',
    'props.local.id.description': 'Base dos identificadores internos — campo de texto, lista e opções. Sem ele a fábrica gera um por instância.',
    'props.local.emptyMessage.description': 'Texto exibido quando o filtro não casa com nada. Passe sempre: o padrão da fábrica não muda de idioma.',
    'props.local.clearLabel.description': 'Nome acessível do botão que zera a escolha, e também o que a região viva anuncia depois de limpar.',
    'props.local.triggerLabel.description': 'Nome acessível do botão que abre e fecha a lista. O padrão da fábrica é português, então passe o rótulo em tela que muda de idioma.',
    'props.local.removeLabel.description': 'Prefixo do nome acessível de cada botão de remover chip: a fábrica acrescenta o rótulo do escolhido, porque a palavra sozinha não diz qual chip sai.',
    'props.local.onOpenChange.description': 'Avisado a cada abertura e fechamento da lista.',
    'props.local.className.description': 'Classes .nds-* adicionais na raiz do campo.',
    'props.local.filter.default': 'rótulo sem acento e sem caixa',
    'props.local.id.default': 'gerado',
    'import.local.factory': 'Importação da fábrica:',
    'import.local.basicUsage': 'Uso básico:',
  },
  en: {
    'props.local.items.extra': 'The group heading comes from the item itself: entries that share a group appear under the same title.',
    'props.local.value.extra': 'The factory then only announces: the screen changes when setValue() is called on the returned root.',
    'props.local.defaultValue.extra': 'In single choice, only the first one counts.',
    'props.local.inputValue.extra': 'Typing only announces; the text on screen changes on setInputValue().',
    'props.local.filter.extra': 'It gets the typed text raw, so you can match by synonym or by internal code.',
    'props.local.disabled.extra': 'Existing chips lose their remove button.',
    'props.local.name.extra': 'The value travels in a hidden field inside the root, comma-separated when there is more than one.',
    'props.local.onValueChange.extra': 'It always gets the whole list, in single choice too.',
    'props.local.label.description': 'Visible label, tied to the text field. Without it, the accessible name has to come from `aria-label`.',
    'props.local.ariaLabel.description': 'Accessible name when there is no visible label. The combobox role does not take its name from its own content, and the content here is the typed text.',
    'props.local.invalid.description': 'Marks the field box as invalid. The error border and ring come from the shared stylesheet: the page paints nothing of its own.',
    'props.local.id.description': 'Base for the internal identifiers — text field, list and options. Without it the factory generates one per instance.',
    'props.local.emptyMessage.description': 'Text shown when the filter matches nothing. Always pass it: the factory default does not change language.',
    'props.local.clearLabel.description': 'Accessible name of the button that clears the choice, and also what the live region announces after clearing.',
    'props.local.triggerLabel.description': 'Accessible name of the button that opens and closes the list. The factory default is written in Portuguese, so pass the label on a screen that changes language.',
    'props.local.removeLabel.description': 'Prefix of the accessible name of every chip remove button: the factory appends the label of the chosen item, because the word on its own does not say which chip goes.',
    'props.local.onOpenChange.description': 'Called every time the list opens and closes.',
    'props.local.className.description': 'Extra .nds-* classes on the root of the field.',
    'props.local.filter.default': 'label without accents or letter case',
    'props.local.id.default': 'generated',
    'import.local.factory': 'Importing the factory:',
    'import.local.basicUsage': 'Basic usage:',
  },
  es: {
    'props.local.items.extra': 'El encabezado de grupo sale del propio ítem: las entradas con el mismo grupo aparecen bajo el mismo título.',
    'props.local.value.extra': 'La fábrica pasa a solo anunciar: la pantalla cambia cuando se llama a setValue() en la raíz devuelta.',
    'props.local.defaultValue.extra': 'En elección única, solo cuenta el primero.',
    'props.local.inputValue.extra': 'Escribir solo anuncia; el texto en pantalla cambia con setInputValue().',
    'props.local.filter.extra': 'Recibe el texto escrito tal cual, para coincidir por sinónimo o por código interno.',
    'props.local.disabled.extra': 'Los chips existentes pierden el botón de quitar.',
    'props.local.name.extra': 'El valor viaja en un campo oculto dentro de la raíz, separado por comas cuando hay más de uno.',
    'props.local.onValueChange.extra': 'Siempre recibe la lista entera, también en elección única.',
    'props.local.label.description': 'Etiqueta visible, vinculada al campo de texto. Sin ella, el nombre accesible tiene que venir de `aria-label`.',
    'props.local.ariaLabel.description': 'Nombre accesible cuando no hay etiqueta visible. El rol de combobox no toma el nombre de su propio contenido, y aquí el contenido es el texto escrito.',
    'props.local.invalid.description': 'Marca la caja del campo como inválida. El borde y el anillo de error vienen de la hoja compartida: la página no pinta nada por su cuenta.',
    'props.local.id.description': 'Base de los identificadores internos: campo de texto, lista y opciones. Sin él, la fábrica genera uno por instancia.',
    'props.local.emptyMessage.description': 'Texto que se muestra cuando el filtro no coincide con nada. Pásalo siempre: el valor por defecto de la fábrica no cambia de idioma.',
    'props.local.clearLabel.description': 'Nombre accesible del botón que borra la elección, y también lo que la región viva anuncia después de limpiar.',
    'props.local.triggerLabel.description': 'Nombre accesible del botón que abre y cierra la lista. El valor por defecto de la fábrica está en portugués, así que pasa la etiqueta en pantallas que cambian de idioma.',
    'props.local.removeLabel.description': 'Prefijo del nombre accesible de cada botón de quitar chip: la fábrica añade la etiqueta del elegido, porque la palabra sola no dice qué chip sale.',
    'props.local.onOpenChange.description': 'Se avisa en cada apertura y cierre de la lista.',
    'props.local.className.description': 'Clases .nds-* adicionales en la raíz del campo.',
    'props.local.filter.default': 'etiqueta sin acentos ni mayúsculas',
    'props.local.id.default': 'generado',
    'import.local.factory': 'Importación de la fábrica:',
    'import.local.basicUsage': 'Uso básico:',
  },
};

const { t, subscribe } = createTranslation(
  comboboxTranslations as Record<string, unknown>,
  localOverrides,
);

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
            let previousCountries: string[] = ['brasil', 'argentina'];

            const countriesField = buildField({
              id: 'demo-countries',
              name: 'countries',
              labelText: t('demonstration.labels.countriesLabel'),
              placeholder: t('demonstration.labels.countriesPlaceholder'),
              items: countryItems(),
              multiple: true,
              defaultValue: [...previousCountries],
              onValueChange: (value) => {
                const added = value.find((entry) => !previousCountries.includes(entry));
                previousCountries = [...value];
                if (added) {
                  track('option_select', {
                    component: 'combobox',
                    field_name: 'countries',
                    value: added,
                    label: TRACK_LABELS[added],
                    location: 'docs_demo',
                  });
                  return;
                }
                track('field_change', {
                  component: 'combobox',
                  field_name: 'countries',
                  value: value.join(','),
                  location: 'docs_demo',
                });
              },
            });
            wrap.appendChild(countriesField);

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
            labelText: t('demonstration.labels.countriesLabel'),
            placeholder: t('demonstration.labels.countriesPlaceholder'),
            items: countryItems(),
            multiple: true,
            defaultValue: ['brasil', 'argentina'],
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
          description: t('import.local.factory'),
          code: `import { createCombobox, type ComboboxOptions, type ComboboxItem } from '@/components/ui/combobox';`,
          secondaryDescription: t('import.local.basicUsage'),
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
  label: 'Países',
  placeholder: 'Adicionar país',
  multiple: true,
  defaultValue: ['brasil', 'argentina'],
  // Prefixo do nome de cada botão de remover: a fábrica acrescenta o rótulo do
  // chip, porque "Remover" repetido cinco vezes não diz qual sai.
  removeLabel: 'Remover',
  items: [
    { value: 'brasil', label: 'Brasil' },
    { value: 'argentina', label: 'Argentina' },
    { value: 'chile', label: 'Chile' },
    { value: 'colombia', label: 'Colômbia' },
  ],
});`,
              previewFactory: () =>
                buildField({
                  labelText: t('demonstration.labels.countriesLabel'),
                  placeholder: t('demonstration.labels.countriesPlaceholder'),
                  items: countryItems(),
                  multiple: true,
                  defaultValue: ['brasil', 'argentina'],
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
        const interfaceCode = `// createCombobox(options) → ComboboxElement (a raiz, com os verbos abaixo)
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
  /** Chips em várias linhas, ou numa linha só que rola na horizontal. */
  chipsLayout?: 'wrap' | 'single-line';
  /** Escolha controlada: a fábrica só anuncia, e a tela espera setValue(). */
  value?: string[];
  defaultValue?: string[];
  /** Texto de busca controlado: a tela espera setInputValue(). */
  inputValue?: string;
  /** Substitui o filtro. Recebe o texto digitado cru. */
  filter?: (item: ComboboxItem, query: string) => boolean;
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
}

// Sem framework não há re-render que empurre um valor novo para dentro: o modo
// controlado se fecha por estes verbos, no elemento devolvido.
export type ComboboxElement = HTMLDivElement & {
  destroy: () => void;
  setValue: (value: string[]) => void;
  getValue: () => string[];
  setInputValue: (text: string) => void;
  getInputValue: () => string;
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
              title: 'createCombobox(options)',
              cols: propsCols,
              items: [
                { name: 'items', type: 'ComboboxItem[]', defaultValue: '—', required: tNav('common.yes'), description: toPlainText(t('props.table.items.description')) + ' ' + t('props.local.items.extra') },
                { name: 'label', type: 'string', defaultValue: '—', required: tNav('common.no'), description: t('props.local.label.description') },
                { name: 'aria-label', type: 'string', defaultValue: '—', required: tNav('common.no'), description: t('props.local.ariaLabel.description') },
                { name: 'placeholder', type: 'string', defaultValue: '""', required: tNav('common.no'), description: toPlainText(t('props.table.placeholder.description')) },
                { name: 'multiple', type: 'boolean', defaultValue: 'false', required: tNav('common.no'), description: toPlainText(t('props.table.multiple.description')) },
                { name: 'chipsLayout', type: "'wrap' | 'single-line'", defaultValue: "'wrap'", required: tNav('common.no'), description: toPlainText(t('props.table.chipsLayout.description')) },
                // A forma do modo controlado DIVERGE do que o tipo compartilhado
                // sugere, e a divergência se registra em vez de se disfarçar: sem
                // re-render de framework, quem manda escreve de volta por
                // setValue(), no elemento devolvido.
                { name: 'value', type: 'string[]', defaultValue: '—', required: tNav('common.no'), description: toPlainText(t('props.table.value.description')) + ' ' + t('props.local.value.extra') },
                { name: 'defaultValue', type: 'string[]', defaultValue: '[]', required: tNav('common.no'), description: toPlainText(t('props.table.defaultValue.description')) + ' ' + t('props.local.defaultValue.extra') },
                { name: 'inputValue', type: 'string', defaultValue: '—', required: tNav('common.no'), description: toPlainText(t('props.table.inputValue.description')) + ' ' + t('props.local.inputValue.extra') },
                { name: 'filter', type: '(item: ComboboxItem, query: string) => boolean', defaultValue: t('props.local.filter.default'), required: tNav('common.no'), description: toPlainText(t('props.table.filter.description')) + ' ' + t('props.local.filter.extra') },
                { name: 'disabled', type: 'boolean', defaultValue: 'false', required: tNav('common.no'), description: toPlainText(t('props.table.disabled.description')) + ' ' + t('props.local.disabled.extra') },
                { name: 'invalid', type: 'boolean', defaultValue: 'false', required: tNav('common.no'), description: t('props.local.invalid.description') },
                { name: 'name', type: 'string', defaultValue: '—', required: tNav('common.no'), description: toPlainText(t('props.table.name.description')) + ' ' + t('props.local.name.extra') },
                { name: 'id', type: 'string', defaultValue: t('props.local.id.default'), required: tNav('common.no'), description: t('props.local.id.description') },
                // Os quatro rótulos abaixo saem da fábrica em português, e o
                // valor da coluna é o literal que o código traz — por isso não
                // muda de idioma junto com a descrição ao lado.
                { name: 'emptyMessage', type: 'string', defaultValue: '"Nenhum resultado"', required: tNav('common.no'), description: t('props.local.emptyMessage.description') },
                { name: 'clearLabel', type: 'string', defaultValue: '"Limpar"', required: tNav('common.no'), description: t('props.local.clearLabel.description') },
                { name: 'triggerLabel', type: 'string', defaultValue: '"Abrir lista"', required: tNav('common.no'), description: t('props.local.triggerLabel.description') },
                { name: 'removeLabel', type: 'string', defaultValue: '"Remover"', required: tNav('common.no'), description: t('props.local.removeLabel.description') },
                { name: 'onValueChange', type: '(value: string[]) => void', defaultValue: '—', required: tNav('common.no'), description: toPlainText(t('props.table.onValueChange.description')) + ' ' + t('props.local.onValueChange.extra') },
                { name: 'onInputValueChange', type: '(text: string) => void', defaultValue: '—', required: tNav('common.no'), description: toPlainText(t('props.table.onInputValueChange.description')) },
                { name: 'onOpenChange', type: '(isOpen: boolean) => void', defaultValue: '—', required: tNav('common.no'), description: t('props.local.onOpenChange.description') },
                { name: 'className', type: 'string', defaultValue: '—', required: tNav('common.no'), description: t('props.local.className.description') },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: 'Extensibilidade e limpeza',
          extensibilityNotes:
            'A fábrica devolve a <strong>raiz</strong> do campo, e não o campo de texto: dentro dela ficam o rótulo, a caixa com chips e texto, a região viva que anuncia o chip removido e o campo escondido que serializa o valor. A raiz é <code>display: contents</code>, então quem organiza rótulo e caixa em duas linhas é o contêiner que a recebe. Três pontos que a plataforma exige e nenhuma lib resolve por aqui: (1) a raiz aceita <code>destroy()</code>, <strong>idempotente</strong>, que solta o ouvinte de clique-fora registrado em <code>document</code> e remove a lista aberta — ele também dispara sozinho quando a raiz sai do documento, então esquecer de chamá-lo não vaza; (2) o modo <strong>controlado</strong> tem forma própria aqui — não há re-render que empurre um valor novo para dentro, então passar <code>value</code> (ou <code>inputValue</code>) faz a fábrica deixar de escrever esse estado, e quem manda responde chamando <code>setValue()</code> ou <code>setInputValue()</code> na raiz devolvida; sem eles, <code>defaultValue</code> continua sendo o caminho e a fábrica administra tudo; (3) o filtro é <strong>substituível</strong> por <code>filter</code>, que recebe o item e o texto digitado cru — para casar por sinônimo ou por código interno, é aí que se resolve. O padrão compara o rótulo ignorando acentos e diferença entre maiúsculas e minúsculas.',
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
