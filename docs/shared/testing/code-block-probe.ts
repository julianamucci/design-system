/**
 * Sonda de comparação do CodeBlock entre as cinco stacks.
 *
 * O bloco de código parece o componente mais inerte do catálogo — pinta texto e
 * tem um botão. É justamente por isso que ele acumula o que nenhuma suíte olha:
 * a marcação semântica (`<pre>`/`<code>`/`lang`), quem é o DONO do eixo que
 * rola, o que o botão de copiar ANUNCIA depois de copiar, e se a paleta de
 * sintaxe alcança 4.5:1 nos dois modos — que é o critério documentado e que
 * nenhuma play verificava por aritmética.
 *
 * A sonda procura os elementos pelo contrato `.nds-*`. Onde o contrato não é
 * cumprido o campo vem `null` — e isso É o achado, não falha da medição.
 *
 * Armadilhas já tropeçadas e evitadas aqui:
 *
 *   - `console.log` não chega ao terminal (o addon instrumenta o console dentro
 *     da play). O canal é a exceção — ver `reportProbe`.
 *   - atributo de presença casa valor `"false"`: `[data-highlighted]` casaria
 *     `data-highlighted="false"`. Todo seletor de estado aqui usa
 *     `[attr]:not([attr="false"])`.
 *   - fundo com alfa mente. `--code-block-highlight-bg` é `hsl(var(--primary) /
 *     0.12)` de propósito, então medir a linha destacada exige compor sobre o
 *     ancestral opaco — o que `ratio`/`backgroundEffective` de `cor.ts` já fazem.
 *   - a classe `.dark` posta e não removida envenena a story seguinte e a foto
 *     do Chromatic. `byTheme` restaura no `finally`.
 *
 * Nenhuma função afirma nada: todas devolvem dado. A asserção é da story.
 */

import { MODOS, TEMAS, backgroundEffective, byTheme, ratio } from './cor';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TokenMeasurement {
  /** Nome do `data-token` medido. */
  token: string;
  cor: string;
  /** Razão WCAG contra o fundo da superfície do bloco. */
  contraSuperficie: number | null;
  /** Razão WCAG contra a linha em destaque, o segundo fundo possível. */
  contraDestaque: number | null;
}

export interface PaletteMeasurement {
  tema: string;
  modo: string;
  backgroundSuperficie: string | null;
  backgroundHighlight: string | null;
  tokens: TokenMeasurement[];
  /** Menor razão da paleta inteira nesta combinação de tema e modo. */
  pior: { token: string; ratio: number; fundo: 'superficie' | 'destaque' } | null;
}

// ─── Dados fixos ──────────────────────────────────────────────────────────────

/**
 * Trechos que, juntos, acendem os ONZE tokens da paleta.
 *
 * Vivem aqui, e não em cada story, por dois motivos: a medição das cinco stacks
 * só é comparável sobre os MESMOS dados, e nenhum trecho isolado exercita a
 * paleta inteira — o primeiro corte da sonda mediu cinco cores e deixou seis
 * (`number`, `tag`, `attr`, `property`, `function`, `builtin`) sem nunca terem
 * sido medidas contra fundo nenhum.
 */
export const TRECHOS_DA_PALETA: ReadonlyArray<{ language: string; code: string }> = [
  {
    language: 'ts',
    code: 'const total = Math.max(items.length, 10); // soma\nrender(items, total);',
  },
  { language: 'html', code: '<button class="nds-button" disabled>Salvar</button>' },
  { language: 'css', code: '@media (min-width: 40rem) { .nds-card { --gap: 8px; } }' },
  { language: 'json', code: '{ "port": 6006, "open": true, "nome": "docs" }' },
  { language: 'bash', code: 'npm run build -- --mode production # publica' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const texto = (el: Element | null | undefined): string | null =>
  el?.textContent?.replace(/\s+/g, ' ').trim() || null;

const classes = (el: Element | null | undefined): string[] =>
  (el?.getAttribute('class') || '').split(/\s+/).filter(Boolean);

/**
 * Nome acessível de um controle sem texto visível.
 *
 * O botão de copiar é um ícone: se `aria-label` sumir, ele passa a ser anunciado
 * como "botão" e nada mais — e nenhuma asserção de classe pegaria isso.
 */
function nomeAcessivel(el: Element | null | undefined): string | null {
  if (!el) return null;
  const labelled = el.getAttribute('aria-labelledby');
  if (labelled) {
    const alvo = el.ownerDocument.getElementById(labelled.split(/\s+/)[0]);
    if (alvo?.textContent?.trim()) return alvo.textContent.trim();
  }
  const rotulo = el.getAttribute('aria-label');
  if (rotulo?.trim()) return rotulo.trim();
  return texto(el);
}

/** Ancestrais de `el` (inclusive) até `limite` que rolam de fato. */
function donosDeEixo(el: Element | null, limite: Element): Array<{
  seletor: string;
  overflowX: string;
  overflowY: string;
  rolaHorizontal: boolean;
  rolaVertical: boolean;
  tabIndex: number | null;
}> {
  const saida: ReturnType<typeof donosDeEixo> = [];
  let atual: Element | null = el;
  while (atual) {
    const cs = getComputedStyle(atual);
    const scrollable = /(auto|scroll)/.test(cs.overflowX) || /(auto|scroll)/.test(cs.overflowY);
    if (scrollable) {
      const html = atual as HTMLElement;
      saida.push({
        seletor: `${atual.tagName.toLowerCase()}${classes(atual).map((c) => `.${c}`).join('')}`,
        overflowX: cs.overflowX,
        overflowY: cs.overflowY,
        rolaHorizontal: atual.scrollWidth > atual.clientWidth + 1,
        rolaVertical: atual.scrollHeight > atual.clientHeight + 1,
        tabIndex: html.hasAttribute('tabindex') ? html.tabIndex : null,
      });
    }
    if (atual === limite) break;
    atual = atual.parentElement;
  }
  return saida;
}

// ─── Medição de estrutura, semântica e comportamento ──────────────────────────

/** Mede UM bloco. `raiz` é o wrapper do cenário. */
export function measureCodeBlock(raiz: HTMLElement) {
  const root = raiz.querySelector<HTMLElement>('[data-slot="code-block"]');
  if (!root) return { presente: false } as const;

  const header = root.querySelector<HTMLElement>('.nds-code-block-header');
  const titulo = root.querySelector<HTMLElement>('.nds-code-block-title');
  const botao = root.querySelector<HTMLElement>('[data-slot="code-block-copy"]');
  const status = root.querySelector<HTMLElement>('[role="status"]');
  const scroll = root.querySelector<HTMLElement>('.nds-code-block-scroll');
  const pre = root.querySelector<HTMLElement>('pre');
  const code = root.querySelector<HTMLElement>('code');
  const linhas = [...root.querySelectorAll<HTMLElement>('.nds-code-block-line')];
  const gutters = [...root.querySelectorAll<HTMLElement>('.nds-code-block-gutter')];
  const textos = [...root.querySelectorAll<HTMLElement>('.nds-code-block-text')];
  const rodape = root.querySelector<HTMLElement>('.nds-code-block-footer');

  const csRoot = getComputedStyle(root);
  const csScroll = scroll ? getComputedStyle(scroll) : null;
  const csText = textos[0] ? getComputedStyle(textos[0]) : null;
  const csGutter = gutters[0] ? getComputedStyle(gutters[0]) : null;

  // `:not([data-token="plain"])` — `plain` não vira elemento, mas o seletor
  // defensivo também impede que um atributo de presença com valor falso conte.
  const tokens = [...root.querySelectorAll<HTMLElement>('[data-token]:not([data-token="plain"])')];
  const tokenNames = [...new Set(tokens.map((t) => t.dataset.token!))].sort();
  const tokenColors = [...new Set(tokens.map((t) => getComputedStyle(t).color))];

  const destacadas = [...root.querySelectorAll<HTMLElement>(
    '.nds-code-block-line[data-highlighted]:not([data-highlighted="false"])',
  )];

  return {
    presente: true,
    estrutura: {
      tagDaRaiz: root.tagName.toLowerCase(),
      classesDaRaiz: classes(root),
      /** Classe sem o prefixo do design system: inerte, não pinta nada. */
      classesInertes: classes(root).filter((c) => !c.startsWith('nds-')),
      dataNumbered: root.getAttribute('data-numbered'),
      /** Vanilla e Angular registram a linguagem na raiz; medir se as outras registram. */
      dataLanguage: root.getAttribute('data-language'),
      temHeader: !!header,
      tituloVisivel: texto(titulo),
      temRodape: !!rodape,
      totalDeLinhas: linhas.length,
      totalDeGutters: gutters.length,
      linhasDestacadas: destacadas.map((el) => linhas.indexOf(el) + 1),
    },
    semantica: {
      /** `<pre>` + `<code>` é o par que o leitor de tela anuncia como pré-formatado. */
      tagDoBloco: pre?.tagName.toLowerCase() ?? null,
      tagDoCodigo: code?.tagName.toLowerCase() ?? null,
      /** `lang` no trecho: sem ele a voz em pt-BR pronuncia código como português. */
      langDoPre: pre?.getAttribute('lang') ?? null,
      langDoDocumento: root.ownerDocument.documentElement.getAttribute('lang'),
      nomeDoBotaoCopiar: nomeAcessivel(botao),
      tipoDoBotaoCopiar: botao?.getAttribute('type') ?? null,
      iconesOcultos: botao
        ? [...botao.querySelectorAll('svg')].map((s) => s.getAttribute('aria-hidden'))
        : null,
      statusExiste: !!status,
      statusAriaLive: status?.getAttribute('aria-live') ?? null,
      statusForaDoBotao: status && botao ? !botao.contains(status) : null,
      statusTexto: texto(status),
      gutterAriaHidden: gutters.map((g) => g.getAttribute('aria-hidden')),
      gutterNumeros: gutters.map((g) => g.textContent?.trim() ?? null),
    },
    rolagem: {
      /** Um eixo, um dono: mais de uma entrada aqui é contêiner aninhado rolando. */
      donos: scroll ? donosDeEixo(scroll, root) : [],
      tabIndexDoScroll: scroll?.hasAttribute('tabindex') ? scroll.tabIndex : null,
      /** Focável de fato, não só por atributo. */
      aceitaFocus: (() => {
        if (!scroll) return null;
        const anterior = scroll.ownerDocument.activeElement as HTMLElement | null;
        scroll.focus();
        const ok = scroll.ownerDocument.activeElement === scroll;
        scroll.blur();
        if (anterior && anterior !== scroll.ownerDocument.body) anterior.focus();
        return ok;
      })(),
      overflowX: csScroll?.overflowX ?? null,
      overflowY: csScroll?.overflowY ?? null,
      transbordaHorizontal: scroll ? scroll.scrollWidth > scroll.clientWidth + 1 : null,
      transbordaVertical: scroll ? scroll.scrollHeight > scroll.clientHeight + 1 : null,
      alturaMaxima: csScroll?.maxBlockSize || csScroll?.maxHeight || null,
      alturaVisivel: scroll ? Math.round(scroll.clientHeight) : null,
      alturaTotal: scroll ? scroll.scrollHeight : null,
      /** `pre` não quebra linha: é o que preserva a indentação do trecho. */
      quebraDeLinha: csText?.whiteSpace ?? null,
      gutterSticky: csGutter?.position ?? null,
      gutterSelecionavel: csGutter ? csGutter.userSelect !== 'none' : null,
    },
    sintaxe: {
      tokensClassificados: tokens.length,
      tokenNames,
      /** Quantas cores DISTINTAS a paleta realmente pinta neste trecho. */
      coresDistintas: tokenColors.length,
      cores: tokenColors,
      bodyColor: csRoot.color,
      fundoDaSuperficie: backgroundEffective(root),
      // Composto, não lido cru: `--code-block-highlight-bg` tem alfa de propósito
      // e `backgroundColor` devolveria uma cor que ninguém vê.
      fundoDoDestaque: destacadas[0]
        ? ratio(
            getComputedStyle(destacadas[0]).backgroundColor,
            backgroundEffective(root) ?? 'rgb(255,255,255)',
          )?.frente ?? null
        : null,
      /** Destaque não pode ser só cor: a barra de acento é o segundo indicador. */
      acentoDoDestaque: destacadas[0] ? getComputedStyle(destacadas[0]).boxShadow : null,
    },
  };
}

// ─── Contraste da paleta por tema e modo ──────────────────────────────────────

/**
 * Razão WCAG de CADA cor de sintaxe contra os DOIS fundos possíveis, nos três
 * temas e nos dois modos.
 *
 * O axe do test-runner mede só o que está na tela, e a tela está sempre no tema
 * claro — metade do produto nunca foi medida. E o fundo da linha em destaque é
 * semitransparente, então `backgroundColor` devolve uma cor que ninguém vê:
 * `ratio` compõe sobre o ancestral opaco antes de dividir.
 *
 * `raiz` recebe as classes de tema; a original volta no `finally` de `byTheme`.
 */
export function themeMeasurePalette(raiz: HTMLElement): PaletteMeasurement[] {
  return byTheme(raiz, (tema, modo): PaletteMeasurement => {
    // TODOS os blocos dentro da raiz, não só o primeiro: a paleta tem onze
    // tokens e nenhum trecho isolado os exercita. Medir um bloco só devolvia
    // cinco cores e deixava seis sem nunca terem sido medidas.
    const roots = [...raiz.querySelectorAll<HTMLElement>('[data-slot="code-block"]')];
    if (roots.length === 0) {
      return { tema, modo, backgroundSuperficie: null, backgroundHighlight: null, tokens: [], pior: null };
    }

    const backgroundSuperficie = backgroundEffective(roots[0]);
    const destacada = raiz.querySelector<HTMLElement>(
      '.nds-code-block-line[data-highlighted]:not([data-highlighted="false"])',
    );
    const backgroundHighlight = destacada
      ? ratio(getComputedStyle(destacada).backgroundColor, backgroundSuperficie ?? 'rgb(255,255,255)')
          ?.frente ?? null
      : null;

    // Uma amostra por NOME de token: cores iguais em spans diferentes são a
    // mesma medida, e medir todos os spans transformaria o relatório em ruído.
    const byName = new Map<string, HTMLElement>();
    for (const el of raiz.querySelectorAll<HTMLElement>(
      '[data-token]:not([data-token="plain"])',
    )) {
      if (!byName.has(el.dataset.token!)) byName.set(el.dataset.token!, el);
    }

    const tokens: TokenMeasurement[] = [...byName.entries()].map(([token, el]) => {
      const cor = getComputedStyle(el).color;
      return {
        token,
        cor,
        contraSuperficie: backgroundSuperficie ? ratio(cor, backgroundSuperficie)?.ratio ?? null : null,
        contraDestaque: backgroundHighlight ? ratio(cor, backgroundHighlight)?.ratio ?? null : null,
      };
    });

    let pior: PaletteMeasurement['pior'] = null;
    for (const t of tokens) {
      for (const [fundo, r] of [
        ['superficie', t.contraSuperficie],
        ['destaque', t.contraDestaque],
      ] as const) {
        if (r === null) continue;
        if (!pior || r < pior.ratio) pior = { token: t.token, ratio: r, fundo };
      }
    }

    return { tema, modo, backgroundSuperficie, backgroundHighlight, tokens, pior };
  });
}

/**
 * Menor razão da paleta em TODAS as combinações de tema e modo.
 *
 * É o número que a story assere: um único valor que reprova assim que qualquer
 * cor de qualquer tema cair abaixo do mínimo de texto de corpo.
 */
export function palettePiorContrast(
  raiz: HTMLElement,
  /** `claro` ou `escuro` recorta a varredura; omitido mede os dois. */
  apenasModo?: (typeof MODOS)[number],
): {
  ratio: number;
  token: string;
  tema: string;
  modo: string;
  fundo: string;
} | null {
  let pior: ReturnType<typeof palettePiorContrast> = null;
  for (const medida of themeMeasurePalette(raiz)) {
    if (apenasModo && medida.modo !== apenasModo) continue;
    if (!medida.pior) continue;
    if (!pior || medida.pior.ratio < pior.ratio) {
      pior = {
        ratio: medida.pior.ratio,
        token: medida.pior.token,
        tema: medida.tema,
        modo: medida.modo,
        fundo: medida.pior.fundo,
      };
    }
  }
  return pior;
}

/**
 * Mínimo WCAG do texto de código.
 *
 * 4.5 e não 3: cor de sintaxe pinta CORPO de texto, não ícone nem borda. O
 * limiar de 3:1 vale para texto grande (≥24px, ou ≥18.66px em negrito) e o bloco
 * roda a 13px — conferir isso é o que separa "reprova" de "passa".
 */
export const CONTRAST_MINIMUM = 4.5;

/**
 * Laudo de UMA linha, pronto para a asserção das cinco stacks.
 *
 * Devolve string em vez de número de propósito: a story assere
 * `toContain('abaixo de 4.5: false')`, e quando reprova a mensagem da falha já
 * traz o tema, o token, o fundo e a razão — sem isso o vermelho diria apenas
 * "4.31 não é >= 4.5" e alguém teria de refazer a medição na mão.
 */
export function contrastLaudo(
  raiz: HTMLElement,
  modo?: (typeof MODOS)[number],
  minimum: number = CONTRAST_MINIMUM,
): string {
  const pior = palettePiorContrast(raiz, modo);
  if (!pior) return `nenhum token classificado · abaixo de ${minimum}: true`;
  return (
    `${pior.tema}/${pior.modo} · ${pior.token} sobre ${pior.fundo} = ${pior.ratio}:1` +
    ` · abaixo de ${minimum}: ${pior.ratio < minimum}`
  );
}

/** Linha legível de uma combinação — o que a falha da story precisa mostrar. */
export function describePalette(m: PaletteMeasurement): string {
  if (!m.pior) return `${m.tema}/${m.modo}: nenhum token classificado`;
  return `${m.tema}/${m.modo} · pior ${m.pior.token} sobre ${m.pior.fundo} = ${m.pior.ratio}:1`;
}

// ─── Copiar ───────────────────────────────────────────────────────────────────

/**
 * Substitui `navigator.clipboard.writeText` enquanto `run` roda.
 *
 * O clipboard real não funciona no browser de teste: a Clipboard API rejeita por
 * permissão e o fallback via `execCommand` exige user activation, que evento
 * sintético não tem. Sem o stub, `copyText` devolve `false` e o componente —
 * corretamente — não confirma nada, e o teste mediria o browser em vez do
 * componente. Nada aqui LÊ a área de transferência: o que se observa é o texto
 * que o componente ENTREGA à API, e o feedback que ele mostra depois.
 */
export async function withClipboardSpy<T>(
  spy: (texto: string) => Promise<unknown>,
  run: () => Promise<T>,
): Promise<T> {
  const original = navigator.clipboard;
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: spy },
    configurable: true,
  });
  try {
    return await run();
  } finally {
    Object.defineProperty(navigator, 'clipboard', { value: original, configurable: true });
  }
}

/** O que o bloco mostra e anuncia depois da cópia — medido, não presumido. */
export function measureConfirm(raiz: HTMLElement) {
  const root = raiz.querySelector<HTMLElement>('[data-slot="code-block"]');
  const botao = root?.querySelector<HTMLElement>('[data-slot="code-block-copy"]');
  const status = root?.querySelector<HTMLElement>('[role="status"]');
  const rotulo = root?.querySelector<HTMLElement>('.nds-code-block-copy-label');
  return {
    nomeDoBotao: nomeAcessivel(botao),
    quantosIcones: botao ? botao.querySelectorAll('svg').length : null,
    anuncio: texto(status),
    labelVisible: rotulo && !rotulo.hidden ? texto(rotulo) : null,
  };
}

// ─── Saída ────────────────────────────────────────────────────────────────────

/**
 * Emite o registro para fora do navegador.
 *
 * Via exceção, e não `console.log`: o addon do Storybook instrumenta o console
 * dentro da play e nada do que se escreve ali chega ao terminal do vitest.
 */
export function reportProbe(stack: string, cenario: string, dados: unknown): never {
  throw new Error(`SONDA::${stack}::${cenario}::${JSON.stringify(dados)}`);
}

export { MODOS, TEMAS };
