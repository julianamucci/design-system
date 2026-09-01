/**
 * As citações de demonstração da marca em linha, uma só para as cinco stacks.
 *
 * Mesma razão do `chat-examples.ts`, e o mesmo degrau: aqui o exemplo não é só
 * dado, é o CONTRATO da demonstração. Um título diferente numa cópia e as cinco
 * stories deixam de fotografar a mesma tela — e a divergência só apareceria no
 * Chromatic, como diferença de largura de caixa que ninguém consegue atribuir a
 * nada.
 *
 * Nada de framework e nada de i18n: o texto é o mesmo nos três idiomas da
 * documentação. O que a `translations.json` carrega são os RÓTULOS da interface
 * — a palavra para "fonte", o que se diz no lugar de um endereço recusado —,
 * não a fala da citação.
 *
 * OS TRÊS CASOS CAEM EXATAMENTE ONDE A PEÇA DECIDE ALGO, e não em três variações
 * do mesmo caso: um traz a citação inteira, um traz só a fonte, e um traz um
 * endereço que não pode virar link. Exemplo que evita a borda é exemplo que
 * nunca mostra a regra.
 */

import type { Citation } from './chat-protocol';

/**
 * A citação completa: fonte, trecho e o lugar dentro dela.
 *
 * É o caso que mostra a caixa inteira, e é ele que prova por que o trecho mora
 * na CITAÇÃO e não na fonte — a irmã logo abaixo aponta para o mesmo documento
 * sem trecho nenhum, e o documento aparece uma vez só na lista de fontes.
 */
export const CITACAO_COMPLETA: Citation = {
  source: {
    title: 'Relatório anual de operações',
    url: 'https://exemplo.test/relatorios/2025/operacoes',
  },
  excerpt:
    'A receita cresceu doze por cento em relação ao ano anterior, puxada quase toda pela faixa corporativa.',
  anchor: 'Página 12',
};

/**
 * A citação mínima: só a fonte.
 *
 * Citar um documento sem saber a página é caso REAL, e a caixa responde não
 * montando o que não veio — nunca um traço no lugar dele. É a borda que quem só
 * testar com dado cheio jamais encontra.
 */
export const CITACAO_MINIMA: Citation = {
  source: {
    title: 'Nota metodológica da pesquisa',
    url: 'https://exemplo.test/metodo',
  },
};

/**
 * A citação cujo ENDEREÇO NÃO PODE VIRAR LINK.
 *
 * Endereço de fonte é escrito por quem gerou a resposta, e `javascript:` num
 * `href` executa. O exemplo existe para que a demonstração mostre a decisão em
 * vez de descrevê-la: o título continua legível, e o que sai é o link.
 */
export const CITACAO_RECUSADA: Citation = {
  source: {
    title: 'Anexo enviado pelo agente',
    // Não é um endereço: é o que uma resposta gerada pode devolver quando
    // ninguém filtrou o que ela escreve.
    url: 'javascript:alert(1)',
  },
  excerpt: 'O anexo cita a mesma faixa corporativa, sem dizer de onde tirou o número.',
};

/**
 * A frase da demonstração, partida onde as marcas entram.
 *
 * PARTIDA, e não uma cadeia com lugares reservados: quem monta intercala os
 * pedaços com as marcas, que é exatamente o que a peça pede de quem escreve a
 * frase — e é a correção que ela faz na fonte, onde o parágrafo era fixo dentro
 * do arquivo instalado.
 *
 * NENHUM PEDAÇO TERMINA EM ESPAÇO, e isso é o assunto de uma das regras de uso:
 * sem espaço antes dela, a marca não se separa da palavra que a antecede quando
 * a linha quebra. O espaço que existe vem DEPOIS da marca, no começo do pedaço
 * seguinte.
 */
export const FRASE_COM_CITACOES: readonly string[] = [
  'A receita cresceu doze por cento no último ano',
  ', e a metodologia por trás do número está publicada',
  '.',
];
