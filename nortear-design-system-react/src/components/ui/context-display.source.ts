/**
 * Snippet do painel Code do uso do contexto — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
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
import { attrsMultilinha, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { ContextDisplay } from "@/components/ui/context-display";';

/**
 * Os rótulos, por inteiro.
 *
 * Não cabe resumir: o `Record` dos níveis é completo por contrato — nível novo
 * no primitivo compartilhado reprova a compilação —, e um objeto pela metade
 * não compila para quem copia. O título não aparece na tela: ele é o que
 * responde "de que número se trata" a quem ouve.
 */
const LABELS_BLOCK = [
  'const rotulos = {',
  "  title: 'Uso da janela de contexto',",
  "  level: { normal: 'Com folga', warning: 'Perto do limite', critical: 'No limite' },",
  "  of: 'de',",
  "  unit: 'tokens',",
  "  unbounded: 'Sem teto conhecido',",
  '};',
].join('\n');

/** A medição de exemplo, para o ramo que a percorre por nome. */
const USAGE_BLOCK = 'const medicao = { input: 18000, output: 7000, limit: 32000 };';

/** Os rótulos do campo de mensagem, também por inteiro. */
const FIELD_LABELS_BLOCK = [
  'const rotulosDoCampo = {',
  "  input: 'Mensagem',",
  "  placeholder: 'Escreva sua mensagem…',",
  "  submit: 'Enviar',",
  "  stop: 'Parar',",
  "  hint: '{key} envia',",
  "  limit: 'Até {max} caracteres',",
  '};',
].join('\n');

/**
 * O preâmbulo do snippet: os imports e o que a marcação chama por nome.
 *
 * Ele entra em TODOS os ramos, e é o que os torna copiáveis: a versão anterior
 * passava `labels={rotulos}` e `usage={medicao}` sem declarar nenhum dos dois.
 */
function preamble(imports: string[] = [], blocks: string[] = [LABELS_BLOCK]): string {
  const partes = blocks.flatMap((bloco) => ['', bloco]);
  return [[IMPORT, ...imports].join('\n'), ...partes].join('\n');
}

export type ContextDisplaySnippetOptions = {
  /** Consumido pela pergunta. */
  input?: number;
  /** Consumido pela resposta. */
  output?: number;
  /** Teto da janela. Ausente quando não se sabe qual é. */
  limit?: number;
  /** Como desenhar o mesmo número. */
  form?: string;
};

/** `{ input: 18000, output: 7000, limit: 32000 }`, sem o teto quando não há. */
function usageLiteral(opts: ContextDisplaySnippetOptions): string {
  const parts = [`input: ${opts.input ?? 0}`, `output: ${opts.output ?? 0}`];
  if (opts.limit) parts.push(`limit: ${opts.limit}`);
  return `{ ${parts.join(', ')} }`;
}

function build(opts: ContextDisplaySnippetOptions): string {
  const form = text(opts.form);

  return jsxSnippet(
    preamble(),
    `<ContextDisplay${attrsMultilinha([
      `usage={${usageLiteral(opts)}}`,
      // A forma padrão não entra: documentação não ensina a repetir o que o
      // componente já assume.
      form === undefined || form === 'ring' ? undefined : `form="${form}"`,
      'labels={rotulos}',
    ])} />`,
  );
}

/** Transform do `meta` — o Playground, que escreve a medição por extenso. */
export const contextDisplaySource: SourceTransform<ContextDisplaySnippetOptions> = (
  _generated,
  ctx,
) => {
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
  return jsxSnippet(
    [
      'import { ContextDisplay, CONTEXT_DISPLAY_FORMS } from "@/components/ui/context-display";',
      '',
      USAGE_BLOCK,
      '',
      LABELS_BLOCK,
    ].join('\n'),
    [
      'CONTEXT_DISPLAY_FORMS.map((form) => (',
      '  <ContextDisplay',
      '    key={form}',
      '    usage={medicao}',
      '    form={form}',
      '    labels={rotulos}',
      '  />',
      '))',
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
export function contextDisplayAllLevelsSource(): string {
  return jsxSnippet(
    preamble(['import { budgetLevel } from "@shared/primitives/token-budget";']),
    [
      '// O limiar é do primitivo, e a comparação é exata.',
      'budgetLevel({ input: 16000, output: 0, limit: 32000 });  // "normal"',
      'budgetLevel({ input: 24000, output: 0, limit: 32000 });  // "warning"',
      'budgetLevel({ input: 30000, output: 0, limit: 32000 });  // "critical"',
      '',
      '// As mesmas três medições da conta acima, agora desenhadas. Elas são',
      '// DECLARADAS aqui: um laço sobre um nome que o snippet não declara não',
      '// compila na mão de quem copia.',
      'const medicoes = [',
      '  { input: 16000, output: 0, limit: 32000 },',
      '  { input: 24000, output: 0, limit: 32000 },',
      '  { input: 30000, output: 0, limit: 32000 },',
      '];',
      '',
      'medicoes.map((usage) => (',
      '  <ContextDisplay key={usage.input} usage={usage} labels={rotulos} />',
      '))',
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
 * existe. Por isso o snippet monta as duas lado a lado, e não passa uma para
 * dentro da outra.
 */
export function contextDisplayBesideFieldSource(): string {
  return jsxSnippet(
    preamble(
      ['import { Composer } from "@/components/ui/composer";'],
      [LABELS_BLOCK, FIELD_LABELS_BLOCK],
    ),
    [
      '<div className="nds-stack" data-spacing="sm">',
      '  <ContextDisplay',
      '    usage={{ input: 18000, output: 7000, limit: 32000 }}',
      '    labels={rotulos}',
      '  />',
      '  <Composer labels={rotulosDoCampo} />',
      '</div>',
    ].join('\n'),
  );
}
