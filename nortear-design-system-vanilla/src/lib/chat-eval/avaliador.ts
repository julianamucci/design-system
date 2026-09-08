/**
 * ─── Os critérios, todos verificáveis por máquina ────────────────────────────
 *
 * A REGRA DESTE ARQUIVO: nenhuma função aqui julga se a resposta "é boa".
 * Julgamento de qualidade sem critério é o que faz um banco de avaliação passar
 * verde para sempre — quem escreveu o banco lê a resposta, reconhece a própria
 * intenção nela, e aprova. Cada critério abaixo é uma pergunta com resposta
 * `sim` ou `não`, e cada um deles derruba um defeito CONCRETO que este chat já
 * cometeu.
 *
 * Módulo puro: sem rede, sem `fs`, sem relógio. É o que permite testá-lo em nó,
 * e é o que garante que o portão tenha dentes — ver `avaliador.test.ts`, que
 * planta cada defeito e exige que o critério reprove.
 */

import { normalize } from '../../../../docs/shared/primitives/docs-index';

/* ── 1. Acerto de recuperação ─────────────────────────────────────────────── */

/**
 * Este critério NÃO precisa de modelo: é `searchDocs` puro.
 *
 * Vale reparar no que isso significa para a comparação A × B: o recorte do
 * contexto acontece DEPOIS da recuperação, então as duas configurações
 * recuperam exatamente os mesmos slugs, com as mesmas notas. Se o recorte
 * estragar alguma coisa, não vai ser aqui — e é por isso que este critério
 * entra no relatório como CONTROLE, não como variável.
 */
export interface AcertoDeRecuperacao {
  /** Todo esperado apareceu (quando `exigeTodos`), ou pelo menos um apareceu. */
  ok: boolean;
  /** Os esperados que não vieram. Vazio quando `ok`. */
  faltando: string[];
  /** O primeiro colocado bate com o exigido? `null` quando o caso não exige ordem. */
  primeiroOk: boolean | null;
}

export function avaliarRecuperacao(
  slugsRecuperados: readonly string[],
  esperados: readonly string[],
  opcoes: { exigeTodos?: boolean; primeiro?: string } = {},
): AcertoDeRecuperacao {
  const faltando = esperados.filter((slug) => !slugsRecuperados.includes(slug));
  const ok =
    esperados.length === 0
      ? true // Nos negativos não há slug certo: quem julga é o critério de recusa.
      : opcoes.exigeTodos
        ? faltando.length === 0
        : faltando.length < esperados.length;
  return {
    ok,
    faltando,
    primeiroOk: opcoes.primeiro ? slugsRecuperados[0] === opcoes.primeiro : null,
  };
}

/* ── 2. Recusa ────────────────────────────────────────────────────────────── */

/**
 * As marcas de recusa, nas três línguas do corpus.
 *
 * ── POR QUE NÃO BASTA PROCURAR "não está" ──
 *
 * Porque "o item não está aberto" é uma resposta ÚTIL sobre o Accordion, e um
 * guarda que a lê como recusa reprova o chat funcionando. Um critério que erra
 * para os dois lados não mede nada. Então "não está" só conta quando vem
 * seguido, na mesma frase, de uma palavra que fala da DOCUMENTAÇÃO: "não está
 * nos trechos", "não está documentado".
 *
 * As formas soltas — "não sei", "não encontrei", "não existe" — não têm esse
 * problema: nenhuma delas aparece numa resposta que respondeu.
 *
 * O texto é comparado sem acento e sem caixa (`normalize` do índice), o que
 * cobre de graça quem escreve "nao sei".
 */
const MARCAS_DE_RECUSA: readonly RegExp[] = [
  // pt-BR
  /nao sei/,
  /nao encontr(ei|o|amos|ada|ado)/,
  /nao existe/,
  /nao consta/,
  /nao (esta|estao) (document|nos trech|na document|no corpus|disponi|presente|inclu)/,
  /nao (ha|havia) (document|informac|nada|mencao|referencia|nenhum)/,
  /(nao trazem|nao traz|nao mencionam|nao menciona|nao descrevem|nao descreve|nao documentam|nao documenta|nao cobrem|nao cobre|nao falam|nao fala)/,
  /nao (e|sao) (um |uma )?(componente|prop|propriedade)/,
  /nao faz parte/,
  /nao tenho (informac|document|dados)/,
  /fora do escopo/,
  /nenhum(a)? (dos trechos|informacao|documento|mencao)/,
  // en
  /i (don't|dont|do not) know/,
  /(not|isn't|isnt|is not) (documented|found|available|in the (excerpt|snippet|provided))/,
  /(does not|doesn't|doesnt) exist/,
  /no (information|documentation|mention|record) (about|on|of|for)/,
  /(couldn't|couldnt|could not|cannot|can't|cant) find/,
  /outside the scope/,
  // es
  /no (se|lo se)\b/,
  /no (encontre|encuentro|existe|consta)/,
  /no (esta|estan) (document|en los fragment|disponible)/,
  /no hay (informacion|documentacion|mencion|nada)/,
  /fuera del alcance/,
];

export interface VeredictoDeRecusa {
  recusou: boolean;
  /** A marca que casou, em texto. Serve para auditar a decisão do guarda. */
  marca: string | null;
}

export function detectarRecusa(resposta: string): VeredictoDeRecusa {
  const texto = normalize(resposta);
  for (const marca of MARCAS_DE_RECUSA) {
    const casa = marca.exec(texto);
    if (casa) return { recusou: true, marca: casa[0] };
  }
  return { recusou: false, marca: null };
}

/**
 * A resposta faz alguma AFIRMAÇÃO sobre um dos slugs esperados?
 *
 * ── POR QUE ISTO PRECISA EXISTIR AO LADO DA RECUSA ──
 *
 * MEDIDO na primeira rodada completa. À pergunta com erro de digitação "quais
 * os casos de uso do compute user?", o modelo respondeu:
 *
 * > **Não existe** um componente chamado "compute user" no Nortear Design
 * > System. O componente disponível na documentação é o ComputerUse
 * > (computer-use). Para o ComputerUse, os casos de uso são: …
 *
 * … e seguiu respondendo, certo, por quatro parágrafos. A marca "não existe"
 * disparou e o guarda reprovou **a melhor resposta da rodada**. Ela não recusou
 * nada: ela CORRIGIU o nome antes de responder, que é exatamente o que se quer.
 *
 * Tirar "não existe" da lista de marcas seria pior — é a marca que pega o caso
 * do Kubernetes. O que estava errado era a pergunta: "tem marca de recusa?" não
 * é o mesmo que "deixou de responder?". Nos casos positivos o que interessa é
 * o segundo, e ele se mede pela CITAÇÃO: a instrução de sistema obriga toda
 * afirmação a dizer de qual slug veio, então `(computer-use)` no texto é prova
 * mecânica de que houve afirmação sobre aquele componente.
 *
 * Nos negativos a citação não serve de nada — não há slug certo — e lá quem
 * julga continua sendo a marca de recusa.
 */
export function citaSlugEsperado(
  resposta: string,
  esperados: readonly string[],
): boolean {
  // MEDIDO na rodada B: o modelo escreveu "(`composer-voice`)" — a citação
  // certa, com a crase do markdown por dentro dos parênteses. O guarda
  // procurava "(composer-voice)" literal, não achou, e reprovou uma resposta
  // idêntica à da rodada A. A marcação do markdown é decoração; tirá-la antes
  // de comparar é o que impede o critério de medir formatação em vez de
  // conteúdo.
  const texto = normalize(resposta).replace(/[`*_]/g, '');
  // Duas formas valem: o slug (`(hover-card)`) e o nome do menu
  // (`(HoverCard)`). MEDIDO ao incluir `doDont`: o modelo citou pelo NOME e o
  // guarda reprovou uma comparação inteiramente correta entre ComputerUse e
  // HoverCard.
  //
  // A ambiguidade é da instrução de sistema, não do modelo: uma regra manda
  // citar pelo slug e outra manda escrever o nome em inglês. As duas
  // identificam o componente sem margem, então as duas passam aqui — e a regra
  // do prompt foi reescrita para parar de dar ordem dupla.
  // Todo grupo entre parênteses, quebrado por vírgula.
  //
  // MEDIDO no Gemma: ele citou "(Form, FormField, Textarea)" — VÁRIAS fontes
  // numa parênteses só —, e o guarda, que procurava um nome isolado, reprovou
  // uma resposta correta. Quinta vez que um critério deste banco acusa o certo.
  //
  // E era o pior tipo de erro para um banco de comparação: citar todas as
  // fontes de uma afirmação é comportamento MELHOR que citar uma, então o
  // critério penalizava justamente quem fazia mais direito. Um viés desses não
  // aparece no total — aparece como um modelo "pior" que os outros.
  const citados = new Set<string>();
  for (const grupo of texto.match(/\(([^()]*)\)/g) ?? []) {
    for (const item of grupo.slice(1, -1).split(',')) {
      const limpo = item.trim();
      if (limpo) citados.add(limpo);
    }
  }

  return esperados.some((slug) => {
    // `hover-card` e `HoverCard` normalizam para a mesma coisa quando se tira o
    // hífen — é isso que permite aceitar as duas formas de citação sem precisar
    // derivar o nome do menu aqui.
    const alvo = normalize(slug);
    const semHifen = alvo.replace(/-/g, '');
    return citados.has(alvo) || citados.has(semHifen);
  });
}

/* ── 2b. Negação de um termo específico ───────────────────────────────────── */

/**
 * A resposta NEGA que `termo` exista?
 *
 * ── POR QUE ESTE CRITÉRIO É SEPARADO DA RECUSA ──
 *
 * MEDIDO na primeira rodada: à pergunta sobre a prop inventada `autoClose`, o
 * modelo respondeu **"Não. O Alert não possui uma prop `autoClose` para sumir
 * sozinho (alert)"** — que é a resposta CERTA, e não casa com nenhuma marca de
 * recusa. E não deveria casar: "não possui" não é recusa, é resposta. Uma
 * recusa diz que a informação está fora do alcance; esta diz, com o documento
 * na mão, que a prop não existe.
 *
 * Pôr "não possui" na lista geral de recusa consertaria este caso e estragaria
 * outro: "o Badge não possui estado de foco" é uma resposta útil que o guarda
 * passaria a ler como recusa. Um critério que erra para os dois lados não mede.
 *
 * Então a pergunta muda de forma: em vez de "recusou?", **"negou ESTE termo?"**
 * — a negação tem de estar na MESMA frase em que o termo aparece. É o que
 * separa "não possui autoClose" de "autoClose serve para X; o Alert não é um
 * toast".
 *
 * A negação de "no" solto fica de fora de propósito: em português "no" é
 * preposição ("no Alert") e leria negação onde não há.
 */
const NEGACOES = [
  // pt-BR
  /\bnao\b/,
  /\bnenhum(a|as|os)?\b/,
  /\binexistente\b/,
  /\bnunca\b/,
  // en
  /\bnot\b/,
  /n't\b/,
  /\bno such\b/,
  /\bwithout\b/,
  // es
  /\bninguna?\b/,
  /\bno (existe|tiene|soporta|acepta|hay)\b/,
];

export interface VeredictoDeNegacao {
  negou: boolean;
  /** A frase que decidiu. Sem ela não dá para auditar o guarda. */
  frase: string | null;
}

export function negaExistencia(resposta: string, termo: string): VeredictoDeNegacao {
  const alvo = normalize(termo);
  for (const frase of normalize(resposta).split(/[.!?\n]+/)) {
    if (!frase.includes(alvo)) continue;
    if (NEGACOES.some((padrao) => padrao.test(frase))) return { negou: true, frase: frase.trim() };
  }
  return { negou: false, frase: null };
}

/* ── 3. Nome de componente traduzido ──────────────────────────────────────── */

/**
 * Os títulos traduzidos do corpus — os que o modelo NÃO pode usar como nome.
 *
 * 28 dos 84 slugs têm o título traduzido: `composer-voice` se chama "Ditado por
 * voz" no conteúdo em português, mas aparece como `ComposerVoice` no menu do
 * Storybook — e é por esse nome que a pessoa procura. Citar o título traduzido
 * manda a pessoa procurar uma coisa que não existe em menu nenhum.
 *
 * ── TRÊS EXCLUSÕES, e o porquê de cada uma ──
 *
 * 1. **Título de uma palavra só não entra.** "Tabela", "Botão", "Cartão" são
 *    palavras comuns do português: uma resposta correta sobre o DataTable usa
 *    "tabela" na prosa dez vezes, e o guarda a reprovaria. Um critério que
 *    reprova o comportamento certo é ruído, não portão.
 * 2. **Título que é só o nome do menu com espaço não entra.** "Context Menu"
 *    para `ContextMenu` não é tradução — é o mesmo nome, separado. Reprovar
 *    isso seria medir formatação, e não nome errado.
 * 3. **Se o nome em inglês está na resposta, não houve substituição.** MEDIDO
 *    na primeira rodada completa: o modelo escreveu "Para mostrar **o plano do
 *    agente** passo a passo, use o **AgentPlan**" — prosa que descreve o
 *    componente, seguida do nome certo. O guarda leu "Plano do agente" (título
 *    traduzido de `agent-plan`) e reprovou a resposta correta.
 *
 *    O defeito que interessa não é a frase coincidir com um título: é a pessoa
 *    ficar sem o nome pelo qual procurar. Com `AgentPlan` escrito ali, ela tem
 *    o nome. Sem ele, não tem — e é só esse caso que o guarda acusa agora.
 */
export interface TituloTraduzido {
  /** O título como está no conteúdo daquela língua. */
  titulo: string;
  /** O nome do menu, em inglês — a isenção da exclusão 3. */
  nome: string;
}

export function titulosTraduzidos(
  corpus: readonly { slug: string; title: string }[],
  nomeDeMenu: (slug: string) => string,
): TituloTraduzido[] {
  const saida: TituloTraduzido[] = [];
  for (const { slug, title } of corpus) {
    if (!title) continue;
    const menu = nomeDeMenu(slug);
    if (normalize(title) === normalize(menu)) continue;
    // "Context Menu" === "ContextMenu" sem os espaços: mesmo nome, não tradução.
    if (normalize(title).replace(/\s+/g, '') === normalize(menu)) continue;
    if (title.trim().split(/\s+/).length < 2) continue;
    saida.push({ titulo: title, nome: menu });
  }
  return saida;
}

/** Os títulos traduzidos que a resposta usou NO LUGAR do nome. Vazio é o esperado. */
export function nomesTraduzidosCitados(
  resposta: string,
  titulos: readonly TituloTraduzido[],
): string[] {
  const texto = normalize(resposta);
  return titulos
    .filter(({ titulo, nome }) => texto.includes(normalize(titulo)) && !resposta.includes(nome))
    .map(({ titulo }) => titulo);
}

/* ── 4. Nome de componente inventado ──────────────────────────────────────── */

/**
 * Nomes em PascalCase que a resposta citou e que não existem no catálogo.
 *
 * O catálogo é o conjunto dos diretórios de `docs/shared/content/`, convertidos
 * para o nome do menu — a mesma derivação que a função de servidor manda o
 * modelo usar. Qualquer PascalCase fora dele é candidato a invenção.
 *
 * ── AS TRÊS ISENÇÕES, e por que sem elas o guarda vira ruído ──
 *
 * 1. **Subcomponente.** `AlertTitle`, `AccordionItem`, `AlertDescription` são
 *    nomes legítimos, documentados na seção de props, e nenhum deles é
 *    diretório. A regra: começa com um nome do catálogo, e é isento.
 * 2. **Palavra de tecnologia.** `TypeScript`, `JavaScript`, `WebSocket`,
 *    `AbortController` são PascalCase e não são componentes de ninguém.
 * 3. **Termo do próprio texto.** Nomes que aparecem nos DOCUMENTOS recuperados
 *    não são invenção — o modelo os copiou de onde devia. Quem chama passa o
 *    contexto que foi ao prompt e o guarda desconta o que estava lá.
 *
 * Sem as três, o guarda acusaria a resposta certa e ninguém olharia para ele
 * de novo — que é como um portão morre.
 */
const PASCAL_CASE = /\b[A-Z][a-z0-9]+(?:[A-Z][A-Za-z0-9]*)+\b/g;

const NAO_SAO_COMPONENTES = new Set(
  [
    'TypeScript',
    'JavaScript',
    'JavaScriptbased',
    'WebSocket',
    'AbortController',
    'IntersectionObserver',
    'MutationObserver',
    'ResizeObserver',
    'ScreenReader',
    'DesignSystem',
    'ChromeOS',
    'MacOS',
    'IPhone',
    'VoiceOver',
    'GitHub',
    'CSSOM',
    'JSDoc',
    'HTMLElement',
    'ReadableStream',
  ].map((nome) => nome.toLowerCase()),
);

export function nomesInventados(
  resposta: string,
  catalogo: readonly string[],
  contextoDoPrompt = '',
): string[] {
  const conhecidos = catalogo.map((nome) => nome.toLowerCase());
  const noContexto = new Set(
    (contextoDoPrompt.match(PASCAL_CASE) ?? []).map((nome) => nome.toLowerCase()),
  );
  const achados = new Set<string>();

  for (const bruto of resposta.match(PASCAL_CASE) ?? []) {
    const nome = bruto.toLowerCase();
    if (conhecidos.includes(nome)) continue;
    if (NAO_SAO_COMPONENTES.has(nome)) continue;
    if (noContexto.has(nome)) continue;
    // Subcomponente: `AlertTitle` começa com `Alert`, que está no catálogo.
    if (conhecidos.some((conhecido) => nome.startsWith(conhecido))) continue;
    achados.add(bruto);
  }
  return [...achados];
}

/* ── 5. Nomes obrigatórios e proibidos, por caso ──────────────────────────── */

/** Os obrigatórios que a resposta NÃO citou. Vazio é o esperado. */
export function nomesObrigatoriosFaltando(
  resposta: string,
  obrigatorios: readonly string[] = [],
): string[] {
  return obrigatorios.filter((nome) => !resposta.includes(nome));
}

/**
 * Os proibidos que a resposta APRESENTOU COMO COMPONENTE.
 *
 * Não basta a frase aparecer. MEDIDO ao incluir `doDont`: o modelo escreveu
 * "Não use para ter uma conversa por voz com resposta falada — para isso NÃO HÁ
 * COMPONENTE", que é exatamente o comportamento correto, e o guarda reprovou
 * por casar o texto cru. Terceira vez que um critério deste banco acusou uma
 * resposta certa.
 *
 * O que se proíbe é o conceito virar PEÇA, e o modelo marca peça de um jeito
 * consistente: negrito ou crase. Frase solta em prosa é prosa. E negação por
 * perto — "não há componente", "não existe" — desfaz qualquer suspeita, porque
 * é justamente a resposta que se quer.
 */
export function nomesProibidosCitados(
  resposta: string,
  proibidos: readonly string[] = [],
): string[] {
  const texto = normalize(resposta);
  return proibidos.filter((nome) => {
    const alvo = normalize(nome);
    const em = texto.indexOf(alvo);
    if (em === -1) return false;

    // Janela em volta da ocorrência, e não a frase: a resposta que motivou esta
    // correção separava o termo da negação com um travessão — "conversa por voz
    // com resposta falada — para isso NÃO HÁ COMPONENTE" —, e quebrar por
    // pontuação jogava as duas metades em fragmentos diferentes.
    //
    // Cento e vinte caracteres cobrem a oração seguinte sem alcançar o próximo
    // item de uma lista, que é onde a negação deixaria de se referir a este
    // termo.
    const janela = texto.slice(Math.max(0, em - 60), em + alvo.length + 120);
    const negado = /nao ha componente|nao existe|nenhum componente|no component|nao e um componente/.test(
      janela,
    );
    return !negado;
  });
}
