// Snippet do painel Code da faixa de cota — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// Cada snippet daqui ensina DUAS coisas, e não uma: que a peça recebe o USO e o
// TETO e tira o resto sozinha da conta compartilhada, e que o horizonte chega
// ESCRITO. As duas juntas são o contrato — quem copiasse só a chamada da
// fábrica escreveria a subtração à mão na primeira vez que precisasse dela, e
// um dia mostraria "-14 mensagens restantes".
//
// Por isso o formatador de duração aparece no snippet, com idioma explícito: é
// ele que o leitor precisa reconhecer como SEU, e não do design system.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

export type QuotaBannerSnippetOptions = {
  /** Quanto da cota já foi usado. */
  used?: number;
  /** O teto da cota. */
  limit?: number;
  /** A cota renova? Quando não renova, o horizonte não é passado. */
  renews?: boolean;
};

/**
 * O bloco de importação, com a fábrica e a conta compartilhada sempre juntas.
 *
 * A conta entra em TODO snippet, inclusive nos que não têm nada de especial: é
 * ela que responde onde o resto e o nível nascem, e um snippet que a escondesse
 * deixaria o leitor achando que a subtração é dele.
 */
function quotaImports(...extra: string[]): string {
  return [
    importing('quota-banner', 'createQuotaBanner'),
    ...extra,
    "import { remainingUnits } from '@shared/primitives/token-budget';",
  ].join('\n');
}

/** O formatador que é de QUEM CONSOME, e nunca do componente. */
function horizonLines(): string {
  return [
    '// O HORIZONTE CHEGA ESCRITO. Abreviatura de hora e de minuto, separador e',
    '// número de cifras são decisão de idioma E de lugar, e quem as conhece é',
    '// quem mede.',
    "const unit = (value, name) =>",
    "  new Intl.NumberFormat('pt-BR', {",
    "    style: 'unit',",
    '    unit: name,',
    "    unitDisplay: 'short',",
    '  }).format(value);',
    '',
    'const horizon = `${unit(3, \'hour\')} ${unit(12, \'minute\')}`;',
  ].join('\n');
}

function build(opts: QuotaBannerSnippetOptions): string {
  const used = opts.used ?? 0;
  const limit = opts.limit ?? 0;
  const renews = opts.renews ?? true;

  const lines = options([
    ['quota', `{ used: ${used}, limit: ${limit} }`],
    ['renewsIn', renews ? 'horizon' : undefined],
    ['actions', '[control]'],
    ['labels', 'rotulos'],
  ]);

  return snippet(
    quotaImports(importing('button', 'createButton')),
    renews ? horizonLines() : [
      '// Cota que não renova: o horizonte não é passado, e a linha some em vez',
      '// de dizer "renova em nunca". O resto da faixa não muda.',
    ].join('\n'),
    [
      '// O CONTROLE É DE QUEM CONSOME. A faixa desenha o lugar de quem responde;',
      '// o que o botão faz não passa por ela.',
      `const control = ${callLine('createButton', options([
        ['variant', text('outline')],
        ['size', text('sm')],
        ['label', text('Mudar de plano')],
      ]))};`,
      '',
      `// O resto sai da conta compartilhada: ${used} de ${limit} deixa`,
      `// ${Math.max(limit - used, 0)}, e nunca um número negativo.`,
      `remainingUnits(${used}, ${limit});`,
      '',
      `const quotaBanner = ${callLine('createQuotaBanner', lines)};`,
    ].join('\n'),
    appendLine('quotaBanner'),
  );
}

/** Transform do `meta` — o Playground, que escreve o uso e o teto por extenso. */
export const quotaBannerSource: SourceTransform<QuotaBannerSnippetOptions> = (_c, ctx) => {
  const args = ctx?.args ?? {};
  return build({ used: args.used, limit: args.limit, renews: args.renews });
};

/**
 * Os cinco exemplos, percorridos de uma vez.
 *
 * O snippet ensina o laço porque o que se quer mostrar é que a MESMA chamada
 * atende os cinco: o que muda é o uso, e a peça decide sozinha se a manchete
 * conta ou anuncia o fim.
 */
export function quotaBannerEveryCaseSource(): string {
  return snippet(
    quotaImports(),
    horizonLines(),
    [
      '// Passar do teto não deixa resto negativo, e a razão para em uma volta:',
      '// as duas travas moram na conta compartilhada, e não aqui.',
      'for (const used of [72, 150, 168, 188, 214]) {',
      "  document.querySelector('#app')?.append(",
      '    createQuotaBanner({',
      '      quota: { used, limit: 200 },',
      '      renewsIn: horizon,',
      '      labels: rotulos,',
      '    }),',
      '  );',
      '}',
    ].join('\n'),
  );
}

/** Os três níveis, do mais folgado ao mais apertado. */
export function quotaBannerSourceAllLevels(): string {
  return snippet(
    quotaImports(),
    horizonLines(),
    [
      '// A palavra do nível é o que descreve, e a cor apenas acompanha: cor',
      '// sozinha não descreve estado.',
      'for (const used of [72, 168, 188]) {',
      "  document.querySelector('#app')?.append(",
      '    createQuotaBanner({',
      '      quota: { used, limit: 200 },',
      '      renewsIn: horizon,',
      '      labels: rotulos,',
      '    }),',
      '  );',
      '}',
    ].join('\n'),
  );
}

/** Três quartos do teto EM PONTO — a borda do limiar de aviso. */
export function quotaBannerSourceAtThreshold(): string {
  return build({ used: 150, limit: 200 });
}

/**
 * O uso passou do teto, e não sobra nada.
 *
 * A manchete troca o número pela palavra que diz que acabou: zero contado lê
 * como medição, e não como fim.
 */
export function quotaBannerSourceExhausted(): string {
  return build({ used: 214, limit: 200 });
}

/**
 * Nenhum horizonte de renovação.
 *
 * O que se sabe é quanto sobra, e não até quando — e é isso que a peça mostra,
 * em vez de inventar uma renovação que ninguém prometeu.
 */
export function quotaBannerSourceNoRenewal(): string {
  return build({ used: 168, limit: 200, renews: false });
}

/**
 * A faixa com um controle.
 *
 * O controle chega pronto, e a peça não sabe o que ele faz — §7 da guideline
 * 17. É o mesmo contrato das ações da mensagem e do cartão de autorização.
 */
export function quotaBannerSourceWithAction(): string {
  return build({ used: 168, limit: 200 });
}

/**
 * A cota ao lado da medição da janela.
 *
 * As duas respondem perguntas diferentes sobre a mesma conversa, e a palavra do
 * nível quer dizer a mesma coisa nas duas porque o limiar vem do mesmo lugar.
 */
export function quotaBannerSourceBesideContext(): string {
  return snippet(
    quotaImports(importing('context-display', 'createContextDisplay')),
    horizonLines(),
    [
      `const quotaBanner = ${callLine('createQuotaBanner', options([
        ['quota', '{ used: 168, limit: 200 }'],
        ['renewsIn', 'horizon'],
        ['labels', 'rotulos'],
      ]))};`,
      '',
      '// A outra pergunta, sobre a mesma conversa: quanto da janela já foi.',
      `const contextDisplay = ${callLine('createContextDisplay', options([
        ['usage', '{ input: 20000, output: 6880, limit: 32000 }'],
        ['labels', 'rotulosDaJanela'],
      ]))};`,
    ].join('\n'),
    "document.querySelector('#app')?.append(contextDisplay, quotaBanner);",
  );
}
