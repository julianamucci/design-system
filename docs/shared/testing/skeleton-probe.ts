/**
 * Colhedor compartilhado do Skeleton — as cinco stacks medem com este arquivo.
 *
 * Três coisas que nenhuma stack media, e cada uma escondia um defeito real:
 *
 * 1. **A caixa desenhada.** As stories afirmavam a CLASSE (`h-4`, `w-[250px]`,
 *    `h-12 w-12`), e a classe não existe mais desde a migração `.nds-*`: o
 *    Playground de quatro stacks renderizava um bloco de altura zero e a suíte
 *    ficava verde. Medida é `getBoundingClientRect`, não `className`.
 *
 * 2. **O pulso sob movimento reduzido.** Afirmar `animationName !== 'none'` é
 *    frágil — o nome muda por stack e por versão. O que interessa é o par: a
 *    animação EXISTE no estado normal e SOME quando o movimento é reduzido.
 *
 * 3. **O placeholder distinguir-se do fundo.** Não é contraste de texto (o
 *    esqueleto não transmite informação, então 1.4.3 e 1.4.11 não se aplicam),
 *    mas um placeholder que se confunde com o container não indica nada. É
 *    diferença de luminância, e o fundo tem ALFA — sem compor com o ancestral
 *    opaco a conta mede uma cor que ninguém vê.
 *
 * A composição de fundo e a razão de luminância já estavam resolvidas no
 * colhedor do Alert: reusadas aqui em vez de copiadas, porque duas cópias da
 * mesma conta divergem na primeira correção.
 */

import { contraste, backgroundEffective, darkLigarTheme } from './alert-probe';
import { byTheme, MODOS, THEMES } from './cor';

export { contraste, backgroundEffective, darkLigarTheme };

// ─── Movimento reduzido ───────────────────────────────────────────────────────

/**
 * Liga o override de movimento reduzido do preview e devolve como desfazer.
 *
 * O toolbar "Motion" escreve `data-reduced-motion` no `<html>` e o
 * `docs/shared/tokens/motion.css` zera as durações a partir dele — é o único
 * gancho disponível, porque `prefers-reduced-motion` é preferência de SO e o
 * browser dos testes não a emula (a emulação foi removida de propósito: deixava
 * o CI verde escondendo asserção racy).
 *
 * Devolve o desfazer para o `finally`: deixar a marca posta envenena a story
 * seguinte e a foto do Chromatic.
 */
export function ligarMovimentoReduzido(doc: Document): () => void {
  const html = doc.documentElement;
  const previous = html.getAttribute('data-reduced-motion');
  html.setAttribute('data-reduced-motion', 'true');
  return () => {
    if (previous === null) html.removeAttribute('data-reduced-motion');
    else html.setAttribute('data-reduced-motion', previous);
  };
}

/**
 * O elemento tem animação RODANDO? Nome e duração juntos: uma animação com
 * `animation-duration: 0ms` tem nome e não anima nada, e é exatamente assim que
 * o override de movimento reduzido a desliga.
 */
export function animationActive(el: HTMLElement): boolean {
  const estilo = getComputedStyle(el);
  if (estilo.animationName === 'none' || estilo.animationName === '') return false;
  return Number.parseFloat(estilo.animationDuration) > 0;
}

// ─── Caixa desenhada ──────────────────────────────────────────────────────────

/** Fração da largura do container que cada valor de `data-width` promete. */
export const WIDTH_FRACTION: Record<string, number> = {
  full: 1,
  '3-4': 0.75,
  '2-3': 2 / 3,
  '1-2': 0.5,
  '1-3': 1 / 3,
};

export interface BoxDesenhada {
  width: number;
  height: number;
  /** Largura do placeholder dividida pela largura do container que o mede. */
  fracaoDoContainer: number;
  /** Quadrado dentro de meio pixel — é o que a forma de avatar promete. */
  quadrado: boolean;
  /** Raio maior ou igual a metade do lado: o avatar sai redondo, não chanfrado. */
  circular: boolean;
}

export function boxDesenhada(el: HTMLElement, container?: HTMLElement | null): BoxDesenhada {
  const box = el.getBoundingClientRect();
  const refer = (container ?? el.parentElement)?.getBoundingClientRect();
  const raio = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  return {
    width: box.width,
    height: box.height,
    fracaoDoContainer: refer && refer.width > 0 ? box.width / refer.width : 0,
    quadrado: Math.abs(box.width - box.height) < 0.5,
    circular: raio >= box.width / 2 - 0.5,
  };
}

// ─── Distinção do fundo ───────────────────────────────────────────────────────

export interface BackgroundDistincao {
  /** Cor do placeholder já composta com o que está atrás dele. */
  placeholder: string;
  /** Cor do container, também composta. */
  container: string;
  /** Razão de luminância entre as duas. 1.0 significa placeholder invisível. */
  ratio: number;
}

/**
 * O placeholder se distingue do container?
 *
 * O limite aqui não é 4.5 nem 3: nenhum critério de contraste da WCAG se aplica
 * a um bloco decorativo que não transmite informação. O piso existe para pegar
 * o caso degenerado — token trocado, opacidade zerada, tema em que a cor
 * primária coincide com a superfície — em que o esqueleto some e o carregamento
 * deixa de ser visível.
 */
export function backgroundDistincao(el: HTMLElement): BackgroundDistincao {
  const placeholder = backgroundEffective(el);
  const container = el.parentElement ? backgroundEffective(el.parentElement) : placeholder;
  return { placeholder, container, ratio: contraste(placeholder, container) };
}

export interface ThemeDistinction extends BackgroundDistincao {
  theme: (typeof THEMES)[number];
  mode: (typeof MODOS)[number];
}

/**
 * A distinção do fundo nos TRÊS temas e nos DOIS modos.
 *
 * Até 2026-09-14 o piso de 1,05 era medido numa combinação em seis — o tema e o
 * modo em que a suíte abre. A superfície do esqueleto é a primária a 10%, então
 * ela MUDA com a marca, e é justamente o tema que não é medido que pode fazê-la
 * coincidir com o fundo.
 *
 * `root` recebe as classes de tema (ver `byTheme`), e precisa CONTER o
 * esqueleto. O chão da composição não é o `<body>` — cuja pintura fica velha
 * quando o tema troca por classe —, e sim `--background` resolvido por uma sonda
 * montada ao lado do elemento medido, que herda o tema recém-posto.
 */
export function distinctionByTheme(root: HTMLElement, el: HTMLElement): ThemeDistinction[] {
  return byTheme(root, (theme, mode) => ({ theme, mode, ...backgroundDistincao(el) }));
}

// ─── Medida contra o TOKEN ────────────────────────────────────────────────────

/**
 * Resolve um comprimento em px NO CONTEXTO do elemento — densidade, escala de
 * tipo e tema herdados de onde ele está, não da raiz.
 *
 * A sonda é um `div` fora do fluxo, pendurado no pai do elemento e retirado em
 * seguida. Mexe no DOM: NUNCA chame dentro de `waitFor` (ver a regra do
 * `waitFor` que pendura, no CLAUDE.md).
 */
export function resolveLength(el: HTMLElement, value: string): number {
  const host = el.parentElement ?? el;
  const probe = el.ownerDocument.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  // `setProperty`, e não a propriedade camelCase: valor com `var()` precisa
  // chegar como declaração, e é esse o caminho que o CSSOM aceita sem parsear.
  probe.style.setProperty('inline-size', value);
  host.appendChild(probe);
  try {
    return probe.getBoundingClientRect().width;
  } finally {
    probe.remove();
  }
}

/** Token de texto que dá a altura de cada forma sem medida própria (D8). */
export const SHAPE_HEIGHT_TOKEN: Record<string, string> = {
  text: '--text-control',
  heading: '--text-h4',
};

export interface HeightAgainstToken {
  token: string;
  height: number;
  expected: number;
}

/**
 * A altura desenhada de `text` e `heading` contra o token da escada de texto.
 *
 * O esqueleto não tem conteúdo, e o `padding-block` é metade da medida nos dois
 * lados: a altura tem de ser EXATAMENTE a medida. Asserção de `height > 0` pega
 * o colapso para zero e deixa passar altura cravada por fora e desvio da
 * escada — era o único contrato do PRD (C8) sem portão.
 */
export function heightAgainstToken(el: HTMLElement): HeightAgainstToken {
  const shape = el.dataset.shape ?? '';
  const token = SHAPE_HEIGHT_TOKEN[shape];
  if (!token) throw new Error(`forma "${shape}" não tem altura derivada de token`);
  return {
    token,
    height: el.getBoundingClientRect().height,
    expected: resolveLength(el, `var(${token})`),
  };
}

/**
 * O raio desenhado contra o token que a folha diz ler: `--radius` na base,
 * `--radius-full` (limitado pela metade do lado) no avatar.
 *
 * Substitui `borderRadius !== '0px'`, que era FALSO no tema `cold` — ele declara
 * `--radius: 0` como identidade de forma, e a asserção reprovaria um tema
 * legítimo no dia em que alguém o exercitasse.
 */
export function radiusAgainstToken(el: HTMLElement): { radius: number; expected: number } {
  const radius = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  const token = el.dataset.shape === 'avatar' ? '--radius-full' : '--radius';
  // O computado devolve o valor DECLARADO (9999px no avatar), não o desenhado;
  // o limite de metade do lado menor é aplicado aos dois lados da comparação.
  const box = el.getBoundingClientRect();
  const half = Math.min(box.width, box.height) / 2;
  return {
    radius: Math.min(radius, half),
    expected: Math.min(resolveLength(el, `var(${token})`), half),
  };
}

/**
 * Um avatar com `data-width` continua quadrado?
 *
 * A folha restringe a fração às formas que não são avatar desde 2026-09-14;
 * antes a regra de largura vinha depois da de avatar, com a mesma
 * especificidade, e o avatar saía retângulo. O atributo é posto e devolvido
 * como estava, mesmo se a medida lançar.
 */
export function avatarIgnoresWidth(el: HTMLElement, width = '1-2'): BoxDesenhada {
  const previous = el.getAttribute('data-width');
  el.setAttribute('data-width', width);
  try {
    return boxDesenhada(el);
  } finally {
    if (previous === null) el.removeAttribute('data-width');
    else el.setAttribute('data-width', previous);
  }
}
