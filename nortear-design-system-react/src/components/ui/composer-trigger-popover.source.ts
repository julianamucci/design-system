/**
 * Transforms do painel Code do seletor do gatilho.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * O que se escreve é uma tag de `Composer` com gatilhos; o painel mostra isso, e
 * não a árvore do `render` da story, que monta o andaime dos rótulos.
 *
 * A LISTA DE OPÇÕES NÃO ENTRA NO SNIPPET. Ela é dado do exemplo — quatro
 * pessoas e dois comandos —, e despejá-la faria o painel ensinar o andaime em
 * vez do componente. O snippet cita a constante e mostra o que se faz com ela,
 * que é onde estão as duas decisões que importam: onde o gatilho vale e o que a
 * lista oferece.
 *
 * UMA TRANSFORM POR STORY, e não uma fábrica de transforms. A guarda transversal
 * chama todo export SEM argumento e exige uma string de volta; uma função que
 * devolve outra função morre ali, e com razão — o que ela guarda é justamente
 * que o painel de cada story tem saída própria e verificável.
 */
import {
  attrsMultilinha,
  jsxSnippet,
  propText,
  type SourceTransform,
} from '@/lib/story-source';

/** O que o Playground deixa o leitor ligar e desligar. */
export type ComposerTriggerArgs = {
  /** O gatilho de menção, que vale em começo de qualquer palavra. */
  mention: boolean;
  /** O gatilho de comando, que vale só na primeira posição do campo. */
  command: boolean;
  /** Texto inicial do campo, quando a story precisa de um. */
  value: string;
};

const COMPOSER_IMPORT = 'import { Composer } from "@/components/ui/composer";';

const MENTION_SOURCE = '{ spec: MENTION_TRIGGER, options: pessoas }';
const COMMAND_SOURCE = '{ spec: COMMAND_TRIGGER, options: comandos }';

function build(args: Partial<ComposerTriggerArgs> = {}): string {
  // A menção é o padrão do componente: desligá-la é uma escolha da story, e
  // ligá-la não é.
  const withMention = args.mention !== false;
  const withCommand = args.command === true;

  const sources = [
    withMention ? MENTION_SOURCE : undefined,
    withCommand ? COMMAND_SOURCE : undefined,
  ].filter((entry): entry is string => entry !== undefined);

  const list =
    sources.length > 1
      ? `[\n${sources.map((entry) => `    ${entry},`).join('\n')}\n  ]`
      : `[${sources.join('')}]`;

  const names = [
    withCommand ? 'COMMAND_TRIGGER' : undefined,
    withMention ? 'MENTION_TRIGGER' : undefined,
  ].filter((entry): entry is string => entry !== undefined);

  const header = [
    COMPOSER_IMPORT,
    names.length
      ? `import { ${names.join(', ')} } from "@shared/primitives/composer-trigger";`
      : undefined,
  ]
    .filter((line): line is string => line !== undefined)
    .join('\n');

  const tag = `<Composer${attrsMultilinha([
    'labels={labels}',
    'triggerLabels={triggerLabels}',
    `triggers={${list}}`,
    propText('value', args.value),
    'onSubmit={enviar}',
  ])} />`;

  return jsxSnippet(header, tag);
}

/** Transform do `meta` do Playground: lê os args da story e devolve a tag. */
export const composerTriggerSource: SourceTransform<ComposerTriggerArgs> = (_generated, ctx) =>
  build(ctx?.args ?? {});

/** Só menções — o caso mais comum, e o padrão dos arquivos sem control. */
export function composerTriggerMentionsSource(): string {
  return build({ mention: true });
}

/** Só comandos, que valem na primeira posição do campo. */
export function composerTriggerCommandsSource(): string {
  return build({ mention: false, command: true });
}

/** Com termo já digitado: é ele que faz a lista filtrar. */
export function composerTriggerFilteredSource(): string {
  return build({ mention: true, value: 'avisa a @an' });
}

/** Com um termo que não casa com ninguém. */
export function composerTriggerEmptySource(): string {
  return build({ mention: true, value: 'avisa a @zzz' });
}
