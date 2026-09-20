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
  type PopoverCloseReason,
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
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.entries(
    (popoverTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  )
    .filter(([k]) => k !== 'title')
    .map(([, v]) => v);
}
// Opções que só existem na fábrica desta stack — `trigger`, `content`,
// `ariaLabel`, `class` e as das sub-fábricas —, e as notas que a tabela de props
// acrescenta à descrição compartilhada sobre o que ESTA fábrica escreve no
// markup. É API de framework, e por isso não tem chave em `docs/shared/content`:
// o override é o mecanismo, com descrição nos três idiomas. Escritas à mão na
// tabela, ficavam em português para quem lesse a página em inglês ou espanhol.
const PROPS_OVERRIDES = {
  'pt-BR': {
    'props.table.trigger.description': 'Elemento que abre o popover ao clicar (geralmente Button).',
    'props.table.content.description': 'Conteúdo do painel. String é renderizada via textContent.',
    'props.table.ariaLabel.description': 'Nome acessível declarado do painel. Só age quando o conteúdo não traz título: com título quem nomeia é o aria-labelledby, e os dois juntos seriam ambiguidade.',
    'props.table.class.description': 'Classes adicionais aplicadas ao painel flutuante.',
    'props.table.side.markupNote': 'Sai no markup como data-side.',
    'props.table.align.markupNote': 'Sai no markup como data-align.',
    'props.table.open.markupNote': 'Definida, o painel passa ao modo controlado: clique, Escape e clique fora só anunciam a intenção por onOpenChange, e quem move o painel é setOpen().',
    'props.table.onOpenChange.markupNote': 'Os quatro caminhos: escape, overlay (clique fora, clique no gatilho de novo, ou Tab para fora do painel), close-button (qualquer elemento marcado com data-slot="popover-close" dentro do painel) e api (a chamada de close() no que a fábrica devolve).',
    'props.table.parts.text.description': 'Texto da parte, escrito por textContent.',
    'props.table.parts.level.description': 'Só no título: profundidade do cabeçalho. O painel é um diálogo e usa este elemento como nome acessível; trocar o nível encaixa o título na hierarquia da página.',
    'props.table.parts.class.description': 'Classes .nds-* adicionais na parte.',
  },
  en: {
    'props.table.trigger.description': 'Element that opens the popover on click (usually a Button).',
    'props.table.content.description': 'Panel content. A string is rendered through textContent.',
    'props.table.ariaLabel.description': 'Declared accessible name of the panel. It only applies when the content has no title: with a title, aria-labelledby names the panel, and both together would be ambiguous.',
    'props.table.class.description': 'Additional classes applied to the floating panel.',
    'props.table.side.markupNote': 'Rendered in the markup as data-side.',
    'props.table.align.markupNote': 'Rendered in the markup as data-align.',
    'props.table.open.markupNote': 'When set, the panel becomes controlled: click, Escape and outside click only announce the intent through onOpenChange, and setOpen() is what moves the panel.',
    'props.table.onOpenChange.markupNote': 'The four paths: escape, overlay (outside click, clicking the trigger again, or Tab out of the panel), close-button (any element marked with data-slot="popover-close" inside the panel) and api (calling close() on what the factory returns).',
    'props.table.parts.text.description': 'Text of the part, written through textContent.',
    'props.table.parts.level.description': 'Title only: heading depth. The panel is a dialog and uses this element as its accessible name; changing the level fits the title into the page hierarchy.',
    'props.table.parts.class.description': 'Additional .nds-* classes on the part.',
  },
  es: {
    'props.table.trigger.description': 'Elemento que abre el popover al hacer clic (generalmente un Button).',
    'props.table.content.description': 'Contenido del panel. Un string se renderiza mediante textContent.',
    'props.table.ariaLabel.description': 'Nombre accesible declarado del panel. Solo actúa cuando el contenido no trae título: con título quien nombra es aria-labelledby, y los dos juntos serían ambigüedad.',
    'props.table.class.description': 'Clases adicionales aplicadas al panel flotante.',
    'props.table.side.markupNote': 'Sale en el markup como data-side.',
    'props.table.align.markupNote': 'Sale en el markup como data-align.',
    'props.table.open.markupNote': 'Definida, el panel pasa al modo controlado: clic, Escape y clic fuera solo anuncian la intención por onOpenChange, y quien mueve el panel es setOpen().',
    'props.table.onOpenChange.markupNote': 'Los cuatro caminos: escape, overlay (clic fuera, clic de nuevo en el disparador, o Tab fuera del panel), close-button (cualquier elemento marcado con data-slot="popover-close" dentro del panel) y api (la llamada a close() en lo que devuelve la fábrica).',
    'props.table.parts.text.description': 'Texto de la parte, escrito mediante textContent.',
    'props.table.parts.level.description': 'Solo en el título: profundidad del encabezado. El panel es un diálogo y usa este elemento como nombre accesible; cambiar el nivel encaja el título en la jerarquía de la página.',
    'props.table.parts.class.description': 'Clases .nds-* adicionales en la parte.',
  },
};
const { t, subscribe } = createTranslation(popoverTranslations as Record<string, unknown>, PROPS_OVERRIDES);

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
function trackPopoverOpenChange(
  triggerId: string,
  location: string,
): (open: boolean, reason?: PopoverCloseReason) => void {
  return (open, reason) => {
    if (open) {
      track('popover_open', { component: 'popover', trigger_id: triggerId, location });
    } else {
      // O motivo vem da FÁBRICA, que conhece o caminho do fechamento; `api` é o
      // padrão dela para tudo que não foi gesto — e aqui também, por segurança.
      track('popover_close', { component: 'popover', reason: reason ?? 'api', location });
    }
  };
}

/**
 * Amostra de cor do exemplo de paleta — a MESMA das cinco stories, mais
 * `nds-ring-selected`: o anel da ESCOLHA, estático, que casa o próprio
 * `aria-pressed` do botão. Não há classe de estado a alternar.
 */
const SWATCH_CLASSES = 'nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-ring-selected';

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

  // O botão de CONFIRMAR do rodapé, quando ele existe. Sai daqui para ser ligado
  // depois da fábrica: ele fecha por CÓDIGO, e o `close()` só existe lá.
  let save: HTMLButtonElement | undefined;

  if (showActions) {
    const actions = document.createElement('div');
    actions.className = 'nds-cluster';
    actions.dataset.spacing = 'sm';
    actions.dataset.justify = 'end';
    const cancel = createButton({ variant: 'ghost', size: 'sm', label: t('demonstration.labels.cancel') });
    // O Cancelar FECHA: a fábrica delega o clique em `[data-slot="popover-close"]`
    // dentro do painel e relata `close-button` ao `onOpenChange` — que é o que o
    // rastreio logo acima manda ao GA4. Sem a marca, a demonstração da página
    // ensinava um Cancelar inerte e o motivo `close-button` da tabela de
    // analytics não tinha caminho nenhum que o produzisse.
    cancel.dataset.slot = 'popover-close';
    save = createButton({ variant: 'default', size: 'sm', label: t('demonstration.labels.save') });
    actions.append(cancel, save);
    content.appendChild(actions);
  }

  const popover = createPopover({
    trigger,
    content,
    side: 'bottom',
    align: 'center',
    onOpenChange: trackPopoverOpenChange(triggerId, location),
  });

  // Salvar fecha por CÓDIGO, e é isso que manda `api` ao GA4 — "concluiu". Se o
  // Salvar levasse a marca do Cancelar, o relatório receberia `close-button` e
  // "concluiu" ficaria indistinguível de "desistiu".
  save?.addEventListener('click', () => {
    // …aqui entraria a gravação das preferências…
    popover.close();
  });

  return popover;
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
  // Sair sem confirmar é FECHAR o painel — a marca é o que liga o botão à
  // delegação da fábrica.
  cancel.dataset.slot = 'popover-close';
  const submit = createButton({ variant: 'default', size: 'sm', label: t('demonstration.labels.form.submit'), type: 'submit' });
  actions.append(cancel, submit);

  content.append(nameRow, emailRow, actions);

  const popover = createPopover({
    trigger,
    content,
    side: 'bottom',
    align: 'start',
    onOpenChange: trackPopoverOpenChange(triggerId, location),
  });

  // Os dois botões fecham por caminhos DIFERENTES, e é a diferença que o
  // relatório lê: o Cancelar é a peça de fechar (`close-button`, desistiu), e
  // o envio do formulário fecha por código depois de salvar (`api`, concluiu).
  content.addEventListener('submit', (e) => {
    e.preventDefault();
    // …aqui entraria a gravação do formulário…
    popover.close();
  });

  return popover;
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
          items: [1, 2, 3, 4, 5, 6].map(i => DOMPurify.sanitize(t(`anatomy.item${i}`))),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
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
            items: [1, 2, 3, 4, 5, 6].map(i => ({
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
  sideOffset: 4,
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
// ... Inputs

// Sair sem confirmar FECHA o painel: a fábrica delega o clique em
// [data-slot="popover-close"] dentro do painel e relata 'close-button'.
// Sem a marca não há ouvinte a escrever — o botão fica inerte.
const cancel = createButton({ variant: 'ghost', size: 'sm', label: 'Cancelar', type: 'button' });
cancel.dataset.slot = 'popover-close';

form.append(cancel, createButton({ variant: 'default', size: 'sm', label: 'Atualizar', type: 'submit' }));

const popover = createPopover({ trigger, content: form });

// Confirmar fecha por CÓDIGO, depois de salvar — o motivo que chega ao
// onOpenChange é 'api'. Só a peça marcada relata 'close-button', e é ela que
// diz "desistiu": é essa diferença que o relatório lê.
form.addEventListener('submit', (e) => {
  e.preventDefault();
  popover.close();
});`;

        return createDocsVariants({
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

const popover = createPopover({ trigger, content: form });

// Confirmar fecha por CÓDIGO, depois de salvar — motivo 'api'.
form.addEventListener('submit', (e) => {
  e.preventDefault();
  popover.close();
});`;

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
const apply = createButton({ variant: 'default', size: 'sm', label: 'Aplicar' });
actions.append(createButton({ variant: 'ghost', size: 'sm', label: 'Limpar' }), apply);
content.appendChild(actions);

const popover = createPopover({ trigger, content });

// Aplicar é a CONFIRMAÇÃO: aplica o filtro e fecha por código, relatando
// 'api'. A marca data-slot="popover-close" é do botão de desistir.
apply.addEventListener('click', () => popover.close());`;

        const codeColorPicker = `const trigger = createButton({ variant: 'outline', label: 'Escolher cor da etiqueta' });

const content = document.createElement('div');
content.className = 'nds-stack';
content.dataset.spacing = 'xs';

const title = createPopoverTitle({ text: 'Cor da etiqueta' });

const grid = document.createElement('div');
grid.className = 'nds-grid';
grid.dataset.cols = '6';
// Sem \`data-fixed\` o \`data-cols\` cai no auto-fit, e num painel estreito
// cabe UMA coluna: é ele que faz o grid respeitar as seis.
grid.dataset.fixed = 'true';
grid.dataset.spacing = 'xs';

// A cor sai de token do tema, nunca de style inline: trocar de marca
// reescreve a paleta sem tocar no exemplo.
const swatches = [
  { key: 'primary',     name: 'Primária',   className: 'nds-bg-primary'     },
  { key: 'secondary',   name: 'Secundária', className: 'nds-bg-secondary'   },
  { key: 'success',     name: 'Sucesso',    className: 'nds-bg-success'     },
  { key: 'warning',     name: 'Atenção',    className: 'nds-bg-warning'     },
  { key: 'info',        name: 'Informação', className: 'nds-bg-info'        },
  { key: 'destructive', name: 'Destrutiva', className: 'nds-bg-destructive' },
];

// Seleção única: a escolhida se anuncia por \`aria-pressed\`, e uma nasce
// escolhida para o estado ser legível sem interação.
const buttons = new Map();
let selectedColor = 'primary';

function applySelection() {
  for (const [key, btn] of buttons) {
    btn.setAttribute('aria-pressed', String(key === selectedColor));
  }
}

for (const s of swatches) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-label', s.name);
  btn.className = 'nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-ring-selected ' + s.className;
  btn.addEventListener('click', () => {
    selectedColor = s.key;
    applySelection();
  });
  buttons.set(s.key, btn);
  grid.appendChild(btn);
}
applySelection();

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
          const popover = createPopover({
            trigger,
            content: form,
            side: 'bottom',
            align: 'start',
            onOpenChange: trackPopoverOpenChange('edit-profile', 'docs_composicoes'),
          });

          // Confirmar fecha por código, com o motivo `api`.
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            popover.close();
          });

          return popover;
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
          const apply = createButton({ variant: 'default', size: 'sm', label: t('variants.compositions.tableFilter.apply') });
          actions.append(
            createButton({ variant: 'ghost',   size: 'sm', label: t('variants.compositions.tableFilter.clear') }),
            apply,
          );
          content.appendChild(actions);

          const popover = createPopover({
            trigger,
            content,
            side: 'bottom',
            align: 'start',
            onOpenChange: trackPopoverOpenChange('table-filter', 'docs_composicoes'),
          });

          // Aplicar é a CONFIRMAÇÃO: aplica o filtro e fecha por código
          // (`api`). A marca `data-slot="popover-close"` é do Cancelar, e
          // relataria `close-button` — o motivo de quem saiu sem decidir.
          apply.addEventListener('click', () => popover.close());

          return popover;
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
          // Sem `data-fixed` o `data-cols` cai no auto-fit da regra base, cujo
          // `--grid-min` é 16rem: dentro do painel cabe UMA coluna, e o
          // atributo vira no-op silencioso.
          grid.dataset.fixed = 'true';
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

          // A seção de composições renderiza componente VIVO, e um seletor onde
          // a escolha não acontece documenta um desenho, não um componente.
          // Seleção única, anunciada por `aria-pressed` — o atributo de botão
          // alternador que o `toggle` deste sistema já usa. Uma amostra nasce
          // escolhida para o estado ser legível sem interação.
          const buttons = new Map<string, HTMLButtonElement>();
          let selectedColor = 'primary';

          function applySelection() {
            for (const [key, btn] of buttons) {
              btn.setAttribute('aria-pressed', String(key === selectedColor));
            }
          }

          for (const s of swatches) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('aria-label', t(`variants.compositions.colorPicker.${s.key}`));
            btn.className = `${SWATCH_CLASSES} ${s.className}`;
            btn.addEventListener('click', () => {
              selectedColor = s.key;
              applySelection();
              // O `label` é a CHAVE da cor, nunca o texto traduzido, que
              // dividiria uma série em três no GA4.
              track('option_select', {
                component: 'popover',
                field_name: 'label_color',
                value: s.key,
                label: s.key,
                location: 'docs_composicoes',
              });
            });
            buttons.set(s.key, btn);
            grid.appendChild(btn);
          }
          applySelection();

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
          cols: {
            state: t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            { label: t('states.closed.label'),        trigger: toPlainText(t('states.closed.trigger')),        behavior: toPlainText(t('states.closed.behavior')) },
            { label: t('states.open.label'),          trigger: toPlainText(t('states.open.trigger')),          behavior: toPlainText(t('states.open.behavior')) },
            { label: t('states.controlled.label'),    trigger: toPlainText(t('states.controlled.trigger')),    behavior: toPlainText(t('states.controlled.behavior')) },
            { label: t('states.modal.label'),         trigger: toPlainText(t('states.modal.trigger')),         behavior: toPlainText(t('states.modal.behavior')) },
            { label: t('states.transitioning.label'), trigger: toPlainText(t('states.transitioning.trigger')), behavior: toPlainText(t('states.transitioning.behavior')) },
            { label: t('states.focused.label'),       trigger: toPlainText(t('states.focused.trigger')),       behavior: toPlainText(t('states.focused.behavior')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createPopover(options)
export type PopoverSide = 'top' | 'bottom' | 'left' | 'right';
export type PopoverAlign = 'start' | 'center' | 'end';

// Por qual caminho o painel fechou. Chega no segundo argumento do callback.
export type PopoverCloseReason = 'escape' | 'overlay' | 'close-button' | 'api';

export type PopoverOptions = {
  trigger: HTMLElement;
  content: HTMLElement | string;
  side?: PopoverSide;          // default 'bottom'
  align?: PopoverAlign;        // default 'center'
  sideOffset?: number;         // default 4  — vão no eixo do \`side\`
  alignOffset?: number;        // default 0  — vão no eixo do \`align\`
  open?: boolean;              // presente = modo controlado
  defaultOpen?: boolean;
  modal?: boolean;             // default false — foco preso + rolagem travada
  ariaLabel?: string;          // só age no painel SEM título
  onOpenChange?: (open: boolean, reason?: PopoverCloseReason) => void;
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
  options?: PopoverPartOptions & { level?: 1 | 2 | 3 | 4 | 5 | 6 },  // default 2
): HTMLElement;
export function createPopoverDescription(options?: PopoverPartOptions): HTMLElement;

// ─── Fechar de DENTRO do painel ─────────────────────────────────────────────
// Não há uma quarta fábrica: o controle de fechar é uma MARCA no botão de quem
// compõe. A fábrica delega o clique em [data-slot="popover-close"] dentro do
// painel, em qualquer profundidade, e relata 'close-button'.
const cancelar = createButton({ variant: 'ghost', size: 'sm', label: 'Cancelar' });
cancelar.dataset.slot = 'popover-close';

// ─── Fechar por CÓDIGO, depois de salvar ────────────────────────────────────
// O botão de confirmar NÃO leva a marca: ele chama close() na instância, e o
// motivo que chega ao onOpenChange é 'api'. É o que separa "concluiu" de
// "desistiu" no relatório — com a marca, os dois chegariam como 'close-button'.
const salvar = createButton({ variant: 'default', size: 'sm', label: 'Salvar' });
const popover = createPopover({ trigger, content });
salvar.addEventListener('click', () => popover.close());`;

        const propsCols = {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        };

        return createDocsProps({
          tables: [
            {
              title: 'createPopover(options)',
              cols: propsCols,
              items: [
                // Tipo, padrão, obrigatoriedade e descrição saem do conteúdo
                // compartilhado, como nas outras quatro stacks. Escritos à mão
                // aqui, ficavam em português nos três idiomas — esta era a
                // única das cinco que não lia `props.table.*`, e a tabela
                // publicava 'Sim'/'Não' para quem lesse a página em inglês ou
                // espanhol. As quatro opções que só existem nesta fábrica
                // (`trigger`, `content`, `ariaLabel`, `class`) não têm chave no
                // conteúdo: a obrigatoriedade traduz pelo vocabulário comum da
                // interface, e a descrição pelo override `PROPS_OVERRIDES`, no topo.
                { name: 'trigger',      type: 'HTMLElement',                      defaultValue: '—',                                  required: tNav('common.yes'),                     description: t('props.table.trigger.description') },
                { name: 'content',      type: 'HTMLElement | string',             defaultValue: '—',                                  required: tNav('common.yes'),                     description: t('props.table.content.description') },
                { name: 'side',         type: t('props.table.side.type'),         defaultValue: t('props.table.side.default'),         required: t('props.table.side.required'),         description: toPlainText(t('props.table.side.description')) + ' ' + t('props.table.side.markupNote') },
                { name: 'align',        type: t('props.table.align.type'),        defaultValue: t('props.table.align.default'),        required: t('props.table.align.required'),        description: toPlainText(t('props.table.align.description')) + ' ' + t('props.table.align.markupNote') },
                { name: 'sideOffset',   type: t('props.table.sideOffset.type'),   defaultValue: t('props.table.sideOffset.default'),   required: t('props.table.sideOffset.required'),   description: toPlainText(t('props.table.sideOffset.description')) },
                { name: 'alignOffset',  type: t('props.table.alignOffset.type'),  defaultValue: t('props.table.alignOffset.default'),  required: t('props.table.alignOffset.required'),  description: toPlainText(t('props.table.alignOffset.description')) },
                { name: 'open',         type: t('props.table.open.type'),         defaultValue: t('props.table.open.default'),         required: t('props.table.open.required'),         description: toPlainText(t('props.table.open.description')) + ' ' + t('props.table.open.markupNote') },
                { name: 'defaultOpen',  type: t('props.table.defaultOpen.type'),  defaultValue: t('props.table.defaultOpen.default'),  required: t('props.table.defaultOpen.required'),  description: toPlainText(t('props.table.defaultOpen.description')) },
                { name: 'modal',        type: t('props.table.modal.type'),        defaultValue: t('props.table.modal.default'),        required: t('props.table.modal.required'),        description: toPlainText(t('props.table.modal.description')) },
                { name: 'ariaLabel',    type: 'string',                           defaultValue: '—',                                  required: tNav('common.no'),                      description: t('props.table.ariaLabel.description') },
                { name: 'onOpenChange', type: t('props.table.onOpenChange.type'), defaultValue: t('props.table.onOpenChange.default'), required: t('props.table.onOpenChange.required'), description: toPlainText(t('props.table.onOpenChange.description')) + ' ' + t('props.table.onOpenChange.markupNote') },
                { name: 'class',        type: 'string',                           defaultValue: '—',                                  required: tNav('common.no'),                      description: t('props.table.class.description') },
              ],
            },
            {
              title: 'createPopoverHeader / createPopoverTitle / createPopoverDescription',
              cols: propsCols,
              items: [
                { name: 'text',  type: 'string',                    defaultValue: '—', required: tNav('common.no'), description: t('props.table.parts.text.description') },
                { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6',     defaultValue: '2', required: tNav('common.no'), description: t('props.table.parts.level.description') },
                { name: 'class', type: 'string',                    defaultValue: '—', required: tNav('common.no'), description: t('props.table.parts.class.description') },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityCode: t('props.extensibilityCode'),
        });
      }

      case 'tokens':
        return createDocsTokens({
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
            // As oito linhas de geometria e tipografia. Existiam no conteúdo
            // compartilhado e ficavam INERTES: a tabela é lista literal em cada
            // docs page, então chave sem linha não aparece em lugar nenhum — a
            // página publicava seis tokens de cor e calava tudo que dá forma ao
            // painel.
            { token: '--z-popover',           value: t('tokens.table.zIndex.class'),             description: t('tokens.table.zIndex.part')             },
            { token: '--spacing-4',           value: t('tokens.table.padding.class'),            description: t('tokens.table.padding.part')            },
            { token: '--spacing-2-5',         value: t('tokens.table.gap.class'),                description: t('tokens.table.gap.part')                },
            { token: '--radius',              value: t('tokens.table.radius.class'),             description: t('tokens.table.radius.part')             },
            { token: '--text-control',        value: t('tokens.table.text.class'),               description: t('tokens.table.text.part')               },
            { token: '--spacing-1-5',         value: t('tokens.table.headerGap.class'),          description: t('tokens.table.headerGap.part')          },
            { token: '--text-control-lg',     value: t('tokens.table.titleSize.class'),          description: t('tokens.table.titleSize.part')          },
            { token: '--font-weight-medium',  value: t('tokens.table.titleWeight.class'),        description: t('tokens.table.titleWeight.part')        },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });

      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          summary: t('accessibility.summary'),
          // Os itens da lista mais o bloco `aria`: o container tem uma lista só,
          // e deixar os quatro atributos de fora perde a metade verificável.
          items: [
            ...[1, 2, 3, 4, 5, 6].map(i => DOMPurify.sanitize(t(`accessibility.items.item${i}`))),
            ...['role', 'labelledBy', 'describedBy', 'expanded', 'hasPopup', 'controls', 'modal'].map(k =>
              DOMPurify.sanitize(t(`accessibility.aria.${k}`)),
            ),
          ],
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
          items: [
            { name: t('related.items.tooltip.name'),      description: toPlainText(t('related.items.tooltip.description')),      path: '?path=/docs/components-overlay-tooltip--docs'      },
            { name: t('related.items.dropdownMenu.name'), description: toPlainText(t('related.items.dropdownMenu.description')), path: '?path=/docs/components-navigation-dropdownmenu--docs' },
            { name: t('related.items.dialog.name'),       description: toPlainText(t('related.items.dialog.description')),       path: '?path=/docs/components-overlay-dialog--docs'       },
            { name: t('related.items.hoverCard.name'),    description: toPlainText(t('related.items.hoverCard.description')),    path: '?path=/docs/components-overlay-hovercard--docs'    },
          ],
        });

      case 'notas':
        return createDocsNotes({
          items: [1, 2, 3, 4].map(i => ({ title: '', content: DOMPurify.sanitize(t(`notes.item${i}`)) })),
        });

      case 'analytics':
        return createDocsAnalytics({
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
