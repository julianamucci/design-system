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

import { contraste, fundoEfetivo, ligarTemaEscuro } from './alert-probe';

export { contraste, fundoEfetivo, ligarTemaEscuro };

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
  const anterior = html.getAttribute('data-reduced-motion');
  html.setAttribute('data-reduced-motion', 'true');
  return () => {
    if (anterior === null) html.removeAttribute('data-reduced-motion');
    else html.setAttribute('data-reduced-motion', anterior);
  };
}

/**
 * O elemento tem animação RODANDO? Nome e duração juntos: uma animação com
 * `animation-duration: 0ms` tem nome e não anima nada, e é exatamente assim que
 * o override de movimento reduzido a desliga.
 */
export function animacaoAtiva(el: HTMLElement): boolean {
  const estilo = getComputedStyle(el);
  if (estilo.animationName === 'none' || estilo.animationName === '') return false;
  return Number.parseFloat(estilo.animationDuration) > 0;
}

// ─── Caixa desenhada ──────────────────────────────────────────────────────────

/** Fração da largura do container que cada valor de `data-width` promete. */
export const FRACAO_DE_LARGURA: Record<string, number> = {
  full: 1,
  '3-4': 0.75,
  '2-3': 2 / 3,
  '1-2': 0.5,
  '1-3': 1 / 3,
};

export interface CaixaDesenhada {
  largura: number;
  altura: number;
  /** Largura do placeholder dividida pela largura do container que o mede. */
  fracaoDoContainer: number;
  /** Quadrado dentro de meio pixel — é o que a forma de avatar promete. */
  quadrado: boolean;
  /** Raio maior ou igual a metade do lado: o avatar sai redondo, não chanfrado. */
  circular: boolean;
}

export function caixaDesenhada(el: HTMLElement, container?: HTMLElement | null): CaixaDesenhada {
  const caixa = el.getBoundingClientRect();
  const refer = (container ?? el.parentElement)?.getBoundingClientRect();
  const raio = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  return {
    largura: caixa.width,
    altura: caixa.height,
    fracaoDoContainer: refer && refer.width > 0 ? caixa.width / refer.width : 0,
    quadrado: Math.abs(caixa.width - caixa.height) < 0.5,
    circular: raio >= caixa.width / 2 - 0.5,
  };
}

// ─── Distinção do fundo ───────────────────────────────────────────────────────

export interface DistincaoDoFundo {
  /** Cor do placeholder já composta com o que está atrás dele. */
  placeholder: string;
  /** Cor do container, também composta. */
  container: string;
  /** Razão de luminância entre as duas. 1.0 significa placeholder invisível. */
  razao: number;
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
export function distincaoDoFundo(el: HTMLElement): DistincaoDoFundo {
  const placeholder = fundoEfetivo(el);
  const container = el.parentElement ? fundoEfetivo(el.parentElement) : placeholder;
  return { placeholder, container, razao: contraste(placeholder, container) };
}
