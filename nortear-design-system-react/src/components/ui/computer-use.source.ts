/**
 * Snippet do painel Code da tela do computador — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * fora do navegador, a única guarda que elas têm: a saída do painel não chega
 * ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento, e com o
 * sufixo `Source` no FIM do nome. Fábrica curried devolveria função em vez de
 * string, e as checagens que leem o snippet nunca chegariam ao snippet.
 *
 * A TELA ENTRA COMO NOME DE VARIÁVEL, e nunca por extenso. Ela é espaço de quem
 * consome (§1 da guideline 17), e um snippet que a montasse por dentro
 * ensinaria justamente o contrário do contrato: que a peça sabe desenhar a tela.
 * O que o snippet mostra é o encaixe — `screen={tela}` — e, num dos casos, o
 * que se põe ali.
 */
import { indentar, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { ComputerUse } from "@/components/ui/computer-use";';

const DEFAULT_URL = 'app.exemplo.com/entrar';

export type ComputerUseSnippetOptions = {
  /** Em que pé está a sessão. */
  status?: string;
  /** O nome da constante com os passos. */
  stepsRef?: string;
  /** Qual passo está acontecendo agora. */
  activeIndex?: number;
  /** O endereço, por extenso. */
  url?: string;
};

/** A tag, sempre com um atributo por linha. */
function tag(parts: Array<string | undefined>): string {
  const list = parts.filter((part): part is string => Boolean(part));
  return `<ComputerUse\n${list.map((part) => indentar(part)).join('\n')}\n/>`;
}

function build(opts: ComputerUseSnippetOptions): string {
  return jsxSnippet(
    IMPORT,
    tag([
      `url="${opts.url ?? DEFAULT_URL}"`,
      'screen={tela}',
      opts.stepsRef === undefined ? undefined : `steps={${opts.stepsRef}}`,
      opts.activeIndex === undefined ? undefined : `activeIndex={${opts.activeIndex}}`,
      `status="${opts.status ?? 'running'}"`,
      'labels={rotulos}',
    ]),
  );
}

/** Transform do `meta` — o Playground, que escreve os eixos por extenso. */
export const computerUseSource: SourceTransform<{
  status: string;
  activeIndex: number;
  withSteps: boolean;
}> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build({
    status: text(args.status),
    // Sem passo nenhum não há rastro nem legenda, e o snippet acompanha: passar
    // uma lista vazia e um índice ensinaria a apontar para um passo que não
    // existe.
    stepsRef: args.withSteps === false ? undefined : 'passos',
    activeIndex:
      args.withSteps === false || !Number.isFinite(args.activeIndex)
        ? undefined
        : args.activeIndex,
  });
};

/**
 * A moldura antes do primeiro toque.
 *
 * O caso em que a sessão ainda não tem passo: sobra o endereço e a tela. É o
 * estado que toda sessão atravessa, e o que mais escapa de quem só fotografa o
 * meio.
 */
export function computerUseWithoutStepsSource(): string {
  return build({ status: 'idle' });
}

/** Enquanto o agente dirige: a peça se declara ocupada e a marca ativa pulsa. */
export function computerUseRunningSource(): string {
  return build({ status: 'running', stepsRef: 'passos', activeIndex: 3 });
}

/**
 * Quando a sessão termina, e a marca para de pulsar.
 *
 * O estado não some do desenho por ser o último: ele decide se a marca ainda
 * pulsa, e marca que pulsa depois do fim diz que o agente continua trabalhando.
 */
export function computerUseFinishedSource(): string {
  return build({ status: 'complete', stepsRef: 'passos', activeIndex: 5 });
}

/**
 * Os cinco estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `RUN_STATUSES` em vez de escrever a lista à mão,
 * que é o mesmo motivo de a constante existir: lista escrita à mão fica para
 * trás no dia em que o tipo cresce, e ninguém repara.
 */
export function computerUseEveryStatusSource(): string {
  return jsxSnippet(
    [IMPORT, 'import { RUN_STATUSES } from "@shared/primitives/chat-protocol";'].join('\n'),
    [
      'RUN_STATUSES.map((status) => (',
      '  <ComputerUse',
      '    key={status}',
      `    url="${DEFAULT_URL}"`,
      '    screen={<Tela />}',
      '    steps={passos}',
      '    activeIndex={3}',
      '    status={status}',
      '    labels={rotulos}',
      '  />',
      '))',
    ].join('\n'),
  );
}

/**
 * O rastro no começo da sessão, quando ainda não há três marcas.
 *
 * O rastro mostra no máximo três, contando a ativa — e com um passo só há uma
 * marca. É o começo de toda sessão, e não um caso de borda.
 */
export function computerUseFirstStepSource(): string {
  return build({ status: 'running', stepsRef: 'passosCurtos', activeIndex: 0 });
}

/**
 * O índice preso ao alcance.
 *
 * Quem avança uma sessão incrementa um número, e o passo seguinte ao último é
 * o último — recusar deixaria a tela sem marca justamente quando a sessão
 * acabou de terminar.
 */
export function computerUseClampedSource(): string {
  return build({ status: 'complete', stepsRef: 'passos', activeIndex: 99 });
}

/**
 * O que se põe na tela, e o texto alternativo que vem com ela.
 *
 * É o único snippet que abre o encaixe, e é o que a §1 da guideline 17 obriga a
 * ensinar: a peça nunca cria imagem, e o texto alternativo é de quem passa o
 * nó. Vazio quando a legenda ao lado já diz o que está acontecendo.
 */
export function computerUseScreenSource(): string {
  return jsxSnippet(
    IMPORT,
    [
      '/* Vazio de propósito: a legenda ao lado já diz o que está acontecendo, e',
      '   descrever a tela de outro produto ou repete a legenda ou narra coisa',
      '   que não é desta peça. Quando a tela carrega o que a legenda não diz, o',
      '   texto é obrigatório — e continua sendo de quem a passa. */',
      'const tela = <img src={capturaDaSessao} alt="" />;',
      '',
      tag([
        `url="${DEFAULT_URL}"`,
        'screen={tela}',
        'steps={passos}',
        'activeIndex={3}',
        'status="running"',
        'labels={rotulos}',
      ]),
    ].join('\n'),
  );
}

/**
 * A tela abaixo da linha de estado da execução.
 *
 * Elas são AUTÔNOMAS e respondem a perguntas diferentes: uma diz em que pé está
 * a resposta inteira e carrega as ações de parar e repetir, a outra mostra onde
 * o agente está tocando. Por isso o snippet monta as duas em sequência, e não
 * passa uma para dentro da outra.
 */
export function computerUseBesideRunSource(): string {
  return jsxSnippet(
    [IMPORT, 'import { AgentStatus } from "@/components/ui/agent-status";'].join('\n'),
    [
      '<div className="nds-stack" data-spacing="sm">',
      '  <AgentStatus status="running" elapsed="0:42" labels={rotulosDaExecucao} />',
      indentar(
        tag([
          `url="${DEFAULT_URL}"`,
          'screen={tela}',
          'steps={passos}',
          'activeIndex={3}',
          'status="running"',
          'labels={rotulos}',
        ]),
      ),
      '</div>',
    ].join('\n'),
  );
}

/**
 * A proporção do quadro, na folha de quem consome.
 *
 * Tela de telefone é retrato, e a peça não tem como saber. Entra como
 * propriedade personalizada na FOLHA, e não como altura em `style`: é a única
 * maneira de mudá-la sem tirar o valor do tema e da escala de tipo.
 */
export function computerUsePortraitSource(): string {
  return jsxSnippet(
    IMPORT,
    [
      tag([
        'url="m.exemplo.com/entrar"',
        'screen={tela}',
        'steps={passos}',
        'activeIndex={2}',
        'status="running"',
        'labels={rotulos}',
      ]),
      '',
      '/* A proporção do quadro, na folha de quem consome. */',
      '.nds-computer-use {',
      '  --computer-use-aspect: 9 / 16;',
      '}',
    ].join('\n'),
  );
}
