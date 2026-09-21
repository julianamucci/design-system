import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createCommand, type CommandElement, type CommandItem } from '@/components/ui/command';
import { createButton } from '@/components/ui/button';
import { createDialog } from '@/components/ui/dialog';
import uiTranslations from '@/i18n/ui.json';
import commandTranslations from '@shared/content/command/translations.json';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
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
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.entries(
    (commandTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  )
    .filter(([k]) => k !== 'title')
    .map(([, v]) => v);
}
// Duas propriedades que só esta stack tem — o discriminante `type` da lista e o
// `group` por item (as outras compõem o grupo como peça). A descrição delas não
// cabe no conteúdo compartilhado, que é neutro de API, e vive aqui, nos três
// idiomas; até 2026-09-10 era texto em português fixo na tabela.
const { t, subscribe } = createTranslation(commandTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.entryType':
      'Discriminante da lista. Com o valor separator, a entrada é só o traço entre dois blocos, sem rótulo nem valor; um traço cujos vizinhos saíram no filtro desaparece com eles.',
    'props.table.group':
      'Nome do grupo em que o comando entra; comandos com o mesmo nome dividem um cabeçalho.',
  },
  en: {
    'props.table.entryType':
      'List discriminant. With the value separator, the entry is only the line between two blocks, with no label or value; a line whose neighbours were filtered out disappears with them.',
    'props.table.group':
      'Name of the group the command belongs to; commands with the same name share one heading.',
  },
  es: {
    'props.table.entryType':
      'Discriminante de la lista. Con el valor separator, la entrada es solo la línea entre dos bloques, sin etiqueta ni valor; una línea cuyos vecinos salieron del filtro desaparece con ellos.',
    'props.table.group':
      'Nombre del grupo al que pertenece el comando; los comandos con el mismo nombre comparten un encabezado.',
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

/**
 * A SEÇÃO onde o elemento está — nunca uma constante no topo do arquivo.
 *
 * A demonstração, as Variantes e o Do & Don't renderizam paleta VIVA, e escolher
 * um comando ali é tão real quanto na demonstração. Cravar `docs_demo` em tudo
 * juntaria três seções num balde só no GA4 (guideline 07).
 */
type DocsLocation = 'docs_demo' | 'docs_variantes' | 'docs_do_dont';

/** Chave ESTÁVEL do grupo, a que vai para o payload — nunca o nome traduzido. */
type GroupKey = 'components' | 'utils';

/**
 * Comando de exemplo: o que a fábrica recebe, mais a chave do grupo.
 *
 * `group` é o texto do cabeçalho, traduzido, e muda com o idioma; `groupKey` é o
 * que o GA4 recebe, e não muda. Até 2026-09-10 o payload levava o RÓTULO e o
 * nome do grupo traduzidos — a mesma escolha virava três séries, uma por idioma.
 * Onde o exemplo não desenha cabeçalho (o par de Do & Don't), a chave continua
 * a do grupo a que o comando pertence na demonstração.
 */
type DocsItem = CommandItem & { groupKey: GroupKey };

type TrackedCommandOptions = {
  items: DocsItem[];
  emptyMessage: string;
  pattern: 'inline' | 'palette';
  location: DocsLocation;
  /** O que acontece depois de medir — a paleta no Dialog fecha aqui. */
  afterSelect?: () => void;
};

/**
 * A paleta que mede cada escolha: `label` é o VALOR do comando e `group` a
 * chave estável do grupo (PRD §9).
 */
function trackedCommand(opts: TrackedCommandOptions): CommandElement {
  return createCommand({
    placeholder: t('demonstration.labels.searchPlaceholder'),
    emptyMessage: opts.emptyMessage,
    items: opts.items,
    onSelect: (value) => {
      const item = opts.items.find((i) => i.value === value);
      if (!item) return;
      track('command_item_select', {
        component: 'command',
        label: value,
        group: item.groupKey,
        pattern: opts.pattern,
        location: opts.location,
      });
      opts.afterSelect?.();
    },
  });
}

/**
 * Moldura das paletas desenhadas direto na página — a paleta não tem borda nem
 * sombra próprias (PRD §1). Sem sombra no par de Do & Don't, onde o quadro é
 * comparação e não vitrine.
 */
function framed(content: HTMLElement, shadow = true): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = shadow
    ? 'nds-w-full nds-max-w-sm nds-border-default nds-rounded-md nds-shadow-md'
    : 'nds-w-full nds-max-w-sm nds-border-default nds-rounded-md';
  wrap.appendChild(content);
  return wrap;
}

/** Os comandos da demonstração inline: dois grupos, sem ícone e sem atalho. */
function inlineItems(): DocsItem[] {
  const components = t('demonstration.labels.groupComponents');
  const utils = t('demonstration.labels.groupUtils');
  return [
    { value: 'button',    label: t('demonstration.labels.itemButton'),    group: components, groupKey: 'components' },
    { value: 'input',     label: t('demonstration.labels.itemInput'),     group: components, groupKey: 'components' },
    { value: 'separator', label: t('demonstration.labels.itemSeparator'), group: utils,      groupKey: 'utils'      },
  ];
}

/**
 * Os comandos da paleta: os mesmos da inline, com o atalho de cada um.
 *
 * O atalho é só desenho (contrato C5) — ninguém registra Ctrl+B aqui, e o texto
 * dele entra no nome acessível do comando.
 */
function paletteItems(): DocsItem[] {
  const [button, input, separator] = inlineItems();
  return [
    { ...button, shortcut: 'Ctrl+B' },
    { ...input,  shortcut: 'Ctrl+I' },
    separator,
  ];
}

/**
 * Gatilho da paleta — o botão REAL, e não um `<div>` que se parece com um.
 *
 * Mesma forma da story `CommandPalette`: botão outline com o texto visível e a
 * dica do atalho num `<kbd>` DENTRO dele. Sem `aria-label`: o nome acessível sai
 * do texto que se vê (WCAG 2.5.3), e a dica entra nele junto.
 */
function buildPaletteTrigger(withShortcut: boolean): HTMLButtonElement {
  const trigger = createButton({
    variant: 'outline',
    label: t('demonstration.labels.openPalette'),
  });

  if (withShortcut) {
    const kbd = document.createElement('kbd');
    kbd.className = 'nds-kbd';
    kbd.textContent = t('demonstration.labels.shortcutKey');
    trigger.appendChild(kbd);
  }

  return trigger;
}

/**
 * A paleta de verdade, num Dialog — a pendência de §9 do PRD.
 *
 * Até 2026-09-10 a página anunciava `command_palette_open` na tabela de
 * analytics e não tinha paleta que abrisse: o evento nunca saía. Agora o gatilho
 * abre o Dialog, o Ctrl+K da página abre o mesmo Dialog, e cada abertura REAL
 * emite o evento com o `trigger` de onde ela veio.
 *
 * `register` entrega à página a função que abre ESTA paleta. A seção é refeita a
 * cada troca de idioma, e o ouvinte de Ctrl+K — que vive enquanto a página está
 * montada — passa a abrir sempre a paleta que está na tela.
 */
function buildDemoPalette(register: (openByKeyboard: () => void) => void): HTMLElement {
  const trigger = buildPaletteTrigger(true);

  // Quem abriu a paleta. O clique é o caso padrão; o atalho marca antes de abrir.
  let openedBy: 'button' | 'keyboard' = 'button';

  /*
   * Fechar é `close()`, e não mais um clique FALSO no véu.
   *
   * O `document.querySelector('[data-slot="dialog-overlay"]')?.click()` era
   * errado em três frentes de uma vez: pegava o véu do PRIMEIRO diálogo do
   * documento, e não o desta paleta; encenava um gesto que ninguém fez; e
   * informaria `'overlay'` a quem escutasse `onClose`, quando o que aconteceu
   * foi o programa recolher o painel depois de executar o comando — que é
   * exatamente o que `'api'` nomeia.
   */
  function closePalette(): void {
    dialog.close();
  }

  const content = trackedCommand({
    items: paletteItems(),
    emptyMessage: t('demonstration.labels.emptyMessage'),
    pattern: 'palette',
    location: 'docs_demo',
    // Escolher executa, mede e FECHA: a paleta não se fecha sozinha
    // (usage.guidelines.item2).
    afterSelect: closePalette,
  });

  const dialog = createDialog({
    trigger,
    // O diálogo precisa de nome, e desenhá-lo em cima da busca seria redundante
    // para quem enxerga: o cabeçalho sai da tela e fica na árvore (C6).
    title: t('demonstration.labels.dialogTitle'),
    description: t('demonstration.labels.dialogDescription'),
    headerHidden: true,
    showCloseButton: false,
    class: 'nds-command-dialog-content',
    content,
    onOpenChange: (open) => {
      if (open) {
        // O Dialog reaproveita o mesmo nó a cada abertura: cada uma começa com
        // a busca vazia e o primeiro comando em destaque (D11), e não com o que
        // a abertura anterior deixou.
        content.reset();
        track('command_palette_open', {
          component: 'command',
          trigger: openedBy,
          location: 'docs_demo',
        });
      }
      openedBy = 'button';
    },
  });

  register(() => {
    // Só ABRE: com a paleta já aberta, o atalho não faz nada (PRD §9). A
    // pergunta vai à fábrica, que é quem sabe — o `let isOpen` que vivia aqui
    // era um espelho do estado dela, alimentado por `onOpenChange`, e espelho é
    // o que sai de sincronia sem ninguém ver.
    if (dialog.isOpen()) return;
    openedBy = 'keyboard';
    // `open()` e não um `MouseEvent` sintético no gatilho: o clique falso
    // existia porque a fábrica não sabia abrir, e ainda tinha de ser disparado
    // SEM propagação para o rastreamento automático da seção não o contar como
    // clique de gente no botão. Chamando o verbo, não há evento a conter.
    dialog.open();
  });

  return dialog;
}

/**
 * A demonstração: a paleta inline e, abaixo, o gatilho da paleta no Dialog.
 * Nada além disso (contrato da pipeline, 2026-09-10).
 */
function buildDemo(register: (openByKeyboard: () => void) => void): HTMLElement {
  const outer = document.createElement('div');
  outer.className = 'nds-stack nds-w-full';
  outer.dataset.spacing = 'lg';
  outer.dataset.align = 'center';
  outer.append(
    framed(
      trackedCommand({
        items: inlineItems(),
        emptyMessage: t('demonstration.labels.emptyMessage'),
        pattern: 'inline',
        location: 'docs_demo',
      }),
    ),
    buildDemoPalette(register),
  );
  return outer;
}

/**
 * A paleta já com uma busca sem correspondência — o estado que o par de
 * Do & Don't compara. `emptyMessage: ''` é o lado errado: a região viva
 * continua lá, sem nada para anunciar nem para ler.
 */
function emptyBuildDemo(emptyMessage: string): HTMLElement {
  const wrap = framed(
    trackedCommand({
      items: [
        { value: 'button', label: t('demonstration.labels.itemButton'), groupKey: 'components' },
        { value: 'input',  label: t('demonstration.labels.itemInput'),  groupKey: 'components' },
      ],
      emptyMessage,
      pattern: 'inline',
      location: 'docs_do_dont',
    }),
    false,
  );

  const inp = wrap.querySelector('input');
  if (inp) {
    inp.value = 'xyz';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  }
  return wrap;
}

// ─── createCommandDocs ────────────────────────────────────────────────────────

export function createCommandDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── Ctrl+K ───────────────────────────────────────────────────────────────
  //
  // A demonstração exibe a dica do atalho, então a página responde a ela: dica
  // que a página não honra é uma promessa falsa na frente de quem está
  // aprendendo o componente (PRD §9). O ouvinte vive enquanto a página está
  // montada e sai na desmontagem, junto com os outros (`cleanups`, no fim).
  // Só ABRE a paleta da demonstração — nunca alterna.

  /** Abre a paleta da demonstração que está na tela; trocada a cada re-render. */
  let openDemoPalette: (() => void) | null = null;

  const onPaletteShortcut = (e: KeyboardEvent): void => {
    if (e.key.toLowerCase() !== 'k' || !(e.ctrlKey || e.metaKey)) return;
    // Sem isto o navegador leva o Ctrl+K para a barra de endereço.
    e.preventDefault();
    openDemoPalette?.();
  };
  window.addEventListener('keydown', onPaletteShortcut);
  cleanups.push(() => window.removeEventListener('keydown', onPaletteShortcut));

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'command',
    });
    track('docs_page_view', {
      component_name: 'command',
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
    {
      labelKey: 'nav.overview',
      sections: [
        { id: 'demonstracao', labelKey: 'nav.demonstration' },
        { id: 'anatomia',     labelKey: 'nav.anatomy'       },
        { id: 'quando-usar',  labelKey: 'nav.usage'         },
        { id: 'do-dont',      labelKey: 'nav.doDont'        },
      ],
    },
    {
      labelKey: 'nav.techRef',
      sections: [
        { id: 'importacao',   labelKey: 'nav.import'   },
        { id: 'variantes',    labelKey: 'nav.variants' },
        { id: 'estados',      labelKey: 'nav.states'   },
        { id: 'propriedades', labelKey: 'nav.props'    },
        { id: 'tokens',       labelKey: 'nav.tokens'   },
      ],
    },
    {
      labelKey: 'nav.context',
      sections: [
        { id: 'acessibilidade', labelKey: 'nav.accessibility' },
        { id: 'relacionados',   labelKey: 'nav.related'       },
        { id: 'notas',          labelKey: 'nav.notes'         },
      ],
    },
    {
      labelKey: 'nav.quality',
      sections: [
        { id: 'analytics', labelKey: 'nav.analytics' },
        { id: 'testes',    labelKey: 'nav.testes'    },
      ],
    },
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
    'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {

      // ─── 1. Demonstração ───────────────────────────────────────────────
      case 'demonstracao':
        return createDocsDemonstration({
          demoFactory: () => buildDemo((open) => { openDemoPalette = open; }),
        });

      // ─── 2. Anatomia ───────────────────────────────────────────────────
      case 'anatomia':
        return createDocsAnatomy({
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => t(`anatomy.item${i}`)),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      // ─── 3. Quando Usar ────────────────────────────────────────────────
      case 'quando-usar':
        return createDocsWhenToUse({
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
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3].map(i => t(`usage.dont.item${i}`)),
          },
        });

      // ─── 4. Do & Don't ─────────────────────────────────────────────────
      case 'do-dont':
        return createDocsDoDont({
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              // Os dois lados mostram a MESMA busca sem correspondência: o que
              // muda é haver ou não uma frase para ler. Antes o lado errado
              // exibia a mensagem padrão da factory e desmentia a própria
              // legenda ("omitir CommandEmpty").
              doPreviewFactory: () => emptyBuildDemo(t('demonstration.labels.emptyMessage')),
              dontPreviewFactory: () => emptyBuildDemo(''),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              // O mesmo gatilho dos dois lados, com o mesmo texto: o que muda é
              // só a dica do atalho dentro dele.
              doPreviewFactory: () => {
                const outer = document.createElement('div');
                outer.className = 'nds-stack nds-p-2';
                outer.dataset.spacing = 'xs';
                outer.dataset.align = 'start';
                outer.appendChild(buildPaletteTrigger(true));
                return outer;
              },
              dontPreviewFactory: () => {
                const outer = document.createElement('div');
                outer.className = 'nds-stack nds-p-2';
                outer.dataset.spacing = 'xs';
                outer.dataset.align = 'start';
                // Sem dica de atalho: o gatilho não conta que a paleta existe.
                outer.appendChild(buildPaletteTrigger(false));
                return outer;
              },
            },
          ],
        });

      // ─── 5. Importação ─────────────────────────────────────────────────
      case 'importacao':
        return createDocsImport({
          componentSlug: 'command',
          description: t('import.basic'),
          code: `import { createCommand } from '@/components/ui/command';`,
          secondaryDescription: t('import.withDialog'),
          secondaryCode: `// Padrão command palette — combine Command com o Dialog do sistema\nimport { createButton } from '@/components/ui/button';\nimport { createCommand } from '@/components/ui/command';\nimport { createDialog } from '@/components/ui/dialog';`,
        });

      // ─── 6. Variantes (Padrões de Uso) ─────────────────────────────────
      //
      // Cada bloco de código publica a MESMA paleta que o cartão desenha — os
      // comandos, o placeholder e o arranjo de grupos. Até 2026-09-10 o do
      // cartão palette ensinava "Novo arquivo" em "Ações" enquanto a tela
      // mostrava Button e Input.
      case 'variantes': {
        const codeInline = `const cmd = createCommand({
  placeholder: 'Buscar componente...',
  emptyMessage: 'Nenhum resultado encontrado.',
  items: [
    { value: 'button',    label: 'Button',    group: 'Componentes' },
    { value: 'input',     label: 'Input',     group: 'Componentes' },
    { value: 'separator', label: 'Separator', group: 'Utilitários' },
  ],
  onSelect: (value) => console.log('selected:', value),
});`;

        const codePalette = `// Gatilho com a dica do atalho DENTRO dele: o nome acessível sai do texto.
const trigger = createButton({ variant: 'outline', label: 'Buscar' });
const hint = document.createElement('kbd');
hint.className = 'nds-kbd';
hint.textContent = 'Ctrl+K';
trigger.append(hint);

const cmd = createCommand({
  placeholder: 'Buscar componente...',
  emptyMessage: 'Nenhum resultado encontrado.',
  items: [
    { value: 'button',    label: 'Button',    group: 'Componentes', shortcut: 'Ctrl+B' },
    { value: 'input',     label: 'Input',     group: 'Componentes', shortcut: 'Ctrl+I' },
    { value: 'separator', label: 'Separator', group: 'Utilitários' },
  ],
  onSelect: (value) => {
    executeAction(value);
    closePalette();
  },
});

const dialog = createDialog({
  trigger,
  title: 'Command Palette',
  description: 'Busque por um comando ou ação...',
  headerHidden: true,
  showCloseButton: false,
  class: 'nds-command-dialog-content',
  content: cmd,
  // O Dialog reaproveita o nó: cada abertura começa com a busca vazia e o
  // primeiro comando em destaque.
  onOpenChange: (open) => {
    if (open) cmd.reset();
  },
});

// Fechar por código é close(), que informa o motivo 'api' a quem escuta
// onClose — a paleta foi recolhida pelo programa, não dispensada por ninguém.
function closePalette() {
  dialog.close();
}

// Atalho global Ctrl+K / Cmd+K — é de quem consome, componente nenhum o registra.
// Só ABRE: com a paleta aberta o atalho não faz nada, e quem sabe se ela está
// aberta é a própria fábrica.
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() !== 'k' || !(e.metaKey || e.ctrlKey)) return;
  e.preventDefault();
  if (!dialog.isOpen()) dialog.open();
});`;

        const codeWithGroups = `const wrap = document.createElement('div');
wrap.className = 'nds-w-sm nds-border-default nds-rounded-md nds-shadow-md';
wrap.appendChild(
  createCommand({
    placeholder: 'Buscar componente...',
    emptyMessage: 'Nenhum resultado encontrado.',
    items: [
      { value: 'button',    label: 'Button',    group: 'Componentes' },
      { value: 'input',     label: 'Input',     group: 'Componentes' },
      { value: 'badge',     label: 'Badge',     group: 'Componentes' },
      { value: 'separator', label: 'Separator', group: 'Componentes' },
      { value: 'cn',        label: 'cn()',      group: 'Utilitários' },
      { value: 'clsx',      label: 'clsx()',    group: 'Utilitários' },
      { value: 'twmerge',   label: 'twMerge()', group: 'Utilitários' },
    ],
  })
);`;

        return createDocsCompositions({
          id: 'variantes',
          note: t('variants.note'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'command',
          items: [
            {
              name: stripHtml(t('variants.items.inline.name')),
              description: stripHtml(t('variants.items.inline.description')),
              trackId: 'inline',
              code: codeInline,
              previewFactory: () =>
                framed(
                  trackedCommand({
                    items: inlineItems(),
                    emptyMessage: t('demonstration.labels.emptyMessage'),
                    pattern: 'inline',
                    location: 'docs_variantes',
                  }),
                ),
            },
            {
              name: stripHtml(t('variants.items.palette.name')),
              description: stripHtml(t('variants.items.palette.description')),
              trackId: 'palette',
              code: codePalette,
              // Retrato do padrão — o gatilho e, embaixo, o que ele abre. A
              // paleta que abre de verdade é a da demonstração; aqui o cartão
              // mostra as duas peças lado a lado, para comparar com os outros.
              previewFactory: () => {
                const outer = document.createElement('div');
                outer.className = 'nds-stack nds-p-2';
                outer.dataset.spacing = 'xs';
                outer.dataset.align = 'start';
                outer.append(
                  buildPaletteTrigger(true),
                  framed(
                    trackedCommand({
                      items: paletteItems(),
                      emptyMessage: t('demonstration.labels.emptyMessage'),
                      pattern: 'palette',
                      location: 'docs_variantes',
                    }),
                  ),
                );
                return outer;
              },
            },
            {
              name: stripHtml(t('variants.items.withGroups.name')),
              description: stripHtml(t('variants.items.withGroups.description')),
              useWhen: stripHtml(t('variants.items.withGroups.use')),
              trackId: 'withGroups',
              code: codeWithGroups,
              previewFactory: () => {
                const components = t('demonstration.labels.groupComponents');
                const utils = t('demonstration.labels.groupUtils');
                return framed(
                  trackedCommand({
                    items: [
                      { value: 'button',    label: 'Button',    group: components, groupKey: 'components' },
                      { value: 'input',     label: 'Input',     group: components, groupKey: 'components' },
                      { value: 'badge',     label: 'Badge',     group: components, groupKey: 'components' },
                      { value: 'separator', label: 'Separator', group: components, groupKey: 'components' },
                      { value: 'cn',        label: 'cn()',      group: utils,      groupKey: 'utils'      },
                      { value: 'clsx',      label: 'clsx()',    group: utils,      groupKey: 'utils'      },
                      { value: 'twmerge',   label: 'twMerge()', group: utils,      groupKey: 'utils'      },
                    ],
                    emptyMessage: t('demonstration.labels.emptyMessage'),
                    pattern: 'inline',
                    location: 'docs_variantes',
                  }),
                );
              },
            },
          ],
        });
      }

      // ─── 7. Estados ────────────────────────────────────────────────────
      case 'estados':
        return createDocsStates({
          cols: {
            state:    t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          // `highlighted` (destaque: automático no primeiro habilitado, depois
          // seta ou ponteiro — D11) e `selected` (marcado) são estados
          // diferentes, e a tabela mostra os dois. Ordem do contrato: empty,
          // highlighted, selected, disabled, loading, longList.
          items: [
            {
              label:    t('states.empty.label'),
              trigger:  toPlainText(t('states.empty.trigger')),
              behavior: toPlainText(t('states.empty.behavior')),
            },
            {
              label:    t('states.highlighted.label'),
              trigger:  toPlainText(t('states.highlighted.trigger')),
              behavior: toPlainText(t('states.highlighted.behavior')),
            },
            {
              label:    t('states.selected.label'),
              trigger:  toPlainText(t('states.selected.trigger')),
              behavior: toPlainText(t('states.selected.behavior')),
            },
            {
              label:    t('states.disabled.label'),
              trigger:  toPlainText(t('states.disabled.trigger')),
              behavior: toPlainText(t('states.disabled.behavior')),
            },
            {
              label:    t('states.loading.label'),
              trigger:  toPlainText(t('states.loading.trigger')),
              behavior: toPlainText(t('states.loading.behavior')),
            },
            {
              label:    t('states.longList.label'),
              trigger:  toPlainText(t('states.longList.trigger')),
              behavior: toPlainText(t('states.longList.behavior')),
            },
          ],
        });

      // ─── 8. Propriedades ───────────────────────────────────────────────
      case 'propriedades': {
        const interfaceCode = `// CommandOptions
export type CommandOptions = {
  placeholder?: string;
  emptyMessage?: string;
  items: CommandEntry[];
  onSelect?: (value: string) => void;
  class?: string;
};

// A lista aceita comandos e traços, em união discriminada por \`type\`.
export type CommandEntry = CommandItem | CommandSeparator;

// CommandItem
export type CommandItem = {
  type?: 'item';        // ausente vale por 'item'
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
  checked?: boolean;
  shortcut?: string;
};

// Traço entre dois blocos de comandos.
export type CommandSeparator = { type: 'separator' };

// O que createCommand devolve: a raiz, com reset() — busca vazia e o primeiro
// comando em destaque. Quem hospeda num Dialog o chama a cada abertura.
export type CommandElement = HTMLElement & { reset: () => void };`;

        const propsCols = {
          prop:        t('props.table.prop'),
          type:        t('props.table.type'),
          default:     t('props.table.default'),
          required:    t('props.table.required'),
          description: t('props.table.description'),
        };
        const yes = tNav('common.yes');
        const no = tNav('common.no');

        return createDocsProps({
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibility'),
          tables: [
            {
              title: t('props.commandTitle'),
              cols: propsCols,
              items: [
                { name: 'placeholder',  type: 'string',                  defaultValue: '"Search…"',           required: no,  description: toPlainText(t('props.table.inputPlaceholder')) },
                { name: 'emptyMessage', type: 'string',                  defaultValue: '"No results found."', required: no,  description: toPlainText(t('props.table.emptyMessage'))     },
                { name: 'items',        type: 'CommandEntry[]',          defaultValue: '—',                   required: yes, description: toPlainText(t('props.table.items'))            },
                { name: 'onSelect',     type: '(value: string) => void', defaultValue: '—',                   required: no,  description: toPlainText(t('props.table.itemOnSelect'))     },
                { name: 'class',        type: 'string',                  defaultValue: '—',                   required: no,  description: toPlainText(t('props.table.className'))        },
                // Método do elemento devolvido, e não opção: fica na mesma tabela porque é a API da fábrica.
                { name: 'reset()',      type: '() => void',              defaultValue: '—',                   required: no,  description: toPlainText(t('props.table.reset'))            },
              ],
            },
            {
              title: t('props.commandItemTitle'),
              cols: propsCols,
              items: [
                { name: 'type',     type: "'item' | 'separator'", defaultValue: "'item'", required: no,  description: toPlainText(t('props.table.entryType'))    },
                { name: 'value',    type: 'string',  defaultValue: '—',     required: yes, description: toPlainText(t('props.table.itemValue'))    },
                { name: 'label',    type: 'string',  defaultValue: '—',     required: yes, description: toPlainText(t('props.table.label'))        },
                { name: 'group',    type: 'string',  defaultValue: '—',     required: no,  description: toPlainText(t('props.table.group'))        },
                { name: 'disabled', type: 'boolean', defaultValue: 'false', required: no,  description: toPlainText(t('props.table.itemDisabled')) },
                { name: 'checked',  type: 'boolean', defaultValue: '—',     required: no,  description: toPlainText(t('props.table.checked'))      },
                { name: 'shortcut', type: 'string',  defaultValue: '—',     required: no,  description: toPlainText(t('props.table.shortcut'))     },
              ],
            },
          ],
        });
      }

      // ─── 9. Tokens ─────────────────────────────────────────────────────
      case 'tokens':
        return createDocsTokens({
          cols: {
            token:       t('tokens.table.token'),
            value:       t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          // A coluna do meio traz o SELETOR REAL da folha compartilhada
          // (`docs/shared/styles/nds/command.css`), um por linha: o raio da
          // paleta e o do comando são tokens diferentes (`--radius` e o
          // aninhado `--radius-sm`, PRD D10), e juntá-los numa linha só
          // atribuía ao item um token que ele não usa.
          items: [
            { token: '--popover',            value: '.nds-command',                            description: toPlainText(t('tokens.table.popoverBg'))   },
            { token: '--popover-foreground', value: '.nds-command',                            description: toPlainText(t('tokens.table.popoverFg'))   },
            { token: '--foreground',         value: '.nds-command-group',                      description: toPlainText(t('tokens.table.groupFg'))     },
            { token: '--muted-foreground',   value: '.nds-command-group-heading',              description: toPlainText(t('tokens.table.mutedFg'))     },
            { token: '--border',             value: '.nds-command-input-wrapper',              description: toPlainText(t('tokens.table.inputBorder')) },
            { token: '--accent',             value: '.nds-command-item[aria-selected="true"]', description: toPlainText(t('tokens.table.selectedBg'))  },
            { token: '--accent-foreground',  value: '.nds-command-item[aria-selected="true"]', description: toPlainText(t('tokens.table.selectedFg'))  },
            { token: '--border',             value: '.nds-command-separator',                  description: toPlainText(t('tokens.table.border'))      },
            { token: '--radius',             value: '.nds-command',                            description: toPlainText(t('tokens.table.radius'))      },
            { token: '--radius-sm',          value: '.nds-command-item',                       description: toPlainText(t('tokens.table.radiusSm'))    },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });

      // ─── 10. Acessibilidade ────────────────────────────────────────────
      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          summary: t('accessibility.summary'),
          items: [1, 2, 3].map(i => t(`accessibility.item${i}`)),
          keyboardTitle: tNav('common.keyboardNav'),
          keyboardItems: [
            { key: 'Arrow Down', description: toPlainText(t('accessibility.keyboard.arrowDown')) },
            { key: 'Arrow Up',   description: toPlainText(t('accessibility.keyboard.arrowUp'))   },
            { key: 'Enter',      description: toPlainText(t('accessibility.keyboard.enter'))     },
            { key: 'Escape',     description: toPlainText(t('accessibility.keyboard.escape'))    },
            { key: 'Tab',        description: toPlainText(t('accessibility.keyboard.tab'))       },
            { key: 'Ctrl+K',     description: toPlainText(t('accessibility.keyboard.cmdK'))      },
          ],
        });

      // ─── 11. Relacionados ──────────────────────────────────────────────
      case 'relacionados':
        return createDocsRelated({
          componentSlug: 'command',
          items: [
            { name: 'Select',       description: toPlainText(t('related.select')),       path: '?path=/docs/components-form-select--docs'        },
            { name: 'DropdownMenu', description: toPlainText(t('related.dropdownMenu')), path: '?path=/docs/components-navigation-dropdownmenu--docs'  },
            { name: 'Dialog',       description: toPlainText(t('related.dialog')),       path: '?path=/docs/components-overlay-dialog--docs'        },
          ],
        });

      // ─── 12. Notas ─────────────────────────────────────────────────────
      case 'notas':
        return createDocsNotes({
          componentSlug: 'command',
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
          ],
        });

      // ─── 13. Analytics ─────────────────────────────────────────────────
      case 'analytics':
        return createDocsAnalytics({
          cols: {
            event:   t('analytics.table.event'),
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            {
              event:   t('analytics.table.itemSelect'),
              trigger: toPlainText(t('analytics.table.itemSelectTrigger')),
              payload: t('analytics.table.itemSelectPayload'),
            },
            {
              event:   t('analytics.table.paletteOpen'),
              trigger: toPlainText(t('analytics.table.paletteOpenTrigger')),
              payload: t('analytics.table.paletteOpenPayload'),
            },
            {
              event:   t('analytics.table.pageView'),
              trigger: toPlainText(t('analytics.table.pageViewTrigger')),
              payload: t('analytics.table.pageViewPayload'),
            },
            {
              event:   t('analytics.table.sectionViewed'),
              trigger: toPlainText(t('analytics.table.sectionViewedTrigger')),
              payload: t('analytics.table.sectionViewedPayload'),
            },
            {
              event:   t('analytics.table.langSwitch'),
              trigger: toPlainText(t('analytics.table.langSwitchTrigger')),
              payload: t('analytics.table.langSwitchPayload'),
            },
          ],
        });

      // ─── 14. Testes ────────────────────────────────────────────────────
      case 'testes': {
        return createDocsTestes({
          functional: {
            title: t('testes.functional.title'),
            description: t('testes.functional.description'),
            cols: {
              action:   tNav('common.userAction'),
              result:   tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              action:   t(`testes.functional.item${i}.action`),
              result:   t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            description: t('testes.accessibility.description'),
            cols: {
              criterion: tNav('common.criterion'),
              level:     'WCAG',
              how:       tNav('common.howToVerify'),
            },
            items: [1, 2, 3, 4].map(i => ({
              criterion: t(`testes.accessibility.item${i}`),
              level:     'AA',
              how:       'axe-core / manual',
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            description: t('testes.visual.description'),
            cols: {
              story:    tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4].map(i => ({
              story:    t(`testes.visual.item${i}.story`),
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
        component_name: 'command',
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
    })
  );
  cleanups.push(
    onLocaleChange(() => {
      renderHeader();
      buildSidebar();
      renderAllSections();
    })
  );

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
