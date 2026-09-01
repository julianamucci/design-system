/**
 * Espécie de linha do CodeBlock — a decisão que separa contexto, adição e
 * remoção, e o que cada espécie mostra e ANUNCIA.
 *
 * Mora no compartilhado, e não em cinco `if`, pela regra da §3.2 da guideline
 * 17: o mapa de espécie para marca visível e para palavra falada é uma decisão
 * só, e cinco cópias divergem na primeira revisão.
 *
 * A marca existe porque tinta sozinha é a codificação que a regra 4 da §8
 * recusa — e o exemplo que ela dá é exatamente este, adição e remoção num
 * diferencial. O `+` e o `−` cobrem a visão monocromática; a palavra em
 * `.nds-sr-only` cobre quem não vê nenhum dos dois. É o mesmo par de indicadores
 * que a linha em destaque já resolve com fundo mais barra de acento.
 *
 * **Contexto não fala.** A linha inalterada tem marca vazia e palavra vazia, e
 * isso é decisão, não esquecimento: o paralelo é exato — o espaço em branco é o
 * que a calha mostra, o silêncio é o que o leitor recebe. Anunciar "contexto" em
 * cada linha que não mudou tornaria o bloco ilegível por voz, e a regra 4 pede
 * que a DISTINÇÃO não dependa de cor, não que a ausência de distinção seja
 * narrada.
 */

import type { CodeBlockLabels } from './code-block-labels';

/**
 * As três espécies. Nasce uma delas e nunca transita: não é máquina de estados,
 * é classificação — a linha é o que é desde que chegou.
 */
export type CodeLineKind = 'context' | 'added' | 'removed';

export interface CodeLineMark {
  kind: CodeLineKind;
  /** `+`, `−` ou vazio. O que a calha mostra no lugar do número. */
  mark: string;
  /** Palavra em `.nds-sr-only`. Vazia no contexto — ver o docblock do módulo. */
  label: string;
}

/**
 * Sinal de menos tipográfico (U+2212), não o hífen do teclado.
 *
 * Ele casa com a largura do `+` na fonte monoespaçada, então as duas marcas
 * ocupam a mesma coluna; o hífen fica mais curto e mais alto, e o par
 * desalinhava a olho nu.
 */
const MARK_REMOVED = '−';

/**
 * Uma entrada por linha do trecho.
 *
 * `kinds` vem indexado por linha, e não por intervalo como `highlightLines`, e
 * a diferença é de natureza: destaque é decoração esparsa — três linhas de
 * quarenta —, espécie é classificação COMPLETA — quem produz um diferencial já
 * tem a etiqueta de cada linha na mão e não teria como colapsá-la em intervalo
 * sem desmontar o que acabou de montar.
 *
 * Entrada faltando, sobrando ou desconhecida vira `context`: um produtor que
 * erre o comprimento pinta de menos, nunca pinta errado.
 */
export function codeLineMarks(
  kinds: ReadonlyArray<CodeLineKind> | undefined,
  total: number,
  labels: CodeBlockLabels,
): CodeLineMark[] {
  if (!kinds || kinds.length === 0) return [];
  const marks: CodeLineMark[] = [];
  for (let i = 0; i < total; i += 1) {
    const kind = kinds[i];
    if (kind === 'added') marks.push({ kind, mark: '+', label: labels.lineAdded });
    else if (kind === 'removed') marks.push({ kind, mark: MARK_REMOVED, label: labels.lineRemoved });
    else marks.push({ kind: 'context', mark: '', label: '' });
  }
  return marks;
}

/**
 * O bloco está em modo de espécie?
 *
 * É o que decide se a calha carrega marca ou número, e se ela continua
 * `aria-hidden`. Número de linha é redundante com a posição e sai da leitura;
 * sinal de diferencial não é redundante com nada, e fica.
 */
export function hasLineKinds(kinds: ReadonlyArray<CodeLineKind> | undefined): boolean {
  return !!kinds && kinds.length > 0;
}
