import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  TemplateRef,
  ViewEncapsulation,
  signal,
  viewChild,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NdsButton } from '@/components/ui/button';
import {
  MediaPlayerComponent,
  type MediaPlayerLabels,
  type MediaPlayerTrack,
} from '@/components/ui/media-player';
import type { EmbedSource } from '@/components/ui/media-embed';
import {
  VIMEO_VIDEO_ID,
  YOUTUBE_VIDEO_ID,
  canvasStream,
  captionTrack,
  mediaPlayerLabels,
  silentWav,
} from '@/components/ui/media-player.fixtures';
import uiTranslations from '@/i18n/ui.json';
import mediaPlayerTranslations from '@shared/content/media-player/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsVariants,
  NdsDocsStates,
  NdsDocsProps,
  NdsDocsTokens,
  NdsDocsAccessibility,
  NdsDocsRelated,
  NdsDocsNotes,
  NdsDocsAnalytics,
  NdsDocsTestes,
} from '@/components/docs/shared/sections';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// O conteúdo compartilhado nomeia os três callbacks por PROPÓSITO ("callback de
// início") justamente porque o nome real muda de stack para stack. O override é
// o lugar certo dessa tradução: texto de prop, nunca snippet — e aqui a tabela
// promete o nome que se digita nesta stack.
const { t, dict } = useTranslation(mediaPlayerTranslations as unknown as Record<string, unknown>, {
  '*': {
    'props.table.onPlay.name': '(played)',
    'props.table.onPause.name': '(paused)',
    'props.table.onEnded.name': '(finished)',
  },
});

const SLUG = 'media-player';

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

/**
 * Reconstrói linhas de tabela a partir do dicionário achatado.
 *
 * O conteúdo compartilhado numera as linhas como `item1`, `item2`… e `t()` só
 * devolve folha. Percorre até a primeira lacuna, o que evita repetir na docs
 * page um `[1,2,3…]` que envelhece quando o ux-writer acrescenta uma linha.
 */
function itemsFromDict<K extends string>(
  d: Record<string, string>,
  base: string,
  fields: readonly K[],
): Record<K, string>[] {
  const rows: Record<K, string>[] = [];
  for (let i = 1; ; i++) {
    if (d[`${base}.item${i}.${fields[0]}`] === undefined) break;
    const row = {} as Record<K, string>;
    for (const field of fields) row[field] = d[`${base}.item${i}.${field}`] ?? '';
    rows.push(row);
  }
  return rows;
}

/** As linhas numeradas de uma lista simples (`base.item1`, `base.item2`…). */
function listFromDict(d: Record<string, string>, base: string): string[] {
  const items: string[] = [];
  for (let i = 1; d[`${base}.item${i}`] !== undefined; i++) items.push(d[`${base}.item${i}`]);
  return items;
}

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

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

/** As quatro fontes, na ordem em que o conteúdo as lista. */
const SOURCE_KEYS = ['video', 'audio', 'youtube', 'vimeo'] as const;
type SourceKey = typeof SOURCE_KEYS[number];

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

const INTERFACE_CODE = `@Component({ selector: 'nds-media-player' })
export class MediaPlayerComponent {
  kind = input<'video' | 'audio'>('video');
  src = input<string | undefined>(undefined);
  stream = input<MediaStream | undefined>(undefined);
  embed = input<EmbedSource | undefined>(undefined);
  tracks = input<MediaPlayerTrack[]>([]);
  rates = input<number[]>([0.5, 0.75, 1, 1.25, 1.5, 2]);
  labels = input.required<MediaPlayerLabels>();

  played = output<void>();
  paused = output<{ ended: boolean; currentTime: number }>();
  finished = output<void>();

  get media(): HTMLMediaElement | null;
  get frame(): HTMLIFrameElement | null;
}`;

/** O uso mostrado no card de cada fonte. */
function sourceSnippet(key: SourceKey): string {
  const lines: Record<SourceKey, string[]> = {
    video: [
      '  kind="video"',
      '  src="/videos/tour.mp4"',
      '  [tracks]="tracks"',
    ],
    audio: ['  kind="audio"', '  src="/audios/episodio.mp3"'],
    youtube: [`  [embed]="{ provider: 'youtube', videoId: '${YOUTUBE_VIDEO_ID}' }"`],
    vimeo: [`  [embed]="{ provider: 'vimeo', videoId: '${VIMEO_VIDEO_ID}' }"`],
  };
  return ['<nds-media-player', ...lines[key], '  [labels]="labels"', '/>'].join('\n');
}

/** Conteúdo de áudio dos quatro previews do Do & Don't, e da demonstração. */
const DEMO_AUDIO = silentWav(0.6);

@Component({
  selector: 'nds-media-player-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsButton, MediaPlayerComponent,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!--
      Previews declarados antes do layout: DocsDoDont e DocsVariants recebem
      TemplateRef, então os componentes demonstrados são reais (com bindings e
      change detection), não DOM montado à mão.

      O par 1 são dois players IDÊNTICOS, e a única diferença é QUEM o contador
      escuta. Com um clique na barra os dois marcam um; a diferença só aparece
      pelo botão de fora, que chama play() no elemento — como faria uma tecla de
      mídia, a janela flutuante ou o controle do sistema.
    -->
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <nds-media-player
          #enginePlayer
          kind="audio"
          [src]="demoAudio"
          [labels]="labels()"
          (played)="countByEngine()"
        />
        <p class="nds-text-body nds-text-muted-foreground">
          {{ t('doDont.countLabel') }}: {{ engineCount() }}
        </p>
        <button ndsButton variant="outline" size="sm" type="button" (click)="playOutside(enginePlayer)">
          {{ t('doDont.outsideLabel') }}
        </button>
      </div>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <!--
          O contador errado: escuta o CLIQUE no botão da barra, e por isso não vê
          nada do que não passa por ele.
        -->
        <nds-media-player
          #clickPlayer
          kind="audio"
          [src]="demoAudio"
          [labels]="labels()"
          (click)="countByBarClick($event)"
        />
        <p class="nds-text-body nds-text-muted-foreground">
          {{ t('doDont.countLabel') }}: {{ clickCount() }}
        </p>
        <button ndsButton variant="outline" size="sm" type="button" (click)="playOutside(clickPlayer)">
          {{ t('doDont.outsideLabel') }}
        </button>
      </div>
    </ng-template>

    <!-- O mesmo vídeo nos dois lados, e a única diferença é a faixa declarada. -->
    <ng-template #tplDoDont2Do>
      <nds-media-player
        kind="video"
        [stream]="doDontStream()"
        [rates]="noRates"
        [tracks]="captionTracks"
        [labels]="labels()"
      />
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <nds-media-player
        kind="video"
        [stream]="doDontStreamWithoutCaptions()"
        [rates]="noRates"
        [tracks]="noTracks"
        [labels]="labels()"
      />
    </ng-template>

    <ng-template #tplVarVideo>
      <nds-media-player
        kind="video"
        [stream]="variantStream()"
        [rates]="noRates"
        [tracks]="captionTracks"
        [labels]="labels()"
      />
    </ng-template>
    <ng-template #tplVarAudio>
      <nds-media-player kind="audio" [src]="demoAudio" [labels]="labels()" />
    </ng-template>
    <ng-template #tplVarYouTube>
      <nds-media-player [embed]="youtubeEmbed" [labels]="labels()" />
    </ng-template>
    <ng-template #tplVarVimeo>
      <nds-media-player [embed]="vimeoEmbed" [labels]="labels()" />
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="media-player"
    >
      <div docsHeader>
        <nds-docs-header
          [title]="t('title')"
          [description]="t('description')"
          [category]="t('category')"
          [type]="t('type')"
        />
      </div>

      <ng-container docsMain>
        <!-- 1. Demonstração -->
        <nds-docs-demonstration [title]="t('demonstration.title')">
          <div class="nds-stack nds-w-full" data-spacing="md">
            <!--
              Papel de grupo COM NOME: os quatro controles mudam o mesmo player, e
              sem o agrupamento eles chegam ao leitor de tela como quatro botões
              soltos entre o título da seção e a moldura.
            -->
            <div
              class="nds-cluster"
              data-spacing="sm"
              role="group"
              [attr.aria-label]="t('demonstration.title')"
            >
              @for (control of demoControls(); track control.id) {
                <button
                  ndsButton
                  variant="outline"
                  size="sm"
                  type="button"
                  [attr.aria-pressed]="control.pressed"
                  data-track="demo"
                  [attr.data-track-id]="'media-player:demonstracao:' + control.id"
                  [attr.data-track-label]="control.label"
                  (click)="onDemoClick(control.id)"
                >{{ control.label }}</button>
              }
            </div>

            <!--
              Trocar de fonte REMONTA o player, e aqui isso é correto: a fonte
              decide o motor, e motor não se troca em voo — um video nao vira
              iframe. Cada ramo do switch é uma view própria, então a saída
              destrói o player antigo: sem isso o áudio removido continuaria
              tocando e o quadro do provedor continuaria baixando.
            -->
            <div class="nds-w-full">
              @switch (demoSource()) {
                @case ('video') {
                  <nds-media-player
                    kind="video"
                    [stream]="demoStream()"
                    [rates]="noRates"
                    [tracks]="captionTracks"
                    [labels]="labels()"
                  />
                }
                @case ('audio') {
                  <nds-media-player kind="audio" [src]="demoAudio" [labels]="labels()" />
                }
                @case ('youtube') {
                  <nds-media-player [embed]="youtubeEmbed" [labels]="labels()" />
                }
                @case ('vimeo') {
                  <nds-media-player [embed]="vimeoEmbed" [labels]="labels()" />
                }
              }
            </div>
          </div>
        </nds-docs-demonstration>

        <!-- 2. Anatomia -->
        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="t('anatomy.structureCode')"
          language="html"
        />

        <!-- 3. Quando usar -->
        <nds-docs-when-to-use
          [title]="t('usage.title')"
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <!-- 4. Do / Don't -->
        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <!-- 5. Importação -->
        <nds-docs-import
          [title]="t('import.title')"
          [description]="t('import.basic')"
          [code]="t('import.basicCode')"
          [secondaryDescription]="t('import.withProvider')"
          [secondaryCode]="t('import.withProviderCode')"
          componentSlug="media-player"
          language="ts"
        />

        <!-- 6. Fontes -->
        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="media-player"
          language="html"
          id="variantes"
        />

        <!-- 7. Estados -->
        <nds-docs-states
          [title]="t('states.title')"
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <!-- 8. Propriedades -->
        <nds-docs-props
          [title]="t('props.title')"
          [tables]="propTables()"
          [interfaceCode]="interfaceCode"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityNotes]="t('props.extensibility')"
          [extensibilityCode]="t('props.extensibilityCode')"
        />

        <!-- 9. Tokens -->
        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="t('tokens.customizationCode')"
        />

        <!-- 10. Acessibilidade -->
        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboardTitle')"
          [keyboardItems]="keyboardItems()"
        />

        <!-- 11. Relacionados -->
        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="media-player"
        />

        <!-- 12. Notas -->
        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="media-player"
        />

        <!-- 13. Analytics -->
        <nds-docs-analytics
          [title]="t('analytics.title')"
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

        <!-- 14. Testes -->
        <nds-docs-testes
          [title]="t('testes.title')"
          [functional]="testesFunctional()"
          [accessibility]="testesAccessibility()"
          [visual]="testesVisual()"
        />
      </ng-container>
    </nds-docs-page-layout>
  `,
})
export class NdsMediaPlayerDocs implements AfterViewInit, OnDestroy {
  // `t` e `tNav` expostos ao template: o dicionário é reativo ao signal de
  // locale, então trocar de idioma re-renderiza a página inteira.
  protected readonly t = t;
  protected readonly tNav = tNav;

  protected readonly activeSection = signal<string | undefined>(undefined);

  /**
   * Os rótulos vêm de `labels.*` do conteúdo compartilhado, e por isso são
   * `computed`: o rótulo é o NOME ACESSÍVEL de um controle só de ícone, e uma
   * barra em português numa página em espanhol é ilegível para quem ouve.
   */
  protected readonly labels = computed<MediaPlayerLabels>(() => {
    dict();
    return mediaPlayerLabels();
  });

  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly demoAudio = DEMO_AUDIO;
  protected readonly captionTracks: MediaPlayerTrack[] = [captionTrack()];
  /** Sem faixa nenhuma — o lado errado do par 2. */
  protected readonly noTracks: MediaPlayerTrack[] = [];
  /**
   * Fonte ao vivo ignora `playbackRate` — sem lista, sem seletor. Medido: 1.5
   * escrito lê de volta 1. Oferecer o seletor seria dar um controle que a pessoa
   * mexe e não acontece nada.
   */
  protected readonly noRates: number[] = [];

  protected readonly youtubeEmbed: EmbedSource = {
    provider: 'youtube',
    videoId: YOUTUBE_VIDEO_ID,
  };
  protected readonly vimeoEmbed: EmbedSource = {
    provider: 'vimeo',
    videoId: VIMEO_VIDEO_ID,
  };

  /**
   * Um stream por preview de vídeo, e não um compartilhado.
   *
   * A destruição de um player PARA as trilhas do stream — é o que impede uma
   * câmera aberta de continuar gravando. Um stream só para os quatro vídeos
   * desta página morreria junto com o primeiro que saísse da tela.
   */
  protected readonly demoStream = signal<MediaStream>(canvasStream());
  protected readonly doDontStream = signal<MediaStream>(canvasStream());
  protected readonly doDontStreamWithoutCaptions = signal<MediaStream>(canvasStream());
  protected readonly variantStream = signal<MediaStream>(canvasStream());

  // ── Templates de preview ─────────────────────────────────────────────────
  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarVideo = viewChild.required<TemplateRef<unknown>>('tplVarVideo');
  private readonly tplVarAudio = viewChild.required<TemplateRef<unknown>>('tplVarAudio');
  private readonly tplVarYouTube = viewChild.required<TemplateRef<unknown>>('tplVarYouTube');
  private readonly tplVarVimeo = viewChild.required<TemplateRef<unknown>>('tplVarVimeo');

  // ── Navegação ────────────────────────────────────────────────────────────
  protected readonly navGroups = computed(() => {
    // Leitura do dicionário para amarrar este computed ao signal de locale:
    // `tNav` sozinho é uma função comum e não registraria a dependência.
    dict();
    return NAV_GROUPS.map((group) => ({
      label: tNav(group.labelKey),
      sections: group.sections.map((section) => ({
        id: section.id,
        label: tNav(section.labelKey),
      })),
    }));
  });

  // ── Demonstração ─────────────────────────────────────────────────────────
  protected readonly demoSource = signal<SourceKey>('video');

  protected readonly demoControls = computed(() => {
    dict();
    return SOURCE_KEYS.map((key) => ({
      id: key,
      label: t(`demonstration.labels.${key}`),
      pressed: this.demoSource() === key,
    }));
  });

  /**
   * O clique só muda o estado — o evento sai dos `data-track*` do próprio botão.
   *
   * Chamar `track('docs_demo_click', …)` aqui dispararia DOIS eventos: a seção
   * `nds-docs-demonstration` é um container auto-instrumentado
   * (`data-track-container`), e o `closest('[data-track]')` do observador subiria
   * até ela quando o botão não se marcasse. O segundo evento sairia com
   * `element_id` derivado do TEXTO do botão — rótulo traduzido, que parte um
   * evento em três no GA4.
   */
  protected onDemoClick(key: SourceKey): void {
    // O stream anterior morreu com o player que o consumia: as trilhas param na
    // destruição. Voltar ao vídeo precisa de uma fonte nova.
    if (key === 'video') this.demoStream.set(canvasStream());
    this.demoSource.set(key);
  }

  // ── Do & Don't ───────────────────────────────────────────────────────────
  protected readonly engineCount = signal(0);
  protected readonly clickCount = signal(0);

  /** O contador certo: escuta o MOTOR, e vê tudo que faz a mídia começar. */
  protected countByEngine(): void {
    this.engineCount.update((n) => n + 1);
  }

  /**
   * O contador errado: só conta o que passa pelo botão da barra.
   *
   * A escuta é no host por delegação porque o botão é interno ao componente —
   * que é justamente a forma de quem tenta contar reprodução pelo clique em vez
   * de pelo evento da mídia.
   */
  protected countByBarClick(event: Event): void {
    const control = (event.target as HTMLElement).closest('button');
    if (!control) return;
    const bar = control.closest('[data-slot="media-player-controls"]');
    // Só o PRIMEIRO botão da barra é o de tocar; mudo e os demais não contam.
    if (!bar || bar.querySelector('button') !== control) return;
    this.clickCount.update((n) => n + 1);
  }

  /**
   * Tocar POR FORA da barra — como faria uma tecla de mídia, a janela flutuante
   * ou o controle do sistema.
   *
   * É este caminho que separa os dois contadores: o da esquerda sobe, o da
   * direita fica onde estava.
   */
  protected playOutside(player: MediaPlayerComponent): void {
    const media = player.media;
    if (!media) return;
    media.muted = true;
    media.currentTime = 0;
    void media.play().catch(() => undefined);
  }

  protected readonly doDontPairs = computed(() => {
    dict();
    return [
      {
        doLabel: tNav('common.do'),
        dontLabel: tNav('common.dont'),
        doCaption: toPlainText(t('doDont.pair1.do')),
        dontCaption: toPlainText(t('doDont.pair1.dont')),
        doPreview: this.tplDoDont1Do(),
        dontPreview: this.tplDoDont1Dont(),
      },
      {
        doLabel: tNav('common.do'),
        dontLabel: tNav('common.dont'),
        doCaption: toPlainText(t('doDont.pair2.do')),
        dontCaption: toPlainText(t('doDont.pair2.dont')),
        doPreview: this.tplDoDont2Do(),
        dontPreview: this.tplDoDont2Dont(),
      },
    ];
  });

  // ── Anatomia ─────────────────────────────────────────────────────────────
  protected readonly anatomyItems = computed(() => listFromDict(dict(), 'anatomy'));

  // ── Quando usar ──────────────────────────────────────────────────────────
  protected readonly guidelines = computed(() => {
    const d = dict();
    return { title: t('usage.guidelines.title'), items: listFromDict(d, 'usage.guidelines') };
  });

  protected readonly scenarios = computed(() => {
    const d = dict();
    return {
      title: t('usage.scenarios.title'),
      cols: {
        scenario: t('usage.scenarios.cols.scenario'),
        use: t('usage.scenarios.cols.use'),
        alternative: t('usage.scenarios.cols.alternative'),
      },
      items: itemsFromDict(d, 'usage.scenarios', ['s', 'u', 'a'] as const),
    };
  });

  protected readonly usageDo = computed(() => ({
    title: tNav('common.do'),
    items: listFromDict(dict(), 'usage.do'),
  }));

  protected readonly usageDont = computed(() => ({
    title: tNav('common.dont'),
    items: listFromDict(dict(), 'usage.dont'),
  }));

  // ── Fontes ───────────────────────────────────────────────────────────────
  protected readonly variantItems = computed(() => {
    dict();
    const previews: Record<SourceKey, TemplateRef<unknown>> = {
      video: this.tplVarVideo(),
      audio: this.tplVarAudio(),
      youtube: this.tplVarYouTube(),
      vimeo: this.tplVarVimeo(),
    };
    return SOURCE_KEYS.map((key) => ({
      name: t(`variants.items.${key}.name`),
      description: t(`variants.items.${key}.description`),
      // `trackId` é a chave ESTÁVEL, não traduzida: é ela que vira o
      // `snippet_id` do `docs_code_copy`, e um nome traduzido partiria o mesmo
      // evento em três no GA4.
      trackId: key,
      code: sourceSnippet(key),
      preview: previews[key],
    }));
  });

  // ── Estados ──────────────────────────────────────────────────────────────
  protected readonly statesCols = computed(() => {
    dict();
    return {
      state: t('states.cols.state'),
      trigger: t('states.cols.trigger'),
      behavior: t('states.cols.behavior'),
    };
  });

  protected readonly stateItems = computed(() => {
    dict();
    return STATE_KEYS.map((key) => ({
      label: t(`states.${key}.label`),
      trigger: t(`states.${key}.trigger`),
      behavior: toPlainText(t(`states.${key}.behavior`)),
    }));
  });

  // ── Propriedades ─────────────────────────────────────────────────────────
  protected readonly propTables = computed(() => {
    dict();
    return [
      {
        title: t('props.interface'),
        cols: {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        },
        items: PROP_KEYS.map((key) => ({
          name: t(`props.table.${key}.name`),
          type: t(`props.table.${key}.type`),
          defaultValue: t(`props.table.${key}.default`),
          required: t(`props.table.${key}.required`),
          description: toPlainText(t(`props.table.${key}.description`)),
        })),
      },
    ];
  });

  // ── Tokens ───────────────────────────────────────────────────────────────
  protected readonly tokensCols = computed(() => {
    dict();
    return {
      token: t('tokens.table.token'),
      value: t('tokens.table.value'),
      description: t('tokens.table.description'),
    };
  });

  protected readonly tokenItems = computed(() => {
    dict();
    return TOKEN_KEYS.map((key) => ({
      token: t(`tokens.table.${key}.token`),
      value: t(`tokens.table.${key}.value`),
      description: t(`tokens.table.${key}.description`),
    }));
  });

  // ── Acessibilidade ───────────────────────────────────────────────────────
  protected readonly a11yItems = computed(() => listFromDict(dict(), 'accessibility'));

  protected readonly keyboardItems = computed(() => {
    dict();
    return ['tab', 'space', 'arrows', 'homeEnd', 'escape'].map((key) => ({
      key: t(`accessibility.keyboard.${key}.key`),
      description: toPlainText(t(`accessibility.keyboard.${key}.action`)),
    }));
  });

  // ── Relacionados ─────────────────────────────────────────────────────────
  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { name: 'AspectRatio', description: toPlainText(t('related.aspectRatio')), path: '?path=/docs/ui-aspectratio--docs' },
      { name: 'Sonner',      description: toPlainText(t('related.sonner')),      path: '?path=/docs/ui-sonner--docs'      },
      { name: 'Button',      description: toPlainText(t('related.button')),      path: '?path=/docs/ui-button--docs'      },
      { name: 'Card',        description: toPlainText(t('related.card')),        path: '?path=/docs/ui-card--docs'        },
    ];
  });

  // ── Notas ────────────────────────────────────────────────────────────────
  protected readonly noteItems = computed(() => {
    const d = dict();
    const tips: { title: string; content: string }[] = [];
    for (let i = 1; d[`notes.tip${i}`] !== undefined; i++) {
      tips.push({ title: '', content: d[`notes.tip${i}`] });
    }
    return tips;
  });

  // ── Analytics ────────────────────────────────────────────────────────────
  protected readonly analyticsCols = computed(() => {
    dict();
    return {
      event: t('analytics.table.event'),
      trigger: toPlainText(t('analytics.table.trigger')),
      payload: t('analytics.table.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    return ['pageView', 'sectionViewed', 'demoClick'].map((key) => ({
      event: t(`analytics.table.${key}`),
      trigger: toPlainText(t(`analytics.table.${key}Trigger`)),
      payload: t(`analytics.table.${key}Payload`),
    }));
  });

  // ── Testes ───────────────────────────────────────────────────────────────
  //
  // As três sub-seções do conteúdo usam a MESMA forma
  // (`action`/`result`/`priority`). Os containers de acessibilidade e de visual
  // foram desenhados para outra: aqui cada campo entra no lugar que o preserva,
  // sem descartar texto.
  protected readonly testesFunctional = computed(() => {
    const d = dict();
    return {
      title: t('testes.functional.title'),
      description: t('testes.functional.description'),
      cols: {
        action: tNav('common.userAction'),
        result: tNav('common.expectedResult'),
        priority: tNav('common.priority'),
      },
      // toPlainText/stripHtml: as células são texto puro (interpolação), então um
      // <code> do conteúdo apareceria como marcação literal na tabela.
      items: itemsFromDict(d, 'testes.functional', ['action', 'result', 'priority']).map((row) => ({
        action: toPlainText(row.action),
        result: stripHtml(toPlainText(row.result)),
        priority: priorityLabel(row.priority),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    const d = dict();
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: {
        criterion: tNav('common.userAction'),
        level: tNav('common.priority'),
        how: tNav('common.expectedResult'),
      },
      items: itemsFromDict(d, 'testes.accessibility', ['action', 'result', 'priority']).map(
        (row) => ({
          criterion: toPlainText(row.action),
          level: priorityLabel(row.priority),
          how: stripHtml(toPlainText(row.result)),
        }),
      ),
    };
  });

  protected readonly testesVisual = computed(() => {
    const d = dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
      items: itemsFromDict(d, 'testes.visual', ['action', 'result', 'priority']).map((row) => ({
        story: `${toPlainText(row.action)} — ${stripHtml(toPlainText(row.result))}`,
        priority: priorityLabel(row.priority),
      })),
    };
  });

  // ── SEO + observador de seção ────────────────────────────────────────────
  private observer: { disconnect: () => void } | undefined;

  constructor() {
    // effect e não `subscribe`: o SEO precisa ser reaplicado a cada troca de
    // idioma, e a dependência do signal de locale entra pela leitura de `dict()`.
    effect((onCleanup) => {
      dict();
      const locale = getLocale();
      const cleanup = applySeo({
        // `seo.title` vem SEM o sufixo "· Design System": quem o acrescenta é o
        // próprio hook.
        title: t('seo.title'),
        description: t('seo.description'),
        locale,
        componentSlug: SLUG,
        aiSummary: t('seo.aiSummary'),
        aiEntities: t('seo.aiEntities'),
        breadcrumb: [
          { name: 'Components', item: '/components' },
          { name: t('category'), item: '/components/display' },
          { name: t('title') },
        ],
      });
      track('docs_page_view', {
        component_name: SLUG,
        locale,
        page_title: `${t('title')} · Design System`,
      });
      onCleanup(cleanup);
    });
  }

  ngAfterViewInit(): void {
    this.observer = createActiveSectionObserver(
      [...SECTION_IDS],
      (id) => document.getElementById(id),
      (id) => this.activeSection.set(id),
      (id) =>
        track('docs_section_viewed', {
          component_name: SLUG,
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
