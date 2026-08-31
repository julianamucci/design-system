/**
 * Sonda de comparação do Separator entre as cinco stacks.
 *
 * O separador é o componente mais simples da fila, e componente simples é onde a
 * asserção vazia sobrevive mais tempo: "não há o que testar" parece verdade.
 * Não é. O separador tem um contrato semântico preciso — decorativo por padrão
 * (`role="none"` + `aria-hidden`, SEM `aria-orientation`) e semântico sob pedido
 * (`role="separator"` + `aria-orientation`) — e um contrato geométrico que
 * depende do display do PAI, não do próprio elemento: em coluna e em grade ele
 * estica sozinho, em bloco ele nasce com 0px e some da tela sem erro nenhum.
 *
 * A sonda procura os elementos pelo contrato `.nds-*` de
 * `docs/shared/styles/nds/separator.css`. Onde o contrato não é cumprido o campo
 * vem `null` (ou `false`) — e isso É o achado, não falha da medição.
 *
 * Armadilhas evitadas aqui:
 *
 *   - `console.log` não chega ao terminal (o addon do Storybook instrumenta o
 *     console dentro da play). O canal é a exceção — ver `reportProbe`.
 *   - **Geometria computada, nunca a folha lida a olho.** A tabela de tokens
 *     dizia `h-px w-full` / `w-px h-full`, e a folha aplica `height: 1px` +
 *     `width: 100%` num eixo e `width: 1px` + `align-self: stretch` no outro.
 *     Aqui a medida é `getBoundingClientRect` mais `getComputedStyle`.
 *   - **Token de origem medido, não deduzido do nome.** No `resizable` o divisor
 *     estava documentado como `--border` e era `--ring`. A sonda resolve os
 *     candidatos dentro da própria árvore e diz qual deles CASA com a cor
 *     pintada; `desconhecido` é o achado de que nenhum casa.
 *   - **Atributo de presença casa valor "false"**: os seletores usam
 *     `:not([attr="false"])`.
 *   - O foco muda o estado medido; a sonda devolve o foco a quem o tinha.
 */

import { backgroundEffective, darkLigarTheme, ratio, resolveColor, noTransicao } from './cor';
import type { Contrast } from './cor';

export type { Contrast } from './cor';
export { darkLigarTheme };

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SeparatorMeasurement {
  /** `false` é a stack não montar o cenário, ou não vestir a classe do contrato. */
  presente: boolean;
  tag: string | null;
  temClasseDoContrato: boolean;
  /** Só as `nds-*`: classe de framework morto aparece como ausência, não como ruído. */
  classesNds: string[];
  /** Classes SEM prefixo `nds-` no elemento — resíduo da migração, se houver. */
  classesForaDoContrato: string[];
  dataSlot: string | null;
  dataOrientation: string | null;
  dataEmphasis: string | null;

  // ── Semântica ──────────────────────────────────────────────────────────────
  role: string | null;
  ariaHidden: string | null;
  ariaOrientation: string | null;
  /** `aria-orientation` num elemento fora da árvore de acessibilidade é ruído. */
  orientacaoAnunciadaEmDecorativo: boolean;
  tabindex: string | null;
  /** Separador não é interativo: `focus()` programático não pode fixá-lo. */
  recebeFocus: boolean;

  // ── Geometria ──────────────────────────────────────────────────────────────
  larguraPx: number;
  alturaPx: number;
  /** Menor eixo — é a "espessura" que a pessoa vê. */
  espessuraPx: number;
  /** Maior eixo — é o comprimento da linha. */
  comprimentoPx: number;
  /** `true` quando o separador colapsou e sumiu da tela sem erro nenhum. */
  invisivel: boolean;
  cssWidth: string;
  cssHeight: string;
  alignSelf: string;
  flexShrink: string;
  /** O display do PAI é quem decide se o vertical estica ou colapsa. */
  displayDoPai: string;
  /** Comprimento do pai no mesmo eixo — para ver se a linha o acompanha. */
  comprimentoDoPaiPx: number;

  // ── Cor ────────────────────────────────────────────────────────────────────
  background: string;
  fundoAtras: string | null;
  contraste: Contrast | null;
  /** Nome do token que CASA com a cor pintada. `desconhecido` é o achado. */
  tokenDeOrigem: string;

  // ── Alcance ────────────────────────────────────────────────────────────────
  /** `elementFromPoint` no centro: quem realmente está sob o pixel do meio. */
  elementoNoCentro: string | null;
}

export interface CenarioMeasurement {
  /** `null` quando a stack não monta este cenário. */
  separadores: SeparatorMeasurement[] | null;
  /** Quantos `.nds-separator` o cenário tem — divergência de contagem é achado. */
  quantidade: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * O contrato é a classe. `[data-slot="separator"]` entra como segunda forma
 * porque a divergência de vocabulário entre stacks é, ela própria, o achado:
 * medir só pela classe esconderia uma stack que veste `data-slot` e não a classe.
 */
const SEL_SEPARATOR = '.nds-separator, [data-slot="separator"]';

const num = (v: number): number => Math.round(v * 100) / 100;

/**
 * Candidatos de token, resolvidos DENTRO da árvore medida.
 *
 * A lista traz os vizinhos plausíveis de propósito: `--input` foi escurecido
 * até 3:1 numa rodada de foundations e `--border` não, então confundir os dois
 * muda o veredito de contraste. `--ring` está aqui porque foi exatamente ele
 * que o `resizable` pintava enquanto a doc dizia `--border`.
 */
const CANDIDATOS: Array<[string, string]> = [
  ['--border', 'hsl(var(--border))'],
  ['--input', 'hsl(var(--input))'],
  ['--ring', 'hsl(var(--ring))'],
  ['--muted', 'hsl(var(--muted))'],
  // `--accent` NÃO entra: desde 2026-08-31 ele é `var(--primary)`, então a
  // lavagem dele é indistinguível de `--primary / 0.2` logo abaixo. Duas
  // entradas com a mesma cor não identificam nada — a primeira sempre venceria,
  // e o diagnóstico apontaria o token errado.
  ['--foreground', 'hsl(var(--foreground))'],
  ['--primary', 'hsl(var(--primary))'],
  ['--primary / 0.2', 'hsl(var(--primary) / 0.2)'],
];

/** `rgb(0, 0, 0)` e `rgba(0,0,0,1)` são a mesma cor — normaliza antes de comparar. */
function normalizar(cor: string): string | null {
  const m = /rgba?\(([^)]+)\)/.exec(cor);
  if (!m) return null;
  const p = m[1].split(/[,/]/).map((x) => parseFloat(x.trim()));
  if (p.length < 3 || p.slice(0, 3).some(Number.isNaN)) return null;
  const a = p.length > 3 && !Number.isNaN(p[3]) ? p[3] : 1;
  return `${Math.round(p[0])},${Math.round(p[1])},${Math.round(p[2])},${Math.round(a * 1000) / 1000}`;
}

function identificarToken(root: HTMLElement, cor: string): string {
  const target = normalizar(cor);
  if (!target) return 'desconhecido';
  const casados = CANDIDATOS.filter(([, value]) => {
    const resolvido = resolveColor(root, value);
    return resolvido !== null && normalizar(resolvido) === target;
  }).map(([name]) => name);
  return casados.length ? casados.join(' | ') : 'desconhecido';
}

function describe(el: Element | null): string | null {
  if (!el) return null;
  const cls = [...el.classList].filter((c) => c.startsWith('nds-')).join('.');
  return cls ? `${el.tagName.toLowerCase()}.${cls}` : el.tagName.toLowerCase();
}

// ─── Medição de um separador ──────────────────────────────────────────────────

function measureSeparator(sep: HTMLElement, root: HTMLElement): SeparatorMeasurement {
  const cs = getComputedStyle(sep);
  const r = sep.getBoundingClientRect();
  const parent = sep.parentElement;
  const csParent = parent ? getComputedStyle(parent) : null;
  const rParent = parent?.getBoundingClientRect();

  const role = sep.getAttribute('role');
  const ariaHidden = sep.getAttribute('aria-hidden');
  const ariaOrientation = sep.getAttribute('aria-orientation');
  const decorativo = role === 'none' || role === 'presentation' || ariaHidden === 'true';

  const vertical = sep.getAttribute('data-orientation') === 'vertical';
  const background = cs.backgroundColor;
  const atras = backgroundEffective(parent);

  // O foco é medido e desfeito: separador focável é defeito, mas deixar o foco
  // posto envenena a medição seguinte e a foto do Chromatic.
  const previous = sep.ownerDocument.activeElement as HTMLElement | null;
  sep.focus?.();
  const recebeFocus = sep.ownerDocument.activeElement === sep;
  if (recebeFocus) previous?.focus?.();

  const center = r.width > 0 && r.height > 0
    ? sep.ownerDocument.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    : null;

  return {
    presente: true,
    tag: sep.tagName.toLowerCase(),
    temClasseDoContrato: sep.classList.contains('nds-separator'),
    classesNds: [...sep.classList].filter((c) => c.startsWith('nds-')),
    classesForaDoContrato: [...sep.classList].filter((c) => !c.startsWith('nds-')),
    dataSlot: sep.getAttribute('data-slot'),
    dataOrientation: sep.getAttribute('data-orientation'),
    dataEmphasis: sep.matches('[data-emphasis]:not([data-emphasis="false"])')
      ? sep.getAttribute('data-emphasis')
      : null,

    role,
    ariaHidden,
    ariaOrientation,
    orientacaoAnunciadaEmDecorativo: decorativo && ariaOrientation !== null,
    tabindex: sep.getAttribute('tabindex'),
    recebeFocus,

    larguraPx: num(r.width),
    alturaPx: num(r.height),
    espessuraPx: num(Math.min(r.width, r.height)),
    comprimentoPx: num(Math.max(r.width, r.height)),
    invisivel: r.width < 0.5 || r.height < 0.5,
    cssWidth: cs.width,
    cssHeight: cs.height,
    alignSelf: cs.alignSelf,
    flexShrink: cs.flexShrink,
    displayDoPai: csParent?.display ?? '',
    comprimentoDoPaiPx: rParent ? num(vertical ? rParent.height : rParent.width) : 0,

    background,
    fundoAtras: atras,
    contraste: atras ? ratio(background, atras) : null,
    tokenDeOrigem: identificarToken(root, background),

    elementoNoCentro: describe(center),
  };
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** Mede todos os separadores dentro de `target`. */
export function measureCenario(target: HTMLElement | null, root: HTMLElement): CenarioMeasurement {
  if (!target) return { separadores: null, quantidade: 0 };
  const seps = [...target.querySelectorAll<HTMLElement>(SEL_SEPARATOR)];
  return {
    separadores: seps.map((s) => noTransicao(s, () => measureSeparator(s, root))),
    quantidade: seps.length,
  };
}

/**
 * Mede os cenários marcados com `data-sonda="<nome>"` dentro de `root`.
 * Cenário ausente vem `separadores: null` — é o achado de "a stack não monta
 * este caso", e não uma falha da medição.
 */
export function measureCenarios(root: HTMLElement, cenarios: string[]): Record<string, CenarioMeasurement> {
  const registro: Record<string, CenarioMeasurement> = {};
  for (const cenario of cenarios) {
    registro[cenario] = measureCenario(root.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`), root);
  }
  return registro;
}

/**
 * O que a folha compartilhada REALMENTE aplica, lido do navegador.
 *
 * A tabela de tokens documentava cinco classes de um framework utilitário que
 * saiu do projeto. Conferir a tabela contra a folha lida a olho foi exatamente o
 * que deixou isso passar; aqui a fonte é `getComputedStyle` mais os candidatos
 * resolvidos na própria árvore.
 */
export function measureTokens(root: HTMLElement) {
  const cs = getComputedStyle(root);
  const ler = (name: string) => cs.getPropertyValue(name).trim();
  return {
    border: ler('--border'),
    input: ler('--input'),
    ring: ler('--ring'),
    primary: ler('--primary'),
    background: ler('--background'),
    /** As cores já resolvidas, que é o que a comparação de token usa. */
    resolvidos: Object.fromEntries(
      CANDIDATOS.map(([name, value]) => [name, resolveColor(root, value)]),
    ),
  };
}

/**
 * Mede a linha no tema ESCURO — metade do produto que o axe do test-runner nunca
 * vê, porque a tela está sempre no claro. A classe sai no `finally`: deixá-la
 * posta envenena a story seguinte e a foto do Chromatic.
 */
export function darkMeasure(root: HTMLElement, cenarios: string[]) {
  const desfazer = darkLigarTheme(root.ownerDocument);
  try {
    return {
      tokens: measureTokens(root),
      cenarios: measureCenarios(root, cenarios),
    };
  } finally {
    desfazer();
  }
}

/**
 * Emite o registro para fora do navegador.
 *
 * Via exceção, e não `console.log`: o addon do Storybook instrumenta o console
 * dentro da play e nada do que se escreve ali chega ao terminal do vitest.
 */
export function reportProbe(stack: string, root: HTMLElement, cenarios: string[]): never {
  const registro = {
    tokens: measureTokens(root),
    light: measureCenarios(root, cenarios),
    escuro: darkMeasure(root, cenarios),
  };
  throw new Error(`SONDA::${stack}::${JSON.stringify(registro)}`);
}
