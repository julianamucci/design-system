/**
 * A conta da janela de contexto.
 *
 * Máquina pura, como `chat-scroll.ts`, `composer-trigger.ts` e `file-size.ts`:
 * só a aritmética vive aqui, e ela é a mesma nas cinco stacks. Nada de DOM,
 * nada de framework, nada de texto — a palavra de cada nível é interface, tem
 * três idiomas e sai da `translations.json`, como a unidade do tamanho de
 * arquivo já sai.
 *
 * A DIVISÃO COM `chat-protocol.ts`: aquele é o VOCABULÁRIO, este é a CONTA. O
 * `TokenUsage` é importado, nunca redeclarado — duas definições do mesmo dado é
 * exatamente o defeito que o vocabulário compartilhado existe para não repetir.
 *
 * A guideline 17 (§3.2) previu este módulo com três decisões dentro dele:
 * FRAÇÃO USADA, LIMIAR DE AVISO e REPARTIÇÃO POR ORIGEM — "três peças de
 * medição desenham o mesmo número". As três estão aqui, e as três são decisões
 * de verdade: cada uma tem pelo menos duas respostas plausíveis, e uma delas
 * escrita cinco vezes acabaria em cinco respostas diferentes.
 *
 *   1. SEM TETO NÃO HÁ FRAÇÃO. O `limit` é opcional no vocabulário porque nem
 *      sempre se sabe qual é. Quem não sabe recebe `null`, e não zero: um anel
 *      vazio lê como "nada foi usado", que é o oposto de "não se sabe quanto
 *      cabe". Zero é uma resposta; `null` é a ausência dela.
 *   2. O LIMIAR É EXATO, e não "perto de". Três quartos é aviso; 74,9% não é.
 *      Comparação frouxa faria duas peças discordarem sobre o mesmo número, que
 *      é precisamente o que este módulo existe para impedir. Mesma escolha do
 *      limiar de unidade em `file-size.ts`.
 *   3. A REPARTIÇÃO RESPONDE "DE ONDE VEIO", e não "quanto cabe". São duas
 *      perguntas, e por isso dois denominadores e duas funções — uma repartição
 *      que trocasse de denominador conforme houvesse teto faria o mesmo desenho
 *      significar duas coisas.
 *
 * Duas decisões CHEGARAM com a segunda peça de medição, a que desenha a
 * repartição por origem nomeada. As duas são do mesmo tipo das três de cima —
 * têm resposta plausível dos dois lados, e escritas em cinco stacks sairiam
 * diferentes em pelo menos uma:
 *
 *   4. A ORDEM DA REPARTIÇÃO É A DE QUEM MEDIU, e nunca a do tamanho. Ordenar
 *      por peso parece uma gentileza e é o contrário: a legenda é lida por
 *      posição, e uma parcela que sobe de lugar entre um turno e o seguinte faz
 *      quem lê comparar duas fotos diferentes achando que compara a mesma.
 *   5. O POR CENTO DE CADA PARCELA É TEXTO, e leva as mesmas duas travas de
 *      `usedPercent`, pelo mesmo motivo: é ele que se lê em voz. Uma parcela com
 *      tokens de verdade não pode sair como 0%, e uma parcela que não é tudo não
 *      pode sair como 100%.
 *
 * Derivado do catálogo Elements da assistant-ui (MIT). Ver
 * `docs/shared/guidelines/17-componentes-conversacionais.md`.
 */

import { totalTokens, type TokenUsage } from './chat-protocol';

// ─── Quanto ainda cabe ────────────────────────────────────────────────────────

/**
 * O nível de ocupação da janela.
 *
 * Mesmo critério de `chat-protocol.ts`: um nível só existe se MUDA O DESENHO.
 *
 * `warning` e `critical` são separados porque o que se pode fazer a respeito é
 * diferente. Em `warning` ainda sobra janela para o turno seguinte e a escolha
 * — enxugar o contexto, começar outra conversa — muda o que acontece. Em
 * `critical` a escolha já não muda: o próximo turno provavelmente não cabe, e o
 * que resta é decidir o que sacrificar. Um aviso que chega quando não há mais o
 * que decidir não é aviso, é laudo.
 *
 * `normal` existe pelo mesmo motivo que os outros dois: ele é a RESPOSTA de que
 * há folga. Uma peça que só falasse quando a notícia é ruim deixaria a boa
 * notícia indistinguível de uma medição que não chegou.
 */
export type BudgetLevel = 'normal' | 'warning' | 'critical';

/** Do mais folgado para o mais apertado. Mesma razão de `RUN_STATUSES`. */
export const BUDGET_LEVELS: readonly BudgetLevel[] = ['normal', 'warning', 'critical'] as const;

/**
 * A partir de onde a janela vira aviso: três quartos.
 *
 * O limiar tem de chegar enquanto ainda existe ESPAÇO PARA AGIR. Enxugar o
 * contexto ou recomeçar a conversa só ajuda se o que sobra ainda comporta o
 * próximo turno; avisar a 95% é avisar depois do fato. Um quarto de janela é o
 * último ponto em que ainda cabe um turno longo.
 */
export const BUDGET_WARNING_AT = 0.75;

/**
 * A partir de onde o aviso vira aperto: nove décimos.
 *
 * Aqui o conselho troca de natureza — deixa de ser "considere enxugar" e passa
 * a ser "o próximo turno provavelmente não cabe". Cor sozinha não diz isso
 * (WCAG 1.4.1), e é por isso que quem desenha lê o NÍVEL e escreve a palavra
 * dele; a cor acompanha, nunca substitui.
 */
export const BUDGET_CRITICAL_AT = 0.9;

/**
 * Contagem que se possa desenhar.
 *
 * Não-finito e negativo viram zero, pela mesma razão de `formatFileSize`: um
 * `NaN` na tela é pior que um zero, porque zero pelo menos se lê. Consumo de
 * tokens não é negativo, e um teto de zero não é teto — é a ausência dele, e
 * cai no mesmo `null` de quem não mandou teto nenhum.
 */
function countable(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return 0;
  return value;
}

/**
 * Sabe-se quanto cabe?
 *
 * Existe como função, e não como `usage.limit !== undefined` espalhado, porque
 * a resposta tem TRÊS casos que parecem um só: teto ausente, teto não-finito e
 * teto zero. Os três significam a mesma coisa para quem desenha — não há
 * fração — e escrever isso em cinco lugares é como um deles fica de fora.
 */
export function hasLimit(usage: TokenUsage): boolean {
  return countable(usage.limit) > 0;
}

/**
 * O que já foi consumido, sempre derivado.
 *
 * Reexporta a soma do vocabulário depois de normalizar as parcelas: `total` é
 * função e não campo (docblock de `TokenUsage`), e um total guardado que
 * discorda da soma é pior que total nenhum.
 */
export function usedTokens(usage: TokenUsage): number {
  return totalTokens({ input: countable(usage.input), output: countable(usage.output) });
}

/**
 * A fração da janela já ocupada, de 0 a 1 — ou `null` quando não há teto.
 *
 * RECORTADA EM 1, e o recorte é decisão: um anel não dá mais que uma volta e
 * uma barra não passa do trilho, então desenhar 1,3 desenharia 1 de qualquer
 * jeito, só que sem ninguém ter escolhido. Quem precisa saber que passou
 * pergunta a `isOverLimit` — e é essa separação que faz a função existir.
 */
export function usedFraction(usage: TokenUsage): number | null {
  const limit = countable(usage.limit);
  if (limit === 0) return null;
  return Math.min(usedTokens(usage) / limit, 1);
}

/**
 * Uma fração de 0 a 1 em número inteiro de por cento, para ser LIDA.
 *
 * DUAS TRAVAS, e as duas existem porque este número é TEXTO: ele é lido em voz,
 * enquanto o desenho ao lado é só desenho. Arredondar é escolher qual mentira
 * contar, então as duas mentiras que importam ficam de fora.
 *
 *   - 100% só quando é tudo de verdade. Ver "100%" com espaço sobrando faz
 *     parar de escrever quem não precisava parar.
 *   - 0% só quando não há nada. Um turno já respondido que aparece como 0% diz
 *     que a conversa não começou.
 *
 * Entre as duas pontas o valor é truncado, e não arredondado: truncar nunca
 * empurra o número para uma ponta que ele não alcançou.
 *
 * Mora numa função só porque DOIS números da folha de medição são texto — a
 * fração da janela e o peso de cada parcela da repartição — e as travas valem
 * igual para os dois. Escritas duas vezes, uma delas perderia uma trava.
 */
function readablePercent(fraction: number): number {
  if (fraction <= 0) return 0;
  if (fraction >= 1) return 100;
  return Math.min(Math.max(Math.floor(fraction * 100), 1), 99);
}

/**
 * A fração da janela em número inteiro de por cento — ou `null` sem teto.
 *
 * As travas são as de `readablePercent`, e o `null` é o de `usedFraction`:
 * sem teto não há fração, e por isso não há por cento.
 */
export function usedPercent(usage: TokenUsage): number | null {
  const fraction = usedFraction(usage);
  if (fraction === null) return null;
  return readablePercent(fraction);
}

/**
 * Quanto ainda cabe — ou `null` quando não há teto.
 *
 * Nunca negativo: o que passou do teto não é "menos que nada de espaço", é
 * espaço nenhum. Quem precisa da notícia de que passou tem `isOverLimit`.
 */
export function remainingTokens(usage: TokenUsage): number | null {
  const limit = countable(usage.limit);
  if (limit === 0) return null;
  return Math.max(limit - usedTokens(usage), 0);
}

/**
 * O consumo passou do teto?
 *
 * ESTRITAMENTE MAIOR: encostar no teto é estar cheio, não é ter transbordado.
 * A função existe porque `usedFraction` recorta em 1 e `usedPercent` trava em
 * 100 — depois desse recorte, esta é a única coisa que ainda sabe a diferença
 * entre a janela cheia e a janela estourada.
 */
export function isOverLimit(usage: TokenUsage): boolean {
  const limit = countable(usage.limit);
  if (limit === 0) return false;
  return usedTokens(usage) > limit;
}

/**
 * Em que nível está a janela — ou `null` quando não há teto.
 *
 * `null` e não `normal`: sem teto não há "com folga", há "não se sabe". Devolver
 * o nível mais tranquilo para quem não mediu nada seria inventar uma boa
 * notícia.
 *
 * Os limiares são comparados com `>=`, exatos (decisão 2 do cabeçalho).
 */
export function budgetLevel(usage: TokenUsage): BudgetLevel | null {
  const fraction = usedFraction(usage);
  if (fraction === null) return null;
  if (fraction >= BUDGET_CRITICAL_AT) return 'critical';
  if (fraction >= BUDGET_WARNING_AT) return 'warning';
  return 'normal';
}

// ─── De onde veio ─────────────────────────────────────────────────────────────

/** A origem de uma parcela do consumo. */
export type BudgetOrigin = 'input' | 'output';

/** Na ordem em que a conversa produz uma e depois a outra. */
export const BUDGET_ORIGINS: readonly BudgetOrigin[] = ['input', 'output'] as const;

/** Uma parcela do consumo, com o peso dela no total. */
export interface BudgetShare {
  origin: BudgetOrigin;
  tokens: number;
  /** De 0 a 1, sobre o TOTAL CONSUMIDO — nunca sobre o teto. */
  fraction: number;
}

/**
 * A repartição do consumo por origem.
 *
 * O DENOMINADOR É O TOTAL CONSUMIDO, e nunca o teto (decisão 3 do cabeçalho).
 * "Quanto disto veio da pergunta e quanto veio da resposta" e "quanto disto
 * cabe na janela" são duas perguntas; misturá-las num denominador que troca
 * conforme houvesse teto faria o mesmo desenho significar duas coisas em duas
 * telas. Quem quer a segunda pergunta tem `usedFraction`.
 *
 * Com consumo zero as duas parcelas saem em zero, e não em `NaN`: dividir por
 * zero na tela é o defeito que `formatFileSize` já tinha aprendido a não
 * cometer, e aqui ele aconteceria na conversa que ainda não teve turno nenhum —
 * ou seja, sempre na primeira vez que alguém abre a peça.
 *
 * As duas parcelas saem SEMPRE, mesmo valendo zero. Sumir com a que zerou faria
 * a repartição mudar de forma entre um quadro e o seguinte, e uma legenda que
 * aparece e some é mais difícil de ler do que uma que fica em zero.
 */
export function budgetShares(usage: TokenUsage): BudgetShare[] {
  const tokens: Record<BudgetOrigin, number> = {
    input: countable(usage.input),
    output: countable(usage.output),
  };
  const total = tokens.input + tokens.output;

  return BUDGET_ORIGINS.map((origin) => ({
    origin,
    tokens: tokens[origin],
    fraction: total === 0 ? 0 : tokens[origin] / total,
  }));
}

// ─── De onde veio, por origem NOMEADA ─────────────────────────────────────────
//
// `budgetShares` reparte por DIREÇÃO — o que veio da pergunta e o que veio da
// resposta —, e as duas origens são fixas porque o vocabulário só conhece
// essas duas. A repartição por PROCEDÊNCIA é outra pergunta: instruções do
// sistema, histórico, anexos, resultados de ferramenta. Quantas origens existem
// e como se chamam é conhecimento de quem mediu, não do design system, e é por
// isso que aqui a origem é uma etiqueta e não um membro de união.
//
// O DENOMINADOR CONTINUA SENDO O TOTAL REPARTIDO, e nunca o teto — é a mesma
// decisão 3 do cabeçalho, e vale ainda com mais força aqui: esta repartição não
// pede teto nenhum para existir. É o que separa esta peça da irmã. "De onde
// veio" se responde sem saber quanto cabe.

/**
 * Uma origem nomeada do consumo, como quem mediu a produziu.
 *
 * O `id` é ENDEREÇO, e não texto de tela: a palavra que se lê é interface, tem
 * três idiomas e sai da `translations.json`, como a palavra de cada nível já
 * sai. Guardar aqui o nome traduzido faria a repartição mudar de conteúdo com o
 * idioma da foto.
 */
export interface ContextPart {
  id: string;
  tokens: number;
}

/** Uma origem com o peso dela na repartição. */
export interface ContextSlice {
  id: string;
  tokens: number;
  /** De 0 a 1, sobre o TOTAL REPARTIDO — nunca sobre o teto. */
  fraction: number;
  /** O mesmo peso em inteiro de por cento. Este número é TEXTO. */
  percent: number;
}

/**
 * O total repartido — a soma das parcelas, e o denominador de todas elas.
 *
 * Existe como função exportada, e não como um `reduce` de cada stack, porque é
 * ela que responde a pergunta "há o que repartir?". Zero é a conversa que ainda
 * não teve turno nenhum, e é o primeiro estado que qualquer tela mostra.
 */
export function contextTotal(parts: readonly ContextPart[]): number {
  let total = 0;
  for (const part of parts) total += countable(part.tokens);
  return total;
}

/**
 * A repartição do consumo por origem nomeada.
 *
 * NA ORDEM EM QUE CHEGARAM (decisão 4 do cabeçalho). Ordenar por peso faria a
 * legenda trocar de linha entre um turno e o seguinte, e quem lê a legenda a lê
 * por posição — a mesma repartição pareceria outra só porque uma parcela
 * cresceu.
 *
 * TODA PARCELA SAI, inclusive a que vale zero, e aqui isso é mais do que a
 * legenda estável de `budgetShares`: a fatia e a linha da legenda se emparelham
 * por POSIÇÃO para dividirem a mesma cor. Sumir com a parcela zerada
 * desalinharia as duas listas, e a cor da legenda passaria a apontar para a
 * fatia da vizinha — que é o pior defeito possível numa repartição, porque
 * continua parecendo certa.
 *
 * Com total zero as parcelas saem todas em zero, e não em `NaN`: dividir por
 * zero na tela é o defeito que `formatFileSize` já tinha aprendido a não
 * cometer, e aqui ele aconteceria sempre na primeira vez que alguém abre a
 * peça.
 */
export function contextSlices(parts: readonly ContextPart[]): ContextSlice[] {
  const total = contextTotal(parts);

  return parts.map((part) => {
    const tokens = countable(part.tokens);
    const fraction = total === 0 ? 0 : tokens / total;
    return { id: part.id, tokens, fraction, percent: readablePercent(fraction) };
  });
}
