/**
 * Transforms do painel Code do uso do contexto.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm — a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o gerador
 * monta a tag a partir do nome interno da função compilada e publica
 * `<wrapper …/>`, que não é um componente que alguém possa importar.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve a medição inteira por extenso, e é de
 * propósito: lá os controls mudam consumo, teto e forma, e um snippet que
 * mostrasse só o nome de uma constante mentiria sobre o que a story renderiza.
 * Nas demais o que varia é a medição, e ela continua literal porque é o assunto
 * da story.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
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

/** O contexto que o painel Code entrega à transform. */
type StoryContext = { args?: ContextDisplaySnippetOptions };

const IMPORT = "import { ContextDisplay } from '@/components/ui/context-display';";
const IMPORT_FORMS =
  "import { ContextDisplay, CONTEXT_DISPLAY_FORMS } from '@/components/ui/context-display';";
const IMPORT_FIELD = "import { Composer } from '@/components/ui/composer';";
const IMPORT_BUDGET = "import { budgetLevel } from '@shared/primitives/token-budget';";

/** `{ input: 18000, output: 7000, limit: 32000 }`, sem o teto quando não há. */
function usageLiteral(opts: ContextDisplaySnippetOptions): string {
  const parts = [`input: ${opts.input ?? 0}`, `output: ${opts.output ?? 0}`];
  if (opts.limit) parts.push(`limit: ${opts.limit}`);
  return `{ ${parts.join(', ')} }`;
}

/** O uso real: a medição, a forma quando ela difere do padrão, e os rótulos. */
function build(opts: ContextDisplaySnippetOptions): string {
  const attributes = attrsMultilinha([
    `usage={${usageLiteral(opts)}}`,
    // A forma padrão não entra: documentação não ensina a repetir o que o
    // componente já assume.
    opts.form && opts.form !== 'ring' ? `form="${opts.form}"` : false,
    '{labels}',
  ]);
  return svelteSnippet(IMPORT, `<ContextDisplay${attributes} />`);
}

/** Transform do `meta` — o Playground, que escreve a medição por extenso. */
export function contextDisplaySource(_generated?: unknown, ctx?: StoryContext): string {
  const args = ctx?.args ?? {};
  return build({
    input: args.input,
    output: args.output,
    limit: args.limit,
    form: args.form,
  });
}

/**
 * As três formas, percorrendo a lista do componente.
 *
 * O snippet ensina a ITERAR `CONTEXT_DISPLAY_FORMS` em vez de escrever as três
 * à mão, que é o mesmo motivo de a constante existir: lista escrita à mão fica
 * para trás no dia em que o tipo cresce, e ninguém repara.
 */
export function contextDisplayEveryFormSource(): string {
  const markup = [
    '<div class="nds-stack" data-spacing="lg">',
    '  {#each CONTEXT_DISPLAY_FORMS as form (form)}',
    '    <ContextDisplay {usage} {form} {labels} />',
    '  {/each}',
    '</div>',
  ].join('\n');

  return svelteSnippet(IMPORT_FORMS, markup);
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
  const script = [
    IMPORT,
    IMPORT_BUDGET,
    '',
    '// O limiar é do primitivo, e a comparação é exata.',
    "budgetLevel({ input: 16000, output: 0, limit: 32000 });  // 'normal'",
    "budgetLevel({ input: 24000, output: 0, limit: 32000 });  // 'warning'",
    "budgetLevel({ input: 30000, output: 0, limit: 32000 });  // 'critical'",
  ].join('\n');

  const markup = [
    '<div class="nds-stack" data-spacing="md">',
    '  {#each usages as usage (usage)}',
    '    <ContextDisplay {usage} {labels} />',
    '  {/each}',
    '</div>',
  ].join('\n');

  return svelteSnippet(script, markup);
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
 * escrever um teto vazio ensinaria a mandar um campo sem valor em vez de não
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
  const markup = [
    '<div class="nds-stack" data-spacing="sm">',
    '  <ContextDisplay',
    '    usage={{ input: 18000, output: 7000, limit: 32000 }}',
    '    labels={contextLabels}',
    '  />',
    '  <Composer labels={fieldLabels} />',
    '</div>',
  ].join('\n');

  return svelteSnippet(`${IMPORT}\n${IMPORT_FIELD}`, markup);
}
