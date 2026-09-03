/**
 * Transforms do painel Code da tela do computador.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * A TELA ENTRA PELO ENCAIXE, e nunca por extenso. Ela é ESPAÇO de quem consome
 * (§1 da guideline 17), e um snippet que a montasse por dentro ensinaria
 * justamente o contrário do contrato: que a peça sabe desenhar a tela. O que o
 * snippet mostra é o slot nomeado — e, num deles, o que se põe ali e com que
 * texto alternativo.
 */
import { indentar, text, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type ComputerUseSnippetOptions = {
  /** Em que pé está a sessão. */
  status?: string;
  /** O nome da constante com os passos. */
  stepsRef?: string;
  /** Qual passo está acontecendo agora. */
  activeIndex?: number;
  /** O endereço, por extenso. */
  url?: string;
  /** O que se põe no espaço da tela. */
  screen?: string;
};

// O caminho é o do ÍNDICE da peça, e não o do arquivo interno: é assim que os
// componentes desta stack entram, e um snippet que ensinasse o atalho direto
// ensinaria a furar a única porta que a peça tem.
const IMPORT = "import { ComputerUse } from '@/components/ui/computer-use';";

const IMPORT_STATUSES = [
  IMPORT,
  "import { RUN_STATUSES } from '@shared/primitives/chat-protocol';",
].join('\n');

const IMPORT_BESIDE = [
  "import { AgentStatus } from '@/components/ui/agent-status';",
  IMPORT,
].join('\n');

const DEFAULT_URL = 'app.exemplo.com/entrar';

/**
 * O que o exemplo DECLARA, e não só o que ele importa.
 *
 * `:labels="rotulos"` e `:steps="passos"` nomeiam coisas de quem consome, e
 * nenhum exemplo as declarava: quem copiasse recebia um `labels` indefinido e
 * um rastro sobre uma lista que não existe. O rastro é o dado desta peça —
 * quatro campos por passo, e a coordenada é de quem monta, nunca da peça.
 */
const ROTULOS = [
  'const rotulos = {',
  "  address: 'Endereço',",
  "  position: '{index} de {total}',",
  '};',
].join('\n');

const PASSOS = [
  'const passos = [',
  "  { action: 'Abrir', target: 'a página de entrada', x: 50, y: 18 },",
  "  { action: 'Digitar', target: 'o endereço de e-mail', x: 38, y: 42 },",
  "  { action: 'Digitar', target: 'a senha', x: 38, y: 54 },",
  "  { action: 'Clicar', target: 'Entrar', x: 50, y: 68 },",
  "  { action: 'Esperar', target: 'a página inicial', x: 50, y: 30 },",
  "  { action: 'Clicar', target: 'Relatórios', x: 22, y: 24 },",
  '];',
].join('\n');

/** Os rótulos da LINHA DE ESTADO, a irmã autônoma que entra num dos exemplos. */
const ROTULOS_DA_EXECUCAO = [
  'const rotulosDaExecucao = {',
  "  status: { idle: 'Em espera', running: 'Respondendo', stopped: 'Interrompida', complete: 'Concluída', failed: 'Falhou' },",
  "  action: { running: 'Parar', stopped: 'Retomar', failed: 'Tentar de novo' },",
  '};',
].join('\n');

/** A imagem que preenche o espaço da tela — de quem consome, e nunca da peça. */
const CAPTURA = [
  '// A tela é ESPAÇO de quem consome: a peça nunca cria imagem, e o endereço',
  '// dela sai daqui.',
  "const capturaDaSessao = '/capturas/sessao-atual.png';",
].join('\n');

/** O `<script setup>` de cada exemplo: o que importa e o que declara. */
const SETUP = [IMPORT, '', ROTULOS, '', PASSOS].join('\n');
const SETUP_STATUSES = [IMPORT_STATUSES, '', ROTULOS, '', PASSOS].join('\n');
const SETUP_BESIDE = [IMPORT_BESIDE, '', ROTULOS, '', ROTULOS_DA_EXECUCAO, '', PASSOS].join('\n');

/**
 * O `<script setup>` que cada configuração precisa.
 *
 * A captura só entra quando o exemplo abre o espaço da tela com uma imagem:
 * declarar o endereço num exemplo que não o usa ensinaria que a peça precisa
 * dele, e ela não precisa.
 */
function setupFor(opts: ComputerUseSnippetOptions): string {
  const withImage = opts.screen?.includes('capturaDaSessao') === true;
  return withImage ? [SETUP, '', CAPTURA].join('\n') : SETUP;
}

/** A tela de quem consome, no encaixe. Um nome, e não a montagem por extenso. */
const DEFAULT_SCREEN = '<TelaDaSessao />';

/** O espaço da tela, sempre pelo slot nomeado. */
function screenSlot(screen: string): string {
  return ['<template #screen>', indentar(screen), '</template>'].join('\n');
}

/**
 * A tag da peça, com um atributo por linha e a tela no encaixe.
 *
 * Ela não tem evento nenhum: a peça não oferece ação — parar e repetir são do
 * estado da execução —, então o snippet é só o que ela recebe e o espaço que
 * ela abre.
 */
function computerUseTag(opts: ComputerUseSnippetOptions): string {
  const attributes = [
    `url="${text(opts.url ?? DEFAULT_URL)}"`,
    opts.stepsRef === undefined ? undefined : `:steps="${opts.stepsRef}"`,
    // Sem passo nenhum não há rastro nem legenda, e o snippet acompanha: passar
    // um índice sem lista ensinaria a apontar para um passo que não existe.
    opts.stepsRef === undefined || opts.activeIndex === undefined
      ? undefined
      : `:active-index="${opts.activeIndex}"`,
    `status="${text(opts.status, 'running')}"`,
    ':labels="rotulos"',
  ].filter((part): part is string => Boolean(part));

  return [
    '<ComputerUse',
    ...attributes.map((part) => indentar(part)),
    '>',
    indentar(screenSlot(opts.screen ?? DEFAULT_SCREEN)),
    '</ComputerUse>',
  ].join('\n');
}

function build(opts: ComputerUseSnippetOptions): string {
  return vueSnippet(setupFor(opts), computerUseTag(opts));
}

/** Transform do `meta` — o Playground, que escreve os eixos por extenso. */
export const computerUseSource: SourceTransform<{
  status: string;
  activeIndex: number;
  withSteps: boolean;
}> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build({
    status: args.status,
    stepsRef: args.withSteps === false ? undefined : 'passos',
    activeIndex: args.withSteps === false ? undefined : args.activeIndex,
  });
};

/**
 * A moldura antes do primeiro toque.
 *
 * Quando a sessão ainda não tem passo, sobra o endereço e a tela. É o estado
 * que toda sessão atravessa, e o que mais escapa de quem só fotografa o meio.
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
  return vueSnippet(
    SETUP_STATUSES,
    [
      '<ComputerUse',
      '  v-for="status in RUN_STATUSES"',
      '  :key="status"',
      `  url="${text(DEFAULT_URL)}"`,
      '  :steps="passos"',
      '  :active-index="3"',
      '  :status="status"',
      '  :labels="rotulos"',
      '>',
      indentar(screenSlot(DEFAULT_SCREEN)),
      '</ComputerUse>',
    ].join('\n'),
  );
}

/**
 * O rastro no começo da sessão, quando ainda não há três marcas.
 *
 * O rastro mostra no máximo três, contando a ativa — e com um passo só há uma
 * marca. É o começo de toda sessão, e não uma borda.
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
 * ensinar: a peça nunca cria imagem, e o texto alternativo é de quem preenche o
 * espaço. Vazio quando a legenda ao lado já diz o que está acontecendo.
 */
export function computerUseScreenSource(): string {
  const screen = [
    '<!-- Vazio de propósito: a legenda ao lado já diz o que está acontecendo,',
    '     e descrever a tela de outro produto ou repete a legenda ou narra',
    '     coisa que não é desta peça. Quando a tela carrega o que a legenda não',
    '     diz, o texto é obrigatório — e continua sendo de quem a põe aqui. -->',
    '<img',
    '  :src="capturaDaSessao"',
    '  alt=""',
    '>',
  ].join('\n');

  return build({ status: 'running', stepsRef: 'passos', activeIndex: 3, screen });
}

/**
 * A tela abaixo da linha de estado da execução.
 *
 * Elas são AUTÔNOMAS e respondem a perguntas diferentes: uma diz em que pé está
 * a resposta inteira e carrega as ações de parar e repetir, a outra mostra onde
 * o agente está tocando. Por isso o snippet monta as duas como irmãs, e não
 * passa uma para dentro da outra.
 */
export function computerUseBesideRunSource(): string {
  const body = [
    '<AgentStatus status="running" elapsed="0:42" :labels="rotulosDaExecucao" />',
    computerUseTag({ status: 'running', stepsRef: 'passos', activeIndex: 3 }),
  ].join('\n');

  return vueSnippet(
    SETUP_BESIDE,
    `<div class="nds-stack nds-max-w-md" data-spacing="sm">\n${indentar(body)}\n</div>`,
  );
}

/**
 * A proporção do quadro, na folha de quem consome.
 *
 * Tela de telefone é retrato, e a peça não tem como saber. Entra como
 * propriedade personalizada, e não como altura em `style`: é a única maneira de
 * mudá-la sem tirar o valor do tema e da escala de tipo.
 */
export function computerUsePortraitSource(): string {
  const stylesheet = [
    '<style>',
    '/* A proporção do quadro, na folha de quem consome. */',
    '.nds-computer-use {',
    '  --computer-use-aspect: 9 / 16;',
    '}',
    '</' + 'style>',
  ].join('\n');

  return [
    build({
      url: 'm.exemplo.com/entrar',
      status: 'running',
      stepsRef: 'passos',
      activeIndex: 2,
    }),
    stylesheet,
  ].join('\n\n');
}
