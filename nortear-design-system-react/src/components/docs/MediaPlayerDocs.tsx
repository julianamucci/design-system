import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MediaPlayer,
  type MediaPlayerHandle,
  type MediaPlayerLabels,
} from "@/components/ui/media-player";
import {
  CanvasVideoPlayer,
  VIMEO_VIDEO_ID,
  YOUTUBE_VIDEO_ID,
  silentWav,
  useMediaPlayerLabels,
} from "@/components/ui/media-player.fixtures";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import { toPlainText } from "@/lib/strip-html";
import uiTranslations from "@/i18n/ui.json";
import mediaPlayerTranslations from "@shared/content/media-player/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsVariants }      from "@/components/docs/shared/sections/DocsVariants";
import { DocsStates }        from "@/components/docs/shared/sections/DocsStates";
import { DocsProps }         from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens }        from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated }       from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes }         from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics }     from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes }        from "@/components/docs/shared/sections/DocsTestes";

// ─── i18n ─────────────────────────────────────────────────────────────────────
//
// O `translations.json` do MediaPlayer descreve a API em nomenclatura NEUTRA, e
// nesta stack os nomes coincidem em sete das dez entradas — `kind`, `src`,
// `stream`, `embed`, `tracks`, `rates`, `labels`. As três restantes são os
// callbacks, que o conteúdo não pode nomear porque cada stack os chama de um
// jeito: ele os nomeia por PROPÓSITO, e cada stack promete na tabela o nome que
// de fato se digita nela. Override é exatamente para isso, e vale para os três
// idiomas: nome de prop não se traduz.
//
// Objeto de MÓDULO, e não literal no corpo do componente: `useTranslation` o
// recebe na lista de dependências do `useMemo` que achata o dicionário, e um
// literal novo a cada renderização reachataria as 341 chaves em cada desenho.
const PROP_OVERRIDES = {
  "*": {
    "props.table.onPlay.name": "onPlay",
    "props.table.onPause.name": "onPause",
    "props.table.onEnded.name": "onEnded",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

/** As quatro fontes, na ordem em que o conteúdo as lista. */
const SOURCE_KEYS = ["video", "audio", "youtube", "vimeo"] as const;
type SourceKey = (typeof SOURCE_KEYS)[number];

/** Chaves da tabela de propriedades, na ordem do contrato. */
const PROP_KEYS = [
  "kind",
  "src",
  "stream",
  "embed",
  "tracks",
  "rates",
  "labels",
  "onPlay",
  "onPause",
  "onEnded",
];

/** Chaves da tabela de tokens, na ordem em que o conteúdo as declara. */
const TOKEN_KEYS = [
  "border",
  "background",
  "muted",
  "mutedForeground",
  "foreground",
  "primary",
  "accent",
  "ring",
  "spacing6",
];

/** Estados descritos pelo conteúdo compartilhado, na ordem em que ele os lista. */
const STATE_KEYS = ["idle", "playing", "ended", "refused", "unavailable"];

const INTERFACE_CODE = `// <MediaPlayer {...props} />
export type MediaPlayerProps = {
  kind?: "video" | "audio";
  src?: string;
  stream?: MediaStream;
  embed?: { provider: "youtube" | "vimeo"; videoId: string; hash?: string };
  tracks?: MediaPlayerTrack[];
  rates?: number[];
  labels: MediaPlayerLabels;
  onPlay?: () => void;
  onPause?: (info: { ended: boolean; currentTime: number }) => void;
  onEnded?: () => void;
  className?: string;
  ref?: React.Ref<MediaPlayerHandle>;
};`;

/** Chamada mostrada no card de cada fonte. */
function sourceSnippet(key: SourceKey): string {
  const attrs: Record<SourceKey, string[]> = {
    video: ['  kind="video"', '  src="/videos/tour.mp4"', "  tracks={tracks}"],
    audio: ['  kind="audio"', '  src="/audios/episodio.mp3"'],
    youtube: ['  embed={{ provider: "youtube", videoId: "aqz-KE-bpKQ" }}'],
    vimeo: ['  embed={{ provider: "vimeo", videoId: "76979871" }}'],
  };
  return ["<MediaPlayer", ...attrs[key], "  labels={labels}", "/>"].join("\n");
}

/**
 * O WAV das demonstrações desta página, resolvido uma vez.
 *
 * Toda mídia daqui é construída em MEMÓRIA: nada é baixado, nada depende de
 * rede. Os dois provedores são a única exceção, e é o que a fonte É.
 */
const AUDIO_SOURCE = silentWav(0.6);

/**
 * O player de uma fonte, com os rótulos no idioma da página.
 *
 * Cada fonte monta um MOTOR diferente, e motor não se troca em voo: um `<video>`
 * não vira `<iframe>`. Por isso são três ramos, e não um componente com props
 * variáveis — e por isso quem troca de fonte na demonstração remonta o player,
 * o que faz a limpeza parar a mídia anterior e soltar as trilhas do canvas.
 */
function SourcePlayer({ source, labels }: { source: SourceKey; labels: MediaPlayerLabels }) {
  if (source === "video") {
    // `rates={[]}` porque a fonte é stream ao vivo, e nela a velocidade de
    // reprodução é ignorada — medido. Oferecer o seletor seria dar um controle
    // que a pessoa mexe e não acontece nada. É o padrão do `CanvasVideoPlayer`.
    return <CanvasVideoPlayer labels={labels} className="nds-w-full" />;
  }
  if (source === "audio") {
    return (
      <MediaPlayer kind="audio" src={AUDIO_SOURCE} labels={labels} className="nds-w-full" />
    );
  }
  return (
    <MediaPlayer
      embed={{
        provider: source,
        videoId: source === "youtube" ? YOUTUBE_VIDEO_ID : VIMEO_VIDEO_ID,
      }}
      labels={labels}
      className="nds-w-full"
    />
  );
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
function CountingPlayer({
  listenTo,
  labels,
  countLabel,
  outsideLabel,
}: {
  listenTo: "engine" | "click";
  labels: MediaPlayerLabels;
  countLabel: string;
  outsideLabel: string;
}) {
  const [plays, setPlays] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<MediaPlayerHandle>(null);

  // O contador errado: escuta o CLIQUE no botão da barra, e por isso não vê
  // nada do que não passa por ele. O ouvinte é preso ao próprio botão, e não a
  // um `onClick` do React na moldura — é o mesmo caminho de quem instrumenta
  // por fora, que é justamente o antipadrão que o par mostra.
  useEffect(() => {
    if (listenTo !== "click") return;
    const button = wrapperRef.current?.querySelector(
      '[data-slot="media-player-controls"] button',
    );
    if (!button) return;
    const bump = () => setPlays((current) => current + 1);
    button.addEventListener("click", bump);
    return () => button.removeEventListener("click", bump);
  }, [listenTo]);

  const playFromOutside = useCallback(() => {
    const media = handleRef.current?.media;
    if (!media) return;
    media.muted = true;
    media.currentTime = 0;
    void media.play().catch(() => undefined);
  }, []);

  return (
    <div className="nds-stack nds-w-full" data-spacing="sm" ref={wrapperRef}>
      <MediaPlayer
        ref={handleRef}
        kind="audio"
        src={AUDIO_SOURCE}
        labels={labels}
        className="nds-w-full"
        onPlay={listenTo === "engine" ? () => setPlays((current) => current + 1) : undefined}
      />
      <p className="nds-text-body nds-text-muted-foreground">{`${countLabel}: ${plays}`}</p>
      <Button type="button" variant="outline" size="sm" onClick={playFromOutside}>
        {outsideLabel}
      </Button>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

const getNavGroups = (t: (key: string) => string) => [
  {
    label: t("nav.overview"),
    sections: [
      { id: "demonstracao", label: t("nav.demonstration") },
      { id: "anatomia",     label: t("nav.anatomy") },
      { id: "quando-usar",  label: t("nav.usage") },
      { id: "do-dont",      label: t("nav.doDont") },
    ],
  },
  {
    label: t("nav.techRef"),
    sections: [
      { id: "importacao",   label: t("nav.import") },
      { id: "variantes",    label: t("nav.variants") },
      { id: "estados",      label: t("nav.states") },
      { id: "propriedades", label: t("nav.props") },
      { id: "tokens",       label: t("nav.tokens") },
    ],
  },
  {
    label: t("nav.context"),
    sections: [
      { id: "acessibilidade", label: t("nav.accessibility") },
      { id: "relacionados",   label: t("nav.related") },
      { id: "notas",          label: t("nav.notes") },
    ],
  },
  {
    label: t("nav.quality"),
    sections: [
      { id: "analytics", label: t("nav.analytics") },
      { id: "testes",    label: t("nav.testes") },
    ],
  },
];

// ─── Componente principal ─────────────────────────────────────────────────────

export function MediaPlayerDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(mediaPlayerTranslations, PROP_OVERRIDES);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups],
  );

  const breadcrumb = useMemo(
    () => [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/display" },
      { name: tContent("title") },
    ],
    [tContent],
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "media-player",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    breadcrumb,
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "media-player",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "media-player",
        locale,
      });
    },
    [locale],
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  /**
   * Os doze rótulos da barra, do conteúdo compartilhado, no idioma da página.
   *
   * Toda instância desta página passa por aqui: são vários players na mesma
   * página (demonstração, dois pares de Do & Don't, quatro cards de fonte), e
   * cada um precisa dos doze para montar a barra. Eles saem do conteúdo, e não
   * de uma constante em pt-BR: o rótulo é o NOME ACESSÍVEL de um controle só de
   * ícone, e uma barra em português numa página em espanhol é ilegível para
   * quem ouve.
   */
  const barLabels = useMediaPlayerLabels();

  // ─── Estado da demonstração ───────────────────────────────────────────────
  //
  // Trocar de fonte REMONTA o player, e aqui isso é correto: a fonte decide o
  // motor, e motor não se troca em voo. O `key` é o que garante a remontagem
  // entre os dois provedores, que compartilham o mesmo componente — e a
  // remontagem é o que faz a limpeza parar a mídia anterior, soltar as trilhas
  // do stream e apagar os ouvintes de `document` e de `window`.
  const [demoSource, setDemoSource] = useState<SourceKey>("video");

  /** Um controle da demonstração. O evento sai do próprio botão. */
  const demoControl = (key: SourceKey, label: string) => (
    <Button
      key={key}
      type="button"
      variant="outline"
      size="sm"
      aria-pressed={demoSource === key}
      // O observer resolve por `.closest('[data-track]')`, e sem a marca aqui
      // ele subiria até o container e dispararia um SEGUNDO evento com o rótulo
      // traduzido. A terceira parte do id estruturado vira `element_id`.
      data-track="demo"
      data-track-id={`media-player:demonstracao:${key}`}
      data-track-label={label}
      onClick={() => setDemoSource(key)}
    >
      {label}
    </Button>
  );

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="media-player"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
        />
      }
    >
      {/* ── Demonstração ────────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")} componentSlug="media-player">
        <div className="nds-stack nds-w-full" data-spacing="md">
          <div
            className="nds-cluster"
            data-spacing="sm"
            role="group"
            aria-label={tContent("demonstration.title")}
          >
            {SOURCE_KEYS.map((key) =>
              demoControl(key, tContent(`demonstration.labels.${key}`)),
            )}
          </div>
          <div className="nds-w-full">
            <SourcePlayer key={demoSource} source={demoSource} labels={barLabels} />
          </div>
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ────────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={[1, 2, 3, 4, 5, 6, 7].map((i) => tContent(`anatomy.item${i}`))}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

      {/* ── Quando Usar ─────────────────────────────────────────────── */}
      <DocsWhenToUse
        title={tContent("usage.title")}
        guidelines={{
          title: tContent("usage.guidelines.title"),
          items: [1, 2, 3, 4, 5].map((i) => tContent(`usage.guidelines.item${i}`)),
        }}
        scenarios={{
          title: tContent("usage.scenarios.title"),
          cols: {
            scenario: tContent("usage.scenarios.cols.scenario"),
            use: tContent("usage.scenarios.cols.use"),
            alternative: tContent("usage.scenarios.cols.alternative"),
          },
          items: [1, 2, 3, 4, 5].map((i) => ({
            s: tContent(`usage.scenarios.item${i}.s`),
            u: tContent(`usage.scenarios.item${i}.u`),
            a: tContent(`usage.scenarios.item${i}.a`),
          })),
        }}
        do={{
          title: tNav("common.do"),
          items: [1, 2, 3, 4].map((i) => tContent(`usage.do.item${i}`)),
        }}
        dont={{
          title: tNav("common.dont"),
          items: [1, 2, 3, 4].map((i) => tContent(`usage.dont.item${i}`)),
        }}
      />

      {/* ── Do & Don't ──────────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
            // Os dois players são idênticos; muda só QUEM o contador escuta.
            // O botão "Tocar por fora" é o caminho que não passa pela barra —
            // como uma tecla de mídia ou o controle do sistema — e é ali que os
            // dois números deixam de bater.
            doPreview: (
              <CountingPlayer
                listenTo="engine"
                labels={barLabels}
                countLabel={tContent("doDont.countLabel")}
                outsideLabel={tContent("doDont.outsideLabel")}
              />
            ),
            dontPreview: (
              <CountingPlayer
                listenTo="click"
                labels={barLabels}
                countLabel={tContent("doDont.countLabel")}
                outsideLabel={tContent("doDont.outsideLabel")}
              />
            ),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
            // O mesmo vídeo, e a única diferença é a faixa declarada.
            doPreview: <CanvasVideoPlayer labels={barLabels} className="nds-w-full" />,
            dontPreview: (
              <CanvasVideoPlayer tracks={[]} labels={barLabels} className="nds-w-full" />
            ),
          },
        ]}
      />

      {/* ── Importação ──────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        componentSlug="media-player"
        description={tContent("import.basic")}
        code={tContent("import.basicCode")}
        secondaryDescription={tContent("import.withProvider")}
        secondaryCode={tContent("import.withProviderCode")}
      />

      {/* ── Variantes ───────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        note={tContent("variants.note")}
        componentSlug="media-player"
        items={SOURCE_KEYS.map((key) => ({
          // O `name` é a chave ESTÁVEL, não traduzida: é ela que vira
          // `snippet_id` do `docs_code_copy`, e um nome traduzido partiria o
          // mesmo evento em três no GA4.
          name: tContent(`variants.items.${key}.name`),
          trackId: key,
          description: tContent(`variants.items.${key}.description`),
          code: sourceSnippet(key),
          preview: <SourcePlayer source={key} labels={barLabels} />,
        }))}
      />

      {/* ── Estados ─────────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: tContent("states.cols.trigger"),
          behavior: tContent("states.cols.behavior"),
        }}
        items={STATE_KEYS.map((key) => ({
          label: tContent(`states.${key}.label`),
          trigger: tContent(`states.${key}.trigger`),
          behavior: toPlainText(tContent(`states.${key}.behavior`)),
        }))}
      />

      {/* ── Propriedades ────────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: PROP_KEYS.map((key) => ({
              name: tContent(`props.table.${key}.name`),
              type: tContent(`props.table.${key}.type`),
              defaultValue: tContent(`props.table.${key}.default`),
              required: tContent(`props.table.${key}.required`),
              description: toPlainText(tContent(`props.table.${key}.description`)),
            })),
          },
        ]}
        interfaceCode={INTERFACE_CODE}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibility")}
        extensibilityCode={tContent("props.extensibilityCode")}
      />

      {/* ── Tokens ──────────────────────────────────────────────────── */}
      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.value"),
          description: tContent("tokens.table.description"),
        }}
        items={TOKEN_KEYS.map((key) => ({
          token: tContent(`tokens.table.${key}.token`),
          value: tContent(`tokens.table.${key}.value`),
          description: tContent(`tokens.table.${key}.description`),
        }))}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
      />

      {/* ── Acessibilidade ──────────────────────────────────────────── */}
      <DocsAccessibility
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[1, 2, 3, 4, 5, 6, 7, 8].map((i) => tContent(`accessibility.item${i}`))}
        keyboardTitle={tContent("accessibility.keyboardTitle")}
        keyboardItems={["tab", "space", "arrows", "homeEnd", "escape"].map((key) => ({
          key: tContent(`accessibility.keyboard.${key}.key`),
          description: tContent(`accessibility.keyboard.${key}.action`),
        }))}
      />

      {/* ── Relacionados ────────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="media-player"
        items={[
          {
            name: "AspectRatio",
            description: toPlainText(tContent("related.aspectRatio")),
            path: "?path=/docs/ui-aspectratio--docs",
          },
          {
            name: "Sonner",
            description: toPlainText(tContent("related.sonner")),
            path: "?path=/docs/ui-sonner--docs",
          },
          {
            name: "Button",
            description: toPlainText(tContent("related.button")),
            path: "?path=/docs/ui-button--docs",
          },
          {
            name: "Card",
            description: toPlainText(tContent("related.card")),
            path: "?path=/docs/ui-card--docs",
          },
        ]}
      />

      {/* ── Notas ───────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="media-player"
        items={[1, 2, 3, 4, 5, 6].map((i) => ({
          title: "",
          content: tContent(`notes.tip${i}`),
        }))}
      />

      {/* ── Analytics ───────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={["pageView", "sectionViewed", "demoClick"].map((key) => ({
          event: tContent(`analytics.table.${key}`),
          trigger: toPlainText(tContent(`analytics.table.${key}Trigger`)),
          payload: tContent(`analytics.table.${key}Payload`),
        }))}
      />

      {/* ── Testes ──────────────────────────────────────────────────── */}
      {/* As três sub-seções do conteúdo usam a MESMA forma
          (`action`/`result`/`priority`). Os containers de acessibilidade e de
          visual foram desenhados para outra: aqui cada campo entra no lugar que
          o preserva, sem descartar texto. */}
      <DocsTestes
        title={tContent("testes.title")}
        functional={{
          title: tContent("testes.functional.title"),
          description: tContent("testes.functional.description"),
          cols: {
            action: tNav("common.userAction"),
            result: tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
            action: toPlainText(tContent(`testes.functional.item${i}.action`)),
            result: toPlainText(tContent(`testes.functional.item${i}.result`)),
            priority: tNav(
              priorityKeyMap[tContent(`testes.functional.item${i}.priority`)] ?? "common.high",
            ),
          })),
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          description: tContent("testes.accessibility.description"),
          cols: {
            criterion: tNav("common.userAction"),
            level: tNav("common.priority"),
            how: tNav("common.expectedResult"),
          },
          items: [1, 2, 3, 4, 5].map((i) => ({
            criterion: toPlainText(tContent(`testes.accessibility.item${i}.action`)),
            level: tNav(
              priorityKeyMap[tContent(`testes.accessibility.item${i}.priority`)] ?? "common.high",
            ),
            how: toPlainText(tContent(`testes.accessibility.item${i}.result`)),
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          description: tContent("testes.visual.description"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [1, 2].map((i) => ({
            story: `${toPlainText(tContent(`testes.visual.item${i}.action`))} — ${toPlainText(
              tContent(`testes.visual.item${i}.result`),
            )}`,
            priority: tNav(
              priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ?? "common.high",
            ),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
