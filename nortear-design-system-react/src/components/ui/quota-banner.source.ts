/**
 * Snippet do painel Code da faixa de cota — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * Cada snippet daqui ensina DUAS coisas, e não uma: que a peça recebe o USO e o
 * TETO e tira o resto sozinha da conta compartilhada, e que o horizonte chega
 * ESCRITO. As duas juntas são o contrato — quem copiasse só a marcação
 * escreveria a subtração à mão na primeira vez que precisasse dela, e um dia
 * mostraria "-14 mensagens restantes".
 *
 * Por isso o formatador de duração aparece no snippet, com idioma explícito: é
 * ele que o leitor precisa reconhecer como SEU, e não do design system.
 */
import { attrsMultilinha, jsxSnippet, type SourceTransform } from '@/lib/story-source';

export type QuotaBannerSnippetOptions = {
  /** Quanto da cota já foi usado. */
  used?: number;
  /** O teto da cota. */
  limit?: number;
  /** A cota renova? Quando não renova, o horizonte não é passado. */
  renews?: boolean;
};

/**
 * O bloco de importação, com a peça e a conta compartilhada sempre juntas.
 *
 * A conta entra em TODO snippet, inclusive nos que não têm nada de especial: é
 * ela que responde onde o resto e o nível nascem, e um snippet que a escondesse
 * deixaria o leitor achando que a subtração é dele.
 */
function quotaImports(...extra: string[]): string {
  return [
    'import { QuotaBanner } from "@/components/ui/quota-banner";',
    ...extra,
    'import { remainingUnits } from "@shared/primitives/token-budget";',
  ].join('\n');
}

/**
 * Os rótulos da faixa, por INTEIRO.
 *
 * Não cabe resumir: `labels` é obrigatória e a palavra de cada nível é um
 * `Record` completo — um objeto pela metade não compila para quem copia. E
 * cada chave aqui responde por uma decisão da peça: `left` impede a manchete
 * de ser lida como o que já foi gasto, `exhausted` troca o zero contado pela
 * palavra que diz que acabou, e `level` é o que descreve o nível no lugar da
 * cor.
 */
const LABELS_BLOCK = [
  'const rotulos = {',
  '  title: "Cota do plano",',
  '  unit: "mensagens",',
  '  left: "restantes",',
  '  exhausted: "Cota esgotada",',
  '  renews: "Renova em",',
  '  of: "de",',
  '  level: { normal: "Com folga", warning: "Perto do fim", critical: "No fim" },',
  '};',
].join('\n');

/**
 * Os rótulos da MEDIÇÃO DA JANELA, por inteiro e pelo mesmo motivo.
 *
 * Só entram no snippet que mostra as duas peças lado a lado — é lá que a outra
 * chamada existe, e é lá que ela precisa compilar.
 */
const CONTEXT_LABELS_BLOCK = [
  'const rotulosDaJanela = {',
  '  title: "Uso da janela de contexto",',
  '  level: { normal: "Com folga", warning: "Perto do limite", critical: "No limite" },',
  '  of: "de",',
  '  unit: "tokens",',
  '  unbounded: "Sem teto conhecido",',
  '};',
].join('\n');

/** O formatador que é de QUEM CONSOME, e nunca do componente. */
function horizonLines(): string {
  return [
    '// O HORIZONTE CHEGA ESCRITO. Abreviatura de hora e de minuto, separador e',
    '// número de cifras são decisão de idioma E de lugar, e quem as conhece é',
    '// quem mede.',
    'const unit = (value, name) =>',
    '  new Intl.NumberFormat("pt-BR", {',
    '    style: "unit",',
    '    unit: name,',
    '    unitDisplay: "short",',
    '  }).format(value);',
    '',
    'const horizon = `${unit(3, "hour")} ${unit(12, "minute")}`;',
  ].join('\n');
}

function build(opts: QuotaBannerSnippetOptions): string {
  const used = opts.used ?? 0;
  const limit = opts.limit ?? 0;
  const renews = opts.renews ?? true;

  const horizon = renews
    ? horizonLines()
    : [
      '// Cota que não renova: o horizonte não é passado, e a linha some em vez',
      '// de dizer "renova em nunca". O resto da faixa não muda.',
    ].join('\n');

  const markup = `<QuotaBanner${attrsMultilinha([
    `quota={{ used: ${used}, limit: ${limit} }}`,
    renews ? 'renewsIn={horizon}' : undefined,
    'actions={[control]}',
    'labels={rotulos}',
  ])} />`;

  return jsxSnippet(
    quotaImports('import { Button } from "@/components/ui/button";'),
    [
      LABELS_BLOCK,
      '',
      horizon,
      '',
      '// O CONTROLE É DE QUEM CONSOME. A faixa desenha o lugar de quem responde;',
      '// o que o botão faz não passa por ela.',
      'const control = (',
      '  <Button type="button" variant="outline" size="sm">',
      '    Mudar de plano',
      '  </Button>',
      ');',
      '',
      `// O resto sai da conta compartilhada: ${used} de ${limit} deixa`,
      `// ${Math.max(limit - used, 0)}, e nunca um número negativo.`,
      `remainingUnits(${used}, ${limit});`,
      '',
      markup,
    ].join('\n'),
  );
}

/** Transform do `meta` — o Playground, que escreve o uso e o teto por extenso. */
export const quotaBannerSource: SourceTransform<QuotaBannerSnippetOptions> = (
  _generated,
  ctx,
) => {
  const args = ctx?.args ?? {};
  return build({ used: args.used, limit: args.limit, renews: args.renews });
};

/**
 * Os cinco exemplos, percorridos de uma vez.
 *
 * O snippet ensina o laço porque o que se quer mostrar é que a MESMA marcação
 * atende os cinco: o que muda é o uso, e a peça decide sozinha se a manchete
 * conta ou anuncia o fim.
 */
export function quotaBannerEveryCaseSource(): string {
  return jsxSnippet(
    quotaImports(),
    [
      LABELS_BLOCK,
      '',
      horizonLines(),
      '',
      '// Passar do teto não deixa resto negativo, e a razão para em uma volta:',
      '// as duas travas moram na conta compartilhada, e não aqui.',
      '[72, 150, 168, 188, 214].map((used) => (',
      '  <QuotaBanner',
      '    key={used}',
      '    quota={{ used, limit: 200 }}',
      '    renewsIn={horizon}',
      '    labels={rotulos}',
      '  />',
      '))',
    ].join('\n'),
  );
}

/** Os três níveis, do mais folgado ao mais apertado. */
export function quotaBannerAllLevelsSource(): string {
  return jsxSnippet(
    quotaImports(),
    [
      LABELS_BLOCK,
      '',
      horizonLines(),
      '',
      '// A palavra do nível é o que descreve, e a cor apenas acompanha: cor',
      '// sozinha não descreve estado.',
      '[72, 168, 188].map((used) => (',
      '  <QuotaBanner',
      '    key={used}',
      '    quota={{ used, limit: 200 }}',
      '    renewsIn={horizon}',
      '    labels={rotulos}',
      '  />',
      '))',
    ].join('\n'),
  );
}

/** Três quartos do teto EM PONTO — a borda do limiar de aviso. */
export function quotaBannerAtThresholdSource(): string {
  return build({ used: 150, limit: 200 });
}

/**
 * O uso passou do teto, e não sobra nada.
 *
 * A manchete troca o número pela palavra que diz que acabou: zero contado lê
 * como medição, e não como fim.
 */
export function quotaBannerExhaustedSource(): string {
  return build({ used: 214, limit: 200 });
}

/**
 * Nenhum horizonte de renovação.
 *
 * O que se sabe é quanto sobra, e não até quando — e é isso que a peça mostra,
 * em vez de inventar uma renovação que ninguém prometeu.
 */
export function quotaBannerNoRenewalSource(): string {
  return build({ used: 168, limit: 200, renews: false });
}

/**
 * A faixa com um controle.
 *
 * O controle chega pronto, e a peça não sabe o que ele faz — §7 da guideline
 * 17. É o mesmo contrato das ações da mensagem e do cartão de autorização.
 */
export function quotaBannerWithActionSource(): string {
  return build({ used: 168, limit: 200 });
}

/**
 * A cota ao lado da medição da janela.
 *
 * As duas respondem perguntas diferentes sobre a mesma conversa, e a palavra do
 * nível quer dizer a mesma coisa nas duas porque o limiar vem do mesmo lugar.
 */
export function quotaBannerBesideContextSource(): string {
  return jsxSnippet(
    quotaImports('import { ContextDisplay } from "@/components/ui/context-display";'),
    [
      LABELS_BLOCK,
      '',
      CONTEXT_LABELS_BLOCK,
      '',
      horizonLines(),
      '',
      '<div className="nds-stack nds-max-w-lg" data-spacing="md">',
      '  {/* A outra pergunta, sobre a mesma conversa: quanto da janela já foi. */}',
      '  <ContextDisplay',
      '    usage={{ input: 20000, output: 6880, limit: 32000 }}',
      '    form="bar"',
      '    labels={rotulosDaJanela}',
      '  />',
      '  <QuotaBanner',
      '    quota={{ used: 168, limit: 200 }}',
      '    renewsIn={horizon}',
      '    labels={rotulos}',
      '  />',
      '</div>',
    ].join('\n'),
  );
}
