/**
 * Os passos de demonstração da tela do computador, uns só para as cinco.
 *
 * Mesma razão de `chat-examples.ts` e de `tool-group-examples.ts`, e a regra
 * está escrita na §3.3 da guideline 17: se cada stack escreve os próprios
 * passos, as cinco stories deixam de fotografar a mesma tela e a divergência só
 * aparece no Chromatic, como marca fora de lugar que ninguém consegue atribuir
 * a nada. Aqui isso pesa mais do que nas irmãs, porque o dado É posição: dois
 * pontos diferentes não são duas palavras diferentes, são duas fotos que não se
 * comparam.
 *
 * Nada de framework e nada de i18n: o verbo é o que o agente chamou a ação e o
 * alvo é o que ele diz ter tocado. O que a `translations.json` carrega são os
 * RÓTULOS da interface — a palavra que apresenta o endereço e o molde da
 * contagem —, não a fala.
 *
 * A TELA NÃO ESTÁ AQUI, e não pode estar. Ela é `HTMLElement` — DOM, que não
 * entra em primitivo compartilhado —, e é ESPAÇO de quem consome (§1 e §2 da
 * guideline 17). Cada stack monta a sua com os próprios primitivos; o que se
 * compartilha é onde as marcas caem sobre ela.
 *
 * ONDE ESTE ARQUIVO DEVERIA MORAR: a §3.3 pede um arquivo por FAMÍLIA
 * (`agent-run-examples.ts`), e é para lá que estas constantes vão quando a
 * família fechar. O nome por slug segue o precedente de `tool-group-examples.ts`
 * e tem o mesmo motivo mecânico — a família 2 está sendo construída por mais de
 * uma mão ao mesmo tempo, e um arquivo por família é exatamente o arquivo em
 * que duas mãos colidem.
 *
 * Derivado do catálogo Elements da assistant-ui (MIT).
 */

import type { ComputerStep } from './chat-protocol';

/**
 * A sessão padrão das demonstrações: entrar num sistema.
 *
 * Seis passos, e eles descem e sobem a tela de propósito — um rastro que só
 * andasse para a direita não mostraria que a marca aponta para um ponto, e não
 * para uma posição numa lista. O alvo do quarto passo é longo porque é ele que
 * exercita o corte da legenda.
 */
export const COMPUTER_STEPS_LOGIN: readonly ComputerStep[] = [
  { id: 'aceitar', action: 'Clicar', target: 'Aceitar cookies', x: 78, y: 88 },
  { id: 'entrar', action: 'Clicar', target: 'Entrar', x: 86, y: 12 },
  { id: 'email', action: 'Digitar', target: 'o endereço de e-mail', x: 42, y: 38 },
  {
    id: 'senha',
    action: 'Digitar',
    target: 'a senha guardada no cofre da equipe de plantão',
    x: 42,
    y: 52,
  },
  { id: 'lembrar', action: 'Marcar', target: 'Manter conectado', x: 26, y: 63 },
  { id: 'confirmar', action: 'Clicar', target: 'Continuar', x: 50, y: 74 },
];

/**
 * Uma sessão de dois passos, para o caso em que o rastro ainda não encheu.
 *
 * O rastro mostra no máximo três marcas, e a peça tem de desenhar bem quando há
 * menos do que isso — é o caso do começo de TODA sessão, e o que mais escapa
 * de quem só fotografa o meio.
 */
export const COMPUTER_STEPS_SHORT: readonly ComputerStep[] = [
  { id: 'abrir', action: 'Abrir', target: 'o painel de faturas', x: 18, y: 22 },
  { id: 'rolar', action: 'Rolar', target: 'até o fim da lista', x: 62, y: 70 },
];

/** O endereço da tela de demonstração. Fictício, e é escolha: ver a folha. */
export const COMPUTER_URL = 'app.exemplo.com/entrar';

/** O endereço longo, que é o que exercita o corte da barra. */
export const COMPUTER_URL_LONG =
  'app.exemplo.com/entrar?origem=assistente&destino=/relatorios/faturamento/2026/agosto';
