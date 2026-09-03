/**
 * Transforms do painel Code do seletor do gatilho.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * O que se escreve é um composer COM GATILHOS; o painel mostra isso, e não a
 * tag sozinha que o gerador imprimiria.
 *
 * A LISTA DE OPÇÕES NÃO ENTRA NO SNIPPET. Ela é dado do exemplo — quatro
 * pessoas e dois comandos —, e despejá-la faria o painel ensinar o andaime em
 * vez do componente. O snippet nomeia a constante e mostra o que se faz com
 * ela, que é onde estão as duas decisões que importam: onde o gatilho vale e o
 * que a lista oferece.
 *
 * E O TEXTO INICIAL NÃO ENTRA, porque nesta stack ele não é atributo: é a
 * ponta de fora de um vínculo de duas vias. Divergência de API de framework se
 * registra, não se "alinha" — o que a story fixa por texto inicial, aqui é o
 * valor com que quem consome cria a referência.
 */
import { attrsMultilinha, vueSnippet, type SourceTransform } from '@/lib/story-source';

/** Quais gatilhos a story declara. */
export type TriggerArgs = {
  mention?: boolean;
  command?: boolean;
};

/**
 * O que o exemplo DECLARA, e não só o que ele importa.
 *
 * O vínculo do texto e o `@submit` dizem ONDE a responsabilidade continua — o
 * campo não guarda nem envia por conta própria —, e até aqui os dois nomes
 * apareciam sem nunca serem declarados, o que dizia isso ligando fio solto. Os
 * rótulos entram pelo mesmo motivo: texto de interface é de quem consome.
 */
const ROTULOS = [
  'const rotulos = {',
  "  input: 'Mensagem',",
  "  placeholder: 'Escreva sua mensagem…',",
  "  submit: 'Enviar',",
  "  stop: 'Parar',",
  "  hint: '{key} envia',",
  '};',
].join('\n');

const ROTULOS_DO_SELETOR = [
  'const rotulosDoSeletor = {',
  "  empty: 'Nada encontrado',",
  "  list: 'Sugestões',",
  "  team: 'Produto',",
  '};',
].join('\n');

const TEXTO = [
  '// O texto é de quem consome: o campo não guarda nem limpa nada sozinho.',
  "const texto = ref('');",
  '',
  'function enviar(value: string) {',
  '  mandarMensagem(value);',
  "  texto.value = '';",
  '}',
].join('\n');

/** O snippet completo, com um gatilho ou com os dois. */
export function triggerSnippet(opts: TriggerArgs = {}): string {
  const sources: string[] = [];
  if (opts.mention !== false) sources.push('{ spec: MENTION_TRIGGER, options: pessoas }');
  if (opts.command) sources.push('{ spec: COMMAND_TRIGGER, options: comandos }');

  const list =
    sources.length === 1
      ? `:triggers="[${sources[0]}]"`
      : `:triggers="[\n    ${sources.join(',\n    ')},\n  ]"`;

  const script = [
    "import { ref } from 'vue';",
    "import { Composer } from '@/components/ui/composer';",
    `import { ${opts.command ? 'COMMAND_TRIGGER, ' : ''}MENTION_TRIGGER } from '@shared/primitives/composer-trigger';`,
    '',
    ROTULOS,
    '',
    ROTULOS_DO_SELETOR,
    '',
    TEXTO,
  ].join('\n');

  const attributes = attrsMultilinha([
    'v-model:value="texto"',
    ':labels="rotulos"',
    ':trigger-labels="rotulosDoSeletor"',
    list,
    '@submit="enviar"',
  ]);

  return vueSnippet(script, `<Composer${attributes} />`);
}

/** Transform do `meta` do Playground: lê os args da story e devolve o uso real. */
export const triggerPopoverSource: SourceTransform<TriggerArgs> = (_gerado, ctx) =>
  triggerSnippet(ctx?.args ?? {});

/** Transform do `meta` das variações, dos estados e das composições. */
export function triggerPopoverBaseSource(): string {
  return triggerSnippet();
}

/** Só a menção, que vale em começo de qualquer palavra. */
export function triggerPopoverMentionsSource(): string {
  return triggerSnippet({ mention: true });
}

/** Só o comando, que vale na primeira posição do campo. */
export function triggerPopoverCommandsSource(): string {
  return triggerSnippet({ mention: false, command: true });
}

/** O estado filtrado nasce do que foi digitado, e não de outra declaração. */
export function triggerPopoverFilteredSource(): string {
  return triggerSnippet();
}

/** O painel sem resultado é o mesmo painel — o que muda é o termo. */
export function triggerPopoverEmptySource(): string {
  return triggerSnippet();
}

/** Fechado é o repouso do mesmo campo. */
export function triggerPopoverClosedSource(): string {
  return triggerSnippet();
}

/** Escolher pelo teclado não pede declaração nenhuma a mais. */
export function triggerPopoverKeyboardSource(): string {
  return triggerSnippet();
}

/** Nem escolher pelo ponteiro. */
export function triggerPopoverPointerSource(): string {
  return triggerSnippet();
}
