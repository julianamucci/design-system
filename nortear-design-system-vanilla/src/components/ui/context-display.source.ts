// Snippet do painel Code do uso do contexto — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// O Playground é o único que escreve a medição inteira por extenso, e é de
// propósito: lá os controls mudam consumo, teto e forma, e um snippet que
// mostrasse só o nome de uma constante mentiria sobre o que a story renderiza.
// Nas demais o que varia é o caso, e ele continua literal porque é o assunto da
// story.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

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
  const lines = options([
    ['usage', usageLiteral(opts)],
    // A forma padrão não entra: documentação não ensina a repetir o que a
    // fábrica já assume.
    ['form', opts.form && opts.form !== 'ring' ? text(opts.form) : undefined],
    ['labels', 'rotulos'],
  ]);

  return snippet(
    importing('context-display', 'createContextDisplay'),
    `const contextDisplay = ${callLine('createContextDisplay', lines)};`,
    appendLine('contextDisplay'),
  );
}

/** Transform do `meta` — o Playground, que escreve a medição por extenso. */
export const contextDisplaySource: SourceTransform<ContextDisplaySnippetOptions> = (_c, ctx) => {
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
  return snippet(
    importing('context-display', 'createContextDisplay', 'CONTEXT_DISPLAY_FORMS'),
    [
      'for (const form of CONTEXT_DISPLAY_FORMS) {',
      "  document.querySelector('#app')?.append(",
      '    createContextDisplay({ usage: medicao, form, labels: rotulos }),',
      '  );',
      '}',
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
  return snippet(
    [
      importing('context-display', 'createContextDisplay'),
      "import { budgetLevel } from '@shared/primitives/token-budget';",
    ].join('\n'),
    [
      '// O limiar é do primitivo, e a comparação é exata.',
      "budgetLevel({ input: 16000, output: 0, limit: 32000 });  // 'normal'",
      "budgetLevel({ input: 24000, output: 0, limit: 32000 });  // 'warning'",
      "budgetLevel({ input: 30000, output: 0, limit: 32000 });  // 'critical'",
      '',
      'for (const usage of medicoes) {',
      "  document.querySelector('#app')?.append(",
      '    createContextDisplay({ usage, labels: rotulos }),',
      '  );',
      '}',
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
 * escrever `limit: undefined` ensinaria a mandar um campo vazio em vez de não
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
  return snippet(
    [
      importing('context-display', 'createContextDisplay'),
      importing('composer', 'createComposer'),
    ].join('\n'),
    [
      `const contextDisplay = ${callLine('createContextDisplay', options([
        ['usage', usageLiteral({ input: 18_000, output: 7_000, limit: 32_000 })],
        ['labels', 'rotulos'],
      ]))};`,
      '',
      `const composer = ${callLine('createComposer', options([['labels', 'rotulosDoCampo']]))};`,
    ].join('\n'),
    "document.querySelector('#app')?.append(contextDisplay, composer);",
  );
}
