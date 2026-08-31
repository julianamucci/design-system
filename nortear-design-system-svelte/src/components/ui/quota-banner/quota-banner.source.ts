/**
 * Transforms do painel Code da faixa de cota.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm — a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o gerador
 * monta a tag a partir do nome interno da função compilada e publica algo que
 * não é um componente que alguém possa importar.
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
 * ele que o leitor precisa reconhecer como SEU, e não do design system. E por
 * isso o controle aparece como um snippet declarado FORA da peça: nesta stack é
 * essa a forma de "o componente dá o lugar, e quem consome decide".
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type QuotaBannerSnippetOptions = {
  /** Quanto da cota já foi usado. */
  used?: number;
  /** O teto da cota. */
  limit?: number;
  /** A cota renova? Quando não renova, o horizonte não é passado. */
  renews?: boolean;
};

/** O contexto que o painel Code entrega à transform. */
type StoryContext = { args?: QuotaBannerSnippetOptions };

const IMPORT = "import { QuotaBanner } from '@/components/ui/quota-banner';";
const IMPORT_BUDGET = "import { remainingUnits } from '@shared/primitives/token-budget';";
const IMPORT_BUTTON = "import { Button } from '@/components/ui/button';";
const IMPORT_CONTEXT = "import { ContextDisplay } from '@/components/ui/context-display';";

/** O formatador que é de QUEM CONSOME, e nunca do componente. */
const HORIZON = [
  '// O HORIZONTE CHEGA ESCRITO. Abreviatura de hora e de minuto, separador e',
  '// número de cifras são decisão de idioma E de lugar, e quem as conhece é',
  '// quem mede.',
  'const unit = (value: number, name: \'hour\' | \'minute\') =>',
  '  new Intl.NumberFormat(\'pt-BR\', {',
  '    style: \'unit\',',
  '    unit: name,',
  '    unitDisplay: \'short\',',
  '  }).format(value);',
  '',
  'const horizon = `${unit(3, \'hour\')} ${unit(12, \'minute\')}`;',
].join('\n');

/** A cota que não renova: nada de horizonte, e a linha some. */
const NO_HORIZON = [
  '// Cota que não renova: o horizonte não é passado, e a linha some em vez de',
  '// dizer "renova em nunca". O resto da faixa não muda.',
].join('\n');

/**
 * O bloco de `<script>`, com a peça e a conta compartilhada sempre juntas.
 *
 * A conta entra em TODO snippet, inclusive nos que não têm nada de especial: é
 * ela que responde onde o resto e o nível nascem, e um snippet que a escondesse
 * deixaria o leitor achando que a subtração é dele.
 */
function script(opts: { imports?: string[]; after?: string[] } = {}): string {
  return [
    IMPORT,
    IMPORT_BUDGET,
    ...(opts.imports ?? []),
    '',
    ...(opts.after ?? []),
  ].join('\n');
}

/**
 * O controle, declarado FORA da peça.
 *
 * É a forma desta stack para o espaço dos controles, e o snippet a mostra
 * inteira: quem consome escreve o botão, e a faixa só hospeda o lugar dele. Não
 * há manipulador nenhum aqui de propósito — o que o botão faz não passa pela
 * peça (§7 da guideline 17).
 */
const CONTROL = [
  '<!--',
  '  O CONTROLE É DE QUEM CONSOME. A faixa desenha o lugar de quem responde; o',
  '  que o botão faz não passa por ela.',
  '-->',
  '{#snippet control()}',
  '  <Button variant="outline" size="sm">Mudar de plano</Button>',
  '{/snippet}',
].join('\n');

function build(opts: QuotaBannerSnippetOptions): string {
  const used = opts.used ?? 0;
  const limit = opts.limit ?? 0;
  const renews = opts.renews ?? true;

  const attributes = attrsMultilinha([
    `quota={{ used: ${used}, limit: ${limit} }}`,
    // Sem renovação o atributo sai INTEIRO, e não vazio: a ausência é a
    // resposta, e um atributo em branco ensinaria a mandar uma cadeia vazia.
    renews && 'renewsIn={horizon}',
    'actions={[control]}',
    '{labels}',
  ]);

  const conta = [
    '',
    `// O resto sai da conta compartilhada: ${used} de ${limit} deixa`,
    `// ${Math.max(limit - used, 0)}, e nunca um número negativo.`,
    `remainingUnits(${used}, ${limit});`,
  ];

  return svelteSnippet(
    script({
      imports: [IMPORT_BUTTON],
      after: [renews ? HORIZON : NO_HORIZON, ...conta],
    }),
    `${CONTROL}\n\n<QuotaBanner${attributes} />`,
  );
}

/** Transform do `meta` — o Playground, que escreve o uso e o teto por extenso. */
export function quotaBannerSource(_generated?: unknown, ctx?: StoryContext): string {
  const args = ctx?.args ?? {};
  return build({ used: args.used, limit: args.limit, renews: args.renews });
}

/**
 * Os cinco exemplos, percorridos de uma vez.
 *
 * O snippet ensina o laço porque o que se quer mostrar é que a MESMA marcação
 * atende os cinco: o que muda é o uso, e a peça decide sozinha se a manchete
 * conta ou anuncia o fim.
 */
export function quotaBannerEveryCaseSource(): string {
  const markup = [
    '<div class="nds-stack nds-max-w-lg" data-spacing="md">',
    '  {#each [72, 150, 168, 188, 214] as used (used)}',
    '    <QuotaBanner quota={{ used, limit: 200 }} renewsIn={horizon} {labels} />',
    '  {/each}',
    '</div>',
  ].join('\n');

  const note = [
    '',
    '// Passar do teto não deixa resto negativo, e a razão para em uma volta: as',
    '// duas travas moram na conta compartilhada, e não aqui.',
    'remainingUnits(214, 200);',
  ].join('\n');

  return svelteSnippet(script({ after: [HORIZON, note] }), markup);
}

/** Os três níveis, do mais folgado ao mais apertado. */
export function quotaBannerAllLevelsSource(): string {
  const markup = [
    '<div class="nds-stack nds-max-w-lg" data-spacing="md">',
    '  {#each [72, 168, 188] as used (used)}',
    '    <QuotaBanner quota={{ used, limit: 200 }} renewsIn={horizon} {labels} />',
    '  {/each}',
    '</div>',
  ].join('\n');

  const note = [
    '',
    '// A palavra do nível é o que descreve, e a cor apenas acompanha: cor',
    '// sozinha não descreve estado.',
  ].join('\n');

  return svelteSnippet(script({ after: [HORIZON, note] }), markup);
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
 * O controle chega pronto, e a peça não sabe o que ele faz — §7 da guideline 17.
 * É o mesmo contrato das ações da mensagem e do cartão de autorização.
 */
export function quotaBannerWithActionSource(): string {
  return build({ used: 168, limit: 200 });
}

/**
 * A cota ao lado da medição da janela.
 *
 * As duas respondem perguntas diferentes sobre a mesma conversa, e a palavra do
 * nível quer dizer a mesma coisa nas duas porque o limiar vem do mesmo lugar.
 * Por isso o snippet empilha as duas em sequência, e não passa uma para dentro
 * da outra.
 */
export function quotaBannerBesideContextSource(): string {
  const markup = [
    '<div class="nds-stack nds-max-w-lg" data-spacing="md">',
    '  <!-- A outra pergunta, sobre a mesma conversa: quanto da janela já foi. -->',
    '  <ContextDisplay',
    '    usage={{ input: 20000, output: 6880, limit: 32000 }}',
    '    form="bar"',
    '    labels={windowLabels}',
    '  />',
    '  <QuotaBanner',
    '    quota={{ used: 168, limit: 200 }}',
    '    renewsIn={horizon}',
    '    labels={quotaLabels}',
    '  />',
    '</div>',
  ].join('\n');

  return svelteSnippet(script({ imports: [IMPORT_CONTEXT], after: [HORIZON] }), markup);
}
