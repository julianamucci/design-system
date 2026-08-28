import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createButton } from '@/components/ui/button';
import {
  createMediaPlayer,
  type MediaPlayerOptions,
  type MediaPlayerRoot,
} from '@/components/ui/media-player';
import {
  DEMO_SECONDS,
  VIMEO_VIDEO_ID,
  YOUTUBE_VIDEO_ID,
  canvasStream,
  captionTrack,
  mediaPlayerLabels,
  silentWav,
} from '@/components/ui/media-player.fixtures';
import uiTranslations from '@/i18n/ui.json';
import mediaPlayerTranslations from '@shared/content/media-player/translations.json';
import { toPlainText } from '@/lib/strip-html';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
  createDocsVariants,
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
//
// Quase sem overrides: o `translations.json` do MediaPlayer descreve a API em
// nomenclatura neutra, e nesta stack os nomes coincidem — `kind`, `src`,
// `stream`, `embed`, `tracks`, `rates`, `labels`.
//
// A exceção são os três callbacks. O conteúdo compartilhado os nomeia por
// PROPÓSITO ("callback de início") porque o nome REAL muda de stack para stack,
// e a tabela desta página promete o nome que se DIGITA aqui. Só o `name` muda:
// tipo, padrão e descrição valem nos cinco.

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(
  mediaPlayerTranslations as Record<string, unknown>,
  {
    '*': {
      'props.table.onPlay.name': 'onPlay',
      'props.table.onPause.name': 'onPause',
      'props.table.onEnded.name': 'onEnded',
    },
  },
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
 * Player de preview, com os rótulos no idioma da página.
 *
 * Toda instância desta página passa por aqui: são vários players na mesma
 * página (demonstração, dois pares de Do & Don't, quatro cards de fonte), e
 * cada um precisa dos doze rótulos para montar a barra. Eles saem do conteúdo
 * compartilhado, e não de uma constante em pt-BR: o rótulo é o NOME ACESSÍVEL
 * de um controle só de ícone, e uma barra em português numa página em espanhol
 * é ilegível para quem ouve.
 *
 * Como a página refaz as seções a cada troca de idioma, e `mediaPlayerLabels()`
 * resolve no idioma corrente, a barra troca junto com o texto em volta.
 */
function previewPlayer(
  options: Omit<MediaPlayerOptions, 'labels'> & { labels?: MediaPlayerOptions['labels'] },
): MediaPlayerRoot {
  return createMediaPlayer({
    ...options,
    labels: options.labels ?? mediaPlayerLabels(),
    // `max-w-xl` porque a largura é da PÁGINA: o componente é `width: 100%`
    // de propósito, e sem limite um 16:9 na largura da docs page fica mais
    // alto que a janela. 640px é a coluna em que um player mora de verdade.
    class: ['nds-w-full', 'nds-max-w-xl', options.class].filter(Boolean).join(' '),
  });
}

/** As quatro fontes, na ordem em que o conteúdo as lista. */
const SOURCE_KEYS = ['video', 'audio', 'youtube', 'vimeo'] as const;
type SourceKey = typeof SOURCE_KEYS[number];

/**
 * A mídia de cada fonte, montada em memória.
 *
 * Vídeo por canvas e áudio por WAV — nada baixado, nada de rede. Os dois
 * provedores são identificadores públicos, e são os únicos casos desta página
 * em que o navegador de quem lê vai à rede: é o que a fonte É.
 */
function sourceOptions(key: SourceKey): Omit<MediaPlayerOptions, 'labels'> {
  switch (key) {
    case 'video':
      // `rates: []` porque a fonte é stream ao vivo, e nela a velocidade de
      // reprodução é ignorada — medido. Oferecer o seletor seria dar um
      // controle que a pessoa mexe e não acontece nada.
      return { kind: 'video', stream: canvasStream(), rates: [], tracks: [captionTrack()] };
    case 'audio':
      return { kind: 'audio', src: silentWav(DEMO_SECONDS) };
    case 'youtube':
      return { embed: { provider: 'youtube', videoId: YOUTUBE_VIDEO_ID } };
    case 'vimeo':
      return { embed: { provider: 'vimeo', videoId: VIMEO_VIDEO_ID } };
  }
}

/** Chaves da tabela de propriedades, na ordem do contrato. */
const PROP_KEYS = [
  'kind', 'src', 'stream', 'embed', 'tracks', 'rates', 'labels',
  'onPlay', 'onPause', 'onEnded',
];

/** Chaves da tabela de tokens, na ordem em que o conteúdo as declara. */
const TOKEN_KEYS = [
  'border', 'background', 'muted', 'mutedForeground', 'foreground',
  'primary', 'accent', 'ring', 'spacing6',
];

/** Estados descritos pelo conteúdo compartilhado, na ordem em que ele os lista. */
const STATE_KEYS = ['idle', 'playing', 'ended', 'refused', 'unavailable'];

const INTERFACE_CODE = `// createMediaPlayer(options)
export type MediaPlayerOptions = {
  kind?: 'video' | 'audio';
  src?: string;
  stream?: MediaStream;
  embed?: { provider: 'youtube' | 'vimeo'; videoId: string; hash?: string };
  tracks?: MediaPlayerTrack[];
  rates?: number[];
  labels: MediaPlayerLabels;
  onPlay?: () => void;
  onPause?: (info: { ended: boolean; currentTime: number }) => void;
  onEnded?: () => void;
  class?: string;
};`;

/** Chamada mostrada no card de cada fonte. */
function sourceSnippet(key: SourceKey): string {
  const lines: Record<SourceKey, string[]> = {
    video: ["  kind: 'video',", "  src: '/videos/tour.mp4',", '  tracks,'],
    audio: ["  kind: 'audio',", "  src: '/audios/episodio.mp3',"],
    youtube: ["  embed: { provider: 'youtube', videoId: 'aqz-KE-bpKQ' },"],
    vimeo: ["  embed: { provider: 'vimeo', videoId: '76979871' },"],
  };
  return ['const player = createMediaPlayer({', ...lines[key], '  labels,', '});'].join('\n');
}

/**
 * O par do primeiro Do & Don't: a mesma reprodução contada de dois jeitos.
 *
 * À esquerda o contador escuta o MOTOR (`onPlay`); à direita, o clique no
 * botão. Com um clique os dois marcam um. A diferença aparece quando a
 * reprodução parte de outro caminho — e o botão "Tocar por fora" é exatamente
 * esse caminho: ele chama `play()` no elemento, como faria uma tecla de mídia,
 * a janela flutuante ou o controle do sistema. O contador da esquerda sobe; o
 * da direita fica onde estava.
 */
function countingPlayer(listenTo: 'engine' | 'click'): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack nds-w-full';
  wrap.dataset.spacing = 'sm';

  const count = document.createElement('p');
  count.className = 'nds-text-body nds-text-muted-foreground';
  let plays = 0;
  const paint = () => {
    count.textContent = `${t('doDont.countLabel')}: ${plays}`;
  };

  const player = previewPlayer({
    kind: 'audio',
    // Cinco segundos: o par existe para CONTAR reproduções, e um clipe curto
    // deixa repetir a comparação sem esperar. Não é a demonstração, onde a
    // duração precisa dar o que a barra represente.
    src: silentWav(5),
    onPlay: listenTo === 'engine' ? () => { plays += 1; paint(); } : undefined,
  });
  paint();

  const outside = createButton({
    variant: 'outline',
    size: 'sm',
    label: t('doDont.outsideLabel'),
    onClick: () => {
      const media = player.media;
      if (!media) return;
      media.muted = true;
      media.currentTime = 0;
      void media.play().catch(() => undefined);
    },
  });

  if (listenTo === 'click') {
    // O contador errado: escuta o CLIQUE no botão da barra, e por isso não vê
    // nada do que não passa por ele.
    player.querySelector('[data-slot="media-player-controls"] button')
      ?.addEventListener('click', () => { plays += 1; paint(); });
  }

  wrap.append(player, count, outside);
  return wrap;
}

// ─── createMediaPlayerDocs ────────────────────────────────────────────────────

export function createMediaPlayerDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'media-player',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/display' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'media-player',
      locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());

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

  const pageLayout = createDocsPageLayout({
    navGroups: buildNavGroups(),
    componentSlug: 'media-player',
  });
  const root = pageLayout.root;
  const headerSlot = pageLayout.headerSlot;
  const main = pageLayout.main;
  cleanups.push(() => pageLayout.destroy());

  function renderHeader() {
    headerSlot.replaceChildren(
      createDocsHeader({
        title: t('title'),
        description: t('description'),
        category: t('category'),
        type: t('type'),
      }),
    );
  }

  // ── Demonstração ─────────────────────────────────────────────────────────
  //
  // Trocar de fonte REMONTA o player, e aqui isso é correto: a fonte decide o
  // motor, e motor não se troca em voo — um `<video>` não vira `<iframe>`. O
  // player antigo é destruído de propósito, senão o áudio removido continuaria
  // tocando e o quadro do provedor continuaria baixando.

  function buildDemo(): HTMLElement {
    let current: SourceKey = 'video';

    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-stack';
    wrap.dataset.spacing = 'md';

    const controls = document.createElement('div');
    controls.className = 'nds-cluster';
    controls.dataset.spacing = 'sm';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', t('demonstration.title'));

    const slot = document.createElement('div');
    slot.className = 'nds-w-full';

    let player: MediaPlayerRoot | null = null;

    function mount() {
      // A destruição é o passo que não pode faltar: ela para a mídia, solta as
      // trilhas do stream e apaga os ouvintes de `document` e de `window`, que
      // sobrevivem à remoção do nó.
      player?.destroy();
      player = previewPlayer(sourceOptions(current));
      slot.replaceChildren(player);
    }
    cleanups.push(() => player?.destroy());

    const buttons: Array<{ key: SourceKey; el: HTMLButtonElement }> = [];

    function syncControls() {
      for (const button of buttons) {
        button.el.setAttribute('aria-pressed', String(button.key === current));
      }
    }

    for (const key of SOURCE_KEYS) {
      const label = t(`demonstration.labels.${key}`);
      const el = createButton({
        variant: 'outline',
        size: 'sm',
        label,
        onClick: () => {
          current = key;
          mount();
          syncControls();
        },
      });
      // O evento sai do PRÓPRIO botão: o observer resolve por
      // `.closest('[data-track]')`, e sem a marca aqui ele subiria até o
      // container e dispararia um segundo evento com o rótulo traduzido.
      el.dataset.track = 'demo';
      el.dataset.trackId = `media-player:demonstracao:${key}`;
      el.dataset.trackLabel = label;
      buttons.push({ key, el });
      controls.appendChild(el);
    }

    mount();
    syncControls();
    wrap.append(controls, slot);
    return wrap;
  }

  // ── Sections (rebuilt on locale change) ───────────────────────────────────

  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          componentSlug: 'media-player',
          demoFactory: buildDemo,
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6, 7].map(i => t(`anatomy.item${i}`)),
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
            items: [1, 2, 3, 4, 5].map(i => ({
              s: t(`usage.scenarios.item${i}.s`),
              u: t(`usage.scenarios.item${i}.u`),
              a: t(`usage.scenarios.item${i}.a`),
            })),
          },
          do: {
            title: tNav('common.do'),
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: tNav('common.dont'),
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
              // Os dois players são idênticos; muda só QUEM o contador escuta.
              // O botão "Tocar por fora" é o caminho que não passa pela barra —
              // como uma tecla de mídia ou o controle do sistema — e é ali que
              // os dois números deixam de bater.
              doPreviewFactory: () => countingPlayer('engine'),
              dontPreviewFactory: () => countingPlayer('click'),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              // O mesmo vídeo, e a única diferença é a faixa declarada.
              doPreviewFactory: () => previewPlayer({
                kind: 'video', stream: canvasStream(), rates: [], tracks: [captionTrack()],
              }),
              dontPreviewFactory: () => previewPlayer({
                kind: 'video', stream: canvasStream(), rates: [], tracks: [],
              }),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          componentSlug: 'media-player',
          description: t('import.basic'),
          code: t('import.basicCode'),
          secondaryDescription: t('import.withProvider'),
          secondaryCode: t('import.withProviderCode'),
        });

      case 'variantes':
        return createDocsVariants({
          title: t('variants.title'),
          note: t('variants.note'),
          componentSlug: 'media-player',
          items: SOURCE_KEYS.map(key => ({
            // O `name` é a chave ESTÁVEL, não traduzida: é ela que vira
            // `snippet_id` do `docs_code_copy`, e um nome traduzido partiria o
            // mesmo evento em três no GA4.
            name: t(`variants.items.${key}.name`),
            trackId: key,
            description: t(`variants.items.${key}.description`),
            code: sourceSnippet(key),
            previewFactory: () => previewPlayer(sourceOptions(key)),
          })),
        });

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          items: STATE_KEYS.map(key => ({
            label: t(`states.${key}.label`),
            trigger: t(`states.${key}.trigger`),
            behavior: toPlainText(t(`states.${key}.behavior`)),
          })),
        });

      case 'propriedades':
        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              cols: {
                prop: t('props.table.prop'),
                type: t('props.table.type'),
                default: t('props.table.default'),
                required: t('props.table.required'),
                description: t('props.table.description'),
              },
              items: PROP_KEYS.map(key => ({
                name: t(`props.table.${key}.name`),
                type: t(`props.table.${key}.type`),
                defaultValue: t(`props.table.${key}.default`),
                required: t(`props.table.${key}.required`),
                description: t(`props.table.${key}.description`),
              })),
            },
          ],
          interfaceCode: INTERFACE_CODE,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibility'),
          extensibilityCode: t('props.extensibilityCode'),
        });

      case 'tokens':
        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.value'),
            description: t('tokens.table.description'),
          },
          items: TOKEN_KEYS.map(key => ({
            token: t(`tokens.table.${key}.token`),
            value: t(`tokens.table.${key}.value`),
            description: t(`tokens.table.${key}.description`),
          })),
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => t(`accessibility.item${i}`)),
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: ['tab', 'space', 'arrows', 'homeEnd', 'escape'].map(key => ({
            key: t(`accessibility.keyboard.${key}.key`),
            description: t(`accessibility.keyboard.${key}.action`),
          })),
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          componentSlug: 'media-player',
          items: [
            { name: 'AspectRatio', description: toPlainText(t('related.aspectRatio')), path: '?path=/docs/ui-aspectratio--docs' },
            { name: 'Sonner',      description: toPlainText(t('related.sonner')),      path: '?path=/docs/ui-sonner--docs' },
            { name: 'Button',      description: toPlainText(t('related.button')),      path: '?path=/docs/ui-button--docs' },
            { name: 'Card',        description: toPlainText(t('related.card')),        path: '?path=/docs/ui-card--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          componentSlug: 'media-player',
          items: [1, 2, 3, 4, 5, 6].map(i => ({ title: '', content: t(`notes.tip${i}`) })),
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: t('analytics.table.event'),
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: ['pageView', 'sectionViewed', 'demoClick'].map(key => ({
            event: t(`analytics.table.${key}`),
            trigger: toPlainText(t(`analytics.table.${key}Trigger`)),
            payload: t(`analytics.table.${key}Payload`),
          })),
        });

      case 'testes':
        // As três sub-seções do conteúdo usam a MESMA forma
        // (`action`/`result`/`priority`). Os containers de acessibilidade e de
        // visual foram desenhados para outra: aqui cada campo entra no lugar
        // que o preserva, sem descartar texto.
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
            items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            description: t('testes.accessibility.description'),
            cols: {
              criterion: tNav('common.userAction'),
              level: tNav('common.priority'),
              how: tNav('common.expectedResult'),
            },
            items: [1, 2, 3, 4, 5].map(i => ({
              criterion: t(`testes.accessibility.item${i}.action`),
              level: priorityLabel(t(`testes.accessibility.item${i}.priority`)),
              how: t(`testes.accessibility.item${i}.result`),
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            description: t('testes.visual.description'),
            cols: {
              story: tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2].map(i => ({
              story: `${t(`testes.visual.item${i}.action`)} — ${t(`testes.visual.item${i}.result`)}`,
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
      (id) => sectionEls[id as SectionId] ?? null,
      (id) => pageLayout.setActiveSection(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'media-player',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ────────────────────────────────────────────────────────

  renderHeader();
  renderAllSections();

  // `subscribe` é o mesmo canal de `onLocaleChange` — registrar uma vez só.
  cleanups.push(subscribe(() => {
    cleanupSeo();
    cleanupSeo = updateSeo();
    renderHeader();
    pageLayout.rebuildNav(buildNavGroups());
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
