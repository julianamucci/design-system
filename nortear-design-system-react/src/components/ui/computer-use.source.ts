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
 * A TELA ENTRA COMO NOME DE VARIÁVEL, e nunca montada por dentro da peça: ela é
 * espaço de quem consome (§1 da guideline 17), e um snippet que a compusesse
 * lá dentro ensinaria justamente o contrário do contrato. O que o snippet
 * mostra é o encaixe — `screen={tela}` —, com a declaração de uma linha ao
 * lado: nome citado sem declaração deixava quem copiava com um símbolo
 * indefinido. `computerUseScreenSource` é o ramo que abre o encaixe e explica o
 * texto alternativo.
 *
 * OS PASSOS ENTRAM RESUMIDOS a três, com o comentário dizendo que é resumo. A
 * sessão do exemplo tem seis, e despejá-los afogaria a chamada que o snippet
 * existe para ensinar.
 */
import { indentar, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { ComputerUse } from "@/components/ui/computer-use";';

const DEFAULT_URL = 'app.exemplo.com/entrar';

/**
 * Os rótulos, por inteiro — são dois, e o componente exige os dois.
 *
 * `address` é a palavra que apresenta o endereço, e só quem ouve a recebe:
 * sem ela, uma cadeia solta no começo da figura seria texto sem assunto.
 * `position` é MOLDE — `{index}` vira a posição do passo e `{total}` vira
 * quantos são —, porque a palavra que liga os dois números é do idioma.
 */
const LABELS_BLOCK = [
  'const rotulos = {',
  '  address: "Endereço",',
  '  position: "{index} de {total}",',
  '};',
].join('\n');

/**
 * A tela, em uma linha.
 *
 * O texto alternativo vazio é decisão, e a explicação inteira está no ramo que
 * abre o encaixe: a legenda ao lado já diz o que está acontecendo.
 */
const SCREEN_BLOCK = [
  '// A tela é ESPAÇO de quem consome: a peça nunca cria imagem nenhuma.',
  'const capturaDaSessao = "/capturas/sessao-de-entrada.png";',
  'const tela = <img src={capturaDaSessao} alt="" />;',
].join('\n');

/** Os passos de cada ramo, pelo nome com que o ramo os cita. */
const STEP_LISTS: Record<string, string[]> = {
  passos: [
    '// A sessão do exemplo tem seis passos — aqui, os três primeiros.',
    'const passos = [',
    '  { id: "aceitar", action: "Clicar", target: "Aceitar cookies", x: 78, y: 88 },',
    '  { id: "entrar", action: "Clicar", target: "Entrar", x: 86, y: 12 },',
    '  { id: "email", action: "Digitar", target: "o endereço de e-mail", x: 42, y: 38 },',
    '];',
  ],
  passosCurtos: [
    '// Uma sessão de dois passos, que é o começo de TODA sessão.',
    'const passosCurtos = [',
    '  { id: "abrir", action: "Abrir", target: "o painel de faturas", x: 18, y: 22 },',
    '  { id: "rolar", action: "Rolar", target: "até o fim da lista", x: 62, y: 70 },',
    '];',
  ],
};

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

/** O import, os passos do ramo, a tela e os rótulos. */
function preamble(stepsRef?: string): string {
  const parts = [IMPORT, ''];
  const list = stepsRef === undefined ? undefined : STEP_LISTS[stepsRef];
  if (list !== undefined) parts.push(list.join('\n'), '');
  parts.push(SCREEN_BLOCK, '', LABELS_BLOCK);
  return parts.join('\n');
}

function build(opts: ComputerUseSnippetOptions): string {
  return jsxSnippet(
    preamble(opts.stepsRef),
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
    [
      [IMPORT, 'import { RUN_STATUSES } from "@shared/primitives/chat-protocol";'].join('\n'),
      '',
      STEP_LISTS.passos.join('\n'),
      '',
      SCREEN_BLOCK,
      '',
      LABELS_BLOCK,
    ].join('\n'),
    [
      'RUN_STATUSES.map((status) => (',
      '  <ComputerUse',
      '    key={status}',
      `    url="${DEFAULT_URL}"`,
      // `tela`, e não `<Tela />`: a guarda de snippets cobra que toda tag de
      // inicial maiúscula seja importada ou declarada, e esta não era nenhuma
      // das duas — quem copiasse recebia um componente que não existe. As
      // outras cinco transforms deste arquivo já passavam a tela por variável.
      '    screen={tela}',
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
    [
      IMPORT,
      '',
      STEP_LISTS.passos.join('\n'),
      '',
      LABELS_BLOCK,
    ].join('\n'),
    [
      'const capturaDaSessao = "/capturas/sessao-de-entrada.png";',
      '',
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
 * passa uma para dentro da outra — cada uma com os SEUS rótulos.
 */
export function computerUseBesideRunSource(): string {
  return jsxSnippet(
    [
      [IMPORT, 'import { AgentStatus } from "@/components/ui/agent-status";'].join('\n'),
      '',
      STEP_LISTS.passos.join('\n'),
      '',
      SCREEN_BLOCK,
      '',
      LABELS_BLOCK,
      '',
      // A linha exige a palavra dos cinco estados: o tipo é `Record` completo
      // para que estado sem palavra reprove a compilação, em vez de desenhar
      // uma linha em branco. `action` fica de fora em espera e concluída.
      'const rotulosDaExecucao = {',
      '  status: {',
      '    idle: "Em espera",',
      '    running: "Respondendo",',
      '    stopped: "Interrompida",',
      '    complete: "Concluída",',
      '    failed: "Falhou",',
      '  },',
      '  action: { running: "Parar", stopped: "Retomar", failed: "Tentar de novo" },',
      '};',
    ].join('\n'),
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
    preamble('passos'),
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
