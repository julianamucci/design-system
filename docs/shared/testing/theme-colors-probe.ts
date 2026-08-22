/**
 * Sonda da página de fundamentos "Cores e Temas".
 *
 * A página inteira É uma tabela de tokens, e tabela de tokens foi o defeito que
 * apareceu em quase toda rodada desta revisão: token documentado que não existe
 * no CSS, e valor exibido que não é o valor pintado. Aqui os dois têm o mesmo
 * remédio — comparar o RÓTULO com a COR, os dois lidos do navegador.
 *
 * A comparação é fim a fim de propósito. `readToken()` da página lê o token do
 * `<html>` e escreve o texto; o chip pinta `hsl(var(--token))` por herança da
 * árvore. São dois caminhos independentes até a mesma cor: se o token não
 * existe, o rótulo vem vazio e o chip vem transparente; se a reatividade da
 * página falha ao trocar o tema, o rótulo congela no tema anterior e passa a
 * divergir do chip. Nenhuma das duas coisas tem teste hoje.
 *
 * Nenhuma função afirma nada: todas devolvem valor. A asserção é da story.
 */

import { compor, ratio, resolveColor, selectorsQueLeem, TEMAS, MODOS } from './cor';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SwatchMeasurement {
  tema: string;
  modo: string;
  /** Nome do token lido do próprio rótulo, sem o `--`. */
  token: string;
  /** Texto HSL exibido. `null` quando o swatch não mostra valor — o achado. */
  rotulo: string | null;
  /** Cor computada do chip. `null` quando nada foi pintado — o achado. */
  pintado: string | null;
  /** O que o rótulo exibido produz quando o navegador o resolve. */
  ofLabel: string | null;
  /** `false` quando exibido e pintado discordam. */
  bate: boolean;
}

export interface PairMeasurement {
  tema: string;
  modo: string;
  /** `primary` para o par `--primary` / `--primary-foreground`. */
  par: string;
  fundo: string | null;
  frente: string | null;
  /** `null` quando um dos dois tokens não existe — o achado. */
  ratio: number | null;
}

// ─── Troca de tema NO DOCUMENTO ───────────────────────────────────────────────

/**
 * Roda `fn` em cada tema e modo, com as classes no `<html>`.
 *
 * Tem de ser no `<html>`, e não num contêiner como faz `byTheme` de `cor.ts`: a
 * página lê os tokens com `getComputedStyle(document.documentElement)` e reage a
 * uma `MutationObserver` presa ao `<html>`. Marcar um contêiner pintaria os
 * chips (que herdam) e deixaria os rótulos parados — uma divergência inventada
 * pela medição, que é justamente o defeito que a sonda procura.
 *
 * `fn` é assíncrona porque o retorno da `MutationObserver` é um microtask: sem
 * ceder o turno, a leitura pega o texto do tema anterior.
 */
export async function documentByTheme<T>(
  doc: Document,
  fn: (tema: string, modo: string) => Promise<T>,
): Promise<T[]> {
  const html = doc.documentElement;
  const classNameOriginal = html.className;
  const base = classNameOriginal
    .split(/\s+/)
    .filter((c) => c && !c.startsWith('tema-') && c !== 'dark')
    .join(' ');
  const saida: T[] = [];
  try {
    for (const tema of TEMAS) {
      for (const modo of MODOS) {
        html.className = `${base} tema-${tema}${modo === 'escuro' ? ' dark' : ''}`.trim();
        void html.offsetHeight;
        // Dois turnos: um para a MutationObserver disparar, outro para o que
        // ela agendar (o Vue e o Angular reescrevem o texto numa segunda volta).
        await Promise.resolve();
        await new Promise((r) => setTimeout(r, 0));
        saida.push(await fn(tema, modo));
      }
    }
  } finally {
    html.className = classNameOriginal;
    void html.offsetHeight;
  }
  return saida;
}

// ─── Swatches ─────────────────────────────────────────────────────────────────

function texto(el: Element | null): string | null {
  const s = el?.textContent?.trim();
  return s ? s : null;
}

/** Mede todos os `.nds-swatch` da página, nos três temas e nos dois modos. */
export async function measureSwatches(raiz: HTMLElement): Promise<SwatchMeasurement[]> {
  const swatches = [...raiz.querySelectorAll<HTMLElement>('.nds-swatch')];

  return (
    await documentByTheme(raiz.ownerDocument, async (tema, modo) =>
      swatches.map((sw): SwatchMeasurement => {
        const nome = texto(sw.querySelector('.nds-swatch-token'))?.replace(/^--/, '') ?? '(sem nome)';
        const rotulo = texto(sw.querySelector('.nds-swatch-value'));
        const chip = sw.querySelector<HTMLElement>('.nds-swatch-color');
        const cru = chip ? getComputedStyle(chip).backgroundColor : null;
        // `rgba(0, 0, 0, 0)` é o que sobra quando `hsl(var(--x))` não resolve:
        // a declaração inteira é descartada e o chip fica sem pintura.
        const pintado = cru && cru !== 'rgba(0, 0, 0, 0)' ? cru : null;
        const ofLabel = rotulo ? resolveColor(raiz, `hsl(${rotulo})`) : null;
        return {
          tema, modo, token: nome, rotulo, pintado, ofLabel,
          bate: !!pintado && !!ofLabel && pintado === ofLabel,
        };
      }),
    )
  ).flat();
}

/** Linhas legíveis das medidas que reprovam. `[]` quando tudo casa. */
export function swatchFailures(medidas: SwatchMeasurement[]): string[] {
  return medidas
    .filter((m) => !m.bate)
    .map((m) => {
      if (!m.rotulo) return `${m.tema}/${m.modo} · --${m.token}: sem valor exibido`;
      if (!m.pintado) return `${m.tema}/${m.modo} · --${m.token}: chip sem cor (token inexistente)`;
      return `${m.tema}/${m.modo} · --${m.token}: exibido ${m.rotulo} (${m.ofLabel}) ≠ pintado ${m.pintado}`;
    });
}

// ─── Pares semânticos ─────────────────────────────────────────────────────────

/**
 * Pares `X` / `X-foreground` deduzidos da própria lista de tokens da página.
 *
 * Deduzidos, e não escritos à mão, para que par novo entre no portão sozinho e
 * par removido não deixe uma asserção apontando para o vazio. É a mesma escolha
 * de `degrausDeclarados` em `espacamento.ts`.
 */
export function pagePairs(raiz: HTMLElement): string[] {
  const tokens = new Set(
    [...raiz.querySelectorAll('.nds-swatch-token')]
      .map((el) => texto(el)?.replace(/^--/, ''))
      .filter((s): s is string => !!s),
  );
  return [...tokens]
    .filter((t) => t.endsWith('-foreground') && tokens.has(t.slice(0, -'-foreground'.length)))
    .map((t) => t.slice(0, -'-foreground'.length))
    .sort();
}

/**
 * Contraste de cada par nos três temas e nos dois modos.
 *
 * É a conta que `modes.subtitle` promete ao leitor — "mantendo contraste WCAG
 * 2.2 AA nos dois modos" — e que nada verificava: o axe do test-runner mede o
 * que está pintado na tela, e a página exibe amostras, não texto sobre cada
 * fundo. A promessa é sobre a PALETA, então quem responde é a paleta.
 */
export async function measurePairs(raiz: HTMLElement, pairs: string[]): Promise<PairMeasurement[]> {
  return (
    await documentByTheme(raiz.ownerDocument, async (tema, modo) =>
      pairs.map((par): PairMeasurement => {
        const fundo = resolveColor(raiz, `hsl(var(--${par}))`);
        const frente = resolveColor(raiz, `hsl(var(--${par}-foreground))`);
        const r = fundo && frente ? ratio(frente, fundo) : null;
        return { tema, modo, par, fundo, frente, ratio: r?.ratio ?? null };
      }),
    )
  ).flat();
}

export function pairFailures(medidas: PairMeasurement[], minimum: number): string[] {
  return medidas
    .filter((m) => m.ratio === null || m.ratio < minimum)
    .map((m) =>
      m.ratio === null
        ? `${m.tema}/${m.modo} · --${m.par}: token do par não resolve`
        : `${m.tema}/${m.modo} · --${m.par} / --${m.par}-foreground: ${m.ratio}:1 (mínimo ${minimum})`,
    );
}

// ─── Pares de FUNDO SUAVE ─────────────────────────────────────────────────────

/**
 * Alfas com que a cor semântica pinta FUNDO que carrega texto, nas folhas
 * `.nds-*`. Varridos todos porque o pior caso é o tom mais forte, e qual é o
 * mais forte muda com o modo.
 *
 *   0.08  folga: piso da varredura. Era o `.nds-docs-callout`, removido por não
 *         ter um único consumidor no repositório; o alfa fica porque o piso é
 *         barato de medir e cara de redescobrir.
 *   0.10  alert, toast, `.nds-bg-*-soft`, badge destructive (claro)
 *   0.12  badge warning/success/info (claro)
 *   0.15  pill, badge destructive (escuro)
 *   0.18  badge warning/success/info (escuro) — o mais forte em uso hoje
 *   0.25  folga: é o hover destrutivo do button no escuro, o teto da folha
 */
export const BACKGROUND_SMOOTH_ALFAS = [0.08, 0.1, 0.12, 0.15, 0.18, 0.25] as const;

export interface PairSmoothMeasurement {
  tema: string;
  modo: string;
  /** `destructive` para o par `--destructive` / `--destructive-foreground`. */
  par: string;
  alfa: number;
  /** Fundo suave JÁ COMPOSTO sobre `--background`. */
  fundo: string | null;
  frente: string | null;
  /** `null` quando um dos dois tokens não existe — o achado. */
  ratio: number | null;
}

/**
 * Contraste do par de feedback COMO A TELA O FORMA.
 *
 * `measurePairs` mede o par clássico — texto sobre a cor CHEIA — e nenhuma regra
 * do sistema escreve assim: a cor semântica pinta um fundo suave
 * (`hsl(var(--destructive) / 0.1)`) e o texto corrido por cima é
 * `--destructive-foreground`. Medir contra a cor cheia dá 3.09:1 no claro do
 * tema default e reprovaria um par que a tela nunca desenha. Contra o fundo
 * suave composto, as 144 combinações (4 pares × 6 alfas × 3 temas × 2 modos)
 * ficam entre 9:1 e 18.21:1 — o pior caso é warning no escuro do default a 0.25.
 *
 * O fundo é COMPOSTO sobre `--background` antes da divisão. Sem compor, a razão
 * sai de um rgba translúcido que ninguém vê — foi assim que a sonda do badge
 * devolveu ~1.0 em cinco variantes de seis.
 */
export async function measurePairsSuaves(
  raiz: HTMLElement,
  pairs: string[],
  alfas: readonly number[] = BACKGROUND_SMOOTH_ALFAS,
): Promise<PairSmoothMeasurement[]> {
  return (
    await documentByTheme(raiz.ownerDocument, async (tema, modo) => {
      const superficie = resolveColor(raiz, 'hsl(var(--background))');
      return pairs.flatMap((par) => {
        const frente = resolveColor(raiz, `hsl(var(--${par}-foreground))`);
        return alfas.map((alfa): PairSmoothMeasurement => {
          const tinta = resolveColor(raiz, `hsl(var(--${par}) / ${alfa})`);
          const fundo = tinta && superficie ? compor(tinta, superficie) : null;
          const r = fundo && frente ? ratio(frente, fundo) : null;
          return { tema, modo, par, alfa, fundo, frente, ratio: r?.ratio ?? null };
        });
      });
    })
  ).flat();
}

export function pairSmoothFailures(medidas: PairSmoothMeasurement[], minimum: number): string[] {
  return medidas
    .filter((m) => m.ratio === null || m.ratio < minimum)
    .map((m) =>
      m.ratio === null
        ? `${m.tema}/${m.modo} · --${m.par}-foreground sobre --${m.par}/${m.alfa}: token não resolve`
        : `${m.tema}/${m.modo} · --${m.par}-foreground (${m.frente}) sobre --${m.par}/${m.alfa} (${m.fundo}): ${m.ratio}:1 (mínimo ${minimum})`,
    );
}

/**
 * Pares cujo token de texto NENHUMA regra `.nds-*` lê.
 *
 * Token documentado sem consumidor foi o defeito que estes quatro pares
 * carregaram: a página prometia contraste de uma combinação que a tela não
 * formava, e nenhuma medida de cor pegava isso — cor que ninguém aplica passa em
 * qualquer limite. Aqui a pergunta é outra: alguma regra LÊ o token?
 */
export function pairsNoConsumidor(doc: Document, pairs: string[]): string[] {
  return pairs.filter((par) => selectorsQueLeem(doc, `${par}-foreground`).length === 0);
}

// ─── Canal de saída ───────────────────────────────────────────────────────────

export async function report(stack: string, raiz: HTMLElement): Promise<never> {
  const swatches = await measureSwatches(raiz);
  const pairs = pagePairs(raiz);
  const pairMeasurements = await measurePairs(raiz, pairs);
  const suaves = await measurePairsSuaves(raiz, pairs);
  throw new Error(
    `SONDA::${stack}::` +
      JSON.stringify({
        totalDeSwatches: swatches.length / (TEMAS.length * MODOS.length),
        pairs,
        semConsumidor: pairsNoConsumidor(raiz.ownerDocument, pairs),
        swatchFailures: swatchFailures(swatches),
        parLimite4_5: pairFailures(pairMeasurements, 4.5),
        parLimite3: pairFailures(pairMeasurements, 3),
        razoes: pairMeasurements.map((m) => `${m.tema}/${m.modo} ${m.par}=${m.ratio}`),
        suaveLimite4_5: pairSmoothFailures(suaves, 4.5),
        razoesSuaves: suaves.map((m) => `${m.tema}/${m.modo} ${m.par}@${m.alfa}=${m.ratio}`),
      }),
  );
}
