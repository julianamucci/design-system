/**
 * Transforms do painel Code do uso do contexto.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve a medição inteira por extenso, e é de
 * propósito: lá os controls mudam consumo, teto e forma, e um snippet que
 * mostrasse só o nome de uma constante mentiria sobre o que a story renderiza.
 * Nas demais o que varia é o caso, e ele continua literal porque é o assunto da
 * story.
 */
import {
  attrsMultilinha,
  indentar,
  text,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type ContextDisplayArgs = {
  /** Consumido pela pergunta. */
  input?: number;
  /** Consumido pela resposta. */
  output?: number;
  /** Teto da janela. Ausente quando não se sabe qual é. */
  limit?: number;
  /** Como desenhar o mesmo número. */
  form?: string;
};

// O caminho é o do ÍNDICE da peça, e não o do arquivo interno: é assim que os
// componentes desta stack entram, e um snippet que ensinasse o atalho direto
// ensinaria a furar a única porta que a peça tem.
const IMPORT = "import { ContextDisplay } from '@/components/ui/context-display';";

const IMPORT_FORMS = [
  "import {",
  '  ContextDisplay,',
  '  CONTEXT_DISPLAY_FORMS,',
  "} from '@/components/ui/context-display';",
].join('\n');

const IMPORT_BUDGET = [
  IMPORT,
  "import { budgetLevel } from '@shared/primitives/token-budget';",
].join('\n');

const IMPORT_BESIDE = [
  IMPORT,
  "import { Composer } from '@/components/ui/composer';",
].join('\n');

/**
 * Os rótulos que o exemplo DECLARA.
 *
 * Mesmo motivo das medições declaradas mais abaixo: `:labels="rotulos"` sobre
 * um nome que o snippet não declara não resolve na mão de quem copia — e é o
 * rótulo que diz o nível a quem não vê a cor do anel.
 */
const ROTULOS = [
  'const rotulos = {',
  "  title: 'Uso da janela de contexto',",
  "  level: { normal: 'Com folga', warning: 'Perto do limite', critical: 'No limite' },",
  "  of: 'de',",
  "  unit: 'tokens',",
  "  unbounded: 'Sem teto conhecido',",
  '};',
].join('\n');

/** Os rótulos do CAMPO, a peça vizinha, que tem o vocabulário dela. */
const ROTULOS_DO_CAMPO = [
  'const rotulosDoCampo = {',
  "  input: 'Mensagem',",
  "  placeholder: 'Escreva sua mensagem…',",
  "  submit: 'Enviar',",
  "  stop: 'Parar',",
  "  hint: '{key} envia',",
  '};',
].join('\n');

/** O `<script setup>` de cada exemplo: o que importa e o que declara. */
const SETUP = [IMPORT, '', ROTULOS].join('\n');
const SETUP_FORMS = [IMPORT_FORMS, '', ROTULOS].join('\n');
const SETUP_BUDGET = [IMPORT_BUDGET, '', ROTULOS].join('\n');
const SETUP_BESIDE = [IMPORT_BESIDE, '', ROTULOS, '', ROTULOS_DO_CAMPO].join('\n');

/** `{ input: 18000, output: 7000, limit: 32000 }`, sem o teto quando não há. */
function usageLiteral(opts: ContextDisplayArgs): string {
  const parts = [`input: ${opts.input ?? 0}`, `output: ${opts.output ?? 0}`];
  if (opts.limit) parts.push(`limit: ${opts.limit}`);
  return `{ ${parts.join(', ')} }`;
}

/**
 * A tag da medição, só com o que o exemplo precisa dizer.
 *
 * A forma padrão não entra: documentação não ensina a repetir o que o
 * componente já assume.
 */
function displayTag(opts: ContextDisplayArgs): string {
  const attributes = attrsMultilinha([
    `:usage="${usageLiteral(opts)}"`,
    opts.form && opts.form !== 'ring' ? `form="${text(opts.form)}"` : undefined,
    ':labels="rotulos"',
  ]);
  return `<ContextDisplay${attributes} />`;
}

function build(opts: ContextDisplayArgs): string {
  return vueSnippet(SETUP, displayTag(opts));
}

/** Transform do `meta` — o Playground, que escreve a medição por extenso. */
export const contextDisplaySource: SourceTransform<ContextDisplayArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build({
    input: args.input,
    output: args.output,
    limit: args.limit,
    form: args.form,
  });
};

/**
 * As três formas, percorrendo a lista do componente.
 *
 * O snippet ensina a ITERAR `CONTEXT_DISPLAY_FORMS` em vez de escrever as três
 * à mão, que é o mesmo motivo de a constante existir: lista escrita à mão fica
 * para trás no dia em que o tipo cresce, e ninguém repara.
 */
export function contextDisplayEveryFormSource(): string {
  return vueSnippet(
    SETUP_FORMS,
    [
      '<ContextDisplay',
      '  v-for="form in CONTEXT_DISPLAY_FORMS"',
      '  :key="form"',
      '  :usage="medicao"',
      '  :form="form"',
      '  :labels="rotulos"',
      '/>',
    ].join('\n'),
  );
}

/** O anel: a forma compacta, ao lado de outros controles. */
export function contextDisplayRingSource(): string {
  return build({ input: 18_000, output: 7_000, limit: 32_000, form: 'ring' });
}

/** A barra: a linha inteira, num painel só para ela. */
export function contextDisplayBarSource(): string {
  return build({ input: 18_000, output: 7_000, limit: 32_000, form: 'bar' });
}

/** Só o número, sem medidor — para um rodapé. */
export function contextDisplayTextSource(): string {
  return build({ input: 18_000, output: 7_000, limit: 32_000, form: 'text' });
}

/**
 * Os três níveis, percorrendo o primitivo compartilhado.
 *
 * O snippet mostra a CONTA, e não três medições escolhidas a dedo: quem lê
 * precisa saber de onde sai o nível, porque é isso que ele não pode reescrever
 * na própria tela.
 */
export function contextDisplayEveryLevelSource(): string {
  return vueSnippet(
    [
      SETUP_BUDGET,
      '',
      '// O limiar é do primitivo, e a comparação é exata.',
      "budgetLevel({ input: 16000, output: 0, limit: 32000 });  // 'normal'",
      "budgetLevel({ input: 24000, output: 0, limit: 32000 });  // 'warning'",
      "budgetLevel({ input: 30000, output: 0, limit: 32000 });  // 'critical'",
      '',
      '// As mesmas três medições da conta acima, agora desenhadas. Elas são',
      '// DECLARADAS aqui: um laço sobre um nome que o snippet não declara não',
      '// resolve na mão de quem copia.',
      'const medicoes = [',
      '  { input: 16000, output: 0, limit: 32000 },',
      '  { input: 24000, output: 0, limit: 32000 },',
      '  { input: 30000, output: 0, limit: 32000 },',
      '];',
    ].join('\n'),
    [
      '<ContextDisplay',
      '  v-for="(medicao, i) in medicoes"',
      '  :key="i"',
      '  :usage="medicao"',
      '  :labels="rotulos"',
      '/>',
    ].join('\n'),
  );
}

/** A borda do limiar: três quartos em ponto já são aviso. */
export function contextDisplayAtThresholdSource(): string {
  return build({ input: 20_000, output: 4_000, limit: 32_000 });
}

/** Acima do teto: o medidor para no cheio e o número trava. */
export function contextDisplayOverLimitSource(): string {
  return build({ input: 26_000, output: 8_000, limit: 32_000 });
}

/**
 * Sem teto conhecido: contagem, e nenhum medidor.
 *
 * O snippet omite o teto de propósito — é a ausência dele que produz o caso, e
 * escrever um teto vazio ensinaria a mandar um campo em branco em vez de não
 * mandar campo.
 */
export function contextDisplayUnboundedSource(): string {
  return build({ input: 18_000, output: 7_000 });
}

/**
 * A medição ao lado do campo de mensagem.
 *
 * Ela é AUTÔNOMA: fica junto do campo e nenhum arquivo do campo sabe que ela
 * existe. Por isso o snippet monta as duas lado a lado, como irmãs, e não passa
 * uma para dentro da outra.
 */
export function contextDisplayBesideFieldSource(): string {
  const body = [
    '<!-- A medição vem ANTES do campo, e FORA da moldura dele. -->',
    displayTag({ input: 18_000, output: 7_000, limit: 32_000 }),
    '<Composer :labels="rotulosDoCampo" />',
  ].join('\n');

  return vueSnippet(
    SETUP_BESIDE,
    `<div class="nds-stack nds-max-w-lg" data-spacing="sm">\n${indentar(body)}\n</div>`,
  );
}
