/**
 * Transforms do painel Code da tela do computador.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * fora do navegador — a saída do painel não chega ao DOM durante a `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o gerador
 * monta a tag a partir do nome interno da função compilada e publica
 * `<wrapper …/>`, que não é um componente que alguém possa importar.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet. O sufixo `Source` fica no FIM do nome de
 * propósito: a guarda que varre os construtores de snippet procura por ele ali,
 * e nome fora do padrão sai da varredura em silêncio.
 *
 * A TELA ENTRA COMO NOME DE TRECHO, e nunca por extenso. Ela é `Snippet` de quem
 * consome (§1 da guideline 17), e um snippet que a montasse por dentro ensinaria
 * justamente o contrário do contrato: que a peça sabe desenhar a tela. O que o
 * snippet mostra é o encaixe — `screen={tela}` — e, num dos casos, o que se põe
 * ali.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type ComputerUseSnippetOptions = {
  /** Em que pé está a sessão. */
  status?: string;
  /** O nome da constante com os passos. Ausente é "não houve passo nenhum". */
  stepsRef?: string;
  /** Qual passo está acontecendo agora. */
  activeIndex?: number;
  /** O endereço, por extenso. */
  url?: string;
};

/** O contexto que o painel Code entrega à transform. */
type StoryContext = {
  args?: { status?: string; activeIndex?: number; withSteps?: boolean };
};

const IMPORT = "import { ComputerUse } from '@/components/ui/computer-use';";
const IMPORT_RUN = "import { AgentStatus } from '@/components/ui/agent-status';";
const IMPORT_STATUSES = "import { RUN_STATUSES } from '@shared/primitives/chat-protocol';";

const DEFAULT_URL = 'app.exemplo.com/entrar';

/**
 * O encaixe da tela, e o que o exemplo declara para preenchê-lo.
 *
 * NOME LIGADO É NOME DECLARADO. O snippet mostrava `screen={tela}` sem que
 * `tela` existisse em lugar nenhum do bloco — e a peça NUNCA cria imagem, então
 * quem copiasse ficava com o encaixe vazio e sem saber onde ele se preenche. O
 * trecho vem ANTES de quem o usa: declarado depois, a referência aponta para o
 * nada.
 */
const BLOCO_DA_TELA = [
  '{#snippet tela()}',
  '  <!-- A imagem é de quem passa o trecho, e o texto alternativo também. -->',
  '  <img src={capturaDaSessao} alt="" />',
  '{/snippet}',
  '',
  '',
].join('\n');

/** As declarações do exemplo: os rótulos, a imagem e a lista de passos. */
function declaracoes(
  rotulos: string,
  stepsRef?: string,
  extras: string[] = [],
): string {
  return [
    `const ${rotulos} = { /* os rótulos da tela */ };`,
    "const capturaDaSessao = '/* o endereço da imagem da sessão */';",
    ...(stepsRef
      ? [
          '',
          '// Os passos são de quem conduz a sessão: o que foi feito, e onde.',
          `const ${stepsRef} = [/* os passos da sessão */];`,
        ]
      : []),
    ...extras,
  ].join('\n');
}

/** O `<script>` do exemplo: os imports e o que a marcação liga. */
function bloco(imports: string[], body: string): string {
  return [...imports, '', body].join('\n');
}

/** O uso real: o endereço, a tela, os passos, o índice, o estado e os rótulos. */
function build(opts: ComputerUseSnippetOptions): string {
  const attributes = attrsMultilinha([
    `url="${opts.url ?? DEFAULT_URL}"`,
    'screen={tela}',
    // Sem passo nenhum não há rastro nem legenda, e o snippet acompanha: passar
    // uma lista vazia e um índice ensinaria a apontar para um passo que não
    // existe.
    opts.stepsRef ? `steps={${opts.stepsRef}}` : false,
    opts.activeIndex === undefined ? false : `activeIndex={${opts.activeIndex}}`,
    `status="${opts.status ?? 'running'}"`,
    'labels={rotulos}',
  ]);

  return svelteSnippet(
    bloco([IMPORT], declaracoes('rotulos', opts.stepsRef)),
    `${BLOCO_DA_TELA}<ComputerUse${attributes} />`,
  );
}

/** Transform do `meta` — o Playground, que escreve os eixos por extenso. */
export function computerUseSource(_generated?: unknown, ctx?: StoryContext): string {
  const args = ctx?.args ?? {};
  return build({
    status: args.status,
    stepsRef: args.withSteps === false ? undefined : 'passos',
    activeIndex: args.withSteps === false ? undefined : args.activeIndex,
  });
}

/**
 * A moldura antes do primeiro toque.
 *
 * O caso em que a sessão ainda não tem passo: sobra o endereço e a tela. É o
 * estado que toda sessão atravessa, e o que mais escapa de quem só fotografa o
 * meio.
 */
export function computerUseWithoutStepsSource(): string {
  return build({ status: 'idle', stepsRef: undefined });
}

/** Enquanto o agente dirige: a peça se declara ocupada e a marca ativa pulsa. */
export function computerUseRunningSource(): string {
  return build({ status: 'running', activeIndex: 3 });
}

/**
 * Quando a sessão termina, e a marca para de pulsar.
 *
 * O estado não some do desenho por ser o último: ele decide se a marca ainda
 * pulsa, e marca que pulsa depois do fim diz que o agente continua trabalhando.
 */
export function computerUseFinishedSource(): string {
  return build({ status: 'complete', activeIndex: 5 });
}

/**
 * Os cinco estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `RUN_STATUSES` em vez de escrever a lista à mão, que
 * é o mesmo motivo de a constante existir: lista escrita à mão fica para trás no
 * dia em que o tipo cresce, e ninguém repara.
 */
export function computerUseEveryStatusSource(): string {
  const markup = [
    '<div class="nds-stack" data-spacing="lg">',
    '  {#each RUN_STATUSES as status (status)}',
    '    <ComputerUse',
    `      url="${DEFAULT_URL}"`,
    '      screen={tela}',
    '      steps={passos}',
    '      activeIndex={3}',
    '      {status}',
    '      labels={rotulos}',
    '    />',
    '  {/each}',
    '</div>',
  ].join('\n');

  return svelteSnippet(
    bloco([IMPORT, IMPORT_STATUSES], declaracoes('rotulos', 'passos')),
    `${BLOCO_DA_TELA}${markup}`,
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
 * Quem avança uma sessão incrementa um número, e o passo seguinte ao último é o
 * último — recusar deixaria a tela sem marca justamente quando a sessão acabou
 * de terminar.
 */
export function computerUseClampedSource(): string {
  return build({ status: 'complete', activeIndex: 99 });
}

/**
 * O que se põe na tela, e o texto alternativo que vem com ela.
 *
 * É o único snippet que abre o encaixe, e é o que a §1 da guideline 17 obriga a
 * ensinar: a peça nunca cria imagem, e o texto alternativo é de quem passa o
 * trecho. Vazio quando a legenda ao lado já diz o que está acontecendo.
 */
export function computerUseScreenSource(): string {
  const attributes = attrsMultilinha([
    `url="${DEFAULT_URL}"`,
    'screen={tela}',
    'steps={passos}',
    'activeIndex={3}',
    'status="running"',
    'labels={rotulos}',
  ]);

  const markup = [
    '{#snippet tela()}',
    '  <!--',
    '    Vazio de propósito: a legenda ao lado já diz o que está acontecendo, e',
    '    descrever a tela de outro produto ou repete a legenda ou narra coisa que',
    '    não é desta peça. Quando a tela carrega o que a legenda não diz, o texto',
    '    é obrigatório — e continua sendo de quem a passa.',
    '  -->',
    '  <img src={capturaDaSessao} alt="" />',
    '{/snippet}',
    '',
    `<ComputerUse${attributes} />`,
  ].join('\n');

  return svelteSnippet(
    bloco([IMPORT], declaracoes('rotulos', 'passos')),
    markup,
  );
}

/**
 * A tela abaixo da linha de estado da execução.
 *
 * Elas são AUTÔNOMAS e respondem a perguntas diferentes: uma diz em que pé está
 * a resposta inteira e carrega as ações de parar e repetir, a outra mostra onde
 * o agente está tocando. Por isso o snippet empilha as duas em sequência, e não
 * passa uma para dentro da outra.
 */
export function computerUseBesideRunSource(): string {
  const markup = [
    '<div class="nds-stack nds-max-w-md" data-spacing="sm">',
    '  <AgentStatus status="running" elapsed="0:42" labels={rotulosDaExecucao} />',
    '  <ComputerUse',
    `    url="${DEFAULT_URL}"`,
    '    screen={tela}',
    '    steps={passos}',
    '    activeIndex={3}',
    '    status="running"',
    '    labels={rotulos}',
    '  />',
    '</div>',
  ].join('\n');

  return svelteSnippet(
    bloco(
      [IMPORT, IMPORT_RUN],
      declaracoes('rotulos', 'passos', [
        '',
        'const rotulosDaExecucao = { /* os rótulos da linha de estado */ };',
      ]),
    ),
    `${BLOCO_DA_TELA}${markup}`,
  );
}

/**
 * A proporção do quadro, na folha de quem consome.
 *
 * Tela de telefone é retrato, e a peça não tem como saber. Entra como
 * propriedade personalizada num bloco de estilo, e não como altura em `style`
 * inline: é a única maneira de mudá-la sem tirar o valor do tema e da escala de
 * tipo. O `:global` é necessário porque a classe é da folha compartilhada, e a
 * especificidade tem de vencer a declaração que a própria folha faz no
 * elemento.
 */
export function computerUsePortraitSource(): string {
  const markup = [
    '<div data-retrato>',
    '  <ComputerUse',
    '    url="m.exemplo.com/entrar"',
    '    screen={tela}',
    '    steps={passos}',
    '    activeIndex={2}',
    '    status="running"',
    '    labels={rotulos}',
    '  />',
    '</div>',
    '',
    '<style>',
    '  /* A proporção do quadro, na folha de quem consome. */',
    '  [data-retrato] :global(.nds-computer-use) {',
    '    --computer-use-aspect: 9 / 16;',
    '  }',
    '</style>',
  ].join('\n');

  return svelteSnippet(
    bloco([IMPORT], declaracoes('rotulos', 'passos')),
    `${BLOCO_DA_TELA}${markup}`,
  );
}
