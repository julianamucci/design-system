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
 *     console dentro da play). O canal é a exceção — ver `reportarSonda`.
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

import { fundoEfetivo, ligarTemaEscuro, razao, resolverCor, semTransicao } from './cor';
import type { Contraste } from './cor';

export type { Contraste } from './cor';
export { ligarTemaEscuro };

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface MedidaDeSeparador {
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
  recebeFoco: boolean;

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
  fundo: string;
  fundoAtras: string | null;
  contraste: Contraste | null;
  /** Nome do token que CASA com a cor pintada. `desconhecido` é o achado. */
  tokenDeOrigem: string;

  // ── Alcance ────────────────────────────────────────────────────────────────
  /** `elementFromPoint` no centro: quem realmente está sob o pixel do meio. */
  elementoNoCentro: string | null;
}

export interface MedidaDeCenario {
  /** `null` quando a stack não monta este cenário. */
  separadores: MedidaDeSeparador[] | null;
  /** Quantos `.nds-separator` o cenário tem — divergência de contagem é achado. */
  quantidade: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * O contrato é a classe. `[data-slot="separator"]` entra como segunda forma
 * porque a divergência de vocabulário entre stacks é, ela própria, o achado:
 * medir só pela classe esconderia uma stack que veste `data-slot` e não a classe.
 */
const SEL_SEPARADOR = '.nds-separator, [data-slot="separator"]';

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
  ['--accent', 'hsl(var(--accent))'],
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

function identificarToken(raiz: HTMLElement, cor: string): string {
  const alvo = normalizar(cor);
  if (!alvo) return 'desconhecido';
  const casados = CANDIDATOS.filter(([, valor]) => {
    const resolvido = resolverCor(raiz, valor);
    return resolvido !== null && normalizar(resolvido) === alvo;
  }).map(([nome]) => nome);
  return casados.length ? casados.join(' | ') : 'desconhecido';
}

function descrever(el: Element | null): string | null {
  if (!el) return null;
  const cls = [...el.classList].filter((c) => c.startsWith('nds-')).join('.');
  return cls ? `${el.tagName.toLowerCase()}.${cls}` : el.tagName.toLowerCase();
}

// ─── Medição de um separador ──────────────────────────────────────────────────

function medirSeparador(sep: HTMLElement, raiz: HTMLElement): MedidaDeSeparador {
  const cs = getComputedStyle(sep);
  const r = sep.getBoundingClientRect();
  const pai = sep.parentElement;
  const csPai = pai ? getComputedStyle(pai) : null;
  const rPai = pai?.getBoundingClientRect();

  const role = sep.getAttribute('role');
  const ariaHidden = sep.getAttribute('aria-hidden');
  const ariaOrientation = sep.getAttribute('aria-orientation');
  const decorativo = role === 'none' || role === 'presentation' || ariaHidden === 'true';

  const vertical = sep.getAttribute('data-orientation') === 'vertical';
  const fundo = cs.backgroundColor;
  const atras = fundoEfetivo(pai);

  // O foco é medido e desfeito: separador focável é defeito, mas deixar o foco
  // posto envenena a medição seguinte e a foto do Chromatic.
  const anterior = sep.ownerDocument.activeElement as HTMLElement | null;
  sep.focus?.();
  const recebeFoco = sep.ownerDocument.activeElement === sep;
  if (recebeFoco) anterior?.focus?.();

  const centro = r.width > 0 && r.height > 0
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
    recebeFoco,

    larguraPx: num(r.width),
    alturaPx: num(r.height),
    espessuraPx: num(Math.min(r.width, r.height)),
    comprimentoPx: num(Math.max(r.width, r.height)),
    invisivel: r.width < 0.5 || r.height < 0.5,
    cssWidth: cs.width,
    cssHeight: cs.height,
    alignSelf: cs.alignSelf,
    flexShrink: cs.flexShrink,
    displayDoPai: csPai?.display ?? '',
    comprimentoDoPaiPx: rPai ? num(vertical ? rPai.height : rPai.width) : 0,

    fundo,
    fundoAtras: atras,
    contraste: atras ? razao(fundo, atras) : null,
    tokenDeOrigem: identificarToken(raiz, fundo),

    elementoNoCentro: descrever(centro),
  };
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** Mede todos os separadores dentro de `alvo`. */
export function medirCenario(alvo: HTMLElement | null, raiz: HTMLElement): MedidaDeCenario {
  if (!alvo) return { separadores: null, quantidade: 0 };
  const seps = [...alvo.querySelectorAll<HTMLElement>(SEL_SEPARADOR)];
  return {
    separadores: seps.map((s) => semTransicao(s, () => medirSeparador(s, raiz))),
    quantidade: seps.length,
  };
}

/**
 * Mede os cenários marcados com `data-sonda="<nome>"` dentro de `raiz`.
 * Cenário ausente vem `separadores: null` — é o achado de "a stack não monta
 * este caso", e não uma falha da medição.
 */
export function medirCenarios(raiz: HTMLElement, cenarios: string[]): Record<string, MedidaDeCenario> {
  const registro: Record<string, MedidaDeCenario> = {};
  for (const cenario of cenarios) {
    registro[cenario] = medirCenario(raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`), raiz);
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
export function medirTokens(raiz: HTMLElement) {
  const cs = getComputedStyle(raiz);
  const ler = (nome: string) => cs.getPropertyValue(nome).trim();
  return {
    border: ler('--border'),
    input: ler('--input'),
    ring: ler('--ring'),
    primary: ler('--primary'),
    background: ler('--background'),
    /** As cores já resolvidas, que é o que a comparação de token usa. */
    resolvidos: Object.fromEntries(
      CANDIDATOS.map(([nome, valor]) => [nome, resolverCor(raiz, valor)]),
    ),
  };
}

/**
 * Mede a linha no tema ESCURO — metade do produto que o axe do test-runner nunca
 * vê, porque a tela está sempre no claro. A classe sai no `finally`: deixá-la
 * posta envenena a story seguinte e a foto do Chromatic.
 */
export function medirNoEscuro(raiz: HTMLElement, cenarios: string[]) {
  const desfazer = ligarTemaEscuro(raiz.ownerDocument);
  try {
    return {
      tokens: medirTokens(raiz),
      cenarios: medirCenarios(raiz, cenarios),
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
export function reportarSonda(stack: string, raiz: HTMLElement, cenarios: string[]): never {
  const registro = {
    tokens: medirTokens(raiz),
    claro: medirCenarios(raiz, cenarios),
    escuro: medirNoEscuro(raiz, cenarios),
  };
  throw new Error(`SONDA::${stack}::${JSON.stringify(registro)}`);
}
