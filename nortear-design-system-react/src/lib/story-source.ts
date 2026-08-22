/**
 * Ferramentas das transforms do painel Code (`*.source.ts` de cada componente).
 *
 * O painel imprime a árvore do `render` da story. Essa árvore usa andaime que só
 * existe no arquivo de story ou no módulo de fixtures — `<SlideCard />`,
 * `campo(...)`, `balaoDe(...)` —, então o snippet compila na cabeça de quem lê e
 * falha ao colar. Cada componente devolve o uso real por
 * `parameters.docs.source.transform`, declarado no `meta`: a transform do `meta`
 * cascateia para todas as stories do arquivo, e a da story vence a do `meta`.
 *
 * Nada daqui aparece no snippet: são só as costuras de montagem da string.
 */

/** Contexto que o Storybook entrega à transform. Só os args interessam. */
export type SourceCtx<A> = { args?: Partial<A> };

/**
 * Assinatura de uma transform. Os dois parâmetros são opcionais de propósito:
 * a guarda transversal chama cada função exportada SEM argumento, e só consegue
 * fazer isso se os padrões cobrirem a chamada vazia.
 */
export type SourceTransform<A> = (gerado?: string, ctx?: SourceCtx<A>) => string;

/**
 * Monta o snippet: bloco de imports (e estado, quando houver) seguido da
 * marcação, separados por uma linha em branco.
 *
 * Um cabeçalho vazio devolve só a marcação — há exemplos que são HTML puro com
 * classes `.nds-*` e não importam nada.
 */
export function jsxSnippet(cabecalho: string, markup: string): string {
  const topo = cabecalho.trim();
  const corpo = markup.trim();
  if (!topo) return corpo;
  return `${topo}\n\n${corpo}`;
}

/**
 * Junta atributos descartando os vazios, já com o espaço da frente — assim
 * `<Componente${attrs(...)} />` não deixa espaço sobrando quando nenhum
 * atributo difere do padrão.
 *
 * Só o que difere do padrão entra no snippet: repetir valor padrão ensina ruído
 * a quem copia.
 */
export function attrs(...partes: Array<string | false | null | undefined>): string {
  const lista = partes.filter((parte): parte is string => Boolean(parte) && parte !== '');
  return lista.length ? ` ${lista.join(' ')}` : '';
}

/**
 * Mesma junção de `attrs`, mas quebrando uma linha por atributo quando a fila
 * passa de `limite` caracteres — atributo em linha única longa demais some na
 * barra de rolagem do painel.
 */
export function attrsMultilinha(
  partes: Array<string | false | null | undefined>,
  indentacao = '  ',
  limite = 60,
): string {
  const lista = partes.filter((parte): parte is string => Boolean(parte) && parte !== '');
  if (!lista.length) return '';
  const inLine = lista.join(' ');
  if (inLine.length <= limite) return ` ${inLine}`;
  return `\n${lista.map((parte) => `${indentacao}${parte}`).join('\n')}\n`;
}

/**
 * Valor de string vindo dos args, e SÓ de string.
 *
 * O Storybook cria um espião para cada arg que casa com a regra de actions, e
 * esse espião chega aqui como FUNÇÃO. Interpolado, o corpo do mock aparece no
 * painel como se fosse código do design system. Qualquer coisa que não seja
 * string vira `undefined`, e `attrs` a descarta.
 */
export function texto(valor: unknown): string | undefined {
  if (typeof valor !== 'string') return undefined;
  const limpo = valor.trim();
  return limpo ? limpo : undefined;
}

/** `nome="valor"` quando o arg é string não vazia; nada em qualquer outro caso. */
export function propText(nome: string, valor: unknown): string | undefined {
  const conteudo = texto(valor);
  return conteudo === undefined ? undefined : `${nome}="${conteudo}"`;
}

/** `nome={42}` quando o arg é número finito. */
export function propNumber(nome: string, valor: unknown): string | undefined {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return undefined;
  return `${nome}={${valor}}`;
}

/**
 * Prop booleana: `nome` na forma abreviada quando `true`, `nome={false}` quando
 * o padrão do componente é `true` e a story desliga. Igual ao padrão, nada.
 */
export function propBool(nome: string, valor: unknown, padrao = false): string | undefined {
  if (typeof valor !== 'boolean' || valor === padrao) return undefined;
  return valor ? nome : `${nome}={false}`;
}

/**
 * Prop de união de strings: entra no snippet só quando difere do padrão, e só
 * quando o valor está entre os aceitos — control adulterado não vira atributo
 * inventado.
 */
export function propOption<T extends string>(
  nome: string,
  valor: unknown,
  aceitos: readonly T[],
  padrao?: T,
): string | undefined {
  if (typeof valor !== 'string') return undefined;
  if (!(aceitos as readonly string[]).includes(valor)) return undefined;
  if (padrao !== undefined && valor === padrao) return undefined;
  return `${nome}="${valor}"`;
}

/** Indenta cada linha não vazia com `prefixo`. Blocos aninhados em JSX. */
export function indentar(conteudo: string, prefixo = '  '): string {
  return conteudo
    .split('\n')
    .map((linha) => (linha.trim() ? `${prefixo}${linha}` : linha))
    .join('\n');
}

/**
 * Filho de texto do componente, quando o control o alimenta. Mesmo cuidado de
 * `texto`: espião de action vira `undefined`, e o chamador cai no seu padrão.
 */
export function childText(valor: unknown, padrao: string): string {
  return texto(valor) ?? padrao;
}
