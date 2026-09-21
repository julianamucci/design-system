import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createDialog, type DialogOptions } from '@/components/ui/dialog';
import { createButton } from '@/components/ui/button';
import { createInput } from '@/components/ui/input';
import { createLabel } from '@/components/ui/label';
import { createFormField } from '@/components/ui/form';
import uiTranslations from '@/i18n/ui.json';
import dialogTranslations from '@shared/content/dialog/translations.json';

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
const { t, subscribe } = createTranslation(dialogTranslations as Record<string, unknown>);

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
 * Variantes, Composições, Estados e Do & Don't renderizam componente VIVO, e um
 * clique ali é tão real quanto o da demonstração. Cravar `docs_demo` em tudo
 * junta quatro seções num balde só no GA4, e a página deixa de responder onde
 * o leitor de fato experimentou o componente.
 */
type DocsLocation = 'docs_demo' | 'docs_variantes' | 'docs_composicoes' | 'docs_do_dont';

type DialogDemoOptions = {
  /**
   * Id ESTÁVEL desta demo, para o payload — nunca o texto do gatilho.
   *
   * Existe porque `triggerLabel` e `actionLabel` vêm de `t(...)` e iam direto
   * para `dialog_open`, `dialog_close` e `dialog_confirm`: o mesmo evento virava
   * três valores no GA4, um por idioma, e a série não juntava. O
   * `i18n_text_in_payload` não pegava — ele lê a chamada de tradução DENTRO do
   * payload e é cego a `label: opts.triggerLabel`, que é indireção.
   */
  demoId: string;
  /** Id estável da ação primária (`save`, `delete`, `ok`), para o `action` do `dialog_confirm`. */
  actionId: string;
  triggerLabel: string;
  triggerVariant?: 'default' | 'outline' | 'destructive';
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
  destructive?: boolean;
  showCloseButton?: boolean;
  bodyText?: string;
  /**
   * Ações que entram ANTES do cancelar — as mais secundárias do rodapé.
   *
   * Existe para o caso do "Fechar" próprio, que é a ação de menor ênfase dos
   * três e por isso abre a lista.
   */
  leadingActions?: HTMLElement[];
  location: DocsLocation;
};

/**
 * Os dois ganchos de rastreio de UMA prévia — abertura e fechamento com o id
 * estável dela (`prd/dialog.md` §9: o Dialog manda `trigger_id`, nunca texto).
 *
 * Existe porque metade das prévias da página não passa por `buildDialogDemo`:
 * a de rolagem, a sem rodapé e as duas composições chamavam `createDialog`
 * direto e abriam sem deixar rastro. E o id da de fechar próprio estava trocado
 * — ela mandava `scroll-content`, que é o nome da de rolagem —, então as
 * quatro stacks que copiaram o vanilla herdaram a troca (medido em 2026-09-10).
 */
function dialogTracking(
  triggerId: string,
  location: DocsLocation,
): Pick<DialogOptions, 'onOpenChange' | 'onClose'> {
  return {
    onOpenChange: (open) => {
      if (open) track('dialog_open', { component: 'dialog', trigger_id: triggerId, location });
    },
    onClose: (reason) => {
      track('dialog_close', { component: 'dialog', trigger_id: triggerId, reason, location });
    },
  };
}

function buildDialogDemo(opts: DialogDemoOptions): HTMLElement {
  const trigger = createButton({
    variant: opts.triggerVariant ?? 'outline',
    label: opts.triggerLabel,
  });
  const cancel = createButton({ variant: 'outline', label: opts.cancelLabel });
  // O Cancelar fecha — a fábrica delega o clique em `[data-slot="dialog-close"]`
  // dentro do painel e relata `close-button`. A marca é a mesma que o snippet
  // desta página ensina desde sempre; até 2026-09-11 nada a escutava, e todas
  // estas prévias vivas renderizavam um Cancelar inerte.
  cancel.dataset.slot = 'dialog-close';
  const action = createButton({
    variant: opts.destructive ? 'destructive' : 'default',
    label: opts.actionLabel,
    onClick: () => {
      // `dialog_confirm`, e não o aposentado `dialog_action`: os dois
      // respondiam à mesma pergunta num componente que já manda `dialog_open` e
      // `dialog_close` — duas séries para uma pergunta só. O `trigger_id` é o
      // MESMO da abertura desta prévia (`dialogTracking(opts.demoId)`), que é o
      // que permite juntar abrir, confirmar e fechar no GA4; o id da ação vai
      // em `action`, onde o Sheet já o punha.
      track('dialog_confirm', {
        component: 'dialog',
        trigger_id: opts.demoId,
        action: opts.actionId,
        location: opts.location,
      });
    },
  });

  const body = document.createElement('div');
  body.className = 'nds-text-body nds-text-muted-foreground';
  body.textContent = opts.bodyText ?? '';

  return createDialog({
    trigger,
    title: opts.title,
    description: opts.description,
    content: body,
    // Lista, e não um `<div>` de embrulho. Quem faz o arranjo do rodapé é o
    // próprio `.nds-dialog-footer` — empilha ao contrário no estreito, alinha à
    // direita no largo —, e para isso as ações precisam ser filhas DIRETAS
    // dele. A `.nds-cluster` que morava aqui deixava o rodapé com um filho só:
    // o `column-reverse` e o `justify-end` da folha passavam a alinhar um
    // elemento único e não faziam nada. O docblock de `dialog.ts` proíbe o
    // embrulho e a play da `Default` cobra o contrário — a página contradizia
    // o componente e o teste que o guarda.
    //
    // E a ORDEM é a do sistema: secundários primeiro, PRIMÁRIA por último.
    footer: [...(opts.leadingActions ?? []), cancel, action],
    showCloseButton: opts.showCloseButton,
    ...dialogTracking(opts.demoId, opts.location),
  });
}

/**
 * A prévia da variante COM FORMULÁRIO.
 *
 * Forma própria, e não `buildDialogDemo` com `bodyText`: aqui o corpo É um
 * formulário, e a prévia mostrava um parágrafo pedindo ao leitor que imaginasse
 * os campos — enquanto a story desta mesma stack já montava campos de verdade.
 *
 * Dois pontos que a forma carrega, e nenhum deles é arrumação:
 *
 *   · `createFormField` é quem fecha o par rótulo ↔ controle, gera o id que
 *     falta e liga descrição e mensagem ao `aria-describedby`. Um `<label>` cru
 *     com um `<input>` cru pareceria igual na tela e não faria nada disso — é a
 *     mesma escolha que o snippet gerado em `dialog.source.ts` publica.
 *   · o rodapé fica DENTRO do `<form>`, com a primária em `type: 'submit'`.
 *     Fora dele o botão é INERTE: não submete, o Enter num campo não dispara
 *     nada, e nada na tela denuncia. Por isso ele é montado aqui e vai no
 *     `content`, e não na opção `footer` da factory — que o põe como IRMÃO do
 *     corpo, fora do formulário.
 *
 * A ordem do rodapé é a do sistema: secundária primeiro no DOM, primária por
 * último — é ela que põe a primária em cima no empilhamento e à direita quando
 * as duas ficam lado a lado.
 */
function buildDialogFormDemo(location: DocsLocation): HTMLElement {
  const triggerLabel = t('demonstration.labels.triggerLabel');
  const actionLabel = t('demonstration.labels.action');

  const form = document.createElement('form');
  form.className = 'nds-stack';
  form.dataset.spacing = 'md';
  form.addEventListener('submit', (e) => e.preventDefault());

  form.append(
    createFormField({
      label: t('demonstration.labels.fieldName'),
      input: createInput({
        id: 'dialog-name',
        name: 'name',
        value: t('demonstration.labels.samplePersonName'),
      }),
    }),
    createFormField({
      label: t('demonstration.labels.fieldEmail'),
      input: createInput({
        id: 'dialog-email',
        name: 'email',
        type: 'email',
        value: 'maria@exemplo.com',
      }),
    }),
  );

  const footerEl = document.createElement('div');
  footerEl.className = 'nds-dialog-footer';
  footerEl.dataset.slot = 'dialog-footer';
  // O Cancelar de um rodapé DENTRO do formulário fecha pelo mesmo contrato: a
  // delegação da fábrica vale para o painel inteiro, e não só para a opção
  // `footer`. O `type` já nasce `button` da fábrica — dentro de um `<form>`, um
  // botão de sair que submetesse seria o oposto do que ele diz fazer.
  const cancel = createButton({ variant: 'outline', label: t('demonstration.labels.cancel') });
  cancel.dataset.slot = 'dialog-close';
  footerEl.append(
    cancel,
    createButton({
      label: actionLabel,
      type: 'submit',
      onClick: () => {
        // Mesmo `trigger_id` que o `dialogTracking('with-form', …)` daqui de
        // baixo manda na abertura e no fechamento: é ele que junta os três
        // eventos desta prévia numa série só.
        track('dialog_confirm', {
          component: 'dialog',
          trigger_id: 'with-form',
          action: 'save',
          location,
        });
      },
    }),
  );
  form.appendChild(footerEl);

  return createDialog({
    trigger: createButton({ variant: 'outline', label: triggerLabel }),
    title: t('demonstration.labels.title'),
    description: t('demonstration.labels.description'),
    content: form,
    ...dialogTracking('with-form', location),
  });
}

// ─── createDialogDocs ─────────────────────────────────────────────────────────

export function createDialogDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'dialog',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: 'Overlay', item: '/components/overlay' },
        { name: 'Dialog' },
      ],
    });
    track('docs_page_view', {
      component_name: 'dialog',
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
    });
    headerSlot.replaceChildren(header);
  }
  function buildSidebar() { pageLayout.rebuildNav(buildNavGroups()); }
  function updateActiveNav(activeId: string) { pageLayout.setActiveSection(activeId); }

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
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.className = 'nds-cluster';
            wrap.dataset.justify = 'center';
            wrap.dataset.spacing = 'md';
            wrap.style.flexWrap = 'wrap';
            wrap.append(
              buildDialogDemo({
                demoId: 'default',
                actionId: 'save',
                location: 'docs_demo',
                triggerLabel: t('demonstration.labels.triggerLabel'),
                title: t('demonstration.labels.title'),
                description: t('demonstration.labels.description'),
                cancelLabel: t('demonstration.labels.cancel'),
                actionLabel: t('demonstration.labels.action'),
                bodyText: t('demonstration.labels.footerNote'),
              }),
            );
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          items: [1,2,3,4,5,6,7,8,9,10].map(i => t(`anatomy.item${i}`)),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1,2,3,4,5,6].map(i => t(`usage.guidelines.item${i}`)),
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1,2,3,4,5,6].map(i => ({
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
            items: ['title', 'description', 'action', 'cancel', 'srOnly'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1,2,3,4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1,2,3,4].map(i => stripHtml(t(`usage.dont.item${i}`))),
          },
        });

      case 'do-dont':
        return createDocsDoDont({
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: stripHtml(t('doDont.pair1.dont')),
              doPreviewFactory: () => buildDialogDemo({
                demoId: 'do-dont-pair1-do',
                actionId: 'save',
                location: 'docs_do_dont',
                triggerLabel: t('demonstration.labels.triggerLabel'),
                title: t('demonstration.labels.title'),
                description: 'Atualize suas informações pessoais.',
                cancelLabel: t('demonstration.labels.cancel'),
                actionLabel: t('demonstration.labels.action'),
                bodyText: 'Os campos estariam aqui em uma aplicação real.',
              }),
              dontPreviewFactory: () => buildDialogDemo({
                demoId: 'do-dont-pair1-dont',
                actionId: 'ok',
                location: 'docs_do_dont',
                triggerLabel: t('demonstration.labels.vagueTitle'),
                title: t('demonstration.labels.vagueTitle'),
                description: t('demonstration.labels.vagueDescription'),
                cancelLabel: t('demonstration.labels.cancel'),
                actionLabel: 'OK',
                bodyText: '',
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: stripHtml(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => buildDialogDemo({
                demoId: 'do-dont-pair2-do',
                actionId: 'save',
                location: 'docs_do_dont',
                triggerLabel: t('demonstration.labels.triggerLabel'),
                title: t('demonstration.labels.title'),
                description: 'Atualize suas informações pessoais.',
                cancelLabel: t('demonstration.labels.cancel'),
                actionLabel: t('demonstration.labels.action'),
                bodyText: '',
              }),
              dontPreviewFactory: () => buildDialogDemo({
                demoId: 'do-dont-pair2-dont',
                actionId: 'delete',
                location: 'docs_do_dont',
                triggerLabel: t('demonstration.labels.destructiveTitle'),
                triggerVariant: 'destructive',
                title: t('demonstration.labels.destructiveTitle'),
                description: t('demonstration.labels.destructiveDescription'),
                cancelLabel: t('demonstration.labels.cancel'),
                actionLabel: 'Excluir',
                destructive: true,
                bodyText: 'Use AlertDialog para esse caso.',
              }),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          componentSlug: 'dialog',
          description: t('import.basic'),
          code: `import { createDialog } from '@/components/ui/dialog';
import { createButton } from '@/components/ui/button';`,
          secondaryDescription: t('import.withScroll'),
          secondaryCode: `// A rolagem é do CORPO, e vem de uma classe só:
// nds-dialog-body-scroll já traz o teto de altura, o overflow e a folga da
// barra. O max-h-[60vh] que estava aqui era nome de utilitária de uma lib que
// saiu: chega ao elemento e não pinta nada.
const body = document.createElement('div');
body.className = 'nds-dialog-body-scroll nds-stack';
// Região que rola precisa ser alcançável por teclado e precisa de nome (WCAG
// 2.1.1); o papel é group, e não region, porque marco aninhado num diálogo
// já nomeado não acrescenta navegação.
body.tabIndex = 0;
body.setAttribute('role', 'group');
body.setAttribute('aria-label', 'Termos de uso');

const dialog = createDialog({
  trigger,
  title: 'Termos de uso',
  description: 'Leia atentamente antes de aceitar.',
  content: body,
  footer,
});`,
        });

      case 'variantes': {
        const codeDefault = `const trigger = createButton({ variant: 'outline', label: 'Editar perfil' });
const cancelar = createButton({ variant: 'outline', label: 'Cancelar' });
const salvar = createButton({ variant: 'default', label: 'Salvar alterações' });

createDialog({
  trigger,
  title: 'Editar perfil',
  description: '...',
  content,
  // Lista, e não um <div> de embrulho: as ações precisam ser filhas diretas do
  // rodapé para o arranjo do CSS valer. E a ordem é secundários primeiro,
  // primária por último — é ela que põe a primária em cima no empilhamento e à
  // direita quando as duas ficam lado a lado.
  footer: [cancelar, salvar],
});`;

        const codeWithForm = `const form = document.createElement('form');
form.className = 'nds-stack';
form.dataset.spacing = 'md';
form.addEventListener('submit', (e) => e.preventDefault());

// createFormField, e não um <label> cru com um <input> cru: é ele quem fecha o
// par rótulo ↔ controle, gera o id que falta e liga descrição e mensagem ao
// aria-describedby. Os dois pareceriam iguais na tela.
form.append(
  createFormField({
    label: 'Nome',
    input: createInput({ id: 'dialog-name', name: 'name', value: 'Maria Silva' }),
  }),
  createFormField({
    label: 'E-mail',
    input: createInput({ id: 'dialog-email', name: 'email', type: 'email', value: 'maria@exemplo.com' }),
  }),
);

// O rodapé entra DENTRO do form, e a primária é type: 'submit'. Fora do form
// esse botão é INERTE — não submete, e o Enter num campo não dispara nada, sem
// que nada na tela denuncie. Por isso ele é montado aqui e vai no content, e
// não na opção footer da factory, que o põe como irmão do corpo.
//
// A ordem é a do sistema: secundária primeiro no DOM, primária por último — é
// ela que põe a primária em cima no empilhamento e à direita quando lado a lado.
const footerEl = document.createElement('div');
footerEl.className = 'nds-dialog-footer';
footerEl.dataset.slot = 'dialog-footer';
footerEl.append(
  createButton({ variant: 'outline', label: 'Cancelar' }),
  createButton({ label: 'Salvar alterações', type: 'submit' }),
);
form.appendChild(footerEl);

createDialog({
  trigger: createButton({ variant: 'outline', label: 'Editar perfil' }),
  title: 'Editar perfil',
  description: 'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
  content: form,
});`;

        const codeWithBodyScroll = `const body = document.createElement('div');
// A rolagem é do CORPO: o teto, o overflow e a folga da barra vêm desta classe.
body.className = 'nds-dialog-body-scroll nds-stack';
// Região que rola precisa ser alcançável por teclado e precisa de nome (WCAG
// 2.1.1); o papel é group, e não region, porque marco aninhado num diálogo já
// nomeado não acrescenta navegação.
body.tabIndex = 0;
body.setAttribute('role', 'group');
body.setAttribute('aria-label', 'Termos de uso');

createDialog({ trigger, title: 'Termos de uso', description: '...', content: body, footer });`;

        const codeNoFooter = `createDialog({
  trigger,
  title: 'Sobre este recurso',
  description: 'Detalhes técnicos exibidos para fins informativos. Sem ações.',
  content: body,
  // sem footer
});`;

        const codeDestructive = `const action = createButton({ variant: 'destructive', label: 'Remover' });
// Footer com action destrutiva — uso secundário; para confirmação primária use AlertDialog.`;

        const codeCustomClose = `const fechar = createButton({ variant: 'ghost', label: 'Fechar' });
// O slot é o que faz o botão fechar: a delegação do painel alcança qualquer
// descendente marcado assim, e o fechamento informa o motivo 'close-button'.
fechar.dataset.slot = 'dialog-close';
const voltar = createButton({ variant: 'outline', label: 'Voltar' });
const continuar = createButton({ variant: 'default', label: 'Continuar' });

createDialog({
  trigger,
  title: 'Próximos passos',
  description: 'Continue o fluxo ou volte ao início.',
  content,
  // O "Fechar" é a ação de MENOR ênfase das três, então abre a lista; a
  // primária fecha. O rodapé empilha ao contrário no estreito e alinha à
  // direita no largo, e das duas leituras sai a primária em cima e à direita.
  footer: [fechar, voltar, continuar],
  showCloseButton: false, // remove o X do canto
});`;

        return createDocsCompositions({
          id: 'variantes',
          note: stripHtml(t('variants.note')),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'dialog',
          items: [
            {
              name: 'default',
              description: t('variants.items.default'),
              code: codeDefault,
              previewFactory: () => buildDialogDemo({
                demoId: 'basic',
                actionId: 'save',
                location: 'docs_variantes',
                triggerLabel: t('demonstration.labels.triggerLabel'),
                title: t('demonstration.labels.title'),
                description: t('demonstration.labels.description'),
                cancelLabel: t('demonstration.labels.cancel'),
                actionLabel: t('demonstration.labels.action'),
              }),
            },
            {
              name: 'withForm',
              description: t('variants.items.withForm'),
              code: codeWithForm,
              previewFactory: () => buildDialogFormDemo('docs_variantes'),
            },
            {
              // Faltava: as outras quatro páginas renderizavam esta variante e
              // esta não, então o conteúdo compartilhado descrevia uma rota que
              // quem lê nesta stack não via.
              name: 'withScrollContent',
              description: t('variants.items.withScrollContent'),
              code: codeWithBodyScroll,
              previewFactory: () => {
                const trigger = createButton({ variant: 'outline', label: 'Ler termos' });
                const body = document.createElement('div');
                // O teto, o overflow e a folga da barra saem todos desta classe.
                // `tabindex` porque a caixa rola (WCAG 2.1.1), e o papel só
                // entra com nome — `group` e não `region`, porque marco aninhado
                // num diálogo já nomeado não acrescenta navegação.
                body.className = 'nds-dialog-body-scroll nds-stack nds-text-body nds-text-muted-foreground';
                body.dataset.spacing = 'sm';
                body.tabIndex = 0;
                body.setAttribute('role', 'group');
                body.setAttribute('aria-label', t('demonstration.labels.termsTitle'));
                for (let i = 1; i <= 10; i++) {
                  const p = document.createElement('p');
                  p.textContent = `Parágrafo ${i}: conteúdo extenso para o corpo precisar rolar.`;
                  body.appendChild(p);
                }
                return createDialog({
                  trigger,
                  title: t('demonstration.labels.termsTitle'),
                  description: t('demonstration.labels.termsDescription'),
                  content: body,
                  footer: [
                    createButton({
                      variant: 'outline',
                      label: t('demonstration.labels.decline'),
                    }),
                    createButton({ label: t('demonstration.labels.accept') }),
                  ],
                  ...dialogTracking('scroll-content', 'docs_variantes'),
                });
              },
            },
            {
              name: 'noFooter',
              description: t('variants.items.noFooter'),
              code: codeNoFooter,
              previewFactory: () => {
                // O cenário sai do conteúdo compartilhado, e não de literais: a
                // página troca de idioma em tempo de execução, e o texto cravado
                // aqui ficava em português nas três versões. É a MESMA chave que
                // a story lê, então prévia e story mostram o mesmo exemplo.
                const trigger = createButton({
                  variant: 'outline',
                  label: t('demonstration.labels.aboutTitle'),
                });
                const body = document.createElement('div');
                body.className = 'nds-text-body nds-text-muted-foreground';
                body.textContent = t('demonstration.labels.aboutBody');
                return createDialog({
                  trigger,
                  title: t('demonstration.labels.aboutTitle'),
                  description: t('demonstration.labels.aboutDescription'),
                  content: body,
                  ...dialogTracking('no-footer', 'docs_variantes'),
                });
              },
            },
            {
              name: 'withDestructiveAction',
              description: stripHtml(t('variants.items.withDestructiveAction')),
              code: codeDestructive,
              previewFactory: () => buildDialogDemo({
                demoId: 'destructive',
                actionId: 'remove',
                location: 'docs_variantes',
                triggerLabel: t('demonstration.labels.removeItemAction'),
                title: t('demonstration.labels.removeItemTitle'),
                description: t('demonstration.labels.removeItemDescription'),
                cancelLabel: t('demonstration.labels.cancel'),
                actionLabel: 'Remover',
                destructive: true,
              }),
            },
            {
              name: 'customCloseInFooter',
              description: stripHtml(t('variants.items.customCloseInFooter')),
              code: codeCustomClose,
              previewFactory: () => {
                // O "Fechar" próprio é o ASSUNTO desta variante, e sem ele
                // desenhado o exemplo mostrava só um par comum de ações — o
                // snippet ao lado ensinava três botões e a prévia trazia dois.
                //
                // Ele fecha de verdade, e fecha pelo caminho que a própria
                // página ENSINA: `data-slot="dialog-close"`. A delegação do
                // painel alcança qualquer descendente com esse slot, então não
                // há ouvinte a ligar aqui.
                //
                // Era um clique FALSO no véu — o botão subia até o painel,
                // achava o irmão anterior e clicava nele. Fechava, mas
                // reportava `reason: 'overlay'` para um gesto que foi de BOTÃO:
                // no GA4 a série de dispensa por véu contava este clique junto
                // com quem clicou fora do painel para sair.
                const closeAction = createButton({
                  variant: 'ghost',
                  label: t('demonstration.labels.close'),
                });
                closeAction.dataset.slot = 'dialog-close';
                return buildDialogDemo({
                demoId: 'custom-close-in-footer',
                actionId: 'continue',
                  location: 'docs_variantes',
                  // Do conteúdo compartilhado, como na story: literal aqui ficava
                  // em português nas três versões da página, e as outras stacks
                  // não tinham chave a que se alinhar.
                  triggerLabel: t('demonstration.labels.guideTrigger'),
                  title: t('demonstration.labels.guideTitle'),
                  description: t('demonstration.labels.guideDescription'),
                  bodyText: t('demonstration.labels.guideBody'),
                  // O de menor ênfase abre a lista; `cancelLabel` e
                  // `actionLabel` entram depois, nessa ordem.
                  leadingActions: [closeAction],
                  cancelLabel: t('demonstration.labels.back'),
                  actionLabel: t('demonstration.labels.continueAction'),
                  showCloseButton: false,
                });
              },
            },
            {
              name: stripHtml(t('variants.items.confirmEmail.name')),
              trackId: 'confirmEmail',
              description: stripHtml(t('variants.items.confirmEmail.description')),
              useWhen: stripHtml(t('variants.items.confirmEmail.use')),
              code: `const body = document.createElement('div');
body.className = 'nds-text-body nds-text-muted-foreground';
body.textContent = 'Vamos enviar um link para maria@exemplo.com.';

const cancelar = createButton({ variant: 'outline', label: 'Cancelar' });
const enviar = createButton({ variant: 'default', label: 'Enviar link' });

createDialog({
  trigger: createButton({ variant: 'default', label: 'Enviar link' }),
  title: 'Confirmar e-mail',
  description: 'Verifique o endereço antes de enviar o link de acesso.',
  content: body,
  // Lista, e não um <div> de embrulho: as ações são filhas diretas do rodapé, e
  // a primária vem por último.
  footer: [cancelar, enviar],
});`,
              previewFactory: () => buildDialogDemo({
                demoId: 'confirm-email',
                actionId: 'confirm-email',
                location: 'docs_variantes',
                triggerLabel: t('demonstration.labels.confirmEmailAction'),
                triggerVariant: 'default',
                title: t('demonstration.labels.confirmEmailTitle'),
                description: 'Verifique o endereço antes de enviar o link de acesso.',
                cancelLabel: t('demonstration.labels.cancel'),
                actionLabel: t('demonstration.labels.confirmEmailAction'),
                bodyText: 'Vamos enviar um link para maria@exemplo.com.',
              }),
            },
          ],
        });
      }

      case 'composicoes':
        return createDocsCompositions({
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'dialog',
          items: [
            {
              trackId: 'profileEdit',
              name: stripHtml(t('variants.compositions.profileEdit.name')),
              description: stripHtml(t('variants.compositions.profileEdit.description')),
              useWhen: stripHtml(t('variants.compositions.profileEdit.use')),
              code: `const form = document.createElement('form');
form.className = 'nds-grid';
form.dataset.spacing = 'md';
form.addEventListener('submit', (e) => e.preventDefault());

const field = document.createElement('div');
field.className = 'nds-stack';
field.dataset.spacing = 'sm';
field.append(
  createLabel({ text: 'Nome completo', htmlFor: 'profile-name' }),
  createInput({ id: 'profile-name', name: 'name', value: 'Maria Silva' }),
);
form.appendChild(field);

// O rodapé entra DENTRO do form: é o que faz o Enter em qualquer campo
// disparar a ação primária. Por isso ele é montado aqui, e não passado na
// opção de rodapé da factory, que o põe como irmão do corpo — fora do form.
const footerEl = document.createElement('div');
footerEl.className = 'nds-dialog-footer';
footerEl.dataset.slot = 'dialog-footer';
// É o data-slot que fecha: a factory delega o clique em [data-slot="dialog-close"]
// dentro do painel e relata o motivo 'close-button' no onClose.
const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
cancel.type = 'button';
cancel.dataset.slot = 'dialog-close';
const save = createButton({ label: 'Salvar alterações' });
save.type = 'submit';
footerEl.append(cancel, save);
form.appendChild(footerEl);

createDialog({
  trigger: createButton({ variant: 'outline', label: 'Editar perfil' }),
  title: 'Editar perfil',
  description: 'Atualize suas informações pessoais.',
  content: form,
});`,
              previewFactory: () => {
                const form = document.createElement('form');
                form.className = 'nds-grid';
                form.dataset.spacing = 'md';
                form.addEventListener('submit', (e) => e.preventDefault());

                const field = document.createElement('div');
                field.className = 'nds-stack';
                field.dataset.spacing = 'sm';
                field.append(
                  createLabel({
                    text: t('demonstration.labels.fieldFullName'),
                    htmlFor: 'profile-name',
                  }),
                  createInput({
                    id: 'profile-name',
                    name: 'name',
                    value: t('demonstration.labels.samplePersonName'),
                  }),
                );
                form.appendChild(field);

                // O rodapé fica DENTRO do form: é o que faz o Enter em qualquer
                // campo disparar a ação primária, e é o que separa esta
                // composição de um painel com dois botões soltos. Por isso é
                // montado aqui, e não passado na opção de rodapé da factory,
                // que o põe como irmão do corpo — fora do formulário.
                const footerEl = document.createElement('div');
                footerEl.className = 'nds-dialog-footer';
                footerEl.dataset.slot = 'dialog-footer';
                const cancel = createButton({
                  variant: 'outline',
                  label: t('demonstration.labels.cancel'),
                });
                cancel.type = 'button';
                cancel.dataset.slot = 'dialog-close';
                const save = createButton({ label: t('demonstration.labels.action') });
                save.type = 'submit';
                footerEl.append(cancel, save);
                form.appendChild(footerEl);

                return createDialog({
                  trigger: createButton({
                    variant: 'outline',
                    label: t('demonstration.labels.triggerLabel'),
                  }),
                  title: t('demonstration.labels.title'),
                  description: 'Atualize suas informações pessoais.',
                  content: form,
                  ...dialogTracking('profile-edit', 'docs_composicoes'),
                });
              },
            },
            {
              trackId: 'mediaPreview',
              name: stripHtml(t('variants.compositions.mediaPreview.name')),
              description: stripHtml(t('variants.compositions.mediaPreview.description')),
              useWhen: stripHtml(t('variants.compositions.mediaPreview.use')),
              code: `const media = document.createElement('div');
media.className = 'nds-w-full nds-bg-muted nds-rounded-md nds-text-caption nds-text-muted-foreground';
media.style.aspectRatio = '16/9';
media.style.display = 'grid';
media.style.placeItems = 'center';
media.textContent = 'Pré-visualização da mídia';

createDialog({
  trigger: createButton({ variant: 'outline', label: 'Pré-visualizar' }),
  title: 'Capa do post',
  description: 'Pré-visualização em tamanho real.',
  content: media,
  // sem footer — apenas "ver"
});`,
              previewFactory: () => {
                const media = document.createElement('div');
                media.className = 'nds-w-full nds-bg-muted nds-rounded-md nds-text-caption nds-text-muted-foreground';
media.style.aspectRatio = '16/9';
media.style.display = 'grid';
media.style.placeItems = 'center';
                media.textContent = 'Pré-visualização da mídia';

                return createDialog({
                  trigger: createButton({ variant: 'outline', label: 'Pré-visualizar' }),
                  title: 'Capa do post',
                  description: 'Pré-visualização em tamanho real.',
                  content: media,
                  ...dialogTracking('media-preview', 'docs_composicoes'),
                });
              },
            },
          ],
        });

      case 'estados':
        return createDocsStates({
          cols: {
            state: t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            { label: t('states.closed.label'),                trigger: toPlainText(t('states.closed.trigger')),                behavior: toPlainText(t('states.closed.behavior'))},
            { label: t('states.opening.label'),               trigger: toPlainText(t('states.opening.trigger')),                          behavior: toPlainText(t('states.opening.behavior')) },
            { label: t('states.open.label'),                  trigger: toPlainText(t('states.open.trigger')),                  behavior: toPlainText(t('states.open.behavior'))},
            { label: t('states.closing.label'),               trigger: toPlainText(t('states.closing.trigger')),                          behavior: toPlainText(t('states.closing.behavior')) },
            { label: t('states.withCloseButtonHidden.label'), trigger: toPlainText(t('states.withCloseButtonHidden.trigger')), behavior: toPlainText(t('states.withCloseButtonHidden.behavior'))},
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createDialog(options)
export interface DialogOptions {
  trigger: HTMLElement;
  title: string;
  description?: string;
  content: HTMLElement;
  footer?: HTMLElement;
  showCloseButton?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: (reason: 'escape' | 'overlay' | 'close-button' | 'api') => void;
  class?: string;
}

// O que a factory devolve fecha por código, informando 'api'.
declare function createDialog(options: DialogOptions): HTMLElement & {
  close: () => void;
  destroy: () => void;
};`;

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
              title: t('props.rootTitle'),
              cols: propsCols,
              items: [
                { name: 'trigger',         type: 'HTMLElement',                                                          defaultValue: '—',     required: 'Sim', description: 'Elemento que abre o diálogo ao receber click.' },
                { name: 'title',           type: 'string',                                                               defaultValue: '—',     required: 'Sim', description: 'Texto do título — fonte do aria-labelledby.' },
                { name: 'description',     type: 'string',                                                               defaultValue: '—',     required: 'Não', description: 'Descrição — fonte do aria-describedby.' },
                { name: 'content',         type: 'HTMLElement',                                                          defaultValue: '—',     required: 'Sim', description: 'Body do diálogo (formulário, mídia, mensagem).' },
                { name: 'footer',          type: 'HTMLElement',                                                          defaultValue: '—',     required: 'Não', description: 'Container das ações (cancel, action).' },
                { name: 'showCloseButton', type: 'boolean',                                                              defaultValue: 'true',  required: 'Não', description: t('props.table.showCloseButtonContent') },
                { name: 'onOpenChange',    type: '(open: boolean) => void',                                              defaultValue: '—',     required: 'Não', description: t('props.table.onOpenChange') },
                { name: 'onClose',         type: "(reason: 'escape' | 'overlay' | 'close-button' | 'api') => void",  defaultValue: '—',     required: 'Não', description: 'Callback com a razão do fechamento — útil para analytics. escape, overlay (clique no véu), close-button (o X do canto ou qualquer elemento marcado com data-slot="dialog-close" dentro do painel) e api (a chamada de close() no que a factory devolve).' },
                { name: 'class',           type: 'string',                                                               defaultValue: '—',     required: 'Não', description: t('props.table.className') },
              ],
            },
            {
              title: t('props.contentTitle'),
              cols: propsCols,
              items: [
                { name: 'class', type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.className') },
              ],
            },
            {
              title: t('props.footerTitle'),
              cols: propsCols,
              items: [
                { name: 'children', type: 'HTMLElement[]', defaultValue: '—', required: 'Sim', description: 'Botões de ação inseridos no footer (cancel + action).' },
              ],
            },
            {
              title: t('props.titleDescriptionTitle'),
              cols: propsCols,
              items: [
                { name: 'title',       type: 'string', defaultValue: '—', required: 'Sim', description: toPlainText(t('props.table.children')) },
                { name: 'description', type: 'string', defaultValue: '—', required: 'Não', description: toPlainText(t('props.table.children')) },
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
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 3.9%;
  --foreground: 0 0% 3.9%;
  --muted: 0 0% 96%;
  --border: 0 0% 89.8%;
  --radius: 0.75rem;
}`;

        return createDocsTokens({
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--popover',            value: '.nds-dialog-content',            description: t('tokens.table.popover') },
            { token: '--popover-foreground', value: '.nds-dialog-content',            description: t('tokens.table.popoverForeground') },
            { token: '--foreground',         value: '.nds-dialog-content',            description: t('tokens.table.foreground') },
            { token: '--muted',              value: '.nds-dialog-footer',             description: t('tokens.table.muted') },
            { token: '--border',             value: '.nds-dialog-footer',             description: t('tokens.table.border') },
            { token: '--radius-card',        value: '.nds-dialog-content',            description: t('tokens.table.radius') },
            { token: '--overlay',            value: '.nds-dialog-overlay',            description: t('tokens.table.overlay') },
            { token: '--z-modal',            value: '.nds-dialog-content',            description: t('tokens.table.zIndex') },
            { token: '--duration-base',      value: '.nds-dialog-content[data-open]', description: t('tokens.table.duration') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          summary: t('accessibility.summary'),
          items: [1,2,3,4,5,6].map(i => t(`accessibility.item${i}`)),
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Escape',    description: t('keyboard.escape')   },
            { key: 'Tab',       description: t('keyboard.tab')      },
            { key: 'Shift+Tab', description: t('keyboard.shiftTab') },
            { key: 'Enter',     description: t('keyboard.enter')    },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          componentSlug: 'dialog',
          items: [
            { name: 'AlertDialog', description: toPlainText(t('related.alertDialog')), path: '?path=/docs/components-overlay-alertdialog--docs' },
            { name: 'Sheet',       description: toPlainText(t('related.sheet')),                  path: '?path=/docs/components-overlay-sheet--docs'       },
            { name: 'Popover',     description: toPlainText(t('related.popover')),                path: '?path=/docs/components-overlay-popover--docs'     },
            { name: 'Form',        description: toPlainText(t('related.form')),                   path: '?path=/docs/components-form-form--docs'        },
            { name: 'Drawer',      description: toPlainText(t('related.drawer')),                 path: '?path=/docs/components-overlay-drawer--docs'      },
          ],
        });

      case 'notas':
        return createDocsNotes({
          componentSlug: 'dialog',
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
            { title: '', content: t('notes.tip4') },
          ],
        });

      case 'analytics':
        return createDocsAnalytics({
          cols: {
            event: t('analytics.table.event'),
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            { event: t('analytics.table.open'),          trigger: toPlainText(t('analytics.table.openTrigger')),          payload: t('analytics.table.openPayload') },
            { event: t('analytics.table.close'),         trigger: toPlainText(t('analytics.table.closeTrigger')),         payload: t('analytics.table.closePayload') },
            { event: t('analytics.table.action'),        trigger: toPlainText(t('analytics.table.actionTrigger')),        payload: t('analytics.table.actionPayload') },
            { event: t('analytics.table.pageView'),      trigger: toPlainText(t('analytics.table.pageViewTrigger')),      payload: t('analytics.table.pageViewPayload') },
            { event: t('analytics.table.sectionViewed'), trigger: toPlainText(t('analytics.table.sectionViewedTrigger')), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),    trigger: toPlainText(t('analytics.table.langSwitchTrigger')),    payload: t('analytics.table.langSwitchPayload') },
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
            items: [1,2,3,4,5,6,7].map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [1,2,3,4,5,6,7].map(i => ({
              criterion: t(`testes.accessibility.item${i}.criterion`),
              level: t(`testes.accessibility.item${i}.level`),
              how: t(`testes.accessibility.item${i}.how`),
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
            // Seis, e não cinco: o conteúdo compartilhado traz `item6`
            // (WithScrollingOverlay) e a página parava no quinto — a linha
            // existia no JSON e não existia para quem lê.
            items: [1,2,3,4,5].map(i => ({
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
        component_name: 'dialog',
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
