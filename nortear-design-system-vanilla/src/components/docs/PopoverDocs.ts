import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import {
  createPopover,
  createPopoverHeader,
  createPopoverTitle,
  createPopoverDescription,
} from '@/components/ui/popover';
import { createButton } from '@/components/ui/button';
import { createInput } from '@/components/ui/input';
import { createLabel } from '@/components/ui/label';
import uiTranslations from '@/i18n/ui.json';
import popoverTranslations from '@shared/content/popover/translations.json';

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
    (popoverTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(popoverTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};
function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// ─── Demo builders ────────────────────────────────────────────────────────────

/**
 * Rastreio de abertura e fechamento de um painel desta página.
 *
 * `location` vem do CALL SITE, não de constante no topo do arquivo: quem sabe
 * em que seção o elemento está é quem o monta, e Variantes, Composições e
 * Do & Don't renderizam componente vivo — clique ali é tão real quanto na
 * demonstração. O vocabulário é `docs_<section-id>`, o mesmo que o
 * `docs_section_viewed` manda em `section_id`.
 *
 * `triggerId` é um identificador estável e não o texto traduzido: o rótulo
 * viraria três valores distintos no GA4, um por idioma.
 */
function trackPopoverOpenChange(triggerId: string, location: string): (open: boolean) => void {
  return (open) => {
    if (open) {
      track('popover_open', { component: 'popover', trigger_label: triggerId, location });
    } else {
      track('popover_close', { component: 'popover', location });
    }
  };
}

/** Amostra de cor do exemplo de paleta — a MESMA das cinco stories. */
const SWATCH_CLASSES = 'nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring';

/**
 * Painel SEM título: um `<p>` solto dentro do `PopoverContent`.
 *
 * É a variante "Default" do conteúdo compartilhado — conteúdo livre — e é
 * também o "don't" do primeiro par de boas práticas: sem cabeçalho, o painel
 * cai no nome de reserva herdado do gatilho e devolve ao leitor de tela o
 * rótulo do botão em vez do assunto do painel. Fora dessas duas leituras, o
 * exemplo canônico da página é `buildWithTitlePopover`.
 */
/**
 * Painel SEM título.
 *
 * `ariaLabel` é opcional de propósito, e é o que separa os dois usos: a
 * variante "conteúdo livre" declara o nome do painel, e o anti-exemplo do
 * Do & Don't NÃO declara — é justamente o painel sem nome próprio, que cai no
 * rótulo do gatilho, que a legenda daquele par critica.
 */
function buildUntitledPopover(
  location: string,
  triggerId: string,
  label: string,
  body: string,
  ariaLabel?: string,
): HTMLElement {
  const trigger = createButton({ variant: 'outline', label });

  const content = document.createElement('div');
  content.className = 'nds-stack';
  content.dataset.spacing = 'xs';

  const p = document.createElement('p');
  p.className = 'nds-text-body';
  p.textContent = body;
  content.appendChild(p);

  return createPopover({
    trigger,
    content,
    side: 'bottom',
    align: 'center',
    ariaLabel,
    onOpenChange: trackPopoverOpenChange(triggerId, location),
  });
}

function buildDefaultPopover(location: string, triggerId = 'default'): HTMLElement {
  return buildUntitledPopover(
    location,
    triggerId,
    t('demonstration.labels.trigger'),
    t('demonstration.labels.description'),
    t('variants.panelLabels.default'),
  );
}

/**
 * O exemplo canônico do Popover — o mesmo que o Playground da story renderiza.
 *
 * Um gatilho `outline`, painel `align: 'center'` nascendo fechado e cabeçalho
 * com título e descrição.
 *
 * `showActions` liga o rodapé Cancelar + Salvar, e só a Demonstração o pede: a
 * variante `withTitle` existe para mostrar `PopoverHeader` com título e
 * descrição, e o par 1 do Do & Don't para mostrar que o painel tem nome
 * acessível próprio. Nos dois, o rodapé é da Demonstração e distrai do assunto.
 */
function buildWithTitlePopover(
  location: string,
  triggerId = 'with-title',
  showActions = false,
): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: t('demonstration.labels.trigger') });

  const content = document.createElement('div');
  content.className = 'nds-stack';
  content.dataset.spacing = 'sm';

  // Cabeçalho, título e descrição vêm das sub-fábricas: são elas que escrevem
  // as classes `.nds-popover-*` e os `data-slot` documentados na anatomia. O
  // título também é o que o painel usa como nome acessível.
  const header = createPopoverHeader();
  header.append(
    createPopoverTitle({ text: t('demonstration.labels.title') }),
    createPopoverDescription({ text: t('demonstration.labels.description') }),
  );

  content.appendChild(header);

  if (showActions) {
    const actions = document.createElement('div');
    actions.className = 'nds-cluster';
    actions.dataset.spacing = 'sm';
    actions.dataset.justify = 'end';
    const cancel = createButton({ variant: 'ghost', size: 'sm', label: t('demonstration.labels.cancel') });
    const save = createButton({ variant: 'default', size: 'sm', label: t('demonstration.labels.save') });
    actions.append(cancel, save);
    content.appendChild(actions);
  }

  return createPopover({
    trigger,
    content,
    side: 'bottom',
    align: 'center',
    onOpenChange: trackPopoverOpenChange(triggerId, location),
  });
}

/**
 * Painel de título só, para o par 2 do Do & Don't.
 *
 * O painel é o MESMO dos dois lados: o que muda é o rótulo do gatilho, que é
 * exatamente o assunto da lição — verbo e objeto de um lado, "Clique aqui" do
 * outro.
 */
function buildTriggerLabelPopover(
  location: string,
  triggerId: string,
  label: string,
): HTMLElement {
  const trigger = createButton({ variant: 'outline', label });

  const content = document.createElement('div');
  content.className = 'nds-stack';
  content.dataset.spacing = 'sm';

  const header = createPopoverHeader();
  header.append(createPopoverTitle({ text: t('demonstration.labels.form.trigger') }));
  content.appendChild(header);

  return createPopover({
    trigger,
    content,
    side: 'bottom',
    align: 'start',
    onOpenChange: trackPopoverOpenChange(triggerId, location),
  });
}

function buildFormPopover(location: string, triggerId = 'form'): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: t('demonstration.labels.form.trigger') });

  const content = document.createElement('form');
  content.className = 'nds-stack';
  content.dataset.spacing = 'md';
  content.addEventListener('submit', (e) => e.preventDefault());

  const nameRow = document.createElement('div');
  nameRow.className = 'nds-stack';
  nameRow.dataset.spacing = 'xs';
  const nameLabel = createLabel({ text: t('demonstration.labels.form.name'), htmlFor: 'popover-demo-name' });
  const nameInput = createInput({ id: 'popover-demo-name', placeholder: t('demonstration.labels.form.name') });
  nameRow.append(nameLabel, nameInput);

  const emailRow = document.createElement('div');
  emailRow.className = 'nds-stack';
  emailRow.dataset.spacing = 'xs';
  const emailLabel = createLabel({ text: t('demonstration.labels.form.email'), htmlFor: 'popover-demo-email' });
  const emailInput = createInput({ id: 'popover-demo-email', type: 'email', placeholder: 'name@example.com' });
  emailRow.append(emailLabel, emailInput);

  // Dois botões, não um: o conteúdo compartilhado descreve "Inputs e botões",
  // e um formulário em painel flutuante precisa de saída sem confirmar.
  const actions = document.createElement('div');
  actions.className = 'nds-cluster';
  actions.dataset.spacing = 'sm';
  actions.dataset.justify = 'end';
  const cancel = createButton({ variant: 'ghost', size: 'sm', label: t('demonstration.labels.cancel'), type: 'button' });
  const submit = createButton({ variant: 'default', size: 'sm', label: t('demonstration.labels.form.submit'), type: 'submit' });
  actions.append(cancel, submit);

  content.append(nameRow, emailRow, actions);

  return createPopover({
    trigger,
    content,
    side: 'bottom',
    align: 'start',
    onOpenChange: trackPopoverOpenChange(triggerId, location),
  });
}

// ─── createPopoverDocs ────────────────────────────────────────────────────────

export function createPopoverDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'popover',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/overlay' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'popover',
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
          // A demonstração é UM exemplo, o canônico: gatilho `outline`, painel
          // fechado, cabeçalho com título e descrição, rodapé com Cancelar e
          // Salvar. As três variações que moravam aqui não sumiram da página —
          // elas SÃO a seção Variantes, logo abaixo, com nome e código ao lado.
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.className = 'nds-cluster';
            wrap.dataset.justify = 'center';
            wrap.dataset.spacing = 'sm';
            wrap.appendChild(buildWithTitlePopover('docs_demo', 'demo', true));
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6].map(i => DOMPurify.sanitize(t(`anatomy.item${i}`))),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4].map(i => DOMPurify.sanitize(t(`usage.guidelines.item${i}`))),
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
            items: ['title', 'description', 'trigger'].map(key => ({
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
            items: [1, 2, 3, 4].map(i => stripHtml(t(`usage.dont.item${i}`))),
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
              // Os quatro previews são o COMPONENTE, não uma descrição dele: o
              // defeito do "don't" é real e abrindo o painel a pessoa o ouve.
              // Todos nascem fechados — quatro painéis abertos ao mesmo tempo se
              // empilham, e o axe passaria a medir o overlay no lugar da página.
              doPreviewFactory: () => buildWithTitlePopover('docs_do_dont', 'par1-do'),
              dontPreviewFactory: () => buildUntitledPopover(
                'docs_do_dont',
                'par1-dont',
                t('demonstration.labels.trigger'),
                t('doDont.pair1.dontBody'),
              ),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => buildTriggerLabelPopover(
                'docs_do_dont',
                'par2-do',
                t('demonstration.labels.form.trigger'),
              ),
              // Mesmo painel, gatilho vago: o que a lição compara é o rótulo, e
              // pôr conteúdo diferente dos dois lados trocaria o assunto.
              dontPreviewFactory: () => buildTriggerLabelPopover(
                'docs_do_dont',
                'par2-dont',
                t('doDont.pair2.dontTrigger'),
              ),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import {
  createPopover,
  createPopoverHeader,
  createPopoverTitle,
  createPopoverDescription,
} from '@/components/ui/popover';`,
          secondaryDescription: 'Estado controlado e abertura por código:',
          secondaryCode: `let aberto = false;

const popover = createPopover({
  trigger,
  content,
  side: 'bottom',
  align: 'start',
  sideOffset: 8,
  open: aberto,                     // presente = quem manda é quem chama
  onOpenChange: (proximo) => {
    aberto = proximo;
    popover.setOpen(proximo);       // nada se move sem esta linha
  },
});

// Sem \`open\`, o painel se governa e os verbos continuam disponíveis:
popover.open();
popover.toggle();`,
        });

      case 'variantes': {
        const codeDefault = `const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });

const content = document.createElement('div');
content.textContent = 'Ajuste a aparência do conteúdo.';

// Sem título dentro, o nome do painel se declara aqui.
createPopover({
  trigger,
  content,
  side: 'bottom',
  align: 'center',
  ariaLabel: 'Informações adicionais',
});`;

        const codeWithTitle = `const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });

const content = document.createElement('div');
const header = createPopoverHeader();
header.append(
  createPopoverTitle({ text: 'Configurações de exibição' }),
  createPopoverDescription({ text: 'Ajuste a aparência do conteúdo.' }),
);
content.append(header);

createPopover({ trigger, content });`;

        const codeForm = `const trigger = createButton({ variant: 'outline', label: 'Editar perfil' });

const form = document.createElement('form');
// ... Inputs + botões (Cancelar + Atualizar)
createPopover({ trigger, content: form });`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              trackId: 'default',
              name: t('variants.items.default'),
              description: stripHtml(t('variants.styles.default')),
              code: codeDefault,
              previewFactory: () => buildDefaultPopover('docs_variantes'),
            },
            {
              trackId: 'withTitle',
              name: t('variants.items.withTitle'),
              description: stripHtml(t('variants.styles.withTitle')),
              code: codeWithTitle,
              previewFactory: () => buildWithTitlePopover('docs_variantes'),
            },
            {
              trackId: 'form',
              name: t('variants.items.form'),
              description: stripHtml(t('variants.styles.form')),
              code: codeForm,
              previewFactory: () => buildFormPopover('docs_variantes'),
            },
          ],
        });
      }

      case 'composicoes': {
        const codeEditProfile = `const trigger = createButton({ variant: 'outline', label: 'Editar perfil' });

const form = document.createElement('form');
form.className = 'nds-stack';
form.dataset.spacing = 'md';
form.addEventListener('submit', (e) => e.preventDefault());

const title = createPopoverTitle({ text: 'Dados do perfil' });

const desc = document.createElement('p');
desc.className = 'nds-text-caption nds-text-muted-foreground';
desc.textContent = 'As mudanças são salvas ao confirmar.';

const nameRow = document.createElement('div');
nameRow.className = 'nds-stack';
nameRow.dataset.spacing = 'xs';
nameRow.append(
  createLabel({ text: 'Nome', htmlFor: 'pc-name' }),
  createInput({ id: 'pc-name', value: 'Joana Silva' }),
);

const emailRow = document.createElement('div');
emailRow.className = 'nds-stack';
emailRow.dataset.spacing = 'xs';
emailRow.append(
  createLabel({ text: 'Email', htmlFor: 'pc-email' }),
  createInput({ id: 'pc-email', type: 'email', value: 'joana@example.com' }),
);

const submit = createButton({ variant: 'default', size: 'sm', label: 'Atualizar', type: 'submit' });
form.append(title, desc, nameRow, emailRow, submit);

createPopover({ trigger, content: form });`;

        const codeTableFilter = `const trigger = createButton({ variant: 'outline', label: 'Filtros' });

const content = document.createElement('div');
content.className = 'nds-stack';
content.dataset.spacing = 'xs';

const title = createPopoverTitle({ text: 'Filtrar por status' });
content.appendChild(title);

for (const opt of ['Ativo', 'Pendente', 'Arquivado']) {
  const row = document.createElement('label');
  row.className = 'nds-cluster nds-text-body';
  row.dataset.spacing = 'xs';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'nds-icon-sm';
  if (opt === 'Ativo') cb.checked = true;
  const text = document.createElement('span');
  text.textContent = opt;
  row.append(cb, text);
  content.appendChild(row);
}

const actions = document.createElement('div');
actions.className = 'nds-cluster nds-pt-2';
actions.dataset.spacing = 'sm';
actions.dataset.justify = 'end';
actions.append(
  createButton({ variant: 'ghost',   size: 'sm', label: 'Limpar'  }),
  createButton({ variant: 'default', size: 'sm', label: 'Aplicar' }),
);
content.appendChild(actions);

createPopover({ trigger, content });`;

        const codeColorPicker = `const trigger = createButton({ variant: 'outline', label: 'Escolher cor da etiqueta' });

const content = document.createElement('div');
content.className = 'nds-stack';
content.dataset.spacing = 'xs';

const title = createPopoverTitle({ text: 'Cor da etiqueta' });

const grid = document.createElement('div');
grid.className = 'nds-grid';
grid.dataset.cols = '6';
grid.dataset.spacing = 'xs';

// A cor sai de token do tema, nunca de style inline: trocar de marca
// reescreve a paleta sem tocar no exemplo.
const swatches = [
  { name: 'Primária',   className: 'nds-bg-primary'     },
  { name: 'Secundária', className: 'nds-bg-secondary'   },
  { name: 'Sucesso',    className: 'nds-bg-success'     },
  { name: 'Atenção',    className: 'nds-bg-warning'     },
  { name: 'Informação', className: 'nds-bg-info'        },
  { name: 'Destrutiva', className: 'nds-bg-destructive' },
];

for (const s of swatches) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-label', s.name);
  btn.className = 'nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring ' + s.className;
  grid.appendChild(btn);
}

content.append(title, grid);
createPopover({ trigger, content });`;

        const codeQuickSettings = `const trigger = createButton({ variant: 'outline', label: 'Configurações' });

const content = document.createElement('div');
content.className = 'nds-stack';
content.dataset.spacing = 'sm';

const title = createPopoverTitle({ text: 'Preferências rápidas' });
content.appendChild(title);

const toggles = [
  { id: 'cfg-notifs',  label: 'Notificações',  checked: true  },
  { id: 'cfg-dark',    label: 'Modo escuro',   checked: false },
  { id: 'cfg-compact', label: 'Modo compacto', checked: false },
];

for (const t of toggles) {
  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.spacing = 'sm';
  row.dataset.justify = 'between';
  const label = createLabel({ text: t.label, htmlFor: t.id });
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.id = t.id;
  cb.className = 'nds-icon-sm';
  cb.checked = t.checked;
  row.append(label, cb);
  content.appendChild(row);
}

createPopover({ trigger, content });`;

        function buildEditProfilePreview(): HTMLElement {
          const trigger = createButton({ variant: 'outline', size: 'sm', label: t('demonstration.labels.form.trigger') });
          const form = document.createElement('form');
          form.className = 'nds-stack';
          form.dataset.spacing = 'md';
          form.addEventListener('submit', (e) => e.preventDefault());

          const heading = createPopoverTitle({ text: t('demonstration.labels.form.trigger') });

          const nameRow = document.createElement('div');
          nameRow.className = 'nds-stack';
          nameRow.dataset.spacing = 'xs';
          nameRow.append(
            createLabel({ text: t('demonstration.labels.form.name'), htmlFor: 'pc-name-bc' }),
            createInput({ id: 'pc-name-bc', value: 'Joana Silva' }),
          );

          const emailRow = document.createElement('div');
          emailRow.className = 'nds-stack';
          emailRow.dataset.spacing = 'xs';
          emailRow.append(
            createLabel({ text: t('demonstration.labels.form.email'), htmlFor: 'pc-email-bc' }),
            createInput({ id: 'pc-email-bc', type: 'email', value: 'joana@example.com' }),
          );

          const submit = createButton({ variant: 'default', size: 'sm', label: t('demonstration.labels.form.submit'), type: 'submit' });
          form.append(heading, nameRow, emailRow, submit);

          // A composição também é componente vivo: o clique aqui vale tanto
          // quanto o da demonstração, e `location` diz de QUAL seção ele veio.
          return createPopover({
            trigger,
            content: form,
            side: 'bottom',
            align: 'start',
            onOpenChange: trackPopoverOpenChange('edit-profile', 'docs_composicoes'),
          });
        }

        function buildTableFilterPreview(): HTMLElement {
          const trigger = createButton({
            variant: 'outline',
            size: 'sm',
            label: t('variants.compositions.tableFilter.trigger'),
          });
          const content = document.createElement('div');
          content.className = 'nds-stack';
          content.dataset.spacing = 'xs';

          const title = createPopoverTitle({ text: t('variants.compositions.tableFilter.title') });
          content.appendChild(title);

          for (const opt of ['active', 'pending', 'archived'] as const) {
            const row = document.createElement('label');
            row.className = 'nds-cluster nds-text-body';
            row.dataset.spacing = 'xs';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'nds-icon-sm';
            if (opt === 'active') cb.checked = true;
            const text = document.createElement('span');
            text.textContent = t(`variants.compositions.tableFilter.${opt}`);
            row.append(cb, text);
            content.appendChild(row);
          }

          const actions = document.createElement('div');
          actions.className = 'nds-cluster nds-pt-2';
          actions.dataset.spacing = 'sm';
          actions.dataset.justify = 'end';
          actions.append(
            createButton({ variant: 'ghost',   size: 'sm', label: t('variants.compositions.tableFilter.clear') }),
            createButton({ variant: 'default', size: 'sm', label: t('variants.compositions.tableFilter.apply') }),
          );
          content.appendChild(actions);

          return createPopover({
            trigger,
            content,
            side: 'bottom',
            align: 'start',
            onOpenChange: trackPopoverOpenChange('table-filter', 'docs_composicoes'),
          });
        }

        function buildColorPickerPreview(): HTMLElement {
          const trigger = createButton({
            variant: 'outline',
            size: 'sm',
            label: t('variants.compositions.colorPicker.trigger'),
          });
          const content = document.createElement('div');
          content.className = 'nds-stack';
          content.dataset.spacing = 'xs';

          const title = createPopoverTitle({ text: t('variants.compositions.colorPicker.title') });

          const grid = document.createElement('div');
          grid.className = 'nds-grid';
          grid.dataset.cols = '6';
          grid.dataset.spacing = 'xs';

          // A lista guarda a CHAVE, não o rótulo: o nome acessível de cada
          // amostra sai de `variants.compositions.colorPicker.<chave>`, então a
          // prévia fala o idioma da página em vez de português em `en` e `es`.
          const swatches = [
            { key: 'primary',     className: 'nds-bg-primary'     },
            { key: 'secondary',   className: 'nds-bg-secondary'   },
            { key: 'success',     className: 'nds-bg-success'     },
            { key: 'warning',     className: 'nds-bg-warning'     },
            { key: 'info',        className: 'nds-bg-info'        },
            { key: 'destructive', className: 'nds-bg-destructive' },
          ];

          for (const s of swatches) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('aria-label', t(`variants.compositions.colorPicker.${s.key}`));
            btn.className = `${SWATCH_CLASSES} ${s.className}`;
            grid.appendChild(btn);
          }

          content.append(title, grid);
          return createPopover({
            trigger,
            content,
            side: 'bottom',
            align: 'start',
            onOpenChange: trackPopoverOpenChange('color-picker', 'docs_composicoes'),
          });
        }

        function buildQuickSettingsPreview(): HTMLElement {
          const trigger = createButton({
            variant: 'outline',
            size: 'sm',
            label: t('variants.compositions.quickSettings.trigger'),
          });
          const content = document.createElement('div');
          content.className = 'nds-stack';
          content.dataset.spacing = 'sm';

          const title = createPopoverTitle({ text: t('variants.compositions.quickSettings.title') });
          content.appendChild(title);

          const toggles = [
            { id: 'cfg-notifs-bc',  key: 'notifications', checked: true  },
            { id: 'cfg-dark-bc',    key: 'darkMode',      checked: false },
            { id: 'cfg-compact-bc', key: 'compactMode',   checked: false },
          ];

          for (const tg of toggles) {
            const row = document.createElement('div');
            row.className = 'nds-cluster';
            row.dataset.spacing = 'sm';
            row.dataset.justify = 'between';
            const label = createLabel({
              text: t(`variants.compositions.quickSettings.${tg.key}`),
              htmlFor: tg.id,
            });
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.id = tg.id;
            cb.className = 'nds-icon-sm';
            cb.checked = tg.checked;
            row.append(label, cb);
            content.appendChild(row);
          }

          return createPopover({
            trigger,
            content,
            side: 'bottom',
            align: 'start',
            onOpenChange: trackPopoverOpenChange('quick-settings', 'docs_composicoes'),
          });
        }

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'popover',
          items: [
            {
              trackId: 'editProfile',
              name: stripHtml(t('variants.compositions.editProfile.name')),
              description: stripHtml(t('variants.compositions.editProfile.description')),
              useWhen: stripHtml(t('variants.compositions.editProfile.use')),
              code: codeEditProfile,
              previewFactory: () => buildEditProfilePreview(),
            },
            {
              trackId: 'tableFilter',
              name: stripHtml(t('variants.compositions.tableFilter.name')),
              description: stripHtml(t('variants.compositions.tableFilter.description')),
              useWhen: stripHtml(t('variants.compositions.tableFilter.use')),
              code: codeTableFilter,
              previewFactory: () => buildTableFilterPreview(),
            },
            {
              trackId: 'colorPicker',
              name: stripHtml(t('variants.compositions.colorPicker.name')),
              description: stripHtml(t('variants.compositions.colorPicker.description')),
              useWhen: stripHtml(t('variants.compositions.colorPicker.use')),
              code: codeColorPicker,
              previewFactory: () => buildColorPickerPreview(),
            },
            {
              trackId: 'quickSettings',
              name: stripHtml(t('variants.compositions.quickSettings.name')),
              description: stripHtml(t('variants.compositions.quickSettings.description')),
              useWhen: stripHtml(t('variants.compositions.quickSettings.use')),
              code: codeQuickSettings,
              previewFactory: () => buildQuickSettingsPreview(),
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
            { label: t('states.closed.label'),        trigger: toPlainText(t('states.closed.trigger')),        behavior: toPlainText(t('states.closed.behavior')) },
            { label: t('states.open.label'),          trigger: toPlainText(t('states.open.trigger')),          behavior: toPlainText(t('states.open.behavior')) },
            { label: t('states.transitioning.label'), trigger: toPlainText(t('states.transitioning.trigger')), behavior: toPlainText(t('states.transitioning.behavior')) },
            { label: t('states.focused.label'),       trigger: toPlainText(t('states.focused.trigger')),       behavior: toPlainText(t('states.focused.behavior')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createPopover(options)
export type PopoverSide = 'top' | 'bottom' | 'left' | 'right';
export type PopoverAlign = 'start' | 'center' | 'end';

export type PopoverOptions = {
  trigger: HTMLElement;
  content: HTMLElement | string;
  side?: PopoverSide;          // default 'bottom'
  align?: PopoverAlign;        // default 'center'
  sideOffset?: number;         // default 8
  open?: boolean;              // presente = modo controlado
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

// O elemento devolvido abre e fecha por código.
export type PopoverElement = DestroyableElement & {
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOpen: (open: boolean) => void;
};

export function createPopover(options: PopoverOptions): PopoverElement;

// ─── Partes do painel ───────────────────────────────────────────────────────
export type PopoverPartOptions = { text?: string; class?: string };

export function createPopoverHeader(options?: PopoverPartOptions): HTMLElement;
export function createPopoverTitle(
  options?: PopoverPartOptions & { level?: 1 | 2 | 3 | 4 | 5 | 6 },  // default 4
): HTMLElement;
export function createPopoverDescription(options?: PopoverPartOptions): HTMLElement;`;

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
              title: 'createPopover(options)',
              cols: propsCols,
              items: [
                { name: 'trigger',      type: 'HTMLElement',                         defaultValue: '—',         required: 'Sim', description: 'Elemento que abre o popover ao clicar (geralmente Button).' },
                { name: 'content',      type: 'HTMLElement | string',                defaultValue: '—',         required: 'Sim', description: 'Conteúdo do painel. String é renderizada via textContent.' },
                { name: 'side',         type: "'top' | 'bottom' | 'left' | 'right'", defaultValue: "'bottom'",  required: 'Não', description: toPlainText(t('props.table.side.description')) + ' Sai no markup como data-side. A posição é fixa: não há reposicionamento automático por colisão.' },
                { name: 'align',        type: "'start' | 'center' | 'end'",          defaultValue: "'center'",  required: 'Não', description: toPlainText(t('props.table.align.description')) + ' Sai no markup como data-align.' },
                { name: 'sideOffset',   type: 'number',                              defaultValue: '8',         required: 'Não', description: toPlainText(t('props.table.sideOffset.description')) },
                { name: 'open',         type: 'boolean',                             defaultValue: '—',         required: 'Não', description: toPlainText(t('props.table.open.description')) + ' Definida, o painel passa ao modo controlado: clique, Escape e clique fora só anunciam a intenção por onOpenChange, e quem move o painel é setOpen().' },
                { name: 'defaultOpen',  type: 'boolean',                             defaultValue: 'false',     required: 'Não', description: 'Estado inicial no modo não-controlado.' },
                { name: 'onOpenChange', type: '(open: boolean) => void',             defaultValue: '—',         required: 'Não', description: toPlainText(t('props.table.onOpenChange.description')) },
                { name: 'class',        type: 'string',                              defaultValue: '—',         required: 'Não', description: 'Classes adicionais aplicadas ao painel flutuante.' },
              ],
            },
            {
              title: 'createPopoverHeader / createPopoverTitle / createPopoverDescription',
              cols: propsCols,
              items: [
                { name: 'text',  type: 'string',                    defaultValue: '—', required: 'Não', description: 'Texto da parte, escrito por textContent.' },
                { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6',     defaultValue: '4', required: 'Não', description: 'Só no título: profundidade do cabeçalho. O painel é um diálogo e usa este elemento como nome acessível; trocar o nível encaixa o título na hierarquia da página.' },
                { name: 'class', type: 'string',                    defaultValue: '—', required: 'Não', description: 'Classes .nds-* adicionais na parte.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibilityCode'),
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
            { token: '--popover',             value: t('tokens.table.popover.class'),            description: t('tokens.table.popover.part')            },
            { token: '--popover-foreground',  value: t('tokens.table.popoverForeground.class'),  description: t('tokens.table.popoverForeground.part')  },
            { token: '--muted-foreground',    value: t('tokens.table.mutedForeground.class'),    description: t('tokens.table.mutedForeground.part')    },
            { token: '--border',              value: t('tokens.table.border.class'),             description: t('tokens.table.border.part')             },
            { token: '--elevation-md',        value: t('tokens.table.shadow.class'),             description: t('tokens.table.shadow.part')             },
            { token: '--ring',                value: t('tokens.table.ring.class'),               description: t('tokens.table.ring.part')               },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });

      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [1, 2, 3, 4, 5, 6].map(i => DOMPurify.sanitize(t(`accessibility.items.item${i}`))),
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',       description: toPlainText(t('accessibility.keyboard.tab'))      },
            { key: 'Shift+Tab', description: toPlainText(t('accessibility.keyboard.shiftTab')) },
            { key: 'Esc',       description: toPlainText(t('accessibility.keyboard.escape'))   },
            { key: 'Enter',     description: toPlainText(t('accessibility.keyboard.enter'))    },
            { key: 'Space',     description: toPlainText(t('accessibility.keyboard.space'))    },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.tooltip.name'),      description: toPlainText(t('related.items.tooltip.description')),      path: '?path=/docs/components-overlay-tooltip--docs'      },
            { name: t('related.items.dropdownMenu.name'), description: toPlainText(t('related.items.dropdownMenu.description')), path: '?path=/docs/components-overlay-dropdownmenu--docs' },
            { name: t('related.items.dialog.name'),       description: toPlainText(t('related.items.dialog.description')),       path: '?path=/docs/components-overlay-dialog--docs'       },
            { name: t('related.items.hoverCard.name'),    description: toPlainText(t('related.items.hoverCard.description')),    path: '?path=/docs/components-overlay-hovercard--docs'    },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [1, 2, 3, 4].map(i => ({ title: '', content: DOMPurify.sanitize(t(`notes.item${i}`)) })),
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: tNav('common.event'),
            trigger: tNav('common.eventTrigger'),
            payload: tNav('common.payload'),
          },
          items: [
            {
              event: 'popover_open',
              trigger: stripHtml(t('analytics.table.popover_open.trigger')),
              payload: stripHtml(t('analytics.table.popover_open.payload')),
            },
            {
              event: 'popover_close',
              trigger: stripHtml(t('analytics.table.popover_close.trigger')),
              payload: stripHtml(t('analytics.table.popover_close.payload')),
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
            items: [1, 2, 3, 4].map(i => ({
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
            items: [1, 2, 3, 4, 5].map(i => ({
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
        component_name: 'popover',
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
      // Also remove any leaked popover panels
      document.querySelectorAll('[data-slot="popover-content"]').forEach((n) => n.remove());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
