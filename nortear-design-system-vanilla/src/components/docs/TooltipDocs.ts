import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createTooltip, createTooltipProvider } from '@/components/ui/tooltip';
import { createButton, createButtonIcon, type ButtonIconKind } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import tooltipTranslations from '@shared/content/tooltip/translations.json';

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
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (tooltipTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
// As opções de `createTooltip` e de `createTooltipProvider` são da FÁBRICA
// desta stack — não existem na API das outras quatro, então a descrição delas
// não cabe no conteúdo compartilhado. O lugar sancionado é o override por
// locale no call site (CLAUDE.md, "Cross-stack translation strategy", item 3).
//
// Antes disto, sete descrições eram literal em português dentro de uma tabela
// que troca de idioma, e duas delas eram PIORES: `toPlainText(t(…)) + ' cauda
// em português'` entregava ao leitor em inglês a frase em inglês seguida da
// continuação em português, na mesma célula. E a chave compartilhada de `side`
// promete auto-flip por colisão, que é verdade nas outras quatro e falso aqui:
// nesta fábrica a posição escolhida é a final.
const LOCAL_OVERRIDES = {
  'pt-BR': {
    'props.local.trigger.description':
      'Elemento que ativa o balão por ponteiro ou foco. O aria-describedby é escrito enquanto o balão existe e retirado quando ele sai.',
    'props.local.content.description':
      'Texto do balão. String vira textContent — o caminho seguro para dado de fora; marcação (uma tecla em <kbd>, uma palavra em <strong>) entra como elemento já montado.',
    'props.local.side.description':
      'Lado preferido de abertura em relação ao gatilho. Sai no markup como data-side. A posição é fixa: não há reposicionamento automático por colisão.',
    'props.local.delayDuration.description':
      'Espera em ms entre o ponteiro entrar no gatilho e o balão abrir. Ajusta um balão em particular; dentro de um grupo, o padrão vem do provedor. O foco abre na hora, sem espera: quem chega por teclado não tem como parar em cima.',
    'props.local.onShow.description':
      'Avisado quando o balão é de fato exibido, depois da espera. É o gancho de analítica: contar a intenção de hover contaria também quem só atravessou o gatilho.',
    'props.local.providerDelayDuration.description':
      'Espera padrão de todos os balões criados pelo grupo. Cada balão pode sobrescrevê-la na própria chamada.',
    'props.local.skipDelayDuration.description':
      'Janela, depois de um balão fechar, em que o próximo do grupo abre na hora. É o que faz percorrer uma barra de ícones parecer um movimento só. Zero desliga.',
    'import.local.secondaryDescription': 'Espera compartilhada por grupo e marcação no conteúdo:',
    'accessibility.local.escape.description':
      'Fecha o balão; o foco fica onde está: sair do gatilho é papel do Tab, não do Escape.',
  },
  en: {
    'props.local.trigger.description':
      'Element that opens the balloon on pointer or focus. The aria-describedby is written while the balloon exists and removed when it goes away.',
    'props.local.content.description':
      'Balloon text. A string becomes textContent — the safe path for outside data; markup (a key in <kbd>, a word in <strong>) comes in as a ready-made element.',
    'props.local.side.description':
      'Preferred opening side relative to the trigger. It reaches the markup as data-side. The position is fixed: there is no automatic repositioning on collision.',
    'props.local.delayDuration.description':
      'Wait in ms between the pointer entering the trigger and the balloon opening. It tunes one balloon in particular; inside a group the default comes from the provider. Focus opens it right away, with no wait: whoever arrives by keyboard has no way to rest on top of it.',
    'props.local.onShow.description':
      'Called when the balloon is actually shown, after the wait. It is the analytics hook: counting hover intent would also count whoever merely crossed the trigger.',
    'props.local.providerDelayDuration.description':
      'Default wait for every balloon the group creates. Each balloon can override it in its own call.',
    'props.local.skipDelayDuration.description':
      'Window, after one balloon closes, in which the next one in the group opens right away. It is what makes running along an icon bar feel like a single movement. Zero turns it off.',
    'import.local.secondaryDescription': 'Shared wait across a group, and markup in the content:',
    'accessibility.local.escape.description':
      'Closes the balloon; the focus stays where it is: leaving the trigger is the Tab key’s job, not Escape’s.',
  },
  es: {
    'props.local.trigger.description':
      'Elemento que activa el globo por puntero o foco. El aria-describedby se escribe mientras el globo existe y se retira cuando desaparece.',
    'props.local.content.description':
      'Texto del globo. Una cadena se vuelve textContent — el camino seguro para datos externos; el marcado (una tecla en <kbd>, una palabra en <strong>) entra como elemento ya montado.',
    'props.local.side.description':
      'Lado preferido de apertura respecto al disparador. Sale en el marcado como data-side. La posición es fija: no hay reposicionamiento automático por colisión.',
    'props.local.delayDuration.description':
      'Espera en ms entre la entrada del puntero en el disparador y la apertura del globo. Ajusta un globo en particular; dentro de un grupo, el valor por defecto viene del proveedor. El foco abre de inmediato, sin espera: quien llega por teclado no puede detenerse encima.',
    'props.local.onShow.description':
      'Avisado cuando el globo se muestra de hecho, después de la espera. Es el gancho de analítica: contar la intención de hover contaría también a quien solo atravesó el disparador.',
    'props.local.providerDelayDuration.description':
      'Espera por defecto de todos los globos creados por el grupo. Cada globo puede sobrescribirla en su propia llamada.',
    'props.local.skipDelayDuration.description':
      'Ventana, después de que un globo cierra, en la que el siguiente del grupo abre de inmediato. Es lo que hace que recorrer una barra de iconos parezca un solo movimiento. Cero lo desactiva.',
    'import.local.secondaryDescription': 'Espera compartida por grupo y marcado en el contenido:',
    'accessibility.local.escape.description':
      'Cierra el globo; el foco se queda donde está: salir del disparador es tarea del Tab, no del Escape.',
  },
};

const { t, subscribe } = createTranslation(tooltipTranslations as Record<string, unknown>, LOCAL_OVERRIDES);

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
 * Botão icon-only da barra de ações da demonstração.
 *
 * O ícone vem de `createButtonIcon`, que é a factory de ícone DE BOTÃO desta
 * stack — `save` e `share` foram acrescentados ao mapa dela para isto. Nove
 * docs pages do vanilla constroem SVG do lucide à mão, mas o caso delas é
 * outro: pedem ícones que não são de botão (Bold, Italic, Search, Star), e
 * ampliar um mapa de botão com eles seria pior.
 */
/** Preview vivo do Do & Don't: botão de ícone com balão, numa moldura centrada. */
function buildDoDont(id: string, text: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-cluster nds-w-full nds-min-h-20';
  wrap.dataset.justify = 'center';
  wrap.dataset.align = 'center';
  wrap.style.contain = 'layout';
  wrap.appendChild(
    createTooltip({
      trigger: demoIconButton('save', t('demonstration.labels.saveButton')),
      content: text,
      side: 'bottom',
      onShow: trackTooltipView('docs_do_dont', id),
    }),
  );
  return wrap;
}

function demoIconButton(kind: ButtonIconKind, ariaLabel: string): HTMLButtonElement {
  return createButton({
    variant: 'outline',
    size: 'icon',
    'aria-label': ariaLabel,
    children: createButtonIcon(kind),
  });
}

function makeIconButton(ariaLabel: string): HTMLButtonElement {
  return createButton({
    variant: 'outline',
    size: 'icon',
    'aria-label': ariaLabel,
    children: createButtonIcon('download'),
  });
}

// tooltip_view usa o callback onShow da factory: dispara quando o tooltip é
// de fato exibido (após o delay interno), sem espelhar constante de timing.
//
// O `location` vem de quem chama, e não de constante: ele existe para dizer de
// ONDE veio o evento, e cravá-lo em `docs_demo` fazia toda a página responder a
// mesma coisa — inclusive os previews da seção VARIANTES, que reportavam ter
// vindo da demonstração. Vocabulário na guideline 07 de analytics.
function trackTooltipView(location: string, triggerId: string): () => void {
  return () =>
    track('tooltip_view', { component: 'tooltip', trigger_id: triggerId, location });
}

function buildDefaultTooltip(): HTMLElement {
  const trigger = createButton({
    variant: 'outline',
    label: t('demonstration.labels.saveButton'),
    'aria-label': t('demonstration.labels.saveButton'),
  });
  return createTooltip({
    trigger,
    content: t('demonstration.labels.save'),
    side: 'top',
    onShow: trackTooltipView('docs_variantes', 'default'),
  });
}

function buildWithShortcutTooltip(): HTMLElement {
  const trigger = makeIconButton(t('demonstration.labels.saveButton'));
  return createTooltip({
    trigger,
    content: t('demonstration.labels.save'),
    side: 'bottom',
    onShow: trackTooltipView('docs_variantes', 'withShortcut'),
  });
}

function buildLongTextTooltip(): HTMLElement {
  const trigger = createButton({
    variant: 'outline',
    label: t('demonstration.labels.shareButton'),
    'aria-label': t('demonstration.labels.shareButton'),
  });
  return createTooltip({
    trigger,
    content: t('demonstration.labels.shareHint'),
    side: 'bottom',
    class: 'nds-max-w-xs nds-whitespace-normal',
    onShow: trackTooltipView('docs_variantes', 'longText'),
  });
}

// ─── createTooltipDocs ────────────────────────────────────────────────────────

export function createTooltipDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'tooltip',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/overlay' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'tooltip',
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
          demoFactory: () => {
            // Barra de ações com três botões de ícone — o MESMO exemplo que as
            // outras quatro stacks mostram. Antes daqui saía um grid de três
            // colunas rotuladas reaproveitando `buildDefaultTooltip` e irmãos,
            // ou seja: a Demonstração repetia a seção Variantes, que fica logo
            // abaixo e mostra exatamente aqueles três casos.
            //
            // Nenhum portão via, e a razão é estrutural: Variantes e Composições
            // passam por um container que recebe uma LISTA NOMEADA de cartões,
            // então dá para enumerar. A Demonstração é um slot livre — aqui um
            // `demoFactory` —, sem nome e sem cartão, e a sonda de docs page
            // dava paridade porque `DocsDemonstration` nem emite
            // `data-docs-preview`.
            const wrap = document.createElement('div');
            wrap.style.contain = 'layout';
            wrap.style.position = 'relative';
            wrap.className = 'nds-cluster nds-w-full nds-min-h-30';
            wrap.dataset.justify = 'center';
            wrap.dataset.align = 'center';
            wrap.dataset.spacing = 'lg';

            // Chaves LITERAIS, e não montadas por template: é assim que as
            // outras quatro escrevem, e é o que deixa a divergência visível a
            // uma varredura de fonte. Chave construída em runtime esconde o
            // rótulo de qualquer portão que leia o arquivo.
            // O MESMO exemplo do Playground da story — guideline 08 §15. Uma
            // fonte, dois lugares. A barra de três ações que morava aqui virou a
            // composição `actionBar`, que é o que ela sempre foi.
            //
            // `side: 'top'` é o padrão da fábrica e o do Playground, e a espera
            // vem de um GRUPO com 400 ms — o mesmo valor que o snippet da seção
            // Importação publica. A demonstração ensina o caminho recomendado,
            // então ela usa o provedor mesmo com um balão só.
            const group = createTooltipProvider({ delayDuration: 400 });
            wrap.appendChild(
              group.createTooltip({
                trigger: demoIconButton('save', t('demonstration.labels.saveButton')),
                content: t('demonstration.labels.save'),
                side: 'top',
                onShow: trackTooltipView('docs_demo', 'save'),
              }),
            );

            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4].map(i => DOMPurify.sanitize(t(`anatomy.item${i}`))),
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
            items: ['content', 'shortcut', 'icon'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: toPlainText(t(`usage.uxWriting.table.${key}.format`)),
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
              doPreviewFactory: () => buildDoDont('pair1-do', t('demonstration.labels.save')),
              // Anti-padrão didático: o balão no lugar do rótulo. O `aria-label`
              // fica para o axe — sem ele o botão icon-only não tem nome
              // acessível e a docs page reprova —, e a lição continua no
              // CONTEÚDO do balão, que só repete o rótulo em vez de acrescentar.
              dontPreviewFactory: () => buildDoDont('pair1-dont', t('demonstration.labels.saveButton')),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => buildDoDont('pair2-do', t('demonstration.labels.save')),
              // Vivo de propósito: a lição é o TAMANHO do balão, e só
              // renderizado ele mostra o que o texto longo faz.
              dontPreviewFactory: () =>
                buildDoDont('pair2-dont', t('demonstration.labels.longBalloonDont')),
            },
          ],
        });
      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          componentSlug: 'tooltip',
          code: `import { createTooltip, createTooltipProvider } from '@/components/ui/tooltip';`,
          secondaryDescription: t('import.local.secondaryDescription'),
          secondaryCode: `// Uma barra de ícones: quem já parou uma vez não espera de novo no vizinho.
const { createTooltip: comEspera } = createTooltipProvider({
  delayDuration: 300,
  skipDelayDuration: 300,
});

comEspera({ trigger: botaoCopiar, content: 'Copiar' });
comEspera({ trigger: botaoColar,  content: 'Colar'  });

// Marcação entra como ELEMENTO já montado, nunca como HTML em string.
const atalho = document.createElement('span');
atalho.append('Salvar (', Object.assign(document.createElement('kbd'), { textContent: 'Ctrl+S' }), ')');

createTooltip({
  trigger: botaoSalvar,
  content: atalho,
  side: 'bottom',
  delayDuration: 0,          // este abre na hora
  onShow: () => track('tooltip_view', { component: 'tooltip' }),
});`,
        });

      case 'variantes': {
        const codeDefault = `const trigger = createButton({
  variant: 'outline',
  label: 'Salvar',
  'aria-label': 'Salvar',
});

createTooltip({ trigger, content: 'Salvar', side: 'top' });`;

        const codeShortcut = `// Botão icon-only mantém aria-label obrigatório
const trigger = createButton({
  variant: 'outline',
  size: 'icon',
  'aria-label': 'Salvar',
  children: iconSvg,
});

createTooltip({ trigger, content: 'Salvar (Ctrl+S)', side: 'bottom' });`;

        const codeLong = `createTooltip({
  trigger,
  content: 'Cria um link público de leitura — qualquer pessoa com o link vê o conteúdo',
  side: 'bottom',
  class: 'nds-max-w-xs nds-whitespace-normal',
});`;

        const codeSides = `for (const side of ['top', 'right', 'bottom', 'left'] as const) {
  const trigger = createButton({ variant: 'outline', label: side, 'aria-label': side });
  const el = createTooltip({ trigger, content: \`Tooltip \${side}\`, side });
  grid.appendChild(el);
}`;

        function buildSidesPreview(): HTMLElement {
          const grid = document.createElement('div');
          grid.style.contain = 'layout';
          grid.className = 'nds-grid nds-w-full nds-min-h-40';
          grid.dataset.cols = '4';
          grid.dataset.spacing = 'xl';
          grid.style.placeItems = 'center';

          const sides: Array<{ side: 'top' | 'bottom' | 'left' | 'right'; label: string }> = [
            { side: 'top',    label: t('demonstration.labels.sideTop')    },
            { side: 'right',  label: t('demonstration.labels.sideRight')  },
            { side: 'bottom', label: t('demonstration.labels.sideBottom') },
            { side: 'left',   label: t('demonstration.labels.sideLeft')   },
          ];

          for (const { side, label } of sides) {
            const trigger = createButton({ variant: 'outline', label, 'aria-label': label });
            const el = createTooltip({
              trigger,
              content: `Tooltip ${label}`,
              side,
              onShow: trackTooltipView('docs_variantes', `positioningSides-${side}`),
            });
            grid.appendChild(el);
          }

          return grid;
        }

        return createDocsCompositions({
          id: 'variantes',
          title: t('variants.title'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'tooltip',
          items: [
            {
              trackId: 'default',
              name: t('variants.items.default'),
              description: stripHtml(t('variants.styles.default')),
              code: codeDefault,
              previewFactory: () => buildDefaultTooltip(),
            },
            {
              trackId: 'withShortcut',
              name: t('variants.items.withShortcut'),
              description: stripHtml(t('variants.styles.withShortcut')),
              code: codeShortcut,
              previewFactory: () => buildWithShortcutTooltip(),
            },
            {
              trackId: 'longText',
              name: t('variants.items.longText'),
              description: stripHtml(t('variants.styles.longText')),
              code: codeLong,
              previewFactory: () => buildLongTextTooltip(),
            },
            {
              name: stripHtml(t('variants.items.positioningSides.name')),
              trackId: 'positioningSides',
              description: stripHtml(t('variants.items.positioningSides.description')),
              useWhen: stripHtml(t('variants.items.positioningSides.use')),
              code: codeSides,
              previewFactory: buildSidesPreview,
            },
          ],
        });
      }

      case 'composicoes': {
        const codeActionBar = `const provider = createTooltipProvider({ delayDuration: 400, skipDelayDuration: 200 });

for (const acao of acoes) {
  barra.appendChild(provider.createTooltip({
    trigger: criarBotaoDeIcone(acao.icon, acao.label),
    content: acao.text,
    side: 'bottom',
  }));
}`;
        const codeIconShortcut = `const trigger = createButton({
  variant: 'outline',
  size: 'icon',
  'aria-label': 'Salvar',
  children: createButtonIcon('download'),
});

createTooltip({ trigger, content: 'Salvar (Ctrl+S)', side: 'bottom' });`;

        const codeFormHelp = `const help = createButton({
  variant: 'outline',
  size: 'icon-sm',
  'aria-label': 'Ajuda sobre Token de API',
  label: '?',
});

createTooltip({
  trigger: help,
  content: 'Gere em Configurações › Acesso › Tokens',
  side: 'right',
  class: 'nds-max-w-xs nds-whitespace-normal',
});`;

        const codeMetric = `const help = createButton({
  variant: 'outline',
  size: 'icon-sm',
  'aria-label': 'O que é LCP',
  label: 'i',
});

createTooltip({
  trigger: help,
  content: 'Largest Contentful Paint — tempo até o maior elemento visível ser renderizado.',
  side: 'top',
  class: 'nds-max-w-xs nds-whitespace-normal',
});`;

        function buildActionBarPreview(): HTMLElement {
          const barra = document.createElement('div');
          barra.className = 'nds-cluster';
          barra.dataset.justify = 'center';
          barra.dataset.align = 'center';
          barra.dataset.spacing = 'lg';

          const acoes: Array<{ icon: ButtonIconKind; label: string; text: string; id: string }> = [
            { icon: 'save',  label: t('demonstration.labels.saveButton'),   text: t('demonstration.labels.save'),   id: 'actionBar-save' },
            { icon: 'trash', label: t('demonstration.labels.deleteButton'), text: t('demonstration.labels.delete'), id: 'actionBar-delete' },
            { icon: 'share', label: t('demonstration.labels.shareButton'),  text: t('demonstration.labels.share'),  id: 'actionBar-share' },
          ];
          for (const acao of acoes) {
            barra.appendChild(
              createTooltip({
                trigger: demoIconButton(acao.icon, acao.label),
                content: acao.text,
                side: 'bottom',
                onShow: trackTooltipView('docs_composicoes', acao.id),
              }),
            );
          }
          return barra;
        }

        function buildIconShortcutPreview(): HTMLElement {
          const trigger = createButton({
            variant: 'outline',
            size: 'icon',
            'aria-label': t('demonstration.labels.saveButton'),
            children: createButtonIcon('download'),
          });
          return createTooltip({
            trigger,
            content: t('demonstration.labels.save'),
            side: 'bottom',
            onShow: trackTooltipView('docs_composicoes', 'iconButtonWithShortcut'),
          });
        }

        function buildFormHelpPreview(): HTMLElement {
          const root = document.createElement('div');
          root.className = 'nds-stack nds-w-full nds-max-w-sm';
          root.dataset.spacing = 'xs';
          root.style.alignItems = 'flex-start';

          const labelRow = document.createElement('div');
          labelRow.className = 'nds-cluster';
          labelRow.dataset.spacing = 'sm';

          const label = document.createElement('label');
          label.className = 'nds-text-body nds-font-medium';
          label.textContent = t('demonstration.labels.apiTokenLabel');
          label.htmlFor = 'api-token-bc-comp';

          const help = createButton({
            variant: 'outline',
            size: 'icon-sm',
            'aria-label': t('demonstration.labels.apiTokenHelp'),
            label: '?',
          });

          const tooltip = createTooltip({
            trigger: help,
            content: t('demonstration.labels.apiTokenHint'),
            side: 'right',
            onShow: trackTooltipView('docs_composicoes', 'formFieldHelp'),
            class: 'nds-max-w-xs nds-whitespace-normal',
          });

          labelRow.append(label, tooltip);

          const input = document.createElement('input');
          input.id = 'api-token-bc-comp';
          input.type = 'text';
          input.className = 'nds-input';
          input.placeholder = 'sk-...';

          root.append(labelRow, input);
          return root;
        }

        function buildMetricPreview(): HTMLElement {
          const root = document.createElement('div');
          root.className = 'nds-stack';
          root.dataset.spacing = 'xs';
          root.style.alignItems = 'flex-start';

          const headerRow = document.createElement('div');
          headerRow.className = 'nds-cluster';
          headerRow.dataset.spacing = 'sm';

          const title = document.createElement('p');
          title.className = 'nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider';
          title.textContent = t('demonstration.labels.lcpLabel');

          const help = createButton({
            variant: 'outline',
            size: 'icon-sm',
            'aria-label': t('demonstration.labels.lcpHelp'),
            label: 'i',
          });

          const tooltip = createTooltip({
            trigger: help,
            content: t('demonstration.labels.lcpHint'),
            side: 'top',
            onShow: trackTooltipView('docs_composicoes', 'metricDescription'),
            class: 'nds-max-w-xs nds-whitespace-normal',
          });

          headerRow.append(title, tooltip);

          const value = document.createElement('p');
          value.className = 'nds-text-h3 nds-m-0';
          value.textContent = t('demonstration.labels.lcpValue');

          root.append(headerRow, value);
          return root;
        }

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'tooltip',
          items: [
            {
              trackId: 'iconButtonWithShortcut',
              name: stripHtml(t('variants.compositions.iconButtonWithShortcut.name')),
              description: stripHtml(t('variants.compositions.iconButtonWithShortcut.description')),
              useWhen: stripHtml(t('variants.compositions.iconButtonWithShortcut.use')),
              code: codeIconShortcut,
              previewFactory: buildIconShortcutPreview,
            },
            {
              trackId: 'actionBar',
              name: stripHtml(t('variants.compositions.actionBar.name')),
              description: stripHtml(t('variants.compositions.actionBar.description')),
              useWhen: stripHtml(t('variants.compositions.actionBar.use')),
              code: codeActionBar,
              previewFactory: buildActionBarPreview,
            },
            {
              trackId: 'formFieldHelp',
              name: stripHtml(t('variants.compositions.formFieldHelp.name')),
              description: stripHtml(t('variants.compositions.formFieldHelp.description')),
              useWhen: stripHtml(t('variants.compositions.formFieldHelp.use')),
              code: codeFormHelp,
              previewFactory: buildFormHelpPreview,
            },
            {
              trackId: 'metricDescription',
              name: stripHtml(t('variants.compositions.metricDescription.name')),
              description: stripHtml(t('variants.compositions.metricDescription.description')),
              useWhen: stripHtml(t('variants.compositions.metricDescription.use')),
              code: codeMetric,
              previewFactory: buildMetricPreview,
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
            { label: t('states.closed.label'),  trigger: toPlainText(t('states.closed.trigger')),  behavior: toPlainText(t('states.closed.behavior')) },
            { label: t('states.open.label'),    trigger: toPlainText(t('states.open.trigger')),    behavior: toPlainText(t('states.open.behavior')) },
            { label: t('states.hover.label'),   trigger: toPlainText(t('states.hover.trigger')),   behavior: toPlainText(t('states.hover.behavior')) },
            { label: t('states.focus.label'),   trigger: toPlainText(t('states.focus.trigger')),   behavior: toPlainText(t('states.focus.behavior')) },
            { label: t('states.delayed.label'), trigger: toPlainText(t('states.delayed.trigger')), behavior: toPlainText(t('states.delayed.behavior')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createTooltip(options)
export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

export type TooltipOptions = {
  trigger: HTMLElement;
  /** String vira textContent; marcação entra como elemento já montado. */
  content: string | HTMLElement;
  side?: TooltipSide;          // default 'top'
  delayDuration?: number;      // default 300 (ou o do grupo)
  onShow?: () => void;         // depois da espera, quando o balão aparece
  class?: string;
};

export function createTooltip(options: TooltipOptions): DestroyableElement;

// ─── Grupo com espera compartilhada ─────────────────────────────────────────
export type TooltipProviderOptions = {
  delayDuration?: number;      // default 300 — padrão de todos do grupo
  skipDelayDuration?: number;  // default 300 — janela sem nova espera; 0 desliga
};

export function createTooltipProvider(
  options?: TooltipProviderOptions,
): { createTooltip: (options: TooltipOptions) => DestroyableElement };`;

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
              title: 'createTooltip(options)',
              cols: propsCols,
              items: [
                { name: 'trigger',       type: 'HTMLElement',                         defaultValue: '—',     required: tNav('common.yes'), description: t('props.local.trigger.description') },
                { name: 'content',       type: 'string | HTMLElement',                defaultValue: '—',     required: tNav('common.yes'), description: t('props.local.content.description') },
                { name: 'side',          type: "'top' | 'bottom' | 'left' | 'right'", defaultValue: "'top'", required: tNav('common.no'),  description: t('props.local.side.description') },
                { name: 'delayDuration', type: 'number',                              defaultValue: '300',   required: tNav('common.no'),  description: t('props.local.delayDuration.description') },
                { name: 'onShow',        type: '() => void',                          defaultValue: '—',     required: tNav('common.no'),  description: t('props.local.onShow.description') },
                { name: 'class',         type: 'string',                              defaultValue: '—',     required: tNav('common.no'),  description: toPlainText(t('props.table.className.description')) },
              ],
            },
            {
              title: 'createTooltipProvider(options?)',
              cols: propsCols,
              items: [
                { name: 'delayDuration',     type: 'number', defaultValue: '300', required: tNav('common.no'), description: t('props.local.providerDelayDuration.description') },
                { name: 'skipDelayDuration', type: 'number', defaultValue: '300', required: tNav('common.no'), description: t('props.local.skipDelayDuration.description') },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          // `extensibilityCode` e não `extensibilityNotes`: a fenda de notas
          // passa por `DOMPurify.sanitize()` + `innerHTML`, onde `createTooltip`
          // com `<`/`>` viraria tag desconhecida e sumiria, e as quebras de
          // linha colapsariam. Snippet vai para o CodeBlock.
          extensibilityCode:
            t('props.extensibilityCode') +
            '\n\n// O balão não tem estado controlado nem seta apontando para o gatilho, e\n// a posição escolhida em `side` é a final — não há reposicionamento\n// automático quando falta espaço na tela.',
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
            // Os tokens são os que a folha compartilhada realmente usa
            // (docs/shared/styles/nds/tooltip.css). A tabela documentava
            // --foreground/--background/--radius, que o Tooltip não toca.
            { token: '--primary',            value: t('tokens.table.foreground.class'), description: t('tokens.table.foreground.part') },
            { token: '--primary-foreground', value: t('tokens.table.background.class'), description: t('tokens.table.background.part') },
            { token: '--primary',            value: t('tokens.table.fill.class'),       description: t('tokens.table.fill.part')       },
            { token: '--radius-sm',          value: t('tokens.table.radius.class'),     description: t('tokens.table.radius.part')     },
            { token: '--z-tooltip',          value: t('tokens.table.zIndex.class'),     description: t('tokens.table.zIndex.part')     },
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
            { key: 'Esc',       description: t('accessibility.local.escape.description') },
            { key: 'Shift+Tab', description: toPlainText(t('accessibility.keyboard.shiftTab')) },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          componentSlug: 'tooltip',
          items: [
            { name: t('related.items.popover.name'),   description: toPlainText(t('related.items.popover.description')),   path: '?path=/docs/components-overlay-popover--docs'    },
            { name: t('related.items.hoverCard.name'), description: toPlainText(t('related.items.hoverCard.description')), path: '?path=/docs/components-overlay-hovercard--docs'  },
            { name: t('related.items.button.name'),    description: toPlainText(t('related.items.button.description')),    path: '?path=/docs/components-form-button--docs'     },
          ],
        });

      case 'notas': {
        const extraNote = getLocale() === 'en'
          ? '<strong>What the balloon does not do</strong>: there is no controlled state and no arrow pointing back at the trigger, and the chosen <code>side</code> is final — nothing repositions the balloon when the screen runs out of room, so pick a side that fits. Everything else is here: per-call <code>delayDuration</code>, a shared wait across a group through <code>createTooltipProvider</code>, Escape to dismiss without moving the focus, and markup in <code>content</code> as a ready-made element (a key inside <code>&lt;kbd&gt;</code>, a word inside <code>&lt;strong&gt;</code>).'
          : getLocale() === 'es'
          ? '<strong>Lo que el globo no hace</strong>: no hay estado controlado ni flecha apuntando al disparador, y el <code>side</code> elegido es el definitivo — nada reposiciona el globo cuando falta espacio en pantalla, así que elija un lado que quepa. Todo lo demás está: <code>delayDuration</code> por llamada, espera compartida por grupo con <code>createTooltipProvider</code>, Escape para descartar sin mover el foco, y marcado en <code>content</code> como elemento ya montado (una tecla en <code>&lt;kbd&gt;</code>, una palabra en <code>&lt;strong&gt;</code>).'
          : '<strong>O que o balão não faz</strong>: não há estado controlado nem seta apontando para o gatilho, e o <code>side</code> escolhido é o final — nada reposiciona o balão quando falta espaço na tela, então escolha um lado que caiba. O resto está aqui: <code>delayDuration</code> por chamada, espera compartilhada por grupo com <code>createTooltipProvider</code>, Escape para dispensar sem tirar o foco do lugar, e marcação em <code>content</code> como elemento já montado (uma tecla em <code>&lt;kbd&gt;</code>, uma palavra em <code>&lt;strong&gt;</code>).';

        return createDocsNotes({
          title: t('notes.title'),
          componentSlug: 'tooltip',
          items: [
            ...[1, 2, 3, 4].map(i => ({ title: '', content: DOMPurify.sanitize(t(`notes.item${i}`)) })),
            { title: '', content: DOMPurify.sanitize(extraNote) },
          ],
        });
      }

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
              event: 'tooltip_view',
              trigger: stripHtml(t('analytics.table.tooltip_view.trigger')),
              payload: stripHtml(t('analytics.table.tooltip_view.payload')),
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
        component_name: 'tooltip',
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
      // Also remove any leaked tooltip panels
      document.querySelectorAll('[data-slot="tooltip-content"]').forEach((n) => n.remove());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
