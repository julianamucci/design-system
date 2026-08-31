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
 * sobre o que a story renderiza. Nas demais o que varia é a lista, e ela chega
 * por um nome que o leitor já viu nas fixtures.
 */
import { attrsMultilinha, jsxSnippet, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { ToolGroup } from "@/components/ui/tool-group";';

const ON_OPEN_CHANGE = 'onOpenChange={(aberto) => registrar(aberto)}';

export type ToolGroupSnippetOptions = {
  /** O nome da lista que entra no grupo, como o leitor a veria no código. */
  calls?: string;
  /** A caixa começa aberta? Só entra no snippet quando difere do padrão. */
  open?: boolean;
  /** O retorno tem para onde ir? */
  change?: boolean;
};

function build(opts: ToolGroupSnippetOptions): string {
  return jsxSnippet(
    IMPORT,
    `<ToolGroup${attrsMultilinha([
      `calls={${opts.calls ?? 'chamadas'}}`,
      'labels={rotulos}',
      // A caixa fechada é o padrão, e documentação não ensina a repetir o
      // padrão: só o que difere entra no snippet.
      opts.open === true ? 'open' : undefined,
      opts.change === false ? undefined : ON_OPEN_CHANGE,
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
 * O snippet ensina a ITERAR `TOOL_CALL_STATES` em vez de escrever a lista à
 * mão, que é o mesmo motivo de a constante existir: lista escrita à mão fica
 * para trás no dia em que o tipo cresce, e ninguém repara.
 */
export function toolGroupEveryStateSource(): string {
  return jsxSnippet(
    [IMPORT, 'import { TOOL_CALL_STATES } from "@shared/primitives/chat-protocol";'].join('\n'),
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
  return build({ calls: 'chamadasComFalha' });
}

/** O grupo em que tudo terminou bem. */
export function toolGroupDoneSource(): string {
  return build({ calls: 'chamadasConcluidas' });
}

/** O grupo que ainda corre. */
export function toolGroupRunningSource(): string {
  return build({ calls: 'chamadasEmCurso' });
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
    [
      IMPORT,
      'import { splitWaitingCalls } from "@shared/primitives/tool-group-summary";',
    ].join('\n'),
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
    IMPORT,
    [
      '<div className="nds-stack" data-spacing="sm">',
      '  <ToolGroup calls={chamadas} labels={rotulos} />',
      '  <p>Não publiquei o relatório: o destino recusou por falta de permissão de escrita.</p>',
      '</div>',
    ].join('\n'),
  );
}
