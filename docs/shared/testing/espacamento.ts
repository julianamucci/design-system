/**
 * Colhedor de ESPAÇAMENTO COMPUTADO — o que o navegador realmente aplica, em px,
 * sob cada densidade.
 *
 * Existe porque a escala de spacing tinha um buraco que nenhum teste podia ver.
 * `--spacing-3`, `--spacing-1-5`, `--spacing-2-5`, `--spacing-5`, `--spacing-7`,
 * `--spacing-18` e `--spacing-40` eram consumidos por 34 folhas `.nds-*` e não
 * existiam em `tokens.css` — sempre escritos como `var(--spacing-3, 0.75rem)`.
 * O CSS compila, o axe não vê, o TypeScript não vê, o Chromatic não vê (o valor
 * está CERTO na densidade padrão): o literal ganhava, e esses eram os únicos
 * valores do sistema que não respondiam a `.densidade-condensado` /
 * `.densidade-confortavel`.
 *
 * A armadilha específica que este módulo evita é a de ler o token em vez do
 * pixel. `getComputedStyle(el).getPropertyValue('--spacing-3')` devolve o TEXTO
 * declarado ("calc(var(--spacing-base) * 3)"), não o valor resolvido — e devolve
 * string vazia quando o token não existe, que é indistinguível de "existe e vale
 * zero". Por isso `pxResolve` mede uma sonda real: aplica a expressão em
 * `width` de um elemento e lê o px de volta. É a mesma diferença entre
 * `cor.ts` medir cor pintada e alguém conferir nome de token.
 *
 * Nenhuma função afirma nada: todas devolvem número. A asserção é da story.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export const DENSIDADES = ['condensado', 'default', 'confortavel'] as const;
export type Densidade = (typeof DENSIDADES)[number];

export interface EspacoTarget {
  /** Nome que aparece no relatório de falha. */
  nome: string;
  seletor: string;
  /** Propriedade longhand — `padding-inline-start`, não `padding-inline`. */
  prop: string;
  /**
   * px esperado por densidade. É a tabela do desenho escrita em código: a
   * coluna `default` prova que a correção NÃO mexeu no visual padrão, e as
   * outras duas provam que a densidade passou a alcançar o valor.
   */
  esperado: Record<Densidade, number>;
  /**
   * Alvo de toque (WCAG 2.5.8): o menor lado não pode cair de 24px em nenhuma
   * densidade. Só marque onde o elemento medido É a área clicável.
   */
  alvoDeToque?: boolean;
}

export interface EspacoMeasurement {
  alvo: string;
  prop: string;
  densidade: Densidade;
  /** `false` quando o seletor não casou — isso É o achado, não falha da medição. */
  presente: boolean;
  px: number | null;
  esperado: number;
}

export interface DegrauDaEscala {
  /** Nome completo do token, com `--`. */
  token: string;
  /** Multiplicador lido do sufixo: `--spacing-1-5` → 1.5. */
  multiplicador: number;
}

/** Tolerância de subpixel. O navegador arredonda a used value do layout. */
export const TOLERANCIA_PX = 0.06;

// ─── Sonda de resolução ───────────────────────────────────────────────────────

/**
 * Resolve uma expressão CSS de comprimento para px, dentro da árvore de `raiz`
 * (portanto sob a densidade que estiver aplicada nela).
 *
 * Devolve `null` quando a expressão não produz comprimento — que é o que
 * acontece com `var(--token-inexistente)`: a declaração inteira é descartada e a
 * sonda fica com a largura que já tinha. Por isso a sonda parte de uma largura
 * SENTINELA improvável: se o px de volta for ela, nada foi aplicado.
 */
const SENTINELA_PX = 3.7;

/**
 * `fator` amplia a expressão antes de medir e desfaz a conta depois.
 *
 * Existe porque o navegador guarda a used value do layout em 1/64 de px: uma
 * sonda de `0.20rem` volta como 3.1875px, não 3.2px. Sozinho o erro é
 * irrelevante, mas a base é MULTIPLICADA por até 96 na conferência da escala, e
 * aí 0.0125px viram 1.2px e reprovam um degrau correto. Medir 512× e dividir
 * empurra o arredondamento para a sexta casa.
 */
export function pxResolve(
  raiz: HTMLElement,
  expressao: string,
  fator = 1,
): number | null {
  const sonda = raiz.ownerDocument.createElement('div');
  sonda.setAttribute('aria-hidden', 'true');
  sonda.style.cssText =
    `position:absolute;top:0;left:0;visibility:hidden;pointer-events:none;` +
    `padding:0;border:0;min-width:0;max-width:none;box-sizing:content-box;` +
    `width:${SENTINELA_PX}px`;
  raiz.appendChild(sonda);
  try {
    sonda.style.setProperty('width', fator === 1 ? expressao : `calc((${expressao}) * ${fator})`);
    const bruto = raiz.ownerDocument.defaultView!.getComputedStyle(sonda).width;
    const px = parseFloat(bruto);
    if (!Number.isFinite(px)) return null;
    // Comparado ANTES de dividir: expressão inválida (token inexistente dentro
    // de calc) faz o navegador rejeitar a declaração inteira, e a sonda fica com
    // a largura sentinela — que é o sintoma a reportar, não um número a devolver.
    if (Math.abs(px - SENTINELA_PX) < 1e-6) return null;
    return px / fator;
  } finally {
    sonda.remove();
  }
}

/** Amplificação usada para ler a base sem erro de arredondamento acumulável. */
export const FATOR_DE_PRECISAO = 512;

// ─── Varredura por densidade ──────────────────────────────────────────────────

/**
 * Roda `fn` uma vez por densidade, trocando a classe no `<html>` e devolvendo-a
 * no fim.
 *
 * A classe TEM de ir no `<html>`, e não num contêiner da story — e a razão é a
 * regra de substituição de custom property, que custou uma rodada inteira de
 * medição errada aqui: `--spacing-3` vale `calc(var(--spacing-base) * 3)` e é
 * declarado em `:root`, então o `var(--spacing-base)` de dentro é substituído
 * NO `:root`. O que os descendentes herdam já é o valor computado (`0.75rem`),
 * não a expressão. Redeclarar `--spacing-base` num contêiner no meio da árvore
 * portanto não move nada da escala: só moveria quem lesse `--spacing-base`
 * diretamente.
 *
 * É por isso que `densities.css` documenta a classe como sendo do `<html>`, e é
 * a diferença para `byTheme` em `cor.ts`, que pode trabalhar num contêiner
 * porque os tokens de cor guardam valor literal (`0 0% 100%`), sem `var()`
 * dentro.
 *
 * A classe original volta no `finally`: densidade vazada envenena a story
 * seguinte, e a suíte compartilha o mesmo documento.
 */
export function byDensity<T>(
  raiz: HTMLElement,
  fn: (densidade: Densidade) => T,
): T[] {
  const html = raiz.ownerDocument.documentElement;
  const classNameOriginal = html.className;
  const noDensity = classNameOriginal
    .split(/\s+/)
    .filter((c) => c && !c.startsWith('densidade-'))
    .join(' ');
  const saida: T[] = [];
  try {
    for (const densidade of DENSIDADES) {
      html.className = `${noDensity} densidade-${densidade}`.trim();
      void raiz.offsetHeight;
      saida.push(fn(densidade));
    }
  } finally {
    html.className = classNameOriginal;
    void raiz.offsetHeight;
  }
  return saida;
}

/** Base de spacing resolvida em px, na densidade aplicada agora em `raiz`. */
export function baseEmPx(raiz: HTMLElement): number | null {
  return pxResolve(raiz, 'var(--spacing-base)', FATOR_DE_PRECISAO);
}

/**
 * Degraus `--spacing-*` que `tokens.css` declara, lidos da folha viva.
 *
 * Lê a folha em vez de uma lista fixa de propósito: degrau novo entra no portão
 * sozinho, e degrau removido não deixa uma asserção morta apontando para ele.
 * `0` e `px` ficam de fora — não são múltiplos da base.
 */
export function degrausDeclarados(doc: Document): DegrauDaEscala[] {
  const findings = new Map<string, number>();

  const visitar = (regras: CSSRuleList): void => {
    for (const regra of Array.from(regras)) {
      if (regra instanceof CSSStyleRule && /(^|,)\s*:root\s*$/.test(regra.selectorText)) {
        for (const prop of Array.from(regra.style)) {
          if (!prop.startsWith('--spacing-')) continue;
          const sufixo = prop.slice('--spacing-'.length);
          if (sufixo === 'base' || sufixo === 'px' || sufixo === '0') continue;
          const mult = Number(sufixo.replace('-', '.'));
          if (!Number.isFinite(mult) || mult <= 0) continue;
          findings.set(prop, mult);
        }
      }
      const aninhadas = (regra as CSSGroupingRule).cssRules;
      if (aninhadas) visitar(aninhadas);
    }
  };

  for (const folha of Array.from(doc.styleSheets)) {
    try {
      visitar(folha.cssRules);
    } catch {
      // Folha de outra origem: inacessível por CORS, e nenhuma do design
      // system entra assim. Segue para a próxima.
    }
  }

  return [...findings].map(([token, multiplicador]) => ({ token, multiplicador }));
}

// ─── Medição de consumidores ──────────────────────────────────────────────────

/** Mede cada alvo nas três densidades. Alvo ausente vira `presente: false`. */
export function densityMeasure(
  raiz: HTMLElement,
  targets: EspacoTarget[],
): EspacoMeasurement[] {
  return byDensity(raiz, (densidade) =>
    targets.map((alvo): EspacoMeasurement => {
      const el = raiz.querySelector<HTMLElement>(alvo.seletor);
      if (!el) {
        return {
          alvo: alvo.nome, prop: alvo.prop, densidade,
          presente: false, px: null, esperado: alvo.esperado[densidade],
        };
      }
      const bruto = raiz.ownerDocument.defaultView!.getComputedStyle(el).getPropertyValue(alvo.prop);
      const px = parseFloat(bruto);
      return {
        alvo: alvo.nome, prop: alvo.prop, densidade,
        presente: true,
        px: Number.isFinite(px) ? px : null,
        esperado: alvo.esperado[densidade],
      };
    }),
  ).flat();
}

export function describeMeasurement(m: EspacoMeasurement): string {
  if (!m.presente) return `${m.alvo} — seletor não casou (${m.prop}, ${m.densidade})`;
  return `${m.alvo} · ${m.prop} · ${m.densidade}: medido ${m.px}px, esperado ${m.esperado}px`;
}

/** Agrupa as três medidas de um mesmo alvo+prop, na ordem de `DENSIDADES`. */
export function byTarget(medidas: EspacoMeasurement[]): Map<string, EspacoMeasurement[]> {
  const grupos = new Map<string, EspacoMeasurement[]>();
  for (const m of medidas) {
    const chave = `${m.alvo} · ${m.prop}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(m);
  }
  for (const lista of grupos.values()) {
    lista.sort((a, b) => DENSIDADES.indexOf(a.densidade) - DENSIDADES.indexOf(b.densidade));
  }
  return grupos;
}
