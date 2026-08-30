/**
 * O caractere gatilho do composer: onde ele vale, o que ele recorta, e o que
 * acontece quando alguém escolhe um item.
 *
 * Máquina pura, como `chat-scroll.ts`: o que é DECISÃO vive aqui e é testável
 * sem navegador; o que é DOM — ler `selectionStart`, posicionar o popover,
 * mover o cursor — é de cada stack. É a mesma divisão, e pelo mesmo motivo: a
 * regra "onde o `@` vale" tem uma resposta só, e cinco respostas parecidas é
 * como o mesmo campo passa a se comportar diferente em cada stack.
 *
 * A REGRA QUE JUSTIFICA O MÓDULO EXISTIR:
 *
 * `@` não abre menção no meio de uma palavra. `contato@nortear.com.br` não é
 * uma menção a `nortear.com.br`, e um composer que abre o seletor ali
 * interrompe quem está escrevendo um e-mail — que é a coisa mais comum de se
 * escrever num campo de texto depois de texto. A regra é "começo de palavra", e
 * ela é fácil de escrever errado de cinco jeitos diferentes.
 *
 * E ela NÃO é a mesma para todo gatilho. `/` é comando, e comando vale no
 * começo do CAMPO: `/ajuda` abre a lista, `veja isso /ajuda` não abre nada,
 * porque ali a barra é pontuação. Por isso cada gatilho declara onde vale, em
 * vez de o módulo assumir um comportamento único.
 *
 * O que este módulo NÃO decide, porque é produto e não desenho: quais itens
 * existem, o que uma menção significa, se o comando executa ao escolher ou só
 * preenche o campo. Ver §7 da guideline 17.
 *
 * Vocabulário derivado do catálogo Elements da assistant-ui (MIT) — conceitos e
 * estados, nunca o código, que é ligado a um runtime de React.
 */

// ─── Onde um gatilho vale ─────────────────────────────────────────────────────

/**
 * O lugar em que o caractere abre o seletor.
 *
 * - `input-start`: só na primeira posição do campo. É o caso do comando.
 * - `word-start`: no começo do campo ou depois de um espaço. É o caso da menção.
 */
export type TriggerPlace = 'input-start' | 'word-start';

export interface TriggerSpec {
  /** O caractere. Um só — `@`, `/`, `#`. */
  char: string;
  place: TriggerPlace;
}

/** Menção: vale em começo de qualquer palavra. */
export const MENTION_TRIGGER: TriggerSpec = { char: '@', place: 'word-start' };

/** Comando: vale só no começo do campo. */
export const COMMAND_TRIGGER: TriggerSpec = { char: '/', place: 'input-start' };

// ─── O recorte ────────────────────────────────────────────────────────────────

/** Um gatilho ativo: qual é, onde começa, e o que já foi digitado depois dele. */
export interface TriggerMatch {
  spec: TriggerSpec;
  /** Índice do caractere gatilho dentro do texto. */
  start: number;
  /** O que está entre o gatilho e o cursor. Vazio logo depois de digitar o gatilho. */
  term: string;
}

/**
 * Espaço em branco, para efeito de "começo de palavra".
 *
 * Quebra de linha conta: `@` na primeira coluna de uma linha nova é começo de
 * palavra tanto quanto depois de um espaço.
 */
const WHITESPACE = /\s/;

/**
 * O gatilho ativo na posição do cursor, se houver.
 *
 * Só o texto ANTES do cursor importa. O que vem depois é o que a pessoa já
 * escreveu e está voltando para editar — considerá-lo faria o seletor abrir ao
 * mover o cursor para trás, sobre um `@` antigo que já virou menção.
 *
 * O termo para no primeiro espaço: digitar `@ana ` fecha o seletor, porque a
 * menção acabou. É o que permite escrever `@ana e @bruno` sem que a segunda
 * busca herde a primeira.
 *
 * Devolve o gatilho MAIS PRÓXIMO do cursor quando há mais de um candidato —
 * em `@ana @bru`, quem está sendo escrito é o segundo.
 */
export function findTrigger(
  text: string,
  caret: number,
  specs: readonly TriggerSpec[],
): TriggerMatch | null {
  const cursor = clamp(caret, 0, text.length);
  const before = text.slice(0, cursor);

  let melhor: TriggerMatch | null = null;
  for (const spec of specs) {
    const start = before.lastIndexOf(spec.char);
    if (start < 0) continue;
    if (!isPlaceValid(before, start, spec.place)) continue;

    const term = before.slice(start + 1);
    // Espaço fecha o gatilho: o que vem depois já não é o termo dele.
    if (WHITESPACE.test(term)) continue;

    if (!melhor || start > melhor.start) melhor = { spec, start, term };
  }
  return melhor;
}

/** O caractere na posição `start` está num lugar em que o gatilho vale? */
function isPlaceValid(before: string, start: number, place: TriggerPlace): boolean {
  if (place === 'input-start') return start === 0;
  // `word-start`: começo do campo, ou logo depois de um espaço. É esta linha
  // que impede `contato@nortear.com.br` de abrir o seletor de menções.
  return start === 0 || WHITESPACE.test(before[start - 1]!);
}

// ─── O filtro ─────────────────────────────────────────────────────────────────

/**
 * Minúsculas e sem acento.
 *
 * Sem acento porque quem digita `@joao` está procurando `João`, e um seletor
 * que não acha o próprio colega de time por causa de um til é um seletor que
 * ninguém usa. `NFD` separa a letra do diacrítico e a faixa apaga o diacrítico.
 */
export function normalizeTerm(value: string): string {
  // A faixa vai escrita por escape, e não pelos próprios diacríticos: marca
  // combinante dentro de um literal é invisível no editor e some numa cópia.
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** O candidato serve para este termo? Termo vazio serve para todos. */
export function matchesTerm(candidate: string, term: string): boolean {
  if (!term) return true;
  return normalizeTerm(candidate).includes(normalizeTerm(term));
}

/**
 * Os itens que servem ao termo, com os que COMEÇAM por ele na frente.
 *
 * A ordem é a diferença entre um seletor útil e uma lista: quem digita `@an`
 * quase sempre quer `Ana`, não `Joana`. Dentro de cada grupo a ordem de entrada
 * é preservada — quem produz a lista já a ordenou por relevância, e reordenar
 * de novo apagaria essa informação.
 */
export function rankByTerm<T>(
  items: readonly T[],
  term: string,
  label: (item: T) => string,
): T[] {
  if (!term) return [...items];
  const alvo = normalizeTerm(term);
  const comeca: T[] = [];
  const contem: T[] = [];
  for (const item of items) {
    const nome = normalizeTerm(label(item));
    if (nome.startsWith(alvo)) comeca.push(item);
    else if (nome.includes(alvo)) contem.push(item);
  }
  return [...comeca, ...contem];
}

// ─── A escolha ────────────────────────────────────────────────────────────────

/** O texto e onde o cursor fica depois de aplicar uma escolha. */
export interface TriggerApplied {
  text: string;
  caret: number;
}

/**
 * Troca o gatilho e o termo pelo texto escolhido, e diz onde o cursor vai.
 *
 * O espaço no fim é do componente, e não de quem consome: sem ele a próxima
 * palavra gruda na menção. Mas só quando não há um já — aplicar a escolha no
 * meio de uma frase já escrita não deve deixar dois espaços, e essa é a
 * diferença entre inserir e emendar.
 *
 * O cursor vai para DEPOIS do espaço, que é onde quem escreve continua. Devolver
 * a posição em vez de mexer no campo é o que mantém a máquina sem DOM: quem
 * chama faz `setSelectionRange`, e cada stack faz isso do seu jeito.
 */
export function applyTrigger(
  text: string,
  match: TriggerMatch,
  caret: number,
  replacement: string,
): TriggerApplied {
  const cursor = clamp(caret, 0, text.length);
  const depois = text.slice(cursor);
  const precisaEspaco = !depois.startsWith(' ');
  const inserido = precisaEspaco ? `${replacement} ` : replacement;

  return {
    text: text.slice(0, match.start) + inserido + depois,
    caret: match.start + inserido.length + (precisaEspaco ? 0 : 1),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
