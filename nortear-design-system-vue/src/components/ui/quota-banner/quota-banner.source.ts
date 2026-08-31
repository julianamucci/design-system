/**
 * Transforms do painel Code da faixa de cota.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * Cada snippet daqui ensina DUAS coisas, e não uma: que a peça recebe o USO e o
 * TETO e tira o resto sozinha da conta compartilhada, e que o horizonte chega
 * ESCRITO. As duas juntas são o contrato — quem copiasse só a tag escreveria a
 * subtração à mão na primeira vez que precisasse dela, e um dia mostraria
 * "-14 mensagens restantes".
 *
 * Por isso o formatador de duração aparece no snippet, com idioma explícito: é
 * ele que o leitor precisa reconhecer como SEU, e não do design system.
 */
import {
  attrsMultilinha,
  indentar,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type QuotaBannerArgs = {
  /** Quanto da cota já foi usado. */
  used?: number;
  /** O teto da cota. */
  limit?: number;
  /** A cota renova? Quando não renova, o horizonte não é passado. */
  renews?: boolean;
};

// O caminho é o do ÍNDICE da peça, e não o do arquivo interno: é assim que os
// componentes desta stack entram, e um snippet que ensinasse o atalho direto
// ensinaria a furar a única porta que a peça tem.
const IMPORT = "import { QuotaBanner } from '@/components/ui/quota-banner';";

/**
 * A conta entra em TODO snippet, inclusive nos que não têm nada de especial: é
 * ela que responde onde o resto e o nível nascem, e um snippet que a escondesse
 * deixaria o leitor achando que a subtração é dele.
 */
const IMPORT_BUDGET = [
  IMPORT,
  "import { remainingUnits } from '@shared/primitives/token-budget';",
].join('\n');

// O `h` entra junto porque o controle é um NÓ desta stack, e é ele que a lista
// carrega: quem monta o controle o monta com as ferramentas daqui, e a peça o
// hospeda sem saber o que ele é.
const IMPORT_ACTION = [
  "import { h } from 'vue';",
  IMPORT_BUDGET,
  "import { Button } from '@/components/ui/button';",
].join('\n');

const IMPORT_BESIDE = [
  IMPORT_BUDGET,
  "import { ContextDisplay } from '@/components/ui/context-display';",
].join('\n');

/** O formatador que é de QUEM CONSOME, e nunca do componente. */
function horizonLines(): string {
  return [
    '// O HORIZONTE CHEGA ESCRITO. Abreviatura de hora e de minuto, separador e',
    '// número de cifras são decisão de idioma E de lugar, e quem as conhece é',
    '// quem mede.',
    'const unidade = (valor: number, nome: "hour" | "minute") =>',
    "  new Intl.NumberFormat('pt-BR', {",
    "    style: 'unit',",
    '    unit: nome,',
    "    unitDisplay: 'short',",
    '  }).format(valor);',
    '',
    "const horizonte = `${unidade(3, 'hour')} ${unidade(12, 'minute')}`;",
  ].join('\n');
}

/**
 * A tag da faixa, só com o que o exemplo precisa dizer.
 *
 * Sem renovação o atributo do horizonte não entra: é a AUSÊNCIA dele que
 * produz a linha que não é montada, e escrever um horizonte vazio ensinaria a
 * mandar um campo em branco em vez de não mandar campo.
 */
function bannerTag(used: number, limit: number, renews: boolean, hasAction = false): string {
  const attributes = attrsMultilinha([
    `:quota="{ used: ${used}, limit: ${limit} }"`,
    renews ? ':renews-in="horizonte"' : undefined,
    hasAction ? ':actions="[controle]"' : undefined,
    ':labels="rotulos"',
  ]);
  return `<QuotaBanner${attributes} />`;
}

function build(opts: QuotaBannerArgs): string {
  const used = opts.used ?? 0;
  const limit = opts.limit ?? 0;
  const renews = opts.renews ?? true;

  const script = [
    IMPORT_BUDGET,
    '',
    renews
      ? horizonLines()
      : [
        '// Cota que não renova: o horizonte não é passado, e a linha some em vez',
        '// de dizer "renova em nunca". O resto da faixa não muda.',
      ].join('\n'),
    '',
    `// O resto sai da conta compartilhada: ${used} de ${limit} deixa`,
    `// ${Math.max(limit - used, 0)}, e nunca um número negativo.`,
    `remainingUnits(${used}, ${limit});`,
  ].join('\n');

  return vueSnippet(script, bannerTag(used, limit, renews));
}

/** Transform do `meta` — o Playground, que escreve o uso e o teto por extenso. */
export const quotaBannerSource: SourceTransform<QuotaBannerArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return build({ used: args.used, limit: args.limit, renews: args.renews });
};

/**
 * Os cinco exemplos, percorridos de uma vez.
 *
 * O snippet ensina o laço porque o que se quer mostrar é que a MESMA tag atende
 * os cinco: o que muda é o uso, e a peça decide sozinha se a manchete conta ou
 * anuncia o fim.
 */
export function quotaBannerEveryCaseSource(): string {
  return vueSnippet(
    [
      IMPORT_BUDGET,
      '',
      horizonLines(),
      '',
      '// Passar do teto não deixa resto negativo, e a razão para em uma volta:',
      '// as duas travas moram na conta compartilhada, e não aqui.',
      'const usos = [72, 150, 168, 188, 214];',
    ].join('\n'),
    [
      '<QuotaBanner',
      '  v-for="uso in usos"',
      '  :key="uso"',
      '  :quota="{ used: uso, limit: 200 }"',
      '  :renews-in="horizonte"',
      '  :labels="rotulos"',
      '/>',
    ].join('\n'),
  );
}

/** Os três níveis, do mais folgado ao mais apertado. */
export function quotaBannerAllLevelsSource(): string {
  return vueSnippet(
    [
      IMPORT_BUDGET,
      '',
      horizonLines(),
      '',
      '// A palavra do nível é o que descreve, e a cor apenas acompanha: cor',
      '// sozinha não descreve estado.',
      'const usos = [72, 168, 188];',
    ].join('\n'),
    [
      '<QuotaBanner',
      '  v-for="uso in usos"',
      '  :key="uso"',
      '  :quota="{ used: uso, limit: 200 }"',
      '  :renews-in="horizonte"',
      '  :labels="rotulos"',
      '/>',
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
  return vueSnippet(
    [
      IMPORT_ACTION,
      '',
      horizonLines(),
      '',
      '// O CONTROLE É DE QUEM CONSOME, e chega pronto. A faixa desenha o lugar',
      '// de quem responde; o que o botão faz não passa por ela.',
      "const controle = h(Button, { variant: 'outline', size: 'sm' }, () => 'Mudar de plano');",
      '',
      '// O resto sai da conta compartilhada: 168 de 200 deixa 32, e nunca um',
      '// número negativo.',
      'remainingUnits(168, 200);',
    ].join('\n'),
    bannerTag(168, 200, true, true),
  );
}

/**
 * A cota ao lado da medição da janela.
 *
 * As duas respondem perguntas diferentes sobre a mesma conversa, e a palavra do
 * nível quer dizer a mesma coisa nas duas porque o limiar vem do mesmo lugar.
 * Por isso o snippet monta as duas como IRMÃS, e não passa uma para dentro da
 * outra.
 */
export function quotaBannerBesideContextSource(): string {
  const body = [
    '<!-- A outra pergunta, sobre a mesma conversa: quanto da janela já foi. -->',
    '<ContextDisplay :usage="uso" form="bar" :labels="rotulosDaJanela" />',
    bannerTag(168, 200, true),
  ].join('\n');

  return vueSnippet(
    [
      IMPORT_BESIDE,
      '',
      horizonLines(),
      '',
      'const uso = { input: 20000, output: 6880, limit: 32000 };',
      '',
      '// A mesma fração em grandezas diferentes, e por isso a mesma palavra de',
      '// nível: o limiar vem do primitivo compartilhado.',
      'remainingUnits(168, 200);',
    ].join('\n'),
    `<div class="nds-stack nds-max-w-lg" data-spacing="md">\n${indentar(body)}\n</div>`,
  );
}
