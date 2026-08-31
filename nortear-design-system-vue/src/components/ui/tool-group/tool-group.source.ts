/**
 * Transforms do painel Code do grupo de ferramentas.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve a caixa aberta por extenso, e é de
 * propósito: lá o control muda isso, e um snippet que omitisse a opção mentiria
 * sobre o que a story renderiza. Nas demais o que varia é a lista, e ela chega
 * por um nome que o leitor já viu no andaime.
 */
import {
  attrsMultilinha,
  indentar,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type ToolGroupArgs = {
  /** O nome da lista que entra no grupo, como o leitor a veria no código. */
  calls?: string;
  /** A caixa começa aberta? Só entra no snippet quando difere do padrão. */
  open?: boolean;
  /** O aviso tem para onde ir? */
  change?: boolean;
};

// O caminho é o do ÍNDICE da peça, e não o do arquivo interno: é assim que os
// componentes desta stack entram, e um snippet que ensinasse o atalho direto
// ensinaria a furar a única porta que a peça tem.
const IMPORT = "import { ToolGroup } from '@/components/ui/tool-group';";

const IMPORT_STATES = [
  IMPORT,
  "import { TOOL_CALL_STATES } from '@shared/primitives/chat-protocol';",
].join('\n');

const IMPORT_SPLIT = [
  IMPORT,
  "import { splitWaitingCalls } from '@shared/primitives/tool-group-summary';",
].join('\n');

/**
 * A tag do grupo, só com o que o exemplo precisa dizer.
 *
 * O aviso sai por EVENTO nesta stack, e por isso ele está aqui como
 * `@open-change`: quem abre é o navegador, e o componente só relata o que já
 * aconteceu. A caixa fechada é o padrão, e documentação não ensina a repetir o
 * padrão — só o que difere entra no snippet.
 */
function groupTag(opts: ToolGroupArgs): string {
  const attributes = attrsMultilinha([
    `:calls="${opts.calls ?? 'chamadas'}"`,
    ':labels="rotulos"',
    opts.open ? 'open' : undefined,
    opts.change === false ? undefined : '@open-change="registrar"',
  ]);
  return `<ToolGroup${attributes} />`;
}

function build(opts: ToolGroupArgs): string {
  return vueSnippet(IMPORT, groupTag(opts));
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
  const script = [
    IMPORT_STATES,
    '',
    'const chamadas = TOOL_CALL_STATES.map((state) => ({',
    '  name: `ferramenta_${state}`,',
    '  state,',
    '}));',
  ].join('\n');

  return vueSnippet(script, groupTag({ open: true, change: false }));
}

/** O grupo com uma falha, ainda recolhido — o que a peça existe para servir. */
export function toolGroupFailedSource(): string {
  return build({ calls: 'chamadasComFalha' });
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
 * O snippet mostra o ouvinte recebendo o NOVO estado, e não um pedido de troca:
 * quem abriu foi o navegador, e o componente só relata o que já aconteceu.
 */
export function toolGroupTogglingSource(): string {
  return build({});
}

/**
 * A chamada que espera por uma pessoa, FORA do grupo recolhido.
 *
 * O snippet ensina a separação, e não o filtro escrito à mão:
 * `splitWaitingCalls` vem do vocabulário compartilhado, e é o que impede cinco
 * condições com o mesmo literal solto dentro.
 */
export function toolGroupWaitingOutsideSource(): string {
  const script = [
    IMPORT_SPLIT,
    '',
    '// Pedir autorização dentro de uma caixa fechada é pedir sem mostrar.',
    'const { grouped, waiting } = splitWaitingCalls(chamadas);',
  ].join('\n');

  const body = [
    groupTag({ calls: 'waiting', open: true, change: false }),
    groupTag({ calls: 'grouped', change: false }),
  ].join('\n');

  return vueSnippet(
    script,
    `<div class="nds-stack nds-max-w-lg" data-spacing="sm">\n${indentar(body)}\n</div>`,
  );
}

/**
 * Onde o grupo mora: antes da resposta, e sem anunciar nada.
 *
 * As chamadas chegam enquanto o texto é gerado logo abaixo. Quem quiser
 * anunciar põe a região viva por fora, sabendo o que está fazendo.
 */
export function toolGroupBeforeAnswerSource(): string {
  const body = [
    '<!-- O grupo vem ANTES da resposta, e a resposta fica FORA da caixa. -->',
    groupTag({ change: false }),
    '<p>São 54 slugs de conteúdo compartilhado.</p>',
  ].join('\n');

  return vueSnippet(
    IMPORT,
    `<div class="nds-stack nds-max-w-lg" data-spacing="sm">\n${indentar(body)}\n</div>`,
  );
}
