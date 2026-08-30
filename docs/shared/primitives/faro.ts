/**
 * Observabilidade de front-end (Grafana Faro): a POLÍTICA, uma vez só.
 *
 * ── Por que o SDK entra por parâmetro ────────────────────────────────────────
 * Este arquivo vive em `docs/shared`, fora de qualquer stack, e o Node resolve
 * pacote a partir do caminho do próprio arquivo — sobe até a raiz do repo e não
 * acha `@grafana/faro-web-sdk`, que está no `node_modules` de cada stack.
 * Importar aqui quebra o build (medido: "Rolldown failed to resolve import").
 *
 * Então quem importa é o `preview.ts` de cada stack, e passa as peças para cá.
 * O que fica compartilhado é o que importa não divergir: filtros de ruído, nome
 * do app, leitura da variável de ambiente e o no-op quando ela falta. Mesmo
 * padrão do `sidebar-i18n`, que recebe o React do manager.
 *
 * ── Onde ele monta, e por quê ────────────────────────────────────────────────
 * No PREVIEW, não no manager — o inverso do GA4, e de propósito.
 *
 * O GA4 vive no manager porque mede page_view, e o iframe tem `pathname`
 * invariante: 863 de 863 pageviews caíram em `/iframe.html` quando ele rodava
 * lá. O Faro mede erro de JavaScript, Web Vitals e requisição — tudo onde o
 * componente renderiza, que é o iframe. Erro no manager é do Storybook, não do
 * design system.
 *
 * Trocar de story não recarrega o iframe, então a URL congela na primeira. Por
 * isso `marcarStory()`, chamada no `storyRendered`: sem ela todo dado ficaria
 * atribuído à primeira story aberta.
 *
 * ── A URL do coletor ─────────────────────────────────────────────────────────
 * Vem de `STORYBOOK_FARO_URL`. A documentação do Faro diz que a URL do coletor
 * não é segredo — ela é client-side e aparece em qualquer DevTools — e isso é
 * verdade. Mas este repositório é público e a casa já trata o Measurement ID do
 * GA4 e o token do Chromatic assim; consistência vale mais que a exceção.
 *
 * Sem a variável, tudo aqui é no-op silencioso: quem clona o repositório não
 * passa a mandar dado para a conta de outra pessoa.
 */

/** Ruído de navegador que não é defeito de ninguém. */
const ERRORS_IGNORADOS = [
  // Quirk de layout, não erro
  /^ResizeObserver loop limit exceeded$/,
  /^ResizeObserver loop completed with undelivered notifications$/,
  // Script cross-origin sem stack útil
  /^Script error\.$/,
  // Extensão do navegador de quem abriu a página
  /chrome-extension:\/\//,
  /moz-extension:\/\//,
];

/**
 * Rede que não é do produto. O GA4 deste projeto vive no manager e conversa com
 * o googletagmanager — sem isto, cada `page_view` viraria requisição rastreada.
 */
const URLS_IGNORADAS = [
  /googletagmanager\.com/,
  /analytics\.google\.com/,
  /www\.google-analytics\.com/,
];

type FaroMinimum = {
  api?: {
    setView?: (v: { name: string }) => void;
    startUserAction?: (
      name: string,
      attrs?: Record<string, string>,
      options?: { triggerName?: string },
    ) => unknown;
    getActiveUserAction?: () => unknown;
    pushEvent?: (name: string, attrs?: Record<string, string>) => void;
    pushError?: (error: Error, meta?: { context?: Record<string, string> }) => void;
  };
};

/**
 * Eventos do catálogo do GA4 que NÃO viram ação de usuário no Faro.
 *
 * O `track()` fala 51 eventos, e mandar todos para cá seria trocar
 * observabilidade por analytics de produto — com custo de ingestão e ruído.
 * Ficam de fora três famílias, cada uma por um motivo:
 *
 * - `page_view` e `docs_page_view`: o Faro já tem a dimensão de página por
 *   `marcarStory()`, e duplicar cria duas verdades sobre a mesma coisa.
 * - `docs_section_viewed`, `content_scroll`, `tooltip_view`: disparam por
 *   rolagem e hover, não por decisão de quem usa. Ação de usuário abre uma
 *   janela de atividade no Faro; abrir uma a cada scroll não mede nada.
 * - `field_focus` e `field_blur`: idem — foco é consequência, não ação.
 *
 * O resto passa: clique, troca, abertura, cópia. São ações deliberadas, e é
 * onde correlacionar com erro e latência tem valor — que é justamente o que o
 * GA4 não faz.
 */
const FARO_OUTSIDE = new Set([
  'page_view',
  'docs_page_view',
  'docs_section_viewed',
  'content_scroll',
  'tooltip_view',
  'field_focus',
  'field_blur',
]);

/**
 * Parâmetro de função é CONTRAVARIANTE: uma função que aceita
 * `Record<string, unknown>` NÃO é atribuível a partir do `initializeFaro` real,
 * que exige `BrowserConfig` com `app` obrigatório. Com o tipo estreito o vanilla
 * não compilava (`tsc` roda sobre o `.storybook/` lá) e as outras stacks só
 * passavam porque o valor chegava como `any`. Mesma armadilha já resolvida no
 * `sidebar-i18n`.
 */
export type FaroParts = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initializeFaro: (config: any) => FaroMinimum;
  getWebInstrumentations: () => unknown[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TracingInstrumentation: new (...args: any[]) => unknown;
};

export type OptionsFaro = {
  /** Nome da stack, para separar os dados: "nortear DS · react". */
  stack: string;
  /** `import.meta.env` de quem chama — só o preview enxerga as vars do Storybook. */
  env?: Record<string, string | undefined>;
  versao?: string;
};

let instancia: FaroMinimum | null = null;

/**
 * ── Por que o SDK entra TARDE, e o que segura a garantia enquanto ele não chega
 *
 * O import estático dos dois pacotes custava 62 KB gzip no chunk de ENTRADA do
 * preview — 18% de tudo que carrega antes de qualquer componente aparecer,
 * medido em par no mesmo commit (336.214 B → 273.965 B gz, vanilla, 2026-08-29).
 * O `faro-web-tracing` sozinho é 26,5 KB desses, e arrasta o OpenTelemetry.
 *
 * O motivo de estar no topo era legítimo e continua valendo: capturar erro
 * desde o carregamento. O que muda é COMO. Em vez de pagar o SDK inteiro para
 * ter um `window.onerror`, o preview instala o ouvinte na mão — síncrono, no
 * primeiro byte, sem dependência nenhuma — e guarda o que acontecer. Quando o
 * Faro sobe, o buffer é despejado nele. A janela em que um erro se perderia
 * deixou de existir.
 *
 * Os Web Vitals sobrevivem sozinhos, e isso foi VERIFICADO antes de mudar: o
 * `web-vitals` observa com `buffered: true` (um único `observe()` serve todas as
 * métricas), então LCP, FCP, CLS e INP anteriores à inicialização são
 * reproduzidos pelo próprio navegador; TTFB sai de `getEntriesByType`, que é
 * retroativo por natureza.
 *
 * O limite existe para o caso patológico — um laço que lança a cada quadro não
 * pode virar vazamento de memória enquanto o navegador está ocioso. Perder o
 * quinquagésimo erro do mesmo laço não custa diagnóstico nenhum.
 */
const LIMITE_BUFFER = 50;
const bufferErros: Array<{ error: Error; contexto: Record<string, string> }> = [];
let ouvintesInstalados = false;

function ehRuido(mensagem: string): boolean {
  return ERRORS_IGNORADOS.some((rx) => rx.test(mensagem));
}

function guardar(error: Error, origem: string): void {
  if (instancia) return; // o Faro já está de pé e captura sozinho
  if (bufferErros.length >= LIMITE_BUFFER) return;
  if (ehRuido(error.message)) return;
  bufferErros.push({ error, contexto: { origem, capturadoAntesDoFaro: 'true' } });
}

/**
 * Instala a captura síncrona de erro. Chame no TOPO do preview, antes de tudo.
 *
 * Não importa nada e não depende do Faro: sem `STORYBOOK_FARO_URL` o buffer
 * simplesmente nunca é despejado, e custa dois ouvintes e um array vazio.
 */
export function bufferarErros(): void {
  if (ouvintesInstalados || typeof window === 'undefined') return;
  ouvintesInstalados = true;

  window.addEventListener('error', (evento: ErrorEvent) => {
    const erro =
      evento.error instanceof Error ? evento.error : new Error(evento.message || 'Erro sem mensagem');
    guardar(erro, 'window.error');
  });

  window.addEventListener('unhandledrejection', (evento: PromiseRejectionEvent) => {
    const motivo = evento.reason;
    guardar(motivo instanceof Error ? motivo : new Error(String(motivo)), 'unhandledrejection');
  });
}

export function startFaro(
  { initializeFaro, getWebInstrumentations, TracingInstrumentation }: FaroParts,
  { stack, env, versao = '1.0.0' }: OptionsFaro,
): FaroMinimum | null {
  if (instancia) return instancia;
  if (typeof window === 'undefined') return null;

  const url = env?.STORYBOOK_FARO_URL;
  if (!url) return null;

  instancia = initializeFaro({
    url,
    app: {
      name: `nortear DS · ${stack}`,
      version: versao,
      environment: env?.MODE ?? 'production',
    },
    instrumentations: [
      // Obrigatório espalhar: sem isto as instrumentações padrão são descartadas.
      ...getWebInstrumentations(),
      // Ponta a ponta nas requisições HTTP.
      new TracingInstrumentation(),
    ],
    ignoreErrors: ERRORS_IGNORADOS,
    ignoreUrls: URLS_IGNORADAS,
    // Sem isto `startUserAction` não tem instrumentação por trás e a janela de
    // atividade nunca fecha. 100ms é o padrão do Faro.
    userActionsInstrumentation: { initialActivityTimeout: 100 },
  });

  // Despeja o que o buffer guardou enquanto o SDK vinha. `splice` esvazia: um
  // segundo `startFaro` (que já sai pela guarda de instância) não reenviaria.
  const pendentes = bufferErros.splice(0);
  for (const { error, contexto } of pendentes) {
    instancia.api?.pushError?.(error, { context: contexto });
  }

  return instancia;
}

/**
 * Carrega o SDK fora do caminho crítico e sobe o Faro.
 *
 * `carregar` é uma função por stack porque só o `preview.ts` resolve
 * `@grafana/faro-*` — `docs/shared` fica fora de qualquer stack e o Node sobe
 * até a raiz do repo sem achar o pacote (mesmo motivo já descrito no topo deste
 * arquivo). O que fica compartilhado é QUANDO carregar, que não deve divergir.
 *
 * A variável é conferida ANTES do import: quem clona o repositório sem
 * `STORYBOOK_FARO_URL` não paga nem o download do chunk, e não só o no-op.
 */
export function iniciarFaroQuandoOcioso(
  carregar: () => Promise<FaroParts>,
  options: OptionsFaro,
): void {
  if (typeof window === 'undefined') return;
  if (!options.env?.STORYBOOK_FARO_URL) return;

  const subir = () => {
    void carregar()
      .then((partes) => startFaro(partes, options))
      // Observabilidade que quebra a página é pior que observabilidade nenhuma.
      .catch(() => undefined);
  };

  // `requestIdleCallback` não existe no Safari < 16.4; o timeout garante que a
  // janela ociosa não adie para sempre numa aba que nunca fica parada.
  const ocioso = (window as Window & { requestIdleCallback?: typeof requestIdleCallback })
    .requestIdleCallback;
  if (ocioso) ocioso(subir, { timeout: 3000 });
  else window.setTimeout(subir, 1);
}

/** Marca a story em foco como a view atual. No-op se o Faro não subiu. */
export function marcarStory(id: string): void {
  instancia?.api?.setView?.({ name: id });
}

/**
 * Espelha um evento do `track()` como ação de usuário no Faro.
 *
 * A mesma chamada que já alimenta o GA4 passa a abrir uma janela de atividade
 * aqui: o que acontecer logo depois — requisição, erro, lentidão — fica
 * amarrado à ação que o disparou. É a leitura que o GA4 não dá.
 *
 * O payload é o MESMO do GA4, e isso não é economia: a regra do projeto já
 * obriga valor estável ali (slug, `variant`, `side`), nunca texto traduzido, e
 * o auditor cobra com `i18n_text_in_payload`. Herdamos o payload já saneado.
 *
 * `startUserAction` aceita só `Record<string, string>`, então número e booleano
 * são convertidos; `undefined` é descartado em vez de virar a string "undefined".
 */
export function registrarAction(evento: string, params?: Record<string, unknown>): void {
  if (FARO_OUTSIDE.has(evento)) return;
  const api = instancia?.api;
  if (!api?.startUserAction) return;

  const attrs: Record<string, string> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null) continue;
    attrs[key] = String(value);
  }

  // Só UMA ação pode estar ativa por vez: com outra rodando, `startUserAction`
  // devolve `undefined` e o Faro loga "Attempted to create a new user action
  // while one is already running". Medido no navegador — a primeira de cada
  // rajada vencia e as demais sumiam, chegando só no GA4.
  //
  // A janela da ação fica aberta enquanto houver atividade, então uma
  // interação que dispara dois eventos (o do observer e o do componente), ou
  // dois cliques seguidos, caem sempre nesse caso. Não é excepcional, é o
  // comum.
  //
  // Aqui o evento vira `pushEvent`, que é bufferizado pela ação corrente e sai
  // com o bloco `action` dela: continua chegando ao Grafana e correlacionado,
  // em vez de virar erro de console.
  if (api.getActiveUserAction?.()) {
    api.pushEvent?.(evento, attrs);
    return;
  }

  api.startUserAction(evento, attrs, { triggerName: 'analyticsTrack' });
}
