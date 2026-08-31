// Snippet do painel Code do grupo de ferramentas — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// O Playground é o único que escreve a caixa aberta por extenso, e é de
// propósito: lá o control muda isso, e um snippet que omitisse a opção mentiria
// sobre o que a story renderiza. Nas demais o que varia é a lista, e ela chega
// por um nome que o leitor já viu nas fixtures.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

export type ToolGroupSnippetOptions = {
  /** O nome da lista que entra no grupo, como o leitor a veria no código. */
  calls?: string;
  /** A caixa começa aberta? Só entra no snippet quando difere do padrão. */
  open?: boolean;
  /** O retorno tem para onde ir? */
  change?: boolean;
};

const ON_OPEN_CHANGE = '(aberto) => registrar(aberto)';

function build(opts: ToolGroupSnippetOptions): string {
  const lines = options([
    ['calls', opts.calls ?? 'chamadas'],
    ['labels', 'rotulos'],
    // A caixa fechada é o padrão, e documentação não ensina a repetir o padrão:
    // só o que difere entra no snippet.
    ['open', opts.open ? 'true' : undefined],
    ['onOpenChange', opts.change === false ? undefined : ON_OPEN_CHANGE],
  ]);

  return snippet(
    importing('tool-group', 'createToolGroup'),
    `const toolGroup = ${callLine('createToolGroup', lines)};`,
    appendLine('toolGroup'),
  );
}

/** Transform do `meta` — o Playground, que escreve a caixa por extenso. */
export const toolGroupSource: SourceTransform<{ open?: boolean; detail?: boolean }> = (_c, ctx) => {
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
 * O snippet ensina a ITERAR `TOOL_CALL_STATES` em vez de escrever a lista à
 * mão, que é o mesmo motivo de a constante existir: lista escrita à mão fica
 * para trás no dia em que o tipo cresce, e ninguém repara.
 */
export function toolGroupEveryStateSource(): string {
  return snippet(
    [
      importing('tool-group', 'createToolGroup'),
      "import { TOOL_CALL_STATES } from '@shared/primitives/chat-protocol';",
    ].join('\n'),
    [
      'const chamadas = TOOL_CALL_STATES.map((state) => ({',
      '  name: `ferramenta_${state}`,',
      '  state,',
      '}));',
      '',
      `const toolGroup = ${callLine('createToolGroup', options([
        ['calls', 'chamadas'],
        ['labels', 'rotulos'],
        ['open', 'true'],
      ]))};`,
    ].join('\n'),
    appendLine('toolGroup'),
  );
}

/** O grupo com uma falha, ainda recolhido — o caso que a peça existe para servir. */
export function toolGroupFailedSource(): string {
  return build({ calls: 'chamadasComFalha', change: false });
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
  return snippet(
    importing('tool-group', 'createToolGroup'),
    `const toolGroup = ${callLine('createToolGroup', options([
      ['calls', 'chamadas'],
      ['labels', 'rotulos'],
      ['onOpenChange', ON_OPEN_CHANGE],
    ]))};`,
    appendLine('toolGroup'),
  );
}

/**
 * A chamada que espera por uma pessoa, FORA do grupo recolhido.
 *
 * O snippet ensina a separação, e não o filtro escrito à mão: `splitWaitingCalls`
 * vem do vocabulário compartilhado, e é o que impede cinco `if` com o mesmo
 * literal solto dentro.
 */
export function toolGroupWaitingOutsideSource(): string {
  return snippet(
    [
      importing('tool-group', 'createToolGroup'),
      "import { splitWaitingCalls } from '@shared/primitives/tool-group-summary';",
    ].join('\n'),
    [
      '// Pedir autorização dentro de uma caixa fechada é pedir sem mostrar.',
      'const { grouped, waiting } = splitWaitingCalls(chamadas);',
      '',
      `const aVista = ${callLine('createToolGroup', options([
        ['calls', 'waiting'],
        ['labels', 'rotulos'],
        ['open', 'true'],
      ]))};`,
      '',
      `const recolhido = ${callLine('createToolGroup', options([
        ['calls', 'grouped'],
        ['labels', 'rotulos'],
      ]))};`,
    ].join('\n'),
    "document.querySelector('#app')?.append(aVista, recolhido);",
  );
}

/**
 * Onde o grupo mora: antes da resposta, e sem anunciar nada.
 *
 * As chamadas chegam enquanto o texto é gerado logo abaixo. Quem quiser
 * anunciar põe a região viva por fora, sabendo o que está fazendo.
 */
export function toolGroupBeforeAnswerSource(): string {
  return snippet(
    importing('tool-group', 'createToolGroup'),
    [
      `const toolGroup = ${callLine('createToolGroup', options([
        ['calls', 'chamadas'],
        ['labels', 'rotulos'],
      ]))};`,
      '',
      "const resposta = document.createElement('p');",
      `resposta.textContent = ${text('São 54 slugs de conteúdo compartilhado.')};`,
    ].join('\n'),
    "document.querySelector('#app')?.append(toolGroup, resposta);",
  );
}
