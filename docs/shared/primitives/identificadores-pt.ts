/**
 * Identificadores que ainda estão em português, e o motivo de cada um seguir
 * assim.
 *
 * A campanha de tradução aplicou 2384 nomes em nove lotes por varredura. O que
 * restou não é resto mecânico: é o que uma varredura não pode decidir — nome
 * cujo alvo em inglês já existe no mesmo arquivo com outro sentido, nome que
 * significa duas coisas em dois lugares, nome cujo alvo natural é palavra
 * reservada.
 *
 * Esta lista existe para que a decisão apareça no lugar certo. O auditor cobra
 * `identificador_pt` por componente, então quem revisa um componente vê os
 * nomes DELE — em vez de um backlog global que ninguém lê.
 *
 * **Como fechar um item:** renomeie e tire daqui. A lista encolhe; quando
 * esvaziar, a regra fica calada sozinha.
 *
 * **Como declarar que um nome FICA:** mova para `MANTIDOS` com o motivo. Aqui
 * vale a mesma regra do vocabulário da sidebar — decisão declarada vale mais
 * que decisão inferida, e o auditor não distingue "ainda não decidi" de "decidi
 * que fica" se ninguém escrever qual dos dois é.
 */

/** Nome em português → por que a varredura não pôde traduzir sozinha. */
export const PENDENTES: Record<string, string> = {
  padrao:
    'ambíguo: ora é o elemento padrão numa story, ora o rótulo de fallback no slider — e `default` é palavra reservada',
  padrão: 'mesma decisão de `padrao`, com acento',
  novo: 'polissêmico: elemento recém-montado nas stories, e no AccordionDocs a chave de rótulo que significa *Novo* — `new` é palavra reservada',
  teclar: 'a recomposição fundia com `tipo` num só `type`; o alvo certo é `onKey`, mas o nome aparece em contextos que pedem leitura',
  com: 'não é identificador: aparece em comentário e dentro de `figma.com`',
  estilo: 'colide com o prop `style` do Svelte no aspect-ratio',
  densidade: 'colide com uma variável `density` já existente no preview.ts',
  canal: 'colide com `channel` no preview.ts',
  seletores: 'colide com `selectors` no preview.ts',
  meses: 'colide com `months` no calendar.svelte',
  anos: 'colide com `years` no calendar.svelte',
};

/**
 * Nome em português que FICA, e por quê.
 *
 * Vazio por enquanto — nenhum caso apareceu ainda. Quando aparecer, o motivo é
 * obrigatório: é o que separa "decidido" de "esquecido".
 */
export const MANTIDOS: Record<string, string> = {};
