/**
 * Snippet do painel Code do grupo de ferramentas — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve a caixa aberta por extenso, e é de
 * propósito: lá o control muda isso, e um snippet que omitisse a opção mentiria
 * sobre o que a story renderiza. Nas demais o que varia é a list, e ela chega
 * por um nome que o leitor já viu nas fixtures.
 */
import { attrsMultilinha, jsxSnippet, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { ToolGroup } from "@/components/ui/tool-group";';

const ON_OPEN_CHANGE = 'onOpenChange={(aberto) => registrar(aberto)}';

export type ToolGroupSnippetOptions = {
  /** O nome da list que entra no grupo, como o leitor a veria no código. */
  calls?: string;
  /** A caixa começa aberta? Só entra no snippet quando difere do padrão. */
  open?: boolean;
  /** O retorno tem para onde ir? */
  change?: boolean;
};

/**
 * Os rótulos, por INTEIRO.
 *
 * Não cabe resumir: `labels` é obrigatória e as duas palavras de estado são
 * `Record` completos — um objeto pela metade não compila para quem copia.
 *
 * `title` é FUNÇÃO, e não texto pronto: plural é decisão de idioma, e um
 * componente que escolhesse entre singular e plural escolheria por cinco
 * idiomas de uma vez. As duas escalas de palavra existem porque o RESUMO fala
 * do conjunto ("Algo falhou") e a LISTA fala de cada chamada ("Falhou").
 */
const LABELS_BLOCK = [
  'const rotulos = {',
  '  title: (count) => (count === 1 ? "1 ferramenta" : `${count} ferramentas`),',
  '  summary: {',
  '    pending: "Espera por você",',
  '    running: "Em curso",',
  '    done: "Concluído",',
  '    failed: "Algo falhou",',
  '  },',
  '  call: {',
  '    pending: "Esperando você",',
  '    running: "Em curso",',
  '    done: "Concluída",',
  '    failed: "Falhou",',
  '  },',
  '};',
].join('\n');

/**
 * O retorno ganha DECLARAÇÃO, e não só uma seta em linha.
 *
 * Guardar o que a pessoa abriu é de quem consome — o componente só relata o
 * que já aconteceu —, então o corpo fica vazio. O nome, porém, precisa
 * existir: `onOpenChange={(aberto) => registrar(aberto)}` sem `registrar` em
 * lugar nenhum entrega um `registrar is not defined` no primeiro clique.
 */
const CHANGE_HANDLER =
  'const registrar = (aberto) => { /* guardar o que se abriu é de quem consome */ };';

/**
 * As chamadas de cada exemplo, RESUMIDAS a três.
 *
 * Resumidas, e não elididas. O NOME muda por ramo porque é a LISTA que muda
 * entre os exemplos: o detalhe é campo de cada chamada, e não opção do grupo,
 * então o control que "tira o detalhe" na verdade troca a list inteira.
 */
function callsLines(ref: string): string {
  const semDetalhe = ref === 'chamadasSemDetalhe';
  const estados: Record<string, readonly string[]> = {
    chamadas: ['done', 'done', 'failed'],
    chamadasSemDetalhe: ['done', 'done', 'failed'],
    failedCalls: ['done', 'done', 'failed'],
    chamadasConcluidas: ['done', 'done', 'done'],
    chamadasEmCurso: ['done', 'running', 'pending'],
  };
  const nomes = ['buscar_documentos', 'ler_arquivo', 'publicar_relatorio'];
  const detalhes = [
    'Doze resultados em quatro repositórios.',
    'docs/shared/guidelines/17-componentes-conversacionais.md',
    'O destino recusou: falta permissão de escrita.',
  ];
  const list = estados[ref] ?? estados.chamadas!;
  return [
    '// Três chamadas de exemplo. O DETALHE é campo de cada uma, e não opção do',
    '// grupo: é por isso que tirá-lo troca a lista, e não uma propriedade.',
    `const ${ref} = [`,
    ...list.map((state, i) => {
      const campos = [`id: "c${i + 1}"`, `name: "${nomes[i]}"`, `state: "${state}"`];
      if (!semDetalhe) campos.push(`detail: "${detalhes[i]}"`);
      return `  { ${campos.join(', ')} },`;
    }),
    '];',
  ].join('\n');
}

/** O preâmbulo: o import e tudo que a chamada daquele ramo referencia. */
function preamble(imports: string, callsRef?: string, change = false): string {
  const partes = [imports, LABELS_BLOCK];
  if (callsRef) partes.push(callsLines(callsRef));
  if (change) partes.push(CHANGE_HANDLER);
  return partes.join('\n\n');
}

function build(opts: ToolGroupSnippetOptions): string {
  const calls = opts.calls ?? 'chamadas';
  const change = opts.change !== false;
  return jsxSnippet(
    preamble(IMPORT, calls, change),
    `<ToolGroup${attrsMultilinha([
      `calls={${calls}}`,
      'labels={rotulos}',
      // A caixa fechada é o padrão, e documentação não ensina a repetir o
      // padrão: só o que difere entra no snippet.
      opts.open === true ? 'open' : undefined,
      change ? ON_OPEN_CHANGE : undefined,
    ])} />`,
  );
}

/** Transform do `meta` — o Playground, que escreve a caixa por extenso. */
export const toolGroupSource: SourceTransform<{ open?: boolean; detail?: boolean }> = (
  _generated,
  ctx,
) => {
  const args = ctx?.args ?? {};
  return build({
    // O detalhe não é propriedade do grupo: é campo de cada chamada. Então o
    // control não troca uma opção, troca a LISTA — e o snippet diz isso pelo
    // nome dela, em vez de fingir uma opção que não existe.
    calls: args.detail === false ? 'chamadasSemDetalhe' : 'chamadas',
    open: args.open === true,
  });
};

/**
 * Os quatro estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `TOOL_CALL_STATES` em vez de escrever a list à
 * mão, que é o mesmo motivo de a constante existir: list escrita à mão fica
 * para trás no dia em que o tipo cresce, e ninguém repara.
 */
export function toolGroupEveryStateSource(): string {
  return jsxSnippet(
    preamble(
      [IMPORT, 'import { TOOL_CALL_STATES } from "@shared/primitives/chat-protocol";'].join('\n'),
    ),
    [
      'const chamadas = TOOL_CALL_STATES.map((state) => ({',
      '  name: `ferramenta_${state}`,',
      '  state,',
      '}));',
      '',
      '<ToolGroup calls={chamadas} labels={rotulos} open />',
    ].join('\n'),
  );
}

/** O grupo com uma falha, ainda recolhido — o caso que a peça existe para servir. */
export function toolGroupFailedSource(): string {
  return build({ calls: 'failedCalls', change: false });
}

/** O grupo em que tudo terminou bem. */
export function toolGroupDoneSource(): string {
  return build({ calls: 'chamadasConcluidas', change: false });
}

/** O grupo que ainda corre. */
export function toolGroupRunningSource(): string {
  return build({ calls: 'chamadasEmCurso', change: false });
}

/**
 * Abrir e fechar, e o aviso que sai das duas vezes.
 *
 * O snippet mostra o retorno recebendo o NOVO estado, e não um pedido de troca:
 * quem abriu foi o navegador, e o componente só relata o que já aconteceu.
 */
export function toolGroupTogglingSource(): string {
  return build({ calls: 'chamadas' });
}

/**
 * A chamada que espera por uma pessoa, FORA do grupo recolhido.
 *
 * O snippet ensina a separação, e não o filtro escrito à mão: `splitWaitingCalls`
 * vem do vocabulário compartilhado, e é o que impede cinco `if` com o mesmo
 * literal solto dentro.
 */
export function toolGroupWaitingOutsideSource(): string {
  return jsxSnippet(
    preamble(
      [
        IMPORT,
        'import { splitWaitingCalls } from "@shared/primitives/tool-group-summary";',
      ].join('\n'),
      'chamadas',
    ),
    [
      '// Pedir autorização dentro de uma caixa fechada é pedir sem mostrar.',
      'const { grouped, waiting } = splitWaitingCalls(chamadas);',
      '',
      '<div className="nds-stack" data-spacing="sm">',
      '  <ToolGroup calls={waiting} labels={rotulos} open />',
      '  <ToolGroup calls={grouped} labels={rotulos} />',
      '</div>',
    ].join('\n'),
  );
}

/**
 * Onde o grupo mora: antes da resposta, e sem anunciar nada.
 *
 * As chamadas chegam enquanto o texto é gerado logo abaixo. Quem quiser
 * anunciar põe a região viva por fora, sabendo o que está fazendo.
 */
export function toolGroupBeforeAnswerSource(): string {
  return jsxSnippet(
    preamble(IMPORT, 'chamadas'),
    [
      '<div className="nds-stack" data-spacing="sm">',
      '  <ToolGroup calls={chamadas} labels={rotulos} />',
      '  <p>Não publiquei o relatório: o destino recusou por falta de permissão de escrita.</p>',
      '</div>',
    ].join('\n'),
  );
}
