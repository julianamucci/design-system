/**
 * As chamadas de demonstração do grupo de ferramentas, umas só para as cinco.
 *
 * Mesma razão de `chat-examples.ts`, e a regra está escrita na §3.3 da
 * guideline 17: se cada stack escreve as próprias chamadas de exemplo, as cinco
 * stories deixam de fotografar a mesma tela e a divergência só aparece no
 * Chromatic, como diferença de largura que ninguém consegue atribuir a nada.
 *
 * Nada de framework e nada de i18n: o nome de uma ferramenta é o nome que o
 * agente chamou, e o detalhe é o que ela devolveu. O que a `translations.json`
 * carrega são os RÓTULOS da interface — o título do resumo e a palavra de cada
 * estado —, não a fala.
 *
 * ONDE ESTE ARQUIVO DEVERIA MORAR, e por que não mora lá ainda: a §3.3 pede um
 * arquivo por FAMÍLIA (`agent-run-examples.ts`), e é para lá que estas
 * constantes vão quando a segunda peça da família precisar delas. O nome por
 * slug é temporário e tem motivo mecânico — a família 2 está sendo construída
 * por mais de uma mão ao mesmo tempo, e um arquivo por família é exatamente o
 * arquivo em que duas mãos colidem.
 */

import type { ChatToolCall } from './chat-protocol';

/**
 * A execução que terminou com uma falha no meio.
 *
 * É o exemplo PADRÃO das demonstrações, e a escolha é a decisão da folha: o
 * grupo nasce recolhido, e a pergunta que a peça existe para responder é se
 * quem não abriu fica sabendo da falha. Um exemplo em que tudo deu certo não
 * faria essa pergunta.
 */
export const TOOL_CALLS_WITH_FAILURE: ChatToolCall[] = [
  {
    id: 'search',
    name: 'buscar_documentos',
    state: 'done',
    detail: 'Doze resultados em quatro repositórios.',
  },
  {
    id: 'read',
    name: 'ler_arquivo',
    state: 'done',
    detail: 'docs/shared/guidelines/17-componentes-conversacionais.md',
  },
  {
    id: 'publish',
    name: 'publicar_relatorio',
    state: 'failed',
    detail: 'O destino recusou: falta permissão de escrita.',
  },
];

/** A execução em que tudo deu certo — o resumo que não pede atenção. */
export const TOOL_CALLS_ALL_DONE: ChatToolCall[] = [
  {
    id: 'search',
    name: 'buscar_documentos',
    state: 'done',
    detail: 'Doze resultados em quatro repositórios.',
  },
  {
    id: 'read',
    name: 'ler_arquivo',
    state: 'done',
    detail: 'docs/shared/guidelines/17-componentes-conversacionais.md',
  },
];

/**
 * A execução ainda em curso.
 *
 * Uma já terminou e outra corre: é o caso em que o resumo tem de escolher, e a
 * escolha vem de `summarizeToolCalls` — grupo em que algo ainda corre não
 * terminou, por mais que quase tudo já tenha terminado.
 */
export const TOOL_CALLS_RUNNING: ChatToolCall[] = [
  {
    id: 'search',
    name: 'buscar_documentos',
    state: 'done',
    detail: 'Doze resultados em quatro repositórios.',
  },
  {
    id: 'index',
    name: 'indexar_resultados',
    state: 'running',
    detail: 'Quatro de doze.',
  },
];

/**
 * A chamada que espera por uma PESSOA.
 *
 * Ela vive fora das listas acima de propósito: `waitsForPerson` é verdadeiro só
 * em `pending`, e a decisão 3 da folha manda tirá-la do grupo. Está aqui para
 * que a composição possa mostrar COMO se tira — e para que a story de estados
 * possa desenhá-la, que é outra coisa: mostrar como ela é não é recomendar
 * onde pô-la.
 */
export const TOOL_CALL_WAITING: ChatToolCall = {
  id: 'grant',
  name: 'conceder_acesso',
  state: 'pending',
  detail: 'Vai gravar em docs/shared/. Precisa da sua autorização.',
};
